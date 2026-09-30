export const SYSTEM_PLAYER_ID = '__system__';

export type CardType = 'disorder' | 'drug' | 'episode' | 'therapy';

export interface CardInstance {
  instanceId: string;
  cardId: string;
  type: CardType;
}

export interface PsycheSlot {
  disorder: CardInstance;
  drug: CardInstance | null;
}

export interface SEPlayer {
  id: string;
  hand: CardInstance[];
  psyche: PsycheSlot[];
  skipTurns: number;
  preventPlayCardsTurns: number;
  preventDrawTurns: number;
}

export interface SEOptions {
  tremorsTimeoutSeconds: number;
  playerNames?: Record<string, string>;
}

export type SEPendingChoiceType = 'ANXIETY_STEAL' | 'TREMORS_DISCARD';

export interface AnxietyStealChoice {
  type: 'ANXIETY_STEAL';
  playerId: string;
  victimId: string;
}

export interface TremorsDiscardChoice {
  type: 'TREMORS_DISCARD';
  playerId: string;
  attackerId: string;
  timeoutSeconds: number;
}

export type SEPendingChoice = AnxietyStealChoice | TremorsDiscardChoice;

export interface SEPendingChoiceView {
  type: SEPendingChoiceType;
  playerId: string;
  victimId?: string;
  attackerId?: string;
  timeoutSeconds?: number;
}

export interface SETradeOffer {
  tradeId: string;
  proposerId: string;
  targetPlayerId: string;
  offerCardIds: string[];
  giveCardIds?: string[];
  status: 'PROPOSED' | 'RESPONDED';
}

export interface SETradeView {
  tradeId: string;
  proposerId: string;
  targetPlayerId: string;
  status: 'PROPOSED' | 'RESPONDED';
  offerCardIds?: string[];
  giveCardIds?: string[];
  offerCardCount: number;
  giveCardCount: number;
}

export interface SEState {
  playerIds: string[];
  players: SEPlayer[];
  activePlayerId: string;
  turnNumber: number;
  cardsPlayedThisTurn: number;
  preventPlayCards: boolean;
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  pendingChoice: SEPendingChoice | null;
  trades: SETradeOffer[];
  inflictedThisTurn: { victimId: string; effectType: string }[];
  winner: string | null;
  logs: string[];
  options: SEOptions;
}

export interface SEPlayerViewPlayer {
  id: string;
  handCount: number;
  hand?: CardInstance[];
  revealedHand?: CardInstance[];
  psyche: PsycheSlot[];
  skipTurns: number;
  preventPlayCardsTurns: number;
  preventDrawTurns: number;
}

export interface SEPlayerView {
  playerIds: string[];
  players: SEPlayerViewPlayer[];
  activePlayerId: string;
  turnNumber: number;
  cardsPlayedThisTurn: number;
  preventPlayCards: boolean;
  drawPileCount: number;
  discardPileCount: number;
  topDiscard: CardInstance | null;
  pendingChoice: SEPendingChoiceView | null;
  trades: SETradeView[];
  winner: string | null;
  logs: string[];
  options: SEOptions;
}

export type SEAction =
  | { type: 'TREAT'; drugId: string; disorderId: string }
  | { type: 'THERAPY'; therapyId: string; disorderId: string }
  | { type: 'GIVE_DISORDER'; disorderCardId: string; targetPlayerId: string }
  | { type: 'EPISODE'; episodeId: string; targetPlayerId: string; disorderId: string }
  | { type: 'RESOLVE_CHOICE'; cardId?: string; cardIds?: string[] }
  | { type: 'CHOICE_TIMEOUT' }
  | { type: 'DISCARD'; cardIds: string[] }
  | { type: 'END_TURN' }
  | { type: 'PROPOSE_TRADE'; targetPlayerId: string; offerCardIds: string[] }
  | { type: 'RESPOND_TRADE'; tradeId: string; accept: boolean; giveCardIds?: string[] }
  | { type: 'CONFIRM_TRADE'; tradeId: string; accept: boolean }
  | { type: 'CANCEL_TRADE'; tradeId: string };
