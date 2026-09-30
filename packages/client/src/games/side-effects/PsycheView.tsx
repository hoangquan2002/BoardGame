import React from 'react';
import {
  getCardDisplayNameVi,
  getDisorderDef,
  getDisorderNameVi,
  type PsycheSlot,
} from '@boardgame/game-side-effects';

export interface TargetSlotInfo {
  disorderInstanceId: string;
  label: string;
}

export interface PsycheViewProps {
  psyche: PsycheSlot[];
  isSelf?: boolean;
  targetSlots?: TargetSlotInfo[];
  onSelectSlot?: (disorderInstanceId: string) => void;
  isLandscape?: boolean;
}

export const PsycheView: React.FC<PsycheViewProps> = ({
  psyche,
  isSelf = true,
  targetSlots = [],
  onSelectSlot,
  isLandscape = false,
}) => {
  const allTreated = psyche.length > 0 && psyche.every((s) => s.drug !== null);

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
          {isSelf ? 'Thể Trạng của bạn' : 'Thể Trạng'} ({psyche.length} Bệnh Lý)
        </span>
        {allTreated && (
          <span style={{ fontSize: '10.5px', color: '#4ade80', fontWeight: 800 }}>
            🎉 ĐÃ ĐIỀU TRỊ TOÀN BỘ (SẮP THẮNG!)
          </span>
        )}
      </div>

      {/* Danh sách Thể Trạng: chia đều/bọc dòng, không cuộn ngang */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {psyche.map((slot) => {
          const isTreated = slot.drug !== null;
          const target = targetSlots.find(
            (t) => t.disorderInstanceId === slot.disorder.instanceId,
          );
          const isTargetable = Boolean(target);
          const disorderDef = getDisorderDef(slot.disorder.cardId);
          const disorderName = disorderDef?.nameVi || getDisorderNameVi(slot.disorder.cardId);

          return (
            <div
              key={slot.disorder.instanceId}
              onClick={() => {
                if (isTargetable && onSelectSlot) {
                  onSelectSlot(slot.disorder.instanceId);
                }
              }}
              data-testid={`psyche-slot-${slot.disorder.instanceId}`}
              style={{
                flex: '1 1 70px',
                minWidth: '65px',
                maxWidth: isLandscape ? '130px' : '110px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: isTargetable
                  ? 'rgba(74, 222, 128, 0.2)'
                  : isTreated
                    ? 'rgba(6, 78, 59, 0.4)'
                    : 'rgba(76, 5, 25, 0.45)',
                borderRadius: '8px',
                padding: '4px 6px',
                border: isTargetable
                  ? '2px solid #4ade80'
                  : isTreated
                    ? '1.5px solid #059669'
                    : '1.5px solid #be123c',
                boxShadow: isTargetable
                  ? '0 0 12px rgba(74, 222, 128, 0.7)'
                  : '0 2px 4px rgba(0,0,0,0.2)',
                cursor: isTargetable ? 'pointer' : 'default',
                transform: isTargetable ? 'scale(1.03)' : 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* Badge trạng thái */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    padding: '1px 4px',
                    borderRadius: '3px',
                    backgroundColor: isTreated ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                  }}
                >
                  {isTreated ? 'ĐÃ CHỮA' : 'CHƯA'}
                </span>
              </div>

              {/* Tên Bệnh Lý */}
              <div style={{ marginTop: '2px', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: isLandscape ? '9.5px' : '10.5px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    lineHeight: 1.15,
                    display: 'block',
                    wordBreak: 'break-word',
                  }}
                >
                  ⚠️ {disorderName}
                </span>
              </div>

              {/* Thuốc điều trị nếu có */}
              {slot.drug && (
                <div
                  style={{
                    fontSize: '8.5px',
                    color: '#86efac',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    border: '1px solid #059669',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  💊 {getCardDisplayNameVi(slot.drug)}
                </div>
              )}

              {/* Nút hành động mục tiêu nếu có */}
              {isTargetable && target && (
                <div
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '8.5px',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    marginTop: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  {target.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
