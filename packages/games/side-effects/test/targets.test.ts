import { describe, expect, it } from 'vitest';
import {
  canEpisode,
  canGiveDisorder,
  canPlayCards,
  canTherapy,
  canTreat,
  getValidTargets,
  mustDiscardCount,
  canEndTurn,
} from '../src/targets.js';
import { validateSideEffects } from '../src/validate.js';
import { createPlayerView } from '../src/player-view.js';
import { setupSideEffects } from '../src/setup.js';
import { createRng } from '@boardgame/core';
import type { CardInstance, SEAction, SEState } from '../src/types.js';

describe('targets helpers', () => {
  const dImpotence: CardInstance = { instanceId: 'd1', cardId: 'impotence', type: 'disorder' };
  const dTremors: CardInstance = { instanceId: 'd2', cardId: 'tremors', type: 'disorder' };
  const dAnxiety: CardInstance = { instanceId: 'd3', cardId: 'anxiety', type: 'disorder' };

  const medSildenafil: CardInstance = {
    instanceId: 'm1',
    cardId: 'sildenafil', // treats impotence, side effects: ['anxiety']
    type: 'drug',
  };

  describe('canTreat', () => {
    it('returns true if untreated slot matches drug treatment', () => {
      expect(canTreat({ disorder: dImpotence, drug: null }, 'sildenafil')).toBe(true);
    });

    it('returns false if slot is already treated', () => {
      expect(canTreat({ disorder: dImpotence, drug: medSildenafil }, 'sildenafil')).toBe(false);
    });

    it('returns false if drug does not treat disorder', () => {
      expect(canTreat({ disorder: dTremors, drug: null }, 'sildenafil')).toBe(false);
    });
  });

  describe('canTherapy', () => {
    it('returns true for normal disorders', () => {
      expect(canTherapy({ disorder: dImpotence, drug: null })).toBe(true);
      expect(canTherapy({ disorder: dAnxiety, drug: null })).toBe(true);
    });

    it('returns false for therapy-immune disorders (Tremors)', () => {
      expect(canTherapy({ disorder: dTremors, drug: null })).toBe(false);
      expect(canTherapy({ disorder: dTremors, drug: medSildenafil })).toBe(false);
    });
  });

  describe('canGiveDisorder', () => {
    it('returns false if target already has that disorder', () => {
      const psyche = [{ disorder: dTremors, drug: null }];
      expect(canGiveDisorder(psyche, 'tremors')).toBe(false);
    });

    it('returns true if target has active drug with that side effect and does not have the disorder yet', () => {
      const psyche = [{ disorder: dImpotence, drug: medSildenafil }];
      expect(canGiveDisorder(psyche, 'anxiety')).toBe(true);
    });

    it('returns false if target has drug without that side effect', () => {
      const psyche = [{ disorder: dImpotence, drug: medSildenafil }];
      expect(canGiveDisorder(psyche, 'tremors')).toBe(false);
    });

    it('returns false if target has only untreated disorders', () => {
      const psyche = [{ disorder: dImpotence, drug: null }];
      expect(canGiveDisorder(psyche, 'anxiety')).toBe(false);
    });
  });

  describe('canEpisode', () => {
    it('returns true if slot is untreated', () => {
      expect(canEpisode({ disorder: dImpotence, drug: null })).toBe(true);
    });

    it('returns false if slot is already treated', () => {
      expect(canEpisode({ disorder: dImpotence, drug: medSildenafil })).toBe(false);
    });
  });

  describe('canPlayCards', () => {
    const baseView = {
      winner: null,
      pendingChoice: null,
      activePlayerId: 'p1',
      preventPlayCards: false,
      cardsPlayedThisTurn: 0,
    };

    it('returns true when it is player turn and no restrictions', () => {
      expect(canPlayCards(baseView, 'p1')).toBe(true);
    });

    it('returns false when not player turn', () => {
      expect(canPlayCards(baseView, 'p2')).toBe(false);
    });

    it('returns false when winner exists', () => {
      expect(canPlayCards({ ...baseView, winner: 'p1' }, 'p1')).toBe(false);
    });

    it('returns false when pendingChoice exists', () => {
      expect(
        canPlayCards(
          {
            ...baseView,
            pendingChoice: {
              type: 'ANXIETY_STEAL',
              playerId: 'p1',
              victimId: 'p2',
            },
          },
          'p1',
        ),
      ).toBe(false);
    });

    it('returns false when preventPlayCards is true (Impotence)', () => {
      expect(canPlayCards({ ...baseView, preventPlayCards: true }, 'p1')).toBe(false);
    });

    it('returns false when cardsPlayedThisTurn >= 2', () => {
      expect(canPlayCards({ ...baseView, cardsPlayedThisTurn: 2 }, 'p1')).toBe(false);
      expect(canPlayCards({ ...baseView, cardsPlayedThisTurn: 3 }, 'p1')).toBe(false);
    });
  });

  describe('mustDiscardCount & canEndTurn', () => {
    const rng = createRng('test-seed-discard');
    const state = setupSideEffects(['p1', 'p2'], {}, rng);
    const view = createPlayerView(state, 'p1');

    it('calculates mustDiscardCount correctly', () => {
      const view6 = {
        ...view,
        players: view.players.map((p) =>
          p.id === 'p1' ? { ...p, hand: p.hand!.slice(0, 6) } : p,
        ),
      };
      expect(mustDiscardCount(view6, 'p1')).toBe(0);

      const view7 = {
        ...view,
        players: view.players.map((p) =>
          p.id === 'p1'
            ? {
                ...p,
                hand: [
                  ...p.hand!.slice(0, 6),
                  { instanceId: 'extra1', cardId: 'episode', type: 'episode' as const },
                ],
              }
            : p,
        ),
      };
      expect(mustDiscardCount(view7, 'p1')).toBe(1);
    });

    it('canEndTurn respects turn and discard requirements', () => {
      const view6 = {
        ...view,
        players: view.players.map((p) =>
          p.id === 'p1' ? { ...p, hand: p.hand!.slice(0, 6) } : p,
        ),
      };
      expect(canEndTurn(view6, 'p1')).toBe(true);
      expect(canEndTurn(view6, 'p2')).toBe(false); // not active player
    });
  });

  describe('getValidTargets against full state & validateSideEffects', () => {
    it('returns targets that are 100% valid in validateSideEffects', () => {
      const rng = createRng('test-seed-targets');
      const state: SEState = setupSideEffects(['p1', 'p2', 'p3'], {}, rng);

      // Ensure p1 is active
      state.activePlayerId = 'p1';
      state.cardsPlayedThisTurn = 0;
      state.preventPlayCards = false;
      state.pendingChoice = null;

      const p1 = state.players.find((p) => p.id === 'p1')!;
      const p2 = state.players.find((p) => p.id === 'p2')!;

      // Give p1 a disorder slot and a drug that treats it
      p1.psyche = [{ disorder: dImpotence, drug: null }];
      p1.hand = [
        medSildenafil, // Drug treating impotence
        { instanceId: 't1', cardId: 'therapy', type: 'therapy' },
        { instanceId: 'e1', cardId: 'episode', type: 'episode' },
        { instanceId: 'dis_anxiety', cardId: 'anxiety', type: 'disorder' },
      ];

      // Give p2 treated impotence with sildenafil (which has side effect anxiety)
      p2.psyche = [
        {
          disorder: { instanceId: 'p2_d1', cardId: 'impotence', type: 'disorder' },
          drug: { instanceId: 'p2_m1', cardId: 'sildenafil', type: 'drug' },
        },
        {
          disorder: { instanceId: 'p2_d2', cardId: 'depression', type: 'disorder' },
          drug: null,
        },
      ];

      const view = createPlayerView(state, 'p1');

      // Test TREAT
      const drugTargets = getValidTargets(view, 'p1', medSildenafil.instanceId);
      expect(drugTargets.length).toBe(1);
      expect(drugTargets[0].type).toBe('TREAT');
      expect(drugTargets[0].disorderId).toBe(dImpotence.instanceId);
      expect(validateSideEffects(state, 'p1', drugTargets[0].action)).toBeNull();

      // Test THERAPY
      const therapyTargets = getValidTargets(view, 'p1', 't1');
      expect(therapyTargets.length).toBe(1);
      expect(therapyTargets[0].type).toBe('THERAPY');
      expect(therapyTargets[0].disorderId).toBe(dImpotence.instanceId);
      expect(validateSideEffects(state, 'p1', therapyTargets[0].action)).toBeNull();

      // Test GIVE_DISORDER: p2 has sildenafil active, so p1 can give anxiety to p2!
      const disorderTargets = getValidTargets(view, 'p1', 'dis_anxiety');
      expect(disorderTargets.length).toBe(1);
      expect(disorderTargets[0].type).toBe('GIVE_DISORDER');
      expect(disorderTargets[0].targetPlayerId).toBe('p2');
      expect(validateSideEffects(state, 'p1', disorderTargets[0].action)).toBeNull();

      // Test EPISODE: p2 has untreated depression
      const episodeTargets = getValidTargets(view, 'p1', 'e1');
      // Untreated slot of p2
      const p2UntreatedTarget = episodeTargets.find(
        (t) => t.targetPlayerId === 'p2' && t.disorderId === 'p2_d2',
      );
      expect(p2UntreatedTarget).toBeDefined();
      expect(validateSideEffects(state, 'p1', p2UntreatedTarget!.action)).toBeNull();

      // But should not target p2's treated impotence slot
      const p2TreatedTarget = episodeTargets.find(
        (t) => t.targetPlayerId === 'p2' && t.disorderId === 'p2_d1',
      );
      expect(p2TreatedTarget).toBeUndefined();
    });

    it('cross-checks getValidTargets completeness against validateSideEffects in randomized state space', () => {
      // Generate multiple randomized game states and check that for any card in hand,
      // all candidate actions that pass validateSideEffects are found in getValidTargets,
      // and all targets returned by getValidTargets pass validateSideEffects.
      for (let seed = 1; seed <= 5; seed++) {
        const rng = createRng(`test-targets-seed-${seed}`);
        const state = setupSideEffects(['p1', 'p2', 'p3'], {}, rng);
        const activeId = state.activePlayerId;
        const activePlayer = state.players.find((p) => p.id === activeId)!;
        const view = createPlayerView(state, activeId);

        for (const card of activePlayer.hand) {
          const targets = getValidTargets(view, activeId, card.instanceId);

          // Every target action must validate to null
          for (const t of targets) {
            const err = validateSideEffects(state, activeId, t.action);
            expect(err).toBeNull();
          }

          // Test candidate actions directly against validateSideEffects
          // and ensure they exist in targets
          const allCandidateActions: SEAction[] = [];

          if (card.type === 'drug') {
            for (const slot of activePlayer.psyche) {
              allCandidateActions.push({
                type: 'TREAT',
                drugId: card.instanceId,
                disorderId: slot.disorder.instanceId,
              });
            }
          } else if (card.type === 'therapy') {
            for (const slot of activePlayer.psyche) {
              allCandidateActions.push({
                type: 'THERAPY',
                therapyId: card.instanceId,
                disorderId: slot.disorder.instanceId,
              });
            }
          } else if (card.type === 'disorder') {
            for (const p of state.players) {
              allCandidateActions.push({
                type: 'GIVE_DISORDER',
                disorderCardId: card.instanceId,
                targetPlayerId: p.id,
              });
            }
          } else if (card.type === 'episode') {
            for (const p of state.players) {
              for (const slot of p.psyche) {
                allCandidateActions.push({
                  type: 'EPISODE',
                  episodeId: card.instanceId,
                  targetPlayerId: p.id,
                  disorderId: slot.disorder.instanceId,
                });
              }
            }
          }

          for (const cand of allCandidateActions) {
            const isValid = validateSideEffects(state, activeId, cand) === null;
            const inTargets = targets.some((t) => JSON.stringify(t.action) === JSON.stringify(cand));
            expect(inTargets).toBe(isValid);
          }
        }
      }
    });
  });
});
