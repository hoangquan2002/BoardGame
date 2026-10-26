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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative max-w-md w-full bg-gradient-to-b from-red-950 via-slate-900 to-black border-2 border-red-500 rounded-3xl p-6 shadow-2xl text-center space-y-5">
        {/* Tiêu đề báo động */}
        <div className="space-y-1">
          <div className="text-4xl animate-bounce">💣💥</div>
          <h2 className="text-2xl font-black text-red-400 tracking-wide uppercase">
            RÚT TRÚNG MÈO NỔ!
          </h2>
          <p className="text-sm text-emerald-300 font-semibold bg-emerald-950/60 py-1.5 px-3 rounded-xl border border-emerald-500/30 inline-block">
            ✨ Bạn có thẻ DEFUSE (Gỡ Bom) để sống sót!
          </p>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Hãy bí mật chọn vị trí trong chồng bài rút để nhét lại lá Mèo Nổ mà đối thủ không hề hay biết:
        </p>

        {/* Thanh trượt chọn vị trí */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">0: Trên cùng (Bốc ngay)</span>
            <span className="text-amber-400 font-bold text-base px-2 py-0.5 bg-amber-950/80 rounded border border-amber-500/30">
              Vị trí #{selectedIndex + 1}
            </span>
            <span className="text-gray-400">{maxIndex}: Dưới đáy</span>
          </div>

          <input
            type="range"
            min={0}
            max={maxIndex}
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="text-[11px] text-gray-400">
            {selectedIndex === 0 && '🎯 Người kế tiếp rút bài sẽ đối mặt ngay với Mèo Nổ!'}
            {selectedIndex === 1 && '🥈 Nằm ngay dưới lá đầu tiên!'}
            {selectedIndex === maxIndex && '⚓ Nằm tận đáy chồng bài, rất an toàn!'}
            {selectedIndex > 1 && selectedIndex < maxIndex && `📦 Nằm ở vị trí thứ ${selectedIndex + 1} từ trên xuống.`}
          </div>
        </div>

        {/* Các nút chọn nhanh */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handlePreset(0)}
            className={`py-2 px-1 rounded-xl border font-bold transition-all ${
              selectedIndex === 0
                ? 'bg-amber-500 text-black border-amber-300 shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-200 border-slate-700'
            }`}
          >
            🎯 Trên cùng (0)
          </button>
          <button
            type="button"
            onClick={() => handlePreset(Math.min(1, maxIndex))}
            className={`py-2 px-1 rounded-xl border font-bold transition-all ${
              selectedIndex === 1
                ? 'bg-amber-500 text-black border-amber-300 shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-200 border-slate-700'
            }`}
          >
            🥈 Vị trí #2
          </button>
          <button
            type="button"
            onClick={() => handlePreset(maxIndex)}
            className={`py-2 px-1 rounded-xl border font-bold transition-all ${
              selectedIndex === maxIndex
                ? 'bg-amber-500 text-black border-amber-300 shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-200 border-slate-700'
            }`}
          >
            ⚓ Dưới đáy
          </button>
        </div>

        {/* Nút xác nhận */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 border border-emerald-300"
        >
          ✅ Chèn Mèo Nổ & Gỡ Bom!
        </button>
      </div>
    </div>
  );
};
