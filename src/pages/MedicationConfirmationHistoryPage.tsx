import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";

import { useAuth } from "@/context/AuthContext";
import { formatFractionValue } from "@/utils/fractions";
import {
  getMedicationConfirmationHistory,
  type MedicationConfirmationHistoryItem,
  type MedicationConfirmationHistoryResponse,
} from "@/services/medSplit.api";

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
};

type HistoryCell = {
  quantities: string[];
  times: string[];
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
      const cell = row.cells[columnKey] ?? { quantities: [], times: [] };

      if (quantityLabel && !cell.quantities.includes(quantityLabel)) {
        cell.quantities.push(quantityLabel);
      }
      if (timeLabel && !cell.times.includes(timeLabel)) {
        cell.times.push(timeLabel);
      }

      row.cells[columnKey] = cell;
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
            return cellSum + Math.max(cell.times.length, cell.quantities.length || 0);
          }, 0)
        );
      }, 0),
    [filteredRows]
  );

  const exportExcel = useCallback(() => {
    // Hàng tiêu đề
    const headerRow = [
      "STT",
      "Họ Tên Bệnh Nhân",
      "Mã BN",
      "Tuổi",
      ...columns.map((c) => c.hamLuong ? `${c.tenThuoc} (${c.hamLuong})` : c.tenThuoc),
    ];

    // Hàng dữ liệu
    const dataRows = filteredRows.map((row, idx) => [
      idx + 1,
      row.tenBenhNhan,
      row.maBenhNhan ?? "",
      row.tuoi ?? "",
      ...columns.map((col) => {
        const cell = row.cells[col.key];
        if (!cell) return "";
        const qty = cell.quantities.join(", ");
        const times = cell.times.join(", ");
        if (qty && times) return `${qty} (${times})`;
        return qty || times || "";
      }),
    ]);

    const sheetData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Căn độ rộng cột tự động
    const colWidths = headerRow.map((h, i) => ({
      wch: Math.max(
        String(h).length,
        ...dataRows.map((r) => String(r[i] ?? "").length)
      ) + 2,
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lịch sử xác nhận");

    const tenKhoa = user?.tenKhoa ? `_${user.tenKhoa.replace(/\s+/g, "_")}` : "";
    XLSX.writeFile(wb, `LichSuXacNhanThuoc_${date}${tenKhoa}.xlsx`);
  }, [columns, filteredRows, date, user?.tenKhoa]);

  useEffect(() => {
    if (!activeColumnKey) return;

    const handleDocumentClick = () => setActiveColumnKey(null);

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [activeColumnKey]);

  return (
    <div className="space-y-4 px-3 md:px-6 pb-24 max-w-[1600px] mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-[28px] md:rounded-[36px] border border-slate-100 shadow-sm p-4 md:p-6">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 text-white rounded-[18px] md:rounded-[22px] flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-emerald-200 shrink-0">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase leading-none tracking-tighter">
                Lịch Sử Xác Nhận
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                {user?.tenKhoa || "Khoa"}
              </p>
            </div>
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={exportExcel}
            disabled={filteredRows.length === 0 || columns.length === 0}
            className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <i className="fa-solid fa-file-excel text-sm"></i>
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên hoặc mã bệnh nhân..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition"
            />
          </div>

          {/* Date group */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black text-slate-800 outline-none focus:border-primary focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setDate(draftDate)}
              className="shrink-0 rounded-2xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:opacity-90 transition"
            >
              Tìm
            </button>
            <button
              type="button"
              onClick={() => { const t = formatDateInput(); setDraftDate(t); setDate(t); }}
              className="shrink-0 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-200 transition"
            >
              Hôm nay
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600">
            <i className="fa-solid fa-user-injured mr-1.5 text-slate-400"></i>
            {filteredRows.length} bệnh nhân
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">
            <i className="fa-solid fa-check-circle mr-1.5"></i>
            {totalConfirmations} lượt xác nhận
          </span>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-black text-violet-700">
            <i className="fa-solid fa-pills mr-1.5"></i>
            {columns.length} loại thuốc
          </span>
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
                      {columns.map((column) => (
                        <th
                          key={`mobile-${column.key}`}
                          className="relative h-[170px] min-w-[72px] max-w-[72px] border-b border-r border-slate-200 p-0 text-center align-bottom"
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
                      ))}
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

                          return (
                            <td
                              key={`mobile-${row.key}-${column.key}`}
                              className="border-b border-r border-slate-200 px-2 py-3 align-top"
                            >
                              {!cell ? (
                                <div className="min-h-[56px]"></div>
                              ) : (
                                <div className="flex min-h-[56px] flex-col items-center justify-center gap-1.5 text-center">
                                  {cell.quantities.length > 0 && (
                                    <div className="text-sm font-black text-primary">
                                      {cell.quantities.join(", ")}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap justify-center gap-1">
                                    {cell.times.map((time) => (
                                      <span
                                        key={time}
                                        className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700"
                                      >
                                        {time}
                                      </span>
                                    ))}
                                  </div>
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
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="relative h-[240px] min-w-[88px] max-w-[88px] border-b border-r border-slate-200 p-0 text-center align-bottom"
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
                    ))}
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

                        return (
                          <td
                            key={`${row.key}-${column.key}`}
                            className="border-b border-r border-slate-200 px-3 py-4 align-top"
                          >
                            {!cell ? (
                              <div></div>
                            ) : (
                              <div className="flex min-h-[70px] flex-col items-center justify-center gap-2 text-center">
                                {cell.quantities.length > 0 && (
                                  <div className="text-lg font-black text-primary">
                                    {cell.quantities.join(", ")}
                                  </div>
                                )}

                                <div className="flex flex-wrap justify-center gap-1.5">
                                  {cell.times.map((time) => (
                                    <span
                                      key={time}
                                      className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700"
                                    >
                                      {time}
                                    </span>
                                  ))}
                                </div>
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
