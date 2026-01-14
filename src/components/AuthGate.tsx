"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Premium Splash Screen
 * Полностью повторяет стиль страницы входа (шум, глубокий черный, лого)
 */
function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
      
      {/* 1. TEXTURE NOISE (Для бесшовного перехода на Login) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* 2. GLOW (Ambient Light) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* 3. LOGO & LOADER */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        
        {/* Logo с эффектом "дыхания" */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 animate-pulse duration-[2000ms]">
           <Image 
              src="/logo.png" // Убедитесь, что логотип здесь
              alt="Loading..." 
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
        </div>

        {/* Ультра-тонкий прогресс-бар (опционально) или просто пустота */}
        {/* Можно оставить пустым для максимального минимализма, 
            либо добавить едва заметную полоску */}
        <div className="w-24 h-[1px] bg-neutral-900 overflow-hidden rounded-full">
            <div className="h-full w-full bg-neutral-600/50 animate-progress-indeterminate origin-left" />
        </div>
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    const checkAuth = async () => {
      if (token && !user) {
        try {
          await fetchMe();
        } catch (error) {
          console.error("Auth Error", error);
          logout?.(); 
        }
      }
      // Искусственная задержка (300мс), чтобы сплэш не мелькал слишком быстро
      // Это добавляет веса ("тяжести") приложению
      setTimeout(() => setIsChecked(true), 300);
    };

    checkAuth();
  }, [hydrated, token, user, fetchMe, logout]);

  useEffect(() => {
    if (!hydrated || !isChecked) return;

    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const isAuthed = !!token && !!user;

    if (!isAuthed && !isPublic) {
      router.replace("/login");
    } 
    else if (isAuthed && isPublic) {
      router.replace("/home");
    }
  }, [hydrated, isChecked, token, user, pathname, router]);

  if (!hydrated || !isChecked) {
    return <SplashScreen />;
  }

  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (!token && !isPublic) return <SplashScreen />;

  return <>{children}</>;
}