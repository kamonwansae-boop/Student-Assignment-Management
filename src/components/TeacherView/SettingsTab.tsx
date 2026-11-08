import React, { useState } from 'react';
import { Sliders, Save, Table, HelpCircle, Check, Image as ImageIcon } from 'lucide-react';
import { AppSettings } from '../../types';

interface SettingsTabProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onOpenAppsScriptHelp: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onOpenAppsScriptHelp,
}) => {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [adminPassword, setAdminPassword] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState(settings.googleSheetUrl);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.schoolLogo);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      schoolName: schoolName.trim(),
      teacherName: teacherName.trim(),
      googleSheetUrl: googleSheetUrl.trim(),
      schoolLogo: logoPreview,
      adminPassword: adminPassword.trim() ? adminPassword.trim() : settings.adminPassword,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-5 max-w-3xl mx-auto border border-slate-100">
      <h3 className="text-base sm:text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
        <Sliders className="w-5 h-5 text-indigo-600" />
        <span>ตั้งค่าข้อมูลระบบ & รหัสผ่าน</span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ชื่อโรงเรียน / สถาบันการศึกษา:
          </label>
          <input
            type="text"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ชื่อครูประจำวิชา / Admin ผู้ดูแลระบบ:
          </label>
          <input
            type="text"
            required
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ตั้งรหัสผ่าน ADMIN ใหม่:
          </label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน (ค่าตั้งต้น: admin1234)"
            className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            อัปโหลดรูปโลโก้โรงเรียน:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          {logoPreview && (
            <div className="mt-3 flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-fit">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-12 h-12 object-cover rounded-full border border-slate-300 shadow-sm"
              />
              <span className="text-xs text-slate-600 font-medium">ตัวอย่างโลโก้ใหม่</span>
              <button
                type="button"
                onClick={() => setLogoPreview(null)}
                className="text-xs text-rose-500 hover:underline ml-2"
              >
                ลบโลโก้
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Google Apps Script Web App URL (บันทึกข้อมูลเข้า Google Sheet อัตโนมัติ):</span>
          </label>
          <input
            type="url"
            value={googleSheetUrl}
            onChange={(e) => setGoogleSheetUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <p className="text-[11px] text-slate-500">
            หากเว้นว่างไว้ ระบบจะบันทึกข้อมูลและคำนวณคะแนนใน LocalStorage ของเบราว์เซอร์อย่างสมบูรณ์
          </p>

          <button
            type="button"
            onClick={onOpenAppsScriptHelp}
            className="text-xs text-sky-600 hover:text-sky-800 hover:underline font-bold flex items-center gap-1 pt-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span>วิธีเชื่อมต่อกับ Google Sheet (ดูโค้ด Apps Script พร้อมใช้งาน)</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว</span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่าระบบ</span>
          </button>
        </div>
      </form>
    </div>
  );
};
