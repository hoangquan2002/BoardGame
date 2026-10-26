import React from 'react';
import type { EKCard } from '@boardgame/game-exploding-kittens';
import { Card } from './Card.js';

export interface CardZoomModalProps {
  card: EKCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({ card, isOpen, onClose }) => {
  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300 flex items-center justify-center border border-white/10"
        >
          ✕
        </button>

        {/* Thẻ bài lớn */}
        <div className="py-2">
          <Card card={card} size="zoom" />
        </div>

        {/* Thông tin chi tiết */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-xl font-bold text-amber-300">{card.nameVi}</h3>
            <span className="text-sm text-gray-400">({card.nameEn})</span>
          </div>

          {card.variantSubtitleVi && (
            <p className="text-xs italic text-amber-200/80 bg-amber-950/40 py-1 px-3 rounded-lg border border-amber-500/20">
              "{card.variantSubtitleVi}"
            </p>
          )}

          <div className="flex justify-center gap-2 text-xs">
            <span
              className="px-2.5 py-0.5 rounded-full font-semibold uppercase text-black"
              style={{ backgroundColor: card.colorHex ?? '#38bdf8' }}
            >
              Phân loại: {card.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-gray-300 border border-slate-700">
              Thẻ #{card.cardNumber}
            </span>
          </div>

          <div className="text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-sm text-gray-200 space-y-1 mt-2">
            <div className="font-semibold text-amber-400 text-xs uppercase tracking-wider">
              Chức năng thẻ bài (Luật chơi):
            </div>
            <p className="leading-relaxed">{card.descriptionVi}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg transition-transform active:scale-95"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
