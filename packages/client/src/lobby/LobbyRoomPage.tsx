import React, { useEffect, useRef, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import QRCode from 'qrcode';
import type { UserSession } from '../net/session.js';
import { clientGameRegistry } from '../games/registry.js';

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
  const plugin = clientGameRegistry.getOrDefault(roomState.gameId);
  const ActiveRulesModal = plugin.RulesModalComponent;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [hasReadRules, setHasReadRules] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(plugin.rulesStorageKey) === 'true';
    }
    return true;
  });

  const handleOpenRules = () => {
    setShowRules(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(plugin.rulesStorageKey, 'true');
      setHasReadRules(true);
    }
  };

  const inviteUrl = `${window.location.origin}/?room=${roomState.roomCode}`;
  const isHost = roomState.hostId === session.playerId;
  const minPlayers = plugin.game.minPlayers ?? 2;
  const maxPlayers = plugin.game.maxPlayers ?? 4;
  const canStart = roomState.players.length >= minPlayers;
  const isFull = roomState.players.length >= maxPlayers;
  const emptySlotsCount = Math.max(0, maxPlayers - roomState.players.length);

  // Vẽ QR code nét cao
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        inviteUrl,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0a1a14',
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
    <div className="lobby-container">
      <div className="lobby-grid">
        {/* CỘT TRÁI: THÔNG TIN PHÒNG, MÃ PHÒNG, NÚT SAO CHÉP & QR CODE */}
        <section className="casino-glass casino-card-hover lobby-col-info">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: '15px', flexShrink: 0 }}>🎰</span>
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{plugin.icon}</span>
              <span
                className="font-display"
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#facc15',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {plugin.title} • Phòng chờ VIP
              </span>
            </div>

            <button
              type="button"
              data-testid="rules-button"
              onClick={handleOpenRules}
              className="btn-gold"
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                minHeight: '26px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
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

          {/* KHỐI MÃ PHÒNG + QR CODE: TRÊN MOBILE XẾP NGANG, TRÊN PC XẾP DỌC */}
          <div className="lobby-code-qr-row">
            <div className="lobby-code-side">
              <div className="font-display text-gold-gradient lobby-room-code">
                {roomState.roomCode}
              </div>

              <div className="lobby-copy-buttons">
                <button
                  type="button"
                  onClick={() => copyToClipboard(roomState.roomCode, true)}
                  className="btn-gold"
                  style={{
                    flex: 1,
                    minHeight: '38px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    color: copiedCode ? '#34d399' : '#facc15',
                    borderColor: copiedCode ? 'rgba(16, 185, 129, 0.6)' : 'rgba(212, 175, 55, 0.45)',
                    padding: '4px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copiedCode ? '✓ Đã sao chép mã!' : '📋 Sao chép mã'}
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(inviteUrl, false)}
                  className="btn-emerald"
                  style={{
                    flex: 1,
                    minHeight: '38px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    padding: '4px 10px',
                    whiteSpace: 'nowrap',
                    background: copiedLink
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  }}
                >
                  {copiedLink ? '✓ Đã sao chép link!' : '🔗 Sao chép liên kết'}
                </button>
              </div>
            </div>

            <div className="lobby-qr-side">
              <div className="lobby-qr-box">
                <canvas ref={canvasRef} />
              </div>
              <span style={{ fontSize: '11px', color: '#97baad', letterSpacing: '0.2px', textAlign: 'center' }}>
                Quét mã vào bàn
              </span>
            </div>
          </div>

          {/* Ô hiển thị link mời (readonly) */}
          <input
            data-testid="invite-url-input"
            readOnly
            value={inviteUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="casino-input"
            style={{
              width: '100%',
              color: '#a7c2b7',
              borderRadius: '10px',
              padding: '7px 10px',
              fontSize: '12px',
              textAlign: 'center',
              letterSpacing: '0.3px',
              boxSizing: 'border-box',
            }}
          />
        </section>

        {/* CỘT PHẢI: VỊ TRÍ NGỒI (GHẾ BÀN CHƠI) + THÊM MÁY + NÚT BẮT ĐẦU */}
        <section className="casino-glass casino-card-hover lobby-col-seats">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>👥</span>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.4px' }}>
                Vị trí ngồi ({roomState.players.length}/{maxPlayers})
              </h2>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '999px',
                backgroundColor: roomState.players.length >= minPlayers ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                border: roomState.players.length >= minPlayers ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
                color: roomState.players.length >= minPlayers ? '#34d399' : '#facc15',
              }}
            >
              {roomState.players.length >= minPlayers ? '✓ Đủ điều kiện bắt đầu' : `⏳ Cần tối thiểu ${minPlayers} người`}
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
                className="btn-gold"
                style={{
                  width: '100%',
                  minHeight: '40px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  opacity: isFull ? 0.6 : 1,
                  cursor: isLoading || isFull ? 'not-allowed' : 'pointer',
                }}
              >
                <span>🤖</span>
                <span>{isFull ? `Phòng đã đủ ${maxPlayers} người` : 'Thêm máy (Thường)'}</span>
              </button>
            </div>
          )}

          {/* Danh sách các ghế ngồi */}
          <div className="lobby-seats-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {roomState.players.map((p) => {
              const isMe = p.playerId === session.playerId;
              const isPlayerHost = p.playerId === roomState.hostId;
              return (
                <div
                  key={p.playerId}
                  className="lobby-seat-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: isMe
                      ? 'rgba(16, 185, 129, 0.16)'
                      : 'rgba(6, 18, 14, 0.88)',
                    border: isMe
                      ? '1px solid rgba(212, 175, 55, 0.5)'
                      : '1px solid rgba(212, 175, 55, 0.22)',
                    borderRadius: '12px',
                    boxShadow: isMe ? '0 4px 14px rgba(16, 185, 129, 0.18)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isMe ? '#065f46' : '#1e293b',
                        border: isPlayerHost ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        boxShadow: isPlayerHost ? '0 0 10px rgba(234, 179, 8, 0.45)' : 'none',
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
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '9999px',
                          border: '1px solid rgba(245, 158, 11, 0.45)',
                          letterSpacing: '0.4px',
                          boxShadow: '0 0 8px rgba(245, 158, 11, 0.2)',
                        }}
                      >
                        👑 Chủ phòng
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
                          backgroundColor: 'rgba(239, 68, 68, 0.18)',
                          color: '#fca5a5',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
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

            {/* Các vị trí ghế trống */}
            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="animate-pulse-breathe"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 14px',
                  border: '1px dashed rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(6, 18, 14, 0.45)',
                  color: '#a7c2b7',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                }}
              >
                <span>🪑</span>
                <span>Đang chờ bạn bè tham gia...</span>
              </div>
            ))}
          </div>

          {/* HÀNH ĐỘNG BẮT ĐẦU / RỜI PHÒNG (GẮN LIỀN VỚI CỘT PHÒNG/GHẾ) */}
          <footer className="lobby-action-footer">
            {isHost ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <button
                  type="button"
                  onClick={onStartRoom}
                  disabled={!canStart || isLoading}
                  className={`btn-emerald ${canStart ? 'animate-emerald-pulse' : ''}`}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    opacity: canStart ? 1 : 0.5,
                    cursor: canStart && !isLoading ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span>{canStart ? '🚀 Bắt đầu ván chơi' : 'Bắt đầu ván chơi'}</span>
                </button>
                {!canStart && (
                  <span style={{ fontSize: '11px', color: '#a7c2b7', textAlign: 'center', fontStyle: 'italic' }}>
                    Cần tối thiểu {minPlayers} người để bắt đầu
                  </span>
                )}
              </div>
            ) : (
              <div
                className="casino-glass-panel"
                style={{
                  padding: '14px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ animation: 'spin 3s linear infinite' }}>⏳</span>
                <span>Đang đợi chủ phòng khai cuộc…</span>
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
        </section>
      </div>

      <ActiveRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
};
