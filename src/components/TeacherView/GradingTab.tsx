import React, { useState } from 'react';
import {
  PenSquare,
  Save,
  CheckCircle2,
  Clock,
  ExternalLink,
  Paperclip,
  Check,
  Trash2,
  Cloud,
  CheckCircle,
} from 'lucide-react';
import { Assignment, Student, Subject, Submission } from '../../types';
import { formatThaiDateTime } from '../../utils/assignmentLogic';

interface GradingTabProps {
  subjects: Subject[];
  assignments: Assignment[];
  students: Student[];
  submissions: Submission[];
  onSaveGrades: (updatedGrades: Array<{ submissionId: string; score: number }>) => void;
  onGradeAndDelete?: (docId: string, filePath: string, score: number, submissionId: string) => Promise<void>;
  onPreviewImage: (url: string) => void;
}

export const GradingTab: React.FC<GradingTabProps> = ({
  subjects,
  assignments,
  students,
  submissions,
  onSaveGrades,
  onGradeAndDelete,
  onPreviewImage,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const [scoreInputs, setScoreInputs] = useState<Record<string, number | string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter assignments based on selected subject
  const filteredAssignments =
    selectedSubjectId === 'ALL'
      ? assignments
      : assignments.filter((a) => a.subjectId === selectedSubjectId);

  // If current selected assignment not in filtered list, pick the first one
  const activeAssignment =
    filteredAssignments.find((a) => a.id === selectedAssignmentId) ||
    filteredAssignments[0] ||
    null;

  // Submissions for current assignment
  const activeSubmissions = activeAssignment
    ? submissions.filter((s) => s.assignmentId === activeAssignment.id)
    : [];

  const handleScoreChange = (submissionId: string, value: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [submissionId]: value,
    }));
  };

  const handleSingleGradeAndDelete = async (sub: Submission) => {
    if (!activeAssignment || !onGradeAndDelete) return;
    const inputVal = scoreInputs[sub.id];
    const finalScore =
      inputVal !== undefined && inputVal !== ''
        ? Number(inputVal)
        : sub.score !== undefined
        ? sub.score
        : 0;
    const boundedScore = Math.min(Math.max(0, finalScore), activeAssignment.maxScore);

    setActionLoadingId(sub.id);
    try {
      await onGradeAndDelete(
        sub.firebaseDocId || sub.id,
        sub.filePath || '',
        boundedScore,
        sub.id
      );
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveAll = () => {
    if (!activeAssignment || activeSubmissions.length === 0) return;

    const updates = activeSubmissions.map((sub) => {
      const inputVal = scoreInputs[sub.id];
      const finalScore =
        inputVal !== undefined && inputVal !== ''
          ? Number(inputVal)
          : sub.score !== undefined
          ? sub.score
          : 0;
      return {
        submissionId: sub.id,
        score: Math.min(Math.max(0, finalScore), activeAssignment.maxScore),
      };
    });

    onSaveGrades(updates);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <PenSquare className="w-5 h-5 text-amber-500" />
            <span>ตรวจงานและบันทึกคะแนน</span>
          </h3>
          <p className="text-xs text-slate-500">
            เลือกรายวิชาและเลือกงานเพื่อตรวจให้คะแนนนักเรียน
          </p>
        </div>

        {/* Subject Filter Menu Buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSubjectId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedSubjectId === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ทุกวิชา
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setSelectedSubjectId(sub.id);
                const firstMatching = assignments.find((a) => a.subjectId === sub.id);
                if (firstMatching) {
                  setSelectedAssignmentId(firstMatching.id);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSubjectId === sub.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub.name} ({sub.grade}{sub.room && sub.room !== 'ALL' && sub.room !== 'ทุกห้อง' ? `/${sub.room}` : ''})
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-sky-50/70 p-3 rounded-xl border border-sky-100">
        <label className="text-xs font-bold text-sky-900 whitespace-nowrap">
          เลือกงานที่ต้องการตรวจ:
        </label>
        <select
          value={activeAssignment ? activeAssignment.id : ''}
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
          className="w-full sm:w-auto flex-grow p-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white font-medium"
        >
          {filteredAssignments.length === 0 ? (
            <option value="">-- ไม่พบรายการงานในตัวกรองนี้ --</option>
          ) : (
            filteredAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} (คะแนนเต็ม {a.maxScore} คะแนน)
              </option>
            ))
          )}
        </select>
      </div>

      {/* Submissions Table for Grading */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
              <th className="p-3.5">รหัสนักเรียน / ชื่อ-สกุล</th>
              <th className="p-3.5">ชั้น/ห้อง</th>
              <th className="p-3.5">วัน-เวลาส่ง</th>
              <th className="p-3.5">งานที่แนบส่ง</th>
              <th className="p-3.5 text-center">สถานะการส่ง</th>
              <th className="p-3.5 text-center">คะแนนที่ได้ / คะแนนเต็ม</th>
              <th className="p-3.5 text-center">สถานะตรวจ</th>
              <th className="p-3.5 text-center">คืนโควต้า Storage (5GB)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {!activeAssignment ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  ไม่มีงานให้ตรวจ
                </td>
              </tr>
            ) : activeSubmissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  ยังไม่มีนักเรียนส่งงานในหัวข้อนี้
                </td>
              </tr>
            ) : (
              activeSubmissions.map((sub) => {
                const student = students.find((s) => s.id === sub.studentId);
                const currentInputValue =
                  scoreInputs[sub.id] !== undefined ? scoreInputs[sub.id] : sub.score;

                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{student?.name || 'ไม่ระบุ'}</div>
                      <div className="text-xs text-slate-500 font-mono">ID: {sub.studentId}</div>
                    </td>
                    <td className="p-3.5 text-xs text-slate-600 font-medium">
                      {student ? `${student.grade}/${student.room}` : '-'}
                    </td>
                    <td className="p-3.5 text-xs text-slate-600">
                      {formatThaiDateTime(sub.submitDate)}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Firebase Storage Download URL button if available */}
                        {sub.fileUrl && (
                          <button
                            type="button"
                            onClick={() => onPreviewImage(sub.fileUrl!)}
                            className="cursor-pointer hover:opacity-85 text-xs bg-sky-50 border border-sky-300 text-sky-800 font-bold px-2 py-1 rounded flex items-center gap-1.5 shadow-sm"
                            title="ภาพผลงานที่อัปโหลดไปยัง Firebase Storage (submissions/)"
                          >
                            <img
                              src={sub.fileUrl}
                              alt="Storage file"
                              className="w-6 h-6 object-cover rounded border border-sky-200"
                            />
                            <span>รูปใน Storage</span>
                            <Cloud className="w-3.5 h-3.5 text-sky-600" />
                          </button>
                        )}
                        {/* Storage file reclaimed badge */}
                        {sub.filePath && !sub.fileUrl && (
                          <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded inline-flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>ลบไฟล์ Storage แล้ว</span>
                          </span>
                        )}
                        {sub.url && (
                          <a
                            href={sub.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-sky-600 hover:underline font-bold inline-flex items-center gap-1 bg-sky-50 px-2 py-1 rounded border border-sky-200"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>เปิดลิงก์งาน</span>
                          </a>
                        )}
                        {sub.attachments &&
                          sub.attachments.map((att) =>
                            att.type === 'image' ? (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => onPreviewImage(att.url)}
                                className="cursor-pointer hover:opacity-80"
                                title="คลิกเพื่อขยายภาพ"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-8 h-8 object-cover rounded border border-slate-200"
                                />
                              </button>
                            ) : (
                              <a
                                key={att.id}
                                href={att.url}
                                download={att.name}
                                className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded inline-flex items-center gap-1 text-slate-700 hover:bg-slate-200"
                              >
                                <Paperclip className="w-3 h-3 text-slate-500" />
                                <span className="truncate max-w-[80px]">{att.name}</span>
                              </a>
                            )
                          )}
                        {!sub.fileUrl && !sub.filePath && !sub.url && (!sub.attachments || sub.attachments.length === 0) && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {sub.isLate ? (
                        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          ส่งช้า
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          ตรงเวลา
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={activeAssignment.maxScore}
                          value={currentInputValue}
                          onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                          className="w-16 p-1.5 text-center text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <span className="text-xs font-bold text-slate-500">
                          / {activeAssignment.maxScore}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {sub.graded ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ตรวจแล้ว</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>รอตรวจ</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {onGradeAndDelete && (sub.filePath || sub.firebaseDocId) ? (
                        sub.storageDeleted || (!sub.fileUrl && sub.graded) ? (
                          <span
                            className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded inline-flex items-center gap-1 border border-slate-200"
                            title="ไฟล์ใน Firebase Storage ถูกลบเพื่อคืนโควต้า 5GB เรียบร้อยแล้ว"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>คืนโควต้าแล้ว</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === sub.id}
                            onClick={() => handleSingleGradeAndDelete(sub)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                            title="สั่ง deleteObject ลบไฟล์ออกจาก Firebase Storage ตาม filePath เพื่อคืนโควต้า 5GB และบันทึกคะแนน"
                          >
                            {actionLoadingId === sub.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>ตรวจ & ลบไฟล์</span>
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
        {saveSuccessMsg ? (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>บันทึกคะแนนทั้งหมดสำเร็จ และอัปเดตสถานะเป็น &quot;ตรวจแล้ว&quot; เรียบร้อย</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            * การกดบันทึกคะแนนจะเปลี่ยนสถานะของงานที่ตรวจเป็น &ldquo;ตรวจแล้ว&rdquo; โดยอัตโนมัติ
          </div>
        )}

        <button
          type="button"
          disabled={!activeAssignment || activeSubmissions.length === 0}
          onClick={handleSaveAll}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 self-end"
        >
          <Save className="w-4 h-4" />
          <span>บันทึกคะแนนทั้งหมดลงระบบ</span>
        </button>
      </div>
    </div>
  );
};
