// /workspaces/MyCafe/admin-ui/src/pages/Raporlar/Dashboard/RaporlarDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  PieChart, 
  FileText,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Clock,
  Download,
  Home,
  ChevronRight,
  Users,
  Printer,
  Mail,
  TrendingUp,
  Coffee
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

  const reportCards = [
    {
      id: 1,
      title: "Gün Sonu Raporu",
      description: "Günlük satış, gider ve kar özeti",
      icon: <BarChart3 />,
      path: "/raporlar/gun-sonu",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      badge: "Günlük"
    },
    {
      id: 2,
      title: "Masa Analizi",
      description: "Masaların performans, oturum ve ödeme analizi",
      icon: <Users />,
      path: "/raporlar/masa-analizi",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      badge: "Analiz"
    },
    {
      id: 3,
      title: "Ürün Bazlı Satış",
      description: "Ürün satış performansı analizi",
      icon: <ShoppingBag />,
      path: "/raporlar/urun-bazli",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      badge: "Satış"
    },
    {
      id: 4,
      title: "Kategori Bazlı Satış",
      description: "Kategorilere göre satış dağılımı",
      icon: <PieChart />,
      path: "/raporlar/kategori-bazli",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      badge: "Dağılım"
    },
    {
      id: 5,
      title: "Günlük Giderler",
      description: "Gider detayları ve yönetimi",
      icon: <DollarSign />,
      path: "/raporlar/gunluk-giderler",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      badge: "Maliyet"
    },
    {
      id: 6,
      title: "Detaylı Raporlar",
      description: "Tüm detaylı raporlara erişim",
      icon: <FileText />,
      path: "/raporlar/detayli",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      badge: "Detay"
    }
  ];

  const quickActions = [
    { 
      label: "PDF İndir", 
      sublabel: "Tüm Raporlar", 
      icon: <Download />, 
      color: "#ef4444",
      action: () => console.log("PDF indir")
    },
    { 
      label: "Excel Export", 
      sublabel: "Ham Veriler", 
      icon: <FileText />, 
      color: "#10b981",
      action: () => console.log("Excel export")
    },
    { 
      label: "Yazdır", 
      sublabel: "Fiziksel Kopya", 
      icon: <Printer />, 
      color: "#3b82f6",
      action: () => console.log("Yazdır")
    },
    { 
      label: "E-Posta Gönder", 
      sublabel: "Yöneticiye", 
      icon: <Mail />, 
      color: "#8b5cf6",
      action: () => console.log("E-posta gönder")
    }
  ];

  const recentReports = [
    { 
      name: "Gün Sonu Raporu", 
      date: "Bugün, 23:45", 
      amount: "₺ 1,250.50", 
      icon: <BarChart3 />,
      type: "gun-sonu",
      color: "#f59e0b"
    },
    { 
      name: "Kategori Satış Raporu", 
      date: "Bugün, 22:30", 
      amount: "₺ 3,450.00", 
      icon: <PieChart />,
      type: "kategori-bazli",
      color: "#6366f1"
    },
    { 
      name: "Masa Analizi Raporu", 
      date: "Bugün, 21:15", 
      amount: "₺ 2,180.00", 
      icon: <Users />,
      type: "masa-analizi",
      color: "#3b82f6"
    },
    { 
      name: "Ürün Satış Raporu", 
      date: "Dün, 23:50", 
      amount: "₺ 890.75", 
      icon: <ShoppingBag />,
      type: "urun-bazli",
      color: "#10b981"
    },
    { 
      name: "Gider Analizi", 
      date: "Dün, 22:15", 
      amount: "₺ 675.00", 
      icon: <DollarSign />,
      type: "gunluk-giderler",
      color: "#ef4444"
    }
  ];

  // Responsive grid hesaplamaları
  const getGridColumns = () => {
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 1;
  };

  const getActionsGridColumns = () => {
    if (isDesktop) return 4;
    if (isTablet) return 2;
    return 1;
  };

  const gridColumns = getGridColumns();
  const actionsGridColumns = getActionsGridColumns();

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
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: isMobile ? '28px' : '36px',
    fontWeight: 'bold',
    color: '#4b2e05',
    margin: '0 0 4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  // Rapor Kartları
  const cardsGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
    gap: '24px',
    marginBottom: '40px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #f3f4f6',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    color: 'inherit',
    height: '100%'
  };

  const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  };

  const cardIconStyle = (gradient) => ({
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  });

  const badgeStyle = (color) => ({
    backgroundColor: `${color}15`,
    color: color,
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  });

  const cardTitleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0'
  };

  const cardDescStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
    minHeight: '42px'
  };

  const cardFooterStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  };

  const linkTextStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d97706',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  // Hızlı İşlemler
  const quickActionsStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  };

  const sectionTitleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 24px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const actionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${actionsGridColumns}, 1fr)`,
    gap: '16px'
  };

  const actionCardStyle = {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  };

  const actionIconStyle = (color) => ({
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

  const actionTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  };

  const actionSubtitleStyle = {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0'
  };

  // Son Raporlar
  const recentReportsStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  };

  const recentHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  };

  const viewAllStyle = {
    fontSize: '14px',
    color: '#d97706',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const reportListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const reportItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  };

  const reportContentStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  };

  const reportIconStyle = (color) => ({
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color
  });

  const reportNameStyle = {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  };

  const reportDateStyle = {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0'
  };

  const reportAmountStyle = {
    textAlign: 'right',
    minWidth: '120px'
  };

  const amountTextStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#d97706',
    margin: '0 0 4px 0'
  };

  const recreateLinkStyle = {
    fontSize: '12px',
    color: '#3b82f6',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  // Footer
  const footerStyle = {
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: '14px'
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
    gap: isMobile ? '8px' : '24px',
    alignItems: isMobile ? 'flex-start' : 'center'
  };

  const footerActionsStyle = {
    display: 'flex',
    gap: '12px'
  };

  const footerButtonStyle = {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    color: '#6b7280',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
            <Coffee size={isMobile ? 28 : 36} color="#d97706" />
            📊 MyCafe Rapor Merkezi
          </h1>
        </div>

        {/* Rapor Kartları - ANA BÖLÜM */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{...sectionTitleStyle, marginBottom: '24px'}}>
            <BarChart3 size={20} />
            Rapor Türleri
          </h2>
          <div style={cardsGridStyle}>
            {reportCards.map((card) => (
              <Link
                key={card.id}
                to={card.path}
                style={cardStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#f3f4f6';
                }}
              >
                <div style={cardHeaderStyle}>
                  <div style={cardIconStyle(card.gradient)}>
                    {React.cloneElement(card.icon, { size: 28 })}
                  </div>
                  <span style={badgeStyle(card.color)}>
                    {card.badge}
                  </span>
                </div>
                <h3 style={cardTitleStyle}>{card.title}</h3>
                <p style={cardDescStyle}>{card.description}</p>
                <div style={cardFooterStyle}>
                  <span style={linkTextStyle}>
                    Raporu Aç
                    <ChevronRight size={16} />
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Detaylı analiz
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* İki Kolon Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Sol Kolon - Hızlı İşlemler */}
          <div style={quickActionsStyle}>
            <h3 style={sectionTitleStyle}>
              <TrendingUp size={20} />
              Hızlı İşlemler
            </h3>
            <div style={actionsGridStyle}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  style={actionCardStyle}
                  onClick={action.action}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={actionIconStyle(action.color)}>
                    {React.cloneElement(action.icon, { size: 24 })}
                  </div>
                  <h4 style={actionTitleStyle}>{action.label}</h4>
                  <p style={actionSubtitleStyle}>{action.sublabel}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sağ Kolon - Son Raporlar */}
          <div style={recentReportsStyle}>
            <div style={recentHeaderStyle}>
              <h3 style={sectionTitleStyle}>
                <FileText size={20} />
                Son Raporlar
              </h3>
              <a href="#" style={viewAllStyle}>
                Tümünü Gör
                <ChevronRight size={16} />
              </a>
            </div>
            <div style={reportListStyle}>
              {recentReports.map((report, index) => (
                <div
                  key={index}
                  style={reportItemStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <div style={reportContentStyle}>
                    <div style={reportIconStyle(report.color)}>
                      {report.icon}
                    </div>
                    <div>
                      <h4 style={reportNameStyle}>{report.name}</h4>
                      <p style={reportDateStyle}>{report.date}</p>
                    </div>
                  </div>
                  <div style={reportAmountStyle}>
                    <p style={amountTextStyle}>{report.amount}</p>
                    <Link 
                      to={`/raporlar/${report.type}`} 
                      style={recreateLinkStyle}
                    >
                      Tekrar Oluştur
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div style={footerContentStyle}>
            <div style={footerInfoStyle}>
              <span>📈 6 ana rapor türü</span>
              <span>💾 10 yıllık veri arşivi</span>
              <span>⚡ Gerçek zamanlı güncelleme</span>
            </div>
            <div style={footerActionsStyle}>
              <button 
                style={footerButtonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#4b2e05';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                Rapor Ayarları
              </button>
              <button 
                style={footerButtonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#4b2e05';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                Yardım & Destek
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaporlarDashboard;