import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RoomGrid } from "@/components/RoomSection";
import { getBuongPhong } from "@/services/dibuong.api";
import type { BuongPhongResponse } from "@/types/dibuong";
import { useAuth } from "@/context/AuthContext";

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const { user } = useAuth();
  const ID_KHOA = user?.idHis || "";
  const AI_SUGGESTIONS = [
    "Tóm tắt diễn biến gần đây của bệnh nhân",
    "Vấn đề nổi bật cần chú ý hôm nay",
    "Cảnh báo rủi ro và dấu hiệu cần theo dõi",
    "Giải thích chẩn đoán và hướng điều trị",
    "Đề xuất theo dõi/chăm sóc theo ca",
    "Checklist những điểm cần nhắc bác sĩ",
  ];

  const handleSuggestionClick = (text: string) => {
    setPendingQuestion(text);
    setIsPickerOpen(true);
  };

  const { data, isLoading } = useQuery<BuongPhongResponse>({
    queryKey: ["buongphong", ID_KHOA],
    queryFn: () => getBuongPhong(ID_KHOA),
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

  const allPatients = useMemo(() => {
    return wardLayout.flatMap((room) =>
      room.beds.flatMap((bed) =>
        bed.patients.map((p) => ({
          idBenhAn: p.id,
          maBenhNhan: p.code,
          tenBenhNhan: p.name,
          room: room.room,
          bed: bed.code,
        }))
      )
    ).filter((p) => !!p.idBenhAn);
  }, [wardLayout]);

  const filteredWard = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return wardLayout;

    return wardLayout
      .map((room) => {
        const beds = room.beds
          .map((bed) => {
            const matchingPatients = bed.patients.filter(
              (p) =>
                (p.name ?? "").toLowerCase().includes(s) ||
                String(p.code ?? "").toLowerCase().includes(s) ||
                String(p.bed ?? "").toLowerCase().includes(s) ||
                String(p.room ?? "").toLowerCase().includes(s)
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

  const statsSummary = useMemo(() => {
    const tk = data?.ThongKeGiuong;
    if (!tk) return { total: 0, occupied: 0, rooms: 0, tyc: 0 };
    return {
      total: Number(tk.TongGiuong || 0),
      occupied: Number(tk.TongBenhNhan || 0),
      rooms: Number(tk.TongPhong || 0),
      tyc: Number(tk.TongGiuongTheoYeuCau || 0),
    };
  }, [data]);

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

  return (
    <div className="space-y-6 md:space-y-8 pb-32 px-4 md:px-6 max-w-[1400px] mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-[36px] md:rounded-[48px] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary text-white rounded-[24px] md:rounded-[32px] flex items-center justify-center text-3xl md:text-4xl shadow-xl shadow-primary/20 transform -rotate-3 transition hover:rotate-0">
            <i className="fa-regular fa-hospital"></i>
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase leading-none mb-2 tracking-tighter">
              Sơ đồ phòng giường
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[9px] md:text-xs font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 bg-blue-50 text-primary px-3 py-1 rounded-full">
                <i className="fa-solid fa-circle text-[6px] animate-pulse"></i>
                {data?.TenKhoa || "Khoa"}
              </span>
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-calendar"></i> {new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full lg:w-auto">
          {[
            { label: "Tổng giường", value: statsSummary.total, color: "slate" },
            { label: "Bệnh nhân", value: statsSummary.occupied, color: "amber" },
            { label: "Số phòng", value: statsSummary.rooms, color: "green" },
            { label: "Giường TYC", value: statsSummary.tyc, color: "blue" },
          ].map((stat, idx) => (
            <div key={idx} className={`bg-${stat.color}-50 p-4 md:p-5 rounded-[20px] md:rounded-[24px] border border-${stat.color}-100 flex flex-col items-center shadow-inner`}>
              <div className={`text-[8px] md:text-[9px] font-black text-${stat.color}-500 uppercase tracking-widest mb-1 text-center`}>
                {stat.label}
              </div>
              <div className={`text-xl md:text-2xl font-black text-${stat.color}-700`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-[28px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-slate-800 uppercase">Gợi ý hỏi AI</h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">
              Dùng cho bất kỳ bệnh nhân nào trong khoa
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_SUGGESTIONS.map((q, idx) => (
            <button
              type="button"
              onClick={() => handleSuggestionClick(q)}
              key={idx}
              className="px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-700 transition"
              title="Bấm để chọn bệnh nhân"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-start">
        <div className="relative w-full md:w-96 group">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"></i>
          <input
            type="text"
            placeholder="Tìm tên bệnh nhân, mã số..."
            className="w-full pl-12 pr-6 py-4 rounded-3xl border-2 border-slate-200 bg-white text-slate-900 font-black text-sm placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
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

      {isPickerOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900">Chọn bệnh nhân để hỏi AI</h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {pendingQuestion}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
                aria-label="Đóng"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto divide-y divide-slate-100">
              {allPatients.length === 0 && (
                <div className="p-6 text-sm text-slate-500">Không có bệnh nhân để chọn.</div>
              )}
              {allPatients.map((p) => (
                <button
                  key={`${p.idBenhAn}-${p.bed}`}
                  type="button"
                  onClick={() => {
                    if (!pendingQuestion) return;
                    const qs = new URLSearchParams({
                      maBenhNhan: p.maBenhNhan ?? "",
                      tenBenhNhan: p.tenBenhNhan ?? "",
                      aiQuestion: pendingQuestion,
                    }).toString();
                    setIsPickerOpen(false);
                    navigate(`/patient/${p.idBenhAn}?${qs}`);
                  }}
                  className="w-full text-left px-4 md:px-5 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-slate-900 text-sm">{p.tenBenhNhan}</div>
                      <div className="text-xs text-slate-500 font-bold mt-1">
                        Mã BN: {p.maBenhNhan || "--"} · Phòng {p.room} · Giường {p.bed}
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-300"></i>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
