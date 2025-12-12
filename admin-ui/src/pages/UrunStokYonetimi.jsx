import React, { useEffect, useMemo, useRef, useState } from "react";

export default function UrunStokYonetimi() {
  const KATEGORI_KEY = "mc_kategoriler";
  const URUN_KEY = "mc_urunler";

  // ---------- STATE ----------
  const [kategoriler, setKategoriler] = useState([]);
  const [urunler, setUrunler] = useState([]);

  // Yeni kategori
  const [yeniKategori, setYeniKategori] = useState("");

  // Yeni ürün alanları
  const [uAd, setUAd] = useState("");
  const [uKategori, setUKategori] = useState("");
  const [uBarkod, setUBarkod] = useState("");
  const [uMaliyet, setUMaliyet] = useState("");
  const [uSatis, setUSatis] = useState("");
  const [uStok, setUStok] = useState("");
  const [uKritik, setUKritik] = useState("10");
  const [uTakip, setUTakip] = useState(true);

  // Güncelleme seçimleri
  const [filtreKategori, setFiltreKategori] = useState("");
  const [seciliUrunAd, setSeciliUrunAd] = useState("");

  const [gStok, setGStok] = useState("");
  const [gMaliyet, setGMaliyet] = useState("");
  const [gSatis, setGSatis] = useState("");
  const [gKritik, setGKritik] = useState("");
  const [gTakip, setGTakip] = useState(true);

  const guncelleRef = useRef(null);

  const [kritikAlarm, setKritikAlarm] = useState(false);

  // ---------- HELPERS ----------
  const read = (k, d) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : d;
    } catch {
      return d;
    }
  };
  const write = (k, val) => localStorage.setItem(k, JSON.stringify(val));

  const refresh = () => {
    const kat = read(KATEGORI_KEY, []);
    const ur = read(URUN_KEY, []);
    setKategoriler(kat);
    setUrunler(ur);
  };

  const notify = () => window.dispatchEvent(new Event("mc_data_updated"));

  useEffect(() => {
    refresh();
  }, []);

  // ---------- ALARM HESAPLAMA ----------
  useEffect(() => {
    const kritiks = urunler.filter(
      (u) =>
        u.stokTakibi === true &&
        Number(u.stock || 0) <= Number(u.critical || 0)
    );
    setKritikAlarm(kritiks.length > 0);
  }, [urunler]);

  // ---------- KATEGORİ ----------
  const kategoriEkle = () => {
    const name = yeniKategori.trim().toUpperCase();
    if (!name) return alert("Kategori adı giriniz.");
    const list = read(KATEGORI_KEY, []);
    if (list.some((k) => (k.name || k.ad) === name)) {
      return alert("Bu kategori zaten var.");
    }
    list.push({ name });
    write(KATEGORI_KEY, list);

    setYeniKategori("");
    refresh();
    notify();
  };

  const kategoriSil = (name) => {
    if (!window.confirm(`${name} kategorisi silinsin mi?`)) return;
    const kat = read(KATEGORI_KEY, []).filter((k) => k.name !== name);
    write(KATEGORI_KEY, kat);

    // O kategorideki ürünleri de sil
    const uru = read(URUN_KEY, []).filter((u) => u.categoryName !== name);
    write(URUN_KEY, uru);

    refresh();
    notify();
  };

  // ---------- ÜRÜN EKLE ----------
  const urunEkle = () => {
    if (!uAd.trim() || !uKategori.trim())
      return alert("Ürün adı ve kategori zorunludur.");

    const list = read(URUN_KEY, []);
    if (list.some((x) => x.name === uAd.trim()))
      return alert("Bu ürün zaten var.");

    list.push({
      name: uAd.trim(),
      categoryName: uKategori.trim(),
      barkod: uBarkod.trim(),
      costPrice: Number(uMaliyet || 0),
      salePrice: Number(uSatis || 0),
      stock: Number(uStok || 0),
      critical: Number(uKritik || 10),
      stokTakibi: uTakip,
    });

    write(URUN_KEY, list);
    notify();
    refresh();

    setUAd("");
    setUBarkod("");
    setUKategori("");
    setUMaliyet("");
    setUSatis("");
    setUStok("");
    setUKritik("10");
    setUTakip(true);
  };

  const urunSil = (name) => {
    if (!window.confirm(`${name} ürünü silinsin mi?`)) return;
    const yeni = read(URUN_KEY, []).filter((u) => u.name !== name);
    write(URUN_KEY, yeni);
    refresh();
    notify();

    if (seciliUrunAd === name) {
      setSeciliUrunAd("");
    }
  };

  // ---------- ÜRÜN LİSTE ----------
  const kategoriAdlari = useMemo(
    () => (kategoriler || []).map((k) => k.name),
    [kategoriler]
  );

  const urunMap = useMemo(
    () =>
      (urunler || []).map((u) => ({
        ...u,
        name: u.name,
        stock: Number(u.stock || 0),
        critical: Number(u.critical || 0),
      })),
    [urunler]
  );

  const filtreliUrunler = useMemo(
  () =>
    urunMap
      .filter((u) =>
        filtreKategori ? u.categoryName === filtreKategori : true
      )
      .sort((a, b) => (a?.name || "").localeCompare(b?.name || "")),
  [urunMap, filtreKategori]
);

  const seciliUrun = useMemo(
    () => urunMap.find((u) => u.name === seciliUrunAd) || null,
    [urunMap, seciliUrunAd]
  );

  // Ürün seçilince input doldur
  useEffect(() => {
    if (!seciliUrun) {
      setGMaliyet("");
      setGSatis("");
      setGStok("");
      setGKritik("10");
      setGTakip(true);
      return;
    }

    setGMaliyet(seciliUrun.costPrice);
    setGSatis(seciliUrun.salePrice);
    setGStok(seciliUrun.stock);
    setGKritik(seciliUrun.critical);
    setGTakip(seciliUrun.stokTakibi === true);
  }, [seciliUrun]);

  // ---------- UPDATE ----------
  const temelGuncelle = (cb) => {
    if (!seciliUrun) return alert("Önce ürün seçin.");
    const list = read(URUN_KEY, []);
    const idx = list.findIndex((u) => u.name === seciliUrun.name);
    if (idx === -1) return;

    const kopya = { ...list[idx] };
    cb(kopya);
    list[idx] = kopya;

    write(URUN_KEY, list);
    refresh();
    notify();
  };

  const stokGuncelle = () =>
    temelGuncelle((x) => (x.stock = Number(gStok)));

  const maliyetGuncelle = () =>
    temelGuncelle((x) => (x.costPrice = Number(gMaliyet)));

  const satisGuncelle = () =>
    temelGuncelle((x) => (x.salePrice = Number(gSatis)));

  const kritikGuncelle = () =>
    temelGuncelle((x) => (x.critical = Number(gKritik)));

  const takipGuncelle = () =>
    temelGuncelle((x) => (x.stokTakibi = gTakip));

  // ---------- Alarm → İlk kritik ürüne git ----------
  const kritikUrunGoster = () => {
    const kritiks = urunMap.filter(
      (u) => u.stokTakibi === true && u.stock <= u.critical
    );
    if (kritiks.length === 0) return;
    const ilk = kritiks[0];
    setFiltreKategori(ilk.categoryName);
    setSeciliUrunAd(ilk.name);
    setTimeout(
      () =>
        guncelleRef.current?.scrollIntoView({ behavior: "smooth" }),
      100
    );
  };

  // ---------- TEMALAR ----------
  const RENK = { arka: "#f5e7d0", kart: "#fffaf2", kahve: "#4b2e05" };
  const input = {
    padding: "9px",
    borderRadius: "8px",
    border: "1px solid #d1c0a3",
    fontSize: "15px",
  };
  const button = {
    background: RENK.kahve,
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  };

  // ================================================================
  // ========================== RETURN ===============================
  // ================================================================
  return (
    <div
      style={{
        background: RENK.arka,
        minHeight: "100vh",
        padding: 15,
        color: RENK.kahve,
        display: "grid",
        gridTemplateColumns: "0.8fr 1fr 1fr",
        gap: 15,
      }}
    >
      {/* GLOBAL KRITIK ALARM */}
      {kritikAlarm && (
        <div
          onClick={kritikUrunGoster}
          title="Kritik stok mevcut!"
          style={{
            position: "fixed",
            top: 18,
            right: 30,
            width: 0,
            height: 0,
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderBottom: "35px solid #d32f2f",
            cursor: "pointer",
            zIndex: 2000,
          }}
        />
      )}

      {/* 1) KATEGORİ PANELİ */}
      <div
        style={{
          background: RENK.kart,
          padding: 12,
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>KATEGORİLER</h2>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            style={{ ...input, flex: 1 }}
            placeholder="Yeni kategori"
            value={yeniKategori}
            onChange={(e) => setYeniKategori(e.target.value)}
          />
          <button style={button} onClick={kategoriEkle}>
            Ekle
          </button>
        </div>

        <div
          style={{
            border: "1px dashed #d1c0a3",
            borderRadius: 10,
            padding: 8,
            maxHeight: 380,
            overflowY: "auto",
          }}
        >
          {kategoriAdlari.map((name) => (
            <div
              key={name}
              style={{
                padding: "6px 10px",
                background: "#f8efdd",
                borderRadius: 10,
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <b>{name}</b>
              <button
                onClick={() => kategoriSil(name)}
                style={{
                  border: "1px solid #b3261e",
                  color: "#b3261e",
                  background: "transparent",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2) ÜRÜN EKLE PANELİ */}
      <div
        style={{
          background: RENK.kart,
          padding: 12,
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>ÜRÜN EKLE-SİL</h2>

        <div style={{ display: "grid", gap: 8 }}>
          <input
            style={input}
            placeholder="Ürün adı"
            value={uAd}
            onChange={(e) => setUAd(e.target.value)}
          />

          <input
            style={input}
            placeholder="Barkod"
            value={uBarkod}
            onChange={(e) => setUBarkod(e.target.value)}
          />

          <select
            style={{ ...input, background: "white" }}
            value={uKategori}
            onChange={(e) => setUKategori(e.target.value)}
          >
            <option value="">Kategori seç</option>
            {kategoriAdlari.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...input, flex: 1 }}
              placeholder="Maliyet ₺"
              type="number"
              value={uMaliyet}
              onChange={(e) => setUMaliyet(e.target.value)}
            />
            <input
              style={{ ...input, flex: 1 }}
              placeholder="Satış ₺"
              type="number"
              value={uSatis}
              onChange={(e) => setUSatis(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...input, flex: 1 }}
              placeholder="Stok"
              type="number"
              value={uStok}
              onChange={(e) => setUStok(e.target.value)}
            />
            <input
              style={{ ...input, flex: 1 }}
              placeholder="Kritik Stok"
              type="number"
              value={uKritik}
              onChange={(e) => setUKritik(e.target.value)}
            />
          </div>

          {/* STOK TAKİBİ */}
          <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={uTakip}
              onChange={(e) => setUTakip(e.target.checked)}
            />
            <b>Stok Takibi Yap</b>
          </label>

          <button style={button} onClick={urunEkle}>
            ÜRÜNÜ EKLE
          </button>
        </div>

        <hr style={{ margin: "15px 0" }} />

        <h3 style={{ margin: "8px 0" }}>Mevcut Ürünler</h3>
        <div
          style={{
            maxHeight: 320,
            overflowY: "auto",
            paddingRight: 5,
          }}
        >
          {urunMap.map((u) => (
            <div
              key={u.name}
              style={{
                padding: "6px 10px",
                background: "#f8efdd",
                borderRadius: 10,
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                <b>{u.name}</b> ({u.categoryName}){" "}
                {u.stokTakibi ? "" : (
                  <span style={{ color: "#b3261e", fontWeight: "bold" }}>
                    — TAKİP YOK
                  </span>
                )}
              </span>

              <button
                onClick={() => urunSil(u.name)}
                style={{
                  border: "1px solid #b3261e",
                  color: "#b3261e",
                  background: "transparent",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3) ÜRÜN GÜNCELLE PANELİ */}
      <div
        style={{
          background: RENK.kart,
          padding: 12,
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        ref={guncelleRef}
      >
        <h2 style={{ marginTop: 0 }}>ÜRÜN GÜNCELLE</h2>

        {/* Ürün Seçim */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <select
            style={{ ...input, flex: 1, background: "white" }}
            value={filtreKategori}
            onChange={(e) => {
              setFiltreKategori(e.target.value);
              setSeciliUrunAd("");
            }}
          >
            <option value="">(Tüm Kategoriler)</option>
            {kategoriAdlari.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>

          <select
            style={{ ...input, flex: 1, background: "white" }}
            value={seciliUrunAd}
            onChange={(e) => setSeciliUrunAd(e.target.value)}
          >
            <option value="">(Ürün Seç)</option>
            {filtreliUrunler.map((u) => (
              <option key={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Ürün Bilgi Kartı */}
        {seciliUrun && (
          <div
            style={{
              background: "#f8efdd",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 5,
            }}
          >
            <div><b>Ad:</b> {seciliUrun.name}</div>
            <div><b>Kategori:</b> {seciliUrun.categoryName}</div>
            <div><b>Stok:</b> {seciliUrun.stokTakibi ? seciliUrun.stock : "Takip Yok"}</div>
            <div><b>Kritik:</b> {seciliUrun.stokTakibi ? seciliUrun.critical : "—"}</div>
            <div><b>Maliyet:</b> {seciliUrun.costPrice} ₺</div>
            <div><b>Satış:</b> {seciliUrun.salePrice} ₺</div>
            <div><b>Takip:</b> {seciliUrun.stokTakibi ? "Açık" : "Kapalı"}</div>
          </div>
        )}

        {/* GÜNCELLEME BLOKLARI */}
        {seciliUrun && (
          <div style={{ display: "grid", gap: 10 }}>
            {/* Stok */}
            <div style={{ background: "#f8efdd", padding: 8, borderRadius: 10 }}>
              <b>Stok Güncelle</b>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...input, flex: 1 }}
                  disabled={!gTakip}
                  value={gStok}
                  onChange={(e) => setGStok(e.target.value)}
                />
                <button
                  style={{ ...button, opacity: gTakip ? 1 : 0.3 }}
                  disabled={!gTakip}
                  onClick={stokGuncelle}
                >
                  Kaydet
                </button>
              </div>
            </div>

            {/* Kritik Stok */}
            <div style={{ background: "#f8efdd", padding: 8, borderRadius: 10 }}>
              <b>Kritik Stok Güncelle</b>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...input, flex: 1 }}
                  disabled={!gTakip}
                  value={gKritik}
                  onChange={(e) => setGKritik(e.target.value)}
                />
                <button
                  style={{ ...button, opacity: gTakip ? 1 : 0.3 }}
                  disabled={!gTakip}
                  onClick={kritikGuncelle}
                >
                  Kaydet
                </button>
              </div>
            </div>

            {/* Maliyet */}
            <div style={{ background: "#f8efdd", padding: 8, borderRadius: 10 }}>
              <b>Maliyet Güncelle</b>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...input, flex: 1 }}
                  value={gMaliyet}
                  onChange={(e) => setGMaliyet(e.target.value)}
                />
                <button style={button} onClick={maliyetGuncelle}>
                  Kaydet
                </button>
              </div>
            </div>

            {/* Satış */}
            <div style={{ background: "#f8efdd", padding: 8, borderRadius: 10 }}>
              <b>Satış Fiyatı Güncelle</b>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...input, flex: 1 }}
                  value={gSatis}
                  onChange={(e) => setGSatis(e.target.value)}
                />
                <button style={button} onClick={satisGuncelle}>
                  Kaydet
                </button>
              </div>
            </div>

            {/* Stok Takibi */}
            <div style={{ background: "#f8efdd", padding: 8, borderRadius: 10 }}>
              <b>Stok Takibi</b>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={gTakip}
                  onChange={(e) => setGTakip(e.target.checked)}
                />
                <span>{gTakip ? "Açık" : "Kapalı"}</span>

                <button style={button} onClick={takipGuncelle}>
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
