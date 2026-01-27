import { useEffect, useState } from "react";
import { getThongTinVaoVien } from "../services/dibuong.api";
import type { ThongTinVaoVienItem } from "../types/dibuong";

export default function ThongTinVaoVienCard({ idBenhAn }: { idBenhAn: string }) {
  const [item, setItem] = useState<ThongTinVaoVienItem | null>(null);

  useEffect(() => {
    if (!idBenhAn?.trim()) return;
    getThongTinVaoVien(idBenhAn.trim()).then((res) => setItem(res[0] ?? null));
  }, [idBenhAn]);

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Lý do vào viện
          </label>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">
            {item?.LyDoVaoVien || "--"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Diễn biến bệnh
          </label>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">
            {item?.DienBienBenh || "--"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Tiền sử bệnh bản thân
          </label>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">
            {item?.TienSuBenh ?? "--"}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Tiền sử bệnh gia đình
          </label>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">
            {item?.TienSuBenhGiaDinh ?? "--"}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Chẩn đoán
          </label>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100 whitespace-pre-wrap">
            {item?.ChanDoan || "--"}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">
            Hướng điều trị
          </label>
          <div className="bg-blue-50 p-6 rounded-3xl text-slate-900 font-black border border-blue-100 text-lg leading-relaxed">
            {item?.HuongDieuTri ?? "--"}
          </div>
        </div>
      </div>
    </div>
  );
}
