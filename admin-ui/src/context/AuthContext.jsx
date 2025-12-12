import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Uygulama açıldığında kullanıcıyı localStorage'dan yükle
  useEffect(() => {
    const savedUser = localStorage.getItem("mc_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.log("JSON parse hatası:", err);
        localStorage.removeItem("mc_user");
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    if (username === "Admin" && password === "1234") {
      const demoUser = { username: "Admin", role: "ADMIN" };
      localStorage.setItem("mc_user", JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true };
    }
    return { success: false, message: "Hatalı kullanıcı adı veya şifre" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mc_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
