import React, { useEffect, useState } from 'react';
import {
  X,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Camera,
  Send,
  Trash2,
  ExternalLink,
  Paperclip,
} from 'lucide-react';
import { Assignment, AttachmentItem, Student, Subject, Submission } from '../../types';
import { formatThaiDateTime } from '../../utils/assignmentLogic';

interface SubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  subject: Subject | null;
  activeStudent: Student | null;
  existingSubmission?: Submission | null;
  onSubmit: (submission: {
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

export const SubmitWorkModal: React.FC<SubmitWorkModalProps> = ({
  isOpen,
  onClose,
  assignment,
  subject,
  activeStudent,
  existingSubmission,
  onSubmit,
  onOpenCamera,
  cameraCapturedPhoto,
  onClearCapturedPhoto,
  onPreviewImage,
}) => {
  const [url, setUrl] = useState('');
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [pendingImageFile, setPendingImageFile] = useState<File | Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingSubmission) {
        setUrl(existingSubmission.url || '');
        setComment(existingSubmission.comment || '');
        setAttachments(existingSubmission.attachments ? [...existingSubmission.attachments] : []);
      } else {
        setUrl('');
        setComment('');
        setAttachments([]);
      }
      setPendingImageFile(null);
      setIsSubmitting(false);
      setValidationError('');
    }
  }, [isOpen, existingSubmission]);

  // When camera snapshot arrives from CameraModal
  useEffect(() => {
    if (cameraCapturedPhoto) {
      const newAttachment: AttachmentItem = {
        id: 'att_' + Date.now(),
        name: `ภาพถ่ายจากกล้อง_${new Date().toLocaleTimeString('th-TH')}.jpg`,
        type: 'image',
        url: cameraCapturedPhoto,
      };
      setAttachments((prev) => [...prev, newAttachment]);
      // Convert data URL to Blob for Firebase upload
      try {
        const parts = cameraCapturedPhoto.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        setPendingImageFile(blob);
      } catch (e) {
        console.error('Failed to convert camera snapshot to blob', e);
      }
      onClearCapturedPhoto();
    }
  }, [cameraCapturedPhoto, onClearCapturedPhoto]);

  if (!isOpen || !assignment || !activeStudent) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'image') {
      setPendingImageFile(files[0]);
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAttachment: AttachmentItem = {
            id: 'att_' + Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: type,
            url: event.target.result as string,
          };
          setAttachments((prev) => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() && attachments.length === 0) {
      setValidationError('กรุณาแนบลิงก์ผลงาน หรือแนบไฟล์/ถ่ายภาพอย่างน้อย 1 รายการ');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        assignmentId: assignment.id,
        studentId: activeStudent.id,
        url: url.trim(),
        attachments: attachments,
        comment: comment.trim(),
        imageFile: pendingImageFile,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError('เกิดข้อผิดพลาดในการส่งงาน: ' + (err?.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-md">
              {subject?.name || 'ทั่วไป'}
            </span>
            <span className="text-xs text-slate-500 font-mono">({subject?.code})</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">{assignment.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดส่ง: <strong className="text-slate-700">{formatThaiDateTime(assignment.dueDate)}</strong> | คะแนนเต็ม:{' '}
            <strong className="text-amber-600">{assignment.maxScore} คะแนน</strong>
          </p>
        </div>

        {/* Teacher Material link if available */}
        {assignment.materialUrl && (
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-amber-600 shrink-0" />
              <span>มีเอกสาร/ลิงก์คำสั่งงานจากคุณครู:</span>
            </div>
            <a
              href={assignment.materialUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>เปิดดูคำสั่งงาน</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submission URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แนบลิงก์งานส่ง (เช่น Google Drive, Canva, YouTube):
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setValidationError('');
                }}
                placeholder="https://..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Attachment Controls */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              แนบไฟล์เอกสาร หรือ รูปภาพถ่ายผลงาน:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Doc Upload */}
              <label className="flex items-center justify-center p-3 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl cursor-pointer text-xs font-bold text-sky-700 transition gap-2 group">
                <FileText className="w-5 h-5 text-rose-500 group-hover:scale-110 transition" />
                <span>📄 แนบไฟล์เอกสาร (PDF, Word, ZIP)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.zip,.rar,.txt,.ppt,.pptx"
                  onChange={(e) => handleFileUpload(e, 'doc')}
                  className="hidden"
                />
              </label>

              {/* Photo Upload & Camera Trigger */}
              <div className="flex gap-1.5">
                <label className="flex-grow flex items-center justify-center p-3 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-xl cursor-pointer text-xs font-bold text-amber-800 transition gap-1.5 group">
                  <ImageIcon className="w-5 h-5 text-amber-600 group-hover:scale-110 transition" />
                  <span>📷 แนบรูปภาพ</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={onOpenCamera}
                  className="px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1"
                  title="ถ่ายภาพจากกล้องสด"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Attached Files Preview */}
          {attachments.length > 0 && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <p className="text-xs font-bold text-slate-700">
                รายการไฟล์ที่แนบไว้ ({attachments.length} ไฟล์):
              </p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:shadow transition"
                  >
                    {att.type === 'image' ? (
                      <button
                        type="button"
                        onClick={() => onPreviewImage(att.url)}
                        className="cursor-pointer hover:opacity-80"
                        title="คลิกเพื่อขยายภาพ"
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-7 h-7 object-cover rounded border border-slate-200"
                        />
                      </button>
                    ) : (
                      <FileText className="w-4 h-4 text-sky-600" />
                    )}
                    <span className="truncate max-w-[130px] text-slate-800" title={att.name}>
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-rose-400 hover:text-rose-600 ml-1 p-0.5 rounded transition"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment to teacher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ข้อความถึงคุณครู (ถ้ามี):
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ระบุข้อความเพิ่มเติมหรือหมายเหตุถึงครูผู้สอน..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {validationError && (
            <div className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              {validationError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังย่อขนาดภาพ (Canvas API) & บันทึกลง Firebase...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>บันทึกข้อมูลและยืนยันการส่งงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
