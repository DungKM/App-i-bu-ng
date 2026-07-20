import React from "react";
import MedicationStatsSmall from "./MedicationStatsSmall";

type BedCardProps = {
  bedCode: string;
  displayPatients: any[];
  onClick: (payload: any) => void;
};

const BedCard: React.FC<BedCardProps> = ({ bedCode, displayPatients, onClick }) => {
  const isOccupied = displayPatients && displayPatients.length > 0;
  const getStatusClasses = () => {
    if (!isOccupied) return "bg-slate-50 border-dashed border-slate-300 opacity-90 cursor-default";
    const hasOverdue = displayPatients.some(p => p.medicationToday?.overdue > 0);
    if (hasOverdue) return "bg-red-50 border-red-300 ring-4 ring-red-100 animate-pulse-slow";
    const allDone = displayPatients.every(p =>
      p.medicationToday?.total > 0 && p.medicationToday?.done === p.medicationToday?.total
    );
    if (allDone) return "bg-green-50 border-green-300";
    return "bg-white border-slate-200 shadow-sm";
  };

  return (
    <div
      className={`relative min-h-[160px] rounded-[32px] border-2 transition-all duration-300 p-5 flex flex-col gap-4
        ${getStatusClasses()}
      `}
    >
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm ${isOccupied ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
          }`}>
          Giường {bedCode}
        </span>

        {displayPatients?.length > 1 && (
          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full animate-bounce">
            NẰM GHÉP ({displayPatients.length})
          </span>
        )}
      </div>
      <div className="flex-1 space-y-3">
        {isOccupied ? (
          displayPatients.map((p) => (
            <div
              key={p.id}
              onClick={() => onClick({ idBenhAn: p.id, maBenhNhan: p.code, tenBenhNhan: p.name })}
              className="group p-4 bg-white/60 hover:bg-white rounded-[24px] border border-slate-100 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-slate-900 uppercase truncate group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
                    <span className="text-primary font-mono tracking-tighter">{p.code}</span>
                    <span>•</span>
                    <span>{p.tuoi} Tuổi</span>
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full shadow-sm mt-1 ${p.medicationToday?.overdue > 0 ? "bg-red-500 animate-pulse" :
                  p.medicationToday?.done === p.medicationToday?.total && p.medicationToday?.total > 0 ? "bg-green-500" :
                    p.medicationToday?.total > 0 ? "bg-primary" : "bg-slate-200"
                  }`} />
              </div>
              {p.medicationToday?.total > 0 && (
                <div className="pt-2 border-t border-slate-50">
                  <MedicationStatsSmall stats={p.medicationToday} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-4 opacity-20">
            <i className="fa-solid fa-plus-circle text-4xl" />
            <p className="text-[10px] font-black uppercase mt-2">Trống</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BedCard;