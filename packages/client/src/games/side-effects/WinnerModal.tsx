import React from 'react';

export interface WinnerModalProps {
  winnerId: string;
  myPlayerId: string;
  playerNames: Record<string, string>;
  onHome: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winnerId,
  myPlayerId,
  playerNames,
  onHome,
}) => {
  const isMe = winnerId === myPlayerId;
  const winnerName = playerNames[winnerId] || winnerId;

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '24px',
          border: '2px solid #eab308',
          boxShadow: '0 0 40px rgba(234, 179, 8, 0.4), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '20px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: '42px', animation: 'bounce 1s infinite' }}>🏆</div>

        <div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isMe ? 'XUẤT SẮC!' : 'KẾT THÚC VÁN CHƠI'}
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px' }}>
            {isMe ? 'Bạn đã chiến thắng!' : `${winnerName} đã chiến thắng!`}
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.4 }}>
            Đã chữa khỏi toàn bộ Bệnh Lý trong Thể Trạng!
          </p>
        </div>

        <button
          type="button"
          onClick={onHome}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            marginTop: '8px',
          }}
        >
          🏠 Về trang chủ
        </button>
      </div>
    </div>
  );
};
