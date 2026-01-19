
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { MedVisitStatus } from '@/types';

export const MedicationDashboard: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [deptCode] = useState('NOI1');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['med-dashboard', deptCode, keyword],
    queryFn: () => api.getMedicationDashboardStats({ deptCode, keyword }),
    refetchInterval: 30000
  });

  const getStatusBadge = (status: MedVisitStatus) => {
      switch (status) {
          case MedVisitStatus.NEW: return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 uppercase">Mới kê đơn</span>;
          case MedVisitStatus.PARTIALLY_DISPENSED: return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 uppercase">Đang phát dở dang</span>;
          case MedVisitStatus.FULLY_DISPENSED: return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 uppercase">Đã phát hết</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Giám sát cấp phát thuốc</h1>
                <p className="text-slate-500 text-sm">Khoa: <span className="font-bold text-primary">Sản</span></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input 
                        type="text" 
                        placeholder="Tìm tên BN, mã số..." 
                        className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64 font-medium" 
                        value={keyword} 
                        onChange={e => setKeyword(e.target.value)} 
                    />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Thông tin bệnh nhân</th>
                            <th className="px-6 py-4 text-center">Vị trí</th>
                            <th className="px-6 py-4">Ngày kê đơn</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-center">Tiến độ</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-20"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary opacity-20"></i></td></tr>
                        ) : (stats as any)?.pendingGroups.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Không có dữ liệu cấp phát.</td></tr>
                        ) : (
                            (stats as any)?.pendingGroups.map((g: any) => {
                                const progress = g.itemsCount > 0 ? Math.round((g.dispensedCount / g.itemsCount) * 100) : 0;
                                return (
                                    <tr key={g.id} className="hover:bg-slate-50 transition group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-900 group-hover:text-primary transition">{g.patientName}</div>
                                            <div className="text-[10px] font-bold text-slate-400">{g.patientCode} • {g.patientGender}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-600 text-[11px] border border-slate-200">
                                                {g.room} - {g.bed}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {new Date(g.prescriptionDate).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(g.status)}
                                        </td>
                                        <td className="px-6 py-4 min-w-[150px]">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                                    <span>{g.dispensedCount}/{g.itemsCount} khoản mục</span>
                                                    <span className={progress === 100 ? 'text-green-600' : 'text-primary'}>{progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link 
                                                to={`/medication/${g.id.replace('g', 'mv')}`} 
                                                className="bg-white border-2 border-slate-100 hover:border-primary hover:text-primary transition px-4 py-2 rounded-xl text-xs font-black uppercase shadow-sm flex items-center gap-2 justify-center w-fit ml-auto"
                                            >
                                                Xem MAR <i className="fa-solid fa-arrow-right"></i>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Legend / Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl">
                    <i className="fa-solid fa-file-medical"></i>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn thuốc mới</div>
                    <div className="text-2xl font-black text-slate-900">
                        {(stats as any)?.pendingGroups.filter((g: any) => g.status === MedVisitStatus.NEW).length || 0}
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang thực hiện</div>
                    <div className="text-2xl font-black text-slate-900">
                        {(stats as any)?.pendingGroups.filter((g: any) => g.status === MedVisitStatus.PARTIALLY_DISPENSED).length || 0}
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl">
                    <i className="fa-solid fa-check-double"></i>
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoàn tất hôm nay</div>
                    <div className="text-2xl font-black text-slate-900">
                        {(stats as any)?.pendingGroups.filter((g: any) => g.status === MedVisitStatus.FULLY_DISPENSED).length || 0}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
