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
        maxWidth: '400px',
        margin: '0 auto',
        padding: '24px 16px',
        gap: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* CARD CHÍNH PHONG CÁCH DARK CASINO & SÒNG BÀI CAO CẤP */}
      <div
        className="casino-card-hover"
        style={{
          width: '100%',
          background: 'linear-gradient(180deg, rgba(16, 36, 29, 0.88) 0%, rgba(8, 20, 16, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(212, 175, 55, 0.28)',
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxSizing: 'border-box',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '8px',
            width: '100%',
          }}
        >
          {/* HUY HIỆU CASINO CHIP NỔI BẬT */}
          <div
            style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #15803d 0%, #064e3b 70%, #022c22 100%)',
              border: '2px solid #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              boxShadow: '0 0 24px rgba(234, 179, 8, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.3)',
            }}
          >
            <span style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>💊</span>
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: '1px dashed rgba(234, 179, 8, 0.4)',
                pointerEvents: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '6px', width: '100%' }}>
            <h1
              className="font-display"
              style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '1.5px',
                margin: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #fde047 38%, #eab308 72%, #ca8a04 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 10px rgba(234, 179, 8, 0.2)',
              }}
            >
              Side Effects
            </h1>
            <button
              type="button"
              data-testid="rules-button"
              onClick={() => setShowRules(true)}
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                color: '#fde047',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              📖 Luật chơi
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#a7c2b7', margin: 0, letterSpacing: '0.4px' }}>
            Board game chiến thuật Dược lý &amp; Tâm lý học
          </p>
        </header>

        {/* Lựa chọn khôi phục phiên từ localStorage nếu có */}
        {pendingRestoreSession && (
          <div
            role="region"
            aria-label="Khôi phục phiên chơi"
            style={{
              width: '100%',
              backgroundColor: 'rgba(18, 38, 30, 0.95)',
              border: '1px solid #eab308',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(234, 179, 8, 0.2)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔄</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fde047' }}>
                Tìm thấy phiên chơi trước đó
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
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
                className="casino-btn-active"
                style={{
                  flex: '1 1 180px',
                  minHeight: '42px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                }}
              >
                Tiếp tục là {pendingRestoreSession.playerName || 'An'} (phòng {pendingRestoreSession.roomCode})
              </button>
              <button
                type="button"
                onClick={onDismissStoredSession}
                className="casino-btn-active"
                style={{
                  flex: '1 1 120px',
                  minHeight: '42px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(26, 54, 45, 0.8)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
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
              border: '1px solid rgba(239, 68, 68, 0.35)',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 700,
              color: '#d1fae5',
              letterSpacing: '0.4px',
              marginBottom: '6px',
            }}
          >
            <span>Tên của bạn</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>tối đa 20 ký tự</span>
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
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
                height: '46px',
                padding: '0 14px 0 38px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backgroundColor: 'rgba(6, 18, 14, 0.85)',
                color: '#f8fafc',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#eab308';
                e.target.style.boxShadow = '0 0 0 2px rgba(234, 179, 8, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                opacity: 0.7,
                pointerEvents: 'none',
              }}
            >
              👤
            </span>
          </div>
        </section>

        {/* Hành động Tạo phòng & Vào phòng */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isLoading}
            className="casino-btn-active"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '18px' }}>🎲</span>
            <span>Tạo phòng mới</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              color: '#6e8f81',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              margin: '2px 0',
            }}
          >
            <div style={{ flex: 1, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }} />
            <span style={{ padding: '0 10px', textTransform: 'uppercase' }}>hoặc tham gia phòng</span>
            <div style={{ flex: 1, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }} />
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
                height: '46px',
                padding: '0 12px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backgroundColor: 'rgba(6, 18, 14, 0.85)',
                color: '#fde047',
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#eab308';
                e.target.style.boxShadow = '0 0 0 2px rgba(234, 179, 8, 0.25)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={isLoading}
              className="casino-btn-active"
              style={{
                flexShrink: 0,
                minWidth: '96px',
                whiteSpace: 'nowrap',
                minHeight: '46px',
                padding: '0 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(26, 56, 46, 0.9) 0%, rgba(14, 34, 27, 0.9) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                color: '#facc15',
                fontSize: '14px',
                fontWeight: 800,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              Vào phòng
            </button>
          </div>
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
