import React from 'react';
import type { SEPlayerViewPlayer } from '@boardgame/game-side-effects';
import { Card } from './Card.js';
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
  onHoldCard?: (cardId: string) => void;
  isLandscape?: boolean;
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
  onHoldCard,
  isLandscape = false,
}) => {
  const isBotPlayer =
    isBot !== undefined
      ? isBot
      : playerName.startsWith('Máy ') ||
        playerName.includes('(Thường)') ||
        playerName.includes('(Khó)');

  const untreatedCount = opponent.psyche.filter((s) => s.drug === null).length;

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

  let borderStyle = '1px solid #334155';
  let boxShadowStyle = '0 2px 6px rgba(0,0,0,0.25)';

  if (giveTarget) {
    borderStyle = '2px solid #4ade80';
    boxShadowStyle = '0 0 12px rgba(74, 222, 128, 0.7)';
  } else if (isActive) {
    borderStyle = '2px solid #38bdf8';
    boxShadowStyle = '0 0 10px rgba(56, 189, 248, 0.6)';
  }

  // Kích thước slot mini trong Thể Trạng đối thủ: gọn gàng cho 3 đối thủ
  const miniWidth = isLandscape ? 32 : 28;
  const miniHeight = isLandscape ? 48 : 40;
  const miniStagger = isLandscape ? 12 : 9;

  return (
    <div
      onClick={handleClickSeat}
      data-testid={`opponent-seat-${opponent.id}`}
      data-position={position}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isLandscape ? '3px 5px' : '2px 4px',
        backgroundColor: isActive ? 'rgba(30, 58, 138, 0.45)' : '#1e293b',
        borderRadius: '8px',
        border: borderStyle,
        boxShadow: boxShadowStyle,
        cursor: 'pointer',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        minWidth: 0,
        width: '100%',
        gap: '2px',
      }}
    >
      {/* 1. Header ghế: Tên đối thủ + Lượt + Số lá trên tay */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: '11px',
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
                fontSize: '11px',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Mất kết nối
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {isActive && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                padding: '1px 5px',
                borderRadius: '3px',
                border: '1px solid #38bdf8',
              }}
            >
              Đang đi
            </span>
          )}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#cbd5e1',
              backgroundColor: '#0f172a',
              padding: '1px 5px',
              borderRadius: '3px',
              border: '1px solid #334155',
            }}
          >
            {opponent.handCount} lá
          </span>
        </div>
      </div>

      {/* 2. Dòng trạng thái bệnh lý & hình phạt */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: untreatedCount === 0 ? '#4ade80' : untreatedCount === 1 ? '#facc15' : '#fda4af',
            whiteSpace: 'nowrap',
          }}
        >
          {untreatedCount === 0 ? 'Đã chữa hết' : `Còn ${untreatedCount} bệnh`}
        </span>

        {/* Các hình phạt nếu có: không dùng emoji, ghi chữ ngắn gọn */}
        {(opponent.skipTurns > 0 ||
          opponent.preventPlayCardsTurns > 0 ||
          opponent.preventDrawTurns > 0) && (
          <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
            {opponent.skipTurns > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fbbf24',
                  backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                }}
                title="Mất lượt"
              >
                Mất lượt ({opponent.skipTurns})
              </span>
            )}
            {opponent.preventPlayCardsTurns > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#f87171',
                  backgroundColor: 'rgba(248, 113, 113, 0.2)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(248, 113, 113, 0.4)',
                }}
                title="Liệt"
              >
                Liệt ({opponent.preventPlayCardsTurns})
              </span>
            )}
            {opponent.preventDrawTurns > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fb923c',
                  backgroundColor: 'rgba(251, 146, 60, 0.2)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  border: '1px solid rgba(251, 146, 60, 0.4)',
                }}
                title="Nhịn rút"
              >
                Nhịn rút ({opponent.preventDrawTurns})
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Thể Trạng đối thủ dạng BẬC THANG MINI (Góp ý B & D2) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '6px',
          border: '1px solid #334155',
          alignItems: 'flex-start',
        }}
      >
        {opponent.psyche.length === 0 ? (
          <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '2px 4px' }}>
            Chưa có Bệnh Lý
          </span>
        ) : (
          opponent.psyche.map((slot) => {
            const isTreated = slot.drug !== null;
            const isEpisodeTarget = episodeTargetDisorderIds.includes(slot.disorder.instanceId);
            const slotHeight = isTreated ? miniHeight + miniStagger : miniHeight;

            return (
              <div
                key={slot.disorder.instanceId}
                onClick={(e) => handleDisorderClick(e, slot.disorder.instanceId)}
                data-testid={`opponent-disorder-${slot.disorder.instanceId}`}
                style={{
                  position: 'relative',
                  width: `${miniWidth}px`,
                  height: `${slotHeight}px`,
                  cursor: isEpisodeTarget ? 'pointer' : 'default',
                  transform: isEpisodeTarget ? 'scale(1.04)' : 'none',
                  flexShrink: 0,
                }}
              >
                {/* LÁ BỆNH LÝ DƯỚI (z-index 1) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${miniWidth}px`,
                    height: `${miniHeight}px`,
                    zIndex: 1,
                  }}
                >
                  <Card
                    cardId={slot.disorder.cardId}
                    size="mini"
                    isTarget={isEpisodeTarget}
                    onHold={() => onHoldCard?.(slot.disorder.cardId)}
                  />
                </div>

                {/* LÁ THUỐC ĐÈ TRÊN, LỆCH XUỐNG DƯỚI (z-index 2) - Góp ý B */}
                {slot.drug && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${miniStagger}px`,
                      left: 0,
                      width: `${miniWidth}px`,
                      height: `${miniHeight}px`,
                      zIndex: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
                    }}
                  >
                    <Card
                      cardId={slot.drug.cardId}
                      size="mini"
                      style={{ border: '1.5px solid #22c55e' }}
                      onHold={() => onHoldCard?.(slot.drug!.cardId)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
