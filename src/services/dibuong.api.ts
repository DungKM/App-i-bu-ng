import { request } from "./http";
import type { ThongTinVaoVienResponse, BuongPhongResponse, LanKhamItem, SinhHieuItem, DvktItem } from "../types/dibuong";

export function getThongTinVaoVien(idBenhAn: string) {
  return request<ThongTinVaoVienResponse>("/async/api/dibuong/thongtinvaovien", {
    method: "GET",
    query: { IdBenhAn: idBenhAn },
  });
}

export function getBuongPhong(idKhoa: string) {
  return request<BuongPhongResponse>("/async/api/dibuong/buongphong", {
    method: "GET",
    query: { IdKhoa: idKhoa },
  });
}

export function getDsLanKham(idBenhAn: string) {
  return request<LanKhamItem[]>("/async/api/dibuong/dslankham", {
    method: "GET",
    query: { IdBenhAn: idBenhAn },
  });
}

export function getSinhHieuByPhieuKham(idPhieuKham: string) {
  return request<SinhHieuItem[]>("/async/api/dibuong/ds_sinhhieu", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}

export function getDvktByPhieuKham(idPhieuKham: string) {
  return request<DvktItem[]>("/async/api/dibuong/ds_dvkt", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}