import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getDonThuocByPhieuKham } from "@/services/dibuong.api";
import { formatFractionValue } from "@/utils/fractions";
import { ShiftType } from "@/types/dibuong";
import type { DonThuocItem, SplitQty } from "@/types/dibuong";

interface MedSplitInfo {
  splits: SplitQty;
  status?: string;
  confirmedShifts?: string[];
  needsReview?: boolean;
  reason?: string | null;
  splitSource?: "MANUAL" | "RULE" | "AI";
  returnHistory?: Array<{
    quantity: number;
    reason: string;
    shift?: "MORNING" | "NOON" | "AFTERNOON" | "NIGHT";
  }>;
}

type Props = {
  idPhieuKham: string | null;
  shift: ShiftType;
  splitMap: Record<string, MedSplitInfo>;
  filterTab: "PENDING" | "COMPLETED";
  splitLoading?: boolean;
  onPickDrug: (x: {
    idPhieuThuoc: string;
    ten: string;
    maxQty: number;
    lieuDung: string;
    donVi?: string | null;
    hamLuong?: string | null;
    loaiThuoc?: string | null;
  }) => void;
  onAction: (data: {
    idPhieuThuoc: string;
    ten: string;
    qty: number;
    type: "CONFIRM" | "RETURN" | "UNCONFIRM";
    donVi?: string | null;
    hamLuong?: string | null;
    loaiThuoc?: string | null;
  }) => void;
};

export const MedicationOrders: React.FC<Props> = ({
  idPhieuKham,
  shift,
  splitMap,
  filterTab,
  splitLoading,
  onPickDrug,
  onAction,
}) => {
  const { data, isLoading } = useQuery<DonThuocItem[]>({
    queryKey: ["donthuoc", idPhieuKham],
    enabled: !!idPhieuKham,
    queryFn: () => getDonThuocByPhieuKham(idPhieuKham!),
  });

  const list = useMemo(() => {
    const raw = data ?? [];
    const key = shift as keyof SplitQty;

    return raw
      .map((it) => {
        const idPhieuThuoc = String(it.IdPhieuThuoc);
        const info = splitMap?.[idPhieuThuoc];
        const qtyInShift = info?.splits ? Number(info.splits[key] ?? 0) : 0;
        const totalAssigned = info?.splits
          ? Number(info.splits.MORNING ?? 0) +
            Number(info.splits.NOON ?? 0) +
            Number(info.splits.AFTERNOON ?? 0) +
            Number(info.splits.NIGHT ?? 0)
          : 0;
        const totalReturned =
          info?.returnHistory?.reduce((sum, item) => {
            return item.shift === shift ? sum + item.quantity : sum;
          }, 0) ?? 0;
        const availableQty = Math.max(0, qtyInShift - totalReturned);
        const hasBeenSplit = !!info;
        const currentStatus = info?.status || "Chờ dùng thuốc";
        const isShiftConfirmed = info?.confirmedShifts?.includes(shift) ?? false;

        return {
          raw: it,
          idPhieuThuoc,
          hasBeenSplit,
          currentStatus,
          qtyInShift,
          totalAssigned,
          needsReview: info?.needsReview ?? false,
          reviewReason: info?.reason ?? null,
          splitSource: info?.splitSource,
          availableQty,
          totalReturned,
          isShiftConfirmed,
          isVisible: filterTab === "PENDING" ? true : hasBeenSplit && qtyInShift > 0,
          displayQtyInShift: formatFractionValue(qtyInShift),
          displayTotalAssigned: formatFractionValue(totalAssigned),
          displayAvailableQty: formatFractionValue(availableQty),
          displayTotalReturned: formatFractionValue(totalReturned),
        };
      })
      .filter((item) => item.isVisible);
  }, [data, filterTab, shift, splitMap]);

  if (!idPhieuKham || isLoading) return null;

  return (
    <div className="mx-4 space-y-4 pb-10">
      {splitLoading && (
        <div className="px-4 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
          Đang đồng bộ dữ liệu...
        </div>
      )}

      {list.length === 0 && (
        <div className="py-10 text-center text-sm font-black uppercase italic tracking-widest text-slate-400">
          {filterTab === "PENDING" ? "Chưa có thuốc nào được chia ca" : "Không có thuốc nào đã được chia ca"}
        </div>
      )}

      {list.map(({ raw: it, idPhieuThuoc, qtyInShift, totalAssigned, needsReview, reviewReason, splitSource, availableQty, totalReturned, hasBeenSplit, currentStatus, isShiftConfirmed, displayQtyInShift, displayTotalAssigned, displayAvailableQty, displayTotalReturned }) => {
        const canAction = availableQty > 0 && !isShiftConfirmed;
        const metaChips = [
          it.HamLuong
            ? {
                key: "ham-luong",
                label: "Hàm lượng",
                value: it.HamLuong,
                tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
                icon: "fa-flask",
              }
            : null,
          it.LoaiThuoc
            ? {
                key: "loai-thuoc",
                label: "Loại thuốc",
                value: it.LoaiThuoc,
                tone: "border-violet-100 bg-violet-50 text-violet-700",
                icon: "fa-tag",
              }
            : null,
        ].filter(Boolean) as Array<{
          key: string;
          label: string;
          value: string;
          tone: string;
          icon: string;
        }>;

        return (
          <div
            key={idPhieuThuoc}
            className={`relative rounded-[32px] border transition-all duration-300 ${
              hasBeenSplit && filterTab === "PENDING" ? "border-[#e2f3ee] bg-[#f8fdfb]" : "border-slate-100 bg-white shadow-sm"
            }`}
          >
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black leading-tight text-[#1a202c]">{it.Ten}</h3>
                    {filterTab === "COMPLETED" && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                          currentStatus === "Đã dùng thuốc"
                            ? "bg-emerald-500 text-white"
                            : availableQty === 0
                              ? "bg-rose-500 text-white"
                              : "bg-blue-500 text-white"
                        }`}
                      >
                        {availableQty === 0 && currentStatus !== "Đã dùng thuốc" ? "Đã trả hết" : currentStatus}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <i className="fa-solid fa-layer-group opacity-40"></i>
                    <span>Tổng đơn: {it.SoLuong} {it.DonVi}</span>
                  </div>

                  {metaChips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {metaChips.map((chip) => (
                        <div
                          key={chip.key}
                          className={`inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ${chip.tone}`}
                        >
                          <i className={`fa-solid ${chip.icon} text-[11px]`}></i>
                          <span className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
                            {chip.label}
                          </span>
                          <span className="break-words leading-snug text-[13px] text-current">
                            {chip.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {filterTab === "PENDING" && (
                  <button
                    onClick={() =>
                      onPickDrug({
                        idPhieuThuoc: String(it.IdPhieuThuoc),
                        ten: it.Ten,
                        maxQty: it.SoLuong ?? 0,
                        lieuDung: it.LieuDung?.trim() || it.GhiChuLieuDung?.trim() || "",
                        donVi: it.DonVi,
                        hamLuong: it.HamLuong,
                        loaiThuoc: it.LoaiThuoc,
                      })
                    }
                    className={`h-16 w-24 shrink-0 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                      hasBeenSplit
                        ? "border border-slate-200 bg-white text-slate-500 shadow-sm"
                        : "bg-[#0f172a] text-white shadow-xl shadow-slate-200"
                    }`}
                  >
                    <i className={`fa-solid ${hasBeenSplit ? "fa-pen-to-square" : "fa-plus-circle"} text-lg`}></i>
                    {hasBeenSplit ? "SỬA CA" : "CHIA NGAY"}
                  </button>
                )}
              </div>

              <div className="mb-2 flex items-start gap-3 rounded-2xl border border-[#ffecd1] bg-[#fff9eb] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b] text-white shadow-sm">
                  <i className="fa-solid fa-hand-holding-medical"></i>
                </div>
                <div className="min-w-0">
                  <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-[#b45309]">Hướng dẫn liều dùng</p>
                  <p className="text-sm font-bold leading-tight text-[#78350f]">{it.LieuDung || "Theo chỉ dẫn của bác sĩ"}</p>
                </div>
              </div>

              {filterTab === "COMPLETED" && (
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-slate-200/50 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                      Ca này: {displayQtyInShift}
                    </span>
                    <span className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase text-sky-700">
                      Tổng đã chia: {displayTotalAssigned}
                    </span>
                    {splitSource && (
                      <span className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase text-violet-700">
                        Nguồn: {splitSource}
                      </span>
                    )}
                    {needsReview && (
                      <span className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase text-amber-700">
                        AI cần xem lại
                      </span>
                    )}
                    {totalReturned > 0 && (
                      <span className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase text-rose-600">
                        Đã trả: {displayTotalReturned}
                      </span>
                    )}
                    <span className="rounded-xl bg-primary px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                      Còn lại: {displayAvailableQty} {it.DonVi}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {totalAssigned <= 0 ? (
                      <div className="w-full rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4 text-center text-[10px] font-black uppercase italic tracking-[0.18em] text-amber-700">
                        {reviewReason
                          ? `AI CHƯA CHIA ĐƯỢC • ${reviewReason}`
                          : "AI CHƯA CHIA ĐƯỢC • CẦN KIỂM TRA VÀ CHIA THỦ CÔNG"}
                      </div>
                    ) : isShiftConfirmed ? (
                      <button
                        onClick={() =>
                          onAction({
                            idPhieuThuoc,
                            ten: it.Ten,
                            qty: qtyInShift,
                            type: "UNCONFIRM",
                            donVi: it.DonVi,
                            hamLuong: it.HamLuong,
                            loaiThuoc: it.LoaiThuoc,
                          })
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-4 text-xs font-black uppercase text-amber-700 active:scale-95"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        Hủy xác nhận dùng thuốc
                      </button>
                    ) : canAction ? (
                      <>
                        <button
                          onClick={() =>
                            onAction({
                              idPhieuThuoc,
                              ten: it.Ten,
                              qty: availableQty,
                              type: "CONFIRM",
                              donVi: it.DonVi,
                              hamLuong: it.HamLuong,
                              loaiThuoc: it.LoaiThuoc,
                            })
                          }
                          className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100 active:scale-95"
                        >
                          <i className="fa-solid fa-check-circle"></i>
                          Dùng {displayAvailableQty} {it.DonVi}
                        </button>
                        <button
                          onClick={() =>
                            onAction({
                              idPhieuThuoc,
                              ten: it.Ten,
                              qty: availableQty,
                              type: "RETURN",
                              donVi: it.DonVi,
                              hamLuong: it.HamLuong,
                              loaiThuoc: it.LoaiThuoc,
                            })
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 py-4 text-xs font-black uppercase text-rose-600 active:scale-95"
                        >
                          <i className="fa-solid fa-reply"></i>
                          Trả
                        </button>
                      </>
                    ) : (
                      <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 text-center text-[10px] font-black uppercase italic tracking-[0.2em] text-slate-400">
                        {isShiftConfirmed
                          ? "✓ ĐÃ DÙNG CA NÀY"
                          : availableQty === 0 && currentStatus !== "Đã dùng thuốc"
                            ? "ĐÃ XỬ LÝ TRẢ HẾT"
                            : `TRẠNG THÁI: ${currentStatus}`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
