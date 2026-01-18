"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Info, Volume2, Bird, CloudRain, Waves, Speaker, Play, Pause, RotateCcw, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
export interface MeditationItem {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  durationSec: number;
  category: "Sleep" | "Love" | "Start" | "General";
  icon: any;
  audioUrl: string;
  benefits: string[];
  description: string;
}

type AmbientType = "none" | "birds" | "ocean" | "rain";

interface PlayerProps {
  item: MeditationItem | null;
  onClose: () => void;
}

// --- CONFIG ---
const AMBIENT_SOUNDS = [
  { id: "none", label: "Без звука", icon: Speaker },
  { id: "birds", label: "Птицы", icon: Bird, src: "/sounds/ambient_birds.mp3" },
  { id: "ocean", label: "Океан", icon: Waves, src: "/sounds/ambient_ocean.mp3" },
  { id: "rain", label: "Дождь", icon: CloudRain, src: "/sounds/ambient_rain.mp3" },
];

const MAIN_FIXED_VOLUME = 0.65;   // попробуй 0.5–0.75
const AMBIENT_FIXED_GAIN = 0.008; // iPhone обычно надо ниже

export default function MeditationPlayer({ item, onClose }: PlayerProps) {
  if (!item) return null;

  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showAmbient, setShowAmbient] = useState(false);
  
  // Ambient State
  const [selectedAmbient, setSelectedAmbient] = useState<AmbientType>("none");

  // Refs
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  const ambientCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientSrcNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const ensureAmbientGraph = (amb: HTMLAudioElement) => {
	  const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;

	  if (!ambientCtxRef.current) {
	    ambientCtxRef.current = new Ctx();
	  }
	  const ctx = ambientCtxRef.current!;

	  if (!ambientGainRef.current) {
	    ambientGainRef.current = ctx.createGain();
	    ambientGainRef.current.connect(ctx.destination);
	  }

	  // Новый amb => новый source node
	  ambientSrcNodeRef.current?.disconnect();
	  ambientSrcNodeRef.current = ctx.createMediaElementSource(amb);
	  ambientSrcNodeRef.current.connect(ambientGainRef.current);

	  return ctx;
  };

  // --- COLORS ---
  const getColors = () => {
    switch (item.category) {
      case "Sleep": return { orb: "bg-indigo-500", sec: "bg-purple-600", text: "text-indigo-200" };
      case "Love": return { orb: "bg-pink-500", sec: "bg-rose-400", text: "text-pink-200" };
      case "Start": return { orb: "bg-amber-400", sec: "bg-orange-300", text: "text-amber-200" };
      default: return { orb: "bg-blue-500", sec: "bg-cyan-500", text: "text-blue-200" };
    }
  };
  const colors = getColors();

  // --- AUDIO LOGIC ---
  useEffect(() => {
    // 1. Создаем аудио
    const audio = new Audio(item.audioUrl);
    mainAudioRef.current = audio;
    
    audio.volume = MAIN_FIXED_VOLUME;
    audio.preload = "auto";
    (audio as any).playsInline = true;
    (audio as any).webkitPlaysInline = true;

    // 2. Слушатели
    const updateHandler = () => {
      const curr = audio.currentTime;
      const dur = audio.duration || item.durationSec;
      setCurrentTime(curr);
      setProgress((curr / dur) * 100);
    };

    const endHandler = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateHandler);
    audio.addEventListener("ended", endHandler);
    
    // 3. Безопасный авто-старт
    const safePlay = async () => {
        try {
            await audio.play();
            setIsPlaying(true);
        } catch (err: any) {
            // Игнорируем AbortError, который возникает при быстрой смене треков или закрытии
            if (err.name !== "AbortError") {
                console.warn("Audio Play Error:", err);
            }
        }
    };
    safePlay();

    // 4. Очистка
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateHandler);
      audio.removeEventListener("ended", endHandler);
      audio.src = ""; // Помогает сборщику мусора
      mainAudioRef.current = null;
      
      // Остановка эмбиента
      ambientAudioRef.current?.pause();
      ambientAudioRef.current = null;
    };
  }, [item]); // Перезапуск только при смене item

  useEffect(() => {
	  // стопаем старый эмбиент
	  if (ambientAudioRef.current) {
	    ambientAudioRef.current.pause();
	    ambientAudioRef.current.src = "";
	    ambientAudioRef.current = null;
	  }
	  ambientSrcNodeRef.current?.disconnect();
	  ambientSrcNodeRef.current = null;

	  if (selectedAmbient === "none") return;

	  const sound = AMBIENT_SOUNDS.find((s) => s.id === selectedAmbient);
	  if (!sound?.src) return;

	  const amb = new Audio(sound.src);
	  amb.loop = true;
	  amb.preload = "auto";

	  // важно: оставляем volume=1, управляем ТОЛЬКО через gain
	  amb.volume = 1;

	  ambientAudioRef.current = amb;

	  // подключаем WebAudio граф
	  const ctx = ensureAmbientGraph(amb);

	  // ставим нужный гейн сразу
	  if (ambientGainRef.current) {
	    ambientGainRef.current.gain.value = getAmbientGain();
	  }

	  if (isPlaying) {
		  ctx.resume().catch(() => {});
		  if (ambientGainRef.current) ambientGainRef.current.gain.value = 0;

		  amb.play()
		    .then(() => {
		      if (ambientGainRef.current) {
		        ambientGainRef.current.gain.value = getAmbientGain();
		      }
		    })
		    .catch((e: any) => {
		      if (e?.name !== "AbortError") console.warn("Ambient play error", e);
		    });
	  }

	  return () => {
	    amb.pause();
	    amb.src = "";
	    ambientSrcNodeRef.current?.disconnect();
	    ambientSrcNodeRef.current = null;
	  };
  }, [selectedAmbient, isPlaying]);

  useEffect(() => {
    if (ambientGainRef.current) {
      ambientGainRef.current.gain.value = getAmbientGain();
    }
  }, [isPlaying]);

  const getAmbientGain = () => (isPlaying ? AMBIENT_FIXED_GAIN : 0);
  // --- CONTROLS ---

  const togglePlay = async () => {
    if (!mainAudioRef.current) return;
    
    if (isPlaying) {
      mainAudioRef.current.pause();
      ambientAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
	  try {
	    // разбудить контекст на iOS
	    await ambientCtxRef.current?.resume().catch(() => {});

            mainAudioRef.current.volume = MAIN_FIXED_VOLUME;
	    await mainAudioRef.current.play();

	    if (ambientAudioRef.current) {
	      // гейн уже выставлен эффектами, просто play
	      await ambientAudioRef.current.play();
	    }

	    setIsPlaying(true);
	  } catch (err: any) {
	    if (err.name !== "AbortError") console.error(err);
	  }
     }
  };

  const seek = (seconds: number) => {
    if (!mainAudioRef.current) return;
    mainAudioRef.current.currentTime = Math.max(0, Math.min(mainAudioRef.current.currentTime + seconds, item.durationSec));
  };

  const handleSeekDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainAudioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
    mainAudioRef.current.currentTime = percent * item.durationSec;
    // Обновляем UI вручную сразу для плавности
    setCurrentTime(mainAudioRef.current.currentTime);
    setProgress(percent * 100);
  };

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden"
    >
      {/* iOS safe-area top fill (Dynamic Island / notch) */}
      <div
        className="fixed top-0 left-0 right-0 z-[200] bg-black"
        style={{ height: "env(safe-area-inset-top)" }}
      />
      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 z-0">
         <div className={`absolute top-1/4 left-1/4 w-[300px] h-[300px] ${colors.orb} rounded-full blur-[120px] opacity-20`} />
         <div className={`absolute bottom-1/4 right-1/4 w-[250px] h-[250px] ${colors.sec} rounded-full blur-[100px] opacity-20`} />
      </div>

      {/* PARTICLES */}
      <Particles ambient={selectedAmbient} isPlaying={isPlaying} />

      {/* HEADER */}
      <div className="relative z-20 flex items-center justify-between p-6 pt-12 md:pt-6">
        <button onClick={onClose} className="p-3 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all">
          <ChevronDown size={20} />
        </button>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAmbient(!showAmbient)}
            className={`p-3 rounded-full transition-all active:scale-95 ${showAmbient || selectedAmbient !== 'none' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}
          >
            {selectedAmbient !== 'none' ? (
                (() => {
                    const Icon = AMBIENT_SOUNDS.find(s => s.id === selectedAmbient)?.icon || Volume2;
                    return <Icon size={20} />;
                })()
            ) : (
                <Volume2 size={20} />
            )}
          </button>
          
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`p-3 rounded-full transition-all active:scale-95 ${showInfo ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* CONTENT (ORB/INFO) */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {showInfo ? (
            <motion.div 
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md h-full overflow-y-auto custom-scrollbar p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md"
            >
               <h2 className="text-2xl font-bold mb-6">{item.title}</h2>
               <div className="space-y-6">
                 <div>
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">Польза</h3>
                    <ul className="space-y-3">
                        {item.benefits.map((b, i) => (
                            <li key={i} className="flex gap-3 text-white/80">
                                <div className={`w-1.5 h-1.5 rounded-full mt-2 ${colors.orb}`} />
                                {b}
                            </li>
                        ))}
                    </ul>
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">Описание</h3>
                    <p className="text-white/70 leading-relaxed text-sm">
                        {item.description}
                    </p>
                 </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="orb"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center w-full"
            >
              <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
                 <motion.div 
                    animate={{ scale: isPlaying ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full ${colors.orb} opacity-20 blur-3xl`}
                 />
                 <motion.div 
                    animate={{ scale: isPlaying ? [1, 1.1, 1] : 1, rotate: 360 }}
                    transition={{ scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
                    className={`absolute inset-10 rounded-full bg-gradient-to-tr from-white/10 to-transparent border border-white/10`}
                 />
                 <motion.div 
                    animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                 >
                     <item.icon size={64} strokeWidth={1} className="text-white/80" />
                 </motion.div>
              </div>

              <div className="text-center space-y-2">
                 <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{item.title}</h2>
                 <div className="flex items-center justify-center gap-2 text-white/50 text-sm font-medium">
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.duration}</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROLS */}
      <div className="relative z-20 p-8 pb-12 md:pb-8 w-full max-w-2xl mx-auto">
        <div className="mb-8 group cursor-pointer" onClick={handleSeekDrag}>
           <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
               <motion.div 
                 className={`absolute top-0 left-0 bottom-0 ${colors.orb} bg-white`}
                 style={{ width: `${progress}%` }}
               />
           </div>
           <div className="flex justify-between mt-2 text-xs font-medium text-white/40">
               <span>{formatTime(currentTime)}</span>
               <span>{formatTime(item.durationSec)}</span>
           </div>
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-12">
            <button onClick={() => seek(-15)} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-all active:scale-95">
                <RotateCcw size={24} />
            </button>

            <button 
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button onClick={() => seek(15)} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-all active:scale-95">
                <RotateCw size={24} />
            </button>
        </div>
      </div>

      {/* AMBIENT SHEET */}
      <AnimatePresence>
        {showAmbient && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowAmbient(false)}
            >
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-0 left-0 right-0 bg-[#121212] rounded-t-3xl border-t border-white/10 p-6 pb-12"
                >
                    <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" />
                    <h3 className="text-lg font-bold mb-6">Фоновые звуки</h3>
                    <div className="space-y-3">
                        {AMBIENT_SOUNDS.map((sound) => {
                            const Icon = sound.icon;
                            const isActive = selectedAmbient === sound.id;
                            return (
                                <button
                                    key={sound.id}
                                    onClick={() => setSelectedAmbient(sound.id as AmbientType)}
                                    className={`w-full flex items-center p-4 rounded-2xl border transition-all ${isActive ? `bg-white/10 border-white/20 text-white` : `bg-transparent border-white/5 text-white/60 hover:bg-white/5`}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="font-medium flex-1 text-left">{sound.label}</span>
                                    {isActive && <div className={`w-3 h-3 rounded-full ${colors.orb}`} />}
                                </button>
                            )
                        })}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// --- PARTICLES COMPONENT ---
function Particles({ ambient, isPlaying }: { ambient: string, isPlaying: boolean }) {
    if (!isPlaying || ambient === 'none') return null;

    if (ambient === 'birds') {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: -50, y: Math.random() * 500 }}
                        animate={{ x: window.innerWidth + 50, y: Math.random() * 500 - 100 }}
                        transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
                        className="absolute text-white/20"
                    >
                        <Bird size={24} />
                    </motion.div>
                ))}
            </div>
        )
    }

    if (ambient === 'rain') {
        return (
             <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-transparent to-blue-900/10">
                 {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -20, x: Math.random() * window.innerWidth }}
                        animate={{ y: window.innerHeight + 20 }}
                        transition={{ duration: 0.8 + Math.random(), repeat: Infinity, delay: Math.random() * 2, ease: "linear" }}
                        className="absolute w-0.5 h-6 bg-blue-200/20 rounded-full"
                    />
                ))}
             </div>
        )
    }
    return null;
}

