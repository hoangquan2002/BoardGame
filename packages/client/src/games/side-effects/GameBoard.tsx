import React, { useMemo, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import {
  canEndTurn,
  getCardDisplayNameVi,
  getValidTargets,
  mustDiscardCount,
  type SEAction,
  type SEPlayerView,
} from '@boardgame/game-side-effects';
import type { UserSession } from '../../net/session.js';
import { CardView } from './CardView.js';
import { DiscardModal } from './DiscardModal.js';
import { GameLogsModal } from './GameLogsModal.js';
import { HandView } from './HandView.js';
import { OpponentBar } from './OpponentBar.js';
import { PendingChoiceModal } from './PendingChoiceModal.js';
import { PsycheView, type TargetSlotInfo } from './PsycheView.js';
import { TradeModal } from './TradeModal.js';
import { WinnerModal } from './WinnerModal.js';

export interface GameBoardProps {
  session: UserSession;
  roomState: RoomState;
  gameView: SEPlayerView;
  deadline?: number;
  onSendAction: (action: SEAction) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  session,
  roomState,
  gameView,
  deadline,
  onSendAction,
  onLeaveRoom,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const myId = session.playerId;
  const isMyTurn = gameView.activePlayerId === myId;

  // Bản đồ tên người chơi
  const playerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of roomState.players) {
      map[p.playerId] = p.name;
    }
    return map;
  }, [roomState.players]);

  const activePlayerName = playerNames[gameView.activePlayerId] || gameView.activePlayerId;

  const me = gameView.players.find((p) => p.id === myId);
  const myHand = me?.hand ?? [];
  const myPsyche = me?.psyche ?? [];
  const opponents = gameView.players.filter((p) => p.id !== myId);

  // Tính toán các mục tiêu hợp lệ của lá bài được chọn
  const validTargets = useMemo(() => {
    if (!selectedCardId) return [];
    return getValidTargets(gameView, myId, selectedCardId);
  }, [gameView, myId, selectedCardId]);

  // Các slot bệnh lý trong Thể Trạng của mình hợp lệ
  const myTargetSlots: TargetSlotInfo[] = useMemo(() => {
    return validTargets
      .filter((t) => t.targetPlayerId === myId && t.disorderId)
      .map((t) => ({
        disorderInstanceId: t.disorderId!,
        label: t.type === 'TREAT' ? 'Chữa bệnh' : 'Liệu pháp',
      }));
  }, [validTargets, myId]);

  // Các mục tiêu đối thủ hợp lệ
  const opponentTargets = useMemo(() => {
    return validTargets
      .filter((t) => t.targetPlayerId !== myId)
      .map((t) => ({
        targetPlayerId: t.targetPlayerId,
        type: t.type as 'GIVE_DISORDER' | 'EPISODE',
        disorderInstanceId: t.disorderId,
      }));
  }, [validTargets, myId]);

  // Kiểm tra xem có giao dịch nào đang mở liên quan tới mình không
  const myActiveTrade = gameView.trades.find(
    (t) => t.proposerId === myId || t.targetPlayerId === myId,
  );

  // Xử lý khi chạm vào lá bài trên tay
  const handleSelectCard = (instanceId: string) => {
    if (selectedCardId === instanceId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(instanceId);
    }
  };

  // Xử lý khi chạm vào slot Thể Trạng của mình
  const handleSelectSelfSlot = async (disorderInstanceId: string) => {
    const target = validTargets.find(
      (t) => t.targetPlayerId === myId && t.disorderId === disorderInstanceId,
    );
    if (target) {
      setSelectedCardId(null);
      await onSendAction(target.action);
    }
  };

  // Xử lý khi chạm vào mục tiêu đối thủ
  const handleSelectOpponentTarget = async (playerId: string, disorderInstanceId?: string) => {
    const target = validTargets.find(
      (t) =>
        t.targetPlayerId === playerId &&
        (!disorderInstanceId || t.disorderId === disorderInstanceId),
    );
    if (target) {
      setSelectedCardId(null);
      await onSendAction(target.action);
    }
  };

  // Xử lý bấm Kết thúc lượt
  const handleEndTurnClick = async () => {
    const discardCount = mustDiscardCount(gameView, myId);
    if (discardCount > 0) {
      setShowDiscardModal(true);
      return;
    }
    await onSendAction({ type: 'END_TURN' });
    setSelectedCardId(null);
  };

  // Xử lý xác nhận bỏ bài
  const handleConfirmDiscard = async (cardIds: string[]) => {
    setShowDiscardModal(false);
    const ok = await onSendAction({ type: 'DISCARD', cardIds });
    if (ok) {
      await onSendAction({ type: 'END_TURN' });
      setSelectedCardId(null);
    }
  };

  const endTurnAllowed = canEndTurn(gameView, myId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        padding: '12px 10px',
        gap: '12px',
        boxSizing: 'border-box',
        minHeight: '100vh',
        justifyContent: 'space-between',
      }}
    >
      {/* 1. KHU VỰC TRÊN CÙNG: HÀNG ĐỐI THỦ THU GỌN */}
      <header style={{ width: '100%' }}>
        <OpponentBar
          opponents={opponents}
          playerNames={playerNames}
          activePlayerId={gameView.activePlayerId}
          targets={opponentTargets}
          onSelectTarget={handleSelectOpponentTarget}
        />
      </header>

      {/* 2. KHU VỰC CHÍNH GIỮA: BẢNG ĐIỀU KHIỂN & CHỒNG BÀI */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '12px',
          border: '1px solid #334155',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {/* Chỉ báo lượt & số lá đã đánh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 800,
                backgroundColor: isMyTurn ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                color: isMyTurn ? '#4ade80' : '#94a3b8',
                border: isMyTurn ? '1px solid #22c55e' : '1px solid #475569',
              }}
            >
              {isMyTurn
                ? '🎯 Lượt của bạn'
                : `Lượt của ${activePlayerName.startsWith('Máy ') ? '🤖 ' : ''}${activePlayerName}`}
            </span>

            {gameView.preventPlayCards && isMyTurn && (
              <span
                style={{
                  fontSize: '11px',
                  color: '#f87171',
                  fontWeight: 700,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                ⚡ Bị Liệt dương
              </span>
            )}
          </div>

          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
            Đã đánh: <strong>{gameView.cardsPlayedThisTurn}/2 lá</strong>
          </span>
        </div>

        {/* Chồng rút & Lá trên cùng discard */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 0' }}>
          {/* Chồng rút */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: '64px',
                height: '88px',
                borderRadius: '8px',
                background: 'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)',
                border: '1.5px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#93c5fd',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              🎴 {gameView.drawPileCount}
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chồng rút</span>
          </div>

          {/* Lá trên cùng chồng bỏ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {gameView.topDiscard ? (
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                <CardView card={gameView.topDiscard} size="mini" />
              </div>
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '88px',
                  borderRadius: '8px',
                  border: '1.5px dashed #475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '11px',
                }}
              >
                Trống
              </div>
            )}
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Chồng bỏ ({gameView.discardPileCount})
            </span>
          </div>
        </div>

        {/* Các nút hành động chính: Kết thúc lượt & Đổi bài */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleEndTurnClick}
            disabled={!isMyTurn || gameView.pendingChoice !== null}
            style={{
              flex: 2,
              minHeight: '44px',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: isMyTurn ? (endTurnAllowed ? '#059669' : '#ea580c') : '#334155',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: isMyTurn ? 'pointer' : 'not-allowed',
              opacity: isMyTurn ? 1 : 0.6,
              boxShadow: isMyTurn ? '0 4px 10px rgba(5, 150, 105, 0.3)' : 'none',
            }}
          >
            {mustDiscardCount(gameView, myId) > 0
              ? `Bỏ ${mustDiscardCount(gameView, myId)} lá & Kết thúc lượt`
              : 'Kết thúc lượt'}
          </button>

          <button
            type="button"
            onClick={() => setShowTradeModal(true)}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: myActiveTrade ? '#0284c7' : '#334155',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              border: myActiveTrade ? '1.5px solid #38bdf8' : 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            🤝 Đổi bài
            {myActiveTrade && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                }}
              />
            )}
          </button>
        </div>

        {/* Thanh xem nhật ký rút gọn */}
        <div
          onClick={() => setShowLogsModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            padding: '6px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#94a3b8',
            border: '1px solid #334155',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            📜 {gameView.logs[gameView.logs.length - 1] || 'Ván chơi bắt đầu'}
          </span>
          <span style={{ fontSize: '10px', color: '#60a5fa', marginLeft: '6px', whiteSpace: 'nowrap' }}>
            Chi tiết ❯
          </span>
        </div>
      </section>

      {/* 3. KHU VỰC DƯỚI CÙNG: BÀI TRÊN TAY & THỂ TRẠNG CỦA MÌNH */}
      <footer style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {/* Hàng bài trên tay cuộn ngang */}
        <HandView
          hand={myHand}
          selectedCardId={selectedCardId}
          onSelectCard={handleSelectCard}
        />

        {/* Hướng dẫn khi đang chọn lá */}
        {selectedCardId && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              color: '#7dd3fc',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            Đang chọn lá{' '}
            <strong>
              {(() => {
                const c = myHand.find((card) => card.instanceId === selectedCardId);
                return c ? getCardDisplayNameVi(c) : '';
              })()}
            </strong>
            . Hãy chạm vào mục tiêu hợp lệ màu xanh để đánh, hoặc chạm lại vào lá để huỷ.
          </div>
        )}

        {/* Thể Trạng của mình */}
        <PsycheView
          psyche={myPsyche}
          isSelf={true}
          targetSlots={myTargetSlots}
          onSelectSlot={handleSelectSelfSlot}
        />
      </footer>

      {/* 4. CÁC HỘP THOẠI MODAL */}

      {/* Modal Bỏ bài khi bài > 6 */}
      {showDiscardModal && (
        <DiscardModal
          hand={myHand}
          neededCount={mustDiscardCount(gameView, myId)}
          onConfirmDiscard={handleConfirmDiscard}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}

      {/* Modal pendingChoice (Lo âu / Chứng run) */}
      {gameView.pendingChoice && (
        <PendingChoiceModal
          choice={gameView.pendingChoice}
          myPlayerId={myId}
          myHand={myHand}
          players={gameView.players}
          playerNames={playerNames}
          deadline={deadline}
          onResolve={(res) => onSendAction({ type: 'RESOLVE_CHOICE', ...res })}
        />
      )}

      {/* Modal Thương Lượng (Đổi bài) */}
      {(showTradeModal || myActiveTrade) && (
        <TradeModal
          myPlayerId={myId}
          myHand={myHand}
          opponents={opponents}
          playerNames={playerNames}
          activeTrade={myActiveTrade}
          onSendAction={onSendAction}
          onClose={() => setShowTradeModal(false)}
        />
      )}

      {/* Modal Toàn bộ nhật ký */}
      {showLogsModal && (
        <GameLogsModal logs={gameView.logs} onClose={() => setShowLogsModal(false)} />
      )}

      {/* Modal Người chiến thắng */}
      {gameView.winner !== null && (
        <WinnerModal
          winnerId={gameView.winner}
          myPlayerId={myId}
          playerNames={playerNames}
          onHome={onLeaveRoom}
        />
      )}
    </div>
  );
};
