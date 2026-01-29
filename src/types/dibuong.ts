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