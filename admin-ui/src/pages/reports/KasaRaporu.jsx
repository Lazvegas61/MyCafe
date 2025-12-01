import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * MyCafe — KASA RAPORU
 * - Adisyon tahsilatları
 * - Hesaba Yaz tahsilatları
 * - Bilardo tahsilatları (mc_bilardo_gelirler → NAKIT gibi sayılır)
 */

export default function KasaRaporu() {
  const navigate = useNavigate();

  const renk = { bej: "#f5e7d0", kahve: "#4b2e05" };

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  // ---- FİLTRE STATE ----
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [masaFilter, setMasaFilter] = useState("");
  const [odemeTurFilter, setOdemeTurFilter] = useState("TUMU");
  const [onlyHesabaTahsil, setOnlyHesabaTahsil] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState(null);

  const applyFilters = () => {
    setAppliedFilters({
      startDate,
      endDate,
      masaFilter,
      odemeTurFilter,
      onlyHesabaTahsil,
    });
  };

  // Etkin filtreler
  const effectiveStart = appliedFilters?.startDate || "";
  const effectiveEnd = appliedFilters?.endDate || "";
  const effectiveMasa = appliedFilters?.masaFilter || "";
  const effectiveTur = appliedFilters?.odemeTurFilter || "TUMU";
  const effectiveOnlyHesaba = appliedFilters?.onlyHesabaTahsil || false;

  // ---- VERİLER ----
  const adisyonlar = readJSON("mc_adisyonlar", []);
  const borclar = readJSON("mc_borclar", []);
  const bilardoGelirler = readJSON("mc_bilardo_gelirler", []); // 🔥 BİLARDO EKLENDİ

  // ---- TARİH ARALIĞI KONTROLÜ ----
  const isInRange = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return false;

    if (effectiveStart) {
      const s = new Date(effectiveStart + "T00:00:00");
      if (d < s) return false;
    }
    if (effectiveEnd) {
      const e = new Date(effectiveEnd + "T23:59:59");
      if (d > e) return false;
    }
    return true;
  };

  // ---- ADİSYON ÖDEMELERİ + MASA ÖZETLERİ ----
  const { adisyonPayments, masaRows } = useMemo(() => {
    const payments = [];
    const masaMap = {};

    const kapaliAdisyonlar = adisyonlar.filter((a) => a.durum === "KAPALI");

    kapaliAdisyonlar.forEach((a) => {
      const tarihISO = a.kapanis || a.acilis;
      if (!isInRange(tarihISO)) return;

      if (effectiveMasa && String(a.masaNo) !== String(effectiveMasa)) {
        return;
      }

      const araToplam = (a.kalemler || []).reduce(
        (t, u) => t + (u.adet || 0) * (u.fiyat || 0),
        0
      );
      const indirim = Number(a.indirim || 0);
      const genelToplam = Math.max(0, araToplam - indirim);

      const odemeler = a.odemeler || [];

      let adisyonOdenen = 0;
      let odemeTurKisa = [];

      odemeler.forEach((o) => {
        const tur = (o.tur || "").toUpperCase();
        const tutar = Number(o.tutar || 0);
        if (tutar <= 0) return;

        const gelirSay = tur !== "HESABA_YAZ";

        if (gelirSay) {
          if (effectiveTur !== "TUMU" && effectiveTur !== tur) {
            // filtre uyuşmuyorsa ekleme
          } else if (!effectiveOnlyHesaba) {
            payments.push({
              kaynak: "ADISYON",
              tarihISO,
              masaNo: a.masaNo,
              musteriAd: null,
              tur,
              tutar,
            });
          }
        }

        adisyonOdenen += tutar;

        let kisa = "";
        if (tur === "NAKIT") kisa = "N";
        else if (tur === "KART") kisa = "K";
        else if (tur === "HAVALE") kisa = "H";
        else if (tur === "HESABA_YAZ") kisa = "HY";
        else kisa = tur.substring(0, 2).toUpperCase();

        if (!odemeTurKisa.includes(kisa)) {
          odemeTurKisa.push(kisa);
        }
      });

      const kalan = Math.max(0, genelToplam - adisyonOdenen);

      masaMap[a.id] = {
        id: a.id,
        masaNo: a.masaNo,
        acilis: a.acilis,
        kapanis: a.kapanis,
        araToplam,
        indirim,
        odenen: adisyonOdenen,
        kalan,
        turKisalar: odemeTurKisa.join("+") || "-",
      };
    });

    return {
      adisyonPayments: payments,
      masaRows: Object.values(masaMap),
    };
  }, [
    JSON.stringify(adisyonlar),
    effectiveMasa,
    effectiveTur,
    effectiveOnlyHesaba,
    effectiveStart,
    effectiveEnd,
  ]);

  // ---- HESABA YAZ TAHSİLATLARI ----
  const borcPayments = useMemo(() => {
    const list = [];

    borclar.forEach((b) => {
      const odemeler = b.odemeler || [];
      odemeler.forEach((o) => {
        const tur = (o.tur || "").toUpperCase();
        const tutar = Number(o.tutar || 0);
        if (tutar <= 0) return;

        const tarihISO = o.tarihISO || b.tarihISO;
        if (!isInRange(tarihISO)) return;

        if (
          effectiveMasa &&
          String(b.masaNo || "") !== String(effectiveMasa)
        ) {
          return;
        }

        if (!effectiveOnlyHesaba && effectiveTur !== "TUMU") {
          if (effectiveTur !== tur) return;
        }

        list.push({
          kaynak: "HESABA_YAZ_TAHSILAT",
          tarihISO,
          masaNo: b.masaNo || "-",
          musteriAd: b.musteriAd || "-",
          tur,
          tutar,
        });
      });
    });

    return list;
  }, [
    JSON.stringify(borclar),
    effectiveMasa,
    effectiveTur,
    effectiveOnlyHesaba,
    effectiveStart,
    effectiveEnd,
  ]);

  // ---- BİLARDO TAHSİLATLARI ----
  const bilardoPayments = useMemo(() => {
    const list = [];

    (bilardoGelirler || []).forEach((g) => {
      const tutar = Number(g.tutar || 0);
      if (tutar <= 0) return;

      const tarihISO = g.bitis || g.baslama;
      if (!isInRange(tarihISO)) return;

      // Masa filtresi varsa, bilardo masaId ile eşleştir
      if (effectiveMasa) {
        if (String(g.masaId || "") !== String(effectiveMasa)) return;
      }

      // Ödeme türü B seçeneğine göre: normal NAKİT gibi sayıyoruz
      const tur = "NAKIT";

      // Eğer filtre belli bir tür istiyorsa ve o NAKIT değilse, geçme
      if (effectiveTur !== "TUMU" && effectiveTur !== tur) return;

      list.push({
        kaynak: "BILARDO",
        tarihISO,
        masaNo: g.masaAd || `BİLARDO ${g.masaId}`,
        musteriAd: null,
        tur, // NAKIT
        tutar,
      });
    });

    return list;
  }, [
    JSON.stringify(bilardoGelirler),
    effectiveMasa,
    effectiveTur,
    effectiveStart,
    effectiveEnd,
  ]);

  // ---- TAM LİSTE ----
  const allPayments = useMemo(() => {
    let list = [];

    if (effectiveOnlyHesaba) {
      // Sadece Hesaba Yaz tahsilatları isteniyorsa, bilardo ve adisyon gelmez
      list = [...borcPayments];
    } else {
      list = [...adisyonPayments, ...borcPayments, ...bilardoPayments];
    }

    if (effectiveTur !== "TUMU") {
      list = list.filter(
        (p) => (p.tur || "").toUpperCase() === effectiveTur
      );
    }

    list.sort((a, b) => {
      const da = new Date(a.tarihISO || 0).getTime();
      const db = new Date(b.tarihISO || 0).getTime();
      return da - db;
    });

    return list;
  }, [adisyonPayments, borcPayments, bilardoPayments, effectiveTur, effectiveOnlyHesaba]);

  // ---- ÖZET ----
  const summary = useMemo(() => {
    const sum = {
      NAKIT: 0,
      KART: 0,
      HAVALE: 0,
      HESABA_YAZ_TAHSILAT: 0,
    };

    allPayments.forEach((p) => {
      const tur = (p.tur || "").toUpperCase();
      const tutar = Number(p.tutar || 0);
      if (tutar <= 0) return;

      if (p.kaynak === "HESABA_YAZ_TAHSILAT") {
        sum.HESABA_YAZ_TAHSILAT += tutar;
      } else {
        if (tur === "NAKIT") sum.NAKIT += tutar;
        else if (tur === "KART") sum.KART += tutar;
        else if (tur === "HAVALE" || tur === "HAVALE/EFT") sum.HAVALE += tutar;
      }
    });

    const toplamGelir =
      sum.NAKIT + sum.KART + sum.HAVALE + sum.HESABA_YAZ_TAHSILAT;

    return { ...sum, toplamGelir };
  }, [allPayments]);

  // ---- FORMAT ----
  const formatTL = (n) =>
    (Number(n) || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺";

  const formatTarih = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const tarih = d.toLocaleDateString("tr-TR");
    const saat = d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${saat} ${tarih}`;
  };

  // ---- STİLLER ----
  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid #c9b99a",
    fontSize: 14,
    background: "#fff",
  };

  const btnKahve = {
    background: "#4b2e05",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  };

  const btnBeyaz = {
    background: "#fff",
    color: "#4b2e05",
    border: "1px solid #c9b99a",
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  };

  const thLeft = {
    textAlign: "left",
    borderBottom: "1px solid #d6c3a2",
    padding: "6px 4px",
    fontSize: 13,
  };

  const thRight = {
    textAlign: "right",
    borderBottom: "1px solid #d6c3a2",
    padding: "6px 4px",
    fontSize: 13,
  };

  const tdLeft = {
    textAlign: "left",
    padding: "4px 4px",
    borderBottom: "1px solid #eee2c9",
  };

  const tdRight = {
    textAlign: "right",
    padding: "4px 4px",
    borderBottom: "1px solid #eee2c9",
  };

  // ---- UI ----
  return (
    <div
      style={{
        backgroundColor: renk.bej,
        minHeight: "100vh",
        padding: "16px 24px",
        color: renk.kahve,
      }}
    >
      {/* 🔙 SAĞ ÜST GERİ BUTONU */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => navigate("/raporlar")}
          style={{
            position: "absolute",
            top: -10,
            right: 0,
            padding: "8px 14px",
            background: "#4b2e05",
            color: "#f5e7d0",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            zIndex: 10,
          }}
        >
          ← GERİ
        </button>
      </div>

      {/* BAŞLIK */}
      <div
        style={{
          background: "#f5e7d0",
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid #d6c3a2",
          marginBottom: 32,
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800 }}>KASA RAPORU</div>
        <div style={{ fontSize: 14 }}>
          Tarih aralığında masa ve ödeme türüne göre kasa hareketleri.
        </div>
      </div>

      {/* FİLTRELER */}
      <div
        style={{
          background: "#fffaf2",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
            >
              Başlangıç Tarihi
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
            >
              Bitiş Tarihi
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
            >
              Masa No (isteğe bağlı)
            </div>
            <input
              type="number"
              placeholder="Örn: 12"
              value={masaFilter}
              onChange={(e) => setMasaFilter(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <div
              style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
            >
              Ödeme Türü
            </div>
            <select
              value={odemeTurFilter}
              onChange={(e) => setOdemeTurFilter(e.target.value)}
              style={{ ...inputStyle, paddingRight: 24 }}
            >
              <option value="TUMU">Tümü</option>
              <option value="NAKIT">Nakit</option>
              <option value="KART">Kart</option>
              <option value="HAVALE">Havale / EFT</option>
              <option value="HESABA_YAZ_TAHSILAT">
                Sadece Hesaba Yaz Tahsilat
              </option>
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={onlyHesabaTahsil}
                onChange={(e) => setOnlyHesabaTahsil(e.target.checked)}
              />
              Sadece Hesaba Yaz tahsilatlarını göster
            </label>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button onClick={applyFilters} style={btnKahve}>
            R A P O R U &nbsp; G E T İ R
          </button>
        </div>
      </div>

      {/* Özet Tablosu */}
      <div
        style={{
          background: "#fffaf2",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          ÖDEME TÜRLERİNE GÖRE ÖZET
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thLeft}>Ödeme Türü</th>
              <th style={thRight}>Toplam Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdLeft}>Nakit</td>
              <td style={tdRight}>{formatTL(summary.NAKIT)}</td>
            </tr>
            <tr>
              <td style={tdLeft}>Kart</td>
              <td style={tdRight}>{formatTL(summary.KART)}</td>
            </tr>
            <tr>
              <td style={tdLeft}>Havale / EFT</td>
              <td style={tdRight}>{formatTL(summary.HAVALE)}</td>
            </tr>
            <tr>
              <td style={tdLeft}>Hesaba Yaz Tahsilatları</td>
              <td style={tdRight}>
                {formatTL(summary.HESABA_YAZ_TAHSILAT)}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  ...tdLeft,
                  fontWeight: 800,
                  borderTop: "2px solid #d6c3a2",
                }}
              >
                T O P L A M &nbsp; G E L İ R
              </td>
              <td
                style={{
                  ...tdRight,
                  fontWeight: 800,
                  borderTop: "2px solid #d6c3a2",
                }}
              >
                {formatTL(summary.toplamGelir)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* MASA BAZLI RAPOR */}
      <div
        style={{
          background: "#fffaf2",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          MASA BAZLI KASA RAPORU
        </div>

        {masaRows.length === 0 ? (
          <div style={{ fontSize: 14 }}>
            Bu tarih aralığında kayıt bulunamadı.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th style={thLeft}>Masa</th>
                  <th style={thLeft}>Açılış - Kapanış</th>
                  <th style={thRight}>Ara Toplam</th>
                  <th style={thRight}>İndirim</th>
                  <th style={thRight}>Ödenen</th>
                  <th style={thRight}>Kalan</th>
                  <th style={thLeft}>Ödeme Türleri</th>
                </tr>
              </thead>
              <tbody>
                {masaRows.map((m) => (
                  <tr key={m.id}>
                    <td style={tdLeft}>{m.masaNo}</td>
                    <td style={tdLeft}>
                      {formatTarih(m.acilis)}{" "}
                      {m.kapanis ? " / " + formatTarih(m.kapanis) : ""}
                    </td>
                    <td style={tdRight}>{formatTL(m.araToplam)}</td>
                    <td style={tdRight}>{formatTL(m.indirim)}</td>
                    <td style={{ ...tdRight, color: "#2e7d32" }}>
                      {formatTL(m.odenen)}
                    </td>
                    <td style={{ ...tdRight, color: "#b71c1c" }}>
                      {formatTL(m.kalan)}
                    </td>
                    <td style={tdLeft}>{m.turKisalar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* İŞLEM LİSTESİ */}
      <div
        style={{
          background: "#fffaf2",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          İŞLEM LİSTESİ (DETAY)
        </div>

        {allPayments.length === 0 ? (
          <div style={{ fontSize: 14 }}>
            Bu tarih aralığında işlem bulunamadı.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th style={thLeft}>Tarih - Saat</th>
                  <th style={thLeft}>Masa / Müşteri</th>
                  <th style={thLeft}>İşlem Türü</th>
                  <th style={thRight}>Tutar</th>
                  <th style={thLeft}>Kaynak</th>
                </tr>
              </thead>
              <tbody>
                {allPayments.map((p, idx) => (
                  <tr key={idx}>
                    <td style={tdLeft}>{formatTarih(p.tarihISO)}</td>
                    <td style={tdLeft}>
                      {p.kaynak === "HESABA_YAZ_TAHSILAT"
                        ? p.musteriAd || "-"
                        : p.kaynak === "BILARDO"
                        ? p.masaNo || "-"
                        : `Masa ${p.masaNo}`}
                    </td>
                    <td style={tdLeft}>
                      {p.kaynak === "HESABA_YAZ_TAHSILAT"
                        ? "Hesaba Yaz Tahsilat (" + p.tur + ")"
                        : p.kaynak === "BILARDO"
                        ? `Bilardo (${p.tur})`
                        : p.tur}
                    </td>
                    <td style={tdRight}>{formatTL(p.tutar)}</td>
                    <td style={tdLeft}>
                      {p.kaynak === "HESABA_YAZ_TAHSILAT"
                        ? "Müşteri Borç"
                        : p.kaynak === "BILARDO"
                        ? "Bilardo"
                        : "Adisyon"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EXPORT BUTONLARI (şu an sadece görsel) */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <button style={btnBeyaz}>PDF İndir</button>
        <button style={btnBeyaz}>Excel İndir</button>
      </div>
    </div>
  );
}
