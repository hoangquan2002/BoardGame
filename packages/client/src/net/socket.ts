import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@boardgame/core';
import type { SEAction, SEPlayerView } from '@boardgame/game-side-effects';

export type GameSocket = Socket<ServerToClientEvents<SEPlayerView>, ClientToServerEvents<SEAction>>;

let socketInstance: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
    });
  }
  return socketInstance;
}
