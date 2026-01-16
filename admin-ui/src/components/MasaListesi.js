// 📁 src/components/MasaListesi.js (veya masa listesinin olduğu dosya)

import React, { useState, useEffect } from 'react';
import { syncService } from '../services/syncService'; // syncService'ı import et

const MasaListesi = () => {
  const [masalar, setMasalar] = useState([]);
  
  // CRİTİK: Event listener'ları kur
  useEffect(() => {
    console.log('🔄 MasaListesi: SyncService event listenerları kuruluyor...');

    // SYNC SERVICE EVENT İSİMLERİ İLE AYNI OLSUN
  syncService.on('MASA_GUNCELLENDI', (data) => {  // ✅ Doğru isim
    console.log('🔄 MASA_GUNCELLENDI:', data);
    refreshMasalar();
  });
  
  syncService.on('ADISYON_GUNCELLENDİ', (data) => {  // ✅ Doğru isim (İ harfi Türkçe)
    console.log('🔄 ADISYON_GUNCELLENDİ:', data);
    refreshMasalar();
  });
    
    // 1. ANLIK GÜNCELLEMELERİ DİNLE
    syncService.on('ANLIK_GUNCELLEME', (data) => {
      console.log('⚡ ANLIK GÜNCELLEME ALINDI:', data);
      refreshMasalar(); // Masaları yenile
    });
    
    // 2. MASA GÜNCELLEMELERİNİ DİNLE
    syncService.on('MASA_GUNCELLENDI', (data) => {
      console.log('🔄 MASA GÜNCELLENDI:', data);
      refreshMasalar();
    });
    
    // 3. TOPLAM GÜNCELLEMELERİNİ DİNLE
    syncService.on('TOPLAM_GUNCELLENDI', (data) => {
      console.log('💰 TOPLAM GÜNCELLENDI:', data);
      
      // Sadece ilgili masayı güncelle
      setMasalar(prev => prev.map(masa => {
        if (Number(masa.no) === data.masaNo) {
          return {
            ...masa,
            toplamTutar: data.toplamTutar
          };
        }
        return masa;
      }));
    });
    
    // 4. İlk yükleme
    refreshMasalar();
    
    // 5. Cleanup
    return () => {
      syncService.off('ANLIK_GUNCELLEME');
      syncService.off('MASA_GUNCELLENDI');
      syncService.off('TOPLAM_GUNCELLENDI');
    };
  }, []);
  
  // Masaları yenile
  const refreshMasalar = () => {
    try {
      const stored = localStorage.getItem('mc_masalar');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📋 Masalar yenilendi:', parsed);
        setMasalar(parsed);
      }
    } catch (error) {
      console.error('Masalar yenilenemedi:', error);
    }
  };
  
  // Masaları render et
  return (
    <div>
      {masalar.map(masa => (
        <div key={masa.no}>
          MASA {masa.no} - {masa.toplamTutar} TL
        </div>
      ))}
    </div>
  );
};

// Masa kapatma işleminden önce
console.log('Masa kapatma parametreleri:', {
  originalMasaNo: masaNo,
  parsedMasaNo: Number(masaNo),
  type: typeof masaNo
});

// Masa numarasını temizle
const cleanMasaNo = masaNo.toString().replace(/[^0-9]/g, '');
console.log('Temizlenmiş masa no:', cleanMasaNo);

// syncService.masaBosalt(cleanMasaNo) şeklinde kullanın

export default MasaListesi;