import { getDisorderDef, getDrugDef } from './deck.js';
import type {
  PsycheSlot,
  SEAction,
  SEPlayerView,
} from './types.js';

export interface ValidCardTarget {
  type: 'TREAT' | 'THERAPY' | 'GIVE_DISORDER' | 'EPISODE';
  targetPlayerId: string;
  disorderId?: string;
  action: SEAction;
}

/**
 * Kiểm tra xem một slot Bệnh Lý có thể điều trị bằng lá Thuốc cụ thể hay không.
 */
export function canTreat(slot: PsycheSlot, drugCardId: string): boolean {
  if (slot.drug !== null) {
    return false;
  }
  const drugDef = getDrugDef(drugCardId);
  return drugDef !== undefined && drugDef.treats === slot.disorder.cardId;
}

/**
 * Kiểm tra xem một slot Bệnh Lý có thể áp dụng Liệu Pháp hay không.
 */
export function canTherapy(slot: PsycheSlot): boolean {
  const disorderDef = getDisorderDef(slot.disorder.cardId);
  return !disorderDef?.therapyImmune;
}

/**
 * Kiểm tra xem người nhận có thể bị đưa một lá Bệnh Lý cụ thể hay không:
 * - Người nhận chưa có loại Bệnh Lý này trong Thể Trạng.
 * - Người nhận đang dùng ít nhất một loại Thuốc có tác dụng phụ gây ra loại Bệnh Lý này.
 */
export function canGiveDisorder(targetPsyche: PsycheSlot[], disorderCardId: string): boolean {
  const alreadyHas = targetPsyche.some((s) => s.disorder.cardId === disorderCardId);
  if (alreadyHas) {
    return false;
  }
  return targetPsyche.some((s) => {
    if (!s.drug) return false;
    const def = getDrugDef(s.drug.cardId);
    return def !== undefined && def.sideEffects.includes(disorderCardId);
  });
}

/**
 * Kiểm tra xem một slot Bệnh Lý của đối thủ có thể bị đánh Triệu Chứng hay không:
 * - Bệnh Lý chưa được điều trị (slot.drug === null).
 */
export function canEpisode(slot: PsycheSlot): boolean {
  return slot.drug === null;
}

/**
 * Kiểm tra điều kiện chung để người chơi có thể đánh bài:
 * - Đúng lượt của người chơi.
 * - Game chưa kết thúc.
 * - Không có lựa chọn đang chờ giải quyết (pendingChoice).
 * - Không bị Liệt dương (preventPlayCards).
 * - Chưa đánh quá 2 lá trong lượt (cardsPlayedThisTurn < 2).
 */
export function canPlayCards(
  view: Pick<
    SEPlayerView,
    'winner' | 'pendingChoice' | 'activePlayerId' | 'preventPlayCards' | 'cardsPlayedThisTurn'
  >,
  playerId: string,
): boolean {
  if (view.winner !== null) {
    return false;
  }
  if (view.pendingChoice !== null) {
    return false;
  }
  if (view.activePlayerId !== playerId) {
    return false;
  }
  if (view.preventPlayCards) {
    return false;
  }
  if (view.cardsPlayedThisTurn >= 2) {
    return false;
  }
  return true;
}

/**
 * Tìm tất cả các mục tiêu hợp lệ để đánh lá bài được chọn dựa trên playerView.
 */
export function getValidTargets(
  view: SEPlayerView,
  playerId: string,
  cardInstanceId: string,
): ValidCardTarget[] {
  if (!canPlayCards(view, playerId)) {
    return [];
  }

  const me = view.players.find((p) => p.id === playerId);
  if (!me || !me.hand) {
    return [];
  }

  const card = me.hand.find((c) => c.instanceId === cardInstanceId);
  if (!card) {
    return [];
  }

  const targets: ValidCardTarget[] = [];

  switch (card.type) {
    case 'drug': {
      // Mục tiêu là các slot bệnh lý chưa chữa trong Thể Trạng của chính mình mà thuốc này trị được
      for (const slot of me.psyche) {
        if (canTreat(slot, card.cardId)) {
          targets.push({
            type: 'TREAT',
            targetPlayerId: playerId,
            disorderId: slot.disorder.instanceId,
            action: {
              type: 'TREAT',
              drugId: card.instanceId,
              disorderId: slot.disorder.instanceId,
            },
          });
        }
      }
      break;
    }

    case 'therapy': {
      // Mục tiêu là các slot bệnh lý trong Thể Trạng của chính mình (trừ Chứng run)
      for (const slot of me.psyche) {
        if (canTherapy(slot)) {
          targets.push({
            type: 'THERAPY',
            targetPlayerId: playerId,
            disorderId: slot.disorder.instanceId,
            action: {
              type: 'THERAPY',
              therapyId: card.instanceId,
              disorderId: slot.disorder.instanceId,
            },
          });
        }
      }
      break;
    }

    case 'disorder': {
      // Mục tiêu là đối thủ thoả điều kiện canGiveDisorder
      for (const opp of view.players) {
        if (opp.id !== playerId && canGiveDisorder(opp.psyche, card.cardId)) {
          targets.push({
            type: 'GIVE_DISORDER',
            targetPlayerId: opp.id,
            action: {
              type: 'GIVE_DISORDER',
              disorderCardId: card.instanceId,
              targetPlayerId: opp.id,
            },
          });
        }
      }
      break;
    }

    case 'episode': {
      // Mục tiêu là slot bệnh lý chưa chữa của đối thủ
      for (const opp of view.players) {
        if (opp.id !== playerId) {
          for (const slot of opp.psyche) {
            if (canEpisode(slot)) {
              targets.push({
                type: 'EPISODE',
                targetPlayerId: opp.id,
                disorderId: slot.disorder.instanceId,
                action: {
                  type: 'EPISODE',
                  episodeId: card.instanceId,
                  targetPlayerId: opp.id,
                  disorderId: slot.disorder.instanceId,
                },
              });
            }
          }
        }
      }
      break;
    }
  }

  return targets;
}

/**
 * Số lượng lá bài bắt buộc phải bỏ (khi bài trên tay vượt quá 6 lá).
 */
export function mustDiscardCount(view: SEPlayerView, playerId: string): number {
  const me = view.players.find((p) => p.id === playerId);
  const handLength = me?.hand ? me.hand.length : me?.handCount ?? 0;
  return Math.max(0, handLength - 6);
}

/**
 * Kiểm tra xem người chơi hiện tại có thể kết thúc lượt được không:
 * - Đúng lượt của người chơi.
 * - Ván chưa kết thúc.
 * - Không có pendingChoice chưa xử lý.
 * - Bài trên tay <= 6 lá.
 */
export function canEndTurn(view: SEPlayerView, playerId: string): boolean {
  if (view.winner !== null) {
    return false;
  }
  if (view.pendingChoice !== null) {
    return false;
  }
  if (view.activePlayerId !== playerId) {
    return false;
  }
  return mustDiscardCount(view, playerId) === 0;
}
