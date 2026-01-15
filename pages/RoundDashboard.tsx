
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const RoundDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Strictly enforce view based on User Role
  const viewMode = user?.role === UserRole.DOCTOR ? 'DOCTOR' : 'NURSE';

  const { data, isLoading } = useQuery({
    queryKey: ['rounds-dashboard'],
    queryFn: api.getRoundDashboardStats,
    refetchInterval: 30000 // Refresh every 30s
  });

  /* Fix: Cast data to any to access properties */
  const shiftInfo = (data as any)?.shift;
  const summary = (data as any)?.summary || { total: 0, nurseDone: 0, doctorDone: 0 };
  const patients = (data as any)?.patients || [];
  const deptStats = (data as any)?.deptStats || [];

  const roundedCount = viewMode === 'NURSE' ? summary.nurseDone : summary.doctorDone;
  const unroundedCount = summary.total - roundedCount;
  const completionRate = summary.total > 0 ? Math.round((roundedCount / summary.total) * 100) : 0;

  const config = {
      DOCTOR: {
          title: 'Tiến độ Khám & Y lệnh',
          todoLabel: 'Chưa khám/Y lệnh',
          doneLabel: 'Đã hoàn thành',
          column1: 'Khám bệnh',
          column2: 'Ra Y lệnh',
          color: 'blue',
          icon: 'fa-user-doctor'
      },
      NURSE: {
          title: 'Tiến độ Chăm sóc & Sinh hiệu',
          todoLabel: 'Chưa đo/CS',
          doneLabel: 'Đã hoàn thành',
          column1: 'Sinh hiệu',
          column2: 'Chăm sóc',
          color: 'green',
          icon: 'fa-user-nurse'
      }
  };

  const currentConfig = config[viewMode];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {currentConfig.title}
                </h1>
                <p className="text-slate-500 text-sm">
                    {shiftInfo ? (
                        <>Ca trực: <span className="font-bold text-slate-700">{shiftInfo.name}</span> ({new Date(shiftInfo.start).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} - {new Date(shiftInfo.end).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})})</>
                    ) : 'Đang tải thông tin ca trực...'}
                </p>
            </div>
            
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.role === UserRole.DOCTOR ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    <i className={`fa-solid ${user?.role === UserRole.DOCTOR ? 'fa-user-doctor' : 'fa-user-nurse'}`}></i>
                </div>
                <div>
                    <div className="text-xs text-slate-400">Góc nhìn</div>
                    <div className="font-bold text-slate-800">{user?.role === UserRole.DOCTOR ? 'Bác sĩ' : 'Điều dưỡng'}</div>
                </div>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Tổng bệnh nhân</div>
                <div className="text-3xl font-bold text-slate-900">{summary.total}</div>
            </div>
            <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 p-2 opacity-10 text-${currentConfig.color}-600`}>
                    <i className={`fa-solid ${currentConfig.icon} text-6xl`}></i>
                </div>
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">{currentConfig.doneLabel}</div>
                <div className={`text-3xl font-bold text-${currentConfig.color}-600`}>{roundedCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">{currentConfig.todoLabel}</div>
                <div className="text-3xl font-bold text-red-600">{unroundedCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Tỷ lệ hoàn thành</div>
                <div className="flex items-end gap-2">
                    <div className={`text-3xl font-bold ${completionRate >= 80 ? 'text-green-600' : (completionRate >= 50 ? 'text-amber-500' : 'text-red-500')}`}>{completionRate}%</div>
                    <div className="h-2 w-full bg-slate-100 rounded-full mb-2 overflow-hidden flex-1 max-w-[100px]">
                        <div className={`h-full ${completionRate >= 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{width: `${completionRate}%`}}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content */}
        {isLoading ? (
            <div className="flex justify-center py-12"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Dept Summary */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <i className="fa-solid fa-chart-pie text-slate-400"></i> Tổng hợp theo Khoa
                    </h3>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Khoa</th>
                                    <th className="px-4 py-3 text-center">BN</th>
                                    <th className="px-4 py-3 text-center">Tiến độ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {deptStats.map((dept: any) => {
                                    const percent = viewMode === 'NURSE' ? dept.nursePercent : dept.doctorPercent;
                                    const done = viewMode === 'NURSE' ? dept.nurseDone : dept.doctorDone;
                                    return (
                                        <tr key={dept.deptCode} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-bold text-slate-800">{dept.deptCode}</td>
                                            <td className="px-4 py-3 text-center font-medium">{dept.total}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>{done}/{dept.total}</span>
                                                        <span className="font-bold">{percent}%</span>
                                                    </div>
                                                    <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${percent >= 80 ? 'bg-green-500' : (percent >= 50 ? 'bg-amber-500' : 'bg-red-500')}`} 
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Detailed Patient List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-slate-400"></i>
                        Chi tiết công việc ({unroundedCount} chưa xong)
                    </h3>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Bệnh nhân</th>
                                        <th className="px-4 py-3">Vị trí</th>
                                        {/* Dynamic Columns based on Role */}
                                        <th className="px-4 py-3 text-center w-32">{currentConfig.column1}</th>
                                        <th className="px-4 py-3 text-center w-32">{currentConfig.column2}</th>
                                        
                                        <th className="px-4 py-3 text-center w-32">Kết quả</th>
                                        <th className="px-4 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {patients.map((p: any) => {
                                        const isDone = viewMode === 'NURSE' ? p.nurseStatus.isDone : p.doctorStatus.isDone;
                                        
                                        // Config for checklist items
                                        const check1 = viewMode === 'NURSE' ? p.nurseStatus.hasVitals : p.doctorStatus.hasExam;
                                        const check2 = viewMode === 'NURSE' ? p.nurseStatus.hasCare : p.doctorStatus.hasOrder;

                                        return (
                                            <tr key={p.patientId} className={`hover:bg-slate-50 transition ${!isDone ? 'bg-red-50/30' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-900">{p.patientName}</div>
                                                    <div className="text-xs text-slate-500">{p.patientCode}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium whitespace-nowrap text-xs">{p.room} - {p.bed}</span>
                                                </td>
                                                
                                                <td className="px-4 py-3 text-center">
                                                    {check1 
                                                        ? <i className="fa-solid fa-circle-check text-green-500 text-lg"></i> 
                                                        : <i className="fa-regular fa-circle text-slate-300 text-lg"></i>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {check2 
                                                        ? <i className="fa-solid fa-circle-check text-green-500 text-lg"></i> 
                                                        : <i className="fa-regular fa-circle text-slate-300 text-lg"></i>}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    {isDone ? (
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200 uppercase">Hoàn thành</span>
                                                    ) : (
                                                        <span className="bg-white text-red-600 px-2 py-1 rounded-full text-[10px] font-bold border border-red-200 shadow-sm uppercase animate-pulse">Chưa xong</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link 
                                                        to={`/patient/${p.patientId}`}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold inline-flex items-center gap-1 shadow-sm transition whitespace-nowrap ${isDone ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary text-white hover:bg-sky-600'}`}
                                                    >
                                                        {isDone ? 'Xem lại' : 'Thực hiện'} <i className="fa-solid fa-arrow-right"></i>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {patients.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-8 text-slate-400">Không có dữ liệu bệnh nhân.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
