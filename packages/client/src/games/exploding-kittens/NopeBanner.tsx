import React, { useEffect, useState } from 'react';
import type { EKCard, EKPlayerView } from '@boardgame/game-exploding-kittens';
import { feedback } from '../../app/feedback/index.js';

export interface NopeBannerProps {
  gameView: EKPlayerView;
  getPlayerName: (id: string) => string;
  onPlayNope: (cardId: string) => void;
  onPassNope: () => void;
}

function getActionFallbackNameVi(actionType: string): string {
  switch (actionType) {
    case 'ATTACK':
      return 'Tấn Công (Attack 2x)';
    case 'SKIP':
      return 'Bỏ Lượt (Skip)';
    case 'FAVOR':
      return 'Xin Bài (Favor)';
    case 'SHUFFLE':
      return 'Xáo Bài (Shuffle)';
    case 'SEE_THE_FUTURE':
      return 'Nhìn Tương Lai (See the Future 3x)';
    case 'PLAY_COMBO':
      return 'Ghép Combo Mèo';
    default:
      return 'hành động';
  }
}

export const NopeBanner: React.FC<NopeBannerProps> = ({
  gameView,
  getPlayerName,
  onPlayNope,
  onPassNope,
}) => {
  const nw = gameView.nopeWindow;
  const [secondsLeft, setSecondsLeft] = useState<number>(5);

  const myNopeCards = gameView.myHand.filter((c: EKCard) => c.code === 'NOPE');
  const hasNope = myNopeCards.length > 0 && gameView.alive;
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
  const actionLabel = nw.actionNameVi ?? getActionFallbackNameVi(nw.originalActionType);
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 5) * 100));

  return (
    <div className="nope-window-banner animate-fade-in" role="alert" aria-live="polite">
      <div className="nope-top-row">
        <span className="nope-title">
          <span style={{ display: 'none' }}>CỬA SỔ NOPE!</span>
          🛑 <strong>{actorName}</strong> đánh <strong>{actionLabel}</strong>
          {nw.nopeCount > 0 && (
            <span
              style={{
                marginLeft: '6px',
                color: '#facc15',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              (x{nw.nopeCount} Nope!)
            </span>
          )}
        </span>
        <span className="nope-timer-tag">⏱️ {secondsLeft}s</span>
      </div>

      <div className="nope-progress-track">
        <div className="nope-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="nope-actions-row">
        <button
          type="button"
          disabled={!hasNope || hasPassed}
          onClick={() => {
            if (hasNope && myNopeCards[0]) {
              feedback.playNope();
              onPlayNope(myNopeCards[0].id);
            }
          }}
          className="btn-danger nope-btn-react"
          style={{ opacity: !hasNope || hasPassed ? 0.5 : 1 }}
        >
          {hasNope
            ? `🚫 Đánh NOPE! (Bạn có ${myNopeCards.length} lá)`
            : '🚫 Không có lá NOPE'}
        </button>

        <button
          type="button"
          disabled={hasPassed}
          onClick={() => {
            onPassNope();
          }}
          className="nope-btn-pass"
          style={{ opacity: hasPassed ? 0.5 : 1 }}
        >
          {hasPassed ? 'Đã bỏ qua' : 'Bỏ qua'}
        </button>
      </div>
    </div>
  );
};
