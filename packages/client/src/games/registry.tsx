/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { GameDefinition, RoomState } from '@boardgame/core';
import { sideEffectsGame, type SEAction, type SEPlayerView } from '@boardgame/game-side-effects';
import {
  explodingKittensGame,
  type EKAction,
  type EKPlayerView,
} from '@boardgame/game-exploding-kittens';
import type { UserSession } from '../net/session.js';
import { GameBoard } from './side-effects/GameBoard.js';
import { RulesModal } from './side-effects/RulesModal.js';
import { createMockGameData } from './side-effects/mockGameView.js';
import { GameBoard as EKGameBoard } from './exploding-kittens/GameBoard.js';
import { RulesModal as EKRulesModal } from './exploding-kittens/RulesModal.js';
import { createMockGameData as createEKMockGameData } from './exploding-kittens/mockGameView.js';

export const DEFAULT_GAME_ID = 'side-effects';

export interface ClientGameBoardProps<V = any, A = any> {
  session: UserSession;
  roomState: RoomState;
  gameView: V;
  deadline?: number;
  onSendAction: (action: A) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
}

export interface ClientGamePlugin<V = any, A = any> {
  id: string;
  game: GameDefinition<any, A, V>;
  title: string;
  subtitle: string;
  icon: string;
  accentColor?: string;
  durationTextVi?: string;
  categoryVi?: string;
  rulesStorageKey: string;
  BoardComponent: React.ComponentType<ClientGameBoardProps<V, A>>;
  RulesModalComponent: React.ComponentType<{ isOpen: boolean; onClose: () => void }>;
  createMockData?: (params: URLSearchParams) => {
    session: UserSession;
    roomState: RoomState;
    gameView: V;
    deadline?: number;
  };
}

export class ClientGameRegistry {
  private plugins = new Map<string, ClientGamePlugin>();

  register<V = any, A = any>(plugin: ClientGamePlugin<V, A>): void {
    this.plugins.set(plugin.id, plugin as ClientGamePlugin);
  }

  get(gameId: string): ClientGamePlugin | undefined {
    return this.plugins.get(gameId);
  }

  getAll(): ClientGamePlugin[] {
    return Array.from(this.plugins.values());
  }

  getOrDefault(gameId?: string): ClientGamePlugin {
    if (gameId) {
      const found = this.plugins.get(gameId);
      if (found) return found;
    }
    const def = this.plugins.get(DEFAULT_GAME_ID);
    if (def) return def;
    const first = this.plugins.values().next().value;
    if (!first) {
      throw new Error('No games registered in ClientGameRegistry');
    }
    return first;
  }
}

export const sideEffectsClientPlugin: ClientGamePlugin<SEPlayerView, SEAction> = {
  id: 'side-effects',
  game: sideEffectsGame,
  title: sideEffectsGame.meta?.nameVi ?? 'Side Effects',
  subtitle: sideEffectsGame.meta?.subtitleVi ?? 'Board game chiến thuật Dược lý & Tâm lý học',
  icon: sideEffectsGame.meta?.icon ?? '💊',
  accentColor: '#10b981',
  durationTextVi: '15–25 phút',
  categoryVi: 'Chiến thuật / Thẻ bài',
  rulesStorageKey: 'side_effects_rules_read',
  BoardComponent: GameBoard,
  RulesModalComponent: RulesModal,
  createMockData: createMockGameData,
};

export const explodingKittensClientPlugin: ClientGamePlugin<EKPlayerView, EKAction> = {
  id: 'exploding-kittens',
  game: explodingKittensGame,
  title: explodingKittensGame.meta?.nameVi ?? 'Mèo Nổ (Exploding Kittens)',
  subtitle: explodingKittensGame.meta?.subtitleVi ?? 'Cò quay Nga thẻ bài kịch tính & hài hước',
  icon: '🐱',
  accentColor: '#ef4444',
  durationTextVi: '10–15 phút',
  categoryVi: 'Chiến thuật / Sinh tồn',
  rulesStorageKey: 'exploding_kittens_rules_read',
  BoardComponent: EKGameBoard,
  RulesModalComponent: EKRulesModal,
  createMockData: createEKMockGameData,
};

export const clientGameRegistry = new ClientGameRegistry();
clientGameRegistry.register(sideEffectsClientPlugin);
clientGameRegistry.register(explodingKittensClientPlugin);
