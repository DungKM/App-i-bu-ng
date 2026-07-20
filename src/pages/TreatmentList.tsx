import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RoomGrid } from "@/components/RoomSection";
import { getBuongPhong } from "@/services/dibuong.api";
import type { BuongPhongResponse } from "@/types/dibuong";
import { useAuth } from "@/context/AuthContext";

// TODO: nếu có API danh sách khoa thì thay mảng này bằng data query


export const TreatmentList: React.FC = () => {
  const { user, logout } = useAuth();

  const KHOA_OPTIONS = [
    { id: user?.idHis || "", name: user?.tenKhoa || "Khoa" },
  ];
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [idKhoa, setIdKhoa] = useState<string>(KHOA_OPTIONS[0].id);

  const { data, isLoading, error } = useQuery<BuongPhongResponse>({
    queryKey: ["buongphong", idKhoa],
    queryFn: () => getBuongPhong(idKhoa),
    enabled: !!idKhoa,
  });

  const wardLayout = useMemo(() => {
    if (!data?.DSPhong) return [];

    return data.DSPhong.map((phong) => ({
      room: phong.Ma,
      beds: phong.DsGiuong.map((giuong) => {
        const patients = (giuong.DsBenhAn ?? []).map((ba) => ({
          id: ba.IdBenhAn,
          name: ba.HoTenBenhNhan,
          code: ba.MaBenhNhan,
          room: phong.Ma,
          bed: giuong.MaGiuong,
          medicationToday:
            ba.TongThuocDung == null
              ? { total: 0, done: 0 }
              : { total: ba.TongThuocDung, done: 0 },
          maBenhAn: ba.MaBenhAn,
          gioiTinh: ba.GioiTinh,
          tuoi: ba.Tuoi,
          isTyc: giuong.isTyc,
          idPhieuKham: ba.IdPhieuKhamMoiNhat,
        }));

        return {
          code: giuong.MaGiuong,
          isOccupied: patients.length > 0,
          patients: patients,
        };
      }),
    }));
  }, [data]);
  const filteredWard = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return wardLayout;

    return wardLayout
      .map((room) => {
        const beds = room.beds
          .map((bed) => {
            const matchingPatients = (bed.patients ?? []).filter(
              (patient) =>
                (patient.name ?? "").toLowerCase().includes(s) ||
                String(patient.code ?? "").toLowerCase().includes(s) ||
                String(patient.bed ?? "").toLowerCase().includes(s) ||
                String(patient.room ?? "").toLowerCase().includes(s)
            );

            return {
              ...bed,
              patients: matchingPatients,
              isOccupied: matchingPatients.length > 0,
            };
          })
          .filter((bed) => (bed.patients?.length ?? 0) > 0);

        return {
          ...room,
          beds,
          matchCount: beds.reduce((sum, bed) => sum + (bed.patients?.length ?? 0), 0),
        };
      })
      .filter((room) => room.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount || a.room.localeCompare(b.room))
      .map(({ matchCount, ...room }) => room);
  }, [wardLayout, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        <p className="text-gray-500 text-sm animate-pulse">
          Vui lòng chờ giây lát...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto p-6 bg-red-50 border border-red-200 text-red-700 font-bold rounded-3xl">
        Lỗi tải dữ liệu: {String((error as any)?.message || error)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative md:w-[320px]">
          <select
            value={idKhoa}
            onChange={(e) => setIdKhoa(e.target.value)}
            className="w-full appearance-none px-5 py-4 pr-12 rounded-3xl border-2 border-slate-300 bg-white text-sm font-black text-slate-800 outline-none shadow-sm
                 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          >
            {KHOA_OPTIONS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
        </div>
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm tên bệnh nhân, mã số..."
            className="w-full pl-12 pr-6 py-4 rounded-3xl border-2 border-slate-300 bg-white
                 outline-none font-bold text-sm text-slate-800 shadow-sm
                 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <RoomGrid
        filteredWard={filteredWard}
        searchTerm={searchTerm}
        onBedClick={({ idBenhAn, maBenhNhan, tenBenhNhan }) => {
          if (!idBenhAn) return;

          const qs = new URLSearchParams({
            maBenhNhan: maBenhNhan ?? "",
            tenBenhNhan: tenBenhNhan ?? "",
          }).toString();

          navigate(`/patient/${idBenhAn}?${qs}`);
        }}
      />
    </div>
  );
};
