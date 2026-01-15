
import React, { useState, useRef, useEffect } from 'react';
import { MedicationDeliveryProof } from '../types';
import { SignatureCapture } from './SignatureCapture';

interface Props {
  patientName: string;
  onConfirm: (proof: MedicationDeliveryProof) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type Step = 'INFO' | 'ID_CAPTURE' | 'FACE_CAPTURE' | 'SIGNATURE';

// Dummy base64 images for simulation
const DEMO_ID_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2364748b'%3ECCCD (Anh mau)%3C/text%3E%3C/svg%3E";
const DEMO_FACE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e2e8f0'/%3E%3Ccircle cx='150' cy='120' r='60' fill='%23cbd5e1'/%3E%3Cpath d='M90 250 Q150 300 210 250' stroke='%2394a3b8' stroke-width='5' fill='none'/%3E%3Ctext x='50%25' y='90%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3EFace ID (Mau)%3C/text%3E%3C/svg%3E";

export const MedicationDeliveryModal: React.FC<Props> = ({ patientName, onConfirm, onCancel, isLoading }) => {
  const [step, setStep] = useState<Step>('INFO');
  
  // Data State
  const [receiverType, setReceiverType] = useState<'PATIENT' | 'FAMILY'>('PATIENT');
  const [receiverName, setReceiverName] = useState(patientName);
  const [receiverIdCard, setReceiverIdCard] = useState('');
  
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [signature, setSignature] = useState<string | null>(null);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          setStep('FACE_CAPTURE');
          setTimeout(startCamera, 100);
      }
    } else if (step === 'FACE_CAPTURE') {
        if (!faceImage) {
            const img = captureImage();
            if (img) setFaceImage(img);
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
      receiverFaceImage: faceImage || undefined,
      signature: sig,
      timestamp: new Date().toISOString()
    });
  };

  // --- RENDER STEPS ---
  
  // 1. Signature Step (Reusing component)
  if (step === 'SIGNATURE') {
    return (
        <SignatureCapture 
            title="Xác nhận & Ký tên" 
            description="Vui lòng ký để hoàn tất quá trình nhận thuốc"
            onSave={handleSubmit} 
            onCancel={() => setStep('FACE_CAPTURE')} 
        />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <div>
                <h3 className="font-bold text-slate-800">Xác thực nhận thuốc</h3>
                <div className="flex gap-1 mt-1">
                    <div className={`h-1 w-8 rounded ${step === 'INFO' ? 'bg-primary' : 'bg-green-500'}`}></div>
                    <div className={`h-1 w-8 rounded ${step === 'ID_CAPTURE' ? 'bg-primary' : (step === 'INFO' ? 'bg-slate-200' : 'bg-green-500')}`}></div>
                    <div className={`h-1 w-8 rounded ${step === 'FACE_CAPTURE' ? 'bg-primary' : 'bg-slate-200'}`}></div>
                    <div className={`h-1 w-8 rounded bg-slate-200`}></div>
                </div>
            </div>
            <button onClick={onCancel} disabled={isLoading} className="w-8 h-8 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 disabled:opacity-50"><i className="fa-solid fa-xmark"></i></button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-primary">
                    <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
                    <p>Đang xử lý dữ liệu...</p>
                </div>
            ) : (
                <>
                {/* STEP 1: INFO */}
                {step === 'INFO' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Người nhận thuốc là ai?</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`border-2 rounded-xl p-4 cursor-pointer transition ${receiverType === 'PATIENT' ? 'border-primary bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="rtype" className="hidden" checked={receiverType === 'PATIENT'} onChange={() => { setReceiverType('PATIENT'); setReceiverName(patientName); }} />
                                    <div className="text-center">
                                        <i className="fa-solid fa-hospital-user text-2xl mb-2 text-slate-500"></i>
                                        <div className="font-bold text-sm">Chính chủ</div>
                                        <div className="text-xs text-slate-400">(Bệnh nhân)</div>
                                    </div>
                                </label>
                                <label className={`border-2 rounded-xl p-4 cursor-pointer transition ${receiverType === 'FAMILY' ? 'border-primary bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <input type="radio" name="rtype" className="hidden" checked={receiverType === 'FAMILY'} onChange={() => { setReceiverType('FAMILY'); setReceiverName(''); }} />
                                    <div className="text-center">
                                        <i className="fa-solid fa-users text-2xl mb-2 text-slate-500"></i>
                                        <div className="font-bold text-sm">Người nhà</div>
                                        <div className="text-xs text-slate-400">(Được ủy quyền)</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {receiverType === 'FAMILY' && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">Họ tên người nhận thay</label>
                                    <input type="text" className="w-full p-2 border rounded-lg mt-1 uppercase" value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="NGUYEN VAN A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700">Số CCCD / CMND</label>
                                    <input type="text" className="w-full p-2 border rounded-lg mt-1" value={receiverIdCard} onChange={e => setReceiverIdCard(e.target.value)} placeholder="01234567890" />
                                </div>
                            </div>
                        )}

                        {receiverType === 'PATIENT' && (
                            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                                <i className="fa-solid fa-info-circle mr-2"></i>
                                Xác nhận bệnh nhân <b>{patientName}</b> trực tiếp nhận thuốc.
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: ID CAPTURE */}
                {step === 'ID_CAPTURE' && (
                    <div className="flex flex-col items-center">
                        <h4 className="font-bold text-lg mb-4 text-center">Chụp giấy tờ tùy thân (CCCD/BHYT)</h4>
                        <div className="relative w-full aspect-[3/2] bg-slate-900 rounded-lg overflow-hidden mb-4 border-2 border-slate-300 flex items-center justify-center">
                            {idCardImage ? (
                                <img src={idCardImage} className="w-full h-full object-cover" alt="ID" />
                            ) : (
                                <>
                                    {!cameraError ? (
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                                    ) : (
                                        <div className="text-center text-white p-4">
                                            <i className="fa-solid fa-camera-rotate text-3xl mb-2 text-slate-500"></i>
                                            <p className="text-sm">{cameraError}</p>
                                        </div>
                                    )}
                                    {!cameraError && <div className="absolute inset-0 border-4 border-white/30 m-4 rounded pointer-events-none"></div>}
                                    {!cameraError && <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs drop-shadow-md">Đặt giấy tờ vào khung</div>}
                                </>
                            )}
                        </div>
                        
                        {!idCardImage ? (
                            <div className="flex flex-col gap-3 w-full max-w-xs items-center">
                                {!cameraError && (
                                    <button onClick={() => setIdCardImage(captureImage())} className="w-16 h-16 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition">
                                        <div className="w-12 h-12 bg-primary rounded-full"></div>
                                    </button>
                                )}
                                {/* SIMULATION BUTTON */}
                                <button 
                                    onClick={() => setIdCardImage(DEMO_ID_IMAGE)}
                                    className={`text-xs text-slate-400 underline hover:text-slate-600 ${cameraError ? 'animate-pulse text-primary font-bold' : ''}`}
                                >
                                    <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>Dùng ảnh mẫu (Demo)
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => { setIdCardImage(null); startCamera(); }} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Chụp lại</button>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: FACE CAPTURE */}
                {step === 'FACE_CAPTURE' && (
                    <div className="flex flex-col items-center">
                        <h4 className="font-bold text-lg mb-4 text-center">Xác thực khuôn mặt</h4>
                        <div className="relative w-64 h-64 bg-slate-900 rounded-full overflow-hidden mb-4 border-4 border-primary shadow-xl flex items-center justify-center">
                            {faceImage ? (
                                <img src={faceImage} className="w-full h-full object-cover" alt="Face" />
                            ) : (
                                <>
                                    {!cameraError ? (
                                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                                    ) : (
                                        <div className="text-center text-white p-4">
                                            <i className="fa-solid fa-video-slash text-2xl mb-2 text-slate-500"></i>
                                            <p className="text-xs">{cameraError}</p>
                                        </div>
                                    )}
                                    {!cameraError && <div className="absolute inset-0 bg-transparent border-[40px] border-black/30 rounded-full pointer-events-none"></div>}
                                </>
                            )}
                        </div>
                        
                        {!faceImage ? (
                            <div className="flex flex-col gap-3 w-full max-w-xs items-center">
                                {!cameraError && <p className="text-center text-sm text-slate-500 mb-2">Vui lòng nhìn thẳng vào camera</p>}
                                {!cameraError && (
                                    <button onClick={() => setFaceImage(captureImage())} className="w-16 h-16 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition">
                                        <div className="w-12 h-12 bg-primary rounded-full"></div>
                                    </button>
                                )}
                                {/* SIMULATION BUTTON */}
                                <button 
                                    onClick={() => setFaceImage(DEMO_FACE_IMAGE)}
                                    className={`text-xs text-slate-400 underline hover:text-slate-600 ${cameraError ? 'animate-pulse text-primary font-bold' : ''}`}
                                >
                                    <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>Dùng ảnh mẫu (Demo)
                                </button>
                            </div>
                        ) : (
                            <div className="text-center animate-fade-in">
                                <div className="text-green-500 text-xl font-bold mb-4 flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-circle-check"></i> Khuôn mặt hợp lệ
                                </div>
                                <button onClick={() => { setFaceImage(null); startCamera(); }} className="text-sm text-slate-400 underline">Chụp lại</button>
                            </div>
                        )}
                    </div>
                )}
                </>
            )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
        <div className="p-4 border-t bg-white flex justify-end gap-3">
             {step !== 'INFO' && !idCardImage && !faceImage && (
                 <button onClick={stopCamera} className="hidden"></button> /* Cleanup helper */
             )}

             {step === 'INFO' && (
                 <button onClick={handleNext} className="bg-primary text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-sky-600">Tiếp tục <i className="fa-solid fa-arrow-right ml-1"></i></button>
             )}
             
             {step === 'ID_CAPTURE' && idCardImage && (
                 <button onClick={handleNext} className="bg-primary text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-sky-600">Xác nhận ID <i className="fa-solid fa-check ml-1"></i></button>
             )}

             {step === 'FACE_CAPTURE' && faceImage && (
                 <button onClick={handleNext} className="bg-success text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-green-600 shadow-lg shadow-green-200">
                    Ký xác nhận <i className="fa-solid fa-pen-nib ml-1"></i>
                 </button>
             )}
        </div>
        )}
      </div>
    </div>
  );
};
