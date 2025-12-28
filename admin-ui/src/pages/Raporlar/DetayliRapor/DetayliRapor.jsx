import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  ChevronLeft,
  BarChart3,
  PieChart,
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CreditCard,
  Home,
  Coffee,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Loader2
} from 'lucide-react';

const DetayliRapor = () => {
  const navigate = useNavigate();
  
  // State'ler
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [baslangicTarihi, setBaslangicTarihi] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 7 gün önce
    return date.toISOString().split('T')[0];
  });
  const [bitisTarihi, setBitisTarihi] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [filtreMasaTipi, setFiltreMasaTipi] = useState('tum-masalar');
  const [filtreOdemeTuru, setFiltreOdemeTuru] = useState('tum-odemeler');
  const [filtreKategori, setFiltreKategori] = useState('tum-kategoriler');
  const [aktifFiltreler, setAktifFiltreler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [raporVerileri, setRaporVerileri] = useState(null);
  const [hata, setHata] = useState(null);

  // Responsive state
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // LocalStorage'dan tüm verileri çek
  const getAllData = useCallback(() => {
    try {
      return {
        adisyonlar: JSON.parse(localStorage.getItem('mc_adisyonlar')) || [],
        masalar: JSON.parse(localStorage.getItem('mc_masalar')) || [],
        urunler: JSON.parse(localStorage.getItem('mc_urunler')) || [],
        giderler: JSON.parse(localStorage.getItem('mc_giderler')) || [],
        borclar: JSON.parse(localStorage.getItem('mc_borclar')) || [],
        kategoriler: JSON.parse(localStorage.getItem('mc_kategoriler')) || [],
        bilardoMasalari: JSON.parse(localStorage.getItem('mc_bilardo')) || []
      };
    } catch (error) {
      console.error('Veri okuma hatası:', error);
      return {
        adisyonlar: [], masalar: [], urunler: [], giderler: [],
        borclar: [], kategoriler: [], bilardoMasalari: []
      };
    }
  }, []);

  // Tarih formatlama
  const formatTarih = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // Para formatlama
  const formatPara = useCallback((miktar) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(miktar || 0);
  }, []);

  // Süre formatlama
  const formatSure = useCallback((dakika) => {
    if (!dakika || dakika === 0) return '0:00';
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return `${saat}:${dk.toString().padStart(2, '0')}`;
  }, []);

  // Hızlı tarih seçenekleri
  const hizliTarihSecenekleri = useMemo(() => [
    { label: 'Bugün', gunler: 0 },
    { label: 'Dün', gunler: 1 },
    { label: 'Son 7 Gün', gunler: 7 },
    { label: 'Son 30 Gün', gunler: 30 },
    { label: 'Bu Ay', gunler: 'bu-ay' },
    { label: 'Geçen Ay', gunler: 'gecen-ay' }
  ], []);

  // Hızlı tarih seç
  const handleHizliTarih = useCallback((secenek) => {
    const bugun = new Date();
    
    if (secenek.gunler === 'bu-ay') {
      const ilkGun = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
      const sonGun = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0);
      setBaslangicTarihi(ilkGun.toISOString().split('T')[0]);
      setBitisTarihi(sonGun.toISOString().split('T')[0]);
    } else if (secenek.gunler === 'gecen-ay') {
      const gecenAy = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
      const gecenAySon = new Date(bugun.getFullYear(), bugun.getMonth(), 0);
      setBaslangicTarihi(gecenAy.toISOString().split('T')[0]);
      setBitisTarihi(gecenAySon.toISOString().split('T')[0]);
    } else {
      const baslangic = new Date();
      baslangic.setDate(bugun.getDate() - secenek.gunler);
      setBaslangicTarihi(baslangic.toISOString().split('T')[0]);
      setBitisTarihi(bugun.toISOString().split('T')[0]);
    }
  }, []);

  // Filtre ekle
  const handleFiltreEkle = useCallback((filtreAdi, deger) => {
    if (!deger || deger.includes('tum')) return;
    
    const yeniFiltre = `${filtreAdi}: ${deger}`;
    if (!aktifFiltreler.includes(yeniFiltre)) {
      setAktifFiltreler(prev => [...prev, yeniFiltre]);
    }
  }, [aktifFiltreler]);

  // Filtre kaldır
  const handleFiltreKaldir = useCallback((index) => {
    setAktifFiltreler(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Tüm filtreleri temizle
  const handleFiltreleriTemizle = useCallback(() => {
    setAktifFiltreler([]);
    setFiltreMasaTipi('tum-masalar');
    setFiltreOdemeTuru('tum-odemeler');
    setFiltreKategori('tum-kategoriler');
  }, []);

  // Rapor verilerini hesapla
  const hesaplaRaporVerileri = useCallback(async () => {
    setYukleniyor(true);
    setHata(null);
    
    try {
      const data = getAllData();
      const baslangic = new Date(baslangicTarihi + 'T00:00:00');
      const bitis = new Date(bitisTarihi + 'T23:59:59');
      
      // 1. FİNANSAL ÖZET HESAPLAMALARI
      const finansalOzet = () => {
        // Kapalı adisyonları filtrele
        const kapaliAdisyonlar = data.adisyonlar.filter(adisyon => {
          if (!adisyon.kapali || !adisyon.kapanisZamani) return false;
          const tarih = new Date(adisyon.kapanisZamani);
          return tarih >= baslangic && tarih <= bitis;
        });

        // Giderleri filtrele
        const donemGiderleri = data.giderler.filter(gider => {
          if (!gider.tarih) return false;
          const tarih = new Date(gider.tarih);
          return tarih >= baslangic && tarih <= bitis;
        });

        // Borçları filtrele (hesaba yazılanlar)
        const donemBorclar = data.borclar.filter(borc => {
          if (!borc.tarih) return false;
          const tarih = new Date(borc.tarih);
          return tarih >= baslangic && tarih <= bitis;
        });

        // Ödeme dağılımı
        const odemeDagilimi = { nakit: 0, kart: 0, hesap: 0 };
        kapaliAdisyonlar.forEach(adisyon => {
          if (adisyon.odemeler && Array.isArray(adisyon.odemeler)) {
            adisyon.odemeler.forEach(odeme => {
              const tur = (odeme.tur || '').toLowerCase();
              const tutar = parseFloat(odeme.tutar) || 0;
              
              if (tur.includes('nakit')) odemeDagilimi.nakit += tutar;
              else if (tur.includes('kart') || tur.includes('kredi')) odemeDagilimi.kart += tutar;
              else if (tur.includes('hesap') || tur.includes('yaz')) odemeDagilimi.hesap += tutar;
            });
          }
        });

        const toplamCiro = kapaliAdisyonlar.reduce((sum, a) => sum + (a.toplam || 0), 0);
        const toplamGider = donemGiderleri.reduce((sum, g) => sum + (g.tutar || 0), 0);
        const toplamHesabaYaz = donemBorclar.reduce((sum, b) => sum + (b.tutar || 0), 0);
        const netKar = toplamCiro - toplamGider;
        const karMarji = toplamCiro > 0 ? (netKar / toplamCiro) * 100 : 0;

        return {
          toplamCiro,
          toplamGider,
          toplamHesabaYaz,
          netKar,
          karMarji,
          odemeDagilimi,
          adisyonSayisi: kapaliAdisyonlar.length,
          giderSayisi: donemGiderleri.length,
          borcSayisi: donemBorclar.length
        };
      };

      // 2. MASA PERFORMANSI HESAPLAMALARI
      const masaPerformansi = () => {
        const kapaliAdisyonlar = data.adisyonlar.filter(adisyon => {
          if (!adisyon.kapali || !adisyon.kapanisZamani) return false;
          const tarih = new Date(adisyon.kapanisZamani);
          return tarih >= baslangic && tarih <= bitis;
        });

        // Masa gruplama
        const masaGruplari = {};
        
        kapaliAdisyonlar.forEach(adisyon => {
          const masaKey = adisyon.masaId || adisyon.masaNo || 'bilinmeyen';
          
          if (!masaGruplari[masaKey]) {
            let masaAdi = "Bilinmeyen Masa";
            let masaTipi = "normal";
            
            if (adisyon.masaId) {
              const masa = data.masalar.find(m => m.id === adisyon.masaId);
              masaAdi = masa ? `Masa ${masa.masaNo}` : `Masa ${adisyon.masaId}`;
            } else if (adisyon.masaNo) {
              masaAdi = `Masa ${adisyon.masaNo}`;
            }
            
            if (adisyon.bilardoMasaId) {
              const bilardoMasa = data.bilardoMasalari.find(m => m.id === adisyon.bilardoMasaId);
              masaAdi = bilardoMasa ? `Bilardo ${bilardoMasa.masaNo}` : `Bilardo ${adisyon.bilardoMasaId}`;
              masaTipi = "bilardo";
            }
            
            masaGruplari[masaKey] = {
              ad: masaAdi,
              tip: masaTipi,
              adisyonSayisi: 0,
              toplamCiro: 0,
              toplamSure: 0,
              ortalamaSure: 0,
              aktifGun: 0
            };
          }
          
          // Süre hesaplama
          let sure = 0;
          if (adisyon.olusturulmaTarihi && adisyon.kapanisZamani) {
            const baslangic = new Date(adisyon.olusturulmaTarihi);
            const bitis = new Date(adisyon.kapanisZamani);
            sure = Math.floor((bitis - baslangic) / (1000 * 60)); // dakika
          }
          
          masaGruplari[masaKey].adisyonSayisi++;
          masaGruplari[masaKey].toplamCiro += (adisyon.toplam || 0);
          masaGruplari[masaKey].toplamSure += sure;
        });

        // Ortalama süreleri hesapla
        Object.keys(masaGruplari).forEach(key => {
          const masa = masaGruplari[key];
          masa.ortalamaSure = masa.adisyonSayisi > 0 ? masa.toplamSure / masa.adisyonSayisi : 0;
          masa.aktifGun = Math.min(masa.adisyonSayisi, 30); // Basit aktif gün hesabı
        });

        // En iyi 10 masayı seç
        const tumMasalar = Object.values(masaGruplari);
        const siralanmisMasalar = [...tumMasalar].sort((a, b) => b.toplamCiro - a.toplamCiro);
        
        return {
          tumMasalar: tumMasalar,
          enIyiMasalar: siralanmisMasalar.slice(0, 10),
          toplamMasaSayisi: tumMasalar.length,
          ortalamaMasaCiro: tumMasalar.length > 0 ? 
            tumMasalar.reduce((sum, m) => sum + m.toplamCiro, 0) / tumMasalar.length : 0,
          ortalamaMasaSure: tumMasalar.length > 0 ? 
            tumMasalar.reduce((sum, m) => sum + m.ortalamaSure, 0) / tumMasalar.length : 0
        };
      };

      // 3. ÜRÜN SATIŞ ANALİZİ
      const urunSatisAnalizi = () => {
        const kapaliAdisyonlar = data.adisyonlar.filter(adisyon => {
          if (!adisyon.kapali || !adisyon.kapanisZamani) return false;
          const tarih = new Date(adisyon.kapanisZamani);
          return tarih >= baslangic && tarih <= bitis;
        });

        const urunSatisMap = {};
        
        kapaliAdisyonlar.forEach(adisyon => {
          if (adisyon.urunler && Array.isArray(adisyon.urunler)) {
            adisyon.urunler.forEach(urunItem => {
              const urunId = urunItem.urunId || urunItem.id;
              if (!urunId) return;
              
              const urun = data.urunler.find(u => u.id === urunId);
              const urunAdi = urun ? (urun.urunAdi || urun.ad || urun.name || 'Bilinmeyen Ürün') : 'Bilinmeyen Ürün';
              const kategoriAdi = urun ? (urun.kategoriAdi || urun.kategori || 'Diğer') : 'Diğer';
              const satisFiyati = urun ? (urun.satisFiyati || urun.fiyat || urun.salePrice || 0) : 0;
              const maliyetFiyati = urun ? (urun.maliyet || urun.costPrice || 0) : 0;
              const adet = urunItem.adet || 1;
              
              if (!urunSatisMap[urunAdi]) {
                urunSatisMap[urunAdi] = {
                  urun: urunAdi,
                  kategori: kategoriAdi,
                  toplamAdet: 0,
                  toplamTutar: 0,
                  toplamKar: 0,
                  ortalamaFiyat: 0,
                  karOrani: 0,
                  maliyetsiz: maliyetFiyati === 0
                };
              }
              
              urunSatisMap[urunAdi].toplamAdet += adet;
              urunSatisMap[urunAdi].toplamTutar += adet * satisFiyati;
              urunSatisMap[urunAdi].toplamKar += adet * (satisFiyati - maliyetFiyati);
            });
          }
        });

        // Ortalama fiyat ve kar oranını hesapla
        Object.keys(urunSatisMap).forEach(key => {
          const urun = urunSatisMap[key];
          urun.ortalamaFiyat = urun.toplamAdet > 0 ? urun.toplamTutar / urun.toplamAdet : 0;
          urun.karOrani = urun.toplamTutar > 0 ? (urun.toplamKar / urun.toplamTutar) * 100 : 0;
        });

        const tumUrunler = Object.values(urunSatisMap);
        const enCokSatanlar = [...tumUrunler].sort((a, b) => b.toplamAdet - a.toplamAdet).slice(0, 10);
        const enKarliUrunler = [...tumUrunler].sort((a, b) => b.toplamKar - a.toplamKar).slice(0, 10);

        return {
          tumUrunler: tumUrunler,
          enCokSatanlar: enCokSatanlar,
          enKarliUrunler: enKarliUrunler,
          toplamUrunCesidi: tumUrunler.length,
          toplamSatisAdedi: tumUrunler.reduce((sum, u) => sum + u.toplamAdet, 0),
          toplamUrunCiro: tumUrunler.reduce((sum, u) => sum + u.toplamTutar, 0),
          ortalamaUrunFiyati: tumUrunler.length > 0 ? 
            tumUrunler.reduce((sum, u) => sum + u.ortalamaFiyat, 0) / tumUrunler.length : 0
        };
      };

      // 4. KATEGORİ BAZLI ANALİZ
      const kategoriAnalizi = () => {
        const urunAnalizi = urunSatisAnalizi();
        const kategoriMap = {};
        
        urunAnalizi.tumUrunler.forEach(urun => {
          const kategori = urun.kategori || 'Diğer';
          
          if (!kategoriMap[kategori]) {
            kategoriMap[kategori] = {
              kategori: kategori,
              urunSayisi: 0,
              toplamSatis: 0,
              toplamKar: 0,
              satisAdedi: 0
            };
          }
          
          kategoriMap[kategori].urunSayisi++;
          kategoriMap[kategori].toplamSatis += urun.toplamTutar;
          kategoriMap[kategori].toplamKar += urun.toplamKar;
          kategoriMap[kategori].satisAdedi += urun.toplamAdet;
        });

        const tumKategoriler = Object.values(kategoriMap);
        
        // Kar oranı hesapla
        tumKategoriler.forEach(kategori => {
          kategori.karOrani = kategori.toplamSatis > 0 ? 
            (kategori.toplamKar / kategori.toplamSatis) * 100 : 0;
        });

        const siralanmisKategoriler = [...tumKategoriler].sort((a, b) => b.toplamSatis - a.toplamSatis);
        const enCokSatisKategoriler = siralanmisKategoriler.slice(0, 8);

        return {
          tumKategoriler: tumKategoriler,
          enCokSatisKategoriler: enCokSatisKategoriler,
          toplamKategori: tumKategoriler.length,
          toplamKategoriSatis: tumKategoriler.reduce((sum, k) => sum + k.toplamSatis, 0)
        };
      };

      // 5. ZAMAN BAZLI ANALİZ (Saatlik/Daily)
      const zamanAnalizi = () => {
        const kapaliAdisyonlar = data.adisyonlar.filter(adisyon => {
          if (!adisyon.kapali || !adisyon.kapanisZamani) return false;
          const tarih = new Date(adisyon.kapanisZamani);
          return tarih >= baslangic && tarih <= bitis;
        });

        // Saatlik analiz
        const saatlikMap = {};
        for (let i = 0; i < 24; i++) {
          saatlikMap[i] = {
            saat: `${i.toString().padStart(2, '0')}:00`,
            adisyonSayisi: 0,
            toplamCiro: 0,
            ortalamaCiro: 0
          };
        }

        kapaliAdisyonlar.forEach(adisyon => {
          const tarih = new Date(adisyon.kapanisZamani);
          const saat = tarih.getHours();
          
          saatlikMap[saat].adisyonSayisi++;
          saatlikMap[saat].toplamCiro += (adisyon.toplam || 0);
        });

        // Ortalama ciro hesapla
        Object.keys(saatlikMap).forEach(saat => {
          const data = saatlikMap[saat];
          data.ortalamaCiro = data.adisyonSayisi > 0 ? data.toplamCiro / data.adisyonSayisi : 0;
        });

        const saatlikVeriler = Object.values(saatlikMap);
        const enYogunSaatler = [...saatlikVeriler].sort((a, b) => b.toplamCiro - a.toplamCiro).slice(0, 5);

        // Günlük analiz (basit)
        const gunlukMap = {};
        const gunSayisi = Math.ceil((bitis - baslangic) / (1000 * 60 * 60 * 24)) + 1;
        
        for (let i = 0; i < gunSayisi; i++) {
          const gun = new Date(baslangic);
          gun.setDate(gun.getDate() + i);
          const gunKey = gun.toISOString().split('T')[0];
          
          gunlukMap[gunKey] = {
            tarih: gunKey,
            gunAdi: gun.toLocaleDateString('tr-TR', { weekday: 'short' }),
            adisyonSayisi: 0,
            toplamCiro: 0
          };
        }

        kapaliAdisyonlar.forEach(adisyon => {
          const tarih = new Date(adisyon.kapanisZamani);
          const gunKey = tarih.toISOString().split('T')[0];
          
          if (gunlukMap[gunKey]) {
            gunlukMap[gunKey].adisyonSayisi++;
            gunlukMap[gunKey].toplamCiro += (adisyon.toplam || 0);
          }
        });

        const gunlukVeriler = Object.values(gunlukMap);

        return {
          saatlikVeriler: saatlikVeriler,
          enYogunSaatler: enYogunSaatler,
          gunlukVeriler: gunlukVeriler,
          ortalamaGunlukCiro: gunlukVeriler.length > 0 ? 
            gunlukVeriler.reduce((sum, g) => sum + g.toplamCiro, 0) / gunlukVeriler.length : 0,
          enYogunGun: gunlukVeriler.reduce((max, g) => 
            g.toplamCiro > max.toplamCiro ? g : max, 
            { toplamCiro: 0 }
          )
        };
      };

      // Tüm rapor verilerini birleştir
      const finansal = finansalOzet();
      const masa = masaPerformansi();
      const urun = urunSatisAnalizi();
      const kategori = kategoriAnalizi();
      const zaman = zamanAnalizi();

      setRaporVerileri({
        finansal,
        masa,
        urun,
        kategori,
        zaman,
        genel: {
          baslangicTarihi: baslangic.toISOString(),
          bitisTarihi: bitis.toISOString(),
          toplamGun: Math.ceil((bitis - baslangic) / (1000 * 60 * 60 * 24)) + 1,
          hesaplamaZamani: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Rapor hesaplama hatası:', error);
      setHata('Rapor hesaplanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  }, [baslangicTarihi, bitisTarihi, getAllData]);

  // İlk yüklemede raporu çalıştır
  useEffect(() => {
    hesaplaRaporVerileri();
  }, [hesaplaRaporVerileri]);

  // Filtreleri uygula butonu
  const handleFiltreleriUygula = useCallback(() => {
    handleFiltreEkle('Masa Tipi', filtreMasaTipi);
    handleFiltreEkle('Ödeme Türü', filtreOdemeTuru);
    handleFiltreEkle('Kategori', filtreKategori);
    hesaplaRaporVerileri();
  }, [filtreMasaTipi, filtreOdemeTuru, filtreKategori, handleFiltreEkle, hesaplaRaporVerileri]);

  // PDF Export
  const handlePDFExport = useCallback(() => {
    alert('PDF raporu oluşturuluyor...');
    // Gerçek implementasyon için jsPDF kütüphanesi kullanılabilir
  }, []);

  // Excel Export
  const handleExcelExport = useCallback(() => {
    if (!raporVerileri) return;
    
    const dataToExport = {
      tarihAraligi: `${formatTarih(baslangicTarihi)} - ${formatTarih(bitisTarihi)}`,
      finansal: raporVerileri.finansal,
      masaPerformans: raporVerileri.masa.enIyiMasalar,
      urunSatislari: raporVerileri.urun.enCokSatanlar,
      kategoriAnalizi: raporVerileri.kategori.enCokSatisKategoriler
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detayli-rapor-${baslangicTarihi}-${bitisTarihi}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert('Rapor verileri indiriliyor...');
  }, [raporVerileri, baslangicTarihi, bitisTarihi, formatTarih]);

  // Yazdır
  const handleYazdir = useCallback(() => {
    window.print();
  }, []);

  // Yardımcı fonksiyonlar
  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp size={16} color="#10b981" />;
    if (value < 0) return <TrendingDown size={16} color="#ef4444" />;
    return null;
  };

  const getTrendColor = (value) => {
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return '#6b7280';
  };

  // Container style
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#fef3c7',
    backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
    padding: isMobile ? '16px' : '24px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#4b2e05'
  };

  const wrapperStyle = {
    maxWidth: '100%',
    margin: '0 auto'
  };

  if (yukleniyor && !raporVerileri) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}>
          <Loader2 size={48} className="animate-spin" color="#d97706" />
          <p style={{ marginTop: '16px', color: '#4b2e05' }}>
            Detaylı rapor hazırlanıyor...
          </p>
        </div>
      </div>
    );
  }

  if (hata) {
    return (
      <div style={containerStyle}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <AlertCircle size={48} color="#ef4444" />
          <h2 style={{ color: '#ef4444', marginTop: '16px' }}>
            Hata Oluştu
          </h2>
          <p style={{ color: '#4b2e05', margin: '16px 0 24px' }}>
            {hata}
          </p>
          <button 
            onClick={hesaplaRaporVerileri}
            style={{
              padding: '12px 24px',
              backgroundColor: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <RefreshCw size={16} />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Breadcrumb ve Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#92400e',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => navigate('/raporlar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#92400e',
                textDecoration: 'none',
                fontWeight: '500',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #fbbf24',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} />
              Raporlara Dön
            </button>
            <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
            <span style={{ fontWeight: '600', color: '#4b2e05' }}>Detaylı Rapor</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '16px' : '0',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '28px' : '36px',
                fontWeight: 'bold',
                color: '#4b2e05',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FileText size={isMobile ? 24 : 32} color="#0ea5e9" />
                📊 Detaylı Rapor Analizi
              </h1>
              <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
                Seçilen tarih aralığında tüm raporları tek ekranda görüntüleyin
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={handlePDFExport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  color: '#92400e',
                  border: '1px solid #fbbf24',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Download size={16} />
                PDF İndir
              </button>
              <button 
                onClick={handleYazdir}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white',
                  color: '#92400e',
                  border: '1px solid #fbbf24',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Printer size={16} />
                Yazdır
              </button>
            </div>
          </div>
        </div>

        {/* Tarih ve Filtre Bölümü */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          {/* Hızlı Tarih Butonları */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#4b2e05',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Calendar size={16} />
              Hızlı Tarih Seçenekleri
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {hizliTarihSecenekleri.map((secenek, index) => (
                <button 
                  key={index}
                  onClick={() => handleHizliTarih(secenek)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {secenek.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tarih Seçimleri */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Calendar size={16} />
                Başlangıç Tarihi
              </div>
              <input
                type="date"
                value={baslangicTarihi}
                onChange={(e) => setBaslangicTarihi(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%'
                }}
                max={bitisTarihi}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Calendar size={16} />
                Bitiş Tarihi
              </div>
              <input
                type="date"
                value={bitisTarihi}
                onChange={(e) => setBitisTarihi(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%'
                }}
                min={baslangicTarihi}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Detaylı Filtreler */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Users size={16} />
                Masa Tipi
              </div>
              <select 
                value={filtreMasaTipi}
                onChange={(e) => setFiltreMasaTipi(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <option value="tum-masalar">Tüm Masalar</option>
                <option value="normal-masalar">Normal Masalar</option>
                <option value="bilardo-masalar">Bilardo Masaları</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CreditCard size={16} />
                Ödeme Türü
              </div>
              <select 
                value={filtreOdemeTuru}
                onChange={(e) => setFiltreOdemeTuru(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <option value="tum-odemeler">Tüm Ödemeler</option>
                <option value="nakit">Nakit</option>
                <option value="kart">Kredi Kartı</option>
                <option value="hesap">Hesaba Yaz</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShoppingBag size={16} />
                Kategori
              </div>
              <select 
                value={filtreKategori}
                onChange={(e) => setFiltreKategori(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <option value="tum-kategoriler">Tüm Kategoriler</option>
                <option value="sicak-icecekler">Sıcak İçecekler</option>
                <option value="soguk-icecekler">Soğuk İçecekler</option>
                <option value="yiyecekler">Yiyecekler</option>
                <option value="tatlilar">Tatlılar</option>
              </select>
            </div>
          </div>

          {/* Aktif Filtreler ve Butonlar */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '16px'
          }}>
            {/* Aktif Filtreler */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              flex: 1
            }}>
              {aktifFiltreler.map((filtre, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #fbbf24',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#92400e'
                }}>
                  <span>{filtre}</span>
                  <button 
                    onClick={() => handleFiltreKaldir(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Filtre Butonları */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={handleFiltreleriTemizle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#fef2f2',
                  color: '#ef4444'
                }}
              >
                <RefreshCw size={16} />
                Temizle
              </button>
              <button 
                onClick={handleFiltreleriUygula}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
                }}
              >
                <Filter size={16} />
                Filtreleri Uygula
              </button>
            </div>
          </div>
        </div>

        {/* Rapor Tarih Bilgisi */}
        {raporVerileri && (
          <div style={{
            backgroundColor: '#0ea5e9',
            borderRadius: '12px',
            padding: '16px 24px',
            marginBottom: '24px',
            color: 'white',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '12px' : '0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={24} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {formatTarih(baslangicTarihi)} - {formatTarih(bitisTarihi)}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  {raporVerileri.genel.toplamGun} günlük detaylı analiz
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '24px',
              fontSize: '14px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600' }}>{raporVerileri.finansal.adisyonSayisi}</div>
                <div style={{ opacity: 0.9 }}>Toplam Adisyon</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600' }}>{raporVerileri.masa.toplamMasaSayisi}</div>
                <div style={{ opacity: 0.9 }}>Aktif Masa</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600' }}>{raporVerileri.urun.toplamUrunCesidi}</div>
                <div style={{ opacity: 0.9 }}>Ürün Çeşidi</div>
              </div>
            </div>
          </div>
        )}

        {/* Ana Rapor Grid */}
        {raporVerileri ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(12, 1fr)' : '1fr',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {/* Finansal Özet - 4 kolon */}
            <div style={{
              gridColumn: isDesktop ? 'span 4' : '1',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f59e0b'
              }}>
                <DollarSign size={20} color="#f59e0b" />
                Finansal Özet
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #fbbf24'
                }}>
                  <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>Toplam Ciro</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                    {formatPara(raporVerileri.finansal.toplamCiro)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #0ea5e9'
                }}>
                  <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>Net Kar</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0ea5e9' }}>
                    {formatPara(raporVerileri.finansal.netKar)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #ef4444'
                }}>
                  <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px' }}>Toplam Gider</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
                    {formatPara(raporVerileri.finansal.toplamGider)}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#f5f3ff',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #8b5cf6'
                }}>
                  <div style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '4px' }}>Kar Marjı</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    %{raporVerileri.finansal.karMarji.toFixed(1)}
                  </div>
                </div>
              </div>
              
              {/* Ödeme Dağılımı */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b2e05', marginBottom: '12px' }}>
                  Ödeme Dağılımı
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Nakit</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669' }}>
                        {formatPara(raporVerileri.finansal.odemeDagilimi.nakit)}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(raporVerileri.finansal.odemeDagilimi.nakit / raporVerileri.finansal.toplamCiro) * 100 || 0}%`, 
                        backgroundColor: '#059669' 
                      }} />
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Kart</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6' }}>
                        {formatPara(raporVerileri.finansal.odemeDagilimi.kart)}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(raporVerileri.finansal.odemeDagilimi.kart / raporVerileri.finansal.toplamCiro) * 100 || 0}%`, 
                        backgroundColor: '#3b82f6' 
                      }} />
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Hesaba Yaz</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6' }}>
                        {formatPara(raporVerileri.finansal.odemeDagilimi.hesap)}
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(raporVerileri.finansal.odemeDagilimi.hesap / raporVerileri.finansal.toplamCiro) * 100 || 0}%`, 
                        backgroundColor: '#8b5cf6' 
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Masa Performansı - 4 kolon */}
            <div style={{
              gridColumn: isDesktop ? 'span 4' : '1',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '2px solid #3b82f6'
              }}>
                <Users size={20} color="#3b82f6" />
                Masa Performansı
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Aktif Masa</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {raporVerileri.masa.toplamMasaSayisi}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ort. Masa Ciro</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                    {formatPara(raporVerileri.masa.ortalamaMasaCiro)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ort. Oturum Süresi</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {formatSure(raporVerileri.masa.ortalamaMasaSure)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Toplam Adisyon</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {raporVerileri.finansal.adisyonSayisi}
                  </div>
                </div>
              </div>
              
              {/* En İyi 5 Masa */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b2e05', marginBottom: '12px' }}>
                  En İyi 5 Masa
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {raporVerileri.masa.enIyiMasalar.slice(0, 5).map((masa, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: masa.tip === 'bilardo' ? '#8b5cf6' : '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            {masa.ad}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {masa.tip === 'bilardo' ? 'Bilardo' : 'Normal'} • {masa.adisyonSayisi} adisyon
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                          {formatPara(masa.toplamCiro)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          Ort. {formatSure(masa.ortalamaSure)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ürün ve Kategori Analizi - 4 kolon */}
            <div style={{
              gridColumn: isDesktop ? 'span 4' : '1',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '2px solid #10b981'
              }}>
                <ShoppingBag size={20} color="#10b981" />
                Ürün & Kategori
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ürün Çeşidi</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                    {raporVerileri.urun.toplamUrunCesidi}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Toplam Satış</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                    {raporVerileri.urun.toplamSatisAdedi}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Kategori</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {raporVerileri.kategori.toplamKategori}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ort. Fiyat</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {formatPara(raporVerileri.urun.ortalamaUrunFiyati)}
                  </div>
                </div>
              </div>
              
              {/* En Çok Satan Ürünler */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b2e05', marginBottom: '12px' }}>
                  En Çok Satan 3 Ürün
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {raporVerileri.urun.enCokSatanlar.slice(0, 3).map((urun, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #dcfce7'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {urun.urun}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {urun.kategori} • {urun.toplamAdet} adet
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                          {formatPara(urun.toplamTutar)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#10b981' }}>
                          %{urun.karOrani.toFixed(1)} kar
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Kategori Dağılımı */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b2e05', marginBottom: '12px' }}>
                  Kategori Dağılımı
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {raporVerileri.kategori.enCokSatisKategoriler.slice(0, 4).map((kategori, index) => {
                    const yuzde = (kategori.toplamSatis / raporVerileri.kategori.toplamKategoriSatis) * 100;
                    return (
                      <div key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{kategori.kategori}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#8b5cf6' }}>
                            %{yuzde.toFixed(1)}
                          </span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${yuzde}%`, 
                            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 4] 
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Zaman Analizi - 6 kolon (tam genişlik) */}
            <div style={{
              gridColumn: isDesktop ? 'span 12' : '1',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '2px solid #8b5cf6'
              }}>
                <Clock size={20} color="#8b5cf6" />
                Zaman Bazlı Analiz
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                gap: '24px'
              }}>
                {/* En Yoğun Saatler */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b2e05', marginBottom: '12px' }}>
                    En Yoğun 5 Saat
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {raporVerileri.zaman.enYogunSaatler.map((saat, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#faf5ff',
                        borderRadius: '8px',
                        border: '1px solid #f3e8ff'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#8b5cf6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {saat.saat}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                              {saat.adisyonSayisi} adisyon
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              Ort. {formatPara(saat.ortalamaCiro)}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {formatPara(saat.toplamCiro)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Günlük Performans */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b2e05', marginBottom: '12px' }}>
                    Günlük Performans Özeti
                  </h3>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ort. Günlük Ciro</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                          {formatPara(raporVerileri.zaman.ortalamaGunlukCiro)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>En Yoğun Gün</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
                          {raporVerileri.zaman.enYogunGun.gunAdi || 'Veri Yok'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Son 7 Gün Dağılımı</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                        {raporVerileri.zaman.gunlukVeriler.slice(-7).map((gun, index) => {
                          const maxCiro = Math.max(...raporVerileri.zaman.gunlukVeriler.slice(-7).map(g => g.toplamCiro));
                          const height = maxCiro > 0 ? (gun.toplamCiro / maxCiro) * 80 : 0;
                          return (
                            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: '100%',
                                height: `${height}px`,
                                backgroundColor: '#8b5cf6',
                                borderRadius: '4px 4px 0 0',
                                minHeight: '4px'
                              }} />
                              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                                {gun.gunAdi}
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: '600', color: '#4b2e05', marginTop: '2px' }}>
                                {formatPara(gun.toplamCiro).replace('₺', '').trim()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Özet ve İndirme - 6 kolon */}
            <div style={{
              gridColumn: isDesktop ? 'span 12' : '1',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '2px solid #0ea5e9',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#0c4a6e',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '2px solid #0ea5e9'
              }}>
                <FileText size={20} color="#0ea5e9" />
                Rapor Özeti ve İndirme
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                gap: '24px'
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px' }}>
                    Anahtar Performans Göstergeleri
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#475569' }}>Toplam Ciro</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                        {formatPara(raporVerileri.finansal.toplamCiro)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#475569' }}>Net Kar</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0ea5e9' }}>
                        {formatPara(raporVerileri.finansal.netKar)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#475569' }}>Kar Marjı</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
                        %{raporVerileri.finansal.karMarji.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#475569' }}>Ort. Masa Ciro</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {formatPara(raporVerileri.masa.ortalamaMasaCiro)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#475569' }}>En Çok Satan Ürün</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                        {raporVerileri.urun.enCokSatanlar[0]?.urun || 'Veri Yok'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px' }}>
                    Rapor İşlemleri
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={handleExcelExport}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '2px solid #10b981',
                        borderRadius: '8px',
                        color: '#10b981',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#10b981';
                      }}
                    >
                      <Download size={20} />
                      Excel Olarak İndir (JSON)
                    </button>
                    
                    <button 
                      onClick={handleYazdir}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '2px solid #0ea5e9',
                        borderRadius: '8px',
                        color: '#0ea5e9',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#0ea5e9';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#0ea5e9';
                      }}
                    >
                      <Printer size={20} />
                      Yazdırma için Hazırla
                    </button>
                    
                    <button 
                      onClick={hesaplaRaporVerileri}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '2px solid #f59e0b',
                        borderRadius: '8px',
                        color: '#f59e0b',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f59e0b';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#f59e0b';
                      }}
                    >
                      <RefreshCw size={20} />
                      Raporu Yenile
                    </button>
                  </div>
                  
                  <div style={{ marginTop: '20px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                    <div>Son Güncelleme: {new Date(raporVerileri.genel.hesaplamaZamani).toLocaleTimeString('tr-TR')}</div>
                    <div>Rapor ID: DR{new Date().getTime().toString().slice(-8)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <AlertCircle size={48} color="#f59e0b" />
            <p style={{ marginTop: '16px', color: '#4b2e05' }}>
              Rapor verileri yüklenemedi. Lütfen filtreleri kontrol edip tekrar deneyin.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: '14px',
          color: '#6b7280',
          marginTop: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '16px' : '0'
          }}>
            <div>
              <strong style={{ color: '#4b2e05' }}>📊 Detaylı Rapor Bilgileri:</strong> 
              <span style={{ marginLeft: '8px' }}>
                {formatTarih(baslangicTarihi)} - {formatTarih(bitisTarihi)} tarihleri arası kapsamlı analiz
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => navigate('/raporlar')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#6b7280',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={14} style={{ marginRight: '6px' }} />
                Rapor Listesi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetayliRapor;