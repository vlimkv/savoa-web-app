"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, List, Activity, LogOut } from "lucide-react"; // Settings убрал
import { useAuthStore } from "@/store/auth.store";

const HIDE_NAV_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/breath", "/affirmation", "/tracker", "/gratitude", "/theory"];

const TABS = [
  { label: "Главная", href: "/home", icon: Home },
  { label: "Программа", href: "/program", icon: List },
  { label: "Состояние", href: "/state", icon: Activity },
];

export default function Navigation() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const [isMounted, setIsMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Стейт для модалки

  useEffect(() => setIsMounted(true), []);

  const hideNav = HIDE_NAV_PATHS.some((p) => pathname.startsWith(p));
  if (hideNav) return null;

  const isActive = (href: string) => 
    pathname === href || (href !== "/home" && pathname.startsWith(href));

  if (!isMounted) return null;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* ================================================= */}
      {/* 1. MOBILE: BOTTOM BAR (< 768px)                  */}
      {/* ================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center h-[52px] pb-1">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center h-full active:scale-95 transition-transform duration-100"
              >
                <div className={`relative p-1 rounded-full transition-colors duration-200 ${active ? "bg-white/10" : "bg-transparent"}`}>
                  <tab.icon
                    size={24}
                    strokeWidth={active ? 2.5 : 2}
                    className={active ? "text-white" : "text-white/40"}
                  />
                </div>
                <span className={`text-[9px] font-medium mt-0.5 transition-colors duration-200 ${active ? "text-white" : "text-white/40"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ================================================= */}
      {/* 2. TABLET / IPAD: STATIC RAIL (768px - 1024px)   */}
      {/* Настройки убраны. Выход вызывает модалку.        */}
      {/* ================================================= */}
      <aside className="hidden md:flex lg:hidden flex-col w-[80px] h-screen sticky top-0 left-0 bg-black border-r border-white/10 z-40 shrink-0">
         <div className="h-24 flex items-center justify-center">
             <div className="relative w-8 h-8 opacity-90">
                <Image src="/logo.png" alt="SAVOA" fill className="object-contain" />
             </div>
         </div>

         <nav className="flex-1 flex flex-col gap-4 px-2 mt-4">
            {TABS.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`
                        flex items-center justify-center h-14 rounded-2xl transition-all duration-200
                        ${active 
                            ? "bg-white text-black shadow-lg shadow-white/10 scale-100" 
                            : "text-white/40 hover:bg-white/5 hover:text-white active:scale-95"
                        }
                    `}
                  >
                    <tab.icon size={26} strokeWidth={active ? 2.5 : 2} />
                  </Link>
                );
            })}
         </nav>

         <div className="p-2 border-t border-white/10 mb-6 flex flex-col items-center">
            <button 
                onClick={handleLogoutClick}
                className="w-12 h-12 flex items-center justify-center rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
                <LogOut size={24} />
            </button>
         </div>
      </aside>

      {/* ================================================= */}
      {/* 3. DESKTOP: SMART EXPAND SIDEBAR (> 1024px)      */}
      {/* Настройки убраны. Выход вызывает модалку.        */}
      {/* ================================================= */}
      <aside className="hidden lg:block w-[88px] h-screen sticky top-0 left-0 z-40 shrink-0">
        <div className="
            group 
            absolute top-0 left-0 h-full bg-black border-r border-white/10 flex flex-col
            w-[88px] hover:w-[260px]
            transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] delay-75 hover:delay-0
            overflow-hidden shadow-none hover:shadow-[20px_0_40px_rgba(0,0,0,0.5)]
        ">
            {/* Logo */}
            <div className="h-24 flex items-center pl-[28px] shrink-0">
                <div className="relative w-8 h-8 group-hover:w-32 group-hover:h-10 transition-all duration-300">
                    <Image 
                        src="/logo.png" 
                        alt="SAVOA" 
                        fill
                        className="object-contain object-left"
                    />
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 flex flex-col gap-2 px-3 mt-4 w-[260px]">
            {TABS.map((tab) => {
                const active = isActive(tab.href);
                return (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={`
                        relative flex items-center h-12 rounded-xl transition-all duration-200
                        ${active 
                            ? "bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        }
                    `}
                >
                    <div className="w-[64px] flex items-center justify-center shrink-0">
                        <tab.icon 
                            size={22} 
                            className={`transition-transform duration-300 ${active ? "scale-105" : "group-hover/link:scale-110"}`} 
                        />
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 whitespace-nowrap">
                        {tab.label}
                    </span>
                </Link>
                );
            })}
            </nav>

            {/* Footer: Only Logout */}
            <div className="p-3 border-t border-white/10 mb-4 w-[260px]">
                <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center h-11 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <div className="w-[64px] flex items-center justify-center shrink-0">
                        <LogOut size={20} />
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                        Выйти
                    </span>
                </button>
            </div>
        </div>
      </aside>

      {/* ================================================= */}
      {/* 4. LOGOUT CONFIRMATION MODAL                      */}
      {/* Красивый оверлей вместо алерта                    */}
      {/* ================================================= */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop with blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setShowLogoutConfirm(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 w-full max-w-xs md:max-w-sm shadow-2xl transform transition-all scale-100">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                        <LogOut size={24} />
                    </div>
                    
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Выход из аккаунта</h3>
                        <p className="text-sm text-white/50">
                            Вы уверены, что хотите выйти? <br/> Вам придется войти заново.
                        </p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button 
                            onClick={() => setShowLogoutConfirm(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors text-sm"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={confirmLogout}
                            className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors text-sm"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
