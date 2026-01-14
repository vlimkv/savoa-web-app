"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  User, Play, Sparkles, Wind, Heart, Activity, Moon, Sun,
  ArrowUpRight, Clock, PlayCircle
} from "lucide-react";
import ProfileModal from "@/components/ProfileModal";
import MeditationPlayer, { MeditationItem } from "@/components/MeditationPlayer";
import { useAuthStore } from "@/store/auth.store";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProgressSync } from "@/hooks/useProgressSync";

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

// Эти данные соответствуют Swift MeditationItem
const MEDITATIONS: MeditationItem[] = [
  {
    id: "1",
    title: "Вечерняя",
    subtitle: "Отпустить день",
    duration: "6 мин",
    durationSec: 360,
    category: "Sleep",
    icon: Moon,
    audioUrl: "/sounds/med_03.mp3",
    benefits: ["Замедление", "Расслабление", "Подготовка ко сну"],
    description:
      "После насыщенного дня мысли продолжают крутиться, тело остаётся в напряжении. Эта практика создана для мягкого перехода из активности в покой.",
  },
  {
    id: "2",
    title: "Принятие тела",
    subtitle: "Контакт и опора",
    duration: "5 мин",
    durationSec: 300,
    category: "Love",
    icon: Heart,
    audioUrl: "/sounds/med_02.mp3",
    benefits: ["Контакт с телом", "Принятие", "Безопасность"],
    description:
      "Мы часто живём «в голове». Эта практика помогает вернуться в телесные ощущения и почувствовать опору внутри себя.",
  },
  {
    id: "3",
    title: "Утренняя",
    subtitle: "Ясность",
    duration: "3 мин",
    durationSec: 180,
    category: "Start",
    icon: Sun,
    audioUrl: "/sounds/med_01.mp3",
    benefits: ["Мягкое пробуждение", "Ясность", "Фокус"],
    description: "Начните день без спешки — с ясностью, вниманием и ощущением внутренней опоры.",
  },
];

// --- COMPONENTS (MOBILE) ---
function QuickAction({ icon: Icon, title, color, href }: any) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-2 min-w-[85px] p-3 rounded-2xl bg-white/5 border border-white/5 active:scale-95 transition-all hover:bg-white/10 hover:border-white/10"
    >
      <div
        className={`w-11 h-11 rounded-full ${color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
      >
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-semibold text-white/80 group-hover:text-white transition-colors">
        {title}
      </span>
    </Link>
  );
}

function gradientStyle(stops?: string[] | null) {
  const arr = (stops ?? []).filter(Boolean);
  if (arr.length < 2) {
    return { backgroundImage: "linear-gradient(135deg, #404040, #0a0a0a)" };
  }
  return { backgroundImage: `linear-gradient(135deg, ${arr.join(", ")})` };
}

function MobileTheoryCard({ lesson }: { lesson: TheoryLessonDTO }) {
  return (
    <a
      href={lesson.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative min-w-[160px] h-[120px] rounded-2xl overflow-hidden active:scale-95 transition-transform"
    >
      <div className="absolute inset-0" style={gradientStyle(lesson.thumbnail_gradient)} />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative z-10 p-3.5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white/90">
            {lesson.duration_label ?? ""}
          </div>
          <PlayCircle className="text-white/90 drop-shadow-md" size={24} fill="rgba(0,0,0,0.2)" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white leading-tight mb-0.5 drop-shadow-sm">
            {lesson.title}
          </h4>
          <p className="text-[10px] font-medium text-white/70 truncate">{lesson.subtitle ?? ""}</p>
        </div>
      </div>
    </a>
  );
}

function MeditationCard({ item, onClick }: { item: MeditationItem; onClick: () => void }) {
  const Icon = item.icon;
  const color =
    item.category === "Sleep"
      ? "text-indigo-400 bg-indigo-500/20"
      : item.category === "Love"
      ? "text-pink-400 bg-pink-500/20"
      : "text-amber-400 bg-amber-500/20";

  return (
    <div
      onClick={onClick}
      className="group min-w-[160px] h-[150px] relative rounded-3xl bg-neutral-900 border border-white/10 overflow-hidden p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-white/20 hover:bg-neutral-800 active:scale-95"
    >
      <div
        className={`absolute -top-10 -left-10 w-24 h-24 blur-2xl rounded-full pointer-events-none group-hover:opacity-100 transition-opacity ${
          item.category === "Sleep"
            ? "bg-indigo-500/20"
            : item.category === "Love"
            ? "bg-pink-500/20"
            : "bg-amber-500/20"
        }`}
      />
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} group-hover:bg-opacity-30 transition-all`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="relative z-10">
        <h4 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-white/90">{item.title}</h4>
        <p className="text-xs text-white/40 font-bold group-hover:text-white/60 transition-colors">{item.duration}</p>
      </div>
    </div>
  );
}

// --- COMPONENTS (DESKTOP/TABLET PREMIUM) ---
function DesktopToolCard({ title, subtitle, icon: Icon, href, gradient }: any) {
  return (
    <Link
      href={href}
      className="group relative flex items-center justify-between p-5 rounded-[20px] bg-[#121212] border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${gradient}`} />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <Icon size={22} className="text-white/80 group-hover:text-white" />
        </div>
        <div>
          <h3 className="text-base font-medium text-white mb-0.5 group-hover:translate-x-1 transition-transform">{title}</h3>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider group-hover:text-white/60">{subtitle}</p>
        </div>
      </div>
      <div className="relative z-10 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 group-hover:text-white group-hover:border-white/40 group-hover:rotate-45 transition-all duration-500">
        <ArrowUpRight size={16} />
      </div>
    </Link>
  );
}

function DesktopTheoryCard({ lesson }: { lesson: TheoryLessonDTO }) {
  return (
    <a
      href={lesson.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative h-[140px] rounded-[24px] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
    >
      <div className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500" style={gradientStyle(lesson.thumbnail_gradient)} />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white">
            {lesson.duration_label ?? ""}
          </span>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white group-hover:text-black text-white transition-all duration-300">
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
        <div>
          <h4 className="text-lg font-bold text-white mb-1 leading-tight">{lesson.title}</h4>
          <p className="text-xs text-white/80 font-medium">{lesson.subtitle ?? ""}</p>
        </div>
      </div>
    </a>
  );
}

function DesktopMeditationRow({ item, onClick }: { item: MeditationItem; onClick: () => void }) {
  const color =
    item.category === "Sleep"
      ? "text-indigo-400 bg-indigo-500/10"
      : item.category === "Love"
      ? "text-pink-400 bg-pink-500/10"
      : "text-amber-400 bg-amber-500/10";

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
    >
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color} group-hover:bg-opacity-20 transition-all`}>
          <Play size={12} fill="currentColor" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">{item.title}</h4>
          <p className="text-[10px] text-white/40">Аудио • {item.duration}</p>
        </div>
      </div>
      <button className="text-[10px] font-bold text-white/30 px-3 py-1.5 rounded-full border border-white/5 group-hover:border-white/20 group-hover:text-white transition-all">
        PLAY
      </button>
    </div>
  );
}

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
    duration: number; // seconds
    week_id: string;
    image_id?: string | null;
    thumbnail_url?: string | null;
    is_locked?: boolean | null;
    unlock_date?: string | null;
  }>;
};

type LessonLite = {
  id: string;
  title: string;
  duration: number; // seconds
  isLocked: boolean;
  unlockDate?: string | null;
};

type CourseLite = {
  lessons: LessonLite[]; // уже по порядку
};

type ProgressSummary = { completedLessons: number; totalLessons: number };

async function fetchCourseLite(token?: string | null): Promise<CourseLite> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.savoa.kz/api";

  const res = await fetch(`${API_BASE}/course/weeks`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(raw || `HTTP ${res.status}`);
  }

  const weeks = (await res.json()) as WeekResponse[];

  const lessons: LessonLite[] = weeks
    .slice()
    .sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999))
    .flatMap((w) =>
      (w.lessons ?? [])
        .slice()
        .sort((a, b) => {
          const d = (a.day_order ?? 0) - (b.day_order ?? 0);
          if (d !== 0) return d;
          return String(a.id).localeCompare(String(b.id));
        })
        .map((l) => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            isLocked: Boolean(l.is_locked),
            unlockDate: l.unlock_date ?? null,
        }))
    );

  return { lessons };
}

async function fetchProgressSummary(token: string): Promise<ProgressSummary> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.savoa.kz/api";

  const res = await fetch(`${API_BASE}/progress`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(raw || `HTTP ${res.status}`);
  }

  return (await res.json()) as ProgressSummary;
}

// --- MAIN PAGE ---
export default function HomePage() {
  const router = useRouter();
  const { map, ready, pullAndMerge } = useProgressSync();

  const [courseLite, setCourseLite] = useState<CourseLite | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [showProfile, setShowProfile] = useState(false);
  const displayName = user?.login || "Анна";

  const [theoryLessons, setTheoryLessons] = useState<TheoryLessonDTO[]>([]);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [theoryErr, setTheoryErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCourse() {
        if (!token) return;
        try {
        const data = await fetchCourseLite(token);
        if (!cancelled) setCourseLite(data);
        } catch (e) {
        if (!cancelled) setCourseLite({ lessons: [] });
        }
    }

    loadCourse();
    return () => {
        cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    pullAndMerge();
  }, [token, pullAndMerge]);

  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
        if (!token) return;
        try {
        const s = await fetchProgressSummary(token);
        if (!cancelled) setProgressSummary(s);
        } catch {
        if (!cancelled) setProgressSummary(null);
        }
    }
    loadSummary();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;

      setTheoryLoading(true);
      setTheoryErr(null);

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.savoa.kz/api";

        const res = await fetch(`${API_BASE}/theory-lessons`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const raw = await res.text().catch(() => "");
          throw new Error(raw || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as TheoryLessonDTO[];

        const clean = (data || [])
          .filter((x) => x?.is_active !== false)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

        if (!cancelled) setTheoryLessons(clean);
      } catch (e: any) {
        if (!cancelled) setTheoryErr("Не удалось загрузить теорию");
      } finally {
        if (!cancelled) setTheoryLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const [selectedMeditation, setSelectedMeditation] = useState<MeditationItem | null>(null);

  const hero = useMemo(() => {
    const now = Date.now();

    const all = (courseLite?.lessons ?? [])
      .filter((l) => !l.isLocked)
      .filter((l) => !l.unlockDate || new Date(l.unlockDate).getTime() <= now);

    if (!all.length) return null;

    const completedCount = all.filter((l) => map[l.id]?.completed).length;
    const localPercent = all.length
        ? Math.round((completedCount / all.length) * 100)
        : 0;
    const hasAnyProgress = completedCount > 0;

    const next = all.find((l) => !map[l.id]?.completed) ?? all[all.length - 1];
    const first = all[0];

    const target = hasAnyProgress ? next : first;
    const minutes = Math.max(1, Math.round((target.duration ?? 0) / 60));

    const idx = all.findIndex((l) => l.id === target.id);
    const dayNumber = idx >= 0 ? idx + 1 : 1;

    const percent =
        progressSummary && progressSummary.totalLessons > 0
            ? Math.round((progressSummary.completedLessons / progressSummary.totalLessons) * 100)
            : localPercent;


    return {
        label: hasAnyProgress ? "Продолжить" : "Начать урок",
        lessonId: target.id,
        minutes,
        title: target.title,
        percent,
        dayNumber,
    };
  }, [courseLite, map, progressSummary]);

  const stats = useMemo(() => {
    const now = Date.now();

    const available = (courseLite?.lessons ?? [])
        .filter((l) => !l.isLocked)
        .filter((l) => !l.unlockDate || new Date(l.unlockDate).getTime() <= now);

    const completed = available.filter((l) => map[l.id]?.completed);

    const completedLessons = completed.length;

    const totalMinutes = Math.round(
        completed.reduce((sum, l) => sum + (l.duration ?? 0), 0) / 60
    );

    return { completedLessons, totalMinutes };
  }, [courseLite, map]);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* GLOBAL MODALS */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        completedLessons={stats.completedLessons}
        totalMinutes={stats.totalMinutes}
      />

      <AnimatePresence>
        {selectedMeditation && (
          <MeditationPlayer item={selectedMeditation} onClose={() => setSelectedMeditation(null)} />
        )}
      </AnimatePresence>

      {/* ================================================================================= */}
      {/* 💻 DESKTOP (lg+)                                                                   */}
      {/* ================================================================================= */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden bg-[#050505] p-6 gap-6">
        {/* LEFT COLUMN */}
        <div className="relative w-[50%] h-full rounded-[40px] overflow-hidden bg-neutral-900 border border-white/5 group transition-all hover:border-white/10">
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute inset-0 bg-[url('/images/seza_hero.jpg')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[10s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <div className="absolute inset-0 p-12 flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white/80 uppercase tracking-widest">
                  Программа
                </div>
                <div className="px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-white/60 uppercase tracking-widest">
                    День {hero?.dayNumber ?? "—"}
                </div>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-medium">{displayName}</span>
                <User size={16} className="text-white/60" />
              </button>
            </div>

            <div className="max-w-xl">
              <h1 className="text-7xl font-bold tracking-tighter text-white mb-4 leading-[0.9]">RE:STORE</h1>
              <p className="text-lg text-white/70 font-light mb-8 leading-relaxed">
                Восстановление естественных ритмов тела через осознанное движение и дыхание.
              </p>
              <div className="flex items-center gap-6">
                <button
                    onClick={() => hero?.lessonId && router.push(`/program/${hero.lessonId}`)}
                    disabled={!hero?.lessonId || !ready}
                    className="h-16 px-10 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest flex items-center gap-3 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Play size={20} fill="currentColor" />
                    {hero?.label ?? "Начать урок"}
                </button>

                <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                    <Clock size={16} />
                    <span>{hero ? `${hero.minutes} мин` : "—"}</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar pr-2">
          <div className="flex items-center justify-between min-h-[60px]">
            <div>
              <h2 className="text-2xl font-light text-white/90">
                Добрый вечер, <span className="font-semibold text-white">{displayName}</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 font-mono">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DesktopToolCard title="Послание" subtitle="Daily" icon={Sparkles} href="/affirmation" gradient="from-purple-500/20 to-pink-500/20" />
            <DesktopToolCard title="Дыхание" subtitle="Practice" icon={Wind} href="/breath" gradient="from-cyan-500/20 to-blue-500/20" />
            <DesktopToolCard title="Журнал" subtitle="Gratitude" icon={Heart} href="/gratitude" gradient="from-pink-500/20 to-orange-500/20" />
            <DesktopToolCard title="Трекер" subtitle="State" icon={Activity} href="/tracker" gradient="from-green-500/20 to-emerald-500/20" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Теория</h3>
              <Link href="/theory" className="text-[10px] font-bold text-white/30 hover:text-white transition-colors">
                ВСЕ
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {theoryLoading ? (
                <div className="text-xs text-white/40">Загрузка...</div>
              ) : theoryErr ? (
                <div className="text-xs text-red-400/80">{theoryErr}</div>
              ) : (
                theoryLessons.slice(0, 2).map((lesson) => <DesktopTheoryCard key={lesson.id} lesson={lesson} />)
              )}
            </div>
          </div>

          <div className="bg-[#121212] border border-white/5 rounded-[24px] p-5 flex-1 min-h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Медитации</h3>
            </div>

            <div className="flex-1 space-y-1">
              {MEDITATIONS.map((item) => (
                <DesktopMeditationRow key={item.id} item={item} onClick={() => setSelectedMeditation(item)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================================= */}
      {/* 📲 iPad / TABLET (md .. < lg)                                                     */}
      {/* ================================================================================= */}
      <div className="hidden md:block lg:hidden bg-[#050505] min-h-screen p-6">
        {/* top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-white/90">
              Добрый вечер, <span className="font-semibold text-white">{displayName}</span>
            </h1>
            <p className="text-xs text-white/40 font-mono mt-1">{new Date().toLocaleDateString()}</p>
          </div>

          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors"
          >
            <span className="text-sm font-medium">{displayName}</span>
            <User size={16} className="text-white/70" />
          </button>
        </div>

        {/* hero */}
        <div className="relative w-full h-[320px] rounded-[32px] overflow-hidden bg-neutral-900 border border-white/5 mb-6">
          <div className="absolute inset-0 bg-[url('/images/seza_hero.jpg')] bg-cover bg-[position:center_40%] opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative z-10 p-8 h-full flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-widest">
                Программа
              </div>
              <div className="px-3 py-1.5 rounded-full bg-black/20 border border-white/10 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                День {hero?.dayNumber ?? "—"}
              </div>
            </div>

            <h2 className="text-4xl font-bold tracking-tight mb-2">RE:STORE</h2>
            <p className="text-sm text-white/70 font-light max-w-2xl mb-5">
              Восстановление естественных ритмов тела через осознанное движение и дыхание.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => hero?.lessonId && router.push(`/program/${hero.lessonId}`)}
                disabled={!hero?.lessonId || !ready}
                className="h-12 px-6 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                <Play size={16} fill="currentColor" />
                {hero?.label ?? "Начать урок"}
              </button>

              <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <Clock size={16} />
                <span>{hero ? `${hero.minutes} мин` : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* tools */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DesktopToolCard title="Послание" subtitle="Daily" icon={Sparkles} href="/affirmation" gradient="from-purple-500/20 to-pink-500/20" />
          <DesktopToolCard title="Дыхание" subtitle="Practice" icon={Wind} href="/breath" gradient="from-cyan-500/20 to-blue-500/20" />
          <DesktopToolCard title="Журнал" subtitle="Gratitude" icon={Heart} href="/gratitude" gradient="from-pink-500/20 to-orange-500/20" />
          <DesktopToolCard title="Трекер" subtitle="State" icon={Activity} href="/tracker" gradient="from-green-500/20 to-emerald-500/20" />
        </div>

        {/* content two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Theory */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-[28px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Теория</h3>
              <Link href="/theory" className="text-[10px] font-bold text-white/30 hover:text-white transition-colors">
                ВСЕ
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {theoryLoading ? (
                <div className="text-xs text-white/40">Загрузка...</div>
              ) : theoryErr ? (
                <div className="text-xs text-red-400/80">{theoryErr}</div>
              ) : (
                theoryLessons.slice(0, 3).map((lesson) => <DesktopTheoryCard key={lesson.id} lesson={lesson} />)
              )}
            </div>
          </div>

          {/* Meditations */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-[28px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Медитации</h3>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full text-white/50">
                {MEDITATIONS.length}
              </span>
            </div>

            <div className="space-y-1">
              {MEDITATIONS.map((item) => (
                <DesktopMeditationRow key={item.id} item={item} onClick={() => setSelectedMeditation(item)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================================= */}
      {/* 📱 MOBILE (< md)                                                                  */}
      {/* ================================================================================= */}
      <div className="md:hidden pb-24">
        <div className="flex items-center justify-between p-5 pt-8">
          <h1 className="text-xl font-bold">Привет, {displayName}</h1>
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <User size={16} className="text-white/80" />
          </button>
        </div>

        <div className="space-y-8">
          <div className="px-5">
            <div className="relative h-[260px] w-full rounded-3xl overflow-hidden bg-gray-800 bg-[url('/images/seza_hero.jpg')] bg-cover bg-[position:center_40%] shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 p-5 z-20 w-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-bold">
                    {hero?.percent != null ? `${hero.percent}%` : "—"}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-1">RE:STORE</h2>
                <p className="text-xs text-white/70 mb-4 font-medium">Восстановление через движение</p>
                <button
                    onClick={() => hero?.lessonId && router.push(`/program/${hero.lessonId}`)}
                    disabled={!hero?.lessonId || !ready}
                    className="w-full bg-white text-black py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                    <Play size={14} fill="currentColor" />
                    {hero?.label ?? "Начать"}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-5 pb-2 scrollbar-hide flex gap-3">
            <QuickAction icon={Sparkles} title="Послание" color="text-purple-400 bg-purple-500/20" href="/affirmation" />
            <QuickAction icon={Wind} title="Дыхание" color="text-cyan-400 bg-cyan-500/20" href="/breath" />
            <QuickAction icon={Heart} title="Благодарность" color="text-pink-400 bg-pink-500/20" href="/gratitude" />
            <QuickAction icon={Activity} title="Состояние" color="text-green-400 bg-green-500/20" href="/tracker" />
          </div>

          <div className="px-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Теория</h3>
              <Link href="/theory" className="text-xs font-bold text-white/50 bg-white/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                Все
              </Link>
            </div>
            <div className="overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide flex gap-3">
              {theoryLoading ? (
                <div className="text-xs text-white/40 px-5">Загрузка...</div>
              ) : theoryErr ? (
                <div className="text-xs text-red-400/80 px-5">{theoryErr}</div>
              ) : (
                theoryLessons.map((lesson) => <MobileTheoryCard key={lesson.id} lesson={lesson} />)
              )}
            </div>
          </div>

          <div className="px-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Медитации</h3>
              <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full text-white/50">3</span>
            </div>
            <div className="overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide flex gap-4">
              {MEDITATIONS.map((item) => (
                <MeditationCard key={item.id} item={item} onClick={() => setSelectedMeditation(item)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
