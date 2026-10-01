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
  onClick,
  onHold,
  style,
  className = '',
  testId,
}) => {
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const info: CardInfoVi = getCardInfoVi(cardId);
  const imageSrc = showBack ? '/cards/back.webp' : info.imagePath;

  // Xử lý nhấn giữ >= 400ms để phóng to
  const handleTouchStart = () => {
    isHoldingRef.current = false;
    timerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          // ignore
        }
      }
      if (onHold) {
        onHold(info);
      }
    }, 400);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = () => {
    // Nếu vừa kích hoạt hold thì không gọi click chọn lá
    if (isHoldingRef.current) {
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
      width: '32px',
      height: '52px',
      fontSize: '11px',
      borderRadius: '3px',
    },
    small: {
      width: '46px',
      height: '76px',
      fontSize: '11px',
      borderRadius: '4px',
    },
    normal: {
      width: '58px',
      height: '98px',
      fontSize: '11px',
      borderRadius: '5px',
    },
    zoom: {
      width: '260px',
      maxWidth: '90vw',
      borderRadius: '8px',
    },
  };

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
    opacity: dimmed ? 0.35 : 1,
    transform: isSelected ? 'translateY(-10px) scale(1.04)' : undefined,
    border: isSelected
      ? '2px solid #38bdf8'
      : isTarget
        ? '2px solid #22c55e'
        : '1px solid rgba(255,255,255,0.12)',
    boxShadow: isSelected
      ? '0 8px 16px rgba(56, 189, 248, 0.4)'
      : isTarget
        ? '0 0 12px rgba(34, 197, 94, 0.5)'
        : '0 2px 4px rgba(0,0,0,0.3)',
    ...sizeStyles[size],
    ...style,
  };

  // Render modal zoom
  if (size === 'zoom') {
    return (
      <div
        data-testid={testId ?? 'card-zoom'}
        style={{
          ...baseStyle,
          backgroundColor: '#0f172a',
          border: `2px solid ${info.color}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
          padding: '8px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '300/537', borderRadius: '6px', overflow: 'hidden' }}>
          {!imgError ? (
            <img
              src={imageSrc}
              alt={info.nameVi}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: info.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                padding: '12px',
                textAlign: 'center',
              }}
            >
              {info.nameVi}
            </div>
          )}
        </div>

        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{info.nameVi}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#fff',
                backgroundColor: info.color,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {info.typeVi}
            </span>
          </div>

          {info.treatsVi && (
            <div style={{ fontSize: '12px', color: '#60a5fa' }}>
              Trị: <strong>{info.treatsVi}</strong>
            </div>
          )}

          {info.sideEffectsVi && info.sideEffectsVi.length > 0 && (
            <div style={{ fontSize: '11px', color: '#fca5a5' }}>
              Tác dụng phụ: <strong>{info.sideEffectsVi.join(', ')}</strong>
            </div>
          )}

          {info.punishmentVi && (
            <div style={{ fontSize: '11px', color: '#cbd5e1', backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'pre-line' }}>
              <strong>Hình phạt:</strong> {info.punishmentVi}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={className}
      style={baseStyle}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
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
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', lineHeight: 1.1 }}>
            {info.nameVi}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9, color: '#fff' }}>{info.typeVi}</div>
        </div>
      )}

      {/* Dải tên tiếng Việt 1 dòng ở cạnh dưới cho mini/small/normal */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          color: '#f8fafc',
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 4px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          pointerEvents: 'none',
          borderTop: `1px solid ${info.color}`,
        }}
      >
        {info.nameVi}
      </div>

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
