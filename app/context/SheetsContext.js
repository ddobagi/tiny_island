import { createContext, useContext, useState } from "react";

const SheetsContext = createContext();

export const SheetsProvider = ({ children }) => {
  const [sheetsId, setSheetsId] = useState(null);

  return (
    <SheetsContext.Provider value={{ sheetsId, setSheetsId }}>
      {children}
    </SheetsContext.Provider>
  );
};

export const useSheets = () => useContext(SheetsContext);
