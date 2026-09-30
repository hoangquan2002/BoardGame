import type { GameDefinition } from '@boardgame/core';
import { sideEffectsGame } from '@boardgame/game-side-effects';

export class GameRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private games = new Map<string, GameDefinition<any, any, any>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(game: GameDefinition<any, any, any>): void {
    this.games.set(game.id, game);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(gameId: string): GameDefinition<any, any, any> | undefined {
    return this.games.get(gameId);
  }

  has(gameId: string): boolean {
    return this.games.has(gameId);
  }
}

export const defaultRegistry = new GameRegistry();
defaultRegistry.register(sideEffectsGame);
