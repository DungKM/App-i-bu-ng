import React from "react";
import MedicationStatsSmall from "./MedicationStatsSmall";
import { BedCardProps } from "@/types/dibuong";


const BedCard: React.FC<BedCardProps> = ({ bedCode, patient, onClick }) => {
  const isOccupied = !!patient;

  const getStatusClasses = () => {
    if (!isOccupied) return "bg-slate-50 border-dashed border-slate-300 opacity-90 cursor-default";
    const stats = patient?.medicationToday;
    if (!stats || stats.total === 0) return "bg-white border-slate-200 shadow-sm";
    if (stats.overdue > 0) return "bg-red-50 border-red-300 ring-4 ring-red-100";
    if (stats.done === stats.total) return "bg-green-50 border-green-300";
    return "bg-blue-50 border-primary/30 ring-2 ring-primary/5";
  };

  const calcAge = (dob?: string) => {
    if (!dob) return "";
    const year = Number(dob.split("-")[0]);
    if (!Number.isFinite(year)) return "";
    return String(new Date().getFullYear() - year);
  };

  return (
    <div
      onClick={isOccupied ? onClick : undefined}
      className={`relative h-40 rounded-[28px] border-2 transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1
        ${getStatusClasses()}
      `}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm ${isOccupied
              ? "bg-white text-primary border border-primary/10"
              : "bg-slate-50 text-slate-300"
            }`}
        >
          {bedCode}
        </span>

        {isOccupied && (
          <div className="flex items-center gap-2 opacity-10">
            <i className="fa-solid fa-bed text-2xl" />
          </div>
        )}
      </div>

      {isOccupied ? (
        <div className="min-w-0 flex-1 flex flex-col justify-center my-1">
          <h3 className="text-base font-black text-slate-900 leading-tight truncate uppercase tracking-tight">
            {patient?.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
            <span className="text-primary font-mono tracking-tighter">{patient?.code}</span>
            <span>•</span>
            <span className="uppercase">{patient?.gender}</span>
            <span>•</span>
            <span>{calcAge(patient?.dob)} tuổi</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 opacity-5">
          <i className="fa-solid fa-plus-circle text-4xl" />
        </div>
      )}

      {isOccupied && (
        <div className="pt-2 border-t border-slate-100">
          <MedicationStatsSmall stats={patient?.medicationToday} />
        </div>
      )}
    </div>
  );
};

export default BedCard;
