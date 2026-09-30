import React from 'react';
import {
  getCardDisplayNameVi,
  getDisorderDef,
  getDisorderNameVi,
  getDrugDef,
  type CardInstance,
} from '@boardgame/game-side-effects';

export interface CardViewProps {
  card: CardInstance;
  isSelected?: boolean;
  isTargetable?: boolean;
  targetLabel?: string;
  size?: 'normal' | 'compact' | 'mini';
  onClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  isTargetable = false,
  targetLabel,
  size = 'normal',
  onClick,
}) => {
  const name = getCardDisplayNameVi(card);

  // Thẻ Thuốc
  const drugDef = card.type === 'drug' ? getDrugDef(card.cardId) : undefined;
  // Thẻ Bệnh Lý
  const disorderDef = card.type === 'disorder' ? getDisorderDef(card.cardId) : undefined;

  let headerColor = '#64748b';
  let badgeText = 'THẺ BÀI';
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
    badgeText = 'TRIỆU CHỨNG';
    headerColor = '#fb923c';
    bgGradient = 'linear-gradient(145deg, #431407 0%, #0f172a 100%)';
    borderColor = '#ea580c';
  } else if (card.type === 'therapy') {
    badgeText = 'LIỆU PHÁP';
    headerColor = '#4ade80';
    bgGradient = 'linear-gradient(145deg, #052e16 0%, #0f172a 100%)';
    borderColor = '#16a34a';
  }

  const isClickable = !!onClick || isTargetable;

  const width = size === 'normal' ? '120px' : size === 'compact' ? '96px' : '76px';
  const height = size === 'normal' ? '160px' : size === 'compact' ? '130px' : '100px';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        width,
        height,
        minWidth: width,
        boxSizing: 'border-box',
        borderRadius: size === 'mini' ? '8px' : '12px',
        background: bgGradient,
        border: isSelected
          ? '2px solid #38bdf8'
          : isTargetable
            ? '2px solid #4ade80'
            : `1.5px solid ${borderColor}`,
        boxShadow: isSelected
          ? '0 0 16px rgba(56, 189, 248, 0.6), 0 4px 12px rgba(0,0,0,0.4)'
          : isTargetable
            ? '0 0 14px rgba(74, 222, 128, 0.7), 0 4px 10px rgba(0,0,0,0.3)'
            : '0 4px 8px rgba(0, 0, 0, 0.25)',
        transform: isSelected ? 'translateY(-8px) scale(1.03)' : isTargetable ? 'scale(1.02)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        cursor: isClickable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: size === 'mini' ? '4px 6px' : '8px 8px',
        position: 'relative',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header loại thẻ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: size === 'mini' ? '9px' : '10px',
            fontWeight: 800,
            color: headerColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {badgeText}
        </span>
      </div>

      {/* Tên lá bài */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h4
          style={{
            fontSize: size === 'normal' ? '13px' : size === 'compact' ? '11px' : '10px',
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.25,
            wordBreak: 'break-word',
          }}
        >
          {name}
        </h4>

        {/* Nội dung chi tiết cho từng loại */}
        {size === 'normal' && (
          <div style={{ marginTop: '6px', fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {drugDef && (
              <>
                <div style={{ color: '#86efac' }}>
                  <strong>Trị:</strong> {getDisorderNameVi(drugDef.treats)}
                </div>
                <div style={{ color: '#cbd5e1' }}>
                  <strong>T/dụng phụ:</strong>{' '}
                  {drugDef.sideEffects.map((sid) => getDisorderNameVi(sid)).join(', ')}
                </div>
              </>
            )}

            {disorderDef && (
              <div style={{ color: '#fda4af', fontSize: '9.5px', lineHeight: 1.2 }}>
                {disorderDef.punishment?.textVi?.split('\n')[0] ?? ''}
              </div>
            )}

            {card.type === 'episode' && (
              <div style={{ color: '#fdba74', fontSize: '9.5px', lineHeight: 1.2 }}>
                Kích hoạt hình phạt bệnh chưa chữa của đối thủ
              </div>
            )}

            {card.type === 'therapy' && (
              <div style={{ color: '#86efac', fontSize: '9.5px', lineHeight: 1.2 }}>
                Loại bỏ 1 Bệnh Lý (trừ Chứng run) hoặc Thuốc
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nhãn hành động mục tiêu nếu có */}
      {isTargetable && targetLabel && (
        <div
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            fontSize: size === 'mini' ? '8px' : '9px',
            fontWeight: 800,
            textAlign: 'center',
            padding: '2px 4px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            animation: 'pulse 1.2s infinite',
          }}
        >
          {targetLabel}
        </div>
      )}
    </div>
  );
};
