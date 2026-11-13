'use client';

import React from 'react';
import { ShieldCheck, Lock, Database, Eye, Download, Trash2, Cpu, Globe } from 'lucide-react';

interface PrivacyContentProps {
  locale?: 'th' | 'en';
}

export default function PrivacyContent({ locale = 'th' }: PrivacyContentProps) {
  const isThai = locale === 'th';

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
      {/* Document header badge */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {isThai ? 'นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliant)' : 'Personal Data Protection (PDPA & Privacy)'}
        </span>
        <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
          {isThai ? 'ปรับปรุงล่าสุด: พฤศจิกายน 2026' : 'Updated: Nov 2026'}
        </span>
      </div>

      {/* Overview callout */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{isThai ? 'คำมั่นสัญญาความเป็นส่วนตัวของ LifeSync' : 'Our Privacy Commitment'}</span>
        </div>
        <p className="text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
          {isThai
            ? 'LifeSync ให้ความสำคัญสูงสุดกับความเป็นส่วนตัวและความปลอดภัยของข้อมูลสุขภาพของคุณ เราจัดเก็บเฉพาะข้อมูลที่จำเป็นต่อการใช้งาน ไม่เคยขายข้อมูลของคุณให้นายหน้าหรือผู้โฆษณาภายนอก และคุณสามารถส่งออกหรือลบข้อมูลทั้งหมดของคุณได้ทุกเมื่อ'
            : 'LifeSync treats your personal and lifestyle data with the highest standard of care. We collect only what is strictly necessary to deliver your habits tracker, we NEVER sell your health data to third-party advertisers, and you have complete control to export or permanently delete it.'}
        </p>
      </div>

      {/* Section 1: Data We Collect */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">1</span>
          {isThai ? 'ข้อมูลส่วนบุคคลที่เราจัดเก็บ' : 'Information We Collect'}
        </h3>
        <p>
          {isThai ? 'เราจัดเก็บข้อมูลเมื่อคุณลงทะเบียนและใช้งานระบบ ดังต่อไปนี้:' : 'We collect personal information when you register and interact with our application:'}
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400 text-xs">
          <li>
            <strong className="text-slate-800 dark:text-slate-200">{isThai ? 'ข้อมูลบัญชี: ' : 'Account Profile: '}</strong>
            {isThai ? 'ชื่อที่ใช้แสดง (Display Name), ที่อยู่อีเมล, รหัสผ่านที่ผ่านการเข้ารหัส (Encrypted Hash), เขตเวลา (Timezone)' : 'Display name, email address, cryptographically hashed passwords, timezone.'}
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">{isThai ? 'บันทึกพฤติกรรมสุขภาพ: ' : 'Lifestyle Logs: '}</strong>
            {isThai ? 'ข้อมูลปริมาณน้ำดื่ม (ml), บันทึกอาหารและรูปถ่ายมื้ออาหาร, บันทึกเวลานอนและเวลางีบ' : 'Water intake logs (ml), food logs & meal photos, sleep times & nap records.'}
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">{isThai ? 'ข้อมูลการเชื่อมต่อ LINE: ' : 'LINE Identity Data: '}</strong>
            {isThai ? 'LINE User ID (UID) และชื่อโปรไฟล์ LINE เมื่อคุณเลือกเชื่อมต่อกับบอทซันนี่' : 'LINE User ID (UID) and LINE display name when voluntarily linked to bot Sunny.'}
          </li>
          <li>
            <strong className="text-slate-800 dark:text-slate-200">{isThai ? 'ข้อมูลการตั้งค่าในเครื่อง: ' : 'Device Preferences: '}</strong>
            {isThai ? 'ภาษาที่เลือก (ไทย/อังกฤษ), ธีม (Light/Dark), และการเปิด/ปิดเสียงและระบบสั่น' : 'Selected locale (TH/EN), theme (Light/Dark), and sound/haptics toggles.'}
          </li>
        </ul>
      </section>

      {/* Section 2: Purpose of Processing */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
          {isThai ? 'วัตถุประสงค์ในการประมวลผลข้อมูล' : 'Purpose of Data Processing'}
        </h3>
        <p>
          {isThai
            ? 'ข้อมูลของคุณถูกนำมาใช้เพื่อวัตถุประสงค์ในการให้บริการโดยตรงเท่านั้น ได้แก่:'
            : 'Your personal data is processed solely for direct service delivery purposes:'}
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400 text-xs">
          <li>{isThai ? 'คำนวณสถิติสุขภาพประจำวันและกราฟแนวโน้ม 7 วัน' : 'Generating daily analytics and 7-day health trend charts.'}</li>
          <li>{isThai ? 'ส่งข้อความเตือนความสม่ำเสมอและ Flex Message รายงานประจำสัปดาห์ทาง LINE' : 'Delivering scheduled LINE reminders and Sunday weekly report cards.'}</li>
          <li>{isThai ? 'คำนวณแต้มสะสม เลเวล และเหรียญความสำเร็จ (Gamification)' : 'Computing consistency streaks, points, levels, and milestone badges.'}</li>
        </ul>
      </section>

      {/* Section 3: AI Processing */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">3</span>
          {isThai ? 'การประมวลผลภาพถ่ายอาหารด้วย AI' : 'AI Food Photo Processing'}
        </h3>
        <p>
          {isThai
            ? 'เมื่อคุณอัปโหลดภาพอาหาร ภาพจะถูกส่งผ่านช่องทางที่เข้ารหัส (Encrypted API) ไปยังโมเดล Gemini API เพื่อประเมินชนิดอาหารและค่าพลังงานแคลอรีเท่านั้น ภาพถ่ายจะไม่ถูกนำไปใช้เพื่อการฝึกอบรมโมเดลสาธารณะที่ไม่ได้รับอนุญาต และไม่ถูกแชร์ต่อแก่บุคคลที่สาม'
            : 'When uploading meal images, photos are transmitted via encrypted HTTPS channels to the Gemini API strictly for visual nutrient recognition. Images are not used to train unauthorized public models nor shared with third-party advertisers.'}
        </p>
      </section>

      {/* Section 4: Security & Storage */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">4</span>
          {isThai ? 'ความปลอดภัยและการจัดเก็บข้อมูล' : 'Data Storage & Security Standards'}
        </h3>
        <p>
          {isThai
            ? 'ฐานข้อมูล LifeSync ทำงานบนโครงสร้างพื้นฐานระดับองค์กรของ Supabase (PostgreSQL) พร้อมนโยบายรักษาความปลอดภัยระดับแถวข้อมูล (Row-Level Security: RLS) ทำให้มีเพียงบัญชีของคุณเท่านั้นที่มีสิทธิ์อ่านหรือแก้ไขบันทึกสุขภาพของคุณ การรับส่งข้อมูลทั้งหมดเข้ารหัสผ่านโปรโตคอล TLS 1.3 / HTTPS'
            : 'LifeSync stores your data on enterprise-grade Supabase PostgreSQL infrastructure configured with strict Row-Level Security (RLS) policies, guaranteeing that only your authenticated account can access your records. All data in transit is encrypted using modern TLS 1.3 / HTTPS protocols.'}
        </p>
      </section>

      {/* Section 5: User Rights under PDPA */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">5</span>
          {isThai ? 'สิทธิของคุณตามกฎหมาย PDPA' : 'Your PDPA Rights'}
        </h3>
        <p>
          {isThai
            ? 'คุณมีสิทธิ์เต็มที่ในการควบคุมข้อมูลของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ดังนี้:'
            : 'In compliance with Thailand’s Personal Data Protection Act (PDPA) and international standards, you have the following rights:'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isThai ? 'สิทธิการขอรับสำเนา (Export)' : 'Right to Portability'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isThai ? 'ดาวน์โหลดข้อมูลทั้งหมดของคุณในรูปแบบไฟล์ JSON หรือ CSV ได้ตลอดเวลาในหน้าตั้งค่า' : 'Download a full backup of all your personal data anytime in Settings.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600 dark:text-rose-400">
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isThai ? 'สิทธิการขอลบข้อมูล (Erasure)' : 'Right to Erasure'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isThai ? 'ขอลบและทำลายบัญชีพร้อมประวัติสุขภาพทั้งหมดอย่างถาวรและไม่สามารถกู้คืนได้ทันที' : 'Permanently wipe your account and all associated health records.'}
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Contact */}
      <section className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">6</span>
          {isThai ? 'ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)' : 'Privacy Inquiries & DPO'}
        </h3>
        <p>
          {isThai
            ? 'หากคุณมีคำถาม ข้อเสนอแนะ หรือต้องการใช้สิทธิตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล สามารถส่งอีเมลถึงเราได้ที่ privacy@lifesync.app หรือแจ้งผ่าน LINE Official Account @766iowmg'
            : 'If you have any questions regarding this Privacy Policy or wish to exercise your data rights, please contact our Data Protection representative at privacy@lifesync.app or through LINE OA @766iowmg.'}
        </p>
      </section>
    </div>
  );
}
