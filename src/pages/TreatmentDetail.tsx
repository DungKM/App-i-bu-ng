
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '@/services/api';
import { MedicalRecordMain, MedicalRecordConclusion, RecordCategory, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const TreatmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'record' | 'files' | 'history'>('record');
  const [recordSubTab, setRecordSubTab] = useState<'page1' | 'main' | 'conclusion'>('main');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!currentUser) return null;

  const isDoctor = currentUser.role === UserRole.DOCTOR;
  const isNurse = currentUser.role === UserRole.NURSE;

  // Queries
  const { data: treatment, isLoading } = useQuery({ queryKey: ['treatment', id], queryFn: () => api.getTreatmentDetail(id!) });
  
  // Medical Record Queries
  const medicalRecordId = treatment?.medicalRecordId;
  const { data: page1 } = useQuery({ 
      queryKey: ['record-page1', medicalRecordId], 
      queryFn: () => api.getMedicalRecordPage1(medicalRecordId!),
      enabled: !!medicalRecordId && activeTab === 'record' && recordSubTab === 'page1'
  });
  const { data: mainRecord } = useQuery({ 
      queryKey: ['record-main', medicalRecordId], 
      queryFn: () => api.getMedicalRecordMain(medicalRecordId!),
      enabled: !!medicalRecordId && activeTab === 'record' && recordSubTab === 'main'
  });
  const { data: conclusion } = useQuery({ 
      queryKey: ['record-conclusion', medicalRecordId], 
      queryFn: () => api.getMedicalRecordConclusion(medicalRecordId!),
      enabled: !!medicalRecordId && activeTab === 'record' && recordSubTab === 'conclusion'
  });

  // Files Queries
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.getRecordCategories, enabled: activeTab === 'files' });
  const { data: files } = useQuery({ 
      queryKey: ['files', id, selectedCategory], 
      queryFn: () => api.getStorageFiles(id!, selectedCategory!), // Using treatmentId as aggregateId for now
      enabled: activeTab === 'files' && !!selectedCategory
  });

  // History Query
  const { data: historyData } = useQuery({ 
      queryKey: ['history', treatment?.patientId], 
      queryFn: () => api.getTreatmentHistory(treatment!.patientId),
      enabled: activeTab === 'history' && !!treatment
  });

  // Forms
  const { register: regMain, handleSubmit: subMain, reset: resetMain } = useForm<MedicalRecordMain>();
  const { register: regConc, handleSubmit: subConc, reset: resetConc } = useForm<MedicalRecordConclusion>();

  React.useEffect(() => { if (mainRecord) resetMain(mainRecord); }, [mainRecord, resetMain]);
  React.useEffect(() => { if (conclusion) resetConc(conclusion); }, [conclusion, resetConc]);

  // Mutations
  const updateMainMutation = useMutation({
      mutationFn: (data: MedicalRecordMain) => api.updateMedicalRecordMain(medicalRecordId!, data),
      onSuccess: () => alert('Đã lưu bệnh án!')
  });
  const updateConcMutation = useMutation({
      mutationFn: (data: MedicalRecordConclusion) => api.updateMedicalRecordConclusion(medicalRecordId!, data),
      onSuccess: () => alert('Đã lưu kết luận!')
  });
  const uploadMutation = useMutation({
      mutationFn: (file: File) => api.uploadFile(id!, selectedCategory!, file),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files', id, selectedCategory] })
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) uploadMutation.mutate(e.target.files[0]);
  };

  if (isLoading) return <div className="text-center py-10">Đang tải...</div>;
  if (!treatment) return <div className="text-center py-10">Không tìm thấy đợt điều trị.</div>;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-16 sm:top-20 z-30">
        <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 w-full">
                <button onClick={() => navigate('/treatment')} className="mt-1 text-slate-400 hover:text-slate-600 flex-shrink-0">
                    <i className="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{treatment.patientName}</h1>
                  <div className="text-xs sm:text-sm text-slate-500 flex flex-wrap gap-2 mt-1">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 rounded">{treatment.patientCode}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="bg-blue-50 text-blue-700 px-1.5 rounded border border-blue-100 whitespace-nowrap"><i className="fa-solid fa-bed mr-1"></i>{treatment.room} - {treatment.bed}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate max-w-[150px]">{treatment.deptCode}</span>
                  </div>
                </div>
            </div>
            <div className="text-right hidden sm:block flex-shrink-0 ml-4">
                <div className="text-xs text-slate-500">BS Phụ trách</div>
                <div className="font-medium text-slate-800 text-sm">{treatment.doctorName}</div>
            </div>
        </div>
      </div>

      {/* Main Tabs - Scrollable on Mobile */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto scrollbar-hide">
        {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'record', label: 'Bệnh án' },
            { id: 'files', label: 'Tài liệu' },
            { id: 'history', label: 'Lịch sử' },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 sm:px-6 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
          <div className="space-y-4">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800 border-b pb-2 mb-4">Thông tin điều trị</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-sm">
                      <div>
                          <label className="text-xs text-slate-500 block">Chẩn đoán nhập viện</label>
                          <p className="font-medium">{treatment.diagnosis}</p>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block">Thời gian vào viện</label>
                          <p className="font-medium">{new Date(treatment.admissionDate).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block">Số BHYT</label>
                          <p className="font-medium">{treatment.insuranceNumber || '---'}</p>
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 block">Trạng thái</label>
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 mt-1">
                              {treatment.status}
                          </span>
                      </div>
                  </div>
              </div>

              {/* NURSE QUICK ACTIONS (Rule 4.9) */}
              {isNurse && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Link to={`/medication/${treatment.visitId}`} className="bg-blue-50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition flex items-center gap-4 group">
                         <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition flex-shrink-0">
                             <i className="fa-solid fa-pills"></i>
                         </div>
                         <div>
                             <div className="font-bold text-blue-900 text-lg">Cấp phát thuốc</div>
                             <div className="text-xs text-blue-600">Thực hiện y lệnh thuốc</div>
                         </div>
                     </Link>
                     <Link to={`/surgery`} className="bg-amber-50 p-4 rounded-xl border border-amber-100 hover:shadow-md transition flex items-center gap-4 group">
                         <div className="w-12 h-12 bg-amber-500 text-white rounded-lg flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition flex-shrink-0">
                             <i className="fa-solid fa-microscope"></i>
                         </div>
                         <div>
                             <div className="font-bold text-amber-900 text-lg">DVKT / CLS</div>
                             <div className="text-xs text-amber-600">Thực hiện kỹ thuật</div>
                         </div>
                     </Link>
                 </div>
              )}
          </div>
      )}

      {/* CONTENT: MEDICAL RECORD */}
      {activeTab === 'record' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sub-nav - Horizontal scroll on mobile, Vertical on Desktop */}
              <div className="lg:col-span-1 flex lg:flex-col flex-row gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                  {[
                      { id: 'page1', label: 'Trang 1 (Hành chính)' },
                      { id: 'main', label: 'Trang chính (Diễn biến)' },
                      { id: 'conclusion', label: 'Kết luận (Ra viện)' }
                  ].map(sub => (
                      <button 
                        key={sub.id}
                        onClick={() => setRecordSubTab(sub.id as any)}
                        className={`text-left px-4 py-2 sm:py-3 rounded-lg text-sm font-medium transition whitespace-nowrap flex-shrink-0 lg:w-full ${
                            recordSubTab === sub.id ? 'bg-primary text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                          {sub.label}
                      </button>
                  ))}
              </div>

              {/* Form Content */}
              <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                  {recordSubTab === 'page1' && page1 && (
                      <div className="space-y-4">
                          <h3 className="font-bold text-slate-800 border-b pb-2">Thông tin hành chính</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div><span className="text-slate-500 block">Họ tên:</span> {page1.patientName}</div>
                              <div><span className="text-slate-500 block">Ngày sinh:</span> {page1.dob}</div>
                              <div><span className="text-slate-500 block">Giới tính:</span> {page1.gender}</div>
                              <div><span className="text-slate-500 block">Dân tộc:</span> {page1.ethnicity}</div>
                              <div><span className="text-slate-500 block">Nghề nghiệp:</span> {page1.job}</div>
                              <div><span className="text-slate-500 block">Địa chỉ:</span> {page1.address}</div>
                              <div className="col-span-1 sm:col-span-2 bg-slate-50 p-3 rounded"><span className="text-slate-500 block font-bold">Người nhà:</span> {page1.contactPerson} - {page1.contactPhone}</div>
                          </div>
                      </div>
                  )}

                  {recordSubTab === 'main' && (
                      <form onSubmit={subMain(d => updateMainMutation.mutate(d))} className="space-y-4">
                          <h3 className="font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
                              Diễn biến & Điều trị
                              {isDoctor && (
                                  <button type="submit" disabled={updateMainMutation.isPending} className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-sky-600 shadow-sm">
                                      <i className="fa-solid fa-floppy-disk mr-1"></i>Lưu
                                  </button>
                              )}
                          </h3>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Quá trình bệnh lý</label>
                              <textarea disabled={!isDoctor} {...regMain('process')} rows={3} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Tiền sử</label>
                              <textarea disabled={!isDoctor} {...regMain('medicalHistory')} rows={2} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Khám lâm sàng</label>
                              <textarea disabled={!isDoctor} {...regMain('clinicalExam')} rows={3} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Tóm tắt KQ CLS</label>
                              <textarea disabled={!isDoctor} {...regMain('subclinicalResults')} rows={3} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500" />
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <label className="block text-xs font-bold text-blue-700 mb-1">Hướng điều trị</label>
                              <textarea disabled={!isDoctor} {...regMain('treatmentDirection')} rows={3} className="w-full p-2 border border-blue-200 rounded-lg text-sm disabled:bg-white/50 disabled:text-slate-700" />
                          </div>
                      </form>
                  )}

                  {recordSubTab === 'conclusion' && (
                      <form onSubmit={subConc(d => updateConcMutation.mutate(d))} className="space-y-4">
                          <h3 className="font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
                              Kết luận / Ra viện
                              {isDoctor && (
                                  <button type="submit" disabled={updateConcMutation.isPending} className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-sky-600 shadow-sm">
                                      <i className="fa-solid fa-floppy-disk mr-1"></i>Lưu
                                  </button>
                              )}
                          </h3>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Chẩn đoán ra viện</label>
                              <input disabled={!isDoctor} {...regConc('dischargeDiagnosis')} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Kết quả điều trị</label>
                              <select disabled={!isDoctor} {...regConc('treatmentResult')} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500">
                                  <option value="Đỡ">Đỡ / Giảm</option>
                                  <option value="Khỏi">Khỏi</option>
                                  <option value="Nặng">Nặng hơn</option>
                                  <option value="Chuyển viện">Chuyển viện</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Lời dặn</label>
                              <textarea disabled={!isDoctor} {...regConc('dischargeAdvice')} rows={3} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-500" />
                          </div>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* CONTENT: DOCUMENTS */}
      {activeTab === 'files' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px]">
              {/* Category Tree - Responsive Height */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto p-4 max-h-[200px] md:max-h-full">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Danh mục hồ sơ</h3>
                  <ul className="space-y-2">
                      {categories?.map(cat => (
                          <li key={cat.code}>
                              <div className="font-bold text-slate-700 text-sm mb-1">{cat.name}</div>
                              <ul className="pl-4 border-l-2 border-slate-100 space-y-1">
                                  {cat.children?.map(child => (
                                      <li 
                                        key={child.code}
                                        onClick={() => setSelectedCategory(child.code)}
                                        className={`text-sm cursor-pointer px-2 py-1 rounded hover:bg-slate-50 ${selectedCategory === child.code ? 'bg-blue-50 text-primary font-medium' : 'text-slate-600'}`}
                                      >
                                          <i className="fa-regular fa-folder mr-2"></i>{child.name}
                                      </li>
                                  ))}
                              </ul>
                          </li>
                      ))}
                  </ul>
              </div>

              {/* File List & Upload */}
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[300px]">
                   <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                       <div>
                           <div className="text-xs text-slate-500 mb-0.5">Danh mục đang chọn</div>
                           <h3 className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                               {selectedCategory ? categories?.flatMap(c => c.children).find(x => x?.code === selectedCategory)?.name : 'Vui lòng chọn danh mục'}
                           </h3>
                       </div>
                       
                       {selectedCategory && (
                           <label className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-sky-600 transition flex items-center whitespace-nowrap">
                               <i className="fa-solid fa-camera mr-2"></i><span className="hidden sm:inline">Upload File</span>
                               <input type="file" className="hidden" onChange={handleFileUpload} />
                           </label>
                       )}
                   </div>
                   
                   <div className="flex-1 overflow-y-auto">
                       {!selectedCategory ? (
                           <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                               <p>Chọn một loại hồ sơ để xem hoặc tải lên.</p>
                           </div>
                       ) : (
                           files?.length === 0 ? (
                               <div className="text-center py-10 text-slate-400 text-sm">Chưa có tài liệu nào trong mục này.</div>
                           ) : (
                               <div className="space-y-2">
                                   {files?.map(file => (
                                       <div key={file.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                                           <div className="flex items-center gap-3 overflow-hidden">
                                               <div className="w-8 h-8 bg-red-100 text-red-500 rounded flex flex-shrink-0 items-center justify-center">
                                                   <i className={`fa-solid ${file.extension === 'pdf' ? 'fa-file-pdf' : 'fa-file-image'}`}></i>
                                               </div>
                                               <div className="min-w-0">
                                                   <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                                                   <p className="text-[10px] text-slate-400">{new Date(file.uploadDate).toLocaleDateString()} • {file.size}</p>
                                               </div>
                                           </div>
                                           <button className="text-slate-400 hover:text-primary px-2"><i className="fa-solid fa-download"></i></button>
                                       </div>
                                   ))}
                               </div>
                           )
                       )}
                   </div>
              </div>
          </div>
      )}

      {/* CONTENT: HISTORY */}
      {activeTab === 'history' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Lịch sử khám chữa bệnh</h3>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                  {historyData?.map(h => (
                      <div key={h.id} className="relative pl-8">
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${h.type === 'TREATMENT' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                          <div className="text-xs text-slate-400 mb-1">{new Date(h.createdDate).toLocaleDateString('vi-VN')}</div>
                          <h4 className="font-bold text-slate-800 text-base">{h.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{h.description}</p>
                          <span className="inline-block mt-2 text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">
                              {h.deptName}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
