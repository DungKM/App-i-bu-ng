
import React from 'react';
import { Patient, PatientStatus } from '@/types';
import { Link } from 'react-router-dom';

const statusColors = {
  [PatientStatus.STABLE]: 'bg-green-100 text-green-700 border-green-200',
  [PatientStatus.CRITICAL]: 'bg-red-100 text-red-700 border-red-200',
  [PatientStatus.DISCHARGING]: 'bg-amber-100 text-amber-700 border-amber-200',
};

const statusLabels = {
  [PatientStatus.STABLE]: 'Ổn định',
  [PatientStatus.CRITICAL]: 'Nặng',
  [PatientStatus.DISCHARGING]: 'Chờ xuất',
};

export const PatientCard: React.FC<{ patient: Patient }> = ({ patient }) => {
  return (
    <Link to={`/patient/${patient.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition p-4 relative overflow-hidden h-full">
        {/* Status Badge */}
        <div className={`absolute top-0 right-0 px-2 sm:px-3 py-1 rounded-bl-xl text-[10px] sm:text-xs font-bold border-b border-l z-10 ${statusColors[patient.status]}`}>
          {statusLabels[patient.status]}
        </div>

        <div className="flex gap-3 sm:gap-4">
          <div className="flex-shrink-0">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                {patient.name.charAt(0)}
             </div>
          </div>
          <div className="flex-1 min-w-0 pr-16 sm:pr-20">
             <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-full">{patient.name}</h3>
                <div className="flex gap-1">
                    <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${patient.gender === 'Nam' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                    {patient.gender}
                    </span>
                </div>
             </div>
             <p className="text-sm text-slate-500 truncate mb-2">
                <i className="fa-solid fa-hospital-user mr-1.5 w-4 text-center"></i>
                {patient.code}
             </p>
             <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 flex-wrap">
                <div className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                   <i className="fa-solid fa-door-open mr-1.5 text-slate-400"></i>
                   <span className="font-semibold">{patient.room}</span>
                </div>
                <div className="flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                   <i className="fa-solid fa-bed mr-1.5 text-slate-400"></i>
                   <span className="font-semibold">{patient.bed}</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-sm text-slate-600 line-clamp-1">
            <span className="font-medium text-slate-900">Chẩn đoán:</span> {patient.diagnosis}
          </p>
        </div>
      </div>
    </Link>
  );
};
