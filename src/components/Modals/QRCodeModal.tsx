import React, { useEffect, useRef, useState } from 'react';
import QRCodeNpm from 'qrcode';
import { X, Copy, Check, Download, QrCode } from 'lucide-react';
import { Student } from '../../types';

declare global {
  interface Window {
    QRCode?: any;
  }
}

interface QRCodeModalProps {
  student: Student | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ student, onClose }) => {
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!student) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    // Format URL parameter as ?student_id=XXX for auto-filling and login
    const url = `${origin}${pathname}?student_id=${student.id}`;
    setDirectUrl(url);

    // Render using QRCode.js CDN if available on window.QRCode
    if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = '';

      if (typeof window !== 'undefined' && window.QRCode) {
        setUsingFallback(false);
        try {
          new window.QRCode(qrContainerRef.current, {
            text: url,
            width: 190,
            height: 190,
            colorDark: '#0f172a',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.H : 2,
          });
          return;
        } catch (err) {
          console.warn('QRCode.js CDN render error, switching to fallback:', err);
        }
      }

      // Fallback to npm package if CDN is unavailable
      setUsingFallback(true);
      if (fallbackCanvasRef.current) {
        QRCodeNpm.toCanvas(fallbackCanvasRef.current, url, {
          width: 190,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        }).catch((err) => console.error('QR code render fallback error:', err));
      }
    }
  }, [student]);

  if (!student) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    let dataUrl = '';

    if (qrContainerRef.current) {
      const canvas = qrContainerRef.current.querySelector('canvas');
      const img = qrContainerRef.current.querySelector('img');
      if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
      } else if (img && img.src) {
        dataUrl = img.src;
      }
    }

    if (!dataUrl && fallbackCanvasRef.current) {
      dataUrl = fallbackCanvasRef.current.toDataURL('image/png');
    }

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `QRCode_${student.id}_${student.name}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1 shadow-sm">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">QR Code สำหรับนักเรียน</h3>
          <p className="text-xs font-semibold text-slate-700">
            {student.name} ({student.grade}/{student.room} เลขที่ {student.number})
          </p>
          <p className="text-[11px] text-slate-500 font-mono">รหัสนักเรียน: {student.id}</p>
        </div>

        {/* QR Code Container rendered via QRCode.js CDN */}
        <div className="flex justify-center p-3 bg-white border border-slate-200 rounded-2xl shadow-inner min-h-[210px] items-center">
          <div
            ref={qrContainerRef}
            className={`flex items-center justify-center ${usingFallback ? 'hidden' : 'block'}`}
          />
          <canvas
            ref={fallbackCanvasRef}
            className={`rounded-lg shadow-sm ${usingFallback ? 'block' : 'hidden'}`}
          />
        </div>

        {/* Target URL Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-left">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">ลิงก์ใน QR Code (?student_id=):</p>
          <p className="text-[11px] text-sky-700 font-mono truncate" title={directUrl}>
            {directUrl}
          </p>
        </div>

        <p className="text-[11px] text-slate-500">
          นักเรียนสามารถใช้มือถือสแกน เพื่อเปิดระบบและกรอกรหัสเข้าสู่บัญชีตัวเองเพื่อส่งงานหรือติดตามงานได้ทันที
        </p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadQR}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>บันทึกรูป QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
