import React from 'react';
import type { CardInstance } from '@boardgame/game-side-effects';
import { CardView } from './CardView.js';

export interface HandViewProps {
  hand: CardInstance[];
  selectedCardId: string | null;
  onSelectCard: (instanceId: string) => void;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  selectedCardId,
  onSelectCard,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
          Bài trên tay ({hand.length} lá)
        </span>
        {hand.length > 6 && (
          <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>
            ⚠️ Cần bỏ {hand.length - 6} lá cuối lượt
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          padding: '10px 4px 6px 4px',
          WebkitOverflowScrolling: 'touch',
          alignItems: 'flex-end',
          minHeight: '180px',
        }}
      >
        {hand.map((card) => {
          const isSelected = card.instanceId === selectedCardId;
          return (
            <div key={card.instanceId} style={{ flexShrink: 0 }}>
              <CardView
                card={card}
                isSelected={isSelected}
                size="normal"
                onClick={() => onSelectCard(card.instanceId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
