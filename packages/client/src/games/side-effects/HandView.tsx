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
  hasSelection: _hasSelection = false,
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

  // Tính khoảng cách giữa các lá bài (Phần 1 mục 1 & mục 7):
  // 1. Nếu xếp vừa hàng ngang thì KHÔNG chồng lên nhau (khoảng cách = cardWidth + 8px)
  // 2. Nếu không vừa thì xếp chồng so le với khoảng lộ tối thiểu 24px
  const gap = 8;
  const neededWidthNoOverlap = numCards > 0 ? numCards * cardWidth + (numCards - 1) * gap : 0;
  const fitsWithoutOverlap = containerWidth >= neededWidthNoOverlap;

  let overlapStep = 0;
  if (numCards > 1) {
    if (fitsWithoutOverlap) {
      overlapStep = cardWidth + gap;
    } else {
      const availableSpan = Math.max(0, containerWidth - cardWidth);
      overlapStep = Math.max(24, availableSpan / (numCards - 1));
    }
  }

  // Tổng bề rộng thực tế của dãy bài
  const totalOccupiedWidth = numCards > 0 ? (numCards - 1) * overlapStep + cardWidth : 0;
  // Căn giữa nếu bài tay vừa khít hoặc thừa chỗ
  const startOffset = Math.max(0, Math.floor((containerWidth - totalOccupiedWidth) / 2));

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        gap: isLandscape ? '2px' : '4px',
      }}
    >
      {/* Nhãn nhỏ mờ - có khoảng cách dưới đảm bảo lá nhô lên không che chữ */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: isLandscape ? '1px' : '14px' }}>
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

      {/* Vùng bài tay */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${cardHeight}px`,
          marginTop: isLandscape ? '-3px' : '0px',
          boxSizing: 'border-box',
          overflow: 'visible',
        }}
      >
        {hand.map((card, idx) => {
          const isSelected = card.instanceId === selectedCardId;
          const leftPos = startOffset + Math.round(idx * overlapStep);

          return (
            <div
              key={card.instanceId}
              data-testid={`hand-card-${card.instanceId}`}
              data-card-index={idx}
              data-selected={isSelected ? 'true' : 'false'}
              style={{
                position: 'absolute',
                left: `${leftPos}px`,
                top: 0,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                // Lá đang chọn có zIndex cao nhất để lộ hết trọn vẹn (Mục E)
                zIndex: isSelected ? 50 : idx + 1,
                transform: isSelected ? (isLandscape ? 'translateY(-2px)' : 'translateY(-10px)') : 'none',
                transition: 'transform 0.15s ease, z-index 0.15s ease',
                cursor: 'pointer',
              }}
            >
              <Card
                cardId={card.cardId}
                size="normal"
                isSelected={isSelected}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: 'none',
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
