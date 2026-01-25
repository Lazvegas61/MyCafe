import React, { useEffect, useMemo, useState } from "react";

/*
  KASA RAPORU - FİNAL MİMARİ (TAM SAYFA)
  ---------------------------------------
  - TEK kaynak: mc_finans_havuzu (localStorage)
  - SADECE okuma - HİÇBİR yazma/değiştirme YOK
  - Hesaba Yaz: Bilgi amaçlı (kasaya girmez)
  - İndirimler ayrı panelde gösterilir
  - Açıklama sütunu kaldırıldı
*/

const KasaRaporu = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [finansVerileri, setFinansVerileri] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [adisyonlar, setAdisyonlar] = useState([]);

  /* ------------------ TEK KAYNAK: mc_finans_havuzu OKU ------------------ */
  useEffect(() => {
    console.log("💰 KasaRaporu: TEK KAYNAK okunuyor...");
    
    // TEK KAYNAK - SADECE mc_finans_havuzu
    const havuzData = localStorage.getItem("mc_finans_havuzu");
    const finansVerileri = havuzData ? JSON.parse(havuzData) : [];
    
    // Masa numarası bulmak için adisyonlar (SADECE OKUMA)
    const adisyonlarData = JSON.parse(localStorage.getItem("mc_adisyonlar") || "[]");
    
    setFinansVerileri(finansVerileri);
    setAdisyonlar(adisyonlarData);
    setYukleniyor(false);
    
    console.log(`📊 Finans havuzu: ${finansVerileri.length} kayıt`);
    console.log(`📋 Adisyonlar: ${adisyonlarData.length} kayıt (sadece masa bulma için)`);
    
  }, []);

  /* ------------------ PURE FİLTRELEME FONKSİYONLARI ------------------ */
  const tariheGoreFiltrele = (veriler, baslangicTarih, bitisTarih) => {
    if (!baslangicTarih && !bitisTarih) {
      return veriler;
    }
    
    return veriler.filter(kayit => {
      const kayitTarihStr = kayit.tarih ? new Date(kayit.tarih).toISOString().split('T')[0] : "";
      
      if (baslangicTarih && kayitTarihStr < baslangicTarih) return false;
      if (bitisTarih && kayitTarihStr > bitisTarih) return false;
      
      return true;
    });
  };

  /* ------------------ FİLTRELENMİŞ VERİLER ------------------ */
  const filtrelenmisVeriler = useMemo(() => {
    return tariheGoreFiltrele(finansVerileri, baslangic, bitis);
  }, [finansVerileri, baslangic, bitis]);

  /* ------------------ TEMEL HESAPLAMALAR ------------------ */
  const toplamGelir = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.odemeTuru !== "HESABA_YAZ")
      .reduce((toplam, kayit) => toplam + (Number(kayit.tutar) || 0), 0);
  }, [filtrelenmisVeriler]);

  const toplamGider = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GIDER")
      .reduce((toplam, kayit) => toplam + (Number(kayit.tutar) || 0), 0);
  }, [filtrelenmisVeriler]);

  const toplamIndirim = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "INDIRIM")
      .reduce((toplam, kayit) => toplam + (Number(kayit.tutar) || 0), 0);
  }, [filtrelenmisVeriler]);

  /* ------------------ HESABA YAZ TOPLAMI (BİLGİ AMAÇLI - KASAYA GİRMEZ) ------------------ */
  const toplamHesabaYaz = useMemo(() => {
    return filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.odemeTuru === "HESABA_YAZ")
      .reduce((toplam, k) => toplam + (Number(k.tutar) || 0), 0);
  }, [filtrelenmisVeriler]);

  const netKasa = toplamGelir - toplamGider;
  const brutCiro = toplamGelir + toplamIndirim;

  /* ------------------ GÜNLÜK KASA TOPLAMLARI (ANA PANEL) ------------------ */
  const gunlukKasaToplamlari = useMemo(() => {
    const kayitlar = filtrelenmisVeriler;
    
    const gunlukGruplar = {};
    
    kayitlar.forEach(kayit => {
      const gunId = kayit.gunId || (kayit.tarih ? new Date(kayit.tarih).toISOString().split('T')[0] : "");
      if (!gunId) return;
      
      if (!gunlukGruplar[gunId]) {
        gunlukGruplar[gunId] = {
          tarih: gunId,
          gunAdi: new Date(gunId).toLocaleDateString("tr-TR", { weekday: 'long' }),
          toplamGelir: 0,
          toplamGider: 0,
          toplamIndirim: 0,
          toplamHesabaYaz: 0,
          adisyonSayisi: 0,
          tahsilatSayisi: 0,
          hesabaYazSayisi: 0,
          hareketler: []
        };
      }
      
      gunlukGruplar[gunId].hareketler.push(kayit);
      
      if (kayit.tur === "GELIR") {
        if (kayit.odemeTuru === "HESABA_YAZ") {
          // Hesaba yaz - sadece bilgi amaçlı toplam
          gunlukGruplar[gunId].toplamHesabaYaz += Number(kayit.tutar || 0);
          gunlukGruplar[gunId].hesabaYazSayisi += 1;
        } else {
          // Normal gelir (ciroya girer)
          gunlukGruplar[gunId].toplamGelir += Number(kayit.tutar || 0);
          if (kayit.kaynak === "ADISYON" || kayit.kaynak === "BİLARDO") {
            gunlukGruplar[gunId].adisyonSayisi += 1;
          } else if (kayit.kaynak === "TAHSILAT") {
            gunlukGruplar[gunId].tahsilatSayisi += 1;
          }
        }
      } else if (kayit.tur === "GIDER") {
        gunlukGruplar[gunId].toplamGider += Number(kayit.tutar || 0);
      } else if (kayit.tur === "INDIRIM") {
        gunlukGruplar[gunId].toplamIndirim += Number(kayit.tutar || 0);
      }
    });
    
    return Object.values(gunlukGruplar).sort((a, b) => 
      new Date(b.tarih) - new Date(a.tarih)
    );
  }, [filtrelenmisVeriler]);

  /* ------------------ ÖDEME TÜRLERİ DAĞILIMI (HESABA_YAZ HARİÇ) ------------------ */
  const odemeTuruDagilimi = useMemo(() => {
    const dagilim = {};
    
    filtrelenmisVeriler
      .filter(k => k.tur === "GELIR" && k.odemeTuru && k.odemeTuru !== "HESABA_YAZ")
      .forEach(kayit => {
        const tur = kayit.odemeTuru.toUpperCase();
        if (!dagilim[tur]) {
          dagilim[tur] = { toplam: 0, sayi: 0 };
        }
        dagilim[tur].toplam += Number(kayit.tutar || 0);
        dagilim[tur].sayi += 1;
      });
    
    return dagilim;
  }, [filtrelenmisVeriler]);

  /* ------------------ ÖDEME TÜRÜ BİLGİSİ ------------------ */
  const getOdemeTuruBilgisi = (tip) => {
    if (!tip) return { etiket: "Nakit", renk: "#2ecc71", icon: "💵" };
    
    const tipUpper = tip.toUpperCase();
    
    if (tipUpper.includes("NAKİT") || tipUpper.includes("NAKIT")) {
      return { etiket: "Nakit", renk: "#2ecc71", icon: "💵" };
    }
    
    if (tipUpper.includes("KART")) {
      return { etiket: "Kart", renk: "#3498db", icon: "💳" };
    }
    
    if (tipUpper.includes("HAVALE")) {
      return { etiket: "Havale", renk: "#9b59b6", icon: "🏦" };
    }
    
    if (tipUpper === "HESABA_YAZ") {
      return { etiket: "Hesaba Yaz", renk: "#f39c12", icon: "📝" };
    }
    
    return { etiket: tip, renk: "#95a5a6", icon: "💰" };
  };

  /* ------------------ MASA NUMARASI BULMA (GÜNCELLENDİ) ------------------ */
  const getMasaNumarasi = (hareket) => {
    const { masaId, masaNo, aciklama, kaynak, odemeTuru, adisyonId, referansId } = hareket;
    
    // DEBUG: Hareket bilgilerini konsola yaz
    console.log("🔍 Masa bulma için hareket:", {
      id: hareket.id,
      odemeTuru,
      adisyonId,
      referansId,
      masaId,
      masaNo,
      aciklama
    });
    
    // 1. Direkt masaId varsa
    if (masaId && masaId !== "null" && masaId !== "undefined" && masaId !== "") {
      console.log("✅ Direkt masaId bulundu:", masaId);
      return `Masa ${masaId}`;
    }
    
    // 2. masaNo varsa
    if (masaNo && masaNo !== "null" && masaNo !== "undefined" && masaNo !== "") {
      console.log("✅ masaNo bulundu:", masaNo);
      return `Masa ${masaNo}`;
    }
    
    // 3. HESABA_YAZ → adisyon üzerinden masa bul (ÖNEMLİ)
    if (odemeTuru === "HESABA_YAZ") {
      const targetAdisyonId = adisyonId || referansId;
      if (targetAdisyonId) {
        console.log("🔎 HESABA_YAZ için adisyon aranıyor:", targetAdisyonId);
        const adisyon = adisyonlar.find(a => a.id === targetAdisyonId);
        if (adisyon) {
          console.log("✅ HESABA_YAZ adisyon bulundu:", adisyon);
          if (adisyon.masaNo && adisyon.masaNo !== "null") {
            return `Masa ${adisyon.masaNo}`;
          }
          if (adisyon.masaId && adisyon.masaId !== "null") {
            return `Masa ${adisyon.masaId}`;
          }
          if (adisyon.masaNumarasi && adisyon.masaNumarasi !== "null") {
            return `Masa ${adisyon.masaNumarasi}`;
          }
        } else {
          console.warn("❌ HESABA_YAZ için adisyon bulunamadı:", targetAdisyonId);
        }
      } else {
        console.warn("❌ HESABA_YAZ için adisyonId veya referansId yok");
      }
    }
    
    // 4. Kaynak Bilardo ise
    if (kaynak === "BİLARDO") {
      return `Bilardo ${masaId || ""}`;
    }
    
    // 5. Açıklamadan regex ile arama
    if (aciklama) {
      console.log("🔎 Açıklamadan masa aranıyor:", aciklama);
      const masaMatch = aciklama.match(/MASA\s+(\d+)/i) || 
                       aciklama.match(/Masa\s+(\d+)/i) ||
                       aciklama.match(/#(\d+)/i) ||
                       aciklama.match(/masa(\d+)/i);
      
      if (masaMatch && masaMatch[1]) {
        console.log("✅ Açıklamadan masa bulundu:", masaMatch[1]);
        return `Masa ${masaMatch[1]}`;
      }
      
      // Bilardo deseni
      const bilardoMatch = aciklama.match(/Bilardo\s+(\d+)/i) ||
                          aciklama.match(/BİLARDO\s+(\d+)/i);
      if (bilardoMatch && bilardoMatch[1]) {
        return `Bilardo ${bilardoMatch[1]}`;
      }
    }
    
    // 6. HESABA_YAZ ise özel etiket
    if (odemeTuru === "HESABA_YAZ") {
      console.log("ℹ️ HESABA_YAZ işlemi için varsayılan etiket");
      return "Müşteri Borcu";
    }
    
    // 7. Hiçbiri yoksa
    console.warn("⚠️ Masa bulunamadı, varsayılan döndürülüyor");
    return "Masa Yok";
  };

  /* ------------------ ADİSYON HAREKETLERİ (HESABA_YAZ DAHİL) ------------------ */
  const adisyonlarIndirimli = useMemo(() => {
    // TÜM GELİR kayıtları (ADİSYON, BİLARDO, HESABA_YAZ dahil)
    const ilgiliKayitlar = filtrelenmisVeriler.filter(k =>
      k.tur === "GELIR" && (
        k.kaynak === "ADISYON" ||
        k.kaynak === "BİLARDO" ||
        k.odemeTuru === "HESABA_YAZ"
      )
    );
    
    // İndirim kayıtları (adisyonId ile eşleşen)
    const indirimler = filtrelenmisVeriler
      .filter(k => k.tur === "INDIRIM")
      .reduce((acc, indirim) => {
        const targetAdisyonId = indirim.adisyonId || indirim.referansId;
        if (targetAdisyonId) {
          acc[targetAdisyonId] = (acc[targetAdisyonId] || 0) + (Number(indirim.tutar) || 0);
        }
        return acc;
      }, {});
    
    const sonuc = ilgiliKayitlar.map(hareket => {
      const indirimTutari = indirimler[hareket.adisyonId] || indirimler[hareket.id] || 0;
      const brutTutar = Number(hareket.tutar || 0) + indirimTutari;
      const isHesabaYaz = hareket.odemeTuru === "HESABA_YAZ";
      
      // DEBUG: Her hareket için konsol çıktısı
      console.log("📝 Adisyon hareketi işleniyor:", {
        id: hareket.id,
        odemeTuru: hareket.odemeTuru,
        adisyonId: hareket.adisyonId,
        referansId: hareket.referansId,
        isHesabaYaz: isHesabaYaz,
        indirim: indirimTutari
      });
      
      return {
        ...hareket,
        masaNumarasi: getMasaNumarasi(hareket),
        odemeTuru: hareket.odemeTuru,
        kaynak: hareket.kaynak,
        indirim: indirimTutari,
        brutTutar: brutTutar,
        netTutar: Number(hareket.tutar || 0),
        isHesabaYaz: isHesabaYaz,
        isBilardo: hareket.kaynak === "BİLARDO"
      };
    })
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    
    console.log("📊 Adisyon hareketleri sonuç:", sonuc.map(s => ({
      id: s.id,
      masaNumarasi: s.masaNumarasi,
      odemeTuru: s.odemeTuru,
      isHesabaYaz: s.isHesabaYaz
    })));
    
    return sonuc;
  }, [filtrelenmisVeriler, adisyonlar]);

  /* ------------------ YÜKLENİYOR DURUMU ------------------ */
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
            💰 KASA RAPORU HAZIRLANIYOR
          </div>
          <div style={{ fontSize: 16, marginBottom: 30 }}>
            TEK KAYNAK: mc_finans_havuzu okunuyor
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
              💰 KASA RAPORU - FİNAL MİMARİ
            </h2>
            <p style={{ 
              marginTop: 10, 
              color: "#666", 
              fontSize: 17,
              lineHeight: 1.5
            }}>
              TEK KAYNAK: mc_finans_havuzu | 
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
      </div>

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

      {/* TARİH BİLGİSİ */}
      <div
        style={{
          background: "#f5e7d0",
          padding: 16,
          borderRadius: 10,
          marginBottom: 32,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 500
        }}
      >
        <strong>{baslangic && bitis ? `${baslangic} - ${bitis}` : "Tüm zamanlar"}</strong> tarih aralığına ait veriler görüntülenmektedir.
        {baslangic || bitis ? ` (${filtrelenmisVeriler.length} kayıt)` : ""}
      </div>

      {/* TEMEL METRİKLER - HESABA YAZ DAHİL */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginBottom: 40
        }}
      >
        <OzetKart
          baslik="Toplam Gelir"
          deger={toplamGelir}
          renk="#2ecc71"
          icon="💰"
          aciklama={`${filtrelenmisVeriler.filter(k => k.tur === "GELIR" && k.odemeTuru !== "HESABA_YAZ").length} gelir kaydı`}
        />
        <OzetKart
          baslik="Net Kasa"
          deger={netKasa}
          renk={netKasa >= 0 ? "#3498db" : "#e74c3c"}
          icon={netKasa >= 0 ? "📈" : "📉"}
          aciklama={`Gelir: ${toplamGelir.toLocaleString("tr-TR")} ₺ - Gider: ${toplamGider.toLocaleString("tr-TR")} ₺`}
        />
        <OzetKart
          baslik="Toplam Gider"
          deger={toplamGider}
          renk="#e74c3c"
          icon="💸"
          aciklama={`${filtrelenmisVeriler.filter(k => k.tur === "GIDER").length} gider kaydı`}
        />
        <OzetKart
          baslik="Toplam İndirim"
          deger={toplamIndirim}
          renk="#9b59b6"
          icon="🎁"
          aciklama={`${filtrelenmisVeriler.filter(k => k.tur === "INDIRIM").length} indirim kaydı`}
        />
        <OzetKart
          baslik="Brüt Ciro"
          deger={brutCiro}
          renk="#1abc9c"
          icon="📊"
          aciklama={`Gelir + İndirim`}
        />
        <OzetKart
          baslik="Hesaba Yaz Toplamı"
          deger={toplamHesabaYaz}
          renk="#f39c12"
          icon="📝"
          aciklama="Kasaya girmeyen borç işlemleri"
        />
      </div>

      {/* SIRA 1: ADİSYON HAREKETLERİ (HESABA_YAZ DAHİL) */}
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
              1️⃣ ADİSYON HAREKETLERİ (HESABA_YAZ DAHİL)
            </h3>
            <div style={{ 
              fontSize: 16, 
              color: "#666", 
              background: "rgba(255,255,255,0.8)",
              padding: "8px 16px",
              borderRadius: 20,
              fontWeight: "600"
            }}>
              {adisyonlarIndirimli.length} adet
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            Normal Adisyonlar + Bilardo + Hesaba Yaz İşlemleri | Turuncu: Hesaba Yaz
          </div>
        </div>
        
        {adisyonlarIndirimli.length === 0 ? (
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
              Tarih filtresini değiştirin veya yeni adisyonlar kapatın.
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
                  <Th style={{ width: "18%" }}>Masa No</Th>
                  <Th style={{ width: "18%" }}>Tarih</Th>
                  <Th style={{ width: "20%" }}>Ödeme Türü</Th>
                  <Th style={{ width: "14%" }} align="right">Brüt Tutar</Th>
                  <Th style={{ width: "14%" }} align="right">İndirim</Th>
                  <Th style={{ width: "16%" }} align="right">Net Tutar</Th>
                </tr>
              </thead>
              
              <tbody>
                {adisyonlarIndirimli.map((hareket, i) => {
                  const tarih = hareket.tarih ? new Date(hareket.tarih) : new Date();
                  const odemeInfo = getOdemeTuruBilgisi(hareket.odemeTuru);
                  const hasIndirim = hareket.indirim > 0;
                  const isHesabaYaz = hareket.isHesabaYaz;
                  const isBilardo = hareket.isBilardo;
                  
                  return (
                    <tr key={hareket.id} style={{
                      background: isHesabaYaz ? "#fff9e6" : 
                                 hasIndirim ? "#fff5f5" : 
                                 (i % 2 === 0 ? "#fff" : "#faf5ea"),
                      borderBottom: "1px solid #eee",
                      borderLeft: isHesabaYaz ? "4px solid #f39c12" : 
                                 hasIndirim ? "4px solid #e74c3c" : "none",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isHesabaYaz ? "#fff4d1" : 
                                         hasIndirim ? "#ffeaea" : "#fef8e8";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isHesabaYaz ? "#fff9e6" : 
                                         hasIndirim ? "#fff5f5" : 
                                         (i % 2 === 0 ? "#fff" : "#faf5ea");
                    }}>
                      <Td>
                        <div style={{ 
                          fontWeight: "bold", 
                          fontSize: 16,
                          color: isHesabaYaz ? "#f39c12" : 
                                 hasIndirim ? "#e74c3c" : "#7a3e06"
                        }}>
                          {hareket.masaNumarasi}
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {isHesabaYaz && (
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                background: "#f39c12",
                                color: "white",
                                fontWeight: "bold"
                              }}>
                                HESABA YAZ
                              </span>
                            )}
                            {isBilardo && (
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                background: "#3498db",
                                color: "white",
                                fontWeight: "bold"
                              }}>
                                🎱 BİLARDO
                              </span>
                            )}
                            {hasIndirim && !isHesabaYaz && (
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                background: "#e74c3c",
                                color: "white",
                                fontWeight: "bold"
                              }}>
                                İNDİRİMLİ
                              </span>
                            )}
                          </div>
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
                        fontSize: 16,
                        color: isHesabaYaz ? "#f39c12" : "#666",
                        textDecoration: hasIndirim ? "line-through" : "none"
                      }}>
                        {hasIndirim && !isHesabaYaz ? (
                          <>
                            {hareket.brutTutar.toLocaleString("tr-TR")} ₺
                            <div style={{ 
                              fontSize: 11, 
                              color: "#999",
                              marginTop: 2
                            }}>
                              indirim öncesi
                            </div>
                          </>
                        ) : (
                          <>
                            {hareket.netTutar.toLocaleString("tr-TR")} ₺
                            {isHesabaYaz && (
                              <div style={{ 
                                fontSize: 11, 
                                color: "#f39c12",
                                marginTop: 2
                              }}>
                                borç kaydı
                              </div>
                            )}
                          </>
                        )}
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: hasIndirim ? "#9b59b6" : "#999"
                      }}>
                        {hasIndirim && !isHesabaYaz ? (
                          <>
                            -{hareket.indirim.toLocaleString("tr-TR")} ₺
                            <div style={{ 
                              fontSize: 12, 
                              color: "#9b59b6",
                              marginTop: 4
                            }}>
                              %{((hareket.indirim / hareket.brutTutar) * 100).toFixed(1)}
                            </div>
                          </>
                        ) : (
                          "0 ₺"
                        )}
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 18,
                        color: isHesabaYaz ? "#f39c12" : 
                               hasIndirim ? "#e74c3c" : "#2ecc71"
                      }}>
                        {hareket.netTutar.toLocaleString("tr-TR")} ₺
                        {isHesabaYaz && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#f39c12",
                            marginTop: 4
                          }}>
                            kasaya girmez
                          </div>
                        )}
                        {hasIndirim && !isHesabaYaz && (
                          <div style={{ 
                            fontSize: 12, 
                            color: "#e74c3c",
                            marginTop: 4
                          }}>
                            indirimli
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SIRA 2: GÜNLÜK KASA TOPLAMLARI */}
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
            2️⃣ GÜNLÜK KASA TOPLAMLARI
          </h3>
          <span style={{ 
            fontSize: 14, 
            color: "#666", 
            background: "#f8f9fa",
            padding: "6px 12px",
            borderRadius: 20,
            fontWeight: "500"
          }}>
            {gunlukKasaToplamlari.length} gün
          </span>
        </div>
        
        {gunlukKasaToplamlari.length === 0 ? (
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
              📭 Seçilen tarih aralığında günlük veri bulunamadı
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              minWidth: 1100 
            }}>
              <thead style={{ background: "#e8f4f8" }}>
                <tr>
                  <Th style={{ width: "12%" }}>Tarih</Th>
                  <Th style={{ width: "8%" }}>Gün</Th>
                  <Th style={{ width: "14%" }} align="right">Gelir</Th>
                  <Th style={{ width: "12%" }} align="right">Gider</Th>
                  <Th style={{ width: "12%" }} align="right">İndirim</Th>
                  <Th style={{ width: "12%" }} align="right">Hesaba Yaz</Th>
                  <Th style={{ width: "12%" }} align="right">Adisyon/Tahsilat</Th>
                  <Th style={{ width: "12%" }} align="right">Net Kasa</Th>
                </tr>
              </thead>
              
              <tbody>
                {gunlukKasaToplamlari.map((gun, index) => {
                  const netKasaGun = gun.toplamGelir - gun.toplamGider;
                  
                  return (
                    <tr key={gun.tarih} style={{
                      background: index % 2 === 0 ? "#fff" : "#f8f9fa",
                      borderBottom: "1px solid #eee",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#f0f9ff";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#f8f9fa";
                    }}>
                      <Td>
                        <div style={{ 
                          fontWeight: "600",
                          fontSize: 15
                        }}>
                          {new Date(gun.tarih).toLocaleDateString("tr-TR", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      </Td>
                      <Td>
                        <span style={{
                          padding: "8px 12px",
                          borderRadius: 20,
                          fontSize: 13,
                          background: "#e8f4f8",
                          color: "#3498db",
                          fontWeight: "bold",
                          display: "inline-block",
                          textTransform: "capitalize"
                        }}>
                          {gun.gunAdi}
                        </span>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: "#2ecc71"
                      }}>
                        {gun.toplamGelir.toLocaleString("tr-TR")} ₺
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: "#e74c3c"
                      }}>
                        {gun.toplamGider.toLocaleString("tr-TR")} ₺
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: "#9b59b6"
                      }}>
                        {gun.toplamIndirim.toLocaleString("tr-TR")} ₺
                        <div style={{ 
                          fontSize: 12, 
                          color: "#999",
                          marginTop: 4
                        }}>
                          {gun.toplamIndirim > 0 ? "İndirimli" : "-"}
                        </div>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: "#f39c12"
                      }}>
                        {gun.toplamHesabaYaz.toLocaleString("tr-TR")} ₺
                        <div style={{ 
                          fontSize: 12, 
                          color: "#f39c12",
                          marginTop: 4
                        }}>
                          {gun.hesabaYazSayisi} adet
                        </div>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: "#e67e22"
                      }}>
                        <div>{gun.adisyonSayisi} adisyon</div>
                        <div style={{ 
                          fontSize: 12, 
                          color: "#3498db",
                          marginTop: 4
                        }}>
                          {gun.tahsilatSayisi} tahsilat
                        </div>
                      </Td>
                      <Td align="right" style={{ 
                        fontWeight: "bold", 
                        fontSize: 16,
                        color: netKasaGun >= 0 ? "#3498db" : "#e74c3c"
                      }}>
                        {netKasaGun.toLocaleString("tr-TR")} ₺
                        <div style={{ 
                          fontSize: 12, 
                          color: netKasaGun >= 0 ? "#2ecc71" : "#e74c3c",
                          fontWeight: "600",
                          marginTop: 4
                        }}>
                          {netKasaGun >= 0 ? "✅ Pozitif" : "❌ Negatif"}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
                
                <tr style={{ 
                  background: "#f8f5e8", 
                  borderTop: "2px solid #7a3e06",
                  fontWeight: "bold"
                }}>
                  <Td colSpan="2" style={{ fontSize: 16, color: "#7a3e06" }}>
                    📊 TOPLAM
                  </Td>
                  <Td align="right" style={{ fontSize: 16, color: "#2ecc71" }}>
                    {gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.toplamGelir, 0).toLocaleString("tr-TR")} ₺
                  </Td>
                  <Td align="right" style={{ fontSize: 16, color: "#e74c3c" }}>
                    {gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.toplamGider, 0).toLocaleString("tr-TR")} ₺
                  </Td>
                  <Td align="right" style={{ fontSize: 16, color: "#9b59b6" }}>
                    {gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.toplamIndirim, 0).toLocaleString("tr-TR")} ₺
                  </Td>
                  <Td align="right" style={{ fontSize: 16, color: "#f39c12" }}>
                    {gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.toplamHesabaYaz, 0).toLocaleString("tr-TR")} ₺
                    <div style={{ fontSize: 12, color: "#f39c12" }}>
                      {gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.hesabaYazSayisi, 0)} adet
                    </div>
                  </Td>
                  <Td align="right" style={{ fontSize: 16, color: "#e67e22" }}>
                    <div>{gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.adisyonSayisi, 0)} adisyon</div>
                    <div style={{ fontSize: 12, color: "#3498db" }}>
                      {gunlukKasaToplamlari.reduce((sum, gun) => sum + gun.tahsilatSayisi, 0)} tahsilat
                    </div>
                  </Td>
                  <Td align="right" style={{ fontSize: 18, color: "#7a3e06" }}>
                    {gunlukKasaToplamlari.reduce((sum, gun) => sum + (gun.toplamGelir - gun.toplamGider), 0).toLocaleString("tr-TR")} ₺
                  </Td>
                </tr>
              </tbody>
            </table>
            
            {/* HESABA YAZ AÇIKLAMASI */}
            <div style={{
              marginTop: 24,
              padding: 16,
              background: "#fff9e6",
              borderRadius: 8,
              fontSize: 14,
              color: "#f39c12",
              borderLeft: "4px solid #f39c12"
            }}>
              <strong>📝 Hesaba Yaz Bilgilendirmesi:</strong> 
              "Hesaba Yaz" işlemleri artık <strong>Adisyon Hareketleri</strong> tablosunda görüntülenmektedir. 
              Bu tutarlar kasaya girmez ve ciro hesaplamalarına dahil edilmez. 
              Sadece gün içinde oluşturulan borç işlemlerini gösterir.
            </div>
          </div>
        )}
      </div>

      {/* SIRA 3: ÖDEME TÜRLERİ DAĞILIMI (HESABA_YAZ HARİÇ) */}
      {Object.keys(odemeTuruDagilimi).length > 0 && (
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
              3️⃣ ÖDEME TÜRLERİ DAĞILIMI
            </h3>
            <span style={{ 
              fontSize: 14, 
              color: "#666", 
              background: "#f8f9fa",
              padding: "6px 12px",
              borderRadius: 20,
              fontWeight: "500"
            }}>
              {Object.values(odemeTuruDagilimi).reduce((sum, g) => sum + g.sayi, 0)} gelir işlemi
            </span>
          </div>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20
          }}>
            {Object.entries(odemeTuruDagilimi).map(([tur, veri]) => {
              const odemeInfo = getOdemeTuruBilgisi(tur);
              const yuzde = toplamGelir > 0 ? ((veri.toplam / toplamGelir) * 100).toFixed(1) : 0;
              
              return (
                <div key={tur} style={{
                  padding: 24,
                  background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                  borderRadius: 12,
                  borderLeft: `6px solid ${odemeInfo.renk}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "all 0.3s"
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
                      {veri.sayi} adet
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: 28, 
                    fontWeight: "bold", 
                    color: odemeInfo.renk,
                    marginBottom: 8
                  }}>
                    {veri.toplam.toLocaleString("tr-TR")} ₺
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
                </div>
              );
            })}
          </div>
          
          {/* HESABA YAZ AYRICA BİLGİLENDİRME */}
          <div style={{
            marginTop: 24,
            padding: 16,
            background: "#f8f9fa",
            borderRadius: 8,
            fontSize: 14,
            color: "#666",
            borderLeft: "4px solid #f39c12"
          }}>
            <strong>ℹ️ Not:</strong> "Hesaba Yaz" ödeme türü kasaya girmediği için bu dağılımda gösterilmez. 
            Yalnızca üst panelde toplamı ve Adisyon Hareketleri tablosunda detayları görüntülenir.
          </div>
        </div>
      )}
    </div>
  );
};

export default KasaRaporu;

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk, aciklama, icon }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 24,
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        borderLeft: `6px solid ${renk}`,
        transition: "all 0.3s",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
      }}
    >
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
      
      <div
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: renk,
          marginBottom: aciklama ? 6 : 0
        }}
      >
        {typeof deger === "number"
          ? deger.toLocaleString("tr-TR") + " ₺"
          : deger}
      </div>
      
      {aciklama && (
        <div style={{ 
          fontSize: 13, 
          color: "#777",
          fontWeight: "500",
          marginTop: 4
        }}>
          {aciklama}
        </div>
      )}
    </div>
  );
};

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