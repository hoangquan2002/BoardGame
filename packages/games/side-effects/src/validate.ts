import { getDrugDef } from './deck.js';
import { canEpisode, canGiveDisorder, canTherapy, canTreat } from './targets.js';
import {
  type SEAction,
  type SEState,
  SYSTEM_PLAYER_ID,
} from './types.js';

export function validateSideEffects(
  state: SEState,
  playerId: string,
  action: SEAction,
): string | null {
  if (state.winner !== null) {
    return 'Ván chơi đã kết thúc';
  }

  // System player actions
  if (playerId === SYSTEM_PLAYER_ID) {
    if (action.type !== 'CHOICE_TIMEOUT') {
      return 'Hệ thống chỉ có thể kích hoạt CHOICE_TIMEOUT';
    }
    if (!state.pendingChoice) {
      return 'Không có lựa chọn nào đang chờ giải quyết';
    }
    if (state.pendingChoice.type !== 'TREMORS_DISCARD') {
      return 'Lựa chọn hiện tại không hỗ trợ hết giờ';
    }
    return null;
  }

  // Prevent non-system players from triggering CHOICE_TIMEOUT
  if (action.type === 'CHOICE_TIMEOUT') {
    return 'Chỉ hệ thống mới có thể kích hoạt hành động này';
  }

  // If there is a pending choice, only the chosen player can act and must send RESOLVE_CHOICE
  if (state.pendingChoice !== null) {
    const choice = state.pendingChoice;
    if (action.type !== 'RESOLVE_CHOICE') {
      return 'Đang chờ người chơi giải quyết lựa chọn của hình phạt';
    }
    if (playerId !== choice.playerId) {
      return 'Chỉ người chơi được yêu cầu mới có thể giải quyết lựa chọn';
    }

    if (choice.type === 'ANXIETY_STEAL') {
      const cardId = action.cardId ?? action.cardIds?.[0];
      if (!cardId) {
        return 'Bạn phải chọn 1 lá bài từ tay đối thủ';
      }
      const victim = state.players.find((p) => p.id === choice.victimId);
      if (!victim) {
        return 'Không tìm thấy nạn nhân';
      }
      const hasCard = victim.hand.some((c) => c.instanceId === cardId);
      if (!hasCard) {
        return 'Lá bài được chọn không tồn tại trên tay đối thủ';
      }
      return null;
    }

    if (choice.type === 'TREMORS_DISCARD') {
      const cardIds = action.cardIds ?? (action.cardId ? [action.cardId] : []);
      if (cardIds.length !== 3) {
        return 'Bạn phải chọn đúng 3 lá bài trên tay để bỏ';
      }
      if (new Set(cardIds).size !== 3) {
        return 'Danh sách lá bài bỏ không được trùng lặp';
      }
      const victim = state.players.find((p) => p.id === playerId);
      if (!victim) {
        return 'Không tìm thấy người chơi';
      }
      const allExist = cardIds.every((id) => victim.hand.some((c) => c.instanceId === id));
      if (!allExist) {
        return 'Một số lá bài không tồn tại trên tay của bạn';
      }
      return null;
    }

    return null;
  }

  // When no pending choice, RESOLVE_CHOICE is invalid
  if (action.type === 'RESOLVE_CHOICE') {
    return 'Không có lựa chọn nào đang chờ giải quyết';
  }

  // Trade actions can be performed at any time, even out of turn
  if (
    action.type === 'PROPOSE_TRADE' ||
    action.type === 'RESPOND_TRADE' ||
    action.type === 'CONFIRM_TRADE' ||
    action.type === 'CANCEL_TRADE'
  ) {
    return validateTradeAction(state, playerId, action);
  }

  // Turn-based actions
  if (state.activePlayerId !== playerId) {
    return 'Chưa đến lượt của bạn';
  }

  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return 'Không tìm thấy người chơi trong ván';
  }

  switch (action.type) {
    case 'TREAT': {
      if (state.preventPlayCards) {
        return 'Bạn đang bị Liệt dương, không thể đánh bài trong lượt này';
      }
      if (state.cardsPlayedThisTurn >= 2) {
        return 'Bạn đã đánh tối đa 2 lá trong lượt này';
      }
      const drugCard = player.hand.find((c) => c.instanceId === action.drugId);
      if (!drugCard) {
        return 'Lá Thuốc không tồn tại trên tay của bạn';
      }
      if (drugCard.type !== 'drug') {
        return 'Lá bài được chọn không phải là Thuốc';
      }
      const drugDef = getDrugDef(drugCard.cardId);
      if (!drugDef) {
        return 'Dữ liệu Thuốc không hợp lệ';
      }
      const slot = player.psyche.find((s) => s.disorder.instanceId === action.disorderId);
      if (!slot) {
        return 'Bệnh Lý không tồn tại trong Thể Trạng của bạn';
      }
      if (!canTreat(slot, drugCard.cardId)) {
        if (slot.drug !== null) {
          return 'Bệnh Lý này đã được điều trị';
        }
        return 'Thuốc này không điều trị loại Bệnh Lý được chọn';
      }
      return null;
    }

    case 'THERAPY': {
      if (state.preventPlayCards) {
        return 'Bạn đang bị Liệt dương, không thể đánh bài trong lượt này';
      }
      if (state.cardsPlayedThisTurn >= 2) {
        return 'Bạn đã đánh tối đa 2 lá trong lượt này';
      }
      const therapyCard = player.hand.find((c) => c.instanceId === action.therapyId);
      if (!therapyCard) {
        return 'Lá Liệu Pháp không tồn tại trên tay của bạn';
      }
      if (therapyCard.type !== 'therapy') {
        return 'Lá bài được chọn không phải là Liệu Pháp';
      }
      const slot = player.psyche.find((s) => s.disorder.instanceId === action.disorderId);
      if (!slot) {
        return 'Bệnh Lý không tồn tại trong Thể Trạng của bạn';
      }
      if (!canTherapy(slot)) {
        return 'Chứng run miễn nhiễm với Liệu Pháp';
      }
      return null;
    }

    case 'GIVE_DISORDER': {
      if (state.preventPlayCards) {
        return 'Bạn đang bị Liệt dương, không thể đánh bài trong lượt này';
      }
      if (state.cardsPlayedThisTurn >= 2) {
        return 'Bạn đã đánh tối đa 2 lá trong lượt này';
      }
      if (action.targetPlayerId === playerId) {
        return 'Không thể đưa Bệnh Lý cho chính mình';
      }
      const target = state.players.find((p) => p.id === action.targetPlayerId);
      if (!target) {
        return 'Không tìm thấy người nhận Bệnh Lý';
      }
      const disorderCard = player.hand.find((c) => c.instanceId === action.disorderCardId);
      if (!disorderCard) {
        return 'Lá Bệnh Lý không tồn tại trên tay của bạn';
      }
      if (disorderCard.type !== 'disorder') {
        return 'Lá bài được chọn không phải là Bệnh Lý';
      }
      if (!canGiveDisorder(target.psyche, disorderCard.cardId)) {
        const alreadyHas = target.psyche.some(
          (s) => s.disorder.cardId === disorderCard.cardId,
        );
        if (alreadyHas) {
          return 'Người nhận đã có Bệnh Lý này trong Thể Trạng';
        }
        return 'Người nhận không dùng loại Thuốc nào có tác dụng phụ gây ra Bệnh Lý này';
      }
      return null;
    }

    case 'EPISODE': {
      if (state.preventPlayCards) {
        return 'Bạn đang bị Liệt dương, không thể đánh bài trong lượt này';
      }
      if (state.cardsPlayedThisTurn >= 2) {
        return 'Bạn đã đánh tối đa 2 lá trong lượt này';
      }
      if (action.targetPlayerId === playerId) {
        return 'Không thể đánh Triệu Chứng vào chính mình';
      }
      const target = state.players.find((p) => p.id === action.targetPlayerId);
      if (!target) {
        return 'Không tìm thấy đối thủ mục tiêu';
      }
      const episodeCard = player.hand.find((c) => c.instanceId === action.episodeId);
      if (!episodeCard) {
        return 'Lá Triệu Chứng không tồn tại trên tay của bạn';
      }
      if (episodeCard.type !== 'episode') {
        return 'Lá bài được chọn không phải là Triệu Chứng';
      }
      const slot = target.psyche.find((s) => s.disorder.instanceId === action.disorderId);
      if (!slot) {
        return 'Bệnh Lý không tồn tại trong Thể Trạng của đối thủ';
      }
      if (!canEpisode(slot)) {
        return 'Không thể đánh Triệu Chứng vào Bệnh Lý đã được điều trị';
      }
      return null;
    }

    case 'DISCARD': {
      if (player.hand.length <= 6) {
        return 'Bạn chỉ có thể bỏ bài khi có nhiều hơn 6 lá trên tay';
      }
      const neededCount = player.hand.length - 6;
      if (action.cardIds.length !== neededCount) {
        return `Bạn phải bỏ chính xác ${neededCount} lá bài để còn lại 6 lá trên tay`;
      }
      if (new Set(action.cardIds).size !== action.cardIds.length) {
        return 'Danh sách lá bài bỏ không được trùng lặp';
      }
      const allExist = action.cardIds.every((id) =>
        player.hand.some((c) => c.instanceId === id),
      );
      if (!allExist) {
        return 'Một số lá bài không tồn tại trên tay của bạn';
      }
      return null;
    }

    case 'END_TURN': {
      if (player.hand.length > 6) {
        return 'Bạn phải bỏ bớt bài trên tay xuống còn 6 lá trước khi kết thúc lượt';
      }
      return null;
    }
  }
}

function validateTradeAction(
  state: SEState,
  playerId: string,
  action: Extract<
    SEAction,
    { type: 'PROPOSE_TRADE' | 'RESPOND_TRADE' | 'CONFIRM_TRADE' | 'CANCEL_TRADE' }
  >,
): string | null {
  switch (action.type) {
    case 'PROPOSE_TRADE': {
      if (action.targetPlayerId === playerId) {
        return 'Không thể giao dịch với chính mình';
      }
      const proposer = state.players.find((p) => p.id === playerId);
      const target = state.players.find((p) => p.id === action.targetPlayerId);
      if (!proposer || !target) {
        return 'Không tìm thấy người chơi tham gia giao dịch';
      }
      const hasOpenTrade = state.trades.some(
        (t) =>
          t.proposerId === playerId ||
          t.targetPlayerId === playerId ||
          t.proposerId === action.targetPlayerId ||
          t.targetPlayerId === action.targetPlayerId,
      );
      if (hasOpenTrade) {
        return 'Mỗi người chơi chỉ có thể tham gia tối đa 1 giao dịch đang mở';
      }
      if (new Set(action.offerCardIds).size !== action.offerCardIds.length) {
        return 'Các lá bài đề xuất không được trùng lặp';
      }
      const allExist = action.offerCardIds.every((id) =>
        proposer.hand.some((c) => c.instanceId === id),
      );
      if (!allExist) {
        return 'Một số lá bài đề xuất không còn trên tay của bạn';
      }
      return null;
    }

    case 'RESPOND_TRADE': {
      const trade = state.trades.find((t) => t.tradeId === action.tradeId);
      if (!trade) {
        return 'Giao dịch không tồn tại';
      }
      if (trade.status !== 'PROPOSED') {
        return 'Giao dịch không ở trạng thái chờ phản hồi';
      }
      if (trade.targetPlayerId !== playerId) {
        return 'Chỉ người nhận lời đề nghị mới có thể phản hồi giao dịch';
      }
      if (!action.accept) {
        return null;
      }
      const giveCardIds = action.giveCardIds ?? [];
      if (new Set(giveCardIds).size !== giveCardIds.length) {
        return 'Các lá bài đưa ra không được trùng lặp';
      }
      const target = state.players.find((p) => p.id === playerId)!;
      const allExist = giveCardIds.every((id) =>
        target.hand.some((c) => c.instanceId === id),
      );
      if (!allExist) {
        return 'Một số lá bài đưa ra không tồn tại trên tay của bạn';
      }
      const proposer = state.players.find((p) => p.id === trade.proposerId)!;
      const proposerCardsExist = trade.offerCardIds.every((id) =>
        proposer.hand.some((c) => c.instanceId === id),
      );
      if (!proposerCardsExist) {
        return 'Một số lá bài của người đề xuất không còn trên tay';
      }
      return null;
    }

    case 'CONFIRM_TRADE': {
      const trade = state.trades.find((t) => t.tradeId === action.tradeId);
      if (!trade) {
        return 'Giao dịch không tồn tại';
      }
      if (trade.status !== 'RESPONDED') {
        return 'Giao dịch chưa được người nhận phản hồi';
      }
      if (trade.proposerId !== playerId) {
        return 'Chỉ người khởi tạo giao dịch mới có thể xác nhận';
      }
      if (!action.accept) {
        return null;
      }
      const proposer = state.players.find((p) => p.id === trade.proposerId)!;
      const target = state.players.find((p) => p.id === trade.targetPlayerId)!;
      const pExist = trade.offerCardIds.every((id) =>
        proposer.hand.some((c) => c.instanceId === id),
      );
      const tExist = (trade.giveCardIds ?? []).every((id) =>
        target.hand.some((c) => c.instanceId === id),
      );
      if (!pExist || !tExist) {
        return 'Một số lá bài trong giao dịch không còn trên tay người chơi';
      }
      return null;
    }

    case 'CANCEL_TRADE': {
      const trade = state.trades.find((t) => t.tradeId === action.tradeId);
      if (!trade) {
        return 'Giao dịch không tồn tại';
      }
      if (trade.proposerId !== playerId && trade.targetPlayerId !== playerId) {
        return 'Bạn không có quyền huỷ giao dịch này';
      }
      return null;
    }
  }
}
