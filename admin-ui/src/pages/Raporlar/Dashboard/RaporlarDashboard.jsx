// /workspaces/MyCafe/admin-ui/src/pages/Raporlar/Dashboard/RaporlarDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  PieChart, 
  DollarSign,
  ShoppingBag,
  Users,
  Home,
  ChevronRight,
  Coffee,
  TrendingUp,
  CreditCard,
  FileText,
  Filter,
  Calendar
} from 'lucide-react';

const RaporlarDashboard = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Rapor kartları
  const reportCards = [
    {
      id: 1,
      title: "Gün Sonu Raporu",
      description: "Günlük satış, gider ve kar özetinizi görüntüleyin",
      icon: <BarChart3 />,
      path: "/raporlar/gun-sonu",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      badge: "Günlük",
      stats: "₺ 12.5K"
    },
    {
      id: 2,
      title: "Masa Analizi",
      description: "Masaların performans ve verimlilik analizi",
      icon: <Users />,
      path: "/raporlar/masa-analizi",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      badge: "Verimlilik",
      stats: "24 Masa"
    },
    {
      id: 3,
      title: "Ürün Bazlı Satış",
      description: "Ürün satış performansı analizi",
      icon: <ShoppingBag />,
      path: "/raporlar/urun-bazli",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      badge: "Satış",
      stats: "156 Ürün"
    },
    {
      id: 4,
      title: "Kategori Bazlı Satış",
      description: "Kategorilere göre satış dağılımı",
      icon: <PieChart />,
      path: "/raporlar/kategori-bazli",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      badge: "Dağılım",
      stats: "8 Kategori"
    },
    {
      id: 5,
      title: "Günlük Giderler",
      description: "Gider detayları ve yönetimi",
      icon: <DollarSign />,
      path: "/raporlar/gunluk-giderler",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      badge: "Maliyet",
      stats: "₺ 2.3K"
    },
    {
      id: 6,
      title: "Kasa Raporları",
      description: "Nakit, kart ve hesap hareketleri özeti",
      icon: <CreditCard />,
      path: "/raporlar/kasa",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      badge: "Finans",
      stats: "₺ 18.9K"
    },
    // YENİ: DETAYLI RAPOR KARTI
    {
      id: 7,
      title: "Detaylı Rapor",
      description: "Tarih aralığı seçerek tüm raporları tek ekranda görün",
      icon: <FileText />,
      path: "/raporlar/detayli",
      color: "#0ea5e9",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
      badge: "Kapsamlı",
      stats: "Tüm Veriler",
      special: true
    }
  ];

  // TAM SAYFA STİL DEĞİŞİKLERİ
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#fef3c7',
    backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
    padding: '0',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#4b2e05'
  };

  const wrapperStyle = {
    maxWidth: '100%',
    margin: '0',
    padding: isMobile ? '16px' : '24px',
  };

  // Breadcrumb
  const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#92400e',
    marginBottom: '16px',
    padding: '8px 0'
  };

  // Header
  const headerStyle = {
    marginBottom: '32px',
    padding: isMobile ? '20px 0' : '30px 0',
    borderBottom: '2px solid rgba(251, 191, 36, 0.4)'
  };

  const titleStyle = {
    fontSize: isMobile ? '32px' : '48px',
    fontWeight: 'bold',
    color: '#4b2e05',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  };

  const subtitleStyle = {
    fontSize: isMobile ? '16px' : '18px',
    color: '#92400e',
    margin: '0',
    fontWeight: '500',
    maxWidth: '800px',
    lineHeight: '1.6'
  };

  // Ana Grid - Tam sayfa
  const mainGridStyle = {
    display: 'grid',
    gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
    gap: '24px',
    marginBottom: '40px'
  };

  // Kart Stilleri
  const cardStyle = (isSpecial) => ({
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: isSpecial ? '0 8px 32px rgba(14, 165, 233, 0.2)' : '0 8px 32px rgba(0,0,0,0.1)',
    border: isSpecial ? '2px solid rgba(14, 165, 233, 0.3)' : '2px solid rgba(251, 191, 36, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    color: 'inherit',
    height: '100%',
    position: 'relative',
    transform: isSpecial ? 'scale(1.02)' : 'scale(1)'
  });

  // Kart iconu
  const cardIconStyle = (gradient, isSpecial) => ({
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: isSpecial ? '0 4px 20px rgba(14, 165, 233, 0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
    marginBottom: '20px',
    transform: isSpecial ? 'scale(1.1)' : 'scale(1)'
  });

  // Footer
  const footerStyle = {
    padding: '24px 0',
    borderTop: '2px solid rgba(251, 191, 36, 0.3)',
    color: '#6b7280',
    fontSize: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    marginTop: '40px'
  };

  const footerContentStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? '16px' : '0'
  };

  const footerInfoStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '8px' : '32px',
    alignItems: isMobile ? 'flex-start' : 'center'
  };

  // Breadcrumb link style
  const breadcrumbLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#92400e',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    border: '1px solid rgba(251, 191, 36, 0.3)'
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Breadcrumb */}
        <div style={breadcrumbStyle}>
          <Link to="/" style={breadcrumbLinkStyle}>
            <Home size={16} />
            Ana Sayfa
          </Link>
          <ChevronRight size={16} />
          <span style={{ fontWeight: '600', color: '#4b2e05' }}>Raporlar</span>
        </div>

        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Coffee size={32} />
            </div>
            📊 MyCafe Rapor Merkezi
          </h1>
          <p style={subtitleStyle}>
            İşletmenizin tüm finansal ve operasyonel performansını takip edin. 
            Detaylı analizlerle daha iyi kararlar alın.
          </p>
        </div>

        {/* Ana Rapor Kartları Grid */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 'bold',
            color: '#4b2e05',
            margin: '0 0 32px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <TrendingUp size={isMobile ? 24 : 32} color="#d97706" />
            Rapor Türleri
            <span style={{
              fontSize: '14px',
              backgroundColor: '#d97706',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              marginLeft: '12px'
            }}>
              {reportCards.length} Rapor
            </span>
          </h2>
          
          <div style={mainGridStyle}>
            {reportCards.map((card) => (
              <Link
                key={card.id}
                to={card.path}
                style={cardStyle(card.special)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = card.special ? 'translateY(-8px) scale(1.05)' : 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = card.special ? 
                    `0 20px 40px ${card.color}40` : 
                    `0 20px 40px ${card.color}30`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = card.special ? 'translateY(0) scale(1.02)' : 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = card.special ? 
                    '0 8px 32px rgba(14, 165, 233, 0.2)' : 
                    '0 8px 32px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = card.special ? 
                    'rgba(14, 165, 233, 0.3)' : 
                    'rgba(251, 191, 36, 0.1)';
                }}
              >
                {/* Kart Badge */}
                <span style={{
                  backgroundColor: card.special ? `${card.color}20` : `${card.color}15`,
                  color: card.color,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  border: card.special ? `1px solid ${card.color}40` : 'none'
                }}>
                  {card.badge}
                </span>

                {/* Kart İcon */}
                <div style={cardIconStyle(card.gradient, card.special)}>
                  {React.cloneElement(card.icon, { size: 32 })}
                </div>

                {/* Kart İçeriği */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4'
                }}>
                  {card.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 16px 0',
                  lineHeight: '1.6',
                  minHeight: '42px'
                }}>
                  {card.description}
                </p>

                {/* Detaylı Rapor için özel içerik */}
                {card.special && (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid rgba(14, 165, 233, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Filter size={16} color="#0ea5e9" />
                    <span style={{
                      fontSize: '12px',
                      color: '#0ea5e9',
                      fontWeight: '600'
                    }}>
                      Tarih aralığı seçimi ile tüm raporlar tek ekranda
                    </span>
                  </div>
                )}

                {/* İstatistik ve Link */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: card.special ? 
                    '1px solid rgba(14, 165, 233, 0.2)' : 
                    '1px solid rgba(251, 191, 36, 0.2)'
                }}>
                  <span style={{
                    fontSize: '15px',
                    color: card.color,
                    fontWeight: 'bold'
                  }}>
                    {card.stats}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: card.special ? '#0ea5e9' : '#d97706',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Raporu Aç
                    <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Detaylı Rapor Özellikleri */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          marginBottom: '40px',
          border: '2px solid rgba(14, 165, 233, 0.1)',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#0c4a6e',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FileText size={24} color="#0ea5e9" />
            Detaylı Rapor Özellikleri
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} color="#0ea5e9" />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#0c4a6e', marginBottom: '4px' }}>
                  Esnek Tarih Seçimi
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  İstediğiniz iki tarih arasındaki verileri analiz edin
                </div>
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={20} color="#0ea5e9" />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#0c4a6e', marginBottom: '4px' }}>
                  Tüm Raporlar Tek Ekranda
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Finans, satış, masa ve ürün analizleri bir arada
                </div>
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Filter size={20} color="#0ea5e9" />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#0c4a6e', marginBottom: '4px' }}>
                  Detaylı Filtreleme
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Masa tipi, ödeme türü, kategori bazlı filtreleme
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'rgba(14, 165, 233, 0.05)',
            borderRadius: '12px',
            border: '1px dashed rgba(14, 165, 233, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={14} color="#0ea5e9" />
              </div>
              <span style={{ fontWeight: '600', color: '#0c4a6e' }}>
                Detaylı Raporda Bulunan Analizler:
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
              fontSize: '13px',
              color: '#475569'
            }}>
              <span>• Finansal Özet (Ciro, Kar, Gider)</span>
              <span>• Masa Performans Analizi</span>
              <span>• Ürün Satış Dağılımı</span>
              <span>• Kategori Bazlı Satışlar</span>
              <span>• Ödeme Türü Dağılımı</span>
              <span>• Zaman Bazlı Analiz</span>
              <span>• En Çok Satan Ürünler</span>
              <span>• En Verimli Masalar</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div style={footerContentStyle}>
            <div style={footerInfoStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="#d97706" />
                <strong>7</strong> ana rapor türü
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} color="#d97706" />
                Gerçek zamanlı veri
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color="#0ea5e9" />
                Kapsamlı analiz
              </span>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#92400e',
              fontStyle: 'italic'
            }}>
              Veriler son 24 saat içinde güncellenmiştir
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaporlarDashboard;