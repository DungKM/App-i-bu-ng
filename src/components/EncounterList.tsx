import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDsLanKham } from "@/services/dibuong.api";
import type { LanKhamItem } from "@/types/dibuong";

type Props = {
  idBenhAn: string;
  selectedEncounterId: string | null;
  onChangeSelected: (id: string) => void;
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
}) => {
  const { data, isLoading, error } = useQuery<LanKhamItem[]>({
    queryKey: ["dslankham", idBenhAn],
    enabled: !!idBenhAn,
    queryFn: () => getDsLanKham(idBenhAn),
  });

  if (!idBenhAn) return null;

  if (isLoading) {
    return <div className="mt-5 text-sm font-bold text-slate-400">Đang tải lần khám…</div>;
  }

  if (error) {
    return (
      <div className="mt-5 text-sm font-bold text-red-600">
        Không tải được danh sách lần khám
      </div>
    );
  }

  return (
    <div className="mt-5 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {data?.map((e) => (
        <button
          key={e.Id}
          onClick={() => onChangeSelected(e.Id)}
          className={[
            "min-w-[260px] md:min-w-[300px] rounded-3xl border p-5 text-left transition-all",
            selectedEncounterId === e.Id
              ? "bg-blue-600 border-blue-600 text-white shadow-lg"
              : "bg-white border-slate-200 hover:bg-slate-50",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-black">{e.Ma}</div>
            <div className={selectedEncounterId === e.Id ? "text-white/80" : "text-slate-400"}>
              <i className="fa-solid fa-circle text-[8px]" />
            </div>
          </div>

          <div
            className={[
              "mt-2 text-xs font-bold",
              selectedEncounterId === e.Id ? "text-white/90" : "text-slate-600",
            ].join(" ")}
          >
            <i className="fa-regular fa-clock mr-2" />
            {formatDate(e.NgayThucKham)}
          </div>

          <div
            className={[
              "mt-1 text-xs font-bold",
              selectedEncounterId === e.Id ? "text-white/90" : "text-slate-600",
            ].join(" ")}
          >
            <i className="fa-solid fa-user mr-2" />
            {e.HoTen}
          </div>

          <div
            className={[
              "mt-2 text-[10px] font-black uppercase tracking-widest",
              selectedEncounterId === e.Id ? "text-white/70" : "text-slate-400",
            ].join(" ")}
          >
            {e.TenKhoaKham}
          </div>
        </button>
      ))}
    </div>
  );
};
