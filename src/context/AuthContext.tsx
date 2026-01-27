import React, { createContext, useContext, useMemo, useState } from "react";
import { authApi, authStorage } from "@/services/auth.api";
import type { AuthUser, Role } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const USERNAME_KEY = "username";
const ID_BENH_AN_KEY = "idBenhAn";

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const role = authStorage.getRole();
    const access = authStorage.getAccessToken();
    const username = localStorage.getItem(USERNAME_KEY);
    const idBenhAn = localStorage.getItem(ID_BENH_AN_KEY);
    return access && role && username
      ? { username, role, idBenhAn: idBenhAn || null }
      : null;
  });

  const isAuthenticated = !!authStorage.getAccessToken();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,

      login: async (username, password) => {
        const res = await authApi.login(username, password);
        localStorage.setItem(USERNAME_KEY, username);
        if (res?.idBenhAn !== undefined) {
          localStorage.setItem(ID_BENH_AN_KEY, res.idBenhAn ?? "");
        }

        setUser({
          username: res.username || username,
          role: res.role as Role,
          idBenhAn: res.idBenhAn ?? null,
        });

        return true;
      },

      logout: async () => {
        await authApi.logout();
        localStorage.removeItem(USERNAME_KEY);
        localStorage.removeItem(ID_BENH_AN_KEY);
        setUser(null);
      },
    }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
