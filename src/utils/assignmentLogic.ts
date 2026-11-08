import { Assignment, AttachmentItem, Student, Subject, Submission, AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  schoolName: 'โรงเรียนวิทยาศาสตร์ศึกษา',
  teacherName: 'ครูประเสริฐ สุขใจ',
  schoolLogo: null,
  googleSheetUrl: '',
  adminPassword: 'admin1234',
};

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'SUB01', code: 'ว31101', name: 'วิทยาศาสตร์ชีวภาพ', grade: 'ม.4', room: '2' },
  { id: 'SUB02', code: 'ค21101', name: 'คณิตศาสตร์พื้นฐาน', grade: 'ม.1', room: '1' },
  { id: 'SUB03', code: 'อ32101', name: 'ภาษาอังกฤษฟังพูด', grade: 'ม.5', room: 'ALL' },
  { id: 'SUB04', code: 'ว30221', name: 'เคมี 1', grade: 'ม.5', room: '1' },
];

export const INITIAL_STUDENTS: Student[] = [
  { id: '10001', name: 'ด.ช. กิตติพงษ์ เรียนดี', grade: 'ม.1', room: '1', number: 1 },
  { id: '10002', name: 'ด.ญ. ปรียาภรณ์ ขยันยิ่ง', grade: 'ม.1', room: '1', number: 2 },
  { id: '10003', name: 'นาย อัครพล มั่งคั่ง', grade: 'ม.4', room: '2', number: 5 },
  { id: '10004', name: 'น.ส. ธนัชชา กิจเจริญ', grade: 'ม.5', room: '1', number: 8 },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'ASN01',
    title: 'ใบงานเรื่องเซลล์และโครงสร้างพืช',
    subjectId: 'SUB01',
    maxScore: 10,
    materialUrl: 'https://example.com/docs/cells.pdf',
    dueDate: '2026-11-20T23:59',
  },
  {
    id: 'ASN02',
    title: 'การแก้สมการเชิงเส้นตัวแปรเดียว',
    subjectId: 'SUB02',
    maxScore: 20,
    materialUrl: '',
    dueDate: '2026-11-15T16:00',
  },
  {
    id: 'ASN03',
    title: 'บันทึกคลิปแนะนำตนเองภาษาอังกฤษ 1 นาที',
    subjectId: 'SUB03',
    maxScore: 15,
    materialUrl: 'https://example.com/docs/intro-guidelines.pdf',
    dueDate: '2026-11-25T18:00',
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'SUBM01',
    assignmentId: 'ASN01',
    studentId: '10003',
    submitDate: '2026-11-06T10:30',
    url: 'https://drive.google.com/sample-cells-work',
    attachments: [],
    comment: 'ส่งงานตรงเวลาครับ',
    score: 9,
    graded: true,
    isLate: false,
  },
];

/**
 * Checks if a submission is late compared to the assignment due date
 */
export function isAssignmentLate(dueDateStr: string, submitDateStr: string = new Date().toISOString()): boolean {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr).getTime();
  const sub = new Date(submitDateStr).getTime();
  return sub > due;
}

/**
 * Checks if a subject is assigned to the student's grade and room
 */
export function isSubjectMatchingStudent(subject: Subject, student: Student): boolean {
  if (subject.grade !== student.grade) return false;
  // If no room is specified, or room is 'ALL' or 'ทุกห้อง', it applies to all rooms in that grade
  if (!subject.room || subject.room === 'ALL' || subject.room === 'ทุกห้อง') {
    return true;
  }
  const subRoomNorm = subject.room.replace(/^ห้อง\s*/, '').trim();
  const stdRoomNorm = student.room.replace(/^ห้อง\s*/, '').trim();
  return subRoomNorm === stdRoomNorm;
}

/**
 * Returns assignments matching the student's grade and room
 */
export function getAssignmentsForStudent(
  student: Student | null,
  assignments: Assignment[],
  subjects: Subject[]
): Assignment[] {
  if (!student) return [];
  const validSubjectIds = subjects
    .filter((s) => isSubjectMatchingStudent(s, student))
    .map((s) => s.id);
  return assignments.filter((a) => validSubjectIds.includes(a.subjectId));
}

/**
 * Calculates dashboard statistics
 */
export function calculateDashboardStats(
  students: Student[],
  assignments: Assignment[],
  submissions: Submission[]
) {
  const totalStudents = students.length;
  const totalAssignments = assignments.length;
  const totalSubmitted = submissions.length;
  const totalPending = submissions.filter((s) => !s.graded).length;

  return {
    totalStudents,
    totalAssignments,
    totalSubmitted,
    totalPending,
  };
}

/**
 * Filters submissions for the reports table
 */
export function filterReportData(
  submissions: Submission[],
  students: Student[],
  assignments: Assignment[],
  subjects: Subject[],
  filters: { subjectId: string; grade: string; room: string }
) {
  return submissions.filter((sub) => {
    const student = students.find((s) => s.id === sub.studentId);
    const assign = assignments.find((a) => a.id === sub.assignmentId);
    if (!student || !assign) return false;

    if (filters.subjectId !== 'ALL' && assign.subjectId !== filters.subjectId) {
      return false;
    }
    if (filters.grade !== 'ALL' && student.grade !== filters.grade) {
      return false;
    }
    if (filters.room !== 'ALL' && student.room !== filters.room) {
      return false;
    }

    return true;
  });
}

/**
 * Format Thai date
 */
export function formatThaiDateTime(isoStr: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}
