import React from 'react';
import type { EKCard } from '@boardgame/game-exploding-kittens';
import { Card } from './Card.js';

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

  const hasBomb = cards.some((c) => c.code === 'EXPLODING_KITTEN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-lg w-full bg-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-center space-y-4">
        {/* Tiêu đề */}
        <div className="space-y-1">
          <div className="text-3xl">🔮</div>
          <h2 className="text-xl font-black text-purple-300 uppercase tracking-wide">
            NHÌN TRƯỚC TƯƠNG LAI (SEE THE FUTURE)
          </h2>
          <p className="text-xs text-gray-300">
            Chỉ riêng bạn nhìn thấy {cards.length} lá bài trên đỉnh chồng bài rút:
          </p>
        </div>

        {hasBomb && (
          <div className="bg-red-950/80 border border-red-500 text-red-200 px-3 py-2 rounded-xl text-xs font-bold animate-pulse flex items-center justify-center gap-2">
            <span>💣 CẢNH BÁO NGUY HIỂM:</span>
            <span>Có Mèo Nổ ở ngay trong các lá bài này!</span>
          </div>
        )}

        {/* 3 Lá bài */}
        <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
          {cards.map((card, idx) => {
            const isTop = idx === 0;
            return (
              <div key={card.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <span
                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                    isTop
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-slate-800 text-gray-300 border border-slate-700'
                  }`}
                >
                  {isTop ? '🎯 #1 (Trên cùng)' : `#${idx + 1}`}
                </span>
                <Card
                  card={card}
                  size="small"
                  onHold={onHoldCard}
                  className={card.code === 'EXPLODING_KITTEN' ? 'ring-2 ring-red-500 animate-pulse' : ''}
                />
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-400 italic">
          💡 Chạm giữ vào bất kỳ lá bài nào để phóng to đọc chi tiết.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95"
        >
          Đã ghi nhớ tương lai
        </button>
      </div>
    </div>
  );
};
