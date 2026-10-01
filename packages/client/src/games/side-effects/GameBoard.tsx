import React, { useEffect, useMemo, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import {
  canEndTurn,
  getValidTargets,
  mustDiscardCount,
  type SEAction,
  type SEPlayerView,
  type SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import type { UserSession } from '../../net/session.js';
import { CardZoomModal } from './CardZoomModal.js';
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
  const [showMenu, setShowMenu] = useState(false);
  const [zoomedCardId, setZoomedCardId] = useState<string | null>(null);

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Đếm ngược thời gian lượt (giây)
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!deadline) return 42;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(42);
      return;
    }
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const myId = session.playerId;
  const isMyTurn = gameView.activePlayerId === myId;

  const playerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of roomState.players) {
      map[p.playerId] = p.name;
    }
    return map;
  }, [roomState.players]);

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

  // Xếp ghế đối thủ
  const assignedSeats = useMemo(() => {
    return computeOpponentSeats(
      gameView.playerIds,
      myId,
      isLandscape ? 'landscape' : 'portrait',
    );
  }, [gameView.playerIds, myId, isLandscape]);

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

  // Mục tiêu hợp lệ của lá bài đang chọn
  const validTargets = useMemo(() => {
    if (!selectedCardId) return [];
    return getValidTargets(gameView, myId, selectedCardId);
  }, [gameView, myId, selectedCardId]);

  const myTargetSlots: TargetSlotInfo[] = useMemo(() => {
    return validTargets
      .filter((t) => t.targetPlayerId === myId && t.disorderId)
      .map((t) => ({
        disorderInstanceId: t.disorderId!,
        label: t.type === 'TREAT' ? 'Chữa bệnh' : 'Liệu pháp',
      }));
  }, [validTargets, myId]);

  const opponentTargets = useMemo(() => {
    return validTargets
      .filter((t) => t.targetPlayerId !== myId)
      .map((t) => ({
        targetPlayerId: t.targetPlayerId,
        type: t.type as 'GIVE_DISORDER' | 'EPISODE',
        disorderInstanceId: t.disorderId,
      }));
  }, [validTargets, myId]);

  const myActiveTrade = gameView.trades.find(
    (t) => t.proposerId === myId || t.targetPlayerId === myId,
  );

  const handleSelectCard = (instanceId: string) => {
    if (selectedCardId === instanceId) {
      setSelectedCardId(null);
    } else {
      setSelectedCardId(instanceId);
    }
  };

  const handleSelectSelfSlot = async (disorderInstanceId: string) => {
    const target = validTargets.find(
      (t) => t.targetPlayerId === myId && t.disorderId === disorderInstanceId,
    );
    if (target) {
      setSelectedCardId(null);
      await onSendAction(target.action);
    }
  };

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

  const handleEndTurnClick = async () => {
    const discardCount = mustDiscardCount(gameView, myId);
    if (discardCount > 0) {
      setShowDiscardModal(true);
      return;
    }
    await onSendAction({ type: 'END_TURN' });
    setSelectedCardId(null);
  };

  const handleConfirmDiscard = async (cardIds: string[]) => {
    setShowDiscardModal(false);
    const ok = await onSendAction({ type: 'DISCARD', cardIds });
    if (ok) {
      await onSendAction({ type: 'END_TURN' });
      setSelectedCardId(null);
    }
  };

  const endTurnAllowed = canEndTurn(gameView, myId);

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
        onOpenDetails={(id) => {
          const opp = opponents.find((p) => p.id === id);
          if (opp && opp.psyche[0]) {
            setZoomedCardId(opp.psyche[0].disorder.cardId);
          }
        }}
        onHoldCard={(id) => setZoomedCardId(id)}
        isLandscape={isLandscape}
      />
    );
  };

  // Format đồng hồ: 0:42
  const formattedTime = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;

  // ===================== KHUNG THANH TRÊN 36px =====================
  const renderTopBar = () => (
    <header
      style={{
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
        borderRadius: '6px',
      }}
    >
      {/* 1. Lượt đi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
        {isMyTurn ? (
          <span style={{ color: '#4ade80' }}>Lượt của bạn</span>
        ) : (
          <span style={{ color: '#cbd5e1' }}>
            Lượt: {isActiveBot ? '🤖 ' : ''}{activePlayerName}
          </span>
        )}
      </div>

      {/* 2. Đồng hồ lượt (Emoji ⏱) */}
      <div
        data-testid="turn-timer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 800,
          color: timeLeft <= 15 ? '#f87171' : '#fbbf24',
          border: `1px solid ${timeLeft <= 15 ? 'rgba(248, 113, 113, 0.4)' : 'rgba(251, 191, 36, 0.3)'}`,
        }}
      >
        <span>⏱ {formattedTime}</span>
      </div>

      {/* 3. Nút Menu "⋯" (Chỉ Thoát trong menu, không có nút thoát ngoài) */}
      <div style={{ position: 'relative' }}>
        <button
          data-testid="menu-button"
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f8fafc',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: '4px',
            lineHeight: 1,
          }}
        >
          ⋯
        </button>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '32px',
              right: 0,
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 999,
              minWidth: '150px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={() => {
                setShowMenu(false);
                setShowTradeModal(true);
              }}
              style={{
                padding: '8px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: '#f8fafc',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đổi bài
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                setShowLogsModal(true);
              }}
              style={{
                padding: '8px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: '#f8fafc',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Nhật ký ván chơi
            </button>
            <button
              onClick={async () => {
                setShowMenu(false);
                if (window.confirm('Máy sẽ chơi thay bạn, bạn có chắc chắn muốn thoát ván không?')) {
                  await onLeaveRoom();
                  window.location.href = '/';
                }
              }}
              style={{
                padding: '8px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Thoát ván
            </button>
          </div>
        )}
      </div>
    </header>
  );

  // ===================== DẢI GIỮA BÀN =====================
  const renderCenterTable = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        backgroundColor: '#1e293b',
        borderRadius: '6px',
        border: '1px solid #334155',
        fontSize: '11px',
        color: '#cbd5e1',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <span>Rút <strong>{gameView.drawPileCount}</strong></span>
        <span>·</span>
        <span>Bỏ <strong>{gameView.discardPileCount}</strong></span>
      </div>
      <div>
        <span>Đã đánh: <strong>{gameView.cardsPlayedThisTurn}/2 lá</strong></span>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        width: '100%',
        maxWidth: isLandscape ? '1100px' : '480px',
        height: '100vh',
        maxHeight: '100vh',
        margin: '0 auto',
        padding: isLandscape ? '4px 8px' : '6px 8px',
        gap: isLandscape ? '8px' : '6px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        justifyContent: 'space-between',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ===================== KHI XOAY NGANG: CỘT TRÁI (~42%) ===================== */}
      {isLandscape ? (
        <aside
          style={{
            flex: '0 0 42%',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            height: '100%',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {renderTopBar()}
          {/* Ghế các đối thủ xếp dọc dạng bậc thang mini */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            {seatedOpponents.map(({ opponent, position }) => renderOpponentSeat(opponent, position))}
          </div>
        </aside>
      ) : (
        /* KHI DỌC: KHU TRÊN GỒM THANH TRÊN + ĐỐI THỦ */
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
          {renderTopBar()}
          {/* Danh sách ghế đối thủ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            {seatedOpponents.map(({ opponent, position }) => renderOpponentSeat(opponent, position))}
          </div>
        </section>
      )}

      {/* ===================== KHI XOAY NGANG: CỘT PHẢI (~58%) / KHI DỌC: PHẦN DƯỚI ===================== */}
      <main
        style={{
          flex: isLandscape ? '1 1 0px' : '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: isLandscape ? '4px' : '6px',
          height: isLandscape ? '100%' : 'auto',
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        {/* Dải giữa bàn: Rút, Bỏ, Đã đánh */}
        {renderCenterTable()}

        {/* Thể Trạng của bạn: xếp bậc thang so le (Góp ý B) */}
        <section style={{ width: '100%' }}>
          <PsycheView
            psyche={myPsyche}
            isSelf={true}
            targetSlots={myTargetSlots}
            onSelectSlot={handleSelectSelfSlot}
            onHoldCard={(id) => setZoomedCardId(id)}
            isLandscape={isLandscape}
          />
        </section>

        {/* Khu vực bài trên tay + Nút Kết thúc lượt */}
        <section
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '8px',
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Bài tay xếp so le 1 hàng */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <HandView
              hand={myHand}
              selectedCardId={selectedCardId}
              onSelectCard={handleSelectCard}
              onHoldCard={(id) => setZoomedCardId(id)}
              isLandscape={isLandscape}
            />
          </div>

          {/* Nút Kết thúc lượt cố định ở góc dưới bên phải */}
          <div style={{ flexShrink: 0, paddingBottom: '2px' }}>
            <button
              onClick={handleEndTurnClick}
              disabled={!endTurnAllowed}
              data-testid="end-turn-button"
              style={{
                height: '42px',
                padding: '0 16px',
                borderRadius: '8px',
                backgroundColor: isMyTurn ? '#16a34a' : '#334155',
                color: isMyTurn ? '#ffffff' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 800,
                border: 'none',
                cursor: endTurnAllowed ? 'pointer' : 'not-allowed',
                boxShadow: isMyTurn ? '0 4px 12px rgba(22, 163, 74, 0.4)' : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              Kết thúc lượt
            </button>
          </div>
        </section>
      </main>

      {/* ===================== MODAL PHÓNG TO CARD (Góp ý A) ===================== */}
      <CardZoomModal
        cardId={zoomedCardId}
        onClose={() => setZoomedCardId(null)}
      />

      {/* Modal Bỏ bài khi bài tay > 6 lá */}
      {showDiscardModal && (
        <DiscardModal
          hand={myHand}
          neededCount={mustDiscardCount(gameView, myId)}
          onConfirmDiscard={handleConfirmDiscard}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}

      {/* Modal Đổi bài */}
      {showTradeModal && (
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

      {/* Modal Nhật ký ván chơi */}
      {showLogsModal && (
        <GameLogsModal
          logs={gameView.logs}
          onClose={() => setShowLogsModal(false)}
        />
      )}

      {/* Modal Lựa chọn đang chờ (Lo âu / Chứng run) */}
      {gameView.pendingChoice && (
        <PendingChoiceModal
          choice={gameView.pendingChoice}
          myPlayerId={myId}
          myHand={myHand}
          players={gameView.players}
          playerNames={playerNames}
          deadline={deadline}
          onResolve={async (payload) => {
            await onSendAction({ type: 'RESOLVE_CHOICE', ...payload });
          }}
        />
      )}

      {/* Modal Thắng / Kết thúc ván */}
      {gameView.winner && (
        <WinnerModal
          winnerId={gameView.winner}
          myPlayerId={myId}
          playerNames={playerNames}
          onHome={() => {
            onLeaveRoom();
            window.location.href = '/';
          }}
        />
      )}
    </div>
  );
};
