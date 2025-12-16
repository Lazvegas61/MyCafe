import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    // LocalStorage'daki personel listesi
    const users = JSON.parse(localStorage.getItem("mc_personeller") || "[]");

    // ✔ Senin veri yapına göre doğru eşleştirme:
    const bulunan = users.find(
      (u) =>
        (u.username || "").trim().toLowerCase() ===
          username.trim().toLowerCase() &&
        (u.sifre || "").trim() === password.trim()
    );

    if (!bulunan) {
      setError("Kullanıcı adı veya şifre yanlış");
      return;
    }

    // Aktif kullanıcı kaydı
    localStorage.setItem(
      "mc_user",
      JSON.stringify({
        username: bulunan.username,
        role: bulunan.rol,
      })
    );

    // Rol bazlı yönlendirme
    if (bulunan.rol === "GARSON" || bulunan.rol === "MUTFAK") {
      navigate("/masalar");
    } else {
      navigate("/ana");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f5e7d0",
        color: "#4b2e05",
      }}
    >
      <div
        style={{
          padding: 30,
          background: "white",
          borderRadius: 10,
          boxShadow: "0 0 10px rgba(0,0,0,0.15)",
          width: 340,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>
          MyCafe Giriş
        </h2>

        <label>Kullanıcı Adı</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #c9b99a",
            marginBottom: 15,
            fontSize: 16,
          }}
        />

        <label>Şifre</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #c9b99a",
            marginBottom: 15,
            fontSize: 16,
          }}
        />

        {error && (
          <div style={{ color: "red", marginBottom: 10, fontWeight: 700 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: 12,
            background: "#4b2e05",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          Giriş Yap
        </button>
      </div>
    </div>
  );
}
