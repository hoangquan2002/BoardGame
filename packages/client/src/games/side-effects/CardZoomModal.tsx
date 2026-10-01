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
  }, [cardId]);

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
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        boxSizing: 'border-box',
        touchAction: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '90vw',
          maxHeight: '90vh',
          aspectRatio: '300 / 537',
          position: 'relative',
        }}
      >
        <Card cardId={cardId} size="zoom" testId="card-zoom" />
        <button
          onClick={onClose}
          aria-label="Đóng phóng to"
          style={{
            position: 'absolute',
            top: '-14px',
            right: '-14px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: '2px solid #ffffff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
