import type { Rng } from '@boardgame/core';
import { isCatCard } from '../deck.js';
import type { EKAction, EKCard, EKPlayerView } from '../types.js';

export function chooseHardAction(
  view: EKPlayerView,
  playerId: string,
  rng: Rng
): EKAction | null {
  if (!view.alive) return null;

  // 1. Cửa sổ phản ứng Nope
  if (view.phase === 'NOPE_WINDOW') {
    const nw = view.nopeWindow;
    if (!nw || nw.hasPassed) return null;

    const nopeCard = view.myHand.find((c) => c.code === 'NOPE');
    if (!nopeCard) {
      return { type: 'PASS_NOPE' };
    }

    // Nếu hành động gốc là của chính mình nhưng đang bị Nope (cần Yup lại)
    if (nw.originalPlayerId === playerId && nw.isCurrentlyNoped) {
      return { type: 'PLAY_NOPE', cardId: nopeCard.id };
    }

    // Nếu hành động của đối phương đang KHÔNG bị Nope
    if (nw.originalPlayerId !== playerId && !nw.isCurrentlyNoped) {
      // Trường hợp 1: Đối phương tấn công mình
      if (nw.originalActionType === 'ATTACK') {
        return { type: 'PLAY_NOPE', cardId: nopeCard.id };
      }

      // Trường hợp 2: Đối phương Skip hoặc Shuffle khi nguy cơ Mèo Nổ cao -> chặn để ép họ rút bài!
      if (
        (nw.originalActionType === 'SKIP' || nw.originalActionType === 'SHUFFLE') &&
        view.explosionRiskPercent >= 30
      ) {
        return { type: 'PLAY_NOPE', cardId: nopeCard.id };
      }

      // Trường hợp 3: Đối thủ đánh combo hoặc xin bài
      if (nw.originalActionType === 'PLAY_COMBO' || nw.originalActionType === 'FAVOR') {
        if (rng.next() < 0.7) {
          return { type: 'PLAY_NOPE', cardId: nopeCard.id };
        }
      }
    }

    return { type: 'PASS_NOPE' };
  }

  // 2. Bị Favor đòi bài
  if (view.phase === 'FAVOR_GIVE') {
    if (!view.favorPrompt?.isTarget) return null;
    // Đưa lá ít giá trị nhất: Cat card đơn lẻ -> Shuffle -> See the Future -> ... Giữ Defuse & Nope
    const sorted = [...view.myHand].sort((a, b) => {
      const getPriority = (c: EKCard): number => {
        if (c.code === 'DEFUSE') return 100;
        if (c.code === 'NOPE') return 80;
        if (c.code === 'ATTACK') return 70;
        if (c.code === 'SKIP') return 60;
        if (isCatCard(c)) return 10;
        return 30;
      };
      return getPriority(a) - getPriority(b);
    });
    const chosen = sorted[0];
    return chosen ? { type: 'GIVE_FAVOR_CARD', cardId: chosen.id } : null;
  }

  // 3. Chọn bài từ Discard Pile khi đánh 5 lá khác nhau
  if (view.phase === 'FIVE_DIFF_PICK') {
    if (!view.fiveDiffPrompt?.isPicker) return null;
    const candidates = view.discardPile.filter((c) => c.code !== 'EXPLODING_KITTEN');
    if (candidates.length === 0) return null;

    const priority: Record<string, number> = {
      DEFUSE: 100,
      ATTACK: 80,
      SKIP: 70,
      NOPE: 60,
      FAVOR: 40,
      SEE_THE_FUTURE: 30,
      SHUFFLE: 20,
    };
    candidates.sort((a, b) => (priority[b.code] ?? 1) - (priority[a.code] ?? 1));
    return { type: 'PICK_DISCARD_CARD', cardId: candidates[0]!.id };
  }

  // 4. Nhét lại Mèo Nổ sau khi Defuse
  if (view.phase === 'DEFUSE_INSERT') {
    if (!view.defusePrompt?.mustDefuse) return null;
    // Chiến thuật cao cấp:
    // Nếu mình đang nợ lượt (turnsRemaining > 1), chèn vào vị trí >= turnsRemaining để bản thân không bị rút phải!
    if (view.turnsRemaining > 1) {
      const safeIndex = Math.min(view.turnsRemaining, view.drawDeckCount);
      return { type: 'DEFUSE_INSERT', insertIndex: safeIndex };
    }
    // Nếu chỉ đi 1 lượt, chèn ngay lên đỉnh (index 0) để người chơi kế tiếp bốc phải!
    return { type: 'DEFUSE_INSERT', insertIndex: 0 };
  }

  // 5. Đến lượt đi của mình
  if (view.phase === 'TURN_PLAY') {
    if (view.activePlayerId !== playerId) return null;

    // A. Nếu đã biết trước đỉnh bài qua See the Future
    if (view.knownTopCards && view.knownTopCards.length > 0) {
      const top = view.knownTopCards[0]!;
      if (top.code === 'EXPLODING_KITTEN') {
        // Có Mèo Nổ trên đỉnh! Né ngay lập tức
        const attackCard = view.myHand.find((c) => c.code === 'ATTACK');
        if (attackCard) return { type: 'PLAY_ACTION_CARD', cardId: attackCard.id };

        const skipCard = view.myHand.find((c) => c.code === 'SKIP');
        if (skipCard) return { type: 'PLAY_ACTION_CARD', cardId: skipCard.id };

        const shuffleCard = view.myHand.find((c) => c.code === 'SHUFFLE');
        if (shuffleCard) return { type: 'PLAY_ACTION_CARD', cardId: shuffleCard.id };
      } else {
        // Đỉnh là an toàn -> Rút bài ngay để tiết kiệm tài nguyên!
        return { type: 'DRAW_CARD' };
      }
    }

    // B. Soi bài nếu nguy cơ Mèo Nổ cao (>= 25%) và chưa biết đỉnh deck
    if (!view.knownTopCards && view.explosionRiskPercent >= 25) {
      const seeFutureCard = view.myHand.find((c) => c.code === 'SEE_THE_FUTURE');
      if (seeFutureCard) {
        return { type: 'PLAY_ACTION_CARD', cardId: seeFutureCard.id };
      }
    }

    // Đối thủ tiềm năng
    const aliveOpponents = view.opponents
      .filter((o) => o.alive && o.handCount > 0)
      .sort((a, b) => b.handCount - a.handCount);
    const topOpponent = aliveOpponents[0];

    // C. Tìm kiếm Combo 5 lá nếu có DEFUSE trong Discard Pile
    const hasDefuseInDiscard = view.discardPile.some((c) => c.code === 'DEFUSE');
    if (hasDefuseInDiscard) {
      const distinctCards = new Map<string, EKCard>();
      for (const card of view.myHand) {
        if (card.code === 'DEFUSE') continue;
        if (!distinctCards.has(card.code)) {
          distinctCards.set(card.code, card);
        }
      }
      if (distinctCards.size >= 5) {
        const fiveCards = Array.from(distinctCards.values()).slice(0, 5);
        return {
          type: 'PLAY_COMBO',
          comboType: 'FIVE_DIFFERENT',
          cardIds: [
            fiveCards[0]!.id,
            fiveCards[1]!.id,
            fiveCards[2]!.id,
            fiveCards[3]!.id,
            fiveCards[4]!.id,
          ],
        };
      }
    }

    // D. Đánh Combo 3 lá đòi DEFUSE từ đối thủ
    if (topOpponent) {
      const codeGroups = new Map<string, EKCard[]>();
      for (const card of view.myHand) {
        if (card.code === 'DEFUSE') continue;
        const list = codeGroups.get(card.code) ?? [];
        list.push(card);
        codeGroups.set(card.code, list);
      }

      for (const [, cards] of codeGroups.entries()) {
        if (cards.length >= 3) {
          return {
            type: 'PLAY_COMBO',
            comboType: 'THREE_OF_A_KIND',
            cardIds: [cards[0]!.id, cards[1]!.id, cards[2]!.id],
            targetPlayerId: topOpponent.id,
            requestedCardCode: 'DEFUSE',
          };
        }
      }
    }

    // E. Đánh Combo 2 lá cướp bài
    if (topOpponent) {
      const codeGroups = new Map<string, EKCard[]>();
      for (const card of view.myHand) {
        if (card.code === 'DEFUSE' || card.code === 'NOPE') continue;
        const list = codeGroups.get(card.code) ?? [];
        list.push(card);
        codeGroups.set(card.code, list);
      }

      for (const [, cards] of codeGroups.entries()) {
        if (cards.length >= 2) {
          return {
            type: 'PLAY_COMBO',
            comboType: 'TWO_OF_A_KIND',
            cardIds: [cards[0]!.id, cards[1]!.id],
            targetPlayerId: topOpponent.id,
          };
        }
      }
    }

    // F. Đánh Favor
    if (topOpponent && view.explosionRiskPercent < 40) {
      const favorCard = view.myHand.find((c) => c.code === 'FAVOR');
      if (favorCard) {
        return {
          type: 'PLAY_ACTION_CARD',
          cardId: favorCard.id,
          targetPlayerId: topOpponent.id,
        };
      }
    }

    // G. Nếu nguy cơ nổ quá cao mà không còn thông tin và có Attack/Skip
    if (view.explosionRiskPercent >= 40) {
      const attackCard = view.myHand.find((c) => c.code === 'ATTACK');
      if (attackCard) return { type: 'PLAY_ACTION_CARD', cardId: attackCard.id };

      const skipCard = view.myHand.find((c) => c.code === 'SKIP');
      if (skipCard) return { type: 'PLAY_ACTION_CARD', cardId: skipCard.id };
    }

    // Mặc định: Rút bài
    return { type: 'DRAW_CARD' };
  }

  return null;
}
