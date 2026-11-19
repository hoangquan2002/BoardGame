import type React from 'react';

export type ActionFXTone = 'emerald' | 'sapphire' | 'amber' | 'ruby' | 'gold' | 'slate';

export type ActionFXPriority = 'silent' | 'self' | 'normal' | 'urgent-me';

export interface FlyingCardSpec {
  imageSrc: string;
  /** Aspect ratio CSS string, e.g. '520 / 864' or '720 / 1012' */
  aspectRatio: string;
  /** Ordered fallback chain of data-fx-anchor keys for flight origin */
  fromAnchors: string[];
  /** Ordered fallback chain of data-fx-anchor keys for flight destination */
  toAnchors: string[];
  tone?: ActionFXTone;
  delayMs?: number;
  durationMs?: number;
}

export interface TargetImpactSpec {
  /** Ordered fallback chain of data-fx-anchor keys; first found in DOM gets highlighted/shaken */
  anchors: string[];
  tone: ActionFXTone;
  shake?: boolean;
  delayMs?: number;
}

export interface ActionFXItem {
  seq: number;
  priority: ActionFXPriority;
  tone: ActionFXTone;
  /** Rendered Vietnamese content in the floating notification pill (ignored when priority === 'silent') */
  message?: React.ReactNode;
  /** Optional actor seat anchor to pulse subtly */
  actorAnchor?: string;
  /** 0, 1, or 2 flying cards */
  flights?: FlyingCardSpec[];
  /** 0 or more target impacts (flash border + optional subtle shake) */
  impacts?: TargetImpactSpec[];
}
