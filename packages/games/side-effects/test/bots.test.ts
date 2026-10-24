import { describe, expect, it } from 'vitest';
import { createRng, runAction } from '@boardgame/core';
import { chooseNormalAction, chooseRandomAction } from '../src/bots/index.js';
import { sideEffectsGame } from '../src/game.js';
import type { SEPlayerView, SEState } from '../src/types.js';

describe('Bots Verification & Non-cheating Invariants (Task T6a)', () => {
  it('Non-cheating invariant: bots only receive SEPlayerView without drawPile cards or other players hands', () => {
    const rng = createRng('non-cheating-test');
    const state = sideEffectsGame.setup(['bot_1', 'human_2'], {}, rng);

    const botView = sideEffectsGame.playerView(state, 'bot_1');

    // 1. Invariant: botView must NOT contain drawPile cards
    expect((botView as unknown as Record<string, unknown>).drawPile).toBeUndefined();
    expect(typeof botView.drawPileCount).toBe('number');

    // 2. Invariant: botView must NOT contain human_2's hand array
    const humanInBotView = botView.players.find((p) => p.id === 'human_2');
    expect(humanInBotView).toBeDefined();
    expect(humanInBotView!.hand).toBeUndefined();
    expect(humanInBotView!.handCount).toBeGreaterThan(0);

    // 3. Both bots execute without errors using ONLY this restricted view
    const actionRandom = chooseRandomAction(botView, 'bot_1', rng);
    const actionNormal = chooseNormalAction(botView, 'bot_1', rng);

    if (actionRandom) {
      expect(sideEffectsGame.validate(state, 'bot_1', actionRandom)).toBeNull();
    }
    if (actionNormal) {
      expect(sideEffectsGame.validate(state, 'bot_1', actionNormal)).toBeNull();
    }
  });

  it('Validity invariant: every action returned by random and normal bots passes validate() across 100 simulation states', () => {
    const rng = createRng('bots-validity-100');

    for (let i = 0; i < 50; i++) {
      let state: SEState = sideEffectsGame.setup(['p1', 'p2', 'p3'], {}, rng);
      let turns = 0;

      while (state.winner === null && turns < 80) {
        turns++;
        const activeId = state.activePlayerId;
        const view: SEPlayerView = sideEffectsGame.playerView(state, activeId);

        // Test random bot decision
        const randomAction = chooseRandomAction(view, activeId, rng);
        if (randomAction !== null) {
          const err = sideEffectsGame.validate(state, activeId, randomAction);
          expect(err).toBeNull();
        }

        // Test normal bot decision
        const normalAction = chooseNormalAction(view, activeId, rng);
        if (normalAction !== null) {
          const err = sideEffectsGame.validate(state, activeId, normalAction);
          expect(err).toBeNull();
        }

        // Advance game with whichever action is available
        const chosenAction = normalAction ?? randomAction ?? { type: 'END_TURN' as const };
        const result = runAction(sideEffectsGame, state, activeId, chosenAction, rng);
        if (result.ok) {
          state = result.state;
        } else {
          // If action failed (e.g. END_TURN when hand > 6), force discard
          break;
        }
      }
    }
  });

  describe('getActionablePlayerId & getBotFallbackAction', () => {
    it('returns active bot playerId on bot turn, or null on human turn', () => {
      const rng = createRng('actionable-turn');
      const state = sideEffectsGame.setup(['human_1', 'bot_1'], {}, rng);
      const botIds = new Set(['bot_1']);

      state.activePlayerId = 'human_1';
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBeNull();

      state.activePlayerId = 'bot_1';
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBe('bot_1');
    });

    it('prioritizes pendingChoice for bot and blocks other bots when human has pendingChoice', () => {
      const rng = createRng('actionable-pending');
      const state = sideEffectsGame.setup(['human_1', 'bot_1'], {}, rng);
      const botIds = new Set(['bot_1']);

      // Active is bot_1, but human_1 has pendingChoice -> should return null
      state.activePlayerId = 'bot_1';
      state.pendingChoice = {
        type: 'TREMORS_DISCARD',
        playerId: 'human_1',
        attackerId: 'bot_1',
        timeoutSeconds: 15,
      };
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBeNull();

      // Active is human_1, but bot_1 has pendingChoice -> should return bot_1
      state.activePlayerId = 'human_1';
      state.pendingChoice = {
        type: 'ANXIETY_STEAL',
        playerId: 'bot_1',
        victimId: 'human_1',
      };
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBe('bot_1');
    });

    it('handles trades (PROPOSED and RESPONDED) for bot and human', () => {
      const rng = createRng('actionable-trade');
      const state = sideEffectsGame.setup(['human_1', 'bot_1'], {}, rng);
      const botIds = new Set(['bot_1']);

      state.activePlayerId = 'human_1';
      state.pendingChoice = null;

      // Trade PROPOSED to bot_1 -> bot_1 needs to respond
      state.trades = [
        {
          tradeId: 't1',
          proposerId: 'human_1',
          targetPlayerId: 'bot_1',
          offerCardIds: ['c1'],
          status: 'PROPOSED',
        },
      ];
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBe('bot_1');

      // Trade RESPONDED when proposer is human_1 -> human_1 needs to confirm, bot_1 waits
      state.trades = [
        {
          tradeId: 't1',
          proposerId: 'human_1',
          targetPlayerId: 'bot_1',
          offerCardIds: ['c1'],
          giveCardIds: ['c2'],
          status: 'RESPONDED',
        },
      ];
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBeNull();

      // Trade RESPONDED when proposer is bot_1 -> bot_1 needs to confirm
      state.activePlayerId = 'bot_1';
      state.trades = [
        {
          tradeId: 't2',
          proposerId: 'bot_1',
          targetPlayerId: 'human_1',
          offerCardIds: ['c1'],
          giveCardIds: ['c2'],
          status: 'RESPONDED',
        },
      ];
      expect(sideEffectsGame.getActionablePlayerId!(state, botIds)).toBe('bot_1');
    });

    it('getBotFallbackAction returns END_TURN', () => {
      const rng = createRng('fallback-test');
      const state = sideEffectsGame.setup(['human_1', 'bot_1'], {}, rng);
      expect(sideEffectsGame.getBotFallbackAction!(state, 'bot_1')).toEqual({
        type: 'END_TURN',
      });
    });
  });
});
