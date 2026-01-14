"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, X } from "lucide-react";
// import { useAuthStore } from "@/store/auth.store";

export default function ForgotPasswordPage() {
  // const requestResetFn = useAuthStore((s) => s.requestPasswordReset); 
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setErr(null);
    setLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://77.240.39.104/api";

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setIsSent(true);
    } catch (e: any) {
      setErr("Ошибка отправки. Проверьте email.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden font-light">
      
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Close Button */}
      <Link href="/login" className="absolute top-8 left-8 z-50 text-neutral-500 hover:text-white transition-colors">
         <X size={24} strokeWidth={1} />
      </Link>

      <div className="relative z-10 w-full max-w-[380px] px-6 flex flex-col gap-10 animate-in fade-in zoom-in-95 duration-700">
        
        {isSent ? (
           /* --- SUCCESS STATE (Как в Swift) --- */
           <div className="text-center space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-center pt-8">
                <CheckCircle2 className="w-20 h-20 text-white stroke-[0.5]" />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Письмо отправлено</h2>
                <p className="text-base text-white/70 leading-relaxed px-4">
                  Проверьте почту <span className="text-white font-medium">{email}</span> и следуйте инструкции в письме.
                </p>
              </div>
              <div className="pt-8">
                  <Link 
                    href="/login"
                    className="flex items-center justify-center w-full h-[52px] bg-white text-black text-[17px] font-semibold rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    Готово
                  </Link>
              </div>
           </div>
        ) : (
        /* --- INPUT STATE (Как в Swift) --- */
          <>
            <div className="text-center space-y-4 pt-8">
              <div className="flex justify-center pb-2">
                 {/* Lock icon from Swift */}
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                 </svg>
              </div>
              <h1 className="text-xl font-semibold">
                Восстановление пароля
              </h1>
              <p className="text-sm text-white/70 leading-relaxed px-2">
                Введите email, который мы указали при выдаче данных для входа.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-8">
              <div className="group relative">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  type="email"
                  className="peer w-full bg-transparent border-b border-neutral-800 py-4 text-lg font-light text-white placeholder-transparent focus:border-white focus:outline-none transition-all duration-500"
                />
                <label className="absolute left-0 top-4 text-neutral-500 text-xs font-light transition-all duration-300 pointer-events-none
                  peer-focus:-top-4 peer-focus:text-[10px] peer-focus:tracking-widest peer-focus:text-neutral-400
                  peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:tracking-widest peer-not-placeholder-shown:text-neutral-400">
                  EMAIL
                </label>
              </div>

              {err && (
                <div className="text-center">
                    <span className="text-xs text-red-500 tracking-wide">{err}</span>
                </div>
              )}

              <button
                disabled={loading || !email}
                className="group relative w-full h-[52px] bg-white text-black rounded-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="text-[17px] font-semibold">Отправить письмо</span>
                  )}
                </div>
              </button>
            </form>
          </>
        )}

      </div>
    </main>
  );
}