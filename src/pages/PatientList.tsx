
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Patient, PatientStatus } from '@/types';

// --- Sub-components for Ward Map ---

const Legend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-6 py-4 rounded-[32px] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
      <span>Chờ dùng</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
      <span>Hoàn thành</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
      <span>Quá giờ</span>
    </div>
  </div>
);

const MedicationStatsSmall: React.FC<{ stats?: Patient['medicationToday'] }> = ({ stats }) => {
  if (!stats || stats.total === 0) {
    return (
      <div className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 border border-slate-100 uppercase">
        <i className="fa-solid fa-minus-circle"></i> Chưa y lệnh
      </div>
    );
  }

  const isDone = stats.done === stats.total;
  const isOverdue = stats.overdue > 0;

  if (isDone) {
    return (
      <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 border border-green-100 uppercase">
        <i className="fa-solid fa-check-circle"></i> Hoàn thành ({stats.done}/{stats.total})
      </div>
    );
  }

  return (
    <div className={`${isOverdue ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-primary/5 text-primary border-primary/10'} px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 border uppercase`}>
      <i className={`fa-solid ${isOverdue ? 'fa-triangle-exclamation' : 'fa-clock'}`}></i>
      {isOverdue ? 'Quá giờ' : 'Đang chờ'} ({stats.done}/{stats.total})
    </div>
  );
};

interface BedCardProps {
  bedCode: string;
  patient?: Patient;
  onClick: () => void;
}

const BedCard: React.FC<BedCardProps> = ({ bedCode, patient, onClick }) => {
  const isOccupied = !!patient;
  
  const getStatusClasses = () => {
      if (!isOccupied) return 'bg-white border-dashed border-slate-200 opacity-40 cursor-default';
      
      const stats = patient.medicationToday;
      if (!stats || stats.total === 0) return 'bg-white border-slate-200 shadow-sm';
      if (stats.overdue > 0) return 'bg-red-50 border-red-300 ring-4 ring-red-100';
      if (stats.done === stats.total) return 'bg-green-50 border-green-300';
      return 'bg-blue-50 border-primary/30 ring-2 ring-primary/5';
  };

  return (
    <div 
      onClick={isOccupied ? onClick : undefined}
      className={`relative h-40 rounded-[28px] border-2 transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1
        ${getStatusClasses()}
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm ${isOccupied ? 'bg-white text-primary border border-primary/10' : 'bg-slate-50 text-slate-300'}`}>
          {bedCode}
        </span>
        
        {isOccupied && (
          <div className="flex items-center gap-2 opacity-10">
              <i className="fa-solid fa-bed text-2xl"></i>
          </div>
        )}
      </div>

      {isOccupied ? (
        <div className="min-w-0 flex-1 flex flex-col justify-center my-1">
          <h3 className="text-base font-black text-slate-900 leading-tight truncate uppercase tracking-tight">
            {patient.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
             <span className="text-primary font-mono tracking-tighter">{patient.code}</span>
             <span>•</span>
             <span className="uppercase">{patient.gender}</span>
             <span>•</span>
             <span>{new Date().getFullYear() - parseInt(patient.dob.split('-')[0])} tuổi</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 opacity-5">
          <i className="fa-solid fa-plus-circle text-4xl"></i>
        </div>
      )}

      {isOccupied && (
          <div className="pt-2 border-t border-slate-100">
               <MedicationStatsSmall stats={patient.medicationToday} />
          </div>
      )}
    </div>
  );
};

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [medFilter, setMedFilter] = useState<'ALL' | 'DONE' | 'PENDING' | 'NONE'>('ALL');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: api.getPatients,
  });

  const wardLayout = useMemo(() => {
    if (!patients) return [];

    const roomsMap: Record<string, { room: string, beds: { code: string, patient?: Patient }[] }> = {};
    const ROOMS_CONFIG = ['P401', 'P402', 'P501', 'CC01'];
    
    ROOMS_CONFIG.forEach(r => {
      roomsMap[r] = { room: r, beds: [] };
      const bedCount = r === 'CC01' ? 4 : 8;
      for (let i = 1; i <= bedCount; i++) {
        roomsMap[r].beds.push({ code: `G${i.toString().padStart(2, '0')}` });
      }
    });

    patients.forEach(p => {
      if (roomsMap[p.room]) {
        const bedIndex = roomsMap[p.room].beds.findIndex(b => b.code === p.bed || b.code === `G${p.bed.replace(/\D/g, '').padStart(2, '0')}`);
        if (bedIndex !== -1) {
          roomsMap[p.room].beds[bedIndex].patient = p;
        } else {
          roomsMap[p.room].beds.push({ code: p.bed, patient: p });
        }
      }
    });

    return Object.values(roomsMap);
  }, [patients]);

  const filteredWard = useMemo(() => {
    return wardLayout.map(room => ({
      ...room,
      beds: room.beds.map(bed => {
        if (!bed.patient) return bed;
        
        const matchesSearch = bed.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             bed.patient.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const stats = bed.patient.medicationToday;
        let matchesMed = true;
        if (medFilter === 'DONE') matchesMed = !!stats && stats.total > 0 && stats.done === stats.total;
        if (medFilter === 'PENDING') matchesMed = !!stats && stats.total > 0 && stats.done < stats.total;
        if (medFilter === 'NONE') matchesMed = !stats || stats.total === 0;
        
        return (matchesSearch && matchesMed) ? bed : { ...bed, patient: undefined };
      })
    }));
  }, [wardLayout, searchTerm, medFilter]);

  const statsSummary = useMemo(() => {
    if (!patients) return { total: 0, occupied: 0, pendingMed: 0, noOrder: 0 };
    const pendingMed = patients.filter(p => p.medicationToday && p.medicationToday.total > 0 && p.medicationToday.done < p.medicationToday.total).length;
    const noOrder = patients.filter(p => !p.medicationToday || p.medicationToday.total === 0).length;
    const totalBeds = wardLayout.reduce((acc, r) => acc + r.beds.length, 0);
    return { total: totalBeds, occupied: patients.length, pendingMed, noOrder };
  }, [patients, wardLayout]);

  if (isLoading) return <div className="flex justify-center py-40"><i className="fa-solid fa-circle-notch fa-spin text-6xl text-primary opacity-20"></i></div>;

  return (
    <div className="space-y-8 pb-32 max-w-[1400px] mx-auto">
      {/* Dashboard Header */}
      <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary text-white rounded-[32px] flex items-center justify-center text-4xl shadow-xl shadow-primary/20 transform -rotate-3 transition hover:rotate-0">
              <i className="fa-regular fa-hospital"></i>
            </div>
            <div>
                <h1 className="text-4xl font-black text-slate-900 uppercase leading-none mb-2 tracking-tighter">Sơ đồ điều trị</h1>
                <div className="flex items-center gap-4 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-2 bg-blue-50 text-primary px-3 py-1 rounded-full"><i className="fa-solid fa-circle text-[6px] animate-pulse"></i>Khoa sản</span>
                    <span className="flex items-center gap-2"><i className="fa-solid fa-calendar"></i> {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 flex flex-col items-center shadow-inner">
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng giường</div>
               <div className="text-2xl font-black text-slate-800">28</div>
            </div>
            <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-100 flex flex-col items-center shadow-inner">
               <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Số bệnh nhân</div>
               <div className="text-2xl font-black text-amber-700">7</div>
            </div>
            <div className="bg-green-50 p-5 rounded-[24px] border border-green-100 flex flex-col items-center shadow-inner">
               <div className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-1">Số phòng</div>
               <div className="text-2xl font-black text-green-700">4</div>
            </div>
            <div className="bg-blue-50 p-5 rounded-[24px] border border-blue-100 flex flex-col items-center shadow-inner">
               <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Giường TYC</div>
               <div className="text-2xl font-black text-blue-700">8</div>
            </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              placeholder="Tìm tên bệnh nhân, mã số..." 
              className="w-full pl-12 pr-6 py-4 rounded-3xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-primary/30 outline-none font-bold text-sm transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={medFilter}
            onChange={(e) => setMedFilter(e.target.value as any)}
            className="px-6 py-4 rounded-3xl border-2 border-slate-50 bg-slate-50 text-sm font-black outline-none focus:bg-white focus:border-primary/30 transition-all text-slate-700 shadow-inner"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DONE">🟢 Hoàn thành</option>
            <option value="PENDING">🟡 Chờ dùng</option>
            <option value="NONE">⚪ Chưa có y lệnh</option>
          </select>
        </div>
        
        <Legend />
      </div>

      {/* Ward Map Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
        {filteredWard.map((room) => {
          const occupiedInRoom = room.beds.filter(b => b.patient).length;
          if (occupiedInRoom === 0 && searchTerm) return null;

          return (
            <section key={room.room} className="space-y-6">
              <div className="flex items-center gap-4 px-4">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-[20px] flex items-center justify-center font-black text-xl shadow-lg border-4 border-white transform rotate-3">
                  {room.room.replace(/\D/g, '')}
                </div>
                <div className="flex-1">
                    <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tighter">Phòng {room.room}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <span>{occupiedInRoom}/{room.beds.length} Bệnh nhân</span>
                    </div>
                </div>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              {/* Bed Grid: 2 beds per row */}
              <div className="grid grid-cols-2 gap-6">
                {room.beds.map((bed, idx) => (
                  <BedCard 
                    key={`${room.room}-${bed.code}-${idx}`}
                    bedCode={bed.code}
                    patient={bed.patient}
                    onClick={() => navigate(`/patient/${bed.patient?.id}`)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
