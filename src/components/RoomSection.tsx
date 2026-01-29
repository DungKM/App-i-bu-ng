import React from "react";
import BedCard from "./BedCard";
import type { Room, RoomGridProps, BedClickPayload } from "@/types/dibuong";

export const RoomGrid: React.FC<RoomGridProps> = ({
  filteredWard,
  searchTerm,
  onBedClick,
  className,
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 ${className ?? ""}`}>
      {filteredWard.map((room) => (
        <RoomSection
          key={room.room}
          room={room}
          searchTerm={searchTerm}
          onBedClick={onBedClick}
        />
      ))}
    </div>
  );
};

type RoomSectionProps = {
  room: Room;
  searchTerm?: string;
  onBedClick: (payload: BedClickPayload) => void;
};

const RoomSection: React.FC<RoomSectionProps> = ({ room, searchTerm, onBedClick }) => {
  const occupiedInRoom = room.beds.filter((b) => b.patient).length;
  if (occupiedInRoom === 0 && searchTerm) return null;

  const roomLabel = room.room.startsWith("Phòng")
    ? room.room.replace(/^Phòng\s*/i, "").trim()
    : room.room;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 px-4">
        <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center font-black text-xl shadow-lg border-4 border-white transform rotate-3">
          {room.room.replace(/\D/g, "")}
        </div>

        <div className="flex-1">
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tighter">
            Phòng {roomLabel}
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <span>
              {occupiedInRoom}/{room.beds.length} Bệnh nhân
            </span>
          </div>
        </div>

        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {room.beds.map((bed, idx) => (
          <BedCard
            key={`${room.room}-${bed.code}-${idx}`}
            bedCode={bed.code}
            patient={bed.patient}
            onClick={() => {
              // Guard giường trống
              console.log(bed.patient);
              if (!bed.patient?.id) return;

              onBedClick({
                idBenhAn: bed.patient.id,
                maBenhNhan: bed.patient.code,
                tenBenhNhan: bed.patient.name,
              });
            }}
          />
        ))}
      </div>
    </section>
  );
};
