
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { RxChangeType, RxInboxItem } from '@/types';

export const RxInbox: React.FC = () => {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [acks, setAcks] = useState<{ [key: string]: boolean }>({}); // Acknowledged change IDs
    const queryClient = useQueryClient();

    // Queries
    const { data: inboxItems, isLoading } = useQuery({ queryKey: ['rx-inbox'], queryFn: api.getRxInbox });

    // Mutation
    const applyMutation = useMutation({
        mutationFn: (patientId: string) => api.applyRxUpdate(patientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rx-inbox'] });
            setSelectedPatientId(null);
            setAcks({});
            alert('Đã cập nhật y lệnh thành công! Lịch dùng thuốc (MAR) đã được tạo lại.');
        }
    });

    /* Fix: Cast inboxItems to RxInboxItem[] */
    const selectedItem = (inboxItems as RxInboxItem[])?.find(i => i.patientId === selectedPatientId);

    // Toggle Acknowledge
    const toggleAck = (changeId: string) => {
        setAcks(prev => ({ ...prev, [changeId]: !prev[changeId] }));
    };

    // Check if all critical/stop/change items are acknowledged
    const canApply = selectedItem?.changes.every(c => {
        return acks[c.id];
    });

    const getChangeTypeLabel = (type: RxChangeType) => {
        switch (type) {
            case RxChangeType.ADD: return { label: 'MỚI', class: 'bg-green-100 text-green-700 border-green-200' };
            case RxChangeType.UPDATE: return { label: 'THAY ĐỔI', class: 'bg-amber-100 text-amber-700 border-amber-200' };
            case RxChangeType.STOP: return { label: 'NGƯNG', class: 'bg-red-100 text-red-700 border-red-200' };
            default: return { label: 'KHÔNG ĐỔI', class: 'bg-slate-100 text-slate-500' };
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
            {/* Left Sidebar: Patient List */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-slate-800">Y lệnh chờ nhận</h2>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500">Từ HIS • Cần xác nhận</p>
                        {/* Fix: Cast inboxItems to RxInboxItem[] */}
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{(inboxItems as RxInboxItem[])?.length || 0}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-slate-400">Đang tải...</div>
                    ) : (
                        /* Fix: Cast inboxItems to RxInboxItem[] */
                        (!inboxItems || (inboxItems as RxInboxItem[]).length === 0) ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                <i className="fa-solid fa-check-double text-4xl mb-3 text-green-200"></i>
                                <p>Đã nhận hết y lệnh.</p>
                            </div>
                        ) : (
                            /* Fix: Cast inboxItems to RxInboxItem[] */
                            (inboxItems as RxInboxItem[]).map(item => (
                                <div
                                    key={item.patientId}
                                    onClick={() => { setSelectedPatientId(item.patientId); setAcks({}); }}
                                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition relative ${selectedPatientId === item.patientId ? 'bg-blue-50 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="font-bold text-slate-800">{item.patientName}</div>
                                    <div className="text-xs text-slate-500 mb-2">{item.patientCode}</div>

                                    {item.alerts && item.alerts.length > 0 && (
                                        <div className="mb-2 flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                                            <i className="fa-solid fa-triangle-exclamation"></i> Có cảnh báo
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">v{item.currentVersionId} <i className="fa-solid fa-arrow-right mx-0.5"></i> v{item.hisVersionId}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(item.hisTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Right Content: Diff View */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {!selectedItem ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <i className="fa-solid fa-file-prescription text-5xl mb-4 text-slate-200"></i>
                        <p>Chọn bệnh nhân để xem thay đổi y lệnh</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    {selectedItem.patientName}
                                    <span className="bg-white text-slate-500 text-xs px-2 py-1 rounded border border-slate-200">{selectedItem.patientCode}</span>
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Cập nhật lúc {new Date(selectedItem.hisTimestamp).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                            {/* ALERTS SECTION */}
                            {selectedItem.alerts && selectedItem.alerts.length > 0 && (
                                <div className="mb-6 space-y-2">
                                    {selectedItem.alerts.map((alert, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 ${alert.level === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                            <i className={`fa-solid mt-0.5 text-lg ${alert.level === 'CRITICAL' ? 'fa-skull-crossbones' : 'fa-triangle-exclamation'}`}></i>
                                            <div>
                                                <div className="font-bold text-sm uppercase">{alert.level === 'CRITICAL' ? 'Cảnh báo nghiêm trọng' : 'Lưu ý lâm sàng'}</div>
                                                <div className="text-sm">{alert.message}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* DIFF HEADER */}
                            <div className="hidden md:grid grid-cols-12 gap-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase">
                                <div className="col-span-1">Loại</div>
                                <div className="col-span-4">Tên thuốc / Hàm lượng</div>
                                <div className="col-span-3">Hiện tại (Cũ)</div>
                                <div className="col-span-3">Mới (HIS)</div>
                            </div>

                            <div className="space-y-4">
                                {selectedItem.changes.map((change) => {
                                    const badge = getChangeTypeLabel(change.type);
                                    return (
                                        <div key={change.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all relative ${acks[change.id] ? 'border-green-400 ring-1 ring-green-100' : 'border-slate-200 hover:border-blue-300'}`}>
                                            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                {/* Status Badge */}
                                                <div className="md:col-span-1">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap ${badge.class}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>

                                                {/* Drug Name & Alerts */}
                                                <div className="md:col-span-4">
                                                    <div className="font-bold text-slate-900 text-lg md:text-base">{change.drugName}</div>

                                                    {/* VALIDATION ERRORS */}
                                                    {change.validationErrors && change.validationErrors.length > 0 && (
                                                        <div className="mt-2 text-red-600 text-xs font-bold bg-red-50 p-2 rounded border border-red-100">
                                                            <i className="fa-solid fa-circle-xmark mr-1"></i>
                                                            {change.validationErrors.join(', ')}
                                                        </div>
                                                    )}

                                                    {/* MAR CONFLICTS */}
                                                    {change.conflicts && change.conflicts.length > 0 && (
                                                        <div className="mt-2 text-amber-700 text-xs font-bold bg-amber-50 p-2 rounded border border-amber-100">
                                                            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                                            {change.conflicts.join('; ')}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Old Data */}
                                                <div className="md:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100 md:bg-transparent md:border-0 md:p-0">
                                                    <div className="md:hidden text-[10px] uppercase font-bold text-slate-400 mb-1">Hiện tại (Cũ)</div>
                                                    {change.oldData ? (
                                                        <div className={`text-sm ${change.type === RxChangeType.STOP ? 'line-through opacity-50 decoration-slate-400' : 'text-slate-600'}`}>
                                                            <div className="font-medium">{change.oldData.dosage}</div>
                                                            <div>{change.oldData.route} • {change.oldData.frequency}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-300 italic">-- Không có --</div>
                                                    )}
                                                </div>

                                                {/* New Data */}
                                                <div className="md:col-span-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100 md:bg-transparent md:border-0 md:p-0">
                                                    <div className="md:hidden text-[10px] uppercase font-bold text-primary mb-1">Mới (HIS)</div>
                                                    {change.newData ? (
                                                        <div className="text-sm text-slate-800">
                                                            {/* Highlight Diff Logic */}
                                                            <div className={`font-bold ${change.oldData && change.oldData.dosage !== change.newData.dosage ? 'text-blue-700 bg-blue-100 w-fit px-1 rounded' : ''}`}>
                                                                {change.newData.dosage}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap gap-2">
                                                                <span className={change.oldData && change.oldData.route !== change.newData.route ? 'text-blue-700 bg-blue-100 px-1 rounded font-bold' : ''}>
                                                                    {change.newData.route}
                                                                </span>
                                                                <span className="text-slate-300 hidden md:inline">•</span>
                                                                <span className={change.oldData && change.oldData.frequency !== change.newData.frequency ? 'text-blue-700 bg-blue-100 px-1 rounded' : ''}>
                                                                    {change.newData.frequency}
                                                                </span>
                                                            </div>
                                                            {change.newData.note && (
                                                                <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 italic">
                                                                    <i className="fa-regular fa-note-sticky mr-1"></i>{change.newData.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-red-600 font-bold italic">Ngưng dùng thuốc này</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
