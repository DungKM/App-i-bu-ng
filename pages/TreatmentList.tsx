
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
  const [deptCode, setDeptCode] = useState('NOI1');
  const [status, setStatus] = useState<TreatmentStatus | ''>(TreatmentStatus.IN_PROGRESS);

  const { data: treatments, isLoading } = useQuery({
    queryKey: ['treatments', deptCode, status, keyword],
    queryFn: () => api.getTreatments({ deptCode, status: status || undefined, keyword }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-900 uppercase">Danh sách đi buồng</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
             <select value={deptCode} onChange={e => setDeptCode(e.target.value)} className="px-3 py-2 border rounded-lg bg-white text-sm">
                <option value="">Tất cả khoa</option>
                <option value="NOI1">Nội 1</option>
                <option value="NGOAI">Ngoại</option>
            </select>
            <div className="relative md:col-span-2">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Tìm BN, mã, giường..." className="pl-10 pr-4 py-2 w-full rounded-lg border" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {treatments?.map(t => (
          <Link key={t.id} to={`/treatment/${t.id}`} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative overflow-hidden">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex flex-col items-center justify-center font-bold border border-blue-100">
                    <span className="text-[10px] opacity-60">G</span>
                    <span className="text-lg leading-none">{t.bed || '--'}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-primary transition">{t.patientName}</h3>
                    <div className="text-xs text-slate-500 mb-1">{t.patientCode} • {t.patientGender}</div>
                    <p className="text-sm text-slate-600 truncate"><i className="fa-solid fa-user-doctor mr-1.5 text-slate-400"></i>{t.doctorName}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
