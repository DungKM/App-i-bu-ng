
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
/* Fix: Removed non-existent MedGroupStatus */
import { MedVisitStatus } from '../types';

export const MedicationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VISIT' | 'GROUP' | 'ITEM'>('GROUP');
  const [keyword, setKeyword] = useState('');
  const [deptCode, setDeptCode] = useState('NOI1'); // Cố định theo tài khoản

  const { data: stats, isLoading } = useQuery({
    queryKey: ['med-dashboard', deptCode, keyword],
    queryFn: () => api.getMedicationDashboardStats({ deptCode, keyword }),
    refetchInterval: 30000
  });

  const getVisitStatusBadge = (status: MedVisitStatus) => {
      switch (status) {
          case MedVisitStatus.NEW: return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">Chưa kê đơn</span>;
          case MedVisitStatus.PARTIALLY_DISPENSED: return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">Chưa phát hết</span>;
          default: return null;
      }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Giám sát cấp phát</h1>
                <p className="text-slate-500 text-sm">Tình trạng dược: <span className="font-bold text-primary">{deptCode === 'NOI1' ? 'Khoa Nội Tổng Hợp' : deptCode}</span></p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input type="text" placeholder="Tìm BN..." className="pl-10 pr-4 py-2 rounded-lg border w-full sm:w-64" value={keyword} onChange={e => setKeyword(e.target.value)} />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Bệnh nhân</th>
                            <th className="px-4 py-3">Phòng - Giường</th>
                            <th className="px-4 py-3">Ngày kê đơn</th>
                            <th className="px-4 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-primary"></i></td></tr>
                        ) : (stats as any)?.pendingGroups.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-400">Không có dữ liệu chờ cấp phát.</td></tr>
                        ) : (
                            (stats as any)?.pendingGroups.map((g: any) => (
                                <tr key={g.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-900">{g.patientName}</div>
                                        <div className="text-xs text-slate-500">{g.patientCode} • {g.patientGender}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-600">{g.room || '--'} - {g.bed || '--'}</td>
                                    <td className="px-4 py-3">{new Date(g.prescriptionDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-4 py-3 text-right">
                                        <