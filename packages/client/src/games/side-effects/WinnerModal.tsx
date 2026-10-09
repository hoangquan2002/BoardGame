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
      data-testid="winner-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="casino-glass animate-fade-in"
        style={{
          borderRadius: '24px',
          border: '2px solid #eab308',
          boxShadow: '0 0 60px rgba(234, 179, 8, 0.55), 0 30px 70px rgba(0, 0, 0, 0.95)',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '28px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* CÚP VÀNG HÀO QUANG */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #fef08a 0%, #eab308 60%, #854d0e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            boxShadow: '0 0 30px rgba(234, 179, 8, 0.8), inset 0 2px 6px rgba(255, 255, 255, 0.6)',
            animation: 'goldPulse 2s infinite ease-in-out',
          }}
        >
          <span style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>🏆</span>
        </div>

        <div>
          <span
            className="font-display"
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#facc15',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            {isMe ? 'CHIẾN THẮNG TUYỆT ĐỐI' : 'KẾT THÚC VÁN ĐẤU'}
          </span>
          <h2
            className="font-display text-gold-gradient"
            style={{
              fontSize: '26px',
              fontWeight: 900,
              margin: '0',
              letterSpacing: '1px',
            }}
          >
            {isMe ? 'Bạn đã chiến thắng!' : `${winnerName} đã chiến thắng!`}
          </h2>
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              backgroundColor: 'rgba(6, 26, 18, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 700 }}>
              ✓ Đã chữa khỏi toàn bộ Bệnh Lý
            </span>
            <span style={{ fontSize: '12px', color: '#a7c2b7' }}>
              Thể Trạng sạch bóng bệnh lý đầu tiên trên bàn chơi
            </span>
          </div>
        </div>

        {/* 2 NÚT HÀNH ĐỘNG: VỀ PHÒNG CHỜ & THOÁT RA TRANG CHỦ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onHome}
            className="btn-emerald animate-emerald-pulse"
            style={{
              width: '100%',
              minHeight: '46px',
              borderRadius: '12px',
              fontSize: '15px',
            }}
          >
            🔄 Về phòng chờ
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="btn-gold"
            style={{
              width: '100%',
              minHeight: '44px',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#cbd5e1',
            }}
          >
            🚪 Thoát ra sảnh chính
          </button>
        </div>
      </div>
    </div>
  );
};
