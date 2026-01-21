import React, { useEffect, useMemo, useState } from "react";
import mcFinansHavuzu from "../../services/utils/mc_finans_havuzu";

/*
  KASA RAPORU - MERKEZİ FİNANS HAVUZU İLE
  -----------------------------------------
  - mc_finans_havuzu'dan TEK KAYNAKTAN beslenir
  - Tüm raporlar TUTARLI sonuç verir
  - Ödeme türleri NET ayrılır
  - Masa numaraları DOĞRU gösterilir
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
    if (!masaId) {
      // Bilardo için aciklamadan masa numarası çıkarmaya çalış
      if (kaynak === "BİLARDO") {
        const bilardoMatch = aciklama?.match(/Bilardo.*?#?\s*(\d+)/i);
        if (bilardoMatch) return `Bilardo ${bilardoMatch[1]}`;
        return "Bilardo";
      }
      
      // Normal masa için aciklamadan masa numarası çıkarmaya çalış
      const masaMatch = aciklama?.match(/(?:Masa|Adisyon).*?#?\s*(\d+)/i);
      if (masaMatch) return `Masa ${masaMatch[1]}`;
      
      return "Masa Yok";
    }
    
    // Bilardo adisyonları için
    if (kaynak === "BİLARDO") {
      if (masaId.includes("bilardo") || masaId.includes("BİLARDO")) {
        return masaId;
      }
      // Sayısal bir değer ise Bilardo öneki ekle
      if (!isNaN(Number(masaId))) {
        return `Bilardo ${masaId}`;
      }
      return masaId;
    }
    
    // Normal masalar için
    const masa = masalar.find(m => 
      m.id === masaId || 
      m.masaId === masaId || 
      m.numara === masaId ||
      String(m.numara) === String(masaId)
    );
    
    if (masa) {
      return `Masa ${masa.numara || masaId}`;
    }
    
    // Adisyon içinde masa numarası varsa
    if (masaId && typeof masaId === "string" && masaId.length < 10) {
      return `Masa ${masaId}`;
    }
    
    return "Masa Yok";
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
  console.log("🔍 odemeTuruGruplari hesaplanıyor...");
  
  const kayitlar = baslangic || bitis 
    ? mcFinansHavuzu.tariheGoreFiltrele(baslangic, bitis)
    : finansVerileri;
  
  console.log(`📊 Hesaplanacak kayıt sayısı: ${kayitlar.length}`);
  
  const gruplar = {
    NAKIT: { toplam: 0, sayi: 0, hareketler: [] },
    KART: { toplam: 0, sayi: 0, hareketler: [] },
    HAVALE: { toplam: 0, sayi: 0, hareketler: [] },
    HESABA_YAZ: { toplam: 0, sayi: 0, hareketler: [] },
    BILARDO: { toplam: 0, sayi: 0, hareketler: [] }
  };
  
  // Debug: Tüm kayıtları kontrol et
  console.log("📋 KAYITLARIN ÖDEME TÜRLERİ:");
  kayitlar.forEach((kayit, index) => {
    const odemeTuru = normalizeOdemeTuru(kayit.odemeTuru || kayit.odemeTipi);
    console.log(`${index+1}. ${kayit.aciklama} - Ödeme: ${odemeTuru} (orijinal: ${kayit.odemeTuru})`);
  });
  
  kayitlar.forEach(kayit => {
    const odemeTuru = normalizeOdemeTuru(kayit.odemeTuru || kayit.odemeTipi);
    
    console.log(`📝 İşleniyor: ${kayit.aciklama} - Tür: ${kayit.tur} - Ödeme: ${odemeTuru}`);
    
    if (gruplar[odemeTuru]) {
      if (kayit.tur === "GELIR") {
        gruplar[odemeTuru].toplam += Number(kayit.tutar || 0);
        gruplar[odemeTuru].sayi += 1;
        gruplar[odemeTuru].hareketler.push(kayit);
        console.log(`✅ Eklendi: ${odemeTuru} +${kayit.tutar}`);
      } else if (kayit.tur === "HESABA_YAZ_BORC") {
        gruplar.HESABA_YAZ.toplam += Number(kayit.tutar || 0);
        gruplar.HESABA_YAZ.sayi += 1;
        gruplar.HESABA_YAZ.hareketler.push(kayit);
        console.log(`✅ Hesaba Yaz eklendi: +${kayit.tutar}`);
      }
    } else {
      console.log(`❌ Geçersiz ödeme türü: ${odemeTuru}`);
    }
  });
  
  console.log("📈 SONUÇ GRUPLARI:", gruplar);
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

  /* ------------------ TÜM GELİR HAREKETLERİ (Adisyon + Müşteri Tahsilat) ------------------ */
  const tumGelirHareketleri = useMemo(() => {
    // 1. Finans havuzundaki GELİR hareketleri
    const finansGelirleri = filtrelenmisVeriler.filter(k => k.tur === "GELIR");
    
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
        tutar: Number(t.tutar || 0),
        odemeTuru: normalizeOdemeTuru(t.odemeTuru || "NAKIT"),
        gunId: t.tarih ? new Date(t.tarih).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        kaynak: "TAHSILAT",
        referansId: t.id,
        musteriId: t.musteriId,
        masaId: null
      }));
    
    return [...finansGelirleri, ...tahsilatGelirleri]
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  }, [filtrelenmisVeriler, musteriTahsilatlari, baslangic, bitis]);

  /* ------------------ ADİSYON HAREKETLERİ (Masa Numaraları) ------------------ */
  const adisyonHareketleri = useMemo(() => {
    return filtrelenmisVeriler.filter(k => 
      (k.kaynak === "ADISYON" || k.kaynak === "BİLARDO") && k.tur !== "HESABA_YAZ_BORC"
    );
  }, [filtrelenmisVeriler]);

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
      <div style={{ padding: 50, textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: 18, marginBottom: 20 }}>💰 Kasa Raporu hazırlanıyor...</div>
        <div style={{ fontSize: 14 }}>Finans havuzu verileri okunuyor.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#7a3e06" }}>
          💰 KASA RAPORU - FİNANS HAVUZU
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          mc_finans_havuzu'ndan gelen merkezi veriler | {finansVerileri.length} kayıt
        </p>
        
        {/* YÖNETİM BUTONLARI */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button
            onClick={handleVeriAktar}
            style={{
              padding: "8px 16px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: "bold"
            }}
            title="Eski adisyon ve giderleri finans havuzuna ekler"
          >
            🔄 Veri Aktar
          </button>
          
          <button
            onClick={handleDebug}
            style={{
              padding: "8px 16px",
              background: "#9b59b6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13
            }}
            title="Finans havuzu istatistiklerini göster"
          >
            🔍 Debug
          </button>
          
          <button
            onClick={handleHavuzuTemizle}
            style={{
              padding: "8px 16px",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13
            }}
            title="Tüm finans verilerini siler (DİKKAT!)"
          >
            🗑️ Temizle
          </button>
          
          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              padding: "8px 16px",
              background: debugMode ? "#34495e" : "#7f8c8d",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13
            }}
            title="Debug panelini aç/kapat"
          >
            {debugMode ? "🔴 Debug Kapat" : "🟢 Debug Aç"}
          </button>
          
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#666" }}>
            <strong>Bugün: </strong>
            {new Date().toLocaleDateString("tr-TR")}
          </div>
        </div>
      </div>

      {/* DEBUG PANELİ */}
      {debugMode && (
        <div style={{
          background: "#2c3e50",
          color: "#ecf0f1",
          padding: 20,
          borderRadius: 8,
          marginBottom: 24,
          fontSize: 12
        }}>
          <h4 style={{ marginTop: 0, color: "#3498db" }}>🐛 DEBUG PANELİ</h4>
          
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              onClick={handleTestKaydiEkle}
              style={{ 
                padding: "6px 12px", 
                background: "#27ae60", 
                border: "none", 
                borderRadius: 4, 
                color: "white",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              ➕ Test Kaydı Ekle
            </button>
            
            <button
              onClick={handleHavuzuKontrolEt}
              style={{ 
                padding: "6px 12px", 
                background: "#3498db", 
                border: "none", 
                borderRadius: 4, 
                color: "white",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              🔍 Havuzu Kontrol Et
            </button>
            
            <button
              onClick={handleVeriKaynaklariniKontrolEt}
              style={{ 
                padding: "6px 12px", 
                background: "#9b59b6", 
                border: "none", 
                borderRadius: 4, 
                color: "white",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              📊 Veri Kaynaklarını Kontrol Et
            </button>
            
            <button
              onClick={handleTumVerileriAktar}
              style={{ 
                padding: "6px 12px", 
                background: "#e67e22", 
                border: "none", 
                borderRadius: 4, 
                color: "white",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              🔄 Tüm Verileri Aktar
            </button>
            
            <button
              onClick={handleOdemeTuruDebug}
              style={{ 
                padding: "6px 12px", 
                background: "#16a085", 
                border: "none", 
                borderRadius: 4, 
                color: "white",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              🔍 Ödeme Türü Debug
            </button>
            
            <button
              onClick={handleOdemeTurleriniDuzenle}
              style={{ 
                padding: "6px 12px", 
                background: "#8e44ad", 
                border: "none", 
                borderRadius: 4, 
                color: "white",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              🔄 Ödeme Türlerini Düzelt
            </button>
          </div>
          
          <div style={{ marginTop: 8 }}>
            <strong>📈 ANLIK DURUM:</strong><br />
            - Finans Havuzu: {finansVerileri.length} kayıt<br />
            - Giderler: {giderler.length} kayıt<br />
            - Müşteri Tahsilatları: {musteriTahsilatlari.length} kayıt<br />
            - Masalar: {masalar.length} kayıt<br />
            - Toplam Gelir: {toplamGelir.toLocaleString("tr-TR")} ₺<br />
            - Toplam Gider: {toplamGider.toLocaleString("tr-TR")} ₺<br />
            - Net Kasa: {netKasa.toLocaleString("tr-TR")} ₺
          </div>
          
          <div style={{ marginTop: 12, fontSize: 11, color: "#bdc3c7" }}>
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
        padding: 16,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        display: "flex",
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Başlangıç Tarihi</label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, minWidth: 150 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Bitiş Tarihi</label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4, minWidth: 150 }}
          />
        </div>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={() => {
              setBaslangic("");
              setBitis("");
            }}
            style={{
              padding: "8px 16px",
              background: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Filtreyi Temizle
          </button>
        </div>
      </div>

      {/* TOPLAM ÖZET (Resimdeki Panel) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <OzetKart
          baslik="Kasa Girişleri"
          deger={toplamGelir.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
          altBilgi={`${tumGelirHareketleri.length} adet gelir hareketi`}
        />
        
        <OzetKart
          baslik="Hesaba Yaz"
          deger={toplamHesabaYaz.toLocaleString("tr-TR") + " ₺"}
          renk="#e67e22"
          altBilgi={`${hesabaYazHareketleri.length} adet borç (kasaya girmez)`}
        />
        
        <OzetKart
          baslik="Toplam Gider"
          deger={toplamGider.toLocaleString("tr-TR") + " ₺"}
          renk="#e74c3c"
          altBilgi={`${filtrelenmisGiderler.length} adet gider hareketi`}
        />
        
        <OzetKart
          baslik="Net Kasa"
          deger={netKasa.toLocaleString("tr-TR") + " ₺"}
          renk={netKasa >= 0 ? "#3498db" : "#e74c3c"}
          altBilgi={netKasa >= 0 ? "✅ Pozitif bakiye" : "❌ Negatif bakiye"}
        />
      </div>

      {/* ÖDEME TÜRLERİ DAĞILIMI */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        marginBottom: 24
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, color: "#7a3e06" }}>
          💳 ÖDEME TÜRLERİ DAĞILIMI
        </h3>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12
        }}>
          {Object.entries(odemeTuruGruplari)
            .filter(([_, grup]) => grup.toplam > 0)
            .map(([tur, grup]) => {
              const odemeInfo = getOdemeTuruBilgisi(tur);
              
              return (
                <div key={tur} style={{
                  padding: 16,
                  background: "#f8f9fa",
                  borderRadius: 8,
                  borderLeft: `4px solid ${odemeInfo.renk}`
                }}>
                  <div style={{ 
                    fontSize: 14, 
                    color: "#555", 
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    {odemeInfo.icon} {odemeInfo.etiket}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: odemeInfo.renk }}>
                    {grup.toplam.toLocaleString("tr-TR")} ₺
                  </div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                    {grup.sayi} adet hareket
                    {tur === "HESABA_YAZ" && (
                      <div style={{ color: "#e67e22", marginTop: 2, fontWeight: "bold" }}>
                        Borç (kasaya girmez)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        
        {Object.values(odemeTuruGruplari).every(grup => grup.toplam === 0) && (
          <div style={{ padding: 30, textAlign: "center", color: "#999", fontStyle: "italic" }}>
            💡 Ödeme türleri dağılımı bulunamadı. <br />
            1. "Ödeme Türleri Debug" butonuyla mevcut adisyonları kontrol edin<br />
            2. "Ödeme Türlerini Düzelt" butonuyla finans kayıtlarını güncelleyin<br />
            3. Yeni adisyonlar kapatırken farklı ödeme türleri seçin
          </div>
        )}
      </div>

      {/* ADİSYON HAREKETLERİ (Masa Numaraları) */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        overflow: "hidden",
        marginBottom: 24
      }}>
        <div style={{
          background: "#f1e2c6",
          padding: 16,
          borderBottom: "1px solid #ddd"
        }}>
          <h3 style={{ margin: 0, color: "#7a3e06" }}>
            🪑 ADİSYON HAREKETLERİ ({adisyonHareketleri.length} adet)
          </h3>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Kapanan Masa ve Bilardo Numaraları
          </div>
        </div>
        
        {adisyonHareketleri.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#777" }}>
            📭 Seçilen tarih aralığında adisyon hareketi bulunamadı
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead style={{ background: "#f9f5ec" }}>
                <tr>
                  <Th>Masa No</Th>
                  <Th>Tür</Th>
                  <Th>Tarih</Th>
                  <Th>Ödeme Türü</Th>
                  <Th align="right">Tutar</Th>
                </tr>
              </thead>
              
              <tbody>
                {adisyonHareketleri.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const masaNumarasi = getMasaNumarasi(hareket.masaId, hareket.kaynak, hareket.aciklama);
                  const odemeInfo = getOdemeTuruBilgisi(hareket.odemeTuru);
                  const isBilardo = hareket.kaynak === "BİLARDO";
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: i % 2 === 0 ? "#fff" : "#faf5ea",
                      borderBottom: "1px solid #eee"
                    }}>
                      <Td>
                        <div style={{ fontWeight: "bold", fontSize: 14 }}>
                          {masaNumarasi}
                        </div>
                      </Td>
                      <Td>
                        <span style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: "bold",
                          background: isBilardo ? "#e8f4f8" : "#f5f5f5",
                          color: isBilardo ? "#3498db" : "#7a3e06",
                          display: "inline-block"
                        }}>
                          {isBilardo ? "🎱 BİLARDO" : "🪑 MASA"}
                        </span>
                      </Td>
                      <Td>
                        {tarih.toLocaleDateString("tr-TR")}
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {tarih.toLocaleTimeString("tr-TR", { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </Td>
                      <Td>
                        <span style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: "bold",
                          background: odemeInfo.renk + "20",
                          color: odemeInfo.renk,
                          border: `1px solid ${odemeInfo.renk}40`,
                          display: "inline-block"
                        }}>
                          {odemeInfo.icon} {odemeInfo.etiket}
                        </span>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 15,
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
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden",
          marginBottom: 24
        }}>
          <div style={{
            background: "#e8f8f1",
            padding: 16,
            borderBottom: "1px solid #ddd"
          }}>
            <h3 style={{ margin: 0, color: "#27ae60" }}>
              💰 GELİR HAREKETLERİ ({tumGelirHareketleri.length} adet)
            </h3>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Tüm kasa girişleri (Adisyon + Müşteri Tahsilat)
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead style={{ background: "#f0f9f5" }}>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Açıklama</Th>
                  <Th>Masa/Müşteri</Th>
                  <Th>Ödeme Türü</Th>
                  <Th align="right">Tutar</Th>
                </tr>
              </thead>
              
              <tbody>
                {tumGelirHareketleri.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const odemeInfo = getOdemeTuruBilgisi(hareket.odemeTuru);
                  const isTahsilat = hareket.kaynak === "TAHSILAT";
                  const isBilardo = hareket.kaynak === "BİLARDO";
                  
                  let masaMusteriBilgisi = "";
                  
                  if (isTahsilat) {
                    // Müşteri tahsilatı
                    const musteriAdi = hareket.aciklama.replace("Müşteri Tahsilat - ", "");
                    masaMusteriBilgisi = musteriAdi;
                  } else {
                    // Adisyon veya Bilardo
                    masaMusteriBilgisi = getMasaNumarasi(hareket.masaId, hareket.kaynak, hareket.aciklama);
                  }
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: i % 2 === 0 ? "#fff" : "#f8f9fa",
                      borderBottom: "1px solid #eee"
                    }}>
                      <Td>
                        {tarih.toLocaleDateString("tr-TR")}
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {tarih.toLocaleTimeString("tr-TR")}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ fontWeight: "500" }}>
                          {hareket.aciklama}
                          {isBilardo && (
                            <span style={{ 
                              marginLeft: 8,
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 11,
                              background: "#e8f4f8",
                              color: "#3498db"
                            }}>
                              🎱 BİLARDO
                            </span>
                          )}
                          {isTahsilat && (
                            <span style={{ 
                              marginLeft: 8,
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 11,
                              background: "#e8f4f8",
                              color: "#9b59b6"
                            }}>
                              👤 MÜŞTERİ
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {masaMusteriBilgisi}
                        {!isTahsilat && hareket.masaId && (
                          <div style={{ fontSize: 11, color: "#666" }}>
                            ID: {hareket.masaId}
                          </div>
                        )}
                        {isTahsilat && hareket.musteriId && (
                          <div style={{ fontSize: 11, color: "#666" }}>
                            Müşteri ID: {hareket.musteriId}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <span style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          background: odemeInfo.renk + "20",
                          color: odemeInfo.renk,
                          border: `1px solid ${odemeInfo.renk}40`
                        }}>
                          {odemeInfo.icon} {odemeInfo.etiket}
                        </span>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
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
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden",
          marginBottom: 24
        }}>
          <div style={{
            background: "#fff3cd",
            padding: 16,
            borderBottom: "1px solid #ddd"
          }}>
            <h3 style={{ margin: 0, color: "#e67e22" }}>
              📝 HESABA YAZ BORÇLARI ({hesabaYazHareketleri.length} adet)
            </h3>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Borç yazılan tutarlar (kasaya girmez)
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead style={{ background: "#fff8e1" }}>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Açıklama</Th>
                  <Th>Masa</Th>
                  <Th align="right">Borç Tutarı</Th>
                </tr>
              </thead>
              
              <tbody>
                {hesabaYazHareketleri.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const masaNumarasi = getMasaNumarasi(hareket.masaId, hareket.kaynak, hareket.aciklama);
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: i % 2 === 0 ? "#fff" : "#fffaf0",
                      borderBottom: "1px solid #eee"
                    }}>
                      <Td>
                        {tarih.toLocaleDateString("tr-TR")}
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {tarih.toLocaleTimeString("tr-TR")}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ fontWeight: "500" }}>
                          {hareket.aciklama}
                        </div>
                        <div style={{ fontSize: 11, color: "#666" }}>
                          Borç Kaydı (Kasaya girmez)
                        </div>
                      </Td>
                      <Td>
                        {masaNumarasi}
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        color: "#e67e22",
                        fontSize: 15
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
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden"
        }}>
          <div style={{
            background: "#f1e2c6",
            padding: 16,
            borderBottom: "1px solid #ddd"
          }}>
            <h3 style={{ margin: 0, color: "#7a3e06" }}>
              📝 GİDERLER ({filtrelenmisGiderler.length} adet)
            </h3>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead style={{ background: "#f9f5ec" }}>
                <tr>
                  <Th>Tarih</Th>
                  <Th>Açıklama</Th>
                  <Th>Kategori</Th>
                  <Th align="right">Tutar</Th>
                  <Th>Not</Th>
                </tr>
              </thead>
              
              <tbody>
                {filtrelenmisGiderler.map((gider, i) => (
                  <tr key={gider.id || i} style={{
                    background: i % 2 === 0 ? "#fff" : "#faf5ea",
                    borderBottom: "1px solid #eee"
                  }}>
                    <Td>
                      {gider.tarih ? new Date(gider.tarih).toLocaleDateString("tr-TR") : "Belirtilmemiş"}
                    </Td>
                    <Td>
                      <div style={{ fontWeight: "500" }}>
                        {gider.aciklama || "Gider"}
                      </div>
                    </Td>
                    <Td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background: "#fdecea",
                        color: "#e74c3c"
                      }}>
                        {gider.kategori || "Genel"}
                      </span>
                    </Td>
                    <Td align="right" style={{ fontWeight: "bold", color: "#e74c3c" }}>
                      {Number(gider.tutar || 0).toLocaleString("tr-TR")} ₺
                    </Td>
                    <Td style={{ fontSize: 12, color: "#666" }}>
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
        marginTop: 24, 
        paddingTop: 16, 
        borderTop: "1px solid #eee",
        fontSize: 12, 
        color: "#777" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <strong>🎯 KASA RAPORU MANTIĞI:</strong>
            <div style={{ marginTop: 4, lineHeight: 1.6 }}>
              1️⃣ Tüm veriler <code>mc_finans_havuzu</code>'ndan okunur<br />
              2️⃣ Ödeme türleri adisyon kapanışında belirlenir<br />
              3️⃣ Hesaba Yaz → borçtur, kasaya girmez<br />
              4️⃣ Tüm raporlar aynı veriden beslenir → tutarlılık
            </div>
          </div>
          
          <div style={{ textAlign: "right", minWidth: 200 }}>
            <div><strong>📅 Son güncelleme:</strong> {new Date().toLocaleString("tr-TR")}</div>
            <div style={{ marginTop: 4 }}>
              <strong>💰 Kasa Özeti:</strong><br />
              Gelir: <span style={{ color: "#2ecc71", fontWeight: "bold" }}>
                {toplamGelir.toLocaleString("tr-TR")} ₺
              </span><br />
              Gider: <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                {toplamGider.toLocaleString("tr-TR")} ₺
              </span><br />
              Net: <span style={{ 
                color: netKasa >= 0 ? "#2ecc71" : "#e74c3c",
                fontWeight: "bold",
                fontSize: "14px"
              }}>
                {netKasa.toLocaleString("tr-TR")} ₺
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KasaRaporu;

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk, altBilgi }) => (
  <div style={{
    background: "#fff",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
    borderLeft: `4px solid ${renk}`
  }}>
    <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
      {baslik}
    </div>
    <div style={{ fontSize: 22, fontWeight: "bold", color: renk }}>
      {deger}
    </div>
    {altBilgi && (
      <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>
        {altBilgi}
      </div>
    )}
  </div>
);

const Th = ({ children, align }) => (
  <th style={{
    padding: 12,
    textAlign: align || "left",
    borderBottom: "1px solid #ddd",
    fontSize: 14,
    fontWeight: 600,
    color: "#7a3e06"
  }}>
    {children}
  </th>
);

const Td = ({ children, align }) => (
  <td style={{
    padding: 12,
    textAlign: align || "left",
    borderBottom: "1px solid #eee",
    fontSize: 14
  }}>
    {children}
  </td>
);