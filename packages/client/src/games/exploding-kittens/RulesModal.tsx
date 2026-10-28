import React, { useState } from 'react';

export interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'cards' | 'combos' | 'nope';

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card casino-glass"
        style={{ maxWidth: '540px', maxHeight: '88vh', padding: '16px', gap: '10px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-yellow-500/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💣🐱</span>
            <div>
              <h2 className="text-base font-bold text-amber-300">Luật Chơi Mèo Nổ (Exploding Kittens)</h2>
              <p className="text-xs text-gray-400">Phiên bản Bản Thường chuẩn quốc tế (2–5 người)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            title="Đóng luật chơi"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 py-3 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-750'
            }`}
          >
            📖 Tổng quan & Lượt đi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0 ${
              activeTab === 'cards'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-750'
            }`}
          >
            🃏 9 Loại Thẻ Bài
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('combos')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0 ${
              activeTab === 'combos'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-750'
            }`}
          >
            ✨ 3 Combo Đặc Biệt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nope')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors flex-shrink-0 ${
              activeTab === 'nope'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-750'
            }`}
          >
            🛑 Cửa Sổ NOPE 5s
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs leading-relaxed pr-1">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-2xl">
                <h3 className="font-bold text-red-300 text-sm mb-1">🎯 Mục tiêu duy nhất: SINH TỒN!</h3>
                <p>
                  Nếu bạn rút phải lá <strong>Mèo Nổ (Exploding Kitten)</strong> mà không có lá <strong>Gỡ Bom (Defuse)</strong>,
                  bạn bị nổ tung và lập tức bị loại khỏi bàn chơi. Người chơi sống sót cuối cùng là người chiến thắng!
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl space-y-2">
                <h3 className="font-bold text-amber-300 text-sm">🔄 Quy trình 1 lượt chơi:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-300">
                  <li>
                    <strong className="text-white">Giai đoạn Đánh bài (Tùy chọn):</strong> Bạn có thể đánh bao nhiêu lá bài tùy thích (hoặc không đánh lá nào), hoặc tung ra các bộ Combo đặc biệt.
                  </li>
                  <li>
                    <strong className="text-white">Giai đoạn Rút bài (Bắt buộc):</strong> Bạn phải rút 1 lá bài trên đỉnh chồng bài rút để kết thúc lượt đi của mình. Càng về cuối ván, tỷ lệ bốc phải Mèo Nổ càng tăng vọt!
                  </li>
                  <li className="text-amber-400">
                    <em>Ngoại lệ:</em> Đánh lá <strong>Skip</strong> hoặc <strong>Attack</strong> giúp bạn kết thúc lượt ngay mà KHÔNG cần phải rút bài!
                  </li>
                </ol>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
                <h3 className="font-bold text-emerald-300 text-sm mb-1">🛡️ Khi rút phải Mèo Nổ:</h3>
                <p>
                  Nếu bạn có lá <strong>Defuse</strong>, lá Defuse sẽ bị bỏ vào chồng bài bỏ. Bạn được bí mật chọn vị trí tùy ý trong chồng bài rút (trên cùng, ở giữa, đáy, hoặc vị trí bất kỳ) để nhét lại lá Mèo Nổ mà không cho đối thủ biết!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">💣</span>
                <div>
                  <div className="font-bold text-red-400">Mèo Nổ (Exploding Kitten) — 4 lá</div>
                  <div className="text-gray-300">Phải lật ngay khi rút trúng. Nổ tung và loại khỏi ván đấu nếu không có Defuse. Không thể bị Nope!</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">🛠️</span>
                <div>
                  <div className="font-bold text-emerald-400">Gỡ Bom (Defuse) — 6 lá</div>
                  <div className="text-gray-300">Lá bài cứu mạng duy nhất khi rút phải Mèo Nổ. Tự động kích hoạt cho phép bạn gài lại Mèo Nổ vào chồng bài. Không thể đánh độc lập từ tay.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">⚔️</span>
                <div>
                  <div className="font-bold text-amber-400">Tấn Công (Attack) — 4 lá</div>
                  <div className="text-gray-300">Kết thúc lượt của bạn ngay mà không cần rút bài, ép người chơi tiếp theo phải thực hiện 2 lượt liên tiếp! Cho phép cộng dồn nếu đối thủ đánh tiếp Attack.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">⏭️</span>
                <div>
                  <div className="font-bold text-blue-400">Bỏ Lượt (Skip) — 4 lá</div>
                  <div className="text-gray-300">Kết thúc 1 lượt hiện tại mà không phải rút bài. Nếu đang nợ 2 lượt do bị Attack, đánh 1 lá Skip chỉ bỏ qua 1 lượt (còn 1 lượt nữa).</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">🤲</span>
                <div>
                  <div className="font-bold text-purple-400">Xin Bài (Favor) — 4 lá</div>
                  <div className="text-gray-300">Bắt buộc 1 người chơi bạn chỉ định phải tự tay chọn 1 lá bài trên tay họ để đưa cho bạn.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">🔀</span>
                <div>
                  <div className="font-bold text-teal-400">Xáo Bài (Shuffle) — 4 lá</div>
                  <div className="text-gray-300">Xáo trộn ngẫu nhiên toàn bộ chồng bài rút cho đến khi có thông báo dừng. Rất hữu ích khi biết Mèo Nổ đang ở trên đỉnh!</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">🔮</span>
                <div>
                  <div className="font-bold text-indigo-400">Xem Tương Lai (See the Future) — 5 lá</div>
                  <div className="text-gray-300">Bí mật nhìn lén 3 lá bài trên đỉnh chồng bài rút mà không làm thay đổi thứ tự của chúng.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">🚫</span>
                <div>
                  <div className="font-bold text-rose-400">Chặn Đứng (Nope) — 5 lá</div>
                  <div className="text-gray-300">Dừng mọi hành động vừa được đối thủ đánh ra (trừ Mèo Nổ và Defuse). Có thể đánh bất kỳ lúc nào kể cả ngoài lượt!</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex gap-2">
                <span className="text-2xl">🐱</span>
                <div>
                  <div className="font-bold text-yellow-400">Thẻ Mèo Thường (Cat Cards) — 20 lá</div>
                  <div className="text-gray-300">Gồm 5 loại: Tacocat, Cattermelon, Hairy Potato, Beard Cat, Rainbow Ralphing. Không có chức năng khi đánh lẻ, chỉ dùng để đánh Combo 2, 3 hoặc 5 lá!</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'combos' && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 border border-indigo-500/30 p-3 rounded-2xl">
                <h3 className="font-bold text-indigo-300 text-sm mb-1">🐱🐱 Combo 2 Lá Cùng Tên (Two of a Kind)</h3>
                <p>
                  Đánh 2 lá bài bất kỳ có cùng tên (vd: 2 lá Tacocat, hoặc 2 lá Skip giống nhau). Cho phép bạn chọn 1 người chơi và <strong>rút mù ngẫu nhiên 1 lá bài</strong> từ trên tay họ!
                </p>
              </div>

              <div className="bg-slate-950/60 border border-indigo-500/30 p-3 rounded-2xl">
                <h3 className="font-bold text-indigo-300 text-sm mb-1">🐱🐱🐱 Combo 3 Lá Cùng Tên (Three of a Kind)</h3>
                <p>
                  Đánh 3 lá bài bất kỳ cùng tên. Bạn chỉ định 1 người chơi và <strong>gọi tên đích danh loại lá bài</strong> bạn muốn (vd: "Cho tôi xin lá Defuse!"). Nếu họ có lá đó trên tay, họ bắt buộc phải giao cho bạn. Nếu không có, bạn không nhận được gì.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-emerald-500/30 p-3 rounded-2xl">
                <h3 className="font-bold text-emerald-300 text-sm mb-1">🐱🌟 Combo 5 Lá Khác Tên Hoàn Toàn (Five Different)</h3>
                <p>
                  Đánh 5 lá bài có 5 tên hoàn toàn khác nhau. Bạn được <strong>lục tìm chồng bài bỏ (Discard Pile)</strong> và lấy lại 1 lá bài tùy thích về tay (ngoại trừ lá Mèo Nổ)!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'nope' && (
            <div className="space-y-3">
              <div className="bg-red-950/40 border border-red-500/40 p-3 rounded-2xl">
                <h3 className="font-bold text-red-300 text-sm mb-1">🛑 Cửa Sổ NOPE 5 Giây Tự Động:</h3>
                <p>
                  Khi bất kỳ người chơi nào tung ra 1 lá chức năng hoặc Combo đặc biệt, hệ thống sẽ mở <strong>Cửa sổ phản ứng trong 5 giây</strong>.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl space-y-2">
                <h4 className="font-semibold text-amber-300">Quy tắc Nope liên hoàn:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>Bất kỳ ai còn sống có lá <strong>NOPE</strong> đều có thể bấm nút "Đánh NOPE!".</li>
                  <li>Mỗi khi có người đánh Nope, đồng hồ 5 giây sẽ được đặt lại.</li>
                  <li>
                    <strong>Nope có thể bị Nope (Yup):</strong> 1 lá Nope = Hành động bị hủy; Lá Nope thứ 2 = Hủy cái Nope trước (Hành động lại có hiệu lực!); Lá Nope thứ 3 = Lại bị hủy; v.v. (Quy tắc chẵn/lẻ).
                  </li>
                  <li>Nếu không muốn Nope, bấm nút <strong>"Bỏ qua"</strong> để không làm mất thời gian của phòng chơi.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-yellow-500/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold action-btn-main"
            style={{ width: '100%' }}
          >
            Đã hiểu luật chơi
          </button>
        </div>
      </div>
    </div>
  );
};
