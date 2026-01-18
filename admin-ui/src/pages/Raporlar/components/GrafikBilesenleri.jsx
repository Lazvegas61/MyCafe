import React, { useEffect, useRef } from 'react';
import './GrafikBilesenleri.css';

/* ===========================
   GÜVENLİ SAYI YARDIMCILARI
=========================== */
const num = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fixed = (v, d = 2) => num(v).toFixed(d);

/* ===========================
   ÖDEME DAĞILIM DONUT
=========================== */
export const OdemeDagilimDonut = ({ data }) => {
  const donutRef = useRef(null);

  const nakit = num(data?.nakit);
  const kart = num(data?.kart);
  const hesap = num(data?.hesap);

  const total = nakit + kart + hesap;

  useEffect(() => {
    if (!donutRef.current || total <= 0) return;

    const style = donutRef.current.style;
    style.setProperty('--nakit-percent', (nakit / total) * 100);
    style.setProperty('--kart-percent', (kart / total) * 100);
    style.setProperty('--hesap-percent', (hesap / total) * 100);
  }, [nakit, kart, hesap, total]);

  if (total <= 0) {
    return (
      <div className="bos-grafik">
        <p>Ödeme verisi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="grafik-container">
      <div className="donut-chart-wrapper">
        <div className="donut-chart" ref={donutRef}>
          <div className="donut-segment nakit"></div>
          <div className="donut-segment kart"></div>
          <div className="donut-segment hesap"></div>
          <div className="donut-center">
            <span className="donut-total">{fixed(total)} ₺</span>
            <span className="donut-label">Toplam</span>
          </div>
        </div>

        <div className="donut-legend">
          <div className="legend-item">
            <span className="legend-color nakit"></span>
            <div className="legend-info">
              <span className="legend-label">Nakit</span>
              <span className="legend-value">
                {fixed(nakit)} ₺ ({fixed((nakit / total) * 100, 1)}%)
              </span>
            </div>
          </div>

          <div className="legend-item">
            <span className="legend-color kart"></span>
            <div className="legend-info">
              <span className="legend-label">Kart</span>
              <span className="legend-value">
                {fixed(kart)} ₺ ({fixed((kart / total) * 100, 1)}%)
              </span>
            </div>
          </div>

          <div className="legend-item">
            <span className="legend-color hesap"></span>
            <div className="legend-info">
              <span className="legend-label">Hesap</span>
              <span className="legend-value">
                {fixed(hesap)} ₺ ({fixed((hesap / total) * 100, 1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===========================
   GÜNLÜK GELİR ÇİZGİ
=========================== */
export const GunlukGelirCizgi = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bos-grafik">
        <p>Günlük gelir verisi bulunamadı.</p>
      </div>
    );
  }

  const gelirler = data.map(d => num(d?.gelir));
  const maxGelir = Math.max(...gelirler, 0);
  const chartHeight = 200;

  return (
    <div className="grafik-container">
      <div className="cizgi-grafik">
        <div className="chart-bars">
          {data.map((gun, index) => {
            const gelir = num(gun?.gelir);
            const barHeight = maxGelir > 0 ? (gelir / maxGelir) * chartHeight : 0;

            return (
              <div key={index} className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{ height: `${barHeight}px` }}
                  title={`${gun?.tarih || '-'}: ${fixed(gelir)} ₺`}
                >
                  <div className="bar-value">{fixed(gelir, 0)}</div>
                </div>
                <div className="bar-label">
                  {gun?.tarih
                    ? new Date(gun.tarih).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'short'
                      })
                    : '--'}
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

/* ===========================
   KATEGORİ DAĞILIM YATAY
=========================== */
export const KategoriDagilimYatay = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bos-grafik">
        <p>Kategori verisi bulunamadı.</p>
      </div>
    );
  }

  const tutarlar = data.map(d => num(d?.toplamTutar));
  const maxTutar = Math.max(...tutarlar, 0);

  return (
    <div className="grafik-container">
      <div className="yatay-bars">
        {data.map((kategori, index) => {
          const tutar = num(kategori?.toplamTutar);
          const barWidth = maxTutar > 0 ? (tutar / maxTutar) * 100 : 0;

          return (
            <div key={index} className="yatay-bar-wrapper">
              <div className="bar-label">
                <span className="kategori-ad">{kategori?.kategoriAdi || '-'}</span>
                <span className="kategori-adet">{num(kategori?.satisAdedi)} adet</span>
              </div>
              <div className="bar-container">
                <div className="yatay-bar" style={{ width: `${barWidth}%` }}>
                  <span className="bar-tutar">{fixed(tutar)} ₺</span>
                </div>
              </div>
              <div className="bar-yuzde">
                {fixed((tutar / (maxTutar || 1)) * 100, 0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ===========================
   ÜRÜN SATIŞ KAR
=========================== */
export const UrunSatisKar = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
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
          const gelir = num(urun?.gelir);
          const maliyet = num(urun?.maliyet);
          const kar = num(urun?.kar);
          const karYuzde = maliyet > 0 ? (kar / maliyet) * 100 : 0;

          return (
            <div key={index} className="kar-row">
              <div className="kar-col urun">
                <span className="urun-ad">{urun?.urunAdi || '-'}</span>
                <span className="urun-adet">{num(urun?.adet)} adet</span>
              </div>
              <div className="kar-col gelir">{fixed(gelir)} ₺</div>
              <div className="kar-col maliyet">{fixed(maliyet)} ₺</div>
              <div className="kar-col kar">
                <div className={`kar-deger ${kar >= 0 ? 'pozitif' : 'negatif'}`}>
                  {fixed(kar)} ₺
                  <span className="kar-yuzde">({fixed(karYuzde, 1)}%)</span>
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
