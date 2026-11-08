import * as XLSX from 'xlsx';
import { AppSettings, Assignment, Student, Subject, Submission } from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_ASSIGNMENTS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_SUBMISSIONS,
} from './assignmentLogic';

const STORAGE_KEY = 'student_assignment_app_data_v2';

export interface AppStoredData {
  settings: AppSettings;
  subjects: Subject[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
}

export function loadStoredData(): AppStoredData {
  if (typeof window === 'undefined') {
    return {
      settings: DEFAULT_SETTINGS,
      subjects: INITIAL_SUBJECTS,
      students: INITIAL_STUDENTS,
      assignments: INITIAL_ASSIGNMENTS,
      submissions: INITIAL_SUBMISSIONS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        subjects: parsed.subjects && parsed.subjects.length > 0 ? parsed.subjects : INITIAL_SUBJECTS,
        students: parsed.students && parsed.students.length > 0 ? parsed.students : INITIAL_STUDENTS,
        assignments: parsed.assignments && parsed.assignments.length > 0 ? parsed.assignments : INITIAL_ASSIGNMENTS,
        submissions: parsed.submissions ? parsed.submissions : INITIAL_SUBMISSIONS,
      };
    }
  } catch (err) {
    console.error('Failed to load data from localStorage:', err);
  }

  return {
    settings: DEFAULT_SETTINGS,
    subjects: INITIAL_SUBJECTS,
    students: INITIAL_STUDENTS,
    assignments: INITIAL_ASSIGNMENTS,
    submissions: INITIAL_SUBMISSIONS,
  };
}

export function saveStoredData(data: AppStoredData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}

export function exportSubmissionsToExcel(
  submissions: Submission[],
  students: Student[],
  assignments: Assignment[],
  subjects: Subject[],
  filename = `รายงานสรุปคะแนน_${new Date().toISOString().slice(0, 10)}.xlsx`
): void {
  const exportRows = submissions.map((sub) => {
    const student = students.find((s) => s.id === sub.studentId);
    const assign = assignments.find((a) => a.id === sub.assignmentId);
    const subject = subjects.find((s) => s.id === assign?.subjectId);

    return {
      'เลขประจำตัว': student?.id || sub.studentId,
      'ชื่อ-นามสกุล': student?.name || 'ไม่ระบุ',
      'ระดับชั้น/ห้อง': student ? `${student.grade}/${student.room}` : '-',
      'เลขที่': student?.number ?? '-',
      'รหัสวิชา': subject?.code || '-',
      'ชื่อรายวิชา': subject?.name || '-',
      'ระดับชั้น/ห้องเรียนของวิชา': subject
        ? `${subject.grade} (${
            !subject.room || subject.room === 'ALL' || subject.room === 'ทุกห้อง'
              ? 'ทุกห้อง'
              : subject.room.startsWith('ห้อง')
              ? subject.room
              : `ห้อง ${subject.room}`
          })`
        : '-',
      'ชื่องาน': assign?.title || '-',
      'วันที่ส่งงาน': sub.submitDate ? new Date(sub.submitDate).toLocaleString('th-TH') : '-',
      'สถานะการส่ง': sub.isLate ? 'ส่งช้า' : 'ตรงเวลา',
      'สถานะการตรวจ': sub.graded ? 'ตรวจแล้ว' : 'รอตรวจ',
      'คะแนนที่ได้': sub.graded ? sub.score : 'ยังไม่ได้ตรวจ',
      'คะแนนเต็ม': assign?.maxScore || 10,
      'ลิงก์งาน': sub.url || '',
      'จำนวนไฟล์แนบ': sub.attachments?.length || 0,
      'ข้อความ': sub.comment || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานคะแนน');
  XLSX.writeFile(workbook, filename);
}

export async function sendToGoogleSheet(url: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!url) return false;
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Google Sheet Web App sync error:', err);
    return false;
  }
}
