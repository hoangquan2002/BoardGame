import React from 'react';
import type { EKCard } from '@boardgame/game-exploding-kittens';

export interface CardZoomModalProps {
  card: EKCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({ card, isOpen, onClose }) => {
  if (!isOpen || !card) return null;

  const imageSrc =
    card.imageUrl ?? (card.imageFile ? `/games/exploding-kittens/cards/${card.imageFile}` : '');

  // Tag 1: Phân loại lá bài
  const isCat = card.code.startsWith('CAT_');
  const isDefuse = card.code === 'DEFUSE';
  const isNope = card.code === 'NOPE';
  const isBomb = card.code === 'EXPLODING_KITTEN';

  const categoryTag = isCat
    ? 'Mèo Combo'
    : isDefuse
    ? 'Bài Phòng Thủ'
    : isNope
    ? 'Bài Phản Ứng'
    : isBomb
    ? 'Mèo Nổ Nguy Hiểm'
    : 'Bài Hành Động';

  // Tag 2: Thời điểm sử dụng
  const timingTag = isNope
    ? 'Phản ứng mọi lúc'
    : isCat
    ? 'Chỉ dùng ghép Combo'
    : isBomb
    ? 'Rút phải sẽ nổ'
    : 'Đánh trong lượt';

  // Tag 3: Trạng thái Nope
  const nopeTag = isBomb || isDefuse ? 'Không thể bị Nope' : 'Có thể bị Nope';

  // Tiêu đề: Tên tiếng Anh + Phụ đề phiên bản tiếng Việt
  const fullTitle = card.variantSubtitleVi
    ? `${card.nameEn} — ${card.variantSubtitleVi}`
    : `${card.nameEn} (${card.nameVi})`;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-card casino-glass" onClick={(e) => e.stopPropagation()}>
        {/* Nửa trên: Ảnh gốc của lá bài cỡ lớn */}
        <div className="zoom-card-art">
          {imageSrc ? (
            <img src={imageSrc} alt={card.nameEn} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-white">
              <span className="text-xl font-bold text-amber-300">{card.nameEn}</span>
              <span className="text-sm text-gray-300">{card.nameVi}</span>
            </div>
          )}
        </div>

        {/* Nửa dưới: Khung thông tin chi tiết */}
        <div className="zoom-info-box">
          <div className="zoom-card-title">{fullTitle}</div>
          <div className="zoom-tags-row">
            <span className="zoom-tag">{categoryTag}</span>
            <span
              className="zoom-tag"
              style={{ borderColor: 'rgba(250, 204, 21, 0.5)', color: '#fde047' }}
            >
              {timingTag}
            </span>
            <span
              className="zoom-tag"
              style={{
                borderColor: isBomb || isDefuse ? 'rgba(52, 211, 153, 0.5)' : 'rgba(248, 113, 113, 0.5)',
                color: isBomb || isDefuse ? '#6ee7b7' : '#fca5a5',
              }}
            >
              {nopeTag}
            </span>
          </div>
          <p className="zoom-rule-text">{card.descriptionVi}</p>
        </div>

        {/* Nút đóng */}
        <button type="button" className="btn-gold action-btn-main" onClick={onClose}>
          Đã hiểu • Đóng lại
        </button>
      </div>
    </div>
  );
};
