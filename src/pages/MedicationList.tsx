import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { ShiftType, ShiftStatus, MedVisit, MARStatus } from '@/types';

const MiniShiftOverview: React.FC<{ 
  label: string; 
  used: number; 
  pending: number; 
  isActive?: boolean;
}> = ({ label, used, pending, isActive }) => (
  <div className={`flex flex-col items-center flex-1 py-0.5 rounded-lg transition-all ${isActive ? 'bg-primary text-white ring-1 ring-primary/20 shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
    <span className="text-[6px] font-black uppercase mb-0">{label}</span>
    <div className="flex gap-0.5 items-center">
      <span className={`text-[9px] font-black ${isActive ? 'text-white' : (used > 0 ? 'text-primary' : 'text-slate-300')}`}>{used}</span>
      <span className="text-[6px] opacity-10">/</span>
      <span className={`text-[9px] font-black ${isActive ? 'text-white' : (pending > 0 ? 'text-amber-500' : 'text-slate-300')}`}>{pending}</span>
    </div>
  </div>
);

const MedicationBedCard: React.FC<{ 
  bedCode: string; 
  visit?: MedVisit; 
  activeShift: ShiftType;
  isClosed: boolean;
}> = ({ bedCode, visit, activeShift, isClosed }) => {
  const navigate = useNavigate();
  const isOccupied = !!visit;
  
  // Dữ liệu shift lấy trực tiếp từ API (đã được tính toán trong api.ts)
  const shiftStats = visit?.marSummary?.shifts;
  const current = shiftStats ? shiftStats[activeShift] : { used: 0, pending: 0, returned: 0 };
  
  const hasReturns = current.returned > 0;
  const hasPending = current.pending > 0;

  const getStatusClasses = () => {
    if (!isOccupied) return 'bg-white border-dashed border-slate-200 opacity-40 cursor-default';
    if (hasReturns) return 'bg-purple-50 border-purple-300 ring-2 ring-purple-100';
    if (hasPending) return 'bg-amber-50 border-amber-300 ring-1 ring-amber-100 shadow-sm';
    if (current.used > 0) return 'bg-blue-50 border-primary/20';
    return 'bg-white border-slate-200 shadow-sm';
  };

  return (
    <div 
      onClick={() => isOccupied && navigate(`/medication/${visit.id}?shift=${activeShift}`)}
      className={`relative h-44 rounded-[28px] border-2 transition-all duration-300 p-4 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 ${getStatusClasses()} ${isClosed && isOccupied ? 'opacity-90' : ''}`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm ${isOccupied ? 'bg-white text-primary border border-primary/10' : 'bg-slate-50 text-slate-300'}`}>
          {bedCode}
        </span>
        {isOccupied && hasReturns && (
          <span className="bg-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">Cần trả kho</span>
        )}
      </div>

      {isOccupied ? (
        <div className="min-w-0 flex-1 flex flex-col justify-center my-1">
          <h3 className="text-base font-black text-slate-900 leading-tight truncate uppercase tracking-tight">
            {visit.patientName}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
            <span className="text-primary font-mono tracking-tighter">{visit.patientCode}</span>
            <span>•</span>
            <span className="uppercase">{visit.patientGender}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 opacity-5">
          <i className="fa-solid fa-bed text-4xl"></i>
        </div>
      )}

      {isOccupied && shiftStats && (
        <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-0.5 text-center">
            <div>
              <div className="text-[6px] font-black text-slate-400 uppercase">Dùng</div>
              <div className={`text-base font-black ${current.used > 0 ? 'text-primary' : 'text-slate-200'}`}>{current.used}</div>
            </div>
            <div className="border-x border-slate-100">
              <div className="text-[6px] font-black text-slate-400 uppercase">Chờ</div>
              <div className={`text-base font-black ${current.pending > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-200'}`}>{current.pending}</div>
            </div>
            <div>
              <div className="text-[6px] font-black text-slate-400 uppercase">Trả</div>
              <div className={`text-base font-black ${current.returned > 0 ? 'text-purple-600' : 'text-slate-200'}`}>{current.returned}</div>
            </div>
          </div>

          <div className="flex gap-0.5 bg-slate-100/50 p-0.5 rounded-lg">
            <MiniShiftOverview label="S" {...shiftStats[ShiftType.MORNING]} isActive={activeShift === ShiftType.MORNING} />
            <MiniShiftOverview label="T" {...shiftStats[ShiftType.NOON]} isActive={activeShift === ShiftType.NOON} />
            <MiniShiftOverview label="C" {...shiftStats[ShiftType.AFTERNOON]} isActive={activeShift === ShiftType.AFTERNOON} />
            <MiniShiftOverview label="Đ" {...shiftStats[ShiftType.NIGHT]} isActive={activeShift === ShiftType.NIGHT} />
          </div>
        </div>
      )}
    </div>
  );
};

export const MedicationList: React.FC = () => {
  const [activeShift, setActiveShift] = useState<ShiftType>(ShiftType.MORNING);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const deptCode = 'NOI1';
  const [showCloseModal, setShowCloseModal] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: visits, isLoading } = useQuery({ 
      queryKey: ['mar-patients', selectedDate, deptCode, activeShift], 
      queryFn: () => api.getMARPatients({ fromDate: selectedDate, toDate: selectedDate, deptCode }) 
  });
  
  const { data: shiftSummary } = useQuery({
      queryKey: ['shift-summary', activeShift, selectedDate],
      queryFn: () => api.getShiftSummary(activeShift),
  });

  useEffect(() => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) setActiveShift(ShiftType.MORNING);
      else if (hour >= 12 && hour < 14) setActiveShift(ShiftType.NOON);
      else if (hour >= 14 && hour < 18) setActiveShift(ShiftType.AFTERNOON);
      else setActiveShift(ShiftType.NIGHT);
  }, []);

  const wardLayout = useMemo(() => {
    if (!visits) return [];
    const roomsMap: Record<string, { room: string, beds: { code: string, visit?: MedVisit }[] }> = {};
    const ROOMS_CONFIG = ['P401', 'P402', 'P501', 'CC01'];
    
    ROOMS_CONFIG.forEach(r => {
      roomsMap[r] = { room: r, beds: [] };
      const bedCount = r === 'CC01' ? 4 : 6;
      for (let i = 1; i <= bedCount; i++) {
        roomsMap[r].beds.push({ code: `G${i.toString().padStart(2, '0')}` });
      }
    });

    visits.forEach(v => {
      if (roomsMap[v.room]) {
        const bedIndex = roomsMap[v.room].beds.findIndex(b => b.code === v.bed || b.code === `G${v.bed.replace(/\D/g, '').padStart(2, '0')}`);
        if (bedIndex !== -1) roomsMap[v.room].beds[bedIndex].visit = v;
      }
    });
    return Object.values(roomsMap);
  }, [visits]);

  const isClosed = shiftSummary?.status === ShiftStatus.LOCKED;

  return (
    <div className="space-y-6 pb-24 max-w-[1300px] mx-auto">
        {/* Dashboard Header */}
        <div className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-primary text-white rounded-[24px] flex items-center justify-center text-3xl shadow-xl shadow-primary/20 transform -rotate-2">
                    <i className="fa-solid fa-pills"></i>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase leading-none mb-1 tracking-tighter">
                        Thực hiện dùng thuốc
                        {isClosed && <span className="ml-3 bg-red-600 text-white text-[8px] px-2 py-1 rounded-full uppercase font-black align-middle tracking-widest shadow-md animate-pulse"><i className="fa-solid fa-lock mr-1"></i>Đã chốt</span>}
                    </h1>
                    <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 font-bold bg-blue-50 text-primary px-3 py-1 rounded-full"><i className="fa-solid fa-hospital"></i> Khoa Nội Tổng Hợp</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="flex items-center gap-1.5"><i className="fa-solid fa-shield-halved"></i> Giám sát 5 đúng</span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 shadow-inner">
                    <i className="fa-solid fa-calendar-check text-primary text-sm"></i>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="text-xs font-black border-none focus:ring-0 text-slate-800 bg-transparent outline-none cursor-pointer"
                    />
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowCloseModal(true)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap ${isClosed ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-primary text-white hover:bg-sky-600 shadow-primary/20'}`}
                    >
                        {isClosed ? <><i className="fa-solid fa-lock-open"></i> Mở ca trực</> : <><i className="fa-solid fa-check-double"></i> Chốt ca trực</>}
                    </button>
                    <Link to="/medication/ward-stock" className="bg-white border border-slate-200 text-slate-500 px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-sm hover:bg-slate-50 hover:text-primary transition flex items-center gap-2">
                        <i className="fa-solid fa-box-archive"></i> Tủ trực
                    </Link>
                </div>
            </div>
        </div>

        <div className="bg-slate-200/30 p-1 rounded-2xl flex gap-1 shadow-inner max-w-2xl mx-auto">
            {[
                { id: ShiftType.MORNING, label: 'Sáng', range: '06-12h', icon: 'fa-sun' },
                { id: ShiftType.NOON, label: 'Trưa', range: '12-14h', icon: 'fa-cloud-sun' },
                { id: ShiftType.AFTERNOON, label: 'Chiều', range: '14-18h', icon: 'fa-cloud' },
                { id: ShiftType.NIGHT, label: 'Tối/Đêm', range: '18-06h', icon: 'fa-moon' }
            ].map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveShift(s.id)}
                    className={`flex-1 py-1.5 rounded-xl transition-all flex flex-col items-center justify-center group relative overflow-hidden ${activeShift === s.id ? 'bg-white text-primary shadow-sm scale-[1.02]' : 'text-slate-400 hover:bg-white/40'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <i className={`fa-solid ${s.icon} text-[9px] ${activeShift === s.id ? 'text-primary' : 'text-slate-300'}`}></i>
                        <span className="text-[9px] font-black uppercase tracking-wider">{s.label}</span>
                    </div>
                    <span className="text-[7px] font-bold opacity-30 leading-none mt-0.5">{s.range}</span>
                    {activeShift === s.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
                </button>
            ))}
        </div>

        {isLoading ? (
            <div className="flex justify-center py-40"><i className="fa-solid fa-circle-notch fa-spin text-5xl text-primary opacity-20"></i></div>
        ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {wardLayout.map((room) => (
                    <section key={room.room} className="space-y-4">
                        <div className="flex items-center gap-4 px-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-[18px] flex items-center justify-center font-black text-xl shadow-lg border-2 border-white transform rotate-3">
                                {room.room.replace(/\D/g, '')}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Phòng {room.room}</h3>
                            </div>
                            <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {room.beds.map((bed, idx) => (
                                <MedicationBedCard 
                                    key={`${room.room}-${bed.code}-${idx}`}
                                    bedCode={bed.code}
                                    visit={bed.visit}
                                    activeShift={activeShift}
                                    isClosed={isClosed}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        )}
    </div>
  );
};