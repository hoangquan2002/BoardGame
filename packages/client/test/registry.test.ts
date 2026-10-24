import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { GameDefinition } from '@boardgame/core';
import {
  ClientGameRegistry,
  clientGameRegistry,
  DEFAULT_GAME_ID,
  sideEffectsClientPlugin,
  type ClientGamePlugin,
} from '../src/games/registry.js';
import { GameMenuCard } from '../src/lobby/GameMenuCard.js';

describe('ClientGameRegistry', () => {
  it('mặc định đăng ký side-effects với đầy đủ metadata, BoardComponent, RulesModalComponent, createMockData', () => {
    const plugin = clientGameRegistry.get('side-effects');
    expect(plugin).toBeDefined();
    expect(plugin?.id).toBe('side-effects');
    expect(plugin?.title).toBe('Side Effects');
    expect(plugin?.subtitle).toBe('Board game chiến thuật Dược lý & Tâm lý học');
    expect(plugin?.icon).toBe('💊');
    expect(plugin?.accentColor).toBe('#10b981');
    expect(plugin?.durationTextVi).toBe('15–25 phút');
    expect(plugin?.categoryVi).toBe('Chiến thuật / Thẻ bài');
    expect(plugin?.rulesStorageKey).toBe('side_effects_rules_read');
    expect(plugin?.BoardComponent).toBeDefined();
    expect(plugin?.RulesModalComponent).toBeDefined();
    expect(typeof plugin?.createMockData).toBe('function');

    expect(clientGameRegistry.getOrDefault('unknown-game').id).toBe(DEFAULT_GAME_ID);
    expect(clientGameRegistry.getAll().map((p) => p.id)).toContain('side-effects');
  });

  it('có thể đăng ký thêm game thứ 2 vào instance ClientGameRegistry và truy xuất đúng theo gameId', () => {
    const registry = new ClientGameRegistry();
    registry.register(sideEffectsClientPlugin);

    const dummyGameDef: GameDefinition<{ count: number }, { type: 'INC' }, { count: number }> = {
      id: 'dummy-game',
      minPlayers: 2,
      maxPlayers: 6,
      meta: {
        nameVi: 'Trò chơi thử nghiệm',
        subtitleVi: 'Mô tả thử nghiệm',
        icon: '🃏',
      },
      setup: () => ({ count: 0 }),
      validate: () => null,
      apply: (state) => ({ count: state.count + 1 }),
      playerView: (state) => ({ count: state.count }),
      winner: () => null,
    };

    const DummyBoard: React.FC = () => React.createElement('div', null, 'Dummy Board');
    const DummyRules: React.FC<{ isOpen: boolean; onClose: () => void }> = () =>
      React.createElement('div', null, 'Dummy Rules');

    const dummyPlugin: ClientGamePlugin<{ count: number }, { type: 'INC' }> = {
      id: 'dummy-game',
      game: dummyGameDef,
      title: dummyGameDef.meta!.nameVi,
      subtitle: dummyGameDef.meta!.subtitleVi!,
      icon: dummyGameDef.meta!.icon!,
      accentColor: '#3b82f6',
      durationTextVi: '10–20 phút',
      categoryVi: 'Party game',
      rulesStorageKey: 'dummy_game_rules_read',
      BoardComponent: DummyBoard,
      RulesModalComponent: DummyRules,
    };

    registry.register(dummyPlugin);

    expect(registry.getAll()).toHaveLength(2);
    const retrieved = registry.get('dummy-game');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('dummy-game');
    expect(retrieved?.title).toBe('Trò chơi thử nghiệm');
    expect(retrieved?.icon).toBe('🃏');
    expect(retrieved?.accentColor).toBe('#3b82f6');
    expect(retrieved?.durationTextVi).toBe('10–20 phút');
    expect(retrieved?.categoryVi).toBe('Party game');
    expect(retrieved?.game.maxPlayers).toBe(6);
    expect(registry.getOrDefault('dummy-game').id).toBe('dummy-game');
    expect(registry.getOrDefault('non-existent').id).toBe('side-effects');
  });

  describe('GameMenuCard Component', () => {
    it('render chính xác thông tin game, icon, badges và trạng thái khi được chọn', () => {
      const htmlSelected = renderToString(
        React.createElement(GameMenuCard, {
          plugin: sideEffectsClientPlugin,
          isSelected: true,
          onSelect: () => {},
          onOpenRules: () => {},
        }),
      );

      expect(htmlSelected).toContain('Side Effects');
      expect(htmlSelected).toContain('Board game chiến thuật Dược lý &amp; Tâm lý học');
      expect(htmlSelected).toContain('💊');
      expect(htmlSelected).toContain('2–4 người');
      expect(htmlSelected).toContain('15–25 phút');
      expect(htmlSelected).toContain('Chiến thuật / Thẻ bài');
      expect(htmlSelected).toContain('Có Máy');
      expect(htmlSelected).toContain('data-testid="rules-button"');
      expect(htmlSelected).toContain('data-testid="game-card-side-effects"');
      expect(htmlSelected).toContain('aria-selected="true"');
      expect(htmlSelected).toContain('✓ Đang chọn');
      expect(htmlSelected).not.toContain('Chạm để chọn');
    });

    it('render đúng nhãn chạm để chọn khi isSelected = false', () => {
      const htmlUnselected = renderToString(
        React.createElement(GameMenuCard, {
          plugin: sideEffectsClientPlugin,
          isSelected: false,
          onSelect: () => {},
          onOpenRules: () => {},
        }),
      );

      expect(htmlUnselected).toContain('Chạm để chọn');
      expect(htmlUnselected).not.toContain('✓ Đang chọn');
      expect(htmlUnselected).toContain('aria-selected="false"');
    });
  });
});
