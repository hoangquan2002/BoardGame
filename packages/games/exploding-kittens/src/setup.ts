import type { Rng } from '@boardgame/core';
import { getAllCards } from './deck.js';
import type { EKCard, EKPlayerState, EKState } from './types.js';

export function setupGame(playerIds: string[], _options: unknown, rng: Rng): EKState {
  if (playerIds.length < 2 || playerIds.length > 5) {
    throw new Error('Số người chơi Exploding Kittens phải từ 2 đến 5 người.');
  }

  const allCards = getAllCards();

  // 1. Tách Exploding Kitten và Defuse
  const explodingKittens: EKCard[] = [];
  const defuses: EKCard[] = [];
  const standardCards: EKCard[] = [];

  for (const card of allCards) {
    if (card.code === 'EXPLODING_KITTEN') {
      explodingKittens.push(card);
    } else if (card.code === 'DEFUSE') {
      defuses.push(card);
    } else {
      standardCards.push(card);
    }
  }

  // 2. Xáo 46 lá bài thường
  const shuffledStandard = rng.shuffle(standardCards.map((c) => c.id));

  // 3. Chia bài cho người chơi: 7 lá thường + 1 lá Defuse
  const players: Record<string, EKPlayerState> = {};
  for (const pid of playerIds) {
    const hand = shuffledStandard.splice(0, 7);
    const defuseCard = defuses.pop();
    if (defuseCard) {
      hand.push(defuseCard.id);
    }
    players[pid] = {
      id: pid,
      hand,
      alive: true,
    };
  }

  // 4. Hoàn trả Defuse thừa vào chồng bài
  // 2-3 người: bỏ 2 Defuse vào deck; 4-5 người: bỏ toàn bộ Defuse dư vào deck
  const defuseToReturnCount = playerIds.length <= 3 ? 2 : defuses.length;
  const defusesToReturn = defuses.slice(0, defuseToReturnCount).map((c) => c.id);

  // 5. Chèn N - 1 lá Exploding Kitten
  const kittensToReturnCount = playerIds.length - 1;
  const kittensToReturn = explodingKittens.slice(0, kittensToReturnCount).map((c) => c.id);

  // 6. Xáo chồng bài rút & Chọn người đi trước
  const drawPileCards = [...shuffledStandard, ...defusesToReturn, ...kittensToReturn];
  const shuffledDrawDeck = rng.shuffle(drawPileCards);

  const startingIndex = rng.int(playerIds.length);
  const activePlayerId = playerIds[startingIndex] ?? playerIds[0]!;

  return {
    players,
    playerOrder: [...playerIds],
    activePlayerId,
    turnsRemaining: 1,
    drawDeck: shuffledDrawDeck,
    discardPile: [],
    phase: 'TURN_PLAY',
    pendingState: null,
    seeTheFutureState: null,
    winner: null,
    turnCount: 1,
    lastActionDescriptionVi: 'Trò chơi bắt đầu!',
  };
}
