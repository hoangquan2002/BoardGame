import { io, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ClientToServerEvents, ServerToClientEvents } from '@boardgame/core';
import {
  canEndTurn,
  getValidTargets,
  type SEAction,
  type SEPlayerView,
} from '@boardgame/game-side-effects';
import { createAppServer, type AppServer } from '../../server/src/server.js';

type TestSocket = Socket<ServerToClientEvents<SEPlayerView>, ClientToServerEvents<SEAction>>;

function connectClient(url: string): Promise<TestSocket> {
  return new Promise((resolve, reject) => {
    const socket: TestSocket = io(url, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      reconnection: false,
    });
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

function emitCreate(
  socket: TestSocket,
  payload: { name: string; gameId: string },
): Promise<{ ok: boolean; roomCode?: string; playerId?: string; token?: string; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('room:create', payload, resolve);
  });
}

function emitJoin(
  socket: TestSocket,
  payload: { name: string; roomCode: string },
): Promise<{ ok: boolean; roomCode?: string; playerId?: string; token?: string; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('room:join', payload, resolve);
  });
}

function emitStart(socket: TestSocket): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('room:start', {}, resolve);
  });
}

function emitResume(
  socket: TestSocket,
  payload: { roomCode: string; token: string },
): Promise<{ ok: boolean; playerId?: string; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('room:resume', payload, resolve);
  });
}

function emitAction(socket: TestSocket, action: SEAction): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    socket.emit('game:action', { action }, resolve);
  });
}

describe('T4 E2E Mobile Client Verification', () => {
  let appServer: AppServer;
  let serverUrl: string;
  let c1: TestSocket;
  let c2: TestSocket;
  let c3: TestSocket;

  beforeAll(async () => {
    appServer = createAppServer({ defaultRngSeed: 'e2e-seed-auto' });
    const port = await appServer.listen(0);
    serverUrl = `http://localhost:${port}`;
    c1 = await connectClient(serverUrl);
    c2 = await connectClient(serverUrl);
    c3 = await connectClient(serverUrl);
  });

  afterAll(async () => {
    c1?.disconnect();
    c2?.disconnect();
    c3?.disconnect();
    await appServer?.close();
  });

  it('thực hiện toàn bộ luồng tạo phòng, vào phòng 3 người, chơi đầy đủ hành động, đổi bài, tải lại phòng', async () => {
    // 1. Tạo phòng (An)
    const createRes = await emitCreate(c1, { name: 'An', gameId: 'side-effects' });
    expect(createRes.ok).toBe(true);
    const roomCode = createRes.roomCode!;
    const p1 = createRes.playerId!;

    // 2. Vào phòng (Bình)
    const join2Res = await emitJoin(c2, { name: 'Bình', roomCode });
    expect(join2Res.ok).toBe(true);
    const p2 = join2Res.playerId!;
    const t2 = join2Res.token!;

    // 3. Vào phòng (Cường)
    const join3Res = await emitJoin(c3, { name: 'Cường', roomCode });
    expect(join3Res.ok).toBe(true);
    const p3 = join3Res.playerId!;

    // Gắn listener game:view trước khi bắt đầu
    const views: Record<string, SEPlayerView> = {};

    c1.on('game:view', (p) => {
      views[p1] = p.view;
    });
    c2.on('game:view', (p) => {
      views[p2] = p.view;
    });
    c3.on('game:view', (p) => {
      views[p3] = p.view;
    });

    // 4. Bắt đầu trò chơi (Host An)
    const startRes = await emitStart(c1);
    expect(startRes.ok).toBe(true);

    await new Promise((r) => setTimeout(r, 200));

    expect(views[p1]).toBeDefined();
    expect(views[p2]).toBeDefined();
    expect(views[p3]).toBeDefined();

    // 5. Kiểm tra tính toán mục tiêu hợp lệ bằng getValidTargets
    const activePlayerId = views[p1]!.activePlayerId;
    const activeView = views[activePlayerId]!;
    const activePlayer = activeView.players.find((p) => p.id === activePlayerId)!;

    for (const card of activePlayer.hand!) {
      const targets = getValidTargets(activeView, activePlayerId, card.instanceId);
      expect(Array.isArray(targets)).toBe(true);
    }

    // 6. Kiểm tra tính năng Thương Lượng (Đổi bài ngoài lượt)
    // p1 đề xuất đổi bài với p2
    const p1Hand = views[p1]!.players.find((p) => p.id === p1)!.hand!;
    const offerCard = p1Hand[0]!;

    const proposeRes = await emitAction(c1, {
      type: 'PROPOSE_TRADE',
      targetPlayerId: p2,
      offerCardIds: [offerCard.instanceId],
    });
    expect(proposeRes.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 100));

    // p2 nhận được trade
    const p2Trade = views[p2]!.trades[0]!;
    expect(p2Trade).toBeDefined();
    expect(p2Trade.proposerId).toBe(p1);

    // p2 đáp lại: không đưa lá nào (cho không hoặc từ chối)
    const respondRes = await emitAction(c2, {
      type: 'RESPOND_TRADE',
      tradeId: p2Trade.tradeId,
      accept: true,
      giveCardIds: [],
    });
    expect(respondRes.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 100));

    // p1 xác nhận hoàn tất giao dịch
    const confirmRes = await emitAction(c1, {
      type: 'CONFIRM_TRADE',
      tradeId: p2Trade.tradeId,
      accept: true,
    });
    expect(confirmRes.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 100));

    // 7. Kiểm tra reload / resume phòng chơi giữa ván (Client 2 ngắt kết nối và resume lại)
    c2.disconnect();
    await new Promise((r) => setTimeout(r, 100));

    let restoredView: SEPlayerView | null = null;
    const c2Reconnected = await connectClient(serverUrl);
    c2Reconnected.on('game:view', (p) => {
      views[p2] = p.view;
      restoredView = p.view;
    });
    const resumeRes = await emitResume(c2Reconnected, { roomCode, token: t2 });
    expect(resumeRes.ok).toBe(true);
    expect(resumeRes.playerId).toBe(p2);

    await new Promise((r) => setTimeout(r, 200));
    expect(restoredView).not.toBeNull();
    expect(restoredView!.activePlayerId).toBeDefined();

    // 8. Chơi các hành động qua các lượt
    let playedAtLeastOneCard = false;
    for (let round = 0; round < 10; round++) {
      const curActiveId = views[p1]!.activePlayerId;
      if (views[p1]!.winner !== null) break;

      const curSocket = curActiveId === p1 ? c1 : curActiveId === p2 ? c2Reconnected : c3;
      const curView = views[curActiveId]!;
      const curPlayer = curView.players.find((p) => p.id === curActiveId);
      if (!curPlayer?.hand) break;

      // Xử lý pendingChoice nếu có
      if (curView.pendingChoice) {
        if (curView.pendingChoice.type === 'ANXIETY_STEAL') {
          const victim = curView.players.find((p) => p.id === curView.pendingChoice!.victimId);
          const stealCardId = victim?.revealedHand?.[0]?.instanceId;
          const choiceSocket =
            curView.pendingChoice.playerId === p1
              ? c1
              : curView.pendingChoice.playerId === p2
                ? c2Reconnected
                : c3;
          await emitAction(choiceSocket, { type: 'RESOLVE_CHOICE', cardId: stealCardId });
        } else if (curView.pendingChoice.type === 'TREMORS_DISCARD') {
          const choiceSocket =
            curView.pendingChoice.playerId === p1
              ? c1
              : curView.pendingChoice.playerId === p2
                ? c2Reconnected
                : c3;
          const victim = curView.players.find((p) => p.id === curView.pendingChoice!.playerId)!;
          const cardIds = victim.hand!.slice(0, 3).map((c) => c.instanceId);
          await emitAction(choiceSocket, { type: 'RESOLVE_CHOICE', cardIds });
        }
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }

      // Đánh lá bài hợp lệ
      for (const card of curPlayer.hand) {
        const targets = getValidTargets(curView, curActiveId, card.instanceId);
        if (targets.length > 0) {
          const target = targets[0]!;
          const actRes = await emitAction(curSocket, target.action);
          if (actRes.ok) {
            playedAtLeastOneCard = true;
            await new Promise((r) => setTimeout(r, 50));
            break;
          }
        }
      }

      // Kiểm tra bỏ bài nếu bài > 6
      const latestView = views[curActiveId]!;
      const latestPlayer = latestView.players.find((p) => p.id === curActiveId);
      if (latestPlayer?.hand && latestPlayer.hand.length > 6) {
        const needed = latestPlayer.hand.length - 6;
        const discardIds = latestPlayer.hand.slice(0, needed).map((c) => c.instanceId);
        await emitAction(curSocket, { type: 'DISCARD', cardIds: discardIds });
        await new Promise((r) => setTimeout(r, 50));
      }

      // Kết thúc lượt
      if (canEndTurn(views[curActiveId]!, curActiveId)) {
        await emitAction(curSocket, { type: 'END_TURN' });
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    expect(playedAtLeastOneCard).toBe(true);

    c2Reconnected.disconnect();
  });
});
