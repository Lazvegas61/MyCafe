// src/pages/Raporlar/GunSonuRaporu/GunSonuRaporu.jsx
import React from 'react';

const GunSonuRaporu = ({ data, yukleniyor }) => {
  if (yukleniyor && !data) {
    return (
      <div className="detay-yukleniyor">
        <div className="spinner"></div>
        <p>Gün sonu raporları yükleniyor...</p>
      </div>
    );
  }

  if (!data || !data.sonGunler || data.sonGunler.length === 0) {
    return (
      <div className="detay-bos">
        <h4>📭 Gün Sonu Verisi Yok</h4>
        <p>Henüz gün sonu yapılmamış. Gün sonu yapmak için sidebar'dan "Gün Sonu" butonunu kullanın.</p>
      </div>
    );
  }

  const { sonGunler, gunlukOrtalamaCiro, enYuksekGun, enDusukGun, toplamGunSayisi } = data;

  return (
    <div className="gunsonu-detay">
      {/* Özet Bilgiler */}
      <div className="gunsonu-ozet">
        <div className="ozet-kart">
          <h4>📊 Genel Özet</h4>
          <div className="ozet-icerik">
            <div className="ozet-item">
              <span>Toplam Gün:</span>
              <strong>{toplamGunSayisi}</strong>
            </div>
            <div className="ozet-item">
              <span>Ortalama Günlük Ciro:</span>
              <strong>{gunlukOrtalamaCiro.toFixed(2)} ₺</strong>
            </div>
            <div className="ozet-item">
              <span>En Yüksek Gün:</span>
              <strong className="yuksek">{enYuksekGun?.toplamCiro?.toFixed(2)} ₺</strong>
            </div>
            <div className="ozet-item">
              <span>En Düşük Gün:</span>
              <strong className="dusuk">{enDusukGun?.toplamCiro?.toFixed(2)} ₺</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Gün Listesi Tablosu */}
      <div className="gun-listesi">
        <h4>📅 Son 10 Gün Sonu Raporu</h4>
        <div className="gun-tablosu">
          <div className="tablo-baslik">
            <div className="tablo-hucre">Tarih</div>
            <div className="tablo-hucre">Toplam Ciro</div>
            <div className="tablo-hucre">Nakit</div>
            <div className="tablo-hucre">Kredi Kartı</div>
            <div className="tablo-hucre">Bilardo</div>
            <div className="tablo-hucre">Adisyon</div>
            <div className="tablo-hucre">Süre</div>
          </div>
          
          {sonGunler.map((gun, index) => (
            <div key={index} className={`tablo-satir ${index % 2 === 0 ? 'cift' : 'tek'}`}>
              <div className="tablo-hucre">{gun.tarih}</div>
              <div className="tablo-hucre">
                <strong>{gun.toplamCiro.toFixed(2)} ₺</strong>
              </div>
              <div className="tablo-hucre">{gun.nakit.toFixed(2)} ₺</div>
              <div className="tablo-hucre">{gun.krediKarti.toFixed(2)} ₺</div>
              <div className="tablo-hucre">{gun.bilardoCiro.toFixed(2)} ₺</div>
              <div className="tablo-hucre">{gun.toplamAdisyon}</div>
              <div className="tablo-hucre">{gun.sure}</div>
            </div>
          ))}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="gunsonu-istatistikler">
        <h4>📈 İstatistikler</h4>
        <div className="istatistik-grid">
          <div className="istatistik-kart">
            <h5>Toplam Ciro</h5>
            <div className="istatistik-deger">
              {sonGunler.reduce((sum, gun) => sum + gun.toplamCiro, 0).toFixed(2)} ₺
            </div>
          </div>
          <div className="istatistik-kart">
            <h5>Toplam Nakit</h5>
            <div className="istatistik-deger">
              {sonGunler.reduce((sum, gun) => sum + gun.nakit, 0).toFixed(2)} ₺
            </div>
          </div>
          <div className="istatistik-kart">
            <h5>Toplam Kart</h5>
            <div className="istatistik-deger">
              {sonGunler.reduce((sum, gun) => sum + gun.krediKarti, 0).toFixed(2)} ₺
            </div>
          </div>
          <div className="istatistik-kart">
            <h5>Ortalama Adisyon</h5>
            <div className="istatistik-deger">
              {Math.round(sonGunler.reduce((sum, gun) => sum + gun.toplamAdisyon, 0) / sonGunler.length)}
            </div>
          </div>
        </div>
      </div>

      {/* Grafik (Basit) */}
      <div className="gunsonu-grafik">
        <h4>📊 Günlük Ciro Grafiği</h4>
        <div className="grafik-alani">
          <div className="grafik-cubuklar">
            {sonGunler.slice(0, 7).map((gun, index) => {
              const maxCiro = Math.max(...sonGunler.map(g => g.toplamCiro));
              const yuzde = (gun.toplamCiro / maxCiro) * 100;
              
              return (
                <div key={index} className="grafik-cubuk-item">
                  <div className="cubuk-label">{gun.tarih.split('-').slice(1).join('-')}</div>
                  <div className="cubuk-container">
                    <div 
                      className="cubuk" 
                      style={{ height: `${yuzde}%` }}
                      title={`${gun.toplamCiro.toFixed(2)} ₺`}
                    >
                      <span className="cubuk-deger">{gun.toplamCiro.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PDF Export Butonu */}
      <div className="export-kisayollar">
        <button className="export-btn">
          📄 PDF Olarak Kaydet
        </button>
        <button className="export-btn">
          📊 Excel'e Aktar
        </button>
        <button className="export-btn">
          🖨️ Yazdır
        </button>
      </div>
    </div>
  );
};

export default GunSonuRaporu;