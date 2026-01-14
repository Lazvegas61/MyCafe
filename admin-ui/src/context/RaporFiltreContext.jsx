import { createContext, useContext, useState } from "react";

const RaporFiltreContext = createContext();

export function RaporFiltreProvider({ children }) {
  const [filtre, setFiltre] = useState({});

  return (
    <RaporFiltreContext.Provider value={{ filtre, setFiltre }}>
      {children}
    </RaporFiltreContext.Provider>
  );
}

export const useRaporFiltre = () => useContext(RaporFiltreContext);
