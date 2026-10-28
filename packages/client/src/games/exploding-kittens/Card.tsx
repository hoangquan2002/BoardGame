import React, { useRef, useState } from 'react';
import type { EKCard } from '@boardgame/game-exploding-kittens';
import { feedback } from '../../app/feedback/index.js';

export type CardSize = 'mini' | 'small' | 'normal' | 'zoom';

export interface CardProps {
  card?: EKCard | null;
  size?: CardSize;
  isSelected?: boolean;
  isTarget?: boolean;
  dimmed?: boolean;
  badge?: string;
  orderBadge?: number | string | null;
  showBack?: boolean;
  onClick?: () => void;
  onHold?: (card: EKCard) => void;
  style?: React.CSSProperties;
  className?: string;
  testId?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  size = 'normal',
  isSelected = false,
  isTarget = false,
  dimmed = false,
  badge,
  orderBadge,
  showBack = false,
  onClick,
  onHold,
  style,
  className = '',
  testId,
}) => {
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isHoldingRef.current = false;
    if ('touches' in e && e.touches.length > 0) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      touchStartPos.current = { x: e.clientX, y: e.clientY };
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      feedback.vibrateCard();
      if (onHold && card) {
        onHold(card);
      }
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diff = Math.hypot(currentX - touchStartPos.current.x, currentY - touchStartPos.current.y);
    if (diff > 10 && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isHoldingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isHoldingRef.current = false;
      return;
    }
    if (onClick) {
      feedback.vibrateCard();
      onClick();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onHold && card) {
      e.preventDefault();
      feedback.vibrateCard();
      onHold(card);
    }
  };

  const imageSrc = showBack
    ? '/games/exploding-kittens/cards/card-back.png'
    : (card?.imageUrl ?? (card?.imageFile ? `/games/exploding-kittens/cards/${card.imageFile}` : ''));

  return (
    <div
      data-testid={testId}
      data-size={size}
      className={`relative select-none cursor-pointer transition-all duration-200 overflow-visible ${
        isSelected ? 'selected' : ''
      } ${className}`}
      style={{
        opacity: dimmed ? 0.45 : 1,
        ...style,
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Huy hiệu số thứ tự chọn lá bài (1, 2...) đặt góc trên bên trái */}
      {orderBadge != null && orderBadge !== '' && (
        <span className="select-order-badge" aria-label={`Thứ tự chọn ${orderBadge}`}>
          {orderBadge}
        </span>
      )}

      {/* Huy hiệu góc phải nếu có */}
      {badge && (
        <span className="absolute -top-2 -right-2 bg-amber-500 text-black font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-md z-10">
          {badge}
        </span>
      )}

      {/* Khung hiển thị thẻ bài: chỉ hiển thị trọn vẹn hình ảnh gốc */}
      <div
        className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center"
        style={{
          border: isSelected
            ? '2.5px solid #facc15'
            : isTarget
            ? '2.5px solid #ef4444'
            : '1.5px solid rgba(212, 175, 55, 0.5)',
          boxShadow: isSelected
            ? 'var(--shadow-card-elevated)'
            : 'var(--shadow-card-casino)',
        }}
      >
        {!imgError && imageSrc ? (
          <img
            src={imageSrc}
            alt={card?.nameVi ?? card?.nameEn ?? 'Lá bài Mèo Nổ'}
            className="w-full h-full object-contain pointer-events-none"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-900 text-white">
            {showBack ? (
              <span className="text-amber-400 font-bold text-xs uppercase">MÈO NỔ</span>
            ) : (
              <>
                <span className="font-extrabold text-xs text-amber-300">{card?.nameEn}</span>
                <span className="text-[10px] text-gray-300">{card?.nameVi}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
