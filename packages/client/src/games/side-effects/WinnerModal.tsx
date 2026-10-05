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
          background: 'linear-gradient(180deg, rgba(16, 38, 30, 0.98) 0%, rgba(8, 20, 16, 0.98) 100%)',
          borderRadius: '24px',
          border: '2px solid #eab308',
          boxShadow: '0 0 50px rgba(234, 179, 8, 0.5), 0 25px 60px rgba(0, 0, 0, 0.9)',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '24px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          boxSizing: 'border-box',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ fontSize: '48px', filter: 'drop-shadow(0 0 16px rgba(234, 179, 8, 0.6))' }}>🏆</div>

        <div>
          <span
            className="font-display"
            style={{ fontSize: '13px', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '1.5px' }}
          >
            {isMe ? 'XUẤT SẮC!' : 'KẾT THÚC VÁN CHƠI'}
          </span>
          <h2
            className="font-display"
            style={{
              fontSize: '24px',
              fontWeight: 900,
              marginTop: '6px',
              background: 'linear-gradient(135deg, #ffffff 0%, #fde047 38%, #eab308 72%, #ca8a04 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            {isMe ? 'Bạn đã chiến thắng!' : `${winnerName} đã chiến thắng!`}
          </h2>
          <p style={{ fontSize: '14px', color: '#a7c2b7', marginTop: '8px', lineHeight: 1.4 }}>
            Đã chữa khỏi toàn bộ Bệnh Lý trong Thể Trạng!
          </p>
        </div>

        <button
          type="button"
          onClick={onHome}
          className="casino-btn-active"
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 800,
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.5)',
            marginTop: '8px',
          }}
        >
          🏠 Về trang chủ
        </button>
      </div>
    </div>
  );
};
