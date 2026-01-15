// File: admin-ui/src/pages/Raporlar/components/GrafikBilesenleri.jsx
import React, { useEffect, useRef } from 'react';
import './GrafikBilesenleri.css';

// Basit CSS grafikleri - Chart.js kullanmadan
export const OdemeDagilimDonut = ({ data }) => {
  const donutRef = useRef(null);
  
  useEffect(() => {
    if (!data || !donutRef.current) return;
    
    const total = data.nakit + data.kart + data.hesap;
    if (total === 0) return;
    
    const nakitYuzde = (data.nakit / total) * 100;
    const kartYuzde = (data.kart / total) * 100;
    const hesapYuzde = (data.hesap / total) * 100;
    
    // CSS custom properties ile donut chart oluştur
    const style = donutRef.current.style;
    style.setProperty('--nakit-percent', nakitYuzde);
    style.setProperty('--kart-percent', kartYuzde);
    style.setProperty('--hesap-percent', hesapYuzde);
  }, [data]);

  if (!data || (data.nakit === 0 && data.kart === 0 && data.hesap === 0)) {
    return (
      <div className="bos-grafik">
        <p>Ödeme verisi bulunamadı.</p>
      </div>
    );
  }

  const total = data.nakit + data.kart + data.hesap;

  return (
    <div className="grafik-container">
      <div className="donut-chart-wrapper">
        <div className="donut-chart" ref={donutRef}>
          <div className="donut-segment nakit"></div>
          <div className="donut-segment kart"></div>
          <div className="donut-segment hesap"></div>
          <div className="donut-center">
            <span className="donut-total">{total.toFixed(2)} ₺</span>
            <span className="donut-label">Toplam</span>
          </div>
        </div>
        
        <div className="donut-legend">
          <div className="legend-item">
            <span className="legend-color nakit"></span>
            <div className="legend-info">
              <span className="legend-label">Nakit</span>
              <span className="legend-value">
                {data.nakit.toFixed(2)} ₺ ({((data.nakit / total) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color kart"></span>
            <div className="legend-info">
              <span className="legend-label">Kart</span>
              <span className="legend-value">
                {data.kart.toFixed(2)} ₺ ({((data.kart / total) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-color hesap"></span>
            <div className="legend-info">
              <span className="legend-label">Hesap</span>
              <span className="legend-value">
                {data.hesap.toFixed(2)} ₺ ({((data.hesap / total) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GunlukGelirCizgi = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-grafik">
        <p>Günlük gelir verisi bulunamadı.</p>
      </div>
    );
  }

  const maxGelir = Math.max(...data.map(d => d.gelir));
  const chartHeight = 200;
  
  return (
    <div className="grafik-container">
      <div className="cizgi-grafik">
        <div className="chart-bars">
          {data.map((gun, index) => {
            const barHeight = maxGelir > 0 ? (gun.gelir / maxGelir) * chartHeight : 0;
            return (
              <div key={index} className="chart-bar-wrapper">
                <div 
                  className="chart-bar"
                  style={{ height: `${barHeight}px` }}
                  title={`${gun.tarih}: ${gun.gelir.toFixed(2)} ₺`}
                >
                  <div className="bar-value">{gun.gelir.toFixed(0)}</div>
                </div>
                <div className="bar-label">
                  {new Date(gun.tarih).toLocaleDateString('tr-TR', { 
                    day: '2-digit',
                    month: 'short'
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="chart-axis">
          <div className="axis-line"></div>
        </div>
      </div>
    </div>
  );
};

export const KategoriDagilimYatay = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-grafik">
        <p>Kategori verisi bulunamadı.</p>
      </div>
    );
  }

  const maxTutar = Math.max(...data.map(d => d.toplamTutar));
  
  return (
    <div className="grafik-container">
      <div className="yatay-bars">
        {data.map((kategori, index) => {
          const barWidth = maxTutar > 0 ? (kategori.toplamTutar / maxTutar) * 100 : 0;
          
          return (
            <div key={index} className="yatay-bar-wrapper">
              <div className="bar-label">
                <span className="kategori-ad">{kategori.kategoriAdi}</span>
                <span className="kategori-adet">{kategori.satisAdedi} adet</span>
              </div>
              <div className="bar-container">
                <div 
                  className="yatay-bar"
                  style={{ width: `${barWidth}%` }}
                >
                  <span className="bar-tutar">{kategori.toplamTutar.toFixed(2)} ₺</span>
                </div>
              </div>
              <div className="bar-yuzde">
                {maxTutar > 0 ? ((kategori.toplamTutar / maxTutar) * 100).toFixed(0) : 0}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const UrunSatisKar = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-grafik">
        <p>Ürün kar verisi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="grafik-container">
      <div className="kar-grafik">
        <div className="kar-header">
          <div className="kar-col urun">Ürün</div>
          <div className="kar-col gelir">Gelir</div>
          <div className="kar-col maliyet">Maliyet</div>
          <div className="kar-col kar">Kar</div>
        </div>
        
        {data.map((urun, index) => {
          const karYuzde = urun.maliyet > 0 ? ((urun.kar / urun.maliyet) * 100) : 100;
          
          return (
            <div key={index} className="kar-row">
              <div className="kar-col urun">
                <span className="urun-ad">{urun.urunAdi}</span>
                <span className="urun-adet">{urun.adet} adet</span>
              </div>
              <div className="kar-col gelir">
                {urun.gelir.toFixed(2)} ₺
              </div>
              <div className="kar-col maliyet">
                {urun.maliyet.toFixed(2)} ₺
              </div>
              <div className="kar-col kar">
                <div className={`kar-deger ${urun.kar >= 0 ? 'pozitif' : 'negatif'}`}>
                  {urun.kar.toFixed(2)} ₺
                  <span className="kar-yuzde">
                    ({karYuzde.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default {
  OdemeDagilimDonut,
  GunlukGelirCizgi,
  KategoriDagilimYatay,
  UrunSatisKar
};