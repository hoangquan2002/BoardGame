import { describe, expect, it } from 'vitest';
import type { GameDefinition, Rng } from '../src/index.js';
import { createRng, runAction } from '../src/index.js';

interface CountState {
  current: number;
  turnIndex: number;
  players: [string, string];
  winnerId: string | null;
}

type CountAction = { type: 'ADD'; amount: 1 | 2 };

interface CountPlayerView {
  current: number;
  target: number;
  isMyTurn: boolean;
  activePlayerId: string;
  winnerId: string | null;
}

const CountToTenGame: GameDefinition<CountState, CountAction, CountPlayerView> = {
  id: 'count-to-ten',
  minPlayers: 2,
  maxPlayers: 2,

  setup(playerIds: string[], _options: unknown, _rng: Rng): CountState {
    if (playerIds.length !== 2) {
      throw new Error('CountToTenGame requires exactly 2 players');
    }
    return {
      current: 0,
      turnIndex: 0,
      players: [playerIds[0]!, playerIds[1]!],
      winnerId: null,
    };
  },

  validate(state: CountState, playerId: string, action: CountAction): string | null {
    if (state.winnerId !== null) {
      return 'Game is already over';
    }
    if (!state.players.includes(playerId)) {
      return 'Player not in this game';
    }
    if (state.players[state.turnIndex] !== playerId) {
      return 'Not your turn';
    }
    if (action.type !== 'ADD') {
      return 'Invalid action type';
    }
    if (action.amount !== 1 && action.amount !== 2) {
      return 'Amount must be 1 or 2';
    }
    return null;
  },

  apply(state: CountState, playerId: string, action: CountAction, _rng: Rng): CountState {
    const nextCurrent = state.current + action.amount;
    const isWin = nextCurrent >= 10;
    const winnerId = isWin ? playerId : null;
    const nextTurnIndex = isWin ? state.turnIndex : (state.turnIndex + 1) % 2;

    return {
      ...state,
      current: nextCurrent,
      turnIndex: nextTurnIndex,
      winnerId,
    };
  },

  playerView(state: CountState, playerId: string): CountPlayerView {
    const activePlayerId = state.players[state.turnIndex]!;
    return {
      current: state.current,
      target: 10,
      isMyTurn: activePlayerId === playerId && state.winnerId === null,
      activePlayerId,
      winnerId: state.winnerId,
    };
  },

  winner(state: CountState): string | null {
    return state.winnerId;
  },
};

describe('Sample Game: CountToTenGame', () => {
  const rng = createRng(42);

  it('sets up a 2-player game correctly', () => {
    const state = CountToTenGame.setup(['alice', 'bob'], {}, rng);
    expect(state.current).toBe(0);
    expect(state.players).toEqual(['alice', 'bob']);
    expect(state.turnIndex).toBe(0);
    expect(CountToTenGame.winner(state)).toBeNull();
  });

  it('validates turn order and action legality', () => {
    const state = CountToTenGame.setup(['alice', 'bob'], {}, rng);

    // Bob tries to play on Alice's turn
    const wrongTurn = CountToTenGame.validate(state, 'bob', { type: 'ADD', amount: 1 });
    expect(wrongTurn).toBe('Not your turn');

    // Unknown player tries to play
    const unknownPlayer = CountToTenGame.validate(state, 'charlie', { type: 'ADD', amount: 1 });
    expect(unknownPlayer).toBe('Player not in this game');

    // Alice provides invalid amount
    const invalidAmount = CountToTenGame.validate(state, 'alice', {
      type: 'ADD',
      amount: 3 as unknown as 1,
    });
    expect(invalidAmount).toBe('Amount must be 1 or 2');

    // Valid action
    const valid = CountToTenGame.validate(state, 'alice', { type: 'ADD', amount: 2 });
    expect(valid).toBeNull();
  });

  it('updates state and alternates turns via runAction helper', () => {
    let state = CountToTenGame.setup(['alice', 'bob'], {}, rng);

    // Alice adds 2
    const res1 = runAction(CountToTenGame, state, 'alice', { type: 'ADD', amount: 2 }, rng);
    expect(res1.ok).toBe(true);
    if (!res1.ok) return;
    state = res1.state;
    expect(state.current).toBe(2);
    expect(state.turnIndex).toBe(1);

    // Alice tries to play again immediately -> blocked
    const resBlocked = runAction(CountToTenGame, state, 'alice', { type: 'ADD', amount: 1 }, rng);
    expect(resBlocked.ok).toBe(false);
    if (!resBlocked.ok) {
      expect(resBlocked.error).toBe('Not your turn');
    }

    // Bob adds 1
    const res2 = runAction(CountToTenGame, state, 'bob', { type: 'ADD', amount: 1 }, rng);
    expect(res2.ok).toBe(true);
    if (!res2.ok) return;
    state = res2.state;
    expect(state.current).toBe(3);
    expect(state.turnIndex).toBe(0);
  });

  it('provides player-specific views', () => {
    const state = CountToTenGame.setup(['alice', 'bob'], {}, rng);

    const aliceView = CountToTenGame.playerView(state, 'alice');
    const bobView = CountToTenGame.playerView(state, 'bob');

    expect(aliceView.isMyTurn).toBe(true);
    expect(aliceView.activePlayerId).toBe('alice');
    expect(bobView.isMyTurn).toBe(false);
    expect(bobView.activePlayerId).toBe('alice');
  });

  it('determines winner and blocks further actions after game ends', () => {
    let state = CountToTenGame.setup(['alice', 'bob'], {}, rng);

    // Sequence of moves to reach 10:
    // Alice +2 -> 2
    // Bob +2 -> 4
    // Alice +2 -> 6
    // Bob +2 -> 8
    // Alice +2 -> 10 (Alice wins)
    const moves: Array<{ player: string; amount: 1 | 2 }> = [
      { player: 'alice', amount: 2 },
      { player: 'bob', amount: 2 },
      { player: 'alice', amount: 2 },
      { player: 'bob', amount: 2 },
      { player: 'alice', amount: 2 },
    ];

    for (const move of moves) {
      const res = runAction(CountToTenGame, state, move.player, { type: 'ADD', amount: move.amount }, rng);
      expect(res.ok).toBe(true);
      if (res.ok) state = res.state;
    }

    expect(state.current).toBe(10);
    expect(CountToTenGame.winner(state)).toBe('alice');

    const aliceFinalView = CountToTenGame.playerView(state, 'alice');
    expect(aliceFinalView.winnerId).toBe('alice');
    expect(aliceFinalView.isMyTurn).toBe(false);

    // Attempting action after game end is blocked
    const postGameAction = runAction(CountToTenGame, state, 'bob', { type: 'ADD', amount: 1 }, rng);
    expect(postGameAction.ok).toBe(false);
    if (!postGameAction.ok) {
      expect(postGameAction.error).toBe('Game is already over');
    }
  });
});
