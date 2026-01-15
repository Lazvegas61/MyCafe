// File: admin-ui/src/pages/Raporlar/components/TabloBilesenleri.jsx
import React from 'react';
import './TabloBilesenleri.css';

export const MasaDetayTablosu = ({ data, onMasaClick }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-tablo">
        <p>Gösterilecek masa verisi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="tablo-container">
      <table className="masa-detay-tablo">
        <thead>
          <tr>
            <th>Masa No</th>
            <th>Tip</th>
            <th>Açılış</th>
            <th>Kapanış</th>
            <th>Süre</th>
            <th>Toplam Tutar</th>
            <th>Ödeme Tipi</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {data.map((masa, index) => {
            const acilis = masa.acilisZamani ? new Date(masa.acilisZamani) : null;
            const kapanis = masa.kapanisZamani ? new Date(masa.kapanisZamani) : null;
            let sure = '-';
            
            if (acilis && kapanis) {
              const farkMs = kapanis - acilis;
              const dakika = Math.floor(farkMs / 60000);
              const saat = Math.floor(dakika / 60);
              const kalanDakika = dakika % 60;
              sure = saat > 0 ? `${saat}sa ${kalanDakika}d` : `${kalanDakika}d`;
            }

            return (
              <tr 
                key={index} 
                onClick={() => onMasaClick && onMasaClick(masa)}
                className={onMasaClick ? 'tiklanabilir-satir' : ''}
              >
                <td>
                  <span className={`masa-no ${masa.masaTipi === 'BİLARDO' ? 'bilardo-masa' : 'normal-masa'}`}>
                    {masa.masaNo}
                  </span>
                </td>
                <td>
                  <span className={`masa-tipi ${masa.masaTipi === 'BİLARDO' ? 'bilardo-badge' : 'normal-badge'}`}>
                    {masa.masaTipi || 'NORMAL'}
                  </span>
                </td>
                <td>
                  {acilis ? acilis.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : '-'}
                </td>
                <td>
                  {kapanis ? kapanis.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : '-'}
                </td>
                <td>{sure}</td>
                <td className="tutar-hucre">
                  <strong>{parseFloat(masa.toplamTutar || 0).toFixed(2)} ₺</strong>
                </td>
                <td>
                  <span className={`odeme-badge ${masa.odemeTipi?.toLowerCase() || 'nakit'}`}>
                    {masa.odemeTipi || 'Nakit'}
                  </span>
                </td>
                <td>
                  <span className={`durum-badge ${masa.durum?.toLowerCase() || 'kapali'}`}>
                    {masa.durum || 'Kapalı'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="toplam-text">
              <strong>Toplam:</strong>
            </td>
            <td className="toplam-tutar">
              <strong>
                {data.reduce((sum, masa) => sum + parseFloat(masa.toplamTutar || 0), 0).toFixed(2)} ₺
              </strong>
            </td>
            <td colSpan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export const UrunListesiTablosu = ({ data, title = "Ürün Satışları" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-tablo">
        <p>Gösterilecek ürün verisi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="tablo-container">
      <div className="tablo-baslik">
        <h3>{title}</h3>
      </div>
      <table className="urun-tablo">
        <thead>
          <tr>
            <th>Sıra</th>
            <th>Ürün Adı</th>
            <th>Kategori</th>
            <th>Satış Adedi</th>
            <th>Birim Fiyat</th>
            <th>Toplam Tutar</th>
            <th>Karlılık</th>
          </tr>
        </thead>
        <tbody>
          {data.map((urun, index) => {
            const birimFiyat = parseFloat(urun.birimFiyat || urun.satisFiyati || 0);
            const satisAdedi = parseInt(urun.satisAdedi || 0);
            const toplamTutar = parseFloat(urun.toplamTutar || birimFiyat * satisAdedi);
            const maliyet = parseFloat(urun.maliyet || 0);
            const kar = toplamTutar - (maliyet * satisAdedi);
            const karYuzdesi = maliyet > 0 ? ((kar / (maliyet * satisAdedi)) * 100) : 100;

            return (
              <tr key={index}>
                <td className="sira-hucre">{index + 1}</td>
                <td className="urun-ad">
                  <strong>{urun.urunAdi}</strong>
                  {urun.kritik && <span className="kritik-badge">!</span>}
                </td>
                <td>{urun.kategori || '-'}</td>
                <td className="sayi-hucre">
                  <span className="aded-badge">{satisAdedi} adet</span>
                </td>
                <td className="fiyat-hucre">{birimFiyat.toFixed(2)} ₺</td>
                <td className="tutar-hucre">
                  <strong>{toplamTutar.toFixed(2)} ₺</strong>
                </td>
                <td className={`kar-hucre ${kar >= 0 ? 'karli' : 'zararli'}`}>
                  {kar.toFixed(2)} ₺
                  <span className="kar-yuzde">
                    ({karYuzdesi.toFixed(1)}%)
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const KasaHareketleriTablosu = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-tablo">
        <p>Gösterilecek kasa hareketi bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="tablo-container">
      <table className="kasa-tablo">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Saat</th>
            <th>İşlem Tipi</th>
            <th>Açıklama</th>
            <th>Masa/Adisyon</th>
            <th>Nakit</th>
            <th>Kart</th>
            <th>Hesap</th>
            <th>Toplam</th>
          </tr>
        </thead>
        <tbody>
          {data.map((hareket, index) => {
            const tarih = new Date(hareket.tarih || hareket.zaman);
            const nakit = parseFloat(hareket.nakit || 0);
            const kart = parseFloat(hareket.kart || 0);
            const hesap = parseFloat(hareket.hesap || 0);
            const toplam = nakit + kart + hesap;

            return (
              <tr key={index} className={`hareket-${hareket.tip?.toLowerCase() || 'gelir'}`}>
                <td>{tarih.toLocaleDateString('tr-TR')}</td>
                <td>{tarih.toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</td>
                <td>
                  <span className={`islem-tipi ${hareket.tip?.toLowerCase() || 'gelir'}`}>
                    {hareket.tip === 'GIDER' ? 'Gider' : 'Gelir'}
                  </span>
                </td>
                <td className="aciklama-hucre">{hareket.aciklama || '-'}</td>
                <td>
                  {hareket.masaNo ? (
                    <span className="masa-ref">{hareket.masaNo}</span>
                  ) : hareket.adisyonId ? (
                    <span className="adisyon-ref">#{hareket.adisyonId}</span>
                  ) : '-'}
                </td>
                <td className={`tutar-hucre ${nakit > 0 ? 'nakit' : ''}`}>
                  {nakit > 0 ? `${nakit.toFixed(2)} ₺` : '-'}
                </td>
                <td className={`tutar-hucre ${kart > 0 ? 'kart' : ''}`}>
                  {kart > 0 ? `${kart.toFixed(2)} ₺` : '-'}
                </td>
                <td className={`tutar-hucre ${hesap > 0 ? 'hesap' : ''}`}>
                  {hesap > 0 ? `${hesap.toFixed(2)} ₺` : '-'}
                </td>
                <td className="toplam-tutar">
                  <strong>{toplam.toFixed(2)} ₺</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="toplam-text">
              <strong>Genel Toplam:</strong>
            </td>
            <td>
              <strong>
                {data.reduce((sum, h) => sum + parseFloat(h.nakit || 0), 0).toFixed(2)} ₺
              </strong>
            </td>
            <td>
              <strong>
                {data.reduce((sum, h) => sum + parseFloat(h.kart || 0), 0).toFixed(2)} ₺
              </strong>
            </td>
            <td>
              <strong>
                {data.reduce((sum, h) => sum + parseFloat(h.hesap || 0), 0).toFixed(2)} ₺
              </strong>
            </td>
            <td className="genel-toplam">
              <strong>
                {data.reduce((sum, h) => {
                  const nakit = parseFloat(h.nakit || 0);
                  const kart = parseFloat(h.kart || 0);
                  const hesap = parseFloat(h.hesap || 0);
                  return sum + nakit + kart + hesap;
                }, 0).toFixed(2)} ₺
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export const BasitTablosu = ({ columns, data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bos-tablo">
        <p>{title ? `${title} verisi bulunamadı.` : 'Gösterilecek veri bulunamadı.'}</p>
      </div>
    );
  }

  return (
    <div className="tablo-container">
      {title && (
        <div className="tablo-baslik">
          <h3>{title}</h3>
        </div>
      )}
      <table className="basit-tablo">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => {
                const value = row[col.key];
                let displayValue = value;
                
                // Format based on column type
                if (col.type === 'currency') {
                  displayValue = `${parseFloat(value || 0).toFixed(2)} ₺`;
                } else if (col.type === 'number') {
                  displayValue = parseInt(value || 0).toLocaleString('tr-TR');
                } else if (col.type === 'date') {
                  displayValue = value ? new Date(value).toLocaleDateString('tr-TR') : '-';
                } else if (col.type === 'datetime') {
                  displayValue = value ? new Date(value).toLocaleString('tr-TR') : '-';
                } else if (col.type === 'time') {
                  displayValue = value ? new Date(value).toLocaleTimeString('tr-TR') : '-';
                } else if (col.type === 'percent') {
                  displayValue = `${parseFloat(value || 0).toFixed(1)}%`;
                }
                
                return (
                  <td 
                    key={colIndex} 
                    className={`${col.type || 'text'} ${col.align || 'left'}`}
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default {
  MasaDetayTablosu,
  UrunListesiTablosu,
  KasaHareketleriTablosu,
  BasitTablosu
};