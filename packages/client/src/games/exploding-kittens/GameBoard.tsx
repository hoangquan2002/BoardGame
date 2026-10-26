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
  onSendAction,
  onLeaveRoom,
}) => {
  // --- States ---
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [zoomedCard, setZoomedCard] = useState<EKCard | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isDiscardListOpen, setIsDiscardListOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => feedback.isSoundEnabled());
  const [isSeeFutureDismissed, setIsSeeFutureDismissed] = useState(false);

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
      map.set(p.playerId, p.name);
    }
    return map;
  }, [roomState.players]);

  const getPlayerName = (id: string): string => {
    if (id === session.playerId) return 'Bạn';
    return playerNameMap.get(id) ?? id;
  };

  const isMyTurn = gameView.activePlayerId === session.playerId;
  const isAlive = gameView.alive;

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

  // --- Kiểm tra combo từ các thẻ đã chọn ---
  const selectedCards = useMemo(() => {
    return gameView.myHand.filter((c: EKCard) => selectedCardIds.includes(c.id));
  }, [gameView.myHand, selectedCardIds]);

  const comboValidation = useMemo(() => {
    const count = selectedCards.length;
    if (count === 0) return { valid: false, message: '' };

    if (count === 1) {
      const c = selectedCards[0];
      const singlePlayable = ['ATTACK', 'SKIP', 'FAVOR', 'SHUFFLE', 'SEE_THE_FUTURE'].includes(c.code);
      if (singlePlayable) {
        return { valid: true, type: 'SINGLE' as const, card: c, label: `Đánh ${c.nameVi}` };
      }
      if (c.code === 'NOPE') {
        return { valid: false, message: 'Lá Nope chỉ có thể đánh trong Cửa sổ Nope!' };
      }
      if (c.code === 'DEFUSE') {
        return { valid: false, message: 'Defuse chỉ tự kích hoạt khi bạn rút phải Mèo Nổ!' };
      }
      return { valid: false, message: 'Lá Mèo này cần ghép bộ 2, 3 hoặc 5 lá!' };
    }

    if (count === 2) {
      const [c1, c2] = selectedCards;
      if (c1.code === c2.code) {
        return { valid: true, type: 'COMBO_2' as const, label: 'Đánh Combo 2 Lá (Cướp bài)' };
      }
      return { valid: false, message: 'Combo 2 lá phải có cùng tên / chủng loại!' };
    }

    if (count === 3) {
      const [c1, c2, c3] = selectedCards;
      if (c1.code === c2.code && c2.code === c3.code) {
        return { valid: true, type: 'COMBO_3' as const, label: 'Đánh Combo 3 Lá (Đòi bài)' };
      }
      return { valid: false, message: 'Combo 3 lá phải có cùng tên / chủng loại!' };
    }

    if (count === 5) {
      const codes = new Set(selectedCards.map((c: EKCard) => c.code));
      if (codes.size === 5) {
        return { valid: true, type: 'COMBO_5' as const, label: 'Đánh Combo 5 Lá (Lục bài bỏ)' };
      }
      return { valid: false, message: 'Combo 5 lá phải gồm 5 lá có tên khác nhau!' };
    }

    return { valid: false, message: `Chọn ${count} lá chưa tạo thành Combo hợp lệ` };
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
        // Cần chọn mục tiêu người chơi
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
      const cardIds = selectedCards.map((c: EKCard) => c.id) as [string, string, string, string, string];
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
  const riskColor =
    risk < 15
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : risk < 35
      ? 'text-amber-400 border-amber-500/50 bg-amber-950/40'
      : 'text-red-400 border-red-500 bg-red-950/60 animate-pulse';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-felt-table text-white font-sans select-none overflow-x-hidden relative">
      {/* Top Header Bar */}
      <header className="w-full bg-slate-950/80 backdrop-blur border-b border-amber-500/20 px-3 py-2 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐱💣</span>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-gold-gradient tracking-wide">
              MÈO NỔ (Exploding Kittens)
            </h1>
            <div className="text-[10px] text-gray-400 flex items-center gap-2">
              <span>Phòng: #{roomState.roomCode}</span>
              <span>• Lượt #{gameView.turnCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 transition-colors"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1"
          >
            <span>📜</span> <span className="hidden sm:inline">Luật chơi</span>
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="px-2.5 py-1 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-xs text-red-300 border border-red-800/50 transition-colors"
          >
            Rời phòng
          </button>
        </div>
      </header>

      {/* Main Playing Felt Table Area */}
      <main className="flex-1 flex flex-col justify-between items-center p-2 sm:p-4 max-w-5xl mx-auto w-full relative">
        {/* Khu Ghế Đối Thủ (Opponents Area) */}
        <section className="w-full flex flex-wrap justify-center items-center gap-2 sm:gap-4 my-1">
          {gameView.opponents.map((opp: EKOpponentView) => {
            const isOppActive = gameView.activePlayerId === opp.id;
            const oppName = getPlayerName(opp.id);

            return (
              <div
                key={opp.id}
                className={`relative px-3 py-2 rounded-2xl border transition-all flex items-center gap-2.5 ${
                  !opp.alive
                    ? 'bg-black/60 border-gray-800 opacity-50 grayscale'
                    : isOppActive
                    ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400 shadow-gold-glow'
                    : 'bg-slate-900/80 border-slate-800 shadow-md'
                }`}
              >
                {/* Avatar Icon */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-sm">
                    {opp.alive ? (
                      oppName.slice(0, 1).toUpperCase()
                    ) : (
                      <span className="text-xl">💀</span>
                    )}
                  </div>
                  {isOppActive && opp.alive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </span>
                  )}
                </div>

                {/* Thông tin đối thủ */}
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white max-w-[90px] sm:max-w-[120px] truncate">
                      {oppName}
                    </span>
                    {opp.hasPassedNope && (
                      <span className="text-[9px] bg-slate-800 text-gray-400 px-1 rounded">
                        Đã bỏ qua
                      </span>
                    )}
                  </div>

                  {opp.alive ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                      <span>🎴 {opp.handCount} lá</span>
                      {isOppActive && gameView.turnsRemaining > 1 && (
                        <span className="text-[10px] bg-red-950 text-red-300 px-1 rounded font-bold">
                          Nợ {gameView.turnsRemaining} lượt
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                      Đã nổ tung
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Nope Banner (khi mở Cửa sổ Nope) */}
        <NopeBanner
          gameView={gameView}
          getPlayerName={getPlayerName}
          onPlayNope={handlePlayNope}
          onPassNope={handlePassNope}
        />

        {/* Khu Vực Giữa Bàn: Chồng Rút + Chồng Bỏ + Thông Tin Lượt */}
        <section className="w-full flex flex-col items-center my-3 space-y-3">
          {/* Thông tin lượt đi & Nhật ký hành động */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 shadow-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-semibold text-gray-200">
                {isMyTurn ? (
                  <strong className="text-amber-300">ĐẾN LƯỢT BẠN!</strong>
                ) : (
                  <>
                    Lượt của: <strong className="text-white">{getPlayerName(gameView.activePlayerId)}</strong>
                  </>
                )}
              </span>
              {gameView.turnsRemaining > 1 && (
                <span className="text-xs bg-red-900/80 text-red-200 px-1.5 py-0.2 rounded font-bold">
                  Phải đi {gameView.turnsRemaining} lượt!
                </span>
              )}
            </div>

            {gameView.lastActionDescriptionVi && (
              <p className="text-[11px] text-amber-200/90 italic drop-shadow max-w-md mx-auto line-clamp-1">
                📢 {gameView.lastActionDescriptionVi}
              </p>
            )}
          </div>

          {/* Hai Chồng Bài Ở Trung Tâm */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 py-1">
            {/* Chồng Bài Rút (Draw Deck) */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                onClick={isMyTurn && gameView.phase === 'TURN_PLAY' ? handleDrawCard : undefined}
                className={`relative group ${
                  isMyTurn && gameView.phase === 'TURN_PLAY'
                    ? 'cursor-pointer transform hover:scale-105 active:scale-95 transition-transform'
                    : ''
                }`}
                title={
                  isMyTurn && gameView.phase === 'TURN_PLAY'
                    ? 'Nhấn để rút bài kết thúc lượt'
                    : 'Chồng bài rút'
                }
              >
                {/* 3D stacked deck effect */}
                <div className="absolute -top-1 -left-1 w-[80px] sm:w-[95px] h-[112px] sm:h-[135px] rounded-xl bg-slate-800 border border-amber-900/40" />
                <div className="absolute -top-0.5 -left-0.5 w-[80px] sm:w-[95px] h-[112px] sm:h-[135px] rounded-xl bg-slate-900 border border-amber-900/60" />

                <Card showBack size="small" className="relative z-10 shadow-2xl" />

                {/* Badge số lá bài còn lại */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                  <span className="bg-black/75 text-white font-extrabold text-sm px-2 py-0.5 rounded-full border border-white/20 shadow-md">
                    {gameView.drawDeckCount} lá
                  </span>
                </div>
              </div>

              {/* Huy hiệu Nguy cơ nổ bom */}
              <div
                className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${riskColor}`}
              >
                💣 Nguy cơ nổ: {gameView.explosionRiskPercent}%
              </div>
            </div>

            {/* Chồng Bài Bỏ (Discard Pile) */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                onClick={() => setIsDiscardListOpen(true)}
                className="cursor-pointer group transform hover:scale-105 active:scale-95 transition-transform relative"
                title="Bấm để xem danh sách bài bỏ"
              >
                {gameView.topDiscard ? (
                  <Card
                    card={gameView.topDiscard}
                    size="small"
                    className="shadow-2xl"
                    onHold={(c: EKCard) => setZoomedCard(c)}
                  />
                ) : (
                  <div className="w-[78px] h-[110px] rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center">
                    <span>🗑️</span>
                    <span>Chưa có bài bỏ</span>
                  </div>
                )}

                {gameView.discardPileCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-slate-800 text-amber-300 font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 shadow-md">
                    {gameView.discardPileCount}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsDiscardListOpen(true)}
                className="text-[10px] text-gray-400 hover:text-amber-300 transition-colors underline"
              >
                Xem bài bỏ ({gameView.discardPileCount})
              </button>
            </div>
          </div>
        </section>

        {/* Thanh Thông Báo / Hành Động Đang Chờ */}
        {!isAlive && (
          <div className="w-full bg-red-950/80 border border-red-500 text-red-200 py-2 px-4 rounded-2xl text-center text-xs font-bold mb-2 animate-pulse">
            💀 Bạn đã bị nổ tung và loại khỏi ván đấu. Đang ở chế độ theo dõi khán giả.
          </div>
        )}

        {/* Khu Vực Bài Trên Tay (My Hand Area) */}
        <section className="w-full flex flex-col items-center space-y-2 mt-auto">
          {/* Header tay bài + Nút Bỏ chọn */}
          <div className="w-full flex items-center justify-between px-2 text-xs">
            <span className="font-bold text-gray-300">
              Bài của bạn ({gameView.myHand.length} lá)
              {selectedCardIds.length > 0 && (
                <span className="text-amber-400 font-extrabold ml-1.5">
                  • Đang chọn {selectedCardIds.length} lá
                </span>
              )}
            </span>

            {selectedCardIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] text-gray-400 hover:text-white underline"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          {/* Dãy Thẻ Bài Cuộn Ngang */}
          <div className="w-full overflow-x-auto pb-3 pt-2 px-1 flex items-center gap-2 sm:gap-3 scrollbar-none snap-x justify-start sm:justify-center">
            {gameView.myHand.map((card: EKCard) => {
              const isSelected = selectedCardIds.includes(card.id);

              return (
                <div key={card.id} className="snap-center flex-shrink-0">
                  <Card
                    card={card}
                    size="normal"
                    isSelected={isSelected}
                    onClick={() => handleToggleCardSelect(card.id)}
                    onHold={(c: EKCard) => setZoomedCard(c)}
                  />
                </div>
              );
            })}
          </div>

          {/* Thanh Nút Thao Tác (Action Control Bar) */}
          <div className="w-full max-w-lg flex items-center justify-center gap-3 p-2 bg-slate-950/90 backdrop-blur rounded-2xl border border-slate-800 shadow-2xl">
            {/* Nút Đánh Bài / Combo */}
            <button
              type="button"
              disabled={!comboValidation.valid || !isMyTurn || !isAlive || gameView.phase !== 'TURN_PLAY'}
              onClick={handleExecutePlay}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                comboValidation.valid && isMyTurn && isAlive && gameView.phase === 'TURN_PLAY'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black active:scale-95 shadow-gold-glow'
                  : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>✨</span>
              <span className="truncate">
                {comboValidation.valid ? comboValidation.label : 'Đánh bài'}
              </span>
            </button>

            {/* Nút Rút Bài (Bắt buộc để kết thúc lượt) */}
            <button
              type="button"
              disabled={!isMyTurn || !isAlive || gameView.phase !== 'TURN_PLAY'}
              onClick={handleDrawCard}
              className={`flex-1 py-3 px-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                isMyTurn && isAlive && gameView.phase === 'TURN_PLAY'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 active:scale-95 shadow-emerald-button'
                  : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>🎴</span>
              <span className="truncate">Rút bài ({gameView.explosionRiskPercent}%)</span>
            </button>
          </div>

          {/* Gợi ý lỗi hoặc chỉ dẫn */}
          {selectedCardIds.length > 0 && !comboValidation.valid && (
            <p className="text-[11px] text-amber-300/90 italic">{comboValidation.message}</p>
          )}
        </section>
      </main>

      {/* --- CÁC MODAL HỆ THỐNG --- */}

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsDiscardListOpen(false)}
        >
          <div
            className="relative max-w-lg w-full max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-amber-300">
                Chồng Bài Bỏ ({gameView.discardPile.length} lá)
              </h3>
              <button
                type="button"
                onClick={() => setIsDiscardListOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-gray-300 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-slate-950/60 rounded-xl">
              <div className="flex flex-wrap gap-2 justify-center">
                {gameView.discardPile.map((card: EKCard, idx: number) => (
                  <Card
                    key={`${card.id}-${idx}`}
                    card={card}
                    size="small"
                    onHold={(c: EKCard) => setZoomedCard(c)}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDiscardListOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold text-xs rounded-xl"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 10. Modal Luật Chơi */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* 11. Modal Kết Thúc Ván Đấu (Winner) */}
      {gameView.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-sm w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="text-5xl animate-bounce">🏆🐱</div>
            <h2 className="text-2xl font-black text-amber-300 tracking-wider uppercase">
              VÁN ĐẤU KẾT THÚC!
            </h2>
            <p className="text-sm text-gray-200">
              Người chiến thắng duy nhất sống sót:{' '}
              <strong className="text-amber-400 text-base block mt-1">
                {getPlayerName(gameView.winner)}
              </strong>
            </p>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Về Phòng Chờ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
