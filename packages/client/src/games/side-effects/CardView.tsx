import React from 'react';
import type { CardInstance } from '@boardgame/game-side-effects';
import { Card, type CardSize } from './Card.js';

export interface CardViewProps {
  card: CardInstance;
  isSelected?: boolean;
  isTargetable?: boolean;
  targetLabel?: string;
  size?: 'normal' | 'compact' | 'mini';
  onClick?: () => void;
  onHold?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  isTargetable = false,
  targetLabel,
  size = 'normal',
  onClick,
  onHold,
}) => {
  const cardSize: CardSize = size === 'mini' ? 'mini' : size === 'compact' ? 'small' : 'normal';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Card
        cardId={card.cardId}
        size={cardSize}
        isSelected={isSelected}
        isTarget={isTargetable}
        onClick={onClick}
        onHold={onHold ? () => onHold() : undefined}
      />
      {targetLabel && isTargetable && (
        <span
          style={{
            marginTop: '3px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#4ade80',
            backgroundColor: 'rgba(5, 46, 22, 0.9)',
            border: '1px solid #16a34a',
            borderRadius: '4px',
            padding: '1px 6px',
            textAlign: 'center',
          }}
        >
          {targetLabel}
        </span>
      )}
    </div>
  );
};
