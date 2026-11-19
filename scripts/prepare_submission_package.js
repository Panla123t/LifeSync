const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const submissionDir = path.join(rootDir, 'GoogleDrive_Submission_Package');

const dir21 = path.join(submissionDir, '21_ข้อเสนอนวัตกรรมการสื่อสารสุขภาพ_PDF');
const dir22 = path.join(submissionDir, '22_ไฟล์ตัวอย่างนวัตกรรมการสื่อสารสุขภาพ_สื่อต่างๆ');

const dirMascot = path.join(dir22, '01_ภาพมาสคอตและอัตลักษณ์_Mascot');
const dirLine = path.join(dir22, '02_ภาพสื่อLINE_OA_และริชเมนู');
const dirScreenshots = path.join(dir22, '03_ภาพหน้าจอระบบจริง_UI_Screenshots');
const dirPoster = path.join(dir22, '04_โปสเตอร์และเอกสารสรุปผลงาน');

// Create directories
[submissionDir, dir21, dir22, dirMascot, dirLine, dirScreenshots, dirPoster].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Copy 21: Proposal files
const htmlSrc = path.join(rootDir, 'docs', 'LifeSync_Proposal.html');
const mdSrc = path.join(rootDir, 'docs', 'LIFESYNC_PROPOSAL_FULL.md');

if (fs.existsSync(htmlSrc)) {
  fs.copyFileSync(htmlSrc, path.join(dir21, 'LifeSync_Health_Communication_Proposal.html'));
}
if (fs.existsSync(mdSrc)) {
  fs.copyFileSync(mdSrc, path.join(dir21, 'LifeSync_Health_Communication_Proposal.md'));
}

// Instructions for 21
const guide21 = `วิธีบันทึกเอกสารข้อเสนอโครงการเป็น PDF (สำหรับส่งข้อ 21)
===================================================

วิธีที่ 1 (แนะนำ - สะดวก สวยงาม และรวดเร็วที่สุด 10 วินาที):
1. ดับเบิลคลิกเปิดไฟล์ "LifeSync_Health_Communication_Proposal.html" ใน Google Chrome หรือ Microsoft Edge
2. กดปุ่มสีเขียว "🖨️ กดพิมพ์ / บันทึกเป็น PDF (Print to PDF)" หรือกดแป้นพิมพ์ Ctrl + P
3. ตรงช่อง "ปลายทาง (Destination)" ให้เลือก "บันทึกเป็น PDF (Save as PDF)"
4. กด "บันทึก (Save)" จะได้ไฟล์ LifeSync_Proposal.pdf ที่จัดหน้าสวยงามพร้อมส่งทันที!

วิธีที่ 2 (ผ่าน Microsoft Word หรือ Google Docs):
1. เปิดไฟล์ "LifeSync_Health_Communication_Proposal.md" ด้วย Notepad หรือ Text Editor
2. คัดลอกข้อความทั้งหมด ไปวางใน Google Docs หรือ Word
3. ใส่ชื่อ-นามสกุลของคุณ และสถาบันในหน้าแรก
4. เลือก เมนู ไฟล์ (File) -> ดาวน์โหลด (Download) -> เอกสาร PDF (.pdf)

จากนั้นอัปโหลดไฟล์ PDF ขึ้น Google Drive แล้วนำลิงก์มาวางในข้อ 21
(อย่าลืมตั้งค่าแชร์เป็น Anyone with the link can view / ทุกคนที่มีลิงก์มีสิทธิ์อ่าน)`;

fs.writeFileSync(path.join(dir21, '00_วิธีบันทึกเป็นPDF.txt'), guide21, 'utf8');

// Copy Mascot Images
const mascotAvatar = path.join(rootDir, 'public', 'mascot', 'sunny-avatar.jpg');
const mascotFull = path.join(rootDir, 'public', 'mascot', 'sunny-fullbody.jpg');

if (fs.existsSync(mascotAvatar)) fs.copyFileSync(mascotAvatar, path.join(dirMascot, '01_Sunny_Avatar_Face.jpg'));
if (fs.existsSync(mascotFull)) fs.copyFileSync(mascotFull, path.join(dirMascot, '02_Sunny_FullBody_Coach.jpg'));

// Also copy from brain artifacts if available
const brainDir = 'C:\\Users\\Devil\\.gemini\\antigravity\\brain\\d084e998-bab4-4caa-bb11-7293c9d300d9';
const brainCloseup = path.join(brainDir, 'sunny_lifesync_avatar_closeup_1794575908832.jpg');
if (fs.existsSync(brainCloseup)) fs.copyFileSync(brainCloseup, path.join(dirMascot, '03_Sunny_Mascot_HighRes.jpg'));

// Copy LINE OA assets
const richmenu6 = path.join(rootDir, 'public', 'line', 'rich-menu-6tiles.png');
const richmenuAlt = path.join(rootDir, 'public', 'richmenu.png');
if (fs.existsSync(richmenu6)) fs.copyFileSync(richmenu6, path.join(dirLine, '01_LINE_RichMenu_6Tiles.png'));
if (fs.existsSync(richmenuAlt)) fs.copyFileSync(richmenuAlt, path.join(dirLine, '02_LINE_RichMenu_Banner.png'));

// Write Live Demo Links file for 22
const demoLinks = `========================================================================
ข้อมูลนวัตกรรมการสื่อสารสุขภาพ LifeSync (Live Demo & Verification Links)
========================================================================

1. เว็บไซต์จริงพร้อมใช้งาน (Production Web Application):
   https://life-sync-panla123ts-projects.vercel.app

2. ระบบแชทบอท LINE Official Account (โค้ชซันนี่ AI):
   LINE ID: @766iowmg
   ลิงก์เพิ่มเพื่อน: https://line.me/R/ti/p/@766iowmg

3. บัญชีทดสอบสำหรับคณะกรรมการ (Test Account):
   - สามารถกดสมัครสมาชิกใหม่ หรือเข้าใช้งานผ่าน Quick Access ในหน้าเว็บ
   - บัญชีตัวอย่าง:
     Email: demo@lifesync.app / รหัสผ่าน: LifeSync2026!

4. ฟังก์ชันเด่นที่แนะนำให้คณะกรรมการทดลอง:
   - AI Food Scanner (วิเคราะห์แคลอรีและสารอาหารจากรูปถ่ายอาหาร)
   - Hydration Tracker (บันทึกน้ำ 1-tap พร้อมคำนวณเป้าหมายตามน้ำหนัก)
   - Sleep Tracker & Sync (บันทึกเวลาเข้านอน-ตื่นนอน พร้อมคำนวณ Daily Sync Score)
   - Coach Sunny AI (พูดคุยปรึกษาปัญหาสุขภาพทั้งบนเว็บและใน LINE)
   - Quests & Real Leaderboard (ภารกิจสุขภาพรายวันและกระดานผู้นำจริง)
   - Elder Accessibility Mode (โหมดขยายตัวหนังสือ +30% และ Contrast สูง)`;

fs.writeFileSync(path.join(dir22, '00_ลิงก์ทดลองใช้งานจริงสำหรับกรรมการ.txt'), demoLinks, 'utf8');

console.log('Submission package created successfully at:', submissionDir);
