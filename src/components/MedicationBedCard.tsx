import React from "react";
import { MedVisitLite, ShiftType } from "@/types/dibuong";
import { MiniShiftOverview } from "./MiniShiftOverview";
import { useNavigate } from "react-router-dom";
import { formatFractionValue } from "@/utils/fractions";

export const MedicationBedCard: React.FC<{
    bedCode: string;
    visits?: MedVisitLite[];
    activeShift: ShiftType;
    isClosed: boolean;
    highlightSearch?: boolean;
}> = ({ bedCode, visits = [], activeShift, isClosed, highlightSearch = false }) => {
    const navigate = useNavigate();
    const isOccupied = visits.length > 0;

    const getPatientStatusClasses = (current: { used: number; pending: number; returned: number }) => {
        if (current.returned > 0) return "bg-purple-50 border-purple-200 shadow-sm shadow-purple-100";
        if (current.pending > 0) return "bg-amber-50 border-amber-200 shadow-sm shadow-amber-100";
        if (current.used > 0) return "bg-blue-50 border-blue-200";
        return "bg-white border-slate-100";
    };

    return (
        <div className={`relative min-h-[176px] rounded-[32px] border-2 transition-all duration-300 p-4 flex flex-col gap-3 ${isOccupied
            ? highlightSearch
                ? "bg-white border-red-300 shadow-[0_16px_36px_rgba(239,68,68,0.22)]"
                : "bg-white border-slate-200 shadow-sm"
            : "bg-slate-50 border-dashed border-slate-500"
            }`}>
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm ${isOccupied ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                    Giường {bedCode}
                </span>
                {visits.length > 1 && (
                    <span className="bg-amber-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full animate-bounce uppercase tracking-wider">
                        Nằm ghép ({visits.length})
                    </span>
                )}
            </div>

            <div className="flex-1 space-y-3">
                {isOccupied ? (
                    visits.map((visit) => {
                        const shiftStats = visit.marSummary?.shifts;
                        const current = shiftStats ? shiftStats[activeShift] : { used: 0, pending: 0, returned: 0 };

                        return (
                            <div
                                key={visit.id}
                                onClick={() => {
                                    const qs = new URLSearchParams({
                                        maBenhNhan: visit.patientCode,
                                        tenBenhNhan: visit.patientName,
                                        tuoi: visit.patientAge ?? "",
                                    }).toString();
                                    navigate(`/medication/${visit.id}?${qs}`);
                                }}
                                className={`group p-3 rounded-[24px] border transition-all cursor-pointer hover:shadow-md ${getPatientStatusClasses(current)} ${highlightSearch ? "ring-2 ring-red-200 shadow-[0_10px_24px_rgba(239,68,68,0.16)]" : ""}`}
                            >
                                <div className="mb-2">
                                    <h3 className="text-sm font-black text-slate-900 uppercase truncate group-hover:text-primary transition-colors">
                                        {visit.patientName}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                        <span className="text-primary font-mono">{visit.patientCode}</span>
                                        <span>•</span>
                                        <span className="uppercase">{visit.patientGender ?? "--"}</span>
                                        <span>•</span>
                                        <span className="uppercase">{visit.patientAge ? `${visit.patientAge} Tuổi` : "--"}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center py-2 border-t border-black/5">
                                    <div className="flex-1 flex justify-around">
                                        <div className="text-center">
                                            <div className="text-[6px] font-black text-slate-400">DÙNG</div>
                                            <div className={`text-[11px] font-black ${current.used > 0 ? "text-primary" : "text-slate-500"}`}>
                                                {formatFractionValue(current.used)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[6px] font-black text-slate-400">CHỜ</div>
                                            <div className={`text-[11px] font-black ${current.pending > 0 ? "text-amber-500 animate-pulse" : "text-slate-500"}`}>
                                                {formatFractionValue(current.pending)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[6px] font-black text-slate-400">TRẢ</div>
                                            <div className={`text-[11px] font-black ${current.returned > 0 ? "text-purple-600" : "text-slate-500"}`}>
                                                {formatFractionValue(current.returned)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {shiftStats && (
                                    <div className="flex gap-0.5 mt-1 p-0.5 rounded-lg border border-black/5">
                                        <MiniShiftOverview label="S" {...shiftStats[ShiftType.MORNING]} isActive={activeShift === ShiftType.MORNING} />
                                        <MiniShiftOverview label="T" {...shiftStats[ShiftType.NOON]} isActive={activeShift === ShiftType.NOON} />
                                        <MiniShiftOverview label="C" {...shiftStats[ShiftType.AFTERNOON]} isActive={activeShift === ShiftType.AFTERNOON} />
                                        <MiniShiftOverview label="Đ" {...shiftStats[ShiftType.NIGHT]} isActive={activeShift === ShiftType.NIGHT} />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 opacity-10">
                        <i className="fa-solid fa-bed text-4xl"></i>
                        <p className="text-[10px] font-black uppercase mt-2 text-center">Trống</p>
                    </div>
                )}
            </div>
        </div>
    );
};
