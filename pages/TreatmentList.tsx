
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { TreatmentStatus } from '../types';

const statusColors = {
  [TreatmentStatus.WAITING]: 'bg-gray-100 text-gray-700 border-gray-200',
  [TreatmentStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 border-blue-200',
  [TreatmentStatus.BATCH_PASSED]: 'bg-amber-100 text-amber-700 border-amber-200',
  [TreatmentStatus.PENDING]: 'bg-purple-100 text-purple-700 border-purple-200',
  [TreatmentStatus.FINISHED]: 'bg-green-100 text-green-700 border-green-200',
  [TreatmentStatus.DISCHARGED]: 'bg-slate-200 text-slate-700 border-slate-300',
};

export const TreatmentList: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const deptCode = 'NOI1'; // Cố định theo tài khoản
  const [status, setStatus] = useState<TreatmentStatus | ''>(TreatmentStatus.IN_PROGRESS);

  const { data: treatments, isLoading } = useQuery({
    queryKey: ['treatments', deptCode, status, keyword],
    queryFn: () => api.getTreatments({ deptCode, status: status || undefined, keyword }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-900 uppercase">Danh sách đi buồng</h1>
        <div className="flex flex-col md:flex-row gap-3">
            <div className="bg-blue-50 text-primary px-4 py-2 rounded-lg font-black text-sm border border-blue-100 flex items-center gap-2 whitespace-nowrap">
                <i className="fa-solid fa-hospital"></i> Khoa Nội Tổng Hợp
            </div>
            <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Tìm BN, mã, giường..." className="pl-10 pr-4 py-2 w-full rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
             <div className="col-span-full text-center py-20"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i></div>
        ) : treatments?.map(t => (
          <Link key={t.id} to={`/treatment/${t.id}`} className="block group">
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex flex-col items-center justify-center font-black border border-blue-100 shadow-inner">
                    <span className="text-[10px] opacity-40 uppercase">Giường</span>
                    <span className="text-xl leading-none">{t.bed || '--'}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 truncate group-hover:text-primary transition uppercase tracking-tight">{t.patientName}</h3>
                    <div className="text-xs font-bold text-slate-400 mb-2">{t.patientCode} • {t.patientGender}</div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <i className="fa-solid fa-user-doctor text-slate-400"></i>
                        <span className="text-sm font-bold text-slate-600 truncate">{t.doctorName}</span>
                    </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {treatments?.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-20 text-slate-400">
                <i className="fa-solid fa-user-slash text-5xl mb-3 opacity-20"></i>
                <p className="font-bold">Không tìm thấy bệnh nhân nào.</p>
            </div>
        )}
      </div>
    </div>
  );
};
