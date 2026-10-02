import React, { useState } from 'react';
import type {
  CardInstance,
  SEAction,
  SEPlayerViewPlayer,
  SETradeView,
} from '@boardgame/game-side-effects';
import { CardView } from './CardView.js';

export interface TradeModalProps {
  myPlayerId: string;
  myHand: CardInstance[];
  opponents: SEPlayerViewPlayer[];
  playerNames: Record<string, string>;
  activeTrade?: SETradeView;
  onSendAction: (action: SEAction) => void;
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  myPlayerId,
  myHand,
  opponents,
  playerNames,
  activeTrade,
  onSendAction,
  onClose,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    opponents[0]?.id ?? '',
  );
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [selectedGiveIds, setSelectedGiveIds] = useState<string[]>([]);

  const toggleOfferCard = (id: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleGiveCard = (id: string) => {
    setSelectedGiveIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // 1. Nếu có giao dịch đang diễn ra liên quan đến người chơi
  if (activeTrade) {
    const isProposer = activeTrade.proposerId === myPlayerId;
    const isTarget = activeTrade.targetPlayerId === myPlayerId;
    const otherPlayerId = isProposer ? activeTrade.targetPlayerId : activeTrade.proposerId;
    const otherName = playerNames[otherPlayerId] || otherPlayerId;

    // A. Người nhận phản hồi lời đề xuất
    if (isTarget && activeTrade.status === 'PROPOSED') {
      const offeredCardInstances: CardInstance[] = (activeTrade.offerCardIds ?? []).map((id) => {
        const parts = id.split('#');
        const cardId = parts[0]!;
        let type: CardInstance['type'] = 'disorder';
        if (cardId.startsWith('med_') || cardId === 'sildenafil' || cardId === 'chlorpromazine' || cardId === 'clozapine' || cardId === 'fluoxetine' || cardId === 'lithium' || cardId === 'lorazepam') {
          type = 'drug';
        } else if (cardId === 'episode') {
          type = 'episode';
        } else if (cardId === 'therapy') {
          type = 'therapy';
        }
        return { instanceId: id, cardId, type };
      });

      return (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9996,
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
              maxWidth: '420px',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '24px', marginBottom: '2px' }}>🤝</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                Lời mời đổi bài
              </h3>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                <strong>{otherName}</strong> muốn đổi với bạn các lá bài sau:
              </p>
            </div>

            {/* Các lá bài người đề xuất đưa ra */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0', flexShrink: 0 }}>
              {offeredCardInstances.map((c) => (
                <CardView key={c.instanceId} card={c} size="compact" />
              ))}
            </div>

            {/* Chọn lá bài đáp lại (có thể 0 lá) */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', flexShrink: 0 }}>
                Chọn lá bài của bạn muốn trao đổi lại (có thể không chọn lá nào):
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '8px',
                  maxHeight: 'min(150px, 35vh)',
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: '60px',
                }}
              >
                {myHand.map((c) => {
                  const isSelected = selectedGiveIds.includes(c.instanceId);
                  return (
                    <div
                      key={c.instanceId}
                      data-testid={`trade-give-card-${c.instanceId}`}
                      onClick={() => toggleGiveCard(c.instanceId)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '10px',
                        outline: isSelected ? '3px solid #10b981' : 'none',
                      }}
                    >
                      <CardView card={c} size="compact" isSelected={isSelected} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                data-testid="accept-trade-button"
                onClick={() => {
                  onSendAction({
                    type: 'RESPOND_TRADE',
                    tradeId: activeTrade.tradeId,
                    accept: true,
                    giveCardIds: selectedGiveIds,
                  });
                }}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Đồng ý đổi
              </button>

              <button
                type="button"
                data-testid="reject-trade-button"
                onClick={() => {
                  onSendAction({
                    type: 'RESPOND_TRADE',
                    tradeId: activeTrade.tradeId,
                    accept: false,
                  });
                }}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      );
    }

    // B. Người khởi tạo chờ đối thủ phản hồi
    if (isProposer && activeTrade.status === 'PROPOSED') {
      return (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9996,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              padding: '24px',
              textAlign: 'center',
              maxWidth: '360px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '32px' }}>⏳</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Đang chờ phản hồi
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Đã gửi lời đề xuất đổi {activeTrade.offerCardCount} lá bài đến <strong>{otherName}</strong>.
            </p>
            <button
              type="button"
              onClick={() => onSendAction({ type: 'CANCEL_TRADE', tradeId: activeTrade.tradeId })}
              style={{
                marginTop: '8px',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Huỷ đề xuất
            </button>
          </div>
        </div>
      );
    }

    // C. Người khởi tạo xem phản hồi của đối thủ và bấm Xác nhận
    if (isProposer && activeTrade.status === 'RESPONDED') {
      const givenCardInstances: CardInstance[] = (activeTrade.giveCardIds ?? []).map((id) => {
        const parts = id.split('#');
        const cardId = parts[0]!;
        let type: CardInstance['type'] = 'disorder';
        if (cardId.startsWith('med_') || cardId === 'sildenafil' || cardId === 'chlorpromazine' || cardId === 'clozapine' || cardId === 'fluoxetine' || cardId === 'lithium' || cardId === 'lorazepam') {
          type = 'drug';
        } else if (cardId === 'episode') {
          type = 'episode';
        } else if (cardId === 'therapy') {
          type = 'therapy';
        }
        return { instanceId: id, cardId, type };
      });

      return (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9996,
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
              maxWidth: '420px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>🎉</div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                Đối thủ đã chấp thuận!
              </h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                <strong>{otherName}</strong> đã đồng ý và đưa ra {givenCardInstances.length} lá bài sau:
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0' }}>
              {givenCardInstances.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', padding: '12px' }}>
                  (Không đưa lá nào)
                </div>
              ) : (
                givenCardInstances.map((c) => (
                  <CardView key={c.instanceId} card={c} size="compact" />
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                data-testid="confirm-trade-button"
                onClick={() =>
                  onSendAction({
                    type: 'CONFIRM_TRADE',
                    tradeId: activeTrade.tradeId,
                    accept: true,
                  })
                }
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Xác nhận hoàn tất
              </button>

              <button
                type="button"
                data-testid="cancel-trade-button"
                onClick={() =>
                  onSendAction({
                    type: 'CONFIRM_TRADE',
                    tradeId: activeTrade.tradeId,
                    accept: false,
                  })
                }
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Huỷ giao dịch
              </button>
            </div>
          </div>
        </div>
      );
    }

    // D. Người nhận chờ người khởi tạo xác nhận
    return (
      <div
        role="dialog"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9996,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '24px',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '32px' }}>⏳</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Chờ xác nhận cuối cùng
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Đang chờ <strong>{otherName}</strong> xác nhận hoàn tất giao dịch…
          </p>
          <button
            type="button"
            onClick={() => onSendAction({ type: 'CANCEL_TRADE', tradeId: activeTrade.tradeId })}
            style={{
              marginTop: '8px',
              padding: '10px',
              borderRadius: '10px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Huỷ giao dịch
          </button>
        </div>
      </div>
    );
  }

  // 2. Chưa có giao dịch: Tạo đề xuất đổi bài mới
  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9996,
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
          maxWidth: '420px',
          maxHeight: '94vh',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
              Thương Lượng (Đổi bài)
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Có thể thực hiện bất kỳ lúc nào, kể cả ngoài lượt
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Chọn đối thủ */}
        <div style={{ flexShrink: 0 }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
            Chọn người muốn đổi:
          </label>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {opponents.map((opp) => {
              const isSelected = opp.id === selectedTargetId;
              const name = playerNames[opp.id] || opp.id;
              return (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setSelectedTargetId(opp.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#2563eb' : '#0f172a',
                    border: isSelected ? '1px solid #60a5fa' : '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chọn bài đưa ra */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px', flexShrink: 0 }}>
            Chọn lá bài bạn muốn đưa ra ({selectedOfferIds.length} lá đã chọn):
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
              gap: '6px',
              maxHeight: 'min(150px, 35vh)',
              overflowY: 'auto',
              padding: '2px',
              flex: 1,
              minHeight: '60px',
            }}
          >
            {myHand.map((c) => {
              const isSelected = selectedOfferIds.includes(c.instanceId);
              return (
                <div
                  key={c.instanceId}
                  data-testid={`trade-offer-card-${c.instanceId}`}
                  onClick={() => toggleOfferCard(c.instanceId)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '10px',
                    outline: isSelected ? '3px solid #38bdf8' : 'none',
                  }}
                >
                  <CardView card={c} size="compact" isSelected={isSelected} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút gửi đề xuất */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            data-testid="send-trade-button"
            onClick={() => {
              if (selectedTargetId && selectedOfferIds.length > 0) {
                onSendAction({
                  type: 'PROPOSE_TRADE',
                  targetPlayerId: selectedTargetId,
                  offerCardIds: selectedOfferIds,
                });
                onClose();
              }
            }}
            disabled={!selectedTargetId || selectedOfferIds.length === 0}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: selectedOfferIds.length > 0 ? '#2563eb' : '#334155',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              border: 'none',
              cursor: selectedOfferIds.length > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedOfferIds.length > 0 ? 1 : 0.6,
            }}
          >
            {selectedOfferIds.length > 0
              ? `Gửi đề xuất (${selectedOfferIds.length} lá)`
              : 'Chọn ít nhất 1 lá bài để đổi'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
