
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Patient, PatientStatus } from '../types';

// --- Sub-components for Ward Map (SIMPLIFIED TO 3 STATES) ---

const Legend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-4 text-[10px] sm:text-xs font-medium text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded bg-white border-2 border-dashed border-slate-300"></div>
      <span>Giường trống</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded bg-green-500"></div>
      <span>Đã dùng thuốc</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded bg-amber-500"></div>
      <span>Chưa dùng thuốc</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded bg-blue-400"></div>
      <span>Chưa có y lệnh</span>
    </div>
  </div>
);

const MedicationStatusBadge: React.FC<{ stats?: Patient['medicationToday'] }> = ({ stats }) => {
  if (!stats || stats.total === 0) {
    return (
      <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black border border-blue-100 flex items-center gap-1">
        <i className="fa-solid fa-minus-circle"></i> CHƯA CÓ Y LỆNH
      </div>
    );
  }

  if (stats.done === stats.total) {
    return (
      <div className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-[10px] font-black border border-green-200 flex items-center gap-1">
        <i className="fa-solid fa-check-circle"></i> ĐÃ DÙNG ({stats.done}/{stats.total})
      </div>
    );
  }

  return (
    <div className="bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black border border-amber-200 flex items-center gap-1">
      <i className="fa-solid fa-clock"></i> CHƯA DÙNG ({stats.done}/{stats.total})
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
      if (!isOccupied) return 'bg-white border-dashed border-slate-200 opacity-50 cursor-default';
      
      const stats = patient.medicationToday;
      if (!stats || stats.total === 0) return 'bg-blue-50 border-blue-200';
      if (stats.done === stats.total) return 'bg-green-50 border-green-300';
      return 'bg-amber-50 border-amber-300 ring-2 ring-amber-100';
  };

  return (
    <div 
      onClick={isOccupied ? onClick : undefined}
      className={`relative group h-36 sm:h-40 rounded-2xl border-2 transition-all duration-300 p-4 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md
        ${getStatusClasses()}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg w-fit shadow-sm ${isOccupied ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-400'}`}>
            {bedCode}
            </span>
            {patient?.isSpecialCare && (
                <div className="text-red-600 text-[10px] font-black flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation animate-bounce"></i> THEO DÕI ĐB
                </div>
            )}
        </div>
        
        {isOccupied && (
          <div className="flex items-center gap-2">
              <i className={`fa-solid fa-bed text-lg ${patient.medicationToday?.status === 'PENDING' ? 'text-amber-500' : 'text-slate-400'}`}></i>
          </div>
        )}
      </div>

      {isOccupied ? (
        <div className="min-w-0 flex-1 flex flex-col justify-center my-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate uppercase">
            {patient.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
             <span className={`px-1.5 py-0.5 rounded ${patient.gender === 'Nam' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{patient.gender}</span>
             <span>•</span>
             <span className="font-mono">{patient.code}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1">
          <i className="fa-solid fa-plus-circle text-slate-200 text-2xl mb-1"></i>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Trống</span>
        </div>
      )}

      {isOccupied && (
          <div className="pt-2 border-t border-slate-200/50">
               <MedicationStatusBadge stats={patient.medicationToday} />
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

  const stats = useMemo(() => {
    if (!patients) return { total: 0, occupied: 0, pendingMed: 0, noOrder: 0 };
    const pendingMed = patients.filter(p => p.medicationToday && p.medicationToday.total > 0 && p.medicationToday.done < p.medicationToday.total).length;
    const noOrder = patients.filter(p => !p.medicationToday || p.medicationToday.total === 0).length;
    const totalBeds = wardLayout.reduce((acc, r) => acc + r.beds.length, 0);
    return { total: totalBeds, occupied: patients.length, pendingMed, noOrder };
  }, [patients, wardLayout]);

  if (isLoading) return <div className="flex justify-center py-20"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Stats Dashboard */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-3xl">
              <i className="fa-solid fa-hospital-user"></i>
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase">Sơ đồ điều trị</h1>
                <p className="text-slate-500 font-medium text-sm">Khoa Nội Tổng Hợp - Thời gian thực</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Tổng giường</div>
               <div className="text-2xl font-black text-slate-800">{stats.total}</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center">
               <div className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Chưa xong</div>
               <div className="text-2xl font-black text-amber-700">{stats.pendingMed}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex flex-col items-center">
               <div className="text-[10px] font-black text-green-500 uppercase tracking-wider mb-1">Đã xong</div>
               <div className="text-2xl font-black text-green-700">{stats.occupied - stats.pendingMed - stats.noOrder}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
               <div className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">Không y lệnh</div>
               <div className="text-2xl font-black text-blue-700">{stats.noOrder}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tên BN, mã phiếu..." 
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 outline-none font-medium text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={medFilter}
            onChange={(e) => setMedFilter(e.target.value as any)}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-slate-700"
          >
            <option value="ALL">Tất cả thuốc</option>
            <option value="DONE">🟢 Đã dùng</option>
            <option value="PENDING">🟡 Chưa dùng</option>
            <option value="NONE">🔵 Chưa y lệnh</option>
          </select>
        </div>
        
        <Legend />
      </div>

      {/* Ward Map Layout: 2 rooms per row on medium+ screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
        {filteredWard.map((room) => {
          const occupiedInRoom = room.beds.filter(b => b.patient).length;
          if (occupiedInRoom === 0 && searchTerm) return null;

          return (
            <section key={room.room} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                  {room.room.replace(/\D/g, '')}
                </div>
                <div>
                    <h3 className="font-black text-xl text-slate-800 uppercase">Phòng {room.room}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{occupiedInRoom}/{room.beds.length} Bệnh nhân</p>
                </div>
                <div className="h-px flex-1 bg-slate-200 ml-4"></div>
              </div>

              {/* Bed Grid: 2 beds per row */}
              <div className="grid grid-cols-2 gap-4">
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
