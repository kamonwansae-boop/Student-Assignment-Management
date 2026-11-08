import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface LightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white text-2xl font-bold bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
          aria-label="Close Preview"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt="Enlarged attachment"
          className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/20"
        />
        <div className="mt-3 text-xs text-white/70 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>คลิกที่พื้นหลังหรือปุ่มปิดเพื่อย้อนกลับ</span>
        </div>
      </div>
    </div>
  );
};
