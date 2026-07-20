import { env } from "@/config/env";
import type { LoginResponse, Role } from "@/types/auth";

const KEYS = {
  ACCESS: "accessToken",
  REFRESH: "refreshToken",
  ROLE: "role",
};

export const authStorage = {
  set: (access: string, refresh: string, role: Role) => {
    localStorage.setItem(KEYS.ACCESS, access);
    localStorage.setItem(KEYS.REFRESH, refresh);
    localStorage.setItem(KEYS.ROLE, role);
  },
  clear: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),
  getAccessToken: () => localStorage.getItem(KEYS.ACCESS),
  getRefreshToken: () => localStorage.getItem(KEYS.REFRESH),
  getRole: () => localStorage.getItem(KEYS.ROLE) as Role | null,
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${authStorage.getAccessToken()}`,
});

const parseJwt = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getUserIdFromToken = (token?: string | null) => {
  if (!token) return null;
  const payload = parseJwt(token) as any;
  const id = payload?.id || payload?._id || payload?.userId || payload?.sub;
  return id ? String(id) : null;
};

let refreshPromise: Promise<string> | null = null;
const refreshOnce = async () => {
  if (!refreshPromise) {
    refreshPromise = authApi.refresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

export const authenticatedRequest = async (url: string, options: RequestInit) => {
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders(),
    },
  });

  if (res.status === 401) {
    try {
      console.log("Token expired, attempting auto-refresh...");
      await refreshOnce();
    } catch (refreshError) {
      // refresh thất bại => phiên thực sự đã hết hạn
      authStorage.clear();
      window.location.href = "/#/login";
      throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
    }

    // lỗi mạng khi gọi lại thì để nguyên lỗi ném ra bên dưới, không đăng xuất người dùng
    res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...getAuthHeaders(),
      },
    });
  }

  return res;
};

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${env.API_BACKEND_AUTH_NODE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      let message = "Đăng nhập thất bại";
      const errorBody = await res.json().catch(() => null);
      const serverMsg = errorBody?.message as string | undefined;

      if (res.status === 400) message = "Vui lòng nhập tên đăng nhập và mật khẩu.";
      if (res.status === 401) message = "Tên đăng nhập hoặc mật khẩu không đúng.";
      if (res.status === 403) message = "Tài khoản chưa được cấp quyền truy cập.";
      if (res.status >= 500) message = "Hệ thống đang bận. Vui lòng thử lại sau.";

      if (serverMsg && !/invalid credentials/i.test(serverMsg)) {
        message = serverMsg;
      }

      throw new Error(message);
    }

    const data: LoginResponse = await res.json();
    authStorage.set(data.accessToken, data.refreshToken, data.role);
    return data;
  },

  refresh: async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    const res = await fetch(`${env.API_BACKEND_AUTH_NODE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      authStorage.clear();
      throw new Error("Session expired");
    }

    const data = await res.json();
    authStorage.set(data.accessToken, data.refreshToken || refreshToken, data.role);
    return data.accessToken;
  },

  refreshOnce,

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
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      authStorage.clear();
    }
  },

  // --- CÁC HÀM QUẢN TRỊ NGƯỜI DÙNG (ADMIN) ---

  getUsers: async () => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users`, {
      method: "GET"
    });
    if (!res.ok) throw new Error("Không thể tải danh sách nhân viên");
    const result = await res.json();
    return result.data;
  },

  updateUser: async (id: string, payload: any) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users/${id}`, {
      method: "PATCH", // Hoặc "PUT" tùy theo thiết kế Backend của bạn
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi khi cập nhật tài khoản");
    }
    return await res.json();
  },

  createUser: async (payload: any) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi khi tạo tài khoản");
    }
    return await res.json();
  },

  updateStatus: async (id: string, isActive: boolean) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error("Lỗi khi cập nhật trạng thái");
    return await res.json();
  },

  resetPassword: async (id: string, newPassword: string) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) throw new Error("Lỗi khi đặt lại mật khẩu");
    return await res.json();
  },

  // --- CÁC HÀM QUẢN TRỊ KHOA PHÒNG (ADMIN) ---

  getDepartments: async () => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments`, {
      method: "GET"
    });
    if (!res.ok) throw new Error("Không thể tải danh sách khoa phòng");
    const result = await res.json();
    return result.data;
  },

  getDepartmentHisById: async (id: string) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments/${id}/id-his`, {
      method: "GET"
    });
    if (!res.ok) throw new Error("Không thể lấy idHis của khoa phòng");

    const result = await res.json().catch(() => null);

    if (typeof result === "string") return result;
    if (typeof result?.idHis === "string") return result.idHis;
    if (typeof result?.data === "string") return result.data;
    if (typeof result?.data?.idHis === "string") return result.data.idHis;

    return null;
  },

  createDepartment: async (payload: { name: string; type: 'KHOA' | 'PHONG'; parentId?: string; idHis?: string }) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi khi tạo khoa phòng");
    }
    return await res.json();
  },

  updateDepartment: async (id: string, payload: { name?: string; type?: 'KHOA' | 'PHONG'; parentId?: string; idHis?: string }) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi khi cập nhật");
    }
    return await res.json();
  },

  deleteDepartment: async (id: string) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể xóa khoa phòng");
    }
    return true;
  },

  importUsers: async (users: any[]) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users/import`, {
      method: "POST",
      body: JSON.stringify({ users }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || "Lỗi khi import Excel");
    }

    return await res.json();
  },

  downloadUsersImportTemplate: async () => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/users/import/template`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Không thể tải file mẫu");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_import_tai_khoan.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },

  importDepartments: async (departments: any[]) => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments/import`, {
      method: "POST",
      body: JSON.stringify({ departments }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || "Lỗi khi import khoa phòng");
    }
    return await res.json();
  },

  downloadDepartmentTemplate: async () => {
    const res = await authenticatedRequest(`${env.API_BACKEND_AUTH_NODE_URL}/auth/departments/import/template`, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Không thể tải file mẫu");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_import_khoa_phong.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },
};
