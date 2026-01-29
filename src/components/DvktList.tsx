import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDvktByPhieuKham } from "@/services/dibuong.api";
import type { DvktItem } from "@/types/dibuong";

type Props = {
  idPhieuKham: string | null; // selectedEncounterId
};

const STATUS_STYLE: Record<string, { cls: string; dot: string }> = {
  "Chờ thực hiện": { cls: "text-amber-600", dot: "bg-amber-400" },
  "Đang thực hiện": { cls: "text-blue-600", dot: "bg-blue-400" },
  "Có kết quả": { cls: "text-green-600", dot: "bg-green-400" },
  "Đã thực hiện xong": { cls: "text-green-600", dot: "bg-green-400" },
};

function formatDate(iso?: string | null) {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// map IdNhomChiPhi -> tag hiển thị (tạm). Nếu bạn có mapping chuẩn thì thay ở đây.
function tagFromGroup(idNhomChiPhi?: string | null) {
  if (!idNhomChiPhi) return "DVKT";
  // ví dụ: nếu backend có nhóm xét nghiệm / CĐHA...
  // Hiện chưa có tên nhóm, chỉ có Id => để DVKT mặc định
  return "DVKT";
}

function tagTone(tag: string) {
  if (tag === "LAB") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (tag === "CĐHA") return "bg-purple-50 text-purple-700 border-purple-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

export const DvktList: React.FC<Props> = ({ idPhieuKham }) => {
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useQuery<DvktItem[]>({
    queryKey: ["dvkt", idPhieuKham],
    enabled: !!idPhieuKham,
    queryFn: () => getDvktByPhieuKham(idPhieuKham!),
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return list;

    return list.filter((it) => {
      const hay = [
        it.TenDVKT,
        it.TenBacSiChiDinh ?? "",
        it.TrangThai ?? "",
        it.IdNhomChiPhi ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Danh sách chỉ định CLS/DVKT
            </div>
            <div className="text-slate-900 font-black mt-1">
              Hiển thị theo lần khám đã chọn
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full md:w-[360px]">
              <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent outline-none w-full text-sm font-bold text-slate-700 placeholder:text-slate-400"
                placeholder="Tìm tên dịch vụ, loại, trạng thái..."
              />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {!idPhieuKham ? (
            <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">
              Chọn một lần khám để xem CLS/DVKT.
            </div>
          ) : isLoading ? (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center text-slate-400 font-bold">
              Đang tải danh sách CLS/DVKT...
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-700 font-bold">
              Lỗi tải CLS/DVKT: {String((error as any)?.message || error)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">
              Không có chỉ định CLS/DVKT trong lần khám này.
            </div>
          ) : (
            filtered.map((it, idx) => {
              const statusKey = it.TrangThai ?? "";
              const status = STATUS_STYLE[statusKey] ?? { cls: "text-slate-400", dot: "bg-slate-300" };

              const tag = tagFromGroup(it.IdNhomChiPhi);
              const tone = tagTone(tag);

              return (
                <button
                  key={`${it.IdNhomChiPhi ?? "g"}-${idx}-${it.NgayChiDinh ?? ""}`}
                  className="w-full text-left rounded-3xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition p-5"
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border ${tone}`}>
                          {tag}
                        </span>
                        <div className="text-base md:text-lg font-black text-slate-900 truncate">
                          {it.TenDVKT}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-bold">
                        <span className="inline-flex items-center gap-2">
                          <i className="fa-solid fa-user-doctor text-slate-400" />
                          {it.TenBacSiChiDinh ?? "--"}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <i className="fa-regular fa-clock text-slate-400" />
                          {formatDate(it.NgayChiDinh)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={`text-xs font-black ${status.cls}`}>
                        {it.TrangThai ?? "--"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          trạng thái
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
