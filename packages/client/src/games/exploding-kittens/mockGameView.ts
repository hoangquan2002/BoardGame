import type { RoomState } from '@boardgame/core';
import {
  type EKCard,
  type EKPlayerView,
  getCardById,
  getAllCards,
} from '@boardgame/game-exploding-kittens';
import type { UserSession } from '../../net/session.js';

export function createMockGameData(searchParams: URLSearchParams): {
  session: UserSession;
  roomState: RoomState;
  gameView: EKPlayerView;
  deadline?: number;
} {
  const myId = 'user-me';
  const turnParam = searchParams.get('turn') ?? 'me';
  const phaseParam = searchParams.get('phase') ?? 'normal'; // 'normal' | 'nope' | 'defuse' | 'seefuture' | 'favor'

  const allCards = getAllCards();
  const getCard = (id: string): EKCard => {
    const found = getCardById(id);
    if (found) return found;
    return allCards[0];
  };

  // Mẫu bài trên tay: Defuse, Attack, Skip, Favor, Nope, 2x Tacocat (combo 2 lá), See The Future
  const sampleCardIds = ['EK_05', 'EK_11', 'EK_15', 'EK_19', 'EK_23', 'EK_37', 'EK_38', 'EK_32'];
  const myHand: EKCard[] = sampleCardIds.map(getCard);

  const topDiscard = getCard('EK_12'); // Attack
  const discardPile = [getCard('EK_28'), getCard('EK_41'), topDiscard];

  const opponents = [
    { id: 'bot-1', handCount: 5, alive: true },
    { id: 'bot-2', handCount: 3, alive: true },
    { id: 'bot-3', handCount: 0, alive: false }, // Đã nổ tung
  ];

  const activePlayerId = turnParam === 'bot-1' ? 'bot-1' : myId;

  // Xử lý các pha mock tùy chọn
  let nopeWindow = null;
  if (phaseParam === 'nope') {
    nopeWindow = {
      isOpen: true,
      originalActionType: 'ATTACK',
      originalPlayerId: 'bot-1',
      isCurrentlyNoped: false,
      nopeCount: 0,
      secondsRemaining: 4,
      hasPassed: false,
    };
  }

  let defusePrompt = null;
  if (phaseParam === 'defuse') {
    defusePrompt = {
      mustDefuse: true,
      maxIndex: 28,
    };
  }

  let knownTopCards = null;
  if (phaseParam === 'seefuture') {
    knownTopCards = [getCard('EK_01'), getCard('EK_16'), getCard('EK_29')]; // Lá 1 là Mèo Nổ!
  }

  let favorPrompt = null;
  if (phaseParam === 'favor') {
    favorPrompt = {
      isTarget: true,
      proposerId: 'bot-1',
    };
  }

  const gameView: EKPlayerView = {
    myId,
    phase: defusePrompt ? 'DEFUSE_INSERT' : nopeWindow ? 'NOPE_WINDOW' : favorPrompt ? 'FAVOR_GIVE' : 'TURN_PLAY',
    activePlayerId,
    turnsRemaining: 1,
    alive: true,
    myHand,
    opponents,
    drawDeckCount: 29,
    topDiscard,
    discardPileCount: discardPile.length,
    discardPile,
    nopeWindow,
    favorPrompt,
    fiveDiffPrompt: null,
    defusePrompt,
    knownTopCards,
    remainingKittens: 2,
    explosionRiskPercent: Math.round((2 / 29) * 100), // ~7%
    winner: null,
    turnCount: 6,
    lastActionDescriptionVi: 'Bot 1 vừa rút 1 lá bài an toàn.',
  };

  const roomState: RoomState = {
    roomCode: 'DEMOEK',
    gameId: 'exploding-kittens',
    status: 'playing',
    hostId: myId,
    players: [
      { playerId: myId, name: 'Tôi (Người chơi VIP)', connected: true },
      { playerId: 'bot-1', name: 'Mèo Thần Tài (Bot)', connected: true, isBot: true },
      { playerId: 'bot-2', name: 'Mèo Quý Tộc (Bot)', connected: true, isBot: true },
      { playerId: 'bot-3', name: 'Mèo Điên (Bot Đã Nổ)', connected: false, isBot: true },
    ],
  };

  const session: UserSession = {
    roomCode: 'DEMOEK',
    token: 'mock-session-token',
    playerId: myId,
    playerName: 'Tôi (Người chơi VIP)',
  };

  return {
    session,
    roomState,
    gameView,
    deadline: Date.now() + 60000,
  };
}
