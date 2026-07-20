import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { DrugActionModal } from "@/components/DrugActionModal";
import { EncounterList } from "@/components/EncounterList";
import { MedicationOrders } from "@/components/MedicationOrders";
import { useAuth } from "@/context/AuthContext";
import { getDonThuocByPhieuKham } from "@/services/dibuong.api";
import {
  cancelConfirmedUsage,
  confirmAllMedUsage,
  confirmMedUsage,
  type ConfirmAllMedUsagePayload,
  getMedSplitsByEncounter,
  returnMedication,
} from "@/services/medSplit.api";
import { ShiftType, SplitQty } from "@/types/dibuong";
import { getCurrentShift, SHIFT_OPTIONS } from "@/utils/shifts";

export const MedicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const idBenhAn = id ?? "";

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  const maBenhNhan = searchParams.get("maBenhNhan") ?? "";
  const tenBenhNhan = searchParams.get("tenBenhNhan") ?? "";
  const tuoi = searchParams.get("tuoi") ?? "";

  const initialEncounterId = searchParams.get("idPhieuKham");
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(initialEncounterId);
  const initialShift = (searchParams.get("shift") as ShiftType) || getCurrentShift();
  const [activeShift, setActiveShift] = useState<ShiftType>(initialShift);
  const [actionDrug, setActionDrug] = useState<{
    idPhieuThuoc: string;
    ten: string;
    qty: number;
    type: "CONFIRM" | "RETURN" | "UNCONFIRM";
    donVi?: string | null;
    hamLuong?: string | null;
    loaiThuoc?: string | null;
  } | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnQuantity, setReturnQuantity] = useState(1);

  const qc = useQueryClient();

  const { data: splitData, isFetching: splitLoading } = useQuery({
    queryKey: ["med-splits", selectedEncounterId],
    enabled: !!selectedEncounterId,
    queryFn: () => getMedSplitsByEncounter(selectedEncounterId!),
    staleTime: 60_000,
  });

  const { data: donThuocData } = useQuery({
    queryKey: ["donthuoc", selectedEncounterId],
    enabled: !!selectedEncounterId,
    queryFn: () => getDonThuocByPhieuKham(selectedEncounterId!),
  });

  const confirmMutation = useMutation({
    mutationFn: ({
      idPhieuThuoc,
      shift,
      soLuongDung,
      tenThuoc,
      hamLuong,
      loaiThuoc,
      donVi,
    }: {
      idPhieuThuoc: string;
      shift: ShiftType;
      soLuongDung: number;
      tenThuoc: string;
      hamLuong?: string | null;
      loaiThuoc?: string | null;
      donVi?: string | null;
    }) =>
      confirmMedUsage(selectedEncounterId!, idPhieuThuoc, {
        shift,
        soLuongDung,
        tenBenhNhan: tenBenhNhan || "N/A",
        maBenhNhan: maBenhNhan || "N/A",
        tuoi: tuoi || null,
        tenThuoc,
        hamLuong: hamLuong ?? null,
        loaiThuoc: loaiThuoc ?? null,
        donVi: donVi ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["med-splits", selectedEncounterId] });
      setActionDrug(null);
      toast.success("Đã xác nhận dùng thuốc");
    },
  });

  const unconfirmMutation = useMutation({
    mutationFn: ({ idPhieuThuoc, shift }: { idPhieuThuoc: string; shift: ShiftType }) =>
      cancelConfirmedUsage(selectedEncounterId!, idPhieuThuoc, shift),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["med-splits", selectedEncounterId] });
      setActionDrug(null);
      toast.success("Đã hủy xác nhận dùng thuốc");
    },
  });

  const returnMutation = useMutation({
    mutationFn: (data: any) => returnMedication(selectedEncounterId!, data.idPhieuThuoc, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["med-splits", selectedEncounterId] });
      setActionDrug(null);
      setReturnReason("");
      toast.success("Đã gửi yêu cầu trả thuốc");
    },
  });

  const confirmAllMutation = useMutation({
    mutationFn: (payload: ConfirmAllMedUsagePayload) => confirmAllMedUsage(selectedEncounterId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["med-splits", selectedEncounterId] });
      toast.success("Đã xác nhận dùng toàn bộ thuốc trong ca");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Xác nhận dùng toàn bộ thất bại");
    },
  });

  const activeShiftOption = SHIFT_OPTIONS.find((option) => option.id === activeShift);
  const hasMedicationInActiveShift = useMemo(() => {
    const splitMap = splitData?.splits ?? {};
    const key = activeShift as keyof SplitQty;

    return Object.values(splitMap).some((item) => Number(item.splits?.[key] ?? 0) > 0);
  }, [activeShift, splitData]);

  const confirmAllItems = useMemo(() => {
    const key = activeShift as keyof SplitQty;

    return (donThuocData ?? [])
      .map((item) => {
        const idPhieuThuoc = String(item.IdPhieuThuoc);
        const splitInfo = splitData?.splits?.[idPhieuThuoc];
        const qtyInShift = Number(splitInfo?.splits?.[key] ?? 0);
        const returnedQty =
          splitInfo?.returnHistory?.reduce((sum, historyItem: any) => {
            return historyItem.shift === activeShift ? sum + Number(historyItem.quantity ?? 0) : sum;
          }, 0) ?? 0;
        const soLuongDung = Math.max(0, qtyInShift - returnedQty);
        const isConfirmed = splitInfo?.confirmedShifts?.includes(activeShift) ?? false;

        if (soLuongDung <= 0 || isConfirmed) return null;

        return {
          idPhieuThuoc,
          soLuongDung,
          tenThuoc: item.Ten || "",
          hamLuong: item.HamLuong ?? null,
          loaiThuoc: item.LoaiThuoc ?? null,
          donVi: item.DonVi ?? null,
        };
      })
      .filter(Boolean) as ConfirmAllMedUsagePayload["items"];
  }, [activeShift, donThuocData, splitData?.splits]);

  const hasConfirmableMedsInActiveShift = useMemo(() => {
    const splitMap = splitData?.splits ?? {};
    const key = activeShift as keyof SplitQty;

    return Object.values(splitMap).some((item) => {
      const qtyInShift = Number(item.splits?.[key] ?? 0);
      const returnedQty =
        item.returnHistory?.reduce((sum, historyItem: any) => {
          return historyItem.shift === activeShift ? sum + Number(historyItem.quantity ?? 0) : sum;
        }, 0) ?? 0;
      const isConfirmed = item.confirmedShifts?.includes(activeShift) ?? false;
      return qtyInShift - returnedQty > 0 && !isConfirmed;
    });
  }, [activeShift, splitData]);

  if (!currentUser) return null;

  return (
    <div className="mx-auto space-y-6 pb-24">
      <div className="sticky top-16 z-30 flex flex-col items-start justify-between gap-6 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 transition hover:text-primary"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              {tenBenhNhan || "Bệnh nhân"}
            </h1>
            <div className="mt-0.5 flex items-center gap-3 text-xs font-bold text-slate-400">
              <span className="font-mono text-primary">{maBenhNhan || "--"}</span>
              <span>•</span>
              <span className="uppercase">Sử dụng thuốc bệnh nhân</span>
            </div>
          </div>
        </div>
      </div>

      <EncounterList
        idBenhAn={idBenhAn}
        selectedEncounterId={selectedEncounterId}
        onChangeSelected={setSelectedEncounterId}
        mode="all"
      />

      <div className="mx-4 space-y-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Ca sử dụng thuốc
            </div>
            <div className="mt-1 text-sm font-bold text-slate-700">
              Chọn ca để xác nhận dùng hoặc trả thuốc cho bệnh nhân
            </div>
          </div>
          {splitLoading && (
            <div className="text-[10px] font-black uppercase tracking-widest text-primary">
              Đang đồng bộ...
            </div>
          )}
        </div>

        <div className="flex gap-1 rounded-2xl bg-slate-100/50 p-1 shadow-inner">
          {SHIFT_OPTIONS.map((option) => {
            const hasDataInShift = Object.values(splitData?.splits ?? {}).some(
              (item) => Number(item.splits[option.id as keyof SplitQty] ?? 0) > 0
            );

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveShift(option.id)}
                title={`${option.label} (${option.timeRange})`}
                className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-[10px] font-black uppercase transition-all ${
                  activeShift === option.id ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:bg-white/40"
                }`}
              >
                {hasDataInShift && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm"></span>
                )}

                <i
                  className={`fa-solid ${option.icon} ${
                    hasDataInShift && activeShift !== option.id ? "text-slate-600" : ""
                  }`}
                ></i>
                <span className={hasDataInShift && activeShift !== option.id ? "text-slate-600" : ""}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              Xác nhận nhanh
            </div>
            <div className="truncate text-[11px] font-bold text-emerald-900">
              {hasMedicationInActiveShift
                ? "Dùng toàn bộ thuốc của ca đang chọn"
                : "Ca này chưa có thuốc để xác nhận"}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              confirmAllMutation.mutate({
                shift: activeShift,
                tenBenhNhan: tenBenhNhan || "N/A",
                maBenhNhan: maBenhNhan || "N/A",
                tuoi: tuoi || null,
                items: confirmAllItems,
              })
            }
            disabled={
              !selectedEncounterId ||
              !hasConfirmableMedsInActiveShift ||
              confirmAllMutation.isPending ||
              confirmAllItems.length === 0
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-emerald-100 transition disabled:opacity-50 disabled:shadow-none"
          >
            <i className="fa-solid fa-check-double"></i>
            {confirmAllMutation.isPending ? "Đang xử lý..." : `Xác nhận ca ${activeShiftOption?.label ?? ""}`}
          </button>
        </div>
      </div>

      <MedicationOrders
        idPhieuKham={selectedEncounterId}
        shift={activeShift}
        splitMap={splitData?.splits ?? {}}
        splitLoading={splitLoading}
        onAction={(data) => {
          if (data.type === "RETURN") {
            setReturnQuantity(data.qty);
            setReturnReason("");
          }
          setActionDrug(data);
        }}
      />

      {actionDrug && (
        <DrugActionModal
          actionDrug={actionDrug}
          setActionDrug={setActionDrug}
          returnQty={returnQuantity}
          setReturnQty={setReturnQuantity}
          returnReason={returnReason}
          setReturnReason={setReturnReason}
          confirmMutation={confirmMutation}
          unconfirmMutation={unconfirmMutation}
          returnMutation={returnMutation}
          activeShift={activeShift}
          onReturn={() => {
            if (!actionDrug || !selectedEncounterId) return;

            const finalReason = returnReason === "Khac" ? (window as any)._otherReason : returnReason;

            returnMutation.mutate({
              idPhieuThuoc: actionDrug.idPhieuThuoc,
              quantity: returnQuantity,
              reason: finalReason,
              tenBenhNhan: tenBenhNhan || "N/A",
              maBenhNhan: maBenhNhan || "N/A",
              tenThuoc: actionDrug.ten,
              idBenhAn,
              shift: activeShift,
            });
          }}
        />
      )}
    </div>
  );
};
