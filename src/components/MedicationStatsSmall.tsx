import React from "react";

export type MedicationTodayStats = {
  total: number;
  done: number;
  overdue: number;
};

type Props = {
  stats?: MedicationTodayStats;
  className?: string;
};

const MedicationStatsSmall: React.FC<Props> = ({ stats, className }) => {
  if (!stats || stats.total === 0) {
    return (
      <div
        className={`bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 border border-slate-100 uppercase ${
          className ?? ""
        }`}
      >
        <i className="fa-solid fa-minus-circle" /> Chưa y lệnh
      </div>
    );
  }

  const isDone = stats.done === stats.total;
  const isOverdue = stats.overdue > 0;

  if (isDone) {
    return (
      <div
        className={`bg-green-50 text-green-600 px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 border border-green-100 uppercase ${
          className ?? ""
        }`}
      >
        <i className="fa-solid fa-check-circle" /> Hoàn thành ({stats.done}/{stats.total})
      </div>
    );
  }

  return (
    <div
      className={`${
        isOverdue
          ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
          : "bg-primary/5 text-primary border-primary/10"
      } px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 border uppercase ${className ?? ""}`}
    >
      <i className={`fa-solid ${isOverdue ? "fa-triangle-exclamation" : "fa-clock"}`} />
      {isOverdue ? "Quá giờ" : "Đang chờ"} ({stats.done}/{stats.total})
    </div>
  );
};

export default MedicationStatsSmall;
