import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { formatFractionValue } from "@/utils/fractions";
import { SHIFT_LABELS } from "@/utils/shifts";
import { ShiftType } from "@/types/dibuong";
import {
  getMedicationConfirmationHistory,
  type MedicationConfirmationHistoryItem,
  type MedicationConfirmationHistoryResponse,
} from "@/services/medSplit.api";

const SHIFT_ORDER: string[] = [ShiftType.MORNING, ShiftType.NOON, ShiftType.AFTERNOON, ShiftType.NIGHT];

function shiftLabel(shift: string) {
  return SHIFT_LABELS[shift as ShiftType] || null;
}

function sortedShiftEntries(cell: { shifts: Record<string, HistoryCellShift> }) {
  return Object.values(cell.shifts).sort((a, b) => SHIFT_ORDER.indexOf(a.shift) - SHIFT_ORDER.indexOf(b.shift));
}

function getColumnWidth(maxShiftCount: number, dense: boolean) {
  if (maxShiftCount <= 1) return dense ? 72 : 88;
  return dense ? 118 : 150;
}

function getShiftCellSizing(count: number, dense: boolean) {
  if (count <= 1) {
    return dense
      ? { qty: "text-sm", badge: "text-[10px] px-2 py-0.5", wrapGap: "gap-x-1 gap-y-1", itemGap: "gap-0.5" }
      : { qty: "text-lg", badge: "text-[11px] px-2.5 py-1", wrapGap: "gap-x-2 gap-y-1.5", itemGap: "gap-1" };
  }
  if (count === 2) {
    return dense
      ? { qty: "text-xs", badge: "text-[9px] px-1.5 py-0.5", wrapGap: "gap-x-1 gap-y-0.5", itemGap: "gap-0" }
      : { qty: "text-sm", badge: "text-[10px] px-2 py-0.5", wrapGap: "gap-x-1.5 gap-y-1", itemGap: "gap-0.5" };
  }
  return dense
    ? { qty: "text-[10px]", badge: "text-[8px] px-1 py-0.5", wrapGap: "gap-x-0.5 gap-y-0.5", itemGap: "gap-0" }
    : { qty: "text-sm", badge: "text-[9px] px-1.5 py-0.5", wrapGap: "gap-x-1 gap-y-1", itemGap: "gap-0" };
}

function formatDateInput(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type HistoryColumn = {
  key: string;
  tenThuoc: string;
  hamLuong?: string | null;
  loaiThuoc?: string | null;
  maxShiftCount: number;
};

type HistoryCellEvent = {
  quantity: string | null;
  time: string | null;
};

type HistoryCellShift = {
  shift: string;
  events: HistoryCellEvent[];
};

type HistoryCell = {
  shifts: Record<string, HistoryCellShift>;
};

type HistoryRow = {
  key: string;
  tenBenhNhan: string;
  maBenhNhan?: string | null;
  tuoi?: string | null;
  cells: Record<string, HistoryCell>;
};

export const MedicationConfirmationHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(formatDateInput());
  const [draftDate, setDraftDate] = useState(formatDateInput());
  const [activeColumnKey, setActiveColumnKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery<MedicationConfirmationHistoryResponse>({
    queryKey: ["medication-confirmation-history", date, user?.idKhoa],
    enabled: !!date,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: () => getMedicationConfirmationHistory(date, user?.idKhoa),
  });

  const resolvedData = useMemo(() => {
    const payload = data as any;
    if (Array.isArray(payload?.items)) return payload as MedicationConfirmationHistoryResponse;
    if (Array.isArray(payload?.data?.items)) return payload.data as MedicationConfirmationHistoryResponse;
    return data;
  }, [data]);

  const items = useMemo(
    () => (Array.isArray(resolvedData?.items) ? resolvedData.items : []) as MedicationConfirmationHistoryItem[],
    [resolvedData?.items]
  );

  const { columns, rows } = useMemo(() => {
    const columnMap = new Map<string, HistoryColumn>();
    const rowMap = new Map<string, HistoryRow>();

    items.forEach((item) => {
      if (!(item.tenThuoc || "").trim()) return;

      const columnKey = [
        (item.tenThuoc || "").trim().toLowerCase(),
        (item.hamLuong || "").trim().toLowerCase(),
        (item.donVi || "").trim().toLowerCase(),
      ].join("__");

      if (!columnMap.has(columnKey)) {
        columnMap.set(columnKey, {
          key: columnKey,
          tenThuoc: item.tenThuoc,
          hamLuong: item.hamLuong ?? null,
          loaiThuoc: item.loaiThuoc ?? null,
          maxShiftCount: 0,
        });
      }

      const rowKey =
        item.idBenhNhan ||
        item.maBenhNhan ||
        `${(item.tenBenhNhan || "").trim().toLowerCase()}__${item.tuoi || ""}`;

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, {
          key: rowKey,
          tenBenhNhan: item.tenBenhNhan,
          maBenhNhan: item.maBenhNhan ?? null,
          tuoi: item.tuoi ?? null,
          cells: {},
        });
      }

      const row = rowMap.get(rowKey)!;
      const quantityLabel =
        item.soLuongDung != null && !Number.isNaN(Number(item.soLuongDung))
          ? `${formatFractionValue(Number(item.soLuongDung))}${item.donVi ? ` ${item.donVi}` : ""}`
          : null;
      const timeLabel = formatTime(item.confirmedAt);
      const shiftKey = item.shift || "UNKNOWN";
      const cell = row.cells[columnKey] ?? { shifts: {} };
      const shiftEntry = cell.shifts[shiftKey] ?? { shift: shiftKey, events: [] };

      const isDuplicateEvent = shiftEntry.events.some(
        (e) => e.quantity === quantityLabel && e.time === timeLabel
      );
      if (!isDuplicateEvent && (quantityLabel || timeLabel)) {
        shiftEntry.events.push({ quantity: quantityLabel, time: timeLabel });
      }

      cell.shifts[shiftKey] = shiftEntry;
      row.cells[columnKey] = cell;
    });

    const columnMaxShiftCount = new Map<string, number>();
    rowMap.forEach((row) => {
      Object.entries(row.cells).forEach(([columnKey, cell]) => {
        const count = Object.keys(cell.shifts).length;
        columnMaxShiftCount.set(columnKey, Math.max(columnMaxShiftCount.get(columnKey) ?? 0, count));
      });
    });
    columnMap.forEach((column) => {
      column.maxShiftCount = columnMaxShiftCount.get(column.key) ?? 0;
    });

    const sortedColumns = Array.from(columnMap.values()).sort((a, b) =>
      `${a.tenThuoc} ${a.hamLuong || ""}`.localeCompare(`${b.tenThuoc} ${b.hamLuong || ""}`, "vi")
    );
    const sortedRows = Array.from(rowMap.values()).sort((a, b) =>
      a.tenBenhNhan.localeCompare(b.tenBenhNhan, "vi")
    );

    return {
      columns: sortedColumns,
      rows: sortedRows,
    };
  }, [items]);

  const filteredRows = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter(
      (row) =>
        (row.tenBenhNhan ?? "").toLowerCase().includes(normalized) ||
        String(row.maBenhNhan ?? "").toLowerCase().includes(normalized)
    );
  }, [rows, searchTerm]);

  const totalConfirmations = useMemo(
    () =>
      filteredRows.reduce((sum, row) => {
        return (
          sum +
          Object.values(row.cells).reduce((cellSum, cell) => {
            return (
              cellSum +
              Object.values(cell.shifts).reduce((shiftSum, shiftEntry) => {
                return shiftSum + shiftEntry.events.length;
              }, 0)
            );
          }, 0)
        );
      }, 0),
    [filteredRows]
  );

  useEffect(() => {
    if (!activeColumnKey) return;

    const handleDocumentClick = () => setActiveColumnKey(null);

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [activeColumnKey]);

  return (
    <div className="space-y-5 px-3 md:px-6 max-w-[1600px] mx-auto">
      <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Chỉ Hiển Thị Lịch Sử
            </div>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900 md:text-3xl">
              Lịch Sử Xác Nhận Dùng Thuốc
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">
                Khoa: {user?.tenKhoa || "Khoa"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                Bệnh nhân: {filteredRows.length}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                Lượt xác nhận: {totalConfirmations}
              </span>
              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">
                Thuốc: {columns.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-[280px]">
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên hoặc mã bệnh nhân"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-primary"
              />
            </div>
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setDate(draftDate)}
              className="rounded-2xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm"
            >
              Tìm theo ngày
            </button>
            <button
              type="button"
              onClick={() => {
                const today = formatDateInput();
                setDraftDate(today);
                setDate(today);
              }}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700"
            >
              Hôm nay
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[28px] border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          Không tải được lịch sử xác nhận. Cần API đọc dữ liệu ngày:
          <span className="ml-2 font-mono text-[12px]">
            GET /api/medication-confirmations/history?date=YYYY-MM-DD&idKhoa=...
          </span>
          <div className="mt-2 text-xs text-amber-700">
            Chi tiết: {String((error as any)?.message || error)}
          </div>
        </div>
      )}

      <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm font-bold text-slate-400">
            Đang tải lịch sử xác nhận...
          </div>
        ) : filteredRows.length === 0 || columns.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm font-bold text-slate-400">
            {searchTerm.trim()
              ? "Không tìm thấy bệnh nhân phù hợp."
              : "Chưa có dữ liệu xác nhận dùng thuốc cho ngày này."}
          </div>
        ) : (
          <>
            <div className="md:hidden">
              <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-bold text-slate-400">
                Vuốt ngang để xem đầy đủ danh sách thuốc
              </div>
              <div className="overflow-auto">
                <table className="min-w-[760px] w-full border-collapse text-left">
                  <thead className="bg-slate-100/90">
                    <tr>
                      <th className="sticky left-0 z-20 min-w-[160px] border-b border-r border-slate-200 bg-slate-100 px-3 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Bệnh nhân
                      </th>
                      <th className="sticky left-[160px] z-20 min-w-[56px] border-b border-r border-slate-200 bg-slate-100 px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        Tuổi
                      </th>
                      {columns.map((column) => {
                        const width = getColumnWidth(column.maxShiftCount, true);
                        return (
                          <th
                            key={`mobile-${column.key}`}
                            style={{ minWidth: width, maxWidth: width }}
                            className="relative h-[170px] border-b border-r border-slate-200 p-0 text-center align-bottom"
                          >
                            <div className="relative h-full w-full overflow-hidden">
                              <button
                                type="button"
                                title={column.hamLuong ? `${column.tenThuoc} - ${column.hamLuong}` : column.tenThuoc}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveColumnKey((current) =>
                                    current === `mobile-${column.key}` ? null : `mobile-${column.key}`
                                  );
                                }}
                                className="absolute left-1/2 top-1/2 flex w-[170px] -translate-x-1/2 -translate-y-1/2 -rotate-90 flex-col items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-center transition-colors hover:bg-slate-100/80"
                              >
                                <div className="w-full truncate text-xs font-black text-slate-800">
                                  {column.tenThuoc}
                                </div>
                                {column.hamLuong && (
                                  <div className="w-full truncate text-[10px] font-bold text-primary">
                                    {column.hamLuong}
                                  </div>
                                )}
                              </button>
                            </div>
                            {activeColumnKey === `mobile-${column.key}` && (
                              <div
                                className="absolute left-1/2 top-2 z-30 w-[180px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-xs font-black text-slate-800">{column.tenThuoc}</div>
                                {column.hamLuong && (
                                  <div className="mt-1 text-[11px] font-bold text-primary">{column.hamLuong}</div>
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={`mobile-row-${row.key}`} className="odd:bg-white even:bg-slate-50/50">
                        <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 py-4">
                          <div className="text-sm font-black leading-tight text-slate-900">{row.tenBenhNhan}</div>
                          <div className="mt-1 text-[10px] font-bold text-slate-400">
                            {row.maBenhNhan ? `#${row.maBenhNhan}` : "--"}
                          </div>
                        </td>
                        <td className="sticky left-[160px] z-10 border-b border-r border-slate-200 bg-inherit px-2 py-4 text-center text-sm font-black text-slate-700">
                          {row.tuoi || "--"}
                        </td>

                        {columns.map((column) => {
                          const cell = row.cells[column.key];
                          const shiftEntries = cell ? sortedShiftEntries(cell) : [];
                          const sizing = getShiftCellSizing(shiftEntries.length, true);

                          return (
                            <td
                              key={`mobile-${row.key}-${column.key}`}
                              className="border-b border-r border-slate-200 px-2 py-3 align-top"
                            >
                              {!cell ? (
                                <div className="min-h-[56px]"></div>
                              ) : (
                                <div
                                  className={`min-h-[56px] items-center justify-center text-center ${sizing.wrapGap} ${
                                    shiftEntries.length > 1
                                      ? "grid grid-cols-2 justify-items-center"
                                      : "flex flex-col"
                                  }`}
                                >
                                  {shiftEntries.map((shiftEntry) => (
                                    <div key={shiftEntry.shift} className={`flex flex-col items-center ${sizing.itemGap}`}>
                                      {shiftEntry.events.map((event, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-0.5">
                                          {event.quantity && (
                                            <div className={`${sizing.qty} font-black text-primary`}>
                                              {event.quantity}
                                            </div>
                                          )}
                                          {event.time && (
                                            <span
                                              className={`whitespace-nowrap rounded-full bg-sky-50 ${sizing.badge} font-black text-sky-700`}
                                            >
                                              {shiftLabel(shiftEntry.shift) ? `${shiftLabel(shiftEntry.shift)} ${event.time}` : event.time}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hidden overflow-auto md:block">
              <table className="min-w-[980px] w-full border-collapse text-left">
                <thead className="bg-slate-100/90">
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-slate-200 bg-slate-100 px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Họ Tên Bệnh Nhân
                    </th>
                    <th className="sticky left-[220px] z-20 min-w-[72px] border-b border-r border-slate-200 bg-slate-100 px-4 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Tuổi
                    </th>
                    {columns.map((column) => {
                      const width = getColumnWidth(column.maxShiftCount, false);
                      return (
                        <th
                          key={column.key}
                          style={{ minWidth: width, maxWidth: width }}
                          className="relative h-[240px] border-b border-r border-slate-200 p-0 text-center align-bottom"
                        >
                          <div className="relative h-full w-full overflow-hidden">
                            <button
                              type="button"
                              title={column.hamLuong ? `${column.tenThuoc} - ${column.hamLuong}` : column.tenThuoc}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveColumnKey((current) => (current === column.key ? null : column.key));
                              }}
                              className="absolute left-1/2 top-1/2 flex w-[220px] -translate-x-1/2 -translate-y-1/2 -rotate-90 flex-col items-center gap-1 whitespace-nowrap rounded-xl px-2 py-1 text-center transition-colors hover:bg-slate-100/80"
                            >
                              <div className="w-full truncate text-sm font-black text-slate-800">
                                {column.tenThuoc}
                              </div>
                              {column.hamLuong && (
                                <div className="w-full truncate text-[11px] font-bold text-primary">
                                  {column.hamLuong}
                                </div>
                              )}
                            </button>
                          </div>
                          {activeColumnKey === column.key && (
                            <div
                              className="absolute left-1/2 top-3 z-30 w-[220px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-xs font-black text-slate-800">{column.tenThuoc}</div>
                              {column.hamLuong && (
                                <div className="mt-1 text-[11px] font-bold text-primary">{column.hamLuong}</div>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.key} className="odd:bg-white even:bg-slate-50/50">
                      <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-4 py-5">
                        <div className="text-base font-black text-slate-900">{row.tenBenhNhan}</div>
                        <div className="mt-1 text-[11px] font-bold text-slate-400">
                          {row.maBenhNhan ? `#${row.maBenhNhan}` : "--"}
                        </div>
                      </td>
                      <td className="sticky left-[220px] z-10 border-b border-r border-slate-200 bg-inherit px-4 py-5 text-center text-base font-black text-slate-700">
                        {row.tuoi || "--"}
                      </td>

                      {columns.map((column) => {
                        const cell = row.cells[column.key];
                        const shiftEntries = cell ? sortedShiftEntries(cell) : [];
                        const sizing = getShiftCellSizing(shiftEntries.length, false);

                        return (
                          <td
                            key={`${row.key}-${column.key}`}
                            className="border-b border-r border-slate-200 px-3 py-4 align-top"
                          >
                            {!cell ? (
                              <div></div>
                            ) : (
                              <div
                                className={`min-h-[70px] items-center justify-center text-center ${sizing.wrapGap} ${
                                  shiftEntries.length > 1
                                    ? "grid grid-cols-2 justify-items-center"
                                    : "flex flex-col"
                                }`}
                              >
                                {shiftEntries.map((shiftEntry) => (
                                  <div key={shiftEntry.shift} className={`flex flex-col items-center ${sizing.itemGap}`}>
                                    {shiftEntry.events.map((event, idx) => (
                                      <div key={idx} className="flex flex-col items-center gap-1">
                                        {event.quantity && (
                                          <div className={`${sizing.qty} font-black text-primary`}>
                                            {event.quantity}
                                          </div>
                                        )}
                                        {event.time && (
                                          <span
                                            className={`whitespace-nowrap rounded-full bg-sky-50 ${sizing.badge} font-black text-sky-700`}
                                          >
                                            {shiftLabel(shiftEntry.shift) ? `${shiftLabel(shiftEntry.shift)} ${event.time}` : event.time}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
