export interface Subject {
  id: string;
  code: string;
  name: string;
  grade: string; // e.g. "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"
  room?: string; // e.g. "1", "ห้อง 1", or "ALL" / "ทุกห้อง"
}

export interface Student {
  id: string; // Student ID e.g. "10001"
  name: string;
  grade: string; // e.g. "ม.1"
  room: string; // e.g. "1", "2"
  number: number;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  maxScore: number;
  materialUrl?: string;
  dueDate: string; // ISO string e.g. "2026-10-30T23:59"
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'image' | 'doc';
  url: string; // base64 or object url
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submitDate: string; // ISO string
  url?: string;
  attachments: AttachmentItem[];
  comment?: string;
  score: number;
  graded: boolean;
  isLate: boolean;
  // Firebase Integration fields
  firebaseDocId?: string;
  filePath?: string;
  fileUrl?: string;
  storageDeleted?: boolean;
}

export interface AppSettings {
  schoolName: string;
  teacherName: string;
  schoolLogo: string | null;
  googleSheetUrl: string;
  adminPassword?: string;
}

export type Role = 'student' | 'teacher';
export type TeacherMenu = 'dashboard' | 'assignments' | 'grading' | 'reports' | 'subjects' | 'students' | 'settings';
export type StudentTab = 'assigned' | 'submitted';
