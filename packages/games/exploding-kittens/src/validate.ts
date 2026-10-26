import { getCardById, isActionCard, isCatCard } from './deck.js';
import {
  type EKAction,
  type EKState,
  SYSTEM_PLAYER_ID,
} from './types.js';

export function validateGame(
  state: EKState,
  playerId: string,
  action: EKAction
): string | null {
  if (state.winner !== null || state.phase === 'GAME_OVER') {
    return 'Trò chơi đã kết thúc';
  }

  // Cho phép system resolve cửa sổ Nope
  if (action.type === 'RESOLVE_NOPE_WINDOW') {
    if (state.phase !== 'NOPE_WINDOW') {
      return 'Không ở trong cửa sổ phản ứng Nope';
    }
    return null;
  }

  const player = state.players[playerId];
  if (!player && playerId !== SYSTEM_PLAYER_ID) {
    return 'Người chơi không tồn tại trong ván đấu';
  }

  if (player && !player.alive) {
    return 'Bạn đã bị loại khỏi ván đấu';
  }

  switch (action.type) {
    case 'PLAY_ACTION_CARD': {
      if (state.phase !== 'TURN_PLAY') {
        return 'Không thể đánh bài ở giai đoạn hiện tại';
      }
      if (state.activePlayerId !== playerId) {
        return 'Chưa đến lượt của bạn';
      }
      if (!player || !player.hand.includes(action.cardId)) {
        return 'Bạn không sở hữu lá bài này';
      }

      const card = getCardById(action.cardId);
      if (!card) {
        return 'Lá bài không tồn tại';
      }

      if (card.code === 'EXPLODING_KITTEN') {
        return 'Không thể tự đánh lá Mèo Nổ từ trên tay';
      }
      if (card.code === 'DEFUSE') {
        return 'Lá Gỡ Bom chỉ được dùng khi rút trúng Mèo Nổ';
      }
      if (isCatCard(card)) {
        return 'Lá bài mèo chỉ có thể đánh theo cặp hoặc bộ tổ hợp';
      }
      if (card.code === 'NOPE') {
        return 'Lá Chặn (Nope) chỉ có thể đánh trong cửa sổ phản ứng';
      }
      if (!isActionCard(card)) {
        return 'Lá bài này không phải là bài chức năng hợp lệ';
      }

      if (card.code === 'FAVOR') {
        if (!action.targetPlayerId) {
          return 'Vui lòng chọn người chơi để xin bài';
        }
        if (action.targetPlayerId === playerId) {
          return 'Không thể tự xin bài của chính mình';
        }
        const target = state.players[action.targetPlayerId];
        if (!target || !target.alive) {
          return 'Mục tiêu không tồn tại hoặc đã bị loại';
        }
      }

      return null;
    }

    case 'PLAY_COMBO': {
      if (state.phase !== 'TURN_PLAY') {
        return 'Không thể đánh combo ở giai đoạn hiện tại';
      }
      if (state.activePlayerId !== playerId) {
        return 'Chưa đến lượt của bạn';
      }
      if (!player) {
        return 'Không tìm thấy thông tin người chơi';
      }

      // Kiểm tra tính duy nhất của cardIds
      const uniqueIds = new Set(action.cardIds);
      if (uniqueIds.size !== action.cardIds.length) {
        return 'Các lá bài trong combo không được trùng lặp';
      }

      // Kiểm tra người chơi sở hữu đầy đủ
      for (const cardId of action.cardIds) {
        if (!player.hand.includes(cardId)) {
          return 'Bạn không sở hữu đầy đủ các lá bài trong combo';
        }
      }

      const comboCards = action.cardIds
        .map((id) => getCardById(id))
        .filter((c) => c !== undefined);

      if (comboCards.length !== action.cardIds.length) {
        return 'Dữ liệu lá bài trong combo không hợp lệ';
      }

      // Kiểm tra mục tiêu nếu có
      if (action.comboType === 'TWO_OF_A_KIND' || action.comboType === 'THREE_OF_A_KIND') {
        if (!action.targetPlayerId) {
          return 'Vui lòng chọn người chơi mục tiêu';
        }
        if (action.targetPlayerId === playerId) {
          return 'Không thể nhắm vào chính mình';
        }
        const target = state.players[action.targetPlayerId];
        if (!target || !target.alive) {
          return 'Mục tiêu không tồn tại hoặc đã bị loại';
        }
      }

      if (action.comboType === 'TWO_OF_A_KIND') {
        if (action.cardIds.length !== 2) {
          return 'Combo Đôi yêu cầu đúng 2 lá bài';
        }
        if (comboCards[0]!.code !== comboCards[1]!.code) {
          return 'Hai lá bài trong Combo Đôi phải cùng loại';
        }
        return null;
      }

      if (action.comboType === 'THREE_OF_A_KIND') {
        if (action.cardIds.length !== 3) {
          return 'Combo Bộ Ba yêu cầu đúng 3 lá bài';
        }
        const c0 = comboCards[0]!.code;
        const c1 = comboCards[1]!.code;
        const c2 = comboCards[2]!.code;
        if (c0 !== c1 || c1 !== c2) {
          return 'Ba lá bài trong Combo Bộ Ba phải cùng loại';
        }
        if (!action.requestedCardCode) {
          return 'Vui lòng chọn loại bài muốn yêu cầu';
        }
        return null;
      }

      if (action.comboType === 'FIVE_DIFFERENT') {
        if (action.cardIds.length !== 5) {
          return 'Combo 5 lá yêu cầu đúng 5 lá bài';
        }
        const distinctCodes = new Set(comboCards.map((c) => c!.code));
        if (distinctCodes.size !== 5) {
          return 'Năm lá bài trong combo phải có 5 loại hoàn toàn khác nhau';
        }
        return null;
      }

      return 'Loại combo không xác định';
    }

    case 'PLAY_NOPE': {
      if (state.phase !== 'NOPE_WINDOW') {
        return 'Hiện tại không có hành động nào để Chặn (Nope)';
      }
      if (!player || !player.hand.includes(action.cardId)) {
        return 'Bạn không sở hữu lá bài này';
      }
      const card = getCardById(action.cardId);
      if (!card || card.code !== 'NOPE') {
        return 'Lá bài này không phải là lá Chặn (Nope)';
      }
      return null;
    }

    case 'PASS_NOPE': {
      if (state.phase !== 'NOPE_WINDOW') {
        return 'Hiện tại không ở trong cửa sổ phản ứng Nope';
      }
      return null;
    }

    case 'GIVE_FAVOR_CARD': {
      if (state.phase !== 'FAVOR_GIVE' || !state.pendingState || state.pendingState.type !== 'FAVOR_GIVE') {
        return 'Không có yêu cầu xin bài nào cần xử lý';
      }
      if (state.pendingState.targetPlayerId !== playerId) {
        return 'Chỉ người bị xin bài mới có quyền đưa bài';
      }
      if (!player || !player.hand.includes(action.cardId)) {
        return 'Bạn không sở hữu lá bài này';
      }
      return null;
    }

    case 'PICK_DISCARD_CARD': {
      if (
        state.phase !== 'FIVE_DIFF_PICK' ||
        !state.pendingState ||
        state.pendingState.type !== 'FIVE_DIFF_PICK'
      ) {
        return 'Không có combo 5 lá nào đang chờ chọn bài';
      }
      if (state.pendingState.pickerId !== playerId) {
        return 'Chỉ người đánh bộ 5 lá mới có quyền chọn bài';
      }
      if (!state.discardPile.includes(action.cardId)) {
        return 'Lá bài không nằm trong chồng bài bỏ';
      }
      const card = getCardById(action.cardId);
      if (card?.code === 'EXPLODING_KITTEN') {
        return 'Không được phép lấy lá Mèo Nổ từ chồng bài bỏ';
      }
      return null;
    }

    case 'DRAW_CARD': {
      if (state.phase !== 'TURN_PLAY') {
        return 'Không thể rút bài ở giai đoạn hiện tại';
      }
      if (state.activePlayerId !== playerId) {
        return 'Chưa đến lượt của bạn';
      }
      if (state.drawDeck.length === 0) {
        return 'Chồng bài rút đã hết';
      }
      return null;
    }

    case 'DEFUSE_INSERT': {
      if (
        state.phase !== 'DEFUSE_INSERT' ||
        !state.pendingState ||
        state.pendingState.type !== 'DEFUSE_INSERT'
      ) {
        return 'Không có tình huống gỡ bom nào đang chờ xử lý';
      }
      if (state.pendingState.playerId !== playerId) {
        return 'Chỉ người vừa gỡ bom mới có quyền chèn lại Mèo Nổ';
      }
      if (!Number.isInteger(action.insertIndex)) {
        return 'Vị trí chèn bài phải là số nguyên';
      }
      if (action.insertIndex < 0 || action.insertIndex > state.drawDeck.length) {
        return `Vị trí chèn bài không hợp lệ (từ 0 đến ${state.drawDeck.length})`;
      }
      return null;
    }

    default:
      return 'Hành động không xác định';
  }
}
