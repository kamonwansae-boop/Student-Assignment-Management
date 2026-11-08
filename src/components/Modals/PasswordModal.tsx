import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPassword?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPassword = 'admin1234',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">ยืนยันรหัสผ่าน ADMIN</h3>
          <p className="text-xs text-slate-500">
            กรุณากรอกรหัสผ่านเพื่อเข้าสู่มุมมองคุณครู (รหัสตั้งต้น: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">admin1234</code>)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="กรอกรหัสผ่าน..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                error
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white'
              }`}
            />
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
