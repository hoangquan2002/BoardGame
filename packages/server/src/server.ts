import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRng, runAction } from '@boardgame/core';
import type {
  ClientToServerEvents,
  GameDefinition,
  ServerToClientEvents,
} from '@boardgame/core';
import { Server as SocketIOServer } from 'socket.io';
import { defaultRegistry, type GameRegistry } from './registry.js';
import { Room, RoomManager, generatePlayerId, generatePlayerToken } from './room.js';

export interface ServerOptions {
  port?: number;
  host?: string;
  corsOrigin?: string;
  clientDistDir?: string;
  registry?: GameRegistry;
  roomManager?: RoomManager;
  defaultRngSeed?: string | number;
  botDelayMs?: number;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
};

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getSafeFilePath(baseDir: string, urlPath: string): string | null {
  try {
    const decoded = decodeURIComponent(urlPath);
    const clean = decoded.split('?')[0]!;
    const resolvedBase = path.resolve(baseDir);
    const target = path.resolve(
      resolvedBase,
      '.' + (clean.startsWith('/') ? clean : '/' + clean),
    );
    const relative = path.relative(resolvedBase, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return null;
    }
    return target;
  } catch {
    return null;
  }
}

export function createAppServer(options: ServerOptions = {}) {
  const registry = options.registry ?? defaultRegistry;
  const roomManager = options.roomManager ?? new RoomManager();
  const clientDistDir =
    options.clientDistDir ??
    process.env.CLIENT_DIST_DIR ??
    path.resolve(__dirname, '../../client/dist');

  const httpServer = http.createServer((req, res) => {
    const url = req.url ?? '/';

    // Health check endpoint
    if (url === '/healthz' || url.startsWith('/healthz?')) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('OK');
      return;
    }

    // Version endpoint (trả về git commit SHA của deploy)
    if (url === '/version' || url.startsWith('/version?')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ commit: process.env.RENDER_GIT_COMMIT ?? 'dev' }));
      return;
    }

    // Robots.txt
    if (url === '/robots.txt' || url.startsWith('/robots.txt?')) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('User-agent: *\nDisallow: /\n');
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    // Static file serving with path traversal protection
    const safePath = getSafeFilePath(clientDistDir, url);
    if (!safePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    // Chặn truy cập file PDF và dotfiles (ví dụ /.env, /.git)
    const cleanUrl = (url.split('?')[0] || '').toLowerCase();
    const segments = cleanUrl.split('/').filter(Boolean);
    if (cleanUrl.endsWith('.pdf') || segments.some((s) => s.startsWith('.'))) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    // Try serving file if it exists
    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(safePath).pipe(res);
      return;
    }

    // SPA fallback to index.html if dist exists (only for routes without file extension or .html)
    const hasNonHtmlExt = Boolean(path.extname(cleanUrl) && !cleanUrl.endsWith('.html'));

    if (!hasNonHtmlExt) {
      const indexPath = path.join(clientDistDir, 'index.html');
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        fs.createReadStream(indexPath).pipe(res);
        return;
      }
    }

    // Not found
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });

  const corsOrigin = options.corsOrigin ?? process.env.CORS_ORIGIN ?? undefined;

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: corsOrigin
      ? {
          origin: corsOrigin,
          methods: ['GET', 'POST'],
        }
      : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function broadcastGameViews(room: Room, game: GameDefinition<any, any, any>) {
    for (const player of room.players) {
      if (player.connected && player.socketId) {
        const view = game.playerView(room.gameState, player.playerId);
        io.to(player.socketId).emit('game:view', {
          view,
          deadline: room.deadline,
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function triggerBotStep(room: Room, game: GameDefinition<any, any, any>) {
    if (room.status !== 'playing' || !room.gameState || !game.bots) {
      room.clearBotTimer();
      return;
    }

    // Xác định bot nào cần hành động
    let targetBotId: string | null = null;

    if (room.gameState.pendingChoice !== null) {
      const choicePlayerId = room.gameState.pendingChoice.playerId;
      const bot = room.players.find((p) => p.playerId === choicePlayerId && p.isBot);
      if (bot) {
        targetBotId = bot.playerId;
      }
    } else {
      const trades = room.gameState.trades;
      if (Array.isArray(trades) && trades.length > 0) {
        const trade = trades[0];
        if (trade) {
          if (trade.status === 'PROPOSED') {
            const bot = room.players.find((p) => p.playerId === trade.targetPlayerId && p.isBot);
            if (bot) targetBotId = bot.playerId;
          } else if (trade.status === 'RESPONDED') {
            const bot = room.players.find((p) => p.playerId === trade.proposerId && p.isBot);
            if (bot) targetBotId = bot.playerId;
          }
        }
      }

      if (!targetBotId) {
        const activeId = room.gameState.activePlayerId;
        const bot = room.players.find((p) => p.playerId === activeId && p.isBot);
        if (bot) {
          targetBotId = bot.playerId;
        }
      }
    }

    if (!targetBotId) {
      room.clearBotTimer();
      return;
    }

    const botPlayer = room.findPlayerById(targetBotId);
    if (!botPlayer || !botPlayer.isBot) {
      room.clearBotTimer();
      return;
    }

    const delay = options.botDelayMs ?? 1000;
    room.clearBotTimer();

    room.botTimer = setTimeout(() => {
      room.botTimer = null;
      if (room.status !== 'playing' || !room.gameState) {
        return;
      }

      try {
        const botDef = game.bots?.find((b) => b.level === botPlayer.botLevel);
        if (!botDef) {
          return;
        }

        const view = game.playerView(room.gameState, botPlayer.playerId);
        const action = botDef.chooseAction(view, botPlayer.playerId, room.rng!);

        let result = action
          ? runAction(game, room.gameState, botPlayer.playerId, action, room.rng!)
          : { ok: false as const, error: 'bot returned null' };

        // Fallback: nếu action bị từ chối hoặc null, thử gửi END_TURN
        if (!result.ok) {
          const fallbackAction = { type: 'END_TURN' };
          const fallbackRes = runAction(
            game,
            room.gameState,
            botPlayer.playerId,
            fallbackAction,
            room.rng!,
          );
          if (fallbackRes.ok) {
            result = fallbackRes;
          }
        }

        if (result.ok) {
          room.gameState = result.state;

          // Chỉ cập nhật hoạt động phòng nếu còn ít nhất 1 người thật kết nối
          const hasConnectedHuman = room.players.some((p) => !p.isBot && p.connected);
          if (hasConnectedHuman) {
            room.touch();
          }

          const winner = game.winner(room.gameState);
          if (winner !== null) {
            room.status = 'finished';
            room.clearScheduledTimer();
            room.clearBotTimer();
            io.to(room.roomCode).emit('room:state', room.toRoomState());
          } else {
            scheduleNextAction(room, game);
            triggerBotStep(room, game);
          }

          broadcastGameViews(room, game);
        }
      } catch (err) {
        console.error('[Bot] Lỗi trong quá trình bot ra quyết định:', err);
      }
    }, delay);
    room.botTimer.unref();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function scheduleNextAction(room: Room, game: GameDefinition<any, any, any>) {
    room.clearScheduledTimer();
    if (!game.scheduledAction) {
      return;
    }
    const scheduled = game.scheduledAction(room.gameState);
    if (!scheduled) {
      return;
    }

    room.deadline = Date.now() + scheduled.delaySeconds * 1000;
    room.scheduledTimer = setTimeout(() => {
      room.scheduledTimer = null;
      room.deadline = undefined;
      if (room.status !== 'playing') {
        return;
      }
      try {
        const result = runAction(
          game,
          room.gameState,
          scheduled.playerId,
          scheduled.action,
          room.rng!,
        );
        if (result.ok) {
          room.gameState = result.state;
          const hasConnectedHuman = room.players.some((p) => !p.isBot && p.connected);
          if (hasConnectedHuman) {
            room.touch();
          }
          const winner = game.winner(room.gameState);
          if (winner !== null) {
            room.status = 'finished';
            room.clearScheduledTimer();
            room.clearBotTimer();
            io.to(room.roomCode).emit('room:state', room.toRoomState());
          } else {
            scheduleNextAction(room, game);
            triggerBotStep(room, game);
          }
          broadcastGameViews(room, game);
        }
      } catch {
        // Do not let unexpected engine error crash server
      }
    }, scheduled.delaySeconds * 1000);
    room.scheduledTimer.unref();
  }

  function safeAck<T>(ack: unknown, res: T): void {
    if (typeof ack === 'function') {
      try {
        ack(res);
      } catch {
        // Ignore errors thrown inside client ack callback
      }
    }
  }

  io.on('connection', (socket) => {
    socket.on('room:create', (payload: unknown, ack: unknown) => {
      try {
        if (socket.data.roomCode) {
          return safeAck(ack, { ok: false, error: 'Bạn đang ở trong một phòng khác' });
        }
        if (!payload || typeof payload !== 'object') {
          return safeAck(ack, { ok: false, error: 'Dữ liệu không hợp lệ' });
        }
        const { name, gameId } = payload as { name?: unknown; gameId?: unknown };
        if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 20) {
          return safeAck(ack, { ok: false, error: 'Tên người chơi phải từ 1 đến 20 ký tự' });
        }
        if (typeof gameId !== 'string' || !registry.has(gameId)) {
          return safeAck(ack, { ok: false, error: 'Trò chơi không hợp lệ hoặc không tồn tại' });
        }

        const hostPlayer = {
          playerId: generatePlayerId(),
          name: name.trim(),
          token: generatePlayerToken(),
          connected: true,
          socketId: socket.id,
        };

        const room = roomManager.createRoom(gameId, hostPlayer);
        socket.data.roomCode = room.roomCode;
        socket.data.playerId = hostPlayer.playerId;
        socket.join(room.roomCode);

        safeAck(ack, {
          ok: true,
          roomCode: room.roomCode,
          playerId: hostPlayer.playerId,
          token: hostPlayer.token,
        });

        io.to(room.roomCode).emit('room:state', room.toRoomState());
      } catch (err) {
        console.error('[Socket] room:create error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi máy chủ khi tạo phòng' });
      }
    });

    socket.on('room:join', (payload: unknown, ack: unknown) => {
      try {
        if (socket.data.roomCode) {
          return safeAck(ack, { ok: false, error: 'Bạn đang ở trong một phòng khác' });
        }
        if (!payload || typeof payload !== 'object') {
          return safeAck(ack, { ok: false, error: 'Dữ liệu không hợp lệ' });
        }
        const { roomCode, name } = payload as { roomCode?: unknown; name?: unknown };
        if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 20) {
          return safeAck(ack, { ok: false, error: 'Tên người chơi phải từ 1 đến 20 ký tự' });
        }
        if (typeof roomCode !== 'string' || !roomCode.trim()) {
          return safeAck(ack, { ok: false, error: 'Mã phòng không hợp lệ' });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return safeAck(ack, { ok: false, error: 'Phòng không tồn tại' });
        }

        if (room.status !== 'lobby') {
          return safeAck(ack, { ok: false, error: 'Phòng đã bắt đầu hoặc đã kết thúc' });
        }

        const game = registry.get(room.gameId);
        if (!game) {
          return safeAck(ack, { ok: false, error: 'Trò chơi không tồn tại' });
        }

        if (room.players.length >= game.maxPlayers) {
          return safeAck(ack, { ok: false, error: `Phòng đã đủ ${game.maxPlayers} người` });
        }

        const trimmedName = name.trim();
        if (
          room.players.some(
            (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
          )
        ) {
          return safeAck(ack, { ok: false, error: 'Tên người chơi đã tồn tại trong phòng' });
        }

        const player = {
          playerId: generatePlayerId(),
          name: trimmedName,
          token: generatePlayerToken(),
          connected: true,
          socketId: socket.id,
        };

        room.players.push(player);
        room.touch();
        socket.data.roomCode = room.roomCode;
        socket.data.playerId = player.playerId;
        socket.join(room.roomCode);

        safeAck(ack, {
          ok: true,
          roomCode: room.roomCode,
          playerId: player.playerId,
          token: player.token,
        });

        io.to(room.roomCode).emit('room:state', room.toRoomState());
      } catch (err) {
        console.error('[Socket] room:join error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi máy chủ khi vào phòng' });
      }
    });

    socket.on('room:resume', (payload: unknown, ack: unknown) => {
      try {
        if (!payload || typeof payload !== 'object') {
          return safeAck(ack, { ok: false, error: 'Dữ liệu khôi phục không hợp lệ' });
        }
        const { roomCode, token } = payload as { roomCode?: unknown; token?: unknown };
        if (typeof roomCode !== 'string' || typeof token !== 'string') {
          return safeAck(ack, { ok: false, error: 'Dữ liệu khôi phục không hợp lệ' });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return safeAck(ack, { ok: false, error: 'Phòng không tồn tại' });
        }

        const player = room.findPlayerByToken(token);
        if (!player) {
          return safeAck(ack, { ok: false, error: 'Token không hợp lệ' });
        }

        // Ngắt kết nối socket cũ nếu còn hoạt động
        if (player.socketId && player.socketId !== socket.id) {
          const oldSocket = io.sockets.sockets.get(player.socketId);
          if (oldSocket) {
            oldSocket.leave(room.roomCode);
            oldSocket.data.roomCode = undefined;
            oldSocket.data.playerId = undefined;
            oldSocket.disconnect(true);
          }
        }

        // Reconnect player with new socket
        player.socketId = socket.id;
        player.connected = true;
        room.touch();
        socket.data.roomCode = room.roomCode;
        socket.data.playerId = player.playerId;
        socket.join(room.roomCode);

        safeAck(ack, { ok: true, playerId: player.playerId });
        io.to(room.roomCode).emit('room:state', room.toRoomState());

        // If in game, send current view to the resumed player
        if (room.status === 'playing' || room.status === 'finished') {
          const game = registry.get(room.gameId);
          if (game && room.gameState) {
            socket.emit('game:view', {
              view: game.playerView(room.gameState, player.playerId),
              deadline: room.deadline,
            });
            if (room.status === 'playing') {
              triggerBotStep(room, game);
            }
          }
        }
      } catch (err) {
        console.error('[Socket] room:resume error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi máy chủ khi khôi phục' });
      }
    });

    socket.on('room:start', (_payload: unknown, ack: unknown) => {
      try {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          return safeAck(ack, { ok: false, error: 'Bạn chưa vào phòng nào' });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return safeAck(ack, { ok: false, error: 'Phòng không tồn tại' });
        }

        if (room.hostId !== socket.data.playerId) {
          return safeAck(ack, { ok: false, error: 'Chỉ chủ phòng mới có quyền bắt đầu ván chơi' });
        }

        if (room.status !== 'lobby') {
          return safeAck(ack, { ok: false, error: 'Ván chơi đã bắt đầu' });
        }

        const game = registry.get(room.gameId);
        if (!game) {
          return safeAck(ack, { ok: false, error: 'Trò chơi không tồn tại' });
        }

        if (room.players.length < game.minPlayers) {
          return safeAck(ack, {
            ok: false,
            error: `Cần tối thiểu ${game.minPlayers} người chơi để bắt đầu`,
          });
        }

        // Initialize RNG with crypto seed or test seed
        const rngSeed =
          options.defaultRngSeed !== undefined
            ? options.defaultRngSeed
            : crypto.randomBytes(16).toString('hex');
        room.rng = createRng(rngSeed);

        const playerNames: Record<string, string> = {};
        for (const p of room.players) {
          playerNames[p.playerId] = p.name;
        }

        room.gameState = game.setup(
          room.players.map((p) => p.playerId),
          { playerNames },
          room.rng,
        );
        room.status = 'playing';
        room.touch();

        scheduleNextAction(room, game);
        triggerBotStep(room, game);

        io.to(room.roomCode).emit('room:state', room.toRoomState());
        broadcastGameViews(room, game);

        safeAck(ack, { ok: true });
      } catch (err) {
        console.error('[Socket] room:start error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi khởi tạo ván chơi' });
      }
    });

    socket.on('room:addBot', (payload: unknown, ack: unknown) => {
      try {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          return safeAck(ack, { ok: false, error: 'Bạn chưa vào phòng nào' });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return safeAck(ack, { ok: false, error: 'Phòng không tồn tại' });
        }

        if (room.hostId !== socket.data.playerId) {
          return safeAck(ack, { ok: false, error: 'Chỉ chủ phòng mới có quyền thêm máy' });
        }

        if (room.status !== 'lobby') {
          return safeAck(ack, { ok: false, error: 'Không thể thêm máy khi ván chơi đã bắt đầu' });
        }

        const game = registry.get(room.gameId);
        if (!game) {
          return safeAck(ack, { ok: false, error: 'Trò chơi không tồn tại' });
        }

        if (room.players.length >= game.maxPlayers) {
          return safeAck(ack, { ok: false, error: `Phòng đã đủ ${game.maxPlayers} người` });
        }

        if (
          !payload ||
          typeof payload !== 'object' ||
          typeof (payload as { level?: unknown }).level !== 'string'
        ) {
          return safeAck(ack, { ok: false, error: 'Dữ liệu độ khó máy không hợp lệ' });
        }

        const level = (payload as { level: string }).level.trim();
        const botDef = game.bots?.find((b) => b.level === level);
        if (!botDef) {
          return safeAck(ack, { ok: false, error: 'Độ khó máy không hợp lệ hoặc trò chơi không hỗ trợ' });
        }

        const existingBotNumbers = new Set(
          room.players
            .filter((p) => p.isBot)
            .map((p) => {
              const match = p.name.match(/^Máy\s+(\d+)/);
              return match ? parseInt(match[1]!, 10) : 0;
            })
            .filter((n) => n > 0),
        );

        let botNumber = 1;
        while (existingBotNumbers.has(botNumber)) {
          botNumber++;
        }

        const botPlayer = {
          playerId: generatePlayerId(),
          name: `Máy ${botNumber} (${botDef.labelVi})`,
          token: generatePlayerToken(),
          connected: true,
          socketId: null,
          isBot: true,
          botLevel: botDef.level,
        };

        room.players.push(botPlayer);
        room.touch();

        io.to(room.roomCode).emit('room:state', room.toRoomState());
        safeAck(ack, { ok: true, playerId: botPlayer.playerId });
      } catch (err) {
        console.error('[Socket] room:addBot error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi máy chủ khi thêm máy' });
      }
    });

    socket.on('room:removeBot', (payload: unknown, ack: unknown) => {
      try {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          return safeAck(ack, { ok: false, error: 'Bạn chưa vào phòng nào' });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return safeAck(ack, { ok: false, error: 'Phòng không tồn tại' });
        }

        if (room.hostId !== socket.data.playerId) {
          return safeAck(ack, { ok: false, error: 'Chỉ chủ phòng mới có quyền xoá máy' });
        }

        if (room.status !== 'lobby') {
          return safeAck(ack, { ok: false, error: 'Không thể xoá máy khi ván chơi đã bắt đầu' });
        }

        if (
          !payload ||
          typeof payload !== 'object' ||
          typeof (payload as { playerId?: unknown }).playerId !== 'string'
        ) {
          return safeAck(ack, { ok: false, error: 'ID máy không hợp lệ' });
        }

        const botId = (payload as { playerId: string }).playerId.trim();
        const botIndex = room.players.findIndex((p) => p.playerId === botId && p.isBot);
        if (botIndex === -1) {
          return safeAck(ack, { ok: false, error: 'Không tìm thấy máy trong phòng' });
        }

        room.players.splice(botIndex, 1);
        room.touch();

        io.to(room.roomCode).emit('room:state', room.toRoomState());
        safeAck(ack, { ok: true });
      } catch (err) {
        console.error('[Socket] room:removeBot error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi máy chủ khi xoá máy' });
      }
    });

    socket.on('game:action', (payload: unknown, ack: unknown) => {
      try {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          return safeAck(ack, { ok: false, error: 'Bạn chưa vào phòng nào' });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return safeAck(ack, { ok: false, error: 'Phòng không tồn tại' });
        }

        if (room.status !== 'playing') {
          return safeAck(ack, { ok: false, error: 'Ván chơi không ở trạng thái đang diễn ra' });
        }

        const playerId = socket.data.playerId;
        const player = room.findPlayerById(playerId);
        if (!player) {
          return safeAck(ack, { ok: false, error: 'Người chơi không thuộc phòng này' });
        }

        // Input validation: action must be object with type string
        if (
          !payload ||
          typeof payload !== 'object' ||
          !('action' in payload) ||
          !(payload as Record<string, unknown>).action ||
          typeof (payload as Record<string, unknown>).action !== 'object' ||
          typeof ((payload as Record<string, unknown>).action as Record<string, unknown>).type !== 'string'
        ) {
          return safeAck(ack, { ok: false, error: 'Dữ liệu hành động không hợp lệ' });
        }

        const game = registry.get(room.gameId);
        if (!game) {
          return safeAck(ack, { ok: false, error: 'Trò chơi không tồn tại' });
        }

        const result = runAction(
          game,
          room.gameState,
          player.playerId,
          (payload as { action: unknown }).action,
          room.rng!,
        );

        if (!result.ok) {
          return safeAck(ack, { ok: false, error: result.error });
        }

        room.gameState = result.state;
        room.touch();
        room.clearScheduledTimer();

        const winner = game.winner(room.gameState);
        if (winner !== null) {
          room.status = 'finished';
          room.clearScheduledTimer();
          room.clearBotTimer();
          io.to(room.roomCode).emit('room:state', room.toRoomState());
        } else {
          scheduleNextAction(room, game);
          triggerBotStep(room, game);
        }

        broadcastGameViews(room, game);
        safeAck(ack, { ok: true });
      } catch (err) {
        console.error('[Socket] game:action error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi engine khi xử lý hành động' });
      }
    });

    socket.on('room:leave', (_payload: unknown, ack: unknown) => {
      try {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          return safeAck(ack, { ok: true });
        }

        const room = roomManager.getRoom(roomCode);
        if (!room) {
          socket.data.roomCode = undefined;
          socket.data.playerId = undefined;
          return safeAck(ack, { ok: true });
        }

        const playerId = socket.data.playerId;
        const player = room.findPlayerById(playerId);
        if (!player) {
          socket.leave(room.roomCode);
          socket.data.roomCode = undefined;
          socket.data.playerId = undefined;
          return safeAck(ack, { ok: true });
        }

        if (room.status === 'lobby') {
          room.players = room.players.filter((p) => p.playerId !== player.playerId);
          const hasHuman = room.players.some((p) => !p.isBot);
          if (room.players.length === 0 || !hasHuman) {
            roomManager.removeRoom(room.roomCode);
          } else if (room.hostId === player.playerId) {
            const nextHuman = room.players.find((p) => !p.isBot);
            room.hostId = nextHuman!.playerId;
          }
        } else {
          player.connected = false;
          player.socketId = null;
        }

        const hasConnectedHuman = room.players.some((p) => !p.isBot && p.connected);
        if (hasConnectedHuman) {
          room.touch();
        } else {
          room.clearBotTimer();
        }

        socket.leave(room.roomCode);
        socket.data.roomCode = undefined;
        socket.data.playerId = undefined;

        io.to(room.roomCode).emit('room:state', room.toRoomState());
        safeAck(ack, { ok: true });
      } catch (err) {
        console.error('[Socket] room:leave error:', err);
        safeAck(ack, { ok: false, error: 'Lỗi máy chủ khi rời phòng' });
      }
    });

    socket.on('disconnect', () => {
      try {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          return;
        }
        const room = roomManager.getRoom(roomCode);
        if (!room) {
          return;
        }
        const player = room.findPlayerById(socket.data.playerId);
        if (player && player.socketId === socket.id) {
          player.connected = false;
          player.socketId = null;
          const hasConnectedHuman = room.players.some((p) => !p.isBot && p.connected);
          if (hasConnectedHuman) {
            room.touch();
          } else {
            room.clearBotTimer();
          }
          io.to(room.roomCode).emit('room:state', room.toRoomState());
        }
      } catch (err) {
        console.error('[Socket] disconnect error:', err);
      }
    });
  });

  return {
    httpServer,
    io,
    roomManager,
    registry,
    listen: (port?: number, host?: string) => {
      const listenPort = port ?? options.port ?? parseInt(process.env.PORT || '3000', 10);
      const listenHost = host ?? options.host ?? process.env.HOST ?? '0.0.0.0';
      return new Promise<number>((resolve) => {
        httpServer.listen(listenPort, listenHost, () => {
          const addr = httpServer.address();
          const actualPort = typeof addr === 'object' && addr ? addr.port : listenPort;
          resolve(actualPort);
        });
      });
    },
    close: () => {
      return new Promise<void>((resolve, reject) => {
        roomManager.destroy();
        io.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
