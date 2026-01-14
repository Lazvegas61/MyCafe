// 📁 src/hooks/useSyncMasalar.js
import { useState, useEffect } from 'react';
import { syncService, SYNC_EVENTS } from '../services/syncService';

export const useSyncMasalar = () => {
  const [masalar, setMasalar] = useState([]);
  
  useEffect(() => {
    console.log('🎯 useSyncMasalar hook başlatılıyor...');
    
    // 1. Masaları yükle
    const loadMasalar = () => {
      try {
        const stored = localStorage.getItem('mc_masalar');
        if (stored) {
          const parsed = JSON.parse(stored);
          setMasalar(parsed);
        }
      } catch (error) {
        console.error('Masalar yüklenemedi:', error);
      }
    };
    
    // 2. Event listener'ları kur
    const handleAnlikGuncelleme = (data) => {
      console.log('⚡ useSyncMasalar: Anlık güncelleme', data);
      loadMasalar();
    };
    
    const handleToplamGuncelleme = (data) => {
      console.log('💰 useSyncMasalar: Toplam güncelleme', data);
      setMasalar(prev => prev.map(masa => 
        Number(masa.no) === data.masaNo 
          ? { ...masa, toplamTutar: data.toplamTutar }
          : masa
      ));
    };
    
    // 3. SyncService event'lerine abone ol
    syncService.on(SYNC_EVENTS.ANLIK_GUNCELLEME, handleAnlikGuncelleme);
    syncService.on(SYNC_EVENTS.TOPLAM_GUNCELLENDI, handleToplamGuncelleme);
    syncService.on(SYNC_EVENTS.MASA_GUNCELLENDI, loadMasalar);
    
    // 4. İlk yükleme
    loadMasalar();
    
    // 5. Storage event'ini dinle
    const handleStorageChange = (e) => {
      if (e.key === 'mc_masalar' || e.key === 'mc_adisyonlar') {
        console.log('💾 Storage değişti, masalar yenileniyor...');
        setTimeout(loadMasalar, 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 6. Cleanup
    return () => {
      syncService.off(SYNC_EVENTS.ANLIK_GUNCELLEME, handleAnlikGuncelleme);
      syncService.off(SYNC_EVENTS.TOPLAM_GUNCELLENDI, handleToplamGuncelleme);
      syncService.off(SYNC_EVENTS.MASA_GUNCELLENDI, loadMasalar);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return masalar;
};