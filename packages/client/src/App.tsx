import React, { useEffect, useMemo, useRef } from 'react';
import { feedback } from './app/feedback/index.js';
import { OfflineBanner } from './app/OfflineBanner.js';
import { Toast } from './app/Toast.js';
import { clientGameRegistry, DEFAULT_GAME_ID } from './games/registry.js';
import { HomePage } from './lobby/HomePage.js';
import { LobbyRoomPage } from './lobby/LobbyRoomPage.js';
import { useSession } from './net/useSession.js';

export const App: React.FC = () => {
  // Kiểm tra chế độ Mock dữ liệu mẫu (Góp ý C: đưa dữ liệu mẫu vào chính GameBoard thật)
  const searchParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);
  const isMock = searchParams.get('mock') === '1' || searchParams.get('preview') === 'ek';
  const mockGameId = searchParams.get('game') ?? (searchParams.get('preview') === 'ek' ? 'exploding-kittens' : DEFAULT_GAME_ID);
  const mockPlugin = useMemo(() => clientGameRegistry.getOrDefault(mockGameId), [mockGameId]);

  const mockGameData = useMemo(() => {
    if (!isMock) return null;
    return mockPlugin.createMockData?.(searchParams) ?? null;
  }, [isMock, mockPlugin, searchParams]);

  const {
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
  } = useSession();

  const prevErrorToastRef = useRef<string | null>(null);
  useEffect(() => {
    if (errorToast && errorToast !== prevErrorToastRef.current) {
      feedback.playError();
    }
    prevErrorToastRef.current = errorToast;
  }, [errorToast]);

  // Nếu là mock mode, hiển thị GameBoard hoặc LobbyRoomPage thật với mock data
  if (isMock && mockGameData) {
    if (searchParams.get('view') === 'home') {
      return (
        <div style={{ minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
          <HomePage
            isLoading={false}
            onCreateRoom={async () => true}
            onJoinRoom={async () => true}
          />
        </div>
      );
    }

    if (searchParams.get('view') === 'lobby') {
      const mockLobbyState = { ...mockGameData.roomState, status: 'lobby' as const };
      return (
        <div style={{ minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
          <LobbyRoomPage
            roomState={mockLobbyState}
            session={mockGameData.session}
            isLoading={false}
            onStartRoom={async () => true}
            onAddBot={async () => true}
            onRemoveBot={async () => true}
            onLeaveRoom={async () => {
              window.location.href = '/';
              return true;
            }}
          />
        </div>
      );
    }

    const MockBoard = mockPlugin.BoardComponent;
    return (
      <MockBoard
        session={mockGameData.session}
        roomState={mockGameData.roomState}
        gameView={mockGameData.gameView}
        deadline={mockGameData.deadline}
        onSendAction={async () => true}
        onLeaveRoom={async () => {
          window.location.href = '/';
          return true;
        }}
      />
    );
  }

  const isPlaying = Boolean(session && roomState && roomState.status !== 'lobby' && gameView);
  const activePlugin = roomState ? clientGameRegistry.getOrDefault(roomState.gameId) : null;
  const ActiveBoard = activePlugin?.BoardComponent;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: isPlaying ? '1200px' : '1040px',
        margin: '0 auto',
        boxSizing: 'border-box',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        position: 'relative',
      }}
    >
      <OfflineBanner show={!isConnected && session !== null} />
      <Toast message={errorToast} onClose={dismissToast} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Trường hợp chưa vào phòng hoặc phòng chưa được tải */}
        {(!session || !roomState) && (
          <HomePage
            isLoading={isLoading}
            pendingRestoreSession={pendingRestoreSession}
            onConfirmResumeStoredSession={confirmResumeStoredSession}
            onDismissStoredSession={dismissStoredSession}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
          />
        )}

        {/* Phòng chờ (lobby) */}
        {session && roomState && roomState.status === 'lobby' && (
          <LobbyRoomPage
            roomState={roomState}
            session={session}
            isLoading={isLoading}
            onStartRoom={startRoom}
            onAddBot={addBot}
            onRemoveBot={removeBot}
            onLeaveRoom={leaveRoom}
          />
        )}

        {/* Bàn chơi khi đang chơi hoặc kết thúc */}
        {session && roomState && roomState.status !== 'lobby' && gameView && ActiveBoard && (
          <ActiveBoard
            session={session}
            roomState={roomState}
            gameView={gameView}
            deadline={deadline}
            onSendAction={sendAction}
            onLeaveRoom={leaveRoom}
          />
        )}
      </main>
    </div>
  );
};
