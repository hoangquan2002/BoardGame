import type { Rng } from '@boardgame/core';
import { getDisorderDef, getDisorderNameVi, getDrugNameVi } from './deck.js';
import type { CardInstance, SEAction, SEState } from './types.js';

export function getPlayerName(state: SEState, playerId: string): string {
  return state.options.playerNames?.[playerId] ?? playerId;
}

export function applySideEffects(
  state: SEState,
  playerId: string,
  action: SEAction,
  rng: Rng,
): SEState {
  const next: SEState = structuredClone(state);

  switch (action.type) {
    case 'CHOICE_TIMEOUT': {
      if (next.pendingChoice && next.pendingChoice.type === 'TREMORS_DISCARD') {
        const victim = next.players.find((p) => p.id === next.pendingChoice!.playerId)!;
        next.discardPile.push(...victim.hand);
        victim.hand = [];
        next.logs.push(
          `Hết thời gian! ${getPlayerName(next, victim.id)} mất toàn bộ bài trên tay do Chứng run.`,
        );
        next.pendingChoice = null;
        checkAndSetWinner(next);
      }
      return next;
    }

    case 'RESOLVE_CHOICE': {
      const choice = next.pendingChoice;
      if (!choice) {
        return next;
      }
      if (choice.type === 'ANXIETY_STEAL') {
        const attacker = next.players.find((p) => p.id === playerId)!;
        const victim = next.players.find((p) => p.id === choice.victimId)!;
        const cardId = action.cardId ?? action.cardIds?.[0];
        if (cardId) {
          const idx = victim.hand.findIndex((c) => c.instanceId === cardId);
          if (idx !== -1) {
            const [stolen] = victim.hand.splice(idx, 1);
            attacker.hand.push(stolen);
            next.logs.push(
              `${getPlayerName(next, attacker.id)} đã lấy 1 lá bài của ${getPlayerName(next, victim.id)}.`,
            );
          }
        }
        next.pendingChoice = null;
        checkAndSetWinner(next);
      } else if (choice.type === 'TREMORS_DISCARD') {
        const victim = next.players.find((p) => p.id === playerId)!;
        const cardIds = action.cardIds ?? (action.cardId ? [action.cardId] : []);
        for (const id of cardIds) {
          const idx = victim.hand.findIndex((c) => c.instanceId === id);
          if (idx !== -1) {
            const [discarded] = victim.hand.splice(idx, 1);
            next.discardPile.push(discarded);
          }
        }
        next.logs.push(
          `${getPlayerName(next, victim.id)} đã bỏ ${cardIds.length} lá bài do Chứng run.`,
        );
        next.pendingChoice = null;
        checkAndSetWinner(next);
      }
      return next;
    }

    case 'TREAT': {
      const player = next.players.find((p) => p.id === playerId)!;
      const drugIdx = player.hand.findIndex((c) => c.instanceId === action.drugId);
      const [drugCard] = player.hand.splice(drugIdx, 1);
      const slot = player.psyche.find((s) => s.disorder.instanceId === action.disorderId)!;
      slot.drug = drugCard;
      next.cardsPlayedThisTurn++;
      next.logs.push(
        `${getPlayerName(next, player.id)} dùng Thuốc ${getDrugNameVi(drugCard.cardId)} điều trị ${getDisorderNameVi(slot.disorder.cardId)}.`,
      );
      checkAndSetWinner(next);
      return next;
    }

    case 'THERAPY': {
      const player = next.players.find((p) => p.id === playerId)!;
      const therapyIdx = player.hand.findIndex((c) => c.instanceId === action.therapyId);
      const [therapyCard] = player.hand.splice(therapyIdx, 1);
      next.discardPile.push(therapyCard);

      const slotIdx = player.psyche.findIndex((s) => s.disorder.instanceId === action.disorderId);
      const [slot] = player.psyche.splice(slotIdx, 1);
      next.discardPile.push(slot.disorder);
      if (slot.drug !== null) {
        next.discardPile.push(slot.drug);
      }

      next.cardsPlayedThisTurn++;
      next.logs.push(
        `${getPlayerName(next, player.id)} dùng Liệu Pháp loại bỏ Bệnh Lý ${getDisorderNameVi(slot.disorder.cardId)}.`,
      );
      checkAndSetWinner(next);
      return next;
    }

    case 'GIVE_DISORDER': {
      const player = next.players.find((p) => p.id === playerId)!;
      const target = next.players.find((p) => p.id === action.targetPlayerId)!;
      const disorderIdx = player.hand.findIndex((c) => c.instanceId === action.disorderCardId);
      const [disorderCard] = player.hand.splice(disorderIdx, 1);
      target.psyche.push({ disorder: disorderCard, drug: null });
      next.cardsPlayedThisTurn++;
      next.logs.push(
        `${getPlayerName(next, player.id)} đã đưa Bệnh Lý ${getDisorderNameVi(disorderCard.cardId)} cho ${getPlayerName(next, target.id)}.`,
      );
      checkAndSetWinner(next);
      return next;
    }

    case 'EPISODE': {
      const attacker = next.players.find((p) => p.id === playerId)!;
      const target = next.players.find((p) => p.id === action.targetPlayerId)!;
      const episodeIdx = attacker.hand.findIndex((c) => c.instanceId === action.episodeId);
      const [episodeCard] = attacker.hand.splice(episodeIdx, 1);
      next.discardPile.push(episodeCard);
      next.cardsPlayedThisTurn++;

      const slot = target.psyche.find((s) => s.disorder.instanceId === action.disorderId)!;
      const disorderType = slot.disorder.cardId;
      next.logs.push(
        `${getPlayerName(next, attacker.id)} đánh Triệu Chứng vào ${getDisorderNameVi(disorderType)} của ${getPlayerName(next, target.id)}.`,
      );

      applyPunishment(next, attacker, target, disorderType, rng);
      checkAndSetWinner(next);
      return next;
    }

    case 'DISCARD': {
      const player = next.players.find((p) => p.id === playerId)!;
      for (const id of action.cardIds) {
        const idx = player.hand.findIndex((c) => c.instanceId === id);
        if (idx !== -1) {
          const [discarded] = player.hand.splice(idx, 1);
          next.discardPile.push(discarded);
        }
      }
      next.logs.push(`${getPlayerName(next, player.id)} đã bỏ ${action.cardIds.length} lá bài.`);
      return next;
    }

    case 'END_TURN': {
      advanceTurn(next, rng);
      checkAndSetWinner(next);
      return next;
    }

    case 'PROPOSE_TRADE': {
      const tradeId = `trade_${next.turnNumber}_${next.logs.length + 1}_${rng.int(100000)}`;
      next.trades.push({
        tradeId,
        proposerId: playerId,
        targetPlayerId: action.targetPlayerId,
        offerCardIds: [...action.offerCardIds],
        status: 'PROPOSED',
      });
      next.logs.push(
        `${getPlayerName(next, playerId)} đề xuất giao dịch với ${getPlayerName(next, action.targetPlayerId)}.`,
      );
      return next;
    }

    case 'RESPOND_TRADE': {
      const tradeIdx = next.trades.findIndex((t) => t.tradeId === action.tradeId);
      if (tradeIdx === -1) {
        return next;
      }
      const trade = next.trades[tradeIdx]!;
      if (!action.accept) {
        next.trades.splice(tradeIdx, 1);
        next.logs.push(
          `${getPlayerName(next, playerId)} đã từ chối giao dịch của ${getPlayerName(next, trade.proposerId)}.`,
        );
      } else {
        trade.giveCardIds = [...(action.giveCardIds ?? [])];
        trade.status = 'RESPONDED';
        next.logs.push(
          `${getPlayerName(next, playerId)} đã đồng ý đề xuất và phản hồi giao dịch với ${getPlayerName(next, trade.proposerId)}.`,
        );
      }
      return next;
    }

    case 'CONFIRM_TRADE': {
      const tradeIdx = next.trades.findIndex((t) => t.tradeId === action.tradeId);
      if (tradeIdx === -1) {
        return next;
      }
      const trade = next.trades[tradeIdx]!;
      if (!action.accept) {
        next.trades.splice(tradeIdx, 1);
        next.logs.push(
          `${getPlayerName(next, playerId)} đã huỷ giao dịch với ${getPlayerName(next, trade.targetPlayerId)}.`,
        );
      } else {
        const proposer = next.players.find((p) => p.id === trade.proposerId)!;
        const target = next.players.find((p) => p.id === trade.targetPlayerId)!;

        const offerCards: CardInstance[] = [];
        for (const id of trade.offerCardIds) {
          const idx = proposer.hand.findIndex((c) => c.instanceId === id);
          if (idx !== -1) {
            offerCards.push(...proposer.hand.splice(idx, 1));
          }
        }

        const giveCards: CardInstance[] = [];
        for (const id of trade.giveCardIds ?? []) {
          const idx = target.hand.findIndex((c) => c.instanceId === id);
          if (idx !== -1) {
            giveCards.push(...target.hand.splice(idx, 1));
          }
        }

        proposer.hand.push(...giveCards);
        target.hand.push(...offerCards);
        next.trades.splice(tradeIdx, 1);
        next.logs.push(
          `${getPlayerName(next, proposer.id)} và ${getPlayerName(next, target.id)} đã hoàn tất giao dịch.`,
        );
        checkAndSetWinner(next);
      }
      return next;
    }

    case 'CANCEL_TRADE': {
      const tradeIdx = next.trades.findIndex((t) => t.tradeId === action.tradeId);
      if (tradeIdx !== -1) {
        next.trades.splice(tradeIdx, 1);
        next.logs.push(`${getPlayerName(next, playerId)} đã huỷ giao dịch.`);
      }
      return next;
    }
  }
}

function applyPunishment(
  state: SEState,
  attacker: SEState['players'][0],
  target: SEState['players'][0],
  disorderType: string,
  rng: Rng,
): void {
  const disorderDef = getDisorderDef(disorderType);
  if (!disorderDef) {
    return;
  }
  const effect = disorderDef.punishment.effect;
  const attackerName = getPlayerName(state, attacker.id);
  const targetName = getPlayerName(state, target.id);
  const disorderNameVi = disorderDef.nameVi;

  switch (effect.type) {
    case 'ATTACKER_STEALS_CHOSEN_CARD': {
      if (target.hand.length === 0) {
        state.logs.push(`${targetName} không có bài trên tay nên ${disorderNameVi} không có tác dụng.`);
      } else {
        state.pendingChoice = {
          type: 'ANXIETY_STEAL',
          playerId: attacker.id,
          victimId: target.id,
        };
      }
      break;
    }

    case 'DISCARD_CARDS_OR_ENTIRE_HAND': {
      const count = effect.params.count;
      if (target.hand.length <= count) {
        state.discardPile.push(...target.hand);
        target.hand = [];
        state.logs.push(
          `${targetName} có không quá 3 lá nên phải bỏ toàn bộ bài trên tay do ${disorderNameVi}.`,
        );
      } else {
        state.pendingChoice = {
          type: 'TREMORS_DISCARD',
          playerId: target.id,
          attackerId: attacker.id,
          timeoutSeconds: state.options.tremorsTimeoutSeconds,
        };
      }
      break;
    }

    case 'ATTACKER_STEALS_RANDOM_CARDS': {
      const maxCount = effect.params.count;
      const count = Math.min(maxCount, target.hand.length);
      if (count > 0) {
        target.hand = rng.shuffle(target.hand);
        const stolen = target.hand.splice(0, count);
        attacker.hand.push(...stolen);
        state.logs.push(
          `${attackerName} đã lấy ngẫu nhiên ${count} lá bài từ tay ${targetName} do ${disorderNameVi}.`,
        );
      } else {
        state.logs.push(`${targetName} không có bài trên tay nên ${disorderNameVi} không có tác dụng.`);
      }
      break;
    }

    case 'DISCARD_ENTIRE_HAND': {
      state.discardPile.push(...target.hand);
      target.hand = [];
      state.logs.push(`${targetName} phải bỏ toàn bộ bài trên tay do ${disorderNameVi}.`);
      break;
    }

    case 'DISCARD_ALL_DRUGS_FROM_PSYCHE': {
      for (const s of target.psyche) {
        if (s.drug !== null) {
          state.discardPile.push(s.drug);
          s.drug = null;
        }
      }
      state.logs.push(
        `Mọi lá Thuốc trong Thể Trạng của ${targetName} bị loại bỏ do ${disorderNameVi}.`,
      );
      break;
    }

    case 'SKIP_TURN': {
      const rounds = effect.params.rounds;
      const alreadyInflicted = state.inflictedThisTurn.some(
        (i) => i.victimId === target.id && i.effectType === 'SKIP_TURN',
      );
      if (!alreadyInflicted) {
        target.skipTurns += rounds;
        state.inflictedThisTurn.push({ victimId: target.id, effectType: 'SKIP_TURN' });
        state.logs.push(`${targetName} sẽ bị mất 1 lượt tiếp theo do ${disorderNameVi}.`);
      } else {
        state.logs.push(
          `${targetName} đã bị ${disorderNameVi} trong lượt này nên không cộng dồn thêm.`,
        );
      }
      break;
    }

    case 'PREVENT_PLAY_CARDS': {
      const rounds = effect.params.rounds;
      const alreadyInflicted = state.inflictedThisTurn.some(
        (i) => i.victimId === target.id && i.effectType === 'PREVENT_PLAY_CARDS',
      );
      if (!alreadyInflicted) {
        target.preventPlayCardsTurns += rounds;
        state.inflictedThisTurn.push({
          victimId: target.id,
          effectType: 'PREVENT_PLAY_CARDS',
        });
        state.logs.push(`${targetName} sẽ không thể đánh bài ở lượt tiếp theo do ${disorderNameVi}.`);
      } else {
        state.logs.push(
          `${targetName} đã bị ${disorderNameVi} trong lượt này nên không cộng dồn thêm.`,
        );
      }
      break;
    }

    case 'PREVENT_DRAW': {
      const rounds = effect.params.rounds;
      const alreadyInflicted = state.inflictedThisTurn.some(
        (i) => i.victimId === target.id && i.effectType === 'PREVENT_DRAW',
      );
      if (!alreadyInflicted) {
        target.preventDrawTurns += rounds;
        state.inflictedThisTurn.push({ victimId: target.id, effectType: 'PREVENT_DRAW' });
        state.logs.push(
          `${targetName} sẽ không được rút bài ở lượt tiếp theo do ${disorderNameVi}.`,
        );
      } else {
        state.logs.push(
          `${targetName} đã bị ${disorderNameVi} trong lượt này nên không cộng dồn thêm.`,
        );
      }
      break;
    }
  }
}

export function drawCards(
  state: SEState,
  playerId: string,
  count: number,
  rng: Rng,
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || count <= 0) {
    return 0;
  }
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length > 0) {
        state.drawPile = rng.shuffle(state.discardPile);
        state.discardPile = [];
        state.logs.push('Chồng bài rút đã hết, xáo lại chồng bài bỏ.');
      } else {
        break;
      }
    }
    const card = state.drawPile.pop()!;
    player.hand.push(card);
    drawn++;
  }
  return drawn;
}

export function checkAndSetWinner(state: SEState): boolean {
  if (state.winner !== null) {
    return true;
  }
  for (const player of state.players) {
    const isWin = player.psyche.every((slot) => slot.drug !== null);
    if (isWin) {
      state.winner = player.id;
      state.logs.push(
        `${getPlayerName(state, player.id)} đã chữa khỏi toàn bộ Bệnh Lý và giành chiến thắng!`,
      );
      return true;
    }
  }
  return false;
}

function advanceTurn(state: SEState, rng: Rng): void {
  state.inflictedThisTurn = [];
  state.cardsPlayedThisTurn = 0;

  const n = state.playerIds.length;
  let nextIndex = (state.playerIds.indexOf(state.activePlayerId) + 1) % n;
  let attempts = 0;

  while (attempts < n * 10) {
    const nextPlayer = state.players[nextIndex]!;
    if (nextPlayer.skipTurns > 0) {
      nextPlayer.skipTurns--;
      state.logs.push(
        `${getPlayerName(state, nextPlayer.id)} bị Trầm cảm, mất lượt này.`,
      );
      nextIndex = (nextIndex + 1) % n;
      attempts++;
      continue;
    }
    break;
  }

  state.activePlayerId = state.playerIds[nextIndex]!;
  state.turnNumber++;
  const activePlayer = state.players[nextIndex]!;

  if (activePlayer.preventPlayCardsTurns > 0) {
    activePlayer.preventPlayCardsTurns--;
    state.preventPlayCards = true;
    state.logs.push(
      `${getPlayerName(state, activePlayer.id)} bị Liệt dương, không thể đánh bài trong lượt này.`,
    );
  } else {
    state.preventPlayCards = false;
  }

  if (activePlayer.preventDrawTurns > 0) {
    activePlayer.preventDrawTurns--;
    state.logs.push(
      `${getPlayerName(state, activePlayer.id)} bị Chứng biếng ăn, không được rút bài đầu lượt.`,
    );
  } else {
    const drawn = drawCards(state, activePlayer.id, 2, rng);
    state.logs.push(
      `${getPlayerName(state, activePlayer.id)} bắt đầu lượt và rút ${drawn} lá bài.`,
    );
  }
}
