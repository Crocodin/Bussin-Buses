import { createContext, ReactNode, useContext, useState } from "react";
import UserObject from "../domain/UserObject";
import { loginUser } from "../api/authApi";

export const TOKEN_KEY = "bussin_token";
export const USER_KEY = "bussin_user";

interface AuthContextValue {
  token: string | null;
  user: UserObject | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): UserObject | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // corrupted value, treat as logged out
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // the function form runs once, so localStorage isn't read on every render
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserObject | null>(readStoredUser);

  const login = async (email: string, password: string) => {
    const data = await loginUser(email, password); // throws on 401, the page catches it
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}