import React, { useState } from 'react';
import {
  Search,
  IdCard,
  QrCode,
  UserCheck,
  ListCheck,
  CheckSquare,
  BookOpen,
  Calendar,
  Star,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Send,
} from 'lucide-react';
import { Assignment, AttachmentItem, Student, Subject, Submission } from '../../types';
import { formatThaiDateTime, getAssignmentsForStudent, isAssignmentLate } from '../../utils/assignmentLogic';
import { SubmitWorkModal } from './SubmitWorkModal';

interface StudentViewProps {
  students: Student[];
  subjects: Subject[];
  assignments: Assignment[];
  submissions: Submission[];
  activeStudent: Student | null;
  onSelectStudent: (student: Student | null) => void;
  onSubmitWork: (submission: {
    assignmentId: string;
    studentId: string;
    url: string;
    attachments: AttachmentItem[];
    comment: string;
    imageFile?: File | Blob | null;
  }) => Promise<void> | void;
  onOpenCamera: () => void;
  cameraCapturedPhoto: string | null;
  onClearCapturedPhoto: () => void;
  onPreviewImage: (url: string) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  students,
  subjects,
  assignments,
  submissions,
  activeStudent,
  onSelectStudent,
  onSubmitWork,
  onOpenCamera,
  cameraCapturedPhoto,
  onClearCapturedPhoto,
  onPreviewImage,
}) => {
  const [searchInput, setSearchInput] = useState(activeStudent ? activeStudent.id : '');
  const [activeTab, setActiveTab] = useState<'assigned' | 'submitted'>('assigned');
  const [historySearch, setHistorySearch] = useState('');
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Modal state
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);

  // Auto-fill and sync input when activeStudent changes (e.g. from ?student_id= URL parameter)
  React.useEffect(() => {
    if (activeStudent) {
      setSearchInput(activeStudent.id);
      setSearchNotFound(false);
    }
  }, [activeStudent]);

  const handleSearchLogin = (idToSearch?: string) => {
    const q = (idToSearch || searchInput).trim();
    if (!q) return;

    const found = students.find((s) => s.id === q);
    if (found) {
      onSelectStudent(found);
      setSearchNotFound(false);
      setSearchInput(found.id);
    } else {
      setSearchNotFound(true);
    }
  };

  const handleSimulateQR = () => {
    if (students.length === 0) return;
    const random = students[Math.floor(Math.random() * students.length)];
    setSearchInput(random.id);
    handleSearchLogin(random.id);
  };

  // Student specific data
  const studentAssignments = getAssignmentsForStudent(activeStudent, assignments, subjects);
  const studentSubmissions = activeStudent
    ? submissions.filter((s) => s.studentId === activeStudent.id)
    : [];

  const pendingCount = studentAssignments.length;
  const submittedCount = studentSubmissions.length;

  // Filtered submission history
  const filteredSubmissions = studentSubmissions.filter((sub) => {
    if (!historySearch.trim()) return true;
    const term = historySearch.toLowerCase();
    const assign = assignments.find((a) => a.id === sub.assignmentId);
    const subject = subjects.find((s) => s.id === assign?.subjectId);
    return (
      assign?.title.toLowerCase().includes(term) ||
      subject?.name.toLowerCase().includes(term) ||
      subject?.code.toLowerCase().includes(term)
    );
  });

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Student Authentication & Profile Header Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 shadow-xl border-l-8 border-sky-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-grow">
            <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-sky-600" />
              <span>เข้าสู่ระบบเพื่อส่งงาน / ตรวจสอบสถานะ</span>
            </label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSearchNotFound(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchLogin();
                  }}
                  placeholder="กรอกเลขประจำตัวนักเรียน (เช่น 10001, 10002, 10003)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 text-sm font-medium bg-white shadow-sm"
                />
                <IdCard className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
              <button
                type="button"
                onClick={() => handleSearchLogin()}
                className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>ค้นหาข้อมูล</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateQR}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-1.5"
                title="จำลองการสแกน QR Code เพื่อล็อกอินทันที"
              >
                <QrCode className="w-4 h-4" />
                <span>สแกน QR</span>
              </button>
            </div>
            {searchNotFound && (
              <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>ไม่พบรหัสนักเรียน &quot;{searchInput}&quot; ในระบบ (ลอง 10001 หรือ 10002)</span>
              </p>
            )}
          </div>

          {/* Logged Student Info display */}
          <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-3.5 flex items-center space-x-3.5 min-w-[280px] shadow-sm">
            <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="text-xs sm:text-sm">
              <div className="text-slate-500 text-xs">ข้อมูลนักเรียนปัจจุบัน:</div>
              <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                {activeStudent ? activeStudent.name : 'กรุณาค้นหารหัสนักเรียน'}
              </div>
              <div className="text-sky-700 font-semibold text-xs mt-0.5">
                {activeStudent
                  ? `ระดับชั้น: ${activeStudent.grade}/${activeStudent.room} | เลขที่: ${activeStudent.number} (ID: ${activeStudent.id})`
                  : 'ระดับชั้น: - | เลขที่: -'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Navigation Tabs */}
      <div className="flex border-b border-slate-200/60 bg-white/70 backdrop-blur-sm p-1.5 rounded-xl shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'assigned'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-white/80'
          }`}
        >
          <ListCheck className="w-4 h-4" />
          <span>งานที่ได้รับมอบหมาย</span>
          <span className="bg-amber-400 text-slate-950 text-xs px-2 py-0.5 rounded-full font-extrabold ml-1">
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'submitted'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-white/80'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>ประวัติการส่งงาน & คะแนน</span>
          <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold ml-1">
            {submittedCount}
          </span>
        </button>
      </div>

      {/* TAB 1: Assigned Works */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/90 p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              <span>รายการงานที่คุณต้องส่ง</span>
            </h3>
            <div className="text-xs text-slate-500">
              {activeStudent ? `แสดงงานของระดับชั้น ${activeStudent.grade}/${activeStudent.room}` : 'กรุณาเข้าสู่ระบบนักเรียน'}
            </div>
          </div>

          {!activeStudent ? (
            <div className="glass-card p-10 rounded-2xl text-center text-slate-500 space-y-3">
              <IdCard className="w-12 h-12 mx-auto text-sky-400 animate-pulse" />
              <p className="font-bold text-base text-slate-800">
                กรุณากรอกรหัสนักเรียนด้านบนเพื่อเข้าใช้งาน
              </p>
              <p className="text-xs text-slate-400">
                ตัวอย่าง: 10001 (ม.1), 10002 (ม.1), 10003 (ม.4), 10004 (ม.5) หรือคลิกปุ่ม &quot;สแกน QR&quot;
              </p>
            </div>
          ) : studentAssignments.length === 0 ? (
            <div className="glass-card p-10 rounded-2xl text-center text-slate-500 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-amber-400" />
              <p className="font-bold text-base text-slate-800">
                ยังไม่มีงานที่มอบหมายสำหรับระดับชั้น {activeStudent.grade}/{activeStudent.room}
              </p>
              <p className="text-xs text-slate-400">
                คุณครูยังไม่ได้มอบหมายงานใหม่ในระดับชั้นนี้
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {studentAssignments.map((assign) => {
                const subject = subjects.find((s) => s.id === assign.subjectId);
                const submission = submissions.find(
                  (s) => s.assignmentId === assign.id && s.studentId === activeStudent.id
                );
                const isLate = isAssignmentLate(assign.dueDate);

                const roomBadge =
                  subject?.room && subject.room !== 'ALL' && subject.room !== 'ทุกห้อง'
                    ? ` - ห้อง ${subject.room}`
                    : '';

                return (
                  <div
                    key={assign.id}
                    className="glass-card rounded-2xl p-5 shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all duration-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-lg">
                          {subject?.name || 'ทั่วไป'} ({subject?.code || ''}{roomBadge})
                        </span>

                        {submission ? (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ส่งแล้ว</span>
                          </span>
                        ) : isLate ? (
                          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>เกินกำหนดส่ง</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอส่ง</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {assign.title}
                      </h4>

                      <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-sky-500" />
                          <span>
                            กำหนดส่ง: <strong>{formatThaiDateTime(assign.dueDate)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500" />
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
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-bold"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>ดูเอกสารคำชี้แจงงาน</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      {submission ? (
                        <button
                          type="button"
                          onClick={() => setSelectedAssignmentForSubmit(assign)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>แก้ไขการส่งงาน</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedAssignmentForSubmit(assign)}
                          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ส่งงานนี้</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Submitted Works & Real-time Status Check */}
      {activeTab === 'submitted' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>ตรวจสอบสถานะการส่งงาน & คะแนน</span>
              </h3>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="ค้นหาชื่องาน/วิชา..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Submitted List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                    <th className="p-3.5">วิชา / ชื่องาน</th>
                    <th className="p-3.5">วันที่ส่งงาน</th>
                    <th className="p-3.5">ไฟล์/ลิงก์ที่แนบ</th>
                    <th className="p-3.5 text-center">คะแนนที่ได้</th>
                    <th className="p-3.5 text-center">สถานะการตรวจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {!activeStudent ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        กรุณากรอกรหัสนักเรียนเพื่อดูประวัติการส่งงาน
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        ยังไม่มีประวัติการส่งงานในระบบ
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const assign = assignments.find((a) => a.id === sub.assignmentId);
                      const subject = subjects.find((s) => s.id === assign?.subjectId);

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{assign?.title || '-'}</div>
                            <div className="text-xs text-sky-700 font-medium">
                              {subject?.name} ({subject?.code})
                            </div>
                            {sub.comment && (
                              <div className="text-[11px] text-slate-500 mt-0.5 italic">
                                &ldquo;{sub.comment}&rdquo;
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-xs text-slate-600">
                            {formatThaiDateTime(sub.submitDate)}
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sub.url && (
                                <a
                                  href={sub.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-sky-600 hover:underline font-bold inline-flex items-center gap-1 bg-sky-50 px-2 py-1 rounded border border-sky-200"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>ลิงก์แนบ</span>
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
                                      title={att.name}
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
                                      <span className="truncate max-w-[90px]">{att.name}</span>
                                    </a>
                                  )
                                )}
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            {sub.graded ? (
                              <div>
                                <span className="text-lg font-black text-emerald-600">{sub.score}</span>
                                <span className="text-xs font-bold text-slate-500">
                                  {' '}/ {assign?.maxScore || 10}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold">
                                - / {assign?.maxScore || 10}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              {sub.graded ? (
                                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>ตรวจแล้ว</span>
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>รอตรวจ</span>
                                </span>
                              )}
                              {sub.isLate && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  ส่งช้า
                                </span>
                              )}
                            </div>
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
      )}

      {/* Submit Work Modal */}
      {selectedAssignmentForSubmit && (
        <SubmitWorkModal
          isOpen={!!selectedAssignmentForSubmit}
          onClose={() => setSelectedAssignmentForSubmit(null)}
          assignment={selectedAssignmentForSubmit}
          subject={
            subjects.find((s) => s.id === selectedAssignmentForSubmit.subjectId) || null
          }
          activeStudent={activeStudent}
          existingSubmission={
            submissions.find(
              (s) =>
                s.assignmentId === selectedAssignmentForSubmit.id &&
                s.studentId === activeStudent?.id
            ) || null
          }
          onSubmit={onSubmitWork}
          onOpenCamera={onOpenCamera}
          cameraCapturedPhoto={cameraCapturedPhoto}
          onClearCapturedPhoto={onClearCapturedPhoto}
          onPreviewImage={onPreviewImage}
        />
      )}
    </section>
  );
};
