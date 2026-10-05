import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import {
  getCardInfoVi,
  getEndTurnState,
  getValidTargets,
  type SEAction,
  type SEPlayerView,
  type SEPlayerViewPlayer,
  type SETradeView,
} from '@boardgame/game-side-effects';
import type { UserSession } from '../../net/session.js';
import { CardZoomModal } from './CardZoomModal.js';
import { DiscardModal } from './DiscardModal.js';
import { GameLogList, GameLogsModal } from './GameLogsModal.js';
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
  // Máy tính: màn ngang rộng ≥ 1024px → bố cục 3 cột có bảng nhật ký bên phải
  const isDesktop = isLandscape && windowDimensions.width >= 1024;

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
        return { handWidth: 172, psycheWidth: 142, oppWidth: 80 };
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
        return { handWidth: 142, psycheWidth: 92, oppWidth: 54 };
      }
      if (numPlayers === 3) {
        return { handWidth: 112, psycheWidth: 86, oppWidth: 46 };
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

  // Xác định xem có lời mời nào gửi tới mình đang chờ mình xử lý hay không (Phần 2.B)
  const hasIncomingTrade = Boolean(
    myActiveTrade &&
      ((myActiveTrade.status === 'PROPOSED' && myActiveTrade.targetPlayerId === myId) ||
        (myActiveTrade.status === 'RESPONDED' && myActiveTrade.proposerId === myId)),
  );
  const incomingTrade = hasIncomingTrade ? myActiveTrade : null;

  // Thông báo kết thúc đổi bài (Phần 2.B mục 4)
  const [tradeResultMessage, setTradeResultMessage] = useState<string | null>(null);
  const prevTradesRef = useRef<SETradeView[]>(gameView.trades);
  const prevLogsLengthRef = useRef<number>(gameView.logs.length);

  useEffect(() => {
    const prevTrades = prevTradesRef.current;
    const currentTrades = gameView.trades;

    // Tìm trade liên quan đến myId vừa biến mất (bị từ chối, huỷ, hoặc hoàn tất)
    const disappearedTrade = prevTrades.find(
      (pt) =>
        (pt.proposerId === myId || pt.targetPlayerId === myId) &&
        !currentTrades.some((ct) => ct.tradeId === pt.tradeId),
    );

    if (disappearedTrade) {
      const otherId =
        disappearedTrade.proposerId === myId
          ? disappearedTrade.targetPlayerId
          : disappearedTrade.proposerId;
      const otherName = playerNames[otherId] || otherId;

      const newLogs = gameView.logs.slice(prevLogsLengthRef.current);
      const relevantLog = [...newLogs].reverse().find(
        (log) => log.includes('giao dịch') || log.includes('đổi bài'),
      );

      let msg = '';
      if (relevantLog) {
        if (relevantLog.includes('từ chối')) {
          msg =
            disappearedTrade.proposerId === myId
              ? `${otherName} từ chối đổi bài`
              : `Đã từ chối đổi bài với ${otherName}`;
        } else if (relevantLog.includes('hoàn tất')) {
          msg = `Đã đổi bài với ${otherName}`;
        } else if (relevantLog.includes('huỷ')) {
          msg = `${otherName} đã huỷ đề nghị đổi bài`;
        }
      }
      if (!msg) {
        msg = `Giao dịch với ${otherName} đã kết thúc`;
      }

      setTradeResultMessage(msg);
      setShowTradeModal(false);
      const timer = setTimeout(() => {
        setTradeResultMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }

    prevTradesRef.current = currentTrades;
    prevLogsLengthRef.current = gameView.logs.length;
  }, [gameView.trades, gameView.logs, myId, playerNames]);

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

  // Logic trạng thái nút Kết thúc lượt (Phần 2.A)
  const endTurnState = getEndTurnState(gameView, myId);
  const endTurnAllowed = endTurnState.enabled;
  const discardCount = endTurnState.discardCount;

  const handleEndTurnClick = async () => {
    if (!endTurnAllowed) return;
    if (discardCount > 0) {
      setShowDiscardModal(true);
      return;
    }
    const ok = await onSendAction({ type: 'END_TURN' });
    if (!ok) {
      alert('Không thể kết thúc lượt. Vui lòng thử lại!');
      return;
    }
    setSelectedCardId(null);
  };

  const handleConfirmDiscard = async (cardIds: string[]) => {
    setShowDiscardModal(false);
    try {
      const ok = await onSendAction({ type: 'DISCARD', cardIds });
      if (!ok) {
        alert('Lỗi khi bỏ bài thừa. Vui lòng thử lại!');
        return;
      }
      const endOk = await onSendAction({ type: 'END_TURN' });
      if (!endOk) {
        alert('Lỗi khi kết thúc lượt sau khi bỏ bài. Vui lòng thử lại!');
        return;
      }
      setSelectedCardId(null);
    } catch (err) {
      alert(`Đã xảy ra lỗi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

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
        <span style={{ fontSize: isLandscape ? '11px' : '12px', color: '#f8fafc', lineHeight: isLandscape ? 1.15 : 1.35 }}>
          <strong style={{ color: '#38bdf8' }}>{selectedInfo.nameVi}</strong>
          {' — '}trị {selectedInfo.treatsVi || ''}
          {' · '}Tác dụng phụ: <span style={{ color: '#fda4af', fontWeight: 600 }}>{tdpText}</span>
        </span>
      );
    }

    if (selectedInfo.type === 'disorder') {
      return (
        <span style={{ fontSize: isLandscape ? '11px' : '12px', color: '#f8fafc', lineHeight: isLandscape ? 1.15 : 1.35 }}>
          <strong style={{ color: '#ef4444' }}>{selectedInfo.nameVi}</strong>
          {' — '}đưa cho người đang mở cửa cho bệnh này
        </span>
      );
    }

    if (selectedInfo.type === 'episode') {
      return (
        <span style={{ fontSize: isLandscape ? '11px' : '12px', color: '#f8fafc', lineHeight: isLandscape ? 1.15 : 1.35 }}>
          <strong style={{ color: '#f97316' }}>Triệu Chứng</strong>
          {' — '}kích hoạt Bệnh Lý tương ứng ở đối thủ
        </span>
      );
    }

    if (selectedInfo.type === 'therapy') {
      return (
        <span style={{ fontSize: isLandscape ? '11px' : '12px', color: '#f8fafc', lineHeight: isLandscape ? 1.15 : 1.35 }}>
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

  // ===================== KHUNG THANH TRÊN 30px (DARK CASINO BRASS BAR) =====================
  const renderTopBar = () => (
    <header
      style={{
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        background: 'linear-gradient(180deg, rgba(16, 40, 32, 0.96) 0%, rgba(10, 26, 21, 0.96) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.28)',
        borderRadius: '7px',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {/* 1. Lượt đi */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
        {isMyTurn ? (
          <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
            Lượt của bạn
          </span>
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
            backgroundColor: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
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
            backgroundColor: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            color: '#fde047',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            padding: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.15s ease',
          }}
        >
          ?
        </button>

        <div style={{ position: 'relative' }}>
          <button
            data-testid="menu-button"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              position: 'relative',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              color: '#fde047',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              padding: '0 6px',
              borderRadius: '5px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            ⋯
            {hasIncomingTrade && (
              <span
                data-testid="menu-badge"
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.95)',
                }}
              />
            )}
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '32px',
                right: 0,
                backgroundColor: 'rgba(10, 24, 19, 0.96)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: '10px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 999,
                minWidth: '160px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.85), 0 0 20px rgba(212, 175, 55, 0.12)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <button
                data-testid="rules-menu-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowRules(true);
                }}
                style={{
                  padding: '8px 10px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                📖 Luật chơi
              </button>
              <button
                data-testid="trade-menu-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowTradeModal(true);
                }}
                style={{
                  padding: '8px 10px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: hasIncomingTrade ? '#facc15' : '#f8fafc',
                  fontSize: '12px',
                  fontWeight: hasIncomingTrade ? 800 : 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                {hasIncomingTrade ? '🤝 Đổi bài (1 lời mời)' : '🤝 Đổi bài'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowLogsModal(true);
                }}
                style={{
                  padding: '8px 10px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                📜 Nhật ký ván chơi
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
                  padding: '8px 10px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                🚪 Thoát ván
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // ===================== NÚT ĐỔI BÀI & NHẬT KÝ TRÊN BÀN =====================
  const renderTradeButton = (large: boolean) => (
    <button
      type="button"
      data-testid="trade-button"
      onClick={() => setShowTradeModal(true)}
      className="casino-btn-active"
      style={{
        position: 'relative',
        height: large ? '36px' : isLandscape ? '16px' : '20px',
        padding: large ? '0 14px' : '0 8px',
        flex: large ? 1 : undefined,
        borderRadius: large ? '9px' : '5px',
        background: hasIncomingTrade
          ? 'linear-gradient(135deg, #facc15 0%, #d4af37 100%)'
          : 'rgba(212, 175, 55, 0.12)',
        border: hasIncomingTrade ? '1px solid #fde68a' : '1px solid rgba(212, 175, 55, 0.4)',
        color: hasIncomingTrade ? '#1a1205' : '#fde047',
        fontSize: large ? '13px' : '11px',
        lineHeight: 1,
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: hasIncomingTrade ? '0 0 12px rgba(250, 204, 21, 0.55)' : '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'all 0.15s ease',
      }}
    >
      {hasIncomingTrade && large ? 'Đổi bài (1 lời mời)' : 'Đổi bài'}
      {hasIncomingTrade && !large && (
        <span
          data-testid="trade-button-badge"
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.95)',
          }}
        />
      )}
    </button>
  );

  const renderLogsButton = () => (
    <button
      type="button"
      data-testid="logs-button"
      onClick={() => setShowLogsModal(true)}
      className="casino-btn-active"
      style={{
        height: isLandscape ? '16px' : '20px',
        padding: '0 8px',
        borderRadius: '5px',
        background: 'rgba(212, 175, 55, 0.12)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        color: '#fde047',
        fontSize: '11px',
        lineHeight: 1,
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      Nhật ký
    </button>
  );

  // ===================== BẢNG BÊN PHẢI (CHỈ MÁY TÍNH) =====================
  const renderDesktopSidePanel = () => (
    <section
      data-testid="desktop-side-panel"
      style={{
        flex: '0 0 240px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '100%',
        minHeight: 0,
        padding: '8px 0',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>{renderTradeButton(true)}</div>

      <div
        data-testid="desktop-log-panel"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(14, 34, 27, 0.92) 0%, rgba(8, 22, 17, 0.95) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            padding: '10px 12px 8px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.18)',
            fontFamily: "'Cinzel', serif",
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#facc15',
          }}
        >
          Nhật ký ván chơi
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 10px' }}>
          <GameLogList logs={gameView.logs} compact />
        </div>
      </div>
    </section>
  );

  // ===================== DẢI GIỮA BÀN =====================
  const renderCenterTable = () => (
    <div
      data-testid="center-table-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isLandscape ? '0px 10px' : '2px 10px',
        background: 'linear-gradient(180deg, rgba(14, 34, 27, 0.92) 0%, rgba(8, 22, 17, 0.95) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.22)',
        borderRadius: '7px',
        fontSize: '11px',
        color: '#cbd5e1',
        boxSizing: 'border-box',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <span>Rút <strong style={{ color: '#facc15' }}>{gameView.drawPileCount}</strong></span>
        <span>·</span>
        <span>Bỏ <strong style={{ color: '#94a3b8' }}>{gameView.discardPileCount}</strong></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>Đã đánh: <strong style={{ color: '#34d399' }}>{gameView.cardsPlayedThisTurn}/2 lá</strong></span>
        {!isDesktop && renderTradeButton(false)}
        {!isDesktop && renderLogsButton()}
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
        padding: isLandscape ? '0px 8px' : '2px 8px',
        background: 'linear-gradient(180deg, rgba(14, 34, 27, 0.92) 0%, rgba(8, 22, 17, 0.95) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.22)',
        borderRadius: '7px',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: isLandscape ? '20px' : '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
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
          height: isLandscape ? '20px' : '28px',
          padding: '0 12px',
          borderRadius: '6px',
          background: !endTurnAllowed
            ? 'rgba(20, 42, 34, 0.6)'
            : discardCount > 0
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : isMyTurn
                ? 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)'
                : 'rgba(22, 56, 45, 0.8)',
          color: endTurnAllowed ? '#ffffff' : '#64748b',
          fontSize: '12px',
          fontWeight: 800,
          border: endTurnAllowed ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(212, 175, 55, 0.1)',
          cursor: endTurnAllowed ? 'pointer' : 'not-allowed',
          boxShadow: endTurnAllowed
            ? discardCount > 0
              ? '0 2px 10px rgba(245, 158, 11, 0.45)'
              : '0 2px 10px rgba(16, 185, 129, 0.45)'
            : 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {discardCount > 0 ? `Kết thúc lượt (bỏ ${discardCount} lá)` : 'Kết thúc lượt'}
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
        maxWidth: isDesktop ? '1600px' : isLandscape ? '1200px' : '480px',
        height: '100vh',
        maxHeight: '100vh',
        margin: '0 auto',
        padding: isLandscape ? '1px 6px' : '4px 6px',
        gap: isLandscape ? '4px' : '4px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        // NỀN NỈ SÒNG BÀI DARK CASINO
        background: 'radial-gradient(ellipse at 50% 30%, #0f3527 0%, #092018 60%, #040e0b 100%)',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ===================== KHI XOAY NGANG: CỘT TRÁI (~42%) ===================== */}
      {isLandscape ? (
        <aside
          style={{
            flex: isDesktop ? '0 0 33%' : '0 0 42%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '6px',
            height: '100%',
            maxHeight: '100%',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {renderTopBar()}
          {/* Ghế các đối thủ xếp dọc (dồn lên đầu cột ngay dưới thanh trên - Phần 1 mục 2) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'flex-start' }}>
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
          gap: isLandscape ? '1px' : sectionGap,
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

      {isDesktop && renderDesktopSidePanel()}

      {/* ===================== MODAL PHÓNG TO CARD (Mục B5) ===================== */}
      <CardZoomModal
        cardId={zoomedCardId}
        onClose={() => setZoomedCardId(null)}
      />

      {/* Modal Bỏ bài khi bài tay > 6 lá */}
      {showDiscardModal && (
        <DiscardModal
          hand={myHand}
          neededCount={discardCount}
          onConfirmDiscard={handleConfirmDiscard}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}

      {/* ===================== HỘP THÔNG BÁO LỜI MỜI ĐỔI BÀI (Phần 2.B) ===================== */}
      {hasIncomingTrade && incomingTrade && !showTradeModal && (
        <div
          data-testid="trade-notice"
          style={{
            position: 'fixed',
            top: isLandscape ? '44px' : '48px',
            left: isLandscape ? '44%' : '12px',
            right: isLandscape ? '16px' : '12px',
            maxWidth: isLandscape ? '420px' : '456px',
            margin: '0 auto',
            zIndex: 1200,
            background: 'linear-gradient(135deg, rgba(16, 38, 30, 0.98) 0%, rgba(10, 24, 19, 0.98) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.65)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85), 0 0 20px rgba(234, 179, 8, 0.25)',
            boxSizing: 'border-box',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, fontSize: '13px', color: '#f8fafc', lineHeight: 1.3 }}>
            {incomingTrade.status === 'PROPOSED' ? (
              <span>
                <strong style={{ color: '#facc15' }}>
                  {playerNames[incomingTrade.proposerId] || incomingTrade.proposerId}
                </strong>{' '}
                mời bạn đổi bài: đưa bạn{' '}
                <strong style={{ color: '#34d399' }}>
                  {incomingTrade.offerCardCount ?? incomingTrade.offerCardIds?.length ?? 1} lá
                </strong>
              </span>
            ) : (
              <span>
                <strong style={{ color: '#facc15' }}>
                  {playerNames[incomingTrade.targetPlayerId] || incomingTrade.targetPlayerId}
                </strong>{' '}
                đã trả lời, xác nhận đổi bài
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              data-testid="trade-notice-view"
              onClick={() => setShowTradeModal(true)}
              className="casino-btn-active"
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
              }}
            >
              Xem
            </button>
            {incomingTrade.status === 'PROPOSED' && (
              <button
                type="button"
                data-testid="trade-notice-reject"
                onClick={async () => {
                  await onSendAction({
                    type: 'RESPOND_TRADE',
                    tradeId: incomingTrade.tradeId,
                    accept: false,
                  });
                }}
                className="casino-btn-active"
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Từ chối
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thông báo kết quả đổi bài (3 giây) */}
      {tradeResultMessage && (
        <div
          data-testid="trade-result-banner"
          style={{
            position: 'fixed',
            top: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '90vw',
            zIndex: 1300,
            background: 'linear-gradient(135deg, rgba(16, 38, 30, 0.98) 0%, rgba(10, 24, 19, 0.98) 100%)',
            color: '#fde047',
            border: '1px solid rgba(234, 179, 8, 0.6)',
            borderRadius: '999px',
            padding: '6px 18px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(234, 179, 8, 0.25)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {tradeResultMessage}
        </div>
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
