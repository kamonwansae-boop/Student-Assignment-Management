import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
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
