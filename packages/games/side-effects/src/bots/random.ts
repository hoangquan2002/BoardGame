import type { Rng } from '@boardgame/core';
import { canEndTurn, canPlayCards, getValidTargets, mustDiscardCount } from '../targets.js';
import type { SEAction, SEPlayerView } from '../types.js';

/**
 * Bot Ngẫu Nhiên (random):
 * - Chọn ngẫu nhiên 1 action hợp lệ từ playerView (không gian lận, không đọc state).
 * - Dùng để làm baseline so sánh và kiểm thử engine.
 */
export function chooseRandomAction(
  view: SEPlayerView,
  playerId: string,
  rng: Rng,
): SEAction | null {
  if (view.winner !== null) {
    return null;
  }

  // 1. Xử lý lựa chọn đang chờ (pendingChoice)
  if (view.pendingChoice !== null) {
    const choice = view.pendingChoice;

    if (choice.type === 'ANXIETY_STEAL') {
      if (choice.playerId === playerId && choice.victimId) {
        const victim = view.players.find((p) => p.id === choice.victimId);
        if (victim?.revealedHand && victim.revealedHand.length > 0) {
          const card = victim.revealedHand[rng.int(victim.revealedHand.length)]!;
          return {
            type: 'RESOLVE_CHOICE',
            cardId: card.instanceId,
          };
        }
      }
      return null;
    }

    if (choice.type === 'TREMORS_DISCARD') {
      if (choice.playerId === playerId) {
        const me = view.players.find((p) => p.id === playerId);
        if (me?.hand && me.hand.length >= 3) {
          const shuffled = rng.shuffle(me.hand);
          return {
            type: 'RESOLVE_CHOICE',
            cardIds: shuffled.slice(0, 3).map((c) => c.instanceId),
          };
        }
      }
      return null;
    }
  }

  // 2. Xử lý Thương Lượng (Đổi bài)
  const myTrade = view.trades.find(
    (t) =>
      (t.targetPlayerId === playerId && t.status === 'PROPOSED') ||
      (t.proposerId === playerId && t.status === 'RESPONDED'),
  );
  if (myTrade) {
    if (myTrade.targetPlayerId === playerId && myTrade.status === 'PROPOSED') {
      const me = view.players.find((p) => p.id === playerId);
      const accept = rng.int(2) === 0;
      const giveCardIds =
        accept && me?.hand && me.hand.length > 0
          ? [me.hand[rng.int(me.hand.length)]!.instanceId]
          : [];
      return {
        type: 'RESPOND_TRADE',
        tradeId: myTrade.tradeId,
        accept,
        giveCardIds,
      };
    }
    if (myTrade.proposerId === playerId && myTrade.status === 'RESPONDED') {
      return {
        type: 'CONFIRM_TRADE',
        tradeId: myTrade.tradeId,
        accept: rng.int(2) === 0,
      };
    }
  }

  // 3. Đến lượt người chơi
  if (view.activePlayerId !== playerId) {
    return null;
  }

  const me = view.players.find((p) => p.id === playerId);
  if (!me || !me.hand) {
    return null;
  }

  // Phải bỏ bài nếu trên tay > 6 lá
  const discardCount = mustDiscardCount(view, playerId);
  if (discardCount > 0) {
    const shuffled = rng.shuffle(me.hand);
    return {
      type: 'DISCARD',
      cardIds: shuffled.slice(0, discardCount).map((c) => c.instanceId),
    };
  }

  // Thu thập các hành động đánh bài hợp lệ
  const candidateActions: SEAction[] = [];
  if (canPlayCards(view, playerId)) {
    for (const card of me.hand) {
      const targets = getValidTargets(view, playerId, card.instanceId);
      for (const t of targets) {
        candidateActions.push(t.action);
      }
    }
  }

  // 70% cơ hội đánh bài nếu có bài hợp lệ
  if (candidateActions.length > 0 && rng.int(10) < 7) {
    return candidateActions[rng.int(candidateActions.length)]!;
  }

  // Có thể kết thúc lượt
  if (canEndTurn(view, playerId)) {
    return { type: 'END_TURN' };
  }

  // Nếu không kết thúc lượt được mà có bài đánh được thì đánh bài
  if (candidateActions.length > 0) {
    return candidateActions[rng.int(candidateActions.length)]!;
  }

  return null;
}
