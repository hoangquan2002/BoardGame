import React, { useEffect, useRef } from 'react';
import { Card } from './Card.js';

export interface CardZoomModalProps {
  cardId: string | null;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({ cardId, onClose }) => {
  const mountTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    mountTimeRef.current = Date.now();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardId, onClose]);

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
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          fontSize: '18px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          zIndex: 10000,
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Vùng lá phóng to: to nhất có thể (≈ 90% viewport), không viền đỏ */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Card cardId={cardId} size="zoom" testId="card-zoom" />
      </div>
    </div>
  );
};
