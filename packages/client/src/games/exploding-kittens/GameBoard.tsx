import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { RoomState } from '@boardgame/core';
import {
  type EKAction,
  type EKCard,
  type EKCardCode,
  type EKOpponentView,
  type EKPlayerView,
} from '@boardgame/game-exploding-kittens';
import { feedback } from '../../app/feedback/index.js';
import type { UserSession } from '../../net/session.js';
import { Card } from './Card.js';
import { CardZoomModal } from './CardZoomModal.js';
import {
  FavorGiveModal,
  FiveDiffPickModal,
  TargetPlayerModal,
  Combo3TargetModal,
} from './ComboModals.js';
import { DefuseModal } from './DefuseModal.js';
import { NopeBanner } from './NopeBanner.js';
import { RulesModal } from './RulesModal.js';
import { SeeFutureModal } from './SeeFutureModal.js';

export interface EKGameBoardProps {
  session: UserSession;
  roomState: RoomState;
  gameView: EKPlayerView;
  deadline?: number;
  onSendAction: (action: EKAction) => Promise<boolean>;
  onLeaveRoom: () => Promise<boolean>;
}

export const GameBoard: React.FC<EKGameBoardProps> = ({
  session,
  roomState,
  gameView,
  deadline,
  onSendAction,
  onLeaveRoom,
}) => {
  // --- States ---
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [zoomedCard, setZoomedCard] = useState<EKCard | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isDiscardListOpen, setIsDiscardListOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => feedback.isSoundEnabled());
  const [isSeeFutureDismissed, setIsSeeFutureDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(45);

  // States chọn mục tiêu phụ trợ
  const [pendingComboAction, setPendingComboAction] = useState<
    | { type: 'FAVOR_TARGET'; cardId: string }
    | { type: 'COMBO_2_TARGET'; cardIds: [string, string] }
    | { type: 'COMBO_3_TARGET'; cardIds: [string, string, string] }
    | null
  >(null);

  const prevActivePlayerRef = useRef<string | null>(null);

  // --- Map tên người chơi từ RoomState ---
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of roomState.players) {
      // Chuẩn hóa tên bot hiển thị
      let name = p.name;
      if (p.isBot && !name.startsWith('🤖')) {
        name = `🤖 ${name}`;
      }
      map.set(p.playerId, name);
    }
    return map;
  }, [roomState.players]);

  const getPlayerName = (id: string): string => {
    if (id === session.playerId) return 'Bạn';
    return playerNameMap.get(id) ?? id;
  };

  const isMyTurn = gameView.activePlayerId === session.playerId;
  const isAlive = gameView.alive;

  // Format action text: thay thế toàn bộ id kỹ thuật bằng tên hiển thị
  const formatActionText = (text: string | null | undefined): string => {
    if (!text) return 'Trò chơi đang diễn ra...';
    let formatted = text;
    for (const p of roomState.players) {
      const displayName = p.playerId === session.playerId ? 'Bạn' : playerNameMap.get(p.playerId) ?? p.name;
      formatted = formatted.split(p.playerId).join(displayName);
    }
    return formatted;
  };

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (!deadline) {
      setTimeLeft(45);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setTimeLeft(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Âm thanh khi chuyển lượt tới mình
  useEffect(() => {
    if (isMyTurn && prevActivePlayerRef.current !== session.playerId && isAlive) {
      feedback.playYourTurn();
    }
    prevActivePlayerRef.current = gameView.activePlayerId;
  }, [isMyTurn, session.playerId, isAlive, gameView.activePlayerId]);

  // Reset xem tương lai khi có turn mới hoặc knownTopCards thay đổi
  useEffect(() => {
    setIsSeeFutureDismissed(false);
  }, [gameView.knownTopCards]);

  // Âm thanh chiến thắng
  useEffect(() => {
    if (gameView.winner === session.playerId) {
      feedback.playVictory();
    }
  }, [gameView.winner, session.playerId]);

  // --- Xử lý chọn/bỏ chọn thẻ bài ---
  const handleToggleCardSelect = (cardId: string) => {
    feedback.vibrateCard();
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  const handleClearSelection = () => {
    setSelectedCardIds([]);
  };

  // --- Thẻ bài đã chọn ---
  const selectedCards = useMemo(() => {
    return selectedCardIds
      .map((id) => gameView.myHand.find((c) => c.id === id))
      .filter((c): c is EKCard => c !== undefined);
  }, [gameView.myHand, selectedCardIds]);

  // --- Kiểm tra combo từ các thẻ đã chọn ---
  const comboValidation = useMemo(() => {
    const count = selectedCards.length;
    if (count === 0) {
      return {
        valid: false,
        title: 'Chưa chọn lá bài nào',
        desc: 'Chạm vào lá bài để chọn đánh, hoặc chạm giữ để phóng to đọc chi tiết.',
        buttonLabel: 'Đánh bài',
      };
    }

    if (count === 1) {
      const c = selectedCards[0];
      const singlePlayable = ['ATTACK', 'SKIP', 'FAVOR', 'SHUFFLE', 'SEE_THE_FUTURE'].includes(c.code);
      const title = c.variantSubtitleVi ? `${c.nameEn} — ${c.variantSubtitleVi}` : `${c.nameEn} (${c.nameVi})`;

      if (singlePlayable) {
        return {
          valid: true,
          type: 'SINGLE' as const,
          card: c,
          title,
          desc: c.descriptionVi,
          buttonLabel: `Đánh ${c.nameEn}`,
        };
      }
      if (c.code === 'NOPE') {
        return {
          valid: false,
          title,
          desc: 'Lá Nope chỉ có thể đánh phản ứng trong Cửa sổ Nope 5 giây!',
          buttonLabel: 'Đánh bài',
        };
      }
      if (c.code === 'DEFUSE') {
        return {
          valid: false,
          title,
          desc: 'Defuse chỉ tự kích hoạt khi bạn rút phải Mèo Nổ để cứu mạng!',
          buttonLabel: 'Đánh bài',
        };
      }
      return {
        valid: false,
        title,
        desc: 'Lá Mèo này cần ghép bộ Combo 2, 3 hoặc 5 lá mới có thể đánh ra.',
        buttonLabel: 'Đánh bài',
      };
    }

    if (count === 2) {
      const [c1, c2] = selectedCards;
      if (c1.code === c2.code) {
        return {
          valid: true,
          type: 'COMBO_2' as const,
          title: `✨ Combo 2 lá giống nhau (${c1.nameEn})`,
          desc: 'Chọn 1 đối thủ để cướp ngẫu nhiên 1 lá bài bất kỳ trên tay họ.',
          buttonLabel: 'Đánh Combo (2 lá)',
        };
      }
      return {
        valid: false,
        title: 'Chọn 2 lá bài',
        desc: 'Combo 2 lá phải có cùng tên / chủng loại mèo!',
        buttonLabel: 'Đánh bài',
      };
    }

    if (count === 3) {
      const [c1, c2, c3] = selectedCards;
      if (c1.code === c2.code && c2.code === c3.code) {
        return {
          valid: true,
          type: 'COMBO_3' as const,
          title: `✨ Combo 3 lá giống nhau (${c1.nameEn})`,
          desc: 'Chỉ định 1 đối thủ và gọi tên lá bài muốn cướp (nếu họ có, họ phải đưa cho bạn).',
          buttonLabel: 'Đánh Combo (3 lá)',
        };
      }
      return {
        valid: false,
        title: 'Chọn 3 lá bài',
        desc: 'Combo 3 lá phải có cùng tên / chủng loại mèo!',
        buttonLabel: 'Đánh bài',
      };
    }

    if (count === 5) {
      const codes = new Set(selectedCards.map((c) => c.code));
      if (codes.size === 5) {
        return {
          valid: true,
          type: 'COMBO_5' as const,
          title: '✨ Combo 5 lá khác nhau',
          desc: 'Chọn lấy 1 lá bài bất kỳ mà bạn muốn từ chồng bài bỏ.',
          buttonLabel: 'Đánh Combo (5 lá)',
        };
      }
      return {
        valid: false,
        title: 'Chọn 5 lá bài',
        desc: 'Combo 5 lá phải gồm 5 lá có biểu tượng khác nhau hoàn toàn!',
        buttonLabel: 'Đánh bài',
      };
    }

    return {
      valid: false,
      title: `Đã chọn ${count} lá bài`,
      desc: 'Bộ bài đã chọn không tạo thành combo 2, 3 hoặc 5 lá hợp lệ.',
      buttonLabel: 'Đánh bài',
    };
  }, [selectedCards]);

  // --- Các hành động chính ---
  const handleDrawCard = async () => {
    if (!isMyTurn || !isAlive || gameView.phase !== 'TURN_PLAY') return;
    feedback.playCardDraw();
    await onSendAction({ type: 'DRAW_CARD' });
    setSelectedCardIds([]);
  };

  const handleExecutePlay = async () => {
    if (!comboValidation.valid || !isMyTurn || !isAlive || gameView.phase !== 'TURN_PLAY') return;

    if (comboValidation.type === 'SINGLE' && comboValidation.card) {
      const card = comboValidation.card;
      if (card.code === 'FAVOR') {
        setPendingComboAction({ type: 'FAVOR_TARGET', cardId: card.id });
        return;
      }
      feedback.playCardPlay();
      await onSendAction({
        type: 'PLAY_ACTION_CARD',
        cardId: card.id,
      });
      setSelectedCardIds([]);
      return;
    }

    if (comboValidation.type === 'COMBO_2') {
      const cardIds: [string, string] = [selectedCards[0].id, selectedCards[1].id];
      setPendingComboAction({ type: 'COMBO_2_TARGET', cardIds });
      return;
    }

    if (comboValidation.type === 'COMBO_3') {
      const cardIds: [string, string, string] = [
        selectedCards[0].id,
        selectedCards[1].id,
        selectedCards[2].id,
      ];
      setPendingComboAction({ type: 'COMBO_3_TARGET', cardIds });
      return;
    }

    if (comboValidation.type === 'COMBO_5') {
      feedback.playCardPlay();
      const cardIds = selectedCards.map((c) => c.id) as [string, string, string, string, string];
      await onSendAction({
        type: 'PLAY_COMBO',
        comboType: 'FIVE_DIFFERENT',
        cardIds,
      });
      setSelectedCardIds([]);
      return;
    }
  };

  // Xác nhận mục tiêu cho Favor
  const handleConfirmFavorTarget = async (targetPlayerId: string) => {
    if (!pendingComboAction || pendingComboAction.type !== 'FAVOR_TARGET') return;
    feedback.playCardPlay();
    await onSendAction({
      type: 'PLAY_ACTION_CARD',
      cardId: pendingComboAction.cardId,
      targetPlayerId,
    });
    setPendingComboAction(null);
    setSelectedCardIds([]);
  };

  // Xác nhận mục tiêu cho Combo 2
  const handleConfirmCombo2Target = async (targetPlayerId: string) => {
    if (!pendingComboAction || pendingComboAction.type !== 'COMBO_2_TARGET') return;
    feedback.playCardPlay();
    await onSendAction({
      type: 'PLAY_COMBO',
      comboType: 'TWO_OF_A_KIND',
      cardIds: pendingComboAction.cardIds,
      targetPlayerId,
    });
    setPendingComboAction(null);
    setSelectedCardIds([]);
  };

  // Xác nhận mục tiêu & loại bài cho Combo 3
  const handleConfirmCombo3 = async (targetPlayerId: string, requestedCardCode: EKCardCode) => {
    if (!pendingComboAction || pendingComboAction.type !== 'COMBO_3_TARGET') return;
    feedback.playCardPlay();
    await onSendAction({
      type: 'PLAY_COMBO',
      comboType: 'THREE_OF_A_KIND',
      cardIds: pendingComboAction.cardIds,
      targetPlayerId,
      requestedCardCode,
    });
    setPendingComboAction(null);
    setSelectedCardIds([]);
  };

  // Đánh Nope trong Nope Window
  const handlePlayNope = async (cardId: string) => {
    await onSendAction({
      type: 'PLAY_NOPE',
      cardId,
    });
  };

  // Bỏ qua Nope
  const handlePassNope = async () => {
    await onSendAction({
      type: 'PASS_NOPE',
    });
  };

  // Gỡ bom & chèn lại Mèo Nổ
  const handleConfirmDefuseInsert = async (insertIndex: number) => {
    await onSendAction({
      type: 'DEFUSE_INSERT',
      insertIndex,
    });
  };

  // Nạn nhân đưa bài khi bị Favor
  const handleGiveFavorCard = async (cardId: string) => {
    await onSendAction({
      type: 'GIVE_FAVOR_CARD',
      cardId,
    });
  };

  // Chọn bài từ Discard Pile
  const handlePickDiscardCard = async (cardId: string) => {
    await onSendAction({
      type: 'PICK_DISCARD_CARD',
      cardId,
    });
  };

  const toggleSound = () => {
    const next = feedback.toggleSound();
    setSoundEnabled(next);
  };

  // Tính màu sắc nguy cơ nổ bom
  const risk = gameView.explosionRiskPercent;
  const riskClass = risk < 15 ? 'safe' : risk < 35 ? 'warning' : 'danger';

  // Lấy ảnh lá bài trên cùng chồng bài bỏ
  const topDiscardImage = gameView.topDiscard
    ? gameView.topDiscard.imageUrl ??
      (gameView.topDiscard.imageFile ? `/games/exploding-kittens/cards/${gameView.topDiscard.imageFile}` : '')
    : null;

  return (
    <main className="ek-table">
      {/* ========================================================
          CỘT TRÁI (Trong Landscape/Desktop) / NỬA TRÊN (Trong Portrait)
          ======================================================== */}
      <section className="col-left">
        {/* 1. TOP BAR (38px) */}
        <header className="top-bar casino-glass-panel" data-room-code={roomState.roomCode}>
          <span style={{ display: 'none' }}>Phòng: #{roomState.roomCode}</span>
          <div className="turn-status">
            <span
              className={`status-dot ${!isAlive ? 'danger' : isMyTurn ? '' : 'opponent'}`}
            />
            <span className={`turn-label ${isMyTurn ? '' : 'opponent'}`}>
              {!isAlive
                ? 'Đã bị loại'
                : isMyTurn
                ? 'Lượt của bạn'
                : `Lượt: ${getPlayerName(gameView.activePlayerId)}`}
            </span>
            {gameView.turnsRemaining > 1 && (
              <span className="attack-badge">
                Phải đi {gameView.turnsRemaining} lượt
              </span>
            )}
          </div>

          <div className="timer-pill">⏱ {formatTimer(timeLeft)}</div>

          <div className="top-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleSound}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsRulesOpen(true)}
              title="Xem luật chơi"
            >
              ?
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsMenuOpen(true)}
              title="Menu phòng"
            >
              ⋯
            </button>
          </div>
        </header>

        {/* 2. OPPONENTS ROW (3 OPPONENT SEATS) */}
        <section className="opponents-row" aria-label="Ghế đối thủ">
          {gameView.opponents.map((opp: EKOpponentView) => {
            const isOppActive = gameView.activePlayerId === opp.id;
            const oppName = getPlayerName(opp.id);

            return (
              <article
                key={opp.id}
                className={`opponent-seat casino-glass-panel ${
                  !opp.alive ? 'eliminated' : isOppActive ? 'active-turn' : ''
                }`}
              >
                <div className="opp-top">
                  <span className="opp-name">{oppName}</span>
                  <span
                    className="opp-net-dot"
                    style={{ color: opp.alive ? '#34d399' : '#ef4444' }}
                    title={opp.alive ? 'Đang kết nối' : 'Đã bị loại'}
                  >
                    {opp.alive ? '●' : '✕'}
                  </span>
                </div>
                <div className="opp-bottom">
                  {opp.alive ? (
                    <span className="opp-cards-badge">🎴 {opp.handCount} lá</span>
                  ) : (
                    <span className="opp-exploded-badge">💥 Đã nổ tung</span>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* 3. CENTER STAGE (DRAW DECK & DISCARD PILE) */}
        <section className="center-stage" aria-label="Sân khấu trung tâm">
          <div className="piles-container">
            {/* Draw Deck */}
            <div className="pile-column">
              <div
                className="pile-card-wrap draw-stack-3d"
                onClick={isMyTurn && gameView.phase === 'TURN_PLAY' ? handleDrawCard : undefined}
                style={{
                  cursor: isMyTurn && gameView.phase === 'TURN_PLAY' ? 'pointer' : 'default',
                }}
                title={
                  isMyTurn && gameView.phase === 'TURN_PLAY'
                    ? 'Nhấn để rút bài kết thúc lượt'
                    : 'Chồng bài rút'
                }
              >
                <div className="card-frame back-frame">
                  <img
                    src="/games/exploding-kittens/cards/card-back.png"
                    alt="Chồng bài rút"
                  />
                </div>
                <div className="deck-count-pill">{gameView.drawDeckCount} lá</div>
              </div>
              <div className={`risk-badge ${riskClass}`}>
                💣 Nguy cơ nổ: {gameView.explosionRiskPercent}%
              </div>
            </div>

            {/* Discard Pile */}
            <div className="pile-column">
              <div
                className="pile-card-wrap"
                onClick={() => setIsDiscardListOpen(true)}
                style={{ cursor: 'pointer' }}
                title="Bấm để xem danh sách bài bỏ"
              >
                <div className="card-frame">
                  {topDiscardImage ? (
                    <img src={topDiscardImage} alt="Chồng bài bỏ" />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#64748b',
                      }}
                    >
                      <span>🗑️</span>
                      <span>Chưa có bài bỏ</span>
                    </div>
                  )}
                </div>
                {gameView.discardPileCount > 0 && (
                  <div className="discard-count-badge">{gameView.discardPileCount}</div>
                )}
              </div>
              <button
                type="button"
                className="discard-caption"
                onClick={() => setIsDiscardListOpen(true)}
              >
                Xem bài bỏ
              </button>
            </div>
          </div>

          {/* Dải thông báo sự kiện / Cửa sổ Nope */}
          {gameView.nopeWindow?.isOpen ? (
            <NopeBanner
              gameView={gameView}
              getPlayerName={getPlayerName}
              onPlayNope={handlePlayNope}
              onPassNope={handlePassNope}
            />
          ) : (
            <div className="event-banner" role="status">
              <span>{formatActionText(gameView.lastActionDescriptionVi)}</span>
            </div>
          )}
        </section>
      </section>

      {/* ========================================================
          CỘT PHẢI (Trong Landscape/Desktop) / NỬA DƯỚI (Trong Portrait)
          ======================================================== */}
      <section className="col-right">
        {/* 4. DẢI THÔNG TIN LÁ ĐANG CHỌN & 2 NÚT THAO TÁC */}
        <section className="controls-zone" aria-label="Bảng điều khiển hành động">
          <div className="selection-info-bar casino-glass-panel">
            <div className="selection-header">
              <span className="selection-title">{comboValidation.title}</span>
              {selectedCardIds.length > 0 && (
                <button
                  type="button"
                  className="clear-select-btn"
                  onClick={handleClearSelection}
                >
                  Bỏ chọn
                </button>
              )}
            </div>
            <p className="selection-desc">{comboValidation.desc}</p>
          </div>

          <div className="action-buttons-row">
            <button
              type="button"
              disabled={!comboValidation.valid || !isMyTurn || !isAlive || gameView.phase !== 'TURN_PLAY'}
              onClick={handleExecutePlay}
              className="btn-gold action-btn-main"
              style={{
                opacity:
                  comboValidation.valid && isMyTurn && isAlive && gameView.phase === 'TURN_PLAY'
                    ? 1
                    : 0.5,
              }}
            >
              ✨ {comboValidation.buttonLabel}
            </button>

            <button
              type="button"
              disabled={!isMyTurn || !isAlive || gameView.phase !== 'TURN_PLAY'}
              onClick={handleDrawCard}
              className="btn-emerald action-btn-main"
              style={{
                opacity: isMyTurn && isAlive && gameView.phase === 'TURN_PLAY' ? 1 : 0.5,
              }}
            >
              🎴 Rút bài ({gameView.explosionRiskPercent}% nổ)
            </button>
          </div>
        </section>

        {/* 5. KHU BÀI TRÊN TAY (FAN / OVERLAP) */}
        <section className="hand-zone" aria-label="Bài trên tay bạn">
          <div className="hand-zone-header">
            <span>
              Bài của bạn (<strong>{gameView.myHand.length} lá</strong>)
            </span>
            <span>💡 Chạm giữ hoặc chuột phải để phóng to</span>
          </div>

          <div className="hand-fan">
            {gameView.myHand.map((card: EKCard) => {
              const isSelected = selectedCardIds.includes(card.id);
              const orderIndex =
                isSelected && selectedCardIds.length >= 2
                  ? selectedCardIds.indexOf(card.id) + 1
                  : null;

              return (
                <Card
                  key={card.id}
                  card={card}
                  className="hand-card"
                  isSelected={isSelected}
                  orderBadge={orderIndex}
                  onClick={() => handleToggleCardSelect(card.id)}
                  onHold={(c) => setZoomedCard(c)}
                />
              );
            })}
          </div>
        </section>
      </section>

      {/* ========================================================
          CÁC MODAL HỆ THỐNG
          ======================================================== */}

      {/* 1. Modal Phóng To Thẻ Bài */}
      <CardZoomModal
        card={zoomedCard}
        isOpen={Boolean(zoomedCard)}
        onClose={() => setZoomedCard(null)}
      />

      {/* 2. Modal Gỡ Bom Khi Bốc Phải Mèo Nổ */}
      <DefuseModal
        isOpen={Boolean(gameView.defusePrompt?.mustDefuse || gameView.phase === 'DEFUSE_INSERT')}
        maxIndex={gameView.defusePrompt?.maxIndex ?? gameView.drawDeckCount}
        onConfirm={handleConfirmDefuseInsert}
      />

      {/* 3. Modal Nhìn Trước Tương Lai */}
      <SeeFutureModal
        cards={gameView.knownTopCards}
        isOpen={Boolean(gameView.knownTopCards && gameView.knownTopCards.length > 0 && !isSeeFutureDismissed)}
        onClose={() => setIsSeeFutureDismissed(true)}
        onHoldCard={(c: EKCard) => setZoomedCard(c)}
      />

      {/* 4. Modal Bị Đòi Favor (Nạn nhân phải đưa bài) */}
      <FavorGiveModal
        isOpen={Boolean(gameView.favorPrompt?.isTarget)}
        proposerName={getPlayerName(gameView.favorPrompt?.proposerId ?? '')}
        hand={gameView.myHand}
        onConfirm={handleGiveFavorCard}
        onHoldCard={(c: EKCard) => setZoomedCard(c)}
      />

      {/* 5. Modal Lục Chồng Bài Bỏ (Combo 5 lá) */}
      <FiveDiffPickModal
        isOpen={Boolean(gameView.fiveDiffPrompt?.isPicker || gameView.phase === 'FIVE_DIFF_PICK')}
        discardPile={gameView.discardPile}
        onConfirm={handlePickDiscardCard}
        onHoldCard={(c: EKCard) => setZoomedCard(c)}
      />

      {/* 6. Modal Chọn Mục Tiêu Khi Đánh Favor */}
      <TargetPlayerModal
        isOpen={pendingComboAction?.type === 'FAVOR_TARGET'}
        title="🤲 CHỌN MỤC TIÊU FAVOR"
        description="Chọn 1 người chơi để yêu cầu họ đưa cho bạn 1 lá bài trên tay họ:"
        opponents={gameView.opponents}
        getPlayerName={getPlayerName}
        onSelect={handleConfirmFavorTarget}
        onCancel={() => setPendingComboAction(null)}
      />

      {/* 7. Modal Chọn Mục Tiêu Cho Combo 2 Lá */}
      <TargetPlayerModal
        isOpen={pendingComboAction?.type === 'COMBO_2_TARGET'}
        title="🐱🐱 CHỌN MỤC TIÊU COMBO 2 LÁ"
        description="Chọn 1 người chơi để rút mù ngẫu nhiên 1 lá bài trên tay họ:"
        opponents={gameView.opponents}
        getPlayerName={getPlayerName}
        onSelect={handleConfirmCombo2Target}
        onCancel={() => setPendingComboAction(null)}
      />

      {/* 8. Modal Chọn Mục Tiêu & Loại Bài Cho Combo 3 Lá */}
      <Combo3TargetModal
        isOpen={pendingComboAction?.type === 'COMBO_3_TARGET'}
        opponents={gameView.opponents}
        getPlayerName={getPlayerName}
        onConfirm={handleConfirmCombo3}
        onCancel={() => setPendingComboAction(null)}
      />

      {/* 9. Modal Xem Toàn Bộ Chồng Bài Bỏ */}
      {isDiscardListOpen && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setIsDiscardListOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card casino-glass"
            style={{ maxWidth: '440px', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                Chồng Bài Bỏ ({gameView.discardPile.length} lá)
              </div>
              <div className="modal-subtitle">
                Các lá bài đã đánh ra hoặc bị hủy trong ván đấu
              </div>
            </div>

            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '4px',
              }}
            >
              {gameView.discardPile.map((card: EKCard, idx: number) => (
                <div
                  key={`${card.id}-${idx}`}
                  style={{ width: '100%', aspectRatio: '720 / 1012', cursor: 'pointer' }}
                  onClick={() => setZoomedCard(card)}
                  title="Nhấn để xem chi tiết"
                >
                  <Card
                    card={card}
                    onHold={(c) => setZoomedCard(c)}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsDiscardListOpen(false)}
              className="btn-gold action-btn-main"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 10. Modal Menu phòng (Nút ⋯) */}
      {isMenuOpen && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card casino-glass"
            style={{ maxWidth: '320px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Menu Phòng Chơi</div>
              <div className="modal-subtitle">Mã phòng: #{roomState.roomCode}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDiscardListOpen(true);
                }}
              >
                🗑️ Xem bài bỏ ({gameView.discardPileCount})
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsRulesOpen(true);
                }}
              >
                📜 Luật chơi Mèo Nổ
              </button>
              <button
                type="button"
                className="btn-danger action-btn-main"
                style={{ marginTop: '8px' }}
                onClick={() => {
                  setIsMenuOpen(false);
                  onLeaveRoom();
                }}
              >
                🚪 Rời phòng chơi
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="preset-btn"
              style={{ marginTop: '4px' }}
            >
              Đóng menu
            </button>
          </div>
        </div>
      )}

      {/* 11. Modal Luật Chơi */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* 12. Modal Kết Thúc Ván Đấu (Winner) */}
      {gameView.winner && (
        <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
          <div className="modal-card casino-glass" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '42px', margin: '4px 0' }}>🏆🐱</div>
            <div className="modal-title" style={{ fontSize: '18px' }}>VÁN ĐẤU KẾT THÚC!</div>
            <div className="modal-subtitle">
              Người chiến thắng duy nhất sống sót:{' '}
              <strong style={{ color: '#fde047', display: 'block', fontSize: '15px', marginTop: '4px' }}>
                {getPlayerName(gameView.winner)}
              </strong>
            </div>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="btn-emerald action-btn-main"
              style={{ marginTop: '10px' }}
            >
              Về Phòng Chờ
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
