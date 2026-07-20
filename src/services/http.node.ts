import { env } from "@/config/env";
import { authStorage, authApi } from "./auth.api";

type ReqOpts = {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    query?: Record<string, any>;
    body?: any;
    headers?: Record<string, string>;
};

export async function requestNode<T>(path: string, opts: ReqOpts = {}): Promise<T> {
    const base = env.API_BACKEND_AUTH_NODE_URL;
    const url = new URL(path.startsWith("http") ? path : `${base}${path}`);
    
    if (opts.query) {
        Object.entries(opts.query).forEach(([k, v]) => {
            if (v != null) url.searchParams.set(k, String(v));
        });
    }

    const getHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStorage.getAccessToken()}`,
        ...(opts.headers ?? {}),
    });

    let res = await fetch(url.toString(), {
        method: opts.method ?? "GET",
        headers: getHeaders(),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (res.status === 401) {
        let newToken: string;
        try {
            newToken = await authApi.refreshOnce();
        } catch {
            // refresh thất bại => phiên thực sự đã hết hạn
            authStorage.clear();
            window.location.href = "/#/login";
            throw new Error("Hết phiên đăng nhập");
        }

        // lỗi mạng khi gọi lại thì để nguyên lỗi ném ra bên dưới, không đăng xuất người dùng
        res = await fetch(url.toString(), {
            method: opts.method ?? "GET",
            headers: { ...getHeaders(), Authorization: `Bearer ${newToken}` },
            body: opts.body ? JSON.stringify(opts.body) : undefined,
        });
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}
