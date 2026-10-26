import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import {
  explodingKittensGame,
  type EKAction,
  type EKState,
} from '../src/index.js';

describe('Exploding Kittens Bot Simulation & AI Logic', () => {
  it('Mô phỏng 200 ván chơi trọn vẹn giữa các Bot (Normal & Hard)', () => {
    const seedBase = 'ek-bot-simulation-seed-';

    for (let i = 0; i < 200; i++) {
      const rng = createRng(`${seedBase}${i}`);
      // Luân phiên số lượng người chơi 2, 3, 4, 5 người
      const numPlayers = (i % 4) + 2;
      const playerIds = Array.from({ length: numPlayers }, (_, idx) => `bot_${idx + 1}`);
      const botSet = new Set(playerIds);

      // Setup
      let state: EKState = explodingKittensGame.setup(playerIds, {}, rng);
      expect(state.winner).toBeNull();

      let actionsCount = 0;
      const MAX_ACTIONS = 600; // Đủ dài cho 1 ván đấu bài

      while (state.winner === null && state.phase !== 'GAME_OVER' && actionsCount < MAX_ACTIONS) {
        actionsCount++;

        // 1. Kiểm tra scheduledAction nếu có (ví dụ timeout Nope window)
        const scheduled = explodingKittensGame.scheduledAction?.(state);
        if (scheduled) {
          const err = explodingKittensGame.validate(state, scheduled.playerId, scheduled.action);
          if (err === null) {
            state = explodingKittensGame.apply(state, scheduled.playerId, scheduled.action, rng);
            continue;
          }
        }

        // 2. Tìm người chơi (bot) cần hành động
        const actionablePid = explodingKittensGame.getActionablePlayerId?.(state, botSet);
        if (!actionablePid) {
          // Nếu không tìm thấy actionable player nhưng phase là NOPE_WINDOW -> resolve
          if (state.phase === 'NOPE_WINDOW') {
            state = explodingKittensGame.apply(state, '__system__', { type: 'RESOLVE_NOPE_WINDOW' }, rng);
            continue;
          }
          break;
        }

        const view = explodingKittensGame.playerView(state, actionablePid);

        // Nửa số bot dùng Hard AI, nửa còn lại dùng Normal AI
        const botIndex = Number.parseInt(actionablePid.replace('bot_', ''), 10) - 1;
        const botDef =
          botIndex % 2 === 0
            ? explodingKittensGame.bots?.find((b) => b.level === 'hard')
            : explodingKittensGame.bots?.find((b) => b.level === 'normal');

        let action: EKAction | null =
          (botDef?.chooseAction(view, actionablePid, rng) as EKAction | null) ?? null;

        // Nếu bot không chọn được hoặc không hợp lệ -> dùng Fallback
        if (action) {
          const valErr = explodingKittensGame.validate(state, actionablePid, action);
          if (valErr !== null) {
            action = explodingKittensGame.getBotFallbackAction?.(state, actionablePid) ?? null;
          }
        } else {
          action = explodingKittensGame.getBotFallbackAction?.(state, actionablePid) ?? null;
        }

        if (!action) {
          break;
        }

        const err = explodingKittensGame.validate(state, actionablePid, action);
        expect(err).toBeNull();

        state = explodingKittensGame.apply(state, actionablePid, action, rng);
      }

      // Xác nhận ván đấu đã tìm ra người chiến thắng
      expect(state.winner).not.toBeNull();
      expect(state.phase).toBe('GAME_OVER');
      expect(playerIds.includes(state.winner!)).toBe(true);

      // Đảm bảo chỉ có duy nhất 1 người còn sống
      const alivePlayers = state.playerOrder.filter((pid) => state.players[pid]?.alive);
      expect(alivePlayers.length).toBe(1);
      expect(alivePlayers[0]).toBe(state.winner);
    }
  });
});
