import React, { useState } from 'react';
import { Users, UserPlus, QrCode, Edit, Trash2, Filter } from 'lucide-react';
import { Student } from '../../types';

interface StudentsTabProps {
  students: Student[];
  onOpenNewStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onGenerateQR: (student: Student) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  onOpenNewStudent,
  onEditStudent,
  onDeleteStudent,
  onGenerateQR,
}) => {
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');

  const filteredStudents = students.filter((std) => {
    if (gradeFilter !== 'ALL' && std.grade !== gradeFilter) return false;
    if (roomFilter !== 'ALL' && std.room !== roomFilter) return false;
    return true;
  });

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            จัดการข้อมูลนักเรียน & เจน QR Code
          </h3>
          <p className="text-xs text-slate-500">
            เพิ่มรายชื่อ สร้าง QR Code สำหรับสแกนส่งงาน และตัวกรองห้องเรียน
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewStudent}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มนักเรียนใหม่</span>
        </button>
      </div>

      {/* Filters for Students */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>กรองระดับชั้น:</span>
          </label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">แสดงทุกระดับชั้น (ม.1 - ม.6)</option>
            <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
            <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
            <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
            <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
            <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
            <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>กรองห้องเรียน:</span>
          </label>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">แสดงทุกห้องเรียน</option>
            <option value="1">ห้อง 1</option>
            <option value="2">ห้อง 2</option>
            <option value="3">ห้อง 3</option>
            <option value="4">ห้อง 4</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <th className="p-3.5">เลขประจำตัว</th>
              <th className="p-3.5">ชื่อ-นามสกุล</th>
              <th className="p-3.5">ระดับชั้น / ห้อง</th>
              <th className="p-3.5 text-center">เลขที่</th>
              <th className="p-3.5 text-center">สร้าง QR Code</th>
              <th className="p-3.5 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  ไม่พบข้อมูลนักเรียนตามเงื่อนไขตัวกรอง
                </td>
              </tr>
            ) : (
              filteredStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-mono text-slate-800 font-bold">{std.id}</td>
                  <td className="p-3.5 font-bold text-slate-900">{std.name}</td>
                  <td className="p-3.5 text-slate-600">
                    {std.grade}/{std.room}
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-800">{std.number}</td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onGenerateQR(std)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>เจน QR Code</span>
                    </button>
                  </td>
                  <td className="p-3.5 text-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onEditStudent(std)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 p-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`ยืนยันการลบนักเรียน "${std.name}" หรือไม่?`)) {
                          onDeleteStudent(std.id);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
