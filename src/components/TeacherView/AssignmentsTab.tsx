import React from 'react';
import { PlusCircle, Edit, Trash2, Calendar, Star, Paperclip, ExternalLink } from 'lucide-react';
import { Assignment, Subject } from '../../types';
import { formatThaiDateTime } from '../../utils/assignmentLogic';

interface AssignmentsTabProps {
  assignments: Assignment[];
  subjects: Subject[];
  onOpenNewAssignment: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  assignments,
  subjects,
  onOpenNewAssignment,
  onEditAssignment,
  onDeleteAssignment,
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            การจัดการงานที่มอบหมายทั้งหมด
          </h3>
          <p className="text-xs text-slate-500">
            สร้าง แก้ไข หรือลบงานสั่งการบ้านของนักเรียนตามรายวิชา
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewAssignment}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>สร้างงานใหม่</span>
        </button>
      </div>

      {/* Assignments list grid */}
      {assignments.length === 0 ? (
        <div className="p-10 text-center text-slate-400 font-bold">
          ยังไม่มีรายการงานที่มอบหมาย คลิก &quot;สร้างงานใหม่&quot; เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assign) => {
            const subject = subjects.find((s) => s.id === assign.subjectId);

            return (
              <div
                key={assign.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 relative hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      {subject?.name || 'ทั่วไป'} ({subject?.grade || ''})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditAssignment(assign)}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                        title="แก้ไขงานนี้"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`ยืนยันการลบงาน "${assign.title}" หรือไม่?`)) {
                            onDeleteAssignment(assign.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition"
                        title="ลบงานนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {assign.title}
                  </h4>

                  <div className="text-xs text-slate-500 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      <span>
                        กำหนดส่ง: <strong>{formatThaiDateTime(assign.dueDate)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        คะแนนเต็ม: <strong>{assign.maxScore} คะแนน</strong>
                      </span>
                    </div>
                  </div>

                  {assign.materialUrl && (
                    <div className="pt-1">
                      <a
                        href={assign.materialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>ดูคำชี้แจงงาน</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
