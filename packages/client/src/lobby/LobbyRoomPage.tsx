import React, { useEffect, useRef, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import { sideEffectsGame } from '@boardgame/game-side-effects';
import QRCode from 'qrcode';
import type { UserSession } from '../net/session.js';
import { RulesModal } from '../games/side-effects/RulesModal.js';

interface LobbyRoomPageProps {
  roomState: RoomState;
  session: UserSession;
  isLoading: boolean;
  onStartRoom: () => Promise<boolean>;
  onAddBot?: (level: string) => Promise<boolean>;
  onRemoveBot?: (playerId: string) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
}

export const LobbyRoomPage: React.FC<LobbyRoomPageProps> = ({
  roomState,
  session,
  isLoading,
  onStartRoom,
  onAddBot,
  onRemoveBot,
  onLeaveRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [hasReadRules, setHasReadRules] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('side_effects_rules_read') === 'true';
    }
    return true;
  });

  const handleOpenRules = () => {
    setShowRules(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('side_effects_rules_read', 'true');
      setHasReadRules(true);
    }
  };

  const inviteUrl = `${window.location.origin}/?room=${roomState.roomCode}`;
  const isHost = roomState.hostId === session.playerId;
  const canStart = roomState.players.length >= 2;
  const maxPlayers = sideEffectsGame.maxPlayers;
  const isFull = roomState.players.length >= maxPlayers;

  // Vẽ QR code
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        inviteUrl,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Lỗi tạo mã QR:', error);
        },
      );
    }
  }, [inviteUrl]);

  const copyToClipboard = async (text: string, isCode: boolean) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (isCode) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error('Không thể sao chép:', err);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        padding: '16px',
        gap: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* HEADER MÃ PHÒNG PHONG CÁCH VIP CASINO SUITE */}
      <section
        className="casino-card-hover"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(16, 36, 29, 0.9) 0%, rgba(8, 20, 16, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '18px',
          padding: '20px 18px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.08)',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🎰</span>
            <span
              className="font-display"
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#facc15',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Phòng chờ VIP
            </span>
          </div>

          <button
            type="button"
            data-testid="rules-button"
            onClick={handleOpenRules}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              color: '#fde047',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {!hasReadRules && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#eab308',
                  boxShadow: '0 0 8px #eab308',
                  animation: 'goldPulse 1.5s infinite',
                }}
              />
            )}
            📖 Luật chơi
          </button>
        </div>

        {/* MÃ PHÒNG MẠ VÀNG NỔI KHỐI */}
        <div
          style={{
            fontSize: '38px',
            fontWeight: 900,
            letterSpacing: '6px',
            fontFamily: 'monospace',
            background: 'linear-gradient(135deg, #ffffff 0%, #fde047 38%, #eab308 72%, #ca8a04 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 8px rgba(234, 179, 8, 0.35))',
            margin: '4px 0',
          }}
        >
          {roomState.roomCode}
        </div>

        {/* Nút sao chép mã & link */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '2px' }}>
          <button
            type="button"
            onClick={() => copyToClipboard(roomState.roomCode, true)}
            className="casino-btn-active"
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(26, 56, 46, 0.9) 0%, rgba(14, 34, 27, 0.9) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedCode ? '✅ Đã chép mã' : '📋 Chép mã phòng'}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(inviteUrl, false)}
            className="casino-btn-active"
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedLink ? '✅ Đã chép link' : '🔗 Chép link mời'}
          </button>
        </div>

        {/* Ô hiển thị link mời (readonly) */}
        <input
          data-testid="invite-url-input"
          readOnly
          value={inviteUrl}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          style={{
            width: '100%',
            backgroundColor: 'rgba(6, 18, 14, 0.85)',
            color: '#a7c2b7',
            border: '1px solid rgba(212, 175, 55, 0.22)',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '12px',
            boxSizing: 'border-box',
            textAlign: 'center',
            letterSpacing: '0.3px',
          }}
        />

        {/* Mã QR với viền mạ vàng và nền sáng */}
        <div
          style={{
            marginTop: '6px',
            padding: '10px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '2px solid rgba(212, 175, 55, 0.5)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(234, 179, 8, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px' }} />
        </div>
        <span style={{ fontSize: '12px', color: '#8fa89e', letterSpacing: '0.2px' }}>
          Quét mã QR để cùng chơi trên điện thoại
        </span>
      </section>

      {/* DANH SÁCH GHẾ NGỒI BÀN CHƠI (PLAYER SEATS) */}
      <section
        className="casino-card-hover"
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(16, 36, 29, 0.9) 0%, rgba(8, 20, 16, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '18px',
          padding: '18px 16px',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>👥</span>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.4px' }}>
              Người chơi ({roomState.players.length}/{maxPlayers})
            </h2>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: roomState.players.length >= 2 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
              border: roomState.players.length >= 2 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
              color: roomState.players.length >= 2 ? '#34d399' : '#facc15',
            }}
          >
            {roomState.players.length >= 2 ? '✓ Đủ điều kiện bắt đầu' : '⏳ Cần tối thiểu 2 người'}
          </span>
        </div>

        {/* Nút Thêm máy dành cho chủ phòng */}
        {isHost && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-testid="add-bot-button"
              type="button"
              onClick={() => onAddBot?.('normal')}
              disabled={isLoading || isFull}
              className="casino-btn-active"
              style={{
                width: '100%',
                minHeight: '42px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: isFull
                  ? 'rgba(26, 54, 45, 0.6)'
                  : 'linear-gradient(135deg, rgba(22, 70, 55, 0.9) 0%, rgba(14, 45, 35, 0.9) 100%)',
                border: isFull ? '1px solid rgba(212, 175, 55, 0.15)' : '1px solid rgba(212, 175, 55, 0.4)',
                color: isFull ? '#6e8f81' : '#fde047',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isLoading || isFull ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isFull ? 0.6 : 1,
                boxShadow: isFull ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🤖</span>
              <span>{isFull ? `Phòng đã đủ ${maxPlayers} người` : 'Thêm máy (Thường)'}</span>
            </button>
          </div>
        )}

        {/* Danh sách ghế người chơi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {roomState.players.map((p) => {
            const isMe = p.playerId === session.playerId;
            const isPlayerHost = p.playerId === roomState.hostId;
            return (
              <div
                key={p.playerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: isMe
                    ? 'rgba(16, 185, 129, 0.14)'
                    : 'rgba(6, 18, 14, 0.85)',
                  border: isMe
                    ? '1px solid rgba(212, 175, 55, 0.45)'
                    : '1px solid rgba(212, 175, 55, 0.18)',
                  borderRadius: '12px',
                  boxShadow: isMe ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Avatar Chip */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isMe ? '#065f46' : '#1e293b',
                      border: isPlayerHost ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      boxShadow: isPlayerHost ? '0 0 8px rgba(234, 179, 8, 0.4)' : 'none',
                    }}
                  >
                    {isPlayerHost ? '👑' : p.isBot ? '🤖' : '👤'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: p.isBot ? '#38ef7d' : p.connected ? '#10b981' : '#64748b',
                          boxShadow: p.connected ? '0 0 6px #10b981' : 'none',
                        }}
                        title={p.isBot ? 'Máy chơi' : p.connected ? 'Trực tuyến' : 'Mất kết nối'}
                      />
                      <span style={{ fontSize: '14px', fontWeight: isMe ? 800 : 600, color: '#f8fafc' }}>
                        {p.name} {isMe && <span style={{ color: '#4ade80', fontSize: '12px' }}>(Bạn)</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isPlayerHost && (
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.18)',
                        color: '#fbbf24',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        letterSpacing: '0.3px',
                      }}
                    >
                      Chủ phòng
                    </span>
                  )}
                  {p.isBot && isHost && (
                    <button
                      type="button"
                      onClick={() => onRemoveBot?.(p.playerId)}
                      disabled={isLoading}
                      className="casino-btn-active"
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ✕ Xoá
                    </button>
                  )}
                  {!p.isBot && !p.connected && (
                    <span style={{ fontSize: '11px', color: '#97baad' }}>Mất kết nối</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HÀNH ĐỘNG BẮT ĐẦU / RỜI PHÒNG */}
      <footer style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {isHost ? (
          <button
            type="button"
            onClick={onStartRoom}
            disabled={!canStart || isLoading}
            className={canStart ? 'casino-btn-active' : undefined}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              borderRadius: '12px',
              background: canStart
                ? 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)'
                : 'rgba(26, 54, 45, 0.6)',
              color: canStart ? '#ffffff' : '#6e8f81',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              border: canStart ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(212, 175, 55, 0.15)',
              cursor: canStart && !isLoading ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.65,
              boxShadow: canStart ? '0 4px 18px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{canStart ? '🚀 Bắt đầu chơi' : 'Chờ thêm người chơi (tối thiểu 2)'}</span>
          </button>
        ) : (
          <div
            style={{
              padding: '14px',
              textAlign: 'center',
              background: 'linear-gradient(180deg, rgba(16, 36, 29, 0.9) 0%, rgba(8, 20, 16, 0.95) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#d1fae5',
            }}
          >
            ⏳ Đang chờ chủ phòng bắt đầu trò chơi…
          </div>
        )}

        <button
          type="button"
          onClick={onLeaveRoom}
          disabled={isLoading}
          className="casino-btn-active"
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 700,
            border: '1px solid rgba(239, 68, 68, 0.35)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          🚪 Rời phòng
        </button>
      </footer>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
