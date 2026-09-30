import crypto from 'node:crypto';
import type { Rng, RoomPlayerInfo, RoomState, RoomStatus } from '@boardgame/core';

// 32-character alphabet excluding easily confused characters (0, O, 1, I, L)
const ROOM_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  const bytes = crypto.randomBytes(5);
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ROOM_CODE_CHARSET[bytes[i]! % ROOM_CODE_CHARSET.length];
  }
  return code;
}

export function generatePlayerId(): string {
  return 'p_' + crypto.randomBytes(4).toString('hex');
}

export function generatePlayerToken(): string {
  return crypto.randomBytes(16).toString('hex'); // 128-bit secret token
}

export interface PlayerSession {
  playerId: string;
  name: string;
  token: string;
  connected: boolean;
  socketId: string | null;
  isBot?: boolean;
  botLevel?: string;
}

export class Room {
  roomCode: string;
  gameId: string;
  status: RoomStatus = 'lobby';
  hostId: string;
  players: PlayerSession[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: any = null;
  rng: Rng | null = null;
  scheduledTimer: NodeJS.Timeout | null = null;
  botTimer: NodeJS.Timeout | null = null;
  deadline?: number;
  lastActivityAt: number;

  constructor(roomCode: string, gameId: string, hostPlayer: PlayerSession) {
    this.roomCode = roomCode;
    this.gameId = gameId;
    this.hostId = hostPlayer.playerId;
    this.players.push(hostPlayer);
    this.lastActivityAt = Date.now();
  }

  touch(): void {
    this.lastActivityAt = Date.now();
  }

  clearScheduledTimer(): void {
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }
    this.deadline = undefined;
  }

  clearBotTimer(): void {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
  }

  toRoomState(): RoomState {
    const playersInfo: RoomPlayerInfo[] = this.players.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      connected: p.connected,
      isBot: p.isBot,
      botLevel: p.botLevel,
    }));

    return {
      roomCode: this.roomCode,
      gameId: this.gameId,
      status: this.status,
      hostId: this.hostId,
      players: playersInfo,
    };
  }

  findPlayerByToken(token: string): PlayerSession | undefined {
    return this.players.find((p) => p.token === token);
  }

  findPlayerBySocketId(socketId: string): PlayerSession | undefined {
    return this.players.find((p) => p.socketId === socketId);
  }

  findPlayerById(playerId: string): PlayerSession | undefined {
    return this.players.find((p) => p.playerId === playerId);
  }
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(autoCleanup = true) {
    if (autoCleanup) {
      // Check every 5 minutes for inactive rooms (2 hours inactivity)
      this.cleanupInterval = setInterval(() => {
        this.cleanupInactiveRooms();
      }, 5 * 60 * 1000);
      // Unref interval so it does not block node from exiting
      this.cleanupInterval.unref();
    }
  }

  createRoom(gameId: string, hostPlayer: PlayerSession): Room {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }
    const room = new Room(roomCode, gameId, hostPlayer);
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  removeRoom(roomCode: string): boolean {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);
    if (room) {
      room.clearScheduledTimer();
      room.clearBotTimer();
      return this.rooms.delete(code);
    }
    return false;
  }

  cleanupInactiveRooms(maxInactiveMs: number = 2 * 60 * 60 * 1000): string[] {
    const now = Date.now();
    const removedCodes: string[] = [];
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivityAt >= maxInactiveMs) {
        room.clearScheduledTimer();
        room.clearBotTimer();
        this.rooms.delete(code);
        removedCodes.push(code);
      }
    }
    return removedCodes;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    for (const room of this.rooms.values()) {
      room.clearScheduledTimer();
      room.clearBotTimer();
    }
    this.rooms.clear();
  }
}
