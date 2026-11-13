'use client';

import React from 'react';
import { ShieldAlert, HeartPulse, Sparkles, UserCheck, MessageSquare, Trash2, Mail } from 'lucide-react';

interface TermsContentProps {
  locale?: 'th' | 'en';
}

export default function TermsContent({ locale = 'th' }: TermsContentProps) {
  const isThai = locale === 'th';

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
      {/* Document header badge */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {isThai ? 'มีผลบังคับใช้: 13 พฤศจิกายน 2026' : 'Effective Date: November 13, 2026'}
        </span>
        <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
          v1.2 (Active)
        </span>
      </div>

      {/* Section 1: Intro */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">1</span>
          {isThai ? 'บทนำและการยอมรับข้อตกลง' : 'Introduction & Acceptance'}
        </h3>
        <p>
          {isThai
            ? 'ยินดีต้อนรับสู่ LifeSync ("เรา" หรือ "บริการ") ข้อกำหนดการใช้งานนี้มีผลผูกพันทางกฎหมายระหว่างผู้ใช้งาน ("คุณ") กับ LifeSync ครอบคลุมการเข้าถึงและการใช้งานผ่านเว็บไซต์ lifesync.vercel.app รวมถึงระบบบอท LINE Official Account (ซันนี่ / Sunny ID: @766iowmg) การสร้างบัญชีหรือใช้บริการแสดงว่าคุณได้อ่าน เข้าใจ และยอมรับข้อกำหนดเหล่านี้ทั้งหมด'
            : 'Welcome to LifeSync ("we", "us", or "Service"). These Terms of Use constitute a legally binding agreement between you and LifeSync regarding your access to and use of our web platform (lifesync.vercel.app) and the LINE Official Account bot (Sunny ID: @766iowmg). By registering or using the Service, you signify that you have read, understood, and agreed to these Terms.'}
        </p>
      </section>

      {/* Section 2: Medical Disclaimer (Critical) */}
      <section className="space-y-2.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">2</span>
          {isThai ? 'ข้อชี้แจงสำคัญ: ผลิตภัณฑ์ไม่ใช่เครื่องมือแพทย์' : 'Critical Disclaimer: Non-Medical Product'}
        </h3>
        
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{isThai ? 'ข้อชี้แจงด้านสุขภาพ (Non-Medical Wellness Notice)' : 'Wellness & Non-Medical Notice'}</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
            {isThai
              ? 'LifeSync เป็นเว็บแอปพลิเคชันเพื่อการส่งเสริมสุขภาพ สร้างวินัยในชีวิตประจำวัน (Wellness & Habit Tracking) สำหรับบุคคลทั่วไป ไม่ใช่เครื่องมือแพทย์ (Medical Device) และไม่ได้ออกแบบมาเพื่อใช้ในการวินิจฉัย ตรวจรักษา ป้องกัน หรือบำบัดโรคใดๆ ข้อมูลและตัวเลขในระบบไม่สามารถนำมาทดแทนคำแนะนำจากแพทย์ เภสัชกร หรือนักโภชนาการวิชาชีพ หากคุณมีโรคประจำตัวหรือภาวะฉุกเฉินทางการแพทย์ กรุณาปรึกษาแพทย์ผู้เชี่ยวชาญทันที'
              : 'LifeSync is a digital lifestyle habit tracking and health education application intended for general wellness. It is NOT a medical device and is not designed to diagnose, treat, cure, or prevent any medical condition or disease. The information and analytics generated should never replace professional medical advice. Always consult a licensed healthcare practitioner regarding your health conditions.'}
          </p>
        </div>
      </section>

      {/* Section 3: AI & Estimates */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">3</span>
          {isThai ? 'การทำงานของ AI โค้ชและการประเมินสารอาหาร' : 'AI Coach & Nutritional Estimations'}
        </h3>
        <p>
          {isThai
            ? 'ฟีเจอร์วิเคราะห์อาหารด้วยภาพถ่ายและคำแนะนำจาก AI Coach (ซันนี่) ประมวลผลผ่านโมเดลปัญญาประดิษฐ์ขั้นสูง ตัวเลขแคลอรีและสารอาหาร (โปรตีน, คาร์โบไฮเดรต, ไขมัน) เป็นค่าประมาณการทางสถิติเพื่อความสะดวกในการบันทึกพฤติกรรมเท่านั้น เราไม่รับประกันความถูกต้องแม่นยำ 100% สำหรับการควบคุมอาหารทางการแพทย์หรือผู้มีอาการแพ้อาหารรุนแรง'
            : 'AI-assisted food photo recognition and coaching nudges provided by AI Coach Sunny are statistical approximations generated by advanced machine learning models. Caloric counts and macronutrient breakdowns are estimates for behavioral mindfulness only, not clinical dietary prescriptions.'}
        </p>
      </section>

      {/* Section 4: Account Security */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">4</span>
          {isThai ? 'บัญชีผู้ใช้งานและความปลอดภัย' : 'User Accounts & Security'}
        </h3>
        <p>
          {isThai
            ? 'คุณมีหน้าที่รักษาความลับของรหัสผ่านและข้อมูลรับรองบัญชีของคุณ คุณตกลงที่จะไม่เปิดเผยรหัสผ่านแก่บุคคลอื่น และต้องแจ้งให้เราทราบทันทีหากพบการเข้าถึงโดยไม่ได้รับอนุญาต ผู้ใช้งานต้องมีอายุอย่างน้อย 13 ปีบริบูรณ์ในการสร้างบัญชี'
            : 'You are responsible for safeguarding your account credentials. You agree not to disclose your password to any third party and must notify us immediately upon becoming aware of any breach of security. Users must be at least 13 years of age to register.'}
        </p>
      </section>

      {/* Section 5: LINE Integration */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">5</span>
          {isThai ? 'การเชื่อมต่อ LINE Official Account และการแจ้งเตือน' : 'LINE Integration & Notifications'}
        </h3>
        <p>
          {isThai
            ? 'เมื่อคุณเชื่อมต่อบัญชีกับ LINE Official Account คุณยินยอมให้ LifeSync ส่งข้อความแจ้งเตือนตามรอบเวลาที่คุณตั้งค่าไว้ (เช่น เตือนดื่มน้ำ เตือนมื้ออาหาร รายงานสรุปประจำสัปดาห์) คุณสามารถยกเลิกการเชื่อมต่อหรือปรับแต่งช่วงเวลาห้ามรบกวน (Quiet Hours) ได้ตลอดเวลาในหน้าการตั้งค่า'
            : 'When linking your account with our LINE Official Account, you consent to receive periodic scheduled messages (hydration nudges, meal prompts, and weekly digest cards). You can modify notification preferences or unlink your LINE account at any time via Settings.'}
        </p>
      </section>

      {/* Section 6: Data Ownership & Termination */}
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">6</span>
          {isThai ? 'สิทธิในข้อมูลและการลบบัญชี' : 'Data Ownership & Account Termination'}
        </h3>
        <p>
          {isThai
            ? 'คุณยังคงเป็นเจ้าของข้อมูลพฤติกรรมสุขภาพทั้งหมดที่คุณบันทึกในระบบ LifeSync ให้สิทธิคุณในการดาวน์โหลดสำเนาข้อมูล (Data Export) และการลบบัญชีพร้อมทำลายข้อมูลประวัติสุขภาพทั้งหมดอย่างถาวร (Permanent Account Deletion) ผ่านหน้าตั้งค่าได้ทุกเมื่อ'
            : 'You retain full ownership of the health habit data you input. LifeSync grants you the tools to export your full data records and permanently delete your account and all associated logs at any time from your account settings.'}
        </p>
      </section>

      {/* Section 7: Contact */}
      <section className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">7</span>
          {isThai ? 'การติดต่อสอบถาม' : 'Contact Us'}
        </h3>
        <p>
          {isThai
            ? 'หากมีข้อสงสัยเกี่ยวกับข้อกำหนดการใช้งาน สามารถติดต่อทีมพัฒนา LifeSync ได้ทาง LINE Official Account @766iowmg หรือ support@lifesync.app'
            : 'If you have questions regarding these Terms, contact the LifeSync team via our LINE Official Account @766iowmg or support@lifesync.app.'}
        </p>
      </section>
    </div>
  );
}
