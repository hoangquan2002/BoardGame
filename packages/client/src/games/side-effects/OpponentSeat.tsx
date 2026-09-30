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
  giveTarget?: boolean;
  episodeTargetDisorderIds?: string[];
  onSelectSeatTarget?: (playerId: string) => void;
  onSelectDisorderTarget?: (playerId: string, disorderInstanceId: string) => void;
  onOpenDetails: (playerId: string) => void;
  isLandscape?: boolean;
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  opponent,
  playerName,
  isActive,
  position = 'top',
  isDisconnected = false,
  giveTarget = false,
  episodeTargetDisorderIds = [],
  onSelectSeatTarget,
  onSelectDisorderTarget,
  onOpenDetails,
  isLandscape = false,
}) => {
  const isBot =
    playerName.startsWith('Máy ') ||
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
  let boxShadowStyle = '0 2px 8px rgba(0,0,0,0.25)';

  if (giveTarget) {
    borderStyle = '2px solid #4ade80';
    boxShadowStyle = '0 0 14px rgba(74, 222, 128, 0.7)';
  } else if (isActive) {
    borderStyle = '2px solid #3b82f6';
    boxShadowStyle = '0 0 12px rgba(59, 130, 246, 0.6)';
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
        padding: isLandscape ? '6px 8px' : '6px 8px',
        backgroundColor: isActive ? 'rgba(30, 58, 138, 0.45)' : '#1e293b',
        borderRadius: '12px',
        border: borderStyle,
        boxShadow: boxShadowStyle,
        cursor: 'pointer',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        minWidth: 0,
        gap: '4px',
      }}
    >
      {/* 1. Header ghế: Tên người chơi, robot, online, lượt, số lá */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: isLandscape ? '11px' : '12px',
              fontWeight: 800,
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isBot ? `🤖 ${playerName}` : playerName}
          </span>
          {isDisconnected && (
            <span
              style={{
                fontSize: '9px',
                padding: '1px 4px',
                borderRadius: '4px',
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontWeight: 700,
              }}
            >
              Mất kn
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {isActive && (
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 900,
                color: '#60a5fa',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid #3b82f6',
              }}
            >
              LƯỢT
            </span>
          )}
          <span
            style={{
              fontSize: isLandscape ? '10px' : '11px',
              fontWeight: 700,
              color: '#cbd5e1',
              backgroundColor: '#0f172a',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid #334155',
            }}
          >
            🃏 {opponent.handCount} lá
          </span>
        </div>
      </div>

      {/* 2. Dòng "Còn X bệnh chưa chữa" & Huy hiệu hình phạt */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: untreatedCount === 0 ? '#4ade80' : untreatedCount === 1 ? '#facc15' : '#fda4af',
          }}
        >
          {untreatedCount === 0
            ? '🎉 0 bệnh chưa chữa'
            : `Còn ${untreatedCount} bệnh chưa chữa`}
        </span>

        {/* Các hình phạt đang chịu */}
        {(opponent.skipTurns > 0 ||
          opponent.preventPlayCardsTurns > 0 ||
          opponent.preventDrawTurns > 0) && (
          <div style={{ display: 'flex', gap: '3px' }}>
            {opponent.skipTurns > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#fbbf24',
                  backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                😴 Nghỉ ({opponent.skipTurns})
              </span>
            )}
            {opponent.preventPlayCardsTurns > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#f87171',
                  backgroundColor: 'rgba(248, 113, 113, 0.2)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                ⚡ Liệt ({opponent.preventPlayCardsTurns})
              </span>
            )}
            {opponent.preventDrawTurns > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#fb923c',
                  backgroundColor: 'rgba(251, 146, 60, 0.2)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                🍽️ Biếng ({opponent.preventDrawTurns})
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
          gap: '3px',
          backgroundColor: '#0f172a',
          padding: '4px 6px',
          borderRadius: '8px',
          border: '1px solid #334155',
        }}
      >
        {opponent.psyche.length === 0 ? (
          <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
            Chưa có Bệnh Lý nào
          </span>
        ) : (
          opponent.psyche.map((slot) => {
            const isTreated = slot.drug !== null;
            const disorderDef = getDisorderDef(slot.disorder.cardId);
            const disorderName = disorderDef?.nameVi || getDisorderNameVi(slot.disorder.cardId);
            const isEpisodeTarget = episodeTargetDisorderIds.includes(slot.disorder.instanceId);

            return (
              <div
                key={slot.disorder.instanceId}
                onClick={(e) => handleDisorderClick(e, slot.disorder.instanceId)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '2px 4px',
                  borderRadius: '5px',
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
                  boxShadow: isEpisodeTarget ? '0 0 8px rgba(74, 222, 128, 0.7)' : 'none',
                  cursor: isEpisodeTarget ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  gap: '4px',
                }}
              >
                {/* Tên Bệnh Lý tiếng Việt */}
                <span
                  style={{
                    fontSize: isLandscape ? '9.5px' : '10.5px',
                    fontWeight: 700,
                    color: isTreated ? '#cbd5e1' : '#fda4af',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  ⚠️ {disorderName}
                </span>

                {/* Trạng thái đã chữa / chưa chữa & nút Đánh Triệu Chứng */}
                {isEpisodeTarget ? (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.3px',
                      flexShrink: 0,
                    }}
                  >
                    ⚡ ĐÁNH
                  </span>
                ) : isTreated ? (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#6ee7b7',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '120px',
                      flexShrink: 0,
                    }}
                  >
                    💊 {getCardDisplayNameVi(slot.drug!)}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      color: '#f87171',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                  >
                    Chưa chữa
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
            flexDirection: 'column',
            gap: '2px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px dashed #f43f5e',
            borderRadius: '6px',
            padding: '3px 6px',
          }}
        >
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#fca5a5' }}>
            👁️ Bài bị lộ ({opponent.revealedHand!.length} lá):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {opponent.revealedHand!.map((c) => (
              <span
                key={c.instanceId}
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  padding: '1px 4px',
                  borderRadius: '3px',
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
            fontSize: '9.5px',
            fontWeight: 900,
            textAlign: 'center',
            padding: '3px 6px',
            borderRadius: '5px',
            letterSpacing: '0.5px',
          }}
        >
          ➕ CHẠM ĐỂ ĐƯA BỆNH LÝ
        </div>
      )}
    </div>
  );
};
