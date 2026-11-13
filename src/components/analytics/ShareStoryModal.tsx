'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import FloatingGlassModal from '@/components/shared/FloatingGlassModal';
import { Download, Share2, Check, Sparkles, Flame, Droplets, Utensils, Moon, Trophy } from 'lucide-react';

interface ShareStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  level: number;
  streak: number;
  weeklyGrade?: string;
  waterAvgMl: number;
  mealsCount: number;
  sleepAvgHours: number;
  points: number;
  locale?: 'th' | 'en';
}

export default function ShareStoryModal({
  isOpen,
  onClose,
  userName,
  level,
  streak,
  weeklyGrade = 'A+',
  waterAvgMl,
  mealsCount,
  sleepAvgHours,
  points,
  locale = 'th',
}: ShareStoryModalProps) {
  const isThai = locale === 'th';
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [displayDate, setDisplayDate] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setDisplayDate(
      new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }).format(new Date())
    );
  }, [isThai]);

  // Generate 1080x1920 story card using pure HTML5 Canvas for razor-sharp export
  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Gradient (Emerald -> Teal -> Dark Slate)
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, '#065F46'); // emerald-800
      grad.addColorStop(0.35, '#0F766E'); // teal-700
      grad.addColorStop(0.7, '#111827'); // gray-900
      grad.addColorStop(1, '#030712'); // gray-950
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Ambient decorative glows
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.arc(900, 250, 400, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.beginPath();
      ctx.arc(150, 1600, 450, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Top Header Brand Pill
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(140, 140, 800, 90, 45);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIFESYNC • WEEKLY HEALTH DISCIPLINE', 540, 198);
      ctx.restore();

      // 3. User Avatar and Name
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 68px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(userName || 'Health Explorer', 540, 340);

      ctx.fillStyle = '#A7F3D0';
      ctx.font = 'bold 36px sans-serif';
      const levelTitle = isThai ? `ระดับ ${level} • ผู้สร้างวินัยสุขภาพ` : `Level ${level} • Habit Builder`;
      ctx.fillText(levelTitle, 540, 400);
      ctx.restore();

      // 4. Center Weekly Performance Badge Card
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(140, 470, 800, 400, 50);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isThai ? 'เกรดวินัยประจำสัปดาห์' : 'WEEKLY DISCIPLINE GRADE', 540, 545);

      // Huge Grade A+
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 160px sans-serif';
      ctx.fillText(weeklyGrade, 540, 710);

      // Streak sub-badge
      ctx.fillStyle = '#FFEDD5';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(`🔥 ${streak} ${isThai ? 'วันต่อเนื่อง (Active Streak)' : 'Days Streak'}`, 540, 810);
      ctx.restore();

      // 5. 4 Core Health Metric Chips (2x2 Grid)
      const metrics = [
        {
          label: isThai ? 'ดื่มน้ำเฉลี่ย' : 'Hydration Avg',
          value: `${waterAvgMl} ml`,
          icon: '💧',
          color: '#38BDF8',
        },
        {
          label: isThai ? 'อาหารที่บันทึก' : 'Meals Logged',
          value: `${mealsCount} ${isThai ? 'มื้อ' : 'meals'}`,
          icon: '🥑',
          color: '#34D399',
        },
        {
          label: isThai ? 'การนอนเฉลี่ย' : 'Sleep Avg',
          value: `${sleepAvgHours} ${isThai ? 'ชม.' : 'hrs'}`,
          icon: '😴',
          color: '#818CF8',
        },
        {
          label: isThai ? 'คะแนนสะสม' : 'Life Points',
          value: `+${points} pts`,
          icon: '🌟',
          color: '#FBBF24',
        },
      ];

      const startY = 920;
      const chipW = 385;
      const chipH = 210;
      const gapX = 30;
      const gapY = 30;

      metrics.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = 140 + col * (chipW + gapX);
        const cy = startY + row * (chipH + gapY);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(cx, cy, chipW, chipH, 36);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '54px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(m.icon, cx + 36, cy + 85);

        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(m.label, cx + 36, cy + 130);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 44px sans-serif';
        ctx.fillText(m.value, cx + 36, cy + 180);
        ctx.restore();
      });

      // 6. Mascot Sunny Quote Card
      ctx.save();
      const quoteY = 1420;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      ctx.roundRect(140, quoteY, 800, 230, 40);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💡 AI COACH SUNNY:', 200, quoteY + 65);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '36px sans-serif';
      const quoteText = isThai
        ? '"ความสม่ำเสมอในทุกๆ วัน คือของขวัญที่ดีที่สุดสำหรับสุขภาพของคุณ"'
        : '"Consistency every single day is the greatest gift for your body."';
      ctx.fillText(quoteText, 200, quoteY + 125);

      ctx.fillStyle = '#BBF7D0';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('สู้ไปด้วยกันในสัปดาห์หน้านะครับ! ☀️🌱', 200, quoteY + 180);
      ctx.restore();

      // 7. Footer Tagline
      ctx.save();
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LifeSync • เพื่อนร่วมทางดูแลสุขภาพ • LINE OA: @766iowmg', 540, 1750);
      ctx.fillText('lifesync.vercel.app', 540, 1800);
      ctx.restore();

      // Trigger download
      const link = document.createElement('a');
      link.download = `lifesync-health-story-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating story card:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWeb = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lifesync.vercel.app';
    const text = isThai
      ? `สัปดาห์นี้ฉันได้เกรดสุขภาพ ${weeklyGrade} และวินัยต่อเนื่อง ${streak} วันบน LifeSync! 🏃‍♂️💧 แอดซันนี่ @766iowmg หรือเข้าใช้งานได้ที่ ${origin}`
      : `I earned Health Grade ${weeklyGrade} and a ${streak}-day streak on LifeSync! 🏃‍♂️💧 Track habits together: ${origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LifeSync Weekly Habit Story',
          text,
          url: origin,
        });
        return;
      } catch {
        // Fallback to copy link
      }
    }

    try {
      await navigator.clipboard.writeText(origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <FloatingGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={isThai ? 'แชร์การ์ดความสำเร็จสุขภาพ (Story)' : 'Share Health Story'}
      icon={<Sparkles className="h-5 w-5 text-amber-500" />}
      glowColor="emerald"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Story Card Visual Preview (Scale to fit modal) */}
        <div
          ref={cardRef}
          className="relative w-full max-w-xs mx-auto aspect-[9/16] rounded-[28px] overflow-hidden p-4 text-white shadow-2xl flex flex-col justify-between border-2 border-white/20 select-none bg-gradient-to-b from-emerald-800 via-teal-900 to-slate-950"
        >
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 text-emerald-100">
              LifeSync Story
            </span>
            <span className="text-[10px] text-emerald-200 font-bold">
              {displayDate || (isThai ? 'วันนี้' : 'Today')}
            </span>
          </div>

          {/* Profile & Grade Card */}
          <div className="space-y-3 text-center my-auto">
            <div>
              <h4 className="text-base font-black truncate">{userName || 'Health Explorer'}</h4>
              <p className="text-[10px] text-emerald-200 font-semibold">
                {isThai ? `ระดับ ${level} • ผู้สร้างวินัยสุขภาพ` : `Level ${level} • Habit Builder`}
              </p>
            </div>

            {/* Big Grade Box */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-lg space-y-1">
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider block">
                {isThai ? 'เกรดวินัยประจำสัปดาห์' : 'Weekly Grade'}
              </span>
              <div className="text-4xl font-black text-amber-400 drop-shadow-md">
                {weeklyGrade}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-200 bg-orange-950/40 px-2 py-0.5 rounded-full">
                <Flame className="h-3 w-3 fill-orange-400 text-orange-400" />
                <span>{streak} {isThai ? 'วันต่อเนื่อง' : 'Day Streak'}</span>
              </div>
            </div>

            {/* 4 Metrics Grid */}
            <div className="grid grid-cols-2 gap-1.5 text-left">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <span className="text-[9px] text-slate-300 block">💧 ดื่มน้ำเฉลี่ย</span>
                <span className="text-xs font-black">{waterAvgMl} ml</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <span className="text-[9px] text-slate-300 block">🥑 มื้ออาหาร</span>
                <span className="text-xs font-black">{mealsCount} มื้อ</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <span className="text-[9px] text-slate-300 block">😴 นอนเฉลี่ย</span>
                <span className="text-xs font-black">{sleepAvgHours} ชม.</span>
              </div>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <span className="text-[9px] text-slate-300 block">🌟 แต้มสะสม</span>
                <span className="text-xs font-black">+{points} pts</span>
              </div>
            </div>
          </div>

          {/* Bottom Sunny Mascot & Tag */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-emerald-200 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-400 shrink-0">
                <Image src="/mascot/sunny-avatar.jpg" alt="Sunny" width={20} height={20} className="w-full h-full object-cover" />
              </div>
              <span>โค้ชซันนี่ ☀️</span>
            </div>
            <span className="text-slate-300">LINE: @766iowmg</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? (isThai ? 'กำลังบันทึกภาพ...' : 'Saving image...') : (isThai ? 'บันทึกรูปภาพ (1080x1920 Story)' : 'Download Story Image')}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWeb}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span>{isThai ? 'คัดลอกลิงก์สำเร็จแล้ว!' : 'Link copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>{isThai ? 'แชร์ไปยัง LINE / โซเชียลมีเดีย' : 'Share to LINE / Social'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </FloatingGlassModal>
  );
}
