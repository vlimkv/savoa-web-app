"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Play, Pause, Wind, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- КОНФИГУРАЦИЯ (РУССКИЙ ЯЗЫК) ---

type PhaseType = "ready" | "inhale" | "hold" | "exhale" | "rest";

interface PhaseConfig {
  duration: number;
  title: string;
  prompt: string;
  // Цвета воды (Градиент: Верх -> Низ)
  colorTop: string;
  colorBottom: string;
  // Высота воды (0% - 100%)
  level: string; 
  // Масштаб центрального круга
  scale: number;
}

const PHASES: Record<PhaseType, PhaseConfig> = {
  ready:  { duration: 0, title: "ГОТОВЫ",   prompt: "Займите удобное положение", colorTop: "#64748b", colorBottom: "#0f172a", level: "15%", scale: 1.0 },
  
  inhale: { duration: 4, title: "ВДОХ",     prompt: "Глубокий вдох носом...",    colorTop: "#38bdf8", colorBottom: "#0369a1", level: "95%", scale: 1.3 }, // Вода вверх
  
  hold:   { duration: 2, title: "ПАУЗА",    prompt: "Задержите дыхание",         colorTop: "#818cf8", colorBottom: "#3730a3", level: "95%", scale: 1.35 }, // Держим высоко
  
  exhale: { duration: 6, title: "ВЫДОХ",    prompt: "Медленно выдыхайте...",     colorTop: "#f472b6", colorBottom: "#be185d", level: "15%", scale: 1.0 }, // Вода вниз
  
  rest:   { duration: 2, title: "ОТДЫХ",    prompt: "Расслабление",              colorTop: "#94a3b8", colorBottom: "#1e293b", level: "15%", scale: 1.0 },
};

export default function LuxuryBreathPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<PhaseType>("ready");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycle, setCycle] = useState(0);
  
  // Аудио плееры
  const inhaleAudio = useRef<HTMLAudioElement | null>(null);
  const exhaleAudio = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
        inhaleAudio.current = new Audio("/sounds/inhale.wav");
        exhaleAudio.current = new Audio("/sounds/exhale.wav");
    }
  }, []);

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      if (timeLeft > 0) {
        interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      } else {
        nextPhase();
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const nextPhase = () => {
    if (phase === "rest") {
        if (cycle < 3) { // Всего 4 цикла (0, 1, 2, 3)
            setCycle(c => c + 1);
            startPhase("inhale");
        } else {
            setIsRunning(false);
            setPhase("ready");
            setCycle(0);
        }
    } else {
        const sequence: Record<PhaseType, PhaseType> = {
            ready: "inhale", inhale: "hold", hold: "exhale", exhale: "rest", rest: "inhale"
        };
        startPhase(sequence[phase]);
    }
  };

  const startPhase = (newPhase: PhaseType) => {
    setPhase(newPhase);
    setTimeLeft(PHASES[newPhase].duration);
    
    // Звуки
    if (newPhase === "inhale") inhaleAudio.current?.play().catch(() => {});
    if (newPhase === "exhale") exhaleAudio.current?.play().catch(() => {});
  };

  const togglePractice = () => {
    if (isRunning) {
      setIsRunning(false);
      setPhase("ready");
    } else {
      setIsRunning(true);
      startPhase("inhale");
    }
  };

  const currentConfig = PHASES[phase];

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden text-white font-sans selection:bg-white selection:text-black">
      
      {/* 1. CINEMATIC GRAIN (Шум пленки) */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.06] mix-blend-overlay"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* 2. BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-[#111]" />
      
      {/* Ambient Light based on Phase */}
      <motion.div 
        animate={{ opacity: isRunning ? 0.2 : 0 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0 bg-gradient-to-t from-current to-transparent opacity-10"
        style={{ color: currentConfig.colorTop }}
      />

      {/* 3. THE OCEAN (Поднимается и опускается) */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-10 w-full overflow-hidden"
        // Главная анимация высоты воды
        initial={{ height: "15%" }}
        animate={{ height: isRunning ? currentConfig.level : "15%" }}
        transition={{ 
            duration: currentConfig.duration, 
            ease: "easeInOut" // Плавная физика воды
        }}
      >
         {/* Слои волн. 
            opacity: прозрачность
            speed: скорость движения по горизонтали (сек)
            height: высота гребня
         */}
         
         {/* Задняя волна (Темная, медленная) */}
         <WaveLayer color={currentConfig.colorBottom} opacity={0.6} speed={20} offset={0} height={40} />
         
         {/* Средняя волна (Смешивание) */}
         <WaveLayer color={currentConfig.colorTop} opacity={0.3} speed={12} offset={50} height={30} />
         
         {/* Передняя волна (Светлая, быстрая) */}
         <WaveLayer color={currentConfig.colorTop} opacity={0.8} speed={7} offset={100} height={20} />

         {/* Тело воды (Градиент) */}
         <motion.div 
            className="absolute inset-0 top-10 w-full h-full"
            animate={{ 
                background: `linear-gradient(to bottom, ${currentConfig.colorTop}40, ${currentConfig.colorBottom})`
            }}
            transition={{ duration: 1 }}
         />
         
         {/* Пузырьки (частицы) */}
         <div className="absolute inset-0 w-full h-full top-20 opacity-30">
            <Particles />
         </div>
      </motion.div>


      {/* 4. UI INTERFACE */}
      <div className="relative z-30 w-full h-screen flex flex-col justify-between p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center pt-2">
            <button 
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
            >
                <X size={18} className="text-white/80" />
            </button>
            
            <div className="flex flex-col items-end opacity-60">
                <span className="text-[10px] tracking-[0.2em] font-bold uppercase">Цикл</span>
                <span className="text-xl font-light tabular-nums leading-none">{cycle + 1} / 4</span>
            </div>
        </div>

        {/* Center Content (Timer & Text) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md text-center">
            
            {/* Breathing Halo (Behind Text) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none -z-10">
                <motion.div 
                    animate={{ scale: isRunning ? currentConfig.scale : 1 }}
                    transition={{ duration: currentConfig.duration, ease: "easeInOut" }}
                    className="w-full h-full rounded-full blur-[80px] opacity-40"
                    style={{ backgroundColor: currentConfig.colorTop }}
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center gap-2"
                >
                    {/* Phase Title */}
                    <div className="flex items-center gap-2 text-white/50 mb-2">
                        {isRunning && <Wind size={12} className="animate-pulse" />}
                        <span className="text-[11px] font-bold tracking-[0.3em] uppercase">
                            {currentConfig.title}
                        </span>
                    </div>

                    {/* Timer (Huge & Thin) */}
                    <h1 className="text-[100px] md:text-[140px] font-thin leading-none tracking-tighter text-white drop-shadow-2xl">
                        {isRunning ? timeLeft : "Start"}
                    </h1>

                    {/* Prompt */}
                    <p className="text-base font-light text-white/80 tracking-wide mt-2">
                        {currentConfig.prompt}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-center pb-8">
            <button 
                onClick={togglePractice}
                className="group relative h-16 px-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center gap-4 overflow-hidden hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
                {/* Shine Sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                
                {isRunning ? (
                    <>
                        <Pause size={18} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Пауза</span>
                    </>
                ) : (
                    <>
                        <Play size={18} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">
                            {cycle > 0 ? "Продолжить" : "Начать"}
                        </span>
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}

// --- WAVE COMPONENT (SMOOTH SVG) ---

function WaveLayer({ color, opacity, speed, offset, height }: any) {
    return (
        <motion.div
            className="absolute left-0 w-[200%] flex"
            style={{ 
                top: -height, // Поднимаем волну, чтобы гребень был краем
                x: offset, 
                opacity: opacity 
            }}
            animate={{ x: [0, -1000] }} // Бесконечное движение
            transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        >
            {/* SVG Паттерн волны */}
            <svg viewBox="0 0 1000 100" className="w-[1000px] h-[100px] block" preserveAspectRatio="none">
                <path d="M0,50 C200,0 300,100 500,50 C700,0 800,100 1000,50 V100 H0 Z" fill={color} />
            </svg>
            <svg viewBox="0 0 1000 100" className="w-[1000px] h-[100px] block" preserveAspectRatio="none">
                <path d="M0,50 C200,0 300,100 500,50 C700,0 800,100 1000,50 V100 H0 Z" fill={color} />
            </svg>
        </motion.div>
    )
}

// --- PARTICLES (BUBBLES) ---

function Particles() {
    // Генерируем статический массив для SSR
    const particles = Array.from({ length: 15 }); 
    
    return (
        <>
            {particles.map((_, i) => (
                <motion.div 
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full opacity-0"
                    style={{ 
                        left: `${(i * 7) % 100}%`,
                        scale: Math.random() * 0.5 + 0.5
                    }}
                    animate={{ 
                        y: [0, -300], // Всплытие
                        opacity: [0, 0.5, 0] // Мерцание
                    }}
                    transition={{ 
                        duration: 5 + Math.random() * 5, 
                        repeat: Infinity, 
                        delay: Math.random() * 5,
                        ease: "linear"
                    }}
                />
            ))}
        </>
    )
}