// admin-ui/src/pages/Bilardo/Bilardo.jsx - TAM SAYFA GÜNCEL
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bilardo.css";
import BilardoMiniDashboard from "./BilardoMiniDashboard";

export default function Bilardo() {
  const navigate = useNavigate();
  
  const [masalar, setMasalar] = useState([]);
  const [ucretAyarlari, setUcretAyarlari] = useState(null);
  const [silMasaNo, setSilMasaNo] = useState("");
  const [sureBittiPopup, setSureBittiPopup] = useState(null);
  const [uzatModal, setUzatModal] = useState({ acik: false, masa: null, index: null });
  const [aktarimModal, setAktarimModal] = useState({ acik: false, bilardoMasa: null, seciliMasa: null, normalMasalar: [] });

  // Bilardo ikonu
  const BilardoIkon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="6" width="16" height="12" rx="4" fill="#4A3722"/>
      <rect x="6" y="8" width="12" height="8" rx="2" fill="#2E7D32"/>
      <circle cx="9" cy="11" r="2" fill="#FFD700"/>
      <circle cx="15" cy="11" r="2" fill="#FFD700"/>
      <circle cx="12" cy="14" r="2" fill="#FFD700"/>
    </svg>
  );

  // LocalStorage'dan verileri yükle ve hesapla
  useEffect(() => {
    const loadAndCalculate = () => {
      let bilardoData = JSON.parse(localStorage.getItem("bilardo") || "[]");
      
      if (bilardoData.length === 0) {
        const yeniMasalar = [];
        for (let i = 1; i <= 3; i++) {
          yeniMasalar.push({
            id: 100 + i,
            no: `B${i.toString().padStart(2, '0')}`,
            acik: false,
            durum: "KAPALI",
            sureTipi: null,
            acilisSaati: null,
            ucret: 0,
            aktifAdisyonId: null,
            uzatmaSayisi: 0,
            uzatmaBaslangicZamani: null
          });
        }
        bilardoData = yeniMasalar;
        localStorage.setItem("bilardo", JSON.stringify(yeniMasalar));
      }
      
      const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const ayarlar = JSON.parse(localStorage.getItem("bilardo_ucretleri")) || {
        bilardo30dk: 80,
        bilardo1saat: 120,
        bilardoDakikaUcreti: 2
      };
      setUcretAyarlari(ayarlar);
      
      const updatedMasalar = bilardoData.map(masa => {
        const masaAdisyonu = adisyonlar.find(a => a.id === masa.aktifAdisyonId);
        
        if (masaAdisyonu && masaAdisyonu.durum === "ACIK") {
          const now = Date.now();
          const acilisZamani = masaAdisyonu.acilisZamani || masa.acilisSaati;
          const gecenDakika = acilisZamani ? Math.floor((now - acilisZamani) / 60000) : 0;
          
          let anlikUcret = 0;
          const bilardo30dk = ayarlar.bilardo30dk || 80;
          const bilardo1saat = ayarlar.bilardo1saat || 120;
          const bilardoDakikaUcreti = ayarlar.bilardoDakikaUcreti || 2;
          
          if (masaAdisyonu.uzatmaDurumu === true && masa.uzatmaBaslangicZamani) {
            const uzatmaBaslangic = masa.uzatmaBaslangicZamani;
            const uzatmaGecenDakika = Math.floor((now - uzatmaBaslangic) / 60000);
            anlikUcret = masaAdisyonu.baslangicUcreti + (uzatmaGecenDakika * bilardoDakikaUcreti);
          } else {
            switch(masaAdisyonu.sureTipi) {
              case "30dk":
                anlikUcret = bilardo30dk;
                break;
              case "1saat":
                anlikUcret = bilardo1saat;
                break;
              case "suresiz":
                if (gecenDakika <= 30) {
                  anlikUcret = bilardo30dk;
                } else {
                  const ekDakika = gecenDakika - 30;
                  anlikUcret = bilardo30dk + (Math.ceil(ekDakika) * bilardoDakikaUcreti);
                }
                break;
              default:
                anlikUcret = 0;
            }
          }
          
          const ekUrunler = masaAdisyonu.ekUrunler || [];
          const ekUrunToplam = ekUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);
          const toplamTutar = anlikUcret + ekUrunToplam;
          
          const adisyonIndex = adisyonlar.findIndex(a => a.id === masa.aktifAdisyonId);
          if (adisyonIndex !== -1) {
            adisyonlar[adisyonIndex].bilardoUcret = anlikUcret;
            adisyonlar[adisyonIndex].toplamTutar = toplamTutar;
            adisyonlar[adisyonIndex].gecenDakika = gecenDakika;
            localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
          }
          
          updateAcikAdisyonlar(masaAdisyonu, anlikUcret, ekUrunToplam, gecenDakika, masa.no);
          
          return {
            ...masa,
            acik: true,
            durum: "ACIK",
            sureTipi: masaAdisyonu.sureTipi,
            acilisSaati: acilisZamani,
            aktifAdisyonId: masaAdisyonu.id,
            ucret: anlikUcret,
            ekUrunToplam,
            toplamTutar,
            gecenDakika,
            ekUrunSayisi: ekUrunler.length,
            uzatmaSayisi: masa.uzatmaSayisi || 0,
            uzatmaBaslangicZamani: masa.uzatmaBaslangicZamani || null
          };
        }
        
        return {
          ...masa,
          ekUrunToplam: 0,
          toplamTutar: 0,
          gecenDakika: 0,
          ekUrunSayisi: 0,
          uzatmaSayisi: 0,
          uzatmaBaslangicZamani: null
        };
      });
      
      setMasalar(updatedMasalar);
      kontrolSureBitti(updatedMasalar);
    };
    
    loadAndCalculate();
    const interval = setInterval(loadAndCalculate, 5000);
    return () => clearInterval(interval);
  }, []);

  // Açık adisyonları güncelle
  const updateAcikAdisyonlar = (adisyon, bilardoUcret, ekUrunToplam, gecenDakika, masaNo) => {
    try {
      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      
      const bilardoAdisyonu = {
        id: adisyon.id,
        masaNo: masaNo || adisyon.bilardoMasaNo,
        tur: "BİLARDO",
        sureTipi: adisyon.sureTipi,
        gecenDakika: gecenDakika,
        bilardoUcret: bilardoUcret,
        ekUrunToplam: ekUrunToplam,
        toplamTutar: bilardoUcret + ekUrunToplam,
        acilisZamani: adisyon.acilisZamani,
        durum: "ACIK",
        updatedAt: Date.now(),
        no: masaNo || adisyon.bilardoMasaNo,
        musteriAdi: adisyon.musteriAdi || "Bilardo Müşterisi",
        urunSayisi: (adisyon.ekUrunler || []).length,
        isBilardo: true,
        uzatmaDurumu: adisyon.uzatmaDurumu || false
      };
      
      const existingIndex = acikAdisyonlar.findIndex(a => a.id === adisyon.id);
      
      if (existingIndex !== -1) {
        acikAdisyonlar[existingIndex] = bilardoAdisyonu;
      } else {
        acikAdisyonlar.push(bilardoAdisyonu);
      }
      
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(acikAdisyonlar));
      
    } catch (error) {
      console.error("Açık adisyon güncelleme hatası:", error);
    }
  };

  // Format fonksiyonları
  const formatSure = (dakika) => {
    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;
    return `${saat.toString().padStart(2, '0')}:${dk.toString().padStart(2, '0')}`;
  };

  // Masa işlemleri
  const masaEkle = () => {
    const yeniMasa = {
      id: Date.now(),
      no: `B${(masalar.length + 1).toString().padStart(2, '0')}`,
      acik: false,
      durum: "KAPALI",
      sureTipi: null,
      acilisSaati: null,
      ucret: 0,
      aktifAdisyonId: null,
      uzatmaSayisi: 0,
      uzatmaBaslangicZamani: null
    };
    
    const yeniMasalar = [...masalar, yeniMasa];
    setMasalar(yeniMasalar);
    localStorage.setItem("bilardo", JSON.stringify(yeniMasalar));
  };

  const masaNoIleSil = () => {
    const masaNo = parseInt(silMasaNo.trim());
    if (isNaN(masaNo) || masaNo < 1) return;
    
    const masaIndex = masaNo - 1;
    if (masaIndex >= 0 && masaIndex < masalar.length) {
      const masa = masalar[masaIndex];
      if (masa.durum !== "ACIK") {
        const filtered = masalar.filter((m, index) => index !== masaIndex);
        const numberedMasalar = filtered.map((m, index) => ({
          ...m,
          no: `B${(index + 1).toString().padStart(2, '0')}`
        }));
        
        setMasalar(numberedMasalar);
        localStorage.setItem("bilardo", JSON.stringify(numberedMasalar));
        setSilMasaNo("");
      }
    }
  };

  const masaAc = (masa, tip, index) => {
    let baslangicUcreti;
    switch(tip) {
      case "30dk":
        baslangicUcreti = ucretAyarlari?.bilardo30dk || 80;
        break;
      case "1saat":
        baslangicUcreti = ucretAyarlari?.bilardo1saat || 120;
        break;
      case "suresiz":
        baslangicUcreti = ucretAyarlari?.bilardo30dk || 80;
        break;
      default:
        baslangicUcreti = 0;
    }
    
    const yeniAdisyon = {
      id: `bilardo_${Date.now()}`,
      bilardoMasaId: masa.id,
      bilardoMasaNo: masa.no,
      sureTipi: tip,
      acilisZamani: Date.now(),
      durum: "ACIK",
      gecenDakika: 0,
      bilardoUcret: baslangicUcreti,
      baslangicUcreti: baslangicUcreti,
      ekUrunler: [],
      odemeler: [],
      toplamOdenen: 0,
      toplamTutar: baslangicUcreti,
      uzatmaSayisi: 0,
      uzatmaDurumu: false,
      uzatmaBaslangicZamani: null
    };
    
    const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
    adisyonlar.push(yeniAdisyon);
    localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
    
    const updated = masalar.map((m, i) =>
      i === index ? {
        ...m,
        acik: true,
        durum: "ACIK",
        sureTipi: tip,
        acilisSaati: Date.now(),
        aktifAdisyonId: yeniAdisyon.id,
        ucret: baslangicUcreti,
        toplamTutar: baslangicUcreti,
        uzatmaSayisi: 0,
        uzatmaBaslangicZamani: null
      } : m
    );
    
    setMasalar(updated);
    localStorage.setItem("bilardo", JSON.stringify(updated));
    
    updateAcikAdisyonlar(yeniAdisyon, baslangicUcreti, 0, 0, masa.no);
    
    navigate(`/bilardo-adisyon/${yeniAdisyon.id}`);
  };

  const handleCardClick = (masa) => {
    if (masa.acik && masa.aktifAdisyonId) {
      navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
    }
  };

  const masaAktarModalAc = (masa, index, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    const tumMasalar = masalarData.filter(m => m.durum?.toUpperCase() !== "KAPALI")
      .sort((a, b) => parseInt(a.no) - parseInt(b.no));
    
    setAktarimModal({
      acik: true,
      bilardoMasa: { ...masa, index },
      seciliMasa: null,
      normalMasalar: tumMasalar
    });
  };

  const masaAktar = () => {
    const { bilardoMasa, seciliMasa } = aktarimModal;
    if (!bilardoMasa || !seciliMasa) return;
    
    try {
      const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const bilardoAdisyon = bilardoAdisyonlar.find(a => a.id === bilardoMasa.aktifAdisyonId);
      if (!bilardoAdisyon) return;

      const bilardoUcret = Number(bilardoMasa.ucret || 0);
      const gecenDakika = bilardoAdisyon.gecenDakika || 0;
      const ekUrunler = bilardoAdisyon.ekUrunler || [];
      const ekUrunToplam = ekUrunler.reduce((sum, u) => sum + (u.fiyat * u.adet), 0);

      const mcAdisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
      let hedefAdisyon = mcAdisyonlar.find(a => a.masaNo === `MASA ${seciliMasa.no}` && a.durum === "ACIK");

      if (!hedefAdisyon) {
        hedefAdisyon = {
          id: `masa_${seciliMasa.no}_${Date.now()}`,
          masaId: seciliMasa.id,
          masaNo: `MASA ${seciliMasa.no}`,
          masaNum: seciliMasa.no,
          durum: "ACIK",
          acilisZamani: new Date().toISOString(),
          kalemler: [],
          odemeler: [],
          toplamTutar: 0,
          odenenTutar: 0,
          kalanTutar: 0,
          isBilardo: false,
          not: ""
        };
        mcAdisyonlar.push(hedefAdisyon);
      }

      const timestamp = Date.now();
      const bilardoKalemiVarMi = hedefAdisyon.kalemler?.some(k => k.urunId === "BILARDO_UCRET") || false;

      if (!bilardoKalemiVarMi && bilardoUcret > 0) {
        if (!hedefAdisyon.kalemler) hedefAdisyon.kalemler = [];
        hedefAdisyon.kalemler.push({
          id: `bilardo_ucret_${timestamp}`,
          adisyonId: hedefAdisyon.id,
          urunId: "BILARDO_UCRET",
          urunAdi: `🎱 Bilardo Ücreti - Masa ${bilardoMasa.no}`,
          birimFiyat: bilardoUcret,
          adet: 1,
          toplam: bilardoUcret,
          tur: "URUN",
          isBilardo: true,
          aciklama: `${bilardoAdisyon.sureTipi} - ${gecenDakika} dakika`,
          tarih: new Date().toISOString(),
          kategori: "BİLARDO",
          bilardoTransfer: true,
          bilardoMasaNo: bilardoMasa.no,
          bilardoSureTipi: bilardoAdisyon.sureTipi
        });
      }

      ekUrunler.forEach((urun, i) => {
        if (!hedefAdisyon.kalemler) hedefAdisyon.kalemler = [];
        hedefAdisyon.kalemler.push({
          id: `bilardo_urun_${timestamp}_${i}`,
          adisyonId: hedefAdisyon.id,
          urunId: urun.mcUrunId || `bilardo_urun_${i}`,
          urunAdi: `📦 ${urun.ad}`,
          birimFiyat: urun.fiyat,
          adet: urun.adet,
          toplam: urun.fiyat * urun.adet,
          tur: "URUN",
          isBilardo: true,
          aciklama: "Bilardo'dan transfer",
          tarih: new Date().toISOString(),
          kategori: "EK ÜRÜNLER",
          bilardoTransfer: true,
          originalUrun: urun
        });
      });

      hedefAdisyon.toplamTutar = (hedefAdisyon.kalemler || []).reduce((s, k) => s + Number(k.toplam || 0), 0);
      hedefAdisyon.odenenTutar = (hedefAdisyon.odemeler || []).reduce((s, o) => s + Number(o.tutar || 0), 0);
      hedefAdisyon.kalanTutar = hedefAdisyon.toplamTutar - hedefAdisyon.odenenTutar;

      const bilardoNot = `🎱 Bilardo Masa ${bilardoMasa.no} Transfer Edildi\n` +
                         `• Süre Tipi: ${bilardoAdisyon.sureTipi === "30dk" ? "30 Dakika" : 
                                       bilardoAdisyon.sureTipi === "1saat" ? "1 Saat" : "Süresiz"}\n` +
                         `• Geçen Süre: ${gecenDakika} dakika\n` +
                         `• Bilardo Ücreti: ${bilardoUcret.toFixed(2)}₺\n` +
                         `• Ek Ürünler: ${ekUrunler.length} adet (${ekUrunToplam.toFixed(2)}₺)\n` +
                         `• Transfer Tarihi: ${new Date().toLocaleString('tr-TR')}`;

      hedefAdisyon.not = hedefAdisyon.not ? `${hedefAdisyon.not}\n\n--- BİLARDO TRANSFER ---\n${bilardoNot}` : bilardoNot;
      hedefAdisyon.bilardoTransfer = true;
      hedefAdisyon.bilardoMasaNo = bilardoMasa.no;
      hedefAdisyon.bilardoAdisyonId = bilardoAdisyon.id;
      hedefAdisyon.bilardoUcreti = bilardoUcret;
      hedefAdisyon.bilardoEkUrunToplam = ekUrunToplam;
      hedefAdisyon.bilardoGecenDakika = gecenDakika;

      const adisyonIndex = mcAdisyonlar.findIndex(a => a.id === hedefAdisyon.id);
      if (adisyonIndex !== -1) mcAdisyonlar[adisyonIndex] = hedefAdisyon;
      localStorage.setItem("mc_adisyonlar", JSON.stringify(mcAdisyonlar));

      const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
      const updatedMasalar = masalarData.map(m => {
        if (m.id === seciliMasa.id) {
          return {
            ...m,
            durum: "DOLU",
            adisyonId: hedefAdisyon.id,
            toplamTutar: hedefAdisyon.toplamTutar,
            acilisZamani: m.acilisZamani || new Date().toISOString(),
            guncellemeZamani: new Date().toISOString(),
            bilardoTransfer: true,
            bilardoMasaNo: bilardoMasa.no,
            musteriAdi: m.musteriAdi ? `${m.musteriAdi} + 🎱 Bilardo ${bilardoMasa.no}` : `🎱 Bilardo ${bilardoMasa.no} Transfer`
          };
        }
        return m;
      });
      
      localStorage.setItem("mc_masalar", JSON.stringify(updatedMasalar));

      const bilardoAdisyonIndex = bilardoAdisyonlar.findIndex(a => a.id === bilardoAdisyon.id);
      if (bilardoAdisyonIndex !== -1) {
        bilardoAdisyonlar[bilardoAdisyonIndex].durum = "KAPANDI";
        bilardoAdisyonlar[bilardoAdisyonIndex].transferEdildi = true;
        bilardoAdisyonlar[bilardoAdisyonIndex].transferMasaNo = seciliMasa.no;
        bilardoAdisyonlar[bilardoAdisyonIndex].transferAdisyonId = hedefAdisyon.id;
        bilardoAdisyonlar[bilardoAdisyonIndex].kapanisZamani = new Date().toISOString();
        localStorage.setItem("bilardo_adisyonlar", JSON.stringify(bilardoAdisyonlar));
      }

      const updatedBilardoMasalar = masalar.map((m, i) => 
        i === bilardoMasa.index ? { 
          ...m, 
          acik: false, 
          durum: "KAPALI", 
          sureTipi: null, 
          acilisSaati: null,
          ucret: 0,
          aktifAdisyonId: null,
          ekUrunToplam: 0,
          toplamTutar: 0,
          uzatmaSayisi: 0,
          uzatmaBaslangicZamani: null
        } : m
      );
      
      setMasalar(updatedBilardoMasalar);
      localStorage.setItem("bilardo", JSON.stringify(updatedBilardoMasalar));

      const acikAdisyonlar = JSON.parse(localStorage.getItem("mc_acik_adisyonlar") || "[]");
      const filteredAcikAdisyonlar = acikAdisyonlar.filter(a => a.id !== bilardoMasa.aktifAdisyonId);
      
      const yeniAcikAdisyon = {
        id: hedefAdisyon.id,
        masaNo: `MASA ${seciliMasa.no}`,
        tur: "NORMAL",
        sureTipi: "AKTİF",
        gecenDakika: 0,
        bilardoUcret: bilardoUcret,
        ekUrunToplam: ekUrunToplam,
        toplamTutar: hedefAdisyon.toplamTutar,
        acilisZamani: hedefAdisyon.acilisZamani,
        durum: "ACIK",
        updatedAt: Date.now(),
        no: seciliMasa.no,
        musteriAdi: hedefAdisyon.musteriAdi || `Masa ${seciliMasa.no}`,
        urunSayisi: (hedefAdisyon.kalemler || []).length,
        isBilardo: false,
        bilardoTransfer: true,
        transferKaynak: `Bilardo Masa ${bilardoMasa.no}`,
        bilardoMasaNo: bilardoMasa.no
      };
      
      const existingAcikIndex = filteredAcikAdisyonlar.findIndex(a => a.id === hedefAdisyon.id);
      if (existingAcikIndex !== -1) filteredAcikAdisyonlar[existingAcikIndex] = yeniAcikAdisyon;
      else filteredAcikAdisyonlar.push(yeniAcikAdisyon);
      localStorage.setItem("mc_acik_adisyonlar", JSON.stringify(filteredAcikAdisyonlar));

      setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null, normalMasalar: [] });
      window.dispatchEvent(new CustomEvent('masaGuncellendi', {
        detail: { 
          masaNo: seciliMasa.no, 
          action: 'bilardo_transfer',
          bilardoMasaNo: bilardoMasa.no,
          tutar: bilardoUcret + ekUrunToplam
        }
      }));

      navigate("/masalar");
      
    } catch (err) {
      console.error("Bilardo → Masa aktarım hatası:", err);
      navigate("/masalar");
    }
  };

  const uzatModalAc = (masa, index) => {
    setUzatModal({ acik: true, masa: masa, index: index });
  };

  const sureUzat = (uzatmaTipi) => {
    const { masa, index } = uzatModal;
    if (!masa) return;
    
    try {
      const adisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
      const adisyonIndex = adisyonlar.findIndex(a => a.id === masa.aktifAdisyonId);
      if (adisyonIndex === -1) {
        setUzatModal({ acik: false, masa: null, index: null });
        return;
      }
      
      const adisyon = adisyonlar[adisyonIndex];
      const uzatmaNotu = `⏱️ SÜRE UZATMA BAŞLATILDI\n` +
                        `• Uzatma Tipi: ${uzatmaTipi === "30dk" ? "30 Dakika" : "1 Saat"}\n` +
                        `• Uzatma Tarihi: ${new Date().toLocaleString('tr-TR')}\n` +
                        `• Uzatma Sayısı: ${(masa.uzatmaSayisi || 0) + 1}\n` +
                        `• NOT: Dakika başı ücret uygulanacak (${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk)`;
      
      adisyon.not = adisyon.not ? `${adisyon.not}\n\n${uzatmaNotu}` : uzatmaNotu;
      const yeniUzatmaSayisi = (masa.uzatmaSayisi || 0) + 1;
      const simdi = Date.now();
      
      adisyon.uzatmaDurumu = true;
      adisyon.uzatmaSayisi = yeniUzatmaSayisi;
      adisyon.uzatmaBaslangicZamani = simdi;
      adisyonlar[adisyonIndex] = adisyon;
      localStorage.setItem("bilardo_adisyonlar", JSON.stringify(adisyonlar));
      
      const updatedMasalar = masalar.map((m, i) =>
        i === index ? {
          ...m,
          uzatmaSayisi: yeniUzatmaSayisi,
          uzatmaBaslangicZamani: simdi,
        } : m
      );
      
      setMasalar(updatedMasalar);
      localStorage.setItem("bilardo", JSON.stringify(updatedMasalar));
      setUzatModal({ acik: false, masa: null, index: null });
      
    } catch (error) {
      console.error("Süre uzatma hatası:", error);
      setUzatModal({ acik: false, masa: null, index: null });
    }
  };

  const kontrolSureBitti = (currentMasalar = masalar) => {
    const now = Date.now();
    let yeniPopup = null;
    
    currentMasalar.forEach(masa => {
      if (masa.acik && masa.acilisSaati) {
        const gecenDakika = Math.floor((now - masa.acilisSaati) / 60000);
        
        if ((masa.sureTipi === "30dk" && gecenDakika >= 30 && !masa.uzatmaBaslangicZamani) ||
            (masa.sureTipi === "1saat" && gecenDakika >= 60 && !masa.uzatmaBaslangicZamani)) {
          yeniPopup = {
            masaId: masa.id,
            masaNo: masa.no,
            mesaj: masa.sureTipi === "30dk" ? "30 dakika süresi doldu!" : "1 saat süresi doldu!",
            timestamp: now,
            uzatmaGerekli: true
          };
        }
      }
    });
    
    if (yeniPopup && (!sureBittiPopup || sureBittiPopup.masaId !== yeniPopup.masaId)) {
      setSureBittiPopup(yeniPopup);
      setTimeout(() => {
        setSureBittiPopup(prev => prev?.masaId === yeniPopup.masaId ? null : prev);
      }, 30000);
    }
  };

  return (
    <div className="bilardo-container">
      {/* HEADER */}
      <div className="bilardo-header">
        <div className="bilardo-title-section">
          <div className="bilardo-main-icon">
            <BilardoIkon size={28} />
          </div>
          <h1 className="bilardo-title">Bilardo Masaları</h1>
        </div>
        
        <div className="bilardo-actions">
          <div className="bilardo-silme-alani">
            <label>Masa Sil:</label>
            <input
              type="number"
              placeholder="No"
              value={silMasaNo}
              onChange={(e) => setSilMasaNo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && masaNoIleSil()}
              className="bilardo-silme-input"
              min="1"
            />
            <button onClick={masaNoIleSil} className="bilardo-silme-btn">
              Sil
            </button>
          </div>
          
          <button 
            className="bilardo-ayarlar-btn"
            onClick={() => navigate("/ayarlar?tab=bilardo_ucret")}
          >
            ⚙️ Ayarlar
          </button>
          
          <button className="masa-btn-ekle" onClick={masaEkle}>
            + Masa Ekle
          </button>
        </div>
      </div>
      
      {/* MINI DASHBOARD */}
      <BilardoMiniDashboard />
      
      {/* ÜCRET BANNER */}
      {ucretAyarlari && (
        <div className="bilardo-ucret-banner">
          <div className="bilardo-ucret-item">
            <span>30 Dakika</span>
            <strong>{ucretAyarlari.bilardo30dk || 80}₺</strong>
            <small>İlk 30dk ücreti</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>1 Saat</span>
            <strong>{ucretAyarlari.bilardo1saat || 120}₺</strong>
            <small>İlk saat ücreti</small>
          </div>
          <div className="bilardo-ucret-item">
            <span>Dakika Ücreti</span>
            <strong>{ucretAyarlari.bilardoDakikaUcreti || 2}₺/dk</strong>
            <small>Uzatma sonrası dakika başı</small>
          </div>
        </div>
      )}
      
      {/* MASA KARTLARI */}
      <div className="bilardo-grid">
        {masalar.map((masa, index) => {
          const uzatmaDurumunda = masa.uzatmaBaslangicZamani !== null;
          
          return (
            <div 
              key={masa.id} 
              className={`bilardo-card ${masa.durum === "ACIK" ? "acik" : "kapali"}`}
              onClick={() => handleCardClick(masa)}
            >
              {/* KART BAŞLIĞI */}
              <div className="card-header-row">
                <div className="masa-info">
                  <div className="masa-icon">
                    <BilardoIkon size={20} />
                  </div>
                  <div>
                    <h3 className="masa-number">{masa.no}</h3>
                    <div className={`masa-status ${masa.durum}`}>
                      {masa.durum === "ACIK" ? "AÇIK" : "KAPALI"}
                    </div>
                  </div>
                </div>
                
                {masa.acik && (
                  <button 
                    className="detay-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
                    }}
                  >
                    Detay
                  </button>
                )}
              </div>
              
              {/* SÜRE GÖSTERİMİ */}
              {masa.acik && (
                <div className="sure-display">
                  <div className="sure-value">
                    {formatSure(masa.gecenDakika || 0)}
                  </div>
                  <div className="dakika-ucret">
                    {ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk
                  </div>
                </div>
              )}
              
              {/* EK BİLGİLER */}
              {masa.acik && (
                <div className="masa-details">
                  <div className="detail-row">
                    <span className="detail-label">Seçilen:</span>
                    <span className="detail-value">
                      {masa.sureTipi === "30dk" ? "30 Dakika" : 
                       masa.sureTipi === "1saat" ? "1 Saat" : 
                       "Süresiz"}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Anlık Ücret:</span>
                    <span className="detail-value">{masa.ucret?.toFixed(2)}₺</span>
                  </div>
                  
                  {masa.ekUrunSayisi > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Ek Ürünler:</span>
                      <span className="detail-value">
                        {masa.ekUrunSayisi} adet (+{masa.ekUrunToplam?.toFixed(2)}₺)
                      </span>
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <span className="detail-label">Toplam:</span>
                    <span className="detail-value" style={{ color: '#4CAF50', fontWeight: '800' }}>
                      {masa.toplamTutar?.toFixed(2)}₺
                    </span>
                  </div>
                  
                  {masa.uzatmaSayisi > 0 && (
                    <div className={`uzatma-label ${uzatmaDurumunda ? 'aktif' : 'tamamlandi'}`}>
                      {uzatmaDurumunda 
                        ? `🔄 UZATMA AKTİF (${masa.uzatmaSayisi}. kez)` 
                        : `🔄 ${masa.uzatmaSayisi} kez uzatıldı`}
                    </div>
                  )}
                </div>
              )}
              
              {/* ÜCRET AÇIKLAMASI */}
              {masa.acik && (
                <div style={{
                  fontSize: '12px',
                  color: '#8B7355',
                  textAlign: 'center',
                  marginTop: '10px',
                  padding: '8px',
                  background: '#f9f5f0',
                  borderRadius: '6px',
                  border: '1px solid #e8d8c3'
                }}>
                  {masa.sureTipi === "30dk" ? `30 dakika ücreti: ${ucretAyarlari?.bilardo30dk || 80}₺` :
                   masa.sureTipi === "1saat" ? `1 saat ücreti: ${ucretAyarlari?.bilardo1saat || 120}₺` :
                   masa.sureTipi === "suresiz" ? `İlk 30dk: ${ucretAyarlari?.bilardo30dk || 80}₺, sonrası ${ucretAyarlari?.bilardoDakikaUcreti || 2}₺/dk` : ''}
                </div>
              )}
              
              {/* BUTONLAR */}
              {!masa.acik ? (
                <div className="button-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <button 
                    className="btn-30dk"
                    onClick={(e) => {
                      e.stopPropagation();
                      masaAc(masa, "30dk", index);
                    }}
                  >
                    30dk<br/>{ucretAyarlari?.bilardo30dk || 80}₺
                  </button>
                  
                  <button 
                    className="btn-1saat"
                    onClick={(e) => {
                      e.stopPropagation();
                      masaAc(masa, "1saat", index);
                    }}
                  >
                    1 Saat<br/>{ucretAyarlari?.bilardo1saat || 120}₺
                  </button>
                  
                  <button 
                    className="btn-suresiz"
                    onClick={(e) => {
                      e.stopPropagation();
                      masaAc(masa, "suresiz", index);
                    }}
                  >
                    Süresiz<br/>İlk 30dk: {ucretAyarlari?.bilardo30dk || 80}₺
                  </button>
                </div>
              ) : (
                <div className={uzatmaDurumunda || masa.sureTipi === "suresiz" ? "button-group-full" : "button-group"}>
                  {(masa.sureTipi === "30dk" || masa.sureTipi === "1saat") && !uzatmaDurumunda && (
                    <button 
                      className="btn-uzat"
                      onClick={(e) => {
                        e.stopPropagation();
                        uzatModalAc(masa, index);
                      }}
                    >
                      Uzat
                    </button>
                  )}
                  
                  {uzatmaDurumunda && (
                    <button className="btn-uzat-aktif">
                      UZATMA AKTİF
                    </button>
                  )}
                  
                  <button 
                    className="btn-odeme"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/bilardo-adisyon/${masa.aktifAdisyonId}`);
                    }}
                    style={{
                      gridColumn: (uzatmaDurumunda || masa.sureTipi === "suresiz") ? '1' : '2'
                    }}
                  >
                    Ödeme
                  </button>
                  
                  <button 
                    className="btn-aktar"
                    onClick={(e) => masaAktarModalAc(masa, index, e)}
                  >
                    ↪️ Masaya Aktar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* AKTARIM MODAL */}
      {aktarimModal.acik && (
        <div className="bilardo-popup-overlay">
          <div className="bilardo-popup">
            <h3 className="bilardo-popup-title">Bilardo Adisyonunu Normal Masaya Aktar</h3>
            <p>Masalardan birini seçin:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', margin: '20px 0' }}>
              {aktarimModal.normalMasalar?.map(masa => (
                <button
                  key={masa.id}
                  style={{
                    padding: '15px',
                    border: aktarimModal.seciliMasa?.id === masa.id ? '2px solid #4CAF50' : '2px solid #d2b295',
                    background: aktarimModal.seciliMasa?.id === masa.id ? '#e8f5e9' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setAktarimModal({...aktarimModal, seciliMasa: masa})}
                >
                  MASA {masa.no}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                style={{ flex: 1, padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px' }}
                onClick={() => setAktarimModal({ acik: false, bilardoMasa: null, seciliMasa: null, normalMasalar: [] })}
              >
                İptal
              </button>
              <button 
                style={{ flex: 1, padding: '12px', background: '#4a6fa5', color: 'white', border: 'none', borderRadius: '8px' }}
                onClick={masaAktar}
                disabled={!aktarimModal.seciliMasa}
              >
                Aktar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* UZATMA MODAL */}
      {uzatModal.acik && (
        <div className="bilardo-popup-overlay">
          <div className="bilardo-popup">
            <h3 className="bilardo-popup-title">Süre Uzat</h3>
            <p>Bilardo {uzatModal.masa?.no} için süre uzatma seçenekleri:</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', margin: '20px 0' }}>
              <button 
                style={{ 
                  padding: '20px', 
                  background: '#e3f2fd', 
                  border: '2px solid #90caf9', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => sureUzat("30dk")}
              >
                30 Dakika
              </button>
              <button 
                style={{ 
                  padding: '20px', 
                  background: '#e8f5e9', 
                  border: '2px solid #81c784', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => sureUzat("1saat")}
              >
                1 Saat
              </button>
            </div>
            
            <button 
              style={{ width: '100%', padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', marginTop: '10px' }}
              onClick={() => setUzatModal({ acik: false, masa: null, index: null })}
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}