import React, { useEffect, useMemo, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import {
  canEndTurn,
  getCardInfoVi,
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
import { RulesModal } from './RulesModal.js';

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
  const [showRules, setShowRules] = useState(false);

  // Kích thước cửa sổ trình duyệt
  const [windowDimensions, setWindowDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 375, height: 667 };
  });

  const isLandscape = windowDimensions.width > windowDimensions.height;

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
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
  const numPlayers = gameView.players.length;

  // Tính kích thước lá hiển thị thích ứng theo không gian còn trống (Phần 1 mục 1 & Bảng mục E)
  const cardSizes = useMemo(() => {
    const { width, height } = windowDimensions;
    if (width >= 1024) {
      // Máy tính / Tablet lớn (≥ 1024px, vd 1280x800):
      // Bảng E: Bài tay ≥ 120, Thể Trạng ≥ 110, Đối thủ ≥ 64
      if (numPlayers <= 2) {
        return { handWidth: 180, psycheWidth: 150, oppWidth: 80 };
      }
      if (numPlayers === 3) {
        return { handWidth: 170, psycheWidth: 145, oppWidth: 72 };
      }
      return { handWidth: 165, psycheWidth: 140, oppWidth: 66 };
    }

    if (isLandscape) {
      if (width >= 800) {
        // 844x390 (Bảng E: Bài tay ≥ 70, Thể Trạng ≥ 66, Đối thủ ≥ 36)
        return { handWidth: 70, psycheWidth: 66, oppWidth: 36 };
      }
      // 667x375 (Bảng E: Bài tay ≥ 64, Thể Trạng ≥ 60, Đối thủ ≥ 34)
      return { handWidth: 64, psycheWidth: 60, oppWidth: 34 };
    }

    // Màn hình dọc:
    if (height >= 800) {
      // 390x844 (Bảng E: Bài tay ≥ 96, Thể Trạng ≥ 84, Đối thủ ≥ 44)
      if (numPlayers <= 2) {
        return { handWidth: 135, psycheWidth: 88, oppWidth: 50 };
      }
      if (numPlayers === 3) {
        return { handWidth: 110, psycheWidth: 86, oppWidth: 46 };
      }
      return { handWidth: 96, psycheWidth: 84, oppWidth: 44 };
    }

    // 375x667 (Bảng E: Bài tay ≥ 76, Thể Trạng ≥ 72, Đối thủ ≥ 34 hoặc chỉ chữ)
    if (numPlayers <= 2) {
      return { handWidth: 84, psycheWidth: 74, oppWidth: 36 };
    }
    if (numPlayers === 3) {
      return { handWidth: 78, psycheWidth: 72, oppWidth: 34 };
    }
    return { handWidth: 76, psycheWidth: 72, oppWidth: 0 };
  }, [windowDimensions, isLandscape, numPlayers]);

  // Khoảng cách giữa các khối luôn <= 40px và lấp đầy chiều cao
  const sectionGap = useMemo(() => {
    const { width, height } = windowDimensions;
    if (width >= 1024) {
      return isLandscape ? (numPlayers <= 2 ? '20px' : '12px') : '14px';
    }
    if (isLandscape) {
      return '2px';
    }
    if (height >= 800) {
      return numPlayers <= 2 ? '18px' : numPlayers === 3 ? '10px' : '4px';
    }
    return numPlayers <= 2 ? '10px' : '3px';
  }, [windowDimensions, isLandscape, numPlayers]);

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

  // Dải thông tin lá đang chọn (Phần 2 mục C):
  // 1-2 dòng, nằm ngay trên bài tay, thay thế dải TDP đè trên lá
  const selectedInfo = useMemo(() => {
    if (!selectedCardId) return null;
    const card = myHand.find((c) => c.instanceId === selectedCardId);
    if (!card) return null;
    return getCardInfoVi(card.cardId);
  }, [selectedCardId, myHand]);

  const renderSelectedCardInfo = () => {
    if (!selectedInfo) {
      return (
        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>
          Chạm để chọn · giữ để xem to
        </span>
      );
    }

    if (selectedInfo.type === 'drug') {
      const tdpText = selectedInfo.sideEffectsVi && selectedInfo.sideEffectsVi.length > 0
        ? selectedInfo.sideEffectsVi.join(', ')
        : 'Không có';
      return (
        <span style={{ fontSize: '12px', color: '#f8fafc', lineHeight: 1.35 }}>
          <strong style={{ color: '#38bdf8' }}>{selectedInfo.nameVi}</strong>
          {' — '}trị {selectedInfo.treatsVi || ''}
          {' · '}Tác dụng phụ: <span style={{ color: '#fda4af', fontWeight: 600 }}>{tdpText}</span>
        </span>
      );
    }

    if (selectedInfo.type === 'disorder') {
      return (
        <span style={{ fontSize: '12px', color: '#f8fafc', lineHeight: 1.35 }}>
          <strong style={{ color: '#ef4444' }}>{selectedInfo.nameVi}</strong>
          {' — '}đưa cho người đang mở cửa cho bệnh này
        </span>
      );
    }

    if (selectedInfo.type === 'episode') {
      return (
        <span style={{ fontSize: '12px', color: '#f8fafc', lineHeight: 1.35 }}>
          <strong style={{ color: '#f97316' }}>Triệu Chứng</strong>
          {' — '}kích hoạt Bệnh Lý tương ứng ở đối thủ
        </span>
      );
    }

    if (selectedInfo.type === 'therapy') {
      return (
        <span style={{ fontSize: '12px', color: '#f8fafc', lineHeight: 1.35 }}>
          <strong style={{ color: '#10b981' }}>Liệu Pháp</strong>
          {' — '}loại bỏ 1 Bệnh Lý bất kỳ khỏi Thể Trạng của bạn
        </span>
      );
    }

    return (
      <span style={{ fontSize: '12px', color: '#f8fafc' }}>
        <strong>{selectedInfo.nameVi}</strong>
      </span>
    );
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

    const isAnyTarget = giveTarget || episodeTargetDisorderIds.length > 0;
    const dimmed = Boolean(selectedCardId && !isAnyTarget);

    return (
      <OpponentSeat
        key={opponent.id}
        opponent={opponent}
        playerName={playerNames[opponent.id] || opponent.id}
        isActive={opponent.id === gameView.activePlayerId}
        position={position}
        isDisconnected={roomState.players.find((p) => p.playerId === opponent.id)?.connected === false}
        isBot={botPlayerMap[opponent.id]}
        cardWidth={cardSizes.oppWidth}
        giveTarget={giveTarget}
        episodeTargetDisorderIds={episodeTargetDisorderIds}
        dimmed={dimmed}
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
  // Format đồng hồ: 0:42
  const formattedTime = `0:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
  // Ván thật ẩn turn-timer cho tới D4; chỉ /?mock=1 được hiện số mẫu (Phần 1 mục 5)
  const isMock = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mock') === '1';

  // ===================== KHUNG THANH TRÊN 30px =====================
  const renderTopBar = () => (
    <header
      style={{
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        backgroundColor: '#122520',
        borderRadius: '6px',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* 1. Lượt đi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
        {isMyTurn ? (
          <span style={{ color: '#4ade80' }}>Lượt của bạn</span>
        ) : (
          <span style={{ color: '#cbd5e1' }}>
            Lượt: {isActiveBot ? '🤖 ' : ''}{activePlayerName}
          </span>
        )}
      </div>

      {/* 2. Đồng hồ lượt: chỉ hiện ở /?mock=1 */}
      {isMock && (
        <div
          data-testid="turn-timer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            color: timeLeft <= 15 ? '#f87171' : '#fbbf24',
          }}
        >
          <span>⏱ {formattedTime}</span>
        </div>
      )}

      {/* 3. Nút "?" Luật chơi & Menu "⋯" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          data-testid="rules-button"
          aria-label="Luật chơi"
          onClick={() => setShowRules(true)}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#1a382e',
            border: '1px solid #285446',
            color: '#cbd5e1',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ?
        </button>

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
              padding: '2px 6px',
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
                backgroundColor: '#122520',
                border: '1px solid #1e3d34',
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 999,
                minWidth: '150px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              <button
                data-testid="rules-menu-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowRules(true);
                }}
                style={{
                  padding: '8px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Luật chơi
              </button>
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
                fontSize: '12px',
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
                fontSize: '12px',
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
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Thoát ván
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );

  // ===================== DẢI GIỮA BÀN =====================
  const renderCenterTable = () => (
    <div
      data-testid="center-table-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isLandscape ? '1px 8px' : '2px 8px',
        backgroundColor: '#122520',
        borderRadius: '6px',
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

  // ===================== DẢI THÔNG TIN LÁ ĐANG CHỌN + NÚT KẾT THÚC LƯỢT =====================
  const renderActionInfoRow = () => (
    <div
      data-testid="action-info-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
        padding: isLandscape ? '1px 8px' : '2px 8px',
        backgroundColor: '#122520',
        borderRadius: '6px',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: isLandscape ? '28px' : '32px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}>
        {renderSelectedCardInfo()}
      </div>

      <button
        onClick={handleEndTurnClick}
        disabled={!endTurnAllowed}
        data-testid="end-turn-button"
        style={{
          height: isLandscape ? '26px' : '28px',
          padding: '0 12px',
          borderRadius: '5px',
          backgroundColor: isMyTurn ? '#16a34a' : '#224036',
          color: isMyTurn ? '#ffffff' : '#94a3b8',
          fontSize: '12px',
          fontWeight: 700,
          border: 'none',
          cursor: endTurnAllowed ? 'pointer' : 'not-allowed',
          boxShadow: isMyTurn ? '0 2px 8px rgba(22, 163, 74, 0.4)' : 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        Kết thúc lượt
      </button>
    </div>
  );

  return (
    <div
      data-testid="game-board-container"
      style={{
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: isLandscape ? '1200px' : '480px',
        height: '100vh',
        maxHeight: '100vh',
        margin: '0 auto',
        padding: isLandscape ? '2px 6px' : '4px 6px',
        gap: isLandscape ? '4px' : '4px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        // Nền nỉ xanh đậm gradient nhẹ (Phần 2 mục F)
        background: 'linear-gradient(180deg, #0f2a24 0%, #0b1f1a 100%)',
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
            justifyContent: 'space-between',
            gap: '3px',
            height: '100%',
            maxHeight: '100%',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {renderTopBar()}
          {/* Ghế các đối thủ xếp dọc (đảm bảo đủ chỗ không cắt) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, justifyContent: 'space-around' }}>
            {seatedOpponents.map(({ opponent, position }) => renderOpponentSeat(opponent, position))}
          </div>
        </aside>
      ) : (
        /* KHI DỌC: KHU TRÊN GỒM THANH TRÊN + ĐỐI THỦ */
        <section
          data-testid="portrait-top-section"
          style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}
        >
          {renderTopBar()}
          {/* Danh sách ghế đối thủ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
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
          gap: sectionGap,
          height: isLandscape ? '100%' : 'auto',
          maxHeight: isLandscape ? '100%' : undefined,
          overflow: isLandscape ? 'hidden' : undefined,
          boxSizing: 'border-box',
          minWidth: 0,
        }}
      >
        {/* Dải giữa bàn: Rút, Bỏ, Đã đánh */}
        {renderCenterTable()}

        {/* Thể Trạng của bạn: xếp bậc thang (Mục D) */}
        <section data-testid="self-psyche-section" style={{ width: '100%' }}>
          <PsycheView
            psyche={myPsyche}
            isSelf={true}
            cardWidth={cardSizes.psycheWidth}
            hasSelection={Boolean(selectedCardId)}
            targetSlots={myTargetSlots}
            onSelectSlot={handleSelectSelfSlot}
            onHoldCard={(id) => setZoomedCardId(id)}
            isLandscape={isLandscape}
          />
        </section>

        {/* Dải thông tin lá đang chọn + Nút Kết thúc lượt (Mục C & F) */}
        <section style={{ width: '100%' }}>
          {renderActionInfoRow()}
        </section>

        {/* Bài trên tay xếp so le 1 hàng (Mục E) */}
        <section data-testid="self-hand-section" style={{ width: '100%' }}>
          <HandView
            hand={myHand}
            selectedCardId={selectedCardId}
            cardWidth={cardSizes.handWidth}
            hasSelection={Boolean(selectedCardId)}
            onSelectCard={handleSelectCard}
            onHoldCard={(id) => setZoomedCardId(id)}
            isLandscape={isLandscape}
          />
        </section>
      </main>

      {/* ===================== MODAL PHÓNG TO CARD (Mục B5) ===================== */}
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

      {/* Modal Luật chơi (Task R2) */}
      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        isMyTurn={isMyTurn}
      />
    </div>
  );
};
