import { createContext, useContext, useEffect, useState } from "react";

interface TokenContextType {
  token: string | null;
  setToken: (token: string | null) => void;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const useToken = () => {
  const token = useContext(TokenContext);

  if (token === null) {
    throw new Error("useToken must be used within a TokenProvider");
  }

  return token;
};

export const TokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  // find existing token
  useEffect(() => {
    const storedToken = sessionStorage.getItem("accessToken");

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // persist current token
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("accessToken", token);
    }
  }, [token]);

  return (
    <TokenContext.Provider value={{ token, setToken }}>
      {children}
    </TokenContext.Provider>
  );
};
