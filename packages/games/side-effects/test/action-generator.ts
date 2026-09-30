import type { Rng } from '@boardgame/core';
import { cardsData } from '../src/deck.js';
import { sideEffectsGame } from '../src/game.js';
import {
  type CardInstance,
  type SEAction,
  type SEState,
  SYSTEM_PLAYER_ID,
} from '../src/types.js';

export interface GeneratedAction {
  playerId: string;
  action: SEAction;
}

export function generateValidAction(state: SEState, rng: Rng): GeneratedAction | null {
  if (state.winner !== null) {
    return null;
  }

  // 1. Pending Choice
  if (state.pendingChoice !== null) {
    const choice = state.pendingChoice;
    if (choice.type === 'ANXIETY_STEAL') {
      const victim = state.players.find((p) => p.id === choice.victimId);
      if (!victim || victim.hand.length === 0) {
        return null;
      }
      const card = victim.hand[rng.int(victim.hand.length)]!;
      return {
        playerId: choice.playerId,
        action: {
          type: 'RESOLVE_CHOICE',
          cardId: card.instanceId,
        },
      };
    }

    if (choice.type === 'TREMORS_DISCARD') {
      const victim = state.players.find((p) => p.id === choice.playerId);
      if (!victim) {
        return null;
      }
      // 50% timeout, 50% discard
      if (rng.int(2) === 0) {
        return {
          playerId: SYSTEM_PLAYER_ID,
          action: { type: 'CHOICE_TIMEOUT' },
        };
      }
      if (victim.hand.length >= 3) {
        const shuffled = rng.shuffle(victim.hand);
        const cardIds = shuffled.slice(0, 3).map((c) => c.instanceId);
        return {
          playerId: choice.playerId,
          action: {
            type: 'RESOLVE_CHOICE',
            cardIds,
          },
        };
      }
      return {
        playerId: SYSTEM_PLAYER_ID,
        action: { type: 'CHOICE_TIMEOUT' },
      };
    }
  }

  // 2. Normal Turn
  const activeId = state.activePlayerId;
  const activePlayer = state.players.find((p) => p.id === activeId);
  if (!activePlayer) {
    return null;
  }

  // Handle trade response or confirmation first if any
  const openTrade = state.trades[0];
  if (openTrade) {
    if (openTrade.status === 'PROPOSED') {
      const target = state.players.find((p) => p.id === openTrade.targetPlayerId);
      if (target) {
        // Target responds: 80% accept, 20% reject
        const accept = rng.int(5) !== 0;
        const giveCards = accept && target.hand.length > 0 ? [target.hand[0]!.instanceId] : [];
        const action: SEAction = {
          type: 'RESPOND_TRADE',
          tradeId: openTrade.tradeId,
          accept,
          giveCardIds: giveCards,
        };
        if (sideEffectsGame.validate(state, target.id, action) === null) {
          return { playerId: target.id, action };
        }
      }
    } else if (openTrade.status === 'RESPONDED') {
      const proposer = state.players.find((p) => p.id === openTrade.proposerId);
      if (proposer) {
        const accept = rng.int(5) !== 0;
        const action: SEAction = {
          type: 'CONFIRM_TRADE',
          tradeId: openTrade.tradeId,
          accept,
        };
        if (sideEffectsGame.validate(state, proposer.id, action) === null) {
          return { playerId: proposer.id, action };
        }
      }
    }
  }

  // Must discard if hand > 6
  if (activePlayer.hand.length > 6) {
    const needed = activePlayer.hand.length - 6;
    const shuffled = rng.shuffle(activePlayer.hand);
    const cardIds = shuffled.slice(0, needed).map((c) => c.instanceId);
    return {
      playerId: activeId,
      action: {
        type: 'DISCARD',
        cardIds,
      },
    };
  }

  const candidateActions: GeneratedAction[] = [];

  // Card play actions if allowed
  if (!state.preventPlayCards && state.cardsPlayedThisTurn < 2) {
    for (const card of activePlayer.hand) {
      if (card.type === 'drug') {
        const drugDef = cardsData.drugs.find((d) => d.id === card.cardId);
        if (drugDef) {
          for (const slot of activePlayer.psyche) {
            if (slot.drug === null && slot.disorder.cardId === drugDef.treats) {
              candidateActions.push({
                playerId: activeId,
                action: {
                  type: 'TREAT',
                  drugId: card.instanceId,
                  disorderId: slot.disorder.instanceId,
                },
              });
            }
          }
        }
      } else if (card.type === 'therapy') {
        for (const slot of activePlayer.psyche) {
          if (slot.disorder.cardId !== 'tremors') {
            candidateActions.push({
              playerId: activeId,
              action: {
                type: 'THERAPY',
                therapyId: card.instanceId,
                disorderId: slot.disorder.instanceId,
              },
            });
          }
        }
      } else if (card.type === 'disorder') {
        for (const opp of state.players) {
          if (opp.id !== activeId) {
            const alreadyHas = opp.psyche.some(
              (s) => s.disorder.cardId === card.cardId,
            );
            if (!alreadyHas) {
              const activeDrugs = opp.psyche
                .map((s) => s.drug)
                .filter((d): d is CardInstance => d !== null);
              const causesDisorder = activeDrugs.some((d) => {
                const def = cardsData.drugs.find((dr) => dr.id === d.cardId);
                return def?.sideEffects.includes(card.cardId);
              });
              if (causesDisorder) {
                candidateActions.push({
                  playerId: activeId,
                  action: {
                    type: 'GIVE_DISORDER',
                    disorderCardId: card.instanceId,
                    targetPlayerId: opp.id,
                  },
                });
              }
            }
          }
        }
      } else if (card.type === 'episode') {
        for (const opp of state.players) {
          if (opp.id !== activeId) {
            for (const slot of opp.psyche) {
              if (slot.drug === null) {
                candidateActions.push({
                  playerId: activeId,
                  action: {
                    type: 'EPISODE',
                    episodeId: card.instanceId,
                    targetPlayerId: opp.id,
                    disorderId: slot.disorder.instanceId,
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  // Occasional trade proposal (5% chance if no trade open)
  if (state.trades.length === 0 && activePlayer.hand.length > 0 && rng.int(20) === 0) {
    const otherPlayers = state.players.filter((p) => p.id !== activeId);
    if (otherPlayers.length > 0) {
      const opp = otherPlayers[rng.int(otherPlayers.length)]!;
      candidateActions.push({
        playerId: activeId,
        action: {
          type: 'PROPOSE_TRADE',
          targetPlayerId: opp.id,
          offerCardIds: [activePlayer.hand[0]!.instanceId],
        },
      });
    }
  }

  // Filter only actions that validate successfully
  const validCandidates = candidateActions.filter(
    (ca) => sideEffectsGame.validate(state, ca.playerId, ca.action) === null,
  );

  // If there are valid play actions, 70% of the time play a card, 30% of the time consider ending turn
  if (validCandidates.length > 0 && rng.int(10) < 7) {
    return validCandidates[rng.int(validCandidates.length)]!;
  }

  // Otherwise, END_TURN if hand <= 6
  if (activePlayer.hand.length <= 6) {
    const endTurnAction: GeneratedAction = {
      playerId: activeId,
      action: { type: 'END_TURN' },
    };
    if (sideEffectsGame.validate(state, activeId, endTurnAction.action) === null) {
      return endTurnAction;
    }
  }

  // If cannot end turn, try any valid candidate
  if (validCandidates.length > 0) {
    return validCandidates[rng.int(validCandidates.length)]!;
  }

  return null;
}

export function checkStateInvariants(state: SEState): void {
  const allCards: CardInstance[] = [];

  // Draw pile
  allCards.push(...state.drawPile);

  // Discard pile
  allCards.push(...state.discardPile);

  // Players
  for (const player of state.players) {
    allCards.push(...player.hand);
    for (const slot of player.psyche) {
      allCards.push(slot.disorder);
      if (slot.drug !== null) {
        allCards.push(slot.drug);
      }
    }

    // Invariant: Thể Trạng không bao giờ có 2 Bệnh Lý cùng loại
    const disorderTypes = player.psyche.map((s) => s.disorder.cardId);
    if (new Set(disorderTypes).size !== disorderTypes.length) {
      throw new Error(
        `Invariant violation: Player ${player.id} has duplicate disorder types in Psyche: ${disorderTypes.join(', ')}`,
      );
    }
  }

  // Invariant 1: Total cards must be exactly 89
  if (allCards.length !== 89) {
    throw new Error(
      `Invariant violation: Total cards count is ${allCards.length}, expected 89!`,
    );
  }

  // Invariant 2: All instanceIds must be unique
  const instanceIds = allCards.map((c) => c.instanceId);
  const uniqueIds = new Set(instanceIds);
  if (uniqueIds.size !== 89) {
    throw new Error(
      `Invariant violation: Duplicate instanceIds found! Unique count: ${uniqueIds.size} / 89`,
    );
  }
}
