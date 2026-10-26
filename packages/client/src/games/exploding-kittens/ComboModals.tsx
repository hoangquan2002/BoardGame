import React, { useState } from 'react';
import type { EKCard, EKCardCode, EKOpponentView } from '@boardgame/game-exploding-kittens';
import { Card } from './Card.js';

// --- Danh sách các mã thẻ có thể gọi tên khi đánh Combo 3 lá ---
const CALLABLE_CARD_CODES: { code: EKCardCode; nameVi: string; nameEn: string; icon: string }[] = [
  { code: 'DEFUSE', nameVi: 'Gỡ Bom (Defuse)', nameEn: 'Defuse', icon: '🛠️' },
  { code: 'ATTACK', nameVi: 'Tấn Công (Attack)', nameEn: 'Attack', icon: '⚔️' },
  { code: 'SKIP', nameVi: 'Bỏ Lượt (Skip)', nameEn: 'Skip', icon: '⏭️' },
  { code: 'FAVOR', nameVi: 'Xin Bài (Favor)', nameEn: 'Favor', icon: '🤲' },
  { code: 'NOPE', nameVi: 'Chặn Đứng (Nope)', nameEn: 'Nope', icon: '🚫' },
  { code: 'SHUFFLE', nameVi: 'Xáo Bài (Shuffle)', nameEn: 'Shuffle', icon: '🔀' },
  { code: 'SEE_THE_FUTURE', nameVi: 'Xem Tương Lai', nameEn: 'See the Future', icon: '🔮' },
  { code: 'CAT_TACOCAT', nameVi: 'Mèo Tacocat', nameEn: 'Tacocat', icon: '🌮' },
  { code: 'CAT_CATTERMELON', nameVi: 'Mèo Cattermelon', nameEn: 'Cattermelon', icon: '🍉' },
  { code: 'CAT_HAIRY_POTATO', nameVi: 'Mèo Khoai Tây', nameEn: 'Hairy Potato Cat', icon: '🥔' },
  { code: 'CAT_BEARD', nameVi: 'Mèo Râu', nameEn: 'Beard Cat', icon: '🧔' },
  { code: 'CAT_RAINBOW_RALPHING', nameVi: 'Mèo Nôn Cầu Vồng', nameEn: 'Rainbow Ralphing Cat', icon: '🌈' },
];

// --- 1. MODAL NẠN NHÂN ĐƯA BÀI KHI BỊ FAVOR ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-5 shadow-2xl text-center space-y-4">
        <div className="text-3xl">🤲</div>
        <h3 className="text-xl font-bold text-amber-300">BẠN BỊ ĐÒI BÀI (FAVOR)!</h3>
        <p className="text-xs text-gray-300">
          <strong className="text-white">{proposerName}</strong> đã dùng lá Favor lên bạn. Bạn bắt buộc phải chọn 1 lá bài trên tay để đưa cho họ:
        </p>

        <div className="flex gap-2 overflow-x-auto py-2 px-1 justify-start sm:justify-center">
          {hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              size="small"
              isSelected={selectedCardId === card.id}
              onClick={() => setSelectedCardId(card.id)}
              onHold={onHoldCard}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={!selectedCardId}
          onClick={() => {
            if (selectedCardId) onConfirm(selectedCardId);
          }}
          className={`w-full py-2.5 font-bold text-sm rounded-xl transition-all shadow-lg ${
            selectedCardId
              ? 'bg-amber-500 hover:bg-amber-400 text-black active:scale-95'
              : 'bg-slate-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedCardId ? 'Xác nhận đưa lá bài này' : 'Hãy chọn 1 lá bài'}
        </button>
      </div>
    </div>
  );
};

// --- 2. MODAL CHỌN MỤC TIÊU CHO COMBO 2 LÁ HOẶC FAVOR ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-sm w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-center space-y-4">
        <h3 className="text-lg font-bold text-amber-300">{title}</h3>
        <p className="text-xs text-gray-300">{description}</p>

        <div className="space-y-2">
          {aliveOpponents.map((opp) => (
            <button
              key={opp.id}
              type="button"
              onClick={() => onSelect(opp.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                  {getPlayerName(opp.id).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{getPlayerName(opp.id)}</div>
                  <div className="text-xs text-gray-400">Đang có {opp.handCount} lá trên tay</div>
                </div>
              </div>
              <span className="text-xs text-amber-400 font-semibold">Chọn 🎯</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold rounded-xl"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

// --- 3. MODAL CHỌN MỤC TIÊU & GỌI TÊN BÀI CHO COMBO 3 LÁ ---
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
  const [selectedCode, setSelectedCode] = useState<EKCardCode>('DEFUSE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-md w-full bg-slate-900 border-2 border-indigo-500 rounded-3xl p-5 shadow-2xl text-center space-y-4">
        <div className="text-3xl">🐱🐱🐱</div>
        <h3 className="text-xl font-black text-indigo-300">COMBO 3 LÁ (THREE OF A KIND)</h3>
        <p className="text-xs text-gray-300">
          Chọn 1 đối thủ và đích danh loại bài bạn muốn đòi. Nếu họ có, họ buộc phải đưa lá bài đó cho bạn!
        </p>

        {/* 1. Chọn đối thủ */}
        <div className="text-left space-y-1.5">
          <label className="text-xs font-bold text-amber-400 uppercase">1. Chọn đối thủ mục tiêu:</label>
          <div className="grid grid-cols-2 gap-2">
            {aliveOpponents.map((opp) => (
              <button
                key={opp.id}
                type="button"
                onClick={() => setSelectedTarget(opp.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedTarget === opp.id
                    ? 'bg-indigo-950/80 border-indigo-400 text-white font-bold ring-1 ring-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-750'
                }`}
              >
                <div className="text-xs truncate">{getPlayerName(opp.id)}</div>
                <div className="text-[10px] text-gray-400">({opp.handCount} lá)</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Chọn loại bài gọi tên */}
        <div className="text-left space-y-1.5">
          <label className="text-xs font-bold text-amber-400 uppercase">2. Gọi tên loại bài muốn đòi:</label>
          <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {CALLABLE_CARD_CODES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setSelectedCode(item.code)}
                className={`p-2 rounded-lg text-left flex items-center gap-1.5 text-xs transition-colors ${
                  selectedCode === item.code
                    ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-gray-200'
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.nameVi}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-semibold text-xs rounded-xl"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!selectedTarget}
            onClick={() => onConfirm(selectedTarget, selectedCode)}
            className="flex-2 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Đòi bài ngay 🎯
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. MODAL CHỌN BÀI TỪ DISCARD PILE CHO COMBO 5 LÁ ---
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

  // Lọc bỏ Exploding Kitten (không được phép lấy lại)
  const selectableCards = discardPile.filter((c) => c.code !== 'EXPLODING_KITTEN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-lg w-full bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl text-center space-y-4">
        <div className="text-3xl">🐱🌟</div>
        <h3 className="text-xl font-black text-emerald-300">LỤC TÌM CHỒNG BÀI BỎ (COMBO 5 LÁ)</h3>
        <p className="text-xs text-gray-300">
          Chọn 1 lá bài bất kỳ trong chồng bài bỏ (ngoại trừ Mèo Nổ) để lấy về tay bạn:
        </p>

        {selectableCards.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 italic">Chồng bài bỏ hiện chưa có lá bài hợp lệ nào.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex flex-wrap gap-2 justify-center">
              {selectableCards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  size="small"
                  isSelected={selectedCardId === card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  onHold={onHoldCard}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!selectedCardId}
          onClick={() => {
            if (selectedCardId) onConfirm(selectedCardId);
          }}
          className={`w-full py-2.5 font-bold text-sm rounded-xl transition-all shadow-lg ${
            selectedCardId
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
              : 'bg-slate-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedCardId ? 'Lấy lá bài này về tay' : 'Hãy chọn 1 lá bài'}
        </button>
      </div>
    </div>
  );
};
