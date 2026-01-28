export type Role = "admin" | "doctor" | "nurse";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: Role;
  username?: string;  
  idKhoa?: string | null;
};

export type AuthUser = {
  username: string;
  role: Role;
  idKhoa?: string | null;
};
