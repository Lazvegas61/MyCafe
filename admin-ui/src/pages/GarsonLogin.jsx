import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GarsonLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Kullanıcı adı ve şifre boş olamaz.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Giriş hatası");
        return;
      }

      // Token kaydet
      localStorage.setItem("mc_token", data.token);

      // Token decode → rol al
      const decoded = JSON.parse(atob(data.token.split(".")[1]));
      const role = decoded.role;

      // ROLE KAYDET
      localStorage.setItem("mc_role", role);

      // Yönlendirme
      if (role === "GARSON") {
        navigate("/garson/masalar");
      } else {
        setError("Bu kullanıcı garson değildir.");
      }

    } catch (err) {
      console.error(err);
      setError("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f5e7d0",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          border: "2px solid #4b2e05",
          width: "320px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Garson Girişi</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            className="form-control mb-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Şifre"
            className="form-control mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

          <button className="btn btn-dark w-100">Giriş Yap</button>
        </form>
      </div>
    </div>
  );
}
