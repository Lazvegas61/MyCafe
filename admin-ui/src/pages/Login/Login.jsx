import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Kullanıcı adı ve şifre giriniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
const result = await login(username, password);

      if (result.success) {
        console.log("✅ Giriş başarılı:", result.user);
        navigate("/ana");
      } else {
        setError(result.message || "Hatalı kullanıcı adı veya şifre");
      }
    } catch (err) {
      console.error("Giriş hatası:", err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
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
          padding: 40,
          background: "white",
          borderRadius: 20,
          boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
          width: 400,
          maxWidth: "90%",
          border: "3px solid #4b2e05",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>☕</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold" }}>
            MyCafe Giriş
          </h2>
          <p style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
            Lütfen kullanıcı bilgilerinizi girin
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
            Kullanıcı Adı
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "2px solid #c9b99a",
              marginBottom: 15,
              fontSize: 16,
              boxSizing: "border-box",
            }}
            placeholder="Kullanıcı adınız"
          />
        </div>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "600" }}>
            Şifre
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "2px solid #c9b99a",
              marginBottom: 15,
              fontSize: 16,
              boxSizing: "border-box",
            }}
            placeholder="Şifreniz"
          />
        </div>

        {error && (
          <div
            style={{
              background: "rgba(231, 76, 60, 0.1)",
              color: "#e74c3c",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: 20,
              border: "1px solid rgba(231, 76, 60, 0.2)",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 15,
            background: loading
              ? "#95a5a6"
              : "linear-gradient(135deg, #4b2e05 0%, #6b4210 100%)",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 17,
            fontWeight: "700",
            boxShadow: "0 6px 15px rgba(75, 46, 5, 0.2)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
        </button>
      </div>
    </div>
  );
}
