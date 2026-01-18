// File: admin-ui/src/pages/AnaEkran/AnaEkran.jsx (GÜNCELLENMİŞ)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGunDurumu } from "../../context/GunDurumuContext";
import "./AnaEkran.css";

export default function AnaEkran() {
  const [currentTime, setCurrentTime] = useState("");
  const [dashboardData, setDashboardData] = useState({
    dailySales: { total: 0, normal: 0, bilardo: 0, debt: 0 },
    criticalProducts: [],
    openTables: [],
    openAdisyonlar: [],
    dailyExpenses: 0,
    gunSuresi: { saat: 0, dakika: 0 },
    lastUpdated: new Date().toISOString()
  });
  
  const { gunAktif, gunBilgileri } = useGunDurumu();
  const navigate = useNavigate();
  const { user } = useAuth();

  // GÜN SÜRESİNİ HESAPLAYAN FONKSİYON
  const calculateGunSuresi = useCallback(() => {
    if (!gunAktif || !gunBilgileri?.baslangicTarih) {
      return { saat: 0, dakika: 0 };
    }
    
    try {
      const baslangic = new Date(gunBilgileri.baslangicTarih);
      const simdi = new Date();
      
      // Geçersiz tarih kontrolü
      if (isNaN(baslangic.getTime())) {
        console.warn("Geçersiz başlangıç tarihi");
        return { saat: 0, dakika: 0 };
      }
      
      const farkMs = simdi - baslangic;
      
      // Negatif süre kontrolü
      if (farkMs < 0) {
        console.warn("Negatif süre tespit edildi");
        return { saat: 0, dakika: 0 };
      }
      
      const toplamDakika = Math.floor(farkMs / 60000);
      const saat = Math.floor(toplamDakika / 60);
      const dakika = toplamDakika % 60;
      
      return { saat, dakika };
    } catch (error) {
      console.error("Gün süresi hesaplama hatası:", error);
      return { saat: 0, dakika: 0 };
    }
  }, [gunAktif, gunBilgileri]);

  // TOPLAM BORÇ HESAPLAYAN FONKSİYON
  const getToplamBorc = useCallback(() => {
    try {
      const borclar = JSON.parse(localStorage.getItem("mc_borclar") || "[]");
      const musteriBorclari = JSON.parse(localStorage.getItem("mc_musteriler") || "[]");
      
      // Aktif borçlar (kapanmamış)
      const aktifBorclar = borclar.filter(b => {
        return !b.kapali && !b.kapanisZamani && b.durum !== "KAPALI";
      });
      
      const toplamBorc = aktifBorclar.reduce((sum, b) => {
        return sum + (parseFloat(b.tutar || 0) - parseFloat(b.odenen || 0));
      }, 0);
      
      return toplamBorc;
    } catch (error) {
      console.error("Toplam borç hesaplama hatası:", error);
      return 0;
    }
  }, []);

  // DASHBOARD VERİSİNİ GÜNCELLEYEN FONKSİYON
  const updateDashboard = useCallback(() => {
    try {
      // RAPOR MOTORU KONTROLÜ
      if (!window.raporMotoruV2 || typeof window.raporMotoruV2.getDashboardData !== 'function') {
        console.warn("Rapor motoru henüz hazır değil");
        
        // Fallback: Manuel hesaplama
        const bugun = new Date().toISOString().split('T')[0];
        
        // Günlük satışları hesapla (basit)
        const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        const bugunkuAdisyonlar = adisyonlar.filter(a => {
          const tarih = new Date(a.tarih || a.acilisZamani).toISOString().split('T')[0];
          return tarih === bugun;
        });
        
        const normalSatis = bugunkuAdisyonlar.reduce((sum, a) => {
          return sum + parseFloat(a.toplamTutar || 0);
        }, 0);
        
        // Bilardo satışları
        const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
        const bugunkuBilardo = bilardoAdisyonlar.filter(a => {
          const tarih = new Date(a.acilisZamani).toISOString().split('T')[0];
          return tarih === bugun;
        });
        
        const bilardoSatis = bugunkuBilardo.reduce((sum, a) => {
          return sum + (parseFloat(a.bilardoUcreti || 0) + parseFloat(a.ekUrunToplam || 0));
        }, 0);
        
        // Kritik stok
        const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
        const kritikStoklar = urunler.filter(u => {
          const stok = parseInt(u.stock || 0);
          const kritikSeviye = parseInt(u.critical || 10);
          return stok <= kritikSeviye;
        });
        
        // Açık masalar
        const masalar = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
        const acikMasalar = masalar.filter(m => m.durum === "DOLU");
        
        // Giderler
        const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
        const bugunkuGiderler = giderler.filter(g => {
          const tarih = new Date(g.tarih).toISOString().split('T')[0];
          return tarih === bugun;
        });
        
        const giderToplam = bugunkuGiderler.reduce((sum, g) => {
          return sum + parseFloat(g.tutar || 0);
        }, 0);
        
        setDashboardData(prev => ({
          ...prev,
          dailySales: {
            total: normalSatis + bilardoSatis,
            normal: normalSatis,
            bilardo: bilardoSatis,
            debt: getToplamBorc()
          },
          criticalProducts: kritikStoklar,
          openTables: acikMasalar,
          openAdisyonlar: [],
          dailyExpenses: giderToplam,
          gunSuresi: calculateGunSuresi(),
          lastUpdated: new Date().toISOString()
        }));
        
        return;
      }
      
      // RAPOR MOTORU VARSA ONU KULLAN
      const dashboardData = window.raporMotoruV2.getDashboardData();
      
      // KRİTİK STOK SÖZLEŞMESİ KONTROLÜ
      let kritikStoklar = [];
      let kritikStokSayisi = 0;
      
      if (dashboardData.kritikStoklar && Array.isArray(dashboardData.kritikStoklar)) {
        kritikStoklar = dashboardData.kritikStoklar;
        kritikStokSayisi = dashboardData.kritikStoklar.length;
      } else if (dashboardData.kritikStokSayisi !== undefined) {
        kritikStokSayisi = dashboardData.kritikStokSayisi;
        // Kritik stok listesini manuel getir
        const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
        kritikStoklar = urunler.filter(u => {
          const stok = parseInt(u.stock || 0);
          const kritikSeviye = parseInt(u.critical || 10);
          return stok <= kritikSeviye;
        });
      }
      
      // GÜNLÜK HESAP KONTROLÜ
      let gunlukHesap = { normal: 0, bilardo: 0, acikAdisyonlar: 0 };
      if (dashboardData.gunlukHesap) {
        gunlukHesap = dashboardData.gunlukHesap;
      }
      
      setDashboardData({
        // GÜNLÜK HESAP (canlı toplam)
        dailySales: {
          total: gunlukHesap.normal + gunlukHesap.bilardo,
          normal: gunlukHesap.normal,
          bilardo: gunlukHesap.bilardo,
          debt: getToplamBorc()
        },
        // AÇIK MASALAR (canlı)
        openTables: dashboardData.acikMasalar || [],
        // KRİTİK STOK (canlı)
        criticalProducts: kritikStoklar,
        criticalStockCount: kritikStokSayisi,
        // AÇIK ADISYONLAR (canlı)
        openAdisyonlar: dashboardData.acikAdisyonlar || [],
        // GÜNLÜK GİDERLER
        dailyExpenses: dashboardData.dailyExpenses || 0,
        // GÜN SÜRESİ (hesaplama)
        gunSuresi: calculateGunSuresi(),
        // TIMESTAMP (debug için)
        lastUpdated: new Date().toISOString(),
        // DEBUG INFO (geliştirme modunda)
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            raporMotoruVersion: window.raporMotoruV2?.version || 'unknown',
            dataSource: dashboardData.timestamp ? 'raporMotoru' : 'fallback',
            kritikStokFormat: dashboardData.kritikStoklar ? 'array' : dashboardData.kritikStokSayisi ? 'count' : 'none'
          }
        })
      });
      
      console.log('📊 Dashboard güncellendi:', {
        saat: new Date().toLocaleTimeString('tr-TR'),
        normalSatis: gunlukHesap.normal,
        bilardoSatis: gunlukHesap.bilardo,
        acikMasalar: (dashboardData.acikMasalar || []).length,
        kritikStok: kritikStokSayisi
      });
      
    } catch (error) {
      console.error("Dashboard güncelleme hatası:", error);
      
      // Hata durumunda en azından gün süresini güncelle
      setDashboardData(prev => ({
        ...prev,
        gunSuresi: calculateGunSuresi(),
        lastUpdated: new Date().toISOString(),
        _error: error.message
      }));
    }
  }, [calculateGunSuresi, getToplamBorc]);

  // SAATİ GÜNCELLEYEN EFFECT
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  // DASHBOARD GÜNCELLEME EFFECT'İ (ANA EFFECT)
  useEffect(() => {
    console.log('🚀 Dashboard effect başlatılıyor...');
    
    // EVENT HANDLER FONKSİYONU
    const handleDashboardUpdate = (event) => {
      console.log(`📢 Dashboard event tetiklendi: ${event.type || 'unknown'}`, event.detail || '');
      
      // Kısa bir gecikmeyle güncelle (DOM'un hazır olması için)
      setTimeout(() => {
        updateDashboard();
      }, 100);
    };
    
    // DASHBOARD'U ANINDA GÜNCELLEYEN EVENT'LER
    const instantUpdateEvents = [
      'adisyonGuncellendi',
      'odemeAlindi',
      'masaGuncellendi',
      'kasaHareketiEklendi',
      'gunDurumuDegisti',
      'stokGuncellendi',
      'urunEklendi',
      'urunSilindi',
      'musteriEklendi',
      'borcEklendi',
      'borcOdendi',
      'giderEklendi',
      'bilardoAdisyonGuncellendi',
      'bilardoMasaGuncellendi'
    ];
    
    // EVENT LISTENER'LARI KUR
    instantUpdateEvents.forEach(eventName => {
      window.addEventListener(eventName, handleDashboardUpdate);
    });
    
    // ÖZEL EVENT'LER
    const handleGunBaslatildi = () => {
      console.log('🌅 Gün başlatıldı, dashboard resetleniyor');
      setTimeout(updateDashboard, 500);
    };
    
    const handleGunSonuYapildi = (event) => {
      console.log('🏁 Gün sonu yapıldı, dashboard güncelleniyor', event.detail?.raporId);
      setTimeout(updateDashboard, 1000);
    };
    
    window.addEventListener("gunBaslatildi", handleGunBaslatildi);
    window.addEventListener("gunSonuYapildi", handleGunSonuYapildi);
    
    // İLK YÜKLEME
    console.log('🔄 İlk dashboard yüklemesi yapılıyor...');
    const initialTimeout = setTimeout(() => {
      updateDashboard();
    }, 1000);
    
    // INTERVAL GÜNCELLEME (EMNİYET KEMERİ - 30 SANİYEDE BİR)
    const dashboardInterval = setInterval(() => {
      // Gün aktifse ve 30 saniye geçtiyse güncelle
      if (gunAktif) {
        updateDashboard();
      }
    }, 30000);
    
    // STORAGE DEĞİŞİKLİKLERİNİ DİNLE
    const handleStorageChange = (event) => {
      if (!event.key) return;
      
      // Dashboard'u etkileyen key'ler
      const dashboardKeys = [
        'mc_adisyonlar',
        'bilardo_adisyonlar',
        'mc_masalar',
        'bilardo',
        'mc_urunler',
        'mc_giderler',
        'mc_borclar',
        'mc_kasa_hareketleri'
      ];
      
      if (dashboardKeys.some(key => event.key.startsWith(key))) {
        console.log(`💾 Storage değişti: ${event.key}, dashboard güncelleniyor`);
        setTimeout(updateDashboard, 200);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // CLEANUP FONKSİYONU
    return () => {
      console.log('🧹 Dashboard cleanup yapılıyor...');
      
      clearTimeout(initialTimeout);
      clearInterval(dashboardInterval);
      
      // EVENT LISTENER'LARI KALDIR
      instantUpdateEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleDashboardUpdate);
      });
      
      window.removeEventListener("gunBaslatildi", handleGunBaslatildi);
      window.removeEventListener("gunSonuYapildi", handleGunSonuYapildi);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateDashboard, gunAktif]);

  // RAPOR MOTORU KONTROL EFFECT'İ
  useEffect(() => {
    // Rapor motorunun yüklenmesini bekle
    const checkRaporMotoru = () => {
      if (window.raporMotoruV2 && typeof window.raporMotoruV2.getDashboardData === 'function') {
        console.log('✅ RaporMotoruV2 hazır, dashboard güncelleniyor');
        updateDashboard();
        return true;
      }
      return false;
    };
    
    // Hemen kontrol et
    if (!checkRaporMotoru()) {
      // 3 saniye içinde hazır olmasını bekle
      const timeout = setTimeout(() => {
        if (checkRaporMotoru()) {
          clearInterval(interval);
        }
      }, 3000);
      
      // 1 saniyede bir kontrol et
      const interval = setInterval(() => {
        checkRaporMotoru();
      }, 1000);
      
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [updateDashboard]);

  // KULLANICI DEĞİŞİKLİĞİNDE DASHBOARD'U GÜNCELLE
  useEffect(() => {
    if (user) {
      console.log('👤 Kullanıcı değişti, dashboard güncelleniyor:', user.username);
      setTimeout(updateDashboard, 500);
    }
  }, [user, updateDashboard]);

  // MEMOIZE EDİLMİŞ HESAPLAMALAR
  const acikMasaSayisi = useMemo(() => {
    return dashboardData.openTables.length;
  }, [dashboardData.openTables]);
  
  const toplamCiro = useMemo(() => {
    return dashboardData.dailySales.total;
  }, [dashboardData.dailySales.total]);
  
  const kritikStokSayisi = useMemo(() => {
    return dashboardData.criticalStockCount || dashboardData.criticalProducts.length;
  }, [dashboardData.criticalStockCount, dashboardData.criticalProducts.length]);
  
  const acikAdisyonSayisi = useMemo(() => {
    return dashboardData.openAdisyonlar.length;
  }, [dashboardData.openAdisyonlar.length]);

  // GÜN DURUMU BİLGİSİ
  const gunDurumuBilgisi = useMemo(() => {
    if (!gunAktif) {
      return {
        label: "🔴 Gün Kapalı",
        color: "#e74c3c",
        bgColor: "#fdf2f0",
        actionText: "Gün Başlat"
      };
    }
    
    return {
      label: "🟢 Gün Aktif",
      color: "#27ae60",
      bgColor: "#f0f9f4",
      actionText: "Gün Sonu",
      sure: `${dashboardData.gunSuresi.saat.toString().padStart(2, '0')}:${dashboardData.gunSuresi.dakika.toString().padStart(2, '0')}`
    };
  }, [gunAktif, dashboardData.gunSuresi]);

  // NAVİGASYON FONKSİYONLARI
  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleGunBaslat = () => {
    if (!user) {
      alert("Önce giriş yapmalısınız.");
      navigate("/login");
      return;
    }
    
    // AuthContext'ten gunBaslat fonksiyonunu kullan
    const { gunBaslat } = useAuth();
    if (gunBaslat) {
      gunBaslat();
    } else {
      alert("Gün başlatma yetkiniz yok veya sistem hazır değil.");
    }
  };

  // DASHBOARD KARTLARI
  const dashboardCards = [
    {
      title: "Günlük Ciro",
      value: `${toplamCiro.toFixed(2)} ₺`,
      subtext: `Normal: ${dashboardData.dailySales.normal.toFixed(2)} ₺ • Bilardo: ${dashboardData.dailySales.bilardo.toFixed(2)} ₺`,
      icon: "💰",
      color: "#2ecc71",
      bgColor: "#f0f9f4",
      onClick: () => handleNavigate("/raporlar/kasa")
    },
    {
      title: "Açık Masalar",
      value: acikMasaSayisi.toString(),
      subtext: `${dashboardData.openTables.filter(m => m.tip === 'NORMAL').length} Normal • ${dashboardData.openTables.filter(m => m.tip === 'BİLARDO').length} Bilardo`,
      icon: "🍽️",
      color: "#3498db",
      bgColor: "#f0f7ff",
      onClick: () => handleNavigate("/masalar")
    },
    {
      title: "Kritik Stok",
      value: kritikStokSayisi.toString(),
      subtext: kritikStokSayisi > 0 ? "⚠️ Dikkat gerekiyor" : "✅ Normal",
      icon: "📦",
      color: kritikStokSayisi > 0 ? "#e74c3c" : "#2ecc71",
      bgColor: kritikStokSayisi > 0 ? "#fdf2f0" : "#f0f9f4",
      onClick: () => handleNavigate("/urun-stok")
    },
    {
      title: "Açık Adisyon",
      value: acikAdisyonSayisi.toString(),
      subtext: `${dashboardData.openAdisyonlar.filter(a => a.tur === 'NORMAL').length} Normal • ${dashboardData.openAdisyonlar.filter(a => a.tur === 'BİLARDO').length} Bilardo`,
      icon: "🧾",
      color: "#9b59b6",
      bgColor: "#f8f0ff",
      onClick: () => handleNavigate("/raporlar")
    },
    {
      title: "Günlük Gider",
      value: `${dashboardData.dailyExpenses.toFixed(2)} ₺`,
      subtext: "Bugünkü toplam gider",
      icon: "💸",
      color: "#e67e22",
      bgColor: "#fef5e9",
      onClick: () => handleNavigate("/giderler")
    },
    {
      title: "Toplam Borç",
      value: `${dashboardData.dailySales.debt.toFixed(2)} ₺`,
      subtext: "Aktif müşteri borçları",
      icon: "🏦",
      color: "#34495e",
      bgColor: "#f4f6f7",
      onClick: () => handleNavigate("/musteri-islemleri")
    }
  ];

  // KRİTİK STOK LİSTESİ (sadece ilk 3)
  const kritikStokListesi = useMemo(() => {
    return dashboardData.criticalProducts.slice(0, 3).map(urun => ({
      name: urun.ad || urun.name || "İsimsiz Ürün",
      stok: parseInt(urun.stock || 0),
      kritik: parseInt(urun.critical || 10)
    }));
  }, [dashboardData.criticalProducts]);

  // AÇIK MASALAR LİSTESİ (sadece ilk 5)
  const acikMasalarListesi = useMemo(() => {
    return dashboardData.openTables.slice(0, 5).map(masa => ({
      no: masa.no || masa.masaNo || "?",
      tip: masa.tip || (masa.isBilardo ? "BİLARDO" : "NORMAL"),
      tutar: parseFloat(masa.toplamTutar || 0).toFixed(2),
      musteri: masa.musteriAdi || "Müşteri Yok"
    }));
  }, [dashboardData.openTables]);

  // SON GÜNCELLEME ZAMANI
  const lastUpdatedText = useMemo(() => {
    try {
      const date = new Date(dashboardData.lastUpdated);
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return "Bilinmiyor";
    }
  }, [dashboardData.lastUpdated]);

  // RENDER
  return (
    <div className="ana-ekran" style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5e7d0 0%, #e8d9b5 100%)",
      padding: "20px",
      color: "#4b2e05"
    }}>
      {/* ÜST BİLGİ ÇUBUĞU */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        padding: "15px 20px",
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>
            🎯 MyCafe Dashboard
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
            <span style={{ 
              padding: "4px 10px", 
              borderRadius: "20px", 
              background: gunDurumuBilgisi.bgColor,
              color: gunDurumuBilgisi.color,
              fontWeight: "bold",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              {gunDurumuBilgisi.label}
              {gunDurumuBilgisi.sure && (
                <span style={{ 
                  background: "rgba(0,0,0,0.1)", 
                  padding: "2px 8px", 
                  borderRadius: "10px",
                  fontSize: "12px"
                }}>
                  {gunDurumuBilgisi.sure}
                </span>
              )}
            </span>
            <span style={{ fontSize: "13px", color: "#7d6b4f" }}>
              👤 {user?.adSoyad || user?.username || "Kullanıcı"}
            </span>
            <span style={{ fontSize: "13px", color: "#7d6b4f" }}>
              🕐 {currentTime}
            </span>
          </div>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: "#95a5a6", marginBottom: "4px" }}>
            Son güncelleme: {lastUpdatedText}
          </div>
          <button
            onClick={updateDashboard}
            style={{
              padding: "8px 16px",
              background: "#4b2e05",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* DASHBOARD KARTLARI */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderLeft: `4px solid ${card.color}`,
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.08)";
            }}
          >
            <div style={{
              position: "absolute",
              right: "20px",
              top: "20px",
              fontSize: "32px",
              opacity: "0.2"
            }}>
              {card.icon}
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#7d6b4f", fontWeight: "600", marginBottom: "5px" }}>
                  {card.title}
                </div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: card.color, marginBottom: "8px" }}>
                  {card.value}
                </div>
                <div style={{ fontSize: "13px", color: "#95a5a6" }}>
                  {card.subtext}
                </div>
              </div>
            </div>
            
            {/* Hover gösterge */}
            <div style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              right: "0",
              height: "3px",
              background: card.color,
              transform: "scaleX(0)",
              transition: "transform 0.3s ease",
              transformOrigin: "left"
            }} />
            
            <style>{`
              div[onclick]:hover > div:last-child {
                transform: scaleX(1);
              }
            `}</style>
          </div>
        ))}
      </div>

      {/* ALT PANELLER */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        {/* KRİTİK STOK PANELİ */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: kritikStokSayisi > 0 ? "#e74c3c" : "#2ecc71" }}>📦</span>
              Kritik Stok ({kritikStokSayisi})
            </h3>
            {kritikStokSayisi > 0 && (
              <button
                onClick={() => handleNavigate("/urun-stok")}
                style={{
                  padding: "6px 12px",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                STOKU GÜNCELLE
              </button>
            )}
          </div>
          
          {kritikStokSayisi > 0 ? (
            <div>
              {kritikStokListesi.map((urun, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    marginBottom: "8px",
                    background: "#fdf2f0",
                    borderRadius: "8px",
                    borderLeft: "3px solid #e74c3c"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{urun.name}</div>
                    <div style={{ fontSize: "12px", color: "#e74c3c" }}>
                      Stok: {urun.stok} | Kritik Seviye: {urun.kritik}
                    </div>
                  </div>
                  <div style={{
                    padding: "4px 10px",
                    background: "#e74c3c",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}>
                    {Math.max(0, urun.kritik - urun.stok)} adet eksik
                  </div>
                </div>
              ))}
              
              {kritikStokSayisi > 3 && (
                <div style={{
                  textAlign: "center",
                  padding: "10px",
                  color: "#7d6b4f",
                  fontSize: "13px",
                  borderTop: "1px dashed #eee",
                  marginTop: "10px"
                }}>
                  + {kritikStokSayisi - 3} daha fazla kritik stok...
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "30px 20px",
              color: "#27ae60",
              fontSize: "14px"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
              <div style={{ fontWeight: "600" }}>Kritik stok yok</div>
              <div style={{ fontSize: "13px", color: "#7d6b4f", marginTop: "5px" }}>
                Tüm stoklar normal seviyede
              </div>
            </div>
          )}
        </div>

        {/* AÇIK MASALAR PANELİ */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#3498db" }}>🍽️</span>
              Açık Masalar ({acikMasaSayisi})
            </h3>
            <button
              onClick={() => handleNavigate("/masalar")}
              style={{
                padding: "6px 12px",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              TÜM MASALAR
            </button>
          </div>
          
          {acikMasaSayisi > 0 ? (
            <div>
              {acikMasalarListesi.map((masa, index) => (
                <div
                  key={index}
                  onClick={() => handleNavigate(`/adisyondetay/${masa.no}`)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    marginBottom: "8px",
                    background: masa.tip === "BİLARDO" ? "#f0f7ff" : "#f9f9f9",
                    borderRadius: "8px",
                    cursor: "pointer",
                    borderLeft: `3px solid ${masa.tip === "BİLARDO" ? "#3498db" : "#9b59b6"}`,
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = masa.tip === "BİLARDO" ? "#e8f4ff" : "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = masa.tip === "BİLARDO" ? "#f0f7ff" : "#f9f9f9";
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>
                        {masa.tip === "BİLARDO" ? "🎱" : "🍽️"} {masa.no}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        background: masa.tip === "BİLARDO" ? "#3498db" : "#9b59b6",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "10px"
                      }}>
                        {masa.tip}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#7d6b4f", marginTop: "2px" }}>
                      {masa.musteri}
                    </div>
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "16px", color: "#4b2e05" }}>
                    {masa.tutar} ₺
                  </div>
                </div>
              ))}
              
              {acikMasaSayisi > 5 && (
                <div style={{
                  textAlign: "center",
                  padding: "10px",
                  color: "#7d6b4f",
                  fontSize: "13px",
                  borderTop: "1px dashed #eee",
                  marginTop: "10px"
                }}>
                  + {acikMasaSayisi - 5} daha fazla açık masa...
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "30px 20px",
              color: "#7d6b4f",
              fontSize: "14px"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔄</div>
              <div style={{ fontWeight: "600" }}>Açık masa yok</div>
              <div style={{ fontSize: "13px", color: "#95a5a6", marginTop: "5px" }}>
                Tüm masalar boş veya kapalı
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HIZLI ERİŞİM BUTONLARI */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
        marginBottom: "30px"
      }}>
        <h3 style={{ margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>⚡</span> Hızlı Erişim
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "10px"
        }}>
          {[
            { label: "Masalar", icon: "🍽️", path: "/masalar", color: "#9b59b6" },
            { label: "Bilardo", icon: "🎱", path: "/bilardo", color: "#3498db" },
            { label: "Raporlar", icon: "📊", path: "/raporlar", color: "#2ecc71" },
            { label: "Ürün/Stok", icon: "📦", path: "/urun-stok", color: "#e67e22" },
            { label: "Müşteriler", icon: "👥", path: "/musteri-islemleri", color: "#34495e" },
            { label: "Giderler", icon: "💸", path: "/giderler", color: "#e74c3c" },
            { label: "Personel", icon: "🧑‍🍳", path: "/personel", color: "#1abc9c" },
            { label: "Ayarlar", icon: "⚙️", path: "/ayarlar", color: "#7f8c8d" }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigate(item.path)}
              style={{
                padding: "15px 10px",
                background: "white",
                border: `2px solid ${item.color}20`,
                borderRadius: "10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${item.color}10`;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "24px" }}>{item.icon}</span>
              <span style={{ fontWeight: "600", fontSize: "13px", color: item.color }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SİSTEM DURUMU / DEBUG PANELİ (Sadece geliştirme modunda) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          background: "#2c3e50",
          color: "white",
          borderRadius: "12px",
          padding: "15px",
          fontSize: "12px",
          marginTop: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: "bold", color: "#ecf0f1" }}>🔧 Sistem Durumu</span>
            <span style={{ 
              background: dashboardData._error ? "#e74c3c" : "#2ecc71", 
              padding: "2px 8px", 
              borderRadius: "10px",
              fontSize: "10px"
            }}>
              {dashboardData._error ? "HATA" : "SAĞLAM"}
            </span>
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "8px",
            fontFamily: "monospace"
          }}>
            <div>
  Rapor Motoru:{" "}
  {window.raporMotoruV2 &&
  typeof window.raporMotoruV2.createGunSonuRaporu === "function"
    ? "✅"
    : "❌"}
</div>
            <div>Gün Aktif: {gunAktif ? "✅" : "❌"}</div>
            <div>Kullanıcı: {user ? "✅" : "❌"}</div>
            <div>Event Dinleyiciler: {Object.keys(window._eventListeners || {}).length}</div>
            <div>LocalStorage: {localStorage.length} item</div>
            <div>Render: {Date.now()}</div>
          </div>
          
          {dashboardData._debug && (
            <div style={{ 
              marginTop: "10px", 
              paddingTop: "10px", 
              borderTop: "1px solid #34495e",
              fontSize: "11px",
              color: "#bdc3c7"
            }}>
              <div>Data Source: {dashboardData._debug.dataSource}</div>
              <div>Kritik Stok Format: {dashboardData._debug.kritikStokFormat}</div>
            </div>
          )}
          
          {dashboardData._error && (
            <div style={{ 
              marginTop: "10px", 
              padding: "8px", 
              background: "#c0392b",
              borderRadius: "6px",
              fontSize: "11px"
            }}>
              <strong>HATA:</strong> {dashboardData._error}
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div style={{
        textAlign: "center",
        marginTop: "30px",
        paddingTop: "20px",
        borderTop: "1px solid rgba(0,0,0,0.1)",
        color: "#7d6b4f",
        fontSize: "12px"
      }}>
        <div>MyCafe POS v2.0 • {new Date().getFullYear()} © Tüm hakları saklıdır.</div>
        <div style={{ marginTop: "5px", fontSize: "11px" }}>
          Geliştirici Modu: {process.env.NODE_ENV} • Son güncelleme: {lastUpdatedText}
        </div>
      </div>
    </div>
  );
}