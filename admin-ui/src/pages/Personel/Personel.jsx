import React, { useEffect, useState } from "react";

const LS_KEY = "mc_personeller";
const ADISYON_KEY = "mc_adisyonlar";

export default function Personel() {
  const [personeller, setPersoneller] = useState([]);
  const [secili, setSecili] = useState(null);
  const [uyari, setUyari] = useState("");

  // Yeni personel
  const [yeniAd, setYeniAd] = useState("");
  const [yeniUser, setYeniUser] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniRol, setYeniRol] = useState("GARSON");

  // Şifre güncelle
  const [sifreInput, setSifreInput] = useState("");

  useEffect(() => {
    const kayit = JSON.parse(localStorage.getItem(LS_KEY)) || [];
    setPersoneller(kayit);
  }, []);

  const gosterUyari = (text) => {
    setUyari(text);
    setTimeout(() => setUyari(""), 2000);
  };

  // Yeni personel ekle
  const ekle = () => {
    if (yeniAd.trim() === "" || yeniUser.trim() === "" || yeniSifre.length < 4) {
      gosterUyari("Lütfen bilgileri doğru girin. (Şifre min 4)");
      return;
    }

    const yeni = {
      id: Date.now(),
      adSoyad: yeniAd,
      username: yeniUser,
      sifre: yeniSifre,
      rol: yeniRol,
    };

    const guncel = [...personeller, yeni];
    setPersoneller(guncel);
    localStorage.setItem(LS_KEY, JSON.stringify(guncel));

    setYeniAd("");
    setYeniUser("");
    setYeniSifre("");

    gosterUyari("Personel eklendi");
  };

  // Personel seç
  const sec = (p) => {
    setSecili(p);
    setSifreInput("");
  };

  // Değişiklik kaydet
  const kaydetDegisiklik = (alan, deger) => {
    const guncel = personeller.map((p) =>
      p.id === secili.id ? { ...p, [alan]: deger } : p
    );
    setPersoneller(guncel);
    localStorage.setItem(LS_KEY, JSON.stringify(guncel));

    setSecili({ ...secili, [alan]: deger });
    gosterUyari("Bilgi güncellendi");
  };

  // Şifre güncelleme
  const sifreDegistir = () => {
    if (sifreInput.length < 4) {
      gosterUyari("Şifre en az 4 karakter olmalı");
      return;
    }
    kaydetDegisiklik("sifre", sifreInput);
    setSifreInput("");
  };

  // Garson açık adisyon kontrolü
  const garsonAcilisKontrol = (username) => {
    const adisyonlar = JSON.parse(localStorage.getItem(ADISYON_KEY)) || [];
    return adisyonlar.some(
      (a) => a.acilisYapan === username && a.durum === "AÇIK"
    );
  };

  // Silme işlemi
  const sil = () => {
    if (!secili) return;

    if (secili.rol === "GARSON") {
      if (garsonAcilisKontrol(secili.username)) {
        gosterUyari("Bu garsonun üzerinde açık adisyon var. Silinemez.");
        return;
      }
    }

    if (!window.confirm("Bu kullanıcı silinsin mi?")) return;

    const guncel = personeller.filter((p) => p.id !== secili.id);
    setPersoneller(guncel);
    localStorage.setItem(LS_KEY, JSON.stringify(guncel));
    setSecili(null);

    gosterUyari("Kullanıcı silindi");
  };

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        width: "100%",
        backgroundColor: "#f5e7d0",
        color: "#4b2e05",
        minHeight: "100vh",
      }}
    >
      {/* UYARI */}
      {uyari && (
        <div
          style={{
            position: "fixed",
            bottom: "25px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#4b2e05",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            fontSize: "18px",
            zIndex: 999,
          }}
        >
          {uyari}
        </div>
      )}

      {/* SOL PANEL ─ PERSONEL LİSTESİ */}
      <div
        style={{
          width: "35%",
          padding: "15px",
          borderRight: "3px solid #4b2e05",
          backgroundColor: "#f5e7d0",
        }}
      >
        <h2 style={{ fontSize: "26px", marginBottom: "10px" }}>
          Personel Listesi
        </h2>

        {personeller.length === 0 && (
          <div>Henüz personel eklenmemiş.</div>
        )}

        {personeller.map((p) => (
          <div
            key={p.id}
            onClick={() => sec(p)}
            style={{
              backgroundColor: secili?.id === p.id ? "#e6d4b8" : "white",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #4b2e05",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <b>{p.adSoyad}</b> <br />
            <span style={{ fontSize: "16px" }}>@{p.username}</span> <br />
            <span style={{ color: "#4b2e05", fontWeight: "bold" }}>
              {p.rol}
            </span>
          </div>
        ))}
      </div>

      {/* SAĞ PANEL ─ YENİ EKLE + DETAY */}
      <div style={{ width: "65%", padding: "20px" }}>
        {/* YENİ PERSONEL EKLE */}
        <h2 style={{ fontSize: "26px" }}>Yeni Personel Ekle</h2>

        <div style={formGrid}>
          <label style={labelStyle}>Ad Soyad:</label>
          <input
            style={inputStyleFixed}
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
          />

          <label style={labelStyle}>Kullanıcı Adı:</label>
          <input
            style={inputStyleFixed}
            value={yeniUser}
            onChange={(e) => setYeniUser(e.target.value)}
          />

          <label style={labelStyle}>Şifre:</label>
          <input
            style={inputStyleFixed}
            value={yeniSifre}
            onChange={(e) => setYeniSifre(e.target.value)}
          />

          <label style={labelStyle}>Rol:</label>
          <select
            style={inputStyleFixed}
            value={yeniRol}
            onChange={(e) => setYeniRol(e.target.value)}
          >
            <option value="GARSON">Garson</option>
            <option value="MUTFAK">Mutfak</option>
          </select>
        </div>

        <button onClick={ekle} style={btnStyle}>
          Kaydet
        </button>

        <hr style={{ margin: "30px 0", borderColor: "#4b2e05" }} />

        {/* SEÇİLİ PERSONEL DETAYI */}
        {secili && (
          <>
            <h2 style={{ fontSize: "26px" }}>Seçili Personel</h2>

            <div style={formGrid}>
              <label style={labelStyle}>Ad Soyad:</label>
              <input
                style={inputStyleFixed}
                value={secili.adSoyad}
                onChange={(e) =>
                  kaydetDegisiklik("adSoyad", e.target.value)
                }
              />

              <label style={labelStyle}>Kullanıcı Adı:</label>
              <input
                style={inputStyleFixed}
                value={secili.username}
                onChange={(e) =>
                  kaydetDegisiklik("username", e.target.value)
                }
              />

              <label style={labelStyle}>Yeni Şifre:</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  style={inputStyleFixed}
                  value={sifreInput}
                  onChange={(e) => setSifreInput(e.target.value)}
                />
                <button onClick={sifreDegistir} style={smallBtn}>
                  Güncelle
                </button>
              </div>

              <label style={labelStyle}>Rol:</label>
              <select
                style={inputStyleFixed}
                value={secili.rol}
                onChange={(e) =>
                  kaydetDegisiklik("rol", e.target.value)
                }
              >
                <option value="GARSON">Garson</option>
                <option value="MUTFAK">Mutfak</option>
              </select>
            </div>

            <button onClick={sil} style={delBtnStyle}>
              Personeli Sil
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── STİLLER ───────────────────────── */

const formGrid = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  rowGap: "18px",
  columnGap: "20px",
  marginBottom: "25px",
};

const labelStyle = {
  fontSize: "18px",
  fontWeight: "bold",
};

const inputStyleFixed = {
  padding: "8px 12px",
  fontSize: "18px",
  borderRadius: "8px",
  border: "1px solid #4b2e05",
  width: "100%",
  backgroundColor: "white",
};

const btnStyle = {
  padding: "10px 20px",
  backgroundColor: "#4b2e05",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  cursor: "pointer",
};

const smallBtn = {
  padding: "8px 16px",
  backgroundColor: "#4b2e05",
  color: "white",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};

const delBtnStyle = {
  marginTop: "20px",
  padding: "12px 22px",
  backgroundColor: "#c0392b",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  cursor: "pointer",
};
