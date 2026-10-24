import React, { useEffect, useState } from 'react';
import { loadSavedPlayerName } from '../net/session.js';
import { clientGameRegistry, DEFAULT_GAME_ID } from '../games/registry.js';

import type { UserSession } from '../net/session.js';

interface HomePageProps {
  isLoading: boolean;
  pendingRestoreSession?: UserSession | null;
  onConfirmResumeStoredSession?: () => void;
  onDismissStoredSession?: () => void;
  onCreateRoom: (name: string, gameId?: string) => Promise<boolean>;
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
  const games = clientGameRegistry.getAll();
  const [selectedGameId, setSelectedGameId] = useState<string>(DEFAULT_GAME_ID);
  const activePlugin = clientGameRegistry.getOrDefault(selectedGameId);
  const ActiveRulesModal = activePlugin.RulesModalComponent;

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
    await onCreateRoom(name.trim(), selectedGameId);
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
        maxWidth: '420px',
        margin: '0 auto',
        padding: '20px 16px',
        gap: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* THẺ KHÔI PHỤC PHIÊN CHƠI CŨ (BANNER KÍNH MỜ SANG TRỌNG) */}
      {pendingRestoreSession && (
        <div
          role="region"
          aria-label="Khôi phục phiên chơi"
          className="casino-glass animate-fade-in"
          style={{
            width: '100%',
            borderRadius: '16px',
            border: '1px solid rgba(234, 179, 8, 0.55)',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxSizing: 'border-box',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(234, 179, 8, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', filter: 'drop-shadow(0 0 6px rgba(234, 179, 8, 0.5))' }}>🔄</span>
            <span
              className="font-display"
              style={{ fontSize: '13px', fontWeight: 800, color: '#fde047', letterSpacing: '0.5px' }}
            >
              Phiên chơi đang dang dở
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
            Bạn đang có ván dở tại phòng{' '}
            <strong style={{ color: '#fde047', fontFamily: 'monospace', letterSpacing: '1px' }}>
              {pendingRestoreSession.roomCode}
            </strong>{' '}
            với tên <strong style={{ color: '#34d399' }}>{pendingRestoreSession.playerName || 'Người chơi'}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <button
              type="button"
              onClick={onConfirmResumeStoredSession}
              className="btn-emerald"
              style={{
                flex: '1 1 170px',
                minHeight: '42px',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '13px',
              }}
            >
              Tiếp tục chơi ({pendingRestoreSession.roomCode})
            </button>
            <button
              type="button"
              onClick={onDismissStoredSession}
              className="btn-gold"
              style={{
                flex: '1 1 110px',
                minHeight: '42px',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#cbd5e1',
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* CARD CHÍNH PHONG CÁCH DARK CASINO & SÒNG BÀI CAO CẤP */}
      <div
        className="casino-glass casino-card-hover"
        style={{
          width: '100%',
          borderRadius: '22px',
          padding: '26px 22px',
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
          {/* HUY HIỆU CASINO CHIP NỔI BẬT ĐA TẦNG VÀ RÃNH KHÍA ÁNH KIM */}
          <div
            style={{
              position: 'relative',
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #15803d 0%, #064e3b 70%, #022c22 100%)',
              border: '2px solid #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              boxShadow: '0 0 24px rgba(234, 179, 8, 0.4), inset 0 2px 6px rgba(255, 255, 255, 0.35)',
              transition: 'transform 0.3s ease',
            }}
          >
            <span style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>{activePlugin.icon}</span>
            <div
              style={{
                position: 'absolute',
                inset: '-5px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(234, 179, 8, 0.45)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                pointerEvents: 'none',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '4px',
              width: '100%',
            }}
          >
            <h1
              className="font-display text-gold-gradient"
              style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '1.5px',
                margin: 0,
                textShadow: '0 2px 10px rgba(234, 179, 8, 0.2)',
              }}
            >
              {activePlugin.title}
            </h1>
            <button
              type="button"
              data-testid="rules-button"
              onClick={() => setShowRules(true)}
              className="btn-gold"
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                minHeight: '26px',
                whiteSpace: 'nowrap',
              }}
            >
              📖 Luật chơi
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#a7c2b7', margin: 0, letterSpacing: '0.4px', lineHeight: 1.4 }}>
            {activePlugin.subtitle}
          </p>
        </header>

        {/* BỘ CHỌN GAME KHI CÓ NHIỀU HƠN 1 GAME ĐƯỢC ĐĂNG KÝ */}
        {games.length > 1 && (
          <div
            data-testid="game-selector"
            style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {games.map((g) => {
              const isSelected = g.id === activePlugin.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGameId(g.id)}
                  className={isSelected ? 'btn-emerald' : 'btn-gold'}
                  style={{
                    flex: '1 1 140px',
                    minHeight: '38px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    padding: '6px 12px',
                    opacity: isSelected ? 1 : 0.75,
                  }}
                >
                  <span>{g.icon}</span>
                  <span>{g.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* THÔNG BÁO LỖI (VALIDATION MESSAGE) XUẤT HIỆN ÊM ÁI */}
        {validationError && (
          <div
            role="alert"
            className="animate-fade-in"
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center',
              boxSizing: 'border-box',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            }}
          >
            ⚠️ {validationError}
          </div>
        )}

        {/* FORM NHẬP TÊN NGƯỜI CHƠI */}
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
            <span>Tên người chơi</span>
            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>tối đa 20 ký tự</span>
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              id="playerName"
              type="text"
              value={name}
              maxLength={20}
              placeholder="Nhập tên của bạn..."
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              disabled={isLoading}
              className="casino-input"
              style={{
                width: '100%',
                height: '46px',
                padding: '0 14px 0 38px',
                borderRadius: '12px',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                opacity: 0.75,
                pointerEvents: 'none',
              }}
            >
              👤
            </span>
          </div>
        </section>

        {/* HÀNH ĐỘNG TẠO PHÒNG & VÀO PHÒNG */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isLoading}
            className="btn-emerald animate-emerald-pulse"
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '12px',
              fontSize: '15px',
              letterSpacing: '0.5px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
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
              fontWeight: 700,
              letterSpacing: '0.6px',
              margin: '2px 0',
            }}
          >
            <div style={{ flex: 1, borderBottom: '1px solid rgba(212, 175, 55, 0.22)' }} />
            <span style={{ padding: '0 10px', textTransform: 'uppercase' }}>hoặc tham gia phòng</span>
            <div style={{ flex: 1, borderBottom: '1px solid rgba(212, 175, 55, 0.22)' }} />
          </div>

          {/* VÀO PHÒNG BẰNG MÃ */}
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
              className="casino-input font-display"
              style={{
                flex: 1,
                minWidth: 0,
                height: '46px',
                padding: '0 12px',
                borderRadius: '12px',
                color: '#fde047',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={isLoading}
              className="btn-gold"
              style={{
                flexShrink: 0,
                minWidth: '100px',
                whiteSpace: 'nowrap',
                minHeight: '46px',
                padding: '0 16px',
                borderRadius: '12px',
                fontSize: '14px',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Vào phòng
            </button>
          </div>
        </div>
      </div>

      <ActiveRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
