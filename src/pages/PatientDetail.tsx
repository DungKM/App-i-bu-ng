
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/services/api';
import { aiService } from '@/services/ai';
import { UserRole, OrderType, OrderStatus, PatientStatus, MedicalRecord, Attachment, VitalSign, NEWS2Result } from '@/types';
import { SignatureCapture } from '@/components/SignatureCapture';
import { AIAssistant } from '@/components/AIAssistant';
import { useAuth } from '@/context/AuthContext';

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

// --- Sparkline Component ---
const Sparkline: React.FC<{ data: number[], color: string, min: number, max: number }> = ({ data, color, min, max }) => {
    if (data.length < 2) return <div className="h-8 text-slate-300 text-[10px] flex items-center italic">Cần thêm dữ liệu...</div>;
    const width = 100;
    const height = 30;
    const padding = 2;
    const range = max - min || 1;
    const points = data.slice(-10).map((val, i) => {
        const x = (i / (Math.min(data.length, 10) - 1)) * width;
        const normalized = (val - min) / range;
        const y = height - (normalized * (height - 2 * padding) + padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={points} />
            <circle cx={width} cy={points.split(' ').pop()?.split(',')[1]} r="2" fill={color} />
        </svg>
    );
};

// --- Form Schemas ---
const vitalSchema = z.object({
  temperature: z.number().min(30).max(45),
  heartRate: z.number().min(30).max(250),
  spO2: z.number().min(50).max(100),
  bpSystolic: z.number().min(50).max(300),
  bpDiastolic: z.number().min(30).max(200),
  respiratoryRate: z.number().min(5).max(60),
});

const recordSchema = z.object({
  reasonForAdmission: z.string().optional(),
  medicalHistory: z.string().optional(),
  clinicalExamination: z.string().optional(),
  treatmentPlan: z.string().optional(),
});

const orderSchema = z.object({
  type: z.nativeEnum(OrderType),
  content: z.string().min(1, "Bắt buộc"),
  note: z.string().optional(),
});

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'record' | 'vitals' | 'meds' | 'services' | 'notes'>('record');
  const [showSignature, setShowSignature] = useState<{ orderId: string, type: 'MED' | 'SERVICE' } | null>(null);
  const [editingRecord, setEditingRecord] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const { data: patient, isLoading: pLoading } = useQuery({ queryKey: ['patient', id], queryFn: () => api.getPatientById(id!), enabled: !!id });
  const { data: record } = useQuery({ queryKey: ['record', id], queryFn: () => api.getMedicalRecord(id!), enabled: !!id });
  const { data: vitals } = useQuery({ queryKey: ['vitals', id], queryFn: () => api.getVitals(id!), enabled: !!id });
  const { data: orders } = useQuery({ queryKey: ['orders', id], queryFn: () => api.getOrders(id!), enabled: !!id });
  const { data: notes } = useQuery({ queryKey: ['notes', id], queryFn: () => api.getNotes(id!), enabled: !!id });

  // NEWS2 Calculation
  const latestVitals = vitals?.[0];
  const news2 = useMemo(() => latestVitals ? calculateNEWS2(latestVitals) : null, [latestVitals]);

  // AI Briefing
  useEffect(() => {
    if (patient && record && vitals) {
        aiService.getClinicalSummary({ patient, record, vitals, orders, notes }).then(setAiSummary);
    }
  }, [patient?.id]);

  const { register: regVital, handleSubmit: subVital, reset: resetVital } = useForm<z.infer<typeof vitalSchema>>({ resolver: zodResolver(vitalSchema) });

  const addVitalMutation = useMutation({
    mutationFn: (data: z.infer<typeof vitalSchema>) => api.createVital({ id: Math.random().toString(), patientId: id!, timestamp: new Date().toISOString(), creatorId: currentUser!.id, ...data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vitals', id] }); resetVital(); }
  });

  if (pLoading) return <div className="text-center py-20"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i></div>;
  if (!patient) return <div className="text-center py-20">Không tìm thấy BN</div>;

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
                    <span className={`text-xs px-2 py-1 rounded-lg border font-black ${patient.status === PatientStatus.CRITICAL ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-green-50 border-green-200 text-green-600'}`}>
                        {patient.status === PatientStatus.CRITICAL ? 'BỆNH NẶNG' : 'ỔN ĐỊNH'}
                    </span>
                  </h1>
                  <div className="text-sm text-slate-500 font-medium flex gap-4 mt-1">
                    <span>Mã BN: <span className="text-slate-900 font-bold">{patient.code}</span></span>
                    <span>Phòng: <span className="text-slate-900 font-bold">{patient.room}-{patient.bed}</span></span>
                  </div>
                </div>
            </div>

            {/* NEWS2 Score Card */}
            {news2 && (
                <div className={`${news2.color} text-white p-3 px-6 rounded-2xl shadow-lg shadow-black/10 flex items-center gap-4`}>
                    <div className="text-center">
                        <div className="text-[10px] font-black uppercase opacity-80">Điểm NEWS2</div>
                        <div className="text-3xl font-black leading-none">{news2.score}</div>
                    </div>
                    <div className="h-10 w-px bg-white/20"></div>
                    <div>
                        <div className="text-sm font-black uppercase">{news2.level === 'HIGH' ? 'Rủi ro Cao' : news2.level === 'MEDIUM' ? 'Rủi ro Vừa' : 'Rủi ro Thấp'}</div>
                        <div className="text-[10px] opacity-90 font-medium">{news2.recommendation}</div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* AI Clinical Briefing */}
      {aiSummary && (
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
      )}

      {/* Main Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-8 border-b border-slate-200 pb-1 scrollbar-hide">
        {[
          { id: 'record', label: 'Bệnh án', icon: 'fa-file-medical' },
          { id: 'services', label: 'CLS/DVKT', icon: 'fa-microscope' },
          { id: 'meds', label: 'Dùng thuốc', icon: 'fa-pills' },
          { id: 'vitals', label: 'Sinh hiệu', icon: 'fa-heart-pulse' },
          { id: 'notes', label: 'Diễn biến', icon: 'fa-clipboard-user' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.label}
            </button>
        ))}
      </div>

      {/* TAB CONTENT: VITALS WITH TRENDS */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
            {/* Quick Input Bar */}
            {currentUser?.role === UserRole.NURSE && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase mb-4">Cập nhật chỉ số mới</h3>
                    <form onSubmit={subVital(d => addVitalMutation.mutate(d))} className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Mạch (l/p)</label>
                            <input type="number" {...regVital('heartRate', {valueAsNumber:true})} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-center focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">HA (TĐ/TTr)</label>
                            <div className="flex items-center gap-1">
                                <input type="number" {...regVital('bpSystolic', {valueAsNumber:true})} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-center" />
                                <input type="number" {...regVital('bpDiastolic', {valueAsNumber:true})} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-center" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">SpO2 (%)</label>
                            <input type="number" {...regVital('spO2', {valueAsNumber:true})} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-center" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nhịp thở</label>
                            <input type="number" {...regVital('respiratoryRate', {valueAsNumber:true})} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-center" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nhiệt độ (°C)</label>
                            <input type="number" step="0.1" {...regVital('temperature', {valueAsNumber:true})} className="w-full p-3 bg-slate-50 border-none rounded-2xl font-black text-center" />
                        </div>
                        <div className="flex items-end">
                            <button className="w-full bg-primary text-white p-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-sky-600 transition uppercase text-[10px]">
                                Lưu
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Vital Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Nhịp tim', val: latestVitals?.heartRate, unit: 'l/p', color: 'text-red-500', data: vitals?.map(v => v.heartRate).reverse() || [], min: 40, max: 140 },
                    { label: 'SpO2', val: latestVitals?.spO2, unit: '%', color: 'text-blue-500', data: vitals?.map(v => v.spO2).reverse() || [], min: 85, max: 100 },
                    { label: 'Huyết áp', val: `${latestVitals?.bpSystolic}/${latestVitals?.bpDiastolic}`, unit: 'mmHg', color: 'text-indigo-500', data: vitals?.map(v => v.bpSystolic).reverse() || [], min: 80, max: 200 },
                    { label: 'Nhiệt độ', val: latestVitals?.temperature, unit: '°C', color: 'text-amber-500', data: vitals?.map(v => v.temperature).reverse() || [], min: 35, max: 40 },
                    { label: 'Nhịp thở', val: latestVitals?.respiratoryRate, unit: 'l/p', color: 'text-emerald-500', data: vitals?.map(v => v.respiratoryRate).reverse() || [], min: 10, max: 30 },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.val || '--'} <span className="text-xs opacity-50 font-medium">{stat.unit}</span></span>
                        </div>
                        <div className="mt-4 flex-1 flex items-end">
                             <Sparkline data={stat.data} color={stat.color.replace('text-', 'stroke-')} min={stat.min} max={stat.max} />
                        </div>
                    </div>
                ))}
            </div>

            {/* History List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Thời gian</th>
                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Mạch</th>
                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">HA</th>
                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">SpO2</th>
                            <th className="px-6 py-4 font-black text-slate-400 uppercase text-[10px]">Điểm NEWS2</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vitals?.map(v => {
                            const vScore = calculateNEWS2(v);
                            return (
                                <tr key={v.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-500">{new Date(v.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4 font-black text-slate-700">{v.heartRate}</td>
                                    <td className="px-6 py-4 font-black text-slate-700">{v.bpSystolic}/{v.bpDiastolic}</td>
                                    <td className="px-6 py-4 font-black text-slate-700">{v.spO2}%</td>
                                    <td className="px-6 py-4">
                                        <span className={`${vScore.color} text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm`}>
                                            {vScore.score} - {vScore.level}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* OTHER TABS (Placeholder/Existing) */}
      {activeTab === 'record' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do vào viện</label>
                      <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">{record?.reasonForAdmission || '--'}</div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền sử</label>
                      <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100">{record?.medicalHistory || '--'}</div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khám lâm sàng</label>
                      <div className="bg-slate-50 p-4 rounded-2xl text-slate-900 font-bold border border-slate-100 whitespace-pre-wrap">{record?.clinicalExamination || '--'}</div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Hướng điều trị / Kết luận</label>
                      <div className="bg-blue-50 p-6 rounded-3xl text-slate-900 font-black border border-blue-100 text-lg leading-relaxed">{record?.treatmentPlan || '--'}</div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
