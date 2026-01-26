
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MARStatus, ShiftType, MARItem, MedicationDeliveryProof, MedVisit, TreatmentStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { MedicationDeliveryModal } from '@/components/MedicationDeliveryModal';
import { MedicationReturnModal } from "@/components/MedicationReturnModal";

export const MedicationDetail: React.FC = () => {
    const [returnItem, setReturnItem] = useState<MARItem | null>(null);
    const { visitId } = useParams<{ visitId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    // States
    const initialShift = (searchParams.get('shift') as ShiftType) || ShiftType.MORNING;
    const [activeShift, setActiveShift] = useState<ShiftType>(initialShift);
    const [selectedVisitId, setSelectedVisitId] = useState<string>(visitId!);

    const [isVerified, setIsVerified] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [confirmDeliveryItem, setConfirmDeliveryItem] = useState<MARItem | null>(null);

    // Queries
    // 1. Lấy thông tin cơ bản của visit hiện tại để lấy patientId
    const { data: currentVisitData } = useQuery({
        queryKey: ['mar-visit-basic', visitId],
        queryFn: () => api.getMARPatients({ patientId: undefined }).then(list => list.find(v => v.id === visitId))
    });

    // 2. Lấy danh sách các Lần khám có kê thuốc của bệnh nhân này
    const { data: medicationEncounters, isLoading: encountersLoading } = useQuery({
        queryKey: ['mar-encounters-with-meds', currentVisitData?.patientId],
        queryFn: () => api.getMARPatients({
            patientId: currentVisitData?.patientId,
            hasMedication: true
        }),
        enabled: !!currentVisitData?.patientId
    });

    // 3. Lấy dữ liệu MAR cho Lần khám đang chọn (Requirement: Tối ưu chỉ fetch MAR khi click)
    const { data: marItems, isLoading: itemsLoading } = useQuery({
        queryKey: ['mar-detail', selectedVisitId],
        queryFn: () => api.getMARByVisit(selectedVisitId),
        enabled: !!selectedVisitId
    });

    // 4. Nhóm thuốc theo Y Lệnh (trong ca hiện tại)
    const groupedByOrder = useMemo(() => {
        if (!marItems) return {};
        const filtered = marItems.filter(m => m.shift === activeShift);

        const groups: Record<string, { info: any, items: MARItem[] }> = {};
        filtered.forEach(item => {
            if (!groups[item.orderId]) {
                groups[item.orderId] = {
                    info: {
                        orderId: item.orderId,
                        orderDate: item.orderDate,
                        doctorName: item.doctorName,
                        isStopped: item.isOrderStopped,
                        stoppedDate: item.stoppedDate
                    },
                    items: []
                };
            }
            groups[item.orderId].items.push(item);
        });
        return groups;
    }, [marItems, activeShift]);

    const currentVisit = medicationEncounters?.find(v => v.id === selectedVisitId) || currentVisitData;

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, status: MARStatus, reason?: string, note?: string, proof?: MedicationDeliveryProof }) => api.updateMARStatus(data.id, data.status, { reasonCode: data.reason, note: data.note, proof: data.proof }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mar-detail', selectedVisitId] });
            setConfirmDeliveryItem(null);
        }
    });

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) { setCameraError("Lỗi camera"); }
    };

    useEffect(() => {
        if (isScanning) startCamera();
        else if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
    }, [isScanning]);

    const getStatusStyle = (status: MARStatus) => {
        switch (status) {
            case MARStatus.ADMINISTERED: return "bg-green-50 text-green-600 border-green-200";
            case MARStatus.RETURN_PENDING: return "bg-purple-50 text-purple-600 border-purple-200 animate-pulse";
            case MARStatus.MISSED: return "bg-red-50 text-red-600 border-red-200";
            default: return "bg-slate-50 text-slate-500 border-slate-200";
        }
    };
    const getAvailableQty = (item: MARItem) => {
        return (item as any).availableQty ?? (item as any).remainingQty ?? (item as any).quantity ?? 0;
    };

    if (!currentUser) return null;

    return (
        <div className="pb-24 max-w-[1000px] mx-auto space-y-6">
            {confirmDeliveryItem && (
                <MedicationDeliveryModal
                    patientName={currentVisit?.patientName || ''}
                    onConfirm={(p) => updateMutation.mutate({ id: confirmDeliveryItem.id, status: MARStatus.ADMINISTERED, proof: p })}
                    onCancel={() => setConfirmDeliveryItem(null)}
                    isLoading={updateMutation.isPending}
                />
            )}

            {/* Patient Header */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-16 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/medication')} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-primary transition flex items-center justify-center border border-slate-100">
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{currentVisit?.patientName}</h1>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-0.5">
                            <span className="text-primary font-mono">{currentVisit?.patientCode}</span>
                            <span>•</span>
                            <span className="uppercase">{currentVisit?.patientGender}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-black transition">
                        <i className="fa-solid fa-qrcode text-base"></i> Xác nhận dùng hết thuốc
                    </button>
                    {isVerified ? (
                        <div className="flex-1 md:flex-none bg-green-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                            <i className="fa-solid fa-shield-check text-base"></i> Đã xác thực BN
                        </div>
                    ) : (
                        <button onClick={() => setIsScanning(true)} className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-slate-200 hover:bg-black transition">
                            <i className="fa-solid fa-qrcode text-base"></i> Quét mã xác nhận
                        </button>
                    )}
                </div>
            </div>

            {/* Requirement: Lần khám có kê thuốc Timeline */}
            <div className="space-y-3">
                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lần khám phát sinh kê thuốc</h3>
                <div className="flex gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide">
                    {encountersLoading ? (
                        <div className="flex gap-3 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 w-52 bg-slate-100 rounded-3xl"></div>)}
                        </div>
                    ) : medicationEncounters?.map(v => {
                        const isSelected = selectedVisitId === v.id;
                        const isActiveEncounter = v.treatmentStatus === TreatmentStatus.IN_PROGRESS;

                        return (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVisitId(v.id)}
                                className={`flex-shrink-0 px-5 py-4 rounded-[28px] border-2 transition-all text-left min-w-[220px] relative ${isSelected
                                    ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-primary/30 shadow-sm'
                                    }`}
                            >
                                {/* Mã lần khám (encounterCode) */}
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className={`font-mono text-[11px] font-black uppercase ${isSelected ? 'text-white' : 'text-primary'}`}>
                                        {v.encounterCode}
                                    </div>
                                    {isActiveEncounter && (
                                        <div className="bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Hiện tại</div>
                                    )}
                                </div>

                                {/* Ngày kê (lastMedicationOrderAt) */}
                                <div className={`text-[10px] font-bold mb-1 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                    <i className="fa-solid fa-calendar-day mr-1"></i>
                                    {v.lastMedicationOrderAt ? v.lastMedicationOrderAt : 'N/A'}
                                </div>

                                {/* Bác sĩ kê (doctorName) */}
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-white/20' : 'bg-slate-50'}`}>
                                        <i className="fa-solid fa-user-doctor"></i>
                                    </div>
                                    <span className={`text-[10px] font-black truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                        {v.doctorName}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Shift Filter (Giữ nguyên) */}
            <div className="bg-slate-100/50 p-1 rounded-2xl flex gap-1 shadow-inner mx-4">
                {[
                    { id: ShiftType.MORNING, label: 'Sáng', icon: 'fa-sun' },
                    { id: ShiftType.NOON, label: 'Trưa', icon: 'fa-cloud-sun' },
                    { id: ShiftType.AFTERNOON, label: 'Chiều', icon: 'fa-cloud' },
                    { id: ShiftType.NIGHT, label: 'Tối', icon: 'fa-moon' }
                ].map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveShift(s.id)}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex flex-col items-center gap-1 ${activeShift === s.id ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:bg-white/40'}`}
                    >
                        <i className={`fa-solid ${s.icon}`}></i> {s.label}
                    </button>
                ))}
            </div>

            {/* Orders & MAR Content */}
            <div className="px-4 space-y-8">
                {itemsLoading ? (
                    <div className="py-20 text-center"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary opacity-20"></i></div>
                ) : Object.keys(groupedByOrder).length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mx-auto mb-4">
                            <i className="fa-solid fa-pills"></i>
                        </div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-widest">Không có thuốc trong ca trực này</h3>
                        <p className="text-[10px] text-slate-300 mt-2 italic">Kết quả cho lần khám: {currentVisit?.encounterCode}</p>
                    </div>
                ) : (
                    Object.values(groupedByOrder).map((group: any) => (
                        <div key={group.info.orderId} className={`space-y-4 ${group.info.isStopped ? 'opacity-60 grayscale' : ''}`}>
                            {/* Medications Table */}
                            <div className="space-y-3">
                                {group.items.map((item: MARItem) => {
                                    const isDone = item.status === MARStatus.ADMINISTERED;
                                    return (
                                        <div key={item.id} className={`bg-white rounded-[28px] border-2 transition-all p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg ${isDone ? 'border-green-100 bg-green-50/20' : 'border-slate-100'}`}>
                                            <div className="flex md:flex-col items-center md:items-start justify-between md:w-28 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                                                <div className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{item.scheduledTime}</div>
                                                <div className={`mt-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border flex items-center gap-1.5 ${getStatusStyle(item.status)}`}>
                                                    {item.status === MARStatus.SCHEDULED ? 'Chờ dùng' : 'Đã dùng'}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <h4 className="text-lg font-black text-slate-900 leading-tight">{item.drugName}</h4>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-slate-500 uppercase tracking-tight">
                                                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-vial text-[10px] text-primary"></i> {item.dosage}</span>
                                                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-syringe text-[10px] text-primary"></i> {item.route}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-3">
                                                {!isDone && !item.isOrderStopped && currentVisit?.treatmentStatus === TreatmentStatus.IN_PROGRESS && (
                                                    <>
                                                        <button
                                                            onClick={() => (isVerified ? setReturnItem(item) : setIsScanning(true))}
                                                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isVerified
                                                                    ? "bg-purple-600 text-white shadow-purple-200 hover:bg-purple-700"
                                                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                                                }`}
                                                        >
                                                            {!isVerified && <i className="fa-solid fa-lock" />}
                                                            Trả thuốc
                                                        </button>
                                                        <button
                                                            onClick={() => isVerified ? setConfirmDeliveryItem(item) : setIsScanning(true)}
                                                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isVerified ? 'bg-primary text-white shadow-primary/20 hover:bg-sky-600' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                                                        >
                                                            {!isVerified && <i className="fa-solid fa-lock"></i>}
                                                            Xác nhận dùng
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {returnItem && (
                <MedicationReturnModal
                    item={returnItem}
                    patientName={currentVisit?.patientName || ""}
                    maxQty={getAvailableQty(returnItem)}
                    isLoading={updateMutation.isPending}
                    onCancel={() => setReturnItem(null)}
                    onConfirm={({ qty, reason, note }) => {
                        // Gợi ý: dùng status RETURN_PENDING và nhét qty vào note/reasonCode
                        updateMutation.mutate({
                            id: returnItem.id,
                            status: MARStatus.RETURN_PENDING,
                            reason,
                            note: `Trả ${qty}. ${note || ""}`.trim(),
                        });
                    }}
                />
            )}
            {/* Scan UI Simulation */}
            {isScanning && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md">
                    <div className="relative w-full max-w-sm aspect-square bg-slate-800 rounded-[48px] overflow-hidden border-8 border-slate-700 shadow-2xl mb-8 group">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-primary animate-pulse shadow-[0_0_20px_#0ea5e9]"></div>
                    </div>
                    <button
                        onClick={() => { setIsScanning(false); setIsVerified(true); }}
                        className="bg-white text-slate-900 py-4 rounded-[24px] font-black text-sm uppercase shadow-xl flex items-center justify-center gap-3 px-8"
                    >
                        Mô phỏng quét: {currentVisit?.patientCode}
                    </button>
                </div>
            )}
        </div>
    );
};
