"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Check, Activity, Bolt, AlertCircle, Droplet, 
  Circle, Moon, Star, ArrowDownCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

// --- HOOK: useLocalStorage ---
type SetAction<T> = T | ((prev: T) => T);

function useLocalStorage<T>(key: string, initialValue: T) {
  const isClient = typeof window !== "undefined";
  const initialRef = useRef<T>(initialValue);
  const [value, setValueState] = useState<T>(() => initialRef.current);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValueState(JSON.parse(raw) as T);
      } else {
        window.localStorage.setItem(key, JSON.stringify(initialRef.current));
      }
    } catch (e) {
      console.error("[useLocalStorage] read error:", e);
    } finally {
      setReady(true);
    }
  }, [key, isClient]);

  const setValue = useCallback(
    (action: SetAction<T>) => {
      setValueState((prev) => {
        const next = typeof action === "function" ? (action as (p: T) => T)(prev) : action;
        if (isClient) {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch (e) {
            console.error("[useLocalStorage] write error:", e);
          }
        }
        return next;
      });
    },
    [key, isClient]
  );

  return [value, setValue, ready] as const;
}

// --- TYPES & CONSTANTS ---
type Mood = "great" | "good" | "neutral" | "low" | "difficult";
type Symptom = "discomfort" | "tension" | "heaviness" | "weakness" | "pain" | "leakage" | "bloating" | "fatigue";

interface StateEntry {
  id: string;
  date: string;
  mood: Mood;
  energy: number;
  symptoms: Symptom[];
  notes: string;
}

const MOODS: { key: Mood; emoji: string; title: string; gradient: string; border: string }[] = [
  { key: "great", emoji: "😊", title: "Отлично", gradient: "from-emerald-400/20 to-teal-500/20", border: "border-emerald-500/50" },
  { key: "good", emoji: "🙂", title: "Хорошо", gradient: "from-cyan-400/20 to-blue-500/20", border: "border-cyan-500/50" },
  { key: "neutral", emoji: "😐", title: "Нормально", gradient: "from-slate-300/20 to-slate-400/20", border: "border-slate-400/50" },
  { key: "low", emoji: "😔", title: "Так себе", gradient: "from-orange-400/20 to-amber-500/20", border: "border-orange-500/50" },
  { key: "difficult", emoji: "😢", title: "Тяжело", gradient: "from-red-500/20 to-rose-600/20", border: "border-red-500/50" },
];

const SYMPTOMS: { key: Symptom; title: string; icon: any }[] = [
  { key: "discomfort", title: "Дискомфорт", icon: AlertCircle },
  { key: "tension", title: "Напряжение", icon: Bolt },
  { key: "heaviness", title: "Тяжесть", icon: ArrowDownCircle },
  { key: "weakness", title: "Слабость", icon: Activity },
  { key: "pain", title: "Боль", icon: Star },
  { key: "leakage", title: "Подтекание", icon: Droplet },
  { key: "bloating", title: "Вздутие", icon: Circle },
  { key: "fatigue", title: "Усталость", icon: Moon },
];

export default function StateTrackerPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [entries, setEntries, isStorageReady] = useLocalStorage<StateEntry[]>("state_entries", []);
  
  const [mood, setMood] = useState<Mood>("neutral");
  const [energy, setEnergy] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!isStorageReady) return;
    const todayEntry = entries.find(e => isSameDay(parseISO(e.date), new Date()));
    
    if (todayEntry) {
        setMood(todayEntry.mood);
        setEnergy(todayEntry.energy);
        setSelectedSymptoms(todayEntry.symptoms);
        setNotes(todayEntry.notes);
    }
  }, [isStorageReady, entries]);

  // --- HANDLERS ---
  const handleSave = () => {
    const today = new Date();
    const existingIndex = entries.findIndex(e => isSameDay(parseISO(e.date), today));
    
    let newEntries = [...entries];
    
    const entryData: StateEntry = {
        id: existingIndex >= 0 ? entries[existingIndex].id : crypto.randomUUID(),
        date: today.toISOString(),
        mood,
        energy,
        symptoms: selectedSymptoms,
        notes
    };

    if (existingIndex >= 0) {
        newEntries[existingIndex] = entryData;
    } else {
        newEntries = [entryData, ...newEntries];
    }

    newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(newEntries);

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  const toggleSymptom = (s: Symptom) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter(i => i !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const historyEntries = useMemo(() => entries, [entries]);


  const VISIBLE_COUNT = 4;
  const displayedHistory = showAllHistory ? historyEntries : historyEntries.slice(0, VISIBLE_COUNT);
  const hasMoreHistory = historyEntries.length > VISIBLE_COUNT;

  if (!isStorageReady) return <div className="min-h-screen bg-black" />;

  return (
    // FIX: На мобилке обычный скролл страницы, на десктопе фиксированная высота
    <div className="min-h-screen w-full bg-[#050505] font-sans text-white pb-12 lg:pb-0 lg:h-screen lg:overflow-hidden flex flex-col">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
      </div>

      {/* Main Layout Container */}
      <div className="relative z-10 w-full flex-1 flex flex-col lg:flex-row">

        {/* ================= LEFT COLUMN: FORM ================= */}
        <div className="w-full lg:w-[60%] xl:w-[55%] lg:h-full lg:border-r lg:border-white/5 lg:bg-[#050505]/50 lg:backdrop-blur-sm flex flex-col relative z-20">
            
            {/* Header */}
            <header className="p-6 flex items-center gap-4 shrink-0">
                <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Трекер состояния</h1>
                    <p className="text-xs text-white/40 capitalize font-medium tracking-wide">
                        {format(new Date(), "d MMMM, EEEE", { locale: ru })}
                    </p>
                </div>
            </header>

            {/* Scrollable Form Area */}
            <div className="w-full lg:flex-1 lg:overflow-y-auto custom-scrollbar px-6 pb-8">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* MOOD & ENERGY GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* MOOD CARD (Optimized Animation) */}
                        <section className="bg-[#0f0f0f] border border-white/5 p-5 rounded-3xl relative overflow-hidden">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Настроение</h3>
                            <div className="flex justify-between items-center">
                                {MOODS.map((m) => {
                                    const isActive = mood === m.key;
                                    return (
                                        <motion.button
                                            key={m.key}
                                            onClick={() => setMood(m.key)}
                                            // Анимация через Framer Motion работает плавнее на GPU
                                            whileTap={{ scale: 0.9 }}
                                            animate={{ 
                                                scale: isActive ? 1.15 : 1, 
                                                opacity: isActive ? 1 : 0.5 
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="relative flex flex-col items-center gap-2 outline-none touch-manipulation" // touch-manipulation для быстрого отклика
                                        >
                                            <div className="relative">
                                                {/* Active Background Glow */}
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.gradient} blur-sm`}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                                
                                                {/* Button Body */}
                                                <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border transition-colors duration-200 ${isActive ? `border-transparent bg-white/10` : "bg-white/5 border-transparent"}`}>
                                                    {m.emoji}
                                                </div>
                                            </div>

                                            <span className={`text-[10px] font-bold transition-colors duration-200 ${isActive ? "text-white" : "text-transparent"}`}>
                                                {m.title}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </section>

                        {/* ENERGY CARD */}
                        <section className="bg-[#0f0f0f] border border-white/5 p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Энергия</h3>
                                <span className={`text-sm font-bold ${energy < 3 ? "text-red-400" : energy > 4 ? "text-emerald-400" : "text-white"}`}>{energy}/5</span>
                            </div>
                            <div className="flex gap-2 h-12">
                                {[1, 2, 3, 4, 5].map((level) => {
                                    const isActive = level <= energy;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setEnergy(level)}
                                            className="group relative flex-1 h-full rounded-lg overflow-hidden bg-white/5 active:scale-95 transition-all duration-200 touch-manipulation"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-t transition-transform duration-300 ease-out ${level <= 2 ? "from-red-500 to-orange-500" : level === 3 ? "from-yellow-500 to-amber-500" : "from-emerald-500 to-cyan-500"} ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"}`} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Bolt size={14} className={`transition-colors duration-200 ${isActive ? "text-black fill-black/20" : "text-white/20"}`} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </section>
                    </div>

                    {/* SYMPTOMS */}
                    <section className="bg-[#0f0f0f] border border-white/5 p-5 rounded-3xl">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Физические ощущения</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {SYMPTOMS.map((s) => {
                                const isSelected = selectedSymptoms.includes(s.key);
                                return (
                                    <button
                                        key={s.key}
                                        onClick={() => toggleSymptom(s.key)}
                                        className={`
                                            group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-200 active:scale-95 touch-manipulation
                                            ${isSelected 
                                                ? "bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                                                : "bg-white/5 border-transparent hover:bg-white/10"
                                            }
                                        `}
                                    >
                                        <s.icon size={18} className={`transition-colors duration-200 ${isSelected ? "text-white" : "text-white/40 group-hover:text-white/70"}`} />
                                        <span className={`text-[11px] font-medium transition-colors duration-200 ${isSelected ? "text-white" : "text-white/40 group-hover:text-white/70"}`}>{s.title}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* NOTES & SAVE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-32">
                         <div className="md:col-span-2 bg-[#0f0f0f] border border-white/5 focus-within:border-white/20 rounded-3xl p-1 transition-colors min-h-[120px] md:min-h-0">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Заметки о дне..."
                                className="w-full h-full bg-transparent p-5 text-sm text-white placeholder:text-white/20 focus:outline-none resize-none"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            className="group relative md:col-span-1 h-[80px] md:h-auto rounded-3xl overflow-hidden active:scale-[0.98] transition-transform shadow-lg touch-manipulation"
                        >
                            <div className="absolute inset-0 bg-white" />
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative h-full flex flex-col items-center justify-center text-black">
                                <AnimatePresence mode="wait">
                                    {isSuccess ? (
                                        <motion.div 
                                            key="success"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            className="flex flex-col items-center"
                                        >
                                            <Check size={28} />
                                            <span className="text-xs font-bold uppercase mt-1">Готово</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            key="save"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <span className="font-bold text-sm tracking-widest uppercase">Сохранить</span>
                                            <span className="text-[10px] opacity-60">Зафиксировать</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>

        {/* ================= RIGHT COLUMN: HISTORY ================= */}
        <div className="w-full lg:flex-1 lg:h-full lg:overflow-hidden flex flex-col bg-black/20 border-t lg:border-t-0 relative z-10">
            
            <div className="p-6 pb-4 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-white">История</h3>
                <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/50">{entries.length} записей</div>
            </div>

            <div className="w-full lg:flex-1 lg:overflow-y-auto custom-scrollbar p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {displayedHistory.length > 0 ? (
                            displayedHistory.map((entry, i) => (
                                <HistoryCard key={entry.id} entry={entry} index={i} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-white/20">
                                <Activity size={32} />
                                <p>История наблюдений пуста</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {hasMoreHistory && (
                    <div className="mt-8 flex justify-center pb-8">
                        <button 
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="group flex flex-col items-center gap-2 text-white/30 hover:text-white transition-colors"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {showAllHistory ? "Свернуть" : "Показать больше"}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                                {showAllHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function HistoryCard({ entry, index }: { entry: StateEntry, index: number }) {
    const moodConfig = MOODS.find(m => m.key === entry.mood);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="p-5 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{moodConfig?.emoji}</div>
                    <div>
                        <div className="text-sm font-bold text-white capitalize">{format(parseISO(entry.date), "d MMM, EE", { locale: ru })}</div>
                        <div className={`text-xs font-medium ${moodConfig?.border ? moodConfig.border.replace("border-", "text-") : "text-white/50"}`}>
                            {moodConfig?.title}
                        </div>
                    </div>
                </div>
                
                {/* Energy Dots */}
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(l => (
                        <div key={l} className={`w-1.5 h-1.5 rounded-full ${l <= entry.energy ? "bg-white" : "bg-white/10"}`} />
                    ))}
                </div>
            </div>

            {/* Symptoms & Notes */}
            <div className="space-y-3">
                {entry.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {entry.symptoms.map(sKey => {
                            const s = SYMPTOMS.find(x => x.key === sKey);
                            if(!s) return null;
                            const Icon = s.icon;
                            return (
                                <div key={sKey} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/70">
                                    <Icon size={10} />
                                    <span>{s.title}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
                
                {entry.notes && (
                    <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                        <div className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
                            {entry.notes}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}