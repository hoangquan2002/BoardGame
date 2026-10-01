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

  const info: CardInfoVi = getCardInfoVi(cardId);
  const imageSrc = showBack ? '/cards/back.jpg' : info.imagePath;

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

  // Tỷ lệ gốc trong PDF manifest: 520 / 864 = 0.60185 (mặt sau 496 / 822 = 0.6034)
  const isBack = showBack || cardId === 'back';
  const cardAspectRatio = isBack ? '496 / 822' : '520 / 864';

  // Bo góc <= 4px
  const borderRadius = '4px';

  // Trạng thái theo Phần 2 mục B3 & F:
  // - Outline / box-shadow bên ngoài lá
  // - Nhô lên translateY(-12px)
  // - Opacity 0.4 cho thứ không phải mục tiêu
  let outlineStyle = 'none';
  let boxShadowStyle = '0 2px 6px rgba(0,0,0,0.45)';
  let transformStyle = style?.transform;

  if (isSelected) {
    outlineStyle = '2px solid #38bdf8';
    boxShadowStyle = '0 8px 18px rgba(0,0,0,0.6)';
    transformStyle = 'translateY(-12px)';
  } else if (isTarget) {
    outlineStyle = '2px solid #22c55e';
    boxShadowStyle = '0 0 12px rgba(34, 197, 94, 0.6)';
  }

  // Phóng to (size=zoom): hiện trọn cả lá, to nhất có thể, KHÔNG viền đỏ, KHÔNG chữ che
  if (size === 'zoom') {
    return (
      <div
        data-testid={testId ?? 'card-zoom'}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'auto',
          height: 'min(90vh, 864px)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          aspectRatio: cardAspectRatio,
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#0b1f1a',
          boxShadow: '0 20px 48px rgba(0,0,0,0.85)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          ...style,
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
              borderRadius: '4px',
              pointerEvents: 'auto',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: info.color || '#1e293b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              padding: '24px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              {info.nameVi}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {info.typeVi}
            </div>
            {info.treatsVi && (
              <div style={{ fontSize: '13px', marginTop: '8px' }}>
                Trị: {info.treatsVi}
              </div>
            )}
            {info.sideEffectsVi && info.sideEffectsVi.length > 0 && (
              <div style={{ fontSize: '13px', marginTop: '6px' }}>
                Tác dụng phụ: {info.sideEffectsVi.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Các size thông thường: mini / small / normal
  // QUY TẮC BẤT BIẾN: KHÔNG CÓ BẤT KỲ CHỮ / HUY HIỆU / DẢI MÀU NÀO ĐÈ LÊN ẢNH LÁ
  return (
    <div
      data-testid={testId}
      className={className}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius,
        aspectRatio: cardAspectRatio,
        outline: outlineStyle,
        outlineOffset: '1px',
        boxShadow: boxShadowStyle,
        transform: transformStyle,
        opacity: dimmed ? 0.4 : 1,
        backgroundColor: '#0b1f1a',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'manipulation',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        ...style,
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
            borderRadius,
            pointerEvents: 'auto',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: info.color || '#334155',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '4px',
            boxSizing: 'border-box',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, lineHeight: 1.2 }}>
            {info.nameVi}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
            {info.typeVi}
          </div>
        </div>
      )}
    </div>
  );
};
