import { useEffect, useState } from "react";

const REFRESH_MS = 30000; // 30 saniye

export function useDashboard() {
  const [data, setData] = useState({
    isOpen: false,
    toplamSatis: 0,
    toplamBilardo: 0,
    toplamGider: 0,
    nakit: 0,
    kart: 0,
    acikAdisyonSayisi: 0,
    acikAdisyonlar: [],
    kritikStoklar: [], // ❌ MODEL C: Dashboard stok hesaplamaz
  });

  // ❌ MODEL C: gun context'i KULLANILMAZ
  // ✅ MODEL C: Sadece localStorage -> mc_kasa_hareketleri
  
  const loadDashboard = () => {
    try {
      // ✅ MODEL C KURAL #1: Tek veri kaynağı
      const hareketlerStr = localStorage.getItem("mc_kasa_hareketleri") || "[]";
      const tumHareketler = JSON.parse(hareketlerStr);
      
      // ✅ MODEL C KURAL #2: Sadece bugün
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const bugununHareketleri = tumHareketler.filter(h => {
        if (!h || !h.tarih) return false;
        const hareketTarihi = new Date(h.tarih);
        return hareketTarihi.toISOString().split('T')[0] === todayString;
      });

      // ✅ MODEL C KURAL #3: Sadece tutar > 0 / < 0 mantığı
      // ❌ MODEL C: tip, tür, durum YOK
      
      let toplamGelir = 0;
      let toplamGider = 0;
      let nakit = 0;
      let kart = 0;
      
      bugununHareketleri.forEach(h => {
        const tutar = Number(h.tutar) || 0;
        
        // ✅ MODEL C: tutar > 0 = gelir, tutar < 0 = gider
        if (tutar > 0) {
          toplamGelir += tutar;
          
          // ✅ MODEL C: ödeme tipine göre ayır
          if (h.odeme_tipi === "NAKIT") {
            nakit += tutar;
          } else if (h.odeme_tipi === "KART") {
            kart += tutar;
          }
        } else if (tutar < 0) {
          toplamGider += Math.abs(tutar);
          // ❌ MODEL C: Giderler zaten eksi yazılır, çifte işlem YOK
          // nakit -= Math.abs(tutar); // YANLIŞ!
        }
      });

      // ✅ MODEL C: Toplam satış = toplam gelir
      const toplamSatis = toplamGelir;
      
      // ✅ MODEL C: Toplam bilardo = bilardo hareketleri
      // NOT: Bilardo hesaplaması kasa hareketlerinde olmamalı
      // Bu bilgi farklı kaynaktan gelmeli (Model C dışı)
      const toplamBilardo = 0;

      // ❌ MODEL C: Açık adisyonlar kasa hareketlerinden çıkmaz
      // Bu bilgi adisyon modülünden gelmeli
      const acikAdisyonlar = [];
      const acikAdisyonSayisi = 0;

      // ❌ MODEL C: Stoklar dashboard'a sızmaz
      // Bu bilgi stok modülünden gelmeli
      const kritikStoklar = [];

      // Gün açık mı? (localStorage'dan kontrol)
      const isOpen = localStorage.getItem("gun_durumu") === "ACIK";

      setData({
        isOpen,
        toplamSatis,
        toplamBilardo,
        toplamGider,
        nakit,
        kart,
        acikAdisyonSayisi,
        acikAdisyonlar,
        kritikStoklar,
      });

    } catch (error) {
      console.error("Dashboard yükleme hatası:", error);
    }
  };

  useEffect(() => {
    // İlk yükleme
    loadDashboard();

    // Periyodik güncelleme
    const intervalId = setInterval(loadDashboard, REFRESH_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return data;
}