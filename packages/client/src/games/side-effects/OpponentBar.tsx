import React, { useState } from 'react';
import {
  getDisorderDef,
  getDisorderNameVi,
  getDrugDef,
  type SEPlayerViewPlayer,
} from '@boardgame/game-side-effects';
import { CardView } from './CardView.js';

export interface OpponentTargetInfo {
  targetPlayerId: string;
  type: 'GIVE_DISORDER' | 'EPISODE';
  disorderInstanceId?: string;
}

export interface OpponentBarProps {
  opponents: SEPlayerViewPlayer[];
  playerNames?: Record<string, string>;
  activePlayerId: string;
  targets?: OpponentTargetInfo[];
  onSelectTarget?: (playerId: string, disorderInstanceId?: string) => void;
}

export const OpponentBar: React.FC<OpponentBarProps> = ({
  opponents,
  playerNames = {},
  activePlayerId,
  targets = [],
  onSelectTarget,
}) => {
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);

  const selectedOpponent = opponents.find((p) => p.id === selectedOpponentId);

  // Tính các bệnh lý mà đối thủ có thể bị gây ra do tác dụng phụ của các Thuốc đang dùng
  const getPossibleSideEffects = (player: SEPlayerViewPlayer): string[] => {
    const sideEffectsSet = new Set<string>();
    const existingDisorders = new Set(player.psyche.map((s) => s.disorder.cardId));

    for (const slot of player.psyche) {
      if (slot.drug) {
        const def = getDrugDef(slot.drug.cardId);
        if (def) {
          for (const se of def.sideEffects) {
            if (!existingDisorders.has(se)) {
              sideEffectsSet.add(se);
            }
          }
        }
      }
    }
    return Array.from(sideEffectsSet);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Danh sách thanh đối thủ thu gọn cuộn ngang */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {opponents.map((opp) => {
          const name = playerNames[opp.id] || opp.id;
          const isBot = name.startsWith('Máy ') || name.includes('(Thường)') || name.includes('(Khó)');
          const isActive = opp.id === activePlayerId;
          const untreatedCount = opp.psyche.filter((s) => s.drug === null).length;

          // Kiểm tra xem đối thủ có phải mục tiêu GIVE_DISORDER hoặc có slot EPISODE không
          const giveTarget = targets.find(
            (t) => t.targetPlayerId === opp.id && t.type === 'GIVE_DISORDER',
          );
          const hasEpisodeTarget = targets.some(
            (t) => t.targetPlayerId === opp.id && t.type === 'EPISODE',
          );
          const isTargetable = Boolean(giveTarget || hasEpisodeTarget);

          return (
            <button
              key={opp.id}
              type="button"
              onClick={() => {
                if (giveTarget && onSelectTarget) {
                  onSelectTarget(opp.id);
                } else {
                  setSelectedOpponentId(opp.id);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: '130px',
                padding: '8px 10px',
                backgroundColor: isActive ? 'rgba(30, 58, 138, 0.5)' : '#1e293b',
                borderRadius: '12px',
                border: isTargetable
                  ? '2px solid #4ade80'
                  : isActive
                    ? '1.5px solid #3b82f6'
                    : '1px solid #334155',
                boxShadow: isTargetable ? '0 0 10px rgba(74, 222, 128, 0.5)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#f8fafc',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isBot ? `🤖 ${name}` : name}
                </span>
                {isActive && (
                  <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 800 }}>LƯỢT</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                <span>🃏 {opp.handCount} lá</span>
                <span style={{ color: untreatedCount > 0 ? '#fda4af' : '#86efac' }}>
                  ⚠️ {untreatedCount} bệnh
                </span>
              </div>

              {/* Hình phạt nếu có */}
              {(opp.skipTurns > 0 || opp.preventPlayCardsTurns > 0 || opp.preventDrawTurns > 0) && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {opp.skipTurns > 0 && <span style={{ fontSize: '10px', color: '#fbbf24' }}>😴 Nghỉ</span>}
                  {opp.preventPlayCardsTurns > 0 && <span style={{ fontSize: '10px', color: '#f87171' }}>⚡ Liệt</span>}
                  {opp.preventDrawTurns > 0 && <span style={{ fontSize: '10px', color: '#fb923c' }}>🍽️ Biếng</span>}
                </div>
              )}

              {giveTarget && (
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    textAlign: 'center',
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                >
                  ĐƯA BỆNH LÝ
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal / Chi tiết đối thủ */}
      {selectedOpponent && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9990,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  {(() => {
                    const selName = playerNames[selectedOpponent.id] || selectedOpponent.id;
                    const isSelBot = selName.startsWith('Máy ') || selName.includes('(Thường)') || selName.includes('(Khó)');
                    return isSelBot ? `🤖 ${selName}` : selName;
                  })()}
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Bài trên tay: {selectedOpponent.handCount} lá
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpponentId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Dòng CÓ THỂ GÂY RA */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                ⚡ CÓ THỂ GÂY RA (Tác dụng phụ):
              </div>
              {(() => {
                const sideEffects = getPossibleSideEffects(selectedOpponent);
                if (sideEffects.length === 0) {
                  return (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Không có (chưa dùng Thuốc nào có thể gây bệnh thêm)
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {sideEffects.map((se) => (
                      <span
                        key={se}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        {getDisorderNameVi(se)}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Chi tiết Thể Trạng của đối thủ */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                THỂ TRẠNG ({selectedOpponent.psyche.length} Bệnh Lý):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedOpponent.psyche.map((slot) => {
                  const isTreated = slot.drug !== null;
                  const episodeTarget = targets.find(
                    (t) =>
                      t.targetPlayerId === selectedOpponent.id &&
                      t.type === 'EPISODE' &&
                      t.disorderInstanceId === slot.disorder.instanceId,
                  );
                  const disorderDef = getDisorderDef(slot.disorder.cardId);

                  return (
                    <div
                      key={slot.disorder.instanceId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '10px',
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        border: episodeTarget
                          ? '2px solid #4ade80'
                          : isTreated
                            ? '1px solid #059669'
                            : '1px solid #475569',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {getDisorderNameVi(slot.disorder.cardId)}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isTreated ? '#10b981' : '#ef4444',
                              color: '#ffffff',
                              fontWeight: 700,
                            }}
                          >
                            {isTreated ? 'ĐÃ CHỮA' : 'CHƯA CHỮA'}
                          </span>
                        </div>

                        {episodeTarget && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOpponentId(null);
                              onSelectTarget?.(selectedOpponent.id, slot.disorder.instanceId);
                            }}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#ea580c',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            ⚡ Đánh Triệu Chứng
                          </button>
                        )}
                      </div>

                      {/* Hình phạt */}
                      {disorderDef?.punishment && (
                        <div style={{ fontSize: '11px', color: '#fda4af', lineHeight: 1.3 }}>
                          <strong>Hình phạt:</strong> {disorderDef.punishment.textVi}
                        </div>
                      )}

                      {/* Thuốc đã gắn */}
                      {slot.drug && (
                        <div style={{ marginTop: '4px' }}>
                          <CardView card={slot.drug} size="mini" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setSelectedOpponentId(null)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
