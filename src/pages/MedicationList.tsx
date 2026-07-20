import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";

import { buildAdvancedShiftStats } from "@/components/buildAdvancedShiftStats";
import { MedicationBedCard } from "@/components/MedicationBedCard";
import { useAuth } from "@/context/AuthContext";
import { getMedicationList } from "@/services/medSplit.api";
import type { MedicationListResponse } from "@/services/medSplit.api";
import { ShiftType } from "@/types/dibuong";
import { getCurrentShift, SHIFT_OPTIONS } from "@/utils/shifts";

type MedicationStatusFilter = "ALL" | "USED" | "PENDING";

const STATUS_FILTER_OPTIONS: Array<{
  id: MedicationStatusFilter;
  label: string;
  icon: string;
}> = [
    { id: "ALL", label: "Tất cả", icon: "fa-bars-staggered" },
    { id: "USED", label: "Đã dùng", icon: "fa-check-circle" },
    { id: "PENDING", label: "Chờ dùng", icon: "fa-hourglass-half" },
  ];

export const MedicationList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const khoaOptions = [{ id: user?.idHis || "", name: user?.tenKhoa || "Khoa" }];

  const [searchTerm, setSearchTerm] = useState("");
  const [activeShift, setActiveShift] = useState<ShiftType>(() => getCurrentShift());
  const [statusFilter, setStatusFilter] = useState<MedicationStatusFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [idKhoa, setIdKhoa] = useState<string>(khoaOptions[0].id);

  const displayDate = useMemo(() => {
    if (!selectedDate) return "--/--/----";
    const date = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return selectedDate;

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }, [selectedDate]);

  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(`${selectedDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [selectedDate]);

  type DateTriggerProps = { value?: string; onClick?: () => void };

  const DateTrigger = React.forwardRef<HTMLButtonElement, DateTriggerProps>(({ onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full flex items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
    >
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-calendar-check text-primary text-sm"></i>
        <span className="text-[10px] font-black text-slate-400 uppercase lg:hidden">Ngay:</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-slate-800 tabular-nums">{displayDate}</span>
        <i className="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
      </div>
    </button>
  ));

  DateTrigger.displayName = "DateTrigger";

  const {
    data: medicationLayoutData,
    isLoading: isLayoutLoading,
  } = useQuery<MedicationListResponse>({
    queryKey: ["medicationList-layout", idKhoa, selectedDate],
    queryFn: () => getMedicationList(idKhoa, selectedDate, "layout"),
    enabled: !!idKhoa,
    staleTime: 30_000,
  });

  const {
    data: medicationFullData,
    isLoading: isFullLoading,
    error,
  } = useQuery<MedicationListResponse>({
    queryKey: ["medicationList-full", idKhoa, selectedDate],
    queryFn: () => getMedicationList(idKhoa, selectedDate, "full"),
    enabled: !!idKhoa,
    staleTime: 30_000,
  });
  const medicationListData = medicationFullData || medicationLayoutData;

  const isPartialLayout = medicationListData?.meta?.stage === "layout";
  const wardLayout = useMemo(() => {
    const rawWardLayout = medicationListData?.wardLayout ?? [];
    const medsByVisit = medicationListData?.medsByVisit ?? {};
    const medSplitsByVisit = medicationListData?.medSplitsByVisit ?? {};

    return rawWardLayout.map((room) => ({
      ...room,
      beds: room.beds.map((bed) => ({
        ...bed,
        visits: bed.visits.map((visit) => {
          const idPhieuKham = String(visit.idPhieuKham ?? "");
          const meds = medsByVisit[idPhieuKham] ?? [];
          const splits = medSplitsByVisit[idPhieuKham] ?? {};
          const computedShifts =
            idPhieuKham && (meds.length > 0 || Object.keys(splits).length > 0)
              ? buildAdvancedShiftStats(meds, splits)
              : visit.marSummary?.shifts;

          return {
            ...visit,
            marSummary: {
              shifts: computedShifts ?? visit.marSummary?.shifts ?? buildAdvancedShiftStats([], {}),
            },
          };
        }),
      })),
    }));
  }, [medicationListData]);

  const totalByShift = useMemo(() => {
    const result: Record<string, number> = {};

    wardLayout.forEach((room) => {
      room.beds.forEach((bed) => {
        bed.visits.forEach((visit) => {
          Object.entries(visit.marSummary?.shifts ?? {}).forEach(([shiftId, stats]) => {
            result[shiftId] = (result[shiftId] || 0) + Number(stats?.total ?? 0);
          });
        });
      });
    });

    return result;
  }, [wardLayout]);

  const filteredWard = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized && statusFilter === "ALL") return wardLayout;

    return wardLayout
      .map((room) => {
        const beds = room.beds
          .map((bed) => {
            const matchingVisits = bed.visits.filter(
              (visit) =>
                ((visit.patientName ?? "").toLowerCase().includes(normalized) ||
                  String(visit.patientCode ?? "").toLowerCase().includes(normalized) ||
                  String(visit.room ?? "").toLowerCase().includes(normalized) ||
                  String(visit.bed ?? "").toLowerCase().includes(normalized) ||
                  !normalized) &&
                (() => {
                  const current = visit.marSummary?.shifts?.[activeShift];

                  if (statusFilter === "USED") return Number(current?.used ?? 0) > 0;
                  if (statusFilter === "PENDING") return Number(current?.pending ?? 0) > 0;
                  return true;
                })()
            );

            return {
              ...bed,
              visits: matchingVisits,
              isOccupied: matchingVisits.length > 0,
            };
          })
          .filter((bed) => (bed.visits?.length ?? 0) > 0);

        return {
          ...room,
          beds,
          matchCount: beds.reduce((sum, bed) => sum + (bed.visits?.length ?? 0), 0),
        };
      })
      .filter((room) => room.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount || String(a.room).localeCompare(String(b.room)))
      .map(({ matchCount, ...room }) => room);
  }, [activeShift, searchTerm, statusFilter, wardLayout]);

  const isClosed = false;
  if (isLayoutLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-500 text-sm animate-pulse">Vui lòng chờ trong giây lát...</p>
      </div>
    );
  }

  if (error && !medicationLayoutData) {
    return (
      <div className="max-w-[1300px] mx-auto p-6 bg-red-50 border border-red-200 text-red-700 font-bold rounded-3xl">
        Loi tai du lieu: {String((error as any)?.message || error)}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 px-3 md:px-6 max-w-[1300px] mx-auto">
      <div className="bg-white p-4 md:p-6 rounded-[28px] md:rounded-[36px] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary text-white rounded-[20px] md:rounded-[24px] flex items-center justify-center text-xl md:text-3xl shadow-xl shadow-primary/20 transform -rotate-2">
            <i className="fa-solid fa-pills"></i>
          </div>

          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 uppercase leading-none mb-1 tracking-tighter">
              Thực hiện thuốc
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 font-bold bg-blue-50 text-primary px-2 md:px-3 py-1 rounded-full">
                <i className="fa-solid fa-hospital"></i>
                <select
                  value={idKhoa}
                  onChange={(e) => setIdKhoa(e.target.value)}
                  className="bg-transparent outline-none font-black"
                >
                  {khoaOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </span>
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved"></i> 5 đúng
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
          <button
            type="button"
            onClick={() => navigate("/medication/history")}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-primary"
          >
            <i className="fa-solid fa-table-list text-sm"></i>
            Lịch sử xác nhận
          </button>

          <div className="relative w-full lg:w-[240px]">
            <DatePicker
              selected={selectedDateObj}
              onChange={(date: any) => {
                if (!date) return;
                setSelectedDate(format(date, "yyyy-MM-dd"));
              }}
              dateFormat="dd/MM/yyyy"
              customInput={<DateTrigger />}
              calendarClassName="rdp-calendar"
              popperClassName="rdp-popper"
              popperPlacement="bottom-start"
              showPopperArrow={false}
              fixedHeight
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="bg-slate-200/30 p-1.5 rounded-2xl flex gap-1.5 shadow-inner min-w-[400px] md:min-w-0 md:max-w-5xl md:mx-auto">
          {SHIFT_OPTIONS.map((option) => {
            const totalInShift = totalByShift[option.id] ?? 0;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveShift(option.id)}
                title={`${option.label} (${option.timeRange})`}
                className={`flex-1 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all flex flex-col items-center justify-center relative ${activeShift === option.id ? "bg-white text-primary shadow-sm" : "text-slate-500"
                  }`}
              >
                {totalInShift > 0 && (
                  <span className="absolute top-1 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                )}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <i className={`fa-solid ${option.icon} text-[10px] md:text-[12px]`} />
                  <span className="text-[9px] md:text-[11px] font-extrabold uppercase">{option.label}</span>
                </div>
                <span className="text-[8px] font-bold opacity-60 italic">({totalInShift})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-start">
        <div className="relative w-full md:w-96 group">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"></i>
          <input
            type="text"
            placeholder="Tìm tên bệnh nhân hoặc mã bệnh nhân..."
            className="w-full pl-12 pr-6 py-4 rounded-3xl border-2 border-slate-200 bg-white text-slate-900 font-black text-sm placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="inline-flex min-w-full gap-2 rounded-2xl bg-slate-100/80 p-1.5 md:min-w-0">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStatusFilter(option.id)}
              className={`flex min-w-[118px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition ${statusFilter === option.id
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                }`}
            >
              <i className={`fa-solid ${option.icon} text-[11px]`} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      {isPartialLayout && isFullLoading && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Đang tải dữ liệu thuốc...
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
        {filteredWard.length === 0 ? (
          <div className="lg:col-span-2 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm font-black uppercase tracking-widest text-slate-400">
            {searchTerm.trim() || statusFilter !== "ALL"
              ? "Khong tim thay benh nhan phu hop"
              : "Chua co benh nhan phu hop trong ca nay"}
          </div>
        ) : (
          filteredWard.map((room) => (
            <section key={room.room} className="space-y-4">
              <div className="flex items-center gap-3 md:gap-4 px-2 md:px-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-[14px] md:rounded-[18px] flex items-center justify-center font-black text-lg md:text-xl shadow-lg border-2 border-white transform rotate-3">
                  {String(room.room).replace(/\D/g, "") || "--"}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-base md:text-xl text-slate-800 uppercase tracking-tight">Phong {room.room}</h3>
                </div>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {room.beds.map((bed, idx) => (
                  <MedicationBedCard
                    key={`${room.room}-${bed.code}-${idx}`}
                    bedCode={bed.code}
                    visits={bed.visits}
                    activeShift={activeShift}
                    isClosed={isClosed}
                    highlightSearch={!!searchTerm && bed.visits.length > 0}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
