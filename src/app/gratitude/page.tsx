"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Sparkles, Heart, Sun, Cloud, Star, 
  Calendar, CheckCircle2, Plus, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

// --- CUSTOM HOOK: useLocalStorage ---
// В реальном проекте вынести в @/hooks/useLocalStorage
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

// --- TYPES ---
type MoodType = "grateful" | "peaceful" | "happy" | "hopeful" | "loved";

interface GratitudeEntry {
  id: string;
  date: string; // ISO string
  items: string[];
  mood?: MoodType;
}

// --- CONSTANTS ---
const MOODS: { key: MoodType; label: string; icon: any; color: string; bg: string }[] = [
  { key: "grateful", label: "Благодарна", icon: Sparkles, color: "text-amber-300", bg: "bg-amber-500/20" },
  { key: "peaceful", label: "Спокойна", icon: Cloud, color: "text-emerald-300", bg: "bg-emerald-500/20" },
  { key: "happy", label: "Счастлива", icon: Sun, color: "text-yellow-300", bg: "bg-yellow-500/20" },
  { key: "hopeful", label: "С надеждой", icon: Star, color: "text-indigo-300", bg: "bg-indigo-500/20" },
  { key: "loved", label: "Любима", icon: Heart, color: "text-rose-300", bg: "bg-rose-500/20" },
];

export default function GratitudePage() {
  // --- STATE ---
  const [entries, setEntries, isStorageReady] = useLocalStorage<GratitudeEntry[]>("gratitude_entries", []);
  
  // Form State
  const [currentItems, setCurrentItems] = useState<string[]>(["", "", ""]);
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  const [isSavedAnimation, setIsSavedAnimation] = useState(false);
  
  // UI State
  const [showAllHistory, setShowAllHistory] = useState(false);

  // --- EFFECTS ---
  // Load today's entry on mount
  useEffect(() => {
    if (!isStorageReady) return;

    const todayEntry = entries.find(e => isSameDay(parseISO(e.date), new Date()));
    
    if (todayEntry) {
      setCurrentItems(todayEntry.items.length > 0 ? todayEntry.items : ["", "", ""]);
      setCurrentMood(todayEntry.mood || null);
    }
  }, [isStorageReady, entries]);

  // --- HANDLERS ---
  const handleItemChange = (index: number, text: string) => {
    setCurrentItems(prev => {
        const next = [...prev];
        next[index] = text;
        return next;
    });
  };

  const addItem = () => setCurrentItems(prev => [...prev, ""]);
  
  const removeItem = () => setCurrentItems(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  const handleSave = () => {
    const trimmedItems = currentItems.map(i => i.trim());
    // Remove empty items from end, but keep at least one if all empty
    while (trimmedItems.length > 1 && trimmedItems[trimmedItems.length - 1] === "") {
        trimmedItems.pop();
    }
    
    const hasContent = trimmedItems.some(i => i.length > 0);
    if (!hasContent) return;

    const today = new Date();
    const existingIndex = entries.findIndex(e => isSameDay(parseISO(e.date), today));
    let newEntries = [...entries];

    const entryData: GratitudeEntry = {
        id: existingIndex >= 0 ? entries[existingIndex].id : crypto.randomUUID(),
        date: today.toISOString(),
        items: trimmedItems,
        mood: currentMood || undefined
    };

    if (existingIndex >= 0) {
      newEntries[existingIndex] = entryData;
    } else {
      newEntries = [entryData, ...newEntries];
    }

    // Sort: Newest first
    newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(newEntries);
    
    setIsSavedAnimation(true);
    setTimeout(() => setIsSavedAnimation(false), 2000);
  };

  // --- HISTORY LOGIC ---
  // Filter out "today" from history list to avoid duplication visually if we are editing it
  const historyEntries = entries; // только для проверки

  const VISIBLE_COUNT = 3;
  const displayedHistory = showAllHistory ? historyEntries : historyEntries.slice(0, VISIBLE_COUNT);
  const hasMoreHistory = historyEntries.length > VISIBLE_COUNT;

  if (!isStorageReady) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-pink-500/30 selection:text-white pb-20 lg:pb-0 lg:h-screen lg:overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full" />
         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full h-full lg:flex">
        
        {/* ================= LEFT COLUMN: EDITOR (Sticky on Desktop) ================= */}
        <div className="w-full lg:w-[45%] xl:w-[40%] lg:h-full lg:border-r lg:border-white/5 lg:bg-[#050505]/50 lg:backdrop-blur-sm flex flex-col">
            
            {/* Header */}
            <header className="p-6 md:p-8 flex items-center justify-between shrink-0">
                <Link href="/" className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                </Link>
                <div className="text-right">
                    <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-pink-500/80 mb-1">Дневник</h1>
                    <p className="text-xl font-medium capitalize">{format(new Date(), "d MMMM", { locale: ru })}</p>
                </div>
            </header>

            {/* Editor Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 pb-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f0f0f] border border-white/5 rounded-[32px] p-6 md:p-8 shadow-2xl shadow-black/50 relative overflow-hidden"
                >
                    {/* Card Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                    {/* Intro */}
                    <div className="flex items-start gap-5 mb-8 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.15)] shrink-0">
                            <Heart className="text-pink-400" fill="currentColor" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1.5">Благодарность</h2>
                            <p className="text-sm text-white/40 leading-relaxed">Запиши моменты, которые сделали этот день особенным.</p>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3 mb-6 relative z-10">
                        <AnimatePresence initial={false}>
                            {currentItems.map((item, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="group relative flex items-center gap-4"
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0 ${item ? "bg-pink-500 text-black" : "bg-white/5 text-white/20"}`}>
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 relative">
                                        <input
                                            value={item}
                                            onChange={(e) => handleItemChange(index, e.target.value)}
                                            placeholder={`Например: ${index === 0 ? "утреннее солнце..." : index === 1 ? "вкусный кофе..." : "улыбка прохожего..."}`}
                                            className="w-full bg-transparent border-b border-white/10 py-4 text-lg text-white placeholder:text-white/10 focus:outline-none focus:border-pink-500/50 transition-all font-light"
                                        />
                                        <div className="absolute bottom-0 left-0 h-[1px] bg-pink-500 w-0 group-focus-within:w-full transition-all duration-500" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Controls (+ / -) */}
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <button onClick={addItem} className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all">
                            <Plus size={14} /> Пункт
                        </button>
                        {currentItems.length > 1 && (
                            <button onClick={removeItem} className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* Mood Selector */}
                    <div className="mb-8 relative z-10">
                        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Настроение</p>
                        <div className="flex flex-wrap gap-2">
                            {MOODS.map((m) => {
                                const Icon = m.icon;
                                const isSelected = currentMood === m.key;
                                return (
                                    <button
                                        key={m.key}
                                        onClick={() => setCurrentMood(m.key)}
                                        className={`
                                            flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300
                                            ${isSelected 
                                                ? `bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] transform scale-105` 
                                                : "bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white"
                                            }
                                        `}
                                    >
                                        <Icon size={16} className={isSelected ? "text-black" : m.color} />
                                        <span className="text-sm font-bold">{m.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={currentItems.every(i => i.trim() === "")}
                        className="w-full relative h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl font-bold text-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98] overflow-hidden shadow-[0_0_40px_rgba(236,72,153,0.3)] hover:shadow-[0_0_60px_rgba(236,72,153,0.5)]"
                    >
                        <AnimatePresence mode="wait">
                            {isSavedAnimation ? (
                                <motion.div 
                                    key="saved"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <CheckCircle2 size={24} /> 
                                    <span>Сохранено</span>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="save"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <Sparkles size={20} />
                                    <span>Записать в вечность</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </motion.div>
            </div>
        </div>

        {/* ================= RIGHT COLUMN: HISTORY (Scrollable) ================= */}
        <div className="w-full lg:flex-1 h-full overflow-hidden flex flex-col bg-black/20">
            
            <div className="p-6 md:p-8 pb-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">История</h3>
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-sm font-medium text-white/50">
                        {entries.length} записей
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                        {displayedHistory.length > 0 ? (
                            displayedHistory.map((entry, i) => (
                                <HistoryCard key={entry.id} entry={entry} index={i} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 text-white/20">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Sparkles size={32} />
                                </div>
                                <p>История пока пуста...<br/>Ваша первая запись станет началом.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Show More Button */}
                {hasMoreHistory && (
                    <div className="mt-8 flex justify-center pb-8">
                        <button 
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="group flex flex-col items-center gap-2 text-white/30 hover:text-white transition-colors"
                        >
                            <span className="text-sm font-bold uppercase tracking-widest">
                                {showAllHistory ? "Свернуть" : "Показать больше"}
                            </span>
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                                {showAllHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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

function HistoryCard({ entry, index }: { entry: GratitudeEntry, index: number }) {
    const moodConfig = MOODS.find(m => m.key === entry.mood);
    const MoodIcon = moodConfig?.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative p-6 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-pink-500/20 hover:bg-[#0f0f0f] transition-all duration-300"
        >
            <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-pink-400 group-hover:bg-pink-500/10 transition-colors">
                        <Calendar size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white capitalize">
                            {format(parseISO(entry.date), "d MMMM", { locale: ru })}
                        </span>
                        <span className="text-xs text-white/30 capitalize">
                            {format(parseISO(entry.date), "EEEE", { locale: ru })}
                        </span>
                    </div>
                </div>
                
                {moodConfig && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${moodConfig.bg} border border-white/5`}>
                        {MoodIcon && <MoodIcon size={12} className={moodConfig.color} />}
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${moodConfig.color}`}>
                            {moodConfig.label}
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-3 relative z-10">
                {entry.items.filter(i => i.trim() !== "").map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-sm items-baseline">
                        <span className="text-pink-500/40 font-mono text-[10px] pt-0.5">0{idx + 1}</span>
                        <span className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors">{item}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}