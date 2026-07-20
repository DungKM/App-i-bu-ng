import { env } from "../config/env";
import { authApi, authStorage } from "./auth.api"; // sửa path nếu cần

export async function request<T>(path: string, options?: any): Promise<T> {
  const url = new URL(env.API_BASE_URL + path);

  if (options?.query) {
    Object.entries(options.query).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v));
    });
  }

  const doFetch = () =>
    fetch(url.toString(), {
      method: options?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStorage.getAccessToken()}`, // 🔥 sửa ở đây
        ...(options?.headers ?? {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

  let res: Response;

  try {
    res = await doFetch();
  } catch (err) {
    // ❗ lỗi CORS / network — không phải lỗi xác thực nên không được đăng xuất người dùng
    throw new Error("Không thể kết nối server");
  }

  // 🔥 HANDLE 401
  if (res.status === 401) {
    try {
      await authApi.refreshOnce();
    } catch (e) {
      // refresh thất bại => phiên thực sự đã hết hạn
      authStorage.clear();
      window.location.href = "/#/login";
      throw new Error("Hết phiên đăng nhập");
    }

    try {
      // gọi lại API sau khi refresh
      res = await doFetch();
    } catch (err) {
      // lỗi mạng khi gọi lại, không phải lỗi xác thực nên không được đăng xuất người dùng
      throw new Error("Không thể kết nối server");
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
