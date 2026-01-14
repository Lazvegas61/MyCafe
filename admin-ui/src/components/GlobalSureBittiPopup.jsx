// components/GlobalSureBittiPopup.jsx
/* ------------------------------------------------------------
   📌 GlobalSureBittiPopup.jsx — Tüm sayfalarda görünecek süre bitimi popup'ı
------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalSureBittiPopup({ data, onClose }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30); // 30 saniye

  useEffect(() => {
    if (!visible) {
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onClose]);

  const handlePopupClick = () => {
    if (data.type === "BİLARDO" && data.adisyonId) {
      navigate(`/bilardo-adisyon/${data.adisyonId}`);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        animation: 'slideInRight 0.5s ease-out'
      }}
    >
      <div
        onClick={handlePopupClick}
        style={{
          background: 'linear-gradient(135deg, #c62828, #b71c1c)',
          color: 'white',
          padding: '18px 22px',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(198, 40, 40, 0.4)',
          cursor: 'pointer',
          border: '2px solid #ff5252',
          minWidth: '320px',
          transition: 'all 0.3s',
          ':hover': {
            transform: 'translateX(-5px) scale(1.05)',
            boxShadow: '0 15px 35px rgba(198, 40, 40, 0.5)'
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {data.type === "BİLARDO" ? "🎱" : "⏰"}
            </div>
            <div>
              <div style={{
                fontWeight: '900',
                fontSize: '18px',
                letterSpacing: '0.5px'
              }}>
                {data.type === "BİLARDO" ? "BİLARDO SÜRE DOLDU" : "SÜRE DOLDU"}
              </div>
              <div style={{
                fontSize: '14px',
                opacity: '0.9',
                marginTop: '2px'
              }}>
                {data.masaNo}
              </div>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '700'
          }}>
            {timeLeft}s
          </div>
        </div>
        
        <div style={{
          fontSize: '15px',
          marginBottom: '8px',
          lineHeight: '1.5'
        }}>
          {data.mesaj}
        </div>
        
        <div style={{
          fontSize: '13px',
          opacity: '0.9',
          marginTop: '8px',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span>👉</span>
          <span>Tıklayarak adisyona gidin...</span>
        </div>
      </div>
      
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(198, 40, 40, 0); }
          100% { boxShadow: 0 0 0 0 rgba(198, 40, 40, 0); }
        }
        
        .global-popup-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}