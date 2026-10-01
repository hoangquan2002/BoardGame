import React, { useRef, useState } from 'react';
import { getCardInfoVi, type CardInfoVi } from '@boardgame/game-side-effects';

export type CardSize = 'mini' | 'small' | 'normal' | 'zoom';

export interface CardProps {
  cardId: string;
  size?: CardSize;
  isSelected?: boolean;
  isTarget?: boolean;
  dimmed?: boolean;
  badge?: string;
  showBack?: boolean;
  showSideEffects?: boolean;
  onClick?: () => void;
  onHold?: (info: CardInfoVi) => void;
  style?: React.CSSProperties;
  className?: string;
  testId?: string;
}

export const Card: React.FC<CardProps> = ({
  cardId,
  size = 'normal',
  isSelected = false,
  isTarget = false,
  dimmed = false,
  badge,
  showBack = false,
  showSideEffects = false,
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

  const info: CardInfoVi = getCardInfoVi(cardId);
  const imageSrc = showBack ? '/cards/back.webp' : info.imagePath;

  // Xử lý nhấn giữ >= 400ms để phóng to
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isHoldingRef.current = false;
    if ('touches' in e && e.touches.length > 0) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if ('clientX' in e) {
      touchStartPos.current = { x: e.clientX, y: e.clientY };
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // ignore
        }
      }
      if (onHold) {
        onHold(info);
      }
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !timerRef.current) return;
    const touch = e.touches[0];
    const dist = Math.hypot(touch.clientX - touchStartPos.current.x, touch.clientY - touchStartPos.current.y);
    // Huỷ hẹn giờ nhấn giữ khi ngón tay di chuyển > 10px
    if (dist > 10) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Nếu vừa kích hoạt hold thành công, chặn cú synthetic click sau khi thả tay
    if (isHoldingRef.current) {
      if ('preventDefault' in e) {
        e.preventDefault();
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isHoldingRef.current) {
      e.stopPropagation();
      isHoldingRef.current = false;
      return;
    }
    onClick?.();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onHold) {
      onHold(info);
    }
  };

  // Kích thước tương ứng từng size
  const sizeStyles: Record<CardSize, React.CSSProperties> = {
    mini: {
      width: '36px',
      height: '56px',
      fontSize: '11px',
      borderRadius: '4px',
    },
    small: {
      width: '52px',
      height: '84px',
      fontSize: '11px',
      borderRadius: '5px',
    },
    normal: {
      width: '68px',
      height: '110px',
      fontSize: '11px',
      borderRadius: '6px',
    },
    zoom: {
      width: 'min(90vw, 420px)',
      height: 'auto',
      aspectRatio: '300 / 537',
      maxHeight: '90vh',
      borderRadius: '10px',
    },
  };

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    touchAction: 'manipulation',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
    opacity: dimmed ? 0.35 : 1,
    transform: isSelected ? 'translateY(-10px) scale(1.04)' : undefined,
    border: isSelected
      ? '2px solid #38bdf8'
      : isTarget
        ? '2px solid #22c55e'
        : `1.5px solid ${info.color || 'rgba(255,255,255,0.12)'}`,
    boxShadow: isSelected
      ? '0 8px 16px rgba(56, 189, 248, 0.4)'
      : isTarget
        ? '0 0 12px rgba(34, 197, 94, 0.5)'
        : '0 2px 4px rgba(0,0,0,0.3)',
    ...sizeStyles[size],
    ...style,
  };

  // Render modal zoom: Góp ý A - chỉ hiện trọn cả lá to nhất có thể, bỏ khối chú thích chữ
  if (size === 'zoom') {
    return (
      <div
        data-testid={testId ?? 'card-zoom'}
        style={{
          ...baseStyle,
          border: `2px solid ${info.color}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
          padding: 0,
        }}
      >
        {!imgError ? (
          <img
            src={imageSrc}
            alt={info.nameVi}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: info.color,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              padding: '20px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              {info.nameVi}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              {info.typeVi}
            </div>
            {info.treatsVi && (
              <div style={{ fontSize: '12px', marginTop: '6px' }}>
                Trị: {info.treatsVi}
              </div>
            )}
            {info.sideEffectsVi && info.sideEffectsVi.length > 0 && (
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Tác dụng phụ: {info.sideEffectsVi.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render các size bình thường: mini / small / normal
  return (
    <div
      data-testid={testId}
      className={className}
      style={baseStyle}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {!imgError ? (
        <img
          src={imageSrc}
          alt={info.nameVi}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: info.color,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', lineHeight: 1.15 }}>
            {info.nameVi}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9, color: '#fff' }}>{info.typeVi}</div>
        </div>
      )}

      {/* Dải tên tiếng Việt ở cạnh dưới: không cắt ellipsis, cho phép xuống 2 dòng để đọc đủ chữ */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          color: '#f8fafc',
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 3px',
          textAlign: 'center',
          lineHeight: 1.15,
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          pointerEvents: 'none',
          borderTop: `1px solid ${info.color}`,
          boxSizing: 'border-box',
        }}
      >
        {info.nameVi}
      </div>

      {/* Dòng Tác dụng phụ trên lá Thuốc nếu được yêu cầu */}
      {showSideEffects && info.sideEffectsVi && info.sideEffectsVi.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '26px',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(76, 5, 25, 0.92)',
            color: '#fca5a5',
            fontSize: '11px',
            fontWeight: 700,
            padding: '1px 3px',
            textAlign: 'center',
            lineHeight: 1.15,
            borderTop: '1px solid #f43f5e',
            pointerEvents: 'none',
          }}
        >
          TDP: {info.sideEffectsVi.join(', ')}
        </div>
      )}

      {/* Badge nhãn (ví dụ số lượng, hoặc trạng thái) */}
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '1px 5px',
            borderRadius: '999px',
            border: '1px solid #38bdf8',
            pointerEvents: 'none',
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
};
