import React, { useState } from 'react';
import type { CardInstance } from '@boardgame/game-side-effects';
import { Card } from './Card.js';
import { CardZoomModal } from './CardZoomModal.js';

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
  const [zoomedCardId, setZoomedCardId] = useState<string | null>(null);

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
    <>
      <div
        role="dialog"
        data-testid="discard-modal"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9995,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          backdropFilter: 'blur(4px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            backgroundColor: '#122520',
            borderRadius: '16px',
            border: '1px solid #224036',
            width: '100%',
            maxWidth: '460px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 16px',
            gap: '8px',
            boxSizing: 'border-box',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 800,
                color: '#f87171',
                letterSpacing: '0.2px',
              }}
            >
              Bỏ bớt bài trên tay
            </h3>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: 1.3,
              }}
            >
              Bạn đang có <strong>{hand.length} lá</strong> (tối đa 6 lá). Hãy chọn đúng{' '}
              <strong style={{ color: '#f87171' }}>{neededCount} lá</strong> để bỏ.
            </p>
            <div
              data-testid="discard-count"
              style={{
                marginTop: '4px',
                fontSize: '12px',
                fontWeight: 700,
                color: isReady ? '#4ade80' : '#fbbf24',
              }}
            >
              Đã chọn: {selectedIds.length}/{neededCount} lá
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
              Chạm để chọn · nhấn giữ để phóng to
            </div>
          </div>

          {/* Danh sách lá bài trên tay dạng lưới cuộn bên trong hộp */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: '8px',
              justifyItems: 'center',
              overflowY: 'auto',
              padding: '6px 4px',
              flex: 1,
              minHeight: '110px',
              boxSizing: 'border-box',
            }}
          >
            {hand.map((card) => {
              const isSelected = selectedIds.includes(card.instanceId);
              return (
                <div
                  key={card.instanceId}
                  data-testid={`discard-card-${card.instanceId}`}
                  onClick={() => toggleSelect(card.instanceId)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    width: '68px',
                    height: '113px',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                    outline: isSelected ? '3px solid #ef4444' : 'none',
                    outlineOffset: '2px',
                    boxShadow: isSelected ? '0 4px 12px rgba(239, 68, 68, 0.4)' : 'none',
                  }}
                >
                  <Card
                    cardId={card.cardId}
                    size="small"
                    onHold={() => setZoomedCardId(card.cardId)}
                    style={{ width: '100%', height: '100%' }}
                  />

                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: 2,
                      }}
                    >
                      ✕
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Nút hành động */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flexShrink: 0,
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              data-testid="confirm-discard-button"
              onClick={() => onConfirmDiscard(selectedIds)}
              disabled={!isReady}
              style={{
                width: '100%',
                minHeight: '42px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: isReady ? '#dc2626' : '#224036',
                color: isReady ? '#ffffff' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: isReady ? 'pointer' : 'not-allowed',
                boxShadow: isReady ? '0 2px 8px rgba(220, 38, 38, 0.5)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {isReady
                ? `Xác nhận bỏ ${neededCount} lá bài`
                : `Chọn thêm ${neededCount - selectedIds.length} lá để kết thúc lượt`}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #334155',
                  cursor: 'pointer',
                }}
              >
                Để sau
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal phóng to khi nhấn giữ lá bài trong DiscardModal */}
      <CardZoomModal
        cardId={zoomedCardId}
        onClose={() => setZoomedCardId(null)}
      />
    </>
  );
};
