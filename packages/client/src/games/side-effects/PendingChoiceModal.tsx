import React, { useEffect, useState } from 'react';
import type {
  CardInstance,
  SEPendingChoiceView,
  SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import { CardView } from './CardView.js';

export interface PendingChoiceModalProps {
  choice: SEPendingChoiceView;
  myPlayerId: string;
  myHand: CardInstance[];
  players: SEPlayerViewPlayer[];
  playerNames: Record<string, string>;
  deadline?: number;
  onResolve: (payload: { cardId?: string; cardIds?: string[] }) => void;
}

export const PendingChoiceModal: React.FC<PendingChoiceModalProps> = ({
  choice,
  myPlayerId,
  myHand,
  players,
  playerNames,
  deadline,
  onResolve,
}) => {
  const [selectedTremorsIds, setSelectedTremorsIds] = useState<string[]>([]);
  const [selectedAnxietyCardId, setSelectedAnxietyCardId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Đếm ngược nếu có deadline
  useEffect(() => {
    if (!deadline) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remainingMs = deadline - Date.now();
      const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(seconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [deadline]);

  const isMe = choice.playerId === myPlayerId;
  const actorName = playerNames[choice.playerId] || choice.playerId;

  // Trường hợp: ANXIETY_STEAL (Lo âu: Kẻ gây hại lấy 1 lá từ tay nạn nhân)
  if (choice.type === 'ANXIETY_STEAL') {
    const victim = players.find((p) => p.id === choice.victimId);
    const victimName = victim ? playerNames[victim.id] || victim.id : 'Đối thủ';

    if (isMe) {
      const revealedCards = victim?.revealedHand ?? [];

      return (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
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
              background: 'linear-gradient(180deg, rgba(16, 36, 29, 0.98) 0%, rgba(8, 20, 16, 0.98) 100%)',
              borderRadius: '18px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '94vh',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxSizing: 'border-box',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.1)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '24px', marginBottom: '2px' }}>👁️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f43f5e' }}>
                Hình phạt Lo âu
              </h3>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                {victimName} phải ngửa toàn bộ bài trên tay cho bạn xem. Hãy chọn{' '}
                <strong style={{ color: '#38bdf8' }}>1 lá</strong> để lấy về tay mình!
              </p>
            </div>

            {revealedCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                {victimName} không có lá bài nào trên tay.
                <button
                  type="button"
                  onClick={() => onResolve({})}
                  style={{
                    display: 'block',
                    margin: '12px auto 0',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  Xác nhận
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: '8px',
                    justifyItems: 'center',
                    maxHeight: 'min(180px, 45vh)',
                    overflowY: 'auto',
                    padding: '4px',
                    flex: 1,
                    minHeight: '80px',
                  }}
                >
                  {revealedCards.map((card) => {
                    const isSelected = card.instanceId === selectedAnxietyCardId;
                    return (
                      <div
                        key={card.instanceId}
                        onClick={() => setSelectedAnxietyCardId(card.instanceId)}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '12px',
                          outline: isSelected ? '3px solid #38bdf8' : 'none',
                        }}
                      >
                        <CardView card={card} size="compact" isSelected={isSelected} />
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedAnxietyCardId) {
                      onResolve({ cardId: selectedAnxietyCardId });
                    }
                  }}
                  disabled={!selectedAnxietyCardId}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: selectedAnxietyCardId ? '#2563eb' : '#334155',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: selectedAnxietyCardId ? 'pointer' : 'not-allowed',
                    opacity: selectedAnxietyCardId ? 1 : 0.6,
                  }}
                >
                  {selectedAnxietyCardId ? 'Lấy lá bài này về tay' : 'Chọn 1 lá bài'}
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    // Người khác thấy thông báo
    return (
      <div
        role="dialog"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10005,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(16, 36, 29, 0.98) 0%, rgba(8, 20, 16, 0.98) 100%)',
            borderRadius: '18px',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            padding: '24px 20px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👁️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Hình phạt Lo âu
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Đang chờ <strong style={{ color: '#38bdf8' }}>{actorName}</strong> xem bài và chọn 1
            lá từ tay của <strong style={{ color: '#f43f5e' }}>{victimName}</strong>…
          </p>
        </div>
      </div>
    );
  }

  // Trường hợp: TREMORS_DISCARD (Chứng run: Nạn nhân chọn 3 lá bài để bỏ trong thời gian giới hạn)
  if (choice.type === 'TREMORS_DISCARD') {
    if (isMe) {
      const toggleSelect = (id: string) => {
        setSelectedTremorsIds((prev) => {
          if (prev.includes(id)) {
            return prev.filter((i) => i !== id);
          }
          if (prev.length >= 3) {
            return prev;
          }
          return [...prev, id];
        });
      };

      const isReady = selectedTremorsIds.length === 3 || myHand.length < 3;

      return (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
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
              background: 'linear-gradient(180deg, rgba(20, 36, 29, 0.98) 0%, rgba(10, 20, 16, 0.98) 100%)',
              borderRadius: '18px',
              border: '2px solid #ef4444',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '94vh',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxSizing: 'border-box',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.25)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '24px', marginBottom: '2px' }}>⚡</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>
                Hình phạt Chứng run
              </h3>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                Bỏ nhanh <strong>3 lá bài</strong> trên tay, nếu hết giờ bạn sẽ bị{' '}
                <strong style={{ color: '#ef4444' }}>mất toàn bộ bài trên tay</strong>!
              </p>

              {timeLeft !== null && (
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '16px',
                    fontWeight: 900,
                    color: timeLeft <= 3 ? '#ef4444' : '#eab308',
                    animation: timeLeft <= 3 ? 'pulse 0.5s infinite' : 'none',
                  }}
                >
                  ⏱️ Còn lại: {timeLeft} giây
                </div>
              )}
            </div>

            {myHand.length < 3 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#fca5a5' }}>
                Bạn chỉ có {myHand.length} lá trên tay (ít hơn 3 lá). Toàn bộ bài trên tay sẽ bị bỏ.
                <button
                  type="button"
                  onClick={() => onResolve({ cardIds: myHand.map((c) => c.instanceId) })}
                  style={{
                    display: 'block',
                    margin: '12px auto 0',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  Bỏ toàn bộ bài trên tay
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: '8px',
                    justifyItems: 'center',
                    maxHeight: 'min(180px, 45vh)',
                    overflowY: 'auto',
                    padding: '4px',
                    flex: 1,
                    minHeight: '80px',
                  }}
                >
                  {myHand.map((card) => {
                    const isSelected = selectedTremorsIds.includes(card.instanceId);
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

                <button
                  type="button"
                  onClick={() => {
                    if (isReady) {
                      onResolve({ cardIds: selectedTremorsIds });
                    }
                  }}
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
                  {isReady ? 'Xác nhận bỏ 3 lá bài' : `Chọn thêm ${3 - selectedTremorsIds.length} lá`}
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    // Người khác thấy thông báo
    return (
      <div
        role="dialog"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10005,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20, 36, 29, 0.98) 0%, rgba(10, 20, 16, 0.98) 100%)',
            borderRadius: '18px',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            padding: '24px 20px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Hình phạt Chứng run
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Đang chờ <strong style={{ color: '#ef4444' }}>{actorName}</strong> chọn 3 lá bài để
            bỏ…
          </p>
          {timeLeft !== null && (
            <div
              style={{
                marginTop: '10px',
                fontSize: '16px',
                fontWeight: 800,
                color: timeLeft <= 3 ? '#ef4444' : '#eab308',
              }}
            >
              ⏱️ Còn lại: {timeLeft}s
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
