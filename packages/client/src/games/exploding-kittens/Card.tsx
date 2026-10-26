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
  showBack?: boolean;
  onClick?: () => void;
  onHold?: (card: EKCard) => void;
  style?: React.CSSProperties;
  className?: string;
  testId?: string;
}

const SIZE_CONFIGS: Record<CardSize, { width: number; height: number; fontSize: number; descLines: number }> = {
  mini: { width: 56, height: 78, fontSize: 9, descLines: 1 },
  small: { width: 78, height: 110, fontSize: 10, descLines: 2 },
  normal: { width: 105, height: 148, fontSize: 11, descLines: 3 },
  zoom: { width: 240, height: 336, fontSize: 13, descLines: 6 },
};

export const Card: React.FC<CardProps> = ({
  card,
  size = 'normal',
  isSelected = false,
  isTarget = false,
  dimmed = false,
  badge,
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

  const cfg = SIZE_CONFIGS[size];

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
    }, 450);
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

  const imageSrc = showBack
    ? '/games/exploding-kittens/cards/card-back.png'
    : (card?.imageUrl ?? (card?.imageFile ? `/games/exploding-kittens/cards/${card.imageFile}` : ''));

  const colorHex = card?.colorHex ?? '#334155';

  return (
    <div
      data-testid={testId}
      className={`relative select-none cursor-pointer transition-all duration-200 rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{
        width: `${cfg.width}px`,
        height: `${cfg.height}px`,
        minWidth: `${cfg.width}px`,
        transform: isSelected ? 'translateY(-10px) scale(1.04)' : isTarget ? 'scale(1.03)' : 'none',
        boxShadow: isSelected
          ? '0 0 20px rgba(250, 204, 21, 0.9), 0 8px 16px rgba(0,0,0,0.6)'
          : isTarget
          ? '0 0 16px rgba(239, 68, 68, 0.8)'
          : '0 4px 10px rgba(0, 0, 0, 0.45)',
        border: isSelected
          ? '2px solid #facc15'
          : isTarget
          ? '2px solid #ef4444'
          : `1px solid ${colorHex}55`,
        opacity: dimmed ? 0.45 : 1,
        backgroundColor: '#111827',
        ...style,
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Artwork container */}
      <div className="relative w-full h-full flex flex-col">
        {!imgError && imageSrc ? (
          <img
            src={imageSrc}
            alt={card?.nameVi ?? 'Exploding Kitten Card'}
            className="w-full h-full object-cover pointer-events-none"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
            style={{ backgroundColor: colorHex }}
          >
            {showBack ? (
              <div className="text-amber-300 font-bold text-xs tracking-wider uppercase">MÈO NỔ</div>
            ) : (
              <>
                <span className="text-xl">🐱</span>
                <span className="font-bold text-white text-xs mt-1 leading-tight">{card?.nameEn}</span>
                <span className="text-[10px] text-amber-200">{card?.nameVi}</span>
              </>
            )}
          </div>
        )}

        {/* Lớp khung phủ Phương án B: Giữ ảnh gốc + Hiển thị Tiếng Việt rõ nét */}
        {!showBack && card && size !== 'mini' && (
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-1.5 flex flex-col justify-end pointer-events-none"
            style={{ maxHeight: size === 'zoom' ? '40%' : '50%' }}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span
                className="font-bold text-white truncate drop-shadow"
                style={{ fontSize: `${cfg.fontSize}px` }}
              >
                {card.nameVi}
              </span>
              <span
                className="text-[9px] px-1 py-0.2 rounded font-semibold text-black uppercase"
                style={{ backgroundColor: colorHex || '#e2e8f0' }}
              >
                {card.code.replace('CAT_', '')}
              </span>
            </div>
            {card.descriptionVi && (
              <p
                className="text-gray-200 leading-tight font-normal line-clamp-2"
                style={{ fontSize: `${cfg.fontSize - 1.5}px` }}
              >
                {card.descriptionVi}
              </p>
            )}
          </div>
        )}

        {/* Badge tùy chọn góc trên */}
        {badge && (
          <div className="absolute top-1 right-1 bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shadow-md z-10">
            {badge}
          </div>
        )}

        {/* Nút nhỏ xem chi tiết khi ở size normal */}
        {!showBack && card && onHold && size === 'normal' && (
          <button
            type="button"
            className="absolute top-1 left-1 bg-black/60 hover:bg-black/90 text-gray-200 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white/20 z-10 transition-colors"
            title="Xem chi tiết lá bài"
            onClick={(e) => {
              e.stopPropagation();
              onHold(card);
            }}
          >
            🔍
          </button>
        )}
      </div>
    </div>
  );
};
