import type { RoomState } from '@boardgame/core';
import type { SEPlayerView, SEPlayerViewPlayer, CardInstance, PsycheSlot } from '@boardgame/game-side-effects';
import type { UserSession } from '../../net/session.js';

export function createMockGameData(searchParams: URLSearchParams): {
  session: UserSession;
  roomState: RoomState;
  gameView: SEPlayerView;
  deadline?: number;
} {
  const playersParam = parseInt(searchParams.get('players') ?? '4', 10);
  const handParam = parseInt(searchParams.get('hand') ?? '8', 10);
  const turnParam = searchParams.get('turn') ?? 'me';

  const myId = 'user-me';

  // 12 lá bài mẫu trên tay (đủ 4 loại: drug, disorder, episode, therapy, và có tên dài nhất)
  const allSampleCards: CardInstance[] = [
    { instanceId: 'h-1', cardId: 'chlorpromazine#1', type: 'drug' },
    { instanceId: 'h-2', cardId: 'gambling-addiction#1', type: 'disorder' },
    { instanceId: 'h-3', cardId: 'episode#1', type: 'episode' },
    { instanceId: 'h-4', cardId: 'therapy#1', type: 'therapy' },
    { instanceId: 'h-5', cardId: 'pramipexole#1', type: 'drug' },
    { instanceId: 'h-6', cardId: 'suicidal-thoughts#1', type: 'disorder' },
    { instanceId: 'h-7', cardId: 'lorazepam#2', type: 'drug' },
    { instanceId: 'h-8', cardId: 'anxiety#1', type: 'disorder' },
    { instanceId: 'h-9', cardId: 'fluoxetine#2', type: 'drug' },
    { instanceId: 'h-10', cardId: 'sildenafil#3', type: 'drug' },
    { instanceId: 'h-11', cardId: 'clozapine#4', type: 'drug' },
    { instanceId: 'h-12', cardId: 'depression#2', type: 'disorder' },
  ];
  const myHand = allSampleCards.slice(0, Math.min(12, Math.max(4, handParam)));

  // Thể Trạng của mình: 4 ô mẫu (bậc thang)
  const myPsyche: PsycheSlot[] = [
    {
      disorder: { instanceId: 'psy-d-1', cardId: 'depression#1', type: 'disorder' },
      drug: { instanceId: 'psy-dr-1', cardId: 'fluoxetine#1', type: 'drug' },
    },
    {
      disorder: { instanceId: 'psy-d-2', cardId: 'suicidal-thoughts#2', type: 'disorder' },
      drug: null,
    },
    {
      disorder: { instanceId: 'psy-d-3', cardId: 'anxiety#2', type: 'disorder' },
      drug: null,
    },
    {
      disorder: { instanceId: 'psy-d-4', cardId: 'tremors#4', type: 'disorder' },
      drug: { instanceId: 'psy-dr-4', cardId: 'pramipexole#2', type: 'drug' },
    },
  ];

  // Danh sách người chơi mẫu
  const allPlayers: SEPlayerViewPlayer[] = [
    {
      id: myId,
      handCount: myHand.length,
      hand: myHand,
      psyche: myPsyche,
      skipTurns: 0,
      preventPlayCardsTurns: 0,
      preventDrawTurns: 0,
      revealedHand: [],
    },
    {
      id: 'bot-1',
      handCount: 5,
      psyche: [
        {
          disorder: { instanceId: 'b1-d-1', cardId: 'madness', type: 'disorder' },
          drug: { instanceId: 'b1-dr-1', cardId: 'chlorpromazine', type: 'drug' },
        },
        {
          disorder: { instanceId: 'b1-d-2', cardId: 'suicidal-thoughts', type: 'disorder' },
          drug: null,
        },
      ],
      skipTurns: 0,
      preventPlayCardsTurns: 0,
      preventDrawTurns: 0,
      revealedHand: [],
    },
    {
      id: 'user-binh',
      handCount: 6,
      psyche: [
        {
          disorder: { instanceId: 'ub-d-1', cardId: 'depression', type: 'disorder' },
          drug: { instanceId: 'ub-dr-1', cardId: 'lithium', type: 'drug' },
        },
        {
          disorder: { instanceId: 'ub-d-2', cardId: 'gambling-addiction', type: 'disorder' },
          drug: null,
        },
      ],
      skipTurns: 0,
      preventPlayCardsTurns: 0,
      preventDrawTurns: 0,
      revealedHand: [],
    },
    {
      id: 'bot-2',
      handCount: 4,
      psyche: [
        {
          disorder: { instanceId: 'b2-d-1', cardId: 'anorexia', type: 'disorder' },
          drug: null,
        },
      ],
      skipTurns: 0,
      preventPlayCardsTurns: 0,
      preventDrawTurns: 0,
      revealedHand: [],
    },
  ];

  const activePlayers = allPlayers.slice(0, Math.min(4, Math.max(2, playersParam)));
  const playerIds = activePlayers.map((p) => p.id);

  const activePlayerId = turnParam === 'me' ? myId : activePlayers[1]?.id ?? myId;

  const gameView: SEPlayerView = {
    playerIds,
    players: activePlayers,
    activePlayerId,
    turnNumber: 3,
    cardsPlayedThisTurn: 1,
    preventPlayCards: false,
    drawPileCount: 41,
    discardPileCount: 12,
    topDiscard: null,
    pendingChoice: null,
    trades: [],
    winner: searchParams.get('winner') ? (searchParams.get('winner') === 'other' ? activePlayers[1]?.id ?? 'p2' : myId) : null,
    logs: ['Ván chơi mẫu bản phác giao diện mới'],
    options: { tremorsTimeoutSeconds: 7 },
  };

  const roomState: RoomState = {
    roomCode: 'MOCK1',
    gameId: 'side-effects',
    status: 'playing',
    hostId: myId,
    players: [
      { playerId: myId, name: 'Bạn', connected: true, isBot: false },
      { playerId: 'bot-1', name: 'Máy 1', connected: true, isBot: true },
      { playerId: 'user-binh', name: 'Bình', connected: false, isBot: false },
      { playerId: 'bot-2', name: 'Máy 2', connected: true, isBot: true },
    ].slice(0, activePlayers.length),
  };

  const session: UserSession = {
    roomCode: 'MOCK1',
    playerId: myId,
    token: 'mock-token',
    playerName: 'Bạn',
  };

  return {
    session,
    roomState,
    gameView,
    deadline: Date.now() + 42000, // 42 giây còn lại
  };
}
