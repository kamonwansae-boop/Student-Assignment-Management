import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Assignment, Subject } from '../../types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentToEdit: Assignment | null;
  subjects: Subject[];
  onSave: (assignmentData: {
    id?: string;
    title: string;
    subjectId: string;
    maxScore: number;
    materialUrl?: string;
    dueDate: string;
  }) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignmentToEdit,
  subjects,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [materialUrl, setMaterialUrl] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (assignmentToEdit) {
        setTitle(assignmentToEdit.title);
        setSubjectId(assignmentToEdit.subjectId);
        setMaxScore(assignmentToEdit.maxScore);
        setMaterialUrl(assignmentToEdit.materialUrl || '');
        setDueDate(assignmentToEdit.dueDate || '');
      } else {
        setTitle('');
        setSubjectId(subjects[0]?.id || '');
        setMaxScore(10);
        setMaterialUrl('');

        // Default due date: 7 days from now formatted for datetime-local
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDueDate(d.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, assignmentToEdit, subjects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !dueDate) return;

    onSave({
      id: assignmentToEdit?.id,
      title: title.trim(),
      subjectId,
      maxScore: Number(maxScore) || 10,
      materialUrl: materialUrl.trim(),
      dueDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
          {assignmentToEdit ? 'แก้ไขงานที่มอบหมาย' : 'สร้างงานใหม่'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่องานสั่งการบ้าน: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ใบงานเรื่องการสังเคราะห์แสง หรือ รายงานคณิตศาสตร์"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                เลือกรายวิชา: <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
              >
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
              <label className="block font-bold text-slate-700 mb-1">
                คะแนนเต็ม: <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={1000}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              แนบลิงก์ใบงาน / คำชี้แจง (ถ้ามี):
            </label>
            <input
              type="url"
              value={materialUrl}
              onChange={(e) => setMaterialUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              กำหนดวันส่งงาน (Due Date): <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลงาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
