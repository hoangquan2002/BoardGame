import React from 'react';
import type { ClientGamePlugin } from '../games/registry.js';

export interface GameMenuCardProps {
  plugin: ClientGamePlugin;
  isSelected: boolean;
  onSelect: () => void;
  onOpenRules: () => void;
}

export const GameMenuCard: React.FC<GameMenuCardProps> = ({
  plugin,
  isSelected,
  onSelect,
  onOpenRules,
}) => {
  const minPlayers = plugin.game.minPlayers ?? 2;
  const maxPlayers = plugin.game.maxPlayers ?? 4;
  const hasBots = Boolean(plugin.game.bots && plugin.game.bots.length > 0);
  const accent = plugin.accentColor || '#10b981';

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`game-card-${plugin.id}`}
      aria-selected={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="casino-glass casino-card-hover"
      style={{
        width: '100%',
        borderRadius: '18px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: isSelected ? '1.5px solid #eab308' : '1px solid rgba(212, 175, 55, 0.22)',
        boxShadow: isSelected
          ? '0 12px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(234, 179, 8, 0.35)'
          : '0 8px 20px rgba(0, 0, 0, 0.5)',
        background: isSelected
          ? 'linear-gradient(180deg, rgba(20, 48, 38, 0.94) 0%, rgba(10, 26, 21, 0.98) 100%)'
          : 'linear-gradient(180deg, rgba(14, 32, 26, 0.8) 0%, rgba(8, 18, 14, 0.9) 100%)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* HÀNG TRÊN CÙNG: TRẠNG THÁI CHỌN VÀ NÚT LUẬT CHƠI */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: '8px',
        }}
      >
        {isSelected ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.22)',
              border: '1px solid rgba(16, 185, 129, 0.6)',
              color: '#34d399',
              letterSpacing: '0.4px',
            }}
          >
            ✓ Đang chọn
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              color: '#94a3b8',
              letterSpacing: '0.3px',
            }}
          >
            Chạm để chọn
          </span>
        )}

        <button
          type="button"
          data-testid="rules-button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenRules();
          }}
          className="btn-gold"
          style={{
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            minHeight: '26px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          📖 Luật chơi
        </button>
      </div>

      {/* THÔNG TIN CHÍNH: ICON CHIP + TIÊU ĐỀ & PHỤ ĐỀ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
        <div
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            minWidth: '56px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, ${accent} 0%, #064e3b 70%, #022c22 100%)`,
            border: '2px solid #eab308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 0 16px rgba(234, 179, 8, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            flexShrink: 0,
          }}
        >
          <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>{plugin.icon}</span>
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '1.2px dashed rgba(234, 179, 8, 0.45)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <h3
            className="font-display text-gold-gradient"
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '1px',
              margin: 0,
              lineHeight: 1.25,
              wordBreak: 'break-word',
            }}
          >
            {plugin.title}
          </h3>
          <p
            style={{
              fontSize: '12px',
              color: '#a7c2b7',
              margin: '3px 0 0 0',
              lineHeight: 1.4,
              letterSpacing: '0.2px',
              wordBreak: 'break-word',
            }}
          >
            {plugin.subtitle}
          </p>
        </div>
      </div>

      {/* CÁC HUY HIỆU THÔNG SỐ (BADGES) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: '#d1fae5',
            backgroundColor: 'rgba(6, 20, 16, 0.8)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            padding: '3px 8px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            fontWeight: 600,
          }}
        >
          {`👥 ${minPlayers}–${maxPlayers} người`}
        </span>

        {plugin.durationTextVi && (
          <span
            style={{
              fontSize: '11px',
              color: '#d1fae5',
              backgroundColor: 'rgba(6, 20, 16, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {`⏱️ ${plugin.durationTextVi}`}
          </span>
        )}

        {plugin.categoryVi && (
          <span
            style={{
              fontSize: '11px',
              color: '#d1fae5',
              backgroundColor: 'rgba(6, 20, 16, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {`🏷️ ${plugin.categoryVi}`}
          </span>
        )}

        {hasBots && (
          <span
            style={{
              fontSize: '11px',
              color: '#bae6fd',
              backgroundColor: 'rgba(6, 20, 16, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            🤖 Có Máy
          </span>
        )}
      </div>
    </div>
  );
};
