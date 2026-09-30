export interface UserSession {
  roomCode: string;
  token: string;
  playerId: string;
  playerName?: string;
}

export const SESSION_STORAGE_KEY = 'boardgame_session';
export const PLAYER_NAME_STORAGE_KEY = 'boardgame_player_name';

/**
 * Đọc phiên của tab hiện tại từ sessionStorage
 */
export function loadTabSession(storage?: Storage): UserSession | null {
  const s = storage ?? (typeof window !== 'undefined' ? window.sessionStorage : undefined);
  if (!s) return null;
  return parseSession(s.getItem(SESSION_STORAGE_KEY));
}

/**
 * Đọc phiên đã lưu trước đó từ localStorage (để hỏi người dùng khi mở tab mới)
 */
export function loadStoredSession(storage?: Storage): UserSession | null {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!s) return null;
  return parseSession(s.getItem(SESSION_STORAGE_KEY));
}

function parseSession(raw: string | null): UserSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.roomCode === 'string' &&
      typeof parsed?.token === 'string' &&
      typeof parsed?.playerId === 'string'
    ) {
      return {
        roomCode: parsed.roomCode.toUpperCase().trim(),
        token: parsed.token.trim(),
        playerId: parsed.playerId.trim(),
        playerName: typeof parsed?.playerName === 'string' ? parsed.playerName.trim() : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lưu phiên vào sessionStorage (của tab hiện tại) và sao lưu vào localStorage
 */
export function saveSession(
  session: UserSession,
  sStorage?: Storage,
  lStorage?: Storage,
): void {
  const sessionData = JSON.stringify({
    roomCode: session.roomCode.toUpperCase().trim(),
    token: session.token.trim(),
    playerId: session.playerId.trim(),
    playerName: session.playerName?.trim(),
  });

  const ss = sStorage ?? (typeof window !== 'undefined' ? window.sessionStorage : undefined);
  const ls = lStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

  try {
    ss?.setItem(SESSION_STORAGE_KEY, sessionData);
  } catch (err) {
    console.warn('Không thể lưu session vào sessionStorage:', err);
  }

  try {
    ls?.setItem(SESSION_STORAGE_KEY, sessionData);
  } catch (err) {
    console.warn('Không thể lưu session vào localStorage:', err);
  }
}

/**
 * Alias cho loadTabSession (tương thích ngược)
 */
export const loadSession = loadTabSession;

/**
 * Xoá phiên của tab hiện tại (khi rời phòng)
 */
export function clearTabSession(sStorage?: Storage): void {
  const ss = sStorage ?? (typeof window !== 'undefined' ? window.sessionStorage : undefined);
  try {
    ss?.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Không thể xoá sessionStorage:', err);
  }
}

/**
 * Alias cho clearTabSession (tương thích ngược)
 */
export const clearSession = clearTabSession;

/**
 * Xoá toàn bộ phiên cả ở sessionStorage và localStorage (khi phòng đã bị xoá/hết hạn)
 */
export function clearAllSessions(sStorage?: Storage, lStorage?: Storage): void {
  clearTabSession(sStorage);
  const ls = lStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  try {
    ls?.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Không thể xoá localStorage:', err);
  }
}

/**
 * Áp dụng phiên từ localStorage vào tab hiện tại khi người dùng chọn "Tiếp tục"
 */
export function adoptStoredSession(
  sStorage?: Storage,
  lStorage?: Storage,
): UserSession | null {
  const stored = loadStoredSession(lStorage);
  if (stored) {
    const ss = sStorage ?? (typeof window !== 'undefined' ? window.sessionStorage : undefined);
    try {
      ss?.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
    } catch (err) {
      console.warn('Không thể áp dụng session vào sessionStorage:', err);
    }
  }
  return stored;
}

/**
 * Huỷ phiên trong localStorage khi người dùng chọn "Vào với tên khác"
 */
export function discardStoredSession(lStorage?: Storage): void {
  const ls = lStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  try {
    ls?.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Không thể huỷ session trong localStorage:', err);
  }
}

/**
 * Đọc tên người chơi đã lưu
 */
export function loadSavedPlayerName(storage?: Storage): string {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!s) return '';
  try {
    return s.getItem(PLAYER_NAME_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Lưu tên người chơi để dùng lại các lần sau
 */
export function savePlayerName(name: string, storage?: Storage): void {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!s) return;
  try {
    s.setItem(PLAYER_NAME_STORAGE_KEY, name.trim());
  } catch (err) {
    console.warn('Không thể lưu tên người chơi:', err);
  }
}
