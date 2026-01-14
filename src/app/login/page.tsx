"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const loginFn = useAuthStore((s) => s.login);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    
    setErrorMessage(null);
    setIsLoading(true);
    
    try {
      await loginFn(email, password);
      // Успех -> редирект (обычно обрабатывается в AuthGate, но можно и тут)
      // router.replace('/home'); 
    } catch (e: any) {
      setErrorMessage(e?.message || "Неверный логин или пароль");
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return <div className="bg-[#050505] min-h-screen" />;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden font-light selection:bg-white selection:text-black">
      
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[340px] px-6 flex flex-col gap-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
        
        {/* LOGO */}
        <div className="flex justify-center pb-2">
          <div className="relative w-32 h-32"> 
            <Image 
              src="/logo.png" 
              alt="SAVOA Logo" 
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* HEADER (Как в Swift) */}
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-white">
                Вход в аккаунт
            </h1>
            <p className="text-sm text-white/60 leading-relaxed px-4">
                Введите логин или email и пароль.
            </p>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          
          <div className="space-y-6">
            {/* Login Input */}
            <div className="group relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                className="peer w-full bg-transparent border-b border-neutral-800 py-4 text-lg font-light text-white placeholder-transparent focus:border-white focus:outline-none transition-all duration-500"
              />
              <label className="absolute left-0 top-4 text-neutral-500 text-xs font-light transition-all duration-300 pointer-events-none
                peer-focus:-top-4 peer-focus:text-[10px] peer-focus:tracking-widest peer-focus:text-neutral-400
                peer-not-placeholder-shown:-top-4 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:tracking-widest peer-not-placeholder-shown:text-neutral-400">
                ЛОГИН ИЛИ EMAIL
              </label>
            </div>

            {/* Password Input */}
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
                ПАРОЛЬ
              </label>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
             <div className="text-center animate-in fade-in slide-in-from-top-1">
                 <span className="text-xs text-red-500 tracking-wide">{errorMessage}</span>
             </div>
          )}

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link href="/forgot-password">
                <span className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
                    Забыли пароль?
                </span>
            </Link>
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading || !email || !password}
            className="group relative w-full h-14 bg-white text-black rounded-full overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
          >
            <div className="absolute inset-0 flex items-center justify-center gap-3 px-8 transition-transform duration-500">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                    <span className="text-[17px] font-semibold">Войти</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </>
              )}
            </div>
          </button>

        </form>
      </div>
    </main>
  );
}