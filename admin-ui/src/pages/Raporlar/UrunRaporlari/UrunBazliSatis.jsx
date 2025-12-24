import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const UrunBazliSatis = () => {
  const navigate = useNavigate();
  
  // State'ler
  const [filtreBaslangic, setFiltreBaslangic] = useState(new Date());
  const [filtreBitis, setFiltreBitis] = useState(new Date());
  const [filtreKategori, setFiltreKategori] = useState('Tüm Kategoriler');
  const [filtreUrun, setFiltreUrun] = useState('');
  const [filtreStokDurumu, setFiltreStokDurumu] = useState('Tümü');
  const [filtreSatirTipi, setFiltreSatirTipi] = useState('Tümü');
  const [filtreOdemeTuru, setFiltreOdemeTuru] = useState('Tümü');
  const [siralama, setSiralama] = useState('satis_desc');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(20);
  const [toplamKayit, setToplamKayit] = useState(0);
  
  // Veriler
  const [urunRaporlari, setUrunRaporlari] = useState([]);
  const [istatistikler, setIstatistikler] = useState({
    toplamSatis: 0,
    toplamKar: 0,
    toplamTahsilat: 0,
    ortalamaSatis: 0,
    enCokSatisUrun: '',
    enKarliUrun: '',
    kritikStokUrunSayisi: 0,
    stoktaToplamUrun: 0,
    toplamSatirAdedi: 0,
    aktifUrunSayisi: 0
  });

  // Demo veriler
  const demoUrunler = useMemo(() => [
    {
      urunId: 1,
      urunAdi: "Çay",
      kategori: "Sıcak İçecekler",
      barkod: "CH001",
      stok: 150,
      kritikStok: 20,
      stokDurumu: "YETERLI",
      toplamSatis: 1250,
      toplamKar: 875,
      satisAdedi: 425,
      iptalAdedi: 5,
      ikramAdedi: 15,
      ortalamaFiyat: 2,
      karOrani: 70,
      maliyet: 0,
      maliyetsizUrun: true,
      trend: "artis",
      renk: "#e74c3c",
      odemeDagilimi: {
        NAKIT: 800,
        KREDI_KARTI: 350,
        HESABA_YAZ: 100
      },
      gunBazliSatislar: [
        { gun: '20 Nisan 2024', satis: 45, kar: 31.5 },
        { gun: '19 Nisan 2024', satis: 42, kar: 29.4 },
        { gun: '18 Nisan 2024', satis: 38, kar: 26.6 }
      ]
    },
    {
      urunId: 2,
      urunAdi: "Nescafe",
      kategori: "Sıcak İçecekler",
      barkod: "NF002",
      stok: 45,
      kritikStok: 15,
      stokDurumu: "YETERLI",
      toplamSatis: 980,
      toplamKar: 686,
      satisAdedi: 98,
      iptalAdedi: 2,
      ikramAdedi: 3,
      ortalamaFiyat: 8,
      karOrani: 70,
      maliyet: 2.4,
      maliyetsizUrun: false,
      trend: "stabil",
      renk: "#f39c12",
      odemeDagilimi: {
        NAKIT: 500,
        KREDI_KARTI: 480
      }
    },
    {
      urunId: 3,
      urunAdi: "Tost",
      kategori: "Yiyecekler",
      barkod: "TO003",
      stok: 28,
      kritikStok: 10,
      stokDurumu: "YETERLI",
      toplamSatis: 2150,
      toplamKar: 1505,
      satisAdedi: 143,
      iptalAdedi: 3,
      ikramAdedi: 2,
      ortalamaFiyat: 15,
      karOrani: 70,
      maliyet: 4.5,
      maliyetsizUrun: false,
      trend: "artis",
      renk: "#2ecc71",
      odemeDagilimi: {
        NAKIT: 1000,
        KREDI_KARTI: 950,
        HESABA_YAZ: 200
      }
    },
    {
      urunId: 4,
      urunAdi: "Kola",
      kategori: "Soğuk İçecekler",
      barkod: "CL004",
      stok: 12,
      kritikStok: 15,
      stokDurumu: "KRITIK",
      toplamSatis: 780,
      toplamKar: 546,
      satisAdedi: 120,
      iptalAdedi: 4,
      ikramAdedi: 6,
      ortalamaFiyat: 6.5,
      karOrani: 70,
      maliyet: 1.95,
      maliyetsizUrun: false,
      trend: "artis",
      renk: "#3498db",
      odemeDagilimi: {
        NAKIT: 400,
        KREDI_KARTI: 380
      }
    },
    {
      urunId: 5,
      urunAdi: "Su",
      kategori: "Soğuk İçecekler",
      barkod: "SW005",
      stok: 85,
      kritikStok: 20,
      stokDurumu: "YETERLI",
      toplamSatis: 420,
      toplamKar: 294,
      satisAdedi: 140,
      iptalAdedi: 0,
      ikramAdedi: 10,
      ortalamaFiyat: 3,
      karOrani: 70,
      maliyet: 0.9,
      maliyetsizUrun: false,
      trend: "stabil",
      renk: "#1abc9c",
      odemeDagilimi: {
        NAKIT: 300,
        KREDI_KARTI: 120
      }
    },
    {
      urunId: 6,
      urunAdi: "Bilardo Saati",
      kategori: "Bilardo",
      barkod: "BL006",
      stok: 0,
      kritikStok: 0,
      stokDurumu: "STOKTA_YOK",
      toplamSatis: 1850,
      toplamKar: 1665,
      satisAdedi: 210,
      iptalAdedi: 8,
      ikramAdedi: 0,
      ortalamaFiyat: 40.5,
      karOrani: 90,
      maliyet: 4.05,
      maliyetsizUrun: false,
      trend: "stabil",
      renk: "#34495e",
      odemeDagilimi: {
        NAKIT: 900,
        KREDI_KARTI: 850,
        HESABA_YAZ: 100
      }
    },
    {
      urunId: 7,
      urunAdi: "Sütlaç",
      kategori: "Tatlılar",
      barkod: "ST007",
      stok: 8,
      kritikStok: 5,
      stokDurumu: "KRITIK",
      toplamSatis: 650,
      toplamKar: 455,
      satisAdedi: 50,
      iptalAdedi: 1,
      ikramAdedi: 4,
      ortalamaFiyat: 13,
      karOrani: 70,
      maliyet: 3.9,
      maliyetsizUrun: false,
      trend: "azalis",
      renk: "#9b59b6",
      odemeDagilimi: {
        NAKIT: 350,
        KREDI_KARTI: 300
      }
    },
    {
      urunId: 8,
      urunAdi: "Patates Kızartması",
      kategori: "Atıştırmalıklar",
      barkod: "PK008",
      stok: 32,
      kritikStok: 10,
      stokDurumu: "YETERLI",
      toplamSatis: 950,
      toplamKar: 665,
      satisAdedi: 95,
      iptalAdedi: 2,
      ikramAdedi: 3,
      ortalamaFiyat: 10,
      karOrani: 70,
      maliyet: 3,
      maliyetsizUrun: false,
      trend: "artis",
      renk: "#d35400",
      odemeDagilimi: {
        NAKIT: 600,
        KREDI_KARTI: 350
      }
    },
    {
      urunId: 9,
      urunAdi: "Meyve Tabağı",
      kategori: "Meyveler",
      barkod: "MT009",
      stok: 5,
      kritikStok: 3,
      stokDurumu: "KRITIK",
      toplamSatis: 320,
      toplamKar: 224,
      satisAdedi: 16,
      iptalAdedi: 0,
      ikramAdedi: 2,
      ortalamaFiyat: 20,
      karOrani: 70,
      maliyet: 6,
      maliyetsizUrun: false,
      trend: "azalis",
      renk: "#27ae60",
      odemeDagilimi: {
        NAKIT: 200,
        KREDI_KARTI: 120
      }
    },
    {
      urunId: 10,
      urunAdi: "Kahvaltı Tabağı",
      kategori: "Özel Servisler",
      barkod: "KT010",
      stok: 15,
      kritikStok: 5,
      stokDurumu: "YETERLI",
      toplamSatis: 1250,
      toplamKar: 875,
      satisAdedi: 25,
      iptalAdedi: 1,
      ikramAdedi: 1,
      ortalamaFiyat: 50,
      karOrani: 70,
      maliyet: 15,
      maliyetsizUrun: false,
      trend: "artis",
      renk: "#8e44ad",
      odemeDagilimi: {
        NAKIT: 800,
        KREDI_KARTI: 450
      }
    }
  ], []);

  // Filtre seçenekleri
  const kategoriListesi = useMemo(() => [
    "Tüm Kategoriler",
    "Sıcak İçecekler",
    "Soğuk İçecekler",
    "Yiyecekler",
    "Tatlılar",
    "Bilardo",
    "Atıştırmalıklar",
    "Meyveler",
    "Özel Servisler"
  ], []);

  const satirTipleri = useMemo(() => [
    { value: 'Tümü', label: 'Tüm Satırlar' },
    { value: 'SATIS', label: 'Satış' },
    { value: 'IKRAM', label: 'İkram' },
    { value: 'IPTAL', label: 'İptal' },
    { value: 'SILINEN', label: 'Silinen Satırlar' }
  ], []);

  const odemeTurleri = useMemo(() => [
    { value: 'Tümü', label: 'Tüm Ödeme Türleri' },
    { value: 'NAKIT', label: 'Nakit' },
    { value: 'KREDI_KARTI', label: 'Kredi Kartı' },
    { value: 'HESABA_YAZ', label: 'Hesaba Yaz' },
    { value: 'DIGER', label: 'Diğer' }
  ], []);

  const stokDurumlari = useMemo(() => [
    { value: 'Tümü', label: 'Tüm Stok Durumları' },
    { value: 'YETERLI', label: 'Stok Yeterli' },
    { value: 'KRITIK', label: 'Kritik Stok' },
    { value: 'STOKTA_YOK', label: 'Stokta Yok' }
  ], []);

  const siralamaSecenekleri = useMemo(() => [
    { value: 'satis_desc', label: 'Satış (Yüksek → Düşük)' },
    { value: 'satis_asc', label: 'Satış (Düşük → Yüksek)' },
    { value: 'kar_desc', label: 'Kar (Yüksek → Düşük)' },
    { value: 'kar_asc', label: 'Kar (Düşük → Yüksek)' },
    { value: 'satisAdedi_desc', label: 'Satış Adedi (Çok → Az)' },
    { value: 'satisAdedi_asc', label: 'Satış Adedi (Az → Çok)' },
    { value: 'stok_desc', label: 'Stok (Yüksek → Düşük)' },
    { value: 'stok_asc', label: 'Stok (Düşük → Yüksek)' }
  ], []);

  // Tarih formatlama fonksiyonu
  const formatTarih = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Hızlı tarih seçenekleri
  const hizliTarihSecenekleri = useMemo(() => [
    { 
      label: 'Bugün', 
      onClick: () => {
        const today = new Date();
        setFiltreBaslangic(today);
        setFiltreBitis(today);
      }
    },
    { 
      label: 'Dün', 
      onClick: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setFiltreBaslangic(yesterday);
        setFiltreBitis(yesterday);
      }
    },
    { 
      label: 'Son 7 Gün', 
      onClick: () => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        setFiltreBaslangic(lastWeek);
        setFiltreBitis(new Date());
      }
    },
    { 
      label: 'Son 30 Gün', 
      onClick: () => {
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        setFiltreBaslangic(lastMonth);
        setFiltreBitis(new Date());
      }
    },
    { 
      label: 'Bu Ay', 
      onClick: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFiltreBaslangic(firstDay);
        setFiltreBitis(lastDay);
      }
    },
    { 
      label: 'Geçen Ay', 
      onClick: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        setFiltreBaslangic(firstDay);
        setFiltreBitis(lastDay);
      }
    }
  ], []);

  // Filtreleme fonksiyonu
  const handleFiltrele = useCallback(async () => {
    setYukleniyor(true);
    
    try {
      // Simüle edilmiş API çağrısı
      setTimeout(() => {
        let filtrelenmisUrunler = [...demoUrunler];
        
        // Kategori filtresi
        if (filtreKategori !== 'Tüm Kategoriler') {
          filtrelenmisUrunler = filtrelenmisUrunler.filter(
            urun => urun.kategori === filtreKategori
          );
        }
        
        // Stok durumu filtresi
        if (filtreStokDurumu !== 'Tümü') {
          filtrelenmisUrunler = filtrelenmisUrunler.filter(
            urun => urun.stokDurumu === filtreStokDurumu
          );
        }
        
        // Sıralama
        filtrelenmisUrunler.sort((a, b) => {
          switch (siralama) {
            case 'satis_desc':
              return b.toplamSatis - a.toplamSatis;
            case 'satis_asc':
              return a.toplamSatis - b.toplamSatis;
            case 'kar_desc':
              return b.toplamKar - a.toplamKar;
            case 'kar_asc':
              return a.toplamKar - b.toplamKar;
            case 'satisAdedi_desc':
              return b.satisAdedi - a.satisAdedi;
            case 'satisAdedi_asc':
              return a.satisAdedi - b.satisAdedi;
            case 'stok_desc':
              return b.stok - a.stok;
            case 'stok_asc':
              return a.stok - b.stok;
            default:
              return b.toplamSatis - a.toplamSatis;
          }
        });
        
        // Sayfalama
        const baslangicIndex = (sayfa - 1) * sayfaBoyutu;
        const sayfalanmisUrunler = filtrelenmisUrunler.slice(
          baslangicIndex, 
          baslangicIndex + sayfaBoyutu
        );
        
        // İstatistik hesapla
        const toplamSatis = filtrelenmisUrunler.reduce((sum, u) => sum + u.toplamSatis, 0);
        const toplamKar = filtrelenmisUrunler.reduce((sum, u) => sum + u.toplamKar, 0);
        const toplamSatirAdedi = filtrelenmisUrunler.reduce(
          (sum, u) => sum + u.satisAdedi + u.iptalAdedi + u.ikramAdedi, 0
        );
        
        const enCokSatis = filtrelenmisUrunler.reduce((max, u) => 
          u.toplamSatis > max.toplamSatis ? u : max, 
          filtrelenmisUrunler[0] || { urunAdi: '' }
        );
        
        const enKarli = filtrelenmisUrunler.reduce((max, u) => 
          u.toplamKar > max.toplamKar ? u : max, 
          filtrelenmisUrunler[0] || { urunAdi: '' }
        );
        
        const kritikStokUrunSayisi = filtrelenmisUrunler.filter(
          u => u.stokDurumu === 'KRITIK' || u.stokDurumu === 'STOKTA_YOK'
        ).length;
        
        const stoktaToplamUrun = filtrelenmisUrunler.reduce((sum, u) => sum + u.stok, 0);
        
        setUrunRaporlari(sayfalanmisUrunler);
        setToplamKayit(filtrelenmisUrunler.length);
        setIstatistikler({
          toplamSatis,
          toplamKar,
          toplamTahsilat: toplamSatis * 0.95, // %5 iptal/ikram varsayımı
          ortalamaSatis: filtrelenmisUrunler.length > 0 ? toplamSatis / filtrelenmisUrunler.length : 0,
          enCokSatisUrun: enCokSatis.urunAdi || '',
          enKarliUrun: enKarli.urunAdi || '',
          kritikStokUrunSayisi,
          stoktaToplamUrun,
          toplamSatirAdedi,
          aktifUrunSayisi: filtrelenmisUrunler.length
        });
        
        setYukleniyor(false);
      }, 500);
      
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      setYukleniyor(false);
    }
  }, [
    demoUrunler, 
    filtreKategori, 
    filtreStokDurumu, 
    siralama, 
    sayfa, 
    sayfaBoyutu
  ]);

  // Filtreleri sıfırla
  const handleSifirla = () => {
    setFiltreBaslangic(new Date());
    setFiltreBitis(new Date());
    setFiltreKategori('Tüm Kategoriler');
    setFiltreUrun('');
    setFiltreStokDurumu('Tümü');
    setFiltreSatirTipi('Tümü');
    setFiltreOdemeTuru('Tümü');
    setSiralama('satis_desc');
    setSayfa(1);
    setSayfaBoyutu(20);
  };

  // Sayfa değiştir
  const handleSayfaDegistir = (yeniSayfa) => {
    if (yeniSayfa < 1) return;
    setSayfa(yeniSayfa);
  };

  // Excel export (simülasyon)
  const handleExcelExport = () => {
    setYukleniyor(true);
    
    setTimeout(() => {
      alert('Excel export işlemi başarılı! Demo veriler için export hazır.');
      setYukleniyor(false);
    }, 1000);
  };

  // Ürün detay sayfasına git
  const handleUrunDetay = (urunId) => {
    alert(`Ürün detay sayfasına yönlendiriliyor... (Ürün ID: ${urunId})`);
    // navigate(`/raporlar/urun-detay/${urunId}`);
  };

  // Stok güncelle
  const handleStokGuncelle = (urunId) => {
    alert(`Stok güncelleme sayfasına yönlendiriliyor... (Ürün ID: ${urunId})`);
    // navigate(`/stok/urun/${urunId}/guncelle`);
  };

  // Ürün düzenle
  const handleUrunDuzenle = (urunId) => {
    alert(`Ürün düzenleme sayfasına yönlendiriliyor... (Ürün ID: ${urunId})`);
    // navigate(`/urunler/${urunId}/duzenle`);
  };

  // İlk yükleme ve filtre değişikliklerinde
  useEffect(() => {
    handleFiltrele();
  }, [handleFiltrele]);

  // Toplam sayfa hesapla
  const toplamSayfa = Math.ceil(toplamKayit / sayfaBoyutu);

  // CSS'i head'e ekle
  useEffect(() => {
    const styles = `
    .urun-rapor-container {
      padding: 20px;
      background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
      min-height: 100vh;
      font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
      color: #2c2416;
      width: 100%;
      box-sizing: border-box;
    }

    /* HEADER */
    .urun-header {
      background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
      padding: 24px 32px;
      border-radius: 20px;
      margin-bottom: 24px;
      box-shadow: 0 8px 30px rgba(139, 94, 60, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.15);
      position: relative;
      overflow: hidden;
      width: 100%;
      box-sizing: border-box;
    }

    .urun-header::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #3498db, #9b59b6, #3498db);
    }

    .urun-title {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      width: 100%;
      flex-wrap: wrap;
      gap: 16px;
    }

    .urun-title h1 {
      margin: 0;
      font-size: clamp(24px, 4vw, 32px);
      font-weight: 800;
      background: linear-gradient(135deg, #3498db 0%, #9b59b6 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
      flex: 1;
      min-width: 300px;
    }

    .urun-title h1 .alt-baslik {
      display: block;
      font-size: clamp(14px, 2vw, 18px);
      font-weight: 600;
      color: #8b5e3c;
      margin-top: 6px;
      letter-spacing: 0;
    }

    /* BUTON GRUP */
    .urun-btn-group {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .urun-btn {
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
      font-size: clamp(12px, 1.5vw, 13px);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: inherit;
      flex: 1;
      min-width: 140px;
      justify-content: center;
    }

    .urun-btn-primary {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.25);
    }

    .urun-btn-secondary {
      background: white;
      color: #3498db;
      border: 2px solid #3498db;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.1);
    }

    .urun-btn-tertiary {
      background: linear-gradient(135deg, #f0e6d6 0%, #e8d9c7 100%);
      color: #6b4e2e;
      border: 2px solid rgba(212, 175, 55, 0.3);
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
    }

    .urun-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .urun-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
    }

    /* HIZLI TARİH BUTONLARI */
    .hizli-tarih-grup {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .hizli-tarih-btn {
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid rgba(52, 152, 219, 0.2);
      background: white;
      color: #3498db;
      font-size: clamp(11px, 1.2vw, 12px);
      flex: 1;
      min-width: 80px;
      text-align: center;
    }

    .hizli-tarih-btn:hover {
      background: rgba(52, 152, 219, 0.1);
      border-color: #3498db;
    }

    /* FİLTRE BAR */
    .urun-filtre-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: flex-end;
      flex-wrap: wrap;
      padding: 20px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 248, 245, 0.9) 100%);
      border-radius: 18px;
      border: 1px solid rgba(52, 152, 219, 0.2);
      backdrop-filter: blur(10px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.05);
      width: 100%;
      box-sizing: border-box;
    }

    .urun-filtre-grup {
      flex: 1;
      min-width: 180px;
    }

    .urun-filtre-label {
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

    .urun-filtre-bar select,
    .urun-filtre-bar input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid rgba(52, 152, 219, 0.3);
      background: rgba(255, 255, 255, 0.8);
      color: #3a2c1a;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.05);
      box-sizing: border-box;
    }

    .urun-filtre-bar input[type="date"] {
      font-family: inherit;
    }

    .urun-filtre-bar select:focus,
    .urun-filtre-bar input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
      background: white;
    }

    /* ANA İÇERİK KONTEYNERİ */
    .urun-ana-container {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      width: 100%;
      box-sizing: border-box;
      min-height: calc(100vh - 200px);
    }

    @media (max-width: 1200px) {
      .urun-ana-container {
        grid-template-columns: 1fr;
      }
    }

    /* SOL TARAF - GENİŞ ALAN */
    .urun-sol-taraf {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
    }

    /* SAĞ TARAF - SABİT ÖZET PANELİ */
    .urun-sag-taraf {
      position: sticky;
      top: 20px;
      height: fit-content;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }

    @media (max-width: 1200px) {
      .urun-sag-taraf {
        position: static;
        margin-top: 20px;
      }
    }

    /* İSTATİSTİK BAR */
    .urun-istatistik-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .urun-istatistik-kutu {
      background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
      border-radius: 16px;
      padding: 20px;
      border: 1px solid rgba(52, 152, 219, 0.15);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.05);
    }

    .urun-istatistik-kutu:hover {
      transform: translateY(-5px);
      border-color: rgba(52, 152, 219, 0.3);
      box-shadow: 0 12px 25px rgba(52, 152, 219, 0.1);
    }

    .urun-istatistik-kutu::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3498db, #9b59b6);
    }

    .urun-istatistik-kutu h4 {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #6b4e2e;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.9;
    }

    .urun-istatistik-kutu .deger {
      font-size: 28px;
      font-weight: 900;
      color: #3498db;
      line-height: 1;
      margin: 8px 0;
      text-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
    }

    .urun-istatistik-kutu .aciklama {
      font-size: 13px;
      color: #8b5e3c;
      font-weight: 600;
    }

    /* ÜRÜN TABLOSU */
    .urun-tablo-container {
      background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
      padding: 24px;
      border-radius: 18px;
      box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.12);
      width: 100%;
      position: relative;
      overflow: hidden;
      max-width: 100%;
      overflow-x: auto;
      box-sizing: border-box;
    }

    .urun-tablo-container::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #3498db, #9b59b6);
    }

    .urun-tablo-container h2 {
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 800;
      color: #3a2c1a;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(52, 152, 219, 0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .urun-tablo-container h2 i {
      color: #3498db;
      font-size: 18px;
    }

    .urun-tablo {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 14px;
      border: 1px solid rgba(52, 152, 219, 0.15);
      border-radius: 14px;
      overflow: hidden;
      background: linear-gradient(135deg, #f9f5f0 0%, #f2ebe1 100%);
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.05);
      min-width: 1200px;
    }

    .urun-tablo thead {
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%);
    }

    .urun-tablo th {
      text-align: left;
      padding: 16px;
      font-weight: 700;
      color: #6b4e2e;
      border-bottom: 2px solid rgba(52, 152, 219, 0.2);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      white-space: nowrap;
    }

    .urun-tablo td {
      padding: 14px 16px;
      color: #3a2c1a;
      border-bottom: 1px solid rgba(52, 152, 219, 0.1);
      font-weight: 500;
      vertical-align: middle;
    }

    .urun-tablo tbody tr:last-child td {
      border-bottom: none;
    }

    .urun-tablo tbody tr:hover {
      background: rgba(52, 152, 219, 0.05);
    }

    .urun-aksiyon-butonlar {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .urun-aksiyon-btn {
      padding: 6px 10px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 4px;
      border: none;
      font-size: 12px;
      white-space: nowrap;
      flex: 1;
      min-width: 70px;
      justify-content: center;
    }

    .urun-aksiyon-btn-detay {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
      border: 1px solid rgba(52, 152, 219, 0.3);
    }

    .urun-aksiyon-btn-stok {
      background: rgba(46, 204, 113, 0.1);
      color: #27ae60;
      border: 1px solid rgba(46, 204, 113, 0.3);
    }

    .urun-aksiyon-btn-duzenle {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
      border: 1px solid rgba(243, 156, 18, 0.3);
    }

    .urun-aksiyon-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* STOK DURUMU BADGE */
    .stok-badge {
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .stok-yeterli {
      background: rgba(46, 204, 113, 0.1);
      color: #27ae60;
      border: 1px solid rgba(46, 204, 113, 0.3);
    }

    .stok-kritik {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .stok-yok {
      background: rgba(149, 165, 166, 0.1);
      color: #7f8c8d;
      border: 1px solid rgba(149, 165, 166, 0.3);
    }

    /* TREND BADGE */
    .trend-badge {
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .trend-artis {
      background: rgba(46, 204, 113, 0.1);
      color: #27ae60;
      border: 1px solid rgba(46, 204, 113, 0.3);
    }

    .trend-azalis {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .trend-stabil {
      background: rgba(243, 156, 18, 0.1);
      color: #f39c12;
      border: 1px solid rgba(243, 156, 18, 0.3);
    }

    /* MALİYETSİZ BADGE */
    .maliyetsiz-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      background: rgba(155, 89, 182, 0.1);
      color: #9b59b6;
      border: 1px solid rgba(155, 89, 182, 0.3);
      margin-left: 8px;
    }

    /* ÖDEME DAĞILIMI */
    .odeme-dagilimi {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;
    }

    .odeme-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      gap: 8px;
    }

    .odeme-label {
      color: #6b4e2e;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .odeme-deger {
      color: #3498db;
      font-weight: 700;
      white-space: nowrap;
    }

    /* ÖZET KART */
    .urun-ozet-kart {
      background: linear-gradient(135deg, #3a2c1a 0%, #4a3823 100%);
      padding: 24px;
      border-radius: 18px;
      box-shadow: 0 12px 35px rgba(58, 44, 26, 0.3);
      border: 1px solid rgba(52, 152, 219, 0.3);
      color: white;
      position: sticky;
      top: 20px;
      height: fit-content;
      max-width: 100%;
      box-sizing: border-box;
    }

    .urun-ozet-kart h2 {
      margin: 0 0 24px 0;
      font-size: 22px;
      font-weight: 800;
      color: #f5e6d3;
      padding-bottom: 14px;
      border-bottom: 2px solid rgba(52, 152, 219, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .urun-ozet-kart h2 i {
      color: #3498db;
      font-size: 20px;
      background: rgba(52, 152, 219, 0.2);
      padding: 10px;
      border-radius: 12px;
    }

    .urun-ozet-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 15px;
      transition: padding 0.2s ease;
      flex-wrap: wrap;
      gap: 8px;
    }

    .urun-ozet-row:hover {
      padding-left: 8px;
      padding-right: 8px;
    }

    .urun-ozet-row:last-child {
      border-bottom: none;
    }

    .urun-ozet-row .label {
      color: #c9b699;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 120px;
    }

    .urun-ozet-row .label i {
      font-size: 13px;
      opacity: 0.8;
    }

    .urun-ozet-row .value {
      font-weight: 700;
      font-size: 16px;
      color: #f5e6d3;
      text-align: right;
      flex: 1;
      min-width: 100px;
      word-break: break-word;
    }

    .urun-ozet-row.toplam-satis .value {
      color: #3498db;
    }

    .urun-ozet-row.toplam-kar .value {
      color: #f39c12;
    }

    .urun-ozet-row.en-cok-satis .value {
      color: #2ecc71;
    }

    .urun-ozet-row.en-karli .value {
      color: #f39c12;
    }

    /* KRİTİK STOK UYARISI */
    .kritik-stok-container {
      background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
      padding: 24px;
      border-radius: 18px;
      box-shadow: 0 6px 20px rgba(139, 94, 60, 0.08);
      border: 1px solid rgba(212, 175, 55, 0.12);
      width: 100%;
      margin-top: 24px;
      border-left: 4px solid #e74c3c;
      box-sizing: border-box;
    }

    .kritik-stok-container h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 800;
      color: #3a2c1a;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* SAYFALAMA */
    .sayfalama {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(52, 152, 219, 0.1);
      flex-wrap: wrap;
    }

    .sayfa-bilgi {
      font-weight: 600;
      color: #6b4e2e;
      font-size: 14px;
      text-align: center;
      min-width: 200px;
    }

    /* BOŞ DURUM */
    .urun-empty-state {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #ffffff 0%, #faf8f5 100%);
      border-radius: 16px;
      border: 1px solid rgba(212, 175, 55, 0.15);
      box-shadow: 0 6px 20px rgba(139, 94, 60, 0.05);
      grid-column: 1 / -1;
    }

    .urun-empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.5;
      color: #3498db;
    }

    .urun-empty-text {
      font-size: 20px;
      margin-bottom: 12px;
      color: #3a2c1a;
      font-weight: 700;
    }

    .urun-empty-subtext {
      font-size: 14px;
      color: #6b4e2e;
      max-width: 400px;
      margin: 0 auto;
      line-height: 1.6;
      opacity: 0.8;
    }

    /* YÜKLENİYOR */
    .yukleniyor-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }

    .yukleniyor-spinner {
      border: 4px solid rgba(52, 152, 219, 0.1);
      border-left-color: #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* RESPONSIVE */
    @media (max-width: 1400px) {
      .urun-ana-container {
        grid-template-columns: 1fr;
      }
      
      .urun-sag-taraf {
        position: static;
        margin-top: 20px;
      }
    }

    @media (max-width: 768px) {
      .urun-rapor-container {
        padding: 16px;
      }
      
      .urun-header {
        padding: 20px;
      }
      
      .urun-title h1 {
        font-size: 28px;
        min-width: 100%;
      }
      
      .urun-filtre-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .urun-filtre-grup {
        min-width: 100%;
      }
      
      .urun-btn-group {
        flex-direction: column;
      }
      
      .urun-btn {
        width: 100%;
        justify-content: center;
      }
      
      .urun-istatistik-bar {
        grid-template-columns: 1fr 1fr;
      }
      
      .urun-tablo {
        display: block;
        overflow-x: auto;
      }
      
      .hizli-tarih-grup {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      
      .hizli-tarih-btn {
        flex: 0 0 auto;
        min-width: 80px;
      }
      
      .urun-aksiyon-butonlar {
        flex-direction: column;
      }
      
      .urun-aksiyon-btn {
        width: 100%;
      }
      
      .sayfalama {
        flex-direction: column;
        gap: 12px;
      }
      
      .sayfa-bilgi {
        order: -1;
        width: 100%;
        margin-bottom: 8px;
      }
      
      .urun-filtre-label span {
        display: none;
      }
      
      .urun-filtre-label i {
        margin-right: 0;
      }
    }

    @media (max-width: 480px) {
      .urun-istatistik-bar {
        grid-template-columns: 1fr;
      }
      
      .urun-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      
      .urun-tablo th,
      .urun-tablo td {
        padding: 12px 8px;
      }
      
      .kritik-stok-container {
        padding: 16px;
        margin-top: 16px;
      }
    }

    /* YATAY MOD (landscape) İÇİN OPTİMİZE */
    @media (max-height: 600px) and (orientation: landscape) {
      .urun-sag-taraf {
        position: static;
        max-height: none;
      }
      
      .urun-ozet-kart {
        position: static;
      }
      
      .urun-ana-container {
        grid-template-columns: 1fr;
      }
      
      .urun-header {
        padding: 16px;
      }
      
      .urun-filtre-bar {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    /* KOYU MOD DESTEĞİ (opsiyonel) */
    @media (prefers-color-scheme: dark) {
      .urun-rapor-container {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: #e0e0e0;
      }
      
      .urun-header,
      .urun-istatistik-kutu,
      .urun-tablo-container,
      .kritik-stok-container {
        background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%);
        border-color: rgba(52, 152, 219, 0.2);
        color: #e0e0e0;
      }
      
      .urun-filtre-bar {
        background: linear-gradient(135deg, rgba(45, 45, 45, 0.9) 0%, rgba(61, 61, 61, 0.9) 100%);
      }
      
      .urun-filtre-bar select,
      .urun-filtre-bar input {
        background: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
        border-color: rgba(52, 152, 219, 0.4);
      }
      
      .urun-tablo {
        background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%);
        color: #e0e0e0;
      }
      
      .urun-tablo th {
        color: #b0b0b0;
      }
      
      .urun-tablo td {
        color: #e0e0e0;
      }
      
      .kritik-stok-container h3,
      .urun-tablo-container h2 {
        color: #e0e0e0;
      }
      
      .urun-ozet-kart {
        background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%);
      }
    }
    `;

    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="urun-rapor-container">
      {yukleniyor && (
        <div className="yukleniyor-overlay">
          <div className="yukleniyor-spinner"></div>
        </div>
      )}

      <div className="urun-header">
        <div className="urun-title">
          <h1>
            Ürün Bazlı Satış Raporları
            <span className="alt-baslik">
              Adisyon satırı bazlı detaylı ürün performans analizi
            </span>
          </h1>
        </div>

        <div className="hizli-tarih-grup">
          {hizliTarihSecenekleri.map((secenek, index) => (
            <button
              key={index}
              className="hizli-tarih-btn"
              onClick={secenek.onClick}
            >
              {secenek.label}
            </button>
          ))}
        </div>

        <div className="urun-btn-group">
          <button 
            className="urun-btn urun-btn-primary" 
            onClick={handleFiltrele}
            disabled={yukleniyor}
          >
            <i className="fas fa-filter"></i>
            {yukleniyor ? 'Yükleniyor...' : 'Filtrele'}
          </button>
          <button 
            className="urun-btn urun-btn-secondary" 
            onClick={handleSifirla}
            disabled={yukleniyor}
          >
            <i className="fas fa-redo"></i>
            Filtreleri Sıfırla
          </button>
          <button 
            className="urun-btn urun-btn-tertiary"
            onClick={handleExcelExport}
            disabled={yukleniyor}
          >
            <i className="fas fa-file-export"></i>
            Excel'e Aktar
          </button>
        </div>

        <div className="urun-filtre-bar">
          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-calendar-alt"></i>
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={filtreBaslangic.toISOString().split('T')[0]}
              onChange={(e) => setFiltreBaslangic(new Date(e.target.value))}
            />
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-calendar-alt"></i>
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={filtreBitis.toISOString().split('T')[0]}
              onChange={(e) => setFiltreBitis(new Date(e.target.value))}
            />
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-tags"></i>
              Kategori
            </label>
            <select
              value={filtreKategori}
              onChange={(e) => setFiltreKategori(e.target.value)}
            >
              {kategoriListesi.map((kategori, index) => (
                <option key={index} value={kategori}>
                  {kategori}
                </option>
              ))}
            </select>
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-receipt"></i>
              Satır Tipi
            </label>
            <select
              value={filtreSatirTipi}
              onChange={(e) => setFiltreSatirTipi(e.target.value)}
            >
              {satirTipleri.map((tip, index) => (
                <option key={index} value={tip.value}>
                  {tip.label}
                </option>
              ))}
            </select>
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-credit-card"></i>
              Ödeme Türü
            </label>
            <select
              value={filtreOdemeTuru}
              onChange={(e) => setFiltreOdemeTuru(e.target.value)}
            >
              {odemeTurleri.map((tur, index) => (
                <option key={index} value={tur.value}>
                  {tur.label}
                </option>
              ))}
            </select>
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-box"></i>
              Stok Durumu
            </label>
            <select
              value={filtreStokDurumu}
              onChange={(e) => setFiltreStokDurumu(e.target.value)}
            >
              {stokDurumlari.map((durum, index) => (
                <option key={index} value={durum.value}>
                  {durum.label}
                </option>
              ))}
            </select>
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-sort-amount-down"></i>
              Sıralama
            </label>
            <select
              value={siralama}
              onChange={(e) => setSiralama(e.target.value)}
            >
              {siralamaSecenekleri.map((secenek, index) => (
                <option key={index} value={secenek.value}>
                  {secenek.label}
                </option>
              ))}
            </select>
          </div>

          <div className="urun-filtre-grup">
            <label className="urun-filtre-label">
              <i className="fas fa-list-ol"></i>
              Sayfa Boyutu
            </label>
            <select
              value={sayfaBoyutu}
              onChange={(e) => setSayfaBoyutu(Number(e.target.value))}
            >
              <option value={10}>10 kayıt</option>
              <option value={20}>20 kayıt</option>
              <option value={50}>50 kayıt</option>
              <option value={100}>100 kayıt</option>
            </select>
          </div>
        </div>
      </div>

      {yukleniyor ? (
        <div className="urun-loading-state">
          <div className="urun-loading-spinner"></div>
          <div className="urun-loading-text">Ürün verileri yükleniyor...</div>
        </div>
      ) : urunRaporlari.length === 0 ? (
        <div className="urun-empty-state">
          <div className="urun-empty-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <div className="urun-empty-text">Ürün verisi bulunamadı</div>
          <div className="urun-empty-subtext">
            Seçtiğiniz filtre kriterlerine uygun ürün verisi bulunamadı.
            Lütfen farklı tarih veya filtrelerle tekrar deneyin.
          </div>
        </div>
      ) : (
        <div className="urun-ana-container">
          <div className="urun-sol-taraf">
            <div className="urun-istatistik-bar">
              <div className="urun-istatistik-kutu">
                <h4>Toplam Satış</h4>
                <div className="deger">{istatistikler.toplamSatis.toLocaleString('tr-TR')} ₺</div>
                <div className="aciklama">{toplamKayit} ürün</div>
              </div>
              <div className="urun-istatistik-kutu">
                <h4>Toplam Kar</h4>
                <div className="deger">{istatistikler.toplamKar.toLocaleString('tr-TR')} ₺</div>
                <div className="aciklama">{istatistikler.toplamSatirAdedi} satır</div>
              </div>
              <div className="urun-istatistik-kutu">
                <h4>Ortalama Satış</h4>
                <div className="deger">{istatistikler.ortalamaSatis.toFixed(2)} ₺</div>
                <div className="aciklama">Ürün başına</div>
              </div>
              <div className="urun-istatistik-kutu">
                <h4>Aktif Ürün</h4>
                <div className="deger">{istatistikler.aktifUrunSayisi}</div>
                <div className="aciklama">{istatistikler.kritikStokUrunSayisi} kritik</div>
              </div>
            </div>

            <div className="urun-tablo-container">
              <h2>
                <i className="fas fa-chart-line"></i>
                Ürün Satış Performansı (Adisyon Satırı Bazlı)
                <span style={{ fontSize: '14px', color: '#8b5e3c', marginLeft: '10px' }}>
                  {formatTarih(filtreBaslangic)} - {formatTarih(filtreBitis)}
                </span>
              </h2>
              
              <table className="urun-tablo">
                <thead>
                  <tr>
                    <th>Ürün Bilgisi</th>
                    <th>Stok</th>
                    <th>Satış Bilgileri</th>
                    <th>Kar Bilgileri</th>
                    <th>İşlem Dağılımı</th>
                    <th>Ödeme Dağılımı</th>
                    <th>Trend</th>
                    <th>Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody>
                  {urunRaporlari.map((urun) => (
                    <tr key={urun.urunId}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <strong>{urun.urunAdi}</strong>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {urun.barkod} • {urun.kategori}
                          </div>
                          {urun.maliyetsizUrun && (
                            <span className="maliyetsiz-badge">MALİYETSİZ</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`stok-badge stok-${urun.stokDurumu.toLowerCase()}`}>
                            {urun.stokDurumu === 'YETERLI' && '✓ Yeterli'}
                            {urun.stokDurumu === 'KRITIK' && '⚠ Kritik'}
                            {urun.stokDurumu === 'STOKTA_YOK' && '✗ Stok Yok'}
                          </span>
                          <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            {urun.stok} / {urun.kritikStok}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>
                            <strong>{urun.toplamSatis.toLocaleString('tr-TR')} ₺</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {urun.satisAdedi} satış
                          </div>
                          <div style={{ fontSize: '11px', color: '#e74c3c' }}>
                            {urun.iptalAdedi} iptal • {urun.ikramAdedi} ikram
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ color: '#27ae60', fontWeight: '700' }}>
                            {urun.toplamKar.toLocaleString('tr-TR')} ₺
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            %{urun.karOrani} kar oranı
                          </div>
                          {urun.maliyet > 0 && (
                            <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                              Maliyet: {urun.maliyet.toFixed(2)} ₺
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <div>Satış: {urun.satisAdedi}</div>
                          <div style={{ color: '#e74c3c' }}>İptal: {urun.iptalAdedi}</div>
                          <div style={{ color: '#3498db' }}>İkram: {urun.ikramAdedi}</div>
                        </div>
                      </td>
                      <td>
                        {urun.odemeDagilimi ? (
                          <div className="odeme-dagilimi">
                            {Object.entries(urun.odemeDagilimi).map(([tur, tutar]) => (
                              <div key={tur} className="odeme-item">
                                <span className="odeme-label">
                                  {tur === 'NAKIT' ? 'Nakit' : 
                                   tur === 'KREDI_KARTI' ? 'Kart' : 
                                   tur === 'HESABA_YAZ' ? 'Hesap' : tur}
                                </span>
                                <span className="odeme-deger">{tutar} ₺</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#666' }}>Veri yok</div>
                        )}
                      </td>
                      <td>
                        <span className={`trend-badge trend-${urun.trend}`}>
                          {urun.trend === 'artis' && '↑ Artış'}
                          {urun.trend === 'azalis' && '↓ Azalış'}
                          {urun.trend === 'stabil' && '→ Stabil'}
                        </span>
                      </td>
                      <td>
                        <div className="urun-aksiyon-butonlar">
                          <button 
                            className="urun-aksiyon-btn urun-aksiyon-btn-detay"
                            onClick={() => handleUrunDetay(urun.urunId)}
                            title="Detaylı rapor"
                          >
                            <i className="fas fa-chart-bar"></i>
                            Detay
                          </button>
                          <button 
                            className="urun-aksiyon-btn urun-aksiyon-btn-stok"
                            onClick={() => handleStokGuncelle(urun.urunId)}
                            title="Stok güncelle"
                          >
                            <i className="fas fa-box"></i>
                            Stok
                          </button>
                          <button 
                            className="urun-aksiyon-btn urun-aksiyon-btn-duzenle"
                            onClick={() => handleUrunDuzenle(urun.urunId)}
                            title="Ürün düzenle"
                          >
                            <i className="fas fa-edit"></i>
                            Düzenle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {toplamKayit > 0 && (
                <div className="sayfalama">
                  <button 
                    className="urun-btn urun-btn-secondary"
                    onClick={() => handleSayfaDegistir(sayfa - 1)}
                    disabled={sayfa === 1 || yukleniyor}
                  >
                    <i className="fas fa-chevron-left"></i>
                    Önceki
                  </button>
                  <span className="sayfa-bilgi">
                    Sayfa {sayfa} / {toplamSayfa} • Toplam {toplamKayit} kayıt
                  </span>
                  <button 
                    className="urun-btn urun-btn-secondary"
                    onClick={() => handleSayfaDegistir(sayfa + 1)}
                    disabled={sayfa === toplamSayfa || yukleniyor}
                  >
                    Sonraki
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>

            {istatistikler.kritikStokUrunSayisi > 0 && (
              <div className="kritik-stok-container">
                <h3>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#e74c3c' }}></i>
                  Kritik Stok Uyarısı
                </h3>
                <p>
                  <strong>{istatistikler.kritikStokUrunSayisi} ürün</strong> kritik stok seviyesinde 
                  veya stokta bulunmuyor. Acil stok takviyesi gerekiyor.
                </p>
              </div>
            )}
          </div>

          <div className="urun-sag-taraf">
            <div className="urun-ozet-kart">
              <h2>
                <i className="fas fa-chart-pie"></i>
                Özet Bilgiler
              </h2>
              
              <div className="urun-ozet-row toplam-satis">
                <span className="label">
                  <i className="fas fa-shopping-cart"></i>
                  Toplam Satış
                </span>
                <span className="value">{istatistikler.toplamSatis.toLocaleString('tr-TR')} ₺</span>
              </div>
              
              <div className="urun-ozet-row toplam-kar">
                <span className="label">
                  <i className="fas fa-money-bill-wave"></i>
                  Toplam Kar
                </span>
                <span className="value">{istatistikler.toplamKar.toLocaleString('tr-TR')} ₺</span>
              </div>
              
              <div className="urun-ozet-row">
                <span className="label">
                  <i className="fas fa-receipt"></i>
                  Toplam Satır
                </span>
                <span className="value">{istatistikler.toplamSatirAdedi}</span>
              </div>
              
              <div className="urun-ozet-row en-cok-satis">
                <span className="label">
                  <i className="fas fa-trophy"></i>
                  En Çok Satış
                </span>
                <span className="value">{istatistikler.enCokSatisUrun}</span>
              </div>
              
              <div className="urun-ozet-row en-karli">
                <span className="label">
                  <i className="fas fa-chart-line"></i>
                  En Karlı Ürün
                </span>
                <span className="value">{istatistikler.enKarliUrun}</span>
              </div>
              
              <div className="urun-ozet-row">
                <span className="label">
                  <i className="fas fa-boxes"></i>
                  Aktif Ürün
                </span>
                <span className="value">{istatistikler.aktifUrunSayisi}</span>
              </div>
              
              <div className="urun-ozet-row">
                <span className="label">
                  <i className="fas fa-exclamation-circle"></i>
                  Kritik Stok
                </span>
                <span className="value" style={{ color: '#e74c3c' }}>
                  {istatistikler.kritikStokUrunSayisi}
                </span>
              </div>

              <div className="urun-ozet-row">
                <span className="label">
                  <i className="fas fa-calendar-alt"></i>
                  Tarih Aralığı
                </span>
                <span className="value" style={{ fontSize: '14px' }}>
                  {formatTarih(filtreBaslangic)} - {formatTarih(filtreBitis)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrunBazliSatis;