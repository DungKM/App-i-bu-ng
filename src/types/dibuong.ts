export interface ThongTinVaoVienItem {
  LyDoVaoVien: string;
  DienBienBenh: string;
  TienSuBenh: string | null;
  TienSuBenhGiaDinh: string | null;
  ChanDoan: string;
  HuongDieuTri: string | null;
}
export type ThongTinVaoVienResponse = ThongTinVaoVienItem[];
export interface BuongPhongResponse {
  TenKhoa: string;
  ThoiGian: string;
  ThongKeGiuong: {
    TongGiuong: number;
    TongBenhNhan: number;
    TongPhong: number;
    TongGiuongTheoYeuCau: number;
  };
  DSPhong: PhongItem[];
}
export interface PhongItem {
  Ma: string;
  SoGiuong: number;
  SoBenhNhan: number;
  DsGiuong: GiuongItem[];
}
export interface GiuongItem {
  MaGiuong: string;
  isTyc: boolean;
  DsBenhAn: BenhAnItem[];
}
export interface BenhAnItem {
  IdBenhAn: string;
  MaBenhAn: string;
  MaBenhNhan: string;
  HoTenBenhNhan: string;
  GioiTinh: string;
  Tuoi: string;
  ThongTinThem: string | null;
  TongThuocDung: number | null;
  SoPhong: string | null;
  SoGiuong: string | null;
  IdPhieuKhamMoiNhat: string | null;
}
export type Patient = { id: string | number };
export type Bed = {
  code: string;
  patient?: Patient | null;
};
export type Room = {
  room: string;
  beds: Bed[];
};
export type MedicationToday = {
  total: number;
  done: number;
  overdue: number;
};
export type PatientBedCard = {
  id?: string | number;
  name: string;
  code: string;
  gender: string;
  dob: string; // "YYYY-MM-DD"
  medicationToday?: MedicationToday;
};
export type BedCardProps = {
  bedCode: string;
  patient?: PatientBedCard | null;
  onClick?: () => void;
};
export type BedClickPayload = {
  idBenhAn: string;
  maBenhNhan: string;
  tenBenhNhan: string;
};
export type RoomGridProps = {
  filteredWard: Room[];
  searchTerm?: string;
  className?: string;
  onBedClick: (payload: BedClickPayload) => void;
};

export interface LanKhamItem {
  Id: string;
  Ma: string;
  HoTen: string;
  NgayThucKham: string;
  TenKhoaKham: string;
}
export interface SinhHieuItem {
  IdPhieuKham: string;
  IdBenhAn: string;
  Mach: number | null;
  NhietDo: number | null;
  HuyetApToiThieu: number | null;
  HuyetApToiDa: number | null;
  NhipTho: number | null;
  SPO2: number | null;
  CanNang: number | null;
  ChieuCao: number | null;
  BMI: number | null;
}
export interface DvktItem {
  TenDVKT: string;
  TenBacSiChiDinh: string | null;
  NgayChiDinh: string | null;
  TrangThai: string | null;
  IdNhomChiPhi: string | null;
}
export interface DonThuocItem {
  MaDonThuoc: string;
  IdPhieuThuoc: string;
  IdPhieuKham: string;
  IdBenhAn: string;
  Ten: string;
  HamLuong?: string | null;
  LoaiThuoc?: string | null;
  SoLuong: number | null;
  SoLuongHuy: number | null;
  DonVi: string | null;
  NgayKeThuoc: string | null;
  TenBacSiKeThuoc: string | null;
  GhiChuLieuDung: string | null;
  LieuDung: string | null;
  TrangThai: string | null;
}
export type CachDungJson = {
  CachDung?: string;
  ThoiGianSang?: string;
  ThoiGianTrua?: string;
  ThoiGianChieu?: string;
  ThoiGianToi?: string;
  SoNgayKe?: number;
};
export interface DienBienItem {
  IdPhieuKham: string;
  IdBenhAn: string;
  DienBienBenh: string | null;
  BacSiKham: string | null;
  NgayThucKham: string | null; // ISO
}

export interface KetQuaDvktItem {
  IdPhieuKham: string;
  IdBenhAn: string;
  TenDVKT: string;
  LinkUrls: string | null; // ✅ sửa
}

export interface TongHopLinhItem {
  IdBenhNhan: string;
  TenBenhNhan: string;
  MaBenhNhan: string;
  ThongTinThem: string | null;
  DsDonThuoc: TongHopLinhThuocItem[];
}
export interface TongHopLinhThuocItem {
  MaThuoc: string;
  TenThuoc: string;
  SoLuong: number;
  DonVi: string | null;
  IdBenhAn: string;
  IdBenhNhan: string;
  ThongTinThem: string | null;
}
export enum ShiftType  {
  MORNING = "MORNING",
  NOON = "NOON",
  AFTERNOON = "AFTERNOON",
  NIGHT = "NIGHT",
}
export type SlotKey = "SANG" | "TRUA" | "CHIEU" | "TOI";
export const SHIFT_TO_SLOT: Record<ShiftType, SlotKey> = {
  [ShiftType.MORNING]: "SANG",
  [ShiftType.NOON]: "TRUA",
  [ShiftType.AFTERNOON]: "CHIEU",
  [ShiftType.NIGHT]: "TOI",
};
export type ShiftStat = { used: number; pending: number; returned: number };
export type MarSummary = {
  shifts: Record<ShiftType, ShiftStat>;
};
export type MedVisitLite = {
  id: string; 
  patientName: string;
  patientCode: string;
  patientGender?: string;
  patientAge?: string;
  room: string; 
  bed: string; 
  idPhieuKham?: string; 
  marSummary: MarSummary;
};
export interface SplitQty {
    MORNING: number;
    NOON: number;
    AFTERNOON: number;
    NIGHT: number;
}
export interface MedSplitsResponse {
    idPhieuKham: string;
    splits: Record<string, SplitQty>;
}
