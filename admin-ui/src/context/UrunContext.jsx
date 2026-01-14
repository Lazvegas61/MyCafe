import React, { createContext, useState, useEffect, useContext } from "react";

const UrunContext = createContext();

export function UrunProvider({ children }) {
  const [urunler, setUrunler] = useState([]);

  // localStorage'dan yükle
  useEffect(() => {
    const kayitli = localStorage.getItem("urunler");
    if (kayitli) setUrunler(JSON.parse(kayitli));
  }, []);

  // Değişiklikte kaydet
  useEffect(() => {
    localStorage.setItem("urunler", JSON.stringify(urunler));
  }, [urunler]);

  return (
    <UrunContext.Provider value={{ urunler, setUrunler }}>
      {children}
    </UrunContext.Provider>
  );
}

// Hook gibi kullanmak için:
export function useUrunler() {
  return useContext(UrunContext);
}

