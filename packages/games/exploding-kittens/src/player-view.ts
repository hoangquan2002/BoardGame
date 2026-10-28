import { getCardById, getCardsByIds } from './deck.js';
import type {
  EKOpponentView,
  EKPendingDefuseInsert,
  EKPendingFavorGive,
  EKPendingFiveDiffPick,
  EKPendingNopeWindow,
  EKPlayerView,
  EKState,
} from './types.js';

export function createPlayerView(state: EKState, playerId: string): EKPlayerView {
  const me = state.players[playerId];
  const alive = me?.alive ?? false;

  const opponents: EKOpponentView[] = state.playerOrder
    .filter((id) => id !== playerId)
    .map((id) => {
      const opp = state.players[id];
      const hasPassedNope =
        state.phase === 'NOPE_WINDOW' &&
        state.pendingState?.type === 'NOPE_WINDOW' &&
        state.pendingState.passedPlayerIds.includes(id);

      return {
        id,
        handCount: opp ? opp.hand.length : 0,
        alive: opp ? opp.alive : false,
        hasPassedNope,
      };
    });

  const topDiscardId = state.discardPile[state.discardPile.length - 1];
  const topDiscard = topDiscardId ? getCardById(topDiscardId) ?? null : null;

  // Tính số Mèo Nổ còn lại trong chồng rút
  let remainingKittens = state.drawDeck.filter(
    (id) => getCardById(id)?.code === 'EXPLODING_KITTEN'
  ).length;

  if (
    state.phase === 'DEFUSE_INSERT' &&
    state.pendingState?.type === 'DEFUSE_INSERT'
  ) {
    remainingKittens += 1;
  }

  const drawDeckCount = state.drawDeck.length;
  const explosionRiskPercent =
    drawDeckCount > 0
      ? Math.min(100, Math.round((remainingKittens / drawDeckCount) * 100))
      : 0;

  // Nope window
  let nopeWindow: EKPlayerView['nopeWindow'] = null;
  if (state.phase === 'NOPE_WINDOW' && state.pendingState?.type === 'NOPE_WINDOW') {
    const pw = state.pendingState as EKPendingNopeWindow;
    let targetCard = null;
    let actionNameVi = '';
    let comboType = null;

    if (pw.originalAction.type === 'PLAY_ACTION_CARD') {
      targetCard = getCardById(pw.originalAction.cardId) ?? null;
      actionNameVi = targetCard ? `${targetCard.nameEn} (${targetCard.nameVi})` : 'Lá bài hành động';
    } else if (pw.originalAction.type === 'PLAY_COMBO') {
      comboType = pw.originalAction.comboType;
      const firstCard = getCardById(pw.originalAction.cardIds[0]);
      if (comboType === 'TWO_OF_A_KIND') {
        actionNameVi = `Combo 2 lá giống nhau (${firstCard ? firstCard.nameEn : 'Cặp lá'})`;
      } else if (comboType === 'THREE_OF_A_KIND') {
        actionNameVi = `Combo 3 lá giống nhau (${firstCard ? firstCard.nameEn : 'Bộ 3 lá'})`;
      } else if (comboType === 'FIVE_DIFFERENT') {
        actionNameVi = 'Combo 5 lá khác nhau';
      }
    }

    nopeWindow = {
      isOpen: true,
      originalActionType: pw.originalAction.type,
      originalPlayerId: pw.originalPlayerId,
      targetCard,
      actionNameVi,
      comboType,
      isCurrentlyNoped: pw.nopeCount % 2 !== 0,
      nopeCount: pw.nopeCount,
      secondsRemaining: pw.timeoutSeconds,
      hasPassed: pw.passedPlayerIds.includes(playerId),
    };
  }

  // Favor prompt
  let favorPrompt: EKPlayerView['favorPrompt'] = null;
  if (state.phase === 'FAVOR_GIVE' && state.pendingState?.type === 'FAVOR_GIVE') {
    const pf = state.pendingState as EKPendingFavorGive;
    favorPrompt = {
      isTarget: pf.targetPlayerId === playerId,
      proposerId: pf.proposerId,
    };
  }

  // Five diff prompt
  let fiveDiffPrompt: EKPlayerView['fiveDiffPrompt'] = null;
  if (state.phase === 'FIVE_DIFF_PICK' && state.pendingState?.type === 'FIVE_DIFF_PICK') {
    const p5 = state.pendingState as EKPendingFiveDiffPick;
    fiveDiffPrompt = {
      isPicker: p5.pickerId === playerId,
      selectableCardIds: state.discardPile.filter(
        (id) => getCardById(id)?.code !== 'EXPLODING_KITTEN'
      ),
    };
  }

  // Defuse prompt
  let defusePrompt: EKPlayerView['defusePrompt'] = null;
  if (state.phase === 'DEFUSE_INSERT' && state.pendingState?.type === 'DEFUSE_INSERT') {
    const pd = state.pendingState as EKPendingDefuseInsert;
    defusePrompt = {
      mustDefuse: pd.playerId === playerId,
      maxIndex: state.drawDeck.length,
    };
  }

  // Known top cards (chỉ gửi cho người vừa đánh See the Future)
  let knownTopCards: EKPlayerView['knownTopCards'] = null;
  if (state.seeTheFutureState && state.seeTheFutureState.playerId === playerId) {
    knownTopCards = getCardsByIds(state.seeTheFutureState.cardIds);
  }

  return {
    myId: playerId,
    phase: state.phase,
    activePlayerId: state.activePlayerId,
    turnsRemaining: state.turnsRemaining,
    alive,
    myHand: getCardsByIds(me?.hand ?? []),
    opponents,
    drawDeckCount,
    topDiscard,
    discardPileCount: state.discardPile.length,
    discardPile: getCardsByIds(state.discardPile),
    nopeWindow,
    favorPrompt,
    fiveDiffPrompt,
    defusePrompt,
    knownTopCards,
    remainingKittens,
    explosionRiskPercent,
    winner: state.winner,
    turnCount: state.turnCount,
    lastActionDescriptionVi: state.lastActionDescriptionVi,
  };
}
