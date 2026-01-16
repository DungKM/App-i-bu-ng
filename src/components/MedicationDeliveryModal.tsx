
import React, { useState, useRef, useEffect } from 'react';
import { MedicationDeliveryProof } from '@/src/types';
import { SignatureCapture } from './SignatureCapture';

interface Props {
  patientName: string;
  onConfirm: (proof: MedicationDeliveryProof) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type Step = 'INFO' | 'ID_CAPTURE' | 'SIGNATURE';

// Dummy base64 images for simulation
const DEMO_ID_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2364748b'%3ECCCD (Ảnh mẫu)%3C/text%3E%3C/svg%3E";

export const MedicationDeliveryModal: React.FC<Props> = ({ patientName, onConfirm, onCancel, isLoading }) => {
  const [step, setStep] = useState<Step>('INFO');
  
  // Data State
  const [receiverType, setReceiverType] = useState<'PATIENT' | 'FAMILY'>('PATIENT');
  const [receiverName, setReceiverName] = useState(patientName);
  const [receiverIdCard, setReceiverIdCard] = useState('');
  
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Helper: Start Camera
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Trình duyệt không hỗ trợ camera.");
        return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Video play error:", e));
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Camera access failed or cancelled:", err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError("Không thể truy cập camera (Từ chối quyền).");
      } else {
          setCameraError("Không thể truy cập camera.");
      }
    }
  };

  // Helper: Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Helper: Capture Frame
  const captureImage = () => {
    if (videoRef.current && !cameraError) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      stopCamera();
      return base64;
    }
    return null;
  };

  const handleNext = () => {
    if (step === 'INFO') {
      if (receiverType === 'FAMILY' && (!receiverName || !receiverIdCard)) return alert("Vui lòng nhập đầy đủ thông tin người nhận thay.");
      setStep('ID_CAPTURE');
      setTimeout(startCamera, 100);
    } else if (step === 'ID_CAPTURE') {
      if (!idCardImage) {
          const img = captureImage();
          if (img) setIdCardImage(img);
      } else {
          setStep('SIGNATURE');
      }
    }
  };

  const handleSubmit = (sig: string) => {
    setSignature(sig);
    onConfirm({
      receiverType,
      receiverName,
      receiverIdCard: receiverType === 'FAMILY' ? receiverIdCard : undefined,
      receiverIdCardImage: idCardImage || undefined,
      signature: sig,
      timestamp: new Date().toISOString()
    });
  };

  // --- RENDER STEPS ---
  
  if (step === 'SIGNATURE') {
    return (
        <SignatureCapture 
            title="Xác nhận & Ký tên" 
            description="Vui lòng ký để hoàn tất quá trình nhận thuốc"
            onSave={handleSubmit} 
            onCancel={() => { setStep('ID_CAPTURE'); setTimeout(startCamera, 100); }} 
        />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
            <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Xác thực dùng thuốc</h3>
                <div className="flex gap-1.5 mt-2">
                    <div className={`h-1.5 w-12 rounded-full transition-all ${step === 'INFO' ? 'bg-primary' : 'bg-green-500'}`}></div>
                    <div className={`h-1.5 w-12 rounded-full transition-all ${step === 'ID_CAPTURE' ? 'bg-primary' : (step === 'INFO' ? 'bg-slate-200' : 'bg-green-500')}`}></div>
                    <div className={`h-1.5 w-12 rounded-full transition-all bg-slate-200`}></div>
                </div>
            </div>
            <button onClick={onCancel} disabled={isLoading} className="w-10 h-10 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 disabled:opacity-50 transition flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-primary py-10">
                    <i className="fa-solid fa-circle-notch fa-spin text-5xl mb-6"></i>
                    <p className="font-black uppercase tracking-widest text-xs">Đang xử lý dữ liệu...</p>
                </div>
            ) : (
                <>
                {/* STEP 1: INFO */}
                {step === 'INFO' && (
                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Người trực tiếp nhận thuốc</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`border-2 rounded-[24px] p-6 cursor-pointer transition-all duration-300 ${receiverType === 'PATIENT' ? 'border-primary bg-blue-50 shadow-lg shadow-primary/10' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="rtype" className="hidden" checked={receiverType === 'PATIENT'} onChange={() => { setReceiverType('PATIENT'); setReceiverName(patientName); }} />
                                    <div className="text-center">
                                        <i className={`fa-solid fa-hospital-user text-3xl mb-3 ${receiverType === 'PATIENT' ? 'text-primary' : 'text-slate-300'}`}></i>
                                        <div className="font-black text-sm uppercase">Bệnh nhân</div>
                                    </div>
                                </label>
                                <label className={`border-2 rounded-[24px] p-6 cursor-pointer transition-all duration-300 ${receiverType === 'FAMILY' ? 'border-primary bg-blue-50 shadow-lg shadow-primary/10' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="rtype" className="hidden" checked={receiverType === 'FAMILY'} onChange={() => { setReceiverType('FAMILY'); setReceiverName(''); }} />
                                    <div className="text-center">
                                        <i className={`fa-solid fa-users text-3xl mb-3 ${receiverType === 'FAMILY' ? 'text-primary' : 'text-slate-300'}`}></i>
                                        <div className="font-black text-sm uppercase">Người nhà</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {receiverType === 'FAMILY' && (
                            <div className="space-y-5 animate-fade-in-up">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ tên người nhận thay</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-primary uppercase" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="NGUYỄN VĂN A" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số CCCD / CMND</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 focus:ring-2 focus:ring-primary" value={receiverIdCard} onChange={e => setReceiverIdCard(e.target.value)} placeholder="01234567890" />
                                </div>
                            </div>
                        )}

                        {receiverType === 'PATIENT' && (
                            <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100 text-blue-900 text-sm flex items-start gap-4">
                                <i className="fa-solid fa-circle-info text-primary text-xl mt-1"></i>
                                <div className="font-medium leading-relaxed">
                                    Hệ thống ghi nhận bệnh nhân <b>{patientName}</b> trực tiếp nhận thuốc dưới sự giám sát của điều dưỡng.
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: ID CAPTURE */}
                {step === 'ID_CAPTURE' && (
                    <div className="flex flex-col items-center">
                        <h4 className="font-black text-xl mb-6 text-center uppercase tracking-tight">Chụp giấy tờ tùy thân</h4>
                        <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-[32px] overflow-hidden mb-6 border-4 border-slate-100 shadow-2xl flex items-center justify-center">
                            {idCardImage ? (
                                <img src={idCardImage} className="w-full h-full object-cover" alt="ID" />
                            ) : (
                                <>
                                    {!cameraError ? (
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                                    ) : (
                                        <div className="text-center text-white p-8">
                                            <i className="fa-solid fa-camera-rotate text-4xl mb-4 text-slate-500"></i>
                                            <p className="text-sm font-bold opacity-60">{cameraError}</p>
                                        </div>
                                    )}
                                    {!cameraError && <div className="absolute inset-0 border-2 border-white/20 m-6 rounded-2xl pointer-events-none"></div>}
                                    {!cameraError && (
                                        <div className="absolute bottom-6 left-0 right-0 text-center text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">
                                            Vui lòng đặt CCCD/BHYT vào khung
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        
                        {!idCardImage ? (
                            <div className="flex flex-col gap-4 w-full items-center">
                                {!cameraError && (
                                    <button onClick={() => setIdCardImage(captureImage())} className="w-20 h-20 bg-white border-8 border-slate-100 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition transform">
                                        <div className="w-12 h-12 bg-primary rounded-full shadow-inner"></div>
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIdCardImage(DEMO_ID_IMAGE)}
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition"
                                >
                                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Dùng ảnh mẫu (Demo)
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => { setIdCardImage(null); startCamera(); }} className="px-8 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Chụp lại</button>
                        )}
                    </div>
                )}
                </>
            )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
        <div className="p-5 border-t bg-white flex justify-end gap-3">
             {step === 'INFO' && (
                 <button onClick={handleNext} className="bg-primary text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest w-full hover:bg-sky-600 shadow-xl shadow-primary/20 transition transform active:scale-95">
                    Tiếp tục <i className="fa-solid fa-arrow-right ml-2"></i>
                 </button>
             )}
             
             {step === 'ID_CAPTURE' && idCardImage && (
                 <button onClick={handleNext} className="bg-success text-white px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest w-full hover:bg-green-600 shadow-xl shadow-green-200 transition transform active:scale-95">
                    Ký xác nhận <i className="fa-solid fa-pen-nib ml-2"></i>
                 </button>
             )}
        </div>
        )}
      </div>
    </div>
  );
};