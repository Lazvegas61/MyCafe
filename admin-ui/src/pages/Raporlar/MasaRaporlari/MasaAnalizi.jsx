import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Home,
  Coffee,
  DollarSign,
  BarChart3,
  PieChart,
  AlertCircle,
  X,
  Search,
  FileText,
  Activity,
  Target,
  TrendingDown,
  RefreshCw,
  Loader2
} from 'lucide-react';

const MasaAnalizi = () => {
  // Filtre state'leri
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 7 gün önce
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  
  const [selectedMasa, setSelectedMasa] = useState('tum-masalar');
  const [timeRange, setTimeRange] = useState('ozel-tarih');
  const [sortBy, setSortBy] = useState('ciro-yuksek');
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Veri state'leri (demo veriler kaldırıldı, API'den gelecek)
  const [masaData, setMasaData] = useState({
    toplamAnaliz: {},
    masaPerformans: [],
    oturumAnalizi: [],
    odemeDagilimi: [],
    kritikMasalar: []
  });

  // Responsive state
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Verileri API'den çek
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // API endpoint'leri (gerçek API endpoint'lerinizi buraya ekleyin)
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Tarih formatını düzenle
      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      
      // Tüm verileri paralel olarak çek
      const [
        analizResponse,
        performansResponse,
        oturumResponse,
        odemeResponse,
        kritikResponse
      ] = await Promise.all([
        // Toplam analiz verileri (silinen masalar dahil)
        fetch(`${baseUrl}/masa-analizi/toplam?startDate=${formattedStartDate}&endDate=${formattedEndDate}&includeDeleted=true`),
        
        // Masa performans verileri (silinen masalar dahil)
        fetch(`${baseUrl}/masa-analizi/performans?startDate=${formattedStartDate}&endDate=${formattedEndDate}&includeDeleted=true&type=${selectedMasa}&sort=${sortBy}`),
        
        // Oturum analizi verileri
        fetch(`${baseUrl}/masa-analizi/oturum?startDate=${formattedStartDate}&endDate=${formattedEndDate}`),
        
        // Ödeme dağılımı verileri
        fetch(`${baseUrl}/masa-analizi/odeme?startDate=${formattedStartDate}&endDate=${formattedEndDate}`),
        
        // Kritik masalar verileri
        fetch(`${baseUrl}/masa-analizi/kritik?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
      ]);

      // Tüm responseları kontrol et
      if (!analizResponse.ok || !performansResponse.ok || !oturumResponse.ok || 
          !odemeResponse.ok || !kritikResponse.ok) {
        throw new Error('API yanıt vermedi');
      }

      // JSON'a çevir
      const [
        analizData,
        performansData,
        oturumData,
        odemeData,
        kritikData
      ] = await Promise.all([
        analizResponse.json(),
        performansResponse.json(),
        oturumResponse.json(),
        odemeResponse.json(),
        kritikResponse.json()
      ]);

      // State'i güncelle
      setMasaData({
        toplamAnaliz: analizData,
        masaPerformans: performansData,
        oturumAnalizi: oturumData,
        odemeDagilimi: odemeData,
        kritikMasalar: kritikData
      });

    } catch (err) {
      console.error('Veri çekme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      
      // Fallback olarak boş veri yapısı
      setMasaData({
        toplamAnaliz: {},
        masaPerformans: [],
        oturumAnalizi: [],
        odemeDagilimi: [],
        kritikMasalar: []
      });
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede ve filtre değişikliklerinde verileri çek
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedMasa, sortBy]);

  // Filtreleri uygula
  const applyFilters = () => {
    const filters = [];
    
    if (startDate && endDate) {
      filters.push(`Tarih: ${formatDate(startDate)} - ${formatDate(endDate)}`);
    }
    
    if (selectedMasa !== 'tum-masalar') {
      const masaLabel = {
        'normal-masalar': 'Normal Masalar',
        'bilardo-masalar': 'Bilardo Masaları'
      }[selectedMasa] || selectedMasa;
      filters.push(`Masa: ${masaLabel}`);
    }
    
    if (sortBy !== 'ciro-yuksek') {
      const sortLabel = {
        'ciro-dusuk': 'Ciro (Düşükten)',
        'oturum-yuksek': 'Oturum (Yüksekten)',
        'oturum-dusuk': 'Oturum (Düşükten)',
        'sure-yuksek': 'Süre (Yüksekten)',
        'sure-dusuk': 'Süre (Düşükten)'
      }[sortBy] || sortBy;
      filters.push(`Sıralama: ${sortLabel}`);
    }
    
    setActiveFilters(filters);
    fetchData(); // Filtre uygulandığında verileri yeniden çek
  };

  // Filtreleri temizle
  const clearFilters = () => {
    const date = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(date.getDate() - 7);
    
    setStartDate(weekAgo.toISOString().split('T')[0]);
    setEndDate(date.toISOString().split('T')[0]);
    setSelectedMasa('tum-masalar');
    setTimeRange('ozel-tarih');
    setSortBy('ciro-yuksek');
    setActiveFilters([]);
    setSearchQuery('');
    
    // Filtreler temizlendiğinde verileri yeniden çek
    setTimeout(() => fetchData(), 100);
  };

  // Yardımcı fonksiyonlar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatSure = (dakika) => {
    if (!dakika) return '0:00';
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return `${saat}:${dk.toString().padStart(2, '0')}`;
  };

  const formatPara = (miktar) => {
    if (!miktar) return '₺0,00';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(miktar);
  };

  // Hızlı tarih seçenekleri
  const handleQuickDate = (days, rangeType) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setTimeRange(rangeType);
    
    // Tarih değiştiğinde verileri yeniden çek
    setTimeout(() => fetchData(), 100);
  };

  // Verileri filtrele (istemci tarafında arama için)
  const filteredMasaData = masaData.masaPerformans.filter(masa => {
    // Masa tipine göre filtrele
    if (selectedMasa === 'normal-masalar' && masa.tip !== 'normal') return false;
    if (selectedMasa === 'bilardo-masalar' && masa.tip !== 'bilardo') return false;
    
    // Arama sorgusuna göre filtrele
    if (searchQuery && !masa.no.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Sıralama uygula (sunucu tarafında yapılıyor, burada yedek olarak)
  const sortedMasaData = [...filteredMasaData].sort((a, b) => {
    switch (sortBy) {
      case 'ciro-yuksek':
        return (b.toplamCiro || 0) - (a.toplamCiro || 0);
      case 'ciro-dusuk':
        return (a.toplamCiro || 0) - (b.toplamCiro || 0);
      case 'oturum-yuksek':
        return (b.oturumSayisi || 0) - (a.oturumSayisi || 0);
      case 'oturum-dusuk':
        return (a.oturumSayisi || 0) - (b.oturumSayisi || 0);
      case 'sure-yuksek':
        return (b.toplamSure || 0) - (a.toplamSure || 0);
      case 'sure-dusuk':
        return (a.toplamSure || 0) - (b.toplamSure || 0);
      default:
        return (b.toplamCiro || 0) - (a.toplamCiro || 0);
    }
  });

  // Performans renk hesaplama
  const getPerformanceColor = (ortalamaCiro) => {
    if (!ortalamaCiro) return '#6b7280';
    if (ortalamaCiro > 300) return '#10b981';
    if (ortalamaCiro > 250) return '#f59e0b';
    return '#ef4444';
  };

  // Yükleme durumunda gösterilecek bileşen
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#fef3c7',
        backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <Loader2 size={48} className="animate-spin" color="#d97706" />
          <p style={{ marginTop: '16px', color: '#4b2e05' }}>
            Veriler yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  // Hata durumunda gösterilecek bileşen
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#fef3c7',
        backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
        padding: '24px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <AlertCircle size={48} color="#ef4444" />
          <h2 style={{ color: '#ef4444', marginTop: '16px' }}>
            Hata Oluştu
          </h2>
          <p style={{ color: '#4b2e05', margin: '16px 0' }}>
            {error}
          </p>
          <button 
            onClick={fetchData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fef3c7',
      backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
      padding: isMobile ? '16px' : '24px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#4b2e05'
    }}>
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#92400e',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <a href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#92400e',
            textDecoration: 'none',
            fontWeight: '500',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}>
            <Home size={16} />
            Ana Sayfa
          </a>
          <ChevronRight size={16} />
          <a href="/raporlar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#92400e',
            textDecoration: 'none',
            fontWeight: '500',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}>
            Raporlar
          </a>
          <ChevronRight size={16} />
          <span style={{ fontWeight: '600', color: '#4b2e05' }}>Masa Analizi</span>
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: '24px',
          gap: isMobile ? '16px' : '0'
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
              <Users size={isMobile ? 24 : 32} color="#3b82f6" />
              📊 Masa Analizi Raporu
            </h1>
            <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
              Masaların performans analizi ve detaylı istatistikler
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button style={{
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
            }}>
              <Download size={16} />
              PDF İndir
            </button>
            <button style={{
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
            }}>
              <Printer size={16} />
              Yazdır
            </button>
          </div>
        </div>

        {/* Filtre Bölümü */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          {/* Üst Kontroller */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Arama */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                marginBottom: '8px'
              }}>
                <Search size={16} />
                Masa Ara
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masa numarası ile ara..."
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #fbbf24',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    color: '#4b2e05'
                  }}
                />
                <Search size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
              </div>
            </div>

            {/* Hızlı Tarih Butonları */}
            <div style={{ flex: 2 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b2e05',
                marginBottom: '8px'
              }}>
                Hızlı Tarih Seçenekleri
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={() => handleQuickDate(1, 'bugun')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: timeRange === 'bugun' ? '#d97706' : '#fef3c7',
                    color: timeRange === 'bugun' ? 'white' : '#92400e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Bugün
                </button>
                <button 
                  onClick={() => handleQuickDate(7, 'bu-hafta')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: timeRange === 'bu-hafta' ? '#d97706' : '#fef3c7',
                    color: timeRange === 'bu-hafta' ? 'white' : '#92400e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Son 7 Gün
                </button>
                <button 
                  onClick={() => handleQuickDate(30, 'bu-ay')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: timeRange === 'bu-ay' ? '#d97706' : '#fef3c7',
                    color: timeRange === 'bu-ay' ? 'white' : '#92400e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Son 30 Gün
                </button>
              </div>
            </div>
          </div>

          {/* Filtre Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
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
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setTimeRange('ozel-tarih');
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%'
                }}
                max={endDate}
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
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setTimeRange('ozel-tarih');
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fbbf24',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: '#4b2e05',
                  width: '100%'
                }}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
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
                <Coffee size={16} />
                Masa Tipi
              </div>
              <select 
                value={selectedMasa}
                onChange={(e) => {
                  setSelectedMasa(e.target.value);
                  // Masa tipi değiştiğinde verileri yeniden çek
                  setTimeout(() => fetchData(), 100);
                }}
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
                <option value="tum-masalar">Tüm Masalar (Silinenler Dahil)</option>
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
                <TrendingUp size={16} />
                Sıralama
              </div>
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  // Sıralama değiştiğinde verileri yeniden çek
                  setTimeout(() => fetchData(), 100);
                }}
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
                <option value="ciro-yuksek">Ciro (Yüksekten)</option>
                <option value="ciro-dusuk">Ciro (Düşükten)</option>
                <option value="oturum-yuksek">Oturum (Yüksekten)</option>
                <option value="oturum-dusuk">Oturum (Düşükten)</option>
                <option value="sure-yuksek">Süre (Yüksekten)</option>
                <option value="sure-dusuk">Süre (Düşükten)</option>
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
              {activeFilters.map((filter, index) => (
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
                  <span>{filter}</span>
                  <button 
                    onClick={() => {
                      const newFilters = [...activeFilters];
                      newFilters.splice(index, 1);
                      setActiveFilters(newFilters);
                    }}
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
                onClick={clearFilters}
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
                onClick={applyFilters}
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
                  backgroundColor: '#d97706',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                }}
              >
                <Filter size={16} />
                Filtre Uygula
              </button>
            </div>
          </div>
        </div>

        {/* Yükleme durumu */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <Loader2 size={24} className="animate-spin" color="#d97706" />
            <p style={{ marginTop: '12px', color: '#4b2e05' }}>
              Veriler güncelleniyor...
            </p>
          </div>
        )}

        {/* Genel İstatistikler */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Users size={24} color="white" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '4px 0'
            }}>
              {masaData.toplamAnaliz.toplamMasa || 0}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              Toplam Masa
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Activity size={24} color="white" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '4px 0'
            }}>
              {masaData.toplamAnaliz.aktifMasa || 0}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              Aktif Masa
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Clock size={24} color="white" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '4px 0'
            }}>
              {formatSure(masaData.toplamAnaliz.ortalamaOturum || 0)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              Ort. Oturum
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <DollarSign size={24} color="white" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '4px 0'
            }}>
              {formatPara(masaData.toplamAnaliz.toplamCiro || 0)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              Toplam Ciro
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <BarChart3 size={24} color="white" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: '4px 0'
            }}>
              {masaData.toplamAnaliz.dolulukOrani || 0}%
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              Doluluk Oranı
            </div>
          </div>
        </div>

        {/* Masa Performans Tablosu */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: '20px',
            gap: isMobile ? '12px' : '0'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={20} />
              Masa Performans Tablosu
            </h2>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {formatDate(startDate)} - {formatDate(endDate)} • {sortedMasaData.length} masa
            </div>
          </div>
          
          {sortedMasaData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              <p>Bu filtrelerle eşleşen masa bulunamadı.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: isMobile ? '800px' : 'auto'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Masa No</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Tip</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Oturum</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Toplam Süre</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Ort. Süre</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Toplam Ciro</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Ort. Ciro</th>
                    <th style={{
                      backgroundColor: '#fef3c7',
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#4b2e05',
                      borderBottom: '2px solid #fed7aa'
                    }}>Performans</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMasaData.map((masa) => (
                    <tr 
                      key={masa.id}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b2e05'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: masa.renk || '#6b7280'
                          }} />
                          <strong>{masa.no || 'Bilinmeyen Masa'}</strong>
                          {masa.silindi && (
                            <span style={{
                              fontSize: '10px',
                              color: '#ef4444',
                              backgroundColor: '#fef2f2',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Silindi
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b2e05'
                      }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: masa.tip === 'normal' ? '#dbeafe' : masa.tip === 'bilardo' ? '#f3e8ff' : '#f3f4f6',
                          color: masa.tip === 'normal' ? '#1e40af' : masa.tip === 'bilardo' ? '#7c3aed' : '#6b7280',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {masa.tip === 'normal' ? 'Normal' : masa.tip === 'bilardo' ? 'Bilardo' : 'Diğer'}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b2e05'
                      }}>
                        <span style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {masa.oturumSayisi || 0}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b2e05'
                      }}>{formatSure(masa.toplamSure || 0)}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b2e05'
                      }}>{formatSure(masa.ortalamaSure || 0)}</td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        {formatPara(masa.toplamCiro || 0)}
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#4b2e05'
                      }}>
                        {formatPara(masa.ortalamaCiro || 0)}
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '14px',
                        color: '#4b2e05'
                      }}>
                        <div style={{
                          height: '6px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          width: '100%'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(((masa.ortalamaCiro || 0) / 350) * 100, 100)}%`,
                            backgroundColor: getPerformanceColor(masa.ortalamaCiro),
                            borderRadius: '3px'
                          }} />
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: getPerformanceColor(masa.ortalamaCiro),
                          marginTop: '4px',
                          fontWeight: '600'
                        }}>
                          {!masa.ortalamaCiro ? 'Veri Yok' : 
                           masa.ortalamaCiro > 300 ? 'Yüksek' : 
                           masa.ortalamaCiro > 250 ? 'Orta' : 'Düşük'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* İki Kolon Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Sol Kolon - Oturum Analizi */}
          <div style={{
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
              gap: '8px'
            }}>
              <Clock size={20} />
              Zaman Bazlı Oturum Analizi
            </h2>
            {masaData.oturumAnalizi.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280'
              }}>
                <p>Bu tarih aralığında oturum verisi bulunamadı.</p>
              </div>
            ) : (
              <div>
                {masaData.oturumAnalizi.map((zaman, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div>
                      <strong style={{ display: 'block', color: '#1f2937', fontSize: '14px' }}>
                        {zaman.saat || 'Bilinmeyen Saat'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {zaman.oturum || 0} oturum • Ort. {formatSure(zaman.ortalamaSure || 0)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ display: 'block', color: '#059669', fontSize: '14px' }}>
                        {formatPara(zaman.ciro || 0)}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {Math.round(((zaman.ciro || 0) / (masaData.toplamAnaliz.toplamCiro || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ Kolon - Ödeme Dağılımı ve Kritik Masalar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Ödeme Dağılımı */}
            <div style={{
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
                gap: '8px'
              }}>
                <CreditCard size={20} />
                Ödeme Dağılımı
              </h2>
              {masaData.odemeDagilimi.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#6b7280'
                }}>
                  <p>Ödeme dağılımı verisi bulunamadı.</p>
                </div>
              ) : (
                <div>
                  {masaData.odemeDagilimi.map((odeme, index) => (
                    <div key={index} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                          {odeme.tip || 'Bilinmeyen'}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>
                          {odeme.oran || 0}% • {formatPara(odeme.miktar || 0)}
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        width: `${odeme.oran || 0}%`,
                        backgroundColor: odeme.renk || '#6b7280',
                        borderRadius: '4px',
                        margin: '8px 0'
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kritik Masalar */}
            <div style={{
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
                gap: '8px'
              }}>
                <AlertCircle size={20} color="#ef4444" />
                Kritik Durumdaki Masalar
              </h2>
              {masaData.kritikMasalar.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: '#6b7280'
                }}>
                  <p>Kritik durumda masa bulunamadı.</p>
                </div>
              ) : (
                <div>
                  {masaData.kritikMasalar.map((kritik, index) => (
                    <div key={index} style={{
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      borderLeft: '4px solid #ef4444'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <strong style={{ display: 'block', color: '#1f2937', fontSize: '14px' }}>
                          {kritik.masa || 'Bilinmeyen Masa'}
                        </strong>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: kritik.tip === 'normal' ? '#dbeafe' : '#f3e8ff',
                          color: kritik.tip === 'normal' ? '#1e40af' : '#7c3aed',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {kritik.tip === 'normal' ? 'Normal' : 'Bilardo'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px 0' }}>
                        {kritik.sebep || 'Bilinmeyen sebep'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>
                        💡 Öneri: {kritik.oneri || 'Öneri yok'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '16px' : '0'
          }}>
            <div>
              <strong style={{ color: '#4b2e05' }}>📊 Rapor Bilgileri:</strong> 
              <span style={{ marginLeft: '8px' }}>
                {formatDate(startDate)} - {formatDate(endDate)} tarihleri arası masa analizi
                • Toplam {(masaData.toplamAnaliz.toplamOturum || 0)} oturum kaydedildi
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#6b7280',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <FileText size={14} style={{ marginRight: '6px' }} />
                Detaylı Rapor
              </button>
              <button 
                onClick={fetchData}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d97706',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                Güncelle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasaAnalizi;