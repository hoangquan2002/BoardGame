import React from 'react';
import {
  getDisorderNameVi,
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
  onSelectSlot?: (disorderInstanceId: string) => void;
  onHoldCard?: (cardId: string) => void;
  isLandscape?: boolean;
}

export const PsycheView: React.FC<PsycheViewProps> = ({
  psyche,
  isSelf = true,
  targetSlots = [],
  onSelectSlot,
  onHoldCard,
  isLandscape = false,
}) => {
  const allTreated = psyche.length > 0 && psyche.every((s) => s.drug !== null);

  // Kích thước lá trong Thể Trạng: tối ưu vừa vặn trong màn hình dọc 375x667 cho cả 4 người
  const cardWidth = isLandscape ? 58 : 48;
  const cardHeight = isLandscape ? 90 : 72;
  const staggerOffset = isLandscape ? 24 : 18;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isLandscape ? '3px' : '6px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {isSelf ? 'Thể Trạng của bạn' : 'Thể Trạng'} ({psyche.length} Bệnh Lý)
        </span>
        {allTreated && (
          <span
            style={{
              fontSize: '11px',
              color: '#4ade80',
              fontWeight: 800,
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #22c55e',
            }}
          >
            ĐÃ CHỮA TẤT CẢ (SẮP THẮNG)
          </span>
        )}
      </div>

      {/* Danh sách các ô Thể Trạng: xếp bậc thang so le (Góp ý B) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: isLandscape ? '6px' : '8px',
          width: '100%',
          boxSizing: 'border-box',
          alignItems: 'flex-start',
        }}
      >
        {psyche.map((slot) => {
          const isTreated = slot.drug !== null;
          const target = targetSlots.find(
            (t) => t.disorderInstanceId === slot.disorder.instanceId,
          );
          const isTargetable = Boolean(target);
          const drugDef = slot.drug ? getDrugDef(slot.drug.cardId) : undefined;
          const openedSideEffects = drugDef?.sideEffects?.map((s) => getDisorderNameVi(s)).join(', ');

          const slotHeight = isTreated ? cardHeight + staggerOffset : cardHeight;

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
                position: 'relative',
                width: `${cardWidth}px`,
                height: `${slotHeight}px`,
                cursor: isTargetable ? 'pointer' : 'default',
                transform: isTargetable ? 'scale(1.03)' : 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                flexShrink: 0,
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
                  style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                  isTarget={isTargetable}
                  onHold={() => onHoldCard?.(slot.disorder.cardId)}
                />
              </div>

              {/* LÁ THUỐC Ở TRÊN, LỆCH XUỐNG DƯỚI (z-index 2) - Góp ý B */}
              {slot.drug && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${staggerOffset}px`,
                    left: 0,
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    zIndex: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                  }}
                >
                  <Card
                    cardId={slot.drug.cardId}
                    size="normal"
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      border: '2px solid #22c55e',
                    }}
                    onHold={() => onHoldCard?.(slot.drug!.cardId)}
                  />
                  {/* Huy hiệu ĐÃ CHỮA */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      backgroundColor: 'rgba(34, 197, 94, 0.95)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                    }}
                  >
                    Đã chữa
                  </div>

                  {/* Dòng Mở cửa cho: tác dụng phụ (Phần 1 mục 2) */}
                  {openedSideEffects && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '25px',
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(76, 5, 25, 0.95)',
                        color: '#fca5a5',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 3px',
                        textAlign: 'center',
                        lineHeight: 1.15,
                        pointerEvents: 'none',
                        borderTop: '1px solid #f43f5e',
                      }}
                    >
                      Mở cửa: {openedSideEffects}
                    </div>
                  )}
                </div>
              )}

              {/* Nhãn nút hành động mục tiêu nếu có (TREAT / THERAPY) */}
              {isTargetable && target && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-22px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
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
