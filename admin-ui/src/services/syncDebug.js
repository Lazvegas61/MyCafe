// 📁 admin-ui/src/services/syncDebug.js
// 🩺 SENKRONİZASYON DEBUG ve ONARIM ARACI
// 📌 Kullanım: Tarayıcı konsolundan > syncDebug.checkAllServices()

import localStorageService from './localStorageService';

const syncDebug = {
  // 🔍 TÜM SİSTEMİ KONTROL ET
  checkAllServices: () => {
    console.group('🔍 SENKRONİZASYON SİSTEM DURUMU');
    console.log('🕐 Kontrol zamanı:', new Date().toLocaleString('tr-TR'));
    
    // 1. SERVİS KONTROLÜ
    console.group('📦 1. SERVİSLER');
    const services = [
      { name: 'syncService', obj: window.syncService },
      { name: 'localStorageService', obj: window.localStorageService },
      { name: 'kasaService', obj: window.kasaService },
    ];
    
    services.forEach(service => {
      const status = service.obj ? '✅ HAZIR' : '❌ YOK';
      console.log(`${status} - ${service.name}`);
      
      // Ek bilgiler
      if (service.obj && service.name === 'syncService') {
        console.log(`   🎯 Event listener sayısı:`, 
          service.obj._listeners ? Object.keys(service.obj._listeners).length : 0);
      }
    });
    console.groupEnd();
    
    // 2. LOCALSTORAGE KEY KONTROLÜ
    console.group('🗃️ 2. VERİ DEPOLAMA');
    const criticalKeys = [
      { key: 'mc_kasa_hareketleri', name: 'Kasa Hareketleri' },
      { key: 'bilardo_adisyonlar', name: 'Bilardo Adisyonlar' },
      { key: 'mc_acik_adisyonlar', name: 'Açık Adisyonlar' },
      { key: 'mc_adisyonlar', name: 'Tüm Adisyonlar' },
      { key: 'mc_gunsonu_raporlar', name: 'Gün Sonu Raporları' },
      { key: 'mc_masalar', name: 'Masalar' }
    ];
    
    criticalKeys.forEach(item => {
      try {
        const data = localStorage.getItem(item.key);
        let info = 'BOŞ';
        
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            info = `${parsed.length} kayıt`;
            
            // Ek bilgiler
            if (parsed.length > 0 && item.key === 'mc_kasa_hareketleri') {
              const sonKayit = parsed[parsed.length - 1];
              info += ` (Son: ${new Date(sonKayit.odemeTarihi || sonKayit.tarih).toLocaleDateString('tr-TR')})`;
            }
          } else {
            info = 'Dizi değil';
          }
        }
        
        console.log(`📦 ${item.name} (${item.key}): ${info}`);
      } catch (error) {
        console.log(`❌ ${item.name}: Parse hatası`);
      }
    });
    console.groupEnd();
    
    // 3. EVENT SİSTEMİ KONTROLÜ
    console.group('🔔 3. EVENT SİSTEMİ');
    if (window.syncService && window.syncService._listeners) {
      const events = Object.keys(window.syncService._listeners);
      
      if (events.length === 0) {
        console.log('⚠️ Hiç event listener yok!');
      } else {
        events.forEach(event => {
          const count = window.syncService._listeners[event].length;
          console.log(`🎯 ${event}: ${count} listener`);
        });
      }
    } else {
      console.log('❌ syncService veya _listeners bulunamadı');
    }
    console.groupEnd();
    
    // 4. BİLARDO SİSTEM KONTROLÜ
    console.group('🎱 4. BİLARDO SİSTEMİ');
    try {
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');
      console.log(`📊 Bilardo adisyon sayısı: ${bilardoAdisyonlar.length}`);
      
      if (bilardoAdisyonlar.length > 0) {
        // Bilardo flag kontrolü
        const bilardoFlagli = bilardoAdisyonlar.filter(a => a.tur === 'BİLARDO' || a.isBilardo).length;
        console.log(`   ✅ Bilardo işaretli: ${bilardoFlagli}`);
        console.log(`   ⚠️ İşaretsiz: ${bilardoAdisyonlar.length - bilardoFlagli}`);
        
        // Aktif bilardo adisyonları
        const aktifBilardo = bilardoAdisyonlar.filter(a => a.durum === 'ACIK' || a.durum === 'DOLU').length;
        console.log(`   🔴 Aktif bilardo: ${aktifBilardo}`);
      }
      
      // Bilardo masaları
      const bilardoMasalar = JSON.parse(localStorage.getItem('bilardo') || '[]');
      console.log(`🎱 Bilardo masa sayısı: ${bilardoMasalar.length}`);
      
    } catch (error) {
      console.log('❌ Bilardo verisi okunamadı:', error.message);
    }
    console.groupEnd();
    
    // 5. KASA TUTARLILIK KONTROLÜ
    console.group('💰 5. KASA TUTARLILIK');
    try {
      const hareketler = JSON.parse(localStorage.getItem('mc_kasa_hareketleri') || '[]');
      console.log(`📊 Kasa hareketi sayısı: ${hareketler.length}`);
      
      if (hareketler.length > 0) {
        // Çift ID kontrolü
        const ids = hareketler.map(h => h.id);
        const uniqueIds = [...new Set(ids)];
        const ciftKayit = ids.length - uniqueIds.length;
        
        if (ciftKayit > 0) {
          console.log(`⚠️ ÇİFT KAYIT: ${ciftKayit} adet`);
        } else {
          console.log(`✅ Çift kayıt yok`);
        }
        
        // Tarih sıralaması
        const sonKayit = hareketler[hareketler.length - 1];
        console.log(`📅 Son kayıt: ${new Date(sonKayit.odemeTarihi || sonKayit.tarih).toLocaleString('tr-TR')}`);
      }
    } catch (error) {
      console.log('❌ Kasa verisi okunamadı');
    }
    console.groupEnd();
    
    console.groupEnd(); // Ana grup kapat
    console.log('✅ Sistem kontrolü tamamlandı');
    
    return {
      timestamp: new Date().toISOString(),
      services: services.map(s => ({ name: s.name, status: !!s.obj })),
      storage: criticalKeys.map(k => ({ 
        key: k.key, 
        count: JSON.parse(localStorage.getItem(k.key) || '[]').length 
      }))
    };
  },
  
  // 🔧 YAYGIN SORUNLARI OTOMATİK DÜZELT
  fixCommonIssues: () => {
    console.group('🛠️  SİSTEM ONARIMI');
    console.log('🕐 Başlangıç:', new Date().toLocaleString('tr-TR'));
    
    let fixes = [];
    
    try {
      // 1. ÇİFT KASA HAREKETLERİNİ TEMİZLE
      console.group('💰 1. Kasa Hareketleri Temizliği');
      const hareketler = JSON.parse(localStorage.getItem('mc_kasa_hareketleri') || '[]');
      const baslangicSayi = hareketler.length;
      
      const uniqueHareketler = [];
      const seenIds = new Set();
      
      hareketler.forEach(h => {
        if (!seenIds.has(h.id)) {
          seenIds.add(h.id);
          uniqueHareketler.push(h);
        }
      });
      
      if (hareketler.length !== uniqueHareketler.length) {
        localStorage.setItem('mc_kasa_hareketleri', JSON.stringify(uniqueHareketler));
        const temizlenen = hareketler.length - uniqueHareketler.length;
        console.log(`🧹 ${temizlenen} çift kayıt temizlendi`);
        fixes.push(`Kasa: ${temizlenen} çift kayıt temizlendi`);
      } else {
        console.log(`✅ Çift kasa kaydı yok`);
      }
      console.groupEnd();
      
      // 2. BİLARDO ADISYONLARINI STANDARTLAŞTIR
      console.group('🎱 2. Bilardo Adisyonları Düzeltme');
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');
      const baslangicBilardo = bilardoAdisyonlar.length;
      
      const fixedBilardo = bilardoAdisyonlar.map(ad => {
        // Eksik bilardo flag'lerini ekle
        const updated = { ...ad };
        
        if (!updated.tur) {
          updated.tur = 'BİLARDO';
        }
        
        if (updated.isBilardo === undefined) {
          updated.isBilardo = true;
        }
        
        if (!updated.masaTipi) {
          updated.masaTipi = 'BİLARDO';
        }
        
        // Masa numarası B ile başlamıyorsa ekle
        const masaNo = updated.masaNo || updated.bilardoMasaNo || '';
        if (masaNo && !masaNo.toUpperCase().startsWith('B')) {
          updated.masaNo = `B${masaNo.replace('B', '')}`;
        }
        
        return updated;
      });
      
      localStorage.setItem('bilardo_adisyonlar', JSON.stringify(fixedBilardo));
      console.log(`🎱 ${fixedBilardo.length} bilardo adisyonu düzeltildi`);
      fixes.push(`Bilardo: ${fixedBilardo.length} adisyon düzeltildi`);
      console.groupEnd();
      
      // 3. TARİH ALANLARINI STANDARTLAŞTIR
      console.group('📅 3. Tarih Alanları Düzeltme');
      const adisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]');
      let tarihDuzeltilen = 0;
      
      const fixedAdisyonlar = adisyonlar.map(ad => {
        const updated = { ...ad };
        
        // Kapanmış adisyonlarda ödeme tarihi yoksa ekle
        if (updated.kapali === true && !updated.odemeTarihi && updated.kapanisZamani) {
          updated.odemeTarihi = updated.kapanisZamani;
          tarihDuzeltilen++;
        }
        
        // Tarih alanı yoksa ekle
        if (!updated.tarih && updated.acilisZamani) {
          updated.tarih = updated.acilisZamani.split('T')[0];
        }
        
        return updated;
      });
      
      localStorage.setItem('mc_adisyonlar', JSON.stringify(fixedAdisyonlar));
      console.log(`📅 ${tarihDuzeltilen} adisyonun tarihi düzeltildi`);
      if (tarihDuzeltilen > 0) {
        fixes.push(`Tarih: ${tarihDuzeltilen} adisyon düzeltildi`);
      }
      console.groupEnd();
      
      // 4. AÇIK ADISYON SENKRONİZASYONU
      console.group('🔄 4. Açık Adisyon Senkronizasyonu');
      syncDebug.syncAcikAdisyonlar();
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ Onarım sırasında hata:', error);
      fixes.push(`HATA: ${error.message}`);
    }
    
    console.log('📊 Onarım Sonucu:', fixes);
    console.log('🕐 Bitiş:', new Date().toLocaleString('tr-TR'));
    console.groupEnd();
    
    return {
      success: true,
      fixes: fixes,
      timestamp: new Date().toISOString()
    };
  },
  
  // 🔄 AÇIK ADISYONLARI SENKRONİZE ET
  syncAcikAdisyonlar: () => {
    try {
      const normalAdisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]');
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');
      
      const acikNormal = normalAdisyonlar.filter(a => 
        !a.kapali && a.durum !== 'KAPALI' && a.durum !== 'KAPATILDI'
      );
      
      const acikBilardo = bilardoAdisyonlar.filter(a => 
        !a.kapali && a.durum !== 'KAPALI' && a.durum !== 'KAPATILDI'
      );
      
      const tumAcikAdisyonlar = [
        ...acikNormal.map(a => ({ ...a, tur: 'NORMAL' })),
        ...acikBilardo.map(a => ({ ...a, tur: 'BİLARDO' }))
      ];
      
      localStorage.setItem('mc_acik_adisyonlar', JSON.stringify(tumAcikAdisyonlar));
      console.log(`🔄 ${tumAcikAdisyonlar.length} açık adisyon senkronize edildi`);
      
      return tumAcikAdisyonlar.length;
    } catch (error) {
      console.error('❌ Açık adisyon senkronizasyon hatası:', error);
      return 0;
    }
  },
  
  // 📊 ÖZEL KONTROLLER
  checkBilardoConsistency: () => {
    console.group('🎱 BİLARDO TUTARLILIK KONTROLÜ');
    
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem('bilardo_adisyonlar') || '[]');
    const normalAdisyonlar = JSON.parse(localStorage.getItem('mc_adisyonlar') || '[]');
    
    // 1. Normal adisyonlarda bilardo olanlar
    const normaldeBilardo = normalAdisyonlar.filter(a => 
      a.tur === 'BİLARDO' || a.isBilardo || (a.masaNo && a.masaNo.toUpperCase().startsWith('B'))
    );
    
    console.log(`📊 Normal adisyonlarda bilardo: ${normaldeBilardo.length}`);
    
    // 2. Bilardo adisyonlarında eksik flag
    const eksikFlag = bilardoAdisyonlar.filter(a => 
      !a.tur || !a.isBilardo
    );
    
    console.log(`⚠️ Eksik flag: ${eksikFlag.length}`);
    
    // 3. Çakışan masa numaraları
    const tumMasalar = [
      ...normalAdisyonlar.map(a => a.masaNo),
      ...bilardoAdisyonlar.map(a => a.masaNo || a.bilardoMasaNo)
    ].filter(Boolean);
    
    const uniqueMasalar = [...new Set(tumMasalar)];
    console.log(`📌 Toplam masa: ${tumMasalar.length}, Unique: ${uniqueMasalar.length}`);
    
    console.groupEnd();
    
    return {
      normalBilardo: normaldeBilardo.length,
      eksikFlag: eksikFlag.length,
      masaCakisma: tumMasalar.length - uniqueMasalar.length
    };
  },
  
  // 🚨 ACİL SIFIRLAMA (DİKKAT!)
  emergencyReset: (confirm = false) => {
    if (!confirm) {
      console.log('🚨 ACİL SIFIRLAMA İÇİN: syncDebug.emergencyReset(true)');
      console.log('⚠️ Bu işlem DEBUG verilerini sıfırlar!');
      return;
    }
    
    console.group('🚨 ACİL DEBUG SIFIRLAMA');
    
    const resetKeys = [
      'mc_kasa_hareketleri',
      'mc_acik_adisyonlar',
      'debug_logs'
    ];
    
    resetKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify([]));
      console.log(`🧹 ${key} sıfırlandı`);
    });
    
    console.log('✅ Debug verileri sıfırlandı');
    console.groupEnd();
    
    return { reset: true, keys: resetKeys };
  },
  
  // 📝 KULLANIM KILAVUZU
  help: () => {
    console.group('📚 SYNC DEBUG KULLANIM KILAVUZU');
    console.log('🔍 Durum Kontrolü:');
    console.log('   syncDebug.checkAllServices()');
    console.log('');
    console.log('🔧 Otomatik Onarım:');
    console.log('   syncDebug.fixCommonIssues()');
    console.log('');
    console.log('🎱 Bilardo Kontrolü:');
    console.log('   syncDebug.checkBilardoConsistency()');
    console.log('');
    console.log('🔄 Açık Adisyon Senkronu:');
    console.log('   syncDebug.syncAcikAdisyonlar()');
    console.log('');
    console.log('🚨 Acil Sıfırlama (Dikkat!):');
    console.log('   syncDebug.emergencyReset(true)');
    console.log('');
    console.log('❓ Yardım:');
    console.log('   syncDebug.help()');
    console.groupEnd();
  }
};

// 📌 GLOBAL ERİŞİM
if (typeof window !== 'undefined') {
  window.syncDebug = syncDebug;
  console.log('✅ syncDebug global olarak yüklendi');
  
  // OTOMATİK KONTROL (geliştirme modunda)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('🔍 syncDebug: Otomatik sistem kontrolü başlatılıyor...');
      syncDebug.checkAllServices();
    }, 3000);
  }
}

export default syncDebug;