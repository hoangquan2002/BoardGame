import React from 'react';

export interface GameLogsModalProps {
  logs: string[];
  onClose: () => void;
}

export interface GameLogListProps {
  logs: string[];
  compact?: boolean;
}

// Danh sách nhật ký (mới nhất ở trên), dùng chung cho modal và bảng bên phải trên máy tính
export const GameLogList: React.FC<GameLogListProps> = ({ logs, compact = false }) => {
  if (logs.length === 0) {
    return (
      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '6px 2px' }}>
        Chưa có sự kiện nào
      </div>
    );
  }
  return (
    <div
      data-testid="game-log-list"
      style={{ display: 'flex', flexDirection: 'column', gap: compact ? '5px' : '8px' }}
    >
      {logs
        .slice()
        .reverse()
        .map((log, index) => (
          <div
            key={logs.length - index}
            style={{
              fontSize: compact ? '12px' : '12.5px',
              color: index === 0 ? '#f8fafc' : '#cbd5e1',
              padding: compact ? '6px 8px' : '8px 10px',
              background:
                index === 0
                  ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.04) 100%)'
                  : 'rgba(4, 14, 11, 0.55)',
              borderLeft: index === 0 ? '3px solid #facc15' : '3px solid rgba(212, 175, 55, 0.22)',
              borderRadius: '5px',
              lineHeight: 1.4,
            }}
          >
            {log}
          </div>
        ))}
    </div>
  );
};

export const GameLogsModal: React.FC<GameLogsModalProps> = ({ logs, onClose }) => {
  return (
    <div
      role="dialog"
      data-testid="game-logs-modal"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9994,
        backgroundColor: 'rgba(2, 8, 6, 0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(16, 40, 32, 0.98) 0%, rgba(8, 22, 17, 0.98) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.85), 0 0 24px rgba(212, 175, 55, 0.12)',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Cinzel', serif",
              fontSize: '17px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fde68a 0%, #facc15 50%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Nhật ký ván chơi
          </h3>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#fde047',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          <GameLogList logs={logs} />
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            background: 'rgba(212, 175, 55, 0.12)',
            color: '#fde047',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
