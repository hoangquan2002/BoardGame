import type { SEGameEventView } from '@boardgame/game-side-effects';
import type { FeedbackSoundKey } from '../../app/feedback/index.js';

export interface SESoundSnapshot {
  activePlayerId: string;
  winner: string | null;
  hasIncomingTrade: boolean;
}

/**
 * Xác định danh sách âm thanh cần phát cho Side Effects từ thay đổi trạng thái & mảng events mới.
 * Hàm thuần, phục vụ trực tiếp cho cả GameBoard lẫn unit test.
 */
export function resolveSideEffectsSounds(
  prev: SESoundSnapshot | null,
  curr: SESoundSnapshot,
  newEvents: SEGameEventView[],
  myId: string,
): FeedbackSoundKey[] {
  // Lần đầu mount / khôi phục phòng: không phát âm thanh cũ
  if (prev === null) {
    return [];
  }

  // 1. Kết thúc ván: ưu tiên âm chiến thắng hoặc kết thúc
  if (prev.winner === null && curr.winner !== null) {
    return [curr.winner === myId ? 'victory' : 'defeat'];
  }

  const sounds: FeedbackSoundKey[] = [];

  // 2. Xét các sự kiện mới trong gameView.events
  for (const ev of newEvents) {
    const harmsMe =
      (ev.type === 'EPISODE' && ev.targetId === myId) ||
      (ev.type === 'GIVE_DISORDER' && ev.targetId === myId) ||
      (ev.type === 'ANXIETY_STEAL' && ev.targetId === myId) ||
      (ev.type === 'TREMORS_TIMEOUT' && ev.actorId === myId) ||
      ((ev.type === 'SKIP_TURN' || ev.type === 'TURN_RESTRICTION') && ev.actorId === myId);

    if (harmsMe) {
      sounds.push('harmAlert');
      continue;
    }

    if (ev.type === 'TREAT' || ev.type === 'THERAPY') {
      sounds.push(ev.actorId === myId ? 'heal' : 'cardPlay');
      continue;
    }

    if (
      ev.type === 'EPISODE' ||
      ev.type === 'GIVE_DISORDER' ||
      ev.type === 'ANXIETY_STEAL' ||
      ev.type === 'TREMORS_DISCARD' ||
      ev.type === 'TRADE_COMPLETED'
    ) {
      sounds.push('cardPlay');
      continue;
    }
  }

  // 3. Có lời mời / phản hồi đổi bài mới đang chờ mình xử lý
  if (!prev.hasIncomingTrade && curr.hasIncomingTrade) {
    sounds.push('tradeInvite');
  }

  // 4. Chuyển sang lượt của chính mình
  if (prev.activePlayerId !== myId && curr.activePlayerId === myId && curr.winner === null) {
    sounds.push('yourTurn');
  }

  // Loại bỏ trùng lặp nhưng giữ nguyên thứ tự
  return Array.from(new Set(sounds));
}
