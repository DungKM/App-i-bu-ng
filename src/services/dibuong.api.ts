import { request } from "./http";
import type { ThongTinVaoVienResponse, BuongPhongResponse, LanKhamItem, SinhHieuItem, DvktItem, DonThuocItem, DienBienItem, KetQuaDvktItem, TongHopLinhItem } from "../types/dibuong";

export function getThongTinVaoVien(idBenhAn: string) {
  return request<ThongTinVaoVienResponse>("/sync/dibuong/thongtinvaovien", {
    method: "GET",
    query: { IdBenhAn: idBenhAn },
  });
}

export function getBuongPhong(idKhoa: string) {
  return request<BuongPhongResponse>("/sync/dibuong/buongphong", {
    method: "GET",
    query: { IdKhoa: idKhoa },
  });
}

export function getDsLanKham(idBenhAn: string) {
  return request<LanKhamItem[]>("/sync/dibuong/dslankham", {
    method: "GET",
    query: { IdBenhAn: idBenhAn },
  });
}

export function getSinhHieuByPhieuKham(idPhieuKham: string) {
  return request<SinhHieuItem[]>("/sync/dibuong/ds_sinhhieu", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}

export function getDvktByPhieuKham(idPhieuKham: string) {
  return request<DvktItem[]>("/sync/dibuong/ds_dvkt", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}

export function getDonThuocByPhieuKham(idPhieuKham: string) {
  return request<DonThuocItem[]>("/sync/dibuong/ds_donthuoc", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}

export function getDienBienByPhieuKham(idPhieuKham: string) {
  return request<DienBienItem[]>("/sync/dibuong/ds_dienbien", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}

export function getKetQuaDvktByPhieuKham(idPhieuKham: string) {
  return request<KetQuaDvktItem[]>("/sync/dibuong/ds_ketqua_dvkt", {
    method: "GET",
    query: { IdPhieuKham: idPhieuKham },
  });
}

export function getTongHopLinh(idKhoa: string) {
  return request<TongHopLinhItem[]>("/sync/dibuong/ds_tong_hop_linh", {
    method: "GET",
    query: { IdKhoa: idKhoa },
  });
}
