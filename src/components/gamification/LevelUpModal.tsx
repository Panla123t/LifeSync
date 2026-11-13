'use client';

import React, { useEffect } from 'react';
import { Trophy, Sparkles, X, ArrowRight, Star } from 'lucide-react';
import { fireLevelUpCannons } from '@/lib/utils/confetti';
import { playLevelUpFanfare } from '@/lib/utils/sound';

export interface LevelInfo {
  level: number;
  titleTh: string;
  titleEn: string;
  badgeEmoji: string;
  minPoints: number;
  colorClass: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, titleTh: 'ต้นกล้าแรกผลิ (Seedling)', titleEn: 'Seedling', badgeEmoji: '🌿', minPoints: 0, colorClass: 'from-emerald-500 to-teal-500' },
  { level: 2, titleTh: 'ต้นอ่อนแตกใบ (Sprout)', titleEn: 'Sprout', badgeEmoji: '🌱', minPoints: 100, colorClass: 'from-teal-500 to-cyan-500' },
  { level: 3, titleTh: 'ดอกไม้อารมณ์ดี (Bloom)', titleEn: 'Bloom', badgeEmoji: '🌸', minPoints: 250, colorClass: 'from-pink-500 to-rose-500' },
  { level: 4, titleTh: 'พฤกษาผู้พิทักษ์ (Oasis)', titleEn: 'Oasis Guardian', badgeEmoji: '🌳', minPoints: 500, colorClass: 'from-indigo-500 to-purple-500' },
  { level: 5, titleTh: 'ปรมาจารย์สุขภาพ (Master)', titleEn: 'Health Master', badgeEmoji: '👑', minPoints: 1000, colorClass: 'from-amber-500 to-orange-500' },
];

export function getLevelFromPoints(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelInfo: LevelInfo;
  points: number;
  locale?: string;
}

export default function LevelUpModal({
  isOpen,
  onClose,
  levelInfo,
  points,
  locale = 'th',
}: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      fireLevelUpCannons();
      playLevelUpFanfare();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-emerald-500/30 overflow-hidden text-center space-y-5 animate-in zoom-in-95 duration-300">
        
        {/* Ambient Top Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr ${levelInfo.colorClass} opacity-30 rounded-full blur-3xl pointer-events-none`} />

        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebratory Icon */}
        <div className="relative mx-auto mt-2 w-24 h-24 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${levelInfo.colorClass} opacity-20 animate-pulse`} />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-white to-slate-100 dark:from-slate-800 dark:to-slate-750 border-2 border-amber-400/80 shadow-[0_4px_20px_rgba(245,158,11,0.3)] flex items-center justify-center text-4xl">
            {levelInfo.badgeEmoji}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1.5 shadow-md">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locale === 'th' ? 'เลเวลอัป! ยินดีด้วยครับ' : 'LEVEL UP! CONGRATULATIONS'}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Level {levelInfo.level}: {locale === 'th' ? levelInfo.titleTh.split('(')[0].trim() : levelInfo.titleEn}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {locale === 'th' 
              ? `คุณสะสมแต้มครบ ${points} แต้ม และปลดล็อกฉายาใหม่เรียบร้อยแล้ว!` 
              : `You have earned ${points} points and unlocked a new title!`}
          </p>
        </div>

        {/* Sunny's encouraging note */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-left flex items-start gap-3">
          <span className="text-xl shrink-0">☀️</span>
          <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
            {locale === 'th'
              ? '“ซันนี่ภูมิใจในตัวคุณมากครับ! วินัยเล็กๆ ทุกวัน กลายเป็นสุขภาพที่ยอดเยี่ยมในระยะยาว ไปลุยต่อด้วยกันน้า!”'
              : '"Sunny is so proud of you! Small everyday habits create lasting wellness. Keep shining!"'}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          type="button"
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <span>{locale === 'th' ? 'ไปต่อกันเลย! 🚀' : 'Keep Going! 🚀'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
