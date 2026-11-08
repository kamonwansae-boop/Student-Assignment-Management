import React, { useEffect, useState } from 'react';
import { X, Save, GraduationCap, School } from 'lucide-react';
import { Subject } from '../../types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit: Subject | null;
  onSave: (subjectData: {
    id?: string;
    code: string;
    name: string;
    grade: string;
    room: string;
  }) => void;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  subjectToEdit,
  onSave,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('ม.1');
  const [room, setRoom] = useState('ALL');
  const [customRoom, setCustomRoom] = useState('');
  const [isCustomRoom, setIsCustomRoom] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setCode(subjectToEdit.code);
        setName(subjectToEdit.name);
        setGrade(subjectToEdit.grade);
        const existingRoom = subjectToEdit.room || 'ALL';
        if (['ALL', 'ทุกห้อง', '1', '2', '3', '4', '5', '6'].includes(existingRoom)) {
          setRoom(existingRoom === 'ทุกห้อง' ? 'ALL' : existingRoom);
          setIsCustomRoom(false);
          setCustomRoom('');
        } else {
          setRoom('CUSTOM');
          setIsCustomRoom(true);
          setCustomRoom(existingRoom.replace(/^ห้อง\s*/, ''));
        }
      } else {
        setCode('');
        setName('');
        setGrade('ม.1');
        setRoom('ALL');
        setIsCustomRoom(false);
        setCustomRoom('');
      }
    }
  }, [isOpen, subjectToEdit]);

  if (!isOpen) return null;

  const handleRoomSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomRoom(true);
      setRoom('CUSTOM');
    } else {
      setIsCustomRoom(false);
      setRoom(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    let finalRoom = room;
    if (isCustomRoom) {
      finalRoom = customRoom.trim() || 'ALL';
    }

    onSave({
      id: subjectToEdit?.id,
      code: code.trim(),
      name: name.trim(),
      grade,
      room: finalRoom,
    });
    onClose();
  };

  const currentRoomLabel =
    room === 'ALL'
      ? 'ทุกห้อง'
      : isCustomRoom
      ? customRoom ? `ห้อง ${customRoom}` : 'ทุกห้อง'
      : `ห้อง ${room}`;

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
          {subjectToEdit ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              รหัสวิชา: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="เช่น ว30221, ว31101 หรือ ค21101"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อรายวิชา: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เคมี 1 หรือ วิทยาศาสตร์ชีวภาพ"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
            />
          </div>

          {/* Grade & Room Grid Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>ระดับชั้น: <span className="text-rose-500">*</span></span>
              </label>
              <select
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
              >
                <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
                <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
                <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-indigo-600" />
                <span>ห้องเรียน: <span className="text-rose-500">*</span></span>
              </label>
              <select
                required
                value={isCustomRoom ? 'CUSTOM' : room}
                onChange={handleRoomSelectChange}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
              >
                <option value="ALL">ทุกห้องเรียน (ทุกห้อง)</option>
                <option value="1">ห้อง 1</option>
                <option value="2">ห้อง 2</option>
                <option value="3">ห้อง 3</option>
                <option value="4">ห้อง 4</option>
                <option value="5">ห้อง 5</option>
                <option value="6">ห้อง 6</option>
                <option value="CUSTOM">ระบุห้องอื่น...</option>
              </select>
            </div>
          </div>

          {/* Custom Room Input if selected */}
          {isCustomRoom && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="block font-bold text-slate-700 mb-1">
                ระบุหมายเลขห้องเรียน:
              </label>
              <input
                type="text"
                required
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                placeholder="เช่น 7, 8 หรือ กิฟต์เต็ด"
                className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
              />
            </div>
          )}

          {/* Preview Badge */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-2.5 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
            <span className="text-slate-600">ตัวอย่างการแสดงผล:</span>
            <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm text-indigo-700">
              {name || 'ชื่อวิชา'} ({grade} {currentRoomLabel})
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลวิชา</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
