import React, { useEffect, useState } from 'react';
import { loadSavedPlayerName } from '../net/session.js';
import { clientGameRegistry, DEFAULT_GAME_ID } from '../games/registry.js';
import { GameMenuCard } from './GameMenuCard.js';

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
  const [hasRoomQuery, setHasRoomQuery] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Điền trước mã phòng nếu có trong URL query (?room=ABCDE) và highlight khung vào phòng
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.trim().toUpperCase());
      setHasRoomQuery(true);
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
        maxWidth: '440px',
        margin: '0 auto',
        padding: '16px 14px',
        gap: '14px',
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
            padding: '14px 16px',
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
                minHeight: '40px',
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
                flex: '1 1 100px',
                minHeight: '40px',
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
          padding: '22px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxSizing: 'border-box',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '4px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎰</span>
            <h1
              className="font-display text-gold-gradient"
              style={{
                fontSize: '24px',
                fontWeight: 800,
                letterSpacing: '1px',
                margin: 0,
                textShadow: '0 2px 10px rgba(234, 179, 8, 0.2)',
              }}
            >
              Sảnh Board Game
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: '#a7c2b7', margin: 0, letterSpacing: '0.3px', lineHeight: 1.4 }}>
            Chọn trò chơi để mở bàn hoặc tham gia phòng bạn bè
          </p>
        </header>

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

        {/* KHU VỰC DANH SÁCH TRÒ CHƠI (GAME MENU LIST) */}
        <section style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <span
              className="font-display"
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#facc15',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              🎮 Kho Trò Chơi
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {games.length} trò chơi
            </span>
          </div>

          <div
            data-testid="game-menu-list"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
            }}
          >
            {games.map((g) => (
              <GameMenuCard
                key={g.id}
                plugin={g}
                isSelected={g.id === selectedGameId}
                onSelect={() => setSelectedGameId(g.id)}
                onOpenRules={() => {
                  setSelectedGameId(g.id);
                  setShowRules(true);
                }}
              />
            ))}
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
            <span>Tạo phòng mới ({activePlugin.title})</span>
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

          {/* VÀO PHÒNG BẰNG MÃ (TỰ ĐỘNG ĐIỀN VÀ HIGHLIGHT NẾU CÓ ?room=...) */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              width: '100%',
              boxSizing: 'border-box',
              padding: hasRoomQuery ? '6px' : '0',
              borderRadius: hasRoomQuery ? '14px' : '0',
              border: hasRoomQuery ? '1.5px solid #eab308' : 'none',
              boxShadow: hasRoomQuery ? '0 0 16px rgba(234, 179, 8, 0.35)' : 'none',
              background: hasRoomQuery ? 'rgba(234, 179, 8, 0.06)' : 'transparent',
              transition: 'all 0.3s ease',
            }}
          >
            <input
              type="text"
              value={roomCode}
              maxLength={6}
              placeholder="MÃ PHÒNG (ABCDE)"
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
                minWidth: '105px',
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
