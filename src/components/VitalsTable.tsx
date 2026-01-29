import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getSinhHieuByPhieuKham } from "@/services/dibuong.api";
import type { SinhHieuItem } from "@/types/dibuong";

type Props = {
  idPhieuKham: string | null; // selectedEncounterId
};

export const VitalsTable: React.FC<Props> = ({ idPhieuKham }) => {
  const { data, isLoading, error } = useQuery<SinhHieuItem[]>({
    queryKey: ["sinhhieu", idPhieuKham],
    enabled: !!idPhieuKham,
    queryFn: () => getSinhHieuByPhieuKham(idPhieuKham!), // enabled đảm bảo không null
  });

  if (!idPhieuKham) {
    return (
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center text-slate-400 font-bold">
        Chọn một lần khám để xem sinh hiệu.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center text-slate-400 font-bold">
        Đang tải dữ liệu sinh hiệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-700 font-bold">
        Lỗi tải sinh hiệu: {String((error as any)?.message || error)}
      </div>
    );
  }

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center text-slate-400 font-bold">
        Chưa có dữ liệu sinh hiệu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Mạch</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Nhiệt độ</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Huyết áp tối đa</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Huyết áp tối thiểu</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Nhịp thở</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">SpO2</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Cân nặng</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Chiều cao</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">BMI</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((v, idx) => (
              <tr key={`${v.IdPhieuKham}-${idx}`} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 font-black text-slate-700">{v.Mach ?? "--"}</td>
                <td className="px-6 py-4 font-black text-slate-700">
                  {v.NhietDo != null ? `${v.NhietDo}°C` : "--"}
                </td>
                <td className="px-6 py-4 font-black text-slate-700">{v.HuyetApToiDa ?? "--"}</td>
                <td className="px-6 py-4 font-black text-slate-700">{v.HuyetApToiThieu ?? "--"}</td>
                <td className="px-6 py-4 font-black text-slate-700">{v.NhipTho ?? "--"}</td>
                <td className="px-6 py-4 font-black text-slate-700">
                  {v.SPO2 != null ? `${v.SPO2}%` : "--"}
                </td>
                <td className="px-6 py-4 font-black text-slate-700">
                  {v.CanNang != null ? `${v.CanNang} kg` : "--"}
                </td>
                <td className="px-6 py-4 font-black text-slate-700">
                  {v.ChieuCao != null ? `${v.ChieuCao} cm` : "--"}
                </td>
                <td className="px-6 py-4 font-black text-slate-700">{v.BMI ?? "--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
