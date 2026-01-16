
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ShiftType } from '@/types';
import { Link } from 'react-router-dom';

export const ComplianceDashboard: React.FC = () => {
  const [shift, setShift] = useState<ShiftType>(ShiftType.MORNING);

  // Auto-set current shift
  useEffect(() => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) setShift(ShiftType.MORNING);
      else if (hour >= 12 && hour < 14) setShift(ShiftType.NOON);
      else if (hour >= 14 && hour < 18) setShift(ShiftType.AFTERNOON);
      else setShift(ShiftType.NIGHT);
  }, []);

  const { data, isLoading } = useQuery({
      queryKey: ['compliance', shift],
      queryFn: () => api.getComplianceStats(shift),
      refetchInterval: 10000 // Realtime monitor
  });

  const getShiftLabel = (s: ShiftType) => {
      switch(s) {
          case ShiftType.MORNING: return 'Sáng (06:00 - 12:00)';
          case ShiftType.NOON: return 'Trưa (12:00 - 14:00)';
          case ShiftType.AFTERNOON: return 'Chiều (14:00 - 18:00)';
          case ShiftType.NIGHT: return 'Tối/Đêm (18:00 - 06:00)';
      }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-tower-observation text-primary"></i> Dashboard Tuân thủ
                </h1>
                <p className="text-slate-500 text-sm">Giám sát rủi ro và tuân thủ quy trình dùng thuốc</p>
            </div>
            
            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex overflow-x-auto">
                {[ShiftType.MORNING, ShiftType.NOON, ShiftType.AFTERNOON, ShiftType.NIGHT].map(s => (
                    <button
                        key={s}
                        onClick={() => setShift(s)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition whitespace-nowrap ${shift === s ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {getShiftLabel(s)}
                    </button>
                ))}
            </div>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
            <div className="text-center py-20"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 text-red-600"><i className="fa-solid fa-clock text-5xl"></i></div>
                    <div className="text-xs font-bold text-red-600 uppercase mb-1">Quá giờ / Quên</div>
                    <div className="text-3xl font-bold text-slate-800">{data?.missedDoses}</div>
                    <div className="text-xs text-slate-400 mt-1">Liều chưa dùng đúng hạn</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 text-amber-600"><i className="fa-solid fa-box-open text-5xl"></i></div>
                    <div className="text-xs font-bold text-amber-600 uppercase mb-1">Nguy cơ thiếu thuốc</div>
                    <div className="text-3xl font-bold text-slate-800">{data?.stockoutRisks}</div>
                    <div className="text-xs text-slate-400 mt-1">Tồn kho không đủ cấp</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 text-purple-600"><i className="fa-solid fa-rotate-left text-5xl"></i></div>
                    <div className="text-xs font-bold text-purple-600 uppercase mb-1">Chờ hoàn trả</div>
                    <div className="text-3xl font-bold text-slate-800">{data?.pendingReturns}</div>
                    <div className="text-xs text-slate-400 mt-1">Đã xuất nhưng không dùng</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10 text-slate-600"><i className="fa-solid fa-triangle-exclamation text-5xl"></i></div>
                    <div className="text-xs font-bold text-slate-600 uppercase mb-1">Lỗi đồng bộ HIS</div>
                    <div className="text-3xl font-bold text-slate-800">{data?.syncFailures}</div>
                    <Link to="/sync/dashboard" className="text-xs text-primary hover:underline mt-1 block">Xem chi tiết &gt;</Link>
                </div>
            </div>
        )}

        {/* Detailed Issue List */}
        {!isLoading && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    Chi tiết cảnh báo theo Bệnh nhân ({data?.issues.length})
                </div>
                <div className="divide-y divide-slate-100">
                    {data?.issues.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                            <i className="fa-solid fa-shield-check text-4xl text-green-300 mb-3"></i>
                            <p>Tuyệt vời! Không có cảnh báo tuân thủ nào.</p>
                        </div>
                    ) : (
                        data?.issues.map((issue) => (
                            <div key={issue.patientId} className="p-4 hover:bg-slate-50 transition">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                            {issue.patientName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{issue.patientName}</div>
                                            <div className="text-xs text-slate-500">{issue.patientCode} • {issue.room} - {issue.bed}</div>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/medication/${issue.patientId.replace('p', 'mv')}?shift=${shift}`} // Mock Visit ID logic
                                        className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded font-bold text-slate-600 hover:text-primary hover:border-primary transition"
                                    >
                                        Xử lý <i className="fa-solid fa-arrow-right ml-1"></i>
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Missed Items */}
                                    {issue.missedItems.length > 0 && (
                                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                            <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-2">
                                                <i className="fa-solid fa-clock"></i> Quá giờ ({issue.missedItems.length})
                                            </div>
                                            <ul className="space-y-1">
                                                {issue.missedItems.map(item => (
                                                    <li key={item.id} className="text-xs text-slate-700 truncate">
                                                        • {item.drugName} ({item.scheduledTime})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Stockout Risks */}
                                    {issue.stockoutItems.length > 0 && (
                                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                            <div className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-2">
                                                <i className="fa-solid fa-box-open"></i> Thiếu thuốc ({issue.stockoutItems.length})
                                            </div>
                                            <ul className="space-y-1">
                                                {issue.stockoutItems.map(item => (
                                                    <li key={item.id} className="text-xs text-slate-700 truncate">
                                                        • {item.drugName}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Pending Returns */}
                                    {issue.returnItems.length > 0 && (
                                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                            <div className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-2">
                                                <i className="fa-solid fa-rotate-left"></i> Chờ trả ({issue.returnItems.length})
                                            </div>
                                            <ul className="space-y-1">
                                                {issue.returnItems.map(item => (
                                                    <li key={item.id} className="text-xs text-slate-700 truncate">
                                                        • {item.drugName}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
