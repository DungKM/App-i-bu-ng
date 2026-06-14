import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";

type ScanState = "scanning" | "success" | "error";

interface QRScannerModalProps {
  isOpen: boolean;
  expectedMaLanVaoVien: string | null;
  patientName: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  expectedMaLanVaoVien,
  patientName,
  onSuccess,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [scannedCode, setScannedCode] = useState<string>("");
  const [cameraError, setCameraError] = useState<string>("");

  const stopScanner = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {}
    controlsRef.current = null;
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      readerRef.current = new BrowserMultiFormatReader();

      const controls = await readerRef.current.decodeFromConstraints(
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            const code = result.getText();
            setScannedCode(code);

            if (!expectedMaLanVaoVien || code === expectedMaLanVaoVien) {
              setScanState("success");
              stopScanner();
            } else {
              setScanState("error");
              stopScanner();
            }
          }
          // ignore decode errors – they fire on every empty frame
        }
      );

      controlsRef.current = controls;
    } catch (err: any) {
      setCameraError(
        err?.message?.includes("Permission")
          ? "Không có quyền truy cập camera. Vui lòng cấp quyền camera cho trình duyệt."
          : "Không thể mở camera. Vui lòng kiểm tra thiết bị."
      );
    }
  }, [expectedMaLanVaoVien, stopScanner]);

  useEffect(() => {
    if (!isOpen) return;

    setScanState("scanning");
    setScannedCode("");
    setCameraError("");

    const timeout = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  const handleRetry = () => {
    setScanState("scanning");
    setScannedCode("");
    setCameraError("");
    startScanner();
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleSuccessContinue = () => {
    stopScanner();
    onSuccess();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-safe-top pb-4 pt-8">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Xác minh bệnh nhân
          </div>
          <div className="mt-0.5 text-sm font-black text-white uppercase truncate max-w-[240px]">
            {patientName}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Camera View */}
      <div className="relative mx-6 flex-1 overflow-hidden rounded-[40px] bg-slate-900 border-2 border-slate-800">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Scan overlay */}
        {scanState === "scanning" && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Corner brackets */}
            <div className="relative h-64 w-64">
              <div className="absolute left-0 top-0 h-12 w-12 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute right-0 top-0 h-12 w-12 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-12 w-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-12 w-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
              {/* Scan line */}
              <div className="absolute left-2 right-2 h-1 animate-scan bg-primary shadow-[0_0_20px_rgba(14,165,233,0.8)]" />
            </div>
          </div>
        )}

        {/* Success overlay */}
        {scanState === "success" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/50">
              <i className="fa-solid fa-check text-4xl text-white"></i>
            </div>
            <div className="mt-6 text-center">
              <div className="text-lg font-black uppercase text-emerald-400">Xác minh thành công</div>
              <div className="mt-1 font-mono text-sm text-emerald-200">{scannedCode}</div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {scanState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/90">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-500 shadow-2xl shadow-rose-500/50">
              <i className="fa-solid fa-xmark text-4xl text-white"></i>
            </div>
            <div className="mt-6 text-center px-4">
              <div className="text-lg font-black uppercase text-rose-400">Không khớp bệnh nhân</div>
              <div className="mt-2 text-xs text-rose-300">
                Mã quét: <span className="font-mono font-bold">{scannedCode}</span>
              </div>
              <div className="mt-1 text-xs text-rose-300">
                Mã mong đợi: <span className="font-mono font-bold">{expectedMaLanVaoVien ?? "--"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Camera error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 px-8 text-center">
            <i className="fa-solid fa-camera-slash mb-4 text-4xl text-slate-500"></i>
            <div className="text-sm font-bold text-slate-300">{cameraError}</div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="space-y-3 px-6 pb-safe-bottom pb-10 pt-6">
        {scanState === "scanning" && !cameraError && (
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Hướng camera vào mã QR / barcode trên vòng tay bệnh nhân
            </p>
            {expectedMaLanVaoVien && (
              <p className="mt-2 font-mono text-[10px] text-slate-600">
                Mã lần vào viện: {expectedMaLanVaoVien}
              </p>
            )}
          </div>
        )}

        {scanState === "success" && (
          <button
            onClick={handleSuccessContinue}
            className="w-full rounded-[28px] bg-emerald-500 py-5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/30 active:scale-95"
          >
            <i className="fa-solid fa-arrow-right mr-2"></i>
            Tiếp tục xác nhận thuốc
          </button>
        )}

        {scanState === "error" && (
          <button
            onClick={handleRetry}
            className="w-full rounded-[28px] bg-white py-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-xl active:scale-95"
          >
            <i className="fa-solid fa-rotate-right mr-2"></i>
            Quét lại
          </button>
        )}

        <button
          onClick={handleClose}
          className="w-full py-3 text-xs font-black uppercase tracking-widest text-slate-500"
        >
          Hủy
        </button>
      </div>
    </div>,
    document.body
  );
};
