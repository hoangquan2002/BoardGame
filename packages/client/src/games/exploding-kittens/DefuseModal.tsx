import React, { useEffect, useState } from 'react';
import { feedback } from '../../app/feedback/index.js';

export interface DefuseModalProps {
  isOpen: boolean;
  maxIndex: number;
  onConfirm: (insertIndex: number) => void;
}

export const DefuseModal: React.FC<DefuseModalProps> = ({ isOpen, maxIndex, onConfirm }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      feedback.playWarningSiren();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePreset = (idx: number) => {
    feedback.vibrateCard();
    setSelectedIndex(Math.max(0, Math.min(maxIndex, idx)));
  };

  const handleSubmit = () => {
    feedback.playDefuse();
    onConfirm(selectedIndex);
  };

  const middleIndex = Math.floor(maxIndex / 2);

  const getPositionText = (idx: number) => {
    if (idx === 0) return 'Trên cùng (#1 - Người kế tiếp)';
    if (idx === 1) return 'Vị trí #2 (Dưới lá đầu)';
    if (idx === maxIndex) return `Dưới đáy (#${maxIndex + 1})`;
    return `Vị trí #${idx + 1}`;
  };

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card casino-glass">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">💣 RÚT TRÚNG MÈO NỔ! — ĐÃ DÙNG GỠ BOM!</div>
          <div className="modal-subtitle">
            Bí mật nhét lại lá Mèo Nổ vào một vị trí trong chồng bài rút
          </div>
        </div>

        {/* Card Pair Showcase */}
        <div className="defuse-showcase">
          <div className="defuse-pair-card kitten" title="Lá Mèo Nổ vừa rút">
            <img
              src="/games/exploding-kittens/cards/Exploding-Kitten-TNT-Ship.jpg"
              alt="Mèo Nổ"
            />
          </div>
          <div className="defuse-arrow">➜ 🎴</div>
          <div className="defuse-pair-card" title="Đã dùng lá Gỡ Bom để sống sót">
            <img
              src="/games/exploding-kittens/cards/Defuse-Via-Laser-Pointer.jpg"
              alt="Gỡ Bom"
            />
          </div>
        </div>

        {/* Slider & Presets Box */}
        <div className="slider-box">
          <div className="slider-label-row">
            <span style={{ color: '#94a3b8' }}>Vị trí chèn lá Mèo Nổ:</span>
            <span className="slider-pos-highlight">{getPositionText(selectedIndex)}</span>
          </div>

          <input
            type="range"
            className="range-slider"
            min={0}
            max={maxIndex}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
          />

          <div className="preset-grid">
            <button
              type="button"
              className={`preset-btn ${selectedIndex === 0 ? 'active' : ''}`}
              onClick={() => handlePreset(0)}
            >
              🎯 Trên cùng (0)
            </button>
            <button
              type="button"
              className={`preset-btn ${selectedIndex === 1 ? 'active' : ''}`}
              onClick={() => handlePreset(1)}
            >
              🥈 Vị trí #2 (1)
            </button>
            <button
              type="button"
              className={`preset-btn ${selectedIndex === middleIndex ? 'active' : ''}`}
              onClick={() => handlePreset(middleIndex)}
            >
              📦 Ở giữa ({middleIndex})
            </button>
            <button
              type="button"
              className={`preset-btn ${selectedIndex === maxIndex ? 'active' : ''}`}
              onClick={() => handlePreset(maxIndex)}
            >
              ⚓ Dưới đáy ({maxIndex})
            </button>
          </div>
        </div>

        {/* Confirm Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="btn-emerald action-btn-main"
        >
          ✅ Xác nhận nhét lá Mèo Nổ (Vị trí #{selectedIndex + 1})
        </button>
      </div>
    </div>
  );
};
