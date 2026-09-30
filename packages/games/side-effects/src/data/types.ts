export type EffectType =
  | 'ATTACKER_STEALS_CHOSEN_CARD'
  | 'PREVENT_DRAW'
  | 'SKIP_TURN'
  | 'ATTACKER_STEALS_RANDOM_CARDS'
  | 'DISCARD_ALL_DRUGS_FROM_PSYCHE'
  | 'DISCARD_ENTIRE_HAND'
  | 'PREVENT_PLAY_CARDS'
  | 'DISCARD_CARDS_OR_ENTIRE_HAND';

export interface AttackerStealsChosenCardEffect {
  type: 'ATTACKER_STEALS_CHOSEN_CARD';
  params: {
    count: number;
    revealHand: boolean;
  };
}

export interface PreventDrawEffect {
  type: 'PREVENT_DRAW';
  params: {
    rounds: number;
  };
}

export interface SkipTurnEffect {
  type: 'SKIP_TURN';
  params: {
    rounds: number;
  };
}

export interface AttackerStealsRandomCardsEffect {
  type: 'ATTACKER_STEALS_RANDOM_CARDS';
  params: {
    count: number;
  };
}

export interface DiscardAllDrugsFromPsycheEffect {
  type: 'DISCARD_ALL_DRUGS_FROM_PSYCHE';
  params: Record<string, never>;
}

export interface DiscardEntireHandEffect {
  type: 'DISCARD_ENTIRE_HAND';
  params: Record<string, never>;
}

export interface PreventPlayCardsEffect {
  type: 'PREVENT_PLAY_CARDS';
  params: {
    rounds: number;
  };
}

export interface DiscardCardsOrEntireHandEffect {
  type: 'DISCARD_CARDS_OR_ENTIRE_HAND';
  params: {
    count: number;
    timeoutSeconds: number;
  };
}

export type PunishmentEffect =
  | AttackerStealsChosenCardEffect
  | PreventDrawEffect
  | SkipTurnEffect
  | AttackerStealsRandomCardsEffect
  | DiscardAllDrugsFromPsycheEffect
  | DiscardEntireHandEffect
  | PreventPlayCardsEffect
  | DiscardCardsOrEntireHandEffect;

export interface Punishment {
  textVi: string;
  textEn: string;
  effect: PunishmentEffect;
}

export interface DisorderCard {
  id: string;
  nameEn: string;
  nameVi: string;
  count: number;
  punishment: Punishment;
  therapyImmune?: boolean;
}

export interface DrugCard {
  id: string;
  nameEn: string;
  nameVi: string;
  treats: string;
  sideEffects: string[];
  count: number;
}

export interface CardsData {
  disorders: DisorderCard[];
  drugs: DrugCard[];
  episodes: {
    count: number;
  };
  therapies: {
    count: number;
  };
  spice: {
    highTolerance: number;
    misdiagnosis: number;
  };
}
