import React from 'react';
import { OfflineBanner } from './app/OfflineBanner.js';
import { Toast } from './app/Toast.js';
import { GameBoard } from './games/side-effects/GameBoard.js';
import { MockGameBoard } from './games/side-effects/MockGameBoard.js';
import { HomePage } from './lobby/HomePage.js';
import { LobbyRoomPage } from './lobby/LobbyRoomPage.js';
import { useSession } from './net/useSession.js';

export const App: React.FC = () => {
  // Kiểm tra chế độ Mock bản phác theo thiết kế D0
  const isMock = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';

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

  if (isMock) {
    return <MockGameBoard />;
  }

  const isPlaying = Boolean(session && roomState && roomState.status !== 'lobby' && gameView);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: isPlaying ? '1024px' : '480px',
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

      {/* Floating badge chuyển sang bản phác giao diện mới D0 */}
      <a
        href="/?mock=1"
        data-testid="switch-to-mock-link"
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 999,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          borderRadius: '999px',
          textDecoration: 'none',
          fontSize: '11.5px',
          fontWeight: 700,
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
          border: '1px solid #38bdf8',
          opacity: 0.95,
        }}
        title="Xem bản phác giao diện mới theo thiết kế D0"
      >
        <span>🎨</span>
        <span>Bản phác D0</span>
      </a>

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
        {session && roomState && roomState.status !== 'lobby' && gameView && (
          <GameBoard
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
