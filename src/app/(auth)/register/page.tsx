'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { Activity, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, FileText, ExternalLink } from 'lucide-react';
import FloatingGlassModal from '@/components/shared/FloatingGlassModal';
import TermsContent from '@/components/legal/TermsContent';
import PrivacyContent from '@/components/legal/PrivacyContent';

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!agreedToTerms) {
      setError(t.auth.mustAgreeTerms);
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t.auth.passwordMin);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok';

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            timezone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName || 'Health Explorer',
          timezone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        await supabase.from('notification_settings').upsert({
          user_id: data.user.id,
          hydration_enabled: true,
          sleep_enabled: true,
          daily_summary_enabled: false,
        });

        if (data.session) {
          router.push('/dashboard');
          router.refresh();
          return;
        }

        setSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('fetch')) {
        setError('Network error: Unable to connect to Supabase. Please ensure your Vercel Supabase URL starts with https://');
      } else {
        setError(msg || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-200/40 dark:bg-teal-950/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-200/30 dark:bg-amber-950/20 rounded-full blur-3xl pointer-events-none" />

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
          {t.auth.createAccount}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          {t.auth.startJourney}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-[32px] border border-slate-200/80 dark:border-slate-800 sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.auth.regSuccessTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.auth.regSuccessDesc}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 text-xs shadow-xs"
              >
                {t.common.signIn}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* LINE 1-Tap Login/Register */}
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

                {/* LINE Terms Notice */}
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-normal px-2">
                  {locale === 'th' ? (
                    <>
                      การเข้าสู่ระบบหรือลงทะเบียน ถือว่าคุณยอมรับ{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        ข้อกำหนดการใช้งาน
                      </button>{' '}
                      และ{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        นโยบายความเป็นส่วนตัว
                      </button>
                    </>
                  ) : (
                    <>
                      By continuing, you agree to LifeSync&apos;s{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Terms of Use
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                    </>
                  )}
                </p>

                {/* Divider */}
                <div className="relative flex items-center justify-center pt-1 pb-1">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400">
                    {t.auth.orContinueWithEmail}
                  </span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.auth.yourName}
                </label>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.auth.namePlaceholder}
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-slate-800/80"
                  />
                </div>
              </div>

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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.auth.password}
                </label>
                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordMin}
                    className="block w-full pl-10 pr-3.5 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-slate-800/80"
                  />
                </div>
              </div>

              {/* Terms & Privacy Agreement Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    {locale === 'th' ? (
                      <>
                        ฉันยอมรับ{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          ข้อกำหนดการใช้งาน
                        </button>{' '}
                        และ{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyModal(true);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          นโยบายความเป็นส่วนตัว
                        </button>{' '}
                        ของ LifeSync
                      </>
                    ) : (
                      <>
                        I agree to LifeSync&apos;s{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          Terms of Use
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyModal(true);
                          }}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          Privacy Policy
                        </button>
                      </>
                    )}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-[0_6px_20px_rgba(16,185,129,0.3)] text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? t.common.loading : t.auth.createBtn}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.auth.haveAccount}{' '}
              <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline">
                {t.auth.signInBtn}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Terms of Use Modal */}
      <FloatingGlassModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title={locale === 'th' ? 'ข้อกำหนดการใช้งาน' : 'Terms of Use'}
        icon={<FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        glowColor="emerald"
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <TermsContent locale={locale} />
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <Link
              href="/terms"
              target="_blank"
              className="text-[11px] text-slate-400 hover:text-emerald-600 flex items-center gap-1 font-semibold"
            >
              <span>{locale === 'th' ? 'เปิดในแท็บใหม่' : 'Open in new tab'}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              {t.auth.acceptAndClose}
            </button>
          </div>
        </div>
      </FloatingGlassModal>

      {/* Privacy Policy Modal */}
      <FloatingGlassModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title={locale === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
        icon={<ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        glowColor="emerald"
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <PrivacyContent locale={locale} />
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <Link
              href="/privacy"
              target="_blank"
              className="text-[11px] text-slate-400 hover:text-emerald-600 flex items-center gap-1 font-semibold"
            >
              <span>{locale === 'th' ? 'เปิดในแท็บใหม่' : 'Open in new tab'}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowPrivacyModal(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              {locale === 'th' ? 'รับทราบและปิด' : 'Understood & Close'}
            </button>
          </div>
        </div>
      </FloatingGlassModal>
    </div>
  );
}
