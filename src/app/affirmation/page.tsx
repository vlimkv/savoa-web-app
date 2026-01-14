"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, RefreshCw, Sparkles as SparklesIcon, Moon } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";

// --- DATA ---
const AFFIRMATIONS = [
  "Моё тело знает, как восстанавливаться. Я позволяю ему делать свою работу.",
  "Я отношусь к своему телу с уважением, а не с требованиями.",
  "Моё тело — мой союзник, а не задача для исправления.",
  "Я слышу сигналы своего тела и отвечаю на них бережно.",
  "Мне не нужно бороться с собой, чтобы быть в порядке.",
  "Я выбираю заботу вместо контроля.",
  "Моё тело достойно любви уже сейчас.",
  "Я разрешаю себе быть в том темпе, который мне подходит.",
  "Я доверяю естественной мудрости своего тела.",
  "Моё тело — безопасное пространство для меня.",
  "Моё дыхание возвращает меня в настоящий момент.",
  "С каждым выдохом я отпускаю лишнее напряжение.",
  "Я могу замедлиться, и мир не рухнет.",
  "Я нахожу опору в простых вещах: дыхании, движении, тишине.",
  "Спокойствие доступно мне здесь и сейчас."
];

// --- TYPES & CONSTANTS ---
type ShufflePhase = "spread" | "stack" | "fan" | "selecting" | "revealed";

export default function AffirmationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<ShufflePhase>("spread");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [affirmation, setAffirmation] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Стабильные ID карт
  const cards = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  // Определение мобильного устройства для масштабирования
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    startSequence();
  }, []);

  const startSequence = () => {
    setIsShuffling(true);

    setPhase("spread");
    setSelectedCardId(null);
    setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
    const randomCard = Math.floor(Math.random() * 9);

    setTimeout(() => setPhase("stack"), 800);
    setTimeout(() => setPhase("fan"), 1600);
    setTimeout(() => {
        setPhase("selecting");
        setSelectedCardId(randomCard);
    }, 2400);
    setTimeout(() => {
        setPhase("revealed");
        setIsShuffling(false);
    }, 3200);
    };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden flex flex-col font-sans text-white perspective-[1200px]">
      
      {/* 1. ATMOSPHERE: DEEP VOID */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1a1a2e_0%,#000000_80%)] z-0" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
      />
      
      <Particles />

      {/* HEADER */}
      <div className="relative z-20 flex items-start justify-between p-6 pt-8 md:p-10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
            Послание
          </h1>
          <div className="h-0.5 w-12 bg-purple-500/50 mt-2 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <AnimatePresence mode="wait">
            {phase !== "revealed" && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] md:text-xs text-white/40 mt-2 font-mono tracking-widest uppercase"
              >
                // Синхронизирую энергию...
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
        >
          <X size={20} />
        </button>
      </div>

      {/* STAGE */}
      <div className="flex-1 relative flex items-center justify-center z-10 perspective-1000">
        <div className="relative w-full h-full flex items-center justify-center"> 
          {cards.map((id) => (
            <RealisticCard 
              key={id} 
              id={id} 
              phase={phase} 
              isSelected={selectedCardId === id} 
              affirmation={affirmation}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="relative z-20 px-6 pb-10 md:pb-12 h-32 flex items-end justify-center pointer-events-none">
        <AnimatePresence>
          {phase === "revealed" && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full max-w-sm flex flex-col gap-3 pointer-events-auto"
            >
              <button 
                onClick={() => router.back()}
                className="group relative w-full py-4 bg-white text-black font-bold text-sm tracking-[0.15em] uppercase rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shine" />
                <span className="relative z-10">Принять послание</span>
              </button>
              
              <button 
                onClick={startSequence}
                className="w-full flex items-center justify-center gap-2 py-4 bg-black/40 border border-white/10 text-white/70 rounded-xl text-xs font-bold uppercase tracking-widest backdrop-blur-md active:scale-[0.98] transition-all hover:bg-white/5 hover:text-white hover:border-white/20"
              >
                <RefreshCw size={14} className={isShuffling ? "animate-spin" : ""} />
                Вытянуть другую
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- TOP TIER CARD COMPONENT (FIXED) ---

function RealisticCard({ id, phase, isSelected, affirmation, isMobile }: any) {
  // Параллакс эффект для мыши (только для открытой карты)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  // Сглаживание движения
  const springConfig = { damping: 20, stiffness: 200 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  // Трансформации
  const sheenOpacity = useTransform(springRotateY, [-10, 10], [0, 0.4]);
  const rotateYFlipped = useTransform(springRotateY, (val) => val + 180);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (phase !== "revealed" || !isSelected) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getVariants = () => {
    const spreadFactor = isMobile ? 18 : 35;
    const arcHeight = isMobile ? 4 : 8;
    const fanAngle = (id - 4) * (isMobile ? 5 : 6); 
    
    switch (phase) {
      case "spread":
        return {
          x: (id - 4) * (isMobile ? 40 : 120) + (Math.random() * 20 - 10),
          y: Math.random() * (isMobile ? 100 : 200) - (isMobile ? 50 : 100),
          rotate: (Math.random() * 60 - 30),
          scale: 0.8,
          opacity: 0,
          z: 0,
          transition: { duration: 0, delay: id * 0.05 }
        };
      case "stack":
        return {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          zIndex: id,
          transition: { type: "spring", stiffness: 200, damping: 20 }
        };
      case "fan":
        return {
          x: (id - 4) * spreadFactor,
          y: Math.abs(id - 4) * arcHeight,
          rotate: fanAngle,
          scale: 1,
          opacity: 1,
          zIndex: id,
          transition: { type: "spring", stiffness: 120, damping: 14 }
        };
      case "selecting":
        if (isSelected) {
          return {
            x: 0,
            y: -20,
            rotate: 0,
            scale: 1.05,
            zIndex: 50,
            opacity: 1,
            transition: { duration: 0.4, ease: "backOut" }
          };
        } else {
          return {
            x: (id - 4) * (spreadFactor * 2.5),
            y: 400,
            opacity: 0,
            scale: 0.5,
            transition: { duration: 0.6, ease: "easeIn" }
          };
        }
      case "revealed":
        if (isSelected) {
          return {
            x: 0,
            y: 0,
            rotateY: 180,
            rotateX: 0,
            scale: isMobile ? 1.15 : 1.35,
            zIndex: 100,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          };
        }
        return { opacity: 0 };
    }
  };

  const cardSizeClass = isMobile ? "w-[200px] h-[300px]" : "w-[260px] h-[390px]";

  return (
    <motion.div
      layout
      className={`absolute ${cardSizeClass} preserve-3d cursor-pointer perspective-origin-center`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={getVariants() as any}
      style={{
        rotateX: isSelected && phase === "revealed" ? springRotateX : 0,
        rotateY: isSelected && phase === "revealed" ? rotateYFlipped : undefined, 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ================= BACK (Рубашка с ЛОГО) ================= */}
      <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-2xl bg-[#0a0a0c] border-[1px] border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
        
        {/* Фоновый паттерн */}
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)`, backgroundSize: '32px 32px' }} 
        />
        
        {/* Центральный круг с Логотипом */}
        <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-purple-300/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(100,50,255,0.1)] bg-black/20 backdrop-blur-sm">
                <div className="absolute inset-0 border border-white/5 rounded-full scale-125 animate-pulse-slow" />
                
                {/* --- ЛОГОТИП ЗДЕСЬ --- */}
                <div className="relative w-12 h-12 md:w-16 md:h-16 opacity-80 hover:opacity-100 transition-opacity duration-500">
                    <Image 
                        src="/logo.png"  // Убедитесь, что файл logo.png лежит в папке public
                        alt="Savoa Logo"
                        fill
                        className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    />
                </div>
                {/* ------------------- */}

            </div>
        </div>
        
        {/* Блик */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-sheen" />
      </div>


      {/* ================= FRONT (Лицо) ================= */}
      <div 
        className="absolute inset-0 backface-hidden rounded-xl overflow-hidden bg-[#F2F0E9] shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] rotate-y-180"
        style={{ transform: "rotateY(180deg)" }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-multiply pointer-events-none"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")` }} 
        />
        <div className="absolute inset-2 border border-[#C5B358]/30 rounded-lg pointer-events-none z-20" />
        <div className="absolute inset-3 border border-[#C5B358]/10 rounded-lg pointer-events-none z-20" />

        <div className="relative z-10 w-full h-full flex flex-col p-6 items-center text-center justify-between">
            <div className="text-[#C5B358] mt-2 opacity-80">
                <SparklesIcon size={20} strokeWidth={1.5} />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full space-y-6">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto" />
                    <p className={`text-neutral-800 font-serif italic leading-relaxed ${isMobile ? 'text-base' : 'text-xl'}`}>
                        {affirmation}
                    </p>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto" />
                </div>
            </div>
            <div className="text-neutral-400 font-mono text-[10px] tracking-widest uppercase mb-1">
                Card No. 0{id + 1}
            </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none mix-blend-overlay" />
        
        {/* Dynamic Light Reflection based on tilt */}
        <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"
            style={{ 
                opacity: sheenOpacity 
            }}
        />
      </div>
    </motion.div>
  );
}

// --- PARTICLES BACKGROUND ---
function Particles() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-0.5 h-0.5 bg-purple-200 rounded-full blur-[1px]"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5
                    }}
                    animate={{
                        y: [0, -120],
                        opacity: [0, 0.4, 0],
                    }}
                    transition={{
                        duration: Math.random() * 8 + 10,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 10
                    }}
                />
            ))}
        </div>
    )
}