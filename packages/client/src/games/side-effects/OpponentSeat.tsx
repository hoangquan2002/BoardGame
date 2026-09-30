import React from 'react';
import {
  getCardDisplayNameVi,
  getDisorderDef,
  getDisorderNameVi,
  type SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import type { SeatPosition } from './seats.js';

export interface OpponentSeatProps {
  opponent: SEPlayerViewPlayer;
  playerName: string;
  isActive: boolean;
  position?: SeatPosition;
  isDisconnected?: boolean;
  isBot?: boolean;
  giveTarget?: boolean;
  episodeTargetDisorderIds?: string[];
  onSelectSeatTarget?: (playerId: string) => void;
  onSelectDisorderTarget?: (playerId: string, disorderInstanceId: string) => void;
  onOpenDetails: (playerId: string) => void;
  isLandscape?: boolean;
}

/**
 * Viết tắt tên bệnh lý khi không gian hạn hẹp (vẫn rõ nghĩa và phân biệt được)
 */
export function getShortDisorderNameVi(nameVi: string): string {
  switch (nameVi) {
    case 'Nghiện cờ bạc':
      return 'Ng. cờ bạc';
    case 'Chứng biếng ăn':
      return 'Biếng ăn';
    case 'Suy nghĩ tự tử':
      return 'Ý nghĩ tự tử';
    default:
      return nameVi;
  }
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  opponent,
  playerName,
  isActive,
  position = 'top',
  isDisconnected = false,
  isBot,
  giveTarget = false,
  episodeTargetDisorderIds = [],
  onSelectSeatTarget,
  onSelectDisorderTarget,
  onOpenDetails,
  isLandscape = false,
}) => {
  // Xác định bot từ prop isBot truyền từ roomState, fallback nếu không có
  const isBotPlayer =
    isBot !== undefined
      ? isBot
      : playerName.startsWith('Máy ') ||
        playerName.includes('(Thường)') ||
        playerName.includes('(Khó)');

  const untreatedCount = opponent.psyche.filter((s) => s.drug === null).length;
  const hasRevealedCards = opponent.revealedHand && opponent.revealedHand.length > 0;

  const handleClickSeat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (giveTarget && onSelectSeatTarget) {
      onSelectSeatTarget(opponent.id);
    } else {
      onOpenDetails(opponent.id);
    }
  };

  const handleDisorderClick = (e: React.MouseEvent, disorderInstanceId: string) => {
    e.stopPropagation();
    if (episodeTargetDisorderIds.includes(disorderInstanceId) && onSelectDisorderTarget) {
      onSelectDisorderTarget(opponent.id, disorderInstanceId);
    } else {
      onOpenDetails(opponent.id);
    }
  };

  // Kiểu dáng viền và đổ bóng
  let borderStyle = '1px solid #334155';
  let boxShadowStyle = '0 2px 6px rgba(0,0,0,0.25)';

  if (giveTarget) {
    borderStyle = '2px solid #4ade80';
    boxShadowStyle = '0 0 12px rgba(74, 222, 128, 0.7)';
  } else if (isActive) {
    borderStyle = '2px solid #3b82f6';
    boxShadowStyle = '0 0 10px rgba(59, 130, 246, 0.6)';
  }

  return (
    <div
      onClick={handleClickSeat}
      data-testid={`opponent-seat-${opponent.id}`}
      data-position={position}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isLandscape ? '4px 6px' : '5px 7px',
        backgroundColor: isActive ? 'rgba(30, 58, 138, 0.45)' : '#1e293b',
        borderRadius: '10px',
        border: borderStyle,
        boxShadow: boxShadowStyle,
        cursor: 'pointer',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        minWidth: 0,
        width: '100%',
        gap: isLandscape ? '2px' : '3px',
      }}
    >
      {/* 1. Header ghế: Tên người chơi, robot, online, lượt, số lá */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: isLandscape ? '10px' : '11px',
              fontWeight: 800,
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isBotPlayer ? `🤖 ${playerName}` : playerName}
          </span>
          {isDisconnected && (
            <span
              style={{
                fontSize: '8px',
                padding: '1px 3px',
                borderRadius: '3px',
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Mất kn
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
          {isActive && (
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 900,
                color: '#60a5fa',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                padding: '1px 4px',
                borderRadius: '3px',
                border: '1px solid #3b82f6',
              }}
            >
              LƯỢT
            </span>
          )}
          <span
            style={{
              fontSize: isLandscape ? '9px' : '10px',
              fontWeight: 700,
              color: '#cbd5e1',
              backgroundColor: '#0f172a',
              padding: '1px 4px',
              borderRadius: '3px',
              border: '1px solid #334155',
            }}
          >
            🃏 {opponent.handCount} lá
          </span>
        </div>
      </div>

      {/* 2. Dòng "Còn X bệnh chưa chữa" & Huy hiệu hình phạt */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
        <span
          style={{
            fontSize: isLandscape ? '8.5px' : '9.5px',
            fontWeight: 700,
            color: untreatedCount === 0 ? '#4ade80' : untreatedCount === 1 ? '#facc15' : '#fda4af',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {untreatedCount === 0
            ? '🎉 0 bệnh'
            : `Còn ${untreatedCount} bệnh`}
        </span>

        {/* Các hình phạt đang chịu */}
        {(opponent.skipTurns > 0 ||
          opponent.preventPlayCardsTurns > 0 ||
          opponent.preventDrawTurns > 0) && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {opponent.skipTurns > 0 && (
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: '#fbbf24',
                  backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  padding: '1px 3px',
                  borderRadius: '3px',
                }}
                title="Mất lượt"
              >
                😴 {opponent.skipTurns}
              </span>
            )}
            {opponent.preventPlayCardsTurns > 0 && (
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: '#f87171',
                  backgroundColor: 'rgba(248, 113, 113, 0.2)',
                  padding: '1px 3px',
                  borderRadius: '3px',
                }}
                title="Không được đánh bài"
              >
                ⚡ {opponent.preventPlayCardsTurns}
              </span>
            )}
            {opponent.preventDrawTurns > 0 && (
              <span
                style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  color: '#fb923c',
                  backgroundColor: 'rgba(251, 146, 60, 0.2)',
                  padding: '1px 3px',
                  borderRadius: '3px',
                }}
                title="Không được rút bài"
              >
                🍽️ {opponent.preventDrawTurns}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Danh sách Thể Trạng (Tất cả Bệnh Lý + Thuốc) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isLandscape ? '2px' : '2px',
          backgroundColor: '#0f172a',
          padding: isLandscape ? '2px 4px' : '3px 5px',
          borderRadius: '6px',
          border: '1px solid #334155',
        }}
      >
        {opponent.psyche.length === 0 ? (
          <span style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
            Chưa có Bệnh Lý nào
          </span>
        ) : (
          opponent.psyche.map((slot) => {
            const isTreated = slot.drug !== null;
            const disorderDef = getDisorderDef(slot.disorder.cardId);
            const rawDisorderName = disorderDef?.nameVi || getDisorderNameVi(slot.disorder.cardId);
            const disorderName = getShortDisorderNameVi(rawDisorderName);
            const isEpisodeTarget = episodeTargetDisorderIds.includes(slot.disorder.instanceId);

            return (
              <div
                key={slot.disorder.instanceId}
                onClick={(e) => handleDisorderClick(e, slot.disorder.instanceId)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: isLandscape ? '1px 3px' : '2px 4px',
                  borderRadius: '4px',
                  backgroundColor: isEpisodeTarget
                    ? 'rgba(74, 222, 128, 0.25)'
                    : isTreated
                      ? 'rgba(6, 78, 59, 0.35)'
                      : 'rgba(76, 5, 25, 0.35)',
                  border: isEpisodeTarget
                    ? '1.5px solid #4ade80'
                    : isTreated
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(244, 63, 94, 0.4)',
                  boxShadow: isEpisodeTarget ? '0 0 6px rgba(74, 222, 128, 0.7)' : 'none',
                  cursor: isEpisodeTarget ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  gap: '3px',
                }}
              >
                {/* Tên Bệnh Lý tiếng Việt */}
                <span
                  style={{
                    fontSize: isLandscape ? '8.5px' : '9.5px',
                    fontWeight: 700,
                    color: isTreated ? '#cbd5e1' : '#fda4af',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                  }}
                  title={rawDisorderName}
                >
                  ⚠️ {disorderName}
                </span>

                {/* Trạng thái đã chữa / chưa chữa & nút Đánh Triệu Chứng */}
                {isEpisodeTarget ? (
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 900,
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      letterSpacing: '0.2px',
                      flexShrink: 0,
                    }}
                  >
                    ⚡ ĐÁNH
                  </span>
                ) : isTreated ? (
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#6ee7b7',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: isLandscape ? '65px' : '75px',
                      flexShrink: 0,
                    }}
                  >
                    💊 {getCardDisplayNameVi(slot.drug!)}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 700,
                      color: '#f87171',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}
                  >
                    Chưa
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Thẻ bài bị lộ trên tay nếu có (revealedHand do Lo âu) */}
      {hasRevealedCards && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px dashed #f43f5e',
            borderRadius: '4px',
            padding: '1px 4px',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#fca5a5', flexShrink: 0 }}>
            👁️ Lộ:
          </span>
          <div style={{ display: 'flex', gap: '2px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {opponent.revealedHand!.map((c) => (
              <span
                key={c.instanceId}
                style={{
                  fontSize: '8px',
                  fontWeight: 600,
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  padding: '1px 3px',
                  borderRadius: '2px',
                  border: '1px solid #475569',
                }}
              >
                {getCardDisplayNameVi(c)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Nhãn nổi bật khi là mục tiêu ĐƯA BỆNH LÝ */}
      {giveTarget && (
        <div
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            fontSize: '8.5px',
            fontWeight: 900,
            textAlign: 'center',
            padding: '2px 4px',
            borderRadius: '4px',
            letterSpacing: '0.3px',
          }}
        >
          ➕ CHẠM ĐỂ ĐƯA BỆNH LÝ
        </div>
      )}
    </div>
  );
};

