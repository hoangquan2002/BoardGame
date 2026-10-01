import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card.js';
import { getCardInfoVi, type CardInfoVi } from '@boardgame/game-side-effects';

export interface MockGameBoardProps {
  onBackToRealGame?: () => void;
}

interface MockSlot {
  disorderId: string;
  drugId: string | null;
}

interface MockOpponent {
  id: string;
  name: string;
  isBot: boolean;
  connected: boolean;
  handCount: number;
  revealedHand?: string[];
  slots: MockSlot[];
  isTurn: boolean;
}

export const MockGameBoard: React.FC<MockGameBoardProps> = () => {
  // Đọc tham số URL: players=2|3|4, hand=4|8|12, turn=me|other
  const searchParams = new URLSearchParams(window.location.search);
  const playersCount = parseInt(searchParams.get('players') ?? '4', 10);
  const handCountParam = parseInt(searchParams.get('hand') ?? '8', 10);
  const turnParam = searchParams.get('turn') ?? 'other';

  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [zoomedCard, setZoomedCard] = useState<CardInfoVi | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
  );

  const handContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      if (handContainerRef.current) {
        setContainerWidth(handContainerRef.current.clientWidth || 360);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Danh sách bài trên tay mẫu theo tham số hand
  const allSampleHandCards = [
    'fluoxetine#1',
    'lorazepam#2',
    'episode#1',
    'pramipexole#3',
    'therapy#1',
    'lithium#4',
    'anxiety#5',
    'chlorpromazine#6',
    'gambling-addiction#7',
    'sildenafil#8',
    'clozapine#9',
    'depression#10',
  ];
  const handCards = allSampleHandCards.slice(0, Math.min(12, Math.max(4, handCountParam)));

  // Thể Trạng của mình: 4 ô mẫu
  const mySlots: MockSlot[] = [
    { disorderId: 'depression#1', drugId: 'fluoxetine#1' }, // Đã chữa (bậc thang)
    { disorderId: 'anxiety#2', drugId: null },             // Chưa chữa
    { disorderId: 'madness#3', drugId: null },             // Chưa chữa
    { disorderId: 'tremors#4', drugId: 'pramipexole#2' },   // Đã chữa (bậc thang)
  ];

  // Danh sách đối thủ mẫu theo tham số players
  const allMockOpponents: MockOpponent[] = [
    {
      id: 'bot-1',
      name: 'Máy 1',
      isBot: true,
      connected: true,
      handCount: 5,
      slots: [
        { disorderId: 'gambling-addiction#1', drugId: 'lithium#1' },
        { disorderId: 'anorexia#2', drugId: null },
        { disorderId: 'impotence#3', drugId: null },
        { disorderId: 'suicidal-thoughts#4', drugId: 'clozapine#2' },
      ],
      isTurn: false,
    },
    {
      id: 'player-binh',
      name: 'Bình',
      isBot: false,
      connected: false, // Mất kết nối
      handCount: 6,
      revealedHand: ['depression#3', 'therapy#2'], // Lo âu đang lộ bài
      slots: [
        { disorderId: 'anxiety#3', drugId: null },
        { disorderId: 'madness#4', drugId: null },
      ],
      isTurn: false,
    },
    {
      id: 'bot-2',
      name: 'Máy 2',
      isBot: true,
      connected: true,
      handCount: 4,
      slots: [
        { disorderId: 'tremors#5', drugId: null },
        { disorderId: 'depression#6', drugId: 'fluoxetine#3' },
      ],
      isTurn: turnParam === 'other',
    },
  ];

  const opponents = allMockOpponents.slice(0, Math.max(1, playersCount - 1));
  const isMyTurn = turnParam === 'me';

  // Tính bước lệch so le (overlap step) cho bài tay
  const cardWidth = isLandscape ? 68 : 74;
  const numCards = handCards.length;
  const overlapStep =
    numCards > 1
      ? Math.max(24, Math.min(cardWidth * 0.65, (containerWidth - cardWidth) / (numCards - 1)))
      : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        position: 'relative',
        fontSize: '11px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ===================== CỘT TRÁI (DỌC: PHẦN TRÊN; NGANG: CỘT 42%) ===================== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: isLandscape ? '42%' : '100%',
          height: isLandscape ? '100%' : 'auto',
          boxSizing: 'border-box',
          borderRight: isLandscape ? '1px solid rgba(255,255,255,0.08)' : undefined,
          backgroundColor: '#0f172a',
          flexShrink: 0,
        }}
      >
        {/* 1. THANH TRÊN 36px: Lượt, đồng hồ, menu */}
        <div
          style={{
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Lượt đi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            {isMyTurn ? (
              <span style={{ color: '#38bdf8' }}>Lượt của bạn</span>
            ) : (
              <span style={{ color: '#cbd5e1' }}>
                Lượt: {opponents.find((o) => o.isTurn)?.name ?? 'Máy 2'}
                {opponents.find((o) => o.isTurn)?.isBot && ' 🤖'}
              </span>
            )}
          </div>

          {/* Đồng hồ lượt: ⏱ 0:42 */}
          <div
            data-testid="turn-timer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <span>⏱️ 0:42</span>
          </div>

          {/* Nút menu ⋯ */}
          <button
            data-testid="menu-button"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f8fafc',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            ⋯
          </button>
        </div>

        {/* 2. KHU ĐỐI THỦ: Mỗi đối thủ 1 hàng (~68-72px) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '4px 8px',
            flex: isLandscape ? 1 : 'none',
            overflowY: isLandscape ? 'auto' : 'visible',
          }}
        >
          {opponents.map((opp, idx) => (
            <div
              key={opp.id}
              data-testid={`opponent-seat-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: opp.isTurn ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                border: opp.isTurn ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                minHeight: '62px',
                boxSizing: 'border-box',
              }}
            >
              {/* Thông tin đối thủ */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: '85px', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  <span>{opp.name}</span>
                  {opp.isBot && <span>🤖</span>}
                  {!opp.connected && (
                    <span style={{ fontSize: '11px', color: '#f87171' }}>(mất mạng)</span>
                  )}
                </div>

                {/* Chồng bài trên tay (mặt sau + số lá) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img
                    src="/cards/back.webp"
                    alt="Bài úp"
                    style={{ width: '16px', height: '28px', borderRadius: '2px', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{opp.handCount} lá</span>
                </div>

                {/* Nếu có bài bị lộ (do Lo âu) */}
                {opp.revealedHand && opp.revealedHand.length > 0 && (
                  <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#fca5a5' }}>Lộ:</span>
                    {opp.revealedHand.map((cid) => (
                      <span
                        key={cid}
                        onClick={() => setZoomedCard(getCardInfoVi(cid))}
                        style={{ fontSize: '11px', textDecoration: 'underline', color: '#38bdf8', cursor: 'pointer' }}
                      >
                        {getCardInfoVi(cid).nameVi}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Thể Trạng mini bậc thang */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {opp.slots.map((slot, sIdx) => {
                  const hasDrug = Boolean(slot.drugId);
                  const drugInfo = slot.drugId ? getCardInfoVi(slot.drugId) : null;

                  return (
                    <div
                      key={sIdx}
                      style={{
                        position: 'relative',
                        width: '32px',
                        height: hasDrug ? '64px' : '52px',
                      }}
                    >
                      {/* Lá Bệnh Lý (nằm trên) */}
                      <Card
                        cardId={slot.disorderId}
                        size="mini"
                        onHold={(info) => setZoomedCard(info)}
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          border: hasDrug ? '1px solid #22c55e' : '1px solid #ef4444',
                        }}
                      />

                      {/* Lá Thuốc bậc thang (nằm dưới, lệch ~12px) */}
                      {drugInfo && (
                        <div
                          onClick={() => setZoomedCard(drugInfo)}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: 0,
                            width: '32px',
                            height: '52px',
                            borderRadius: '3px',
                            backgroundColor: '#1e3a8a',
                            border: '1px solid #3b82f6',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '1px',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#93c5fd',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textAlign: 'center',
                            }}
                          >
                            {drugInfo.nameVi.slice(0, 4)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. DẢI GIỮA BÀN 28px + Thông báo sự kiện */}
        <div
          data-testid="event-banner"
          style={{
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0b1120',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 8px',
            fontSize: '11px',
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          <span>Rút 41 · Bỏ 12 · Đã đánh 1/2</span>
        </div>
      </div>

      {/* ===================== CỘT PHẢI (DỌC: PHẦN DƯỚI; NGANG: CỘT 58%) ===================== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          boxSizing: 'border-box',
          padding: '4px 8px',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 4. THỂ TRẠNG CỦA BẠN (4 ô, lá cỡ small, bậc thang) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Thể Trạng của bạn
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              padding: '2px 0',
              overflowX: 'auto',
            }}
          >
            {mySlots.map((slot, sIdx) => {
              const hasDrug = Boolean(slot.drugId);
              const drugInfo = slot.drugId ? getCardInfoVi(slot.drugId) : null;

              return (
                <div
                  key={sIdx}
                  data-testid={`psyche-slot-${sIdx}`}
                  style={{
                    position: 'relative',
                    width: '46px',
                    height: hasDrug ? '94px' : '76px',
                  }}
                >
                  {/* Lá Bệnh Lý */}
                  <Card
                    cardId={slot.disorderId}
                    size="small"
                    onHold={(info) => setZoomedCard(info)}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      border: hasDrug ? '2px solid #22c55e' : '1px solid #ef4444',
                    }}
                  />

                  {/* Lá Thuốc bậc thang lệch xuống ~18px */}
                  {drugInfo && (
                    <div
                      onClick={() => setZoomedCard(drugInfo)}
                      style={{
                        position: 'absolute',
                        top: '18px',
                        left: 0,
                        width: '46px',
                        height: '76px',
                        borderRadius: '4px',
                        backgroundColor: '#1e3a8a',
                        border: '1px solid #3b82f6',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '2px',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#bfdbfe',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {drugInfo.nameVi}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. BÀI TAY XẾP SO LE + NÚT KẾT THÚC LƯỢT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>
              Bài trên tay ({handCards.length} lá)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Nhấn giữ để phóng to</span>
          </div>

          <div
            ref={handContainerRef}
            style={{
              position: 'relative',
              width: '100%',
              height: isLandscape ? '82px' : '102px',
              boxSizing: 'border-box',
            }}
          >
            {handCards.map((cid, idx) => {
              const isSelected = selectedHandIndex === idx;
              const leftPos = idx * overlapStep;

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `${leftPos}px`,
                    zIndex: isSelected ? 40 : idx + 2,
                  }}
                >
                  <Card
                    cardId={cid}
                    testId={`hand-card-${idx}`}
                    size={isLandscape ? 'small' : 'normal'}
                    isSelected={isSelected}
                    onClick={() => setSelectedHandIndex(isSelected ? null : idx)}
                    onHold={(info) => setZoomedCard(info)}
                  />
                </div>
              );
            })}
          </div>

          {/* Dải điều khiển góc dưới: Nút Kết thúc lượt */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <button
              data-testid="end-turn-button"
              disabled={!isMyTurn}
              style={{
                height: '34px',
                padding: '0 20px',
                backgroundColor: isMyTurn ? '#2563eb' : '#334155',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
                boxShadow: isMyTurn ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none',
              }}
            >
              Kết thúc lượt
            </button>
          </div>
        </div>
      </div>

      {/* ===================== POPUP MENU (⋯) ===================== */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '40px 10px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '150px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={() => alert('Đổi bài')}
              style={{ padding: '8px', textAlign: 'left', background: 'none', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
            >
              Đổi bài
            </button>
            <button
              onClick={() => alert('Nhật ký')}
              style={{ padding: '8px', textAlign: 'left', background: 'none', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
            >
              Nhật ký ván chơi
            </button>
            <button
              onClick={() => alert('Thoát ván')}
              style={{ padding: '8px', textAlign: 'left', background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}
            >
              Thoát ván
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL PHÓNG TO CARD (CARD-ZOOM) ===================== */}
      {zoomedCard && (
        <div
          data-testid="card-zoom-backdrop"
          onClick={() => setZoomedCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card
              cardId={zoomedCard.id}
              size="zoom"
              testId="card-zoom"
            />
          </div>
        </div>
      )}
    </div>
  );
};
