import React from 'react';

export interface GameLogsModalProps {
  logs: string[];
  onClose: () => void;
}

export const GameLogsModal: React.FC<GameLogsModalProps> = ({ logs, onClose }) => {
  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9994,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '420px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
            📜 Nhật ký ván chơi
          </h3>
          <button
            type="button"
            onClick={onClose}
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

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '4px',
          }}
        >
          {logs.slice().reverse().map((log, index) => (
            <div
              key={index}
              style={{
                fontSize: '12.5px',
                color: '#cbd5e1',
                padding: '8px 10px',
                backgroundColor: index === 0 ? 'rgba(56, 189, 248, 0.1)' : '#0f172a',
                borderLeft: index === 0 ? '3px solid #38bdf8' : '3px solid #475569',
                borderRadius: '4px',
                lineHeight: 1.4,
              }}
            >
              {log}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
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
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
