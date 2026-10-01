import React, { useEffect, useRef, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import { sideEffectsGame } from '@boardgame/game-side-effects';
import QRCode from 'qrcode';
import type { UserSession } from '../net/session.js';

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
        maxWidth: '420px',
        margin: '0 auto',
        padding: '16px',
        gap: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header mã phòng */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#122520',
          borderRadius: '16px',
          padding: '20px 16px',
          border: '1px solid #224036',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#97baad', textTransform: 'uppercase' }}>
          Mã phòng chờ
        </span>
        <div
          style={{
            fontSize: '36px',
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#38ef7d',
            fontFamily: 'monospace',
          }}
        >
          {roomState.roomCode}
        </div>

        {/* Nút sao chép mã & link */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => copyToClipboard(roomState.roomCode, true)}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: '#1a382e',
              border: '1px solid #285446',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {copiedCode ? '✅ Đã chép mã' : '📋 Chép mã phòng'}
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(inviteUrl, false)}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
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
            backgroundColor: '#0b1915',
            color: '#97baad',
            border: '1px solid #224036',
            borderRadius: '8px',
            padding: '8px 10px',
            fontSize: '11px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        />

        {/* Mã QR */}
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '4px' }} />
        </div>
        <span style={{ fontSize: '12px', color: '#5e8275' }}>Quét mã QR để vào phòng trên điện thoại</span>
      </section>

      {/* Danh sách người chơi */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#122520',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid #224036',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
            Người chơi ({roomState.players.length}/{maxPlayers})
          </h2>
          <span style={{ fontSize: '12px', color: roomState.players.length >= 2 ? '#34d399' : '#fbbf24' }}>
            {roomState.players.length >= 2 ? 'Đủ điều kiện bắt đầu' : 'Cần tối thiểu 2 người'}
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
              style={{
                width: '100%',
                minHeight: '40px',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: isFull ? '#1a362d' : '#1e4d3d',
                border: '1px solid #2d6b55',
                color: isFull ? '#5e8275' : '#4ade80',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isLoading || isFull ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: isFull ? 0.7 : 1,
              }}
            >
              🤖 {isFull ? `Phòng đã đủ ${maxPlayers} người` : 'Thêm máy (Thường)'}
            </button>
          </div>
        )}

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
                  backgroundColor: isMe ? 'rgba(34, 197, 94, 0.12)' : '#0b1915',
                  border: isMe ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #1a362d',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: p.isBot ? '#38ef7d' : p.connected ? '#10b981' : '#64748b',
                    }}
                    title={p.isBot ? 'Máy chơi' : p.connected ? 'Trực tuyến' : 'Mất kết nối'}
                  />
                  <span style={{ fontSize: '14px', fontWeight: isMe ? 700 : 500, color: '#f8fafc' }}>
                    {p.isBot && '🤖 '}{p.name} {isMe && <span style={{ color: '#4ade80', fontSize: '12px' }}>(Bạn)</span>}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isPlayerHost && (
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
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
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
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

      {/* Hành động Bắt đầu / Rời phòng */}
      <footer style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        {isHost ? (
          <button
            type="button"
            onClick={onStartRoom}
            disabled={!canStart || isLoading}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: canStart ? '#16a34a' : '#1a362d',
              color: canStart ? '#ffffff' : '#5e8275',
              fontSize: '16px',
              fontWeight: 700,
              border: canStart ? 'none' : '1px solid #285446',
              cursor: canStart && !isLoading ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.7,
              boxShadow: canStart ? '0 4px 14px rgba(22, 163, 74, 0.4)' : 'none',
            }}
          >
            {canStart ? '🚀 Bắt đầu trò chơi' : 'Chờ thêm người chơi (tối thiểu 2)'}
          </button>
        ) : (
          <div
            style={{
              padding: '12px',
              textAlign: 'center',
              backgroundColor: '#122520',
              borderRadius: '12px',
              border: '1px solid #224036',
              fontSize: '13px',
              color: '#97baad',
            }}
          >
            ⏳ Đang chờ chủ phòng bắt đầu trò chơi…
          </div>
        )}

        <button
          type="button"
          onClick={onLeaveRoom}
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          🚪 Rời phòng
        </button>
      </footer>
    </div>
  );
};
