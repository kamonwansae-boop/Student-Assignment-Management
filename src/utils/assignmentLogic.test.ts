import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAssignmentLate,
  getAssignmentsForStudent,
  calculateDashboardStats,
  filterReportData,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
} from './assignmentLogic';

test('isAssignmentLate correctly compares submit date with due date', () => {
  const dueDate = '2026-11-10T12:00:00.000Z';
  const beforeDue = '2026-11-10T11:59:00.000Z';
  const afterDue = '2026-11-10T12:01:00.000Z';

  assert.equal(isAssignmentLate(dueDate, beforeDue), false);
  assert.equal(isAssignmentLate(dueDate, afterDue), true);
  assert.equal(isAssignmentLate('', afterDue), false);
});

test('getAssignmentsForStudent returns assignments matching student grade and room', () => {
  const studentM1 = INITIAL_STUDENTS.find((s) => s.grade === 'ม.1')!;
  const m1Assignments = getAssignmentsForStudent(studentM1, INITIAL_ASSIGNMENTS, INITIAL_SUBJECTS);
  
  // Math is M.1 Room 1 (SUB02 -> ASN02)
  assert.equal(m1Assignments.length, 1);
  assert.equal(m1Assignments[0].id, 'ASN02');

  const studentM4 = INITIAL_STUDENTS.find((s) => s.grade === 'ม.4')!;
  const m4Assignments = getAssignmentsForStudent(studentM4, INITIAL_ASSIGNMENTS, INITIAL_SUBJECTS);
  
  // Biology is M.4 Room 2 (SUB01 -> ASN01)
  assert.equal(m4Assignments.length, 1);
  assert.equal(m4Assignments[0].id, 'ASN01');

  // Chemistry is M.5 Room 1 (SUB04)
  const studentM5Room1 = { id: '10004', name: 'น.ส. ธนัชชา กิจเจริญ', grade: 'ม.5', room: '1', number: 8 };
  const studentM5Room2 = { id: '10005', name: 'นาย ปฏิภาณ วิริยะ', grade: 'ม.5', room: '2', number: 1 };
  
  const chemistryAssign = {
    id: 'ASN_CHEM_01',
    title: 'การทดลองกรด-เบส',
    subjectId: 'SUB04', // Chemistry M.5 Room 1
    maxScore: 10,
    dueDate: '2026-11-20T23:59',
  };

  const room1Assignments = getAssignmentsForStudent(studentM5Room1, [...INITIAL_ASSIGNMENTS, chemistryAssign], INITIAL_SUBJECTS);
  const room2Assignments = getAssignmentsForStudent(studentM5Room2, [...INITIAL_ASSIGNMENTS, chemistryAssign], INITIAL_SUBJECTS);

  // Student in Room 1 gets English (M.5 ALL) + Chemistry (M.5 Room 1)
  assert.equal(room1Assignments.some((a) => a.id === 'ASN_CHEM_01'), true);
  assert.equal(room1Assignments.some((a) => a.id === 'ASN03'), true);

  // Student in Room 2 gets only English (M.5 ALL), NOT Chemistry (Room 1 only)
  assert.equal(room2Assignments.some((a) => a.id === 'ASN_CHEM_01'), false);
  assert.equal(room2Assignments.some((a) => a.id === 'ASN03'), true);

  // Null student returns empty array
  assert.deepEqual(getAssignmentsForStudent(null, INITIAL_ASSIGNMENTS, INITIAL_SUBJECTS), []);
});

test('calculateDashboardStats produces accurate summary counts', () => {
  const stats = calculateDashboardStats(
    INITIAL_STUDENTS,
    INITIAL_ASSIGNMENTS,
    INITIAL_SUBMISSIONS
  );

  assert.equal(stats.totalStudents, INITIAL_STUDENTS.length);
  assert.equal(stats.totalAssignments, INITIAL_ASSIGNMENTS.length);
  assert.equal(stats.totalSubmitted, 1);
  assert.equal(stats.totalPending, 0); // SUBM01 has graded: true
});

test('filterReportData filters by grade, room, and subject', () => {
  const allFiltered = filterReportData(
    INITIAL_SUBMISSIONS,
    INITIAL_STUDENTS,
    INITIAL_ASSIGNMENTS,
    INITIAL_SUBJECTS,
    { subjectId: 'ALL', grade: 'ALL', room: 'ALL' }
  );
  assert.equal(allFiltered.length, 1);

  // Filter with mismatched grade
  const mismatchGrade = filterReportData(
    INITIAL_SUBMISSIONS,
    INITIAL_STUDENTS,
    INITIAL_ASSIGNMENTS,
    INITIAL_SUBJECTS,
    { subjectId: 'ALL', grade: 'ม.2', room: 'ALL' }
  );
  assert.equal(mismatchGrade.length, 0);

  // Filter with matching grade (student 10003 is ม.4 room 2)
  const matchGrade = filterReportData(
    INITIAL_SUBMISSIONS,
    INITIAL_STUDENTS,
    INITIAL_ASSIGNMENTS,
    INITIAL_SUBJECTS,
    { subjectId: 'ALL', grade: 'ม.4', room: '2' }
  );
  assert.equal(matchGrade.length, 1);
});
