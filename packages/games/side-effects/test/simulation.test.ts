import { createRng } from '@boardgame/core';
import { describe, expect, it } from 'vitest';
import { sideEffectsGame } from '../src/game.js';
import { setupSideEffects } from '../src/setup.js';
import { checkStateInvariants, generateValidAction } from './action-generator.js';

describe('Side Effects 1000 Games Simulation (Task T2)', () => {
  it(
    'giả lập 1000 ván: không crash, giữ toàn vẹn 89 lá và cấu trúc Thể Trạng sau mỗi action',
    () => {
      const rng = createRng('side-effects-simulation-1000-seed');
      const TOTAL_GAMES = 1000;
      const MAX_STEPS_PER_GAME = 200;

      let gamesWon = 0;
      let totalSteps = 0;

      for (let g = 0; g < TOTAL_GAMES; g++) {
        // Xoay vòng số người chơi từ 2 đến 8
        const playerCount = 2 + (g % 7);
        const playerIds = Array.from({ length: playerCount }, (_, i) => `P${i + 1}`);

        let state = setupSideEffects(playerIds, {}, rng);
        checkStateInvariants(state);

        let steps = 0;
        while (steps < MAX_STEPS_PER_GAME) {
          if (state.winner !== null) {
            break;
          }

          const gen = generateValidAction(state, rng);
          if (!gen) {
            break;
          }

          // Validate trước khi apply
          const error = sideEffectsGame.validate(state, gen.playerId, gen.action);
          if (error !== null) {
            throw new Error(
              `Game #${g + 1} Step #${steps}: Valid action generation produced invalid action: ${error} (Action: ${JSON.stringify(gen)})`,
            );
          }

          state = sideEffectsGame.apply(state, gen.playerId, gen.action, rng);
          steps++;

          // Kiểm tra bất biến sau MỖI action
          checkStateInvariants(state);
        }

        totalSteps += steps;
        if (state.winner !== null) {
          gamesWon++;
        }
      }

      const avgSteps = (totalSteps / TOTAL_GAMES).toFixed(1);

      console.log('\n========================================');
      console.log('       KẾT QUẢ GIẢ LẬP 1000 VÁN CHƠI');
      console.log('========================================');
      console.log(`- Tổng số ván giả lập:          ${TOTAL_GAMES}`);
      console.log(`- Số ván có người thắng:        ${gamesWon} (${((gamesWon / TOTAL_GAMES) * 100).toFixed(1)}%)`);
      console.log(`- Số ván chạm giới hạn lượt:    ${TOTAL_GAMES - gamesWon}`);
      console.log(`- Số lượt trung bình mỗi ván:   ${avgSteps}`);
      console.log('- Bất biến 89 lá không mất/nhân: 100% ĐẠT');
      console.log('- Không trùng ID lá bài:        100% ĐẠT');
      console.log('- Thể Trạng không trùng bệnh:   100% ĐẠT');
      console.log('========================================\n');

      expect(TOTAL_GAMES).toBe(1000);
      expect(gamesWon).toBeGreaterThan(0);
    },
    120000,
  );
});
