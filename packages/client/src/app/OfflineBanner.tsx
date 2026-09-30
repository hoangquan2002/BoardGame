import React from 'react';

interface OfflineBannerProps {
  show: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        backgroundColor: '#eab308',
        color: '#713f12',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#ca8a04',
          animation: 'pulse 1.5s infinite',
        }}
      />
      Mất kết nối, đang kết nối lại…
    </div>
  );
};
