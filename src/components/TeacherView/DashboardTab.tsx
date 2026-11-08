import React from 'react';
import {
  Users,
  FolderOpen,
  FileCheck2,
  Hourglass,
  History,
  PlusCircle,
  Calendar,
} from 'lucide-react';
import { Assignment, Student, Subject, Submission } from '../../types';
import { calculateDashboardStats, formatThaiDateTime } from '../../utils/assignmentLogic';

interface DashboardTabProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  subjects: Subject[];
  onOpenNewAssignment: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  students,
  assignments,
  submissions,
  subjects,
  onOpenNewAssignment,
}) => {
  const stats = calculateDashboardStats(students, assignments, submissions);

  return (
    <div className="space-y-6">
      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-blue-600 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              จำนวนนักเรียนทั้งหมด
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalStudents}</p>
            <span className="text-xs text-blue-600 font-semibold">คนในระบบ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Assignments */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-amber-500 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              งานที่มอบหมายทั้งหมด
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalAssignments}</p>
            <span className="text-xs text-amber-600 font-semibold">รายการ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-inner">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Total Submitted */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-emerald-500 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              รายการที่ส่งงานแล้ว
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalSubmitted}</p>
            <span className="text-xs text-emerald-600 font-semibold">ครั้งที่ส่ง</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-inner">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Pending for Grading */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-rose-500 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              รายการที่รอตรวจ
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalPending}</p>
            <span className="text-xs text-rose-600 font-semibold">รอครูให้คะแนน</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl shadow-inner">
            <Hourglass className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Assignments Table */}
      <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>ตารางงานที่มอบหมายล่าสุด</span>
          </h3>
          <button
            type="button"
            onClick={onOpenNewAssignment}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>สร้างงานใหม่</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                <th className="p-3.5 text-center w-12">ลำดับ</th>
                <th className="p-3.5">ชื่องาน</th>
                <th className="p-3.5">รายวิชา</th>
                <th className="p-3.5 text-center">กำหนดส่ง</th>
                <th className="p-3.5 text-center">ส่งแล้ว</th>
                <th className="p-3.5 text-center">รอตรวจ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    ยังไม่มีรายการงานที่มอบหมาย
                  </td>
                </tr>
              ) : (
                assignments.map((assign, index) => {
                  const subject = subjects.find((s) => s.id === assign.subjectId);
                  const relatedSubs = submissions.filter((s) => s.assignmentId === assign.id);
                  const subCount = relatedSubs.length;
                  const pendingCount = relatedSubs.filter((s) => !s.graded).length;

                  return (
                    <tr key={assign.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">{assign.title}</td>
                      <td className="p-3.5 text-xs text-sky-700 font-bold">
                        {subject?.name} ({subject?.code || ''})
                      </td>
                      <td className="p-3.5 text-center text-xs text-slate-600">
                        {formatThaiDateTime(assign.dueDate)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                          {subCount} คน
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            pendingCount > 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pendingCount} คน
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
