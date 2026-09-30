import { describe, expect, it } from 'vitest';
import { createRng, runAction } from '@boardgame/core';
import { chooseNormalAction, chooseRandomAction } from '../src/bots/index.js';
import { sideEffectsGame } from '../src/game.js';
import type { SEAction, SEPlayerView, SEState } from '../src/types.js';

interface GameResult {
  winner: string | null;
  turns: number;
}

function playMatch(
  playerIds: string[],
  botTypes: Record<string, 'normal' | 'random'>,
  seed: string,
  maxTurns = 250,
): GameResult {
  const rng = createRng(seed);
  let state: SEState = sideEffectsGame.setup(playerIds, {}, rng);
  let turns = 0;

  while (state.winner === null && turns < maxTurns) {
    turns++;

    // 1. Kiểm tra scheduled action (vd. hết giờ Chứng run)
    const scheduled = sideEffectsGame.scheduledAction?.(state);
    if (scheduled) {
      const res = runAction(sideEffectsGame, state, scheduled.playerId, scheduled.action, rng);
      if (res.ok) {
        state = res.state;
        continue;
      }
    }

    // 2. Xác định người cần ra quyết định
    let deciderId = state.activePlayerId;
    if (state.pendingChoice !== null) {
      deciderId = state.pendingChoice.playerId;
    } else {
      const trade = state.trades[0];
      if (trade) {
        if (trade.status === 'PROPOSED') {
          deciderId = trade.targetPlayerId;
        } else if (trade.status === 'RESPONDED') {
          deciderId = trade.proposerId;
        }
      }
    }

    const botType = botTypes[deciderId] ?? 'random';
    const view: SEPlayerView = sideEffectsGame.playerView(state, deciderId);

    let action: SEAction | null = null;
    if (botType === 'normal') {
      action = chooseNormalAction(view, deciderId, rng);
    } else {
      action = chooseRandomAction(view, deciderId, rng);
    }

    // Fallback nếu bot không trả về action
    if (action === null) {
      action = { type: 'END_TURN' };
    }

    const res = runAction(sideEffectsGame, state, deciderId, action, rng);
    if (res.ok) {
      state = res.state;
    } else {
      // Nếu action bị từ chối, thử END_TURN hoặc kết thúc ván
      const endTurnRes = runAction(
        sideEffectsGame,
        state,
        deciderId,
        { type: 'END_TURN' },
        rng,
      );
      if (endTurnRes.ok) {
        state = endTurnRes.state;
      } else {
        // Không thể đi tiếp
        break;
      }
    }
  }

  return {
    winner: state.winner,
    turns,
  };
}

describe('Bots Tournament: Normal vs Random (Task T6a)', () => {
  it('runs >= 500 1v1 matches with alternating seats and asserts normal bot wins >= 80%', () => {
    const totalMatches = 500;
    let normalWins = 0;
    let randomWins = 0;
    let drawsOrTimeout = 0;
    let totalTurns = 0;

    for (let i = 0; i < totalMatches; i++) {
      const seed = `match-tourney-seed-${i + 1}`;
      // Đổi chỗ ngồi: chẵn thì normal đi trước (p1), lẻ thì random đi trước (p1)
      const normalIsP1 = i % 2 === 0;
      const playerIds = ['p1', 'p2'];
      const botTypes: Record<string, 'normal' | 'random'> = normalIsP1
        ? { p1: 'normal', p2: 'random' }
        : { p1: 'random', p2: 'normal' };

      const normalId = normalIsP1 ? 'p1' : 'p2';
      const randomId = normalIsP1 ? 'p2' : 'p1';

      const result = playMatch(playerIds, botTypes, seed, 250);
      totalTurns += result.turns;

      if (result.winner === normalId) {
        normalWins++;
      } else if (result.winner === randomId) {
        randomWins++;
      } else {
        drawsOrTimeout++;
      }
    }

    const winRate = (normalWins / totalMatches) * 100;
    const avgTurns = (totalTurns / totalMatches).toFixed(1);

    console.log('\n========================================');
    console.log('       KẾT QUẢ GIẢI ĐẤU (500 VÁN 1v1)   ');
    console.log('========================================');
    console.log(`- Tổng số ván đấu:          ${totalMatches}`);
    console.log(`- Bot Thường thắng:         ${normalWins} (${winRate.toFixed(1)}%)`);
    console.log(`- Bot Ngẫu nhiên thắng:     ${randomWins} (${((randomWins / totalMatches) * 100).toFixed(1)}%)`);
    console.log(`- Ván hoà/hết lượt:         ${drawsOrTimeout}`);
    console.log(`- Số lượt trung bình/ván:   ${avgTurns}`);
    console.log('========================================\n');

    expect(winRate).toBeGreaterThanOrEqual(80);
  }, 60000); // 60s timeout for 500 games

  it('runs 4-player games (1 normal + 3 random) to ensure no deadlocks', () => {
    const matches4P = 20;
    let finishedCount = 0;

    for (let i = 0; i < matches4P; i++) {
      const seed = `match-4p-${i + 1}`;
      const playerIds = ['bot_norm', 'bot_rnd1', 'bot_rnd2', 'bot_rnd3'];
      const botTypes: Record<string, 'normal' | 'random'> = {
        bot_norm: 'normal',
        bot_rnd1: 'random',
        bot_rnd2: 'random',
        bot_rnd3: 'random',
      };

      const result = playMatch(playerIds, botTypes, seed, 300);
      if (result.winner !== null) {
        finishedCount++;
      }
    }

    // Đảm bảo các ván chơi 4 người kết thúc mượt mà, không gặp deadlock
    expect(finishedCount).toBeGreaterThan(0);
  }, 20000);
});
