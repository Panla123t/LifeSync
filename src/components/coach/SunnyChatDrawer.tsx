'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { MessageSquare, X, Send, Sparkles, Bot, RefreshCw, ChevronDown } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function SunnyChatDrawer() {
  const { locale } = useLanguage();
  const isThai = locale === 'th';

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: isThai
            ? 'สวัสดีครับ! ผม "ซันนี่" AI โค้ชสุขภาพของคุณ ☀️ มีข้อสงสัยเรื่องการดื่มน้ำ อาหาร หรือการนอนหลับ ถามผมได้เลยนะครับ!'
            : "Hi! I'm Sunny, your LifeSync AI health companion ☀️ Ask me anything about your hydration, nutrition, or sleep routine!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isThai]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = isThai
    ? [
        '💡 วิเคราะห์พฤติกรรมวันนี้ของฉัน',
        '💧 วันนี้ฉันดื่มน้ำพอหรือยัง?',
        '🥗 แนะนำมื้อเย็นคลีนๆ ไม่เกิน 500 kcal',
        '😴 มีเคล็ดลับช่วยให้นอนหลับลึกไหม?',
      ]
    : [
        '💡 Analyze my habits today',
        '💧 Have I drunk enough water today?',
        '🥗 Suggest a clean dinner under 500 kcal',
        '😴 Tips to fall asleep faster tonight',
      ];

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lIdx) => {
      if (!line.trim()) {
        return <span key={lIdx} className="block h-1.5" />;
      }
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = isBullet ? line.trim().replace(/^[*\-]\s+/, '') : line;
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

      return (
        <span
          key={lIdx}
          className={`block leading-relaxed ${
            isBullet ? 'pl-3 relative before:content-["•"] before:absolute before:left-0 before:text-amber-500 font-normal' : ''
          }`}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || (isThai ? 'ซันนี่พร้อมให้คำแนะนำเสมอครับ!' : 'I am always here to help!'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('API error');
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: isThai
          ? 'ขออภัยด้วยครับ ซันนี่กำลังปรับปรุงระบบสักครู่ ลองถามใหม่อีกครั้งนะครับ ☀️'
          : 'Sorry, I ran into a temporary issue. Please ask me again! ☀️',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (Always visible on dashboard, adjusted for mobile vs desktop) */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white p-2.5 pr-4 rounded-full shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.55)] active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/40"
            aria-label="Chat with Sunny"
          >
            {/* Sunny Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-amber-100 border border-white/60 shrink-0 relative">
              <Image
                src="/mascot/sunny-avatar.jpg"
                alt="Sunny Mascot"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-lg">☀️</span>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tight leading-none">ซันนี่ AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-amber-100 font-semibold leading-tight block">
                {isThai ? 'ปรึกษาโค้ช' : 'Ask Coach'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 md:inset-auto md:bottom-8 md:right-8 md:w-[400px] h-[520px] max-h-[85vh] z-50 flex flex-col bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border-2 border-white/50 shrink-0 relative">
                <Image
                  src="/mascot/sunny-avatar.jpg"
                  alt="Sunny"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white leading-tight">ซันนี่ (Sunny)</h3>
                  <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.2 rounded-full font-bold">
                    AI Coach
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-100 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>{isThai ? 'พร้อมให้คำปรึกษา' : 'Online & Ready'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white cursor-pointer"
              title={isThai ? 'ปิด' : 'Close'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 shrink-0 mt-0.5 border border-amber-300 shadow-2xs">
                    <Image
                      src="/mascot/sunny-avatar.jpg"
                      alt="Sunny"
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-2xs ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-xs'
                  }`}
                >
                  <div className="space-y-0.5">{renderFormattedText(m.content)}</div>
                  <span
                    className={`text-[9px] block text-right font-medium ${
                      m.role === 'user' ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-100 shrink-0 border border-amber-300 shadow-2xs">
                  <Image
                    src="/mascot/sunny-avatar.jpg"
                    alt="Sunny"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-xs px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isThai ? 'พิมพ์ถามซันนี่เรื่องสุขภาพ...' : 'Ask Sunny a health question...'}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 leading-tight">
              {isThai
                ? 'คำแนะนำจากซันนี่เพื่อการสร้างวินัยทั่วไป ไม่ใช่การวินิจฉัยทางการแพทย์'
                : 'Sunny provides general wellness coaching, not clinical diagnosis.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
