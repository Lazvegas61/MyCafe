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
  CreditCard
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

  // Sadece belirtilen 6 rapor kartı (Kasa Raporları eklendi)
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
    }
  ];

  // TAM SAYFA STİL DEĞİŞİKLİKLERİ
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
    gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
    gap: '24px',
    marginBottom: '40px'
  };

  // Kart Stilleri
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: '2px solid rgba(251, 191, 36, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    color: 'inherit',
    height: '100%',
    position: 'relative'
  };

  // Kart iconu
  const cardIconStyle = (gradient) => ({
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginBottom: '20px'
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
                style={cardStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${card.color}30`;
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.1)';
                }}
              >
                {/* Kart Badge */}
                <span style={{
                  backgroundColor: `${card.color}15`,
                  color: card.color,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  position: 'absolute',
                  top: '20px',
                  right: '20px'
                }}>
                  {card.badge}
                </span>

                {/* Kart İcon */}
                <div style={cardIconStyle(card.gradient)}>
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

                {/* İstatistik ve Link */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(251, 191, 36, 0.2)'
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
                    color: '#d97706',
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

        {/* Footer */}
        <div style={footerStyle}>
          <div style={footerContentStyle}>
            <div style={footerInfoStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="#d97706" />
                <strong>6</strong> ana rapor türü
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} color="#d97706" />
                Gerçek zamanlı veri
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