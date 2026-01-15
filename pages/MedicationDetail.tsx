
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { MARStatus, ShiftType, ReasonCode, MARItem, MedicationDeliveryProof } from '../types';
import { useAuth } from '../context/AuthContext';
import { MedicationDeliveryModal } from '../components/MedicationDeliveryModal';

export const MedicationDetail: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const initialShift = (searchParams.get('shift') as ShiftType) || ShiftType.MORNING;
  const [activeShift, setActiveShift] = useState<ShiftType>(initialShift);
  
  const [isVerified, setIsVerified] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [confirmDeliveryItem, setConfirmDeliveryItem] = useState<MARItem | null>(null);
  const [undoItem, setUndoItem] = useState<MARItem | null>(null);

  const [exceptionModal, setExceptionModal] = useState<{
      item: any;
      action: MARStatus.HELD | MARStatus.REFUSED | MARStatus.MISSED | MARStatus.RETURN_PENDING;
  } | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [exceptionNote, setExceptionNote] = useState('');
  const [isDispensed, setIsDispensed] = useState(false);

  const { data: marItems } = useQuery({ queryKey: ['mar-detail', visitId], queryFn: () => api.getMARByVisit(visitId!) });
  const { data: stock } = useQuery({ queryKey: ['ward-stock'], queryFn: api.getWardStock });
  const { data: reasons } = useQuery({ queryKey: ['mar-reasons'], queryFn: api.getMARReasonCodes });
  
  const patientInfo = marItems && marItems.length > 0 ? { 
      name: 'Phạm Văn Minh',
      code: 'BN23001', 
      gender: 'Nam'
  } : { name: '...', code: '...', gender: '...' };

  const currentShiftItems = marItems?.filter((m: any) => m.shift === activeShift) || [];

  const updateMutation = useMutation({
      mutationFn: (data: {id: string, status: MARStatus, reason?: string, note?: string, proof?: MedicationDeliveryProof}) => api.updateMARStatus(data.id, data.status, { reasonCode: data.reason, note: data.note, proof: data.proof }),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['mar-detail', visitId] });
          setExceptionModal(null);
          setConfirmDeliveryItem(null);
          setUndoItem(null);
          setSelectedReason('');
          setExceptionNote('');
          setIsDispensed(false);
      }
  });

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Trình duyệt không hỗ trợ camera.");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    } catch (err) {
        setCameraError("Không thể truy cập camera.");
    }
  };

  useEffect(() => {
      if (isScanning) startCamera();
      else {
          if (videoRef.current?.srcObject) {
              (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
          }
      }
  }, [isScanning]);

  const handleSimulateScan = () => {
      setIsScanning(false);
      setIsVerified(true);
  };

  const checkStock = (drugName: string) => {
      if (!stock) return { available: false, qty: 0 };
      const item = stock.find(s => drugName.includes(s.drugName) || s.drugName.includes(drugName.split(' ')[0]));
      return { available: item ? item.quantity > 0 : false, qty: item ? item.quantity : 0 };
  };

  const handleAdminister = (item: any) => {
      if (item.requiresScan && !isVerified) {
          alert('BẮT BUỘC: Quét vòng tay người bệnh để xác thực trước khi dùng thuốc!');
          return;
      }
      const stockStatus = checkStock(item.drugName);
      if (!stockStatus.available) {
          alert(`KHÔNG THỂ DÙNG: Thuốc "${item.drugName}" đã hết trong tủ trực!`);
          return;
      }
      setConfirmDeliveryItem(item);
  };

  const handleDeliveryConfirm = (proof: MedicationDeliveryProof) => {
      if (!confirmDeliveryItem) return;
      updateMutation.mutate({
          id: confirmDeliveryItem.id,
          status: MARStatus.ADMINISTERED,
          proof: proof
      });
  };

  const handleUndoConfirm = () => {
      if (!undoItem) return;
      updateMutation.mutate({ 
          id: undoItem.id, 
          status: MARStatus.SCHEDULED,
          note: 'Hoàn tác sai sót' 
      });
  };

  const handleExceptionSubmit = () => {
      if (!exceptionModal || !selectedReason) return;
      const finalStatus = isDispensed ? MARStatus.RETURN_PENDING : exceptionModal.action;
      const notePrefix = isDispensed ? `[${exceptionModal.action === MARStatus.REFUSED ? 'Từ chối' : 'Tạm hoãn'}] ` : '';
      updateMutation.mutate({
          id: exceptionModal.item.id,
          status: finalStatus,
          reason: selectedReason,
          note: notePrefix + exceptionNote
      });
  };

  const getStatusBadge = (status: MARStatus) => {
      switch(status) {
          case MARStatus.SCHEDULED: return <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-200">Chờ dùng</span>;
          case MARStatus.PREPARED: return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold border border-blue-100">Đã soạn</span>;
          case MARStatus.ADMINISTERED: return <span className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs font-bold border border-green-200"><i className="fa-solid fa-check mr-1"></i>Đã dùng</span>;
          case MARStatus.HELD: return <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded text-xs font-bold border border-amber-200">Tạm hoãn</span>;
          case MARStatus.REFUSED: return <span className="text-red-700 bg-red-100 px-2 py-1 rounded text-xs font-bold border border-red-200">BN Từ chối</span>;
          case MARStatus.RETURN_PENDING: return <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs font-bold border border-purple-100 animate-pulse">Chờ trả kho</span>;
          case MARStatus.RETURNED: return <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs font-bold line-through">Đã hoàn trả</span>;
          case MARStatus.MISSED: return <span className="text-red-600 bg-white border border-red-200 px-2 py-1 rounded text-xs font-bold">Quên/Quá giờ</span>;
          default: return <span>{status}</span>;
      }
  };

  if (!currentUser) return null;

  return (
    <div className="pb-20">
        {confirmDeliveryItem && (
            <MedicationDeliveryModal
                patientName={patientInfo.name}
                onConfirm={handleDeliveryConfirm}
                onCancel={() => setConfirmDeliveryItem(null)}
                isLoading={updateMutation.isPending}
            />
        )}

        {undoItem && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b bg-red-50 flex justify-between items-center">
                        <h3 className="font-bold text-red-700 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation"></i> Xác nhận hoàn tác
                        </h3>
                        <button onClick={() => setUndoItem(null)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg"></i></button>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-700 font-medium mb-2">Hoàn tác trạng thái "Đã dùng"?</p>
                        <p className="text-xs text-slate-500 bg-slate-100 p-3 rounded">Thuốc sẽ được chuyển về <b>Chờ dùng</b> và cộng lại tồn kho.</p>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => setUndoItem(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium">Đóng</button>
                        <button onClick={handleUndoConfirm} disabled={updateMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 shadow-sm">
                            {updateMutation.isPending ? 'Xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isScanning && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-sm aspect-square bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-600 mb-6">
                    {!cameraError ? (
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white">{cameraError}</div>
                    )}
                    <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={handleSimulateScan} className="bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-100 shadow-lg flex items-center justify-center gap-2">
                        <i className="fa-solid fa-qrcode"></i> Xác nhận mã: {patientInfo.code} (Demo)
                    </button>
                    <button onClick={() => setIsScanning(false)} className="text-white/70 py-2 hover:text-white">Đóng</button>
                </div>
            </div>
        )}

        {exceptionModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                    <div className={`p-4 border-b flex justify-between items-center ${exceptionModal.action === MARStatus.REFUSED ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                        <h3 className={`font-bold text-lg ${exceptionModal.action === MARStatus.REFUSED ? 'text-red-700' : 'text-amber-700'}`}>Xử lý ngoại lệ</h3>
                        <button onClick={() => { setExceptionModal(null); setSelectedReason(''); setIsDispensed(false); }} className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center text-slate-500"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="font-bold text-slate-800">{exceptionModal.item.drugName}</div>
                            <div className="text-xs text-slate-500">{exceptionModal.item.dosage}</div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Lý do (Bắt buộc)</label>
                            <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                                value={selectedReason}
                                onChange={e => setSelectedReason(e.target.value)}
                            >
                                <option value="">-- Chọn lý do --</option>
                                <option value="PATIENT_REFUSED">BN từ chối</option>
                                <option value="CLINICAL">Chống chỉ định tạm thời</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                        <button onClick={() => { setExceptionModal(null); setSelectedReason(''); }} className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700">Hủy</button>
                        <button onClick={handleExceptionSubmit} disabled={!selectedReason || updateMutation.isPending} className="px-4 py-2 rounded-lg font-bold text-white bg-primary">Xác nhận</button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-16 z-30">
             <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                     <button onClick={() => navigate('/medication')} className="text-slate-400 hover:text-slate-600">
                         <i className="fa-solid fa-arrow-left text-xl"></i>
                     </button>
                     <div>
                         <h1 className="text-lg font-bold text-slate-900">{patientInfo.name}</h1>
                         <div className="flex gap-2 text-xs text-slate-500">
                            <span className="font-bold text-slate-700">{patientInfo.gender}</span>
                            <span>•</span>
                            <span>{patientInfo.code}</span>
                         </div>
                     </div>
                 </div>
                 
                 {isVerified ? (
                     <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-2 animate-fade-in">
                         <i className="fa-solid fa-shield-check text-lg"></i>
                         <span>Đã xác thực</span>
                     </div>
                 ) : (
                     <button onClick={() => setIsScanning(true)} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
                         <i className="fa-solid fa-qrcode text-lg"></i>
                         <span>Quét để mở khóa</span>
                     </button>
                 )}
             </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
            {[ShiftType.MORNING, ShiftType.NOON, ShiftType.AFTERNOON, ShiftType.NIGHT].map(shift => (
                <button
                    key={shift}
                    onClick={() => setActiveShift(shift)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeShift === shift ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {shift === 'MORNING' ? 'Sáng' : shift === 'NOON' ? 'Trưa' : shift === 'AFTERNOON' ? 'Chiều' : 'Tối'}
                </button>
            ))}
        </div>

        <div className="space-y-4">
            {currentShiftItems.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center text-slate-400">
                    <i className="fa-solid fa-calendar-day text-4xl mb-3 text-slate-200"></i>
                    <p>Không có lịch trong ca này.</p>
                </div>
            ) : (
                currentShiftItems.map((item: any) => {
                    const isCompleted = item.status === MARStatus.ADMINISTERED;
                    return (
                        <div key={item.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isCompleted ? 'border-green-200 bg-green-50/20' : 'border-slate-200'}`}>
                            <div className="p-4 flex flex-col sm:flex-row gap-4">
                                <div className="flex sm:flex-col items-center sm:items-start justify-between sm:w-24 border-b sm:border-b-0 sm:border-r border-slate-100 pb-2 sm:pb-0 sm:pr-4">
                                    <div className="text-xl font-bold text-slate-700 font-mono">{item.scheduledTime}</div>
                                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 truncate pr-2">{item.drugName}</h3>
                                    <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>{item.dosage}</span>
                                        <span>{item.route}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-3 flex justify-end gap-2 border-t border-slate-100">
                                {!isCompleted && (
                                    <button onClick={() => handleAdminister(item)} disabled={!isVerified} className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 ${!isVerified ? 'bg-slate-300 text-slate-500' : 'bg-primary text-white hover:bg-sky-600'}`}>
                                        {!isVerified && <i className="fa-solid fa-lock"></i>}
                                        Dùng thuốc
                                    </button>
                                )}
                                {isCompleted && (
                                    <div className="w-full flex justify-between items-center text-xs">
                                        <div className="text-green-700 font-medium">Đã dùng bởi {item.administeredBy}</div>
                                        <button onClick={() => setUndoItem(item)} className="text-slate-400 hover:text-red-500 underline">Hoàn tác</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
