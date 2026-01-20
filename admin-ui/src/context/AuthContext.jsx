import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gunAktif, setGunAktif] = useState(() => {
    return localStorage.getItem("mycafe_gun_durumu") === "aktif";
  });

  // --------------------------------------------------
  // AUTH BOOTSTRAP
  // --------------------------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem("mc_user");
    if (!savedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    } catch {
      localStorage.removeItem("mc_user");
    }

    setLoading(false);
  }, []);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  const login = (username, password) => {
    const u = username.trim().toLowerCase();
    const p = password.trim();

    // ✅ DEMO ADMIN (CASE INSENSITIVE)
    if (u === "admin" && p === "1234") {
      const demoUser = {
        id: 1,
        username: "ADMIN",
        adSoyad: "Demo Admin",
        rol: "ADMIN",
        email: "admin@mycafe.com",
      };

      localStorage.setItem("mc_user", JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true, user: demoUser };
    }

    // --------------------------------------------------
    // PERSONEL LOGIN
    // --------------------------------------------------
    try {
      const personeller = JSON.parse(
        localStorage.getItem("mc_personeller") || "[]"
      );

      const personel = personeller.find(
        (p) =>
          p.username?.toLowerCase() === u &&
          String(p.sifre) === String(password)
      );

      if (personel) {
        const userData = {
          id: personel.id,
          username: personel.username,
          adSoyad: personel.adSoyad,
          rol: personel.rol,
          email: personel.email,
          telefon: personel.telefon,
        };

        localStorage.setItem("mc_user", JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
    } catch (err) {
      console.error("Login hatası:", err);
    }

    return { success: false, message: "Hatalı kullanıcı adı veya şifre" };
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("mc_user");
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        gunAktif,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
