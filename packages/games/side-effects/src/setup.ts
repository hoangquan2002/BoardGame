import type { Rng } from '@boardgame/core';
import { createDeck } from './deck.js';
import type { SEOptions, SEPlayer, SEState } from './types.js';

export function setupSideEffects(
  playerIds: string[],
  options: unknown,
  rng: Rng,
): SEState {
  if (!playerIds || playerIds.length < 2 || playerIds.length > 8) {
    throw new Error(`Số lượng người chơi phải từ 2 đến 8, nhận được: ${playerIds?.length}`);
  }

  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== playerIds.length) {
    throw new Error('Danh sách ID người chơi không được trùng lặp');
  }

  const rawOptions = (options as Partial<SEOptions>) ?? {};
  const tremorsTimeoutSeconds =
    typeof rawOptions.tremorsTimeoutSeconds === 'number' && rawOptions.tremorsTimeoutSeconds > 0
      ? rawOptions.tremorsTimeoutSeconds
      : 7;

  const fullDeck = createDeck();
  const disorderCards = fullDeck.filter((c) => c.type === 'disorder');
  const otherCards = fullDeck.filter((c) => c.type !== 'disorder');

  const disorderQueue = rng.shuffle(disorderCards);
  const targetDisordersCount = playerIds.length >= 6 ? 3 : 4;

  const players: SEPlayer[] = playerIds.map((id) => ({
    id,
    hand: [],
    psyche: [],
    skipTurns: 0,
    preventPlayCardsTurns: 0,
    preventDrawTurns: 0,
  }));

  for (let round = 0; round < targetDisordersCount; round++) {
    for (const player of players) {
      let attempts = 0;
      while (attempts < disorderQueue.length) {
        const candidate = disorderQueue.shift()!;
        const alreadyHasType = player.psyche.some(
          (slot) => slot.disorder.cardId === candidate.cardId,
        );
        if (alreadyHasType) {
          disorderQueue.push(candidate);
          attempts++;
        } else {
          player.psyche.push({
            disorder: candidate,
            drug: null,
          });
          break;
        }
      }
    }
  }

  const remainingDeck = [...disorderQueue, ...otherCards];
  const drawPile = rng.shuffle(remainingDeck);

  // Deal 4 cards to each player's hand
  for (let i = 0; i < 4; i++) {
    for (const player of players) {
      const card = drawPile.pop()!;
      player.hand.push(card);
    }
  }

  // Randomly select first player
  const firstPlayerIndex = rng.int(playerIds.length);
  const activePlayerId = playerIds[firstPlayerIndex]!;
  const firstPlayer = players[firstPlayerIndex]!;

  // First player automatically draws 2 cards at start of turn
  const firstPlayerDrawCount = Math.min(2, drawPile.length);
  for (let i = 0; i < firstPlayerDrawCount; i++) {
    firstPlayer.hand.push(drawPile.pop()!);
  }

  const playerNames = rawOptions.playerNames ? { ...rawOptions.playerNames } : undefined;
  const firstPlayerName = playerNames?.[activePlayerId] ?? activePlayerId;

  const state: SEState = {
    playerIds: [...playerIds],
    players,
    activePlayerId,
    turnNumber: 1,
    cardsPlayedThisTurn: 0,
    preventPlayCards: false,
    drawPile,
    discardPile: [],
    pendingChoice: null,
    trades: [],
    inflictedThisTurn: [],
    winner: null,
    logs: [`Ván chơi bắt đầu. ${firstPlayerName} đi đầu tiên và rút ${firstPlayerDrawCount} lá.`],
    options: {
      tremorsTimeoutSeconds,
      playerNames,
    },
  };

  return state;
}
