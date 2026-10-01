import React, { useEffect, useRef, useState } from 'react';
import type { CardInstance } from '@boardgame/game-side-effects';
import { Card } from './Card.js';

export interface HandViewProps {
  hand: CardInstance[];
  selectedCardId: string | null;
  cardWidth?: number;
  hasSelection?: boolean;
  onSelectCard: (instanceId: string) => void;
  onHoldCard?: (cardId: string) => void;
  isLandscape?: boolean;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  selectedCardId,
  cardWidth = 78,
  hasSelection = false,
  onSelectCard,
  onHoldCard,
  isLandscape = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const numCards = hand.length;
  // Chiều cao theo tỷ lệ gốc 520x864
  const cardHeight = Math.round((cardWidth * 864) / 520);

  // Tính khoảng cách lộ giữa các lá so le (Phần 2 mục E):
  // Đảm bảo tối thiểu 24px để chạm được, và lá đang chọn có zIndex cao nhất để lộ hết
  const availableSpan = Math.max(0, containerWidth - cardWidth);
  const rawStep = numCards > 1 ? availableSpan / (numCards - 1) : 0;
  // Giới hạn khoảng lộ tối đa khoảng 60% cardWidth để tạo cảm giác bài xếp quạt/chồng so le
  const overlapStep = numCards > 1 ? Math.max(24, Math.min(cardWidth * 0.6, rawStep)) : 0;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        gap: isLandscape ? '1px' : '2px',
      }}
    >
      {/* Nhãn nhỏ mờ (Phần 2 mục F: bỏ dòng hướng dẫn lộn xộn cạnh Bài trên tay) */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#64748b',
            letterSpacing: '0.3px',
            lineHeight: 1,
          }}
        >
          Bài trên tay ({numCards} lá)
        </span>
      </div>

      {/* Vùng bài tay xếp so le 1 hàng (Staggered Overlap) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${cardHeight + 12}px`,
          boxSizing: 'border-box',
          overflow: 'visible',
        }}
      >
        {hand.map((card, idx) => {
          const isSelected = card.instanceId === selectedCardId;
          const leftPos = Math.round(idx * overlapStep);

          return (
            <div
              key={card.instanceId}
              data-testid={`hand-card-${card.instanceId}`}
              data-card-index={idx}
              data-selected={isSelected ? 'true' : 'false'}
              style={{
                position: 'absolute',
                left: `${leftPos}px`,
                bottom: 0,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                // Lá đang chọn có zIndex cao nhất để lộ hết trọn vẹn (Mục E)
                zIndex: isSelected ? 50 : idx + 1,
                transform: isSelected ? 'translateY(-12px)' : 'none',
                transition: 'transform 0.15s ease, z-index 0.15s ease',
                cursor: 'pointer',
              }}
            >
              <Card
                cardId={card.cardId}
                size="normal"
                isSelected={isSelected}
                dimmed={hasSelection && !isSelected}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                }}
                onClick={() => onSelectCard(card.instanceId)}
                onHold={() => onHoldCard?.(card.cardId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
