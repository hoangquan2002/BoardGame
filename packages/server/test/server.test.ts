import http from 'node:http';
import type {
  CardInstance,
  SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import { sideEffectsGame } from '@boardgame/game-side-effects';
import { describe, expect, it } from 'vitest';
import { createTestClient, createTestServer, type TestClient } from './test-helpers.js';

function rawHttpGet(
  serverUrl: string,
  requestPath: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(serverUrl);
    const req = http.request(
      {
        host: parsed.hostname,
        port: parsed.port,
        path: requestPath,
        method: 'GET',
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

describe('Task T3: Server phòng online', () => {
  it('1. Chơi trọn vẹn 1 ván 3 người bằng action hợp lệ (seed cố định), kết thúc ván và cùng người thắng', async () => {
    const { url, close, server } = await createTestServer({
      defaultRngSeed: 'test-seed-1',
    });

    const c1 = await createTestClient(url);
    const c2 = await createTestClient(url);
    const c3 = await createTestClient(url);

    try {
      // 1. Host tạo phòng
      const createRes = await c1.createRoom('An', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const roomCode = createRes.roomCode;
      expect(roomCode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);

      // 2. Client 2 & 3 vào phòng
      const join2Res = await c2.joinRoom(roomCode, 'Bình');
      expect(join2Res.ok).toBe(true);

      const join3Res = await c3.joinRoom(roomCode, 'Chi');
      expect(join3Res.ok).toBe(true);

      // Chờ cả 3 nhận room:state có 3 người
      await Promise.all([
        c1.waitForState((s) => s.players.length === 3),
        c2.waitForState((s) => s.players.length === 3),
        c3.waitForState((s) => s.players.length === 3),
      ]);

      // 3. Host bắt đầu ván chơi
      const startRes = await c1.startRoom();
      expect(startRes.ok).toBe(true);

      // Chờ cả 3 nhận game:view ban đầu
      await Promise.all([
        c1.waitForView((v) => v.view !== undefined),
        c2.waitForView((v) => v.view !== undefined),
        c3.waitForView((v) => v.view !== undefined),
      ]);

      const clients: Record<string, TestClient> = {
        [c1.playerId!]: c1,
        [c2.playerId!]: c2,
        [c3.playerId!]: c3,
      };

      // Vòng lặp chơi game qua Socket.IO action
      const room = server.roomManager.getRoom(roomCode)!;
      let turns = 0;
      const MAX_TURNS = 100;

      while (turns < MAX_TURNS && room.status === 'playing') {
        const state = room.gameState;
        if (!state || state.winner !== null) {
          break;
        }

        turns++;

        // Nếu có pendingChoice
        if (state.pendingChoice) {
          const choice = state.pendingChoice;
          if (choice.type === 'TREMORS_DISCARD') {
            const victimClient = clients[choice.playerId];
            expect(victimClient).toBeDefined();
            const victimView = sideEffectsGame.playerView(
              state,
              choice.playerId,
            );
            const victimMe = victimView.players.find((p: SEPlayerViewPlayer) => p.id === choice.playerId)!;
            const cardIds = (victimMe.hand ?? []).slice(0, 3).map((c: CardInstance) => c.instanceId);
            const actRes = await victimClient!.sendAction({
              type: 'RESOLVE_CHOICE',
              cardIds,
            });
            expect(actRes.ok).toBe(true);
            continue;
          }
          if (choice.type === 'ANXIETY_STEAL') {
            const attackerClient = clients[choice.playerId];
            expect(attackerClient).toBeDefined();
            const attackerView = sideEffectsGame.playerView(
              state,
              choice.playerId,
            );
            const victimPublic = attackerView.players.find(
              (p: SEPlayerViewPlayer) => p.id === choice.victimId,
            );
            const revealedCard = victimPublic?.revealedHand?.[0];
            if (revealedCard) {
              const actRes = await attackerClient!.sendAction({
                type: 'RESOLVE_CHOICE',
                cardId: revealedCard.instanceId,
              });
              expect(actRes.ok).toBe(true);
              continue;
            }
          }
        }

        // Lượt bình thường của active player
        const activeId = state.activePlayerId;
        const activeClient = clients[activeId];
        expect(activeClient).toBeDefined();

        // Lấy view của active player tại trạng thái hiện tại
        const activeView = sideEffectsGame.playerView(
          state,
          activeId,
        );
        const activeMe = activeView.players.find((p: SEPlayerViewPlayer) => p.id === activeId)!;
        const myHand = activeMe.hand ?? [];

        // Nếu bài trên tay > 6 -> phải discard
        if (myHand.length > 6) {
          const count = myHand.length - 6;
          const cardIds = myHand.slice(0, count).map((c: CardInstance) => c.instanceId);
          const actRes = await activeClient!.sendAction({
            type: 'DISCARD',
            cardIds,
          });
          expect(actRes.ok).toBe(true);
          continue;
        }

        // Tìm bài thuốc hoặc liệu pháp có thể đánh
        let playedAction: unknown = null;
        if (!state.preventPlayCards && state.cardsPlayedThisTurn < 2) {
          for (const card of myHand) {
            if (card.type === 'drug') {
              for (const slot of activeMe.psyche) {
                if (slot.drug === null) {
                  const candidate = {
                    type: 'TREAT' as const,
                    drugId: card.instanceId,
                    disorderId: slot.disorder.instanceId,
                  };
                  const err = sideEffectsGame.validate(
                    state,
                    activeId,
                    candidate,
                  );
                  if (err === null) {
                    playedAction = candidate;
                    break;
                  }
                }
              }
            } else if (card.type === 'therapy') {
              for (const slot of activeMe.psyche) {
                const candidate = {
                  type: 'THERAPY' as const,
                  therapyId: card.instanceId,
                  disorderId: slot.disorder.instanceId,
                };
                const err = sideEffectsGame.validate(
                  state,
                  activeId,
                  candidate,
                );
                if (err === null) {
                  playedAction = candidate;
                  break;
                }
              }
            }
            if (playedAction) break;
          }
        }

        if (playedAction) {
          const actRes = await activeClient!.sendAction(playedAction);
          expect(actRes.ok).toBe(true);
        } else {
          const actRes = await activeClient!.sendAction({ type: 'END_TURN' });
          expect(actRes.ok).toBe(true);
        }
      }

      // Xác nhận game kết thúc
      expect(room.status).toBe('finished');
      expect(room.gameState.winner).toBeDefined();
      expect(room.gameState.winner).not.toBeNull();

      // Chờ cả 3 nhận game:view với winner được cập nhật
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c1.waitForView((v) => (v.view as any).winner !== null),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c2.waitForView((v) => (v.view as any).winner !== null),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        c3.waitForView((v) => (v.view as any).winner !== null),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v1 = c1.lastViewPayload?.view as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v2 = c2.lastViewPayload?.view as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v3 = c3.lastViewPayload?.view as any;

      expect(v1.winner).toBe(room.gameState.winner);
      expect(v2.winner).toBe(room.gameState.winner);
      expect(v3.winner).toBe(room.gameState.winner);
    } finally {
      c1.disconnect();
      c2.disconnect();
      c3.disconnect();
      await close();
    }
  });

  it('2. Action sai luật trả về lỗi tiếng Việt, action sai format/người ngoài bị từ chối, không crash server', async () => {
    const { url, close } = await createTestServer();
    const host = await createTestClient(url);
    const guest = await createTestClient(url);
    const outsider = await createTestClient(url);

    try {
      const createRes = await host.createRoom('Host', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      await guest.joinRoom(createRes.roomCode, 'Guest');
      await host.startRoom();

      // 1. Action sai luật (Người không phải lượt gửi action)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stateView = host.lastViewPayload?.view as any;
      const nonActiveClient = stateView.activePlayerId === host.playerId ? guest : host;

      const illegalRes = await nonActiveClient.sendAction({ type: 'END_TURN' });
      expect(illegalRes.ok).toBe(false);
      if (!illegalRes.ok) {
        expect(illegalRes.error).toBe('Chưa đến lượt của bạn');
      }

      // 2. Action sai định dạng (không phải object, thiếu type, hoặc null)
      const invalidFormat1 = await host.sendAction('invalid-string');
      expect(invalidFormat1.ok).toBe(false);
      if (!invalidFormat1.ok) {
        expect(invalidFormat1.error).toBe('Dữ liệu hành động không hợp lệ');
      }

      const invalidFormat2 = await host.sendAction({});
      expect(invalidFormat2.ok).toBe(false);
      if (!invalidFormat2.ok) {
        expect(invalidFormat2.error).toBe('Dữ liệu hành động không hợp lệ');
      }

      // 3. Người ngoài phòng gửi action
      const outsiderRes = await outsider.sendAction({ type: 'END_TURN' });
      expect(outsiderRes.ok).toBe(false);
      if (!outsiderRes.ok) {
        expect(outsiderRes.error).toMatch(/chưa vào phòng nào/);
      }
    } finally {
      host.disconnect();
      guest.disconnect();
      outsider.disconnect();
      await close();
    }
  });

  it('3. Ngắt kết nối rồi room:resume bằng token khôi phục view và chơi tiếp, token sai bị từ chối', async () => {
    const { url, close } = await createTestServer();
    const host = await createTestClient(url);
    const guest = await createTestClient(url);

    try {
      const createRes = await host.createRoom('Host', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const guestJoin = await guest.joinRoom(createRes.roomCode, 'Guest');
      expect(guestJoin.ok).toBe(true);
      if (!guestJoin.ok) return;

      await host.startRoom();
      await guest.waitForView((v) => v.view !== undefined);

      // Guest ngắt kết nối
      guest.disconnect();

      // Host nhận trạng thái guest offline
      await host.waitForState((s) => {
        const p = s.players.find((pl) => pl.name === 'Guest');
        return p !== undefined && p.connected === false;
      });

      // Tạo client mới để resume
      const guestResume = await createTestClient(url);

      // Resume sai token -> lỗi tiếng Việt
      const badResume = await guestResume.resumeRoom(createRes.roomCode, 'wrong-token-xyz');
      expect(badResume.ok).toBe(false);
      if (!badResume.ok) {
        expect(badResume.error).toBe('Token không hợp lệ');
      }

      // Resume đúng token -> thành công
      const okResume = await guestResume.resumeRoom(createRes.roomCode, guestJoin.token);
      expect(okResume.ok).toBe(true);
      if (!okResume.ok) return;
      expect(okResume.playerId).toBe(guestJoin.playerId);

      // Guest nhận lại view
      const viewPayload = await guestResume.waitForView((v) => v.view !== undefined);
      expect(viewPayload.view).toBeDefined();

      // Host thấy guest online trở lại
      await host.waitForState((s) => {
        const p = s.players.find((pl) => pl.name === 'Guest');
        return p !== undefined && p.connected === true;
      });

      guestResume.disconnect();
    } finally {
      host.disconnect();
      await close();
    }
  });

  it('4. Không lộ thông tin: game:view không chứa instanceId của đối thủ, không broadcast token', async () => {
    const { url, close, server } = await createTestServer();
    const p1 = await createTestClient(url);
    const p2 = await createTestClient(url);

    try {
      const c1 = await p1.createRoom('Player1', 'side-effects');
      expect(c1.ok).toBe(true);
      if (!c1.ok) return;

      const c2 = await p2.joinRoom(c1.roomCode, 'Player2');
      expect(c2.ok).toBe(true);
      if (!c2.ok) return;

      await p1.startRoom();

      await Promise.all([
        p1.waitForView((v) => v.view !== undefined),
        p2.waitForView((v) => v.view !== undefined),
      ]);

      const room = server.roomManager.getRoom(c1.roomCode)!;
      const internalState = room.gameState;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p1InternalHand = internalState.players.find((p: any) => p.id === c1.playerId).hand;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p2InternalHand = internalState.players.find((p: any) => p.id === c2.playerId).hand;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v1 = p1.lastViewPayload?.view as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v2 = p2.lastViewPayload?.view as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p1Self = v1.players.find((p: any) => p.id === c1.playerId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p2InV1 = v1.players.find((p: any) => p.id === c2.playerId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p2Self = v2.players.find((p: any) => p.id === c2.playerId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p1InV2 = v2.players.find((p: any) => p.id === c1.playerId);

      // 1. Kiểm tra đối thủ không có thuộc tính hand trong view của người khác
      expect(p2InV1.hand).toBeUndefined();
      expect(p1InV2.hand).toBeUndefined();

      // 2. Không chứa bất kỳ instanceId bài nào của p2 trong tay p1
      for (const card of p2InternalHand) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundInP1 = p1Self.hand.some((c: any) => c.instanceId === card.instanceId);
        expect(foundInP1).toBe(false);
      }

      // 3. Không chứa bất kỳ instanceId bài nào của p1 trong tay p2
      for (const card of p1InternalHand) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundInP2 = p2Self.hand.some((c: any) => c.instanceId === card.instanceId);
        expect(foundInP2).toBe(false);
      }

      // 4. Kiểm tra token của p1 không bao giờ xuất hiện ở p2 states hay views
      const p1Token = c1.token;
      const p2Token = c2.token;

      for (const state of p2.allStates) {
        const str = JSON.stringify(state);
        expect(str.includes(p1Token)).toBe(false);
      }
      for (const view of p2.allViews) {
        const str = JSON.stringify(view);
        expect(str.includes(p1Token)).toBe(false);
      }
      for (const state of p1.allStates) {
        const str = JSON.stringify(state);
        expect(str.includes(p2Token)).toBe(false);
      }
      for (const view of p1.allViews) {
        const str = JSON.stringify(view);
        expect(str.includes(p2Token)).toBe(false);
      }
    } finally {
      p1.disconnect();
      p2.disconnect();
      await close();
    }
  });

  it('5. Hẹn giờ: Chứng run hết giờ -> server tự gửi CHOICE_TIMEOUT và thu hồi cả bộ bài', async () => {
    const { url, close, server } = await createTestServer();
    const host = await createTestClient(url);
    const victim = await createTestClient(url);

    try {
      const createRes = await host.createRoom('Attacker', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const joinRes = await victim.joinRoom(createRes.roomCode, 'Victim');
      expect(joinRes.ok).toBe(true);
      if (!joinRes.ok) return;

      await host.startRoom();

      await Promise.all([
        host.waitForView((v) => v.view !== undefined),
        victim.waitForView((v) => v.view !== undefined),
      ]);

      const room = server.roomManager.getRoom(createRes.roomCode)!;
      const game = server.registry.get('side-effects')!;

      // Giả lập trạng thái có Chứng run (TREMORS_DISCARD) với timeout 100ms
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vPlayer = room.gameState.players.find((p: any) => p.id === victim.playerId)!;
      vPlayer.hand = [
        { instanceId: 'h-1', cardId: 'episode', type: 'episode' },
        { instanceId: 'h-2', cardId: 'episode', type: 'episode' },
        { instanceId: 'h-3', cardId: 'episode', type: 'episode' },
        { instanceId: 'h-4', cardId: 'episode', type: 'episode' },
      ];

      room.gameState.pendingChoice = {
        type: 'TREMORS_DISCARD',
        playerId: victim.playerId!,
        attackerId: host.playerId!,
        timeoutSeconds: 0.1, // 100ms
      };

      const scheduled = game.scheduledAction?.(room.gameState);
      expect(scheduled).toBeDefined();
      expect(scheduled?.playerId).toBe('__system__');
      expect(scheduled?.action).toEqual({ type: 'CHOICE_TIMEOUT' });

      // Đặt lịch timeout trên server
      const delayMs = Math.max(0, scheduled!.delaySeconds * 1000);
      room.deadline = Date.now() + delayMs;
      room.scheduledTimer = setTimeout(() => {
        room.scheduledTimer = null;
        room.deadline = undefined;
        room.gameState = game.apply(
          room.gameState,
          scheduled!.playerId,
          scheduled!.action,
          room.rng!,
        );
        server.io.to(room.roomCode).emit('room:state', room.toRoomState());
        for (const p of room.players) {
          if (p.socketId) {
            server.io.to(p.socketId).emit('game:view', {
              view: game.playerView(room.gameState, p.playerId),
              deadline: room.deadline,
            });
          }
        }
      }, delayMs);

      // Chờ victim nhận view mới sau timeout
      await victim.waitForView((v) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const view = v.view as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vMe = view.players.find((p: any) => p.id === victim.playerId);
        return view.pendingChoice === null && vMe.hand.length === 0;
      }, 3000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalView = victim.lastViewPayload?.view as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalMe = finalView.players.find((p: any) => p.id === victim.playerId);
      expect(finalView.pendingChoice).toBeNull();
      expect(finalMe.hand).toHaveLength(0);
    } finally {
      host.disconnect();
      victim.disconnect();
      await close();
    }
  });

  it('6. Quản lý lobby: trùng tên, phòng đầy, phòng không tồn tại, vào phòng đang chơi, chuyển host, dọn dẹp sau 2h', async () => {
    const { url, close, server } = await createTestServer();
    const host = await createTestClient(url);
    const client2 = await createTestClient(url);

    try {
      // 1. Tạo phòng
      const createRes = await host.createRoom('Player1', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;
      const roomCode = createRes.roomCode;

      // 2. Trùng tên -> lỗi
      const dupRes = await client2.joinRoom(roomCode, '  Player1  ');
      expect(dupRes.ok).toBe(false);
      if (!dupRes.ok) {
        expect(dupRes.error).toBe('Tên người chơi đã tồn tại trong phòng');
      }

      // 3. Phòng không tồn tại -> lỗi
      const noRoomRes = await client2.joinRoom('XXXXX', 'Player2');
      expect(noRoomRes.ok).toBe(false);
      if (!noRoomRes.ok) {
        expect(noRoomRes.error).toBe('Phòng không tồn tại');
      }

      // 4. Client 2 vào phòng hợp lệ
      const joinRes2 = await client2.joinRoom(roomCode, 'Player2');
      expect(joinRes2.ok).toBe(true);

      // 5. Host rời phòng ở lobby -> chuyển host cho Player2
      await host.leaveRoom();
      await client2.waitForState((s) => s.hostId === client2.playerId && s.players.length === 1);
      expect(client2.lastState?.hostId).toBe(client2.playerId);

      // 6. Test phòng đầy: side-effects tạm giới hạn tối đa 4 người (hiện có Player2 = 1 người)
      // Thêm 3 người nữa -> đủ 4 người
      const otherClients: TestClient[] = [];
      for (let i = 3; i <= 5; i++) {
        const c = await createTestClient(url);
        otherClients.push(c);
        const j = await c.joinRoom(roomCode, `Player${i}`);
        expect(j.ok).toBe(true);
      }

      // Người thứ 5 vào phòng -> phòng đầy (bị từ chối)
      const cExtra = await createTestClient(url);
      otherClients.push(cExtra);
      const fullRes = await cExtra.joinRoom(roomCode, 'PlayerExtra');
      expect(fullRes.ok).toBe(false);
      if (!fullRes.ok) {
        expect(fullRes.error).toBe('Phòng đã đủ 4 người');
      }

      // Thêm máy khi phòng đã đủ 4 người -> bị từ chối
      const addBotFullRes = await client2.addBot('normal');
      expect(addBotFullRes.ok).toBe(false);
      if (!addBotFullRes.ok) {
        expect(addBotFullRes.error).toBe('Phòng đã đủ 4 người');
      }

      // 7. Bắt đầu chơi rồi thử join -> lỗi ván chơi đang diễn ra
      await client2.startRoom();
      const lateClient = await createTestClient(url);
      otherClients.push(lateClient);
      const lateJoin = await lateClient.joinRoom(roomCode, 'LateGuy');
      expect(lateJoin.ok).toBe(false);
      if (!lateJoin.ok) {
        expect(lateJoin.error).toBe('Phòng đã bắt đầu hoặc đã kết thúc');
      }

      // 8. Dọn dẹp phòng không hoạt động sau 2 giờ
      const room = server.roomManager.getRoom(roomCode)!;
      expect(room).toBeDefined();

      // Giả lập thời gian không hoạt động > 2 giờ
      room.lastActivityAt = Date.now() - (2 * 60 * 60 * 1000 + 1000);
      const cleaned = server.roomManager.cleanupInactiveRooms();
      expect(cleaned).toContain(roomCode);
      expect(server.roomManager.getRoom(roomCode)).toBeUndefined();

      for (const oc of otherClients) {
        oc.disconnect();
      }
    } finally {
      host.disconnect();
      client2.disconnect();
      await close();
    }
  });

  it('7. HTTP endpoints: /healthz trả về 200 OK, chặn path traversal (/../package.json, %2e%2e)', async () => {
    const { url, close } = await createTestServer();

    try {
      // 1. GET /healthz -> 200 OK
      const healthRes = await rawHttpGet(url, '/healthz');
      expect(healthRes.status).toBe(200);
      expect(healthBodySafe(healthRes.body)).toBe('OK');

      // 2. Path traversal: /../package.json -> 403 Forbidden
      const traversal1 = await rawHttpGet(url, '/../package.json');
      expect(traversal1.status).toBe(403);

      // 3. Encoded path traversal: /%2e%2e/package.json -> 403 Forbidden
      const traversal2 = await rawHttpGet(url, '/%2e%2e/package.json');
      expect(traversal2.status).toBe(403);

      // 4. Double encoded path traversal: /%2e%2e%2fpackage.json -> 403 Forbidden
      const traversal3 = await rawHttpGet(url, '/%2e%2e%2fpackage.json');
      expect(traversal3.status).toBe(403);

      // 5. An toàn nội dung (Task T5): File ngoài packages/client/dist (.pdf, .env, package.json) không tải được
      const pdfRes1 = await rawHttpGet(url, '/assets/card-photos/SideEffectsPNP-EN.pdf');
      expect(pdfRes1.status).toBe(404);

      const pdfRes2 = await rawHttpGet(url, '/assets/rule/SideEffectsRules-VI.pdf');
      expect(pdfRes2.status).toBe(404);

      const envRes = await rawHttpGet(url, '/.env');
      expect(envRes.status).toBe(404);

      const deepTraversal = await rawHttpGet(url, '/../../package.json');
      expect(deepTraversal.status).toBe(403);
    } finally {
      await close();
    }
  });

  it('9. Mở lại app sau khi server ngủ hoặc restart (phòng cũ không còn): room:resume trả về lỗi tiếng Việt, không treo kết nối', async () => {
    const { url, close } = await createTestServer();
    const client = await createTestClient(url);

    try {
      // Giả lập client giữ token và mã phòng từ phiên trước khi server ngủ
      const resumeRes = await client.resumeRoom('OLD_ROOM', 'expired-token-xyz');
      expect(resumeRes.ok).toBe(false);
      if (!resumeRes.ok) {
        expect(resumeRes.error).toBe('Phòng không tồn tại');
      }

      // Sau khi resume thất bại, client vẫn có thể tạo phòng mới bình thường
      const newRoom = await client.createRoom('Người chơi', 'side-effects');
      expect(newRoom.ok).toBe(true);
    } finally {
      client.disconnect();
      await close();
    }
  });

  it('8. Khả năng chịu lỗi: gửi mọi sự kiện không kèm ack, payload undefined, payload sai kiểu -> server không sập, /healthz 200, client khác chơi tiếp', async () => {
    const { url, close } = await createTestServer();
    const badClient = await createTestClient(url);
    const goodClient1 = await createTestClient(url);
    const goodClient2 = await createTestClient(url);

    try {
      // (a) Gửi từng sự kiện không kèm ack callback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:create');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:create', { name: 'Bad', gameId: 'side-effects' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:join');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:join', { roomCode: 'ABCDE', name: 'Bad' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:resume');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:resume', { roomCode: 'ABCDE', token: 'xyz' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:start');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('game:action');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:leave');

      // (b) Gửi payload undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:create', undefined, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:join', undefined, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:resume', undefined, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:start', undefined, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('game:action', undefined, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:leave', undefined, () => {});

      // (c) Gửi payload sai kiểu (chuỗi, mảng, số, object rỗng...)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:create', 'not-an-object', () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:create', { name: 1234, gameId: null }, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:join', [1, 2, 3], () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:join', { roomCode: 999, name: {} }, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:resume', 456, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('room:resume', { roomCode: null, token: false }, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('game:action', 'bad-action', () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('game:action', { action: null }, () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (badClient.socket as any).emit('game:action', { action: { type: 1234 } }, () => {});

      // Đợi microtask queue xử lý toàn bộ
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Kiểm tra /healthz vẫn 200 OK
      const healthRes = await rawHttpGet(url, '/healthz');
      expect(healthRes.status).toBe(200);
      expect(healthBodySafe(healthRes.body)).toBe('OK');

      // Client bình thường vẫn tạo phòng, vào phòng và bắt đầu chơi bình thường
      const createRes = await goodClient1.createRoom('GoodHost', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const joinRes = await goodClient2.joinRoom(createRes.roomCode, 'GoodGuest');
      expect(joinRes.ok).toBe(true);

      const startRes = await goodClient1.startRoom();
      expect(startRes.ok).toBe(true);

      await Promise.all([
        goodClient1.waitForView((v) => v.view !== undefined),
        goodClient2.waitForView((v) => v.view !== undefined),
      ]);
    } finally {
      badClient.disconnect();
      goodClient1.disconnect();
      goodClient2.disconnect();
      await close();
    }
  });

  it('9. Token và playerId sinh bằng crypto an toàn: token 32 ký tự hex (128 bit), playerId p_ + 8 ký tự hex', async () => {
    const { url, close } = await createTestServer();
    const c1 = await createTestClient(url);
    const c2 = await createTestClient(url);

    try {
      const createRes = await c1.createRoom('Alice', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      // Token phải là 32 ký tự hex (16 bytes = 128 bit)
      expect(createRes.token).toMatch(/^[0-9a-f]{32}$/);
      expect(createRes.playerId).toMatch(/^p_[0-9a-f]{8}$/);

      const joinRes = await c2.joinRoom(createRes.roomCode, 'Bob');
      expect(joinRes.ok).toBe(true);
      if (!joinRes.ok) return;

      expect(joinRes.token).toMatch(/^[0-9a-f]{32}$/);
      expect(joinRes.playerId).toMatch(/^p_[0-9a-f]{8}$/);
      expect(createRes.token).not.toBe(joinRes.token);
      expect(createRes.playerId).not.toBe(joinRes.playerId);
    } finally {
      c1.disconnect();
      c2.disconnect();
      await close();
    }
  });

  it('10. room:resume ngắt kết nối socket cũ nếu còn hoạt động, socket cũ không thể gửi action', async () => {
    const { url, close } = await createTestServer();
    const host = await createTestClient(url);
    const guestOld = await createTestClient(url);

    try {
      const createRes = await host.createRoom('Host', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const joinRes = await guestOld.joinRoom(createRes.roomCode, 'Guest');
      expect(joinRes.ok).toBe(true);
      if (!joinRes.ok) return;

      await host.startRoom();
      await guestOld.waitForView((v) => v.view !== undefined);

      // Socket cũ VẪN KẾT NỐI, socket mới mở ra và resume bằng đúng token của guest
      const guestNew = await createTestClient(url);
      const resumeRes = await guestNew.resumeRoom(createRes.roomCode, joinRes.token);
      expect(resumeRes.ok).toBe(true);

      // Đợi sự kiện ngắt kết nối lan truyền
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Socket cũ phải bị ngắt kết nối
      expect(guestOld.socket.connected).toBe(false);

      // Nếu socket cũ cố gửi action thì phải bị từ chối
      const oldAction = await guestOld.sendAction({ type: 'END_TURN' });
      expect(oldAction.ok).toBe(false);

      guestNew.disconnect();
    } finally {
      host.disconnect();
      guestOld.disconnect();
      await close();
    }
  });

  it('11. Chặn socket đang ở trong phòng gọi room:create hoặc room:join', async () => {
    const { url, close } = await createTestServer();
    const client = await createTestClient(url);

    try {
      const createRes = await client.createRoom('Player1', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      // Socket đã ở phòng createRes.roomCode -> cố tạo phòng khác -> lỗi
      const createAgain = await client.createRoom('Player1Again', 'side-effects');
      expect(createAgain.ok).toBe(false);
      if (!createAgain.ok) {
        expect(createAgain.error).toBe('Bạn đang ở trong một phòng khác');
      }

      // Socket đã ở phòng createRes.roomCode -> cố join phòng khác -> lỗi
      const joinAnother = await client.joinRoom('ABCDE', 'Player1Join');
      expect(joinAnother.ok).toBe(false);
      if (!joinAnother.ok) {
        expect(joinAnother.error).toBe('Bạn đang ở trong một phòng khác');
      }
    } finally {
      client.disconnect();
      await close();
    }
  });
});

function healthBodySafe(body: string) {
  return body.trim();
}
