import React, { useEffect, useState } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { Student } from '../../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit: Student | null;
  onSave: (studentData: {
    id: string;
    originalId?: string;
    name: string;
    grade: string;
    room: string;
    number: number;
  }) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  onSave,
}) => {
  const [stdId, setStdId] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('ม.1');
  const [room, setRoom] = useState('1');
  const [number, setNumber] = useState<number | string>(1);

  useEffect(() => {
    if (isOpen) {
      if (studentToEdit) {
        setStdId(studentToEdit.id);
        setName(studentToEdit.name);
        setGrade(studentToEdit.grade);
        setRoom(studentToEdit.room);
        setNumber(studentToEdit.number);
      } else {
        setStdId('');
        setName('');
        setGrade('ม.1');
        setRoom('1');
        setNumber(1);
      }
    }
  }, [isOpen, studentToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdId.trim() || !name.trim()) return;

    onSave({
      id: stdId.trim(),
      originalId: studentToEdit?.id,
      name: name.trim(),
      grade,
      room: room.trim() || '1',
      number: Number(number) || 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
          {studentToEdit ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              เลขประจำตัวนักเรียน: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={stdId}
              onChange={(e) => setStdId(e.target.value)}
              placeholder="เช่น 10001, 10002"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อ - สกุล: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ด.ช. รักเรียน เรียนดี"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ระดับชั้น: <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
              >
                <option value="ม.1">ม.1</option>
                <option value="ม.2">ม.2</option>
                <option value="ม.3">ม.3</option>
                <option value="ม.4">ม.4</option>
                <option value="ม.5">ม.5</option>
                <option value="ม.6">ม.6</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ห้องเรียน / เลขที่: <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="ห้อง (เช่น 1)"
                  className="w-1/2 p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                />
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="เลขที่"
                  className="w-1/2 p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลนักเรียน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
