import React, { useState } from 'react';
import type { EKCard, EKCardCode, EKOpponentView } from '@boardgame/game-exploding-kittens';
import { Card } from './Card.js';

// --- Danh sách 12 loại thẻ bài có thể gọi tên trong Combo 3 lá (kèm ảnh minh họa đại diện) ---
export interface CallableCardType {
  code: EKCardCode;
  name: string;
  imageFile: string;
}

export const CALLABLE_CARD_TYPES: CallableCardType[] = [
  { code: 'DEFUSE', name: 'Defuse', imageFile: 'Defuse-Via-Laser-Pointer.jpg' },
  { code: 'ATTACK', name: 'Attack', imageFile: 'Attack-Bear-o-Dactyl.jpg' },
  { code: 'SKIP', name: 'Skip', imageFile: 'Skip-Crab-Cheetah.jpg' },
  { code: 'FAVOR', name: 'Favor', imageFile: 'Favor-Beard-Tentacles.jpg' },
  { code: 'NOPE', name: 'Nope', imageFile: 'Nope-A-Jackanope-Bounds-into-the-Room.jpg' },
  { code: 'SHUFFLE', name: 'Shuffle', imageFile: 'Shuffle-Kraken.jpg' },
  {
    code: 'SEE_THE_FUTURE',
    name: 'See Future',
    imageFile: 'See-the-Future-Ask-the-All-Seeing-Goat-Wizard.jpg',
  },
  { code: 'CAT_TACOCAT', name: 'Tacocat', imageFile: 'Tacocat.jpg' },
  { code: 'CAT_CATTERMELON', name: 'Cattermelon', imageFile: 'Cattermelon.jpg' },
  { code: 'CAT_HAIRY_POTATO', name: 'Potato Cat', imageFile: 'Hairy-Potato-Cat.jpg' },
  { code: 'CAT_BEARD', name: 'Beard Cat', imageFile: 'Beard-Cat.jpg' },
  { code: 'CAT_RAINBOW_RALPHING', name: 'Rainbow Cat', imageFile: 'Rainbow-Ralphing-Cat.jpg' },
];

// =======================================================
// 1. MODAL NẠN NHÂN ĐƯA BÀI KHI BỊ FAVOR
// =======================================================
export interface FavorGiveModalProps {
  isOpen: boolean;
  proposerName: string;
  hand: EKCard[];
  onConfirm: (cardId: string) => void;
  onHoldCard?: (card: EKCard) => void;
}

export const FavorGiveModal: React.FC<FavorGiveModalProps> = ({
  isOpen,
  proposerName,
  hand,
  onConfirm,
  onHoldCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card casino-glass" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div className="modal-title">🤲 BẠN BỊ ĐÒI BÀI (FAVOR)!</div>
          <div className="modal-subtitle">
            <strong style={{ color: '#fde047' }}>{proposerName}</strong> đã dùng lá Favor lên bạn.
            Hãy chọn 1 lá bài trên tay để đưa cho họ:
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto py-2 px-1 justify-start sm:justify-center">
          {hand.map((card) => {
            const isSelected = selectedCardId === card.id;
            return (
              <div
                key={card.id}
                style={{ width: '74px', height: '104px', flexShrink: 0 }}
                onClick={() => setSelectedCardId(card.id)}
              >
                <Card
                  card={card}
                  isSelected={isSelected}
                  onClick={() => setSelectedCardId(card.id)}
                  onHold={onHoldCard}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selectedCardId}
          onClick={() => {
            if (selectedCardId) onConfirm(selectedCardId);
          }}
          className="btn-emerald action-btn-main"
          style={{ opacity: selectedCardId ? 1 : 0.5 }}
        >
          {selectedCardId ? 'Xác nhận đưa lá bài này' : 'Hãy chọn 1 lá bài'}
        </button>
      </div>
    </div>
  );
};

// =======================================================
// 2. MODAL CHỌN MỤC TIÊU CHO COMBO 2 LÁ HOẶC FAVOR
// =======================================================
export interface TargetPlayerModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  opponents: EKOpponentView[];
  getPlayerName: (id: string) => string;
  onSelect: (targetPlayerId: string) => void;
  onCancel: () => void;
}

export const TargetPlayerModal: React.FC<TargetPlayerModalProps> = ({
  isOpen,
  title,
  description,
  opponents,
  getPlayerName,
  onSelect,
  onCancel,
}) => {
  if (!isOpen) return null;

  const aliveOpponents = opponents.filter((o) => o.alive);

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card casino-glass">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <div className="modal-subtitle">{description}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {aliveOpponents.map((opp) => (
            <button
              key={opp.id}
              type="button"
              onClick={() => onSelect(opp.id)}
              className="target-player-btn"
              style={{ width: '100%', padding: '9px 12px' }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800 }}>{getPlayerName(opp.id)}</span>
              <span className="opp-cards-badge">🎴 {opp.handCount} lá</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={onCancel} className="btn-gold action-btn-main">
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

// =======================================================
// 3. MODAL CHỌN MỤC TIÊU & GỌI TÊN BÀI CHO COMBO 3 LÁ
// =======================================================
export interface Combo3TargetModalProps {
  isOpen: boolean;
  opponents: EKOpponentView[];
  getPlayerName: (id: string) => string;
  onConfirm: (targetPlayerId: string, requestedCode: EKCardCode) => void;
  onCancel: () => void;
}

export const Combo3TargetModal: React.FC<Combo3TargetModalProps> = ({
  isOpen,
  opponents,
  getPlayerName,
  onConfirm,
  onCancel,
}) => {
  const aliveOpponents = opponents.filter((o) => o.alive);
  const [selectedTarget, setSelectedTarget] = useState<string>(aliveOpponents[0]?.id ?? '');
  const [selectedType, setSelectedType] = useState<CallableCardType>(CALLABLE_CARD_TYPES[0]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card casino-glass">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">🐱🐱🐱 COMBO 3 LÁ — ĐÒI ĐÍCH DANH</div>
          <div className="modal-subtitle">
            Chỉ định 1 đối thủ & gọi tên 1 lá bài bạn muốn cướp từ tay họ
          </div>
        </div>

        {/* Step 1: Chọn đối thủ */}
        <div className="step-label">1. CHỌN ĐỐI THỦ MỤC TIÊU:</div>
        <div className="target-players-row">
          {aliveOpponents.map((opp) => {
            const isSelected = selectedTarget === opp.id;
            return (
              <div
                key={opp.id}
                className={`target-player-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedTarget(opp.id)}
              >
                <span>{getPlayerName(opp.id)}</span>
                <span style={{ color: '#6ee7b7' }}>{opp.handCount} lá</span>
              </div>
            );
          })}
        </div>

        {/* Step 2: Chọn loại bài muốn đòi (12 loại với thumbnail) */}
        <div className="step-label">2. GỌI TÊN LÁ BÀI MUỐN ĐÒI:</div>
        <div className="card-type-grid">
          {CALLABLE_CARD_TYPES.map((item) => {
            const isSelected = selectedType.code === item.code;
            return (
              <div
                key={item.code}
                className={`card-type-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedType(item)}
              >
                <div className="card-type-thumb">
                  <img
                    src={`/games/exploding-kittens/cards/${item.imageFile}`}
                    alt={item.name}
                  />
                </div>
                <div className="card-type-name">{item.name}</div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons Row */}
        <div className="action-buttons-row">
          <button type="button" onClick={onCancel} className="btn-gold action-btn-main">
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={!selectedTarget}
            onClick={() => onConfirm(selectedTarget, selectedType.code)}
            className="btn-emerald action-btn-main"
            style={{ opacity: selectedTarget ? 1 : 0.5 }}
          >
            Đòi bài: {selectedType.name}
          </button>
        </div>
      </div>
    </div>
  );
};

// =======================================================
// 4. MODAL CHỌN BÀI TỪ DISCARD PILE CHO COMBO 5 LÁ
// =======================================================
export interface FiveDiffPickModalProps {
  isOpen: boolean;
  discardPile: EKCard[];
  onConfirm: (cardId: string) => void;
  onHoldCard?: (card: EKCard) => void;
}

export const FiveDiffPickModal: React.FC<FiveDiffPickModalProps> = ({
  isOpen,
  discardPile,
  onConfirm,
  onHoldCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card casino-glass" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div className="modal-title">✨ COMBO 5 LÁ KHÁC NHAU — LỤC BÀI BỎ</div>
          <div className="modal-subtitle">
            Chọn 1 lá bài bạn muốn lấy lại từ Chồng Bài Bỏ ({discardPile.length} lá):
          </div>
        </div>

        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '4px',
          }}
        >
          {discardPile.map((card, idx) => {
            const isSelected = selectedCardId === card.id;
            return (
              <div
                key={`${card.id}-${idx}`}
                style={{ width: '100%', aspectRatio: '720 / 1012', cursor: 'pointer' }}
                onClick={() => setSelectedCardId(card.id)}
              >
                <Card
                  card={card}
                  isSelected={isSelected}
                  onClick={() => setSelectedCardId(card.id)}
                  onHold={onHoldCard}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selectedCardId}
          onClick={() => {
            if (selectedCardId) onConfirm(selectedCardId);
          }}
          className="btn-emerald action-btn-main"
          style={{ opacity: selectedCardId ? 1 : 0.5 }}
        >
          {selectedCardId ? 'Lấy lá bài này về tay' : 'Hãy chọn 1 lá bài'}
        </button>
      </div>
    </div>
  );
};
