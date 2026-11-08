import React, { useState } from 'react';
import { FileSpreadsheet, Download, Filter, Check } from 'lucide-react';
import { Assignment, Student, Subject, Submission } from '../../types';
import { filterReportData } from '../../utils/assignmentLogic';
import { exportSubmissionsToExcel } from '../../utils/storage';

interface ReportsTabProps {
  submissions: Submission[];
  students: Student[];
  assignments: Assignment[];
  subjects: Subject[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  submissions,
  students,
  assignments,
  subjects,
}) => {
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [exported, setExported] = useState(false);

  const filteredSubs = filterReportData(
    submissions,
    students,
    assignments,
    subjects,
    {
      subjectId: subjectFilter,
      grade: gradeFilter,
      room: roomFilter,
    }
  );

  const handleExport = () => {
    exportSubmissionsToExcel(filteredSubs, students, assignments, subjects);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>สรุปผลคะแนนและออกรายงาน</span>
          </h3>
          <p className="text-xs text-slate-500">
            กรองตามรายวิชา, ระดับชั้น ม.1-6 และห้องเรียน เพื่อดาวน์โหลดไฟล์ Excel
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          {exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>{exported ? 'ส่งออกไฟล์เรียบร้อย!' : 'พิมพ์ / ส่งออก Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>รายวิชา:</span>
          </label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">ทุกรายวิชา</option>
            {subjects.map((s) => {
              const roomLabel =
                !s.room || s.room === 'ALL' || s.room === 'ทุกห้อง'
                  ? 'ทุกห้อง'
                  : s.room.startsWith('ห้อง')
                  ? s.room
                  : `ห้อง ${s.room}`;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code} - {s.grade} {roomLabel})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>ระดับชั้น:</span>
          </label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">ทุกระดับชั้น (ม.1 - ม.6)</option>
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
            <span>ห้องเรียน:</span>
          </label>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="ALL">ทุกห้องเรียน</option>
            <option value="1">ห้อง 1</option>
            <option value="2">ห้อง 2</option>
            <option value="3">ห้อง 3</option>
            <option value="4">ห้อง 4</option>
          </select>
        </div>
      </div>

      {/* Report Table Preview */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-indigo-900 text-white text-xs font-bold uppercase">
              <th className="p-3">เลขประจำตัว</th>
              <th className="p-3">ชื่อ-นามสกุล</th>
              <th className="p-3">ชั้น/ห้อง</th>
              <th className="p-3">รายวิชา</th>
              <th className="p-3">ชื่องาน</th>
              <th className="p-3 text-center">สถานะการตรวจ</th>
              <th className="p-3 text-center">คะแนนที่ได้</th>
              <th className="p-3 text-center">คะแนนเต็ม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredSubs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  ไม่พบข้อมูลตามเงื่อนไขตัวกรอง
                </td>
              </tr>
            ) : (
              filteredSubs.map((sub) => {
                const student = students.find((s) => s.id === sub.studentId);
                const assign = assignments.find((a) => a.id === sub.assignmentId);
                const subject = subjects.find((s) => s.id === assign?.subjectId);

                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-700">{student?.id}</td>
                    <td className="p-3 font-bold text-slate-900">{student?.name}</td>
                    <td className="p-3 text-slate-600">
                      {student ? `${student.grade}/${student.room}` : '-'}
                    </td>
                    <td className="p-3 text-indigo-700 font-semibold">
                      <div>{subject?.name}</div>
                      {subject && (
                        <div className="text-[11px] text-slate-500 font-normal">
                          {subject.grade}{' '}
                          {!subject.room || subject.room === 'ALL' || subject.room === 'ทุกห้อง'
                            ? '(ทุกห้อง)'
                            : `(ห้อง ${subject.room})`}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-800">{assign?.title}</td>
                    <td className="p-3 text-center">
                      {sub.graded ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          ตรวจแล้ว
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                          รอตรวจ
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 text-sm">
                      {sub.graded ? sub.score : '-'}
                    </td>
                    <td className="p-3 text-center text-slate-500 font-medium">
                      {assign?.maxScore || 10}
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
