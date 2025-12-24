// /workspaces/MyCafe/admin-ui/src/pages/Raporlar/MasaRaporlari/MasaAnalizi.jsx
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
  Search
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

  // Filtreleri uygula
  const applyFilters = () => {
    const filters = [];
    
    if (startDate && endDate) {
      filters.push(`Tarih: ${formatDate(startDate)} - ${formatDate(endDate)}`);
    }
    
    if (selectedMasa !== 'tum-masalar') {
      const masaLabel = {
        'normal-masalar': 'Normal Masalar',
        'bilardo-masalar': 'Bilardo Masaları',
        'vip-masalar': 'VIP Masalar'
      }[selectedMasa] || selectedMasa;
      filters.push(`Masa: ${masaLabel}`);
    }
    
    if (sortBy !== 'ciro-yuksek') {
      const sortLabel = {
        'ciro-dusuk': 'Ciro (Düşükten)',
        'oturum-yuksek': 'Oturum (Yüksekten)',
        'oturum-dusuk': 'Oturum (Düşükten)'
      }[sortBy] || sortBy;
      filters.push(`Sıralama: ${sortLabel}`);
    }
    
    setActiveFilters(filters);
    console.log('Filtreler uygulandı:', { startDate, endDate, selectedMasa, sortBy });
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
  };

  // Demo verileri
  const masaData = {
    toplamAnaliz: {
      toplamMasa: 40,
      aktifMasa: 8,
      ortalamaOturum: 65,
      toplamCiro: 12450.75,
      ortalamaCiro: 311.27
    },
    masaPerformans: [
      { id: 1, no: "Masa 5", oturumSayisi: 4, toplamSure: 185, ortalamaSure: 46, toplamCiro: 1250.50, ortalamaCiro: 312.63, renk: "#10b981", tip: "normal" },
      { id: 2, no: "Masa 7", oturumSayisi: 3, toplamSure: 150, ortalamaSure: 50, toplamCiro: 980.00, ortalamaCiro: 326.67, renk: "#3b82f6", tip: "normal" },
      { id: 3, no: "Masa 12", oturumSayisi: 5, toplamSure: 225, ortalamaSure: 45, toplamCiro: 1560.25, ortalamaCiro: 312.05, renk: "#8b5cf6", tip: "normal" },
      { id: 4, no: "Bilardo 2", oturumSayisi: 2, toplamSure: 180, ortalamaSure: 90, toplamCiro: 320.00, ortalamaCiro: 160.00, renk: "#f59e0b", tip: "bilardo" },
      { id: 5, no: "Masa 3", oturumSayisi: 3, toplamSure: 135, ortalamaSure: 45, toplamCiro: 890.50, ortalamaCiro: 296.83, renk: "#ef4444", tip: "normal" },
      { id: 6, no: "Masa 8", oturumSayisi: 4, toplamSure: 200, ortalamaSure: 50, toplamCiro: 1340.75, ortalamaCiro: 335.19, renk: "#6366f1", tip: "normal" },
      { id: 7, no: "Masa 15", oturumSayisi: 2, toplamSure: 90, ortalamaSure: 45, toplamCiro: 540.00, ortalamaCiro: 270.00, renk: "#06b6d4", tip: "vip" },
      { id: 8, no: "Bilardo 5", oturumSayisi: 1, toplamSure: 120, ortalamaSure: 120, toplamCiro: 240.00, ortalamaCiro: 240.00, renk: "#ec4899", tip: "bilardo" }
    ],
    oturumAnalizi: [
      { saat: "08:00-10:00", oturum: 12, ortalamaSure: 45, ciro: 2850.50 },
      { saat: "10:00-12:00", oturum: 18, ortalamaSure: 55, ciro: 4320.75 },
      { saat: "12:00-14:00", oturum: 24, ortalamaSure: 65, ciro: 6250.25 },
      { saat: "14:00-16:00", oturum: 15, ortalamaSure: 50, ciro: 3120.00 },
      { saat: "16:00-18:00", oturum: 20, ortalamaSure: 60, ciro: 4850.50 },
      { saat: "18:00-20:00", oturum: 22, ortalamaSure: 70, ciro: 6780.25 },
      { saat: "20:00-22:00", oturum: 16, ortalamaSure: 65, ciro: 4120.50 },
      { saat: "22:00-24:00", oturum: 8, ortalamaSure: 40, ciro: 1850.00 }
    ],
    odemeDagilimi: [
      { tip: "Nakit", oran: 45, miktar: 5602.84, renk: "#10b981" },
      { tip: "Kredi Kartı", oran: 35, miktar: 4357.76, renk: "#3b82f6" },
      { tip: "Hesaba Yaz", oran: 15, miktar: 1867.61, renk: "#8b5cf6" },
      { tip: "Diğer", oran: 5, miktar: 622.54, renk: "#f59e0b" }
    ],
    kritikMasalar: [
      { masa: "Masa 5", sebep: "Yüksek bekleme süresi", oneri: "Servis hızını artır" },
      { masa: "Bilardo 2", sebep: "Düşük ciro", oneri: "Promosyon uygula" },
      { masa: "Masa 15", sebep: "Az oturum", oneri: "Konum değiştir" }
    ]
  };

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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

  // Ana container stili
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#fef3c7',
    backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
    padding: isMobile ? '12px' : '24px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#4b2e05'
  };

  const wrapperStyle = {
    maxWidth: '1400px',
    margin: '0 auto'
  };

  // Breadcrumb
  const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#92400e',
    marginBottom: '24px',
    flexWrap: 'wrap'
  };

  const breadcrumbLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#92400e',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  };

  // Header
  const headerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    marginBottom: '24px',
    gap: isMobile ? '16px' : '0'
  };

  const titleStyle = {
    fontSize: isMobile ? '24px' : '32px',
    fontWeight: 'bold',
    color: '#4b2e05',
    margin: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  // Butonlar
  const buttonGroupStyle = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  };

  const buttonStyle = {
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
    minWidth: '120px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#d97706',
    color: 'white',
    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: '#92400e',
    border: '1px solid #fbbf24',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
  };

  // Filtreler
  const filterContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  };

  const filterGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  };

  const filterGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const filterLabelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b2e05',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const inputStyle = {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #fbbf24',
    backgroundColor: 'white',
    fontSize: '14px',
    color: '#4b2e05',
    width: '100%'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  // Aktif Filtreler
  const activeFiltersStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    minHeight: '48px'
  };

  const filterTagStyle = {
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
  };

  const removeFilterButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '0'
  };

  // Filtre Butonları
  const filterButtonsStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  };

  // Genel İstatistikler
  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  };

  const statCardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  };

  const statIconStyle = (color) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    color: color
  });

  const statValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '4px 0'
  };

  const statLabelStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0'
  };

  // Masa Performans Tablosu
  const tableContainerStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    overflowX: 'auto'
  };

  const tableTitleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const thStyle = {
    backgroundColor: '#fef3c7',
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b2e05',
    borderBottom: '2px solid #fed7aa'
  };

  const tdStyle = {
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#4b2e05'
  };

  const trHoverStyle = {
    backgroundColor: '#fef3c7',
    transition: 'background-color 0.2s ease'
  };

  // İki Kolon Layout
  const twoColumnLayoutStyle = {
    display: 'grid',
    gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
    gap: '24px',
    marginBottom: '24px'
  };

  // Kart Stilleri
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  // Ödeme Dağılımı
  const paymentItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  };

  const paymentBarStyle = (width, color) => ({
    height: '8px',
    width: `${width}%`,
    backgroundColor: color,
    borderRadius: '4px',
    margin: '8px 0'
  });

  // Kritik Masalar
  const criticalCardStyle = {
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    borderLeft: '4px solid #ef4444'
  };

  const formatSure = (dakika) => {
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return `${saat}:${dk.toString().padStart(2, '0')}`;
  };

  const formatPara = (miktar) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(miktar);
  };

  // Hızlı tarih seçenekleri
  const handleQuickDate = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setTimeRange('ozel-tarih');
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Breadcrumb */}
        <div style={breadcrumbStyle}>
          <a href="/" style={breadcrumbLinkStyle}>
            <Home size={16} />
            Ana Sayfa
          </a>
          <ChevronRight size={16} />
          <a href="/raporlar" style={breadcrumbLinkStyle}>
            Raporlar
          </a>
          <ChevronRight size={16} />
          <span style={{ fontWeight: '600', color: '#4b2e05' }}>Masa Analizi</span>
        </div>

        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <Users size={28} color="#3b82f6" />
            📊 Masa Analizi Raporu
          </h1>
          
          <div style={buttonGroupStyle}>
            <button style={secondaryButtonStyle}>
              <Download size={16} />
              PDF İndir
            </button>
            <button style={secondaryButtonStyle}>
              <Printer size={16} />
              Yazdır
            </button>
            <button style={primaryButtonStyle} onClick={applyFilters}>
              <Search size={16} />
              Filtre Uygula
            </button>
          </div>
        </div>

        {/* Filtreler */}
        <div style={filterContainerStyle}>
          {/* Hızlı Tarih Butonları */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => handleQuickDate(1)}
              style={{
                padding: '8px 16px',
                backgroundColor: timeRange === 'bugun' ? '#d97706' : '#fef3c7',
                color: timeRange === 'bugun' ? 'white' : '#92400e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Bugün
            </button>
            <button 
              onClick={() => handleQuickDate(7)}
              style={{
                padding: '8px 16px',
                backgroundColor: timeRange === 'bu-hafta' ? '#d97706' : '#fef3c7',
                color: timeRange === 'bu-hafta' ? 'white' : '#92400e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Son 7 Gün
            </button>
            <button 
              onClick={() => handleQuickDate(30)}
              style={{
                padding: '8px 16px',
                backgroundColor: timeRange === 'bu-ay' ? '#d97706' : '#fef3c7',
                color: timeRange === 'bu-ay' ? 'white' : '#92400e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Son 30 Gün
            </button>
            <button 
              onClick={() => {
                const date = new Date();
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                setStartDate(firstDay.toISOString().split('T')[0]);
                setEndDate(date.toISOString().split('T')[0]);
                setTimeRange('bu-ay-tam');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: timeRange === 'bu-ay-tam' ? '#d97706' : '#fef3c7',
                color: timeRange === 'bu-ay-tam' ? 'white' : '#92400e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Bu Ay
            </button>
          </div>

          {/* Filtre Grid */}
          <div style={filterGridStyle}>
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>
                <Calendar size={16} />
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setTimeRange('ozel-tarih');
                }}
                style={inputStyle}
                max={endDate}
              />
            </div>

            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>
                <Calendar size={16} />
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setTimeRange('ozel-tarih');
                }}
                style={inputStyle}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>
                <Coffee size={16} />
                Masa Tipi
              </label>
              <select 
                value={selectedMasa}
                onChange={(e) => setSelectedMasa(e.target.value)}
                style={selectStyle}
              >
                <option value="tum-masalar">Tüm Masalar</option>
                <option value="normal-masalar">Normal Masalar</option>
                <option value="bilardo-masalar">Bilardo Masaları</option>
                <option value="vip-masalar">VIP Masalar</option>
              </select>
            </div>

            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>
                <TrendingUp size={16} />
                Sıralama
              </label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={selectStyle}
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

          {/* Aktif Filtreler */}
          {activeFilters.length > 0 && (
            <div style={activeFiltersStyle}>
              <span style={{ fontSize: '14px', color: '#92400e', marginRight: '8px' }}>
                Aktif Filtreler:
              </span>
              {activeFilters.map((filter, index) => (
                <div key={index} style={filterTagStyle}>
                  <span>{filter}</span>
                  <button 
                    onClick={() => {
                      const newFilters = [...activeFilters];
                      newFilters.splice(index, 1);
                      setActiveFilters(newFilters);
                    }}
                    style={removeFilterButtonStyle}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={clearFilters}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={12} />
                Tümünü Temizle
              </button>
            </div>
          )}

          {/* Filtre Butonları */}
          <div style={filterButtonsStyle}>
            <button 
              onClick={clearFilters}
              style={{
                ...secondaryButtonStyle,
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                borderColor: '#fecaca'
              }}
            >
              <X size={16} />
              Filtreleri Temizle
            </button>
            <button 
              onClick={applyFilters}
              style={primaryButtonStyle}
            >
              <Filter size={16} />
              Filtreleri Uygula
            </button>
          </div>
        </div>

        {/* Genel İstatistikler */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statIconStyle('#3b82f6')}>
              <Users size={24} />
            </div>
            <p style={statValueStyle}>{masaData.toplamAnaliz.toplamMasa}</p>
            <p style={statLabelStyle}>Toplam Masa</p>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle('#10b981')}>
              <Coffee size={24} />
            </div>
            <p style={statValueStyle}>{masaData.toplamAnaliz.aktifMasa}</p>
            <p style={statLabelStyle}>Aktif Masa</p>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle('#f59e0b')}>
              <Clock size={24} />
            </div>
            <p style={statValueStyle}>{formatSure(masaData.toplamAnaliz.ortalamaOturum)}</p>
            <p style={statLabelStyle}>Ort. Oturum</p>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle('#8b5cf6')}>
              <DollarSign size={24} />
            </div>
            <p style={statValueStyle}>{formatPara(masaData.toplamAnaliz.toplamCiro)}</p>
            <p style={statLabelStyle}>Toplam Ciro</p>
          </div>

          <div style={statCardStyle}>
            <div style={statIconStyle('#6366f1')}>
              <BarChart3 size={24} />
            </div>
            <p style={statValueStyle}>{formatPara(masaData.toplamAnaliz.ortalamaCiro)}</p>
            <p style={statLabelStyle}>Ort. Masa Ciro</p>
          </div>
        </div>

        {/* Masa Performans Tablosu */}
        <div style={tableContainerStyle}>
          <h2 style={tableTitleStyle}>
            <TrendingUp size={20} />
            Masa Performans Tablosu
            <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '12px' }}>
              ({formatDate(startDate)} - {formatDate(endDate)})
            </span>
          </h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Masa No</th>
                <th style={thStyle}>Tip</th>
                <th style={thStyle}>Oturum Sayısı</th>
                <th style={thStyle}>Toplam Süre</th>
                <th style={thStyle}>Ort. Süre</th>
                <th style={thStyle}>Toplam Ciro</th>
                <th style={thStyle}>Ort. Ciro</th>
                <th style={thStyle}>Performans</th>
              </tr>
            </thead>
            <tbody>
              {masaData.masaPerformans.map((masa) => (
                <tr 
                  key={masa.id}
                  style={{ cursor: 'pointer' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: masa.renk
                      }} />
                      <strong>{masa.no}</strong>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: masa.tip === 'normal' ? '#dbeafe' : 
                                     masa.tip === 'bilardo' ? '#f3e8ff' : '#fef3c7',
                      color: masa.tip === 'normal' ? '#1e40af' : 
                            masa.tip === 'bilardo' ? '#7c3aed' : '#92400e',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {masa.tip === 'normal' ? 'Normal' : 
                       masa.tip === 'bilardo' ? 'Bilardo' : 'VIP'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {masa.oturumSayisi}
                    </span>
                  </td>
                  <td style={tdStyle}>{formatSure(masa.toplamSure)}</td>
                  <td style={tdStyle}>{formatSure(masa.ortalamaSure)}</td>
                  <td style={{...tdStyle, fontWeight: '600', color: '#059669'}}>
                    {formatPara(masa.toplamCiro)}
                  </td>
                  <td style={{...tdStyle, fontWeight: '600'}}>
                    {formatPara(masa.ortalamaCiro)}
                  </td>
                  <td style={tdStyle}>
                    <div style={{
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(masa.ortalamaCiro / 350) * 100}%`,
                        backgroundColor: masa.ortalamaCiro > 300 ? '#10b981' : 
                                       masa.ortalamaCiro > 250 ? '#f59e0b' : '#ef4444',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* İki Kolon Layout */}
        <div style={twoColumnLayoutStyle}>
          {/* Sol Kolon - Oturum Analizi */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>
              <Clock size={20} />
              Zaman Bazlı Oturum Analizi
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: 'auto' }}>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </h2>
            <div>
              {masaData.oturumAnalizi.map((zaman, index) => (
                <div key={index} style={paymentItemStyle}>
                  <div>
                    <strong style={{ display: 'block', color: '#1f2937' }}>{zaman.saat}</strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {zaman.oturum} oturum • Ort. {formatSure(zaman.ortalamaSure)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ display: 'block', color: '#059669' }}>
                      {formatPara(zaman.ciro)}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {Math.round((zaman.ciro / masaData.toplamAnaliz.toplamCiro) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ Kolon - Ödeme Dağılımı */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>
              <CreditCard size={20} />
              Ödeme Türü Dağılımı
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: 'auto' }}>
                {formatDate(startDate)} - {formatDate(endDate)}
              </span>
            </h2>
            <div>
              {masaData.odemeDagilimi.map((odeme, index) => (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{odeme.tip}</span>
                    <span style={{ color: '#6b7280' }}>
                      {odeme.oran}% • {formatPara(odeme.miktar)}
                    </span>
                  </div>
                  <div style={paymentBarStyle(odeme.oran, odeme.renk)} />
                </div>
              ))}
            </div>

            {/* Kritik Masalar */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#ef4444" />
                Kritik Durumdaki Masalar
              </h3>
              {masaData.kritikMasalar.map((kritik, index) => (
                <div key={index} style={criticalCardStyle}>
                  <strong style={{ display: 'block', color: '#1f2937', marginBottom: '4px' }}>
                    {kritik.masa}
                  </strong>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>
                    {kritik.sebep}
                  </p>
                  <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>
                    💡 Öneri: {kritik.oneri}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bilgi */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>📋 Rapor Bilgileri:</strong> 
              <span style={{ marginLeft: '8px' }}>
                {formatDate(startDate)} - {formatDate(endDate)} tarihleri arası masa analizi
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
                Ayarlar
              </button>
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#d97706',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Yeni Analiz Oluştur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasaAnalizi;