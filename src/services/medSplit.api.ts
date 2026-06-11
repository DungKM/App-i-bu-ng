import { requestNode } from "./http.node";
import type { BuongPhongResponse, DonThuocItem, MedVisitLite, SplitQty } from "@/types/dibuong";

export type SplitSource = "UPSTREAM" | "MANUAL" | "RULE" | "AI";

export interface ReturnHistoryItem {
  quantity: number;
  reason: string;
  status?: string;
  returnedAt?: string;
  returnedBy?: string;
}

export interface MedSplitItem {
  splits: SplitQty;
  status?: string;
  confirmedShifts?: string[];
  splitSource?: SplitSource;
  confidence?: number;
  needsReview?: boolean;
  reason?: string | null;
  rawInstruction?: string | null;
  parsedInstruction?: any;
  returnHistory?: ReturnHistoryItem[];
}

export interface MedSplitsResponse {
  idPhieuKham: string;
  splits: Record<string, MedSplitItem>;
}

export interface MedicationListBed {
  code: string;
  visits: MedVisitLite[];
  isOccupied: boolean;
}

export interface MedicationListRoom {
  room: string;
  beds: MedicationListBed[];
}

export interface MedicationListResponse {
  date: string;
  idKhoa: string;
  departmentId?: string | null;
  shouldResolveEncountersByDate: boolean;
  source?: {
    upstreamBaseUrl?: string;
    cacheTtlMs?: number;
  };
  wardData?: BuongPhongResponse;
  wardLayout: MedicationListRoom[];
  benhAnIds?: string[];
  latestPhieuKhamIds?: string[];
  phieuKhamIds?: string[];
  lanKhamByBenhAn?: Record<string, string | null>;
  medsByVisit?: Record<string, DonThuocItem[]>;
  medSplitsByVisit?: Record<string, Record<string, MedSplitItem>>;
  shiftsByVisit?: Record<string, Record<string, { used: number; pending: number; returned: number; total?: number }>>;
  totalByShift: Record<string, number>;
  meta?: {
    partial?: boolean;
    upstreamErrors?: Array<{ item?: string; message?: string } | string>;
  };
}

export interface ConfirmedMedicationSheetRow {
  idPhieuThuoc: string;
  tenThuoc: string;
  hamLuong?: string | null;
  loaiThuoc?: string | null;
  donVi?: string | null;
  soLuongDung: number;
  confirmedAt?: string | null;
  ghiChu?: string | null;
}

export interface ConfirmedMedicationSheetResponse {
  ngay?: string | null;
  shift?: string | null;
  benhNhan?: {
    tenBenhNhan?: string | null;
    maBenhNhan?: string | null;
    tuoi?: string | null;
  } | null;
  items: ConfirmedMedicationSheetRow[];
}

export interface MedicationConfirmationHistoryItem {
  idBenhNhan?: string | null;
  tenBenhNhan: string;
  maBenhNhan?: string | null;
  tuoi?: string | null;
  tenThuoc: string;
  hamLuong?: string | null;
  loaiThuoc?: string | null;
  donVi?: string | null;
  soLuongDung?: number | null;
  confirmedAt?: string | null;
}

export interface MedicationConfirmationHistoryResponse {
  date?: string | null;
  items: MedicationConfirmationHistoryItem[];
}

export interface AutoSplitInputItem {
  idPhieuThuoc: string;
  tenThuoc: string;
  lieuDung: string;
  maxQty: number;
}

export interface AutoSplitResponse {
  ok: boolean;
  summary: {
    total: number;
    autoSuccess: number;
    needsReview: number;
    failed: number;
    skippedManual: number;
  };
}

export interface ConfirmMedUsagePayload {
  shift: string;
  soLuongDung: number;
  tenBenhNhan: string;
  maBenhNhan: string;
  tuoi?: string | null;
  tenThuoc: string;
  hamLuong?: string | null;
  loaiThuoc?: string | null;
  donVi?: string | null;
}

export interface ConfirmAllMedUsagePayload {
  shift: string;
  tenBenhNhan: string;
  maBenhNhan: string;
  tuoi?: string | null;
  items: Array<{
    idPhieuThuoc: string;
    soLuongDung: number;
    tenThuoc: string;
    hamLuong?: string | null;
    loaiThuoc?: string | null;
    donVi?: string | null;
  }>;
}

export function getMedSplitsByEncounter(idPhieuKham: string) {
  return requestNode<MedSplitsResponse>(`/api/encounters/${idPhieuKham}/med-splits`);
}

export type MedicationListMode = "layout" | "full";

export function getMedicationList(
  idKhoa?: string | null,
  date?: string | null,
  mode: MedicationListMode = "full"
) {
  return requestNode<MedicationListResponse>(`/api/medication-list`, {
    query: {
      idKhoa: idKhoa || undefined,
      date: date || undefined,
      mode,
    },
  });
}

export function saveMedSplitOne(
  idPhieuKham: string,
  idPhieuThuoc: string,
  splits: SplitQty
) {
  return requestNode<any>(`/api/encounters/${idPhieuKham}/med-splits/${idPhieuThuoc}`, {
    method: "PUT",
    body: { splits },
  });
}

export function autoSplitAllMeds(
  idPhieuKham: string,
  items: AutoSplitInputItem[]
) {
  return requestNode<AutoSplitResponse>(
    `/api/encounters/${idPhieuKham}/med-splits/auto-split`,
    {
      method: "POST",
      body: { items },
    }
  );
}

export function confirmMedUsage(
  idPhieuKham: string,
  idPhieuThuoc: string,
  payload: ConfirmMedUsagePayload
) {
  return requestNode(`/api/encounters/${idPhieuKham}/med-splits/${idPhieuThuoc}/confirm`, {
    method: "PATCH",
    body: payload,
  });
}

export function confirmAllMedUsage(idPhieuKham: string, payload: ConfirmAllMedUsagePayload) {
  return requestNode(`/api/encounters/${idPhieuKham}/med-splits/confirm-all`, {
    method: "PATCH",
    body: payload,
  });
}

export function getConfirmedMedicationSheet(idPhieuKham: string, shift: string) {
  return requestNode<ConfirmedMedicationSheetResponse>(
    `/api/encounters/${idPhieuKham}/med-splits/confirmed-sheet`,
    {
      query: { shift },
    }
  );
}

export function getMedicationConfirmationHistory(date: string, idKhoa?: string | null) {
  return requestNode<MedicationConfirmationHistoryResponse>(
    `/api/medication-confirmations/history`,
    {
      query: {
        date,
        idKhoa: idKhoa || undefined,
      },
    }
  );
}

export function cancelConfirmedUsage(idPhieuKham: string, idPhieuThuoc: string, shift: string) {
  return requestNode(`/api/encounters/${idPhieuKham}/med-splits/${idPhieuThuoc}/unconfirm`, {
    method: "PATCH",
    body: { shift },
  });
}

export function returnMedication(
  idPhieuKham: string,
  idPhieuThuoc: string,
  data: {
    quantity: number;
    reason: string;
    tenBenhNhan: string;
    maBenhNhan: string;
    tenThuoc: string;
    idBenhAn: string;
    shift: "MORNING" | "NOON" | "AFTERNOON" | "NIGHT";
  }
) {
  return requestNode(
    `/api/encounters/${idPhieuKham}/med-splits/${idPhieuThuoc}/return`,
    {
      method: "PATCH",
      body: data,
    }
  );
}
