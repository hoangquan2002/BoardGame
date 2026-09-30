import { describe, expect, it } from 'vitest';
import { createTestClient, createTestServer } from './test-helpers.js';

describe('Server Bots Integration (Task T6a)', () => {
  it('1. Thêm và xoá máy trong phòng chờ: đúng quyền host, kiểm tra lỗi khi sai quyền hoặc sai trạng thái', async () => {
    const { url, close } = await createTestServer();
    const c1 = await createTestClient(url);
    const c2 = await createTestClient(url);

    try {
      // 1. c1 tạo phòng (c1 là host)
      const createRes = await c1.createRoom('Chủ phòng', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const roomCode = createRes.roomCode;

      // 2. c2 vào phòng (không phải host)
      const joinRes = await c2.joinRoom(roomCode, 'Khách');
      expect(joinRes.ok).toBe(true);

      // 3. c2 cố tình thêm máy -> bị từ chối
      const nonHostAdd = await c2.addBot('normal');
      expect(nonHostAdd.ok).toBe(false);
      if (!nonHostAdd.ok) {
        expect(nonHostAdd.error).toContain('Chỉ chủ phòng');
      }

      // 4. c1 thêm máy với độ khó sai -> bị từ chối
      const invalidLevelAdd = await c1.addBot('super-ai-invalid');
      expect(invalidLevelAdd.ok).toBe(false);
      if (!invalidLevelAdd.ok) {
        expect(invalidLevelAdd.error).toContain('không hợp lệ');
      }

      // c1 thêm máy mức 'random' -> bị từ chối (mức random chỉ dùng cho test nội bộ, không public qua game.bots)
      const randomLevelAdd = await c1.addBot('random');
      expect(randomLevelAdd.ok).toBe(false);
      if (!randomLevelAdd.ok) {
        expect(randomLevelAdd.error).toContain('không hợp lệ');
      }

      // 5. c1 thêm máy Thường thành công
      const bot1Add = await c1.addBot('normal');
      expect(bot1Add.ok).toBe(true);
      if (!bot1Add.ok) return;
      const bot1Id = bot1Add.playerId;

      // Kiểm tra room:state broadcast
      const stateAfterBot1 = await c1.waitForState((s) => s.players.length === 3);
      const bot1Info = stateAfterBot1.players.find((p) => p.playerId === bot1Id);
      expect(bot1Info).toBeDefined();
      expect(bot1Info?.isBot).toBe(true);
      expect(bot1Info?.botLevel).toBe('normal');
      expect(bot1Info?.name).toBe('Máy 1 (Thường)');

      // 6. c2 cố tình xoá máy -> bị từ chối
      const nonHostRemove = await c2.removeBot(bot1Id);
      expect(nonHostRemove.ok).toBe(false);

      // 7. c1 xoá máy -> thành công
      const hostRemove = await c1.removeBot(bot1Id);
      expect(hostRemove.ok).toBe(true);

      const stateAfterRemove = await c1.waitForState((s) => s.players.length === 2);
      expect(stateAfterRemove.players.some((p) => p.playerId === bot1Id)).toBe(false);
    } finally {
      c1.disconnect();
      c2.disconnect();
      await close();
    }
  });

  it('2. Chơi game 1 người thật + 2 máy: máy tự động hành động và hoàn thành ván chơi', async () => {
    // Dùng botDelayMs cực nhỏ (15ms) để integration test chạy nhanh
    const { url, close } = await createTestServer({
      defaultRngSeed: 'bot-server-match-1',
      botDelayMs: 15,
    });

    const c1 = await createTestClient(url);

    try {
      const createRes = await c1.createRoom('An', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      // Thêm 2 máy Thường
      const addBot1 = await c1.addBot('normal');
      expect(addBot1.ok).toBe(true);
      const addBot2 = await c1.addBot('normal');
      expect(addBot2.ok).toBe(true);

      const roomState = await c1.waitForState((s) => s.players.length === 3);
      expect(roomState.players.filter((p) => p.isBot).length).toBe(2);

      // Chủ phòng bắt đầu ván (1 người + 2 máy = 3 người >= minPlayers)
      const startRes = await c1.startRoom();
      expect(startRes.ok).toBe(true);

      // Chờ trạng thái chơi
      await c1.waitForState((s) => s.status === 'playing');

      // Tự động tương tác nếu đến lượt người thật An, máy sẽ tự đánh khi đến lượt máy
      let gameOver = false;
      const startTime = Date.now();

      while (!gameOver && Date.now() - startTime < 15000) {
        const currentState = c1.lastState;
        if (currentState?.status === 'finished') {
          gameOver = true;
          break;
        }

        const currentView = c1.lastViewPayload?.view as {
          activePlayerId?: string;
          winner?: string | null;
          pendingChoice?: { playerId?: string; type?: string; victimId?: string } | null;
          players?: { id: string; hand?: { instanceId: string }[] }[];
        } | undefined;

        if (currentView?.winner) {
          gameOver = true;
          break;
        }

        if (currentView) {
          const activeId = currentView.activePlayerId;
          const choice = currentView.pendingChoice;

          // Nếu người thật An cần giải quyết pendingChoice
          if (choice && choice.playerId === c1.playerId) {
            if (choice.type === 'ANXIETY_STEAL') {
              const victim = currentView.players?.find((p) => p.id === choice.victimId);
              // @ts-expect-error test helper
              const revealed = victim?.revealedHand;
              if (revealed && revealed.length > 0) {
                await c1.sendAction({
                  type: 'RESOLVE_CHOICE',
                  cardId: revealed[0].instanceId,
                });
              }
            } else if (choice.type === 'TREMORS_DISCARD') {
              const me = currentView.players?.find((p) => p.id === c1.playerId);
              if (me?.hand && me.hand.length >= 3) {
                await c1.sendAction({
                  type: 'RESOLVE_CHOICE',
                  cardIds: me.hand.slice(0, 3).map((c) => c.instanceId),
                });
              }
            }
          } else if (activeId === c1.playerId) {
            // Đến lượt người thật An: kết thúc lượt
            const me = currentView.players?.find((p) => p.id === c1.playerId);
            if (me?.hand && me.hand.length > 6) {
              const excess = me.hand.length - 6;
              await c1.sendAction({
                type: 'DISCARD',
                cardIds: me.hand.slice(0, excess).map((c) => c.instanceId),
              });
            }
            await c1.sendAction({ type: 'END_TURN' });
          }
        }

        // Đợi 40ms trước khi kiểm tra lại
        await new Promise((r) => setTimeout(r, 40));
      }

      // Đảm bảo ván chơi đã kết thúc và có người chiến thắng
      const finalState = await c1.waitForState((s) => s.status === 'finished', 5000);
      expect(finalState.status).toBe('finished');
    } finally {
      c1.disconnect();
      await close();
    }
  }, 25000);

  it('3. Phòng chỉ còn máy hoặc người rời không hoạt động vô tận (bị dọn sau 2 giờ)', async () => {
    const { url, close, server } = await createTestServer();
    const c1 = await createTestClient(url);

    try {
      const createRes = await c1.createRoom('Host', 'side-effects');
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;

      const roomCode = createRes.roomCode;
      await c1.addBot('normal');
      await c1.addBot('normal');

      const room = server.roomManager.getRoom(roomCode);
      expect(room).toBeDefined();

      // Giả lập thời gian trôi qua 2 giờ 1 phút
      room!.lastActivityAt = Date.now() - (2 * 60 * 60 * 1000 + 60000);

      const cleaned = server.roomManager.cleanupInactiveRooms();
      expect(cleaned).toContain(roomCode);
      expect(server.roomManager.getRoom(roomCode)).toBeUndefined();
    } finally {
      c1.disconnect();
      await close();
    }
  });

  it('4. Tên máy không bị trùng khi thêm/xoá: luôn dùng số nhỏ nhất chưa có', async () => {
    const { url, close } = await createTestServer();
    const c1 = await createTestClient(url);

    try {
      const createRes = await c1.createRoom('Host', 'side-effects');
      expect(createRes.ok).toBe(true);

      // Thêm Máy 1 và Máy 2
      const bot1Res = await c1.addBot('normal');
      expect(bot1Res.ok).toBe(true);
      const bot2Res = await c1.addBot('normal');
      expect(bot2Res.ok).toBe(true);

      let state = await c1.waitForState((s) => s.players.length === 3);
      expect(state.players[1]?.name).toBe('Máy 1 (Thường)');
      expect(state.players[2]?.name).toBe('Máy 2 (Thường)');

      // Xoá Máy 1 -> trong phòng chỉ còn [Host, Máy 2]
      if (bot1Res.ok) {
        const removeRes = await c1.removeBot(bot1Res.playerId);
        expect(removeRes.ok).toBe(true);
      }
      state = await c1.waitForState((s) => s.players.length === 2);
      expect(state.players.some((p) => p.name.includes('Máy 1'))).toBe(false);

      // Thêm máy mới -> phải dùng số nhỏ nhất chưa có là "Máy 1" (không được trùng Máy 2)
      const bot3Res = await c1.addBot('normal');
      expect(bot3Res.ok).toBe(true);

      state = await c1.waitForState((s) => s.players.length === 3);
      const newBot = state.players.find((p) => bot3Res.ok && p.playerId === bot3Res.playerId);
      expect(newBot?.name).toBe('Máy 1 (Thường)');

      // Thêm tiếp một máy nữa -> phải thành "Máy 3"
      const bot4Res = await c1.addBot('normal');
      expect(bot4Res.ok).toBe(true);
      state = await c1.waitForState((s) => s.players.length === 4);
      const fourthBot = state.players.find((p) => bot4Res.ok && p.playerId === bot4Res.playerId);
      expect(fourthBot?.name).toBe('Máy 3 (Thường)');
    } finally {
      c1.disconnect();
      await close();
    }
  });
});
