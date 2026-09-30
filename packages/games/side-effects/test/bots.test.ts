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
});
