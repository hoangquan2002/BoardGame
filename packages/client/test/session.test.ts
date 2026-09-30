import { beforeEach, describe, expect, it } from 'vitest';
import {
  adoptStoredSession,
  clearAllSessions,
  clearSession,
  clearTabSession,
  discardStoredSession,
  loadSavedPlayerName,
  loadSession,
  loadStoredSession,
  loadTabSession,
  savePlayerName,
  saveSession,
  SESSION_STORAGE_KEY,
  type UserSession,
} from '../src/net/session.js';

// In-memory Storage mock for Vitest Node environment
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe('Session & Multi-tab Storage Management (Phần 1 - Session Isolation)', () => {
  let mockSessionStorage: MockStorage;
  let mockLocalStorage: MockStorage;

  beforeEach(() => {
    mockSessionStorage = new MockStorage();
    mockLocalStorage = new MockStorage();
  });

  describe('saveSession and loadSession / loadTabSession', () => {
    it('returns null when storage is empty', () => {
      expect(loadTabSession(mockSessionStorage)).toBeNull();
      expect(loadStoredSession(mockLocalStorage)).toBeNull();
    });

    it('saves to both sessionStorage and localStorage with trimmed fields', () => {
      const session: UserSession = {
        roomCode: '  ab12c  ',
        token: '  token-1234567890  ',
        playerId: '  p_001  ',
        playerName: '  An  ',
      };
      saveSession(session, mockSessionStorage, mockLocalStorage);

      const fromTab = loadTabSession(mockSessionStorage);
      const fromStored = loadStoredSession(mockLocalStorage);
      const fromAlias = loadSession(mockSessionStorage);

      expect(fromTab).toEqual({
        roomCode: 'AB12C',
        token: 'token-1234567890',
        playerId: 'p_001',
        playerName: 'An',
      });
      expect(fromStored).toEqual(fromTab);
      expect(fromAlias).toEqual(fromTab);
    });

    it('returns null if JSON corrupted in storage', () => {
      mockSessionStorage.setItem(SESSION_STORAGE_KEY, '{invalid json');
      expect(loadTabSession(mockSessionStorage)).toBeNull();
    });

    it('returns null if required fields are missing in stored JSON', () => {
      mockSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ roomCode: 'ABC' }));
      expect(loadTabSession(mockSessionStorage)).toBeNull();
    });
  });

  describe('Multi-tab session isolation', () => {
    it('prevents Tab 2 from automatically hijacking Tab 1 session', () => {
      const tab1SessionStorage = new MockStorage();
      const tab2SessionStorage = new MockStorage();
      const sharedLocalStorage = new MockStorage();

      // Tab 1 creates room as An
      const sessionAn: UserSession = {
        roomCode: 'RM123',
        token: 'tok-an',
        playerId: 'p_an',
        playerName: 'An',
      };
      saveSession(sessionAn, tab1SessionStorage, sharedLocalStorage);

      // Tab 1 has session in sessionStorage
      expect(loadTabSession(tab1SessionStorage)).toEqual(sessionAn);

      // Tab 2 opens with empty sessionStorage:
      // Tab 2 MUST NOT have an active tab session!
      expect(loadTabSession(tab2SessionStorage)).toBeNull();

      // But Tab 2 can discover that localStorage has a previous session to prompt user
      expect(loadStoredSession(sharedLocalStorage)).toEqual(sessionAn);
    });

    it('allows Tab 2 to adopt stored session if user chooses "Tiếp tục"', () => {
      const tab2SessionStorage = new MockStorage();
      const sharedLocalStorage = new MockStorage();

      const sessionAn: UserSession = {
        roomCode: 'RM123',
        token: 'tok-an',
        playerId: 'p_an',
        playerName: 'An',
      };
      saveSession(sessionAn, new MockStorage(), sharedLocalStorage);

      // Tab 2 adopts stored session
      const adopted = adoptStoredSession(tab2SessionStorage, sharedLocalStorage);
      expect(adopted).toEqual(sessionAn);
      // Now Tab 2 has active tab session
      expect(loadTabSession(tab2SessionStorage)).toEqual(sessionAn);
    });

    it('allows Tab 2 to discard stored session if user chooses "Vào với tên khác"', () => {
      const tab2SessionStorage = new MockStorage();
      const sharedLocalStorage = new MockStorage();

      const sessionAn: UserSession = {
        roomCode: 'RM123',
        token: 'tok-an',
        playerId: 'p_an',
        playerName: 'An',
      };
      saveSession(sessionAn, new MockStorage(), sharedLocalStorage);

      // Tab 2 chooses "Vào với tên khác"
      discardStoredSession(sharedLocalStorage);

      // Stored session in localStorage is wiped
      expect(loadStoredSession(sharedLocalStorage)).toBeNull();
      // Tab 2 remains with no active session
      expect(loadTabSession(tab2SessionStorage)).toBeNull();
    });

    it('clearTabSession and clearSession alias only clear sessionStorage, keeping localStorage', () => {
      saveSession(
        { roomCode: 'RM99', token: 'tok', playerId: 'p1' },
        mockSessionStorage,
        mockLocalStorage,
      );

      clearSession(mockSessionStorage);
      expect(loadTabSession(mockSessionStorage)).toBeNull();
      expect(loadStoredSession(mockLocalStorage)).not.toBeNull();

      // Test clearTabSession directly
      saveSession(
        { roomCode: 'RM99', token: 'tok', playerId: 'p1' },
        mockSessionStorage,
        mockLocalStorage,
      );
      clearTabSession(mockSessionStorage);
      expect(loadTabSession(mockSessionStorage)).toBeNull();
    });

    it('clearAllSessions clears both sessionStorage and localStorage', () => {
      saveSession(
        { roomCode: 'RM99', token: 'tok', playerId: 'p1' },
        mockSessionStorage,
        mockLocalStorage,
      );

      clearAllSessions(mockSessionStorage, mockLocalStorage);
      expect(loadTabSession(mockSessionStorage)).toBeNull();
      expect(loadStoredSession(mockLocalStorage)).toBeNull();
    });
  });

  describe('player name persistence', () => {
    it('returns empty string if no name saved', () => {
      expect(loadSavedPlayerName(mockLocalStorage)).toBe('');
    });

    it('saves and loads trimmed player name', () => {
      savePlayerName('  Nguyễn Văn A  ', mockLocalStorage);
      expect(loadSavedPlayerName(mockLocalStorage)).toBe('Nguyễn Văn A');
    });
  });

  describe('Resume error recovery logic', () => {
    it('clears all sessions when resume fails (simulating room:resume error callback)', () => {
      saveSession(
        { roomCode: 'ROOM1', token: 'token-abc', playerId: 'p_abc' },
        mockSessionStorage,
        mockLocalStorage,
      );
      expect(loadTabSession(mockSessionStorage)).not.toBeNull();
      expect(loadStoredSession(mockLocalStorage)).not.toBeNull();

      // Simulate client handling room:resume error response
      const resumeResponse = { ok: false, error: 'Phòng không tồn tại hoặc đã bị xoá' };
      if (!resumeResponse.ok) {
        clearAllSessions(mockSessionStorage, mockLocalStorage);
      }

      expect(loadTabSession(mockSessionStorage)).toBeNull();
      expect(loadStoredSession(mockLocalStorage)).toBeNull();
    });
  });
});

