// File: admin-ui/src/pages/Raporlar/RaporlarIndex.jsx
// TEMİZ VE ODAKLANMIŞ SÜRÜM (Stok raporu kaldırıldı, gereksiz yazılar kaldırıldı)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Raporlar.css';

const RaporlarIndex = () => {
  const navigate = useNavigate();
  
  // GÜN DURUMU STATE'İ
  const [gunAktif, setGunAktif] = useState(() => {
    const gunDurumu = localStorage.getItem('mycafe_gun_durumu');
    return gunDurumu === 'aktif';
  });

  // GÜN DURUMU DEĞİŞİKLİKLERİNİ DİNLE
  useEffect(() => {
    const handleGunDurumuDegisti = (event) => {
      if (event.detail && typeof event.detail.aktif !== 'undefined') {
        setGunAktif(event.detail.aktif);
      }
    };
    
    window.addEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    
    return () => {
      window.removeEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    };
  }, []);

  // RAPOR LİSTESİ - Stok raporu kaldırıldı
  const raporlar = [
    {
      id: 1,
      title: 'Gün Sonu Raporu',
      description: 'Günlük satış, ödeme ve kasa özeti. Günün finansal performansını tek ekranda görün.',
      icon: '📊',
      path: 'gun-sonu',
      color: '#4CAF50',
      requiresActiveDay: true
    },
    {
      id: 2,
      title: 'Kasa Raporu',
      description: 'Nakit, kart ve diğer ödeme yöntemlerinin detaylı dökümü. Kasa hareketlerini takip edin.',
      icon: '💰',
      path: 'kasa',
      color: '#2196F3',
      requiresActiveDay: true
    },
    {
      id: 3,
      title: 'Ürün Satış Raporu',
      description: 'Hangi ürün ne kadar satıldı? Ürün bazlı satış analizi ve performans karşılaştırması.',
      icon: '🍔',
      path: 'urun',
      color: '#FF9800',
      requiresActiveDay: true
    },
    {
      id: 4,
      title: 'Kategori Raporu',
      description: 'Kategorilerin satış performansı. Hangi kategori daha çok kazandırıyor?',
      icon: '📈',
      path: 'kategori',
      color: '#9C27B0',
      requiresActiveDay: true
    },
    {
      id: 5,
      title: 'Masa Performansı',
      description: 'Masaların doluluk oranları ve gelir performansı. En çok kazandıran masaları görün.',
      icon: '🪑',
      path: 'masa',
      color: '#3F51B5',
      requiresActiveDay: true
    },
    {
      id: 6,
      title: 'Bilardo Raporu',
      description: 'Bilardo masalarının kullanım süreleri ve gelir analizi. Bilardo özel raporları.',
      icon: '🎱',
      path: 'bilardo',
      color: '#00BCD4',
      requiresActiveDay: true
    },
    {
      id: 7,
      title: 'Gider Takibi',
      description: 'Tüm gider kalemlerinin detaylı listesi. Paranızın nereye gittiğini görün.',
      icon: '📉',
      path: 'gider',
      color: '#F44336',
      requiresActiveDay: false
    }
  ];

  const handleRaporClick = (rapor) => {
    if (rapor.requiresActiveDay && !gunAktif) {
      alert(`"${rapor.title}" görüntülemek için önce günü başlatmalısınız.`);
      return;
    }
    
    navigate(rapor.path);
  };

  // CSS Değişkenleri için stil
  const getCardStyle = (color) => {
    const darkColor = color.replace(')', ', 0.8)').replace('rgb', 'rgba');
    return {
      '--kart-rengi': color,
      '--kart-rengi-koyu': darkColor,
      borderLeftColor: color
    };
  };

  return (
    <div className="rapor-dashboard">
      
      {/* GÜN BAŞLATILMAMIŞ UYARI */}
      {!gunAktif && (
        <div className="gun-baslat-uyari">
          <div className="uyari-icon">⚠️</div>
          <div className="uyari-icerik">
            <h4>Gün Başlatılmamış</h4>
            <p>Tüm raporları ve analizleri görmek için önce günü başlatın.</p>
            <p className="uyari-detay">
              <strong>Not:</strong> Şu anda sadece "Gider Takibi" raporunu görüntüleyebilirsiniz.
            </p>
            <div className="uyari-buttons">
              <button 
                className="uyari-button primary"
                onClick={() => navigate('/ana')}
              >
                🚀 Ana Sayfaya Git (Günü Başlat)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ANA BAŞLIK - ORTALANMIŞ */}
      <div className="dashboard-header">
        <h2>MyCafe RAPORLAMA</h2>
        
        {/* GÜN DURUMU GÖSTERGESİ */}
        <div className="gun-durumu-gostergesi">
          <div 
            className="gun-durumu-nokta"
            style={{
              backgroundColor: gunAktif ? '#4CAF50' : '#F44336'
            }}
          ></div>
          <span className="gun-durumu-text">
            {gunAktif ? '✅ Gün Aktif' : '❌ Gün Başlatılmamış'}
          </span>
        </div>
      </div>
      
      {/* RAPOR KARTLARI */}
      <div className="rapor-grid">
        {raporlar.map((rapor) => {
          const isLocked = rapor.requiresActiveDay && !gunAktif;
          
          return (
            <div 
              key={rapor.id}
              className={`rapor-kart ${isLocked ? 'kilitli' : ''}`}
              onClick={() => !isLocked && handleRaporClick(rapor)}
              style={getCardStyle(rapor.color)}
              title={isLocked ? 'Gün başlatılmamış - Bu rapor kilitli' : rapor.description}
            >
              <div className="rapor-kart-ust">
                <div className="rapor-icon">
                  {rapor.icon}
                </div>
                <div className="rapor-info">
                  <h3>{rapor.title}</h3>
                  <p className="rapor-aciklama">{rapor.description}</p>
                  {isLocked && (
                    <div className="rapor-kilitli-uyari">
                      <span className="kilitli-icon">🔒</span>
                      <span className="kilitli-text">Gün başlatılmamış</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="rapor-arrow">
                {isLocked ? '🔒' : '→'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RaporlarIndex;