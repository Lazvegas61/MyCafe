// /workspaces/MyCafe/admin-ui/src/pages/Raporlar/Dashboard/RaporlarDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  FileText,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  Clock,
  Download,
  Filter,
  AlertCircle,
  Home
} from 'lucide-react';
import './RaporlarDashboard.css'; // CSS modülü

const RaporlarDashboard = () => {
  const reportCards = [
    {
      title: "Gün Sonu Özet",
      description: "Günlük satış, gider ve kar özeti",
      icon: <BarChart3 style={{ width: '32px', height: '32px' }} />,
      path: "/raporlar/gun-sonu",
      color: "linear-gradient(to right, #f59e0b, #f97316)",
      stat: "Bugün"
    },
    {
      title: "Masa Oturum Raporu",
      description: "Masa açılış/kapanış detayları",
      icon: <Clock style={{ width: '32px', height: '32px' }} />,
      path: "/raporlar/masa-oturum",
      color: "linear-gradient(to right, #3b82f6, #06b6d4)",
      stat: "Zaman"
    },
    {
      title: "Masa Ödeme Dağılımı",
      description: "Masaların ödeme türü analizi",
      icon: <CreditCard style={{ width: '32px', height: '32px' }} />,
      path: "/raporlar/masa-odeme",
      color: "linear-gradient(to right, #8b5cf6, #8b5cf6)",
      stat: "Ödeme"
    },
    {
      title: "Ürün Bazlı Satış",
      description: "Ürün satış performansı analizi",
      icon: <ShoppingBag style={{ width: '32px', height: '32px' }} />,
      path: "/raporlar/urun-bazli",
      color: "linear-gradient(to right, #10b981, #10b981)",
      stat: "Analiz"
    },
    {
      title: "Kategori Bazlı Satış",
      description: "Kategorilere göre satış dağılımı",
      icon: <PieChart style={{ width: '32px', height: '32px' }} />,
      path: "/raporlar/kategori-bazli",
      color: "linear-gradient(to right, #6366f1, #3b82f6)",
      stat: "Dağılım"
    },
    {
      title: "Günlük Giderler",
      description: "Gider detayları ve yönetimi",
      icon: <DollarSign style={{ width: '32px', height: '32px' }} />,
      path: "/raporlar/gunluk-giderler",
      color: "linear-gradient(to right, #ef4444, #ec4899)",
      stat: "Takip"
    }
  ];

  // Bugünün tarihi
  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Breadcrumb */}
        <div style={styles.breadcrumb}>
          <Link to="/" style={styles.breadcrumbLink}>
            <Home style={{ width: '16px', height: '16px', marginRight: '4px' }} />
            <span>Ana Sayfa</span>
          </Link>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>Raporlar</span>
        </div>

        {/* Başlık ve Tarih */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 Raporlar Dashboard</h1>
            <p style={styles.date}>
              <Calendar style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              {today}
            </p>
          </div>
          
          <div style={styles.headerActions}>
            <button style={styles.buttonSecondary}>
              <Filter style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Filtrele
            </button>
            <button style={styles.buttonPrimary}>
              <Download style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Export
            </button>
          </div>
        </div>

        {/* Hızlı İstatistikler */}
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, background: 'linear-gradient(to right, #f59e0b, #f97316)'}}>
            <div style={styles.statContent}>
              <div>
                <p style={styles.statLabel}>Bugünkü Ciro</p>
                <p style={styles.statValue}>₺ 1,250.50</p>
              </div>
              <TrendingUp style={{ width: '40px', height: '40px', opacity: 0.8 }} />
            </div>
            <div style={styles.statFooter}>
              <span style={styles.statTrend}>↗️ %12 artış</span>
            </div>
          </div>
          
          <div style={{...styles.statCard, background: 'linear-gradient(to right, #3b82f6, #06b6d4)'}}>
            <div style={styles.statContent}>
              <div>
                <p style={styles.statLabel}>Açık Masa</p>
                <p style={styles.statValue}>8</p>
              </div>
              <Users style={{ width: '40px', height: '40px', opacity: 0.8 }} />
            </div>
            <div style={styles.statFooter}>
              <span style={styles.statTrend}>30 masa kapasite</span>
            </div>
          </div>
          
          <div style={{...styles.statCard, background: 'linear-gradient(to right, #ef4444, #ec4899)'}}>
            <div style={styles.statContent}>
              <div>
                <p style={styles.statLabel}>Maliyetsiz Ürün</p>
                <p style={styles.statValue}>3</p>
              </div>
              <AlertCircle style={{ width: '40px', height: '40px', opacity: 0.8 }} />
            </div>
            <div style={styles.statFooter}>
              <span style={styles.statTrend}>⚠️ Dikkat gerekiyor</span>
            </div>
          </div>
          
          <div style={{...styles.statCard, background: 'linear-gradient(to right, #10b981, #10b981)'}}>
            <div style={styles.statContent}>
              <div>
                <p style={styles.statLabel}>Günlük Gider</p>
                <p style={styles.statValue}>₺ 675.00</p>
              </div>
              <DollarSign style={{ width: '40px', height: '40px', opacity: 0.8 }} />
            </div>
            <div style={styles.statFooter}>
              <span style={styles.statTrend}>↘️ %5 düşüş</span>
            </div>
          </div>
        </div>

        {/* Rapor Kartları Grid */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Rapor Türleri</h2>
          <div style={styles.cardsGrid}>
            {reportCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                style={styles.cardLink}
              >
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{...styles.cardIcon, background: card.color}}>
                      {card.icon}
                    </div>
                    <span style={{
                      ...styles.cardBadge,
                      background: index === 0 || index === 3 ? '#dcfce7' : 
                                 index === 1 ? '#dbeafe' : 
                                 index === 2 ? '#f3e8ff' : 
                                 index === 4 ? '#e0e7ff' : '#fee2e2',
                      color: index === 0 || index === 3 ? '#166534' : 
                             index === 1 ? '#1e40af' : 
                             index === 2 ? '#7c3aed' : 
                             index === 4 ? '#3730a3' : '#991b1b'
                    }}>
                      {card.stat}
                    </span>
                  </div>
                  <h3 style={styles.cardTitle}>{card.title}</h3>
                  <p style={styles.cardDescription}>{card.description}</p>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardLinkText}>Raporu Görüntüle →</span>
                    <div style={styles.cardArrow}>
                      <svg style={{ width: '16px', height: '16px', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div style={styles.quickActions}>
          <h3 style={styles.sectionTitle}>Hızlı İşlemler</h3>
          <div style={styles.actionsGrid}>
            <button style={styles.actionCard}>
              <div style={{...styles.actionIcon, background: '#fef3c7'}}>
                <Download style={{ width: '24px', height: '24px', color: '#d97706' }} />
              </div>
              <span style={styles.actionTitle}>Tüm Raporları İndir</span>
              <span style={styles.actionSubtitle}>PDF/Excel Formatında</span>
            </button>
            
            <button style={{...styles.actionCard, background: '#eff6ff'}}>
              <div style={{...styles.actionIcon, background: '#dbeafe'}}>
                <Calendar style={{ width: '24px', height: '24px', color: '#1d4ed8' }} />
              </div>
              <span style={{...styles.actionTitle, color: '#1e40af'}}>Ay Sonu Raporu</span>
              <span style={{...styles.actionSubtitle, color: '#3b82f6'}}>Otomatik Oluştur</span>
            </button>
            
            <button style={{...styles.actionCard, background: '#fef2f2'}}>
              <div style={{...styles.actionIcon, background: '#fee2e2'}}>
                <AlertCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              </div>
              <span style={{...styles.actionTitle, color: '#991b1b'}}>Kritik Uyarılar</span>
              <span style={{...styles.actionSubtitle, color: '#ef4444'}}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#fecaca',
                  color: '#991b1b',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>3 yeni</span>
              </span>
            </button>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div style={styles.recentActivity}>
          <div style={styles.activityHeader}>
            <h3 style={styles.sectionTitle}>Son Oluşturulan Raporlar</h3>
            <Link to="#" style={styles.viewAllLink}>
              Tümünü Gör →
            </Link>
          </div>
          <div style={styles.activityList}>
            {[
              { name: "Gün Sonu Raporu", date: "Bugün, 23:45", amount: "₺ 1,250.50", type: "gun-sonu", icon: <FileText style={{ width: '20px', height: '20px' }} /> },
              { name: "Kategori Satış Raporu", date: "Bugün, 22:30", amount: "₺ 3,450.00", type: "kategori-bazli", icon: <PieChart style={{ width: '20px', height: '20px' }} /> },
              { name: "Masa Performans Raporu", date: "Bugün, 21:15", amount: "₺ 2,180.00", type: "masa-oturum", icon: <Clock style={{ width: '20px', height: '20px' }} /> },
              { name: "Ürün Satış Raporu", date: "Dün, 23:50", amount: "₺ 890.75", type: "urun-bazli", icon: <ShoppingBag style={{ width: '20px', height: '20px' }} /> },
            ].map((report, index) => (
              <div key={index} style={styles.activityItem}>
                <div style={styles.activityContent}>
                  <div style={styles.activityIcon}>
                    <div style={{ color: '#d97706' }}>
                      {report.icon}
                    </div>
                  </div>
                  <div>
                    <h4 style={styles.activityName}>{report.name}</h4>
                    <p style={styles.activityDate}>{report.date}</p>
                  </div>
                </div>
                <div style={styles.activityAmount}>
                  <p style={styles.amountText}>{report.amount}</p>
                  <Link to={`/raporlar/${report.type}`} style={styles.recreateLink}>
                    Tekrar Oluştur
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerContent}>
            <div style={styles.footerInfo}>
              <span>📊 Toplam 150+ rapor oluşturuldu</span>
              <span>💾 2.5 GB rapor verisi</span>
              <span>⏱️ Son güncelleme: 5 dk önce</span>
            </div>
            <div style={styles.footerActions}>
              <button style={styles.footerButton}>
                Ayarlar
              </button>
              <button style={styles.footerButton}>
                Yardım
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline Stiller
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)',
    padding: '16px',
    color: '#4b2e05'
  },
  wrapper: {
    maxWidth: '1280px',
    margin: '0 auto'
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#92400e',
    marginBottom: '24px'
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    color: '#92400e',
    textDecoration: 'none'
  },
  breadcrumbSeparator: {
    color: '#92400e',
    opacity: 0.7
  },
  breadcrumbCurrent: {
    fontWeight: '500',
    color: '#4b2e05'
  },
  header: {
    marginBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4b2e05',
    margin: '0 0 8px 0'
  },
  date: {
    fontSize: '16px',
    color: '#92400e',
    display: 'flex',
    alignItems: 'center',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  buttonPrimary: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#d97706',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonSecondary: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'white',
    color: '#92400e',
    border: '1px solid #fbbf24',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    padding: '20px',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
  },
  statContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '0 0 4px 0'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0
  },
  statFooter: {
    fontSize: '14px',
    opacity: 0.9
  },
  statTrend: {
    opacity: 0.9
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4b2e05',
    margin: '0 0 16px 0'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '24px'
  },
  cardLink: {
    textDecoration: 'none',
    display: 'block'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #fed7aa',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  cardIcon: {
    padding: '12px',
    borderRadius: '12px',
    color: 'white'
  },
  cardBadge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardLinkText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#d97706'
  },
  cardArrow: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActions: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '16px'
  },
  actionCard: {
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  actionIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#92400e'
  },
  actionSubtitle: {
    fontSize: '14px',
    color: '#d97706'
  },
  recentActivity: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  viewAllLink: {
    fontSize: '14px',
    color: '#d97706',
    textDecoration: 'none',
    fontWeight: '500'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  activityContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activityName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  activityDate: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },
  activityAmount: {
    textAlign: 'right'
  },
  amountText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#d97706',
    margin: '0 0 4px 0'
  },
  recreateLink: {
    fontSize: '12px',
    color: '#3b82f6',
    textDecoration: 'none'
  },
  footer: {
    paddingTop: '24px',
    borderTop: '1px solid #fed7aa'
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontSize: '14px',
    color: '#92400e'
  },
  footerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  footerActions: {
    display: 'flex',
    gap: '12px'
  },
  footerButton: {
    padding: '4px 12px',
    color: '#d97706',
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

// Responsive için media query'leri ekleyelim (isteğe bağlı)
if (typeof window !== 'undefined') {
  // Masaüstü için
  if (window.innerWidth >= 768) {
    styles.statsGrid.gridTemplateColumns = 'repeat(2, 1fr)';
    styles.cardsGrid.gridTemplateColumns = 'repeat(2, 1fr)';
    styles.actionsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
    styles.header.flexDirection = 'row';
    styles.header.justifyContent = 'space-between';
    styles.header.alignItems = 'center';
    styles.footerContent.flexDirection = 'row';
    styles.footerContent.justifyContent = 'space-between';
    styles.footerContent.alignItems = 'center';
  }
  
  // Büyük ekranlar için
  if (window.innerWidth >= 1024) {
    styles.statsGrid.gridTemplateColumns = 'repeat(4, 1fr)';
    styles.cardsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  }
}

export default RaporlarDashboard;