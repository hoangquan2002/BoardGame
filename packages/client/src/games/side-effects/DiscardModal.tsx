import React, { useState } from 'react';
import type { CardInstance } from '@boardgame/game-side-effects';
import { CardView } from './CardView.js';

export interface DiscardModalProps {
  hand: CardInstance[];
  neededCount: number;
  onConfirmDiscard: (cardIds: string[]) => void;
  onCancel?: () => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({
  hand,
  neededCount,
  onConfirmDiscard,
  onCancel,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= neededCount) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const isReady = selectedIds.length === neededCount;

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f87171' }}>
            Bỏ bớt bài trên tay
          </h3>
          <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
            Bạn đang có {hand.length} lá (giới hạn tối đa là 6 lá). Hãy chọn đúng{' '}
            <strong style={{ color: '#f87171' }}>{neededCount} lá</strong> để bỏ.
          </p>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Đã chọn: {selectedIds.length}/{neededCount} lá
          </div>
        </div>

        {/* Danh sách lá bài trên tay để chọn */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: '10px',
            justifyItems: 'center',
            maxHeight: '340px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {hand.map((card) => {
            const isSelected = selectedIds.includes(card.instanceId);
            return (
              <div
                key={card.instanceId}
                onClick={() => toggleSelect(card.instanceId)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  outline: isSelected ? '3px solid #ef4444' : 'none',
                }}
              >
                <CardView card={card} size="compact" isSelected={isSelected} />
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    ✕
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onConfirmDiscard(selectedIds)}
            disabled={!isReady}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: isReady ? '#ef4444' : '#334155',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              border: 'none',
              cursor: isReady ? 'pointer' : 'not-allowed',
              opacity: isReady ? 1 : 0.6,
            }}
          >
            {isReady ? `Xác nhận bỏ ${neededCount} lá bài` : `Chọn thêm ${neededCount - selectedIds.length} lá`}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Quay lại tiếp tục đánh bài
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
