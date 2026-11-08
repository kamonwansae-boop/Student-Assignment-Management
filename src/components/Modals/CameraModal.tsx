import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์ไม่รองรับการเปิดกล้อง');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.warn('Camera error:', err);
      const message = err instanceof Error ? err.message : 'ไม่สามารถเปิดกล้องได้';
      setCameraError(
        message.includes('Permission') || message.includes('denied')
          ? 'กรุณาอนุญาตสิทธิ์การใช้งานกล้องในเบราว์เซอร์'
          : 'ไม่สามารถเชื่อมต่อกล้องถ่ายรูปได้ กรุณาใช้การแนบรูปภาพแทน'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      onCapture(dataUrl);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-md w-full p-5 shadow-2xl relative space-y-4 text-center">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>

        <h4 className="text-base font-bold text-slate-800 flex items-center justify-center gap-2">
          <Camera className="w-5 h-5 text-amber-500" />
          <span>ถ่ายภาพผลงานด้วยกล้อง</span>
        </h4>

        {cameraError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-700 font-semibold">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <button
              type="button"
              onClick={toggleFacingMode}
              className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900/90 text-white p-2 rounded-full backdrop-blur transition"
              title="สลับกล้องหน้า/หลัง"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!!cameraError}
            onClick={handleCapture}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>ถ่ายภาพและแนบส่ง</span>
          </button>
        </div>
      </div>
    </div>
  );
};
