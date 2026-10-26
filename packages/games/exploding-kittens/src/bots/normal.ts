import type { Rng } from '@boardgame/core';
import { isCatCard } from '../deck.js';
import type { EKAction, EKCard, EKPlayerView } from '../types.js';

export function chooseNormalAction(
  view: EKPlayerView,
  playerId: string,
  rng: Rng
): EKAction | null {
  if (!view.alive) return null;

  // 1. Cửa sổ phản ứng Nope
  if (view.phase === 'NOPE_WINDOW') {
    const nw = view.nopeWindow;
    if (!nw || nw.hasPassed) return null;

    // Tìm lá Nope trên tay
    const nopeCard = view.myHand.find((c) => c.code === 'NOPE');
    if (!nopeCard) {
      return { type: 'PASS_NOPE' };
    }

    // Nếu hành động đối phương nhằm vào mình hoặc tấn công
    const isDangerous =
      nw.originalActionType === 'ATTACK' ||
      nw.originalPlayerId !== playerId;

    // Xác suất 50% tung Nope nếu hành động của đối thủ
    if (isDangerous && !nw.isCurrentlyNoped && rng.next() < 0.5) {
      return { type: 'PLAY_NOPE', cardId: nopeCard.id };
    }

    // Ngược lại chọn bỏ qua
    return { type: 'PASS_NOPE' };
  }

  // 2. Phải đưa bài khi bị Favor
  if (view.phase === 'FAVOR_GIVE') {
    if (!view.favorPrompt?.isTarget) return null;
    // Chọn lá ít giá trị nhất (ưu tiên Cat card, sau đó bài khác, tránh Defuse)
    const sorted = [...view.myHand].sort((a, b) => {
      if (a.code === 'DEFUSE') return 1;
      if (b.code === 'DEFUSE') return -1;
      if (isCatCard(a)) return -1;
      if (isCatCard(b)) return 1;
      return 0;
    });
    const chosen = sorted[0];
    return chosen ? { type: 'GIVE_FAVOR_CARD', cardId: chosen.id } : null;
  }

  // 3. Chọn bài từ Discard Pile khi đánh Combo 5 lá
  if (view.phase === 'FIVE_DIFF_PICK') {
    if (!view.fiveDiffPrompt?.isPicker) return null;
    const candidates = view.discardPile.filter((c) => c.code !== 'EXPLODING_KITTEN');
    if (candidates.length === 0) return null;

    // Ưu tiên: DEFUSE > ATTACK > SKIP > NOPE > FAVOR > khác
    const priority: Record<string, number> = {
      DEFUSE: 10,
      ATTACK: 8,
      SKIP: 7,
      NOPE: 6,
      FAVOR: 5,
      SEE_THE_FUTURE: 4,
      SHUFFLE: 3,
    };
    candidates.sort((a, b) => (priority[b.code] ?? 1) - (priority[a.code] ?? 1));
    return { type: 'PICK_DISCARD_CARD', cardId: candidates[0]!.id };
  }

  // 4. Nhét lại Mèo Nổ sau khi Defuse
  if (view.phase === 'DEFUSE_INSERT') {
    if (!view.defusePrompt?.mustDefuse) return null;
    // Đặt lên trên cùng (index 0) để đối thủ kế tiếp rút phải
    return { type: 'DEFUSE_INSERT', insertIndex: 0 };
  }

  // 5. Đến lượt đi của mình
  if (view.phase === 'TURN_PLAY') {
    if (view.activePlayerId !== playerId) return null;

    // Nếu biết chắc lá đầu tiên là Exploding Kitten
    if (view.knownTopCards && view.knownTopCards.length > 0) {
      const top = view.knownTopCards[0]!;
      if (top.code === 'EXPLODING_KITTEN') {
        // Tìm cách né rút bài
        const skipCard = view.myHand.find((c) => c.code === 'SKIP');
        if (skipCard) return { type: 'PLAY_ACTION_CARD', cardId: skipCard.id };

        const attackCard = view.myHand.find((c) => c.code === 'ATTACK');
        if (attackCard) return { type: 'PLAY_ACTION_CARD', cardId: attackCard.id };

        const shuffleCard = view.myHand.find((c) => c.code === 'SHUFFLE');
        if (shuffleCard) return { type: 'PLAY_ACTION_CARD', cardId: shuffleCard.id };
      }
    }

    // Đánh See the Future nếu chưa biết đỉnh deck
    if (!view.knownTopCards) {
      const seeFutureCard = view.myHand.find((c) => c.code === 'SEE_THE_FUTURE');
      if (seeFutureCard && rng.next() < 0.6) {
        return { type: 'PLAY_ACTION_CARD', cardId: seeFutureCard.id };
      }
    }

    // Tìm đối thủ nhiều bài nhất còn sống
    const aliveOpponents = view.opponents
      .filter((o) => o.alive && o.handCount > 0)
      .sort((a, b) => b.handCount - a.handCount);
    const topOpponent = aliveOpponents[0];

    // Thử ghép đôi bài (Two of a Kind)
    if (topOpponent) {
      const codeGroups = new Map<string, EKCard[]>();
      for (const card of view.myHand) {
        if (card.code === 'DEFUSE') continue; // Giữ Defuse, không xài combo
        const list = codeGroups.get(card.code) ?? [];
        list.push(card);
        codeGroups.set(card.code, list);
      }

      for (const [, cards] of codeGroups.entries()) {
        if (cards.length >= 2 && rng.next() < 0.5) {
          return {
            type: 'PLAY_COMBO',
            comboType: 'TWO_OF_A_KIND',
            cardIds: [cards[0]!.id, cards[1]!.id],
            targetPlayerId: topOpponent.id,
          };
        }
      }
    }

    // Đánh Favor nếu có đối thủ có bài
    if (topOpponent && rng.next() < 0.4) {
      const favorCard = view.myHand.find((c) => c.code === 'FAVOR');
      if (favorCard) {
        return {
          type: 'PLAY_ACTION_CARD',
          cardId: favorCard.id,
          targetPlayerId: topOpponent.id,
        };
      }
    }

    // Nếu không còn gì cần đánh -> Rút bài kết thúc lượt
    return { type: 'DRAW_CARD' };
  }

  return null;
}
