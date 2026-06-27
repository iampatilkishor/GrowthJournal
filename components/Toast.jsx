'use client';

import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colorMap = {
    success: '#2e7d32',
    error: '#c62828',
    warning: '#f57c00',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: colorMap[type] || colorMap.success,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        maxWidth: '360px',
        fontSize: '14px',
        fontWeight: 500,
        animation: 'slideIn 0.2s ease',
      }}
    >
      {message}
    </div>
  );
}
