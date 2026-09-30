import type {
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
    options: structuredClone(state.options),
  };
}
