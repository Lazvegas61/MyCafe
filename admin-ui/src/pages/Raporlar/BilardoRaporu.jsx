import React, { useEffect, useState, useMemo } from "react";

/*
  BİLARDO RAPORU - YENİ SİSTEME UYGUN
  ------------------------------------
  - Veri Kaynağı: bilardo_adisyonlar (ANA KAYNAK)
  - Tüm kapalı bilardo adisyonlarını gösterir
  - Gün bazlı filtreleme
  - Yeni mimariye uygun veri okuma
*/

// ✅ YENİ: Normalizasyon fonksiyonları
const tarihToGunId = (tarih) => {
  if (!tarih) return "";
  try {
    if (typeof tarih === 'number') return new Date(tarih).toISOString().split('T')[0];
    if (typeof tarih === 'string') {
      if (tarih.includes('T')) return tarih.split('T')[0];
      if (!isNaN(Number(tarih))) return new Date(Number(tarih)).toISOString().split('T')[0];
      return tarih; // Zaten YYYY-MM-DD formatında
    }
    return "";
  } catch {
    return "";
  }
};

// ✅ YENİ: Adisyon toplamını hesapla
const getAdisyonToplam = (adisyon) => {
  if (adisyon.toplamTutar) return Number(adisyon.toplamTutar);
  
  if (adisyon.kalemler && Array.isArray(adisyon.kalemler)) {
    return adisyon.kalemler.reduce((sum, kalem) => {
      return sum + (Number(kalem.birimFiyat || 0) * Number(kalem.adet || 1));
    }, 0);
  }
  
  return 0;
};

// ✅ YENİ: Adisyon tarihini bul
const getAdisyonTarihi = (adisyon) => {
  // Öncelik sırası: kapanış → açılış → bugün
  if (adisyon.kapanisZamani) {
    return new Date(adisyon.kapanisZamani);
  }
  if (adisyon.acilisZamani) {
    return new Date(adisyon.acilisZamani);
  }
  if (adisyon.gunId) {
    return new Date(adisyon.gunId);
  }
  if (adisyon.gunld) {
    return new Date(adisyon.gunld);
  }
  return new Date();
};

export default function BilardoRaporu() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [liste, setListe] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [bilardoVar, setBilardoVar] = useState(false);
  const [gunDurumlari, setGunDurumlari] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ YENİ: Gün durumlarını yükle
  useEffect(() => {
    try {
      // Gün durumlarını yükle
      const durumlar = JSON.parse(localStorage.getItem("mc_gun_durumlari") || "[]");
      setGunDurumlari(durumlar);
    } catch (error) {
      console.error("Gün durumları yükleme hatası:", error);
    }
  }, []);

  // ✅ YENİ: Filtreleme fonksiyonu
  const filtreleBilardoAdisyonlar = () => {
    try {
      console.log("🔍 BilardoRaporu: Veriler yükleniyor...");
      
      // 1. Bilardo adisyonlarını yükle
      const bilardoAdisyonlarStr = localStorage.getItem("bilardo_adisyonlar") || "[]";
      const tumBilardoAdisyonlar = JSON.parse(bilardoAdisyonlarStr);
      
      console.log(`📊 Toplam bilardo adisyonu: ${tumBilardoAdisyonlar.length}`);
      
      // 2. Sadece KAPALI adisyonları al (yeni mimariye göre)
      const kapaliBilardoAdisyonlar = tumBilardoAdisyonlar.filter(adisyon => {
        return adisyon.kapali === true || adisyon.status === "CLOSED";
      });
      
      console.log(`📊 Kapalı bilardo adisyonu: ${kapaliBilardoAdisyonlar.length}`);
      
      // 3. Tarih filtresi uygula
      const filtrelenmis = kapaliBilardoAdisyonlar.filter(adisyon => {
        const tarih = getAdisyonTarihi(adisyon);
        const tarihStr = tarihToGunId(tarih);
        
        if (!tarihStr) return false;
        if (from && tarihStr < from) return false;
        if (to && tarihStr > to) return false;
        
        return true;
      });
      
      console.log(`📊 Filtrelenmiş bilardo adisyonu: ${filtrelenmis.length}`);
      
      // 4. Toplam hesapla
      const toplamTutar = filtrelenmis.reduce((sum, adisyon) => {
        return sum + getAdisyonToplam(adisyon);
      }, 0);
      
      // 5. State'i güncelle
      setListe(filtrelenmis);
      setToplam(toplamTutar);
      setBilardoVar(filtrelenmis.length > 0);
      setLoading(false);
      
      console.log("✅ BilardoRaporu: Veriler güncellendi", {
        adet: filtrelenmis.length,
        toplam: toplamTutar
      });
      
    } catch (error) {
      console.error("❌ BilardoRaporu hatası:", error);
      setLoading(false);
      setBilardoVar(false);
    }
  };

  useEffect(() => {
    filtreleBilardoAdisyonlar();
  }, [from, to]);

  // ✅ YENİ: Gün kapatılmış mı kontrolü
  const gunKapaliMi = (tarihStr) => {
    if (!tarihStr) return false;
    
    const gun = gunDurumlari.find(
      g => tarihToGunId(g.tarih) === tarihStr || g.gunId === tarihStr
    );
    
    return gun && (gun.durum === "KAPALI" || gun.status === "CLOSED");
  };

  // ✅ YENİ: Adisyon detaylarını formatla
  const formatAdisyonDetay = (adisyon) => {
    const tarih = getAdisyonTarihi(adisyon);
    const toplam = getAdisyonToplam(adisyon);
    const masaTipi = adisyon.masaTipi || "Bilardo Masa";
    const sure = adisyon.sure || adisyon.sureDk || "-";
    
    return {
      tarih: tarih.toLocaleString("tr-TR"),
      masaTipi,
      sure: sure === "suresiz" ? "Süresiz" : `${sure} dk`,
      toplam,
      kalemler: adisyon.kalemler || [],
      not: adisyon.not || ""
    };
  };

  // ✅ YENİ: Yenileme butonu
  const handleYenile = () => {
    setLoading(true);
    setTimeout(() => {
      filtreleBilardoAdisyonlar();
    }, 300);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Bilardo verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* BAŞLIK */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#7a3e06" }}>
          🎱 Bilardo Gelir Raporu
        </h2>
        <p style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          Kapalı bilardo adisyonları ve detaylı gelir analizi
        </p>
      </div>

      {/* FİLTRE VE KONTROLLER */}
      <div style={{
        background: "#fff",
        padding: 16,
        borderRadius: 10,
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
        display: "flex",
        gap: 16,
        alignItems: "flex-end",
        marginBottom: 24,
        flexWrap: "wrap"
      }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
            Başlangıç Tarihi
          </label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
            Bitiş Tarihi
          </label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 4 }}
          />
        </div>

        <button
          onClick={handleYenile}
          style={{
            padding: "8px 16px",
            background: "#3498db",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          🔄 Yenile
        </button>

        <button
          onClick={() => { setFrom(""); setTo(""); }}
          style={{
            padding: "8px 16px",
            background: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer",
            marginLeft: "auto"
          }}
        >
          Filtreyi Temizle
        </button>
      </div>

      {/* BİLGİ PANELİ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <OzetKart
          baslik="Toplam Bilardo Geliri"
          deger={toplam.toLocaleString("tr-TR") + " ₺"}
          renk="#2ecc71"
        />
        
        <OzetKart
          baslik="Kapalı Bilardo Adisyonları"
          deger={liste.length.toString() + " adet"}
          renk="#3498db"
        />
        
        <OzetKart
          baslik="Ortalama Adisyon Tutarı"
          deger={liste.length > 0 
            ? (toplam / liste.length).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺"
            : "0.00 ₺"
          }
          renk="#9b59b6"
        />
      </div>

      {/* UYARI MESAJI */}
      {!bilardoVar && (
        <div style={{
          background: "#fff3cd",
          border: "1px solid #ffeeba",
          color: "#856404",
          padding: 16,
          borderRadius: 10,
          marginBottom: 24
        }}>
          <strong>Bilardo raporu oluşturulamadı.</strong>
          <br />
          {from || to 
            ? "Seçilen tarih aralığında kapalı bilardo adisyonu bulunmuyor."
            : "Henüz kapalı bilardo adisyonu bulunmuyor."
          }
          <br />
          <span style={{ fontSize: 13 }}>
            Bilardo adisyonları kapatıldığında burada görünecektir.
          </span>
        </div>
      )}

      {/* TABLO */}
      {bilardoVar && (
        <div style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#e8f4f8" }}>
              <tr>
                <Th>Tarih</Th>
                <Th>Masa Tipi</Th>
                <Th>Süre</Th>
                <Th>Kalemler</Th>
                <Th align="right">Tutar</Th>
                <Th>Durum</Th>
              </tr>
            </thead>

            <tbody>
              {liste.map((adisyon, i) => {
                const detay = formatAdisyonDetay(adisyon);
                const tarihStr = tarihToGunId(getAdisyonTarihi(adisyon));
                const kapali = gunKapaliMi(tarihStr);
                
                return (
                  <tr
                    key={adisyon.id || i}
                    style={{
                      background: i % 2 === 0 ? "#fff" : "#f7fbff",
                      borderBottom: "1px solid #eee"
                    }}
                  >
                    <Td>
                      <div>{detay.tarih.split(",")[0]}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {detay.tarih.split(",")[1]}
                      </div>
                    </Td>
                    <Td>
                      <div style={{ fontWeight: "500" }}>{detay.masaTipi}</div>
                      {adisyon.masaId && (
                        <div style={{ fontSize: 12, color: "#666" }}>
                          ID: {adisyon.masaId}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        background: "#e0f7fa",
                        color: "#006064",
                        fontSize: 12,
                        fontWeight: "bold"
                      }}>
                        {detay.sure}
                      </span>
                    </Td>
                    <Td>
                      {detay.kalemler.length > 0 ? (
                        <div style={{ fontSize: 12 }}>
                          {detay.kalemler.slice(0, 2).map((kalem, idx) => (
                            <div key={idx} style={{ marginBottom: 2 }}>
                              • {kalem.urunAdi || kalem.ad} × {kalem.adet || 1}
                            </div>
                          ))}
                          {detay.kalemler.length > 2 && (
                            <div style={{ color: "#666", fontStyle: "italic" }}>
                              +{detay.kalemler.length - 2} daha...
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#999", fontSize: 12 }}>Kalem yok</span>
                      )}
                    </Td>
                    <Td align="right" style={{ fontWeight: "bold", color: "#2ecc71" }}>
                      {detay.toplam.toLocaleString("tr-TR")} ₺
                    </Td>
                    <Td>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background: kapali ? "#d4edda" : "#fff3cd",
                        color: kapali ? "#155724" : "#856404",
                        fontWeight: "bold"
                      }}>
                        {kapali ? "✅ KAPALI" : "⚠️ AÇIK"}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ALT BİLGİ */}
      <div style={{ marginTop: 24, fontSize: 12, color: "#777" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>Veri Kaynağı:</strong> bilardo_adisyonlar
            <br />
            <strong>Gösterilen:</strong> Sadece kapalı bilardo adisyonları
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Son Güncelleme:</strong> {new Date().toLocaleString("tr-TR")}
            <br />
            <strong>Toplam Kayıt:</strong> {liste.length} adet
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ YARDIMCI BİLEŞENLER ------------------ */

const OzetKart = ({ baslik, deger, renk }) => (
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
  </div>
);

const Th = ({ children, align }) => (
  <th style={{
    padding: 12,
    textAlign: align || "left",
    borderBottom: "1px solid #ddd",
    fontSize: 14,
    fontWeight: 600,
    color: "#006064"
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