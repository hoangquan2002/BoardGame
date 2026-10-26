import type { GameDefinition, Rng, ScheduledAction } from '@boardgame/core';
import { applyGame } from './apply.js';
import { explodingKittensBots } from './bots/index.js';
import { getCardById } from './deck.js';
import { createPlayerView } from './player-view.js';
import { setupGame } from './setup.js';
import {
  type EKAction,
  type EKPlayerView,
  type EKState,
  SYSTEM_PLAYER_ID,
} from './types.js';
import { validateGame } from './validate.js';

export const explodingKittensGame: GameDefinition<EKState, EKAction, EKPlayerView> = {
  id: 'exploding-kittens',
  minPlayers: 2,
  maxPlayers: 5,
  meta: {
    nameVi: 'Mèo Nổ (Exploding Kittens)',
    subtitleVi: 'Cò quay Nga thẻ bài kịch tính & hài hước',
    icon: '💣',
  },
  setup(playerIds: string[], options: unknown, rng: Rng): EKState {
    return setupGame(playerIds, options, rng);
  },
  validate(state: EKState, playerId: string, action: EKAction): string | null {
    return validateGame(state, playerId, action);
  },
  apply(state: EKState, playerId: string, action: EKAction, rng: Rng): EKState {
    return applyGame(state, playerId, action, rng);
  },
  playerView(state: EKState, playerId: string): EKPlayerView {
    return createPlayerView(state, playerId);
  },
  winner(state: EKState): string | null {
    return state.winner;
  },
  scheduledAction(state: EKState): ScheduledAction<EKAction> | null {
    if (
      state.phase === 'NOPE_WINDOW' &&
      state.pendingState &&
      state.pendingState.type === 'NOPE_WINDOW' &&
      state.pendingState.timeoutSeconds > 0
    ) {
      return {
        delaySeconds: state.pendingState.timeoutSeconds,
        playerId: SYSTEM_PLAYER_ID,
        action: { type: 'RESOLVE_NOPE_WINDOW' },
      };
    }
    return null;
  },
  bots: explodingKittensBots,
  getActionablePlayerId(state: EKState, botPlayerIds: ReadonlySet<string>): string | null {
    if (state.winner !== null || state.phase === 'GAME_OVER') {
      return null;
    }

    if (state.phase === 'NOPE_WINDOW' && state.pendingState?.type === 'NOPE_WINDOW') {
      // Tìm bot nào còn sống, có Nope trên tay và chưa pass
      for (const botId of botPlayerIds) {
        const p = state.players[botId];
        if (
          p &&
          p.alive &&
          !state.pendingState.passedPlayerIds.includes(botId) &&
          p.hand.some((cid) => getCardById(cid)?.code === 'NOPE')
        ) {
          return botId;
        }
      }
      return null;
    }

    if (state.phase === 'FAVOR_GIVE' && state.pendingState?.type === 'FAVOR_GIVE') {
      const targetId = state.pendingState.targetPlayerId;
      return botPlayerIds.has(targetId) ? targetId : null;
    }

    if (state.phase === 'FIVE_DIFF_PICK' && state.pendingState?.type === 'FIVE_DIFF_PICK') {
      const pickerId = state.pendingState.pickerId;
      return botPlayerIds.has(pickerId) ? pickerId : null;
    }

    if (state.phase === 'DEFUSE_INSERT' && state.pendingState?.type === 'DEFUSE_INSERT') {
      const pId = state.pendingState.playerId;
      return botPlayerIds.has(pId) ? pId : null;
    }

    if (state.phase === 'TURN_PLAY') {
      return botPlayerIds.has(state.activePlayerId) ? state.activePlayerId : null;
    }

    return null;
  },
  getBotFallbackAction(state: EKState, playerId: string): EKAction | null {
    if (state.phase === 'NOPE_WINDOW') {
      return { type: 'PASS_NOPE' };
    }

    if (state.phase === 'FAVOR_GIVE') {
      const player = state.players[playerId];
      const cardId = player?.hand[0];
      return cardId ? { type: 'GIVE_FAVOR_CARD', cardId } : null;
    }

    if (state.phase === 'FIVE_DIFF_PICK') {
      const cardId = state.discardPile.find(
        (id) => getCardById(id)?.code !== 'EXPLODING_KITTEN'
      );
      return cardId ? { type: 'PICK_DISCARD_CARD', cardId } : null;
    }

    if (state.phase === 'DEFUSE_INSERT') {
      return { type: 'DEFUSE_INSERT', insertIndex: 0 };
    }

    if (state.phase === 'TURN_PLAY') {
      return { type: 'DRAW_CARD' };
    }

    return null;
  },
};
