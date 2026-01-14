"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Play, Lock, Check, Clock, ChevronRight, Sparkles, BookOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { loadLocalProgress } from "@/lib/progress";
import { useProgressSync } from "@/hooks/useProgressSync";
import { useRouter } from "next/navigation";

// --- TYPES (Matching Swift Structs) ---

interface APILesson {
  id: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  video_url?: string;
  thumbnail_url?: string;
  is_locked?: boolean;
  unlock_date?: string;
  order: number;
}

interface APIDay {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: APILesson[];
}

interface APIModule {
  id: string;
  title: string;
  description: string;
  order: number;
  days: APIDay[];
}

interface APICourse {
  id: string;
  title: string;
  description: string;
  modules: APIModule[];
  author_name: string;
  author_bio: string;
  author_image_url?: string;
}

// Internal Types (Mapped to camelCase for React)
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl?: string;
  isLocked: boolean;
  unlockDate?: string;
  completed: boolean; // Local state mock, normally comes from user profile
  dayTitle?: string; // Helper for UI
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[]; // Flattened for easier UI rendering
}

interface Course {
  title: string;
  description: string;
  modules: Module[];
}

// --- API SERVICE ---

const API_BASE = "https://api.savoa.kz/api";

type WeekResponse = {
  id: string;
  title?: string | null;
  description?: string | null;
  image_id?: string | null;
  order_index: number;
  lessons: Array<{
    id: string;
    title: string;
    description?: string | null;
    day_order: number;
    duration: number;
    week_id: string;
    image_id?: string | null;
    thumbnail_url?: string | null;
    is_locked?: boolean | null;
    unlock_date?: string | null;
  }>;
};

async function fetchCourseData(): Promise<Course> {
  // 1) достаём токен (пример). Подстрой под то, где ты его хранишь.
  const token =
    typeof window !== "undefined"
        ? localStorage.getItem("savoa_auth_token")
        : null;

  const resp = await fetch(`${API_BASE}/course/weeks`, {
    method: "GET",
    cache: "no-store",
    headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!resp.ok) {
    const raw = await resp.text().catch(() => "");
    throw new Error(`Failed to fetch course: ${resp.status} ${raw}`);
  }

  const weeks: WeekResponse[] = await resp.json();

  const local = loadLocalProgress();

  const modules: Module[] = weeks
    .sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999))
    .map((w) => {
      // группируем lessons по day_order -> это твои "days"
      const byDay = new Map<number, WeekResponse["lessons"]>();
      for (const l of w.lessons || []) {
        const k = Number(l.day_order ?? 0);
        byDay.set(k, [...(byDay.get(k) ?? []), l]);
      }

      const flattenedLessons: Lesson[] = Array.from(byDay.entries())
        .sort((a, b) => a[0] - b[0])
        .flatMap(([dayOrder, dayLessons]) =>
          dayLessons
            .slice()
            .sort((a, b) => Number(a.day_order ?? 0) - Number(b.day_order ?? 0))
            .map((l) => {
                const p = local[l.id];
                return ({
                    id: l.id,
                    title: l.title,
                    description: l.description ?? "",
                    duration: l.duration,
                    thumbnailUrl: l.thumbnail_url ?? undefined,
                    isLocked: Boolean(l.is_locked),
                    unlockDate: l.unlock_date ?? undefined,
                    completed: Boolean(p?.completed),           // ✅
                    dayTitle: `День ${dayOrder}`,
                });
            })
        );

      return {
        id: w.id,
        title: w.title ?? "",
        description: w.description ?? "",
        order: w.order_index,
        lessons: flattenedLessons,
      };
    });

  return {
    title: "RE:STORE",
    description: "Программа восстановления тазового дна",
    modules,
  };
}

// --- COMPONENT ---

export default function ProgramPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { map, ready, pullAndMerge, completedCount } = useProgressSync();
  const router = useRouter();

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCourseData();
      setCourse(data);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить программу");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!course) return;
    pullAndMerge();
  }, [course, pullAndMerge]);

  // ViewModel Logic: Computed Props
  const stats = useMemo(() => {
    if (!course) return { total: 0, completed: 0, percent: 0 };
    const allLessons = course.modules.flatMap(m => m.lessons);
    const total = allLessons.length;
    const completed = allLessons.filter(l => map[l.id]?.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [course, map]);

  const nextLessonId = useMemo(() => {
    if (!course) return null;

    const all = course.modules
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((m) => m.lessons);

    // берём только доступные (не locked)
    const available = all.filter((l) => !l.isLocked);

    if (!available.length) return null;

    // первый доступный НЕ завершённый
    const firstUncompleted = available.find((l) => !map[l.id]?.completed);
    if (firstUncompleted) return firstUncompleted.id;

    // если все доступные завершены — ведём на последний доступный (или первый, как хочешь)
    return available[available.length - 1].id;
  }, [course, map]);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="animate-spin">
          <RefreshCw size={24} className="opacity-50" />
        </div>
        <div className="text-[10px] font-bold tracking-[4px] opacity-25">RE:STORE</div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !course) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center gap-6 text-white">
        <AlertTriangle size={32} className="opacity-30" strokeWidth={1} />
        <div className="text-sm font-medium opacity-50">{error}</div>
        <button 
          onClick={loadData}
          className="px-7 py-3 bg-white text-black rounded text-xs font-semibold hover:bg-neutral-200 transition"
        >
          Повторить
        </button>
      </div>
    );
  }

  // --- MAIN CONTENT ---
  return (
    <div className="w-full min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
        
        {/* ================================================================================= */}
        {/* 📱 MOBILE LAYOUT                                                                  */}
        {/* ================================================================================= */}
        <div className="md:hidden pb-24">
            <div className="p-5 space-y-10">
            
                {/* Hero */}
                <div className="relative h-[280px] w-full rounded-2xl overflow-hidden bg-neutral-800">
                    <img 
                        src="/images/restore_cover.png" // Placeholder or from API if available
                        alt="Cover"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 p-6 space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white uppercase">RE:STORE</h1>
                        <p className="text-sm font-medium text-white/60">{course.title}</p>
                    </div>
                </div>

                {/* Progress Ring */}
                <div className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5">
                    <div className="relative w-[52px] h-[52px]">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" strokeDasharray={`${stats.percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            {stats.percent}%
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white">Прогресс</h3>
                        <p className="text-xs text-white/40">{stats.completed} из {stats.total} уроков</p>
                    </div>
                </div>

                {/* Modules (Horizontal Scroll like Swift) */}
                <div className="space-y-12">
                    {course.modules.map((module) => (
                    <div key={module.id} className="space-y-6">
                        <div className="flex items-baseline gap-4">
                            <span className="text-4xl font-bold text-white tracking-tighter">
                                {String(module.order).padStart(2, '0')}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold text-white">{module.title}</span>
                                <span className="text-xs text-white/40">{module.lessons.length} уроков</span>
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
                            {module.lessons.map((lesson) => (
                                <MobileLessonCard
                                    key={lesson.id}
                                    lesson={{ ...lesson, completed: !!map[lesson.id]?.completed }} // ✅
                                />
                            ))}
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>


        {/* ================================================================================= */}
        {/* 💻 TABLET & DESKTOP LAYOUT                                                        */}
        {/* ================================================================================= */}
        <div className="hidden md:flex h-screen w-full overflow-hidden bg-[#050505] p-6 lg:p-8 gap-8">
            
            {/* --- LEFT COLUMN: FIXED COURSE INFO --- */}
            <div className="w-[340px] lg:w-[420px] flex flex-col gap-6 shrink-0 h-full">
                
                {/* Cover Art */}
                <div className="relative flex-1 rounded-[32px] overflow-hidden group border border-white/5 bg-[#0a0a0a]">
                    <img
                        src="/images/restore_cover.png"
                        alt="Cover"
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end h-full">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/90">
                                Основной курс
                            </div>
                            <div className="px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/50">
                                {stats.total} Уроков
                            </div>
                        </div>
                        
                        <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter text-white mb-3 leading-[0.9]">
                            RE:STORE
                        </h1>
                        <p className="text-base text-white/60 font-light leading-relaxed mb-8">
                            {course.description}
                        </p>

                        <button
                            onClick={() => {
                                if (!nextLessonId) return;
                                router.push(`/program/${nextLessonId}`);
                            }}
                            disabled={!nextLessonId}
                            className="group w-full h-14 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                            <Play size={18} fill="currentColor" />
                            <span>Продолжить</span>
                            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="h-[140px] p-6 rounded-[24px] bg-[#121212] border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">Ваш прогресс</div>
                            <div className="text-3xl font-bold text-white">{stats.percent}%</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_white]" 
                            style={{ width: `${stats.percent}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: MODULES LIST --- */}
            <div className="flex-1 h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-12 pb-20 pt-4">
                    {course.modules.map((module) => (
                        <div key={module.id} className="space-y-6">
                            
                            <div className="flex items-end gap-6 border-b border-white/5 pb-6 mx-2">
                                <span className="text-6xl font-bold text-white/5 select-none leading-none -mb-2">
                                    {String(module.order).padStart(2, '0')}
                                </span>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{module.title}</h2>
                                    <p className="text-sm text-white/40">{module.description}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {module.lessons.map((lesson, idx) => (
                                    <DesktopLessonRow
                                        key={lesson.id}
                                        lesson={{ ...lesson, completed: !!map[lesson.id]?.completed }} // ✅
                                        index={idx + 1}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function MobileLessonCard({ lesson }: { lesson: Lesson }) {
  const formatDuration = (sec: number) => {
    const mins = Math.max(1, Math.floor(sec / 60));
    return `${mins} мин`;
  };

  const formattedUnlockDate = lesson.unlockDate 
    ? new Date(lesson.unlockDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : "Скоро";

  return (
    <Link href={lesson.isLocked ? "#" : `/program/${lesson.id}`}>
      <div className={`relative flex-shrink-0 w-[200px] h-[240px] rounded-2xl overflow-hidden border transition-all active:scale-95 ${lesson.completed ? 'border-green-500/30' : 'border-white/10'} bg-neutral-900 group`}>
        
        {/* Background Image */}
        {lesson.thumbnailUrl ? (
            <img src={lesson.thumbnailUrl} alt={lesson.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
            <div className="absolute inset-0 bg-neutral-800" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {lesson.isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 p-4">
             <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center gap-3 border border-white/10 mt-2">
                <Lock size={14} className="text-white/90" />
                <span className="text-xs font-semibold text-white/90">
                  {lesson.unlockDate ? `Доступ ${formattedUnlockDate}` : "Скоро"}
                </span>
             </div>
          </div>
        )}

        <div className="absolute inset-0 p-4 flex flex-col justify-between z-0">
           <div className="flex justify-start">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${lesson.completed ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/50'}`}>
                 {lesson.completed ? <Check size={12} strokeWidth={4} /> : <Play size={10} fill="currentColor" />}
              </div>
           </div>

           <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                {lesson.dayTitle || "Урок"}
              </span>
              <h4 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                {lesson.title}
              </h4>
              <div className="flex items-center gap-1.5 text-white/40">
                 <Clock size={10} />
                 <span className="text-[10px] font-medium">{formatDuration(lesson.duration)}</span>
              </div>
           </div>
        </div>
      </div>
    </Link>
  );
}

function DesktopLessonRow({ lesson, index }: { lesson: Lesson, index: number }) {
    const formatDuration = (sec: number) => `${Math.max(1, Math.floor(sec / 60))} мин`;

    const formattedUnlockDate = lesson.unlockDate 
        ? new Date(lesson.unlockDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
        : "Скоро";
    
    return (
        <Link href={lesson.isLocked ? "#" : `/program/${lesson.id}`} className={`block group ${lesson.isLocked ? 'cursor-not-allowed' : ''}`}>
            <div className={`
                relative flex items-center gap-6 p-4 rounded-2xl border transition-all duration-300
                ${lesson.isLocked 
                    ? 'bg-white/[0.02] border-white/5 opacity-50' 
                    : 'bg-[#121212] border-white/5 hover:border-white/20 hover:bg-[#181818] hover:shadow-2xl hover:-translate-y-1'
                }
            `}>
                {/* Thumbnail */}
                <div className="relative w-36 h-24 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/5">
                    {lesson.thumbnailUrl ? (
                        <img src={lesson.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="absolute inset-0 bg-white/5" />
                    )}
                    
                    {!lesson.isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                <Play size={18} fill="currentColor" className="ml-0.5" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Index */}
                <div className="w-10 text-center text-sm font-bold text-white/10 group-hover:text-white/30 transition-colors">
                    {String(index).padStart(2, '0')}
                </div>

                {/* Info */}
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-white group-hover:text-white transition-colors">
                            {lesson.title}
                        </h3>
                        {lesson.completed && (
                            <div className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 uppercase tracking-wider">
                                Пройдено
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-medium text-white/40">
                        <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatDuration(lesson.duration)}
                        </span>
                        {lesson.isLocked && (
                            <span className="flex items-center gap-1.5 text-white/30">
                                <Lock size={12} />
                                {lesson.unlockDate ? `Откроется ${formattedUnlockDate}` : "Скоро"}
                            </span>
                        )}
                        {!lesson.isLocked && !lesson.completed && (
                            <span className="flex items-center gap-1.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <BookOpen size={12} />
                                Начать
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Arrow */}
                {!lesson.isLocked && (
                    <div className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-white/10 transition-all">
                        <ChevronRight size={18} />
                    </div>
                )}

            </div>
        </Link>
    )
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}