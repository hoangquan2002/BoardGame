import React, { useEffect, useState } from 'react';
import type { EKCard, EKPlayerView } from '@boardgame/game-exploding-kittens';
import { feedback } from '../../app/feedback/index.js';

export interface NopeBannerProps {
  gameView: EKPlayerView;
  getPlayerName: (id: string) => string;
  onPlayNope: (cardId: string) => void;
  onPassNope: () => void;
}

export const NopeBanner: React.FC<NopeBannerProps> = ({
  gameView,
  getPlayerName,
  onPlayNope,
  onPassNope,
}) => {
  const nw = gameView.nopeWindow;
  const [secondsLeft, setSecondsLeft] = useState<number>(5);

  const myNopeCard = gameView.myHand.find((c: EKCard) => c.code === 'NOPE');
  const canPlayNope = Boolean(myNopeCard) && gameView.alive;
  const hasPassed = nw?.hasPassed ?? false;

  useEffect(() => {
    if (!nw || !nw.isOpen) return;

    setSecondsLeft(nw.secondsRemaining || 5);
    feedback.playTick();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        feedback.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nw?.isOpen, nw?.nopeCount, nw?.secondsRemaining]);

  if (!nw || !nw.isOpen) return null;

  const actorName = getPlayerName(nw.originalPlayerId);
  const actionLabelVi = getActionFriendlyName(nw.originalActionType);

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 5) * 100));

  return (
    <div className="w-full max-w-xl mx-auto my-2 px-3 animate-bounce-subtle">
      <div className="relative overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-2 border-red-500/80 rounded-2xl p-3 shadow-2xl">
        {/* Thanh đếm ngược 5 giây */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-950">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Thông tin hành động */}
          <div className="flex items-center gap-2 text-left">
            <div className="text-2xl animate-pulse">🛑</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-300 text-sm">CỬA SỔ NOPE!</span>
                <span className="text-xs bg-red-900/80 text-red-200 px-2 py-0.5 rounded-full font-mono">
                  ⏱️ {secondsLeft}s
                </span>
                {nw.nopeCount > 0 && (
                  <span className="text-xs bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">
                    x{nw.nopeCount} Nope!
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-200 mt-0.5">
                <strong className="text-white">{actorName}</strong> đánh{' '}
                <span className="text-amber-300 font-semibold">{actionLabelVi}</span>.{' '}
                {nw.isCurrentlyNoped ? (
                  <span className="text-red-400 font-bold">🚫 Đang bị NOPE chặn!</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">⚡ Sắp thực thi!</span>
                )}
              </p>
            </div>
          </div>

          {/* Các nút bấm tương tác */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canPlayNope && !hasPassed && (
              <button
                type="button"
                onClick={() => {
                  feedback.playNope();
                  if (myNopeCard) onPlayNope(myNopeCard.id);
                }}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-xl shadow-lg border border-red-300 flex items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                <span>🚫</span> Đánh NOPE!
              </button>
            )}

            {!hasPassed ? (
              <button
                type="button"
                onClick={onPassNope}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold rounded-xl border border-slate-600 active:scale-95 transition-transform"
              >
                Bỏ qua
              </button>
            ) : (
              <span className="text-xs text-gray-400 italic px-2">Đã bỏ qua, chờ người khác...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getActionFriendlyName(type: string): string {
  switch (type) {
    case 'ATTACK':
      return 'Tấn công (Attack)';
    case 'SKIP':
      return 'Bỏ lượt (Skip)';
    case 'FAVOR':
      return 'Xin bài (Favor)';
    case 'SHUFFLE':
      return 'Xáo bài (Shuffle)';
    case 'SEE_THE_FUTURE':
      return 'Xem tương lai (See Future)';
    case 'TWO_OF_A_KIND':
      return 'Combo 2 lá (Cướp bài ngẫu nhiên)';
    case 'THREE_OF_A_KIND':
      return 'Combo 3 lá (Đòi bài chỉ định)';
    case 'FIVE_DIFFERENT':
      return 'Combo 5 lá (Lục tìm bài bỏ)';
    default:
      return type;
  }
}
