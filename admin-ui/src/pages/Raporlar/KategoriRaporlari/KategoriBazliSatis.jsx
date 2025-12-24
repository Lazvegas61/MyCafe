import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const KategoriBazliSatis = () => {
  const navigate = useNavigate();
  
  // State'ler
  const [filtreBaslangic, setFiltreBaslangic] = useState('');
  const [filtreBitis, setFiltreBitis] = useState('');
  const [filtreKategori, setFiltreKategori] = useState('');
  const [filtreUrun, setFiltreUrun] = useState('');
  const [siralama, setSiralama] = useState('satis_desc');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  
  // Kategori verileri
  const [kategoriler, setKategoriler] = useState([]);
  const [istatistikler, setIstatistikler] = useState({
    toplamSatis: 0,
    toplamKar: 0,
    ortalamaSatis: 0,
    enCokSatisKategori: '',
    enKarliKategori: '',
    toplamUrunCesidi: 0
  });

  // Demo veri - API'den gelecek
  const demoKategoriler = [
    {
      id: 1,
      kategoriAdi: "Sıcak İçecekler",
      urunSayisi: 8,
      toplamSatis: 1250,
      toplamKar: 875,
      satisAdedi: 425,
      ortalamaFiyat: 12.5,
      karOrani: 70,
      enCokSatilanUrun: "Çay",
      trend: "artis",
      renk: "#e74c3c"
    },
    {
      id: 2,
      kategoriAdi: "Soğuk İçecekler",
      urunSayisi: 6,
      toplamSatis: 980,
      toplamKar: 686,
      satisAdedi: 320,
      ortalamaFiyat: 10.5,
      karOrani: 70,
      enCokSatilanUrun: "Kola",
      trend: "artis",
      renk: "#3498db"
    },
    {
      id: 3,
      kategoriAdi: "Yiyecekler",
      urunSayisi: 12,
      toplamSatis: 2150,
      toplamKar: 1505,
      satisAdedi: 180,
      ortalamaFiyat: 18.2,
      karOrani: 70,
      enCokSatilanUrun: "Tost",
      trend: "stabil",
      renk: "#2ecc71"
    },
    {
      id: 4,
      kategoriAdi: "Tatlılar",
      urunSayisi: 5,
      toplamSatis: 780,
      toplamKar: 546,
      satisAdedi: 95,
      ortalamaFiyat: 15.6,
      karOrani: 70,
      enCokSatilanUrun: "Sütlaç",
      trend: "artis",
      renk: "#f39c12"
    },
    {
      id: 5,
      kategoriAdi: "Meyveler",
      urunSayisi: 4,
      toplamSatis: 420,
      toplamKar: 294,
      satisAdedi: 75,
      ortalamaFiyat: 8.4,
      karOrani: 70,
      enCokSatilanUrun: "Meyve Tabağı",
      trend: "azalis",
      renk: "#9b59b6"
    },
    {
      id: 6,
      kategoriAdi: "Atıştırmalıklar",
      urunSayisi: 7,
      toplamSatis: 650,
      toplamKar: 455,
      satisAdedi: 120,
      ortalamaFiyat: 9.3,
      karOrani: 70,
      enCokSatilanUrun: "Patates Kızartması",
      trend: "artis",
      renk: "#1abc9c"
    },
    {
      id: 7,
      kategoriAdi: "Bilardo",
      urunSayisi: 1,
      toplamSatis: 1850,
      toplamKar: 1665,
      satisAdedi: 210,
      ortalamaFiyat: 40.5,
      karOrani: 90,
      enCokSatilanUrun: "Bilardo Saati",
      trend: "stabil",
      renk: "#34495e"
    },
    {
      id: 8,
      kategoriAdi: "Özel Servisler",
      urunSayisi: 3,
      toplamSatis: 950,
      toplamKar: 665,
      satisAdedi: 45,
      ortalamaFiyat: 25.0,
      karOrani: 70,
      enCokSatilanUrun: "Kahvaltı Tabağı",
      trend: "artis",
      renk: "#d35400"
    }
  ];

  // Demo ürün satışları
  const demoUrunSatislari = [
    {
      id: 1,
      kategori: "Sıcak İçecekler",
      urunAdi: "Çay",
      satisAdedi: 150,
      toplamTutar: 300,
      ortalamaFiyat: 2,
      kar: 210,
      karOrani: 70,
      trend: "artis"
    },
    {
      id: 2,
      kategori: "Sıcak İçecekler",
      urunAdi: "Nescafe",
      satisAdedi: 85,
      toplamTutar: 680,
      ortalamaFiyat: 8,
      kar: 476,
      karOrani: 70,
      trend: "stabil"
    },
    {
      id: 3,
      kategori: "Yiyecekler",
      urunAdi: "Tost",
      satisAdedi: 75,
      toplamTutar: 1125,
      ortalamaFiyat: 15,
      kar: 787,
      karOrani: 70,
      trend: "artis"
    },
    {
      id: 4,
      kategori: "Soğuk İçecekler",
      urunAdi: "Kola",
      satisAdedi: 120,
      toplamTutar: 840,
      ortalamaFiyat: 7,
      kar: 588,
      karOrani: 70,
      trend: "artis"
    },
    {
      id: 5,
      kategori: "Bilardo",
      urunAdi: "Bilardo Saati",
      satisAdedi: 210,
      toplamTutar: 1850,
      ortalamaFiyat: 40.5,
      kar: 1665,
      karOrani: 90,
      trend: "stabil"
    }
  ];

  // Filtreleme fonksiyonu
  const handleFiltrele = async () => {
    setYukleniyor(true);
    try {
      // DEMO DATA - API'den gelecek
      setTimeout(() => {
        setKategoriler(demoKategoriler);
        
        // İstatistik hesapla
        const toplamSatis = demoKategoriler.reduce((sum, k) => sum + k.toplamSatis, 0);
        const toplamKar = demoKategoriler.reduce((sum, k) => sum + k.toplamKar, 0);
        const ortalamaSatis = toplamSatis / demoKategoriler.length;
        
        // En çok satış yapan kategori
        const enCokSatis = demoKategoriler.reduce((max, k) => 
          k.toplamSatis > max.toplamSatis ? k : max
        );
        
        // En karlı kategori
        const enKarli = demoKategoriler.reduce((max, k) => 
          k.toplamKar > max.toplamKar ? k : max
        );
        
        // Toplam ürün çeşidi
        const toplamUrunCesidi = demoKategoriler.reduce((sum, k) => sum + k.urunSayisi, 0);
        
        setIstatistikler({
          toplamSatis,
          toplamKar,
          ortalamaSatis,
          enCokSatisKategori: enCokSatis.kategoriAdi,
          enKarliKategori: enKarli.kategoriAdi,
          toplamUrunCesidi
        });
        
        setToplamSayfa(2);
        setYukleniyor(false);
      }, 800);
      
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      setYukleniyor(false);
    }
  };

  // Filtreleri sıfırla
  const handleSifirla = () => {
    setFiltreBaslangic('');
    setFiltreBitis('');
    setFiltreKategori('');
    setFiltreUrun('');
    setSiralama('satis_desc');
    setSayfa(1);
  };

  // Sayfa değiştir
  const handleSayfaDegistir = (yeniSayfa) => {
    if (yeniSayfa < 1 || yeniSayfa > toplamSayfa) return;
    setSayfa(yeniSayfa);
  };

  // Kategori detay
  const handleKategoriDetay = (kategoriId) => {
    alert(`Kategori detay: ${kategoriId}`);
  };

  // İlk yükleme
  useEffect(() => {
    handleFiltrele();
  }, [sayfa]);

  // CSS Styles
  const styles = `
  .kategori-rapor-container {
    padding: 20px;
    background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
    min-height: 100vh;
    font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    color: #2c2416;
    width: 100%;
  }

  /* HEADER */
  .kategori-header {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 24px 32px;
    border-radius: 20px;
    margin-bottom: 24px;
    box-shadow: 0 8px 30px rgba(139, 94, 60, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.15);
    position: relative;
    overflow: hidden;
    width: 100%;
  }

  .kategori-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #2ecc71, #3498db, #2ecc71);
  }

  .kategori-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    width: 100%;
  }

  .kategori-title h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    background: linear-gradient(135deg, #2ecc71 0%, #3498db 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }

  .kategori-title h1 .alt-baslik {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #8b5e3c;
    margin-top: 6px;
    letter-spacing: 0;
  }

  /* BUTON GRUP */
  .kategori-btn-group {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .kategori-btn {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: inherit;
  }

  .kategori-btn-primary {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.25);
  }

  .kategori-btn-secondary {
    background: white;
    color: #2ecc71;
    border: 2px solid #2ecc71;
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.1);
  }

  .kategori-btn-tertiary {
    background: linear-gradient(135deg, #f0e6d6 0%, #e8d9c7 100%);
    color: #6b4e2e;
    border: 2px solid rgba(212, 175, 55, 0.3);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
  }

  .kategori-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(46, 204, 113, 0.3);
  }

  /* FİLTRE BAR */
  .kategori-filtre-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: flex-end;
    flex-wrap: wrap;
    padding: 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 248, 245, 0.9) 100%);
    border-radius: 18px;
    border: 1px solid rgba(46, 204, 113, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 20px rgba(46, 204, 113, 0.05);
  }

  .kategori-filtre-grup {
    flex: 1;
    min-width: 180px;
  }

  .kategori-filtre-label {
    display: block;
    font-size: 12px;
    margin-bottom: 8px;
    color: #6b4e2e;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .kategori-filtre-bar select,
  .kategori-filtre-bar input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(46, 204, 113, 0.3);
    background: rgba(255, 255, 255, 0.8);
    color: #3a2c1a;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.05);
  }

  .kategori-filtre-bar select:focus,
  .kategori-filtre-bar input:focus {
    outline: none;
    border-color: #2ecc71;
    box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
    background: white;
  }

  /* ANA İÇERİK KONTEYNERİ */
  .kategori-ana-container {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;
    width: 100%;
    min-height: calc(100vh - 200px);
  }

  @media (max-width: 1200px) {
    .kategori-ana-container {
      grid-template-columns: 1fr;
    }
  }

  /* SOL TARAF - GENİŞ ALAN */
  .kategori-sol-taraf {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }

  /* SAĞ TARAF - SABİT ÖZET PANELİ */
  .kategori-sag-taraf {
    position: sticky;
    top: 20px;
    height: fit-content;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  /* İSTATİSTİK BAR */
  .kategori-istatistik-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .kategori-istatistik-kutu {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(46, 204, 113, 0.15);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(46, 204, 113, 0.05);
  }

  .kategori-istatistik-kutu:hover {
    transform: translateY(-5px);
    border-color: rgba(46, 204, 113, 0.3);
    box-shadow: 0 12px 25px rgba(46, 204, 113, 0.1);
  }

  .kategori-istatistik-kutu::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #2ecc71, #3498db);
  }

  .kategori-istatistik-kutu h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #6b4e2e;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    opacity: 0.9;
  }

  .kategori-istatistik-kutu .deger {
    font-size: 28px;
    font-weight: 900;
    color: #2ecc71;
    line-height: 1;
    margin: 8px 0;
    text-shadow: 0 2px 4px rgba(46, 204, 113, 0.2);
  }

  /* KATEGORİ KARTLARI */
  .kategori-kart-container {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.12);
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .kategori-kart-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #2ecc71, #3498db);
  }

  .kategori-kart-container h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 800;
    color: #3a2c1a;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(46, 204, 113, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kategori-kart-container h2 i {
    color: #2ecc71;
    font-size: 18px;
  }

  .kategori-kart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .kategori-kart {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(46, 204, 113, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(46, 204, 113, 0.05);
    cursor: pointer;
  }

  .kategori-kart:hover {
    transform: translateY(-8px);
    border-color: rgba(46, 204, 113, 0.3);
    box-shadow: 0 15px 30px rgba(46, 204, 113, 0.1);
  }

  .kategori-kart::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--kategori-renk), transparent);
  }

  .kategori-kart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .kategori-kart-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: #3a2c1a;
    flex: 1;
  }

  .kategori-kart-urun-sayisi {
    font-size: 13px;
    color: #6b4e2e;
    font-weight: 600;
    background: rgba(46, 204, 113, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid rgba(46, 204, 113, 0.3);
  }

  .kategori-kart-satis {
    font-size: 32px;
    font-weight: 900;
    color: var(--kategori-renk);
    margin: 16px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .kategori-kart-detay {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .kategori-kart-detay-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .kategori-kart-detay-label {
    font-size: 12px;
    color: #6b4e2e;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .kategori-kart-detay-deger {
    font-size: 16px;
    font-weight: 800;
    color: #3a2c1a;
  }

  .kategori-kart-trend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--trend-renk);
    color: white;
    width: fit-content;
  }

  .kategori-kart-trend.artis {
    --trend-renk: rgba(46, 204, 113, 0.2);
    color: #27ae60;
  }

  .kategori-kart-trend.azalis {
    --trend-renk: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  }

  .kategori-kart-trend.stabil {
    --trend-renk: rgba(243, 156, 18, 0.2);
    color: #f39c12;
  }

  /* ÜRÜN SATIŞ TABLOSU */
  .urun-satis-tablo-container {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.12);
    width: 100%;
    margin-top: 24px;
  }

  .urun-satis-tablo-container h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 800;
    color: #3a2c1a;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(46, 204, 113, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .urun-satis-tablo-container h2 i {
    color: #2ecc71;
    font-size: 18px;
  }

  .urun-satis-tablo {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 14px;
    border: 1px solid rgba(46, 204, 113, 0.15);
    border-radius: 14px;
    overflow: hidden;
    background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
    box-shadow: 0 4px 15px rgba(46, 204, 113, 0.05);
  }

  .urun-satis-tablo thead {
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(52, 152, 219, 0.1) 100%);
  }

  .urun-satis-tablo th {
    text-align: left;
    padding: 16px;
    font-weight: 700;
    color: #6b4e2e;
    border-bottom: 2px solid rgba(46, 204, 113, 0.2);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .urun-satis-tablo td {
    padding: 14px 16px;
    color: #3a2c1a;
    border-bottom: 1px solid rgba(46, 204, 113, 0.1);
    font-weight: 500;
  }

  .urun-satis-tablo tbody tr:last-child td {
    border-bottom: none;
  }

  .urun-satis-tablo tbody tr:hover {
    background: rgba(46, 204, 113, 0.05);
  }

  /* ÖZET KART */
  .kategori-ozet-kart {
    background: linear-gradient(135deg, #3a2c1a 0%, #4a3823 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 12px 35px rgba(58, 44, 26, 0.3);
    border: 1px solid rgba(46, 204, 113, 0.3);
    color: white;
    position: sticky;
    top: 20px;
    height: fit-content;
    overflow: hidden;
  }

  .kategori-ozet-kart h2 {
    margin: 0 0 24px 0;
    font-size: 22px;
    font-weight: 800;
    color: #f5e6d3;
    padding-bottom: 14px;
    border-bottom: 2px solid rgba(46, 204, 113, 0.4);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kategori-ozet-kart h2 i {
    color: #2ecc71;
    font-size: 20px;
    background: rgba(46, 204, 113, 0.2);
    padding: 10px;
    border-radius: 12px;
  }

  .kategori-ozet-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 15px;
    transition: padding 0.2s ease;
  }

  .kategori-ozet-row:hover {
    padding-left: 8px;
    padding-right: 8px;
  }

  .kategori-ozet-row:last-child {
    border-bottom: none;
  }

  .kategori-ozet-row .label {
    color: #c9b699;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kategori-ozet-row .label i {
    font-size: 13px;
    opacity: 0.8;
  }

  .kategori-ozet-row .value {
    font-weight: 700;
    font-size: 16px;
    color: #f5e6d3;
  }

  .kategori-ozet-row.toplam-satis .value {
    color: #2ecc71;
    text-shadow: 0 2px 4px rgba(46, 204, 113, 0.3);
  }

  .kategori-ozet-row.toplam-kar .value {
    color: #f39c12;
    text-shadow: 0 2px 4px rgba(243, 156, 18, 0.3);
  }

  .kategori-ozet-row.en-cok-satis .value {
    color: #2ecc71;
    font-size: 18px;
    font-weight: 900;
    text-shadow: 0 2px 8px rgba(46, 204, 113, 0.5);
  }

  .kategori-ozet-row.en-karli .value {
    color: #f39c12;
    font-size: 18px;
    font-weight: 900;
    text-shadow: 0 2px 8px rgba(243, 156, 18, 0.5);
  }

  /* DAĞILIM GRAFİĞİ */
  .kategori-dagilim-container {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.12);
    width: 100%;
    margin-top: 24px;
  }

  .kategori-dagilim-container h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 800;
    color: #3a2c1a;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kategori-dagilim-container h3 i {
    color: #2ecc71;
  }

  .kategori-dagilim-listesi {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .kategori-dagilim-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  }

  .kategori-dagilim-item:last-child {
    border-bottom: none;
  }

  .kategori-dagilim-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .kategori-dagilim-renk {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }

  .kategori-dagilim-adi {
    font-weight: 600;
    color: #3a2c1a;
  }

  .kategori-dagilim-oran {
    font-weight: 700;
    color: #2ecc71;
  }

  .kategori-dagilim-bar {
    height: 8px;
    background: rgba(46, 204, 113, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
  }

  .kategori-dagilim-dolum {
    height: 100%;
    border-radius: 4px;
  }

  /* BOŞ DURUM */
  .kategori-empty-state {
    text-align: center;
    padding: 60px 20px;
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    border-radius: 16px;
    border: 1px solid rgba(212, 175, 55, 0.15);
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.05);
    grid-column: 1 / -1;
  }

  .kategori-empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
    color: #2ecc71;
  }

  .kategori-empty-text {
    font-size: 20px;
    margin-bottom: 12px;
    color: #3a2c1a;
    font-weight: 700;
  }

  .kategori-empty-subtext {
    font-size: 14px;
    color: #6b4e2e;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.6;
    opacity: 0.8;
  }

  /* SAYFALAMA */
  .kategori-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(46, 204, 113, 0.1);
  }

  .kategori-pagination-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(52, 152, 219, 0.1) 100%);
    color: #6b4e2e;
    border: 1px solid rgba(46, 204, 113, 0.3);
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .kategori-pagination-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    color: white;
    border-color: #2ecc71;
    transform: translateY(-2px);
  }

  .kategori-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .kategori-page-numbers {
    display: flex;
    gap: 8px;
  }

  .kategori-page-number {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(52, 152, 219, 0.1) 100%);
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    color: #6b4e2e;
    transition: all 0.3s ease;
    border: 1px solid rgba(46, 204, 113, 0.1);
  }

  .kategori-page-number:hover {
    background: linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(52, 152, 219, 0.2) 100%);
    transform: translateY(-2px);
  }

  .kategori-page-number.active {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
  }

  /* YÜKLEME */
  .kategori-loading-state {
    text-align: center;
    padding: 100px 20px;
    background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
    border-radius: 20px;
    border: 1px solid rgba(212, 175, 55, 0.15);
    grid-column: 1 / -1;
  }

  .kategori-loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(46, 204, 113, 0.1);
    border-top-color: #2ecc71;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }

  .kategori-loading-text {
    color: #2ecc71;
    font-size: 16px;
    font-weight: 600;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* RESPONSIVE */
  @media (max-width: 1400px) {
    .kategori-ana-container {
      grid-template-columns: 1fr;
    }
    
    .kategori-sag-taraf {
      position: static;
      margin-top: 20px;
    }
  }

  @media (max-width: 768px) {
    .kategori-rapor-container {
      padding: 16px;
    }
    
    .kategori-header {
      padding: 20px;
    }
    
    .kategori-title h1 {
      font-size: 28px;
    }
    
    .kategori-filtre-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    
    .kategori-filtre-grup {
      min-width: 100%;
    }
    
    .kategori-btn-group {
      flex-direction: column;
    }
    
    .kategori-btn {
      width: 100%;
      justify-content: center;
    }
    
    .kategori-istatistik-bar {
      grid-template-columns: 1fr 1fr;
    }
    
    .kategori-kart-grid {
      grid-template-columns: 1fr;
    }
    
    .urun-satis-tablo {
      display: block;
      overflow-x: auto;
    }
  }

  @media (max-width: 480px) {
    .kategori-istatistik-bar {
      grid-template-columns: 1fr;
    }
    
    .kategori-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .kategori-kart-detay {
      grid-template-columns: 1fr;
    }
  }
  `;

  // CSS'i head'e ekle
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Kategori dağılımı hesapla
  const kategoriDagilimi = {};
  kategoriler.forEach(kategori => {
    const adi = kategori.kategoriAdi;
    if (!kategoriDagilimi[adi]) {
      kategoriDagilimi[adi] = kategori.toplamSatis;
    }
  });

  const toplamSatis = Object.values(kategoriDagilimi).reduce((a, b) => a + b, 0);

  return (
    <div className="kategori-rapor-container">
      {/* HEADER */}
      <div className="kategori-header">
        <div className="kategori-title">
          <h1>
            Kategori Bazlı Satışlar
            <span className="alt-baslik">Kategori performans analizi</span>
          </h1>
          
          <div className="kategori-btn-group">
            <button className="kategori-btn kategori-btn-tertiary" onClick={() => navigate('/raporlar')}>
              <i className="fas fa-arrow-left"></i> Geri Dön
            </button>
            <button className="kategori-btn kategori-btn-secondary">
              <i className="fas fa-chart-line"></i> Detaylı Analiz
            </button>
          </div>
        </div>

        <div className="kategori-btn-group">
          <button className="kategori-btn kategori-btn-primary">
            <i className="fas fa-file-pdf"></i> PDF İndir
          </button>
          <button className="kategori-btn kategori-btn-secondary">
            <i className="fas fa-file-excel"></i> Excel Çıkart
          </button>
          <button className="kategori-btn kategori-btn-tertiary">
            <i className="fas fa-print"></i> Yazdır
          </button>
        </div>
      </div>

      {/* FİLTRE BAR */}
      <div className="kategori-filtre-bar">
        <div className="kategori-filtre-grup">
          <label className="kategori-filtre-label">
            <i className="fas fa-calendar"></i> Başlangıç Tarihi
          </label>
          <input 
            type="date" 
            value={filtreBaslangic}
            onChange={(e) => setFiltreBaslangic(e.target.value)}
          />
        </div>
        
        <div className="kategori-filtre-grup">
          <label className="kategori-filtre-label">
            <i className="fas fa-calendar-check"></i> Bitiş Tarihi
          </label>
          <input 
            type="date" 
            value={filtreBitis}
            onChange={(e) => setFiltreBitis(e.target.value)}
          />
        </div>
        
        <div className="kategori-filtre-grup">
          <label className="kategori-filtre-label">
            <i className="fas fa-tags"></i> Kategori
          </label>
          <select 
            value={filtreKategori}
            onChange={(e) => setFiltreKategori(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {demoKategoriler.map(kategori => (
              <option key={kategori.id} value={kategori.kategoriAdi}>
                {kategori.kategoriAdi}
              </option>
            ))}
          </select>
        </div>
        
        <div className="kategori-filtre-grup">
          <label className="kategori-filtre-label">
            <i className="fas fa-utensils"></i> Ürün
          </label>
          <select 
            value={filtreUrun}
            onChange={(e) => setFiltreUrun(e.target.value)}
          >
            <option value="">Tüm Ürünler</option>
            <option value="Çay">Çay</option>
            <option value="Tost">Tost</option>
            <option value="Kola">Kola</option>
            <option value="Bilardo">Bilardo</option>
          </select>
        </div>
        
        <div className="kategori-filtre-grup">
          <label className="kategori-filtre-label">
            <i className="fas fa-sort-amount-down"></i> Sıralama
          </label>
          <select 
            value={siralama}
            onChange={(e) => setSiralama(e.target.value)}
          >
            <option value="satis_desc">Satış (Yüksekten Düşüğe)</option>
            <option value="satis_asc">Satış (Düşükten Yükseğe)</option>
            <option value="kar_desc">Kar (Yüksekten Düşüğe)</option>
            <option value="kar_asc">Kar (Düşükten Yükseğe)</option>
            <option value="urun_desc">Ürün Sayısı (Çoktan Aza)</option>
          </select>
        </div>
        
        <div className="kategori-filtre-grup">
          <button className="kategori-btn kategori-btn-primary" onClick={handleFiltrele} disabled={yukleniyor}>
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
        
        <div className="kategori-filtre-grup">
          <button className="kategori-btn kategori-btn-tertiary" onClick={handleSifirla}>
            <i className="fas fa-redo"></i> Sıfırla
          </button>
        </div>
      </div>

      {/* ANA İÇERİK */}
      {yukleniyor ? (
        <div className="kategori-loading-state">
          <div className="kategori-loading-spinner"></div>
          <div className="kategori-loading-text">Kategori verileri yükleniyor...</div>
        </div>
      ) : kategoriler.length === 0 ? (
        <div className="kategori-empty-state">
          <div className="kategori-empty-icon">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div className="kategori-empty-text">Kategori verisi bulunamadı</div>
          <div className="kategori-empty-subtext">
            Seçtiğiniz filtre kriterlerine uygun kategori verisi bulunamadı.
            Lütfen farklı tarih veya filtrelerle tekrar deneyin.
          </div>
        </div>
      ) : (
        <div className="kategori-ana-container">
          {/* SOL TARAF */}
          <div className="kategori-sol-taraf">
            {/* İSTATİSTİK BAR */}
            <div className="kategori-istatistik-bar">
              <div className="kategori-istatistik-kutu">
                <h4>Toplam Satış</h4>
                <div className="deger">{istatistikler.toplamSatis.toLocaleString()} ₺</div>
                <div style={{ fontSize: '13px', color: '#2ecc71', fontWeight: '600' }}>
                  <i className="fas fa-chart-line"></i> Tüm kategoriler toplamı
                </div>
              </div>
              
              <div className="kategori-istatistik-kutu">
                <h4>Toplam Kar</h4>
                <div className="deger">{istatistikler.toplamKar.toLocaleString()} ₺</div>
                <div style={{ fontSize: '13px', color: '#f39c12', fontWeight: '600' }}>
                  <i className="fas fa-coins"></i> Net kar marjı
                </div>
              </div>
              
              <div className="kategori-istatistik-kutu">
                <h4>Kategori Sayısı</h4>
                <div className="deger">{kategoriler.length}</div>
                <div style={{ fontSize: '13px', color: '#3498db', fontWeight: '600' }}>
                  <i className="fas fa-tags"></i> Aktif kategori
                </div>
              </div>
              
              <div className="kategori-istatistik-kutu">
                <h4>Ürün Çeşidi</h4>
                <div className="deger">{istatistikler.toplamUrunCesidi}</div>
                <div style={{ fontSize: '13px', color: '#9b59b6', fontWeight: '600' }}>
                  <i className="fas fa-box"></i> Toplam ürün sayısı
                </div>
              </div>
            </div>

            {/* KATEGORİ KARTLARI */}
            <div className="kategori-kart-container">
              <h2><i className="fas fa-tags"></i> Kategori Performansı</h2>
              <div className="kategori-kart-grid">
                {kategoriler.map((kategori) => (
                  <div 
                    key={kategori.id}
                    className="kategori-kart"
                    style={{
                      '--kategori-renk': kategori.renk
                    }}
                    onClick={() => handleKategoriDetay(kategori.id)}
                  >
                    <div className="kategori-kart-header">
                      <h3>{kategori.kategoriAdi}</h3>
                      <span className="kategori-kart-urun-sayisi">
                        {kategori.urunSayisi} ürün
                      </span>
                    </div>
                    
                    <div className="kategori-kart-satis">
                      {kategori.toplamSatis.toLocaleString()} ₺
                    </div>
                    
                    <div className="kategori-kart-detay">
                      <div className="kategori-kart-detay-item">
                        <span className="kategori-kart-detay-label">Toplam Kar</span>
                        <span className="kategori-kart-detay-deger" style={{ color: kategori.renk }}>
                          {kategori.toplamKar.toLocaleString()} ₺
                        </span>
                      </div>
                      <div className="kategori-kart-detay-item">
                        <span className="kategori-kart-detay-label">Satış Adedi</span>
                        <span className="kategori-kart-detay-deger">
                          {kategori.satisAdedi}
                        </span>
                      </div>
                      <div className="kategori-kart-detay-item">
                        <span className="kategori-kart-detay-label">Ort. Fiyat</span>
                        <span className="kategori-kart-detay-deger">
                          {kategori.ortalamaFiyat} ₺
                        </span>
                      </div>
                      <div className="kategori-kart-detay-item">
                        <span className="kategori-kart-detay-label">Kar Oranı</span>
                        <span className="kategori-kart-detay-deger" style={{ color: '#27ae60' }}>
                          %{kategori.karOrani}
                        </span>
                      </div>
                    </div>
                    
                    <div className="kategori-kart-trend">
                      <i className={`fas fa-${kategori.trend === 'artis' ? 'arrow-up' : kategori.trend === 'azalis' ? 'arrow-down' : 'minus'}`}></i>
                      <span>{kategori.trend === 'artis' ? 'Artış' : kategori.trend === 'azalis' ? 'Azalış' : 'Stabil'}</span>
                      <span>• {kategori.enCokSatilanUrun}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ÜRÜN SATIŞ TABLOSU */}
            <div className="urun-satis-tablo-container">
              <h2><i className="fas fa-chart-bar"></i> En Çok Satan Ürünler</h2>
              <table className="urun-satis-tablo">
                <thead>
                  <tr>
                    <th>Ürün Adı</th>
                    <th>Kategori</th>
                    <th>Satış Adedi</th>
                    <th>Toplam Tutar</th>
                    <th>Ort. Fiyat</th>
                    <th>Kar</th>
                    <th>Kar Oranı</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {demoUrunSatislari.map((urun) => (
                    <tr key={urun.id}>
                      <td><strong>{urun.urunAdi}</strong></td>
                      <td>{urun.kategori}</td>
                      <td>{urun.satisAdedi}</td>
                      <td><strong>{urun.toplamTutar.toLocaleString()} ₺</strong></td>
                      <td>{urun.ortalamaFiyat} ₺</td>
                      <td style={{ color: '#27ae60', fontWeight: '800' }}>
                        {urun.kar.toLocaleString()} ₺
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: 'rgba(46, 204, 113, 0.1)',
                          color: '#27ae60',
                          border: '1px solid rgba(46, 204, 113, 0.3)'
                        }}>
                          %{urun.karOrani}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: urun.trend === 'artis' ? 'rgba(46, 204, 113, 0.1)' : 
                                     urun.trend === 'azalis' ? 'rgba(231, 76, 60, 0.1)' : 
                                     'rgba(243, 156, 18, 0.1)',
                          color: urun.trend === 'artis' ? '#27ae60' : 
                                 urun.trend === 'azalis' ? '#e74c3c' : 
                                 '#f39c12',
                          border: urun.trend === 'artis' ? '1px solid rgba(46, 204, 113, 0.3)' : 
                                  urun.trend === 'azalis' ? '1px solid rgba(231, 76, 60, 0.3)' : 
                                  '1px solid rgba(243, 156, 18, 0.3)'
                        }}>
                          {urun.trend === 'artis' ? '📈 Artış' : urun.trend === 'azalis' ? '📉 Azalış' : '📊 Stabil'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SAĞ TARAF - SABİT ÖZET PANELİ */}
          <div className="kategori-sag-taraf">
            <div className="kategori-ozet-kart">
              <h2><i className="fas fa-chart-pie"></i> Kategori Özeti</h2>
              
              <div className="kategori-ozet-row toplam-satis">
                <span className="label">
                  <i className="fas fa-cash-register"></i> Toplam Satış
                </span>
                <span className="value">{istatistikler.toplamSatis.toLocaleString()} ₺</span>
              </div>
              
              <div className="kategori-ozet-row toplam-kar">
                <span className="label">
                  <i className="fas fa-coins"></i> Toplam Kar
                </span>
                <span className="value">{istatistikler.toplamKar.toLocaleString()} ₺</span>
              </div>
              
              <div className="kategori-ozet-row en-cok-satis">
                <span className="label">
                  <i className="fas fa-trophy"></i> En Çok Satış
                </span>
                <span className="value">{istatistikler.enCokSatisKategori}</span>
              </div>
              
              <div className="kategori-ozet-row en-karli">
                <span className="label">
                  <i className="fas fa-crown"></i> En Karlı
                </span>
                <span className="value">{istatistikler.enKarliKategori}</span>
              </div>

              {/* HIZLI İSTATİSTİKLER */}
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '16px', color: '#f5e6d3', marginBottom: '12px' }}>
                  <i className="fas fa-tachometer-alt"></i> Performans Özeti
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '12px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      color: '#2ecc71',
                      marginBottom: '4px'
                    }}>
                      {kategoriler.length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      Kategori
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '12px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      color: '#3498db',
                      marginBottom: '4px'
                    }}>
                      {istatistikler.toplamUrunCesidi}
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      Ürün Çeşidi
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '12px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      color: '#f39c12',
                      marginBottom: '4px'
                    }}>
                      {istatistikler.ortalamaSatis.toFixed(0)} ₺
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      Ort. Kategori
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    padding: '12px', 
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      color: '#9b59b6',
                      marginBottom: '4px'
                    }}>
                      %{((istatistikler.toplamKar / istatistikler.toplamSatis) * 100).toFixed(1)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      Genel Kar Oranı
                    </div>
                  </div>
                </div>
              </div>

              {/* KATEGORİ DAĞILIMI */}
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '16px', color: '#f5e6d3', marginBottom: '12px' }}>
                  <i className="fas fa-chart-bar"></i> Satış Dağılımı
                </h3>
                <div className="kategori-dagilim-listesi">
                  {Object.entries(kategoriDagilimi).slice(0, 5).map(([kategori, satis]) => {
                    const oran = ((satis / toplamSatis) * 100).toFixed(1);
                    const kategoriObj = kategoriler.find(k => k.kategoriAdi === kategori);
                    const renk = kategoriObj?.renk || '#2ecc71';
                    
                    return (
                      <div key={kategori} className="kategori-dagilim-item">
                        <div className="kategori-dagilim-info">
                          <div 
                            className="kategori-dagilim-renk" 
                            style={{ background: renk }}
                          ></div>
                          <span className="kategori-dagilim-adi">{kategori}</span>
                        </div>
                        <span className="kategori-dagilim-oran">%{oran}</span>
                        <div className="kategori-dagilim-bar">
                          <div 
                            className="kategori-dagilim-dolum" 
                            style={{ 
                              width: `${oran}%`, 
                              background: renk 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAYFALAMA */}
      {toplamSayfa > 1 && !yukleniyor && kategoriler.length > 0 && (
        <div className="kategori-pagination">
          <button 
            className="kategori-pagination-btn" 
            onClick={() => handleSayfaDegistir(sayfa - 1)}
            disabled={sayfa === 1}
          >
            <i className="fas fa-chevron-left"></i> Önceki
          </button>
          
          <div className="kategori-page-numbers">
            {[...Array(Math.min(5, toplamSayfa))].map((_, index) => {
              const pageNum = index + 1;
              return (
                <div 
                  key={pageNum}
                  className={`kategori-page-number ${pageNum === sayfa ? 'active' : ''}`}
                  onClick={() => handleSayfaDegistir(pageNum)}
                >
                  {pageNum}
                </div>
              );
            })}
            {toplamSayfa > 5 && (
              <>
                <span style={{ padding: '0 8px', color: '#b8a98c', display: 'flex', alignItems: 'center' }}>...</span>
                <div 
                  className={`kategori-page-number ${toplamSayfa === sayfa ? 'active' : ''}`}
                  onClick={() => handleSayfaDegistir(toplamSayfa)}
                >
                  {toplamSayfa}
                </div>
              </>
            )}
          </div>
          
          <button 
            className="kategori-pagination-btn"
            onClick={() => handleSayfaDegistir(sayfa + 1)}
            disabled={sayfa === toplamSayfa}
          >
            Sonraki <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default KategoriBazliSatis;