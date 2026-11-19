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

  // Mẫu bài trên tay: Defuse, Nope, Attack, Skip, Favor, Shuffle, See The Future, Tacocat
  const defaultSampleCardIds = [
    'DF_01',
    'NP_01',
    'AT_01',
    'SK_01',
    'FV_01',
    'SH_01',
    'SF_01',
    'CT_TACO_01',
  ];

  const handParam = searchParams.get('hand');
  let myHand: EKCard[];
  if (handParam) {
    const count = Math.min(20, Math.max(1, parseInt(handParam, 10) || 8));
    const cardPool = [
      'DF_01',
      'NP_01',
      'AT_01',
      'SK_01',
      'FV_01',
      'SH_01',
      'SF_01',
      'CT_TACO_01',
      'CT_WATER_01',
      'CT_POTATO_01',
      'CT_BEARD_01',
      'CT_RAINBOW_01',
      'NP_02',
      'AT_02',
      'SK_02',
      'FV_02',
    ];
    myHand = Array.from({ length: count }, (_, i) => getCard(cardPool[i % cardPool.length]));
  } else {
    myHand = defaultSampleCardIds.map(getCard);
  }

  const topDiscard = getCard('AT_02'); // Attack
  const discardPile = [getCard('SH_01'), getCard('SK_02'), topDiscard];

  const oppParam = searchParams.get('opponents');
  const oppCount = oppParam ? Math.max(1, Math.min(4, parseInt(oppParam, 10) || 3)) : 3;

  const opponentDefs = [
    { id: 'bot-1', name: '🤖 Máy 1', handCount: 5, alive: true, isBot: true },
    { id: 'bot-2', name: 'Bình', handCount: 3, alive: true, isBot: false },
    { id: 'bot-3', name: '🤖 Máy 2', handCount: 0, alive: false, isBot: true },
    { id: 'bot-4', name: 'Chi', handCount: 4, alive: true, isBot: false },
  ];

  const activeOpponents = opponentDefs.slice(0, oppCount);
  const opponents = activeOpponents.map((o) => ({
    id: o.id,
    handCount: o.handCount,
    alive: o.alive,
  }));

  const activePlayerId = turnParam === 'bot-1' ? 'bot-1' : myId;

  // Xử lý các pha mock tùy chọn
  let nopeWindow = null;
  if (phaseParam === 'nope') {
    nopeWindow = {
      isOpen: true,
      originalActionType: 'ATTACK' as const,
      originalPlayerId: 'bot-1',
      isCurrentlyNoped: false,
      nopeCount: 0,
      secondsRemaining: 4,
      hasPassed: false,
      actionNameVi: 'Tấn Công (Attack 2x)',
      targetCard: getCard('AT_01'),
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
    knownTopCards = [getCard('EK_01'), getCard('AT_03'), getCard('NP_02')]; // Lá 1 là Mèo Nổ!
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
    events: [],
  };

  const roomState: RoomState = {
    roomCode: 'DEMOEK',
    gameId: 'exploding-kittens',
    status: 'playing',
    hostId: myId,
    players: [
      { playerId: myId, name: 'Bạn', connected: true },
      ...activeOpponents.map((o) => ({
        playerId: o.id,
        name: o.name,
        connected: o.alive,
        isBot: o.isBot,
      })),
    ],
  };

  const session: UserSession = {
    roomCode: 'DEMOEK',
    token: 'mock-session-token',
    playerId: myId,
    playerName: 'Bạn',
  };

  return {
    session,
    roomState,
    gameView,
    deadline: Date.now() + 60000,
  };
}
