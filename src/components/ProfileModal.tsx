"use client";

import { useState, useEffect } from "react";
import { X, Bell, Headphones, LogOut, ChevronRight, ChevronLeft, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedLessons: number;
  totalMinutes: number;
}

type CardMode = "main" | "support" | "logout";

export default function ProfileModal({
  isOpen,
  onClose,
  completedLessons,
  totalMinutes,
}: ProfileModalProps) {
  const user = useAuthStore((s) => s.user);
  const logoutFn = useAuthStore((s) => s.logout);
  
  // UI States
  const [mode, setMode] = useState<CardMode>("main");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Сброс режима при закрытии
  useEffect(() => {
    if (!isOpen) setTimeout(() => setMode("main"), 300);
  }, [isOpen]);

  const handleLogout = () => {
    logoutFn();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212] rounded-t-[32px] overflow-hidden border-t border-white/10"
            style={{ maxHeight: "90vh" }}
          >
            {/* Grabber */}
            <div className="w-full flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <div className="p-6 pb-12 flex flex-col items-center">
              
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white">
                    {user?.login || "Анна"}
                </h2>
                <p className="text-sm text-white/40">
                    {user?.email || "anna@example.com"}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex gap-12 mb-10">
                <StatItem value={String(completedLessons ?? 0)} label="уроков" />
                <StatItem value={String(totalMinutes ?? 0)} label="минут" />
              </div>

              {/* Flip Deck Container */}
              <div className="w-full relative h-[300px] perspective-1000">
                <AnimatePresence mode="sync">
                  {mode === "main" && (
                    <PanelWrapper key="main" direction="center">
                      <MainPanel 
                        notif={notificationsEnabled} 
                        setNotif={setNotificationsEnabled}
                        onSupport={() => setMode("support")}
                        onLogout={() => setMode("logout")}
                      />
                    </PanelWrapper>
                  )}
                  {mode === "support" && (
                    <PanelWrapper key="support" direction="right">
                      <SupportPanel onBack={() => setMode("main")} />
                    </PanelWrapper>
                  )}
                  {mode === "logout" && (
                    <PanelWrapper key="logout" direction="right">
                      <LogoutPanel 
                        onBack={() => setMode("main")} 
                        onConfirm={handleLogout} 
                      />
                    </PanelWrapper>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- SUBCOMPONENTS ---

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-semibold text-white">{value}</span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

// Анимация "Flip/Blur" как в Swift panelFX
function PanelWrapper({ children, direction }: { children: React.ReactNode, direction: "center" | "right" | "left" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)", rotateY: direction === "right" ? 20 : -20 }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)", rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)", rotateY: direction === "right" ? -20 : 20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="absolute inset-0 w-full backface-hidden"
    >
      {children}
    </motion.div>
  );
}

function MainPanel({ notif, setNotif, onSupport, onLogout }: any) {
  return (
    <div className="flex flex-col">
      {/* Notifications */}
      <div 
        onClick={() => setNotif(!notif)}
        className="flex items-center py-4 px-2 active:bg-white/5 transition-colors cursor-pointer"
      >
        <Bell size={20} className="text-white/50 mr-4" />
        <span className="text-[15px] text-white/90 flex-1">Уведомления</span>
        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${notif ? "bg-green-500" : "bg-white/20"}`}>
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notif ? "translate-x-4" : ""}`} />
        </div>
      </div>
      <Hairline />

      {/* Support */}
      <div 
        onClick={onSupport}
        className="flex items-center py-4 px-2 active:bg-white/5 transition-colors cursor-pointer"
      >
        <Headphones size={20} className="text-white/50 mr-4" />
        <span className="text-[15px] text-white/90 flex-1">Поддержка</span>
        <ChevronRight size={16} className="text-white/30" />
      </div>
      <Hairline />

      {/* Logout */}
      <div 
        onClick={onLogout}
        className="flex items-center py-4 px-2 active:bg-white/5 transition-colors cursor-pointer"
      >
        <LogOut size={20} className="text-red-400/70 mr-4" />
        <span className="text-[15px] text-red-400/90 flex-1">Выйти</span>
        <ChevronRight size={16} className="text-red-400/40" />
      </div>
    </div>
  );
}

function SupportPanel({ onBack }: { onBack: () => void }) {
  const openLink = (url: string) => window.open(url, '_blank');

  return (
    <div className="flex flex-col">
      {/* Back */}
      <div onClick={onBack} className="flex items-center py-4 px-2 active:bg-white/5 transition-colors cursor-pointer">
        <ChevronLeft size={20} className="text-white/50 mr-4" />
        <span className="text-[15px] text-white/30">Назад</span>
      </div>
      <Hairline />

      <SupportRow title="Telegram" subtitle="@savoasupport" onClick={() => openLink('https://t.me/savoasupport')} />
      <Hairline />
      <SupportRow title="WhatsApp" subtitle="+7 777 677 6455" onClick={() => openLink('https://wa.me/77776776455')} />
      <Hairline />
      <SupportRow title="Email" subtitle="info@savoa.kz" onClick={() => openLink('mailto:info@savoa.kz')} />
    </div>
  );
}

function LogoutPanel({ onBack, onConfirm }: { onBack: () => void, onConfirm: () => void }) {
  return (
    <div className="flex flex-col">
      <div onClick={onBack} className="flex items-center py-4 px-2 active:bg-white/5 transition-colors cursor-pointer">
        <ChevronLeft size={20} className="text-white/50 mr-4" />
        <span className="text-[15px] text-white/30">Назад</span>
      </div>
      <Hairline />

      <div className="pt-6 px-4 text-center">
        <h3 className="text-base font-semibold text-white mb-6">Выйти из аккаунта?</h3>
        <div className="flex gap-3">
            <button 
                onClick={onBack}
                className="flex-1 py-3 bg-white/5 text-white/90 rounded-xl font-medium active:scale-95 transition-transform"
            >
                Отмена
            </button>
            <button 
                onClick={onConfirm}
                className="flex-1 py-3 bg-white text-black rounded-xl font-semibold active:scale-95 transition-transform"
            >
                Выйти
            </button>
        </div>
      </div>
    </div>
  );
}

function SupportRow({ title, subtitle, onClick }: any) {
    return (
        <div onClick={onClick} className="flex items-center py-4 px-2 active:bg-white/5 transition-colors cursor-pointer">
            <ArrowUpRight size={18} className="text-white/30 mr-4" />
            <div className="flex flex-col flex-1">
                <span className="text-[15px] text-white/90">{title}</span>
                <span className="text-[13px] text-white/40">{subtitle}</span>
            </div>
            <ChevronRight size={16} className="text-white/20" />
        </div>
    )
}

function Hairline() {
    return <div className="h-[1px] bg-white/[0.045] w-full" />
}