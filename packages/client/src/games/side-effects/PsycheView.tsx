import React from 'react';
import type { PsycheSlot } from '@boardgame/game-side-effects';
import { CardView } from './CardView.js';

export interface TargetSlotInfo {
  disorderInstanceId: string;
  label: string;
}

export interface PsycheViewProps {
  psyche: PsycheSlot[];
  isSelf?: boolean;
  targetSlots?: TargetSlotInfo[];
  onSelectSlot?: (disorderInstanceId: string) => void;
}

export const PsycheView: React.FC<PsycheViewProps> = ({
  psyche,
  isSelf = true,
  targetSlots = [],
  onSelectSlot,
}) => {
  const allTreated = psyche.length > 0 && psyche.every((s) => s.drug !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
          {isSelf ? 'Thể Trạng của bạn' : 'Thể Trạng'} ({psyche.length} Bệnh Lý)
        </span>
        {allTreated && (
          <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>
            🎉 ĐÃ ĐIỀU TRỊ TOÀN BỘ
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '6px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {psyche.map((slot) => {
          const isTreated = slot.drug !== null;
          const target = targetSlots.find(
            (t) => t.disorderInstanceId === slot.disorder.instanceId,
          );
          const isTargetable = Boolean(target);

          return (
            <div
              key={slot.disorder.instanceId}
              onClick={() => {
                if (isTargetable && onSelectSlot) {
                  onSelectSlot(slot.disorder.instanceId);
                }
              }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: isTreated ? 'rgba(6, 78, 59, 0.4)' : 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                padding: '6px',
                border: isTargetable
                  ? '2px solid #4ade80'
                  : isTreated
                    ? '1.5px solid #059669'
                    : '1.5px solid #475569',
                boxShadow: isTargetable
                  ? '0 0 12px rgba(74, 222, 128, 0.6)'
                  : '0 2px 6px rgba(0,0,0,0.2)',
                cursor: isTargetable ? 'pointer' : 'default',
                transform: isTargetable ? 'scale(1.02)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Badge trạng thái */}
              <div
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '6px',
                  zIndex: 2,
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontSize: '9px',
                  fontWeight: 800,
                  backgroundColor: isTreated ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                }}
              >
                {isTreated ? '✓ ĐÃ CHỮA' : 'CHƯA CHỮA'}
              </div>

              {/* Lá Bệnh Lý */}
              <CardView
                card={slot.disorder}
                size="compact"
                isTargetable={isTargetable}
                targetLabel={target?.label}
              />

              {/* Lá Thuốc điều trị (nếu có) */}
              {slot.drug && (
                <div style={{ marginTop: '4px', width: '100%' }}>
                  <CardView card={slot.drug} size="mini" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
