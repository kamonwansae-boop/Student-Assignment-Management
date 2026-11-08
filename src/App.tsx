import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { StudentView } from './components/StudentView/StudentView';
import { TeacherView } from './components/TeacherView/TeacherView';
import { PasswordModal } from './components/Modals/PasswordModal';
import { LightboxModal } from './components/Modals/LightboxModal';
import { CameraModal } from './components/Modals/CameraModal';
import {
  AppSettings,
  Assignment,
  AttachmentItem,
  Role,
  Student,
  Subject,
  Submission,
} from './types';
import {
  isAssignmentLate,
  INITIAL_STUDENTS,
} from './utils/assignmentLogic';
import { loadStoredData, saveStoredData, sendToGoogleSheet } from './utils/storage';
import { submitWork, gradeAndDelete, subscribeFirebaseSubmissions } from './firebase';

export default function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredData().settings);
  const [subjects, setSubjects] = useState<Subject[]>(() => loadStoredData().subjects);
  const [students, setStudents] = useState<Student[]>(() => loadStoredData().students);
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadStoredData().assignments);
  const [submissions, setSubmissions] = useState<Submission[]>(() => loadStoredData().submissions);

  // App Role & Active Student
  const [currentRole, setCurrentRole] = useState<Role>('student');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Global Modals
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraCapturedPhoto, setCameraCapturedPhoto] = useState<string | null>(null);

  // Toast banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial load and URL param check (e.g. ?stdId=10001 from QR Code scan)
  useEffect(() => {
    const stored = loadStoredData();
    setSettings(stored.settings);
    setSubjects(stored.subjects);
    setStudents(stored.students);
    setAssignments(stored.assignments);
    setSubmissions(stored.submissions);
    setDataLoaded(true);

    if (typeof window !== 'undefined') {
      // Expose to window for direct console testing or automated verification
      (window as any).submitWork = submitWork;
      (window as any).gradeAndDelete = gradeAndDelete;

      const params = new URLSearchParams(window.location.search);
      const urlStdId = params.get('student_id') || params.get('stdId');
      if (urlStdId) {
        const found = stored.students.find((s) => s.id === urlStdId);
        if (found) {
          setActiveStudent(found);
          setCurrentRole('student');
          showToast(`สแกนสำเร็จ: เข้าสู่ระบบในชื่อ ${found.name} (${found.grade}/${found.room})`);
        }
      } else {
        // By default select first student for convenient immediate demo exploration
        if (stored.students.length > 0) {
          setActiveStudent(stored.students[0]);
        }
      }
    }

    // Subscribe to real-time changes from Firebase Firestore submissions collection
    const unsubscribe = subscribeFirebaseSubmissions((fbDocs) => {
      if (!fbDocs || fbDocs.length === 0) return;
      setSubmissions((prev) => {
        let changed = false;
        const next = [...prev];
        fbDocs.forEach((doc) => {
          const existingIdx = next.findIndex(
            (s) => s.firebaseDocId === doc.id || (s.filePath && s.filePath === doc.filePath)
          );
          if (existingIdx >= 0) {
            const item = next[existingIdx];
            if (
              item.score !== (doc.score ?? item.score) ||
              item.graded !== (doc.status === 'graded') ||
              item.fileUrl !== doc.fileUrl
            ) {
              changed = true;
              next[existingIdx] = {
                ...item,
                score: doc.score !== null ? Number(doc.score) : item.score,
                graded: doc.status === 'graded',
                fileUrl: doc.fileUrl,
                storageDeleted: !doc.fileUrl && doc.status === 'graded',
              };
            }
          }
        });
        return changed ? next : prev;
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!dataLoaded) return;
    saveStoredData({
      settings,
      subjects,
      students,
      assignments,
      submissions,
    });
  }, [settings, subjects, students, assignments, submissions, dataLoaded]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Role Switching Logic
  const handleSwitchRole = (role: Role) => {
    if (role === 'teacher') {
      if (!isTeacherAuthenticated) {
        setIsPasswordModalOpen(true);
        return;
      }
      setCurrentRole('teacher');
    } else {
      setCurrentRole('student');
    }
  };

  const handlePasswordSuccess = () => {
    setIsTeacherAuthenticated(true);
    setIsPasswordModalOpen(false);
    setCurrentRole('teacher');
    showToast('เข้าสู่ระบบมุมมองคุณครูเรียบร้อย');
  };

  const handleLockTeacherView = () => {
    setIsTeacherAuthenticated(false);
    setCurrentRole('student');
    showToast('ออกจากมุมมองคุณครูเรียบร้อยแล้ว');
  };

  // Student Work Submission (Supports Firebase submitWork with Canvas image compression)
  const handleSubmitWork = async (newSub: {
    assignmentId: string;
    studentId: string;
    url: string;
    attachments: AttachmentItem[];
    comment: string;
    imageFile?: File | Blob | null;
  }) => {
    const targetAssign = assignments.find((a) => a.id === newSub.assignmentId);
    const targetStudent = students.find((s) => s.id === newSub.studentId);
    const targetSubject = subjects.find((s) => s.id === targetAssign?.subjectId);

    const isLate = targetAssign ? isAssignmentLate(targetAssign.dueDate) : false;

    let uploadedFilePath: string | undefined = undefined;
    let uploadedFileUrl: string | undefined = undefined;
    let firebaseDocId: string | undefined = undefined;

    // If an image file or camera snapshot is attached, call submitWork
    if (newSub.imageFile && targetStudent) {
      try {
        const title = targetAssign?.title || 'ส่งงาน';
        const fbResult = await submitWork(
          targetStudent.id,
          targetStudent.name,
          title,
          newSub.imageFile
        );
        uploadedFilePath = fbResult.filePath;
        uploadedFileUrl = fbResult.fileUrl;
        firebaseDocId = fbResult.docId;
      } catch (fbErr: any) {
        console.error('Firebase submitWork error:', fbErr);
        showToast('เกิดข้อผิดพลาดในการอัปโหลด Firebase: ' + (fbErr?.message || ''));
      }
    }

    const submissionRecord: Submission = {
      id: firebaseDocId || 'SUBM_' + Date.now(),
      assignmentId: newSub.assignmentId,
      studentId: newSub.studentId,
      submitDate: new Date().toISOString(),
      url: newSub.url,
      attachments: newSub.attachments,
      comment: newSub.comment,
      score: 0,
      graded: false,
      isLate: isLate,
      firebaseDocId,
      filePath: uploadedFilePath,
      fileUrl: uploadedFileUrl,
    };

    setSubmissions((prev) => {
      // Remove any prior submission by this student for this assignment
      const filtered = prev.filter(
        (s) => !(s.assignmentId === newSub.assignmentId && s.studentId === newSub.studentId)
      );
      return [submissionRecord, ...filtered];
    });

    if (uploadedFileUrl) {
      showToast(
        isLate
          ? 'ส่งงานขึ้น Firebase Storage & Firestore สำเร็จ (ส่งช้ากว่ากำหนด)'
          : 'ส่งงานขึ้น Firebase Storage & Firestore สำเร็จเรียบร้อย'
      );
    } else {
      showToast(
        isLate
          ? 'บันทึกการส่งงานสำเร็จ (ส่งช้ากว่ากำหนด)'
          : 'บันทึกการส่งงานเข้าสู่ระบบเรียบร้อยแล้ว'
      );
    }

    // If Google Sheet Web App URL is configured, send in background
    if (settings.googleSheetUrl && targetStudent && targetAssign) {
      sendToGoogleSheet(settings.googleSheetUrl, {
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        subject: targetSubject?.name || '',
        assignmentTitle: targetAssign.title,
        link: newSub.url || uploadedFileUrl || '',
        attachments: newSub.attachments.map((a) => a.name).join(', '),
        maxScore: targetAssign.maxScore,
        status: isLate ? 'ส่งแล้ว (ส่งช้า)' : 'ส่งแล้ว',
      });
    }
  };

  // Teacher Handlers: Assignments
  const handleSaveAssignment = (data: {
    id?: string;
    title: string;
    subjectId: string;
    maxScore: number;
    materialUrl?: string;
    dueDate: string;
  }) => {
    if (data.id) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === data.id
            ? {
                ...a,
                title: data.title,
                subjectId: data.subjectId,
                maxScore: data.maxScore,
                materialUrl: data.materialUrl,
                dueDate: data.dueDate,
              }
            : a
        )
      );
      showToast('อัปเดตงานที่มอบหมายเรียบร้อย');
    } else {
      const newAssign: Assignment = {
        id: 'ASN_' + Date.now(),
        title: data.title,
        subjectId: data.subjectId,
        maxScore: data.maxScore,
        materialUrl: data.materialUrl,
        dueDate: data.dueDate,
      };
      setAssignments((prev) => [newAssign, ...prev]);
      showToast('สร้างงานที่มอบหมายใหม่เรียบร้อย');
    }
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setSubmissions((prev) => prev.filter((s) => s.assignmentId !== id));
    showToast('ลบรายการงานเรียบร้อย');
  };

  // Teacher Handlers: Subjects
  const handleSaveSubject = (data: {
    id?: string;
    code: string;
    name: string;
    grade: string;
    room: string;
  }) => {
    if (data.id) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === data.id
            ? { ...s, code: data.code, name: data.name, grade: data.grade, room: data.room }
            : s
        )
      );
      showToast('แก้ไขข้อมูลรายวิชาเรียบร้อย');
    } else {
      const newSub: Subject = {
        id: 'SUB_' + Date.now(),
        code: data.code,
        name: data.name,
        grade: data.grade,
        room: data.room,
      };
      setSubjects((prev) => [...prev, newSub]);
      showToast('เพิ่มรายวิชาใหม่เรียบร้อย');
    }
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('ลบรายวิชาเรียบร้อย');
  };

  // Teacher Handlers: Students
  const handleSaveStudent = (data: {
    id: string;
    originalId?: string;
    name: string;
    grade: string;
    room: string;
    number: number;
  }) => {
    if (data.originalId) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === data.originalId
            ? {
                ...s,
                id: data.id,
                name: data.name,
                grade: data.grade,
                room: data.room,
                number: data.number,
              }
            : s
        )
      );
      // Update active student if same
      if (activeStudent?.id === data.originalId) {
        setActiveStudent({
          id: data.id,
          name: data.name,
          grade: data.grade,
          room: data.room,
          number: data.number,
        });
      }
      showToast('แก้ไขข้อมูลนักเรียนเรียบร้อย');
    } else {
      const newStd: Student = {
        id: data.id,
        name: data.name,
        grade: data.grade,
        room: data.room,
        number: data.number,
      };
      setStudents((prev) => [...prev, newStd]);
      showToast('เพิ่มนักเรียนใหม่เรียบร้อย');
    }
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSubmissions((prev) => prev.filter((s) => s.studentId !== id));
    if (activeStudent?.id === id) {
      setActiveStudent(null);
    }
    showToast('ลบข้อมูลนักเรียนเรียบร้อย');
  };

  // Teacher Handlers: Single submission gradeAndDelete (Firebase Storage & Firestore)
  const handleGradeAndDelete = async (
    docId: string,
    filePath: string,
    score: number,
    submissionId: string
  ) => {
    try {
      await gradeAndDelete(docId, filePath, score);
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === submissionId || sub.firebaseDocId === docId) {
            return {
              ...sub,
              score,
              graded: true,
              storageDeleted: true,
              fileUrl: undefined,
            };
          }
          return sub;
        })
      );
      showToast(`ตรวจงาน & สั่ง deleteObject ลบไฟล์ใน Firebase Storage ตาม filePath เพื่อคืนโควต้า 5GB สำเร็จ (ให้ ${score} คะแนน)`);
    } catch (err: any) {
      console.error('Error during gradeAndDelete:', err);
      showToast('เกิดข้อผิดพลาดใน gradeAndDelete: ' + (err?.message || ''));
    }
  };

  // Teacher Handlers: Batch Grading
  const handleSaveGrades = (updates: Array<{ submissionId: string; score: number }>) => {
    // Automatically trigger gradeAndDelete for submissions with active Storage files
    updates.forEach((u) => {
      const sub = submissions.find((s) => s.id === u.submissionId);
      if (sub && (sub.firebaseDocId || sub.filePath) && !sub.storageDeleted) {
        gradeAndDelete(sub.firebaseDocId || sub.id, sub.filePath || '', u.score).catch((err) =>
          console.warn('Batch gradeAndDelete notice:', err)
        );
      }
    });

    setSubmissions((prev) =>
      prev.map((sub) => {
        const match = updates.find((u) => u.submissionId === sub.id);
        if (match) {
          return {
            ...sub,
            score: match.score,
            graded: true,
            storageDeleted: sub.filePath ? true : sub.storageDeleted,
            fileUrl: sub.filePath ? undefined : sub.fileUrl,
          };
        }
        return sub;
      })
    );
    showToast('บันทึกคะแนนและตรวจงานเรียบร้อย (ลบไฟล์ใน Storage คืนพื้นที่โควต้า 5GB)');
  };

  // Teacher Handlers: Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    showToast('บันทึกการตั้งค่าระบบเรียบร้อย');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-500 selection:text-white pb-12">
      {/* Top Fixed Navigation Bar */}
      <Header
        schoolName={settings.schoolName}
        schoolLogo={settings.schoolLogo}
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
      />

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur border border-white/20 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'student' ? (
          <StudentView
            students={students}
            subjects={subjects}
            assignments={assignments}
            submissions={submissions}
            activeStudent={activeStudent}
            onSelectStudent={setActiveStudent}
            onSubmitWork={handleSubmitWork}
            onOpenCamera={() => setIsCameraModalOpen(true)}
            cameraCapturedPhoto={cameraCapturedPhoto}
            onClearCapturedPhoto={() => setCameraCapturedPhoto(null)}
            onPreviewImage={(url) => setLightboxImage(url)}
          />
        ) : (
          <TeacherView
            settings={settings}
            subjects={subjects}
            students={students}
            assignments={assignments}
            submissions={submissions}
            onLockTeacherView={handleLockTeacherView}
            onSaveAssignment={handleSaveAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onSaveSubject={handleSaveSubject}
            onDeleteSubject={handleDeleteSubject}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onSaveGrades={handleSaveGrades}
            onGradeAndDelete={handleGradeAndDelete}
            onSaveSettings={handleSaveSettings}
            onPreviewImage={(url) => setLightboxImage(url)}
          />
        )}
      </main>

      {/* Global Modals */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
        expectedPassword={settings.adminPassword || 'admin1234'}
      />

      <LightboxModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setCameraCapturedPhoto(dataUrl);
        }}
      />
    </div>
  );
}
