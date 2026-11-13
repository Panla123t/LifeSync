'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { Activity, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check URL parameters for LINE OAuth callbacks or errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        setError(urlError);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('fetch')) {
        setError('Network error: Unable to connect to Supabase. Please ensure your Vercel Supabase URL starts with https://');
      } else {
        setError(msg || 'An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResetSuccess(false);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setResetSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-200/40 dark:bg-emerald-950/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-sky-200/40 dark:bg-sky-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex justify-center items-center gap-2.5">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-3 rounded-2xl shadow-[0_4px_14px_rgba(16,185,129,0.35)]">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t.common.appName}</span>
        </Link>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {isResetMode ? t.auth.resetPassword : t.auth.welcomeBack}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          {isResetMode ? t.auth.resetDesc : t.common.tagline}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-[32px] border border-slate-200/80 dark:border-slate-800 sm:px-10">
          
          {resetSuccess ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.auth.resetSentTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.auth.resetSentDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setResetSuccess(false);
                  setError(null);
                }}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.auth.backToSignIn}
              </button>
            </div>
          ) : isResetMode ? (
            <form className="space-y-4.5" onSubmit={handleResetPassword}>
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.auth.email}
                </label>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-slate-800/80"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.3)] text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? t.common.loading : t.auth.sendResetLink}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setError(null);
                  }}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t.auth.backToSignIn}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4.5">
              {/* LINE 1-Tap Login */}
              <div className="space-y-3.5">
                <a
                  href="/api/auth/line"
                  rel="external"
                  className="w-full flex justify-center items-center gap-2.5 py-3 px-4 rounded-2xl shadow-[0_4px_14px_rgba(6,199,85,0.28)] text-xs sm:text-sm font-bold text-white bg-[#06C755] hover:bg-[#05b04b] active:scale-95 transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 5.92 2 10.75c0 4.31 3.59 7.92 8.44 8.62.33.07.78.22.89.5.1.26.07.66.03.92-.06.39-.24 1.4-.27 1.6-.05.29-.21 1.13.99.62 1.2-.52 6.47-3.81 8.84-6.52C21.73 14.93 22 12.92 22 10.75 22 5.92 17.52 2 12 2z" />
                  </svg>
                  <span>{t.auth.lineLogin}</span>
                </a>

                {/* LINE Quick Magic Link from Sunny */}
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
                  <span>💬 {locale === 'th' ? 'หรือพิมพ์ "เข้าสู่ระบบ" ส่งให้ Sunny ใน LINE' : 'Or send "login" to Sunny in LINE'}</span>
                  <a
                    href="https://line.me/R/oaMessage/@766iowmg/?%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%AA%E0%B8%B9%E0%B9%88%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#06C755] hover:underline flex-shrink-0"
                  >
                    {locale === 'th' ? 'ขอลิงก์ 1-Tap ↗' : 'Get Magic Link ↗'}
                  </a>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center pt-1 pb-1">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400">
                    {t.auth.orContinueWithEmail}
                  </span>
                </div>
              </div>

              {error === 'line_login_unconfigured' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{locale === 'th' ? 'ตั้งค่า LINE Login บนเว็บ' : 'Set up LINE Login Channel'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {locale === 'th'
                      ? 'ปุ่มเว็บ LINE Login ต้องใช้ Channel แบบ "LINE Login" จาก LINE Developers Console (สร้างภายใต้ Provider เดียวกับ Sunny) แล้วใส่ LINE_LOGIN_CHANNEL_ID ใน Vercel ครับ'
                      : 'Web LINE Login requires a "LINE Login" Channel in your LINE Developers Console. Add LINE_LOGIN_CHANNEL_ID in Vercel.'}
                  </p>
                  <a
                    href="https://line.me/R/oaMessage/@766iowmg/?%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%AA%E0%B8%B9%E0%B9%88%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%9A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[11px] font-bold text-[#06C755] hover:underline"
                  >
                    👉 {locale === 'th' ? 'ตอนนี้คุณสามารถพิมพ์ "เข้าสู่ระบบ" ใน LINE Sunny เพื่อรับลิงก์ล็อกอินได้ทันที' : 'For now, type "login" to Sunny on LINE for a 1-tap link!'}
                  </a>
                </div>
              ) : error ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleLogin}>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.auth.email}
                </label>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-slate-800/80"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.auth.password}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError(null);
                      setResetSuccess(false);
                    }}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    {t.auth.forgotPassword}
                  </button>
                </div>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-slate-800/80"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.3)] text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? t.common.loading : t.auth.signInBtn}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}

          {!isResetMode && !resetSuccess && (
            <div className="mt-6 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.auth.noAccount}{' '}
                <Link href="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline">
                  {t.auth.createOne}
                </Link>
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {locale === 'th' ? 'ข้อกำหนดการใช้งาน' : 'Terms of Use'}
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {locale === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
