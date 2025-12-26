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
  Coffee,
  Calendar,
  Filter,
  Search,
  Settings,
  HelpCircle,
  Database,
  RefreshCw
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
      badge: "Günlük",
      stats: "₺ 12.5K"
    },
    {
      id: 2,
      title: "Masa Analizi",
      description: "Masaların performans, oturum ve ödeme analizi",
      icon: <Users />,
      path: "/raporlar/masa-analizi",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      badge: "Analiz",
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
      title: "Detaylı Raporlar",
      description: "Tüm detaylı raporlara erişim",
      icon: <FileText />,
      path: "/raporlar/detayli",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      badge: "Detay",
      stats: "50+ Rapor"
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
      color: "#f59e0b",
      status: "Tamamlandı"
    },
    { 
      name: "Kategori Satış Raporu", 
      date: "Bugün, 22:30", 
      amount: "₺ 3,450.00", 
      icon: <PieChart />,
      type: "kategori-bazli",
      color: "#6366f1",
      status: "Tamamlandı"
    },
    { 
      name: "Masa Analizi Raporu", 
      date: "Bugün, 21:15", 
      amount: "₺ 2,180.00", 
      icon: <Users />,
      type: "masa-analizi",
      color: "#3b82f6",
      status: "Hazırlanıyor"
    },
    { 
      name: "Ürün Satış Raporu", 
      date: "Dün, 23:50", 
      amount: "₺ 890.75", 
      icon: <ShoppingBag />,
      type: "urun-bazli",
      color: "#10b981",
      status: "Tamamlandı"
    },
    { 
      name: "Gider Analizi", 
      date: "Dün, 22:15", 
      amount: "₺ 675.00", 
      icon: <DollarSign />,
      type: "gunluk-giderler",
      color: "#ef4444",
      status: "Tamamlandı"
    }
  ];

  // TAM SAYFA STİL DEĞİŞİKLİKLERİ
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#fef3c7',
    backgroundImage: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
    padding: '0', // Padding'i kaldırdık
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#4b2e05'
  };

  const wrapperStyle = {
    maxWidth: '100%', // Tam genişlik
    margin: '0',
    padding: isMobile ? '16px' : '24px', // İç padding eklendi
  };

  // Breadcrumb - Üst kısımda sabit
  const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#92400e',
    marginBottom: '24px',
    flexWrap: 'wrap',
    padding: '12px 0',
    borderBottom: '1px solid rgba(251, 191, 36, 0.3)'
  };

  // Header - Daha büyük ve etkileyici
  const headerStyle = {
    marginBottom: '32px',
    padding: '20px 0',
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
    fontWeight: '500'
  };

  // Rapor Kartları Grid - Tam genişlik
  const cardsGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${isDesktop ? 3 : isTablet ? 2 : 1}, 1fr)`,
    gap: '24px',
    marginBottom: '40px'
  };

  // İki Kolon Layout - Tam genişlik
  const twoColumnLayoutStyle = {
    display: 'grid',
    gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
    gap: '32px',
    marginBottom: '40px',
    width: '100%'
  };

  // Kart Stilleri - Daha büyük
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
    position: 'relative',
    overflow: 'hidden'
  };

  // Kart iconu daha büyük
  const cardIconStyle = (gradient) => ({
    width: '70px',
    height: '70px',
    borderRadius: '16px',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  });

  // Hızlı İşlemler Kartları
  const actionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${isDesktop ? 4 : isTablet ? 2 : 1}, 1fr)`,
    gap: '20px'
  };

  const actionCardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1px solid rgba(251, 191, 36, 0.2)'
  };

  // Footer - Tam genişlik
  const footerStyle = {
    padding: '24px 0',
    borderTop: '2px solid rgba(251, 191, 36, 0.3)',
    color: '#6b7280',
    fontSize: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    marginTop: '20px'
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

  const footerButtonStyle = {
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '2px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '10px',
    color: '#92400e',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  // Üst Kontroller
  const topControlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  };

  const controlButtonsStyle = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  };

  const controlButtonStyle = {
    padding: '10px 16px',
    backgroundColor: 'white',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '8px',
    color: '#92400e',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        {/* Breadcrumb */}
        <div style={breadcrumbStyle}>
          <Link to="/" style={{...breadcrumbLinkStyle, color: '#92400e'}}>
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
            İşletmenizin tüm finansal ve operasyonel verileri tek bir yerde
          </p>
        </div>

        {/* Üst Kontroller */}
        <div style={topControlsStyle}>
          <div style={controlButtonsStyle}>
            <button 
              style={controlButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fef3c7';
                e.currentTarget.style.borderColor = '#f59e0b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              }}
            >
              <Calendar size={16} />
              Tarih Seç
            </button>
            <button 
              style={controlButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fef3c7';
                e.currentTarget.style.borderColor = '#f59e0b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              }}
            >
              <Filter size={16} />
              Filtrele
            </button>
            <button 
              style={controlButtonStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fef3c7';
                e.currentTarget.style.borderColor = '#f59e0b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              }}
            >
              <RefreshCw size={16} />
              Yenile
            </button>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{
              padding: '10px 16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Database size={16} color="#92400e" />
              <span style={{ fontSize: '14px', color: '#92400e' }}>
                Veri Boyutu: <strong>2.4 GB</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Rapor Kartları - ANA BÖLÜM */}
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
            <BarChart3 size={isMobile ? 24 : 32} color="#d97706" />
            Rapor Türleri
          </h2>
          <div style={cardsGridStyle}>
            {reportCards.map((card) => (
              <Link
                key={card.id}
                to={card.path}
                style={cardStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = card.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px'
                }}>
                  <div style={cardIconStyle(card.gradient)}>
                    {React.cloneElement(card.icon, { size: 32 })}
                  </div>
                  <span style={{
                    backgroundColor: `${card.color}15`,
                    color: card.color,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {card.badge}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 12px 0'
                }}>{card.title}</h3>
                <p style={{
                  fontSize: '15px',
                  color: '#6b7280',
                  margin: '0 0 24px 0',
                  lineHeight: '1.6',
                  minHeight: '48px'
                }}>{card.description}</p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(251, 191, 36, 0.2)'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#d97706',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Raporu Aç
                    <ChevronRight size={18} />
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: card.color,
                    fontWeight: 'bold'
                  }}>
                    {card.stats}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* İki Kolon Layout */}
        <div style={twoColumnLayoutStyle}>
          {/* Sol Kolon - Hızlı İşlemler */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '2px solid rgba(251, 191, 36, 0.1)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 28px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <TrendingUp size={24} color="#d97706" />
              Hızlı İşlemler
            </h3>
            <div style={actionsGridStyle}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  style={actionCardStyle}
                  onClick={action.action}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.2)';
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: action.color
                  }}>
                    {React.cloneElement(action.icon, { size: 28 })}
                  </div>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 4px 0'
                  }}>{action.label}</h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '0'
                  }}>{action.sublabel}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sağ Kolon - Son Raporlar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '2px solid rgba(251, 191, 36, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FileText size={24} color="#d97706" />
                Son Raporlar
              </h3>
              <a href="#" style={{
                fontSize: '14px',
                color: '#d97706',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Tümünü Gör
                <ChevronRight size={16} />
              </a>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {recentReports.map((report, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    border: '1px solid rgba(251, 191, 36, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#fde68a';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flex: 1
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      backgroundColor: `${report.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: report.color
                    }}>
                      {report.icon}
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 4px 0'
                      }}>{report.name}</h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0'
                      }}>{report.date}</p>
                      <span style={{
                        fontSize: '12px',
                        color: report.color,
                        backgroundColor: `${report.color}15`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    minWidth: '140px'
                  }}>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#d97706',
                      margin: '0 0 8px 0'
                    }}>{report.amount}</p>
                    <Link 
                      to={`/raporlar/${report.type}`} 
                      style={{
                        fontSize: '13px',
                        color: '#3b82f6',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        justifyContent: 'flex-end'
                      }}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} /> 6 ana rapor türü
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} /> 10 yıllık veri arşivi
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={16} /> Gerçek zamanlı güncelleme
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: '16px'
            }}>
              <button 
                style={footerButtonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef3c7';
                  e.currentTarget.style.borderColor = '#d97706';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                }}
              >
                <Settings size={16} />
                Rapor Ayarları
              </button>
              <button 
                style={footerButtonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef3c7';
                  e.currentTarget.style.borderColor = '#d97706';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                }}
              >
                <HelpCircle size={16} />
                Yardım & Destek
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Breadcrumb link style'i ekleyelim
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

export default RaporlarDashboard;