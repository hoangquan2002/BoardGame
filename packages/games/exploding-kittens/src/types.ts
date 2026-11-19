export type EKCardCode =
  | 'EXPLODING_KITTEN'
  | 'DEFUSE'
  | 'NOPE'
  | 'ATTACK'
  | 'SKIP'
  | 'FAVOR'
  | 'SHUFFLE'
  | 'SEE_THE_FUTURE'
  | 'CAT_TACOCAT'
  | 'CAT_CATTERMELON'
  | 'CAT_HAIRY_POTATO'
  | 'CAT_BEARD'
  | 'CAT_RAINBOW_RALPHING';

export type EKCardCategory =
  | 'HAZARD'
  | 'DEFENSE'
  | 'REACTION'
  | 'ATTACK'
  | 'EVADE'
  | 'INTERACTION'
  | 'CONTROL'
  | 'INFO'
  | 'CAT';

export interface EKCard {
  id: string; // EK_01 .. EK_56
  cardNumber: number;
  code: EKCardCode;
  nameEn: string;
  nameVi: string;
  variantSubtitleEn?: string;
  variantSubtitleVi?: string;
  category: EKCardCategory;
  colorHex?: string;
  descriptionEn?: string;
  descriptionVi?: string;
  sampleImageUrl?: string;
  imageFile?: string;
  imageUrl?: string;
}

export type EKPhase =
  | 'TURN_PLAY'
  | 'NOPE_WINDOW'
  | 'FAVOR_GIVE'
  | 'FIVE_DIFF_PICK'
  | 'DEFUSE_INSERT'
  | 'GAME_OVER';

export interface EKPlayerState {
  id: string;
  hand: string[]; // Card IDs
  alive: boolean;
}

export type EKComboType = 'TWO_OF_A_KIND' | 'THREE_OF_A_KIND' | 'FIVE_DIFFERENT';

export interface EKPendingNopeWindow {
  type: 'NOPE_WINDOW';
  originalPlayerId: string;
  originalAction: EKAction;
  nopeCount: number; // 0 lúc mới tạo, tăng 1 mỗi khi có NOPE
  passedPlayerIds: string[]; // Danh sách playerId đã chọn bỏ qua (PASS_NOPE)
  timeoutSeconds: number; // Đếm ngược 5 giây
}

export interface EKPendingFavorGive {
  type: 'FAVOR_GIVE';
  proposerId: string;
  targetPlayerId: string;
}

export interface EKPendingFiveDiffPick {
  type: 'FIVE_DIFF_PICK';
  pickerId: string;
}

export interface EKPendingDefuseInsert {
  type: 'DEFUSE_INSERT';
  playerId: string;
  explodingKittenCardId: string;
  defuseCardId: string;
}

export type EKPendingState =
  | EKPendingNopeWindow
  | EKPendingFavorGive
  | EKPendingFiveDiffPick
  | EKPendingDefuseInsert;

export const EK_MAX_RECENT_EVENTS = 20;

export type EKEventType =
  | 'ACTION_PENDING_NOPE'
  | 'NOPE_PLAYED'
  | 'ACTION_NOPED'
  | 'ATTACK_RESOLVED'
  | 'SKIP_RESOLVED'
  | 'SHUFFLE_RESOLVED'
  | 'SEE_FUTURE_RESOLVED'
  | 'FAVOR_REQUESTED'
  | 'FAVOR_EMPTY'
  | 'FAVOR_GIVEN'
  | 'COMBO_2_RESOLVED'
  | 'COMBO_3_RESOLVED'
  | 'COMBO_5_PROMPT'
  | 'DISCARD_PICKED'
  | 'DRAW_SAFE'
  | 'EXPLODING_DEFUSED'
  | 'PLAYER_EXPLODED'
  | 'KITTEN_INSERTED';

export interface EKInternalEvent {
  seq: number;
  type: EKEventType;
  actorId: string;
  targetId?: string;
  /** Publicly visible card ID (e.g. played to discardPile or Exploding Kitten) */
  cardId?: string;
  secondaryCardId?: string;
  comboType?: EKComboType;
  requestedCardCode?: EKCardCode;
  nopeCount?: number;
  isCurrentlyNoped?: boolean;
  turnsCount?: number;
  success?: boolean;
  wasAfterNopeWindow?: boolean;
  /** Secret transferred card ID visible ONLY to actorId & targetId */
  participantCardId?: string;
}

export interface EKGameEventView {
  seq: number;
  type: EKEventType;
  actorId: string;
  targetId?: string;
  card?: EKCard | null;
  secondaryCard?: EKCard | null;
  comboType?: EKComboType;
  requestedCardCode?: EKCardCode;
  nopeCount?: number;
  isCurrentlyNoped?: boolean;
  turnsCount?: number;
  success?: boolean;
  wasAfterNopeWindow?: boolean;
  /** Present ONLY when viewer is actorId or targetId */
  revealedCard?: EKCard | null;
}

export interface EKState {
  players: Record<string, EKPlayerState>;
  playerOrder: string[]; // Danh sách thứ tự người chơi
  activePlayerId: string;
  turnsRemaining: number; // Số lượt activePlayerId phải rút (mặc định = 1, cộng dồn nếu bị Attack)
  drawDeck: string[]; // Mảng card IDs, index 0 là đỉnh của chồng bài rút!
  discardPile: string[]; // Mảng card IDs, phần tử cuối cùng là lá trên cùng vừa đánh
  phase: EKPhase;
  pendingState: EKPendingState | null;
  seeTheFutureState: {
    playerId: string;
    cardIds: string[];
  } | null;
  winner: string | null;
  turnCount: number;
  lastActionDescriptionVi?: string;
  events?: EKInternalEvent[];
  nextEventSeq?: number;
}

export type EKAction =
  | {
      type: 'PLAY_ACTION_CARD';
      cardId: string;
      targetPlayerId?: string; // Bắt buộc đối với FAVOR
    }
  | {
      type: 'PLAY_COMBO';
      comboType: 'TWO_OF_A_KIND';
      cardIds: [string, string];
      targetPlayerId: string;
    }
  | {
      type: 'PLAY_COMBO';
      comboType: 'THREE_OF_A_KIND';
      cardIds: [string, string, string];
      targetPlayerId: string;
      requestedCardCode: EKCardCode;
    }
  | {
      type: 'PLAY_COMBO';
      comboType: 'FIVE_DIFFERENT';
      cardIds: [string, string, string, string, string];
    }
  | {
      type: 'PLAY_NOPE';
      cardId: string;
    }
  | {
      type: 'PASS_NOPE';
    }
  | {
      type: 'RESOLVE_NOPE_WINDOW';
    }
  | {
      type: 'GIVE_FAVOR_CARD';
      cardId: string;
    }
  | {
      type: 'PICK_DISCARD_CARD';
      cardId: string;
    }
  | {
      type: 'DRAW_CARD';
    }
  | {
      type: 'DEFUSE_INSERT';
      insertIndex: number; // 0 là trên cùng, drawDeck.length là đáy
    };

export interface EKOpponentView {
  id: string;
  handCount: number;
  alive: boolean;
  hasPassedNope?: boolean;
}

export interface EKPlayerView {
  myId: string;
  phase: EKPhase;
  activePlayerId: string;
  turnsRemaining: number;
  alive: boolean;
  myHand: EKCard[];
  opponents: EKOpponentView[];
  drawDeckCount: number;
  topDiscard: EKCard | null;
  discardPileCount: number;
  discardPile: EKCard[];
  nopeWindow: {
    isOpen: boolean;
    originalActionType: string;
    originalPlayerId: string;
    targetCard?: EKCard | null;
    actionNameVi?: string;
    comboType?: EKComboType | null;
    isCurrentlyNoped: boolean; // nopeCount % 2 !== 0
    nopeCount: number;
    secondsRemaining: number;
    hasPassed: boolean;
  } | null;
  favorPrompt: {
    isTarget: boolean;
    proposerId: string;
  } | null;
  fiveDiffPrompt: {
    isPicker: boolean;
    selectableCardIds: string[];
  } | null;
  defusePrompt: {
    mustDefuse: boolean;
    maxIndex: number;
  } | null;
  knownTopCards: EKCard[] | null;
  remainingKittens: number;
  explosionRiskPercent: number;
  winner: string | null;
  turnCount: number;
  lastActionDescriptionVi?: string;
  events?: EKGameEventView[];
}

export const SYSTEM_PLAYER_ID = '__system__';
export const NOPE_TIMEOUT_SECONDS = 5;
