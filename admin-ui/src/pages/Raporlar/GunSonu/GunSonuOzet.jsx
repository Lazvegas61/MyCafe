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
  
  // Demo Data (API'den gelecek) - SIFIRLANDI
  const [gunListesi, setGunListesi] = useState([]);
  const [istatistikler, setIstatistikler] = useState({
    toplamGun: 0,
    toplamCiro: 0,
    ortalamaKar: 0,
    aktifMasa: 0
  });

  // Masa listesini localStorage'dan al
  const [masaListesi, setMasaListesi] = useState([]);

  useEffect(() => {
    // localStorage'dan masaları al
    const masalar = JSON.parse(localStorage.getItem('mc_masalar')) || [];
    setMasaListesi(masalar);
  }, []);

  // Filtreleme fonksiyonu
  const handleFiltrele = async () => {
    setYukleniyor(true);
    try {
      // localStorage'dan gün sonu raporlarını al
      const raporlar = JSON.parse(localStorage.getItem('mc_gunsonu_raporlar')) || [];
      
      // Filtreleme işlemleri
      let filtrelenmis = [...raporlar];
      
      // Tarih filtresi
      if (filtreTarih) {
        filtrelenmis = filtrelenmis.filter(rapor => 
          new Date(rapor.tarih).toISOString().split('T')[0] === filtreTarih
        );
      }
      
      // Masa filtresi
      if (filtreMasa) {
        filtrelenmis = filtrelenmis.filter(rapor =>
          rapor.masaHareketleri?.some(masa => masa.masa === filtreMasa)
        );
      }
      
      // Ödeme tipi filtresi
      if (filtreOdemeTipi) {
        filtrelenmis = filtrelenmis.filter(rapor => {
          if (filtreOdemeTipi === 'nakit') return rapor.ozet?.toplamNakit > 0;
          if (filtreOdemeTipi === 'kart') return rapor.ozet?.toplamKart > 0;
          if (filtreOdemeTipi === 'hesap') return rapor.ozet?.toplamHesap > 0;
          return true;
        });
      }
      
      // Sıralama
      filtrelenmis.sort((a, b) => {
        switch (siralama) {
          case 'tarih_desc':
            return new Date(b.tarih) - new Date(a.tarih);
          case 'tarih_asc':
            return new Date(a.tarih) - new Date(b.tarih);
          case 'ciro_desc':
            return (b.ozet?.toplamCiro || 0) - (a.ozet?.toplamCiro || 0);
          case 'ciro_asc':
            return (a.ozet?.toplamCiro || 0) - (b.ozet?.toplamCiro || 0);
          case 'kar_desc':
            return (b.ozet?.netKar || 0) - (a.ozet?.netKar || 0);
          case 'kar_asc':
            return (a.ozet?.netKar || 0) - (b.ozet?.netKar || 0);
          default:
            return 0;
        }
      });
      
      // Sayfalama
      const baslangic = (sayfa - 1) * 10;
      const bitis = baslangic + 10;
      const sayfalaraAyrilmis = filtrelenmis.slice(baslangic, bitis);
      
      setGunListesi(sayfalaraAyrilmis);
      
      // İstatistikler
      setIstatistikler({
        toplamGun: filtrelenmis.length,
        toplamCiro: filtrelenmis.reduce((sum, rapor) => sum + (rapor.ozet?.toplamCiro || 0), 0),
        ortalamaKar: filtrelenmis.length > 0 
          ? filtrelenmis.reduce((sum, rapor) => sum + (rapor.ozet?.netKar || 0), 0) / filtrelenmis.length
          : 0,
        aktifMasa: filtrelenmis.reduce((sum, rapor) => sum + (rapor.masaHareketleri?.length || 0), 0) / Math.max(filtrelenmis.length, 1)
      });
      
      setToplamSayfa(Math.ceil(filtrelenmis.length / 10));
      setYukleniyor(false);
      
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
    handleFiltrele();
  };

  // Sayfa değiştir
  const handleSayfaDegistir = (yeniSayfa) => {
    if (yeniSayfa < 1 || yeniSayfa > toplamSayfa) return;
    setSayfa(yeniSayfa);
  };

  // Kart tıklama fonksiyonu
  const handleKartTikla = (gunId) => {
    navigate(`/gun-sonu-rapor/${gunId}`);
  };

  // İlk yükleme
  useEffect(() => {
    handleFiltrele();
  }, [sayfa]);

  // Gün adını al
  const getGunAdi = (tarihStr) => {
    const gunler = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const tarih = new Date(tarihStr);
    return gunler[tarih.getDay()];
  };

  // Rozet belirle
  const getRozetler = (rapor) => {
    const rozetler = [];
    const netKar = rapor.ozet?.netKar || 0;
    const toplamCiro = rapor.ozet?.toplamCiro || 0;
    
    if (netKar > 2000) rozetler.push("Yüksek Kar");
    if (netKar < 500) rozetler.push("Düşük Kar");
    if (toplamCiro > 10000) rozetler.push("Rekor Satış");
    if ((rapor.masaHareketleri?.length || 0) > 15) rozetler.push("Yoğun Gün");
    
    if (rozetler.length === 0) {
      rozetler.push("Normal");
    }
    
    return rozetler;
  };

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
            {masaListesi.map((masa) => (
              <option key={masa.id} value={masa.masaNo}>
                {masa.masaNo} {masa.tip === 'bilardo' ? '(Bilardo)' : ''}
              </option>
            ))}
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
          <div className="degisim">
            {istatistikler.toplamGun > 0 ? '📊 Kayıtlı' : '📭 Yok'}
          </div>
        </div>
        
        <div className="istatistik-kutu">
          <h4>Toplam Ciro</h4>
          <div className="deger">{istatistikler.toplamCiro.toLocaleString()} ₺</div>
          <div className="degisim">
            {istatistikler.toplamCiro > 0 ? '💰 Gelir' : '💸 Yok'}
          </div>
        </div>
        
        <div className="istatistik-kutu">
          <h4>Ortalama Günlük Kar</h4>
          <div className="deger">{Math.round(istatistikler.ortalamaKar).toLocaleString()} ₺</div>
          <div className="degisim">
            {istatistikler.ortalamaKar > 0 ? '📈 Pozitif' : '📉 Negatif'}
          </div>
        </div>
        
        <div className="istatistik-kutu">
          <h4>Ort. Aktif Masa</h4>
          <div className="deger">{Math.round(istatistikler.aktifMasa)}</div>
          <div className="degisim">
            {istatistikler.aktifMasa > 5 ? '👥 Yoğun' : '👤 Normal'}
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
            {filtreTarih || filtreMasa || filtreOdemeTipi 
              ? "Seçtiğiniz filtre kriterlerine uygun gün sonu raporu bulunamadı."
              : "Henüz kayıtlı gün sonu raporu bulunmuyor."}
          </div>
        </div>
      ) : (
        <>
          <div className="gun-listesi">
            {gunListesi.map((gun) => (
              <div 
                className="gun-karti" 
                key={gun.id}
                onClick={() => handleKartTikla(gun.id)}
              >
                <div className="gun-karti-header">
                  <h4>{new Date(gun.tarih).toLocaleDateString('tr-TR')}</h4>
                  <div className="gun-karti-tarih">{getGunAdi(gun.tarih)}</div>
                </div>
                
                <div className="toplam">{gun.ozet?.netKar?.toLocaleString() || 0} ₺</div>
                
                <div className="meta">
                  <div className="meta-item">
                    <i className="fas fa-cash-register"></i>
                    <span>Ciro: {(gun.ozet?.toplamCiro || 0).toLocaleString()} ₺</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-clock"></i>
                    <span>{gun.acilis || '09:00'} - {gun.kapanis || '23:00'}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-chair"></i>
                    <span>{(gun.masaHareketleri?.length || 0)} Masa</span>
                  </div>
                </div>
                
                <div className="istatistik-bar">
                  <div 
                    className="istatistik-dolum" 
                    style={{ width: `${Math.min(((gun.ozet?.netKar || 0) / 10000) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="rozetler">
                  {getRozetler(gun).map((rozet, index) => {
                    let tip = "neutral";
                    if (rozet.includes("Yüksek") || rozet.includes("Rekor") || rozet.includes("Yoğun")) tip = "positive";
                    if (rozet.includes("Düşük")) tip = "negative";
                    
                    return (
                      <span key={index} className={`rozet ${tip}`}>
                        {rozet === "Yüksek Kar" && <i className="fas fa-chart-line"></i>}
                        {rozet === "Yoğun Gün" && <i className="fas fa-users"></i>}
                        {rozet === "Rekor Satış" && <i className="fas fa-trophy"></i>}
                        {rozet === "Normal" && <i className="fas fa-check"></i>}
                        {rozet === "Düşük Kar" && <i className="fas fa-arrow-down"></i>}
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