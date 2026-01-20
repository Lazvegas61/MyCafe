import React, { useEffect, useMemo, useState } from "react";

/*
  KASA RAPORU - MODEL C STANDARDI
  -----------
  - Veri Kaynağı: mc_finans_havuzu
  - GELIR + GIDER birlikte
  - Ortak tarih filtresi
  - Standart tarih formatı ile güvenli filtreleme
  - Kasa kapanış durumu kontrolü
  - Tür normalize edilmiş hesaplama
*/

const KasaRaporu = () => {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [veriler, setVeriler] = useState([]);
  const [gunDurumlari, setGunDurumlari] = useState([]);

  // --------------------------------------------------
  //   VERİ OKU
  // --------------------------------------------------
  useEffect(() => {
    const havuz = JSON.parse(localStorage.getItem("mc_finans_havuzu")) || [];
    const durumlar = JSON.parse(localStorage.getItem("mc_gun_durumlari")) || [];
    
    setVeriler(havuz);
    setGunDurumlari(durumlar);
  }, []);

  // --------------------------------------------------
  //   STANDART TARİH FORMATI ÇEVİRİCİ (Model C Standardı)
  // --------------------------------------------------
  const tarihFormatla = (tarihString) => {
    if (!tarihString) return "";
    
    try {
      // Birden fazla formatı destekle
      let tarih;
      
      if (tarihString.includes('T')) {
        // ISO formatı: YYYY-MM-DDTHH:mm:ss
        tarih = new Date(tarihString);
      } else if (tarihString.includes('/')) {
        // locale string: DD/MM/YYYY
        const parts = tarihString.split(/[/-]/);
        if (parts.length === 3) {
          // DD/MM/YYYY veya YYYY-MM-DD kontrolü
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            tarih = new Date(tarihString);
          } else {
            // DD/MM/YYYY
            tarih = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }
      } else {
        // Doğrudan Date oluştur
        tarih = new Date(tarihString);
      }
      
      // Geçerli bir tarih mi?
      if (isNaN(tarih.getTime())) {
        console.warn("Geçersiz tarih formatı:", tarihString);
        return "";
      }
      
      // STANDART FORMAT: YYYY-MM-DD
      const yil = tarih.getFullYear();
      const ay = String(tarih.getMonth() + 1).padStart(2, '0');
      const gun = String(tarih.getDate()).padStart(2, '0');
      
      return `${yil}-${ay}-${gun}`;
    } catch (error) {
      console.error("Tarih formatlama hatası:", error, "Gelen:", tarihString);
      return "";
    }
  };

  // --------------------------------------------------
  //   TÜR NORMALİZE EDİCİ (Model C Standardı)
  // --------------------------------------------------
  const turNormalizeEt = (tur) => {
    if (!tur) return "GIDER"; // Varsayılan gider
    
    const upperTur = tur.toUpperCase();
    
    // Gelir türleri
    if (["GELIR", "HESABA_YAZ_TAHSILAT", "MANUEL_GELIR", "TAHSILAT", "GELIR_GIRISI"].includes(upperTur)) {
      return "GELIR";
    }
    
    // Gider türleri
    if (["GIDER", "MANUEL_GIDER", "ODEME", "GIDER_GIRISI"].includes(upperTur)) {
      return "GIDER";
    }
    
    // Sistem kayıtları (kasa raporunda gösterilmeyecek)
    if (["GUN_BASI", "GUN_SONU", "SISTEM_KAYDI"].includes(upperTur)) {
      return "SISTEM";
    }
    
    // Varsayılan gider
    return "GIDER";
  };

  // --------------------------------------------------
  //   GÜN KAPALI MI KONTROLÜ
  // --------------------------------------------------
  const gunKapaliMi = (tarihStr) => {
    if (!tarihStr || !gunDurumlari.length) return false;
    
    const gunDurumu = gunDurumlari.find(d => 
      d.tarih && tarihFormatla(d.tarih) === tarihStr
    );
    
    return gunDurumu && gunDurumu.durum === "KAPALI";
  };

  // --------------------------------------------------
  //   TARİH FİLTRESİ (Güvenli ve Standart)
  // --------------------------------------------------
  const hareketler = useMemo(() => {
    return veriler.filter(item => {
      if (!item.tarih) return false;
      
      const standartTarih = tarihFormatla(item.tarih);
      if (!standartTarih) return false;
      
      // Tarih filtresi
      if (baslangic && standartTarih < baslangic) return false;
      if (bitis && standartTarih > bitis) return false;
      
      // Tür kontrolü - sadece finansal hareketler
      const normalizedTur = turNormalizeEt(item.tur);
      if (normalizedTur === "SISTEM") return false;
      
      return true;
    });
  }, [veriler, baslangic, bitis]);

  // --------------------------------------------------
  //   TOPLAMLAR (Normalize Edilmiş Türlere Göre)
  // --------------------------------------------------
  const { toplamGelir, toplamGider } = useMemo(() => {
    let gelir = 0;
    let gider = 0;
    
    hareketler.forEach(h => {
      const normalizedTur = turNormalizeEt(h.tur);
      const tutar = Number(h.tutar || 0);
      
      if (normalizedTur === "GELIR") {
        gelir += tutar;
      } else if (normalizedTur === "GIDER") {
        gider += tutar;
      }
    });
    
    return { toplamGelir: gelir, toplamGider: gider };
  }, [hareketler]);

  const netKasa = toplamGelir - toplamGider;

  // --------------------------------------------------
  //   KAPALI GÜN UYARILARI
  // --------------------------------------------------
  const kapaliGunler = useMemo(() => {
    if (!baslangic || !bitis) return [];
    
    const kapaliGunListesi = [];
    let currentDate = new Date(baslangic);
    const endDate = new Date(bitis);
    
    while (currentDate <= endDate) {
      const tarihStr = tarihFormatla(currentDate.toISOString());
      if (gunKapaliMi(tarihStr)) {
        kapaliGunListesi.push(tarihStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return kapaliGunListesi;
  }, [baslangic, bitis, gunDurumlari]);

  // --------------------------------------------------
  //   UI
  // --------------------------------------------------
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Kasa Raporu - Model C Standart
      </h1>

      {/* FİLTRE */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block mb-1">Başlangıç</label>
          <input
            type="date"
            value={baslangic}
            onChange={e => setBaslangic(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Bitiş</label>
          <input
            type="date"
            value={bitis}
            onChange={e => setBitis(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* KAPALI GÜN UYARISI */}
      {kapaliGunler.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <strong>Uyarı:</strong> Raporda <strong>{kapaliGunler.length}</strong> kapalı gün bulunuyor.
            <span className="text-sm">(Kapalı günlerde işlem girişi yapılamaz)</span>
          </div>
        </div>
      )}

      {/* ÖZET */}
      <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded">
        <div>
          <strong>Toplam Gelir:</strong>{" "}
          <span style={{ color: "green" }}>
            {toplamGelir.toFixed(2)} ₺
          </span>
        </div>

        <div>
          <strong>Toplam Gider:</strong>{" "}
          <span style={{ color: "red" }}>
            {toplamGider.toFixed(2)} ₺
          </span>
        </div>

        <div>
          <strong>Net Kasa:</strong>{" "}
          <span
            style={{
              color: netKasa >= 0 ? "green" : "red",
            }}
          >
            {netKasa.toFixed(2)} ₺
          </span>
        </div>
      </div>

      {/* TABLO */}
      <div className="overflow-x-auto">
        <table className="table w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Tarih</th>
              <th className="border p-2">Tür</th>
              <th className="border p-2">Açıklama</th>
              <th className="border p-2 text-right">Tutar (₺)</th>
              <th className="border p-2">Durum</th>
            </tr>
          </thead>

          <tbody>
            {hareketler.length === 0 && (
              <tr>
                <td colSpan={5} className="border p-4 text-center text-gray-500">
                  {baslangic || bitis ? "Filtrelenmiş veri bulunamadı" : "Veri bulunamadı"}
                </td>
              </tr>
            )}

            {hareketler.map(h => {
              const standartTarih = tarihFormatla(h.tarih);
              const normalizedTur = turNormalizeEt(h.tur);
              const kapali = gunKapaliMi(standartTarih);
              
              return (
                <tr key={h.id} className={kapali ? "bg-yellow-50" : ""}>
                  <td className="border p-2">
                    {new Date(h.tarih).toLocaleDateString("tr-TR")}
                    {kapali && (
                      <span className="ml-2 text-xs text-yellow-600">(Kapalı)</span>
                    )}
                  </td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      normalizedTur === "GELIR" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {normalizedTur}
                    </span>
                  </td>
                  <td className="border p-2">{h.aciklama || "-"}</td>
                  <td
                    className="border p-2 text-right font-medium"
                    style={{
                      color: normalizedTur === "GELIR" ? "green" : "red",
                    }}
                  >
                    {Number(h.tutar || 0).toFixed(2)}
                  </td>
                  <td className="border p-2">
                    {kapali ? (
                      <span className="text-yellow-600 text-sm">Gün Kapalı</span>
                    ) : (
                      <span className="text-green-600 text-sm">Açık</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER BİLGİ */}
      <div className="mt-6 pt-4 border-t text-sm text-gray-600">
        <p>
          <strong>Model C Standartları:</strong>
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Tüm tarihler "YYYY-MM-DD" formatında standartlaştırıldı</li>
          <li>Türler normalize edilerek (GELIR/GIDER) hesaplandı</li>
          <li>Kapalı günler sarı renk ile işaretlendi</li>
          <li>Sistem kayıtları (GUN_BASI, GUN_SONU) rapor dışında</li>
        </ul>
      </div>
    </div>
  );
};

export default KasaRaporu;