import type {
  SEGameEventView,
  SEPendingChoiceView,
  SEPlayerView,
  SEPlayerViewPlayer,
  SEState,
  SETradeView,
} from './types.js';

export function createPlayerView(state: SEState, playerId: string): SEPlayerView {
  const choice = state.pendingChoice;
  const isAnxietyAttacker =
    choice?.type === 'ANXIETY_STEAL' &&
    choice.playerId === playerId;

  const players: SEPlayerViewPlayer[] = state.players.map((p) => {
    const isSelf = p.id === playerId;
    const isRevealedToMe =
      isAnxietyAttacker && choice?.type === 'ANXIETY_STEAL' && choice.victimId === p.id;

    const playerView: SEPlayerViewPlayer = {
      id: p.id,
      handCount: p.hand.length,
      psyche: structuredClone(p.psyche),
      skipTurns: p.skipTurns,
      preventPlayCardsTurns: p.preventPlayCardsTurns,
      preventDrawTurns: p.preventDrawTurns,
    };

    if (isSelf) {
      playerView.hand = structuredClone(p.hand);
    } else if (isRevealedToMe) {
      playerView.revealedHand = structuredClone(p.hand);
    }

    return playerView;
  });

  let pendingChoiceView: SEPendingChoiceView | null = null;
  if (state.pendingChoice !== null) {
    pendingChoiceView = {
      type: state.pendingChoice.type,
      playerId: state.pendingChoice.playerId,
    };
    if (state.pendingChoice.type === 'ANXIETY_STEAL') {
      pendingChoiceView.victimId = state.pendingChoice.victimId;
    } else if (state.pendingChoice.type === 'TREMORS_DISCARD') {
      pendingChoiceView.attackerId = state.pendingChoice.attackerId;
      pendingChoiceView.timeoutSeconds = state.pendingChoice.timeoutSeconds;
    }
  }

  const tradeViews: SETradeView[] = state.trades.map((t) => {
    const isParticipant = t.proposerId === playerId || t.targetPlayerId === playerId;
    const tradeView: SETradeView = {
      tradeId: t.tradeId,
      proposerId: t.proposerId,
      targetPlayerId: t.targetPlayerId,
      status: t.status,
      offerCardCount: t.offerCardIds.length,
      giveCardCount: t.giveCardIds?.length ?? 0,
    };
    if (isParticipant) {
      tradeView.offerCardIds = [...t.offerCardIds];
      if (t.giveCardIds) {
        tradeView.giveCardIds = [...t.giveCardIds];
      }
    }
    return tradeView;
  });

  const topDiscard =
    state.discardPile.length > 0
      ? structuredClone(state.discardPile[state.discardPile.length - 1]!)
      : null;

  const eventViews: SEGameEventView[] = (state.events ?? []).map((ev) => {
    const isParticipant = ev.actorId === playerId || ev.targetId === playerId;
    const viewEv: SEGameEventView = {
      seq: ev.seq,
      type: ev.type,
      actorId: ev.actorId,
    };
    if (ev.targetId !== undefined) viewEv.targetId = ev.targetId;
    if (ev.cardId !== undefined) viewEv.cardId = ev.cardId;
    if (ev.disorderCardId !== undefined) viewEv.disorderCardId = ev.disorderCardId;
    if (ev.disorderInstanceId !== undefined) viewEv.disorderInstanceId = ev.disorderInstanceId;
    if (ev.actorId === playerId && ev.actorHandInstanceId !== undefined) {
      viewEv.actorHandInstanceId = ev.actorHandInstanceId;
    }
    if (ev.count !== undefined) viewEv.count = ev.count;
    if (ev.secondaryCount !== undefined) viewEv.secondaryCount = ev.secondaryCount;
    if (ev.punishmentSummary !== undefined) viewEv.punishmentSummary = ev.punishmentSummary;
    if (isParticipant && ev.participantCardIds && ev.participantCardIds.length > 0) {
      viewEv.revealedCardIds = [...ev.participantCardIds];
    }
    if (
      isParticipant &&
      ev.participantSecondaryCardIds &&
      ev.participantSecondaryCardIds.length > 0
    ) {
      viewEv.revealedSecondaryCardIds = [...ev.participantSecondaryCardIds];
    }
    return viewEv;
  });

  return {
    playerIds: [...state.playerIds],
    players,
    activePlayerId: state.activePlayerId,
    turnNumber: state.turnNumber,
    cardsPlayedThisTurn: state.cardsPlayedThisTurn,
    preventPlayCards: state.preventPlayCards,
    drawPileCount: state.drawPile.length,
    discardPileCount: state.discardPile.length,
    topDiscard,
    pendingChoice: pendingChoiceView,
    trades: tradeViews,
    winner: state.winner,
    logs: [...state.logs],
    events: eventViews,
    options: structuredClone(state.options),
  };
}
