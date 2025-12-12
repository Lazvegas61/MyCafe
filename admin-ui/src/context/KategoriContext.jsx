import React, { createContext, useState, useEffect, useContext } from "react";

export const KategoriContext = createContext();

export const KategoriProvider = ({ children }) => {
  const [kategoriler, setKategoriler] = useState([]);

  useEffect(() => {
    const kayitli = localStorage.getItem("kategoriler");
    if (kayitli) {
      try {
        setKategoriler(JSON.parse(kayitli));
      } catch {
        localStorage.removeItem("kategoriler");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("kategoriler", JSON.stringify(kategoriler));
  }, [kategoriler]);

  return (
    <KategoriContext.Provider value={{ kategoriler, setKategoriler }}>
      {children}
    </KategoriContext.Provider>
  );
};

// ✅ Ekledik: useKategoriler hook'u
export const useKategoriler = () => useContext(KategoriContext);
