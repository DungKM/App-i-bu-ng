export type Role = "admin" | "doctor" | "nurse";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: Role;
  username?: string;   // optional nếu backend chưa trả
  idBenhAn?: string | null;
};

export type AuthUser = {
  username: string;
  role: Role;
  idBenhAn?: string | null;
};
