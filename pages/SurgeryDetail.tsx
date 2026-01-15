
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { SurgeryOrderStatus, SurgeryGroupStatus, UserRole } from '../types';
import { SignatureCapture } from '../components/SignatureCapture';
import { useAuth } from '../context/AuthContext';

// Local UI helper for order status
const getOrderBadge = (status: SurgeryOrderStatus) => {
    switch (status) {
        case SurgeryOrderStatus.NEW: return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">Chưa TH</span>;
        case SurgeryOrderStatus.EXECUTING: return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">Đang TH</span>;
        case SurgeryOrderStatus.RESULT: return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">Đã trả KQ</span>;
        case SurgeryOrderStatus.CANCELED: return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">Đã hủy</span>;
    }
};

export const SurgeryDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [showSigFor, setShowSigFor] = useState<string | null>(null);
  const [localObs, setLocalObs] = useState<{[key:string]: string}>({});
  const [showPatientInfo, setShowPatientInfo] = useState(false);

  if (!currentUser) return null;

  const isNurse = currentUser.role === UserRole.NURSE;
  const isDoctor = currentUser.role === UserRole.DOCTOR;

  // Queries
  const { data: group, isLoading } = useQuery({
    queryKey: ['surgery-group', groupId],
    queryFn: () => api.getSurgeryGroupDetail(groupId!),
    enabled: !!groupId
  });

  const { data: patientInfo } = useQuery({
      queryKey: ['surgery-patient', groupId],
      queryFn: () => api.getSurgeryGroupPatient(groupId!),
      enabled: !!groupId && showPatientInfo
  });

  // --- Mutations ---
  const updateTimesMutation = useMutation({
    mutationFn: (data: { orderId: string, start: boolean }) => api.updateSurgeryExecutionTime(data.orderId, data.start),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surgery-group', groupId] })
  });

  const saveObsMutation = useMutation({
    mutationFn: (data: { orderId: string, obs: { conclusion: string, patientSignature?: string } }) => 
        api.saveSurgeryObs({ orderId: data.orderId, patientId: group!.patientId, values: data.obs }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surgery-group', groupId] })
  });

  const releaseResultMutation = useMutation({
    mutationFn: (orderId: string) => api.releaseSurgeryResult(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surgery-group', groupId] })
  });

  const revokeResultMutation = useMutation({
    mutationFn: (orderId: string) => api.revokeSurgeryResult(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surgery-group', groupId] })
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: string) => api.cancelSurgeryOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surgery-group', groupId] })
  });

  if (isLoading) return <div className="text-center py-10">Đang tải...</div>;
  if (!group) return <div className="text-center py-10">Không tìm thấy phiếu.</div>;

  const handleSignatureSave = (base64: string) => {
      if (showSigFor) {
          const conclusion = localObs[showSigFor] || group.orders.find(o => o.id === showSigFor)?.obs?.conclusion || '';
          saveObsMutation.mutate({
              orderId: showSigFor,
              obs: { conclusion, patientSignature: base64 }
          });
          setShowSigFor(null);
      }
  };

  const handleSaveConclusion = (orderId: string) => {
      const conclusion = localObs[orderId];
      if (conclusion !== undefined) {
         // Keep existing signature if any
         const existingSig = (group.orders.find(o => o.id === orderId)?.obs as any)?.patientSignature;
         saveObsMutation.mutate({
             orderId,
             obs: { conclusion, patientSignature: existingSig }
         });
      }
  };

  return (
    <div className="pb-20 relative">
      {/* Signature Capture Modal */}
      {showSigFor && (
        <SignatureCapture 
            title="Xác nhận kết quả DVKT" 
            description="Bệnh nhân ký tên xác nhận đã thực hiện dịch vụ"
            onSave={handleSignatureSave} 
            onCancel={() => setShowSigFor(null)} 
        />
      )}

      {/* Patient Info Modal (Requirement 2.2) */}
      {showPatientInfo && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800"><i className="fa-solid fa-address-card mr-2 text-primary"></i>Thông tin bệnh nhân</h3>
                      <button onClick={() => setShowPatientInfo(false)} className="text-slate-400 hover:text-slate-600">
                          <i className="fa-solid fa-xmark text-xl"></i>
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      {patientInfo ? (
                          <>
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                                    {patientInfo.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{patientInfo.name}</h2>
                                    <p className="text-slate-500">{patientInfo.code}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                <div><span className="text-slate-500 block">Ngày sinh</span> <span className="font-medium">{new Date(patientInfo.dob).toLocaleDateString('vi-VN')}</span></div>
                                <div><span className="text-slate-500 block">Giới tính</span> <span className="font-medium">{patientInfo.gender}</span></div>
                                {/* Fix: Khoa chỉ định refers to indication department, which is in the group object */}
                                <div><span className="text-slate-500 block">Khoa chỉ định</span> <span className="font-medium">{group.indicationDept}</span></div>
                                {/* Fix: Removed the non-existent visitInfo property access */}
                                <div><span className="text-slate-500 block">Ngày chỉ định</span> <span className="font-medium">{new Date(patientInfo.admissionDate).toLocaleDateString('vi-VN')}</span></div>
                                {/* Fix: Access diagnosis directly from patientInfo */}
                                <div className="col-span-2"><span className="text-slate-500 block">Chẩn đoán</span> <span className="font-medium">{patientInfo.diagnosis}</span></div>
                            </div>
                          </>
                      ) : (
                          <div className="text-center py-8"><i className="fa-solid fa-circle-notch fa-spin text-primary"></i></div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-20 z-30">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div className="flex items-center gap-3">
                <button onClick={() => navigate('/surgery')} className="text-slate-400 hover:text-slate-600">
                    <i className="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Chi tiết Phiếu DVKT</h1>
                    <p className="text-sm text-slate-500">{group.indicationDept} • BS. {group.indicationPerson}</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                 <div className="text-right">
                    <div className="font-bold text-slate-900 text-lg">{group.patientName}</div>
                    <div className="text-xs text-slate-500">{group.patientCode}</div>
                 </div>
                 <button 
                    onClick={() => setShowPatientInfo(true)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition"
                    title="Xem thông tin hành chính"
                 >
                     <i className="fa-solid fa-info"></i>
                 </button>
             </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
            <span className="font-bold text-slate-700">Chẩn đoán:</span> {group.diagnosis} {group.icd && `(${group.icd})`}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {group.orders.map(order => {
            const isNew = order.status === SurgeryOrderStatus.NEW;
            const isExecuting = order.status === SurgeryOrderStatus.EXECUTING;
            const isResult = order.status === SurgeryOrderStatus.RESULT;
            const isCanceled = order.status === SurgeryOrderStatus.CANCELED;

            return (
                <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             {getOrderBadge(order.status)}
                             <h3 className="font-bold text-slate-800">{order.serviceName}</h3>
                        </div>
                        <div className="text-xs text-slate-400">ID: {order.id}</div>
                    </div>

                    {/* Content & Actions */}
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Info & Result Input */}
                        <div className="space-y-4">
                            {/* Execution Controls */}
                            {isNew && (
                                <div className="flex gap-2">
                                    {/* Nút Thực hiện: Nurses/Techs ONLY */}
                                    {isNurse && (
                                        <button 
                                            onClick={() => updateTimesMutation.mutate({ orderId: order.id, start: true })}
                                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 transition shadow-sm"
                                        >
                                            <i className="fa-solid fa-play mr-2"></i>Thực hiện
                                        </button>
                                    )}
                                    
                                    {/* Nút Hủy dịch vụ: Doctors ONLY */}
                                    {isDoctor && (
                                        <button 
                                            onClick={() => cancelOrderMutation.mutate(order.id)}
                                            className="bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                                        >
                                            Hủy dịch vụ
                                        </button>
                                    )}
                                </div>
                            )}

                            {isExecuting && (
                                <div className="space-y-3">
                                    {/* Nút Hủy thực hiện khi đang thực hiện */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-amber-600 animate-pulse">
                                            <i className="fa-solid fa-spinner fa-spin mr-1"></i>Đang thực hiện...
                                        </span>
                                        {isNurse && (
                                            <button 
                                                onClick={() => updateTimesMutation.mutate({ orderId: order.id, start: false })}
                                                className="text-red-500 text-xs hover:underline bg-red-50 px-2 py-1 rounded"
                                            >
                                                <i className="fa-solid fa-rotate-left mr-1"></i>Hủy thực hiện
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Kết luận / Kết quả</label>
                                        <textarea 
                                            disabled={!isNurse} // Only executor inputs result
                                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                                            rows={3}
                                            placeholder={isNurse ? "Nhập kết quả..." : "Đang chờ kết quả..."}
                                            value={localObs[order.id] !== undefined ? localObs[order.id] : (order.obs?.conclusion || '')}
                                            onChange={e => setLocalObs({...localObs, [order.id]: e.target.value})}
                                            onBlur={() => isNurse && handleSaveConclusion(order.id)}
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {isResult && (
                                <div className="space-y-2">
                                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                                        <span className="text-xs font-bold text-green-700 uppercase block mb-1"><i className="fa-solid fa-check mr-1"></i>Kết luận</span>
                                        <p className="text-slate-900 text-sm whitespace-pre-wrap">{order.obs?.conclusion}</p>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {/* Fix: executionEndTime is added dynamically to order in releaseSurgeryResult mutation */}
                                        Hoàn thành: {new Date((order as any).executionEndTime!).toLocaleString('vi-VN')}
                                    </div>
                                    {/* Nút Hủy trả kết quả (Sửa lại): Nurse only */}
                                    {isNurse && (
                                        <button 
                                            onClick={() => revokeResultMutation.mutate(order.id)}
                                            className="text-amber-600 text-xs hover:underline mt-2 flex items-center"
                                        >
                                            <i className="fa-solid fa-rotate-left mr-1"></i>Hủy trả kết quả (Sửa lại)
                                        </button>
                                    )}
                                </div>
                            )}

                            {isCanceled && (
                                <div className="p-3 bg-slate-100 rounded text-slate-500 text-sm italic">
                                    Dịch vụ đã bị hủy.
                                </div>
                            )}
                        </div>

                        {/* Right: Signature & Finalize */}
                        <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-6">
                             {/* Signature Section */}
                             {(isExecuting || isResult) && (
                                 <div className="w-full mb-4">
                                     <label className="text-xs font-bold text-slate-700 uppercase mb-2 block text-center">Xác nhận của bệnh nhân</label>
                                     {/* Fix: patientSignature is added dynamically to obs via mutations */}
                                     {(order.obs as any)?.patientSignature ? (
                                         <div className="relative group cursor-pointer" onClick={() => isExecuting && isNurse && setShowSigFor(order.id)}>
                                             {/* Fix: access patientSignature via cast to any */}
                                             <img src={(order.obs as any).patientSignature} alt="Signature" className="h-24 mx-auto border border-slate-200 rounded bg-white shadow-sm" />
                                             {isExecuting && isNurse && <div className="absolute inset-0 bg-black/10 hidden group-hover:flex items-center justify-center text-white text-xs rounded">Ký lại</div>}
                                         </div>
                                     ) : (
                                         isExecuting && (
                                            isNurse ? (
                                                <button 
                                                    onClick={() => setShowSigFor(order.id)}
                                                    className="w-full border-2 border-dashed border-slate-300 rounded-lg h-24 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition bg-slate-50"
                                                >
                                                    <i className="fa-solid fa-pen-nib text-xl mb-1"></i>
                                                    <span className="text-xs">Chạm để ký</span>
                                                </button>
                                            ) : (
                                                <div className="text-center text-slate-400 text-xs italic">Chưa có chữ ký</div>
                                            )
                                         )
                                     )}
                                 </div>
                             )}

                             {/* Release Button - Nút Trả kết quả */}
                             {isExecuting && isNurse && (
                                 <button 
                                    onClick={() => releaseResultMutation.mutate(order.id)}
                                    className="w-full bg-success text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-600 transition flex items-center justify-center gap-2"
                                 >
                                     <i className="fa-solid fa-check-to-slot"></i> Trả Kết Quả
                                 </button>
                             )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
