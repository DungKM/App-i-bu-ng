import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { TreatmentStatus } from "@/types";
import { RoomGrid } from "@/components/RoomSection";

// type tối thiểu để map sang RoomGrid
type Patient = {
  id: string | number;
  name: string;
  code: string;
  gender: string;
  dob: string;
  medicationToday?: { total: number; done: number; overdue: number };
};

type Bed = { code: string; patient?: Patient | null };
type Room = { room: string; beds: Bed[] };

export const TreatmentList: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const deptCode = "NOI1";
  const [status, setStatus] = useState<TreatmentStatus | "">(TreatmentStatus.IN_PROGRESS);
  const navigate = useNavigate();

  const { data: treatments, isLoading } = useQuery({
    queryKey: ["treatments", deptCode, status, keyword],
    queryFn: () => api.getTreatments({ deptCode, status: status || undefined, keyword }),
  });

  // searchTerm cho RoomGrid: bạn có thể dùng keyword luôn
  const searchTerm = keyword;

  // ✅ Convert treatments -> rooms/beds
  const filteredWard: Room[] = useMemo(() => {
    const list = treatments ?? [];

    // group theo phòng (bạn chỉnh field cho đúng API của bạn)
    // giả sử: t.room (tên phòng) và t.bed (mã giường)
    const byRoom = new Map<string, Room>();

    for (const t of list) {
      const roomName = (t.room ?? "Chưa phân phòng") as string; // <-- chỉnh theo API
      const bedCode = (t.bed ?? "--") as string;

      if (!byRoom.has(roomName)) byRoom.set(roomName, { room: roomName, beds: [] });

      byRoom.get(roomName)!.beds.push({
        code: bedCode,
        patient: {
          id: t.patientId ?? t.id,           // <-- chỉnh theo API
          name: t.patientName,
          code: t.patientCode,
          gender: t.patientGender,
          dob: t.patientDob ?? "2000-01-01", // <-- nếu API không có dob thì set tạm
          medicationToday: t.medicationToday // <-- nếu có thì map, không có thì bỏ
        },
      });
    }

    // sort phòng/giường (tuỳ)
    return Array.from(byRoom.values()).sort((a, b) => a.room.localeCompare(b.room, "vi"));
  }, [treatments]);

  return (
    <div className="space-y-6">
      {/* Header/Search giữ nguyên */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-900 uppercase">Danh sách đi buồng</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="bg-blue-50 text-primary px-4 py-2 rounded-lg font-black text-sm border border-blue-100 flex items-center gap-2 whitespace-nowrap">
            <i className="fa-solid fa-hospital" /> Khoa Sản
          </div>

          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm BN, mã, giường..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ✅ Chỉ render RoomGrid */}
      {isLoading ? (
        <div className="text-center py-20">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary" />
        </div>
      ) : filteredWard.length > 0 ? (
        <RoomGrid
          filteredWard={filteredWard}
          searchTerm={searchTerm}
          onBedClick={(id) => navigate(`/patient/${id}`)}
        />
      ) : (
        <div className="text-center py-20 text-slate-400">
          <i className="fa-solid fa-user-slash text-5xl mb-3 opacity-20" />
          <p className="font-bold">Không tìm thấy bệnh nhân nào.</p>
        </div>
      )}
    </div>
  );
};
