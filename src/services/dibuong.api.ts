import { request } from "./http";
import type { ThongTinVaoVienResponse } from "../types/dibuong";

export function getThongTinVaoVien(idBenhAn: string) {
  return request<ThongTinVaoVienResponse>("/async/api/dibuong/thongtinvaovien", {
    method: "GET",
    query: { IdBenhAn: idBenhAn },
  });
}
