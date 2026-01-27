export interface ThongTinVaoVienItem {
  LyDoVaoVien: string;
  DienBienBenh: string;
  TienSuBenh: string | null;
  TienSuBenhGiaDinh: string | null;
  ChanDoan: string;
  HuongDieuTri: string | null;
}

export type ThongTinVaoVienResponse = ThongTinVaoVienItem[];
