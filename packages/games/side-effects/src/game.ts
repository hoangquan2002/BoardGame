import type { GameDefinition, Rng, ScheduledAction } from '@boardgame/core';
import { applySideEffects } from './apply.js';
import { chooseNormalAction } from './bots/index.js';
import { createPlayerView } from './player-view.js';
import { setupSideEffects } from './setup.js';
import {
  type SEAction,
  type SEPlayerView,
  type SEState,
  SYSTEM_PLAYER_ID,
} from './types.js';
import { validateSideEffects } from './validate.js';

export const sideEffectsGame: GameDefinition<SEState, SEAction, SEPlayerView> = {
  id: 'side-effects',
  minPlayers: 2,
  maxPlayers: 4,
  setup(playerIds: string[], options: unknown, rng: Rng): SEState {
    return setupSideEffects(playerIds, options, rng);
  },
  validate(state: SEState, playerId: string, action: SEAction): string | null {
    return validateSideEffects(state, playerId, action);
  },
  apply(state: SEState, playerId: string, action: SEAction, rng: Rng): SEState {
    return applySideEffects(state, playerId, action, rng);
  },
  playerView(state: SEState, playerId: string): SEPlayerView {
    return createPlayerView(state, playerId);
  },
  winner(state: SEState): string | null {
    return state.winner;
  },
  scheduledAction(state: SEState): ScheduledAction<SEAction> | null {
    if (
      state.pendingChoice &&
      state.pendingChoice.type === 'TREMORS_DISCARD' &&
      state.pendingChoice.timeoutSeconds > 0
    ) {
      return {
        delaySeconds: state.pendingChoice.timeoutSeconds,
        playerId: SYSTEM_PLAYER_ID,
        action: { type: 'CHOICE_TIMEOUT' },
      };
    }
    return null;
  },
  bots: [
    {
      level: 'normal',
      labelVi: 'Thường',
      chooseAction: chooseNormalAction,
    },
  ],
};

