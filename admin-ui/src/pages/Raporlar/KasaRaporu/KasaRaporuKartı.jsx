import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './KasaRaporuKartı.css';

const KasaRaporuKartı = () => {
  const { user, canViewKasa } = useAuth();
  const navigate = useNavigate();
  const [kasaData, setKasaData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Kullanıcının yetkisi yoksa gösterme
  if (!canViewKasa()) {
    return null;
  }

  // Debug için
  useEffect(() => {
    console.log('KasaRaporuKartı mounted');
    console.log('User:', user);
    console.log('Can view kasa:', canViewKasa());
  }, []);

  // Mock data - test için
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setKasaData({
        tahsilatlar: {
          nakit: 12540.75,
          kart: 8945.50,
          havaleEft: 3200.00,
          hesabaYaz: 1500.00
        },
        giderToplam: 2875.25,
        gunBilgisi: {
          acilisSaati: '08:30',
          sonGuncelleme: '18:45',
          gunDurumu: 'açık'
        }
      });
      setLoading(false);
    }, 500);
  }, []);

  const handleKartClick = () => {
    console.log('Kasa kartı tıklandı!');
    console.log('Navigating to /raporlar/gun-sonu');
    
    // 3 farklı yöntem deneyelim:
    try {
      // Yöntem 1: navigate
      navigate('/raporlar/gun-sonu');
      
      // Yöntem 2: window.location (fallback)
      // setTimeout(() => {
      //   window.location.href = '/raporlar/gun-sonu';
      // }, 100);
      
      // Yöntem 3: history API
      // window.history.pushState({}, '', '/raporlar/gun-sonu');
      // window.dispatchEvent(new Event('popstate'));
    } catch (error) {
      console.error('Navigation error:', error);
      // En garanti yöntem:
      window.location.href = '/raporlar/gun-sonu';
    }
  };

  const formatPara = (tutar) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(tutar);
  };

  if (loading) {
    return (
      <div className="kasa-raporu-karti loading">
        <div className="loading-spinner"></div>
        <p>Kasa verileri yükleniyor...</p>
      </div>
    );
  }

  if (!kasaData) {
    return (
      <div className="kasa-raporu-karti" onClick={handleKartClick}>
        <div className="kart-baslik">
          <h3>💰 Kasa Özeti (Test)</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Test modu - Tıklayın</p>
        </div>
      </div>
    );
  }

  const netKasa = Object.values(kasaData.tahsilatlar)
    .reduce((acc, curr) => acc + curr, 0) - kasaData.giderToplam;

  return (
    <div 
      className="kasa-raporu-karti"
      onClick={handleKartClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="kart-baslik">
        <h3>💰 Kasa Özeti</h3>
        <span className={`gun-durumu ${kasaData.gunBilgisi.gunDurumu}`}>
          {kasaData.gunBilgisi.gunDurumu === 'açık' ? '🔵 Gün Açık' : '🔴 Gün Kapalı'}
        </span>
      </div>

      <div className={`net-kasa ${netKasa >= 0 ? 'pozitif' : 'negatif'}`}>
        <div className="net-kasa-label">Net Kasa Durumu</div>
        <div className="net-kasa-tutar">{formatPara(netKasa)}</div>
      </div>

      <div className="tahsilat-grid">
        <div className="tahsilat-item">
          <span className="tahsilat-label">💵 Nakit</span>
          <span className="tahsilat-tutar">{formatPara(kasaData.tahsilatlar.nakit)}</span>
        </div>
        <div className="tahsilat-item">
          <span className="tahsilat-label">💳 Kart</span>
          <span className="tahsilat-tutar">{formatPara(kasaData.tahsilatlar.kart)}</span>
        </div>
        <div className="tahsilat-item">
          <span className="tahsilat-label">🏦 Havale/EFT</span>
          <span className="tahsilat-tutar">{formatPara(kasaData.tahsilatlar.havaleEft)}</span>
        </div>
        <div className="tahsilat-item">
          <span className="tahsilat-label">📝 Hesaba Yaz</span>
          <span className="tahsilat-tutar">{formatPara(kasaData.tahsilatlar.hesabaYaz)}</span>
        </div>
      </div>

      <div className="gun-bilgisi">
        <div className="gun-bilgisi-item">
          <span className="bilgi-label">Son Güncelleme:</span>
          <span className="bilgi-deger">{kasaData.gunBilgisi.sonGuncelleme}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
          Gün Sonu için tıklayın →
        </div>
      </div>
    </div>
  );
};

export default KasaRaporuKartı;