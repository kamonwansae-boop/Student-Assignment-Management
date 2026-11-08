import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  PieChart,
  FileSignature,
  ClipboardCheck,
  FileSpreadsheet,
  Book,
  Users,
  Settings,
  CircleDot,
} from 'lucide-react';
import { AppSettings, Assignment, Student, Subject, Submission, TeacherMenu } from '../../types';
import { DashboardTab } from './DashboardTab';
import { AssignmentsTab } from './AssignmentsTab';
import { AssignmentModal } from './AssignmentModal';
import { GradingTab } from './GradingTab';
import { ReportsTab } from './ReportsTab';
import { SubjectsTab } from './SubjectsTab';
import { SubjectModal } from './SubjectModal';
import { StudentsTab } from './StudentsTab';
import { StudentModal } from './StudentModal';
import { SettingsTab } from './SettingsTab';
import { QRCodeModal } from '../Modals/QRCodeModal';
import { AppsScriptModal } from '../Modals/AppsScriptModal';

interface TeacherViewProps {
  settings: AppSettings;
  subjects: Subject[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onLockTeacherView: () => void;
  onSaveAssignment: (data: {
    id?: string;
    title: string;
    subjectId: string;
    maxScore: number;
    materialUrl?: string;
    dueDate: string;
  }) => void;
  onDeleteAssignment: (id: string) => void;
  onSaveSubject: (data: { id?: string; code: string; name: string; grade: string; room: string }) => void;
  onDeleteSubject: (id: string) => void;
  onSaveStudent: (data: {
    id: string;
    originalId?: string;
    name: string;
    grade: string;
    room: string;
    number: number;
  }) => void;
  onDeleteStudent: (id: string) => void;
  onSaveGrades: (updates: Array<{ submissionId: string; score: number }>) => void;
  onGradeAndDelete?: (docId: string, filePath: string, score: number, submissionId: string) => Promise<void>;
  onSaveSettings: (newSettings: AppSettings) => void;
  onPreviewImage: (url: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  settings,
  subjects,
  students,
  assignments,
  submissions,
  onLockTeacherView,
  onSaveAssignment,
  onDeleteAssignment,
  onSaveSubject,
  onDeleteSubject,
  onSaveStudent,
  onDeleteStudent,
  onSaveGrades,
  onGradeAndDelete,
  onSaveSettings,
  onPreviewImage,
}) => {
  const [currentMenu, setCurrentMenu] = useState<TeacherMenu>('dashboard');

  // Modals state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Teacher Navigation Tabs & Header */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xl border-l-8 border-indigo-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              แผงควบคุมคุณครู (Teacher Dashboard)
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>
                ผู้สอน: <strong className="text-indigo-700">{settings.teacherName}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onLockTeacherView}
                className="text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ล็อคหน้าจอ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync status badge */}
        <div className="flex items-center space-x-2 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700">
            {settings.googleSheetUrl
              ? 'เชื่อมต่อ Google Sheet พร้อมใช้งาน'
              : 'โหมดฐานข้อมูล LocalStorage พร้อมใช้งาน'}
          </span>
        </div>
      </div>

      {/* Teacher Admin Menu Navigation Bar */}
      <div className="flex flex-wrap gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-md border border-slate-200">
        <button
          onClick={() => setCurrentMenu('dashboard')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>หน้าหลัก</span>
        </button>

        <button
          onClick={() => setCurrentMenu('assignments')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'assignments'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>งานที่มอบหมาย</span>
        </button>

        <button
          onClick={() => setCurrentMenu('grading')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'grading'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>ตรวจงาน / คะแนน</span>
        </button>

        <button
          onClick={() => setCurrentMenu('reports')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'reports'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>สถิติ & รายงาน</span>
        </button>

        <button
          onClick={() => setCurrentMenu('subjects')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'subjects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Book className="w-4 h-4" />
          <span>จัดการรายวิชา</span>
        </button>

        <button
          onClick={() => setCurrentMenu('students')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'students'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการนักเรียน</span>
        </button>

        <button
          onClick={() => setCurrentMenu('settings')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            currentMenu === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าระบบ</span>
        </button>
      </div>

      {/* Teacher Content Tabs */}
      {currentMenu === 'dashboard' && (
        <DashboardTab
          students={students}
          assignments={assignments}
          submissions={submissions}
          subjects={subjects}
          onOpenNewAssignment={() => {
            setAssignmentToEdit(null);
            setIsAssignmentModalOpen(true);
          }}
        />
      )}

      {currentMenu === 'assignments' && (
        <AssignmentsTab
          assignments={assignments}
          subjects={subjects}
          onOpenNewAssignment={() => {
            setAssignmentToEdit(null);
            setIsAssignmentModalOpen(true);
          }}
          onEditAssignment={(assign) => {
            setAssignmentToEdit(assign);
            setIsAssignmentModalOpen(true);
          }}
          onDeleteAssignment={onDeleteAssignment}
        />
      )}

      {currentMenu === 'grading' && (
        <GradingTab
          subjects={subjects}
          assignments={assignments}
          students={students}
          submissions={submissions}
          onSaveGrades={onSaveGrades}
          onGradeAndDelete={onGradeAndDelete}
          onPreviewImage={onPreviewImage}
        />
      )}

      {currentMenu === 'reports' && (
        <ReportsTab
          submissions={submissions}
          students={students}
          assignments={assignments}
          subjects={subjects}
        />
      )}

      {currentMenu === 'subjects' && (
        <SubjectsTab
          subjects={subjects}
          onOpenNewSubject={() => {
            setSubjectToEdit(null);
            setIsSubjectModalOpen(true);
          }}
          onEditSubject={(sub) => {
            setSubjectToEdit(sub);
            setIsSubjectModalOpen(true);
          }}
          onDeleteSubject={onDeleteSubject}
        />
      )}

      {currentMenu === 'students' && (
        <StudentsTab
          students={students}
          onOpenNewStudent={() => {
            setStudentToEdit(null);
            setIsStudentModalOpen(true);
          }}
          onEditStudent={(std) => {
            setStudentToEdit(std);
            setIsStudentModalOpen(true);
          }}
          onDeleteStudent={onDeleteStudent}
          onGenerateQR={(std) => setQrModalStudent(std)}
        />
      )}

      {currentMenu === 'settings' && (
        <SettingsTab
          settings={settings}
          onSaveSettings={onSaveSettings}
          onOpenAppsScriptHelp={() => setIsAppsScriptModalOpen(true)}
        />
      )}

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setAssignmentToEdit(null);
        }}
        assignmentToEdit={assignmentToEdit}
        subjects={subjects}
        onSave={onSaveAssignment}
      />

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setSubjectToEdit(null);
        }}
        subjectToEdit={subjectToEdit}
        onSave={onSaveSubject}
      />

      {/* Student Modal */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
        studentToEdit={studentToEdit}
        onSave={onSaveStudent}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        student={qrModalStudent}
        onClose={() => setQrModalStudent(null)}
      />

      {/* Apps Script Help Modal */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
      />
    </section>
  );
};
