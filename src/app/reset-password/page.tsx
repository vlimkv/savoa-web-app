"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
// import { useAuthStore } from "@/store/auth.store";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); 
  // const resetFn = useAuthStore((s) => s.confirmPasswordReset); 

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
        setErr("Неверная ссылка");
        return;
    }
    if (password.length < 6) {
        setErr("Пароль должен содержать минимум 6 символов");
        return;
    }
    if (password !== confirm) {
        setErr("Пароли не совпадают");
        return;
    }
    
    setErr(null);
    setLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://77.240.39.104/api";

    try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
    }

    setSuccess(true);
    } catch (e: any) {
    const code = String(e?.message || "");
    setErr(
        code === "token_expired" ? "Ссылка устарела. Запросите новую." :
        code === "token_used" ? "Ссылка уже использована. Запросите новую." :
        code === "invalid_token" ? "Неверная ссылка." :
        "Не удалось изменить пароль"
    );
    } finally {
    setLoading(false);
    }
  }

  if (success) {
      /* --- SUCCESS STATE (Как в Swift) --- */
      return (
        <div className="text-center space-y-8 animate-in slide-in-from-bottom-4 duration-700 pt-8">
            <div className="flex justify-center">
              <CheckCircle2 className="w-20 h-20 text-white stroke-[0.5]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Пароль обновлён</h2>
              <p className="text-base text-white/70 leading-relaxed px-4">
                Теперь войдите с новым паролем.
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
      )
  }

  /* --- INPUT STATE (Как в Swift) --- */
  return (
    <>
        <div className="text-center space-y-4 pt-8">
            <div className="flex justify-center pb-2">
                {/* Key icon from Swift */}
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d="M21 10h-8.35C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H13l2 2 2-2 2 2 4-4.04L21 10zM7 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
                </svg>
            </div>
            <h1 className="text-xl font-semibold">
                Новый пароль
            </h1>
            <p className="text-sm text-white/70 leading-relaxed px-4">
                Придумайте новый пароль и подтвердите его.
            </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6 mt-6">
            <div className="group relative">
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" "
                    type="password"
                    className="peer w-full bg-transparent border-b border-neutral-800 py-4 text-lg font-light text-white placeholder-transparent focus:border-white focus:outline-none transition-all duration-500 tracking-widest"
                />
                <label className="absolute left-0 top-4 text-neutral-500 text-xs font-light transition-all duration-300 pointer-events-none
                peer-focus:-top-4 peer-focus:text-[10px] peer-focus:tracking-widest peer-focus:text-neutral-400
                peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:tracking-widest peer-not-placeholder-shown:text-neutral-400">
                    НОВЫЙ ПАРОЛЬ
                </label>
            </div>

            <div className="group relative">
                <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder=" "
                    type="password"
                    className="peer w-full bg-transparent border-b border-neutral-800 py-4 text-lg font-light text-white placeholder-transparent focus:border-white focus:outline-none transition-all duration-500 tracking-widest"
                />
                <label className="absolute left-0 top-4 text-neutral-500 text-xs font-light transition-all duration-300 pointer-events-none
                peer-focus:-top-4 peer-focus:text-[10px] peer-focus:tracking-widest peer-focus:text-neutral-400
                peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:tracking-widest peer-not-placeholder-shown:text-neutral-400">
                    ПОВТОРИТЕ ПАРОЛЬ
                </label>
            </div>

            {err && (
                <div className="text-center">
                    <span className="text-xs text-red-500 tracking-wide">{err}</span>
                </div>
            )}

            <button
                disabled={loading || !password || !confirm}
                className="group relative w-full h-[52px] bg-white text-black rounded-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                    <span className="text-[17px] font-semibold">Сохранить пароль</span>
                    )}
                </div>
            </button>
        </form>
    </>
  )
}

export default function ResetPasswordPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden font-light">
             {/* Background */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-[380px] px-6 flex flex-col gap-10 animate-in fade-in zoom-in-95 duration-700">
                <Suspense fallback={<div className="text-center text-xs tracking-widest text-neutral-500">ЗАГРУЗКА...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    )
}