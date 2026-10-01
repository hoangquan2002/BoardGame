import React, { useEffect, useState } from 'react';
import {
  cardsData,
  getCardInfoVi,
  getDisorderDef,
} from '@boardgame/game-side-effects';
import { Card } from './Card.js';

export interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMyTurn?: boolean;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  isMyTurn = false,
}) => {
  const [zoomedCardId, setZoomedCardId] = useState<string | null>(null);

  // Xử lý phím Esc và nút Back của trình duyệt (history popstate)
  useEffect(() => {
    if (!isOpen) return;

    // Đẩy state vào history để khi bấm nút Back trên điện thoại thì đóng modal chứ không thoát trang
    window.history.pushState({ modal: 'rules' }, '');

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dữ liệu 7 Thuốc sinh từ cardsData
  const drugRows = cardsData.drugs.map((drug) => {
    const info = getCardInfoVi(drug.id);
    const treatedDef = getDisorderDef(drug.treats);
    const sideEffectsNames = drug.sideEffects.map((sid) => {
      const d = getDisorderDef(sid);
      return d?.nameVi ?? sid;
    });

    return {
      id: drug.id,
      nameVi: drug.nameVi,
      treatsVi: treatedDef?.nameVi ?? drug.treats,
      sideEffectsVi: sideEffectsNames.join(', '),
      imagePath: info.imagePath,
    };
  });

  // Dữ liệu 8 Bệnh Lý và hình phạt sinh từ cardsData
  const benhRows = cardsData.disorders.map((b) => {
    const info = getCardInfoVi(b.id);
    let extraNote = '';
    if (b.id === 'tremors') {
      extraNote = 'Người bị đánh có 7 giây để chọn 3 lá bỏ, quá giờ mất hết bài tay.';
    } else if (b.id === 'anxiety') {
      extraNote = 'Kẻ gây hại luôn lấy được 1 lá bài đã chọn từ tay bạn.';
    } else if (b.id === 'gambling-addiction') {
      extraNote = 'Kẻ gây hại luôn rút được ngẫu nhiên 3 lá từ tay bạn.';
    } else if (b.id === 'depression' || b.id === 'impotence' || b.id === 'anorexia') {
      extraNote = 'Cộng dồn số vòng phạt theo từng lượt bị đánh.';
    }

    return {
      id: b.id,
      nameVi: b.nameVi,
      punishmentVi: b.punishment.textVi.replace(/\n/g, ' · '),
      extraNote,
      imagePath: info.imagePath,
    };
  });

  return (
    <div
      data-testid="rules-sheet"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: '#0b1f1a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ================= HEADER TẤM PHỦ LUẬT ================= */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#122520',
          borderBottom: '1px solid #224036',
          flexShrink: 0,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '0.3px',
            }}
          >
            Luật chơi
          </h2>
          {isMyTurn && (
            <span
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                boxShadow: '0 0 10px rgba(22, 163, 74, 0.6)',
              }}
            >
              Đến lượt bạn
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          data-testid="rules-close"
          aria-label="Đóng luật chơi"
          style={{
            background: '#1a382e',
            border: '1px solid #2a5244',
            color: '#f8fafc',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            lineHeight: 1,
            transition: 'all 0.15s ease',
          }}
        >
          ✕
        </button>
      </header>

      {/* ================= MỤC LỤC NHẢY NHANH (TOC) ================= */}
      <nav
        aria-label="Mục lục luật chơi"
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: '#0f241e',
          borderBottom: '1px solid #1a382e',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'muc-1', label: '1. Tóm tắt 30s' },
          { id: 'muc-2', label: '2. Mục tiêu' },
          { id: 'muc-3', label: '3. Chuẩn bị' },
          { id: 'muc-4', label: '4. Một lượt' },
          { id: 'muc-5', label: '5. Bốn loại lá' },
          { id: 'muc-6', label: '6. Bảng Thuốc' },
          { id: 'muc-7', label: '7. Bảng hình phạt' },
          { id: 'muc-8', label: '8. Đổi bài' },
          { id: 'muc-9', label: '9. Thao tác' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            style={{
              flexShrink: 0,
              padding: '4px 10px',
              backgroundColor: '#122520',
              border: '1px solid #224036',
              borderRadius: '999px',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ================= NỘI DUNG CUỘN BÊN TRONG ================= */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box',
          maxWidth: '840px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          fontSize: '14px',
          lineHeight: 1.6,
          color: '#e2e8f0',
        }}
      >
        {/* MỤC 1: TÓM TẮT 30 GIÂY */}
        <section id="muc-1" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            1. Tóm tắt 30 giây
          </h3>
          <div
            style={{
              backgroundColor: '#122520',
              border: '1px solid #224036',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div>• <strong>Mục tiêu:</strong> Chữa hết toàn bộ Bệnh Lý trong Thể Trạng của mình để thắng ngay.</div>
            <div>• <strong>Mỗi lượt:</strong> Rút 2 lá, đánh tối đa 2 lá (hoặc bỏ lượt), rồi bỏ bớt nếu tay quá 6 lá.</div>
            <div>• <strong>Thuốc:</strong> Đặt lên Bệnh Lý để chữa, nhưng sẽ mở cửa cho người khác đưa thêm bệnh mới.</div>
            <div>• <strong>Bệnh Lý:</strong> Đưa cho đối thủ nếu họ đang mở cửa cho bệnh đó qua tác dụng phụ của Thuốc.</div>
            <div>• <strong>Triệu Chứng:</strong> Tấn công Bệnh Lý chưa chữa của đối thủ để kích hoạt hình phạt nặng nề.</div>
            <div>• <strong>Liệu Pháp:</strong> Loại bỏ vĩnh viễn 1 Bệnh Lý bất kỳ khỏi Thể Trạng của mình.</div>
          </div>
        </section>

        {/* MỤC 2: MỤC TIÊU */}
        <section id="muc-2" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            2. Mục tiêu
          </h3>
          <p style={{ margin: 0 }}>
            Bạn là người chiến thắng ngay lập tức khi <strong>chữa khỏi toàn bộ Bệnh Lý</strong> trong Thể Trạng của mình trước những người khác.
            Chữa khỏi có 2 cách: đặt đúng lá <strong>Thuốc</strong> tương ứng lên Bệnh Lý, hoặc dùng lá <strong>Liệu Pháp</strong> để loại bỏ hẳn Bệnh Lý đó.
          </p>
        </section>

        {/* MỤC 3: CHUẨN BỊ */}
        <section id="muc-3" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            3. Chuẩn bị ván chơi
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Mỗi người chơi được chia <strong>4 Bệnh Lý khác loại</strong>, đặt ngửa trước mặt thành <strong>Thể Trạng</strong>.</li>
            <li>Mỗi người nhận <strong>4 lá bài úp</strong> trên tay từ chồng rút bài chung.</li>
            <li>Người đi đầu tiên được hệ thống chọn ngẫu nhiên, các lượt kế tiếp đi theo vòng kim đồng hồ.</li>
          </ul>
        </section>

        {/* MỤC 4: MỘT LƯỢT CHƠI */}
        <section id="muc-4" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            4. Trình tự một lượt chơi
          </h3>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Rút bài:</strong> Rút 2 lá bài từ chồng bài rút (lượt đầu tiên bài trên tay sẽ lên 6 lá).</li>
            <li><strong>Đánh bài:</strong> Được đánh tối đa 2 lá bài từ tay ra bàn (được phép không đánh lá nào). Các lá đánh ra có tác dụng ngay lập tức, không ai có thể chặn.</li>
            <li><strong>Bỏ bài thừa:</strong> Nếu sau khi kết thúc lượt còn nhiều hơn 6 lá trên tay, bạn phải chọn bỏ bớt xuống chồng bài bỏ cho đến khi còn đúng 6 lá.</li>
          </ol>
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
            * Khi chồng bài rút hết bài, toàn bộ chồng bài bỏ sẽ được xáo trộn lại thành chồng bài rút mới.
          </div>
        </section>

        {/* MỤC 5: BỐN LOẠI LÁ BÀI */}
        <section id="muc-5" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            5. Bốn loại lá bài
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {/* 1. Bệnh Lý */}
            <div
              style={{
                backgroundColor: '#122520',
                border: '1px solid #224036',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: '64px', height: '106px', flexShrink: 0 }}>
                <Card cardId="depression" size="small" onHold={() => setZoomedCardId('depression')} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                  Bệnh Lý
                </div>
                <div>Nằm trong Thể Trạng là mục tiêu cần chữa trị. Khi cầm trên tay, bạn dùng để đưa sang Thể Trạng của đối thủ nếu họ đang mở cửa cho bệnh đó. Mỗi Thể Trạng chỉ có tối đa 1 lá mỗi loại.</div>
              </div>
            </div>

            {/* 2. Thuốc */}
            <div
              style={{
                backgroundColor: '#122520',
                border: '1px solid #224036',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: '64px', height: '106px', flexShrink: 0 }}>
                <Card cardId="fluoxetine" size="small" onHold={() => setZoomedCardId('fluoxetine')} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  Thuốc
                </div>
                <div>Đặt lên đúng Bệnh Lý nó điều trị để chữa bệnh đó và bảo vệ khỏi Triệu Chứng. Đổi lại, người khác sẽ có quyền đưa cho bạn những Bệnh Lý ghi ở dòng "Có thể gây ra".</div>
              </div>
            </div>

            {/* 3. Triệu Chứng */}
            <div
              style={{
                backgroundColor: '#122520',
                border: '1px solid #224036',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: '64px', height: '106px', flexShrink: 0 }}>
                <Card cardId="episode" size="small" onHold={() => setZoomedCardId('episode')} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f97316', marginBottom: '4px' }}>
                  Triệu Chứng
                </div>
                <div>Đánh vào 1 Bệnh Lý chưa được chữa của người khác. Người đó ngay lập tức phải chịu hình phạt tương ứng ghi trên lá Bệnh Lý.</div>
              </div>
            </div>

            {/* 4. Liệu Pháp */}
            <div
              style={{
                backgroundColor: '#122520',
                border: '1px solid #224036',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: '64px', height: '106px', flexShrink: 0 }}>
                <Card cardId="therapy" size="small" onHold={() => setZoomedCardId('therapy')} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '4px' }}>
                  Liệu Pháp
                </div>
                <div>Loại bỏ hoàn toàn 1 Bệnh Lý bất kỳ khỏi Thể Trạng của bạn (kể cả bệnh đã có Thuốc). Ngoại lệ: Chứng run không dùng Liệu Pháp được; Chứng biếng ăn chỉ chữa bằng Liệu Pháp.</div>
              </div>
            </div>
          </div>
        </section>

        {/* MỤC 6: BẢNG THUỐC (SINH TỪ CARDS.JSON) */}
        <section id="muc-6" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            6. Bảng Thuốc điều trị và tác dụng phụ (7 loại Thuốc)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drugRows.map((drug) => (
              <div
                key={drug.id}
                style={{
                  backgroundColor: '#122520',
                  border: '1px solid #224036',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '44px', height: '73px', flexShrink: 0 }}>
                  <Card cardId={drug.id} size="mini" onHold={() => setZoomedCardId(drug.id)} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '2px' }}>
                    {drug.nameVi}
                  </div>
                  <div>
                    Trị bệnh: <strong style={{ color: '#4ade80' }}>{drug.treatsVi}</strong>
                  </div>
                  <div style={{ color: '#fda4af', marginTop: '2px' }}>
                    Có thể gây ra: <strong>{drug.sideEffectsVi}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MỤC 7: BẢNG HÌNH PHẠT (SINH TỪ CARDS.JSON) */}
        <section id="muc-7" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            7. Bảng hình phạt khi bị Triệu Chứng (8 Bệnh Lý)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {benhRows.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#122520',
                  border: '1px solid #224036',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '44px', height: '73px', flexShrink: 0 }}>
                  <Card cardId={b.id} size="mini" onHold={() => setZoomedCardId(b.id)} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                    {b.nameVi}
                  </div>
                  <div>
                    Hình phạt: <strong>{b.punishmentVi}</strong>
                  </div>
                  {b.extraNote && (
                    <div style={{ color: '#fbbf24', fontSize: '12px', marginTop: '3px' }}>
                      {b.extraNote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MỤC 8: ĐỔI BÀI */}
        <section id="muc-8" style={{ scrollMarginTop: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            8. Đổi bài giữa người chơi
          </h3>
          <p style={{ margin: '0 0 6px 0' }}>
            Người chơi có thể đề nghị trao đổi bài trên tay với bất kỳ người chơi nào khác vào bất kỳ lúc nào, kể cả ngoài lượt đi của mình.
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Trao đổi bài là thoả thuận miệng, không bắt buộc các bên phải giữ lời hứa.</li>
            <li>Không được đánh bài ra bàn ngoài lượt đi của mình.</li>
          </ul>
        </section>

        {/* MỤC 9: THAO TÁC TRÊN APP */}
        <section id="muc-9" style={{ scrollMarginTop: '12px', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#38ef7d' }}>
            9. Thao tác trên ứng dụng
          </h3>
          <div
            style={{
              backgroundColor: '#122520',
              border: '1px solid #224036',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div>• <strong>Chọn và đánh bài:</strong> Chạm 1 lần vào lá bài trên tay để chọn lá. Các mục tiêu hợp lệ trên bàn chơi sẽ sáng viền xanh lá. Chạm vào ô mục tiêu sáng để thực hiện đánh bài.</div>
            <div>• <strong>Xem to lá bài:</strong> Nhấn giữ lá bài (trên 400ms) hoặc bấm chuột phải vào bất kỳ lá bài nào để mở hộp thoại phóng to chi tiết ảnh thật từ PDF gốc.</div>
            <div>• <strong>Kết thúc lượt:</strong> Sau khi đã thực hiện xong các hành động trong lượt, bấm nút màu xanh lá <strong>Kết thúc lượt</strong> ở góc dưới bên phải bàn chơi.</div>
            <div>• <strong>Menu ⋯:</strong> Ở thanh trên cùng bên phải gồm có các tính năng: <em>Đổi bài</em>, <em>Nhật ký ván chơi</em> và <em>Thoát ván</em>.</div>
          </div>
        </section>
      </main>

      {/* MODAL PHÓNG TO NẾU NGƯỜI DÙNG GIỮ VÀO ẢNH TRONG LUẬT */}
      {zoomedCardId && (
        <div
          onClick={() => setZoomedCardId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <button
            onClick={() => setZoomedCardId(null)}
            aria-label="Đóng phóng to"
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10002,
            }}
          >
            ✕
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <Card cardId={zoomedCardId} size="zoom" />
          </div>
        </div>
      )}
    </div>
  );
};
