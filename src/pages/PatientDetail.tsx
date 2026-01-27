
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/api';
import { aiService } from '@/services/ai';
import { PatientStatus, VitalSign, NEWS2Result } from '@/types';
import { SignatureCapture } from '@/components/SignatureCapture';
import { AIAssistant } from '@/components/AIAssistant';
import ThongTinVaoVienCard from '@/components/ThongTinVaoVienCard';

// --- NEWS2 Logic ---
const calculateNEWS2 = (v: VitalSign): NEWS2Result => {
    let score = 0;

    // Respiratory Rate
    if (v.respiratoryRate <= 8 || v.respiratoryRate >= 25) score += 3;
    else if (v.respiratoryRate >= 21) score += 2;
    else if (v.respiratoryRate <= 11) score += 1;

    // SpO2 (Scale 1)
    if (v.spO2 <= 91) score += 3;
    else if (v.spO2 <= 93) score += 2;
    else if (v.spO2 <= 95) score += 1;

    // Systolic BP
    if (v.bpSystolic <= 90 || v.bpSystolic >= 220) score += 3;
    else if (v.bpSystolic <= 100) score += 2;
    else if (v.bpSystolic <= 110) score += 1;

    // Heart Rate
    if (v.heartRate <= 40 || v.heartRate >= 131) score += 3;
    else if (v.heartRate >= 111) score += 2;
    else if (v.heartRate <= 50 || v.heartRate >= 91) score += 1;

    // Temperature
    if (v.temperature <= 35) score += 3;
    else if (v.temperature >= 39.1) score += 2;
    else if (v.temperature <= 36 || v.temperature >= 38.1) score += 1;

    let level: NEWS2Result['level'] = 'LOW';
    let color = 'bg-green-500';
    let recommendation = 'Theo dõi thường quy (tối thiểu 12h/lần)';

    if (score >= 7) {
        level = 'HIGH';
        color = 'bg-red-600';
        recommendation = 'PHẢN ỨNG KHẨN CẤP (Theo dõi liên tục)';
    } else if (score >= 5) {
        level = 'MEDIUM';
        color = 'bg-amber-600';
        recommendation = 'CẢNH BÁO TRUNG BÌNH (Theo dõi mỗi 1h)';
    } else if (score >= 3) {
        level = 'LOW';
        color = 'bg-amber-400';
        recommendation = 'CẢNH BÁO THẤP (Theo dõi mỗi 4h)';
    }

    return { score, level, color, recommendation };
};

const STATUS_STYLE: Record<string, { cls: string; dot: string }> = {
    "Có kết quả": { cls: "text-green-600", dot: "bg-green-500" },
    "Đang thực hiện": { cls: "text-blue-600", dot: "bg-blue-500" },
    "Đã hủy": { cls: "text-slate-400 line-through", dot: "bg-slate-300" },
};
export const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedEncounterId, setSelectedEncounterId] = useState<string>('enc-1');
    const [activeTab, setActiveTab] = useState<'record' | 'vitals' | 'meds' | 'services' | 'notes'>('record');
    const [showSignature, setShowSignature] = useState<{ orderId: string, type: 'MED' | 'SERVICE' } | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

    const { data: patient, isLoading: pLoading } = useQuery({ queryKey: ['patient', id], queryFn: () => api.getPatientById(id!), enabled: !!id });
    const { data: record } = useQuery({ queryKey: ['record', id], queryFn: () => api.getMedicalRecord(id!), enabled: !!id });
    const { data: vitals } = useQuery({ queryKey: ['vitals', id], queryFn: () => api.getVitals(id!), enabled: !!id });
    const { data: orders } = useQuery({ queryKey: ['orders', id], queryFn: () => api.getOrders(id!), enabled: !!id });
    const { data: notes } = useQuery({ queryKey: ['notes', id], queryFn: () => api.getNotes(id!), enabled: !!id });
    const IdBenhAn ='F3BB64E8-8FEC-44BE-AB96-23867F53894A'
    // AI Briefing
    useEffect(() => {
        if (patient && record && vitals) {
            aiService.getClinicalSummary({ patient, record, vitals, orders, notes }).then(setAiSummary);
        }
    }, [patient?.id]);

    const vitalsByEncounter = useMemo(() => {
        const list = vitals ?? [];
        const groups = new Map<string, {
            encounterId: string;
            encounterCode?: string;
            encounterDate?: string;
            doctorName?: string;
            items: typeof list;
        }>();

        for (const v of list) {
            const key = (v as any).encounterId || (v as any).encounterCode || 'UNKNOWN';

            if (!groups.has(key)) {
                groups.set(key, {
                    encounterId: (v as any).encounterId ?? key,
                    encounterCode: (v as any).encounterCode,
                    encounterDate: (v as any).encounterDate || (v as any).encounterCreatedAt,
                    doctorName: (v as any).doctorName,
                    items: [],
                });
            }
            groups.get(key)!.items.push(v);
        }

        // sort items trong từng lần (mới nhất trước)
        const result = Array.from(groups.values()).map(g => ({
            ...g,
            items: [...g.items].sort((a: any, b: any) => +new Date(b.timestamp) - +new Date(a.timestamp)),
        }));

        // sort các lần khám (mới nhất trước) theo encounterDate nếu có, fallback theo timestamp mới nhất
        result.sort((a, b) => {
            const ad = a.encounterDate ? +new Date(a.encounterDate) : +new Date((a.items[0] as any).timestamp);
            const bd = b.encounterDate ? +new Date(b.encounterDate) : +new Date((b.items[0] as any).timestamp);
            return bd - ad;
        });

        return result;
    }, [vitals]);

    //   const addVitalMutation = useMutation({
    //     mutationFn: (data: z.infer<typeof vitalSchema>) => api.createVital({ id: Math.random().toString(), patientId: id!, timestamp: new Date().toISOString(), creatorId: currentUser!.id, ...data }),
    //     onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vitals', id] }); resetVital(); }
    //   });

    if (pLoading) return <div className="text-center py-20"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>;


    return (
        <div className="pb-20 relative">
            <AIAssistant patient={patient} record={record} vitals={vitals} orders={orders} notes={notes} />

            {showSignature && <SignatureCapture title="Xác nhận" onSave={() => setShowSignature(null)} onCancel={() => setShowSignature(null)} />}

            {/* Header & EWS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6 sticky top-16 sm:top-20 z-30">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                {patient.name}
                            </h1>
                            <div className="text-sm text-slate-500 font-medium flex gap-4 mt-1">
                                <span>Mã BN: <span className="text-slate-900 font-bold">{patient.code}</span></span>
                                <span>Phòng: <span className="text-slate-900 font-bold">{patient.room}-{patient.bed}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Clinical Briefing */}
            {/* {aiSummary && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1 rounded-3xl shadow-xl mb-6">
                    <div className="bg-white/95 rounded-[22px] p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs">
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </div>
                            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider">Tóm tắt lâm sàng AI</h3>
                        </div>
                        <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed" 
                            dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br/>').replace(/• /g, '✨ ') }} />
                    </div>
                </div>
            )} */}

            {/* Main Tabs */}
            <div className="flex overflow-x-auto gap-1 mb-8 border-b border-slate-200 pb-1 scrollbar-hide">
                {[
                    { id: 'record', label: 'Bệnh án', icon: 'fa-file-medical' },
                    { id: 'services', label: 'CLS/DVKT', icon: 'fa-microscope' },
                    { id: 'meds', label: 'Dùng thuốc', icon: 'fa-pills' },
                    { id: 'vitals', label: 'Sinh hiệu', icon: 'fa-heart-pulse' },
                    { id: 'notes', label: 'Diễn biến', icon: 'fa-clipboard-user' },
                    { id: 'documents', label: 'Tài liệu', icon: 'fa-book' },
                    { id: 'history', label: 'Lịch sử', icon: 'fa-briefcase' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        <i className={`fa-solid ${tab.icon}`}></i>
                        {tab.label}
                    </button>
                ))}
            </div>
            {activeTab !== "record" && activeTab !== "history" && activeTab !== "documents" && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lần khám có chỉ định CLS/DVKT</div>
                            <div className="text-slate-900 font-black mt-1">Chọn lần khám để xem chỉ định</div>
                        </div>

                        {/* Filter (view only) */}
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
                                <i className="fa-solid fa-filter text-slate-400 text-xs"></i>
                                <select className="bg-transparent text-xs font-black text-slate-700 outline-none">
                                    <option>Tất cả loại</option>
                                    <option>LAB</option>
                                    <option>CĐHA</option>
                                    <option>DVKT</option>
                                </select>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <select className="bg-transparent text-xs font-black text-slate-700 outline-none">
                                    <option>Tất cả trạng thái</option>
                                    <option>Chờ thực hiện</option>
                                    <option>Đang thực hiện</option>
                                    <option>Có kết quả</option>
                                    <option>Đã hủy</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chips lần khám */}
                    <div className="mt-5 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                        {(
                            [
                                { id: 'enc-1', code: '3/26DT000000006', date: '09:51 10/01/2026', doctor: 'BS. Lê Thị Phương Thảo', dept: 'Khoa Cấp cứu' },
                                { id: 'enc-2', code: '2/26DT000000005', date: '09:46 10/01/2026', doctor: 'BS. Lê Thị Phương Thảo', dept: 'Khoa Cấp cứu' },
                                { id: 'enc-3', code: '1/26PK000000006', date: '10:19 07/01/2026', doctor: 'BS. Lê Thị Phương Thảo', dept: 'Khoa Sản' },
                            ] as const
                        ).map((e, idx) => (
                            <button
                                key={e.id}
                                onClick={() => setSelectedEncounterId(e.id)}
                                className={[
                                    "min-w-[260px] md:min-w-[300px] rounded-3xl border p-5 text-left transition-all",
                                    selectedEncounterId === e.id
                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                        : "bg-white border-slate-200 hover:bg-slate-50"
                                ].join(' ')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-black">
                                        {e.code}
                                    </div>
                                    <div className={selectedEncounterId === e.id ? "text-white/80" : "text-slate-400"}>
                                        <i className="fa-solid fa-circle text-[8px]"></i>
                                    </div>
                                </div>

                                <div className={["mt-2 text-xs font-bold", selectedEncounterId === e.id ? "text-white/90" : "text-slate-600"].join(' ')}>
                                    <i className="fa-regular fa-clock mr-2"></i>{e.date}
                                </div>

                                <div className={["mt-1 text-xs font-bold", selectedEncounterId === e.id ? "text-white/90" : "text-slate-600"].join(' ')}>
                                    <i className="fa-solid fa-user-doctor mr-2"></i>{e.doctor}
                                </div>

                                <div className={["mt-2 text-[10px] font-black uppercase tracking-widest", selectedEncounterId === e.id ? "text-white/70" : "text-slate-400"].join(' ')}>
                                    {e.dept}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )
            }
            {/* TAB CONTENT: VITALS WITH TRENDS */}
            {activeTab === 'vitals' && (
                <div className="space-y-6">
                    {vitalsByEncounter.length === 0 ? (
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center text-slate-400 font-bold">
                            Chưa có dữ liệu sinh hiệu.
                        </div>
                    ) : (
                        vitalsByEncounter.map((g) => (
                            <div key={g.encounterId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                {/* Bảng sinh hiệu của lần khám đó */}
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Mạch</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Nhiệt độ</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Huyết áp tối đa</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Huyết áp tối thiểu</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Nhịp thở</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">SpO2</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Cân nặng</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Chiều cao</th>
                                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">BMI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {g.items.map((v: any) => {
                                            const vScore = calculateNEWS2(v);
                                            return (
                                                <tr key={v.id} className="hover:bg-slate-50 transition">
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.heartRate}</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.temperature}°C</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.bpSystolic}</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.bpDiastolic}</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.respiratoryRate}</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.spO2}%</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.weightKg} kg</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.heightCm} cm</td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{v.bmi}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    )}
                </div>
            )}
            {/* TAB CONTENT: CLS/DVKT */}
            {activeTab === 'services' && (
                <div className="space-y-6">
                    {/* LẦN KHÁM (selector) */}
                    {/* DANH SÁCH CLS/DVKT */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách chỉ định CLS/DVKT</div>
                                <div className="text-slate-900 font-black mt-1">Hiển thị theo lần khám đã chọn</div>
                            </div>
                            {/* Search (view only) */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full md:w-[360px]">
                                    <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                                    <input
                                        className="bg-transparent outline-none w-full text-sm font-bold text-slate-700 placeholder:text-slate-400"
                                        placeholder="Tìm tên dịch vụ, loại, trạng thái..."
                                    />
                                </div>
                            </div>
                        </div>
                        {/* List items */}
                        <div className="mt-5 space-y-3">
                            {(
                                // ✅ UI demo: nếu bạn có data services theo encounter, thay bằng list theo selectedEncounterId
                                [
                                    { id: 's1', tag: 'LAB', title: 'Xét nghiệm CRP', doctor: 'BS. Nguyễn Văn A', time: '16/01/2026 14:14', status: 'Chờ thực hiện' },
                                    { id: 's2', tag: 'CĐHA', title: 'X-quang phổi thẳng', doctor: 'BS. Nguyễn Văn A', time: '16/01/2026 14:20', status: 'Đang thực hiện' },
                                    { id: 's3', tag: 'DVKT', title: 'Siêu âm ổ bụng', doctor: 'BS. Nguyễn Văn A', time: '16/01/2026 14:35', status: 'Có kết quả' },
                                ] as const
                            ).map((it) => {
                                const status = STATUS_STYLE[it.status] ?? { cls: "text-slate-400", dot: "bg-slate-300" };
                                const tagTone =
                                    it.tag === 'LAB'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                        : it.tag === 'CĐHA'
                                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100';

                                return (
                                    <button
                                        key={it.id}
                                        className="w-full text-left rounded-3xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition p-5"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl border ${tagTone}`}>
                                                        {it.tag}
                                                    </span>
                                                    <div className="text-base md:text-lg font-black text-slate-900 truncate">
                                                        {it.title}
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-bold">
                                                    <span className="inline-flex items-center gap-2">
                                                        <i className="fa-solid fa-user-doctor text-slate-400"></i>
                                                        {it.doctor}
                                                    </span>
                                                    <span className="inline-flex items-center gap-2">
                                                        <i className="fa-regular fa-clock text-slate-400"></i>
                                                        {it.time}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <div className={`text-xs font-black ${status.cls}`}>
                                                    {it.status}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        trạng thái
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Empty state (nếu muốn dùng) */}
                            {/* <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">
                Không có chỉ định CLS/DVKT trong lần khám này.
                </div> */}
                        </div>
                    </div>
                </div>
            )}
            {/* TAB CONTENT: meds */}
            {activeTab === 'meds' && (
                <div className="space-y-6">
                    {[
                        {
                            encounterId: "enc-20260110-001",
                            encounterCode: "3/26DT000000006",
                            createdAt: "2026-01-10T09:51:00+07:00",
                            doctorName: "BS. Lê Thị Phương Thảo",
                            meds: [
                                {
                                    id: "m-001",
                                    drugName: "Ceftriaxone 1g",
                                    dose: "1g",
                                    route: "TM",
                                    frequency: "1 lần/ngày",
                                    note: "Pha theo hướng dẫn",
                                    status: "Chờ dùng thuốc",
                                },
                                {
                                    id: "m-002",
                                    drugName: "Paracetamol 500mg",
                                    dose: "1 viên",
                                    route: "Uống",
                                    frequency: "Khi sốt > 38.5°C",
                                    note: "Tối đa 4g/ngày",
                                    status: "Đã hủy thuốc",
                                },
                                {
                                    id: "m-003",
                                    drugName: "Omeprazole 20mg",
                                    dose: "1 viên",
                                    route: "Uống",
                                    frequency: "Sáng",
                                    note: "",
                                    status: "Đã dùng thuốc",
                                },
                            ],
                        }
                    ].map((enc) => (
                        <div
                            key={enc.encounterId}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            {/* Danh sách thuốc */}
                            <div className="p-6 space-y-3">
                                {enc.meds.map((m) => {
                                    const tone =
                                        m.status === "Đã dùng thuốc"
                                            ? "bg-green-50 border-green-100 text-green-700"
                                            : m.status === "Đã hủy thuốc"
                                                ? "bg-slate-50 border-slate-200 text-slate-500"
                                                : m.status === "Chờ dùng thuốc"
                                                    ? "bg-blue-50 border-blue-100 text-blue-700"
                                                    : "bg-amber-50 border-amber-100 text-amber-700";

                                    return (
                                        <div
                                            key={m.id}
                                            className="rounded-3xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition p-5"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="text-base md:text-lg font-black text-slate-900 truncate">
                                                        {m.drugName}
                                                    </div>

                                                    <div className="mt-2 text-sm text-slate-600 font-bold flex flex-wrap gap-x-4 gap-y-1">
                                                        <span className="inline-flex items-center gap-2">
                                                            <i className="fa-solid fa-prescription-bottle-medical text-slate-400"></i>
                                                            {m.dose}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2">
                                                            <i className="fa-solid fa-route text-slate-400"></i>
                                                            {m.route}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2">
                                                            <i className="fa-regular fa-calendar-check text-slate-400"></i>
                                                            {m.frequency}
                                                        </span>
                                                    </div>

                                                    {m.note ? (
                                                        <div className="mt-3 text-sm font-bold text-slate-500">
                                                            <i className="fa-regular fa-note-sticky text-slate-400 mr-2"></i>
                                                            {m.note}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="shrink-0">
                                                    <span
                                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-2xl border ${tone}`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {enc.meds.length === 0 && (
                                    <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">
                                        Không có đơn thuốc trong lần khám này.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* OTHER TABS (Placeholder/Existing) */}
            {activeTab === 'record' && (
                // <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                //     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                //         <div className="space-y-2">
                //             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do vào viện</label>
                //             <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">{record?.reasonForAdmission || '--'}</div>
                //         </div>
                //         <div className="space-y-2">
                //             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diễn biến bệnh</label>
                //             <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">{record?.medicalHistory || '--'}</div>
                //         </div>
                //         <div className="space-y-2">
                //             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền sử bệnh bản thân</label>
                //             <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">{record?.medicalHistory || '--'}</div>
                //         </div>
                //         <div className="space-y-2">
                //             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền sử bệnh gia đình</label>
                //             <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">{record?.medicalHistory || '--'}</div>
                //         </div>
                //         <div className="md:col-span-2 space-y-2">
                //             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chẩn đoán</label>
                //             <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100 whitespace-pre-wrap">{record?.clinicalExamination || '--'}</div>
                //         </div>
                //         <div className="md:col-span-2 space-y-2">
                //             <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Hướng điều trị</label>
                //             <div className="bg-blue-50 p-6 rounded-3xl text-slate-900 font-black border border-blue-100 text-lg leading-relaxed">{record?.treatmentPlan || '--'}</div>
                //         </div>
                //     </div>
                // </div>
                <ThongTinVaoVienCard idBenhAn={IdBenhAn} />
            )}
            {/* OTHER TABS Notes */}
            {activeTab === 'notes' && (
                <div className="space-y-6">
                    {[
                        {
                            encounterId: "enc-20260110-001",
                            encounterCode: "3/26DT000000006",
                            createdAt: "2026-01-10T09:51:00+07:00",
                            doctorName: "BS. Lê Thị Phương Thảo",
                            notes: [
                                {
                                    id: "n-002",
                                    time: "2026-01-10T14:40:00+07:00",
                                    author: "BS. Lê Thị Phương Thảo",
                                    type: "Bác sĩ",
                                    content:
                                        "Đánh giá: sốt giảm, đau giảm. Tiếp tục kháng sinh theo phác đồ. Chỉ định thêm X-quang phổi, theo dõi CRP.",
                                }
                            ],
                        },
                        {
                            encounterId: "enc-20260107-001",
                            encounterCode: "1/26PK000000006",
                            createdAt: "2026-01-07T10:19:00+07:00",
                            doctorName: "BS. Nguyễn Văn A",
                            notes: [
                                {
                                    id: "n-004",
                                    time: "2026-01-07T10:50:00+07:00",
                                    author: "BS. Nguyễn Văn A",
                                    type: "Bác sĩ",
                                    content:
                                        "Khám ban đầu: ho, sốt nhẹ 2 ngày. Phổi thông khí tốt. Chẩn đoán theo dõi nhiễm siêu vi. Dặn theo dõi, uống thuốc theo toa.",
                                }
                            ],
                        },
                    ].map((enc) => (
                        <div
                            key={enc.encounterId}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            {/* Timeline diễn biến */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {enc.notes.map((n) => {
                                        const tone =
                                            n.type === "Bác sĩ"
                                                ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                                                : "bg-emerald-50 border-emerald-100 text-emerald-700";

                                        return (
                                            <div key={n.id} className="flex gap-4">
                                                {/* Dot + line */}
                                                <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 rounded-full bg-slate-900 mt-2" />
                                                    <div className="w-px flex-1 bg-slate-200 mt-2" />
                                                </div>

                                                {/* Content card */}
                                                <div className="flex-1 rounded-3xl border border-slate-200 p-5 hover:bg-slate-50 transition">
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-2xl border ${tone}`}>
                                                                {n.type}
                                                            </span>
                                                            <div className="text-sm font-black text-slate-900">
                                                                {n.author}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-500 inline-flex items-center gap-2">
                                                            <i className="fa-regular fa-clock text-slate-400"></i>
                                                            {new Date(n.time).toLocaleString("vi-VN")}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 text-slate-700 font-bold whitespace-pre-wrap leading-relaxed">
                                                        {n.content}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {enc.notes.length === 0 && (
                                        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">
                                            Chưa có diễn biến trong lần khám này.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* OTHER TABS Documents */}
            {activeTab === "documents" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px]">
                        {/* LEFT */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto p-4 max-h-[200px] md:max-h-full">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">
                                Danh mục hồ sơ
                            </h3>

                            <ul className="space-y-2">
                                <li>
                                    <div className="font-bold text-slate-700 text-sm mb-1">Hồ sơ bệnh án</div>
                                    <ul className="pl-4 border-l-2 border-slate-100 space-y-1">
                                        <li className="text-sm cursor-pointer px-2 py-1 rounded hover:bg-slate-50 text-slate-600">
                                            <i className="fa-regular fa-folder mr-2" />
                                            Xét Nghiệm Sinh Hóa Máu - Xét nghiệm sinh hóa KT thực hiện
                                        </li>
                                        <li className="text-sm cursor-pointer px-2 py-1 rounded hover:bg-slate-50 text-slate-600">
                                            <i className="fa-regular fa-folder mr-2" />
                                            Chụp Xquang ngực thẳng [số hóa 1 phim]
                                        </li>
                                        <li className="text-sm cursor-pointer px-2 py-1 rounded hover:bg-slate-50 bg-blue-50 text-primary font-medium">
                                            <i className="fa-regular fa-folder mr-2" />
                                            Phiếu vào viện
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>

                        {/* RIGHT */}
                        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[300px]">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                <div>
                                    <div className="text-xs text-slate-500 mb-0.5">Danh mục đang chọn</div>
                                    <h3 className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                                        Phiếu vào viện
                                    </h3>
                                </div>

                                <label className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-600 transition flex items-center whitespace-nowrap">
                                    <i className="fa-solid fa-camera mr-2" />
                                    <span className="hidden sm:inline">Upload File</span>
                                    <input type="file" className="hidden" />
                                </label>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 bg-red-100 text-red-500 rounded flex flex-shrink-0 items-center justify-center">
                                                <i className="fa-solid fa-file-pdf" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">
                                                    XN_Mau_2510.pdf
                                                </p>
                                                <p className="text-[10px] text-slate-400">10/25/2023 • 1.2 MB</p>
                                            </div>
                                        </div>

                                        <button type="button" className="text-slate-400 hover:text-primary px-2">
                                            <i className="fa-solid fa-download" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTHER TABS history */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6">Lịch sử chuyển khoa</h3>
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                            <div className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-blue-500"></div>
                                <div className="text-xs text-slate-400 mb-1">25/10/2023</div>
                                <h4 className="font-bold text-slate-800 text-base">Chuyển khoa phòng</h4>
                                <p className="text-sm text-slate-600 mt-1">Chuyển từ Khoa Khám bệnh sang khoa nội</p>
                            </div>
                        </div>
                         <h3 className="font-bold text-slate-800 mb-6 mt-6">Lịch sử chuyển buồng</h3>
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                            <div className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-blue-500"></div>
                                <div className="text-xs text-slate-400 mb-1">25/09/2023</div>
                                <h4 className="font-bold text-slate-800 text-base">Chuyển buồng</h4>
                                <p className="text-sm text-slate-600 mt-1">Chuyển từ phòng 401/ giường 201 sang phòng 402/ giường 302</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
