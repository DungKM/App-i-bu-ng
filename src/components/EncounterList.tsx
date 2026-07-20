import React, { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDsLanKham } from "@/services/dibuong.api";
import type { LanKhamItem } from "@/types/dibuong";

function isSameDay(iso: string, reference: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

type Props = {
  idBenhAn: string;
  selectedEncounterId: string | null;
  onChangeSelected: (id: string) => void;
  mode?: "latest" | "all";
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const EncounterList: React.FC<Props> = ({
  idBenhAn,
  selectedEncounterId,
  onChangeSelected,
  mode = "all",
}) => {
  const { data, isLoading, error } = useQuery<LanKhamItem[]>({
    queryKey: ["dslankham", idBenhAn],
    enabled: !!idBenhAn,
    queryFn: () => getDsLanKham(idBenhAn),
  });

  const latestEncounter = useMemo(() => {
    if (!data || data.length === 0) return null;
    return [...data].sort(
      (a, b) => new Date(b.NgayThucKham).getTime() - new Date(a.NgayThucKham).getTime()
    )[0];
  }, [data]);

  const todayEncounter = useMemo(() => {
    if (!data || data.length === 0) return null;
    const today = new Date();
    const todaysEncounters = data.filter((e) => isSameDay(e.NgayThucKham, today));
    if (todaysEncounters.length === 0) return null;

    return [...todaysEncounters].sort(
      (a, b) => new Date(b.NgayThucKham).getTime() - new Date(a.NgayThucKham).getTime()
    )[0];
  }, [data]);

  const defaultEncounter = todayEncounter ?? latestEncounter;
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (mode === "latest" && latestEncounter && selectedEncounterId !== latestEncounter.Id) {
      onChangeSelected(latestEncounter.Id);
      return;
    }

    if (mode === "all" && !selectedEncounterId && defaultEncounter) {
      onChangeSelected(defaultEncounter.Id);
    }
  }, [defaultEncounter, latestEncounter, mode, onChangeSelected, selectedEncounterId]);

  useEffect(() => {
    if (mode !== "all" || !selectedEncounterId) return;
    cardRefs.current[selectedEncounterId]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [mode, selectedEncounterId]);

  if (!idBenhAn) return null;
  if (isLoading) return <div className="mt-5 text-sm font-black animate-pulse text-sky-400">Đang đồng bộ lần khám…</div>;
  if (error) return <div className="mt-5 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 font-bold text-sm">Lỗi kết nối dữ liệu lần khám</div>;
  if (!latestEncounter) return <div className="mt-5 text-sm font-bold text-slate-400 italic">Bệnh nhân chưa có lịch sử khám</div>;

  // --- GIAO DIỆN LATEST: Banner xanh sáng hiện đại ---
  if (mode === "latest") {
    const e = latestEncounter;
    return (
      <div 
        className="mt-5 rounded-[36px] p-6 text-white shadow-xl shadow-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #1EADED 0%, #0284C7 100%)' }}
      >
        {/* Họa tiết trang trí */}
        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
           <i className="fa-solid fa-stethoscope text-[140px]" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
             <span className="bg-white/25 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                Thông tin đợt điều trị
             </span>
             <span className="text-sky-100 font-mono text-xs opacity-80">{e.Ma}</span>
          </div>
          
          <h3 className="text-2xl font-black tracking-tighter uppercase">{e.HoTen}</h3>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-50">
              <i className="fa-regular fa-calendar-days opacity-70" />
              {formatDate(e.NgayThucKham)}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-sky-50">
              <i className="fa-solid fa-house-chimney-medical opacity-70" />
              {e.TenKhoaKham}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button 
            onClick={() => onChangeSelected(e.Id)}
            className="bg-white text-sky-600 px-6 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:bg-sky-50 active:scale-95 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-arrows-rotate" />
            Cập nhật y lệnh
          </button>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN ALL: Danh sách thẻ ngang ---
  return (
    <div className="mt-5 flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
      {data?.map((e) => (
        <button
          key={e.Id}
          ref={(el) => {
            cardRefs.current[e.Id] = el;
          }}
          onClick={() => onChangeSelected(e.Id)}
          className={`min-w-[280px] md:min-w-[320px] rounded-[32px] border-2 p-6 text-left transition-all duration-300 ${
            selectedEncounterId === e.Id
              ? "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-100 -translate-y-1"
              : "bg-white border-slate-100 hover:border-sky-200 hover:bg-sky-50/50 text-slate-600 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                selectedEncounterId === e.Id ? "bg-white/20" : "bg-slate-100 text-slate-400"
            }`}>
                {e.Ma}
            </span>
            <div className={`w-2 h-2 rounded-full ${
                selectedEncounterId === e.Id ? "bg-white animate-pulse" : "bg-slate-200"
            }`} />
          </div>

          <div className="space-y-1.5">
            <div className={`text-base font-black uppercase truncate ${selectedEncounterId === e.Id ? "text-white" : "text-slate-900"}`}>
                {e.HoTen}
            </div>
            <div className={`text-xs font-bold flex items-center gap-2 ${selectedEncounterId === e.Id ? "text-sky-100" : "text-slate-500"}`}>
              <i className="fa-regular fa-clock opacity-60" />
              {formatDate(e.NgayThucKham)}
            </div>
            <div className={`text-[10px] font-black uppercase tracking-[0.15em] pt-3 ${selectedEncounterId === e.Id ? "text-sky-200" : "text-slate-400"}`}>
                {e.TenKhoaKham}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};