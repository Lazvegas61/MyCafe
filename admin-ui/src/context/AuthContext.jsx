import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gunAktif, setGunAktif] = useState(() => {
    return localStorage.getItem('mycafe_gun_durumu') === 'aktif';
  });

  // Uygulama açıldığında kullanıcıyı localStorage'dan yükle
  useEffect(() => {
    const initializeAuth = () => {
      const savedUser = localStorage.getItem("mc_user");
      
      // Eğer kullanıcı yoksa, hemen loading'i durdur
      if (!savedUser) {
        setLoading(false);
        return;
      }
      
      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Demo admin kullanıcısı için tam kullanıcı bilgileri
        const enhancedUser = {
          ...parsedUser,
          // Eğer sadece username varsa, tam bilgileri ekle
          adSoyad: parsedUser.adSoyad || parsedUser.username || 'Demo Admin',
          rol: parsedUser.rol || parsedUser.role || (parsedUser.username === 'Admin' ? 'ADMIN' : 'USER'),
          id: parsedUser.id || 1,
          // Demo admin için statik bilgiler
          ...(parsedUser.username === 'Admin' && {
            adSoyad: 'Demo Admin',
            rol: 'ADMIN',
            id: 1,
            email: 'admin@mycafe.com',
            telefon: '555 123 4567',
            yetkiler: ['rapor_goruntule', 'gun_baslat', 'gun_kapat', 'kasa_goruntule', 'urun_ekle', 'urun_sil', 'personel_yonet']
          })
        };
        
        setUser(enhancedUser);
        
        // Gün durumunu kontrol et
        const gunDurumu = localStorage.getItem('mycafe_gun_durumu');
        setGunAktif(gunDurumu === 'aktif');
        
      } catch (err) {
        console.error("JSON parse hatası:", err);
        localStorage.removeItem("mc_user");
      }
      setLoading(false);
    };

    initializeAuth();
    
    // Gün durumu değişikliklerini dinle
    const handleGunDurumuDegisti = (event) => {
      if (event.detail && typeof event.detail.aktif !== 'undefined') {
        setGunAktif(event.detail.aktif);
      }
    };
    
    window.addEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    
    return () => {
      window.removeEventListener('gunDurumuDegisti', handleGunDurumuDegisti);
    };
  }, []);

  // Gün başlatma fonksiyonu
  const gunBaslat = () => {
    // ÖNEMLİ: Önce açık adisyon kontrolü
    const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
    
    // Eğer önceki günden kalan açık adisyon varsa, onları kapat
    if (acikAdisyonlar.length > 0) {
      // Önceki günün adisyonlarını kapat
      const updatedAdisyonlar = acikAdisyonlar.map(ad => ({
        ...ad,
        durum: "KAPALI",
        kapali: true,
        kapanisZamani: new Date().toISOString()
      }));
      
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(updatedAdisyonlar));
    }
    
    const baslangicZamani = new Date();
    const baslangicKasa = 0;
    
    // LocalStorage'a kaydet
    localStorage.setItem('mycafe_gun_durumu', 'aktif');
    localStorage.setItem('mycafe_gun_baslangic', baslangicZamani.toISOString());
    localStorage.setItem('mycafe_gun_baslangic_kasa', baslangicKasa.toString());
    
    // Yeni gün bilgileri
    const yeniGunBilgileri = {
      baslangicKasa: baslangicKasa,
      nakitGiris: 0,
      krediKarti: 0,
      toplamAdisyon: 0,
      acikAdisyon: 0,
      gunlukSatis: 0,
      baslangicTarih: baslangicZamani.toISOString(),
      sonGuncelleme: new Date().toISOString(),
      baslatanKullanici: user?.adSoyad || user?.username
    };
    
    localStorage.setItem('mycafe_gun_bilgileri', JSON.stringify(yeniGunBilgileri));
    
    // State'i güncelle
    setGunAktif(true);
    
    // Global event gönder
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: true });
      window.dispatchGlobalEvent('gunBaslatildi', { 
        zaman: baslangicZamani,
        kasa: baslangicKasa,
        baslatan: user?.adSoyad || user?.username
      });
    }
    
    console.log('✅ Gün başlatıldı:', baslangicZamani, 'by', user?.adSoyad);
    
    return { success: true, message: 'Gün başarıyla başlatıldı' };
  };

  // Gün sonlandırma fonksiyonu
  const gunSonlandir = () => {
    // ÖNCE AÇIK ADISYON KONTROLÜ
    const acikAdisyonlar = JSON.parse(localStorage.getItem('mc_acik_adisyonlar') || '[]');
    
    if (acikAdisyonlar.length > 0) {
      return { 
        success: false, 
        message: `${acikAdisyonlar.length} açık adisyon var. Önce bunları kapatın.` 
      };
    }
    
    // Gün sonu raporu oluştur
    const gunSonuRaporId = `GUN_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Date.now()}`;
    const baslangicZamani = new Date(localStorage.getItem('mycafe_gun_baslangic') || new Date());
    const bitisZamani = new Date();
    
    const gunVerileri = JSON.parse(localStorage.getItem('mycafe_gun_bilgileri') || '{}');
    
    const today = new Date().toISOString().split('T')[0];
    const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    
    const bugunkuNormalSatis = adisyonlar
      .filter(a => {
        const tarih = new Date(a.tarih || a.acilisZamani).toISOString().split('T')[0];
        return tarih === today;
      })
      .reduce((sum, a) => sum + (parseFloat(a.toplamTutar || 0) || 0), 0);
    
    const bugunkuBilardoSatis = bilardoAdisyonlar
      .filter(b => {
        const tarih = new Date(b.acilisZamani).toISOString().split('T')[0];
        return tarih === today;
      })
      .reduce((sum, b) => sum + (parseFloat(b.bilardoUcreti || 0) || 0), 0);
    
    // Kritik stok kontrolü
    const urunler = JSON.parse(localStorage.getItem("mc_urunler") || "[]");
    const criticalProducts = urunler.filter(u => 
      (parseInt(u.stock || 0) || 0) <= (parseInt(u.critical || 10) || 10)
    );
    
    const gunSonuRaporu = {
      id: gunSonuRaporId,
      baslangic: baslangicZamani.toISOString(),
      bitis: bitisZamani.toISOString(),
      sureDakika: Math.floor((bitisZamani - baslangicZamani) / 60000),
      sureSaat: Math.floor((bitisZamani - baslangicZamani) / 3600000),
      baslangicKasa: gunVerileri.baslangicKasa || 0,
      toplamCiro: bugunkuNormalSatis + bugunkuBilardoSatis,
      nakit: bugunkuNormalSatis * 0.6,
      krediKarti: bugunkuNormalSatis * 0.4,
      bilardoCiro: bugunkuBilardoSatis,
      toplamAdisyon: gunVerileri.toplamAdisyon || 0,
      acikAdisyon: acikAdisyonlar.length,
      kritikStok: criticalProducts.length,
      tarih: today,
      olusturulmaZamani: new Date().toISOString(),
      sonlandiranKullanici: user?.adSoyad || user?.username
    };
    
    localStorage.setItem(`mycafe_gun_sonu_${gunSonuRaporId}`, JSON.stringify(gunSonuRaporu));
    
    const eskiGunler = JSON.parse(localStorage.getItem('mycafe_gun_sonu_listesi') || '[]');
    eskiGunler.unshift(gunSonuRaporu);
    localStorage.setItem('mycafe_gun_sonu_listesi', JSON.stringify(eskiGunler.slice(0, 30)));
    
    localStorage.setItem('mycafe_gun_durumu', 'pasif');
    setGunAktif(false);
    
    // Global event gönder
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('gunDurumuDegisti', { aktif: false });
      window.dispatchGlobalEvent('gunSonlandirildi', { 
        raporId: gunSonuRaporId,
        toplamCiro: gunSonuRaporu.toplamCiro,
        sonlandiran: user?.adSoyad || user?.username
      });
    }
    
    console.log('✅ Gün sonlandırıldı, rapor oluşturuldu:', gunSonuRaporId);
    
    return { 
      success: true, 
      message: 'Gün sonlandırıldı ve rapor oluşturuldu',
      raporId: gunSonuRaporId
    };
  };

  const login = (username, password) => {
    // Demo admin login (geçici - sonrasında personel veritabanından kontrol edilecek)
    if (username === "Admin" && password === "1234") {
      const demoUser = { 
        username: "Admin", 
        adSoyad: "Demo Admin",
        rol: "ADMIN",
        id: 1,
        email: "admin@mycafe.com"
      };
      localStorage.setItem("mc_user", JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true, user: demoUser };
    }
    
    // Personel veritabanından kontrol
    try {
      const personeller = JSON.parse(localStorage.getItem("mc_personeller") || "[]");
      const personel = personeller.find(p => 
        p.username === username && p.sifre === password
      );
      
      if (personel) {
        const userData = {
          id: personel.id,
          username: personel.username,
          adSoyad: personel.adSoyad,
          rol: personel.rol,
          email: personel.email,
          telefon: personel.telefon
        };
        
        localStorage.setItem("mc_user", JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error("Login hatası:", error);
    }
    
    return { success: false, message: "Hatalı kullanıcı adı veya şifre" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mc_user");
    
    // Global event gönder
    if (window.dispatchGlobalEvent) {
      window.dispatchGlobalEvent('userLoggedOut', { username: user?.username });
    }
    
    return { success: true, message: 'Başarıyla çıkış yapıldı' };
  };

  // Yetki kontrol fonksiyonları
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // ADMIN her şeyi yapabilir
    if (user.rol === 'ADMIN') return true;
    
    // GARSON: hem gün başlatabilir hem bitirebilir
    if (user.rol === 'GARSON') {
      const garsonPermissions = ['gun_baslat', 'gun_kapat', 'masa_ac', 'urun_ekle', 'adisyon_olustur'];
      return garsonPermissions.includes(permission);
    }
    
    // Özel yetki kontrolü
    if (user.yetkiler && Array.isArray(user.yetkiler)) {
      return user.yetkiler.includes(permission);
    }
    
    return false;
  };

  // Kasa görüntüleme yetkisi özel kontrolü
  const canViewKasa = () => {
    return user?.rol === 'ADMIN' || hasPermission('kasa_goruntule');
  };

  // Gün başlatma yetkisi kontrolü - GUNCELLENDI
  const canStartDay = () => {
    // ADMIN veya GARSON gün başlatabilir
    return user?.rol === 'ADMIN' || user?.rol === 'GARSON';
  };

  // Gün sonlandırma yetkisi kontrolü - GUNCELLENDI
  const canEndDay = () => {
    // ADMIN veya GARSON gün sonlandırabilir
    return user?.rol === 'ADMIN' || user?.rol === 'GARSON';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      gunAktif,
      gunBaslat,
      gunSonlandir,
      hasPermission,
      canViewKasa,
      // Boolean değerler olarak döndür
      canStartDay: canStartDay(),
      canEndDay: canEndDay()
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}