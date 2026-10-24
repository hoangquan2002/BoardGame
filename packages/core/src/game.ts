import type { Rng } from './rng.js';

export interface ScheduledAction<A> {
  delaySeconds: number;
  playerId: string;
  action: A;
}

export interface BotDefinition<V = unknown, A = unknown> {
  level: string;
  labelVi: string;
  chooseAction(view: V, playerId: string, rng: Rng): A | null;
}

export interface GameMeta {
  nameVi: string;
  subtitleVi?: string;
  icon?: string;
}

export interface GameDefinition<S, A, V> {
  id: string;
  minPlayers: number;
  maxPlayers: number;
  meta?: GameMeta;
  setup(playerIds: string[], options: unknown, rng: Rng): S;
  validate(state: S, playerId: string, action: A): string | null; // null = hợp lệ
  apply(state: S, playerId: string, action: A, rng: Rng): S;
  playerView(state: S, playerId: string): V;
  winner(state: S): string | null;
  scheduledAction?(state: S): ScheduledAction<A> | null;
  bots?: BotDefinition<V, A>[];
  /**
   * Trả về playerId của bot cần ra quyết định ngay lúc này (dùng để Server kích hoạt Bot).
   */
  getActionablePlayerId?(state: S, botPlayerIds: ReadonlySet<string>): string | null;
  /**
   * Hành động dự phòng khi Bot trả về null hoặc nước đi không hợp lệ.
   */
  getBotFallbackAction?(state: S, playerId: string): A | null;
}

export type ActionResult<S> =
  | { ok: true; state: S }
  | { ok: false; error: string };

/**
 * Runs an action through validation and application.
 * Returns { ok: true, state: nextState } if valid,
 * or { ok: false, error: string } if validation fails.
 */
export function runAction<S, A, V>(
  game: GameDefinition<S, A, V>,
  state: S,
  playerId: string,
  action: A,
  rng: Rng,
): ActionResult<S> {
  const error = game.validate(state, playerId, action);
  if (error !== null) {
    return { ok: false, error };
  }
  const nextState = game.apply(state, playerId, action, rng);
  return { ok: true, state: nextState };
}
