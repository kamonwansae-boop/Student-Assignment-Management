import React, { useState } from 'react';
import { X, Copy, Check, Code2, ExternalLink } from 'lucide-react';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Create header row if empty sheet
    if (sheet.getLastRow() == 0) {
      sheet.appendRow([
        "Timestamp",
        "Student ID",
        "Student Name",
        "Subject",
        "Assignment Title",
        "Score",
        "Max Score",
        "Status",
        "Links/Files"
      ]);
    }
    
    sheet.appendRow([
      new Date(),
      data.studentId,
      data.studentName,
      data.subject,
      data.assignmentTitle,
      data.score || "",
      data.maxScore || "",
      data.status || "ส่งแล้ว",
      data.attachments || data.link || ""
    ]);
    
    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative space-y-4 text-xs border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-200 pb-2">
          <Code2 className="w-5 h-5 text-emerald-600" />
          <span>โค้ด Google Apps Script สำหรับเชื่อมต่อ Google Sheet</span>
        </h3>

        <div className="text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>ขั้นตอนการเชื่อมต่อ:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>เปิด Google Sheet เปล่า หรือไฟล์การสอนของคุณ</li>
            <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
            <li>ลบโค้ดเดิมแล้ววางโค้ด JavaScript ด้านล่างนี้ลงไป แล้วกดบันทึก (Ctrl + S)</li>
            <li>กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy) &gt; การทําให้ใช้งานได้ใหม่ (New deployment)</strong></li>
            <li>เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong></li>
            <li>กำหนดการเข้าถึง (Who has access) ให้เป็น <i>&ldquo;ทุกคน (Anyone)&rdquo;</i></li>
            <li>คัดลอก Web App URL ที่ได้ นำมากรอกในหน้า <strong>ตั้งค่าระบบ</strong> ของระบบนี้</li>
          </ol>
        </div>

        <div className="relative bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner border border-slate-800">
          <pre>{APPS_SCRIPT_CODE}</pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกเรียบร้อย' : 'คัดลอกโค้ด'}</span>
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
