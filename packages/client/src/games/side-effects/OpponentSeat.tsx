import React, { useMemo } from 'react';
import {
  getDisorderDef,
  getDisorderNameVi,
  getDrugDef,
  type SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import { Card } from './Card.js';
import type { SeatPosition } from './seats.js';

export interface OpponentSeatProps {
  opponent: SEPlayerViewPlayer;
  playerName: string;
  isActive: boolean;
  position?: SeatPosition;
  isDisconnected?: boolean;
  isBot?: boolean;
  cardWidth?: number; // > 0: vẽ ảnh mini, 0: chế độ chỉ chữ
  giveTarget?: boolean;
  episodeTargetDisorderIds?: string[];
  dimmed?: boolean;
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
  cardWidth = 0,
  giveTarget = false,
  episodeTargetDisorderIds = [],
  dimmed = false,
  onSelectSeatTarget,
  onSelectDisorderTarget,
  onOpenDetails,
  onHoldCard,
  isLandscape: _isLandscape = false,
}) => {
  const isBotPlayer =
    isBot !== undefined
      ? isBot
      : playerName.startsWith('Máy ') ||
        playerName.includes('(Thường)') ||
        playerName.includes('(Khó)');

  // Các Bệnh Lý chưa chữa
  const untreatedSlots = opponent.psyche.filter((s) => s.drug === null);
  const untreatedCount = untreatedSlots.length;

  // Tính các bệnh lý mở cửa (tác dụng phụ của Thuốc mà đối thủ đã dùng)
  const possibleSideEffects = useMemo(() => {
    const set = new Set<string>();
    for (const slot of opponent.psyche) {
      if (slot.drug) {
        const drugDef = getDrugDef(slot.drug.cardId);
        if (drugDef) {
          for (const se of drugDef.sideEffects) {
            const disorderDef = getDisorderDef(se);
            set.add(disorderDef?.nameVi ?? se);
          }
        }
      }
    }
    return Array.from(set);
  }, [opponent.psyche]);

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
      const slot = opponent.psyche.find((s) => s.disorder.instanceId === disorderInstanceId);
      if (slot && onHoldCard) {
        onHoldCard(slot.disorder.cardId);
      }
    }
  };

  // Trạng thái theo Phần 2 mục F (Không khung lồng khung, border chỉ dùng cho trạng thái):
  let outlineStyle = 'none';
  let boxShadowStyle = '0 2px 6px rgba(0,0,0,0.35)';

  if (giveTarget) {
    outlineStyle = '2px solid #22c55e';
    boxShadowStyle = '0 0 10px rgba(34, 197, 94, 0.6)';
  } else if (isActive) {
    outlineStyle = '2px solid #38bdf8';
    boxShadowStyle = '0 0 10px rgba(56, 189, 248, 0.5)';
  }

  const cardHeight = cardWidth > 0 ? Math.round((cardWidth * 864) / 520) : 0;
  const miniStagger = Math.round(cardHeight * 0.28);

  return (
    <div
      onClick={handleClickSeat}
      data-testid={`opponent-seat-${opponent.id}`}
      data-position={position}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 6px',
        backgroundColor: isActive ? '#16332a' : '#122520',
        borderRadius: '6px',
        outline: outlineStyle,
        outlineOffset: '1px',
        boxShadow: boxShadowStyle,
        opacity: dimmed ? 0.4 : 1,
        cursor: 'pointer',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        transition: 'all 0.15s ease',
        minWidth: 0,
        width: '100%',
        gap: '4px',
      }}
    >
      {/* KHỐI TRÁI: THÔNG TIN CHỮ VÀ BỆNH LÝ (Mục C) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
        {/* 1. Dòng Header: Tên đối thủ + Lượt + Số lá trên tay */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#f8fafc',
                whiteSpace: 'normal',
                wordBreak: 'normal',
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
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  color: '#fca5a5',
                  fontWeight: 600,
                }}
              >
                Mất kết nối
              </span>
            )}
            {isActive && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#38bdf8',
                }}
              >
                (Đang đi)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: untreatedCount === 0 ? '#4ade80' : untreatedCount === 1 ? '#facc15' : '#fda4af',
              }}
            >
              {untreatedCount === 0 ? 'Đã chữa hết' : `Còn ${untreatedCount} bệnh`}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              {opponent.handCount} lá
            </span>
          </div>
        </div>

        {/* 2. Dòng liệt kê ĐỦ TÊN Bệnh Lý chưa chữa (Phần 2 mục C):
            Chấm màu + tên, giữ chữ đó -> phóng to lá tương ứng. Không cắt chữ, không bẻ đôi từ */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            fontSize: '11px',
            color: '#cbd5e1',
            lineHeight: 1.25,
          }}
        >
          {untreatedSlots.length === 0 ? (
            <span style={{ color: '#4ade80', fontSize: '11px', fontStyle: 'italic' }}>
              Không còn bệnh lý chưa chữa
            </span>
          ) : (
            untreatedSlots.map((slot) => {
              const isEpisodeTarget = episodeTargetDisorderIds.includes(slot.disorder.instanceId);
              const disorderName = getDisorderNameVi(slot.disorder.cardId);

              return (
                <span
                  key={slot.disorder.instanceId}
                  onClick={(e) => handleDisorderClick(e, slot.disorder.instanceId)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onHoldCard?.(slot.disorder.cardId);
                  }}
                  data-testid={`opponent-disorder-text-${slot.disorder.instanceId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    backgroundColor: isEpisodeTarget ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.25)',
                    outline: isEpisodeTarget ? '1.5px solid #22c55e' : 'none',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    color: isEpisodeTarget ? '#4ade80' : '#f8fafc',
                    fontWeight: 600,
                    whiteSpace: 'normal',
                    wordBreak: 'normal',
                  }}
                  title="Nhấn giữ để xem to lá bài này"
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {disorderName}
                </span>
              );
            })
          )}
        </div>

        {/* 3. Dòng "Có thể bị đưa: ..." nếu có (Phần 2 mục C) */}
        {possibleSideEffects.length > 0 && (
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
            Có thể bị đưa:{' '}
            <strong style={{ color: '#fca5a5', fontWeight: 600 }}>
              {possibleSideEffects.join(', ')}
            </strong>
          </div>
        )}
      </div>

      {/* KHỐI PHẢI: HIỂN THỊ ẢNH LÁ MINI (NẾU CARDWIDTH > 0) */}
      {cardWidth > 0 && opponent.psyche.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '4px',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          {opponent.psyche.map((slot) => {
            const isTreated = slot.drug !== null;
            const isEpisodeTarget = episodeTargetDisorderIds.includes(slot.disorder.instanceId);
            const slotHeight = isTreated ? cardHeight + miniStagger : cardHeight;

            return (
              <div
                key={slot.disorder.instanceId}
                onClick={(e) => handleDisorderClick(e, slot.disorder.instanceId)}
                data-testid={`opponent-disorder-${slot.disorder.instanceId}`}
                style={{
                  position: 'relative',
                  width: `${cardWidth}px`,
                  height: `${slotHeight}px`,
                  cursor: isEpisodeTarget ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              >
                {/* LÁ BỆNH LÝ DƯỚI (z-index 1) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
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

                {/* LÁ THUỐC ĐÈ TRÊN, LỆCH XUỐNG DƯỚI (z-index 2) */}
                {slot.drug && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${miniStagger}px`,
                      left: 0,
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      zIndex: 2,
                    }}
                  >
                    <Card
                      cardId={slot.drug.cardId}
                      size="mini"
                      onHold={() => onHoldCard?.(slot.drug!.cardId)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
