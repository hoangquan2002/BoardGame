import type { Rng } from '@boardgame/core';
import { getDrugDef } from '../deck.js';
import { canEndTurn, canPlayCards, getValidTargets, mustDiscardCount } from '../targets.js';
import type { CardInstance, SEAction, SEPlayerView } from '../types.js';

/**
 * Đánh giá mức độ nghiêm trọng/lợi hại của từng loại Bệnh Lý (hình phạt khi bị Triệu Chứng).
 * - Trầm cảm (depression): mất lượt đánh tiếp theo -> cực kỳ nguy hiểm.
 * - Liệt dương (impotence): không được đánh bài lượt tiếp theo -> rất nguy hiểm.
 * - Biếng ăn (anorexia): không được rút bài & không có Thuốc điều trị.
 * - Chứng run (tremors): phải bỏ 3 lá trên tay.
 * - Lo âu (anxiety): bị cướp 1 lá trên tay.
 */
function getDisorderSeverity(cardId: string): number {
  switch (cardId) {
    case 'depression':
      return 100;
    case 'impotence':
      return 95;
    case 'anorexia':
      return 90;
    case 'tremors':
      return 85;
    case 'anxiety':
      return 80;
    case 'insomnia':
      return 60;
    case 'paranoia':
      return 50;
    case 'phobia':
      return 50;
    default:
      return 40;
  }
}

/**
 * Đánh giá giá trị thực tế của một lá bài trên tay bot trong ngữ cảnh bàn chơi hiện tại.
 */
function evaluateCardValue(card: CardInstance, view: SEPlayerView, playerId: string): number {
  const me = view.players.find((p) => p.id === playerId);
  const untreatedSelfDisorders = me?.psyche.filter((s) => s.drug === null) ?? [];

  if (card.type === 'therapy') {
    // Liệu pháp là lá quý giá nhất: có thể chữa mọi bệnh (trừ Chứng run)
    // Đặc biệt là Biếng ăn (Anorexia) vì không có bất kỳ loại Thuốc nào trị được
    const hasAnorexia = untreatedSelfDisorders.some((s) => s.disorder.cardId === 'anorexia');
    if (hasAnorexia) return 1000;
    if (untreatedSelfDisorders.length > 0) return 600;
    return 200;
  }

  if (card.type === 'drug') {
    const drugDef = getDrugDef(card.cardId);
    if (!drugDef) return 10;
    const matchingDisorder = untreatedSelfDisorders.find(
      (s) => s.disorder.cardId === drugDef.treats,
    );
    if (matchingDisorder) {
      return 500 + getDisorderSeverity(matchingDisorder.disorder.cardId);
    }
    return 20;
  }

  if (card.type === 'episode') {
    // Có đánh vào người dẫn đầu hoặc đối thủ nào không?
    let maxOppSeverity = 0;
    for (const opp of view.players) {
      if (opp.id === playerId) continue;
      for (const slot of opp.psyche) {
        if (slot.drug === null) {
          const sev = getDisorderSeverity(slot.disorder.cardId);
          if (sev > maxOppSeverity) maxOppSeverity = sev;
        }
      }
    }
    if (maxOppSeverity > 0) {
      return 150 + maxOppSeverity;
    }
    return 15;
  }

  if (card.type === 'disorder') {
    // Có thể đưa Bệnh Lý này cho đối thủ nào đang dùng Thuốc có tác dụng phụ tương ứng không?
    const canGiveToOpp = view.players.some(
      (opp) =>
        opp.id !== playerId &&
        !opp.psyche.some((s) => s.disorder.cardId === card.cardId) &&
        opp.psyche.some((s) => {
          if (!s.drug) return false;
          const def = getDrugDef(s.drug.cardId);
          return def !== undefined && def.sideEffects.includes(card.cardId);
        }),
    );
    if (canGiveToOpp) return 120;
    return 10;
  }

  return 10;
}

/**
 * Bot Mức Thường (normal):
 * - Tuân thủ các nguyên tắc chiến thuật theo PLAN T6a:
 *   1. Chữa bệnh của mình (ưu tiên thắng ngay nếu còn 1 bệnh, chữa bệnh nặng, Liệu Pháp cho Biếng ăn).
 *   2. Tấn công người gần thắng nhất (ít bệnh chưa chữa nhất) bằng Triệu Chứng vào bệnh nặng hoặc đưa Bệnh Lý qua tác dụng phụ.
 *   3. Không tự ý dùng Thuốc mở tác dụng phụ khi không cần thiết.
 *   4. Bỏ lá ít giá trị khi > 6 lá.
 *   5. Xử lý pendingChoice: Lo âu (lấy lá tốt nhất), Chứng run (bỏ 3 lá kém nhất).
 *   6. Từ chối mọi lời mời đổi bài bất lợi; không tự đề nghị đổi bài.
 */
export function chooseNormalAction(
  view: SEPlayerView,
  playerId: string,
  _rng: Rng,
): SEAction | null {
  if (view.winner !== null) {
    return null;
  }

  const me = view.players.find((p) => p.id === playerId);
  if (!me) {
    return null;
  }

  // 1. Xử lý lựa chọn đang chờ (pendingChoice)
  if (view.pendingChoice !== null) {
    const choice = view.pendingChoice;

    if (choice.type === 'ANXIETY_STEAL') {
      if (choice.playerId === playerId && choice.victimId) {
        const victim = view.players.find((p) => p.id === choice.victimId);
        if (victim?.revealedHand && victim.revealedHand.length > 0) {
          // Chọn lá bài có giá trị cao nhất cho bản thân
          let bestCard = victim.revealedHand[0]!;
          let bestVal = -Infinity;
          for (const card of victim.revealedHand) {
            const val = evaluateCardValue(card, view, playerId);
            if (val > bestVal) {
              bestVal = val;
              bestCard = card;
            }
          }
          return {
            type: 'RESOLVE_CHOICE',
            cardId: bestCard.instanceId,
          };
        }
      }
      return null;
    }

    if (choice.type === 'TREMORS_DISCARD') {
      if (choice.playerId === playerId) {
        if (me.hand && me.hand.length >= 3) {
          // Sắp xếp bài trên tay theo giá trị tăng dần và bỏ 3 lá ít giá trị nhất
          const sorted = [...me.hand].sort(
            (a, b) =>
              evaluateCardValue(a, view, playerId) - evaluateCardValue(b, view, playerId),
          );
          return {
            type: 'RESOLVE_CHOICE',
            cardIds: sorted.slice(0, 3).map((c) => c.instanceId),
          };
        }
      }
      return null;
    }
  }

  // 2. Lời mời đổi bài: Từ chối để tránh rủi ro
  const myTrade = view.trades.find(
    (t) =>
      (t.targetPlayerId === playerId && t.status === 'PROPOSED') ||
      (t.proposerId === playerId && t.status === 'RESPONDED'),
  );
  if (myTrade) {
    if (myTrade.targetPlayerId === playerId && myTrade.status === 'PROPOSED') {
      return {
        type: 'RESPOND_TRADE',
        tradeId: myTrade.tradeId,
        accept: false,
      };
    }
    if (myTrade.proposerId === playerId && myTrade.status === 'RESPONDED') {
      return {
        type: 'CONFIRM_TRADE',
        tradeId: myTrade.tradeId,
        accept: false,
      };
    }
  }

  // 3. Kiểm tra xem có phải lượt của bot không
  if (view.activePlayerId !== playerId) {
    return null;
  }

  if (!me.hand) {
    return null;
  }

  // 4. Nếu có thể đánh bài: tìm hành động tối ưu theo thứ tự ưu tiên
  if (canPlayCards(view, playerId)) {
    interface ScoredAction {
      score: number;
      action: SEAction;
    }
    const scoredActions: ScoredAction[] = [];

    // Tìm người dẫn đầu (gần thắng nhất: có ít bệnh chưa chữa nhất)
    const opponents = view.players.filter((p) => p.id !== playerId);
    const sortedOpponents = [...opponents].sort((a, b) => {
      const aUntreated = a.psyche.filter((s) => s.drug === null).length;
      const bUntreated = b.psyche.filter((s) => s.drug === null).length;
      return aUntreated - bUntreated;
    });
    const leader = sortedOpponents[0];

    const untreatedSelfSlots = me.psyche.filter((s) => s.drug === null);

    for (const card of me.hand) {
      const targets = getValidTargets(view, playerId, card.instanceId);

      for (const t of targets) {
        let score = 0;

        if (t.type === 'TREAT') {
          // Chữa bệnh bằng Thuốc:
          // Nếu chỉ còn đúng 1 bệnh chưa chữa -> đánh lá này thắng ngay lập tức!
          if (untreatedSelfSlots.length === 1) {
            score = 100000;
          } else {
            const slot = me.psyche.find((s) => s.disorder.instanceId === t.disorderId);
            const sev = slot ? getDisorderSeverity(slot.disorder.cardId) : 50;
            score = 4000 + sev;
          }
        } else if (t.type === 'THERAPY') {
          // Liệu pháp:
          if (untreatedSelfSlots.length === 1) {
            score = 100000;
          } else {
            const slot = me.psyche.find((s) => s.disorder.instanceId === t.disorderId);
            const isAnorexia = slot?.disorder.cardId === 'anorexia';
            if (isAnorexia) {
              score = 9000; // Biếng ăn không có thuốc, giải bằng liệu pháp là tối ưu
            } else {
              const sev = slot ? getDisorderSeverity(slot.disorder.cardId) : 50;
              // Liệu pháp không để lại thuốc nên không mở tác dụng phụ
              score = 4500 + sev;
            }
          }
        } else if (t.type === 'EPISODE') {
          // Đánh Triệu Chứng vào đối thủ:
          const isTargetingLeader = leader && t.targetPlayerId === leader.id;
          const opp = view.players.find((p) => p.id === t.targetPlayerId);
          const slot = opp?.psyche.find((s) => s.disorder.instanceId === t.disorderId);
          const sev = slot ? getDisorderSeverity(slot.disorder.cardId) : 50;

          if (isTargetingLeader) {
            score = 2500 + sev * 2;
          } else {
            score = 1200 + sev;
          }
        } else if (t.type === 'GIVE_DISORDER') {
          // Đưa Bệnh Lý qua tác dụng phụ:
          const isTargetingLeader = leader && t.targetPlayerId === leader.id;
          if (isTargetingLeader) {
            score = 2200;
          } else {
            score = 1000;
          }
        }

        if (score > 0) {
          scoredActions.push({ score, action: t.action });
        }
      }
    }

    if (scoredActions.length > 0) {
      // Sắp xếp hành động có điểm cao nhất lên đầu
      scoredActions.sort((a, b) => b.score - a.score);
      return scoredActions[0]!.action;
    }
  }

  // 5. Bỏ bài khi > 6 lá cuối lượt: bỏ các lá ít giá trị nhất
  const discardCount = mustDiscardCount(view, playerId);
  if (discardCount > 0) {
    const sorted = [...me.hand].sort(
      (a, b) => evaluateCardValue(a, view, playerId) - evaluateCardValue(b, view, playerId),
    );
    return {
      type: 'DISCARD',
      cardIds: sorted.slice(0, discardCount).map((c) => c.instanceId),
    };
  }

  // 6. Nếu không còn hành động nào tích cực và thỏa điều kiện thì kết thúc lượt
  if (canEndTurn(view, playerId)) {
    return { type: 'END_TURN' };
  }

  return null;
}
