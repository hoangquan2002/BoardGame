import type { Rng } from '@boardgame/core';
import { getCardById, getCardCodeNameVi } from './deck.js';
import {
  EK_MAX_RECENT_EVENTS,
  type EKAction,
  type EKInternalEvent,
  type EKPendingDefuseInsert,
  type EKPendingFavorGive,
  type EKPendingFiveDiffPick,
  type EKPendingNopeWindow,
  type EKPlayerState,
  type EKState,
  NOPE_TIMEOUT_SECONDS,
} from './types.js';

function pushEKEvent(state: EKState, event: Omit<EKInternalEvent, 'seq'>): void {
  const seq = state.nextEventSeq ?? 1;
  state.nextEventSeq = seq + 1;
  const nextEvents = state.events ? [...state.events, { ...event, seq }] : [{ ...event, seq }];
  state.events =
    nextEvents.length > EK_MAX_RECENT_EVENTS
      ? nextEvents.slice(-EK_MAX_RECENT_EVENTS)
      : nextEvents;
}

export function getNextAlivePlayerId(
  order: string[],
  players: Record<string, EKPlayerState>,
  currentId: string
): string {
  const currentIndex = order.indexOf(currentId);
  const n = order.length;
  for (let i = 1; i < n; i++) {
    const pid = order[(currentIndex + i) % n]!;
    if (players[pid]?.alive) {
      return pid;
    }
  }
  return currentId;
}

function checkWinner(state: EKState): void {
  const alivePlayers = state.playerOrder.filter((pid) => state.players[pid]?.alive);
  if (alivePlayers.length <= 1) {
    state.winner = alivePlayers[0] ?? null;
    state.phase = 'GAME_OVER';
  }
}

function shouldAutoResolveNope(state: EKState): boolean {
  if (!state.pendingState || state.pendingState.type !== 'NOPE_WINDOW') return false;
  const passedSet = new Set(state.pendingState.passedPlayerIds);

  const potentialNopers = state.playerOrder.filter((pid) => {
    const p = state.players[pid];
    if (!p || !p.alive) return false;
    return p.hand.some((cid) => getCardById(cid)?.code === 'NOPE');
  });

  if (potentialNopers.length === 0) return true;
  return potentialNopers.every((pid) => passedSet.has(pid));
}

function resolveNopeWindow(next: EKState, rng: Rng, wasAfterNopeWindow: boolean): void {
  if (!next.pendingState || next.pendingState.type !== 'NOPE_WINDOW') return;
  const { originalPlayerId, originalAction, nopeCount } = next.pendingState as EKPendingNopeWindow;
  const isNoped = nopeCount % 2 !== 0;
  next.pendingState = null;

  const actionCardId =
    originalAction.type === 'PLAY_ACTION_CARD'
      ? originalAction.cardId
      : originalAction.type === 'PLAY_COMBO'
        ? originalAction.cardIds[0]
        : undefined;
  const comboType = originalAction.type === 'PLAY_COMBO' ? originalAction.comboType : undefined;

  if (isNoped) {
    next.phase = 'TURN_PLAY';
    next.lastActionDescriptionVi = `Hành động của ${originalPlayerId} đã bị Chặn thành công (Noped)!`;
    pushEKEvent(next, {
      type: 'ACTION_NOPED',
      actorId: originalPlayerId,
      cardId: actionCardId,
      comboType,
      nopeCount,
      wasAfterNopeWindow: true,
    });
    return;
  }

  // Hành động gốc được thực thi
  if (originalAction.type === 'PLAY_ACTION_CARD') {
    const card = getCardById(originalAction.cardId);
    if (!card) {
      next.phase = 'TURN_PLAY';
      return;
    }

    if (card.code === 'ATTACK') {
      // Luật cộng dồn Attack: nếu đang nợ k lượt (k > 1), người sau chịu k + 2 lượt; nếu k = 1, người sau chịu 2 lượt
      const turnsForNext = (next.turnsRemaining > 1 ? next.turnsRemaining : 0) + 2;
      const nextPlayerId = getNextAlivePlayerId(next.playerOrder, next.players, next.activePlayerId);
      next.activePlayerId = nextPlayerId;
      next.turnsRemaining = turnsForNext;
      next.turnCount += 1;
      next.phase = 'TURN_PLAY';
      next.lastActionDescriptionVi = `${originalPlayerId} tấn công! ${nextPlayerId} phải đi ${turnsForNext} lượt.`;
      pushEKEvent(next, {
        type: 'ATTACK_RESOLVED',
        actorId: originalPlayerId,
        targetId: nextPlayerId,
        cardId: card.id,
        turnsCount: turnsForNext,
        wasAfterNopeWindow,
      });
      return;
    }

    if (card.code === 'SKIP') {
      next.turnsRemaining -= 1;
      if (next.turnsRemaining > 0) {
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${originalPlayerId} đã bỏ 1 lượt (còn lại ${next.turnsRemaining} lượt).`;
        pushEKEvent(next, {
          type: 'SKIP_RESOLVED',
          actorId: originalPlayerId,
          cardId: card.id,
          turnsCount: next.turnsRemaining,
          wasAfterNopeWindow,
        });
      } else {
        const nextPlayerId = getNextAlivePlayerId(next.playerOrder, next.players, next.activePlayerId);
        next.activePlayerId = nextPlayerId;
        next.turnsRemaining = 1;
        next.turnCount += 1;
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${originalPlayerId} đã bỏ lượt. Đến lượt ${nextPlayerId}.`;
        pushEKEvent(next, {
          type: 'SKIP_RESOLVED',
          actorId: originalPlayerId,
          targetId: nextPlayerId,
          cardId: card.id,
          turnsCount: 0,
          wasAfterNopeWindow,
        });
      }
      return;
    }

    if (card.code === 'SHUFFLE') {
      next.drawDeck = rng.shuffle(next.drawDeck);
      next.seeTheFutureState = null;
      next.phase = 'TURN_PLAY';
      next.lastActionDescriptionVi = `${originalPlayerId} đã xáo trộn chồng bài rút!`;
      pushEKEvent(next, {
        type: 'SHUFFLE_RESOLVED',
        actorId: originalPlayerId,
        cardId: card.id,
        wasAfterNopeWindow,
      });
      return;
    }

    if (card.code === 'SEE_THE_FUTURE') {
      const topCards = next.drawDeck.slice(0, 3);
      next.seeTheFutureState = {
        playerId: originalPlayerId,
        cardIds: topCards,
      };
      next.phase = 'TURN_PLAY';
      next.lastActionDescriptionVi = `${originalPlayerId} đã nhìn trước tương lai 3 lá bài!`;
      pushEKEvent(next, {
        type: 'SEE_FUTURE_RESOLVED',
        actorId: originalPlayerId,
        cardId: card.id,
        wasAfterNopeWindow,
      });
      return;
    }

    if (card.code === 'FAVOR') {
      const target = next.players[originalAction.targetPlayerId!];
      if (!target || target.hand.length === 0) {
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${originalAction.targetPlayerId} không có bài trên tay, ${originalPlayerId} không nhận được gì.`;
        pushEKEvent(next, {
          type: 'FAVOR_EMPTY',
          actorId: originalPlayerId,
          targetId: originalAction.targetPlayerId,
          cardId: card.id,
          wasAfterNopeWindow,
        });
        return;
      }

      next.phase = 'FAVOR_GIVE';
      next.pendingState = {
        type: 'FAVOR_GIVE',
        proposerId: originalPlayerId,
        targetPlayerId: originalAction.targetPlayerId!,
      };
      next.lastActionDescriptionVi = `Chờ ${originalAction.targetPlayerId} chọn 1 lá bài đưa cho ${originalPlayerId}.`;
      pushEKEvent(next, {
        type: 'FAVOR_REQUESTED',
        actorId: originalPlayerId,
        targetId: originalAction.targetPlayerId,
        cardId: card.id,
        wasAfterNopeWindow,
      });
      return;
    }
  }

  if (originalAction.type === 'PLAY_COMBO') {
    if (originalAction.comboType === 'TWO_OF_A_KIND') {
      const target = next.players[originalAction.targetPlayerId];
      if (!target || target.hand.length === 0) {
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${originalAction.targetPlayerId} không có bài trên tay để rút.`;
        pushEKEvent(next, {
          type: 'COMBO_2_RESOLVED',
          actorId: originalPlayerId,
          targetId: originalAction.targetPlayerId,
          cardId: actionCardId,
          comboType: 'TWO_OF_A_KIND',
          success: false,
          wasAfterNopeWindow,
        });
        return;
      }

      const randomIndex = rng.int(target.hand.length);
      const [stolenCardId] = target.hand.splice(randomIndex, 1);
      if (stolenCardId) {
        next.players[originalPlayerId]!.hand.push(stolenCardId);
      }
      next.phase = 'TURN_PLAY';
      next.lastActionDescriptionVi = `${originalPlayerId} đã rút mù 1 lá bài từ ${originalAction.targetPlayerId}.`;
      pushEKEvent(next, {
        type: 'COMBO_2_RESOLVED',
        actorId: originalPlayerId,
        targetId: originalAction.targetPlayerId,
        cardId: actionCardId,
        comboType: 'TWO_OF_A_KIND',
        success: Boolean(stolenCardId),
        participantCardId: stolenCardId,
        wasAfterNopeWindow,
      });
      return;
    }

    if (originalAction.comboType === 'THREE_OF_A_KIND') {
      const target = next.players[originalAction.targetPlayerId];
      const foundIndex = target
        ? target.hand.findIndex((id) => getCardById(id)?.code === originalAction.requestedCardCode)
        : -1;

      if (target && foundIndex !== -1) {
        const [stolenCardId] = target.hand.splice(foundIndex, 1);
        if (stolenCardId) {
          next.players[originalPlayerId]!.hand.push(stolenCardId);
        }
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${originalPlayerId} đã xin thành công lá ${getCardCodeNameVi(originalAction.requestedCardCode)} từ ${originalAction.targetPlayerId}!`;
        pushEKEvent(next, {
          type: 'COMBO_3_RESOLVED',
          actorId: originalPlayerId,
          targetId: originalAction.targetPlayerId,
          cardId: actionCardId,
          comboType: 'THREE_OF_A_KIND',
          requestedCardCode: originalAction.requestedCardCode,
          success: true,
          participantCardId: stolenCardId,
          wasAfterNopeWindow,
        });
      } else {
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${originalAction.targetPlayerId} không có lá ${getCardCodeNameVi(originalAction.requestedCardCode)}. ${originalPlayerId} không nhận được gì!`;
        pushEKEvent(next, {
          type: 'COMBO_3_RESOLVED',
          actorId: originalPlayerId,
          targetId: originalAction.targetPlayerId,
          cardId: actionCardId,
          comboType: 'THREE_OF_A_KIND',
          requestedCardCode: originalAction.requestedCardCode,
          success: false,
          wasAfterNopeWindow,
        });
      }
      return;
    }

    if (originalAction.comboType === 'FIVE_DIFFERENT') {
      const selectableCards = next.discardPile.filter(
        (id) => getCardById(id)?.code !== 'EXPLODING_KITTEN'
      );
      if (selectableCards.length === 0) {
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = 'Không có lá bài hợp lệ trong chồng bài bỏ để lấy.';
        pushEKEvent(next, {
          type: 'COMBO_5_PROMPT',
          actorId: originalPlayerId,
          cardId: actionCardId,
          comboType: 'FIVE_DIFFERENT',
          success: false,
          wasAfterNopeWindow,
        });
        return;
      }

      next.phase = 'FIVE_DIFF_PICK';
      next.pendingState = {
        type: 'FIVE_DIFF_PICK',
        pickerId: originalPlayerId,
      };
      next.lastActionDescriptionVi = `Chờ ${originalPlayerId} chọn 1 lá bài từ chồng bài bỏ.`;
      pushEKEvent(next, {
        type: 'COMBO_5_PROMPT',
        actorId: originalPlayerId,
        cardId: actionCardId,
        comboType: 'FIVE_DIFFERENT',
        success: true,
        wasAfterNopeWindow,
      });
      return;
    }
  }

  next.phase = 'TURN_PLAY';
}

export function applyGame(
  state: EKState,
  playerId: string,
  action: EKAction,
  rng: Rng
): EKState {
  const next: EKState = structuredClone(state);
  const player = next.players[playerId];

  switch (action.type) {
    case 'PLAY_ACTION_CARD': {
      if (!player) return next;
      const cardIndex = player.hand.indexOf(action.cardId);
      if (cardIndex !== -1) {
        player.hand.splice(cardIndex, 1);
        next.discardPile.push(action.cardId);
      }

      const card = getCardById(action.cardId);
      next.phase = 'NOPE_WINDOW';
      next.pendingState = {
        type: 'NOPE_WINDOW',
        originalPlayerId: playerId,
        originalAction: action,
        nopeCount: 0,
        passedPlayerIds: [],
        timeoutSeconds: NOPE_TIMEOUT_SECONDS,
      };
      next.lastActionDescriptionVi = `${playerId} đánh lá ${card?.nameVi ?? action.cardId}. Đang chờ phản ứng...`;

      // Kiểm tra nếu trên bàn không ai có lá Nope thì tự động resolve
      if (shouldAutoResolveNope(next)) {
        resolveNopeWindow(next, rng, false);
      } else {
        pushEKEvent(next, {
          type: 'ACTION_PENDING_NOPE',
          actorId: playerId,
          targetId: action.targetPlayerId,
          cardId: action.cardId,
        });
      }
      break;
    }

    case 'PLAY_COMBO': {
      if (!player) return next;
      for (const cid of action.cardIds) {
        const idx = player.hand.indexOf(cid);
        if (idx !== -1) {
          player.hand.splice(idx, 1);
          next.discardPile.push(cid);
        }
      }

      next.phase = 'NOPE_WINDOW';
      next.pendingState = {
        type: 'NOPE_WINDOW',
        originalPlayerId: playerId,
        originalAction: action,
        nopeCount: 0,
        passedPlayerIds: [],
        timeoutSeconds: NOPE_TIMEOUT_SECONDS,
      };

      if (action.comboType === 'TWO_OF_A_KIND') {
        next.lastActionDescriptionVi = `${playerId} đánh Combo Đôi nhằm vào ${action.targetPlayerId}. Đang chờ phản ứng...`;
      } else if (action.comboType === 'THREE_OF_A_KIND') {
        next.lastActionDescriptionVi = `${playerId} đánh Combo Bộ Ba xin lá ${getCardCodeNameVi(action.requestedCardCode)} từ ${action.targetPlayerId}. Đang chờ phản ứng...`;
      } else if (action.comboType === 'FIVE_DIFFERENT') {
        next.lastActionDescriptionVi = `${playerId} đánh Combo 5 lá khác nhau. Đang chờ phản ứng...`;
      }

      if (shouldAutoResolveNope(next)) {
        resolveNopeWindow(next, rng, false);
      } else {
        pushEKEvent(next, {
          type: 'ACTION_PENDING_NOPE',
          actorId: playerId,
          targetId: 'targetPlayerId' in action ? action.targetPlayerId : undefined,
          cardId: action.cardIds[0],
          comboType: action.comboType,
          requestedCardCode:
            action.comboType === 'THREE_OF_A_KIND' ? action.requestedCardCode : undefined,
        });
      }
      break;
    }

    case 'PLAY_NOPE': {
      if (!player) return next;
      const cardIndex = player.hand.indexOf(action.cardId);
      if (cardIndex !== -1) {
        player.hand.splice(cardIndex, 1);
        next.discardPile.push(action.cardId);
      }

      if (next.pendingState && next.pendingState.type === 'NOPE_WINDOW') {
        const targetOriginalId = next.pendingState.originalPlayerId;
        next.pendingState.nopeCount += 1;
        next.pendingState.passedPlayerIds = [];
        next.pendingState.timeoutSeconds = NOPE_TIMEOUT_SECONDS;
        const isNoped = next.pendingState.nopeCount % 2 !== 0;
        next.lastActionDescriptionVi = `${playerId} đánh lá Chặn (Nope)! (Tổng Nope: ${next.pendingState.nopeCount} -> ${isNoped ? 'Bị chặn' : 'Thực thi'})`;

        pushEKEvent(next, {
          type: 'NOPE_PLAYED',
          actorId: playerId,
          targetId: targetOriginalId,
          cardId: action.cardId,
          nopeCount: next.pendingState.nopeCount,
          isCurrentlyNoped: isNoped,
        });

        if (shouldAutoResolveNope(next)) {
          resolveNopeWindow(next, rng, true);
        }
      }
      break;
    }

    case 'PASS_NOPE': {
      if (next.pendingState && next.pendingState.type === 'NOPE_WINDOW') {
        if (!next.pendingState.passedPlayerIds.includes(playerId)) {
          next.pendingState.passedPlayerIds.push(playerId);
        }
        if (shouldAutoResolveNope(next)) {
          resolveNopeWindow(next, rng, true);
        }
      }
      break;
    }

    case 'RESOLVE_NOPE_WINDOW': {
      resolveNopeWindow(next, rng, true);
      break;
    }

    case 'GIVE_FAVOR_CARD': {
      if (!player || !next.pendingState || next.pendingState.type !== 'FAVOR_GIVE') return next;
      const { proposerId, targetPlayerId } = next.pendingState as EKPendingFavorGive;
      const cardIdx = player.hand.indexOf(action.cardId);
      if (cardIdx !== -1) {
        player.hand.splice(cardIdx, 1);
        next.players[proposerId]?.hand.push(action.cardId);
      }
      next.pendingState = null;
      next.phase = 'TURN_PLAY';
      next.lastActionDescriptionVi = `${targetPlayerId} đã đưa 1 lá bài cho ${proposerId}.`;
      pushEKEvent(next, {
        type: 'FAVOR_GIVEN',
        actorId: targetPlayerId,
        targetId: proposerId,
        participantCardId: action.cardId,
      });
      break;
    }

    case 'PICK_DISCARD_CARD': {
      if (!player || !next.pendingState || next.pendingState.type !== 'FIVE_DIFF_PICK') return next;
      const { pickerId } = next.pendingState as EKPendingFiveDiffPick;
      const discardIdx = next.discardPile.indexOf(action.cardId);
      if (discardIdx !== -1) {
        next.discardPile.splice(discardIdx, 1);
        next.players[pickerId]?.hand.push(action.cardId);
      }
      next.pendingState = null;
      next.phase = 'TURN_PLAY';
      next.lastActionDescriptionVi = `${pickerId} đã lấy 1 lá bài từ chồng bài bỏ về tay.`;
      pushEKEvent(next, {
        type: 'DISCARD_PICKED',
        actorId: pickerId,
        cardId: action.cardId,
      });
      break;
    }

    case 'DRAW_CARD': {
      if (!player || next.drawDeck.length === 0) return next;
      const drawnCardId = next.drawDeck.shift()!;
      next.seeTheFutureState = null;
      const card = getCardById(drawnCardId);

      if (card?.code !== 'EXPLODING_KITTEN') {
        // Rút an toàn
        player.hand.push(drawnCardId);
        next.turnsRemaining -= 1;
        if (next.turnsRemaining > 0) {
          next.phase = 'TURN_PLAY';
          next.lastActionDescriptionVi = `${playerId} rút 1 lá an toàn (vẫn còn ${next.turnsRemaining} lượt).`;
          pushEKEvent(next, {
            type: 'DRAW_SAFE',
            actorId: playerId,
            turnsCount: next.turnsRemaining,
            participantCardId: drawnCardId,
          });
        } else {
          const nextPlayerId = getNextAlivePlayerId(next.playerOrder, next.players, next.activePlayerId);
          next.activePlayerId = nextPlayerId;
          next.turnsRemaining = 1;
          next.turnCount += 1;
          next.phase = 'TURN_PLAY';
          next.lastActionDescriptionVi = `${playerId} rút bài an toàn. Đến lượt ${nextPlayerId}.`;
          pushEKEvent(next, {
            type: 'DRAW_SAFE',
            actorId: playerId,
            targetId: nextPlayerId,
            turnsCount: 0,
            participantCardId: drawnCardId,
          });
        }
      } else {
        // Rút phải Mèo Nổ!
        const defuseIndex = player.hand.findIndex((cid) => getCardById(cid)?.code === 'DEFUSE');
        if (defuseIndex !== -1) {
          // Có lá Defuse
          const [defuseCardId] = player.hand.splice(defuseIndex, 1);
          if (defuseCardId) {
            next.discardPile.push(defuseCardId);
          }
          next.phase = 'DEFUSE_INSERT';
          next.pendingState = {
            type: 'DEFUSE_INSERT',
            playerId,
            explodingKittenCardId: drawnCardId,
            defuseCardId: defuseCardId!,
          };
          next.lastActionDescriptionVi = `BÙM! ${playerId} rút phải Mèo Nổ nhưng đã dùng Defuse! Đang chọn vị trí nhét lại...`;
          pushEKEvent(next, {
            type: 'EXPLODING_DEFUSED',
            actorId: playerId,
            cardId: drawnCardId,
            secondaryCardId: defuseCardId,
          });
        } else {
          // Không có Defuse -> Bị loại!
          next.discardPile.push(...player.hand, drawnCardId);
          player.hand = [];
          player.alive = false;
          next.lastActionDescriptionVi = `💥 BÙM! ${playerId} rút phải Mèo Nổ và KHÔNG có Defuse! ${playerId} ĐÃ BỊ LOẠI!`;
          pushEKEvent(next, {
            type: 'PLAYER_EXPLODED',
            actorId: playerId,
            cardId: drawnCardId,
          });

          checkWinner(next);
          if (next.winner === null) {
            const nextPlayerId = getNextAlivePlayerId(next.playerOrder, next.players, next.activePlayerId);
            next.activePlayerId = nextPlayerId;
            next.turnsRemaining = 1;
            next.turnCount += 1;
            next.phase = 'TURN_PLAY';
          }
        }
      }
      break;
    }

    case 'DEFUSE_INSERT': {
      if (!next.pendingState || next.pendingState.type !== 'DEFUSE_INSERT') return next;
      const { playerId: pId, explodingKittenCardId } = next.pendingState as EKPendingDefuseInsert;
      next.drawDeck.splice(action.insertIndex, 0, explodingKittenCardId);
      next.seeTheFutureState = null;
      next.pendingState = null;

      next.turnsRemaining -= 1;
      if (next.turnsRemaining > 0) {
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${pId} đã nhét lại Mèo Nổ thành công! Vẫn còn phải đi tiếp ${next.turnsRemaining} lượt.`;
        pushEKEvent(next, {
          type: 'KITTEN_INSERTED',
          actorId: pId,
          turnsCount: next.turnsRemaining,
        });
      } else {
        const nextPlayerId = getNextAlivePlayerId(next.playerOrder, next.players, next.activePlayerId);
        next.activePlayerId = nextPlayerId;
        next.turnsRemaining = 1;
        next.turnCount += 1;
        next.phase = 'TURN_PLAY';
        next.lastActionDescriptionVi = `${pId} đã nhét lại Mèo Nổ thành công. Đến lượt ${nextPlayerId}.`;
        pushEKEvent(next, {
          type: 'KITTEN_INSERTED',
          actorId: pId,
          targetId: nextPlayerId,
          turnsCount: 0,
        });
      }
      break;
    }
  }

  return next;
}
