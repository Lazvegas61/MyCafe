import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GunSonuOzet.css";

export default function GunSonuOzet() {
  const navigate = useNavigate();
  
  // Filtre state'leri
  const [filtreTarih, setFiltreTarih] = useState('');
  const [filtreMasa, setFiltreMasa] = useState('');
  const [filtreOdemeTipi, setFiltreOdemeTipi] = useState('');
  const [siralama, setSiralama] = useState('tarih_desc');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  
  // Demo Data (API'den gelecek)
  const [gunListesi, setGunListesi] = useState([]);
  const [istatistikler, setIstatistikler] = useState({
    toplamGun: 0,
    toplamCiro: 0,
    ortalamaKar: 0,
    aktifMasa: 0
  });

  // Filtreleme fonksiyonu
  const handleFiltrele = async () => {
    setYukleniyor(true);
    try {
      // DEMO DATA
      setTimeout(() => {
        setGunListesi(demoGunListesi);
        setIstatistikler({
          toplamGun: 12,
          toplamCiro: 84560,
          ortalamaKar: 3240,
          aktifMasa: 8
        });
        setToplamSayfa(3);
        setYukleniyor(false);
      }, 800);
      
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      setYukleniyor(false);
    }
  };

  // Filtreleri sıfırla
  const handleSifirla = () => {
    setFiltreTarih('');
    setFiltreMasa('');
    setFiltreOdemeTipi('');
    setSiralama('tarih_desc');
    setSayfa(1);
  };

  // Sayfa değiştir
  const handleSayfaDegistir = (yeniSayfa) => {
    if (yeniSayfa < 1 || yeniSayfa > toplamSayfa) return;
    setSayfa(yeniSayfa);
  };

  // Kart tıklama fonksiyonu - DÜZELTİLDİ
  const handleKartTikla = (gunId) => {
    console.log('Kart tıklandı, ID:', gunId);
    // Doğru route'a yönlendir
    navigate(`/gun-sonu-rapor/${gunId}`);
  };

  // İlk yükleme
  useEffect(() => {
    handleFiltrele();
  }, [sayfa]);

  // Demo Data
  const demoGunListesi = [
    {
      id: 1,
      tarih: "20 Nisan 2024",
      gunAdi: "Cumartesi",
      acilis: "08:15",
      kapanis: "23:45",
      toplamCiro: 12450,
      nakit: 6450,
      kart: 4800,
      hesabaYaz: 1200,
      gider: 6750,
      netKar: 5700,
      masaSayisi: 12,
      ortalamaMasaSuresi: "1:45",
      enCokSatilanUrun: "Çay",
      odemeDagilimi: { nakit: 52, kart: 38, hesap: 10 },
      rozetler: ["Yüksek Kar", "Yoğun Gün", "Rekor Satış"]
    },
    {
      id: 2,
      tarih: "19 Nisan 2024",
      gunAdi: "Cuma",
      acilis: "08:30",
      kapanis: "23:30",
      toplamCiro: 9850,
      nakit: 5200,
      kart: 3650,
      hesabaYaz: 1000,
      gider: 5200,
      netKar: 4650,
      masaSayisi: 10,
      ortalamaMasaSuresi: "1:30",
      enCokSatilanUrun: "Tost",
      odemeDagilimi: { nakit: 53, kart: 37, hesap: 10 },
      rozetler: ["Normal", "İyi Satış"]
    },
    {
      id: 3,
      tarih: "18 Nisan 2024",
      gunAdi: "Perşembe",
      acilis: "09:00",
      kapanis: "22:45",
      toplamCiro: 7560,
      nakit: 4200,
      kart: 2860,
      hesabaYaz: 500,
      gider: 4100,
      netKar: 3460,
      masaSayisi: 8,
      ortalamaMasaSuresi: "1:20",
      enCokSatilanUrun: "Oralet",
      odemeDagilimi: { nakit: 56, kart: 38, hesap: 6 },
      rozetler: ["Orta", "Az Gider"]
    },
    {
      id: 4,
      tarih: "17 Nisan 2024",
      gunAdi: "Çarşamba",
      acilis: "09:15",
      kapanis: "22:30",
      toplamCiro: 8920,
      nakit: 5100,
      kart: 3320,
      hesabaYaz: 500,
      gider: 4800,
      netKar: 4120,
      masaSayisi: 9,
      ortalamaMasaSuresi: "1:25",
      enCokSatilanUrun: "Çay",
      odemeDagilimi: { nakit: 57, kart: 37, hesap: 6 },
      rozetler: ["İyi", "Stabil"]
    }
  ];

  return (
    <div className="gun-sonu-ozet-container">
      {/* HEADER */}
      <div className="gun-sonu-ozet-header">
        <div>
          <h2>Gün Sonu Raporları</h2>
          <span>İşletme performansınızı günlük olarak takip edin</span>
        </div>
        <div>
          <button className="btn" onClick={() => console.log('PDF Export')}>
            <i className="fas fa-file-pdf"></i> Tümünü PDF'ye Aktar
          </button>
        </div>
      </div>

      {/* FİLTRE BAR */}
      <div className="filtre-bar">
        <div className="filtre-grup">
          <label className="filtre-label">
            <i className="fas fa-calendar"></i> Tarih Aralığı
          </label>
          <input 
            type="date" 
            value={filtreTarih}
            onChange={(e) => setFiltreTarih(e.target.value)}
            className="filtre-input"
          />
        </div>
        
        <div className="filtre-grup">
          <label className="filtre-label">
            <i className="fas fa-utensils"></i> Masa No
          </label>
          <select 
            value={filtreMasa}
            onChange={(e) => setFiltreMasa(e.target.value)}
            className="filtre-select"
          >
            <option value="">Tüm Masalar</option>
            <option value="1">Masa 1</option>
            <option value="2">Masa 2</option>
            <option value="3">Masa 3</option>
            <option value="4">Masa 4</option>
            <option value="5">Masa 5</option>
            <option value="bilardo">Bilardo Masaları</option>
          </select>
        </div>
        
        <div className="filtre-grup">
          <label className="filtre-label">
            <i className="fas fa-credit-card"></i> Ödeme Tipi
          </label>
          <select 
            value={filtreOdemeTipi}
            onChange={(e) => setFiltreOdemeTipi(e.target.value)}
            className="filtre-select"
          >
            <option value="">Tüm Ödemeler</option>
            <option value="nakit">Nakit</option>
            <option value="kart">Kredi Kartı</option>
            <option value="hesap">Hesaba Yaz</option>
          </select>
        </div>
        
        <div className="filtre-grup">
          <label className="filtre-label">
            <i className="fas fa-sort-amount-down"></i> Sıralama
          </label>
          <select 
            value={siralama}
            onChange={(e) => setSiralama(e.target.value)}
            className="filtre-select"
          >
            <option value="tarih_desc">Tarih (Yeniden Eskiye)</option>
            <option value="tarih_asc">Tarih (Eskiden Yeniye)</option>
            <option value="ciro_desc">Ciro (Yüksekten Düşüğe)</option>
            <option value="ciro_asc">Ciro (Düşükten Yükseğe)</option>
            <option value="kar_desc">Kar (Yüksekten Düşüğe)</option>
            <option value="kar_asc">Kar (Düşükten Yükseğe)</option>
          </select>
        </div>
        
        <div className="filtre-grup">
          <button className="btn" onClick={handleFiltrele} disabled={yukleniyor}>
            {yukleniyor ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Yükleniyor...
              </>
            ) : (
              <>
                <i className="fas fa-filter"></i> Filtrele
              </>
            )}
          </button>
        </div>
        
        <div className="filtre-grup">
          <button className="btn btn-secondary" onClick={handleSifirla}>
            <i className="fas fa-redo"></i> Sıfırla
          </button>
        </div>
      </div>

      {/* İSTATİSTİK ÖZET BAR */}
      <div className="istatistik-ozet-bar">
        <div className="istatistik-kutu">
          <h4>Toplam Gün</h4>
          <div className="deger">{istatistikler.toplamGun}</div>
          <div className="degisim artis">
            <i className="fas fa-arrow-up"></i> +2 geçen aya göre
          </div>
        </div>
        
        <div className="istatistik-kutu">
          <h4>Toplam Ciro</h4>
          <div className="deger">{istatistikler.toplamCiro.toLocaleString()} ₺</div>
          <div className="degisim artis">
            <i className="fas fa-arrow-up"></i> %12.5 artış
          </div>
        </div>
        
        <div className="istatistik-kutu">
          <h4>Ortalama Günlük Kar</h4>
          <div className="deger">{istatistikler.ortalamaKar.toLocaleString()} ₺</div>
          <div className="degisim artis">
            <i className="fas fa-arrow-up"></i> %8.3 artış
          </div>
        </div>
        
        <div className="istatistik-kutu">
          <h4>Aktif Masa Ort.</h4>
          <div className="deger">{istatistikler.aktifMasa}</div>
          <div className="degisim azalis">
            <i className="fas fa-arrow-down"></i> %5 azalma
          </div>
        </div>
      </div>

      {/* GÜN KARTLARI */}
      {yukleniyor ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Gün sonu raporları yükleniyor...</div>
        </div>
      ) : gunListesi.length === 0 ? (
        <div className="gun-sonu-empty">
          <div className="empty-icon">📊</div>
          <div className="empty-text">Gün sonu raporu bulunamadı</div>
          <div className="empty-subtext">
            Seçtiğiniz filtre kriterlerine uygun gün sonu raporu bulunamadı.
            Lütfen farklı tarih veya filtrelerle tekrar deneyin.
          </div>
        </div>
      ) : (
        <>
          <div className="gun-listesi">
            {gunListesi.map((gun) => (
              <div 
                className="gun-karti" 
                key={gun.id}
                onClick={() => handleKartTikla(gun.id)} // DÜZELTİLDİ
              >
                <div className="gun-karti-header">
                  <h4>{gun.tarih}</h4>
                  <div className="gun-karti-tarih">{gun.gunAdi}</div>
                </div>
                
                <div className="toplam">{gun.netKar.toLocaleString()} ₺</div>
                
                <div className="meta">
                  <div className="meta-item">
                    <i className="fas fa-cash-register"></i>
                    <span>Ciro: {gun.toplamCiro.toLocaleString()} ₺</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-clock"></i>
                    <span>{gun.acilis} - {gun.kapanis}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-chair"></i>
                    <span>{gun.masaSayisi} Masa</span>
                  </div>
                </div>
                
                <div className="istatistik-bar">
                  <div 
                    className="istatistik-dolum" 
                    style={{ width: `${(gun.netKar / 10000) * 100}%` }}
                  ></div>
                </div>
                
                <div className="rozetler">
                  {gun.rozetler.map((rozet, index) => {
                    let tip = "neutral";
                    if (rozet.includes("Yüksek") || rozet.includes("Rekor")) tip = "positive";
                    if (rozet.includes("Düşük") || rozet.includes("Az")) tip = "negative";
                    
                    return (
                      <span key={index} className={`rozet ${tip}`}>
                        {rozet === "Yüksek Kar" && <i className="fas fa-chart-line"></i>}
                        {rozet === "Yoğun Gün" && <i className="fas fa-users"></i>}
                        {rozet === "Rekor Satış" && <i className="fas fa-trophy"></i>}
                        {rozet === "Normal" && <i className="fas fa-check"></i>}
                        {rozet === "İyi Satış" && <i className="fas fa-thumbs-up"></i>}
                        {rozet === "Orta" && <i className="fas fa-minus"></i>}
                        {rozet === "Az Gider" && <i className="fas fa-coins"></i>}
                        {rozet === "İyi" && <i className="fas fa-smile"></i>}
                        {rozet === "Stabil" && <i className="fas fa-balance-scale"></i>}
                        {rozet}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* SAYFALAMA */}
          {toplamSayfa > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => handleSayfaDegistir(sayfa - 1)}
                disabled={sayfa === 1}
              >
                <i className="fas fa-chevron-left"></i> Önceki
              </button>
              
              <div className="page-numbers">
                {[...Array(Math.min(5, toplamSayfa))].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <div 
                      key={pageNum}
                      className={`page-number ${pageNum === sayfa ? 'active' : ''}`}
                      onClick={() => handleSayfaDegistir(pageNum)}
                    >
                      {pageNum}
                    </div>
                  );
                })}
                {toplamSayfa > 5 && (
                  <>
                    <span className="page-dots">...</span>
                    <div 
                      className={`page-number ${toplamSayfa === sayfa ? 'active' : ''}`}
                      onClick={() => handleSayfaDegistir(toplamSayfa)}
                    >
                      {toplamSayfa}
                    </div>
                  </>
                )}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => handleSayfaDegistir(sayfa + 1)}
                disabled={sayfa === toplamSayfa}
              >
                Sonraki <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}