import React from 'react';
import {
  getCardDisplayNameVi,
  type CardInstance,
} from '@boardgame/game-side-effects';

export interface HandViewProps {
  hand: CardInstance[];
  selectedCardId: string | null;
  onSelectCard: (instanceId: string) => void;
  isLandscape?: boolean;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  selectedCardId,
  onSelectCard,
  isLandscape = false,
}) => {
  // Chia 2 hàng khi có từ 6 lá trở lên để không bị tràn ngang và hiển thị được tới 12 lá
  const useTwoRows = hand.length > 6;
  const midpoint = useTwoRows ? Math.ceil(hand.length / 2) : hand.length;
  const row1 = hand.slice(0, midpoint);
  const row2 = useTwoRows ? hand.slice(midpoint) : [];

  const renderCardItem = (card: CardInstance) => {
    const isSelected = card.instanceId === selectedCardId;
    const name = getCardDisplayNameVi(card);

    let badgeText = 'THẺ';
    let headerColor = '#38bdf8';
    let bgGradient = 'linear-gradient(145deg, #1e293b, #0f172a)';
    let borderColor = '#334155';

    if (card.type === 'drug') {
      badgeText = 'THUỐC';
      headerColor = '#38bdf8';
      bgGradient = 'linear-gradient(145deg, #083344 0%, #0f172a 100%)';
      borderColor = '#0284c7';
    } else if (card.type === 'disorder') {
      badgeText = 'BỆNH LÝ';
      headerColor = '#f43f5e';
      bgGradient = 'linear-gradient(145deg, #4c0519 0%, #0f172a 100%)';
      borderColor = '#be123c';
    } else if (card.type === 'episode') {
      badgeText = 'T/CHỨNG';
      headerColor = '#fb923c';
      bgGradient = 'linear-gradient(145deg, #431407 0%, #0f172a 100%)';
      borderColor = '#ea580c';
    } else if (card.type === 'therapy') {
      badgeText = 'L/PHÁP';
      headerColor = '#4ade80';
      bgGradient = 'linear-gradient(145deg, #052e16 0%, #0f172a 100%)';
      borderColor = '#16a34a';
    }

    // Chiều cao và độ rộng tối đa mỗi lá để đảm bảo 12 lá không tràn ngang
    const cardHeight = isLandscape ? (useTwoRows ? '56px' : '64px') : (useTwoRows ? '68px' : '78px');

    return (
      <div
        key={card.instanceId}
        onClick={() => onSelectCard(card.instanceId)}
        data-testid={`hand-card-${card.instanceId}`}
        data-selected={isSelected ? 'true' : 'false'}
        style={{
          flex: '1 1 0px',
          maxWidth: useTwoRows ? '58px' : '72px',
          minWidth: '40px',
          height: cardHeight,
          boxSizing: 'border-box',
          borderRadius: '8px',
          background: bgGradient,
          border: isSelected ? '2px solid #38bdf8' : `1.5px solid ${borderColor}`,
          boxShadow: isSelected
            ? '0 0 16px rgba(56, 189, 248, 0.8), 0 4px 10px rgba(0,0,0,0.5)'
            : '0 2px 6px rgba(0,0,0,0.3)',
          transform: isSelected ? 'translateY(-8px) scale(1.08)' : 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px 3px',
          userSelect: 'none',
          position: 'relative',
          zIndex: isSelected ? 30 : 1,
          overflow: 'hidden',
        }}
      >
        {/* Header loại thẻ */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <span
            style={{
              fontSize: '8px',
              fontWeight: 900,
              color: headerColor,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              lineHeight: 1,
            }}
          >
            {badgeText}
          </span>
        </div>

        {/* Tên lá bài - đảm bảo luôn đọc được */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1px',
          }}
        >
          <span
            style={{
              fontSize: isLandscape ? '9px' : '10px',
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.15,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {name}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: isLandscape ? '11px' : '12px',
            fontWeight: 700,
            color: '#94a3b8',
            textTransform: 'uppercase',
          }}
        >
          Bài trên tay ({hand.length} lá)
        </span>
        {hand.length > 6 && (
          <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>
            ⚠️ Cần bỏ {hand.length - 6} lá cuối lượt
          </span>
        )}
      </div>

      {/* Vùng hiển thị toàn bộ lá bài: 1 hoặc 2 hàng, tuyệt đối không cuộn ngang */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'visible',
          paddingTop: '6px', // chừa khoảng trống khi thẻ phóng to
        }}
      >
        {/* Hàng 1 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {row1.map(renderCardItem)}
        </div>

        {/* Hàng 2 nếu có */}
        {useTwoRows && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {row2.map(renderCardItem)}
          </div>
        )}
      </div>
    </div>
  );
};
