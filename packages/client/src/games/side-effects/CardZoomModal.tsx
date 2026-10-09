import React, { useEffect, useRef } from 'react';
import { Card } from './Card.js';

export interface CardZoomModalProps {
  cardId: string | null;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({ cardId, onClose }) => {
  const mountTimeRef = useRef<number>(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (cardId) {
      mountTimeRef.current = Date.now();
    }
  }, [cardId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!cardId) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Chặn cú click ảo rơi vào nền trong 600ms đầu tiên do ngón tay nhấc lên sau khi nhấn giữ
    if (Date.now() - mountTimeRef.current < 600) {
      e.stopPropagation();
      return;
    }
    onClose();
  };

  return (
    <div
      data-testid="card-zoom-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        boxSizing: 'border-box',
        touchAction: 'none',
      }}
    >
      {/* Nút đóng nhỏ ở góc màn hình, KHÔNG dính vào lá (Phần 2 mục B5) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Đóng phóng to"
        className="casino-btn-active"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'rgba(10, 26, 20, 0.88)',
          color: '#fde047',
          border: '1.5px solid rgba(212, 175, 55, 0.55)',
          fontSize: '18px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.8), 0 0 12px rgba(212, 175, 55, 0.25)',
          zIndex: 10000,
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Vùng lá phóng to: to nhất có thể (≈ 90% viewport), viền ánh vàng sang trọng */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          filter: 'drop-shadow(0 20px 48px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 25px rgba(212, 175, 55, 0.18))',
        }}
      >
        <Card cardId={cardId} size="zoom" testId="card-zoom" />
      </div>
    </div>
  );
};
