import React from 'react';
import { GraduationCap, UserCheck, ShieldCheck } from 'lucide-react';
import { Role } from '../types';

interface HeaderProps {
  schoolName: string;
  schoolLogo: string | null;
  currentRole: Role;
  onSwitchRole: (role: Role) => void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolName,
  schoolLogo,
  currentRole,
  onSwitchRole,
}) => {
  return (
    <header className="glass-header sticky top-0 z-40 shadow-xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & School Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center p-1 border border-white/30 overflow-hidden shadow-sm">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt="School Logo"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-wide truncate">
              ระบบ Student Assignment Management
            </h1>
            <p className="text-[10px] sm:text-xs text-sky-200 truncate">{schoolName}</p>
          </div>
        </div>

        {/* Role View Switcher */}
        <div className="flex items-center bg-slate-900/80 p-1.5 rounded-xl border border-white/10 shadow-inner">
          <button
            id="btnSwitchStudent"
            onClick={() => onSwitchRole('student')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
              currentRole === 'student'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span><span className="hidden sm:inline">มุมมอง</span>นักเรียน</span>
          </button>
          <button
            id="btnSwitchTeacher"
            onClick={() => onSwitchRole('teacher')}
            className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
              currentRole === 'teacher'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span><span className="hidden sm:inline">มุมมอง</span>คุณครู</span>
          </button>
        </div>
      </div>
    </header>
  );
};
