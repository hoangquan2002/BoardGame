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

export const SE_MAX_RECENT_EVENTS = 20;

export type SEEventType =
  | 'TREAT'
  | 'THERAPY'
  | 'GIVE_DISORDER'
  | 'EPISODE'
  | 'ANXIETY_STEAL'
  | 'TREMORS_DISCARD'
  | 'TREMORS_TIMEOUT'
  | 'DISCARD'
  | 'DRAW_TURN'
  | 'SKIP_TURN'
  | 'TURN_RESTRICTION'
  | 'TRADE_PROPOSED'
  | 'TRADE_RESPONDED'
  | 'TRADE_REJECTED'
  | 'TRADE_COMPLETED'
  | 'TRADE_CANCELLED';

export type SEEpisodePunishmentSummary =
  | 'ANXIETY_PENDING'
  | 'ANXIETY_EMPTY_HAND'
  | 'TREMORS_PENDING'
  | 'TREMORS_AUTO_DISCARD_HAND'
  | 'GAMBLING_STEAL'
  | 'GAMBLING_EMPTY_HAND'
  | 'SUICIDAL_DISCARD_HAND'
  | 'MADNESS_DISCARD_DRUGS'
  | 'SKIP_TURN_APPLIED'
  | 'PREVENT_PLAY_APPLIED'
  | 'PREVENT_DRAW_APPLIED'
  | 'ALREADY_INFLICTED';

export interface SEInternalEvent {
  seq: number;
  type: SEEventType;
  actorId: string;
  targetId?: string;
  cardId?: string;
  disorderCardId?: string;
  disorderInstanceId?: string;
  actorHandInstanceId?: string;
  count?: number;
  secondaryCount?: number;
  punishmentSummary?: SEEpisodePunishmentSummary;
  participantCardIds?: string[];
  participantSecondaryCardIds?: string[];
}

export interface SEGameEventView {
  seq: number;
  type: SEEventType;
  actorId: string;
  targetId?: string;
  cardId?: string;
  disorderCardId?: string;
  disorderInstanceId?: string;
  actorHandInstanceId?: string;
  count?: number;
  secondaryCount?: number;
  punishmentSummary?: SEEpisodePunishmentSummary;
  revealedCardIds?: string[];
  revealedSecondaryCardIds?: string[];
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
  events?: SEInternalEvent[];
  nextEventSeq?: number;
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
  events?: SEGameEventView[];
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
