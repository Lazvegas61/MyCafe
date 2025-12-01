// PREMIUM MÜŞTERİ İŞLEMLERİ – TEK TAHSİLAT ALANI (A Seçeneği)
// Masa detayı TAMAMEN korunur, inline ödeme kutuları KALDIRILDI.
// Tüm tahsilat TEK alandan yapılır ve tüm borç kayıtlarına otomatik dağıtılır.

import React, { useEffect, useState, useMemo } from "react";

function parseLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveLS(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export default function MusteriIslemleri() {
  const [musteriler, setMusteriler] = useState([]);
  const [borclar, setBorclar] = useState([]);
  const [adisyonlar, setAdisyonlar] = useState([]);
  const [kasa, setKasa] = useState([]);

  const [selectedMusteri, setSelectedMusteri] = useState(null);
  const [selectedBorc, setSelectedBorc] = useState(null);

  // TEK tahsilat alanı
  const [tahsilat, setTahsilat] = useState("");
  const [odemeTuru, setOdemeTuru] = useState("NAKIT");

  const [odemeSozu, setOdemeSozu] = useState("");
  const [popupData, setPopupData] = useState(null);

  useEffect(() => {
    setMusteriler(parseLS("mc_musteriler", []));
    setBorclar(parseLS("mc_borclar", []));
    setAdisyonlar(parseLS("mc_adisyonlar", []));
    setKasa(parseLS("mc_kasa", []));
  }, []);

  const musterilerBorclu = useMemo(() => {
    return musteriler.map((m) => {
      const ilgili = borclar.filter((b) => String(b.musteriId) === String(m.id));
      const toplam = ilgili.reduce(
        (s, b) => s + (Number(b.tutar) || 0) - toplamTahsilat(b),
        0
      );
      return { ...m, toplamBorc: toplam, borclar: ilgili };
    });
  }, [musteriler, borclar]);

  useEffect(() => {
    if (selectedMusteri) {
      const ilgili = selectedMusteri.borclar.sort(
        (a, b) => new Date(b.acilisZamani) - new Date(a.acilisZamani)
      );
      setSelectedBorc(ilgili[0] || null);
    }
  }, [selectedMusteri]);

  const formatTL = (n) =>
    Number(n).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺";

  const formatDT = (d) => {
    if (!d) return "-";
    const x = new Date(d);
    if (isNaN(x.getTime())) return String(d);
    return x.toLocaleString("tr-TR");
  };

  function toplamTahsilat(borc) {
    if (!borc.hareketler) return 0;
    return borc.hareketler
      .filter((h) => h.tip === "TAHSİLAT")
      .reduce((s, h) => s + Number(h.tutar || 0), 0);
  }

  const adisyon = useMemo(() => {
    if (!selectedBorc) return null;
    return (
      adisyonlar.find((a) => String(a.id) === String(selectedBorc.adisyonId)) || null
    );
  }, [selectedBorc, adisyonlar]);

  // ⭐ TEK TAHSİLAT – TÜM BORÇLARA OTOMATİK DAĞILIR
  function tahsilEt() {
    if (!selectedMusteri) return;
    if (!tahsilat || Number(tahsilat) <= 0) return;

    let kalan = Number(tahsilat);
    const now = new Date().toISOString();

    const newBorclar = borclar.map((b) => {
      if (String(b.musteriId) !== String(selectedMusteri.id)) return b;

      const mevcutKalan = b.tutar - toplamTahsilat(b);
      if (mevcutKalan <= 0 || kalan <= 0) return b;

      const odenecek = Math.min(kalan, mevcutKalan);
      kalan -= odenecek;

      b.hareketler = b.hareketler || [];
      b.hareketler.push({
        tip: "TAHSİLAT",
        tutar: odenecek,
        odemeTuru,
        tarih: now,
      });
      return b;
    });

    saveLS("mc_borclar", newBorclar);
    setBorclar(newBorclar);

    // Kasa hareketi
    const kasaKaydi = {
      id: "ks_" + Date.now(),
      tip: "HESABA YAZ TAHSİLAT",
      tutar: Number(tahsilat),
      odemeTuru,
      musteri: selectedMusteri.adSoyad,
      tarih: now,
    };

    const newKasa = [...kasa, kasaKaydi];
    setKasa(newKasa);
    saveLS("mc_kasa", newKasa);

    setTahsilat("");
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ fontSize: "32px", fontWeight: "700", color: "#4b2e05", marginBottom: "20px" }}>
        MÜŞTERİ İŞLEMLERİ (Premium)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 1fr", gap: "20px" }}>
        {/* SOL PANEL – MÜŞTERİLER */}
        <div className="panel-premium">
          <div className="panel-title">MÜŞTERİLER</div>

          <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
            {musterilerBorclu.map((m) => (
              <div
                key={m.id}
                className={
                  "customer-row " + (selectedMusteri?.id === m.id ? "row-active" : "")
                }
                onClick={() => setSelectedMusteri(m)}
              >
                <div style={{ fontWeight: "600" }}>{m.adSoyad}</div>
                <div style={{ fontSize: "12px" }}>Tel: {m.telefon}</div>
                <div className="price-box">{formatTL(m.toplamBorc)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ORTA PANEL – MASA BORÇ LİSTESİ */}
        <div className="panel-premium">
          <div className="panel-title">BORÇ KAYITLARI</div>

          {selectedMusteri && selectedMusteri.borclar.map((b) => (
            <div key={b.id} className="borc-row" onClick={() => setSelectedBorc(b)}>
              <div style={{ fontWeight: "600" }}>Masa {b.masaNo}</div>
              <div>{formatDT(b.acilisZamani)}</div>
              <div className="price-box">{formatTL(b.tutar - toplamTahsilat(b))}</div>
            </div>
          ))}
        </div>

        {/* SAĞ PANEL – DETAY */}
        <div className="panel-premium">
          {selectedMusteri ? (
            <>
              {/* TEK TAHSİLAT ALANI */}
              <div className="panel-title">TAHSİLAT</div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input
                  className="odeme-input"
                  placeholder="Tahsilat Tutarı"
                  value={tahsilat}
                  onChange={(e) => setTahsilat(e.target.value)}
                />
                <select
                  className="odeme-select"
                  value={odemeTuru}
                  onChange={(e) => setOdemeTuru(e.target.value)}
                >
                  <option value="NAKIT">NAKİT</option>
                  <option value="KART">KART</option>
                  <option value="HAVALE">HAVALE / EFT</option>
                </select>
                <button className="odeme-btn" onClick={tahsilEt}>Tahsil Et</button>
              </div>

              {/* MASA DETAY */}
              {selectedBorc && (
                <>
                  <div className="detail-card">
                    <div>
                      <div className="detail-label">Masa</div>
                      <div className="detail-value">{selectedBorc.masaNo}</div>
                    </div>
                    <div>
                      <div className="detail-label">Kalan</div>
                      <div className="detail-value">{formatTL(selectedBorc.tutar - toplamTahsilat(selectedBorc))}</div>
                    </div>
                    <div>
                      <div className="detail-label">Açılış</div>
                      <div className="detail-value">{formatDT(selectedBorc.acilisZamani)}</div>
                    </div>
                  </div>

                  {/* Ürünler */}
                  <div className="section-title">Adisyon Ürünleri</div>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {adisyon?.kalemler?.map((k) => (
                      <div key={k.id} className="urun-row">
                        <div>{k.urunAd}</div>
                        <div>{k.adet} adet</div>
                        <div>{formatTL(k.toplam)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Hareketler */}
                  <div className="section-title">Borç Hareketleri</div>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {selectedBorc?.hareketler?.map((h, i) => (
                      <div key={i} className="hareket-row">
                        <div><b>{h.tip}</b> {h.odemeTuru ? `(${h.odemeTuru})` : ""}</div>
                        <div>{h.tutar ? formatTL(h.tutar) : ""}</div>
                        <div style={{ fontSize: "12px" }}>{formatDT(h.tarih)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Ödeme Sözü */}
                  <div className="section-title">Ödeme Sözü</div>
                  <div className="odeme-sozu-kutu">
                    <input
                      type="date"
                      value={odemeSozu}
                      onChange={(e) => setOdemeSozu(e.target.value)}
                      className="odeme-input"
                    />
                    <button onClick={() => {}} className="odeme-btn">Kaydet</button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ color: "#777", fontSize: "20px" }}>Müşteri seçiniz…</div>
          )}
        </div>
      </div>
    </div>
  );
}
