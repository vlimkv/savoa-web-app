"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, PlayCircle, AlertCircle, Play } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---

type TheoryLessonDTO = {
  id: string;
  title: string;
  subtitle?: string | null;
  duration_label?: string | null;
  youtube_url: string;
  thumbnail_gradient?: string[] | null;
  category?: string | null;
  order_index?: number | null;
  is_active?: boolean | null;
};

// --- HELPERS ---

function gradientStyle(stops?: string[] | null) {
  const arr = (stops ?? []).filter(Boolean);
  if (arr.length < 2) {
    return { backgroundImage: "linear-gradient(135deg, #2d3748, #1a202c)" };
  }
  return { backgroundImage: `linear-gradient(135deg, ${arr.join(", ")})` };
}

// --- COMPONENTS ---

function TheoryCard({ lesson, index }: { lesson: TheoryLessonDTO; index: number }) {
  return (
    <motion.a 
      href={lesson.youtube_url} 
      target="_blank" 
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative block w-full rounded-[20px] overflow-hidden active:scale-95 transition-all duration-500
        /* MOBILE STYLES (Keep as is) */
        h-[140px]
        
        /* DESKTOP STYLES (Premium) */
        md:h-[240px] md:hover:scale-[1.03] md:hover:-translate-y-1 md:hover:shadow-2xl md:hover:shadow-purple-500/20
      "
    >
        {/* Dynamic Gradient Background */}
        <div 
            className="absolute inset-0 transition-transform duration-700 md:group-hover:scale-110"
            style={gradientStyle(lesson.thumbnail_gradient)} 
        />
        
        {/* Dark Overlay & Noise Texture */}
        <div className="absolute inset-0 bg-black/20 md:bg-black/10 transition-colors duration-500 md:group-hover:bg-black/30" />
        
        {/* Content Container */}
        <div className="relative z-10 p-[14px] md:p-6 flex flex-col h-full justify-between">
            
            {/* Top Row */}
            <div className="flex items-center justify-between">
                <div className="bg-black/30 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold text-white/90 backdrop-blur-md border border-white/5 shadow-sm">
                    {lesson.duration_label || "Видео"}
                </div>
                
                {/* Play Icon (Adaptive) */}
                <div className="
                    w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm text-white transition-all duration-300
                    /* Desktop Hover Effect */
                    md:w-12 md:h-12 md:bg-white/20 md:group-hover:bg-white md:group-hover:text-black md:group-hover:scale-110
                ">
                    <Play className="w-3.5 h-3.5 md:w-5 md:h-5 ml-0.5 md:ml-1 fill-current" />
                </div>
            </div>

            {/* Bottom Row */}
            <div className="md:mb-2">
                <h4 className="text-[16px] md:text-[22px] font-bold text-white leading-tight mb-[2px] md:mb-2 shadow-sm">
                    {lesson.title}
                </h4>
                <p className="text-[11px] md:text-[14px] font-medium text-white/70 line-clamp-1 md:line-clamp-2 md:text-white/60 md:group-hover:text-white/90 transition-colors">
                    {lesson.subtitle}
                </p>
            </div>
        </div>
    </motion.a>
  );
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px] md:gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-[140px] md:h-[240px] rounded-[20px] bg-white/5 animate-pulse border border-white/5" />
            ))}
        </div>
    )
}

// --- MAIN PAGE ---

export default function TheoryPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  
  const [lessons, setLessons] = useState<TheoryLessonDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
          setLoading(false); 
          return;
      }

      setLoading(true);
      setError(null);

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://77.240.39.104/api";
        const res = await fetch(`${API_BASE}/theory-lessons`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Не удалось загрузить данные");

        const data = (await res.json()) as TheoryLessonDTO[];
        
        // Filter inactive & Sort by index
        const clean = (data || [])
          .filter((x) => x?.is_active !== false)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

        if (!cancelled) setLessons(clean);
      } catch (e) {
        if (!cancelled) setError("Ошибка загрузки уроков.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      
      {/* Background Ambience (Desktop Only) */}
      <div className="hidden md:block fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 md:bg-transparent md:border-none md:static md:pt-10">
        <div className="max-w-7xl mx-auto px-4 py-3 md:px-8 flex items-center justify-center md:justify-start relative">
          <button 
            onClick={() => router.back()}
            className="absolute left-4 md:left-8 md:relative md:mr-6 w-10 h-10 flex items-center justify-center -ml-2 text-white/70 active:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
          </button>
          
          <div className="text-center md:text-left">
            <h1 className="text-[17px] md:text-4xl font-semibold md:font-bold text-white tracking-tight">
                Теория
            </h1>
            <p className="hidden md:block text-white/40 text-sm mt-2 font-medium tracking-wide">
                Глубокое понимание вашего тела и процессов
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-20 relative z-10">
        
        {loading ? (
            <LoadingSkeleton />
        ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle size={24} className="text-red-400" />
                </div>
                <p className="text-white/60 mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full active:scale-95 transition-transform hover:bg-white/90"
                >
                    Попробовать снова
                </button>
            </div>
        ) : lessons.length === 0 ? (
            <div className="text-center py-32 text-white/30 font-medium text-lg">
                Уроков пока нет
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px] md:gap-6 lg:gap-8">
                {lessons.map((lesson, index) => (
                    <TheoryCard key={lesson.id} lesson={lesson} index={index} />
                ))}
            </div>
        )}

      </div>
    </main>
  );
}