import React, { useEffect, useMemo, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import {
  canEndTurn,
  getCardDisplayNameVi,
  getDisorderDef,
  getDisorderNameVi,
  getDrugDef,
  getValidTargets,
  mustDiscardCount,
  type SEAction,
  type SEPlayerView,
  type SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import type { UserSession } from '../../net/session.js';
import { CardView } from './CardView.js';
import { DiscardModal } from './DiscardModal.js';
import { GameLogsModal } from './GameLogsModal.js';
import { HandView } from './HandView.js';
import { OpponentSeat } from './OpponentSeat.js';
import { PendingChoiceModal } from './PendingChoiceModal.js';
import { PsycheView, type TargetSlotInfo } from './PsycheView.js';
import { computeOpponentSeats } from './seats.js';
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
  const [selectedOpponentDetailId, setSelectedOpponentDetailId] = useState<string | null>(null);

  // Nhận diện hướng xoay màn hình (landscape vs portrait)
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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

  // Bản đồ xác định người chơi là bot (từ RoomPlayerInfo.isBot)
  const botPlayerMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const p of roomState.players) {
      map[p.playerId] = Boolean(p.isBot);
    }
    return map;
  }, [roomState.players]);

  const activePlayerName = playerNames[gameView.activePlayerId] || gameView.activePlayerId;
  const isActiveBot = botPlayerMap[gameView.activePlayerId];

  const me = gameView.players.find((p) => p.id === myId);
  const myHand = me?.hand ?? [];
  const myPsyche = me?.psyche ?? [];
  const opponents = gameView.players.filter((p) => p.id !== myId);

  // Tính toán vị trí ghế đối thủ quanh bàn chơi sòng bài
  const assignedSeats = useMemo(() => {
    return computeOpponentSeats(
      gameView.playerIds,
      myId,
      isLandscape ? 'landscape' : 'portrait',
    );
  }, [gameView.playerIds, myId, isLandscape]);

  // Ghế được sắp xếp theo đúng thứ tự lượt tính từ người đi sau mình
  const seatedOpponents = useMemo(() => {
    return assignedSeats
      .map((seat) => {
        const opp = opponents.find((p) => p.id === seat.playerId);
        return opp ? { opponent: opp, position: seat.position } : null;
      })
      .filter(
        (item): item is { opponent: SEPlayerViewPlayer; position: (typeof assignedSeats)[number]['position'] } =>
          item !== null,
      );
  }, [assignedSeats, opponents]);

  // Tính toán các mục tiêu hợp lệ của lá bài đang được chọn
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

  // Xử lý khi chạm vào mục tiêu đối thủ (ghế hoặc Bệnh Lý)
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

  // Đối thủ đang mở modal chi tiết
  const detailOpponent = opponents.find((p) => p.id === selectedOpponentDetailId);

  const getPossibleSideEffects = (player: SEPlayerViewPlayer): string[] => {
    const sideEffectsSet = new Set<string>();
    const existingDisorders = new Set(player.psyche.map((s) => s.disorder.cardId));

    for (const slot of player.psyche) {
      if (slot.drug) {
        const def = getDrugDef(slot.drug.cardId);
        if (def) {
          for (const se of def.sideEffects) {
            if (!existingDisorders.has(se)) {
              sideEffectsSet.add(se);
            }
          }
        }
      }
    }
    return Array.from(sideEffectsSet);
  };

  const renderOpponentSeat = (
    opponent: SEPlayerViewPlayer,
    position: (typeof assignedSeats)[number]['position'],
  ) => {
    const giveTarget = opponentTargets.some(
      (t) => t.targetPlayerId === opponent.id && t.type === 'GIVE_DISORDER',
    );
    const episodeTargetDisorderIds = opponentTargets
      .filter(
        (t) =>
          t.targetPlayerId === opponent.id &&
          t.type === 'EPISODE' &&
          Boolean(t.disorderInstanceId),
      )
      .map((t) => t.disorderInstanceId!);

    return (
      <OpponentSeat
        key={opponent.id}
        opponent={opponent}
        playerName={playerNames[opponent.id] || opponent.id}
        isActive={opponent.id === gameView.activePlayerId}
        position={position}
        isDisconnected={roomState.players.find((p) => p.playerId === opponent.id)?.connected === false}
        isBot={botPlayerMap[opponent.id]}
        giveTarget={giveTarget}
        episodeTargetDisorderIds={episodeTargetDisorderIds}
        onSelectSeatTarget={handleSelectOpponentTarget}
        onSelectDisorderTarget={handleSelectOpponentTarget}
        onOpenDetails={(id) => setSelectedOpponentDetailId(id)}
        isLandscape={isLandscape}
      />
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: isLandscape ? '960px' : '480px',
        margin: '0 auto',
        padding: isLandscape ? '4px 8px' : '8px 10px',
        gap: isLandscape ? '4px' : '8px',
        boxSizing: 'border-box',
        minHeight: isLandscape ? 'auto' : '100vh',
        height: isLandscape ? '100vh' : 'auto',
        maxHeight: isLandscape ? '100vh' : 'none',
        overflow: isLandscape ? 'hidden' : 'visible',
        justifyContent: 'space-between',
      }}
    >
      {/* 1. KHU VỰC ĐỐI THỦ */}
      {isLandscape ? (
        /* HÀNG GHẾ ĐỐI THỦ KHI XOAY NGANG: Trải dài ở trên như sòng bài */
        <section
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: seatedOpponents.length === 1 ? 'center' : 'space-between',
            gap: '6px',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          {seatedOpponents.map(({ opponent, position }) => (
            <div
              key={opponent.id}
              style={{
                flex: seatedOpponents.length === 1 ? '0 1 360px' : '1 1 0px',
                minWidth: 0,
              }}
            >
              {renderOpponentSeat(opponent, position)}
            </div>
          ))}
        </section>
      ) : (
        /* KHU VỰC ĐỐI THỦ DỌC: 3 đối thủ xếp 2 hàng gọn gàng, không tràn ngang và không mất tên bệnh */
        <section
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxSizing: 'border-box',
          }}
        >
          {seatedOpponents.length === 3 ? (
            <>
              {/* Hàng 1: Ghế trên (top) chiếm cả hàng */}
              {(() => {
                const topSeat = seatedOpponents.find((s) => s.position === 'top') || seatedOpponents[1]!;
                return (
                  <div style={{ width: '100%' }}>
                    {renderOpponentSeat(topSeat.opponent, topSeat.position)}
                  </div>
                );
              })()}

              {/* Hàng 2: Ghế trái (left) và ghế phải (right) thành hàng thứ 2 */}
              <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                {(() => {
                  const leftSeat = seatedOpponents.find((s) => s.position === 'left') || seatedOpponents[0]!;
                  const rightSeat = seatedOpponents.find((s) => s.position === 'right') || seatedOpponents[2]!;
                  return (
                    <>
                      <div style={{ flex: '1 1 0px', minWidth: 0 }}>
                        {renderOpponentSeat(leftSeat.opponent, leftSeat.position)}
                      </div>
                      <div style={{ flex: '1 1 0px', minWidth: 0 }}>
                        {renderOpponentSeat(rightSeat.opponent, rightSeat.position)}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            /* 1 hoặc 2 đối thủ */
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: seatedOpponents.length === 1 ? 'center' : 'space-between',
                gap: '6px',
              }}
            >
              {seatedOpponents.map(({ opponent, position }) => (
                <div
                  key={opponent.id}
                  style={{
                    flex: seatedOpponents.length === 1 ? '0 1 350px' : '1 1 0px',
                    minWidth: 0,
                  }}
                >
                  {renderOpponentSeat(opponent, position)}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. KHU VỰC DƯỚI BÀN CHƠI */}
      {isLandscape ? (
        /* KHI XOAY NGANG: CHIA 2 CỘT (Trái: Giữa bàn; Phải: Thể trạng + Bài tay) */
        <div
          style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
            flex: 1,
            alignItems: 'stretch',
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        >
          {/* CỘT TRÁI: GIỮA BÀN (CENTER TABLE) */}
          <div
            style={{
              flex: '0 0 215px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              padding: '6px 8px',
              border: '1px solid #334155',
              boxSizing: 'border-box',
              minHeight: 0,
            }}
          >
            {/* Lượt + Đã đánh */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: isMyTurn ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  color: isMyTurn ? '#4ade80' : '#94a3b8',
                  border: isMyTurn ? '1px solid #22c55e' : '1px solid #475569',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isMyTurn ? '🎯 Lượt của bạn' : `Lượt: ${isActiveBot ? '🤖 ' : ''}${activePlayerName}`}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#cbd5e1' }}>
                <span>Đã đánh: <strong>{gameView.cardsPlayedThisTurn}/2 lá</strong></span>
                {gameView.preventPlayCards && isMyTurn && (
                  <span style={{ fontSize: '9px', color: '#f87171', fontWeight: 700 }}>⚡ Liệt</span>
                )}
              </div>
            </div>

            {/* Chồng rút & Chồng bỏ */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
              <div
                style={{
                  flex: 1,
                  height: '32px',
                  borderRadius: '6px',
                  background: 'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)',
                  border: '1px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  color: '#93c5fd',
                  fontWeight: 800,
                  fontSize: '11px',
                }}
                title="Chồng rút"
              >
                <span>🎴</span>
                <span>{gameView.drawPileCount}</span>
              </div>

              <div
                style={{
                  flex: 1,
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  border: '1px dashed #475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
                title={gameView.topDiscard ? `Chồng bỏ: ${getCardDisplayNameVi(gameView.topDiscard)}` : 'Chồng bỏ'}
              >
                <span>🗑️</span>
                <span>{gameView.discardPileCount}</span>
              </div>
            </div>

            {/* Các nút: Kết thúc lượt, Đổi bài, Nhật ký */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={handleEndTurnClick}
                disabled={!isMyTurn || gameView.pendingChoice !== null}
                data-testid="end-turn-button"
                style={{
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: isMyTurn ? (endTurnAllowed ? '#059669' : '#ea580c') : '#334155',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isMyTurn ? 'pointer' : 'not-allowed',
                  opacity: isMyTurn ? 1 : 0.6,
                  boxShadow: isMyTurn ? '0 2px 6px rgba(5, 150, 105, 0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {mustDiscardCount(gameView, myId) > 0 ? `Bỏ ${mustDiscardCount(gameView, myId)} lá` : 'Kết thúc lượt'}
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowTradeModal(true)}
                  style={{
                    flex: 1,
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: myActiveTrade ? '#0284c7' : '#334155',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: myActiveTrade ? '1.5px solid #38bdf8' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🤝 Đổi bài
                  {myActiveTrade && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                      }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogsModal(true)}
                  style={{
                    width: '32px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Xem nhật ký"
                >
                  📜
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: KHU CỦA MÌNH (THỂ TRẠNG + BÀI TRÊN TAY) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '4px',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            {/* Banner hướng dẫn khi đang chọn lá */}
            {selectedCardId && (
              <div
                style={{
                  padding: '2px 6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '5px',
                  color: '#7dd3fc',
                  fontSize: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  Đang chọn: <strong>{getCardDisplayNameVi(myHand.find((c) => c.instanceId === selectedCardId)!)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCardId(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fda4af',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textDecoration: 'underline',
                  }}
                >
                  Huỷ
                </button>
              </div>
            )}

            {/* Thể Trạng của mình */}
            <PsycheView
              psyche={myPsyche}
              isSelf={true}
              targetSlots={myTargetSlots}
              onSelectSlot={handleSelectSelfSlot}
              isLandscape={true}
            />

            {/* Toàn bộ bài trên tay hiện cùng lúc: không cuộn ngang */}
            <HandView
              hand={myHand}
              selectedCardId={selectedCardId}
              onSelectCard={handleSelectCard}
              isLandscape={true}
            />
          </div>
        </div>
      ) : (
        /* KHI CẦM DỌC: GIỮA BÀN + KHU CỦA MÌNH CHỒNG DỌC CHUẨN MỰC */
        <>
          {/* 2. KHU VỰC GIỮA BÀN DỌC */}
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1e293b',
              borderRadius: '12px',
              padding: '8px 10px',
              border: '1px solid #334155',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            {/* Hàng 1: Trạng thái lượt, số lá đã đánh & Chồng rút / Chồng bỏ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    backgroundColor: isMyTurn ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                    color: isMyTurn ? '#4ade80' : '#94a3b8',
                    border: isMyTurn ? '1px solid #22c55e' : '1px solid #475569',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isMyTurn ? '🎯 Lượt của bạn' : `Lượt của ${isActiveBot ? '🤖 ' : ''}${activePlayerName}`}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
                  {gameView.cardsPlayedThisTurn}/2 lá
                </span>
                {gameView.preventPlayCards && isMyTurn && (
                  <span
                    style={{
                      fontSize: '9.5px',
                      color: '#f87171',
                      fontWeight: 700,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}
                  >
                    ⚡ Liệt
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {/* Chồng rút */}
                <div
                  style={{
                    height: '34px',
                    padding: '0 7px',
                    borderRadius: '6px',
                    background: 'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)',
                    border: '1.5px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    color: '#93c5fd',
                    fontWeight: 800,
                    fontSize: '11.5px',
                  }}
                  title="Chồng rút"
                >
                  <span>🎴</span>
                  <span>{gameView.drawPileCount}</span>
                </div>

                {/* Chồng bỏ */}
                <div
                  style={{
                    height: '34px',
                    padding: '0 7px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1.5px dashed #475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                  title={gameView.topDiscard ? `Chồng bỏ: ${getCardDisplayNameVi(gameView.topDiscard)}` : 'Chồng bỏ'}
                >
                  <span>🗑️</span>
                  <span>{gameView.discardPileCount}</span>
                </div>
              </div>
            </div>

            {/* Hàng 2: Các nút hành động chính (Kết thúc lượt, Đổi bài, Nhật ký) */}
            <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleEndTurnClick}
                disabled={!isMyTurn || gameView.pendingChoice !== null}
                data-testid="end-turn-button"
                style={{
                  flex: 1,
                  minHeight: '38px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: isMyTurn ? (endTurnAllowed ? '#059669' : '#ea580c') : '#334155',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isMyTurn ? 'pointer' : 'not-allowed',
                  opacity: isMyTurn ? 1 : 0.6,
                  boxShadow: isMyTurn ? '0 3px 8px rgba(5, 150, 105, 0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {mustDiscardCount(gameView, myId) > 0 ? `Bỏ ${mustDiscardCount(gameView, myId)} lá` : 'Kết thúc lượt'}
              </button>

              <button
                type="button"
                onClick={() => setShowTradeModal(true)}
                style={{
                  minHeight: '38px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: myActiveTrade ? '#0284c7' : '#334155',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: myActiveTrade ? '1.5px solid #38bdf8' : 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                🤝 Đổi bài
                {myActiveTrade && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                    }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowLogsModal(true)}
                style={{
                  minHeight: '38px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                title="Xem nhật ký"
              >
                📜
              </button>
            </div>
          </section>

          {/* 3. KHU VỰC DƯỚI CÙNG: THỂ TRẠNG VÀ BÀI TRÊN TAY CỦA MÌNH */}
          <footer
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Banner hướng dẫn khi đang chọn lá */}
            {selectedCardId && (
              <div
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '6px',
                  color: '#7dd3fc',
                  fontSize: '11px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>
                  Đang chọn: <strong>{getCardDisplayNameVi(myHand.find((c) => c.instanceId === selectedCardId)!)}</strong>
                </span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ color: '#4ade80' }}>Chạm mục tiêu xanh để đánh</span>
                <button
                  type="button"
                  onClick={() => setSelectedCardId(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fda4af',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textDecoration: 'underline',
                  }}
                >
                  Huỷ
                </button>
              </div>
            )}

            {/* Thể Trạng của mình */}
            <PsycheView
              psyche={myPsyche}
              isSelf={true}
              targetSlots={myTargetSlots}
              onSelectSlot={handleSelectSelfSlot}
              isLandscape={false}
            />

            {/* Toàn bộ bài trên tay hiện cùng lúc: không cuộn ngang */}
            <HandView
              hand={myHand}
              selectedCardId={selectedCardId}
              onSelectCard={handleSelectCard}
              isLandscape={false}
            />
          </footer>
        </>
      )}

      {/* 4. MODAL CHI TIẾT ĐỐI THỦ KHI CHẠM VÀO GHẾ */}
      {detailOpponent && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9990,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  {(() => {
                    const selName = playerNames[detailOpponent.id] || detailOpponent.id;
                    const isSelBot = botPlayerMap[detailOpponent.id];
                    return isSelBot ? `🤖 ${selName}` : selName;
                  })()}
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Bài trên tay: {detailOpponent.handCount} lá
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpponentDetailId(null)}
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

            {/* Dòng CÓ THỂ GÂY RA (Tác dụng phụ) */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                ⚡ CÓ THỂ GÂY RA (Tác dụng phụ):
              </div>
              {(() => {
                const sideEffects = getPossibleSideEffects(detailOpponent);
                if (sideEffects.length === 0) {
                  return (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Không có (chưa dùng Thuốc nào có thể gây bệnh thêm)
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {sideEffects.map((se) => (
                      <span
                        key={se}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        {getDisorderNameVi(se)}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Chi tiết Thể Trạng của đối thủ */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                THỂ TRẠNG ({detailOpponent.psyche.length} Bệnh Lý):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {detailOpponent.psyche.map((slot) => {
                  const isTreated = slot.drug !== null;
                  const episodeTarget = opponentTargets.find(
                    (t) =>
                      t.targetPlayerId === detailOpponent.id &&
                      t.type === 'EPISODE' &&
                      t.disorderInstanceId === slot.disorder.instanceId,
                  );
                  const disorderDef = getDisorderDef(slot.disorder.cardId);

                  return (
                    <div
                      key={slot.disorder.instanceId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '10px',
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        border: episodeTarget
                          ? '2px solid #4ade80'
                          : isTreated
                            ? '1px solid #059669'
                            : '1px solid #475569',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {getDisorderNameVi(slot.disorder.cardId)}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isTreated ? '#10b981' : '#ef4444',
                              color: '#ffffff',
                              fontWeight: 700,
                            }}
                          >
                            {isTreated ? 'ĐÃ CHỮA' : 'CHƯA CHỮA'}
                          </span>
                        </div>

                        {episodeTarget && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOpponentDetailId(null);
                              handleSelectOpponentTarget(detailOpponent.id, slot.disorder.instanceId);
                            }}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#ea580c',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            ⚡ Đánh Triệu Chứng
                          </button>
                        )}
                      </div>

                      {/* Hình phạt */}
                      {disorderDef?.punishment && (
                        <div style={{ fontSize: '11px', color: '#fda4af', lineHeight: 1.3 }}>
                          <strong>Hình phạt:</strong> {disorderDef.punishment.textVi}
                        </div>
                      )}

                      {/* Thuốc đã gắn */}
                      {slot.drug && (
                        <div style={{ marginTop: '4px' }}>
                          <CardView card={slot.drug} size="mini" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setSelectedOpponentDetailId(null)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 5. CÁC HỘP THOẠI MODAL KHÁC */}

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
