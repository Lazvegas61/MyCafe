import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GunlukGiderler = () => {
  const navigate = useNavigate();
  
  // State'ler
  const [filtreBaslangic, setFiltreBaslangic] = useState('');
  const [filtreBitis, setFiltreBitis] = useState('');
  const [filtreGiderTipi, setFiltreGiderTipi] = useState('');
  const [filtreOdemeYontemi, setFiltreOdemeYontemi] = useState('');
  const [siralama, setSiralama] = useState('tarih_desc');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  
  // Giderler state'i
  const [giderler, setGiderler] = useState([]);
  const [istatistikler, setIstatistikler] = useState({
    toplamGider: 0,
    ortalamaGider: 0,
    giderAdeti: 0,
    enYuksekGider: 0,
    enCokGiderTipi: '',
    gunlukOrtalama: 0
  });

  // Demo veri - API'den gelecek
  const demoGiderler = [
    {
      id: 1,
      tarih: "20 Nisan 2024",
      saat: "14:30",
      giderAdi: "Elektrik Faturası",
      giderTipi: "Fatura",
      aciklama: "Mart ayı elektrik faturası",
      tutar: 400,
      odemeYontemi: "Banka",
      kullanici: "Admin",
      onay: true,
      kategori: "Sabit Gider"
    },
    {
      id: 2,
      tarih: "20 Nisan 2024",
      saat: "16:00",
      giderAdi: "Personel Yemek",
      giderTipi: "Nakit",
      aciklama: "Öğlen personel yemek gideri",
      tutar: 200,
      odemeYontemi: "Nakit",
      kullanici: "Kasa",
      onay: true,
      kategori: "Personel"
    },
    {
      id: 3,
      tarih: "20 Nisan 2024",
      saat: "18:45",
      giderAdi: "Temizlik Malzemesi",
      giderTipi: "Kredi Kartı",
      aciklama: "Temizlik için alınan malzemeler",
      tutar: 75,
      odemeYontemi: "Kredi Kartı",
      kullanici: "Admin",
      onay: true,
      kategori: "Temizlik"
    },
    {
      id: 4,
      tarih: "19 Nisan 2024",
      saat: "11:20",
      giderAdi: "Su Faturası",
      giderTipi: "Fatura",
      aciklama: "Mart ayı su faturası",
      tutar: 120,
      odemeYontemi: "Banka",
      kullanici: "Admin",
      onay: true,
      kategori: "Sabit Gider"
    },
    {
      id: 5,
      tarih: "19 Nisan 2024",
      saat: "15:45",
      giderAdi: "Kırtasiye Malzemesi",
      giderTipi: "Nakit",
      aciklama: "Ofis için kırtasiye alışverişi",
      tutar: 45,
      odemeYontemi: "Nakit",
      kullanici: "Garson",
      onay: true,
      kategori: "Ofis"
    },
    {
      id: 6,
      tarih: "18 Nisan 2024",
      saat: "09:15",
      giderAdi: "Doğalgaz Faturası",
      giderTipi: "Fatura",
      aciklama: "Mart ayı doğalgaz faturası",
      tutar: 350,
      odemeYontemi: "Banka",
      kullanici: "Admin",
      onay: true,
      kategori: "Sabit Gider"
    },
    {
      id: 7,
      tarih: "18 Nisan 2024",
      saat: "17:30",
      giderAdi: "Bakım Onarım",
      giderTipi: "Kredi Kartı",
      aciklama: "Bilardo masaları bakımı",
      tutar: 180,
      odemeYontemi: "Kredi Kartı",
      kullanici: "Admin",
      onay: true,
      kategori: "Bakım"
    },
    {
      id: 8,
      tarih: "17 Nisan 2024",
      saat: "13:00",
      giderAdi: "Mutfak Malzemesi",
      giderTipi: "Nakit",
      aciklama: "Mutfak için temel malzemeler",
      tutar: 320,
      odemeYontemi: "Nakit",
      kullanici: "Şef",
      onay: true,
      kategori: "Mutfak"
    },
    {
      id: 9,
      tarih: "17 Nisan 2024",
      saat: "19:20",
      giderAdi: "Kira",
      giderTipi: "Havale",
      aciklama: "Nisan ayı kira ödemesi",
      tutar: 5000,
      odemeYontemi: "Banka",
      kullanici: "Admin",
      onay: true,
      kategori: "Sabit Gider"
    },
    {
      id: 10,
      tarih: "16 Nisan 2024",
      saat: "10:45",
      giderAdi: "İnternet Faturası",
      giderTipi: "Fatura",
      aciklama: "Nisan ayı internet faturası",
      tutar: 85,
      odemeYontemi: "Banka",
      kullanici: "Admin",
      onay: true,
      kategori: "Sabit Gider"
    }
  ];

  // Filtreleme fonksiyonu
  const handleFiltrele = async () => {
    setYukleniyor(true);
    try {
      // DEMO DATA - API'den gelecek
      setTimeout(() => {
        setGiderler(demoGiderler);
        
        // İstatistik hesapla
        const toplam = demoGiderler.reduce((sum, g) => sum + g.tutar, 0);
        const ortalama = toplam / demoGiderler.length;
        const enYuksek = Math.max(...demoGiderler.map(g => g.tutar));
        
        // En çok gider tipini bul
        const tipSayilari = {};
        demoGiderler.forEach(g => {
          tipSayilari[g.giderTipi] = (tipSayilari[g.giderTipi] || 0) + 1;
        });
        const enCokTip = Object.keys(tipSayilari).reduce((a, b) => 
          tipSayilari[a] > tipSayilari[b] ? a : b
        );
        
        setIstatistikler({
          toplamGider: toplam,
          ortalamaGider: ortalama,
          giderAdeti: demoGiderler.length,
          enYuksekGider: enYuksek,
          enCokGiderTipi: enCokTip,
          gunlukOrtalama: toplam / 7 // 7 günlük ortalama
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
    setFiltreGiderTipi('');
    setFiltreOdemeYontemi('');
    setSiralama('tarih_desc');
    setSayfa(1);
  };

  // Sayfa değiştir
  const handleSayfaDegistir = (yeniSayfa) => {
    if (yeniSayfa < 1 || yeniSayfa > toplamSayfa) return;
    setSayfa(yeniSayfa);
  };

  // Yeni gider ekle
  const handleYeniGider = () => {
    alert('Yeni gider ekleme sayfası açılacak');
  };

  // Gider düzenle
  const handleGiderDuzenle = (giderId) => {
    alert(`Gider düzenleme: ${giderId}`);
  };

  // Gider sil
  const handleGiderSil = (giderId) => {
    if (window.confirm('Bu gideri silmek istediğinize emin misiniz?')) {
      alert(`Gider silindi: ${giderId}`);
    }
  };

  // Gider detay
  const handleGiderDetay = (giderId) => {
    alert(`Gider detay: ${giderId}`);
  };

  // İlk yükleme
  useEffect(() => {
    handleFiltrele();
  }, [sayfa]);

  // CSS Styles
  const styles = `
  .gunluk-giderler-container {
    padding: 20px;
    background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
    min-height: 100vh;
    font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
    color: #2c2416;
    width: 100%;
  }

  /* HEADER */
  .gider-header {
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

  .gider-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #e74c3c, #f39c12, #e74c3c);
  }

  .gider-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    width: 100%;
  }

  .gider-title h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    background: linear-gradient(135deg, #e74c3c 0%, #f39c12 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }

  .gider-title h1 .alt-baslik {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #8b5e3c;
    margin-top: 6px;
    letter-spacing: 0;
  }

  /* BUTON GRUP */
  .gider-btn-group {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .gider-btn {
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

  .gider-btn-primary {
    background: linear-gradient(135deg, #e74c3c 0%, #f39c12 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.25);
  }

  .gider-btn-secondary {
    background: white;
    color: #e74c3c;
    border: 2px solid #e74c3c;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.1);
  }

  .gider-btn-tertiary {
    background: linear-gradient(135deg, #f0e6d6 0%, #e8d9c7 100%);
    color: #6b4e2e;
    border: 2px solid rgba(212, 175, 55, 0.3);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
  }

  .gider-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
  }

  /* FİLTRE BAR */
  .gider-filtre-bar {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    align-items: flex-end;
    flex-wrap: wrap;
    padding: 20px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 248, 245, 0.9) 100%);
    border-radius: 18px;
    border: 1px solid rgba(231, 76, 60, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.05);
  }

  .gider-filtre-grup {
    flex: 1;
    min-width: 180px;
  }

  .gider-filtre-label {
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

  .gider-filtre-bar select,
  .gider-filtre-bar input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(231, 76, 60, 0.3);
    background: rgba(255, 255, 255, 0.8);
    color: #3a2c1a;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.05);
  }

  .gider-filtre-bar select:focus,
  .gider-filtre-bar input:focus {
    outline: none;
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.15);
    background: white;
  }

  /* ANA İÇERİK KONTEYNERİ */
  .gider-ana-container {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;
    width: 100%;
    min-height: calc(100vh - 200px);
  }

  @media (max-width: 1200px) {
    .gider-ana-container {
      grid-template-columns: 1fr;
    }
  }

  /* SOL TARAF - GENİŞ ALAN */
  .gider-sol-taraf {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }

  /* SAĞ TARAF - SABİT ÖZET PANELİ */
  .gider-sag-taraf {
    position: sticky;
    top: 20px;
    height: fit-content;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  /* İSTATİSTİK ÖZET BAR */
  .gider-istatistik-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .gider-istatistik-kutu {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(231, 76, 60, 0.15);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.05);
  }

  .gider-istatistik-kutu:hover {
    transform: translateY(-5px);
    border-color: rgba(231, 76, 60, 0.3);
    box-shadow: 0 12px 25px rgba(231, 76, 60, 0.1);
  }

  .gider-istatistik-kutu::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #e74c3c, #f39c12);
  }

  .gider-istatistik-kutu h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #6b4e2e;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    opacity: 0.9;
  }

  .gider-istatistik-kutu .deger {
    font-size: 28px;
    font-weight: 900;
    color: #e74c3c;
    line-height: 1;
    margin: 8px 0;
    text-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);
  }

  /* GİDER TABLOSU */
  .gider-tablo-container {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.12);
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .gider-tablo-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #e74c3c, #f39c12);
  }

  .gider-tablo-container h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 800;
    color: #3a2c1a;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba(231, 76, 60, 0.2);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gider-tablo-container h2 i {
    color: #e74c3c;
    font-size: 18px;
  }

  .gider-tablo {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 14px;
    border: 1px solid rgba(231, 76, 60, 0.15);
    border-radius: 14px;
    overflow: hidden;
    background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.05);
  }

  .gider-tablo thead {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(243, 156, 18, 0.1) 100%);
  }

  .gider-tablo th {
    text-align: left;
    padding: 16px;
    font-weight: 700;
    color: #8b5e3c;
    border-bottom: 2px solid rgba(231, 76, 60, 0.2);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .gider-tablo td {
    padding: 14px 16px;
    color: #3a2c1a;
    border-bottom: 1px solid rgba(231, 76, 60, 0.1);
    font-weight: 500;
  }

  .gider-tablo tbody tr:last-child td {
    border-bottom: none;
  }

  .gider-tablo tbody tr:hover {
    background: rgba(231, 76, 60, 0.05);
  }

  .gider-aksiyon-butonlar {
    display: flex;
    gap: 8px;
  }

  .aksiyon-btn {
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    font-size: 12px;
  }

  .aksiyon-btn-detay {
    background: rgba(52, 152, 219, 0.1);
    color: #3498db;
    border: 1px solid rgba(52, 152, 219, 0.3);
  }

  .aksiyon-btn-duzenle {
    background: rgba(46, 204, 113, 0.1);
    color: #27ae60;
    border: 1px solid rgba(46, 204, 113, 0.3);
  }

  .aksiyon-btn-sil {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.3);
  }

  .aksiyon-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* ÖZET KART */
  .gider-ozet-kart {
    background: linear-gradient(135deg, #3a2c1a 0%, #4a3823 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 12px 35px rgba(58, 44, 26, 0.3);
    border: 1px solid rgba(231, 76, 60, 0.3);
    color: white;
    position: sticky;
    top: 20px;
    height: fit-content;
    overflow: hidden;
  }

  .gider-ozet-kart h2 {
    margin: 0 0 24px 0;
    font-size: 22px;
    font-weight: 800;
    color: #f5e6d3;
    padding-bottom: 14px;
    border-bottom: 2px solid rgba(231, 76, 60, 0.4);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gider-ozet-kart h2 i {
    color: #e74c3c;
    font-size: 20px;
    background: rgba(231, 76, 60, 0.2);
    padding: 10px;
    border-radius: 12px;
  }

  .gider-ozet-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 15px;
    transition: padding 0.2s ease;
  }

  .gider-ozet-row:hover {
    padding-left: 8px;
    padding-right: 8px;
  }

  .gider-ozet-row:last-child {
    border-bottom: none;
  }

  .gider-ozet-row .label {
    color: #c9b699;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .gider-ozet-row .label i {
    font-size: 13px;
    opacity: 0.8;
  }

  .gider-ozet-row .value {
    font-weight: 700;
    font-size: 16px;
    color: #f5e6d3;
  }

  .gider-ozet-row.toplam .value {
    color: #e74c3c;
    text-shadow: 0 2px 4px rgba(231, 76, 60, 0.3);
  }

  .gider-ozet-row.ortalama .value {
    color: #f39c12;
    text-shadow: 0 2px 4px rgba(243, 156, 18, 0.3);
  }

  .gider-ozet-row.en-yuksek .value {
    color: #e74c3c;
    font-size: 18px;
    font-weight: 900;
    text-shadow: 0 2px 8px rgba(231, 76, 60, 0.5);
  }

  .gider-ozet-row.adet .value {
    color: #3498db;
    text-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
  }

  /* DAĞILIM GRAFİĞİ */
  .gider-dagilim-container {
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    padding: 24px;
    border-radius: 18px;
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.12);
    width: 100%;
    margin-top: 24px;
  }

  .gider-dagilim-container h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 800;
    color: #3a2c1a;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gider-dagilim-container h3 i {
    color: #e74c3c;
  }

  .gider-kategori-listesi {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .gider-kategori-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  }

  .gider-kategori-item:last-child {
    border-bottom: none;
  }

  .gider-kategori-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .gider-kategori-renk {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }

  .gider-kategori-adi {
    font-weight: 600;
    color: #3a2c1a;
  }

  .gider-kategori-oran {
    font-weight: 700;
    color: #e74c3c;
  }

  .gider-kategori-bar {
    height: 8px;
    background: rgba(231, 76, 60, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
  }

  .gider-kategori-dolum {
    height: 100%;
    border-radius: 4px;
  }

  /* BOŞ DURUM */
  .gider-empty-state {
    text-align: center;
    padding: 60px 20px;
    background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
    border-radius: 16px;
    border: 1px solid rgba(212, 175, 55, 0.15);
    box-shadow: 0 6px 20px rgba(139, 94, 60, 0.05);
    grid-column: 1 / -1;
  }

  .gider-empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
    color: #e74c3c;
  }

  .gider-empty-text {
    font-size: 20px;
    margin-bottom: 12px;
    color: #3a2c1a;
    font-weight: 700;
  }

  .gider-empty-subtext {
    font-size: 14px;
    color: #6b4e2e;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.6;
    opacity: 0.8;
  }

  /* SAYFALAMA */
  .gider-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(231, 76, 60, 0.1);
  }

  .gider-pagination-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(243, 156, 18, 0.1) 100%);
    color: #6b4e2e;
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .gider-pagination-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #e74c3c 0%, #f39c12 100%);
    color: white;
    border-color: #e74c3c;
    transform: translateY(-2px);
  }

  .gider-pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .gider-page-numbers {
    display: flex;
    gap: 8px;
  }

  .gider-page-number {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(243, 156, 18, 0.1) 100%);
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    color: #6b4e2e;
    transition: all 0.3s ease;
    border: 1px solid rgba(231, 76, 60, 0.1);
  }

  .gider-page-number:hover {
    background: linear-gradient(135deg, rgba(231, 76, 60, 0.2) 0%, rgba(243, 156, 18, 0.2) 100%);
    transform: translateY(-2px);
  }

  .gider-page-number.active {
    background: linear-gradient(135deg, #e74c3c 0%, #f39c12 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }

  /* YÜKLEME */
  .gider-loading-state {
    text-align: center;
    padding: 100px 20px;
    background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
    border-radius: 20px;
    border: 1px solid rgba(212, 175, 55, 0.15);
    grid-column: 1 / -1;
  }

  .gider-loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(231, 76, 60, 0.1);
    border-top-color: #e74c3c;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }

  .gider-loading-text {
    color: #e74c3c;
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
    .gider-ana-container {
      grid-template-columns: 1fr;
    }
    
    .gider-sag-taraf {
      position: static;
      margin-top: 20px;
    }
  }

  @media (max-width: 768px) {
    .gunluk-giderler-container {
      padding: 16px;
    }
    
    .gider-header {
      padding: 20px;
    }
    
    .gider-title h1 {
      font-size: 28px;
    }
    
    .gider-filtre-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    
    .gider-filtre-grup {
      min-width: 100%;
    }
    
    .gider-btn-group {
      flex-direction: column;
    }
    
    .gider-btn {
      width: 100%;
      justify-content: center;
    }
    
    .gider-istatistik-bar {
      grid-template-columns: 1fr 1fr;
    }
    
    .gider-tablo {
      display: block;
      overflow-x: auto;
    }
    
    .gider-aksiyon-butonlar {
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .gider-istatistik-bar {
      grid-template-columns: 1fr;
    }
    
    .gider-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
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
  giderler.forEach(gider => {
    const kategori = gider.kategori;
    if (!kategoriDagilimi[kategori]) {
      kategoriDagilimi[kategori] = 0;
    }
    kategoriDagilimi[kategori] += gider.tutar;
  });

  const toplamGider = Object.values(kategoriDagilimi).reduce((a, b) => a + b, 0);

  // Kategori renkleri
  const kategoriRenkleri = {
    'Sabit Gider': '#e74c3c',
    'Personel': '#3498db',
    'Temizlik': '#2ecc71',
    'Ofis': '#9b59b6',
    'Bakım': '#f39c12',
    'Mutfak': '#1abc9c'
  };

  return (
    <div className="gunluk-giderler-container">
      {/* HEADER */}
      <div className="gider-header">
        <div className="gider-title">
          <h1>
            Günlük Giderler
            <span className="alt-baslik">Gider takibi ve analizi</span>
          </h1>
          
          <div className="gider-btn-group">
            <button className="gider-btn gider-btn-tertiary" onClick={() => navigate('/raporlar')}>
              <i className="fas fa-arrow-left"></i> Geri Dön
            </button>
            <button className="gider-btn gider-btn-secondary" onClick={handleYeniGider}>
              <i className="fas fa-plus"></i> Yeni Gider Ekle
            </button>
          </div>
        </div>

        <div className="gider-btn-group">
          <button className="gider-btn gider-btn-primary" onClick={handleYeniGider}>
            <i className="fas fa-file-pdf"></i> PDF İndir
          </button>
          <button className="gider-btn gider-btn-secondary">
            <i className="fas fa-file-excel"></i> Excel Çıkart
          </button>
          <button className="gider-btn gider-btn-tertiary">
            <i className="fas fa-print"></i> Yazdır
          </button>
        </div>
      </div>

      {/* FİLTRE BAR */}
      <div className="gider-filtre-bar">
        <div className="gider-filtre-grup">
          <label className="gider-filtre-label">
            <i className="fas fa-calendar"></i> Başlangıç Tarihi
          </label>
          <input 
            type="date" 
            value={filtreBaslangic}
            onChange={(e) => setFiltreBaslangic(e.target.value)}
          />
        </div>
        
        <div className="gider-filtre-grup">
          <label className="gider-filtre-label">
            <i className="fas fa-calendar-check"></i> Bitiş Tarihi
          </label>
          <input 
            type="date" 
            value={filtreBitis}
            onChange={(e) => setFiltreBitis(e.target.value)}
          />
        </div>
        
        <div className="gider-filtre-grup">
          <label className="gider-filtre-label">
            <i className="fas fa-tag"></i> Gider Tipi
          </label>
          <select 
            value={filtreGiderTipi}
            onChange={(e) => setFiltreGiderTipi(e.target.value)}
          >
            <option value="">Tüm Giderler</option>
            <option value="Fatura">Fatura</option>
            <option value="Nakit">Nakit</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Havale">Havale</option>
          </select>
        </div>
        
        <div className="gider-filtre-grup">
          <label className="gider-filtre-label">
            <i className="fas fa-credit-card"></i> Ödeme Yöntemi
          </label>
          <select 
            value={filtreOdemeYontemi}
            onChange={(e) => setFiltreOdemeYontemi(e.target.value)}
          >
            <option value="">Tüm Ödeme Yöntemleri</option>
            <option value="Nakit">Nakit</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Banka">Banka</option>
          </select>
        </div>
        
        <div className="gider-filtre-grup">
          <label className="gider-filtre-label">
            <i className="fas fa-sort-amount-down"></i> Sıralama
          </label>
          <select 
            value={siralama}
            onChange={(e) => setSiralama(e.target.value)}
          >
            <option value="tarih_desc">Tarih (Yeniden Eskiye)</option>
            <option value="tarih_asc">Tarih (Eskiden Yeniye)</option>
            <option value="tutar_desc">Tutar (Yüksekten Düşüğe)</option>
            <option value="tutar_asc">Tutar (Düşükten Yükseğe)</option>
          </select>
        </div>
        
        <div className="gider-filtre-grup">
          <button className="gider-btn gider-btn-primary" onClick={handleFiltrele} disabled={yukleniyor}>
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
        
        <div className="gider-filtre-grup">
          <button className="gider-btn gider-btn-tertiary" onClick={handleSifirla}>
            <i className="fas fa-redo"></i> Sıfırla
          </button>
        </div>
      </div>

      {/* ANA İÇERİK */}
      {yukleniyor ? (
        <div className="gider-loading-state">
          <div className="gider-loading-spinner"></div>
          <div className="gider-loading-text">Giderler yükleniyor...</div>
        </div>
      ) : giderler.length === 0 ? (
        <div className="gider-empty-state">
          <div className="gider-empty-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <div className="gider-empty-text">Gider kaydı bulunamadı</div>
          <div className="gider-empty-subtext">
            Seçtiğiniz filtre kriterlerine uygun gider kaydı bulunamadı.
            Lütfen farklı tarih veya filtrelerle tekrar deneyin.
          </div>
          <button 
            className="gider-btn gider-btn-primary" 
            onClick={handleYeniGider}
            style={{ marginTop: '20px' }}
          >
            <i className="fas fa-plus"></i> İlk Gideri Ekle
          </button>
        </div>
      ) : (
        <div className="gider-ana-container">
          {/* SOL TARAF */}
          <div className="gider-sol-taraf">
            {/* İSTATİSTİK BAR */}
            <div className="gider-istatistik-bar">
              <div className="gider-istatistik-kutu">
                <h4>Toplam Gider</h4>
                <div className="deger">{istatistikler.toplamGider.toLocaleString()} ₺</div>
                <div style={{ fontSize: '13px', color: '#e74c3c', fontWeight: '600' }}>
                  <i className="fas fa-chart-line"></i> Son 7 gün ortalaması
                </div>
              </div>
              
              <div className="gider-istatistik-kutu">
                <h4>Gider Adeti</h4>
                <div className="deger">{istatistikler.giderAdeti}</div>
                <div style={{ fontSize: '13px', color: '#3498db', fontWeight: '600' }}>
                  <i className="fas fa-list"></i> Toplam kayıt sayısı
                </div>
              </div>
              
              <div className="gider-istatistik-kutu">
                <h4>Ortalama Gider</h4>
                <div className="deger">{istatistikler.ortalamaGider.toFixed(0)} ₺</div>
                <div style={{ fontSize: '13px', color: '#f39c12', fontWeight: '600' }}>
                  <i className="fas fa-calculator"></i> Kayıt başına ortalama
                </div>
              </div>
              
              <div className="gider-istatistik-kutu">
                <h4>En Yüksek Gider</h4>
                <div className="deger">{istatistikler.enYuksekGider} ₺</div>
                <div style={{ fontSize: '13px', color: '#e74c3c', fontWeight: '600' }}>
                  <i className="fas fa-arrow-up"></i> Tek kalem en yüksek
                </div>
              </div>
            </div>

            {/* GİDER TABLOSU */}
            <div className="gider-tablo-container">
              <h2><i className="fas fa-list"></i> Gider Kayıtları</h2>
              <table className="gider-tablo">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Saat</th>
                    <th>Gider Adı</th>
                    <th>Tip</th>
                    <th>Tutar</th>
                    <th>Ödeme</th>
                    <th>Kategori</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {giderler.map((gider) => (
                    <tr key={gider.id}>
                      <td>{gider.tarih}</td>
                      <td>{gider.saat}</td>
                      <td>
                        <strong>{gider.giderAdi}</strong>
                        {gider.aciklama && (
                          <div style={{ fontSize: '12px', color: '#6b4e2e', marginTop: '4px' }}>
                            {gider.aciklama}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: gider.giderTipi === 'Fatura' ? 'rgba(52, 152, 219, 0.1)' :
                                     gider.giderTipi === 'Nakit' ? 'rgba(46, 204, 113, 0.1)' :
                                     'rgba(155, 89, 182, 0.1)',
                          color: gider.giderTipi === 'Fatura' ? '#3498db' :
                                 gider.giderTipi === 'Nakit' ? '#27ae60' :
                                 '#9b59b6',
                          border: gider.giderTipi === 'Fatura' ? '1px solid rgba(52, 152, 219, 0.3)' :
                                  gider.giderTipi === 'Nakit' ? '1px solid rgba(46, 204, 113, 0.3)' :
                                  '1px solid rgba(155, 89, 182, 0.3)'
                        }}>
                          {gider.giderTipi}
                        </span>
                      </td>
                      <td style={{ color: '#e74c3c', fontWeight: '800' }}>-{gider.tutar} ₺</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: gider.odemeYontemi === 'Nakit' ? 'rgba(46, 204, 113, 0.1)' :
                                     gider.odemeYontemi === 'Kredi Kartı' ? 'rgba(52, 152, 219, 0.1)' :
                                     'rgba(243, 156, 18, 0.1)',
                          color: gider.odemeYontemi === 'Nakit' ? '#27ae60' :
                                 gider.odemeYontemi === 'Kredi Kartı' ? '#3498db' :
                                 '#f39c12',
                          border: gider.odemeYontemi === 'Nakit' ? '1px solid rgba(46, 204, 113, 0.3)' :
                                  gider.odemeYontemi === 'Kredi Kartı' ? '1px solid rgba(52, 152, 219, 0.3)' :
                                  '1px solid rgba(243, 156, 18, 0.3)'
                        }}>
                          {gider.odemeYontemi}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: 'rgba(212, 175, 55, 0.1)',
                          color: '#8b5e3c',
                          border: '1px solid rgba(212, 175, 55, 0.3)'
                        }}>
                          {gider.kategori}
                        </span>
                      </td>
                      <td>
                        <div className="gider-aksiyon-butonlar">
                          <button 
                            className="aksiyon-btn aksiyon-btn-detay"
                            onClick={() => handleGiderDetay(gider.id)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="aksiyon-btn aksiyon-btn-duzenle"
                            onClick={() => handleGiderDuzenle(gider.id)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="aksiyon-btn aksiyon-btn-sil"
                            onClick={() => handleGiderSil(gider.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* KATEGORİ DAĞILIMI */}
            <div className="gider-dagilim-container">
              <h3><i className="fas fa-chart-pie"></i> Kategori Dağılımı</h3>
              <ul className="gider-kategori-listesi">
                {Object.entries(kategoriDagilimi).map(([kategori, tutar]) => {
                  const oran = ((tutar / toplamGider) * 100).toFixed(1);
                  const renk = kategoriRenkleri[kategori] || '#e74c3c';
                  
                  return (
                    <li key={kategori} className="gider-kategori-item">
                      <div className="gider-kategori-info">
                        <div 
                          className="gider-kategori-renk" 
                          style={{ background: renk }}
                        ></div>
                        <span className="gider-kategori-adi">{kategori}</span>
                      </div>
                      <span className="gider-kategori-oran">%{oran}</span>
                      <div className="gider-kategori-bar">
                        <div 
                          className="gider-kategori-dolum" 
                          style={{ 
                            width: `${oran}%`, 
                            background: renk 
                          }}
                        ></div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* SAĞ TARAF - SABİT ÖZET PANELİ */}
          <div className="gider-sag-taraf">
            <div className="gider-ozet-kart">
              <h2><i className="fas fa-chart-bar"></i> Gider Özeti</h2>
              
              <div className="gider-ozet-row toplam">
                <span className="label">
                  <i className="fas fa-money-bill-wave"></i> Toplam Gider
                </span>
                <span className="value">-{istatistikler.toplamGider.toLocaleString()} ₺</span>
              </div>
              
              <div className="gider-ozet-row ortalama">
                <span className="label">
                  <i className="fas fa-calculator"></i> Ortalama Gider
                </span>
                <span className="value">{istatistikler.ortalamaGider.toFixed(0)} ₺</span>
              </div>
              
              <div className="gider-ozet-row en-yuksek">
                <span className="label">
                  <i className="fas fa-arrow-up"></i> En Yüksek Gider
                </span>
                <span className="value">-{istatistikler.enYuksekGider} ₺</span>
              </div>
              
              <div className="gider-ozet-row adet">
                <span className="label">
                  <i className="fas fa-list"></i> Toplam Kayıt
                </span>
                <span className="value">{istatistikler.giderAdeti}</span>
              </div>

              {/* HIZLI İSTATİSTİKLER */}
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '16px', color: '#f5e6d3', marginBottom: '12px' }}>
                  <i className="fas fa-tachometer-alt"></i> Hızlı Bilgiler
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
                      color: '#3498db',
                      marginBottom: '4px'
                    }}>
                      {Object.keys(kategoriDagilimi).length}
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
                      color: '#2ecc71',
                      marginBottom: '4px'
                    }}>
                      {istatistikler.enCokGiderTipi}
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      En Çok Tip
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
                      {istatistikler.gunlukOrtalama.toFixed(0)} ₺
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      Günlük Ort.
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
                      {(istatistikler.toplamGider / 30).toFixed(0)} ₺
                    </div>
                    <div style={{ fontSize: '11px', color: '#c9b699' }}>
                      Aylık Ort.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAYFALAMA */}
      {toplamSayfa > 1 && !yukleniyor && giderler.length > 0 && (
        <div className="gider-pagination">
          <button 
            className="gider-pagination-btn" 
            onClick={() => handleSayfaDegistir(sayfa - 1)}
            disabled={sayfa === 1}
          >
            <i className="fas fa-chevron-left"></i> Önceki
          </button>
          
          <div className="gider-page-numbers">
            {[...Array(Math.min(5, toplamSayfa))].map((_, index) => {
              const pageNum = index + 1;
              return (
                <div 
                  key={pageNum}
                  className={`gider-page-number ${pageNum === sayfa ? 'active' : ''}`}
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
                  className={`gider-page-number ${toplamSayfa === sayfa ? 'active' : ''}`}
                  onClick={() => handleSayfaDegistir(toplamSayfa)}
                >
                  {toplamSayfa}
                </div>
              </>
            )}
          </div>
          
          <button 
            className="gider-pagination-btn"
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

export default GunlukGiderler;