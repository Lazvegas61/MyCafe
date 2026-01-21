import React, { useEffect, useMemo, useState } from "react";
import mcFinansHavuzu from "../../services/utils/mc_finans_havuzu";

/*
  KASA RAPORU - MERKEZİ FİNANS HAVUZU İLE
  -----------------------------------------
  - mc_finans_havuzu'dan TEK KAYNAKTAN beslenir
  - Tüm raporlar TUTARLI sonuç verir
  - Ödeme türleri NET ayrılır
  - Masa numaraları DOĞRU gösterilir
  - TAM SAYFA GÖRÜNÜM
*/

const KasaRaporu = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [finansVerileri, setFinansVerileri] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [masalar, setMasalar] = useState([]);
  const [giderler, setGiderler] = useState([]);
  const [musteriTahsilatlari, setMusteriTahsilatlari] = useState([]);
  const [debugMode, setDebugMode] = useState(false);

  /* ------------------ TÜM VERİLERİ OKU ------------------ */
  useEffect(() => {
    console.log("🔄 KasaRaporu: Veriler yükleniyor...");
    
    // 1. Finans havuzunu kontrol et, boşsa otomatik doldur
    const havuz = mcFinansHavuzu.getFinansHavuzu();
    if (havuz.length === 0) {
      console.log("💰 Finans havuzu boş, otomatik dolduruluyor...");
      const aktarilan = mcFinansHavuzu.tumAdisyonlariFinansHavuzunaAktar();
      console.log(`✅ ${aktarilan} kayıt finans havuzuna aktarıldı`);
    }
    
    // 2. Güncel finans verilerini al
    const guncelFinansVerileri = mcFinansHavuzu.getFinansHavuzu();
    console.log(`📊 Finans havuzunda ${guncelFinansVerileri.length} kayıt var`);
    
    // 3. Masaları oku (masa adı için)
    const masalarData = JSON.parse(localStorage.getItem("mc_masalar") || "[]");
    
    // 4. Giderleri oku (gider listesi için)
    const giderlerData = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
    
    // 5. Müşteri tahsilatlarını oku (yeni eklenen)
    const tahsilatlarData = JSON.parse(localStorage.getItem("mc_musteri_tahsilatlar") || "[]");
    
    setFinansVerileri(guncelFinansVerileri);
    setMasalar(masalarData);
    setGiderler(giderlerData);
    setMusteriTahsilatlari(tahsilatlarData);
    setYukleniyor(false);
    
    // Debug için istatistikleri göster
    const istatistikler = mcFinansHavuzu.getFinansHavuzuIstatistikleri();
    console.log("📈 Finans havuzu istatistikleri:", istatistikler);
    
  }, []);

  /* ------------------ MASA NUMARASINI BUL ------------------ */
  const getMasaNumarasi = (masaId, kaynak = "", aciklama = "") => {
    console.log("🔍 getMasaNumarasi çağrıldı:", { masaId, kaynak, aciklama });
    
    if (!masaId || masaId === "null" || masaId === "undefined") {
      // Aciklama'dan masa numarası çıkarmaya çalış
      if (aciklama) {
        // Müşteri tahsilatı ise
        if (aciklama.includes("Müşteri Tahsilat")) {
          return "Müşteri Tahsilat";
        }
        
        // Adisyon açıklamasından masa numarası çıkar
        const masaMatch = aciklama.match(/MASA\s+(\d+)/i) || 
                         aciklama.match(/Masa\s+(\d+)/i) ||
                         aciklama.match(/#(\d+)/i);
        
        if (masaMatch) {
          return `Masa ${masaMatch[1]}`;
        }
        
        // Bilardo için
        if (aciklama.includes("Bilardo") || kaynak === "BİLARDO") {
          const bilardoMatch = aciklama.match(/Bilardo.*?(\d+)/i);
          return bilardoMatch ? `Bilardo ${bilardoMatch[1]}` : "Bilardo";
        }
      }
      
      return "Masa Yok";
    }
    
    // ID uzun bir timestamp ise (örnek: 1769026071728), bu bir masa ID'si değil
    if (masaId.toString().length >= 10 && !isNaN(Number(masaId))) {
      console.log("⚠️ Uzun sayısal ID, açıklamadan masa numarası çıkarılacak:", masaId);
      if (aciklama) {
        const masaMatch = aciklama.match(/MASA\s+(\d+)/i) || 
                         aciklama.match(/Masa\s+(\d+)/i) ||
                         aciklama.match(/#(\d+)/i);
        
        if (masaMatch) {
          return `Masa ${masaMatch[1]}`;
        }
      }
      return "Masa Yok";
    }
    
    // Bilardo adisyonları için
    if (kaynak === "BİLARDO" || aciklama?.includes("Bilardo")) {
      if (masaId.includes("bilardo") || masaId.includes("BİLARDO") || !isNaN(Number(masaId))) {
        return `Bilardo ${masaId}`;
      }
      return masaId;
    }
    
    // Normal masalar için localStorage'daki masalar listesini kontrol et
    if (masalar && masalar.length > 0) {
      const masa = masalar.find(m => {
        // Farklı eşleşme olasılıkları
        return (
          m.id === masaId ||
          m.masaId === masaId ||
          String(m.numara) === String(masaId) ||
          (m.numara && String(m.numara) === masaId) ||
          (m.masaNo && String(m.masaNo) === masaId)
        );
      });
      
      if (masa) {
        return `Masa ${masa.numara || masa.masaNo || masaId}`;
      }
    }
    
    // Eşleşme bulunamadıysa açıklamadan çıkarmaya çalış
    if (aciklama) {
      const masaMatch = aciklama.match(/MASA\s+(\d+)/i) || 
                       aciklama.match(/Masa\s+(\d+)/i) ||
                       aciklama.match(/#(\d+)/i) ||
                       aciklama.match(/\(MASA\s+(\d+)\)/i);
      
      if (masaMatch) {
        return `Masa ${masaMatch[1]}`;
      }
      
      // Eğer "MASA 4" gibi bir ifade varsa
      const masaPattern = /MASA\s*\d+/i;
      if (masaPattern.test(aciklama)) {
        const match = aciklama.match(/(MASA\s*\d+)/i);
        return match[0];
      }
    }
    
    // Son çare: masaId'yi döndür
    return `Masa ${masaId}`;
  };

  /* ------------------ ADİSYON AÇIKLAMASINI DÜZENLE ------------------ */
  const formatAciklama = (aciklama, kaynak, masaId) => {
    if (!aciklama) return "Açıklama Yok";
    
    // Müşteri tahsilatı ise
    if (kaynak === "TAHSILAT" || aciklama.includes("Müşteri Tahsilat")) {
      return aciklama;
    }
    
    // ID'leri temizle (ad_1769026104164_fjc1f2hdc gibi)
    let cleaned = aciklama
      .replace(/ad_\d+_\w+/gi, '')  // ad_1769026104164_fjc1f2hdc türünde ID'leri kaldır
      .replace(/\(MASA\s+\d+\)/gi, '')  // (MASA 4) parantez içindekileri kaldır
      .replace(/Adisyon\s*#/gi, '')   // Adisyon # önekini kaldır
      .trim();
    
    // Eğer temizlendikten sonra boşsa
    if (!cleaned || cleaned.length < 3) {
      if (kaynak === "BİLARDO") {
        return "Bilardo Adisyonu";
      } else {
        return "Masa Adisyonu";
      }
    }
    
    // İlk harfi büyük yap
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    return cleaned;
  };

  /* ------------------ ÖDEME TÜRÜ NORMALİZASYONU ------------------ */
  const normalizeOdemeTuru = (tip) => {
    if (!tip) return "NAKIT";
    
    const tipUpper = tip.toUpperCase();
    
    // Nakit türleri
    if (tipUpper.includes("NAKİT") || tipUpper.includes("NAKIT") || tipUpper.includes("CASH")) {
      return "NAKIT";
    }
    
    // Kart türleri
    if (tipUpper.includes("KART") || tipUpper.includes("KREDİ") || tipUpper.includes("KREDI") || 
        tipUpper.includes("CREDIT") || tipUpper.includes("DEBIT")) {
      return "KART";
    }
    
    // Havale türleri
    if (tipUpper.includes("HAVALE") || tipUpper.includes("EFT") || tipUpper.includes("TRANSFER")) {
      return "HAVALE";
    }
    
    // Hesaba Yaz türleri
    if (tipUpper.includes("HESABA") || tipUpper.includes("BORÇ") || tipUpper.includes("BORC") || 
        tipUpper.includes("CARİ") || tipUpper.includes("CARI")) {
      return "HESABA_YAZ";
    }
    
    // Bilardo türleri
    if (tipUpper.includes("BİLARDO") || tipUpper.includes("BILARDO") || tipUpper.includes("POOL")) {
      return "BILARDO";
    }
    
    return tipUpper;
  };

  /* ------------------ ÖDEME TÜRÜ BİLGİSİ ------------------ */
  const getOdemeTuruBilgisi = (tip) => {
    const normalizedTip = normalizeOdemeTuru(tip);
    
    const odemeTurleri = {
      NAKIT: { etiket: "Nakit", renk: "#2ecc71", icon: "💵" },
      KART: { etiket: "K.Kartı", renk: "#3498db", icon: "💳" },
      HAVALE: { etiket: "Havale", renk: "#9b59b6", icon: "🏦" },
      HESABA_YAZ: { etiket: "Hesaba Yaz", renk: "#e67e22", icon: "📝" },
      BILARDO: { etiket: "Bilardo", renk: "#1abc9c", icon: "🎱" },
    };
    
    return odemeTurleri[normalizedTip] || { etiket: normalizedTip, renk: "#95a5a6", icon: "💰" };
  };

  /* ------------------ FİLTRELENMİŞ VERİLER ------------------ */
  const filtrelenmisVeriler = useMemo(() => {
    if (!baslangic && !bitis) {
      return finansVerileri;
    }
    
    return mcFinansHavuzu.tariheGoreFiltrele(baslangic, bitis);
  }, [finansVerileri, baslangic, bitis]);

  /* ------------------ ÖDEME TÜRLERİ TOPLAMLARI ------------------ */
  const odemeTuruGruplari = useMemo(() => {
    console.log("=== 🔍 ODEME_TURU_GRUPLARI HESAPLANIYOR ===");
    
    const kayitlar = baslangic || bitis 
      ? mcFinansHavuzu.tariheGoreFiltrele(baslangic, bitis)
      : finansVerileri;
    
    console.log(`📊 Toplam kayıt: ${kayitlar.length}`);
    console.log(`📊 finansVerileri uzunluğu: ${finansVerileri.length}`);
    console.log(`📊 Filtre: başlangıç=${baslangic}, bitis=${bitis}`);
    
    const gruplar = {
      NAKIT: { toplam: 0, sayi: 0, hareketler: [] },
      KART: { toplam: 0, sayi: 0, hareketler: [] },
      HAVALE: { toplam: 0, sayi: 0, hareketler: [] },
      HESABA_YAZ: { toplam: 0, sayi: 0, hareketler: [] },
      BILARDO: { toplam: 0, sayi: 0, hareketler: [] }
    };
    
    // DEBUG: Tüm kayıtları göster
    console.log("=== 📋 TÜM KAYITLAR ===");
    kayitlar.forEach((kayit, i) => {
      console.log(`${i+1}. ID: ${kayit.id}`);
      console.log(`   Açıklama: ${kayit.aciklama}`);
      console.log(`   Tür: ${kayit.tur}`);
      console.log(`   Ödeme Türü (orijinal): ${kayit.odemeTuru}`);
      console.log(`   Ödeme Türü (normalize): ${normalizeOdemeTuru(kayit.odemeTuru)}`);
      console.log(`   Tutar: ${kayit.tutar}`);
      console.log(`   Kaynak: ${kayit.kaynak}`);
      console.log(`   Gün ID: ${kayit.gunId}`);
      console.log("---");
    });
    
    // Hesaplama
    kayitlar.forEach(kayit => {
      const odemeTuru = normalizeOdemeTuru(kayit.odemeTuru);
      
      if (gruplar[odemeTuru]) {
        if (kayit.tur === "GELIR") {
          gruplar[odemeTuru].toplam += Number(kayit.tutar || 0);
          gruplar[odemeTuru].sayi += 1;
          gruplar[odemeTuru].hareketler.push(kayit);
          console.log(`💰 GELIR eklendi: ${odemeTuru} +${kayit.tutar}`);
        } else if (kayit.tur === "HESABA_YAZ_BORC") {
          gruplar.HESABA_YAZ.toplam += Number(kayit.tutar || 0);
          gruplar.HESABA_YAZ.sayi += 1;
          gruplar.HESABA_YAZ.hareketler.push(kayit);
          console.log(`📝 HESABA_YAZ eklendi: +${kayit.tutar}`);
        } else if (kayit.tur === "GIDER") {
          console.log(`💸 GIDER atlandı: ${kayit.aciklama}`);
        }
      } else {
        console.log(`⚠️ Geçersiz ödeme türü: ${odemeTuru} (kayıt: ${kayit.aciklama})`);
      }
    });
    
    // Sonuçları göster
    console.log("=== 📈 SONUÇ GRUPLARI ===");
    Object.entries(gruplar).forEach(([tur, grup]) => {
      if (grup.toplam > 0 || grup.sayi > 0) {
        console.log(`${tur}: ${grup.toplam} TL (${grup.sayi} adet)`);
      }
    });
    
    console.log("=== 🏁 HESAPLAMA TAMAMLANDI ===");
    return gruplar;
  }, [baslangic, bitis, finansVerileri]);

  /* ------------------ TOPLAMLAR ------------------ */
  const toplamGelir = useMemo(() => {
    return mcFinansHavuzu.toplamGelirHesapla(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  const toplamGider = useMemo(() => {
    return mcFinansHavuzu.toplamGiderHesapla(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  const toplamHesabaYaz = useMemo(() => {
    return mcFinansHavuzu.toplamHesabaYazHesapla(baslangic, bitis);
  }, [baslangic, bitis, finansVerileri]);

  const netKasa = toplamGelir - toplamGider;

  /* ------------------ FİLTRELENMİŞ GİDERLER ------------------ */
  const filtrelenmisGiderler = useMemo(() => {
    return giderler.filter(gider => {
      const tarihStr = gider.tarih ? new Date(gider.tarih).toISOString().split('T')[0] : "";
      
      if (baslangic && tarihStr < baslangic) return false;
      if (bitis && tarihStr > bitis) return false;
      
      return true;
    });
  }, [giderler, baslangic, bitis]);

  /* ------------------ ADİSYON HAREKETLERİ (Masa Numaraları) ------------------ */
  const adisyonHareketleri = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => (k.kaynak === "ADISYON" || k.kaynak === "BİLARDO") && k.tur === "GELIR")
      .map(hareket => ({
        ...hareket,
        formattedAciklama: formatAciklama(hareket.aciklama, hareket.kaynak, hareket.masaId),
        masaNumarasi: getMasaNumarasi(hareket.masaId, hareket.kaynak, hareket.aciklama)
      }))
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  }, [filtrelenmisVeriler]);

  /* ------------------ TÜM GELİR HAREKETLERİ (Adisyon + Müşteri Tahsilat) ------------------ */
  const tumGelirHareketleri = useMemo(() => {
    // 1. Finans havuzundaki GELİR hareketleri
    const finansGelirleri = filtrelenmisVeriler
      .filter(k => k.tur === "GELIR")
      .map(hareket => ({
        ...hareket,
        formattedAciklama: formatAciklama(hareket.aciklama, hareket.kaynak, hareket.masaId),
        masaNumarasi: getMasaNumarasi(hareket.masaId, hareket.kaynak, hareket.aciklama)
      }));
    
    // 2. Müşteri tahsilatlarından GELİR hareketleri oluştur
    const tahsilatGelirleri = musteriTahsilatlari
      .filter(t => {
        const tarihStr = t.tarih ? new Date(t.tarih).toISOString().split('T')[0] : "";
        
        if (baslangic && tarihStr < baslangic) return false;
        if (bitis && tarihStr > bitis) return false;
        
        return true;
      })
      .map(t => ({
        id: `tahsilat_${t.id || Date.now()}`,
        tarih: t.tarih || new Date().toISOString(),
        tur: "GELIR",
        aciklama: `Müşteri Tahsilat - ${t.musteriAdi || 'Müşteri'}`,
        formattedAciklama: `Müşteri Tahsilat - ${t.musteriAdi || 'Müşteri'}`,
        tutar: Number(t.tutar || 0),
        odemeTuru: normalizeOdemeTuru(t.odemeTuru || "NAKIT"),
        gunId: t.tarih ? new Date(t.tarih).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        kaynak: "TAHSILAT",
        referansId: t.id,
        musteriId: t.musteriId,
        masaId: null,
        masaNumarasi: "Müşteri Tahsilat"
      }));
    
    return [...finansGelirleri, ...tahsilatGelirleri]
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  }, [filtrelenmisVeriler, musteriTahsilatlari, baslangic, bitis]);

  /* ------------------ HESABA YAZ HAREKETLERİ ------------------ */
  const hesabaYazHareketleri = useMemo(() => {
    return filtrelenmisVeriler.filter(k => k.tur === "HESABA_YAZ_BORC");
  }, [filtrelenmisVeriler]);

  /* ------------------ MANUEL VERİ AKTARMA ------------------ */
  const handleVeriAktar = () => {
    if (window.confirm("Tüm eski adisyon ve giderler finans havuzuna aktarılacak. Bu işlem mevcut finans verilerini SİLMEZ, sadece ekler. Devam edilsin mi?")) {
      const aktarilan = mcFinansHavuzu.tumAdisyonlariFinansHavuzunaAktar();
      alert(`✅ ${aktarilan} kayıt finans havuzuna aktarıldı. Sayfa yenileniyor...`);
      window.location.reload();
    }
  };

  /* ------------------ FİNANS HAVUZUNU TEMİZLE ------------------ */
  const handleHavuzuTemizle = () => {
    if (window.confirm("DİKKAT: Tüm finans verileri silinecek. Bu işlem GERİ ALINAMAZ. Emin misiniz?")) {
      const temizlendi = mcFinansHavuzu.finansHavuzunuTemizle();
      if (temizlendi) {
        alert("🗑️ Finans havuzu temizlendi. Sayfa yenileniyor...");
        window.location.reload();
      }
    }
  };

  /* ------------------ DEBUG BİLGİSİ ------------------ */
  const handleDebug = () => {
    mcFinansHavuzu.debugFinansHavuzu();
    const istatistikler = mcFinansHavuzu.getFinansHavuzuIstatistikleri();
    
    alert(`
🔍 FİNANS HAVUZU DEBUG BİLGİSİ:

Toplam Kayıt: ${istatistikler.toplamKayit}
Gelir Kayıt: ${istatistikler.gelirKayit}
Gider Kayıt: ${istatistikler.giderKayit}
Hesaba Yaz: ${istatistikler.hesabaYazKayit}

Toplam Gelir: ${istatistikler.toplamGelir.toLocaleString("tr-TR")} ₺
Toplam Gider: ${istatistikler.toplamGider.toLocaleString("tr-TR")} ₺
Toplam Hesaba Yaz: ${istatistikler.toplamHesabaYaz.toLocaleString("tr-TR")} ₺
Net Kasa: ${istatistikler.netKasa.toLocaleString("tr-TR")} ₺

Kaynaklar:
- Adisyon: ${istatistikler.kaynaklar.ADISYON}
- Bilardo: ${istatistikler.kaynaklar.BİLARDO}
- Gider: ${istatistikler.kaynaklar.GİDER}
- Manuel: ${istatistikler.kaynaklar.MANUEL}

Detaylar için konsolu kontrol edin.
    `);
  };

  /* ------------------ DEBUG FONKSİYONLARI ------------------ */
  const handleTestKaydiEkle = () => {
    try {
      // Fonksiyon kontrolü
      if (typeof mcFinansHavuzu.testKaydiEkle === 'function') {
        const test = mcFinansHavuzu.testKaydiEkle();
        alert(`Test kaydı eklendi: ${test ? "✅ BAŞARILI" : "❌ BAŞARISIZ"}`);
      } else {
        // Manuel test kaydı ekle
        const testKayit = {
          tarih: new Date().toISOString(),
          tur: "GELIR",
          aciklama: "DEBUG - Test Gelir Kaydı",
          tutar: 100,
          odemeTuru: "NAKIT",
          kaynak: "DEBUG"
        };
        
        const sonuc = mcFinansHavuzu.finansKaydiEkle(testKayit);
        alert(`Manuel test kaydı eklendi: ${sonuc ? "✅ BAŞARILI" : "❌ BAŞARISIZ"}`);
      }
    } catch (error) {
      alert(`❌ Test kaydı eklenirken hata: ${error.message}`);
      console.error("Test kaydı hatası:", error);
    }
  };

  const handleHavuzuKontrolEt = () => {
    try {
      if (typeof mcFinansHavuzu.finansHavuzuKontrol === 'function') {
        const kontrol = mcFinansHavuzu.finansHavuzuKontrol();
        alert(`Finans havuzu ${kontrol ? "✅ DOLU" : "⚠️ BOŞ"}`);
      } else {
        const havuz = mcFinansHavuzu.getFinansHavuzu();
        alert(`Finans havuzu ${havuz.length > 0 ? "✅ DOLU (" + havuz.length + " kayıt)" : "⚠️ BOŞ"}`);
      }
    } catch (error) {
      alert(`❌ Havuz kontrol hatası: ${error.message}`);
    }
  };

  const handleVeriKaynaklariniKontrolEt = () => {
    try {
      if (typeof mcFinansHavuzu.veriKaynaklariniKontrol === 'function') {
        const kaynaklar = mcFinansHavuzu.veriKaynaklariniKontrol();
        console.log("Veri kaynakları:", kaynaklar);
        
        let mesaj = "📊 VERİ KAYNAKLARI:\n\n";
        mesaj += `Normal Adisyonlar: ${kaynaklar.adisyonlar.length}\n`;
        mesaj += `Bilardo Adisyonlar: ${kaynaklar.bilardoAdisyonlar.length}\n`;
        mesaj += `Giderler: ${kaynaklar.giderler.length}\n`;
        mesaj += `Müşteri Tahsilatları: ${kaynaklar.musteriTahsilatlari.length}\n\n`;
        mesaj += "Detaylar için konsolu kontrol edin.";
        
        alert(mesaj);
      } else {
        // Manuel kontrol
        const adisyonlar = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
        const bilardoAdisyonlar = JSON.parse(localStorage.getItem("bilardo_adisyonlar") || "[]");
        const giderler = JSON.parse(localStorage.getItem("mc_giderler") || "[]");
        const musteriTahsilatlari = JSON.parse(localStorage.getItem("mc_musteri_tahsilatlar") || "[]");
        
        console.log("Veri kaynakları (manuel):", {
          adisyonlar,
          bilardoAdisyonlar,
          giderler,
          musteriTahsilatlari
        });
        
        let mesaj = "📊 VERİ KAYNAKLARI (manuel):\n\n";
        mesaj += `Normal Adisyonlar: ${adisyonlar.length}\n`;
        mesaj += `Bilardo Adisyonlar: ${bilardoAdisyonlar.length}\n`;
        mesaj += `Giderler: ${giderler.length}\n`;
        mesaj += `Müşteri Tahsilatları: ${musteriTahsilatlari.length}\n\n`;
        mesaj += "Detaylar için konsolu kontrol edin.";
        
        alert(mesaj);
      }
    } catch (error) {
      alert(`❌ Veri kaynakları kontrol hatası: ${error.message}`);
      console.error("Veri kaynakları hatası:", error);
    }
  };

  const handleTumVerileriAktar = () => {
    try {
      if (typeof mcFinansHavuzu.tumAdisyonlariFinansHavuzunaAktar === 'function') {
        const aktarilan = mcFinansHavuzu.tumAdisyonlariFinansHavuzunaAktar();
        alert(`${aktarilan} kayıt aktarıldı. Sayfa yenileniyor...`);
        window.location.reload();
      } else {
        alert("❌ Veri aktarma fonksiyonu bulunamadı!");
      }
    } catch (error) {
      alert(`❌ Veri aktarma hatası: ${error.message}`);
      console.error("Veri aktarma hatası:", error);
    }
  };

  const handleOdemeTuruDebug = () => {
    try {
      if (typeof mcFinansHavuzu.odemeTuruDebug === 'function') {
        const sonuc = mcFinansHavuzu.odemeTuruDebug();
        alert(`🔍 Ödeme türü debug tamamlandı. Console'u kontrol edin.\n\nNormal Adisyonlar: ${sonuc.normalAdisyonlar.length}\nBilardo Adisyonlar: ${sonuc.bilardoAdisyonlar.length}`);
      } else {
        alert("❌ Ödeme türü debug fonksiyonu bulunamadı!");
      }
    } catch (error) {
      alert(`❌ Ödeme türü debug hatası: ${error.message}`);
    }
  };

  const handleOdemeTurleriniDuzenle = () => {
    if (window.confirm("Mevcut finans kayıtlarındaki ödeme türleri adisyon verilerine göre düzeltilecek. Devam edilsin mi?")) {
      try {
        if (typeof mcFinansHavuzu.mevcutOdemeTurleriniDuzenle === 'function') {
          const guncellenen = mcFinansHavuzu.mevcutOdemeTurleriniDuzenle();
          alert(`✅ ${guncellenen} kayıt güncellendi. Sayfa yenileniyor...`);
          window.location.reload();
        } else {
          alert("❌ Düzenleme fonksiyonu bulunamadı!");
        }
      } catch (error) {
        alert(`❌ Düzenleme hatası: ${error.message}`);
      }
    }
  };

  if (yukleniyor) {
    return (
      <div style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f9fa",
        zIndex: 1000
      }}>
        <div style={{ 
          textAlign: "center", 
          color: "#666",
          padding: 40
        }}>
          <div style={{ fontSize: 24, marginBottom: 20, fontWeight: "bold", color: "#7a3e06" }}>
            💰 Kasa Raporu Hazırlanıyor...
          </div>
          <div style={{ fontSize: 16, marginBottom: 30 }}>
            Finans havuzu verileri okunuyor.
          </div>
          <div style={{
            width: 200,
            height: 4,
            background: "#e0e0e0",
            borderRadius: 2,
            margin: "0 auto",
            overflow: "hidden"
          }}>
            <div style={{
              width: "60%",
              height: "100%",
              background: "#3498db",
              animation: "loading 1.5s infinite ease-in-out"
            }}></div>
          </div>
          <style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 32, 
      width: "100%",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      boxSizing: "border-box"
    }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 24
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: 0, 
              color: "#7a3e06", 
              fontSize: "2.4rem",
              fontWeight: "bold"
            }}>
              💰 KASA RAPORU - FİNANS HAVUZU
            </h2>
            <p style={{ 
              marginTop: 10, 
              color: "#666", 
              fontSize: 17,
              lineHeight: 1.5
            }}>
              mc_finans_havuzu'ndan gelen merkezi veriler | 
              <span style={{ 
                background: "#2ecc71", 
                color: "white",
                padding: "4px 12px",
                borderRadius: 20,
                marginLeft: 12,
                fontSize: 15,
                fontWeight: "bold"
              }}>
                {finansVerileri.length} kayıt
              </span>
            </p>
          </div>
          
          <div style={{ 
            textAlign: "right",
            fontSize: 15,
            color: "#666"
          }}>
            <div style={{ 
              fontWeight: "bold",
              fontSize: 18,
              color: "#7a3e06"
            }}>
              {new Date().toLocaleDateString("tr-TR", { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div style={{ marginTop: 4 }}>
              Saat: {new Date().toLocaleTimeString("tr-TR")}
            </div>
          </div>
        </div>
        
        {/* YÖNETİM BUTONLARI */}
        <div style={{ 
          display: "flex", 
          gap: 12, 
          marginTop: 16, 
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <button
            onClick={handleVeriAktar}
            style={{
              padding: "12px 20px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 3px 6px rgba(52, 152, 219, 0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 5px 10px rgba(52, 152, 219, 0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 3px 6px rgba(52, 152, 219, 0.3)";
            }}
            title="Eski adisyon ve giderleri finans havuzuna ekler"
          >
            🔄 Veri Aktar
          </button>
          
          <button
            onClick={handleDebug}
            style={{
              padding: "12px 20px",
              background: "#9b59b6",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 3px 6px rgba(155, 89, 182, 0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 5px 10px rgba(155, 89, 182, 0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 3px 6px rgba(155, 89, 182, 0.3)";
            }}
            title="Finans havuzu istatistiklerini göster"
          >
            🔍 Debug
          </button>
          
          <button
            onClick={handleHavuzuTemizle}
            style={{
              padding: "12px 20px",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 3px 6px rgba(231, 76, 60, 0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 5px 10px rgba(231, 76, 60, 0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 3px 6px rgba(231, 76, 60, 0.3)";
            }}
            title="Tüm finans verilerini siler (DİKKAT!)"
          >
            🗑️ Temizle
          </button>
          
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: "12px 20px",
              background: debugMode ? "#34495e" : "#7f8c8d",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: debugMode ? "0 3px 6px rgba(52, 73, 94, 0.3)" : "0 3px 6px rgba(127, 140, 141, 0.3)",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = debugMode 
                ? "0 5px 10px rgba(52, 73, 94, 0.4)" 
                : "0 5px 10px rgba(127, 140, 141, 0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = debugMode 
                ? "0 3px 6px rgba(52, 73, 94, 0.3)" 
                : "0 3px 6px rgba(127, 140, 141, 0.3)";
            }}
            title="Debug panelini aç/kapat"
          >
            {debugMode ? "🔴 Debug Kapat" : "🟢 Debug Aç"}
          </button>
        </div>
      </div>

      {/* DEBUG PANELİ */}
      {debugMode && (
        <div style={{
          background: "#2c3e50",
          color: "#ecf0f1",
          padding: 24,
          borderRadius: 12,
          marginBottom: 32,
          fontSize: 14,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16
          }}>
            <h4 style={{ 
              margin: 0, 
              color: "#3498db",
              fontSize: "1.2rem",
              fontWeight: "bold"
            }}>
              🐛 DEBUG PANELİ
            </h4>
            <div style={{ fontSize: 12, color: "#bdc3c7" }}>
              Detaylı yönetim araçları
            </div>
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
            gap: 12, 
            marginBottom: 20 
          }}>
            <button
              onClick={handleTestKaydiEkle}
              style={{ 
                padding: "10px 16px", 
                background: "#27ae60", 
                border: "none", 
                borderRadius: 6, 
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              ➕ Test Kaydı Ekle
            </button>
            
            <button
              onClick={handleHavuzuKontrolEt}
              style={{ 
                padding: "10px 16px", 
                background: "#3498db", 
                border: "none", 
                borderRadius: 6, 
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              🔍 Havuzu Kontrol Et
            </button>
            
            <button
              onClick={handleVeriKaynaklariniKontrolEt}
              style={{ 
                padding: "10px 16px", 
                background: "#9b59b6", 
                border: "none", 
                borderRadius: 6, 
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              📊 Veri Kaynaklarını Kontrol Et
            </button>
            
            <button
              onClick={handleTumVerileriAktar}
              style={{ 
                padding: "10px 16px", 
                background: "#e67e22", 
                border: "none", 
                borderRadius: 6, 
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              🔄 Tüm Verileri Aktar
            </button>
            
            <button
              onClick={handleOdemeTuruDebug}
              style={{ 
                padding: "10px 16px", 
                background: "#16a085", 
                border: "none", 
                borderRadius: 6, 
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              🔍 Ödeme Türü Debug
            </button>
            
            <button
              onClick={handleOdemeTurleriniDuzenle}
              style={{ 
                padding: "10px 16px", 
                background: "#8e44ad", 
                border: "none", 
                borderRadius: 6, 
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              🔄 Ödeme Türlerini Düzelt
            </button>
          </div>
          
          <div style={{ 
            background: "rgba(0,0,0,0.2)", 
            padding: 16, 
            borderRadius: 8,
            marginTop: 16
          }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
              gap: 16 
            }}>
              <div>
                <strong>📈 ANLIK DURUM:</strong><br />
                - Finans Havuzu: {finansVerileri.length} kayıt<br />
                - Giderler: {giderler.length} kayıt<br />
                - Müşteri Tahsilatları: {musteriTahsilatlari.length} kayıt
              </div>
              <div>
                <strong>💰 ÖZET:</strong><br />
                - Toplam Gelir: {toplamGelir.toLocaleString("tr-TR")} ₺<br />
                - Toplam Gider: {toplamGider.toLocaleString("tr-TR")} ₺<br />
                - Net Kasa: {netKasa.toLocaleString("tr-TR")} ₺
              </div>
            </div>
          </div>
          
          <div style={{ 
            marginTop: 16, 
            fontSize: 13, 
            color: "#bdc3c7",
            padding: 12,
            background: "rgba(0,0,0,0.1)",
            borderRadius: 6,
            borderLeft: "3px solid #3498db"
          }}>
            <strong>💡 İPUCU:</strong> Eğer ödeme türleri gözükmüyorsa:<br />
            1. "Ödeme Türü Debug" ile mevcut adisyonları kontrol edin<br />
            2. "Ödeme Türlerini Düzelt" ile finans kayıtlarını güncelleyin<br />
            3. Yeni adisyonlar kapatın ve farklı ödeme türleri seçin
          </div>
        </div>
      )}

      {/* FİLTRE */}
      <div style={{
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        gap: 24,
        marginBottom: 32,
        alignItems: "flex-end",
        flexWrap: "wrap"
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            fontSize: 15,
            fontWeight: "600",
            color: "#7a3e06"
          }}>
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
            style={{ 
              padding: "12px 16px", 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              width: "100%",
              fontSize: 15,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            fontSize: 15,
            fontWeight: "600",
            color: "#7a3e06"
          }}>
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
            style={{ 
              padding: "12px 16px", 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              width: "100%",
              fontSize: 15,
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div style={{ 
          display: "flex", 
          gap: 12,
          alignItems: "center"
        }}>
          <button
            onClick={() => {
              setBaslangic("");
              setBitis("");
            }}
            style={{
              padding: "12px 24px",
              background: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: "600",
              color: "#666",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#e9ecef";
              e.currentTarget.style.borderColor = "#7a3e06";
              e.currentTarget.style.color = "#7a3e06";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#f8f9fa";
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.color = "#666";
            }}
          >
            ✨ Filtreyi Temizle
          </button>
        </div>
      </div>

      {/* TOPLAM ÖZET (Resimdeki Panel) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 24,
        marginBottom: 40
      }}>
        <OzetKart
          baslik="Kasa Girişleri"
          deger={toplamGelir.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
          altBilgi={`${tumGelirHareketleri.length} adet gelir hareketi`}
          icon="💰"
        />
        
        <OzetKart
          baslik="Hesaba Yaz"
          deger={toplamHesabaYaz.toLocaleString("tr-TR") + " ₺"}
          renk="#e67e22"
          altBilgi={`${hesabaYazHareketleri.length} adet borç (kasaya girmez)`}
          icon="📝"
        />
        
        <OzetKart
          baslik="Toplam Gider"
          deger={toplamGider.toLocaleString("tr-TR") + " ₺"}
          renk="#e74c3c"
          altBilgi={`${filtrelenmisGiderler.length} adet gider hareketi`}
          icon="💸"
        />
        
        <OzetKart
          baslik="Net Kasa"
          deger={netKasa.toLocaleString("tr-TR") + " ₺"}
          renk={netKasa >= 0 ? "#3498db" : "#e74c3c"}
          altBilgi={netKasa >= 0 ? "✅ Pozitif bakiye" : "❌ Negatif bakiye"}
          icon={netKasa >= 0 ? "📈" : "📉"}
        />
      </div>

      {/* ÖDEME TÜRLERİ DAĞILIMI */}
      <div style={{
        background: "#fff",
        padding: 28,
        borderRadius: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        marginBottom: 40
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28
        }}>
          <h3 style={{ 
            margin: 0, 
            color: "#7a3e06",
            fontSize: "1.8rem",
            fontWeight: "bold"
          }}>
            💳 ÖDEME TÜRLERİ DAĞILIMI
          </h3>
          <span style={{ 
            fontSize: 14, 
            color: "#666", 
            background: "#f8f9fa",
            padding: "6px 12px",
            borderRadius: 20,
            fontWeight: "500"
          }}>
            Toplam {Object.values(odemeTuruGruplari).reduce((sum, g) => sum + g.sayi, 0)} adet işlem
          </span>
        </div>
        
        {Object.values(odemeTuruGruplari).some(grup => grup.toplam > 0) ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20
          }}>
            {Object.entries(odemeTuruGruplari)
              .filter(([tur, grup]) => grup.toplam > 0)
              .map(([tur, grup]) => {
                const odemeInfo = getOdemeTuruBilgisi(tur);
                const yuzde = toplamGelir > 0 ? ((grup.toplam / toplamGelir) * 100).toFixed(1) : 0;
                
                return (
                  <div key={tur} style={{
                    padding: 24,
                    background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                    borderRadius: 12,
                    borderLeft: `6px solid ${odemeInfo.renk}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    transition: "all 0.3s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}>
                    <div style={{ 
                      fontSize: 16, 
                      color: "#555", 
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontWeight: "600"
                    }}>
                      <span style={{ fontSize: 24 }}>{odemeInfo.icon}</span>
                      {odemeInfo.etiket}
                      <div style={{
                        marginLeft: "auto",
                        fontSize: 14,
                        background: odemeInfo.renk + "20",
                        color: odemeInfo.renk,
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontWeight: "bold"
                      }}>
                        {grup.sayi} adet
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: 28, 
                      fontWeight: "bold", 
                      color: odemeInfo.renk,
                      marginBottom: 8
                    }}>
                      {grup.toplam.toLocaleString("tr-TR")} ₺
                    </div>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12
                    }}>
                      <div style={{
                        flex: 1,
                        height: 6,
                        background: "#e0e0e0",
                        borderRadius: 3,
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${yuzde}%`,
                          height: "100%",
                          background: odemeInfo.renk,
                          borderRadius: 3
                        }}></div>
                      </div>
                      <div style={{ 
                        fontSize: 14, 
                        color: "#777",
                        fontWeight: "600"
                      }}>
                        %{yuzde}
                      </div>
                    </div>
                    {grup.hareketler.length > 0 && (
                      <div style={{ 
                        fontSize: 13, 
                        color: "#777", 
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid #eee"
                      }}>
                        <strong>Son işlemler:</strong> {grup.hareketler.slice(0, 2).map(h => 
                          `${h.aciklama.substring(0, 25)}...`
                        ).join(", ")}
                        {grup.hareketler.length > 2 && ` +${grup.hareketler.length - 2} adet`}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ 
            padding: 50, 
            textAlign: "center", 
            color: "#999", 
            fontStyle: "italic",
            background: "#f9f9f9",
            borderRadius: 12,
            marginTop: 20
          }}>
            <div style={{ fontSize: 22, marginBottom: 16 }}>
              💡 Ödeme türleri dağılımı bulunamadı
            </div>
            <div style={{ fontSize: 15, color: "#666", lineHeight: 1.6 }}>
              Toplam {finansVerileri.length} kayıt var. <br />
              Verileri aktarmak için "Veri Aktar" butonunu kullanın veya<br />
              yeni adisyonlar kapatıp farklı ödeme türleri seçin.
            </div>
          </div>
        )}
      </div>

      {/* ADİSYON HAREKETLERİ (Masa Numaraları) */}
      <div style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        overflow: "hidden",
        marginBottom: 40
      }}>
        <div style={{
          background: "linear-gradient(90deg, #f1e2c6 0%, #e6d0b5 100%)",
          padding: 22,
          borderBottom: "1px solid #ddd"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h3 style={{ 
              margin: 0, 
              color: "#7a3e06",
              fontSize: "1.6rem",
              fontWeight: "bold"
            }}>
              🪑 ADİSYON HAREKETLERİ
            </h3>
            <div style={{ 
              fontSize: 16, 
              color: "#666", 
              background: "rgba(255,255,255,0.8)",
              padding: "8px 16px",
              borderRadius: 20,
              fontWeight: "600"
            }}>
              {adisyonHareketleri.length} adet
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            Kapanan Masa ve Bilardo Numaraları
          </div>
        </div>
        
        {adisyonHareketleri.length === 0 ? (
          <div style={{ 
            padding: 60, 
            textAlign: "center", 
            color: "#777",
            background: "#fafafa"
          }}>
            <div style={{ fontSize: 24, marginBottom: 16 }}>
              📭 Seçilen tarih aralığında adisyon hareketi bulunamadı
            </div>
            <div style={{ fontSize: 16, color: "#999" }}>
              Tarih filtresini değiştirin veya "Veri Aktar" butonunu kullanın.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              minWidth: 1000 
            }}>
              <thead style={{ background: "#f9f5ec" }}>
                <tr>
                  <Th style={{ width: "15%" }}>Masa No</Th>
                  <Th style={{ width: "30%" }}>Açıklama</Th>
                  <Th style={{ width: "15%" }}>Tarih</Th>
                  <Th style={{ width: "20%" }}>Ödeme Türü</Th>
                  <Th style={{ width: "20%" }} align="right">Tutar</Th>
                </tr>
              </thead>
              
              <tbody>
                {adisyonHareketleri.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const odemeInfo = getOdemeTuruBilgisi(hareket.odemeTuru);
                  const isBilardo = hareket.kaynak === "BİLARDO";
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: i % 2 === 0 ? "#fff" : "#faf5ea",
                      borderBottom: "1px solid #eee",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#fef8e8";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#faf5ea";
                    }}>
                      <Td>
                        <div style={{ 
                          fontWeight: "bold", 
                          fontSize: 16,
                          color: "#7a3e06"
                        }}>
                          {hareket.masaNumarasi}
                          {isBilardo && (
                            <div style={{ 
                              fontSize: 12, 
                              color: "#3498db",
                              fontWeight: "600",
                              marginTop: 4
                            }}>
                              🎱 Bilardo
                            </div>
                          )}
                        </div>
                        {hareket.masaId && hareket.masaId.toString().length < 10 && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#666",
                            marginTop: 4
                          }}>
                            ID: {hareket.masaId}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600", 
                          fontSize: 15,
                          marginBottom: 6
                        }}>
                          {hareket.formattedAciklama}
                        </div>
                        <div style={{ 
                          fontSize: 12, 
                          color: "#666",
                          fontStyle: "italic"
                        }}>
                          {hareket.kaynak === "ADISYON" ? "Masa Adisyonu" : "Bilardo Adisyonu"}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15
                        }}>
                          {tarih.toLocaleDateString("tr-TR")}
                        </div>
                        <div style={{ 
                          fontSize: 13, 
                          color: "#666",
                          marginTop: 4
                        }}>
                          {tarih.toLocaleTimeString("tr-TR", { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </Td>
                      <Td>
                        <div style={{
                          padding: "10px 16px",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: "bold",
                          background: odemeInfo.renk + "15",
                          color: odemeInfo.renk,
                          border: `1px solid ${odemeInfo.renk}30`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 120,
                          justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 18 }}>{odemeInfo.icon}</span>
                          {odemeInfo.etiket}
                        </div>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 18,
                        color: "#2ecc71"
                      }}>
                        {Number(hareket.tutar || 0).toLocaleString("tr-TR")} ₺
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TÜM GELİR HAREKETLERİ (Adisyon + Müşteri Tahsilat) */}
      {tumGelirHareketleri.length > 0 && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          marginBottom: 40
        }}>
          <div style={{
            background: "linear-gradient(90deg, #e8f8f1 0%, #d4f1e4 100%)",
            padding: 22,
            borderBottom: "1px solid #ddd"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#27ae60",
                fontSize: "1.6rem",
                fontWeight: "bold"
              }}>
                💰 GELİR HAREKETLERİ
              </h3>
              <div style={{ 
                fontSize: 16, 
                color: "#27ae60", 
                background: "rgba(255,255,255,0.8)",
                padding: "8px 16px",
                borderRadius: 20,
                fontWeight: "600"
              }}>
                {tumGelirHareketleri.length} adet
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Tüm kasa girişleri (Adisyon + Müşteri Tahsilat)
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              minWidth: 1000 
            }}>
              <thead style={{ background: "#f0f9f5" }}>
                <tr>
                  <Th style={{ width: "15%" }}>Tarih</Th>
                  <Th style={{ width: "30%" }}>Açıklama</Th>
                  <Th style={{ width: "15%" }}>Masa/Müşteri</Th>
                  <Th style={{ width: "20%" }}>Ödeme Türü</Th>
                  <Th style={{ width: "20%" }} align="right">Tutar</Th>
                </tr>
              </thead>
              
              <tbody>
                {tumGelirHareketleri.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const odemeInfo = getOdemeTuruBilgisi(hareket.odemeTuru);
                  const isTahsilat = hareket.kaynak === "TAHSILAT";
                  const isBilardo = hareket.kaynak === "BİLARDO";
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: i % 2 === 0 ? "#fff" : "#f8f9fa",
                      borderBottom: "1px solid #eee",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#f0f9f5";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f8f9fa";
                    }}>
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15
                        }}>
                          {tarih.toLocaleDateString("tr-TR")}
                        </div>
                        <div style={{ 
                          fontSize: 13, 
                          color: "#666",
                          marginTop: 4
                        }}>
                          {tarih.toLocaleTimeString("tr-TR")}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600", 
                          fontSize: 15,
                          marginBottom: 8
                        }}>
                          {hareket.formattedAciklama}
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {isBilardo && (
                            <span style={{ 
                              padding: "4px 10px",
                              borderRadius: 4,
                              fontSize: 12,
                              background: "#e8f4f8",
                              color: "#3498db",
                              fontWeight: "600"
                            }}>
                              🎱 BİLARDO
                            </span>
                          )}
                          {isTahsilat && (
                            <span style={{ 
                              padding: "4px 10px",
                              borderRadius: 4,
                              fontSize: 12,
                              background: "#f4e8f8",
                              color: "#9b59b6",
                              fontWeight: "600"
                            }}>
                              👤 MÜŞTERİ TAHSİLATI
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15,
                          color: "#7a3e06"
                        }}>
                          {hareket.masaNumarasi || "Masa Yok"}
                        </div>
                        {!isTahsilat && hareket.masaId && hareket.masaId.toString().length < 10 && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#666",
                            marginTop: 4
                          }}>
                            Masa ID: {hareket.masaId}
                          </div>
                        )}
                        {isTahsilat && hareket.musteriId && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#666",
                            marginTop: 4
                          }}>
                            Müşteri ID: {hareket.musteriId}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <div style={{
                          padding: "10px 16px",
                          borderRadius: 8,
                          fontSize: 14,
                          background: odemeInfo.renk + "15",
                          color: odemeInfo.renk,
                          border: `1px solid ${odemeInfo.renk}30`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 120,
                          justifyContent: "center"
                        }}>
                          <span style={{ fontSize: 18 }}>{odemeInfo.icon}</span>
                          {odemeInfo.etiket}
                        </div>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 18,
                        color: "#2ecc71"
                      }}>
                        {Number(hareket.tutar || 0).toLocaleString("tr-TR")} ₺
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HESABA YAZ HAREKETLERİ */}
      {hesabaYazHareketleri.length > 0 && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          marginBottom: 40
        }}>
          <div style={{
            background: "linear-gradient(90deg, #fff3cd 0%, #ffeaa7 100%)",
            padding: 22,
            borderBottom: "1px solid #ddd"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#e67e22",
                fontSize: "1.6rem",
                fontWeight: "bold"
              }}>
                📝 HESABA YAZ BORÇLARI
              </h3>
              <div style={{ 
                fontSize: 16, 
                color: "#e67e22", 
                background: "rgba(255,255,255,0.8)",
                padding: "8px 16px",
                borderRadius: 20,
                fontWeight: "600"
              }}>
                {hesabaYazHareketleri.length} adet
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Borç yazılan tutarlar (kasaya girmez)
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              minWidth: 1000 
            }}>
              <thead style={{ background: "#fff8e1" }}>
                <tr>
                  <Th style={{ width: "20%" }}>Tarih</Th>
                  <Th style={{ width: "40%" }}>Açıklama</Th>
                  <Th style={{ width: "20%" }}>Masa</Th>
                  <Th style={{ width: "20%" }} align="right">Borç Tutarı</Th>
                </tr>
              </thead>
              
              <tbody>
                {hesabaYazHareketleri.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const masaNumarasi = getMasaNumarasi(hareket.masaId, hareket.kaynak, hareket.aciklama);
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: i % 2 === 0 ? "#fff" : "#fffaf0",
                      borderBottom: "1px solid #eee",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#fff8e1";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fffaf0";
                    }}>
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15
                        }}>
                          {tarih.toLocaleDateString("tr-TR")}
                        </div>
                        <div style={{ 
                          fontSize: 13, 
                          color: "#666",
                          marginTop: 4
                        }}>
                          {tarih.toLocaleTimeString("tr-TR")}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600", 
                          fontSize: 15,
                          marginBottom: 8
                        }}>
                          {hareket.aciklama}
                        </div>
                        <div style={{ 
                          fontSize: 13, 
                          color: "#e67e22",
                          fontWeight: "600",
                          padding: "4px 10px",
                          background: "#fff3cd",
                          borderRadius: 4,
                          display: "inline-block"
                        }}>
                          ⚠️ Borç Kaydı (Kasaya girmez)
                        </div>
                      </Td>
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15,
                          color: "#7a3e06"
                        }}>
                          {masaNumarasi}
                        </div>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 18,
                        color: "#e67e22"
                      }}>
                        {Number(hareket.tutar || 0).toLocaleString("tr-TR")} ₺
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GİDER LİSTESİ */}
      {filtrelenmisGiderler.length > 0 && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          marginBottom: 40
        }}>
          <div style={{
            background: "linear-gradient(90deg, #f1e2c6 0%, #e6d0b5 100%)",
            padding: 22,
            borderBottom: "1px solid #ddd"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#7a3e06",
                fontSize: "1.6rem",
                fontWeight: "bold"
              }}>
                📝 GİDERLER
              </h3>
              <div style={{ 
                fontSize: 16, 
                color: "#e74c3c", 
                background: "rgba(255,255,255,0.8)",
                padding: "8px 16px",
                borderRadius: 20,
                fontWeight: "600"
              }}>
                {filtrelenmisGiderler.length} adet
              </div>
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              minWidth: 1000 
            }}>
              <thead style={{ background: "#f9f5ec" }}>
                <tr>
                  <Th style={{ width: "15%" }}>Tarih</Th>
                  <Th style={{ width: "25%" }}>Açıklama</Th>
                  <Th style={{ width: "15%" }}>Kategori</Th>
                  <Th style={{ width: "15%" }} align="right">Tutar</Th>
                  <Th style={{ width: "30%" }}>Not</Th>
                </tr>
              </thead>
              
              <tbody>
                {filtrelenmisGiderler.map((gider, i) => (
                  <tr key={gider.id || i} style={{
                    background: i % 2 === 0 ? "#fff" : "#faf5ea",
                    borderBottom: "1px solid #eee",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#fef8e8";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#faf5ea";
                  }}>
                    <Td>
                      <div style={{ 
                        fontWeight: "600",
                        fontSize: 15
                      }}>
                        {gider.tarih ? new Date(gider.tarih).toLocaleDateString("tr-TR") : "Belirtilmemiş"}
                      </div>
                      {gider.tarih && (
                        <div style={{ 
                          fontSize: 13, 
                          color: "#666",
                          marginTop: 4
                        }}>
                          {new Date(gider.tarih).toLocaleTimeString("tr-TR", {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div style={{ 
                        fontWeight: "600", 
                        fontSize: 15
                      }}>
                        {gider.aciklama || "Gider"}
                      </div>
                    </Td>
                    <Td>
                      <span style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 13,
                        background: "#fdecea",
                        color: "#e74c3c",
                        fontWeight: "bold",
                        display: "inline-block"
                      }}>
                        {gider.kategori || "Genel"}
                      </span>
                    </Td>
                    <Td align="right" style={{ 
                      fontWeight: "bold", 
                      fontSize: 17,
                      color: "#e74c3c"
                    }}>
                      {Number(gider.tutar || 0).toLocaleString("tr-TR")} ₺
                    </Td>
                    <Td style={{ 
                      fontSize: 14, 
                      color: "#666",
                      lineHeight: 1.5
                    }}>
                      {gider.not || "-"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALT BİLGİ */}
      <div style={{ 
        marginTop: 48, 
        paddingTop: 32, 
        borderTop: "2px solid #eee",
        fontSize: 15, 
        color: "#555",
        background: "#fff",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}>
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32
        }}>
          <div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: "bold",
              color: "#7a3e06",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "2px solid #e6d0b5"
            }}>
              🎯 KASA RAPORU MANTIĞI
            </div>
            <div style={{ lineHeight: 1.8 }}>
              1️⃣ Tüm veriler <strong style={{ color: "#3498db" }}>mc_finans_havuzu</strong>'ndan okunur<br />
              2️⃣ Ödeme türleri adisyon kapanışında belirlenir<br />
              3️⃣ <strong style={{ color: "#e67e22" }}>Hesaba Yaz</strong> → borçtur, kasaya girmez<br />
              4️⃣ Tüm raporlar aynı veriden beslenir → <strong>tutarlılık</strong><br />
              5️⃣ Eski verileri "Veri Aktar" ile havuzuna ekleyin
            </div>
          </div>
          
          <div>
            <div style={{ 
              fontSize: 18, 
              fontWeight: "bold",
              color: "#7a3e06",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "2px solid #e6d0b5"
            }}>
              📊 KASA ÖZETİ
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Gelir:</span>
                <span style={{ 
                  color: "#2ecc71", 
                  fontWeight: "bold",
                  fontSize: 16
                }}>
                  {toplamGelir.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Gider:</span>
                <span style={{ 
                  color: "#e74c3c", 
                  fontWeight: "bold",
                  fontSize: 16
                }}>
                  {toplamGider.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px solid #eee"
              }}>
                <span style={{ fontWeight: "bold" }}>Net Kasa:</span>
                <span style={{ 
                  color: netKasa >= 0 ? "#2ecc71" : "#e74c3c",
                  fontWeight: "bold",
                  fontSize: 18
                }}>
                  {netKasa.toLocaleString("tr-TR")} ₺
                  {netKasa >= 0 ? " ✅" : " ❌"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: 32,
          padding: 20,
          background: "#f8f9fa",
          borderRadius: 8,
          fontSize: 14,
          color: "#666",
          borderLeft: "4px solid #3498db"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12,
            marginBottom: 8
          }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <strong style={{ color: "#7a3e06" }}>Son güncelleme:</strong>
            {new Date().toLocaleString("tr-TR", {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
          <div style={{ color: "#777", fontSize: 13 }}>
            Rapor her yüklendiğinde güncel finans verilerini gösterir.
            Eski verileri görmek için "Veri Aktar" butonunu kullanın.
          </div>
        </div>
      </div>
    </div>
  );
};

export default KasaRaporu;

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk, altBilgi, icon }) => (
  <div style={{
    background: "#fff",
    padding: 28,
    borderRadius: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    borderLeft: `6px solid ${renk}`,
    transition: "all 0.3s",
    position: "relative",
    overflow: "hidden"
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = "translateY(-6px)";
    e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.15)";
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
  }}>
    {icon && (
      <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        fontSize: 36,
        opacity: 0.1,
        color: renk
      }}>
        {icon}
      </div>
    )}
    <div style={{ 
      fontSize: 16, 
      color: "#555", 
      marginBottom: 12,
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: 8
    }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      {baslik}
    </div>
    <div style={{ 
      fontSize: 32, 
      fontWeight: "bold", 
      color: renk,
      marginBottom: 8
    }}>
      {deger}
    </div>
    {altBilgi && (
      <div style={{ 
        fontSize: 13, 
        color: "#777", 
        marginTop: 8,
        paddingTop: 12,
        borderTop: "1px solid #eee"
      }}>
        {altBilgi}
      </div>
    )}
  </div>
);

const Th = ({ children, align, style }) => (
  <th style={{
    padding: "18px 24px",
    textAlign: align || "left",
    borderBottom: "2px solid #7a3e06",
    fontSize: 15,
    fontWeight: "bold",
    color: "#7a3e06",
    background: "#f9f5ec",
    whiteSpace: "nowrap",
    ...style
  }}>
    {children}
  </th>
);

const Td = ({ children, align, style }) => (
  <td style={{
    padding: "18px 24px",
    textAlign: align || "left",
    borderBottom: "1px solid #eee",
    fontSize: 15,
    verticalAlign: "top",
    ...style
  }}>
    {children}
  </td>
);