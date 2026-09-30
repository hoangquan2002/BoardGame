import type {
  AckResponse,
  ClientToServerEvents,
  GameViewPayload,
  RoomState,
  ServerToClientEvents,
} from '@boardgame/core';
import { io as ioc, type Socket } from 'socket.io-client';
import { createAppServer, type ServerOptions } from '../src/server.js';

export interface TestServerInstance {
  server: ReturnType<typeof createAppServer>;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export async function createTestServer(options: ServerOptions = {}): Promise<TestServerInstance> {
  const server = createAppServer(options);
  const port = await server.listen(0);
  const url = `http://localhost:${port}`;
  return {
    server,
    port,
    url,
    close: async () => {
      await server.close();
    },
  };
}

export interface TestClient {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  playerId?: string;
  token?: string;
  roomCode?: string;
  lastState?: RoomState;
  lastViewPayload?: GameViewPayload;
  allViews: GameViewPayload[];
  allStates: RoomState[];
  createRoom: (
    name: string,
    gameId: string,
  ) => Promise<AckResponse<{ roomCode: string; playerId: string; token: string }>>;
  joinRoom: (
    roomCode: string,
    name: string,
  ) => Promise<AckResponse<{ roomCode: string; playerId: string; token: string }>>;
  resumeRoom: (roomCode: string, token: string) => Promise<AckResponse<{ playerId: string }>>;
  startRoom: () => Promise<AckResponse>;
  addBot: (level: string) => Promise<AckResponse<{ playerId: string }>>;
  removeBot: (playerId: string) => Promise<AckResponse>;
  sendAction: (action: unknown) => Promise<AckResponse>;
  leaveRoom: () => Promise<AckResponse>;
  waitForState: (predicate: (state: RoomState) => boolean, timeoutMs?: number) => Promise<RoomState>;
  waitForView: (
    predicate: (payload: GameViewPayload) => boolean,
    timeoutMs?: number,
  ) => Promise<GameViewPayload>;
  disconnect: () => void;
}

export async function createTestClient(url: string): Promise<TestClient> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = ioc(url, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });

  const client: TestClient = {
    socket,
    allViews: [],
    allStates: [],
    createRoom: (name, gameId) => {
      return new Promise((resolve) => {
        socket.emit('room:create', { name, gameId }, (res) => {
          if (res.ok) {
            client.roomCode = res.roomCode;
            client.playerId = res.playerId;
            client.token = res.token;
          }
          resolve(res);
        });
      });
    },
    joinRoom: (roomCode, name) => {
      return new Promise((resolve) => {
        socket.emit('room:join', { roomCode, name }, (res) => {
          if (res.ok) {
            client.roomCode = res.roomCode;
            client.playerId = res.playerId;
            client.token = res.token;
          }
          resolve(res);
        });
      });
    },
    resumeRoom: (roomCode, token) => {
      return new Promise((resolve) => {
        socket.emit('room:resume', { roomCode, token }, (res) => {
          if (res.ok) {
            client.roomCode = roomCode;
            client.playerId = res.playerId;
            client.token = token;
          }
          resolve(res);
        });
      });
    },
    startRoom: () => {
      return new Promise((resolve) => {
        socket.emit('room:start', {}, (res) => {
          resolve(res);
        });
      });
    },
    addBot: (level: string) => {
      return new Promise((resolve) => {
        socket.emit('room:addBot', { level }, (res) => {
          resolve(res);
        });
      });
    },
    removeBot: (playerId: string) => {
      return new Promise((resolve) => {
        socket.emit('room:removeBot', { playerId }, (res) => {
          resolve(res);
        });
      });
    },
    sendAction: (action) => {
      return new Promise((resolve) => {
        if (!socket.connected) {
          return resolve({ ok: false, error: 'Socket đã bị ngắt kết nối' });
        }
        const timer = setTimeout(() => {
          resolve({ ok: false, error: 'Hết thời gian phản hồi' });
        }, 3000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.emit('game:action', { action: action as any }, (res) => {
          clearTimeout(timer);
          resolve(res);
        });
      });
    },
    leaveRoom: () => {
      return new Promise((resolve) => {
        socket.emit('room:leave', {}, (res) => {
          resolve(res);
        });
      });
    },
    waitForState: (predicate, timeoutMs = 4000) => {
      if (client.lastState && predicate(client.lastState)) {
        return Promise.resolve(client.lastState);
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          socket.off('room:state', handler);
          reject(new Error(`waitForState timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        const handler = (state: RoomState) => {
          if (predicate(state)) {
            clearTimeout(timer);
            socket.off('room:state', handler);
            resolve(state);
          }
        };

        socket.on('room:state', handler);
      });
    },
    waitForView: (predicate, timeoutMs = 4000) => {
      if (client.lastViewPayload && predicate(client.lastViewPayload)) {
        return Promise.resolve(client.lastViewPayload);
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          socket.off('game:view', handler);
          reject(new Error(`waitForView timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        const handler = (payload: GameViewPayload) => {
          if (predicate(payload)) {
            clearTimeout(timer);
            socket.off('game:view', handler);
            resolve(payload);
          }
        };

        socket.on('game:view', handler);
      });
    },
    disconnect: () => {
      socket.disconnect();
    },
  };

  socket.on('room:state', (state) => {
    client.lastState = state;
    client.allStates.push(state);
  });

  socket.on('game:view', (viewPayload) => {
    client.lastViewPayload = viewPayload;
    client.allViews.push(viewPayload);
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Socket connection timed out'));
    }, 4000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return client;
}
