import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import type { SEAction, SEPlayerView } from '@boardgame/game-side-effects';
import {
  adoptStoredSession,
  clearAllSessions,
  discardStoredSession,
  loadStoredSession,
  loadTabSession,
  savePlayerName,
  saveSession,
  type UserSession,
} from './session.js';
import { getSocket, type GameSocket } from './socket.js';

export interface UseSessionReturn {
  session: UserSession | null;
  pendingRestoreSession: UserSession | null;
  confirmResumeStoredSession: () => void;
  dismissStoredSession: () => void;
  roomState: RoomState | null;
  gameView: SEPlayerView | null;
  deadline: number | undefined;
  isConnected: boolean;
  isLoading: boolean;
  errorToast: string | null;
  dismissToast: () => void;
  createRoom: (name: string, gameId?: string) => Promise<boolean>;
  joinRoom: (roomCode: string, name: string) => Promise<boolean>;
  startRoom: () => Promise<boolean>;
  addBot: (level: string) => Promise<boolean>;
  removeBot: (playerId: string) => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  sendAction: (action: SEAction) => Promise<boolean>;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<UserSession | null>(() => loadTabSession());
  const [pendingRestoreSession, setPendingRestoreSession] = useState<UserSession | null>(() => {
    const tabSession = loadTabSession();
    if (tabSession) return null;
    return loadStoredSession();
  });

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameView, setGameView] = useState<SEPlayerView | null>(null);
  const [deadline, setDeadline] = useState<number | undefined>(undefined);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const socketRef = useRef<GameSocket | null>(null);
  const sessionRef = useRef<UserSession | null>(session);
  sessionRef.current = session;

  const dismissToast = useCallback(() => {
    setErrorToast(null);
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorToast(msg);
  }, []);

  // Người dùng chọn tiếp tục phiên đã lưu từ localStorage
  const confirmResumeStoredSession = useCallback(() => {
    const adopted = adoptStoredSession();
    if (adopted) {
      setSession(adopted);
      setPendingRestoreSession(null);
      const socket = socketRef.current;
      if (socket && socket.connected) {
        setIsLoading(true);
        socket.emit(
          'room:resume',
          { roomCode: adopted.roomCode, token: adopted.token },
          (res) => {
            setIsLoading(false);
            if (!res.ok) {
              clearAllSessions();
              setSession(null);
              setRoomState(null);
              setGameView(null);
              showError(res.error || 'Phòng không tồn tại hoặc phiên chơi đã hết hạn');
            }
          },
        );
      }
    }
  }, [showError]);

  // Người dùng chọn huỷ phiên đã lưu để vào với tên khác
  const dismissStoredSession = useCallback(() => {
    discardStoredSession();
    setPendingRestoreSession(null);
  }, []);

  // Kết nối socket và lắng nghe sự kiện
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    function handleConnect() {
      setIsConnected(true);
      const currentSession = sessionRef.current;
      if (currentSession) {
        setIsLoading(true);
        socket.emit(
          'room:resume',
          { roomCode: currentSession.roomCode, token: currentSession.token },
          (res) => {
            setIsLoading(false);
            if (!res.ok) {
              clearAllSessions();
              setSession(null);
              setRoomState(null);
              setGameView(null);
              showError(res.error || 'Phòng không tồn tại hoặc phiên chơi đã hết hạn');
            }
          },
        );
      }
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function handleRoomState(state: RoomState) {
      setRoomState(state);
    }

    function handleGameView(payload: { view: SEPlayerView; deadline?: number }) {
      setGameView(payload.view);
      setDeadline(payload.deadline);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room:state', handleRoomState);
    socket.on('game:view', handleGameView);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room:state', handleRoomState);
      socket.off('game:view', handleGameView);
    };
  }, [showError]);

  const createRoom = useCallback(
    async (name: string, gameId: string = 'side-effects'): Promise<boolean> => {
      const socket = socketRef.current;
      if (!socket) return false;
      setIsLoading(true);
      return new Promise<boolean>((resolve) => {
        socket.emit('room:create', { name, gameId }, (res) => {
          setIsLoading(false);
          if (res.ok) {
            const newSession: UserSession = {
              roomCode: res.roomCode,
              playerId: res.playerId,
              token: res.token,
              playerName: name.trim(),
            };
            saveSession(newSession);
            savePlayerName(name);
            setSession(newSession);
            setPendingRestoreSession(null);
            resolve(true);
          } else {
            showError(res.error);
            resolve(false);
          }
        });
      });
    },
    [showError],
  );

  const joinRoom = useCallback(
    async (roomCode: string, name: string): Promise<boolean> => {
      const socket = socketRef.current;
      if (!socket) return false;
      setIsLoading(true);
      return new Promise<boolean>((resolve) => {
        socket.emit(
          'room:join',
          { roomCode: roomCode.trim().toUpperCase(), name: name.trim() },
          (res) => {
            setIsLoading(false);
            if (res.ok) {
              const newSession: UserSession = {
                roomCode: res.roomCode,
                playerId: res.playerId,
                token: res.token,
                playerName: name.trim(),
              };
              saveSession(newSession);
              savePlayerName(name);
              setSession(newSession);
              setPendingRestoreSession(null);
              resolve(true);
            } else {
              showError(res.error);
              resolve(false);
            }
          },
        );
      });
    },
    [showError],
  );

  const startRoom = useCallback(async (): Promise<boolean> => {
    const socket = socketRef.current;
    if (!socket) return false;
    setIsLoading(true);
    return new Promise<boolean>((resolve) => {
      socket.emit('room:start', {}, (res) => {
        setIsLoading(false);
        if (res.ok) {
          resolve(true);
        } else {
          showError(res.error);
          resolve(false);
        }
      });
    });
  }, [showError]);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    const socket = socketRef.current;
    if (!socket) return false;
    setIsLoading(true);
    return new Promise<boolean>((resolve) => {
      socket.emit('room:leave', {}, () => {
        setIsLoading(false);
        clearAllSessions();
        setSession(null);
        setPendingRestoreSession(null);
        setRoomState(null);
        setGameView(null);
        resolve(true);
      });
    });
  }, []);

  const sendAction = useCallback(
    async (action: SEAction): Promise<boolean> => {
      const socket = socketRef.current;
      if (!socket) return false;
      return new Promise<boolean>((resolve) => {
        socket.emit('game:action', { action }, (res) => {
          if (res.ok) {
            resolve(true);
          } else {
            showError(res.error);
            resolve(false);
          }
        });
      });
    },
    [showError],
  );

  const addBot = useCallback(
    async (level: string): Promise<boolean> => {
      const socket = socketRef.current;
      if (!socket) return false;
      setIsLoading(true);
      return new Promise<boolean>((resolve) => {
        socket.emit('room:addBot', { level }, (res) => {
          setIsLoading(false);
          if (!res.ok) {
            showError(res.error);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    },
    [showError],
  );

  const removeBot = useCallback(
    async (playerId: string): Promise<boolean> => {
      const socket = socketRef.current;
      if (!socket) return false;
      setIsLoading(true);
      return new Promise<boolean>((resolve) => {
        socket.emit('room:removeBot', { playerId }, (res) => {
          setIsLoading(false);
          if (!res.ok) {
            showError(res.error);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    },
    [showError],
  );

  return {
    session,
    pendingRestoreSession,
    confirmResumeStoredSession,
    dismissStoredSession,
    roomState,
    gameView,
    deadline,
    isConnected,
    isLoading,
    errorToast,
    dismissToast,
    createRoom,
    joinRoom,
    startRoom,
    addBot,
    removeBot,
    leaveRoom,
    sendAction,
  };
}
