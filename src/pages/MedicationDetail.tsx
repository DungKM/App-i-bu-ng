import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { CameraScannerModal } from "@/components/CameraScannerModal";
import { DrugActionModal } from "@/components/DrugActionModal";
import { DrugSplitModal } from "@/components/DrugSplitModal";
import { EncounterList } from "@/components/EncounterList";
import { MedicationOrders } from "@/components/MedicationOrders";
import { useAuth } from "@/context/AuthContext";
import { getDonThuocByPhieuKham } from "@/services/dibuong.api";
import {
  autoSplitAllMeds,
  cancelConfirmedUsage,
  confirmAllMedUsage,
  confirmMedUsage,
  type ConfirmAllMedUsagePayload,
  getMedSplitsByEncounter,
  returnMedication,
  saveMedSplitOne,
} from "@/services/medSplit.api";
import { ShiftType, SplitQty } from "@/types/dibuong";
import {
  buildDeterministicSplitsFromInstruction,
  buildSmartMedicationInstruction,
} from "@/utils/medicationAutoSplit";
import { getCurrentShift, SHIFT_OPTIONS } from "@/utils/shifts";

type TabType = "PENDING" | "COMPLETED";

const findFirstShiftWithData = (splits?: Record<string, { splits?: SplitQty }>): ShiftType | null => {
  if (!splits) return null;

  for (const option of SHIFT_OPTIONS) {
    const hasData = Object.values(splits).some((item) => Number(item.splits?.[option.id] ?? 0) > 0);
    if (hasData) return option.id;
  }

  return null;
};

const SHIFT_ORDER: ShiftType[] = [
  ShiftType.MORNING,
  ShiftType.NOON,
  ShiftType.AFTERNOON,
  ShiftType.NIGHT,
];

const sumSplits = (splits?: Partial<SplitQty>) =>
  Number(splits?.MORNING ?? 0) +
  Number(splits?.NOON ?? 0) +
  Number(splits?.AFTERNOON ?? 0) +
  Number(splits?.NIGHT ?? 0);

const isWholeNumber = (value?: number | null) => Math.abs(Number(value ?? 0) - Math.round(Number(value ?? 0))) < 0.000001;

const hasFractionalSplits = (splits?: Partial<SplitQty> | null) =>
  [splits?.MORNING, splits?.NOON, splits?.AFTERNOON, splits?.NIGHT].some((value) => {
    const safeValue = Number(value ?? 0);
    return Math.abs(safeValue - Math.round(safeValue)) >= 0.000001;
  });

const normalizeAscii = (value?: string | null) =>
  (value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const INDIVISIBLE_UNIT_REGEX =
  /\b(cái|cai|bộ|bo|ống|ong|chai|lọ|lo|tuýp|tuyp|bơm|bom|dây|day|kim|set|kit)\b/i;

const CONTAINER_UNIT_REGEX = /\b(ống|ong|chai|lọ|lo)\b/i;
const STRENGTH_BASED_SPLIT_REGEX = /\d+(?:[.,]\d+)?\s*[a-zA-Zµ]+\s*\/\s*\d+(?:[.,]\d+)?\s*[a-zA-Zµ]+/i;

const shouldSplitByStrength = (item: {
  DonVi?: string | null;
  HamLuong?: string | null;
  LieuDung?: string | null;
}) => {
  const donVi = normalizeAscii(item.DonVi);
  const hamLuong = normalizeAscii(item.HamLuong);
  const lieuDung = normalizeAscii(item.LieuDung);

  if (!/\b(ong|chai|lo)\b/i.test(donVi)) return false;
  if (/\d+(?:[.,]\d+)?\s*[a-z\u00b5]+\s*\/\s*\d+(?:[.,]\d+)?\s*[a-z\u00b5]+/i.test(hamLuong)) return true;

  return /(?:^|\s)(?:1\/2|0[.,]5|\d+\/\d+)(?:\s*)(?:lọ|lo|chai|ống|ong)\b/i.test(lieuDung);
  return /(?:1\/2|0[.,]5|\d+\/\d+)\s*(?:lo|chai|ong)\b/i.test(lieuDung);
};

const shouldForceWholeSplit = (item: {
  SoLuong?: number | null;
  DonVi?: string | null;
  LoaiThuoc?: string | null;
  HamLuong?: string | null;
  LieuDung?: string | null;
}) => {
  const maxQty = Number(item.SoLuong ?? 0);
  if (!(maxQty > 0) || !isWholeNumber(maxQty)) return false;

  const donVi = item.DonVi?.trim() ?? "";
  const loaiThuoc = item.LoaiThuoc?.trim().toLowerCase() ?? "";
  const loaiThuocNormalized = loaiThuoc.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const splitByStrength = shouldSplitByStrength(item);

  if (splitByStrength && loaiThuocNormalized.includes("vat tu")) return true;
  if (splitByStrength) return false;

  if (splitByStrength) {
    return loaiThuoc.includes("váº­t tÆ°") || loaiThuoc.includes("vat tu");
  }

  return maxQty === 1 || loaiThuoc.includes("vật tư") || loaiThuoc.includes("vat tu") || INDIVISIBLE_UNIT_REGEX.test(donVi);
};

const shouldSplitByStrengthV2 = (item: {
  DonVi?: string | null;
  HamLuong?: string | null;
  LieuDung?: string | null;
}) => {
  const donVi = normalizeAscii(item.DonVi);
  const hamLuong = normalizeAscii(item.HamLuong);
  const lieuDung = normalizeAscii(item.LieuDung);

  if (!/\b(ong|chai|lo)\b/i.test(donVi)) return false;
  if (/\d+(?:[.,]\d+)?\s*[a-z\u00b5]+\s*\/\s*\d+(?:[.,]\d+)?\s*[a-z\u00b5]+/i.test(hamLuong)) return true;

  return /(?:1\/2|0[.,]5|\d+\/\d+)\s*(?:lo|chai|ong)\b/i.test(lieuDung);
};

const shouldForceWholeSplitV2 = (item: {
  SoLuong?: number | null;
  DonVi?: string | null;
  LoaiThuoc?: string | null;
  HamLuong?: string | null;
  LieuDung?: string | null;
}) => {
  const maxQty = Number(item.SoLuong ?? 0);
  if (!(maxQty > 0) || !isWholeNumber(maxQty)) return false;

  const donVi = normalizeAscii(item.DonVi);
  const loaiThuocNormalized = normalizeAscii(item.LoaiThuoc);
  const splitByStrength = shouldSplitByStrengthV2(item);

  if (splitByStrength && loaiThuocNormalized.includes("vat tu")) return true;
  if (splitByStrength) return false;

  return maxQty === 1 || loaiThuocNormalized.includes("vat tu") || /\b(cai|bo|tuyp|bom|day|kim|set|kit)\b/i.test(donVi);
};

const areSplitsEqual = (left?: Partial<SplitQty> | null, right?: Partial<SplitQty> | null) =>
  Math.abs(Number(left?.MORNING ?? 0) - Number(right?.MORNING ?? 0)) < 0.000001 &&
  Math.abs(Number(left?.NOON ?? 0) - Number(right?.NOON ?? 0)) < 0.000001 &&
  Math.abs(Number(left?.AFTERNOON ?? 0) - Number(right?.AFTERNOON ?? 0)) < 0.000001 &&
  Math.abs(Number(left?.NIGHT ?? 0) - Number(right?.NIGHT ?? 0)) < 0.000001;

const shuffleShifts = () => {
  const items = [...SHIFT_ORDER];

  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
};

const distributeUnits = (totalUnits: number, bucketCount: number) => {
  const result = Array(bucketCount).fill(0);
  let remaining = totalUnits;

  for (let i = 0; i < bucketCount; i += 1) {
    const bucketsLeft = bucketCount - i;
    if (bucketsLeft === 1) {
      result[i] = remaining;
      break;
    }

    const minReserve = bucketsLeft - 1;
    const maxForCurrent = remaining - minReserve;
    const value = 1 + Math.floor(Math.random() * Math.max(1, maxForCurrent));
    result[i] = value;
    remaining -= value;
  }

  return result;
};

const buildRandomFallbackSplits = (maxQty: number): SplitQty => {
  const empty: SplitQty = {
    MORNING: 0,
    NOON: 0,
    AFTERNOON: 0,
    NIGHT: 0,
  };

  if (!(maxQty > 0)) return empty;

  const isIntegerQty = Math.abs(maxQty - Math.round(maxQty)) < 0.000001;
  const totalUnits = isIntegerQty ? Math.round(maxQty) : Math.max(1, Math.round(maxQty * 2));
  const unitSize = isIntegerQty ? 1 : 0.5;
  const maxBuckets = Math.min(4, totalUnits);
  const bucketCount = Math.max(1, Math.floor(Math.random() * maxBuckets) + 1);
  const chosenShifts = shuffleShifts().slice(0, bucketCount);
  const distributed = distributeUnits(totalUnits, bucketCount);

  const splits = { ...empty };
  chosenShifts.forEach((shift, index) => {
    splits[shift] = Math.round(distributed[index] * unitSize * 100) / 100;
  });

  return splits;
};

export const MedicationDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");

  const { id } = useParams<{ id: string }>();
  const idBenhAn = id ?? "";

  const navigate = useNavigate();
  const { search } = useLocation();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();

  const qs = new URLSearchParams(search);
  const maBenhNhan = qs.get("maBenhNhan") ?? "";
  const tenBenhNhan = qs.get("tenBenhNhan") ?? "";
  const tuoi = qs.get("tuoi") ?? "";

  const initialEncounterId = searchParams.get("idPhieuKham");
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(initialEncounterId);

  const initialShift = (searchParams.get("shift") as ShiftType) || getCurrentShift();
  const [activeShift, setActiveShift] = useState<ShiftType>(initialShift);

  const [selectedDrug, setSelectedDrug] = useState<{
    idPhieuThuoc: string;
    ten: string;
    splits: SplitQty;
    maxQty: number;
    lieuDung: string;
    donVi?: string | null;
    hamLuong?: string | null;
    loaiThuoc?: string | null;
  } | null>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const qc = useQueryClient();

  const startCamera = async () => {
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError("Lỗi camera");
    }
  };

  useEffect(() => {
    if (isScanning) {
      startCamera();
      return;
    }

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
    }
  }, [isScanning]);

  const { data: splitData, isFetching: splitLoading } = useQuery({
    queryKey: ["med-splits", selectedEncounterId],
    enabled: !!selectedEncounterId,
    queryFn: () => getMedSplitsByEncounter(selectedEncounterId!),
    staleTime: 60_000,
  });

  const saveSplitMutation = useMutation({
    mutationFn: ({ idPhieuThuoc, splits }: { idPhieuThuoc: string; splits: SplitQty }) =>
      saveMedSplitOne(selectedEncounterId!, idPhieuThuoc, splits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["med-splits", selectedEncounterId] });
    },
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

  const { data: donThuocData } = useQuery({
    queryKey: ["donthuoc", selectedEncounterId],
    enabled: !!selectedEncounterId,
    queryFn: () => getDonThuocByPhieuKham(selectedEncounterId!),
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

  const autoSplitMutation = useMutation({
    mutationFn: async () => {
      const items = (donThuocData ?? []).map((item) => ({
        idPhieuThuoc: String(item.IdPhieuThuoc),
        tenThuoc: item.Ten || "",
        lieuDung:
          buildSmartMedicationInstruction(item.LieuDung, item.GhiChuLieuDung, Number(item.SoLuong || 0)) ||
          item.LieuDung?.trim() ||
          item.GhiChuLieuDung?.trim() ||
          "",
        maxQty: Number(item.SoLuong || 0),
      }));

      return autoSplitAllMeds(selectedEncounterId!, items);
    },
    onSuccess: async (res: any) => {
      const refreshed = await qc.fetchQuery({
        queryKey: ["med-splits", selectedEncounterId],
        queryFn: () => getMedSplitsByEncounter(selectedEncounterId!),
        staleTime: 0,
      });

      let deterministicOverrideCount = 0;
      for (const item of donThuocData ?? []) {
        const idPhieuThuoc = String(item.IdPhieuThuoc);
        const maxQty = Number(item.SoLuong || 0);
        const forceWholeSplit = shouldForceWholeSplitV2(item);
        const localDeterministicSplits = buildDeterministicSplitsFromInstruction(
          item.LieuDung,
          item.GhiChuLieuDung,
          maxQty
        );
        const overrideSplits =
          forceWholeSplit && hasFractionalSplits(localDeterministicSplits)
            ? buildRandomFallbackSplits(maxQty)
            : localDeterministicSplits;

        if (!overrideSplits && !forceWholeSplit) continue;

        const info = refreshed?.splits?.[idPhieuThuoc];
        const isManual = info?.splitSource === "MANUAL";
        if (isManual) continue;

        const totalAssigned = sumSplits(info?.splits);
        const shouldOverride =
          !info ||
          info.needsReview ||
          totalAssigned <= 0 ||
          totalAssigned - maxQty > 0.000001 ||
          (forceWholeSplit && hasFractionalSplits(info?.splits)) ||
          (!!overrideSplits && !areSplitsEqual(info.splits, overrideSplits));

        if (!shouldOverride) continue;

        const finalOverrideSplits = overrideSplits ?? buildRandomFallbackSplits(maxQty);
        await saveMedSplitOne(selectedEncounterId!, idPhieuThuoc, finalOverrideSplits);
        deterministicOverrideCount += 1;
      }

      const afterDeterministic =
        deterministicOverrideCount > 0
          ? await qc.fetchQuery({
              queryKey: ["med-splits", selectedEncounterId],
              queryFn: () => getMedSplitsByEncounter(selectedEncounterId!),
              staleTime: 0,
            })
          : refreshed;

      const fallbackCandidates = (donThuocData ?? []).filter((item) => {
        const idPhieuThuoc = String(item.IdPhieuThuoc);
        const maxQty = Number(item.SoLuong || 0);
        const info = afterDeterministic?.splits?.[idPhieuThuoc];
        const forceWholeSplit = shouldForceWholeSplitV2(item);
        const hasDeterministicSplits = !!buildDeterministicSplitsFromInstruction(
          item.LieuDung,
          item.GhiChuLieuDung,
          maxQty
        );
        const totalAssigned = sumSplits(info?.splits);
        const isManual = info?.splitSource === "MANUAL";

        if (isManual || hasDeterministicSplits || !(maxQty > 0)) return false;

        return (
          !info ||
          info.needsReview ||
          totalAssigned <= 0 ||
          totalAssigned - maxQty > 0.000001 ||
          (forceWholeSplit && hasFractionalSplits(info?.splits))
        );
      });

      let fallbackCount = 0;
      for (const item of fallbackCandidates) {
        const splits = buildRandomFallbackSplits(Number(item.SoLuong || 0));
        if (sumSplits(splits) <= 0) continue;

        await saveMedSplitOne(selectedEncounterId!, String(item.IdPhieuThuoc), splits);
        fallbackCount += 1;
      }

      const finalData =
        deterministicOverrideCount > 0 || fallbackCount > 0
          ? await qc.fetchQuery({
              queryKey: ["med-splits", selectedEncounterId],
              queryFn: () => getMedSplitsByEncounter(selectedEncounterId!),
              staleTime: 0,
            })
          : afterDeterministic;

      setActiveTab("COMPLETED");
      const firstShiftWithData = findFirstShiftWithData(finalData?.splits);
      if (firstShiftWithData) {
        setActiveShift(firstShiftWithData);
      }

      const summary = res?.summary || res?.data?.summary;
      const suffix = fallbackCount > 0 ? `, fallback ngẫu nhiên: ${fallbackCount}` : "";
      toast.success(
        `Tự động chia xong. OK: ${summary?.autoSuccess ?? 0}, cần kiểm tra: ${summary?.needsReview ?? 0}, lỗi: ${summary?.failed ?? 0}`
      );
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Tự động chia ca thất bại");
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
              <span className="uppercase">Đơn thuốc dùng</span>
            </div>
          </div>
        </div>

        {/* <div className="flex gap-2 w-full md:w-auto">
          {isVerified ? (
            <div className="flex-1 md:flex-none bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-200">
              <i className="fa-solid fa-shield-check text-base"></i> Đã xác thực BN
            </div>
          ) : (
            <button
              onClick={() => setIsScanning(true)}
              className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-black transition"
            >
              <i className="fa-solid fa-qrcode text-base"></i> Quét mã xác nhận
            </button>
          )}
        </div> */}
      </div>

      <EncounterList
        idBenhAn={idBenhAn}
        selectedEncounterId={selectedEncounterId}
        onChangeSelected={setSelectedEncounterId}
        mode="all"
      />

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex-1 border-b-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "PENDING" ? "border-primary text-primary" : "border-transparent text-slate-400"
          }`}
        >
          Chưa chia ca
        </button>
        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex-1 border-b-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === "COMPLETED" ? "border-primary text-primary" : "border-transparent text-slate-400"
          }`}
        >
          Đã chia ca
        </button>
      </div>

      <button
        onClick={() => autoSplitMutation.mutate()}
        disabled={!selectedEncounterId || autoSplitMutation.isPending}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase text-white shadow-lg disabled:opacity-50 md:flex-none"
      >
        <i className="fa-solid fa-wand-magic-sparkles text-base"></i>
        {autoSplitMutation.isPending ? "Đang tự động chia..." : "Tự động chia toàn bộ"}
      </button>

      {activeTab === "COMPLETED" && (
        <div className="mx-4 space-y-3 animate-in fade-in duration-300">
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
                  className={`relative flex-1 rounded-xl py-3 text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 ${
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
                Dùng toàn bộ thuốc của ca đang chọn
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
              disabled={!selectedEncounterId || !hasConfirmableMedsInActiveShift || confirmAllMutation.isPending || confirmAllItems.length === 0}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-emerald-100 transition disabled:opacity-50 disabled:shadow-none"
            >
              <i className="fa-solid fa-check-double"></i>
              {confirmAllMutation.isPending ? "Đang xử lý..." : `Xác nhận ca ${activeShiftOption?.label ?? ""}`}
            </button>
          </div>
        </div>
      )}

      <MedicationOrders
        idPhieuKham={selectedEncounterId}
        shift={activeShift}
        splitMap={splitData?.splits ?? {}}
        splitLoading={splitLoading}
        filterTab={activeTab}
        onPickDrug={(drug) => {
          const currentEntry = splitData?.splits?.[drug.idPhieuThuoc];
          const currentInfo = currentEntry?.splits;
          const suggestedSplits = buildDeterministicSplitsFromInstruction(
            drug.lieuDung,
            undefined,
            Number(drug.maxQty ?? 0)
          );
          const preferredSplits =
            currentEntry?.splitSource !== "MANUAL" &&
            shouldSplitByStrengthV2({
              DonVi: drug.donVi,
              HamLuong: drug.hamLuong,
              LieuDung: drug.lieuDung,
            }) &&
            suggestedSplits
              ? suggestedSplits
              : currentInfo;

          setSelectedDrug({
            idPhieuThuoc: drug.idPhieuThuoc,
            ten: drug.ten,
            maxQty: drug.maxQty,
            lieuDung: drug.lieuDung,
            donVi: drug.donVi,
            hamLuong: drug.hamLuong,
            loaiThuoc: drug.loaiThuoc,
            splits: {
              MORNING: Number(preferredSplits?.MORNING ?? 0),
              NOON: Number(preferredSplits?.NOON ?? 0),
              AFTERNOON: Number(preferredSplits?.AFTERNOON ?? 0),
              NIGHT: Number(preferredSplits?.NIGHT ?? 0),
            },
          });
        }}
        onAction={(data) => {
          if (data.type === "RETURN") {
            setReturnQuantity(data.qty);
            setReturnReason("");
          }
          setActionDrug(data);
        }}
      />

      {selectedDrug && (
        <DrugSplitModal
          selectedDrug={selectedDrug}
          setSelectedDrug={setSelectedDrug}
          saveSplitMutation={saveSplitMutation}
        />
      )}

      {isScanning && (
        <CameraScannerModal
          isScanning={isScanning}
          setIsScanning={setIsScanning}
          videoRef={videoRef}
          cameraError={cameraError}
          maBenhNhan={maBenhNhan}
          setIsVerified={setIsVerified}
        />
      )}

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
