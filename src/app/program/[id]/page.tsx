"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Clock, Check, AlertTriangle, Loader2, Lock,
  Info, Lightbulb, Play, ChevronLeft
} from "lucide-react";
import { ProPlayer, VideoSource } from "@/components/ProPlayer";
import { useProgressSync } from "@/hooks/useProgressSync";

const API_BASE = "https://api.savoa.kz/api";

interface LessonDetail {
  id: string;
  title: string;
  description: string;
  duration: number;
  notes?: string;
  thumbnailUrl?: string;
  completed: boolean;
  isLocked: boolean;
  video?: VideoSource;
}

// Умный поиск URL (рекурсивно ищет m3u8 или mp4)
function findUrl(obj: any): string | null {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  if (Array.isArray(obj)) {
    for (const i of obj) { const u = findUrl(i); if(u) return u; }
    return null;
  }
  if (typeof obj === "object") {
    // Приоритеты ключей
    for (const k of ["url", "src", "playback", "mp4", "hls", "cloudflare"]) {
      const u = findUrl(obj[k]);
      if (u) return u;
    }
  }
  return null;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { map, heartbeat, complete } = useProgressSync();
  const lastSentSec = useRef(0);
  const lastSentAt = useRef(0);
  
  // Безопасное извлечение ID
  const rawId = params?.id;
  const lessonId = Array.isArray(rawId) ? rawId[0] : rawId;

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("savoa_auth_token");
  }, []);

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onPlayerTime = useCallback((sec: number) => {
    if (!lessonId) return;
    const s = Math.max(0, Math.floor(sec));
    const now = Date.now();

    if (now - lastSentAt.current < 12_000) return;     // ✅ 12 сек
    if (s <= lastSentSec.current) return;              // ✅ только рост

    lastSentAt.current = now;
    lastSentSec.current = s;

    heartbeat(lessonId, s);
  }, [lessonId, heartbeat]);

  const onPlayerEnded = useCallback((sec: number) => {
    if (!lessonId) return;
    const s = Math.max(0, Math.floor(sec));
    complete(lessonId, s); // ✅ completed=true
  }, [lessonId, complete]);

  const loadLesson = useCallback(async () => {
    if (!lessonId) return;
    setIsLoading(true);
    setError(null);

    try {
      const headers = { 
        Accept: "application/json", 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
      };

      // 1. Метаданные
      const metaRes = await fetch(`${API_BASE}/lessons/${lessonId}`, { headers });
      if (!metaRes.ok) throw new Error("Урок не найден");
      const meta = await metaRes.json();

      if (meta.is_locked) {
        setLesson({ 
            ...meta, 
            thumbnailUrl: meta.thumbnail_url, 
            isLocked: true, 
            completed: false 
        });
        setIsLoading(false);
        return;
      }

      // 2. Видео (только если доступ открыт)
      const playRes = await fetch(`${API_BASE}/lessons/${lessonId}/play`, { headers });
      
      let videoSource: VideoSource | undefined;
      if (playRes.ok) {
        const playData = await playRes.json();
        const url = findUrl(playData.cloudflare || playData);
        if (url) {
            videoSource = { url, isHls: url.includes(".m3u8") };
        }
      }

      setLesson({
        id: meta.id,
        title: meta.title,
        description: meta.description,
        duration: meta.duration,
        notes: meta.notes,
        thumbnailUrl: meta.thumbnail_url,
        completed: !!meta.completed, // Приводим к boolean если API вернет что-то другое
        isLocked: false,
        video: videoSource
      });

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Ошибка загрузки");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, token]);

  useEffect(() => { loadLesson(); }, [loadLesson]);

  useEffect(() => {
    if (!lesson) return;
    const p = map[lesson.id];
    if (!p) return;

    setLesson(prev => {
        if (!prev) return prev;
        const nextCompleted = !!p.completed || prev.completed;
        return nextCompleted === prev.completed ? prev : { ...prev, completed: nextCompleted };
    });
  }, [map, lesson?.id]); 

  // --- LOADER ---
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-white/30" size={32} />
        <span className="text-[10px] font-bold tracking-[0.3em] text-white/20 uppercase">Загрузка</span>
      </div>
    );
  }

  // --- ERROR ---
  if (error || !lesson) {
    return (
      <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-400">
           <AlertTriangle size={32} />
        </div>
        <p className="text-white/60 text-center max-w-sm">{error || "Урок не найден"}</p>
        <button 
            onClick={() => router.back()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-sm transition"
        >
            Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      
      {/* ================= MOBILE LAYOUT (< md) ================= */}
      <div className="md:hidden pb-32"> {/* pb-32 чтобы контент не перекрывался кнопкой внизу */}
        
        {/* Sticky Video Container */}
        <div className="sticky top-0 z-50 w-full aspect-[4/3] bg-black shadow-2xl border-b border-white/5 relative overflow-hidden">
            {!lesson.isLocked && lesson.video ? (
                <ProPlayer
                    className="w-full h-full"
                    src={lesson.video}
                    poster={lesson.thumbnailUrl}
                    title={lesson.title}
                    onBack={() => router.back()}
                    onTime={onPlayerTime}
                    onEnded={onPlayerEnded}
                />
            ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 relative">
                <button 
                    onClick={() => router.back()} 
                    className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition"
                >
                    <ChevronLeft size={24} />
                </button>
                <Lock size={32} className="text-white/20 mb-2" />
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Доступ закрыт</span>
             </div>
           )}
        </div>

        {/* Content Body */}
        <div className="px-5 py-6 space-y-8 bg-[#050505]">
            <div className="space-y-3">
               <h1 className="text-xl font-bold leading-snug text-white/95">{lesson.title}</h1>
               <div className="flex items-center gap-3 text-white/40 text-xs font-medium uppercase tracking-wide">
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {Math.floor(lesson.duration / 60)} мин</span>
                  {lesson.completed && <span className="text-green-500 flex items-center gap-1.5"><Check size={14} /> Пройдено</span>}
               </div>
            </div>

            <div className="w-full h-px bg-white/5" />
            
            <div className="space-y-3">
               <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                   Описание
               </h3>
               <p className="text-white/70 font-light leading-relaxed text-sm">{lesson.description}</p>
            </div>
            
            {lesson.notes && (
                <div className="p-4 rounded-xl bg-[#121212] border border-white/5 flex gap-4">
                   <Lightbulb className="text-amber-500/80 shrink-0 mt-0.5" size={20} />
                   <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white/90 uppercase tracking-wide">Важно</h4>
                      <p className="text-xs text-white/50 leading-relaxed">{lesson.notes}</p>
                   </div>
                </div>
            )}
        </div>
        
        {/* Floating Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
           <button className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 active:scale-95 transition-transform">
               {lesson.completed ? <><Check size={18} /> Пройдено</> : <><Play size={18} fill="currentColor" /> Начать</>}
           </button>
        </div>
      </div>

      {/* ================= DESKTOP LAYOUT (md+) ================= */}
      <div className="hidden md:flex h-screen w-full relative overflow-hidden items-center justify-center p-8 lg:p-12">
         {/* Background Ambience */}
         <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-[120px] scale-110" 
            style={{backgroundImage: `url(${lesson.thumbnailUrl})`}} 
         />
         <div className="absolute inset-0 bg-black/60" /> {/* Затемнение фона */}

         {/* Global Back Button (Desktop) */}
         <button 
            onClick={() => router.back()} 
            className="absolute top-8 left-8 z-50 flex items-center gap-3 text-white/40 hover:text-white transition-all group"
         >
            <div className="w-10 h-10 rounded-full border border-white/10 bg-black/20 backdrop-blur flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Назад</span>
         </button>

         <div className="relative z-10 flex w-full max-w-[1400px] gap-8 lg:gap-12 h-[85vh]">
            
            {/* Left: Video Player Area */}
            <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black relative group flex flex-col">
                {!lesson.isLocked && lesson.video ? (
                    <ProPlayer 
                        src={lesson.video} 
                        poster={lesson.thumbnailUrl}
                        title={lesson.title}
                        className="w-full h-full"
                        onTime={onPlayerTime}
                        onEnded={onPlayerEnded}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-6">
                        <Lock size={64} strokeWidth={1.5} />
                        <div className="text-center">
                            <span className="uppercase tracking-[0.3em] font-bold text-sm block mb-2">Доступ ограничен</span>
                            <span className="text-xs text-white/20">Пройдите предыдущие уроки</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Info Sidebar */}
            <div className="w-[380px] lg:w-[420px] flex flex-col gap-6 shrink-0">
                <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 flex-1 flex flex-col overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 relative z-10">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-3 text-white">{lesson.title}</h1>
                            <div className="flex items-center gap-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock size={14} /> {Math.floor(lesson.duration / 60)} мин</span>
                                {lesson.completed && <span className="text-green-400">Completed</span>}
                            </div>
                        </div>

                        <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />
                        
                        <p className="text-white/70 font-light leading-relaxed text-base">{lesson.description}</p>
                        
                        {lesson.notes && (
                            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                                <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    <Lightbulb size={12} /> Важно
                                </div>
                                <p className="text-sm text-amber-100/70 leading-relaxed font-light">{lesson.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Action Button */}
                <button 
                    disabled={lesson.isLocked}
                    className={`h-14 w-full rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg 
                    ${lesson.isLocked 
                        ? "bg-white/5 text-white/20 cursor-not-allowed" 
                        : "bg-white text-black hover:bg-neutral-200 shadow-white/5"
                    }`}
                >
                    {lesson.completed ? "Отметить как не пройденное" : "Завершить урок"}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
}   