import React, { useEffect, useRef, useState } from 'react';
import type { CardInstance } from '@boardgame/game-side-effects';
import { Card } from './Card.js';

export interface HandViewProps {
  hand: CardInstance[];
  selectedCardId: string | null;
  onSelectCard: (instanceId: string) => void;
  onHoldCard?: (cardId: string) => void;
  isLandscape?: boolean;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  selectedCardId,
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
  // Chiều rộng lá trên tay: 58px khi ngang, 50px khi dọc để vừa vặn không tràn
  const cardWidth = isLandscape ? 58 : 50;
  const cardHeight = isLandscape ? 90 : 76;

  // Tính khoảng cách lộ giữa các lá so le:
  // Đảm bảo tối thiểu 24px (theo tiêu chí S2) và tối đa 65% cardWidth
  const overlapStep =
    numCards > 1
      ? Math.max(24, Math.min(cardWidth * 0.65, (containerWidth - cardWidth - 8) / (numCards - 1)))
      : 0;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        gap: '4px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Bài trên tay ({numCards} lá)
        </span>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Chạm để chọn · Nhấn giữ để xem to
        </span>
      </div>

      {/* Vùng bài tay xếp so le 1 hàng (Staggered Overlap) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${cardHeight + 14}px`,
          boxSizing: 'border-box',
          overflow: 'visible',
        }}
      >
        {hand.map((card, idx) => {
          const isSelected = card.instanceId === selectedCardId;
          const leftPos = idx * overlapStep;

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
                zIndex: isSelected ? 50 : idx + 1,
                transform: isSelected ? 'translateY(-12px) scale(1.05)' : 'none',
                transition: 'transform 0.15s ease, z-index 0.15s ease',
                cursor: 'pointer',
              }}
            >
              <Card
                cardId={card.cardId}
                size="normal"
                isSelected={isSelected}
                showSideEffects={card.type === 'drug'}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  boxShadow: isSelected
                    ? '0 10px 20px rgba(56, 189, 248, 0.5)'
                    : '0 4px 8px rgba(0,0,0,0.4)',
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
