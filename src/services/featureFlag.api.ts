import { env } from "@/config/env";
import { authenticatedRequest } from "@/services/auth.api";

const BASE = `${env.API_BACKEND_AUTH_NODE_URL}/api/feature-flags`;

export const featureFlagApi = {
  getAll: async () => {
    const res = await authenticatedRequest(BASE, { method: "GET" });
    if (!res.ok) throw new Error("Không thể tải danh sách feature flags");
    const result = await res.json();
    return result.data ?? result;
  },

  getByCode: async (code: string) => {
    const res = await authenticatedRequest(`${BASE}/${code}`, { method: "GET" });
    if (!res.ok) throw new Error("Không thể tải feature flag");
    return res.json();
  },

  create: async (payload: { code: string; name: string; description?: string; reason: string }) => {
    const res = await authenticatedRequest(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Không thể tạo feature flag");
    return data;
  },

  update: async (code: string, payload: { name?: string; description?: string }) => {
    const res = await authenticatedRequest(`${BASE}/${code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Không thể cập nhật feature flag");
    return data;
  },

  toggle: async (code: string, payload: { isEnabled: boolean; reason: string }) => {
    const res = await authenticatedRequest(`${BASE}/${code}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Không thể toggle feature flag");
    return data;
  },

  remove: async (code: string) => {
    const res = await authenticatedRequest(`${BASE}/${code}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Không thể xóa feature flag");
    return data;
  },
};
