
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShiftType, ShiftStatus } from '../types';

export const MedicationList: React.FC = () => {
  const [activeShift, setActiveShift] = useState<ShiftType>(ShiftType.MORNING);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  
  // Date Filters
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptCode, setDeptCode] = useState(''); // Department Filter
  
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useQuery({ 
      queryKey: ['mar-patients', fromDate, toDate, deptCode], 
      queryFn: () => api.getMARPatients({ fromDate, toDate, deptCode }) 
  });
  
  // Fetch Status for Active Shift
  const { data: shiftSummary, isLoading: summaryLoading } = useQuery({
      queryKey: ['shift-summary', activeShift, fromDate], // Include date in key if backend supported shift history
      queryFn: () => api.getShiftSummary(activeShift),
      refetchInterval: 5000 // Realtime-ish updates
  });

  // Determine current shift based on time
  useEffect(() => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) setActiveShift(ShiftType.MORNING);
      else if (hour >= 12 && hour < 14) setActiveShift(ShiftType.NOON);
      else if (hour >= 14 && hour < 18) setActiveShift(ShiftType.AFTERNOON);
      else setActiveShift(ShiftType.NIGHT);
  }, []);

  // Mutations
  const closeShiftMutation = useMutation({
      mutationFn: () => api.closeShift(activeShift),
      onSuccess: (res) => {
          if (res.success) {
              queryClient.invalidateQueries({ queryKey: ['shift-summary'] });
              setShowCloseModal(false);
              alert('Đã chốt ca thành công. Dữ liệu đã được khóa và đồng bộ về HIS.');
          } else {
              // Fix: Cast to any or provide fallback for potentially missing message property in mock/API response
              alert((res as any).message || 'Có lỗi xảy ra khi chốt ca.');
          }
      }
  });

  const reopenShiftMutation = useMutation({
      mutationFn: () => api.reopenShift(activeShift, reopenReason),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['shift-summary'] });
          setShowCloseModal(false);
          setReopenReason('');
          alert('Đã mở lại ca.');
      }
  });

  const getShiftLabel = (s: ShiftType) => {
      switch(s) {
          case ShiftType.MORNING: return 'Sáng (06:00 - 12:00)';
          case ShiftType.NOON: return 'Trưa (12:00 - 14:00)';
          case ShiftType.AFTERNOON: return 'Chiều (14:00 - 18:00)';
          case ShiftType.NIGHT: return 'Tối/Đêm (18:00 - 06:00)';
      }
  };

  const getPatientShiftStats = (p: any) => {
      // Logic same as before
      return p.marSummary; 
  };

  const isClosed = shiftSummary?.status === ShiftStatus.LOCKED;

  return (
    <div className="space-y-6 relative">
        {/* CLOSE SHIFT MODAL */}
        {showCloseModal && shiftSummary && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                    <div className={`p-4 border-b flex justify-between items-center ${isClosed ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                        <h3 className={`font-bold text-lg ${isClosed ? 'text-amber-800' : 'text-blue-800'}`}>
                            {isClosed ? 'Quản lý Ca trực (Đã chốt)' : 'Xác nhận Chốt ca'}
                        </h3>
                        <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
                                <div className="text-xs text-slate-500 uppercase font-bold">Tổng liều</div>
                                <div className="text-2xl font-bold text-slate-800">{shiftSummary.stats.total}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                                <div className="text-xs text-green-600 uppercase font-bold">Đã xong</div>
                                <div className="text-2xl font-bold text-green-700">{shiftSummary.stats.completed}</div>
                            </div>
                        </div>

                        {!isClosed ? (
                            // CHECKLIST FOR CLOSING
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-slate-700 uppercase">Danh sách kiểm tra (Checklist)</h4>
                                <div className="space-y-2">
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${shiftSummary.stats.pending === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center gap-3">
                                            {shiftSummary.stats.pending === 0 
                                                ? <i className="fa-solid fa-circle-check text-green-500 text-lg"></i> 
                                                : <i className="fa-solid fa-circle-xmark text-red-500 text-lg"></i>}
                                            <span className="text-sm font-medium text-slate-700">Xử lý hết liều (Scheduled/Prepared)</span>
                                        </div>
                                        {shiftSummary.stats.pending > 0 && <span className="font-bold text-red-600">{shiftSummary.stats.pending}</span>}
                                    </div>

                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${shiftSummary.stats.returnPending === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center gap-3">
                                            {shiftSummary.stats.returnPending === 0 
                                                ? <i className="fa-solid fa-circle-check text-green-500 text-lg"></i> 
                                                : <i className="fa-solid fa-circle-xmark text-red-500 text-lg"></i>}
                                            <span className="text-sm font-medium text-slate-700">Hoàn trả kho (Return Pending)</span>
                                        </div>
                                        {shiftSummary.stats.returnPending > 0 && <span className="font-bold text-red-600">{shiftSummary.stats.returnPending}</span>}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 italic mt-2 text-center">
                                    Lưu ý: Sau khi chốt, dữ liệu sẽ bị khóa và gửi về HIS.
                                </p>
                            </div>
                        ) : (
                            // REOPEN FORM
                            <div className="space-y-3 animate-fade-in">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                                    <i className="fa-solid fa-lock text-amber-600 mt-1"></i>
                                    <div className="text-sm text-amber-800">
                                        Ca trực đang bị KHÓA. Để chỉnh sửa dữ liệu, bạn cần mở lại ca và ghi rõ lý do (Audit Log).
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Lý do mở lại <span className="text-red-500">*</span></label>
                                    <textarea 
                                        className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                                        rows={2}
                                        placeholder="VD: Nhập bổ sung y lệnh cấp cứu..."
                                        value={reopenReason}
                                        onChange={e => setReopenReason(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 border border-slate-300 bg-white rounded-lg font-medium text-slate-700 hover:bg-slate-100">Đóng</button>
                        
                        {!isClosed ? (
                            <button 
                                onClick={() => closeShiftMutation.mutate()}
                                disabled={shiftSummary.stats.pending > 0 || shiftSummary.stats.returnPending > 0 || closeShiftMutation.isPending}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-bold shadow hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {closeShiftMutation.isPending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-lock"></i>}
                                Xác nhận chốt ca
                            </button>
                        ) : (
                            <button 
                                onClick={() => reopenShiftMutation.mutate()}
                                disabled={!reopenReason || reopenShiftMutation.isPending}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold shadow hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {reopenShiftMutation.isPending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-unlock"></i>}
                                Mở lại ca
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Top Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Thực hiện dùng thuốc (MAR)
                    {isClosed && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded border border-red-200 uppercase font-bold"><i className="fa-solid fa-lock mr-1"></i>Đã chốt</span>}
                </h1>
                <p className="text-slate-500 text-sm">Quản lý cấp phát thuốc tại giường</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                {/* DEPT FILTER */}
                <select
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary/20 shadow-sm outline-none text-slate-700 font-medium"
                >
                    <option value="">Tất cả khoa</option>
                    <option value="NOI1">Nội 1</option>
                    <option value="NGOAI">Ngoại</option>
                    <option value="CAPCUU">Cấp cứu</option>
                    <option value="TRUYENNHIEM">Truyền nhiễm</option>
                </select>

                {/* DATE FILTER */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-300 shadow-sm">
                    <input 
                        type="date" 
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent px-2 outline-none"
                    />
                    <span className="text-slate-400 text-xs font-bold px-1"><i className="fa-solid fa-arrow-right"></i></span>
                    <input 
                        type="date" 
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent px-2 outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowCloseModal(true)}
                        className={`px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition whitespace-nowrap ${isClosed ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200' : 'bg-primary text-white hover:bg-sky-600'}`}
                    >
                        {isClosed ? <><i className="fa-solid fa-lock"></i> Đã chốt ca</> : <><i className="fa-solid fa-check-double"></i> Chốt ca trực</>}
                    </button>
                    <Link to="/medication/ward-stock" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 hover:text-primary transition flex items-center gap-2 whitespace-nowrap">
                        <i className="fa-solid fa-boxes-stacked"></i> Tủ trực
                    </Link>
                </div>
            </div>
        </div>

        {/* Shift Filter */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex overflow-x-auto scrollbar-hide">
            {[ShiftType.MORNING, ShiftType.NOON, ShiftType.AFTERNOON, ShiftType.NIGHT].map(shift => (
                <button
                    key={shift}
                    onClick={() => setActiveShift(shift)}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition whitespace-nowrap flex flex-col items-center gap-1 ${activeShift === shift ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <span>{getShiftLabel(shift)}</span>
                    {activeShift === shift && <div className="w-1.5 h-1.5 bg-white rounded-full mt-1"></div>}
                </button>
            ))}
        </div>

        {isClosed && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in">
                <i className="fa-solid fa-lock text-xl"></i>
                <div>
                    <div className="font-bold">Ca trực này đã bị khóa</div>
                    <div className="text-xs">Dữ liệu đã được đồng bộ. Bạn chỉ có thể xem, không thể chỉnh sửa trạng thái dùng thuốc.</div>
                </div>
            </div>
        )}

        {isLoading ? (
            <div className="text-center py-10"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>
        ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isClosed ? 'opacity-75 grayscale-[0.3] pointer-events-none' : ''}`}>
                {patients?.map((p: any) => {
                    const stats = getPatientShiftStats(p);
                    // For demo purpose, randomize "pending for this shift" based on total pending to simulate reality
                    const pendingForShift = activeShift === ShiftType.MORNING ? stats.pending : Math.round(stats.pending / 2);

                    return (
                        <Link key={p.id} to={`/medication/${p.id}?shift=${activeShift}`} className={`block group ${isClosed ? 'pointer-events-auto' : ''}`}>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-4 relative overflow-hidden h-full flex flex-col">
                                <div className="flex gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
                                        {p.patientName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition">{p.patientName}</h3>
                                        <div className="text-xs text-slate-500">{p.patientCode} • {p.patientGender}</div>
                                        <div className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">{p.deptCode}</div>
                                    </div>
                                </div>
                                
                                {/* MAR Summary Stats for this Patient */}
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-auto">
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Chờ dùng</div>
                                        <div className={`font-bold text-lg ${pendingForShift > 0 ? 'text-primary' : 'text-slate-300'}`}>
                                            {pendingForShift}
                                        </div>
                                    </div>
                                    <div className="text-center border-l border-slate-100">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Quên/Trễ</div>
                                        <div className={`font-bold text-lg ${stats.missed > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                                            {stats.missed}
                                        </div>
                                    </div>
                                    <div className="text-center border-l border-slate-100">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Chờ trả</div>
                                        <div className={`font-bold text-lg ${stats.returnPending > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                            {stats.returnPending}
                                        </div>
                                    </div>
                                </div>

                                {pendingForShift > 0 && (
                                    <div className="mt-3 bg-blue-50 text-blue-700 text-xs py-2 px-3 rounded-lg text-center font-bold border border-blue-100 flex items-center justify-center gap-2">
                                        <i className="fa-regular fa-clock"></i> Có thuốc cần dùng
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
                {patients?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                        <i className="fa-solid fa-calendar-xmark text-4xl mb-3 text-slate-200"></i>
                        <p>Không có lịch dùng thuốc cho khoa này trong khoảng thời gian này.</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
