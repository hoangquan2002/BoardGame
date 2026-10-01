import React, { useMemo } from 'react';
import {
  getDisorderDef,
  getDrugDef,
  type PsycheSlot,
} from '@boardgame/game-side-effects';
import { Card } from './Card.js';

export interface TargetSlotInfo {
  disorderInstanceId: string;
  label: string;
}

export interface PsycheViewProps {
  psyche: PsycheSlot[];
  isSelf?: boolean;
  targetSlots?: TargetSlotInfo[];
  cardWidth?: number;
  hasSelection?: boolean;
  onSelectSlot?: (disorderInstanceId: string) => void;
  onHoldCard?: (cardId: string) => void;
  isLandscape?: boolean;
}

export const PsycheView: React.FC<PsycheViewProps> = ({
  psyche,
  isSelf = true,
  targetSlots = [],
  cardWidth = 72,
  hasSelection = false,
  onSelectSlot,
  onHoldCard,
  isLandscape = false,
}) => {
  // Tính tỷ lệ chuẩn 520x864
  const cardHeight = Math.round((cardWidth * 864) / 520);
  // Thuốc lệch xuống 34% chiều cao lá để lộ trọn tiêu đề Bệnh Lý (33-35%)
  const staggerOffset = Math.round(cardHeight * 0.34);

  // Số bệnh chưa chữa
  const untreatedCount = psyche.filter((s) => s.drug === null).length;

  // Tính các bệnh lý mở cửa do tác dụng phụ của Thuốc đã dùng
  const possibleSideEffects = useMemo(() => {
    const set = new Set<string>();
    for (const slot of psyche) {
      if (slot.drug) {
        const drugDef = getDrugDef(slot.drug.cardId);
        if (drugDef) {
          for (const se of drugDef.sideEffects) {
            const disorderDef = getDisorderDef(se);
            set.add(disorderDef?.nameVi ?? se);
          }
        }
      }
    }
    return Array.from(set);
  }, [psyche]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Tiêu đề nhỏ màu mờ (Phần 2 mục F) - có khoảng cách dưới tránh viền mục tiêu chạm chữ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#64748b',
            letterSpacing: '0.3px',
            lineHeight: 1,
          }}
        >
          {isSelf ? 'Thể Trạng' : 'Thể Trạng đối thủ'} ({psyche.length} ô)
        </span>
        {untreatedCount === 0 && psyche.length > 0 && (
          <span
            style={{
              fontSize: '11px',
              color: '#4ade80',
              fontWeight: 700,
            }}
          >
            Đã chữa hết bệnh
          </span>
        )}
      </div>

      {/* Danh sách các ô Thể Trạng bậc thang: Thuốc nằm TRÊN Bệnh Lý, lệch xuống 34% (Mục D) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: isLandscape ? '3px' : '4px',
          width: '100%',
          boxSizing: 'border-box',
          alignItems: 'flex-start',
          paddingTop: '2px',
        }}
      >
        {psyche.map((slot) => {
          const isTreated = slot.drug !== null;
          const target = targetSlots.find(
            (t) => t.disorderInstanceId === slot.disorder.instanceId,
          );
          const isTargetable = Boolean(target);
          const dimmed = hasSelection && !isTargetable;

          // Chiều cao ô: có thuốc thì thêm độ lệch staggerOffset + khoảng cho vạch "Đã chữa"
          const slotHeight = isTreated
            ? cardHeight + staggerOffset + (isLandscape ? 0 : 12)
            : cardHeight;

          return (
            <div
              key={slot.disorder.instanceId}
              onClick={() => {
                if (isTargetable && onSelectSlot) {
                  onSelectSlot(slot.disorder.instanceId);
                }
              }}
              data-testid={`psyche-slot-${slot.disorder.instanceId}`}
              data-target={isTargetable ? 'true' : undefined}
              style={{
                position: 'relative',
                width: `${cardWidth}px`,
                height: `${slotHeight}px`,
                cursor: isTargetable ? 'pointer' : 'default',
                flexShrink: 0,
                boxSizing: 'border-box',
                opacity: dimmed ? 0.4 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              {/* LÁ BỆNH LÝ Ở DƯỚI (z-index 1) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  zIndex: 1,
                }}
              >
                <Card
                  cardId={slot.disorder.cardId}
                  size="normal"
                  isTarget={isTargetable}
                  style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                  onHold={() => onHoldCard?.(slot.disorder.cardId)}
                />
              </div>

              {/* LÁ THUỐC Ở TRÊN, LỆCH XUỐNG DƯỚI 34% (z-index 2) - Mục D */}
              {slot.drug && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${staggerOffset}px`,
                    left: 0,
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    zIndex: 2,
                  }}
                >
                  <Card
                    cardId={slot.drug.cardId}
                    size="normal"
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                    onHold={() => onHoldCard?.(slot.drug!.cardId)}
                  />
                </div>
              )}

              {/* DẤU HIỆU "ĐÃ CHỮA" ĐẶT BÊN NGOÀI ẢNH (Mục D) */}
              {isTreated && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: isLandscape ? '2px' : 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    fontSize: isLandscape ? '10px' : '11px',
                    fontWeight: 700,
                    color: '#4ade80',
                    lineHeight: 1,
                    zIndex: 3,
                    backgroundColor: isLandscape ? 'rgba(15, 42, 36, 0.9)' : undefined,
                    borderRadius: '2px',
                    padding: isLandscape ? '1px 2px' : undefined,
                  }}
                >
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                  Đã chữa
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DÒNG THÔNG TIN THỂ TRẠNG BÊN DƯỚI (Phần 2 mục C): >= 12px */}
      {isSelf && (
        <div
          style={{
            fontSize: '12px',
            color: '#cbd5e1',
            lineHeight: isLandscape ? 1.15 : 1.25,
            padding: 0,
          }}
        >
          <span style={{ fontWeight: 700, color: untreatedCount === 0 ? '#4ade80' : '#fda4af' }}>
            {untreatedCount === 0 ? 'Đã chữa hết bệnh' : `Còn ${untreatedCount} bệnh`}
          </span>
          {possibleSideEffects.length > 0 && (
            <span style={{ color: '#94a3b8' }}>
              {' · '}Có thể bị đưa: <strong style={{ color: '#fca5a5' }}>{possibleSideEffects.join(', ')}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
