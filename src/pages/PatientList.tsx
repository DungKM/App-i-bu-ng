import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RoomGrid } from "@/components/RoomSection";
import { getBuongPhong } from "@/services/dibuong.api";
import type { BuongPhongResponse } from "@/types/dibuong";
// --- Sub-components for Ward Map ---

const Legend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-6 py-4 rounded-[32px] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
      <span>Chờ dùng</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
      <span>Hoàn thành</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
      <span>Quá giờ</span>
    </div>
  </div>
);

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [medFilter, setMedFilter] =
    useState<"ALL" | "DONE" | "PENDING" | "NONE">("ALL");

  const ID_KHOA = "41CA5C91-F449-404F-B37B-00EFE98B8375";

  const { data, isLoading } = useQuery<BuongPhongResponse>({
    queryKey: ["buongphong", ID_KHOA],
    queryFn: () => getBuongPhong(ID_KHOA),
  });
  const wardLayout = useMemo(() => {
    if (!data?.DSPhong) return [];

    return data.DSPhong.map((phong) => ({
      room: phong.Ma,
      beds: phong.DsGiuong.map((giuong) => {
        const benhAn = giuong.DsBenhAn?.[0];
        return {
          code: giuong.MaGiuong,
          patient: benhAn
            ? {
              id: benhAn.IdBenhAn,
              name: benhAn.HoTenBenhNhan,
              code: benhAn.MaBenhNhan,
              room: phong.Ma,
              bed: giuong.MaGiuong,
              medicationToday:
                benhAn.TongThuocDung == null
                  ? { total: 0, done: 0 }
                  : { total: benhAn.TongThuocDung, done: 0 },
              maBenhAn: benhAn.MaBenhAn,
              gioiTinh: benhAn.GioiTinh,
              tuoi: benhAn.Tuoi,
              isTyc: giuong.isTyc,
            }
            : undefined,
        };
      }),
    }));
  }, [data]);
  const filteredWard = useMemo(() => {
    return wardLayout.map((room) => ({
      ...room,
      beds: room.beds.map((bed) => {
        if (!bed.patient) return bed;

        const matchesSearch =
          bed.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(bed.patient.code).toLowerCase().includes(searchTerm.toLowerCase());

        const stats = bed.patient.medicationToday;
        let matchesMed = true;
        if (medFilter === "DONE") matchesMed = !!stats && stats.total > 0 && stats.done === stats.total;
        if (medFilter === "PENDING") matchesMed = !!stats && stats.total > 0 && stats.done < stats.total;
        if (medFilter === "NONE") matchesMed = !stats || stats.total === 0;

        return matchesSearch && matchesMed ? bed : { ...bed, patient: undefined };
      }),
    }));
  }, [wardLayout, searchTerm, medFilter]);

  const statsSummary = useMemo(() => {
    const tk = data?.ThongKeGiuong;
    if (!tk) return { total: 0, occupied: 0, pendingMed: 0, noOrder: 0 };
    return {
      total: Number(tk.TongGiuong || 0),
      occupied: Number(tk.TongBenhNhan || 0),
      pendingMed: 0,
      noOrder: 0,
    };
  }, [data]);
  if (isLoading) return <div className="flex justify-center py-40"><i className="fa-solid fa-circle-notch fa-spin text-6xl text-primary opacity-20"></i></div>;

  return (
    <div className="space-y-8 pb-32 max-w-[1400px] mx-auto">
      <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary text-white rounded-[32px] flex items-center justify-center text-4xl shadow-xl shadow-primary/20 transform -rotate-3 transition hover:rotate-0">
            <i className="fa-regular fa-hospital"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase leading-none mb-2 tracking-tighter">
              Sơ đồ điều trị
            </h1>
            <div className="flex items-center gap-4 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 bg-blue-50 text-primary px-3 py-1 rounded-full">
                <i className="fa-solid fa-circle text-[6px] animate-pulse"></i>
                {data?.TenKhoa || "Khoa"}
              </span>
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-calendar"></i>{" "}
                {new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 flex flex-col items-center shadow-inner">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Tổng giường
            </div>
            <div className="text-2xl font-black text-slate-800">
              {statsSummary.total}
            </div>
          </div>

          <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-100 flex flex-col items-center shadow-inner">
            <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">
              Số bệnh nhân
            </div>
            <div className="text-2xl font-black text-amber-700">
              {statsSummary.occupied}
            </div>
          </div>

          <div className="bg-green-50 p-5 rounded-[24px] border border-green-100 flex flex-col items-center shadow-inner">
            <div className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">
              Số phòng
            </div>
            <div className="text-2xl font-black text-green-700">
              {data?.ThongKeGiuong?.TongPhong ?? 0}
            </div>
          </div>
          <div className="bg-blue-50 p-5 rounded-[24px] border border-blue-100 flex flex-col items-center shadow-inner">
            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">
              Giường TYC
            </div>
            <div className="text-2xl font-black text-blue-700">
              {data?.ThongKeGiuong?.TongGiuongTheoYeuCau ?? 0}
            </div>
          </div>
        </div>
      </div>
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input
              type="text"
              placeholder="Tìm tên bệnh nhân, mã số..."
              className="w-full pl-12 pr-6 py-4 rounded-3xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-primary/30 outline-none font-bold text-sm transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={medFilter}
            onChange={(e) => setMedFilter(e.target.value as any)}
            className="px-6 py-4 rounded-3xl border-2 border-slate-50 bg-slate-50 text-sm font-black outline-none focus:bg-white focus:border-primary/30 transition-all text-slate-700 shadow-inner"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DONE">🟢 Hoàn thành</option>
            <option value="PENDING">🟡 Chờ dùng</option>
            <option value="NONE">⚪ Chưa có y lệnh</option>
          </select>
        </div>
        <Legend />
      </div>
      <RoomGrid
        filteredWard={filteredWard}
        searchTerm={searchTerm}
        onBedClick={({ idBenhAn, maBenhNhan, tenBenhNhan }) => {
          const qs = new URLSearchParams({ maBenhNhan, tenBenhNhan }).toString();
          navigate(`/patient/${idBenhAn}?${qs}`);
        }}
      />
    </div>
  );

};
