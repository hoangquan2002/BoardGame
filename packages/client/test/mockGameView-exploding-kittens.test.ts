import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { GameBoard } from '../src/games/exploding-kittens/GameBoard.js';
import { createMockGameData } from '../src/games/exploding-kittens/mockGameView.js';

describe('Exploding Kittens mockGameView tests', () => {
  it('tạo dữ liệu mock mặc định (pha bình thường)', () => {
    const params = new URLSearchParams();
    const { session, roomState, gameView } = createMockGameData(params);

    expect(session.playerId).toBe('user-me');
    expect(roomState.gameId).toBe('exploding-kittens');
    expect(gameView.phase).toBe('TURN_PLAY');
    expect(gameView.activePlayerId).toBe('user-me');
    expect(gameView.alive).toBe(true);
    expect(gameView.myHand.length).toBeGreaterThan(0);
    expect(gameView.opponents.length).toBe(3);
    expect(gameView.nopeWindow).toBeNull();
    expect(gameView.defusePrompt).toBeNull();
    expect(gameView.knownTopCards).toBeNull();
    expect(gameView.favorPrompt).toBeNull();
  });

  it('hỗ trợ pha mock phase=nope', () => {
    const params = new URLSearchParams({ phase: 'nope' });
    const { gameView } = createMockGameData(params);

    expect(gameView.phase).toBe('NOPE_WINDOW');
    expect(gameView.nopeWindow).not.toBeNull();
    expect(gameView.nopeWindow?.isOpen).toBe(true);
    expect(gameView.nopeWindow?.originalActionType).toBe('ATTACK');
    expect(gameView.nopeWindow?.secondsRemaining).toBe(4);
  });

  it('hỗ trợ pha mock phase=defuse', () => {
    const params = new URLSearchParams({ phase: 'defuse' });
    const { gameView } = createMockGameData(params);

    expect(gameView.phase).toBe('DEFUSE_INSERT');
    expect(gameView.defusePrompt).not.toBeNull();
    expect(gameView.defusePrompt?.mustDefuse).toBe(true);
    expect(gameView.defusePrompt?.maxIndex).toBe(28);
  });

  it('hỗ trợ pha mock phase=seefuture', () => {
    const params = new URLSearchParams({ phase: 'seefuture' });
    const { gameView } = createMockGameData(params);

    expect(gameView.knownTopCards).not.toBeNull();
    expect(gameView.knownTopCards?.length).toBe(3);
    expect(gameView.knownTopCards?.[0]?.code).toBe('EXPLODING_KITTEN');
  });

  it('hỗ trợ pha mock phase=favor', () => {
    const params = new URLSearchParams({ phase: 'favor' });
    const { gameView } = createMockGameData(params);

    expect(gameView.phase).toBe('FAVOR_GIVE');
    expect(gameView.favorPrompt).not.toBeNull();
    expect(gameView.favorPrompt?.isTarget).toBe(true);
    expect(gameView.favorPrompt?.proposerId).toBe('bot-1');
  });

  it('hỗ trợ tuỳ chọn đổi lượt turn=bot-1', () => {
    const params = new URLSearchParams({ turn: 'bot-1' });
    const { gameView } = createMockGameData(params);

    expect(gameView.activePlayerId).toBe('bot-1');
  });

  it('render GameBoard trong tất cả các pha mock mà không lỗi', () => {
    const phases = ['normal', 'nope', 'defuse', 'seefuture', 'favor'];
    for (const phase of phases) {
      const params = new URLSearchParams({ phase });
      const data = createMockGameData(params);
      const html = renderToString(
        React.createElement(GameBoard, {
          session: data.session,
          roomState: data.roomState,
          gameView: data.gameView,
          deadline: data.deadline,
          onSendAction: async () => true,
          onLeaveRoom: async () => true,
        })
      );
      expect(html).toBeTruthy();
      expect(html).toContain('DEMOEK');
      if (phase === 'nope') {
        expect(html).toContain('CỬA SỔ NOPE!');
      }
      if (phase === 'defuse') {
        expect(html).toContain('RÚT TRÚNG MÈO NỔ!');
      }
      if (phase === 'seefuture') {
        expect(html).toContain('NHÌN TRƯỚC TƯƠNG LAI');
      }
      if (phase === 'favor') {
        expect(html).toContain('BẠN BỊ ĐÒI BÀI (FAVOR)!');
      }
    }
  });
});

