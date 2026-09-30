export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface RoomPlayerInfo {
  playerId: string;
  name: string;
  connected: boolean;
  isBot?: boolean;
  botLevel?: string;
}

export interface RoomState {
  roomCode: string;
  gameId: string;
  status: RoomStatus;
  hostId: string;
  players: RoomPlayerInfo[];
}

export interface GameViewPayload<V = unknown> {
  view: V;
  deadline?: number; // epoch timestamp (ms)
}

export type AckResponse<T = void> =
  | (T extends void ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

export interface ClientToServerEvents<A = unknown> {
  'room:create': (
    payload: { name: string; gameId: string },
    ack: (res: AckResponse<{ roomCode: string; playerId: string; token: string }>) => void,
  ) => void;

  'room:join': (
    payload: { roomCode: string; name: string },
    ack: (res: AckResponse<{ roomCode: string; playerId: string; token: string }>) => void,
  ) => void;

  'room:resume': (
    payload: { roomCode: string; token: string },
    ack: (res: AckResponse<{ playerId: string }>) => void,
  ) => void;

  'room:start': (
    payload: Record<string, unknown> | undefined,
    ack: (res: AckResponse) => void,
  ) => void;

  'room:addBot': (
    payload: { level: string },
    ack: (res: AckResponse<{ playerId: string }>) => void,
  ) => void;

  'room:removeBot': (
    payload: { playerId: string },
    ack: (res: AckResponse) => void,
  ) => void;

  'game:action': (
    payload: { action: A },
    ack: (res: AckResponse) => void,
  ) => void;

  'room:leave': (
    payload: Record<string, unknown> | undefined,
    ack: (res: AckResponse) => void,
  ) => void;
}

export interface ServerToClientEvents<V = unknown> {
  'room:state': (payload: RoomState) => void;
  'game:view': (payload: GameViewPayload<V>) => void;
}
