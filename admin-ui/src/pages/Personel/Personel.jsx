import React, { useEffect, useState } from "react";

const LS_KEY = "mc_personeller";
const ADISYON_KEY = "mc_adisyonlar";
const BILARDO_ADISYON_KEY = "bilardo_adisyonlar";

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

    // Kullanıcı adı kontrolü
    const usernameExists = personeller.some(p => p.username === yeniUser);
    if (usernameExists) {
      gosterUyari("Bu kullanıcı adı zaten kullanılıyor!");
      return;
    }

    const yeni = {
      id: Date.now(),
      adSoyad: yeniAd,
      username: yeniUser,
      sifre: yeniSifre,
      rol: yeniRol,
      email: "",
      telefon: "",
      aktif: true,
      olusturmaTarihi: new Date().toISOString()
    };

    const guncel = [...personeller, yeni];
    setPersoneller(guncel);
    localStorage.setItem(LS_KEY, JSON.stringify(guncel));

    setYeniAd("");
    setYeniUser("");
    setYeniSifre("");

    gosterUyari("Personel başarıyla eklendi");
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
    gosterUyari("Şifre başarıyla güncellendi");
  };

  // Garson açık adisyon kontrolü
  const garsonAcilisKontrol = (username) => {
    const adisyonlar = JSON.parse(localStorage.getItem(ADISYON_KEY)) || [];
    const bilardoAdisyonlar = JSON.parse(localStorage.getItem(BILARDO_ADISYON_KEY)) || [];
    
    // Normal adisyon kontrolü
    const normalAcik = adisyonlar.some(
      (a) => a.acilisYapan === username && (a.durum === "AÇIK" || a.durum === "ACIK" || (!a.kapali && !a.isAcil))
    );
    
    // Bilardo adisyon kontrolü
    const bilardoAcik = bilardoAdisyonlar.some(
      (a) => a.acilisYapan === username && (a.durum === "AÇIK" || a.durum === "ACIK" || (!a.kapali && !a.isAcil))
    );
    
    return normalAcik || bilardoAcik;
  };

  // Demo admin kontrolü
  const isDemoAdmin = (personel) => {
    return personel.username === "ADMIN" || personel.username === "Admin";
  };

  // Silme işlemi
  const sil = () => {
    if (!secili) return;

    // Demo admin silinemez
    if (isDemoAdmin(secili)) {
      gosterUyari("Demo Admin kullanıcısı silinemez!");
      return;
    }

    // Garson kontrolü
    if (secili.rol === "GARSON") {
      if (garsonAcilisKontrol(secili.username)) {
        gosterUyari("Bu garsonun üzerinde açık adisyon var. Silinemez.");
        return;
      }
    }

    if (!window.confirm(`${secili.adSoyad} isimli kullanıcıyı silmek istediğinize emin misiniz?`)) return;

    const guncel = personeller.filter((p) => p.id !== secili.id);
    setPersoneller(guncel);
    localStorage.setItem(LS_KEY, JSON.stringify(guncel));
    setSecili(null);

    gosterUyari("Kullanıcı başarıyla silindi");
  };

  // Aktif/pasif yap
  const toggleAktif = () => {
    if (!secili) return;
    
    // Demo admin pasif yapılamaz
    if (isDemoAdmin(secili)) {
      gosterUyari("Demo Admin kullanıcısı pasif yapılamaz!");
      return;
    }
    
    const yeniDurum = !secili.aktif;
    kaydetDegisiklik("aktif", yeniDurum);
    gosterUyari(`Kullanıcı ${yeniDurum ? "aktif" : "pasif"} yapıldı`);
  };

  // ROL RENK DÖNÜŞÜMÜ
  const getRolColor = (rol) => {
    switch(rol) {
      case "ADMIN": return "#e74c3c"; // Kırmızı
      case "GARSON": return "#3498db"; // Mavi
      case "MUTFAK": return "#2ecc71"; // Yeşil
      default: return "#95a5a6"; // Gri
    }
  };

  // ROL LABEL DÖNÜŞÜMÜ
  const getRolLabel = (rol) => {
    switch(rol) {
      case "ADMIN": return "Yönetici";
      case "GARSON": return "Garson";
      case "MUTFAK": return "Mutfak";
      default: return rol;
    }
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
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
        <h2 style={{ fontSize: "26px", marginBottom: "20px", color: "#4b2e05" }}>
          Personel Listesi
        </h2>

        {personeller.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#7f8c8d" }}>
            Henüz personel eklenmemiş.
          </div>
        ) : (
          personeller.map((p) => (
            <div
              key={p.id}
              onClick={() => sec(p)}
              style={{
                backgroundColor: secili?.id === p.id ? "#e6d4b8" : "white",
                padding: "15px",
                borderRadius: "10px",
                border: "2px solid #4b2e05",
                marginBottom: "12px",
                cursor: "pointer",
                position: "relative",
                opacity: p.aktif === false ? 0.6 : 1
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <b style={{ fontSize: "18px" }}>{p.adSoyad}</b>
                  {isDemoAdmin(p) && (
                    <span style={{
                      marginLeft: "10px",
                      fontSize: "12px",
                      backgroundColor: "#f39c12",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}>
                      DEMO
                    </span>
                  )}
                  {p.aktif === false && (
                    <span style={{
                      marginLeft: "10px",
                      fontSize: "12px",
                      backgroundColor: "#95a5a6",
                      color: "white",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}>
                      PASİF
                    </span>
                  )}
                  <br />
                  <span style={{ fontSize: "16px", color: "#34495e" }}>@{p.username}</span> <br />
                </div>
                <span style={{ 
                  color: "white", 
                  fontWeight: "bold",
                  backgroundColor: getRolColor(p.rol),
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}>
                  {getRolLabel(p.rol)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SAĞ PANEL ─ YENİ EKLE + DETAY */}
      <div style={{ width: "65%", padding: "20px" }}>
        {/* YENİ PERSONEL EKLE */}
        <div style={{ 
          backgroundColor: "white", 
          padding: "25px", 
          borderRadius: "12px",
          border: "2px solid #4b2e05",
          marginBottom: "30px"
        }}>
          <h2 style={{ fontSize: "26px", marginBottom: "20px", color: "#4b2e05" }}>
            Yeni Personel Ekle
          </h2>

          <div style={formGrid}>
            <label style={labelStyle}>Ad Soyad:</label>
            <input
              style={inputStyleFixed}
              value={yeniAd}
              onChange={(e) => setYeniAd(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
            />

            <label style={labelStyle}>Kullanıcı Adı:</label>
            <input
              style={inputStyleFixed}
              value={yeniUser}
              onChange={(e) => setYeniUser(e.target.value)}
              placeholder="Örn: ahmetyilmaz"
            />

            <label style={labelStyle}>Şifre:</label>
            <input
              type="password"
              style={inputStyleFixed}
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="En az 4 karakter"
            />

            <label style={labelStyle}>Rol:</label>
            <select
              style={inputStyleFixed}
              value={yeniRol}
              onChange={(e) => setYeniRol(e.target.value)}
            >
              <option value="GARSON">Garson</option>
              <option value="ADMIN">Yönetici (Admin)</option>
              <option value="MUTFAK">Mutfak Personeli</option>
            </select>
          </div>

          <button onClick={ekle} style={btnStyle}>
            Personel Ekle
          </button>
        </div>

        {/* SEÇİLİ PERSONEL DETAYI */}
        {secili && (
          <div style={{ 
            backgroundColor: "white", 
            padding: "25px", 
            borderRadius: "12px",
            border: "2px solid #4b2e05"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "26px", color: "#4b2e05" }}>
                Personel Detayı
              </h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ 
                  color: "white", 
                  fontWeight: "bold",
                  backgroundColor: getRolColor(secili.rol),
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}>
                  {getRolLabel(secili.rol)}
                </span>
                {isDemoAdmin(secili) && (
                  <span style={{
                    backgroundColor: "#f39c12",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}>
                    DEMO ADMIN
                  </span>
                )}
              </div>
            </div>

            <div style={formGrid}>
              <label style={labelStyle}>Ad Soyad:</label>
              <input
                style={inputStyleFixed}
                value={secili.adSoyad}
                onChange={(e) =>
                  kaydetDegisiklik("adSoyad", e.target.value)
                }
                disabled={isDemoAdmin(secili)}
              />

              <label style={labelStyle}>Kullanıcı Adı:</label>
              <input
                style={inputStyleFixed}
                value={secili.username}
                onChange={(e) =>
                  kaydetDegisiklik("username", e.target.value)
                }
                disabled={isDemoAdmin(secili)}
              />

              <label style={labelStyle}>Yeni Şifre:</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="password"
                  style={inputStyleFixed}
                  value={sifreInput}
                  onChange={(e) => setSifreInput(e.target.value)}
                  placeholder="Yeni şifre girin"
                />
                <button onClick={sifreDegistir} style={smallBtn}>
                  Şifreyi Güncelle
                </button>
              </div>

              <label style={labelStyle}>Rol:</label>
              <select
                style={inputStyleFixed}
                value={secili.rol}
                onChange={(e) =>
                  kaydetDegisiklik("rol", e.target.value)
                }
                disabled={isDemoAdmin(secili)}
              >
                <option value="GARSON">Garson</option>
                <option value="ADMIN">Yönetici (Admin)</option>
                <option value="MUTFAK">Mutfak Personeli</option>
              </select>

              <label style={labelStyle}>Durum:</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ fontSize: "18px", color: secili.aktif ? "#27ae60" : "#e74c3c" }}>
                  {secili.aktif ? "✔ Aktif" : "✘ Pasif"}
                </span>
                {!isDemoAdmin(secili) && (
                  <button 
                    onClick={toggleAktif} 
                    style={{
                      padding: "6px 12px",
                      backgroundColor: secili.aktif ? "#e74c3c" : "#27ae60",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    {secili.aktif ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                )}
              </div>

              {secili.email !== undefined && (
                <>
                  <label style={labelStyle}>E-posta:</label>
                  <input
                    style={inputStyleFixed}
                    value={secili.email || ""}
                    onChange={(e) =>
                      kaydetDegisiklik("email", e.target.value)
                    }
                  />
                </>
              )}

              {secili.telefon !== undefined && (
                <>
                  <label style={labelStyle}>Telefon:</label>
                  <input
                    style={inputStyleFixed}
                    value={secili.telefon || ""}
                    onChange={(e) =>
                      kaydetDegisiklik("telefon", e.target.value)
                    }
                  />
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "25px" }}>
              {!isDemoAdmin(secili) && (
                <button onClick={sil} style={delBtnStyle}>
                  Personeli Sil
                </button>
              )}
              
              {isDemoAdmin(secili) && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px dashed #4b2e05",
                  borderRadius: "8px",
                  color: "#4b2e05"
                }}>
                  <strong>Demo Admin:</strong> Bu kullanıcı sistem için özel tanımlanmıştır. Silinemez veya rolü değiştirilemez.
                </div>
              )}
            </div>

            {/* EK BİLGİLER */}
            <div style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <h4 style={{ marginBottom: "10px", color: "#4b2e05" }}>Yetkiler:</h4>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {secili.rol === "ADMIN" && (
                  <>
                    <li>✅ Tüm işlemleri yapabilir</li>
                    <li>✅ Gün başlatma/bitirme</li>
                    <li>✅ Rapor görüntüleme</li>
                    <li>✅ Personel yönetimi</li>
                  </>
                )}
                {secili.rol === "GARSON" && (
                  <>
                    <li>✅ Masa işlemleri</li>
                    <li>✅ Adisyon açma/kapatma</li>
                    <li>✅ Gün başlatma/bitirme</li>
                    <li>❌ Rapor görüntüleme</li>
                    <li>❌ Personel yönetimi</li>
                  </>
                )}
                {secili.rol === "MUTFAK" && (
                  <>
                    <li>✅ Sipariş görüntüleme</li>
                    <li>✅ Sipariş hazırlama</li>
                    <li>❌ Masa işlemleri</li>
                    <li>❌ Gün işlemleri</li>
                  </>
                )}
              </ul>
            </div>
          </div>
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
  color: "#4b2e05",
};

const inputStyleFixed = {
  padding: "10px 14px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "1px solid #4b2e05",
  width: "100%",
  backgroundColor: "#f8f9fa",
  color: "#4b2e05",
};

const btnStyle = {
  padding: "12px 24px",
  backgroundColor: "#4b2e05",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "all 0.3s ease",
};

const smallBtn = {
  padding: "10px 18px",
  backgroundColor: "#3498db",
  color: "white",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "all 0.3s ease",
};

const delBtnStyle = {
  padding: "12px 24px",
  backgroundColor: "#c0392b",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "all 0.3s ease",
};

// Hover efektleri
btnStyle.onmouseenter = smallBtn.onmouseenter = delBtnStyle.onmouseenter = function(e) {
  e.currentTarget.style.opacity = "0.9";
  e.currentTarget.style.transform = "translateY(-2px)";
};
btnStyle.onmouseleave = smallBtn.onmouseleave = delBtnStyle.onmouseleave = function(e) {
  e.currentTarget.style.opacity = "1";
  e.currentTarget.style.transform = "translateY(0)";
};