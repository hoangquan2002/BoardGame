import React from 'react';
import type { EKCard } from '@boardgame/game-exploding-kittens';

export interface SeeFutureModalProps {
  cards: EKCard[] | null;
  isOpen: boolean;
  onClose: () => void;
  onHoldCard?: (card: EKCard) => void;
}

export const SeeFutureModal: React.FC<SeeFutureModalProps> = ({
  cards,
  isOpen,
  onClose,
  onHoldCard,
}) => {
  if (!isOpen || !cards || cards.length === 0) return null;

  const count = cards.length;

  const getRankBadgeText = (idx: number, isBomb: boolean) => {
    if (isBomb) return '💣 #1 (Rút kế)';
    if (idx === 0) return '#1 (Rút kế)';
    if (idx === 1) return '#2 (Kế tiếp)';
    if (idx === 2) return '#3 (Thứ ba)';
    return `#${idx + 1}`;
  };

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card casino-glass">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">🔮 NHÌN TRƯỚC TƯƠNG LAI ({count} LÁ)</div>
          <div className="modal-subtitle">
            Chỉ riêng bạn bí mật thấy thứ tự {count} lá trên cùng chồng bài rút
          </div>
        </div>

        {/* Future Cards Grid */}
        <div className="future-cards-grid">
          {cards.map((card, idx) => {
            const isBomb = card.code === 'EXPLODING_KITTEN';
            const imgUrl =
              card.imageUrl ?? (card.imageFile ? `/games/exploding-kittens/cards/${card.imageFile}` : '');

            return (
              <div
                key={`${card.id}-${idx}`}
                className="future-item"
                onClick={() => onHoldCard?.(card)}
                style={{ cursor: onHoldCard ? 'pointer' : 'default' }}
                title="Nhấn để phóng to lá bài"
              >
                <span className={`future-rank-badge ${isBomb ? 'danger' : ''}`}>
                  {getRankBadgeText(idx, isBomb)}
                </span>

                <div className={`future-card-box ${isBomb ? 'danger' : ''}`}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={card.nameEn} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-slate-900 text-white text-[10px]">
                      {card.nameEn}
                    </div>
                  )}
                </div>

                <span
                  className="future-card-name"
                  style={{ color: isBomb ? '#f87171' : '#e2e8f0' }}
                >
                  {card.nameVi}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-emerald action-btn-main"
        >
          Đã ghi nhớ thứ tự {count} lá
        </button>
      </div>
    </div>
  );
};
