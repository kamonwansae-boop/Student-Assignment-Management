import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  doc,
  updateDoc,
  deleteField,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { handleFirestoreError } from './utils/firebaseErrors';
import { AppSettings, Assignment, Student, Subject, Submission } from './types';
import {
  DEFAULT_SETTINGS,
  INITIAL_ASSIGNMENTS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_SUBMISSIONS,
} from './utils/assignmentLogic';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
// Use configured databaseId if present, else default
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export interface FirebaseSubmissionDoc {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  filePath?: string;
  fileUrl?: string; // Removed after graded to reclaim quota
  status: 'pending' | 'graded';
  score: number | null;
  submittedAt: any;
}

/**
 * Canvas API Helper:
 * Automatically resizes imageFile so max-width <= 1280px and compresses JPEG quality to 70-80% (default 0.75 / 75%).
 */
export function resizeImageWithCanvas(
  imageFile: File | Blob,
  maxWidth: number = 1280,
  quality: number = 0.75
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If running in an environment without DOM window/Image (e.g. Node tests), fallback to imageFile
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return resolve(imageFile);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while ensuring width <= maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get Canvas 2D context'));
          return;
        }

        // Fill background with white in case of transparent PNG converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 70-80% quality (0.75)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas image conversion to JPEG blob failed'));
            }
          },
          'image/jpeg',
          Math.min(0.8, Math.max(0.7, quality))
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image into HTML Image object'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file with FileReader'));
    };

    reader.readAsDataURL(imageFile);
  });
}

/**
 * 1. ฟังก์ชัน submitWork(studentId, studentName, title, imageFile) (สำหรับนักเรียน):
 * - ใช้ Canvas API ย่อขนาด imageFile อัตโนมัติให้ความกว้างไม่เกิน 1280px และปรับคุณภาพ JPG เหลือ 70-80% ก่อนส่ง
 * - อัปโหลดรูปที่ย่อแล้วไปยัง Firebase Storage โฟลเดอร์ submissions/
 * - บันทึกข้อมูลลง Firestore Collection submissions (studentId, studentName, title, filePath, fileUrl, status: "pending", score: null, submittedAt: serverTimestamp())
 */
export async function submitWork(
  studentId: string,
  studentName: string,
  title: string,
  imageFile: File | Blob
): Promise<{ docId: string; filePath: string; fileUrl: string }> {
  try {
    // 1. Resize image via Canvas API (max-width <= 1280px, quality 75% JPG)
    const resizedBlob = await resizeImageWithCanvas(imageFile, 1280, 0.75);

    // 2. Generate unique storage path in submissions/
    const originalName = imageFile instanceof File ? imageFile.name : 'camera_capture.jpg';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `submissions/${studentId}_${timestamp}_${sanitizedName}`;

    // Upload to Firebase Storage with fast timeout fallback
    let fileUrl: string;
    try {
      const storageRef = ref(storage, filePath);
      const uploadPromise = uploadBytes(storageRef, resizedBlob, {
        contentType: 'image/jpeg',
        customMetadata: {
          studentId,
          studentName,
          title,
          compressed: 'true',
          maxWidth: '1280',
        },
      }).then(() => getDownloadURL(storageRef));

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timed out')), 4000)
      );

      fileUrl = await Promise.race([uploadPromise, timeoutPromise]);
    } catch (storageErr: any) {
      console.warn(
        '[Firebase Storage] Direct upload notice (e.g. Storage CORS or timeout). Using resilient compressed JPEG data fallback:',
        storageErr
      );
      // Fallback: Read resized blob as Data URL so student work is never lost
      fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read compressed blob as data URL'));
        reader.readAsDataURL(resizedBlob);
      });
    }

    // 3. Save metadata to Firestore collection "submissions"
    const submissionsCol = collection(db, 'submissions');
    const docRef = await addDoc(submissionsCol, {
      studentId,
      studentName,
      title,
      filePath,
      fileUrl,
      status: 'pending',
      score: null,
      submittedAt: serverTimestamp(),
    });

    return {
      docId: docRef.id,
      filePath,
      fileUrl,
    };
  } catch (err: any) {
    handleFirestoreError(err, 'submitWork');
    throw err;
  }
}

/**
 * 2. ฟังก์ชัน gradeAndDelete(docId, filePath, score) (สำหรับครู):
 * - สั่ง deleteObject ลบไฟล์ออกจาก Firebase Storage ตาม filePath เพื่อคืนพื้นที่โควต้า 5GB
 * - อัปเดต Firestore เอกสาร docId เปลี่ยน status: "graded", บันทึก score, และลบฟิลด์ fileUrl ออก
 */
export async function gradeAndDelete(
  docId: string,
  filePath: string,
  score: number
): Promise<{ success: boolean; docId: string; score: number }> {
  try {
    // 1. Delete image file from Firebase Storage to reclaim 5GB quota
    if (filePath && filePath.trim() !== '') {
      try {
        const fileRef = ref(storage, filePath);
        const delPromise = deleteObject(fileRef);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Storage delete timed out')), 4000)
        );
        await Promise.race([delPromise, timeoutPromise]);
        console.log(`[Firebase Storage] Successfully deleted ${filePath} to reclaim quota.`);
      } catch (storageErr: any) {
        // If file already deleted or not found or CORS, proceed with Firestore grading update
        if (storageErr?.code !== 'storage/object-not-found') {
          console.warn('[Firebase Storage] Notice during deleteObject:', storageErr);
        }
      }
    }

    // 2. Update Firestore doc: status -> "graded", score, remove fileUrl field via deleteField()
    const docRef = doc(db, 'submissions', docId);
    await updateDoc(docRef, {
      status: 'graded',
      score: Number(score),
      fileUrl: deleteField(),
    });

    return {
      success: true,
      docId,
      score: Number(score),
    };
  } catch (err: any) {
    handleFirestoreError(err, 'gradeAndDelete');
    throw err;
  }
}

/**
 * Real-time listener for Firestore submissions collection
 */
export function subscribeFirebaseSubmissions(
  callback: (submissions: FirebaseSubmissionDoc[]) => void,
  onError?: (error: any) => void
): () => void {
  try {
    const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: FirebaseSubmissionDoc[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            title: data.title || '',
            filePath: data.filePath || '',
            fileUrl: data.fileUrl || undefined,
            status: data.status || 'pending',
            score: data.score !== undefined ? data.score : null,
            submittedAt: data.submittedAt,
          };
        });
        callback(items);
      },
      (err) => {
        handleFirestoreError(err, 'subscribeFirebaseSubmissions');
        if (onError) onError(err);
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeFirebaseSubmissions');
    return () => {};
  }
}

/**
 * One-off fetch of Firestore submissions
 */
export async function getFirebaseSubmissions(): Promise<FirebaseSubmissionDoc[]> {
  try {
    const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        studentId: data.studentId || '',
        studentName: data.studentName || '',
        title: data.title || '',
        filePath: data.filePath || '',
        fileUrl: data.fileUrl || undefined,
        status: data.status || 'pending',
        score: data.score !== undefined ? data.score : null,
        submittedAt: data.submittedAt,
      };
    });
  } catch (err) {
    handleFirestoreError(err, 'getFirebaseSubmissions');
    return [];
  }
}

/**
 * -------------------------------------------------------------
 * Multi-device Cross-Platform Firestore Cloud Sync
 * Ensures data is stored in Cloud Firestore and preserved across all devices.
 * -------------------------------------------------------------
 */

// --- SUBJECTS ---
export async function saveSubjectToFirestore(subject: Subject): Promise<void> {
  try {
    const docRef = doc(db, 'subjects', subject.id);
    await setDoc(docRef, { ...subject });
  } catch (err) {
    handleFirestoreError(err, 'saveSubjectToFirestore');
    throw err;
  }
}

export async function deleteSubjectFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'subjects', id));
  } catch (err) {
    handleFirestoreError(err, 'deleteSubjectFromFirestore');
    throw err;
  }
}

export function subscribeSubjects(callback: (subjects: Subject[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'subjects'),
      (snapshot) => {
        const list: Subject[] = snapshot.docs.map((d) => d.data() as Subject);
        // Sort by grade and room
        list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, 'subscribeSubjects');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeSubjects');
    return () => {};
  }
}

// --- STUDENTS ---
export async function saveStudentToFirestore(student: Student): Promise<void> {
  try {
    const docRef = doc(db, 'students', student.id);
    await setDoc(docRef, { ...student });
  } catch (err) {
    handleFirestoreError(err, 'saveStudentToFirestore');
    throw err;
  }
}

export async function deleteStudentFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (err) {
    handleFirestoreError(err, 'deleteStudentFromFirestore');
    throw err;
  }
}

export function subscribeStudents(callback: (students: Student[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const list: Student[] = snapshot.docs.map((d) => d.data() as Student);
        list.sort(
          (a, b) =>
            (a.grade || '').localeCompare(b.grade || '') ||
            (a.room || '').localeCompare(b.room || '') ||
            (a.number || 0) - (b.number || 0)
        );
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, 'subscribeStudents');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeStudents');
    return () => {};
  }
}

// --- ASSIGNMENTS ---
export async function saveAssignmentToFirestore(assignment: Assignment): Promise<void> {
  try {
    const docRef = doc(db, 'assignments', assignment.id);
    await setDoc(docRef, { ...assignment });
  } catch (err) {
    handleFirestoreError(err, 'saveAssignmentToFirestore');
    throw err;
  }
}

export async function deleteAssignmentFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assignments', id));
  } catch (err) {
    handleFirestoreError(err, 'deleteAssignmentFromFirestore');
    throw err;
  }
}

export function subscribeAssignments(callback: (assignments: Assignment[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'assignments'),
      (snapshot) => {
        const list: Assignment[] = snapshot.docs.map((d) => d.data() as Assignment);
        list.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));
        callback(list);
      },
      (err) => {
        handleFirestoreError(err, 'subscribeAssignments');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeAssignments');
    return () => {};
  }
}

// --- SETTINGS ---
export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'app_settings');
    await setDoc(docRef, { ...settings });
  } catch (err) {
    handleFirestoreError(err, 'saveSettingsToFirestore');
    throw err;
  }
}

export function subscribeSettings(callback: (settings: AppSettings) => void): () => void {
  try {
    return onSnapshot(
      doc(db, 'settings', 'app_settings'),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as AppSettings);
        }
      },
      (err) => {
        handleFirestoreError(err, 'subscribeSettings');
      }
    );
  } catch (err) {
    handleFirestoreError(err, 'subscribeSettings');
    return () => {};
  }
}

// --- SUBMISSIONS SYNC ---
export async function saveSubmissionRecordToFirestore(sub: Submission): Promise<void> {
  try {
    const docRef = doc(db, 'submissions', sub.id);
    await setDoc(
      docRef,
      {
        studentId: sub.studentId,
        assignmentId: sub.assignmentId,
        submitDate: sub.submitDate,
        url: sub.url || '',
        attachments: sub.attachments || [],
        comment: sub.comment || '',
        score: sub.score,
        graded: sub.graded,
        isLate: sub.isLate,
        filePath: sub.filePath || '',
        fileUrl: sub.fileUrl || '',
        status: sub.graded ? 'graded' : 'pending',
        submittedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'saveSubmissionRecordToFirestore');
    throw err;
  }
}

/**
 * Initializes Cloud Firestore database with seed data if currently empty.
 * Guarantees that any device opening the app for the first time has full access
 * to subjects, students, assignments, and settings from Firestore cloud.
 */
export async function initializeFirestoreDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'app_settings'), DEFAULT_SETTINGS);
    }

    // 2. Subjects
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    if (subjectsSnap.empty) {
      for (const subj of INITIAL_SUBJECTS) {
        await setDoc(doc(db, 'subjects', subj.id), subj);
      }
    }

    // 3. Students
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (studentsSnap.empty) {
      for (const std of INITIAL_STUDENTS) {
        await setDoc(doc(db, 'students', std.id), std);
      }
    }

    // 4. Assignments
    const assignSnap = await getDocs(collection(db, 'assignments'));
    if (assignSnap.empty) {
      for (const asn of INITIAL_ASSIGNMENTS) {
        await setDoc(doc(db, 'assignments', asn.id), asn);
      }
    }

    // 5. Submissions
    const subSnap = await getDocs(collection(db, 'submissions'));
    if (subSnap.empty) {
      for (const s of INITIAL_SUBMISSIONS) {
        await setDoc(doc(db, 'submissions', s.id), {
          ...s,
          title: 'ใบงานเรื่องเซลล์และโครงสร้างพืช',
          studentName: 'นาย อัครพล มั่งคั่ง',
          status: 'graded',
          submittedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('initializeFirestoreDatabaseIfEmpty notice:', err);
  }
}

