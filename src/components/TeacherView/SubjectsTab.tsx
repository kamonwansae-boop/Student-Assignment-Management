import React from 'react';
import { BookOpen, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Subject } from '../../types';

interface SubjectsTabProps {
  subjects: Subject[];
  onOpenNewSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const SubjectsTab: React.FC<SubjectsTabProps> = ({
  subjects,
  onOpenNewSubject,
  onEditSubject,
  onDeleteSubject,
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>จัดการรายวิชาเรียน</span>
          </h3>
          <p className="text-xs text-slate-500">เพิ่ม แก้ไข หรือลบข้อมูลรายวิชาในระบบ</p>
        </div>
        <button
          type="button"
          onClick={onOpenNewSubject}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>เพิ่มรายวิชาใหม่</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <th className="p-3.5">รหัสวิชา</th>
              <th className="p-3.5">ชื่อรายวิชา</th>
              <th className="p-3.5">ระดับชั้น / ห้องเรียน</th>
              <th className="p-3.5 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {subjects.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  ยังไม่มีข้อมูลรายวิชาในระบบ
                </td>
              </tr>
            ) : (
              subjects.map((s) => {
                const roomDisplay =
                  !s.room || s.room === 'ALL' || s.room === 'ทุกห้อง'
                    ? 'ทุกห้อง'
                    : s.room.startsWith('ห้อง')
                    ? s.room
                    : `ห้อง ${s.room}`;

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono text-indigo-700 font-bold">{s.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                    <td className="p-3.5 text-slate-700">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-md text-xs font-bold">
                          {s.grade}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-semibold">
                          {roomDisplay}
                        </span>
                      </div>
                    </td>
                  <td className="p-3.5 text-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onEditSubject(s)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 p-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`ยืนยันการลบวิชา "${s.name}" หรือไม่?`)) {
                          onDeleteSubject(s.id);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold inline-flex items-center gap-1 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
