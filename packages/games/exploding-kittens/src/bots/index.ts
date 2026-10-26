import type { BotDefinition } from '@boardgame/core';
import type { EKAction, EKPlayerView } from '../types.js';
import { chooseHardAction } from './hard.js';
import { chooseNormalAction } from './normal.js';

export { chooseNormalAction } from './normal.js';
export { chooseHardAction } from './hard.js';

export const explodingKittensBots: BotDefinition<EKPlayerView, EKAction>[] = [
  {
    level: 'normal',
    labelVi: 'Tập sự (Normal)',
    chooseAction: chooseNormalAction,
  },
  {
    level: 'hard',
    labelVi: 'Cao thủ (Hard)',
    chooseAction: chooseHardAction,
  },
];
