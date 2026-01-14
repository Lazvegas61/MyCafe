import React from 'react';

const GenelOzet = ({ data, yukleniyor }) => {
  if (yukleniyor && !data) {
    return (
      <div className="rapor-karti">
        <h3>📈 Genel Özet</h3>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rapor-karti">
        <h3>📈 Genel Özet</h3>
        <p>Veri bulunamadı</p>
      </div>
    );
  }

  const {
    toplamCiro,
    toplamTahsilat,
    toplamGider,
    netKazanc,
    gunDurumu,
    adisyonSayisi,
    acikAdisyonSayisi,
    aktifMasaSayisi
  } = data;

  return (
    <div className="rapor-karti genel-ozet">
      <h3>📈 Genel Özet</h3>
      
      <div className="ozet-grid">
        <div className="ozet-item">
          <span className="ozet-label">Toplam Ciro:</span>
          <span className="ozet-deger">{toplamCiro?.toFixed(2)} ₺</span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Toplam Tahsilat:</span>
          <span className="ozet-deger">{toplamTahsilat?.toFixed(2)} ₺</span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Toplam Gider:</span>
          <span className="ozet-deger">{toplamGider?.toFixed(2)} ₺</span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Net Kazanç:</span>
          <span className={`ozet-deger ${netKazanc >= 0 ? 'pozitif' : 'negatif'}`}>
            {netKazanc?.toFixed(2)} ₺
          </span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Gün Durumu:</span>
          <span className={`ozet-deger ${gunDurumu === 'acik' ? 'acik' : 'kapali'}`}>
            {gunDurumu === 'acik' ? '🔓 Açık' : '🔒 Kapalı'}
          </span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Adisyon Sayısı:</span>
          <span className="ozet-deger">{adisyonSayisi}</span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Açık Adisyon:</span>
          <span className="ozet-deger">{acikAdisyonSayisi}</span>
        </div>
        
        <div className="ozet-item">
          <span className="ozet-label">Aktif Masa:</span>
          <span className="ozet-deger">{aktifMasaSayisi}</span>
        </div>
      </div>
      
      {data.tarihAraligi?.start && (
        <div className="tarih-bilgisi">
          <small>
            Tarih Aralığı: {data.tarihAraligi.start} - {data.tarihAraligi.end || 'Bugün'}
          </small>
        </div>
      )}
    </div>
  );
};

export default GenelOzet;