import { env } from "@/config/env";
import type { LoginResponse, Role } from "@/types/auth";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ROLE_KEY = "role";

export const authStorage = {
  set: (accessToken: string, refreshToken: string, role: Role) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(ROLE_KEY, role);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getRole: () => (localStorage.getItem(ROLE_KEY) as Role | null),
};

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${env.API_BACKEND_AUTH_NODE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

    const result = data as LoginResponse;
    authStorage.set(result.accessToken, result.refreshToken, result.role);
    return result;
  },

  logout: async () => {
    const refreshToken = authStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await fetch(`${env.API_BACKEND_AUTH_NODE_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      authStorage.clear();
    }
  },
};
