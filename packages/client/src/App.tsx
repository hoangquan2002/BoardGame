import React, { useMemo } from 'react';
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
  const isMock = searchParams.get('mock') === '1';
  const mockGameId = searchParams.get('game') ?? DEFAULT_GAME_ID;
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

  // Nếu là mock mode, hiển thị chính GameBoard thật với mock data
  if (isMock && mockGameData) {
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
        maxWidth: isPlaying ? '1100px' : '480px',
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
