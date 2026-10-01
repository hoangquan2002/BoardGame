import React, { useEffect, useState } from 'react';
import { loadSavedPlayerName } from '../net/session.js';
import { RulesModal } from '../games/side-effects/RulesModal.js';

import type { UserSession } from '../net/session.js';

interface HomePageProps {
  isLoading: boolean;
  pendingRestoreSession?: UserSession | null;
  onConfirmResumeStoredSession?: () => void;
  onDismissStoredSession?: () => void;
  onCreateRoom: (name: string) => Promise<boolean>;
  onJoinRoom: (roomCode: string, name: string) => Promise<boolean>;
}

export const HomePage: React.FC<HomePageProps> = ({
  isLoading,
  pendingRestoreSession,
  onConfirmResumeStoredSession,
  onDismissStoredSession,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [name, setName] = useState<string>(() => loadSavedPlayerName());
  const [roomCode, setRoomCode] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Điền trước mã phòng nếu có trong URL query (?room=ABCDE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.trim().toUpperCase());
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Vui lòng nhập tên của bạn');
      return;
    }
    setValidationError(null);
    await onCreateRoom(name.trim());
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Vui lòng nhập tên của bạn');
      return;
    }
    if (!roomCode.trim()) {
      setValidationError('Vui lòng nhập mã phòng');
      return;
    }
    setValidationError(null);
    await onJoinRoom(roomCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '380px',
        margin: '0 auto',
        padding: '24px 16px',
        gap: '24px',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '34px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          }}
        >
          💊
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#f8fafc',
              margin: 0,
            }}
          >
            Side Effects
          </h1>
          <button
            type="button"
            data-testid="rules-button"
            onClick={() => setShowRules(true)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: '#122520',
              border: '1px solid #224036',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            Luật chơi
          </button>
        </div>
        <p style={{ fontSize: '14px', color: '#97baad', margin: 0 }}>
          Trò chơi thẻ bài tâm lý &amp; tác dụng phụ
        </p>
      </header>

      {/* Lựa chọn khôi phục phiên từ localStorage nếu có */}
      {pendingRestoreSession && (
        <div
          role="region"
          aria-label="Khôi phục phiên chơi"
          style={{
            width: '100%',
            backgroundColor: '#122520',
            border: '2px solid #eab308',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔄</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Tìm thấy phiên chơi trước đó
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
            Bạn đang có phiên phòng{' '}
            <strong style={{ color: '#eab308' }}>{pendingRestoreSession.roomCode}</strong> với tên{' '}
            <strong style={{ color: '#34d399' }}>
              {pendingRestoreSession.playerName || 'Người chơi'}
            </strong>
            .
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onConfirmResumeStoredSession}
              style={{
                flex: '1 1 180px',
                minHeight: '44px',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
              }}
            >
              Tiếp tục là {pendingRestoreSession.playerName || 'An'} (phòng {pendingRestoreSession.roomCode})
            </button>
            <button
              type="button"
              onClick={onDismissStoredSession}
              style={{
                flex: '1 1 120px',
                minHeight: '44px',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#1a362d',
                border: '1px solid #285446',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Vào với tên khác
            </button>
          </div>
        </div>
      )}

      {validationError && (
        <div
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '13px',
            textAlign: 'center',
          }}
        >
          {validationError}
        </div>
      )}

      {/* Form nhập tên */}
      <section style={{ width: '100%' }}>
        <label
          htmlFor="playerName"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: '#97baad',
            marginBottom: '6px',
          }}
        >
          Tên của bạn
        </label>
        <input
          id="playerName"
          type="text"
          value={name}
          maxLength={20}
          placeholder="Nhập tên hiển thị..."
          onChange={(e) => {
            setName(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 14px',
            borderRadius: '12px',
            border: '1px solid #224036',
            backgroundColor: '#0f211c',
            color: '#f8fafc',
            fontSize: '16px', // Không gây zoom trên iOS
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </section>

      {/* Hành động Tạo phòng */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ➕ Tạo phòng mới
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            color: '#5e8275',
            fontSize: '13px',
            margin: '4px 0',
          }}
        >
          <div style={{ flex: 1, borderBottom: '1px solid #1f3d34' }} />
          <span style={{ padding: '0 12px' }}>hoặc tham gia phòng</span>
          <div style={{ flex: 1, borderBottom: '1px solid #1f3d34' }} />
        </div>

        {/* Hành động Vào phòng */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
          <input
            type="text"
            value={roomCode}
            maxLength={6}
            placeholder="MÃ PHÒNG"
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              if (validationError) setValidationError(null);
            }}
            disabled={isLoading}
            style={{
              flex: 1,
              minWidth: 0,
              height: '48px',
              padding: '0 12px',
              borderRadius: '12px',
              border: '1px solid #224036',
              backgroundColor: '#0f211c',
              color: '#f8fafc',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textAlign: 'center',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={isLoading}
            style={{
              flexShrink: 0,
              minWidth: '96px',
              whiteSpace: 'nowrap',
              minHeight: '48px',
              padding: '0 14px',
              borderRadius: '12px',
              backgroundColor: '#1a382e',
              border: '1px solid #2a5244',
              color: '#34d399',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            Vào phòng
          </button>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
