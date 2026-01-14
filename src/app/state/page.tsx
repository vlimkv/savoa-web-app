"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { 
  Plus, Minus, RotateCcw, Check, Sparkles, 
  Droplet, Heart, Activity, Settings, Trash2, Wind, Footprints, Moon, ArrowUpRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// --- TYPES ---
interface Habit {
  id: string;
  title: string;
  icon: string;
  isCompleted: boolean;
}

type DayLog = {
  id: string;
  date: string;      // "YYYY-MM-DD"
  waterML: number;
  waterGoal: number;
  habits: Habit[];
};

const WATER_STEP = 250;
const DEFAULT_GOAL = 2000;

export default function StatePage() {
  // --- STATE ---
  const [waterML, setWaterML, waterReady] = useLocalStorage("savoa_water_ml", 0);
  const [waterGoal, setWaterGoal, goalReady] = useLocalStorage("savoa_water_goal", DEFAULT_GOAL);
  const [waterDate, setWaterDate, dateReady] = useLocalStorage("savoa_water_date", "");

  const [habits, setHabits, habitsReady] = useLocalStorage<Habit[]>("savoa_habits", [
  { id: "1", title: "Дыхание 2 минуты", icon: "wind", isCompleted: false },
  { id: "2", title: "Движение 10 минут", icon: "walk", isCompleted: false },
  { id: "3", title: "Лечь до 23:00", icon: "moon", isCompleted: false },
  ]);

  const [history, setHistory, historyReady] = useLocalStorage<DayLog[]>("savoa_state_history", []);

  const ready = waterReady && goalReady && dateReady && habitsReady && historyReady;

  const todayKey = new Date().toISOString().split('T')[0];

  const upsertTodayLog = () => {
    setHistory(prev => {
        const idx = prev.findIndex(x => x.date === todayKey);

        const item: DayLog = {
        id: idx >= 0 ? prev[idx].id : crypto.randomUUID(),
        date: todayKey,
        waterML,
        waterGoal,
        habits,
        };

        let next = [...prev];
        if (idx >= 0) next[idx] = item;
        else next = [item, ...next];

        next.sort((a, b) => b.date.localeCompare(a.date));
        return next;
    });
  };

  const upsertLogFor = (dateKey: string, wML: number, wGoal: number, hs: Habit[]) => {
    setHistory(prev => {
        const idx = prev.findIndex(x => x.date === dateKey);

        const item: DayLog = {
        id: idx >= 0 ? prev[idx].id : crypto.randomUUID(),
        date: dateKey,
        waterML: wML,
        waterGoal: wGoal,
        habits: hs,
        };

        const next = [...prev];
        if (idx >= 0) next[idx] = item;
        else next.unshift(item);

        next.sort((a, b) => b.date.localeCompare(a.date));
        return next;
    });
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (!ready) return;

    if (waterDate !== todayKey) {
        if (waterDate) upsertLogFor(waterDate, waterML, waterGoal, habits);

        setWaterML(0);
        setWaterDate(todayKey);
        setHabits(prev => prev.map(h => ({ ...h, isCompleted: false })));
    }

  }, [ready, waterDate, todayKey, setWaterDate, setWaterML, setHabits]);

  useEffect(() => {
    if (!ready) return;
    upsertLogFor(todayKey, waterML, waterGoal, habits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, waterML, waterGoal, habits, todayKey]);

  // --- HANDLERS ---
  const toggleHabit = (id: string) => {
    setHabits(prev =>
        prev.map(h => (h.id === id ? { ...h, isCompleted: !h.isCompleted } : h))
    );
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const addHabit = () => {
    const newHabit: Habit = {
        id: crypto.randomUUID(),
        title: "Новая привычка",
        icon: "sparkles",
        isCompleted: false,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  // после todayKey или после history
  const [showAllHistory, setShowAllHistory] = useState(false);
  const VISIBLE_COUNT = 7;
  const displayedHistory = showAllHistory ? history : history.slice(0, VISIBLE_COUNT);
  const hasMoreHistory = history.length > VISIBLE_COUNT;

  if (!ready) return <div className="min-h-screen bg-black" />;

  const percent = Math.min(100, Math.round((waterML / waterGoal) * 100));

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Background Gradients (Global) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />
      </div>

      <div className="relative z-10 w-full h-full">

        {/* ================================================================================= */}
        {/* 📱 MOBILE LAYOUT (< md) - UNCHANGED                                              */}
        {/* ================================================================================= */}
        <div className="md:hidden pb-24 p-5 space-y-8">
            <header className="flex justify-between items-end pt-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Трекер</h1>
                    <p className="text-white/40 text-sm mt-1 capitalize">
                        {format(new Date(), "d MMMM", { locale: ru })}
                    </p>
                </div>
                <div className="flex gap-1.5 pb-2">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < 3 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-white/10'}`} />
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <Link href="/tracker">
                    <QuickActionCard title="Состояние" subtitle="Настроение" icon={Activity} gradient="from-cyan-400 to-blue-500" glow="shadow-cyan-500/20" />
                </Link>
                <Link href="/gratitude">
                    <QuickActionCard title="Благодарность" subtitle="Дневник" icon={Heart} gradient="from-pink-400 to-purple-500" glow="shadow-pink-500/20" />
                </Link>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <Droplet className="text-cyan-400" size={20} fill="currentColor" />
                        <span className="text-lg font-bold">Гидратация</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <WaterGlass current={waterML} goal={waterGoal} />
                    <div className="flex-1 w-full space-y-6">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{waterML}</span>
                                <span className="text-white/50">мл</span>
                            </div>
                            <p className="text-sm text-white/40">из {waterGoal} мл</p>
                        </div>
                        <div className="h-[1px] bg-white/10 w-full" />
                        <div className="flex gap-3">
                            <ControlBtn icon={Minus} onClick={() => setWaterML(prev => Math.max(0, prev - WATER_STEP))} />
                            <button onClick={() => setWaterML(prev => prev + WATER_STEP)} className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center gap-2 font-bold text-black active:scale-95 transition-transform"><Plus size={18} /><span>{WATER_STEP} мл</span></button>
                            <ControlBtn icon={RotateCcw} onClick={() => setWaterML(0)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-purple-400" size={20} />
                        <div className="flex flex-col">
                            <span className="text-lg font-bold">Привычки</span>
                            <span className="text-xs text-white/40">{habits.filter(h => h.isCompleted).length} из {habits.length}</span>
                        </div>
                    </div>
                    <button onClick={addHabit} className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all"><Plus size={16} /></button>
                </div>
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <div key={habit.id} className="group flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <button onClick={() => toggleHabit(habit.id)} className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${habit.isCompleted ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-white/5 border-transparent text-white/30"}`}>{habit.isCompleted ? <Check size={18} strokeWidth={3} /> : <HabitIcon name={habit.icon} />}</button>
                            <input value={habit.title} onChange={(e) => setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, title: e.target.value } : h)) } className={`bg-transparent w-full outline-none font-medium transition-colors ${habit.isCompleted ? "text-white/40 line-through" : "text-white"}`} />
                            <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* HISTORY (MOBILE) */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                <span className="text-lg font-bold">История</span>
                <span className="text-xs text-white/40">{history.length} дней</span>
                </div>

                {hasMoreHistory && (
                <button
                    onClick={() => setShowAllHistory(v => !v)}
                    className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition"
                >
                    {showAllHistory ? "Свернуть" : "Ещё"}
                </button>
                )}
            </div>

            <div className="space-y-3">
                {displayedHistory.map((d) => (
                <div key={d.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="text-xs text-white/40 mb-1">{d.date}</div>
                    <div className="flex justify-between text-sm text-white/80">
                    <span>💧 {d.waterML}/{d.waterGoal} мл</span>
                    <span>✨ {d.habits.filter(h => h.isCompleted).length}/{d.habits.length}</span>
                    </div>
                </div>
                ))}
            </div>

            {history.length === 0 && (
                <div className="py-8 text-center text-white/20 text-sm">Пока нет записей</div>
            )}
            </div>
        </div>


        {/* ================================================================================= */}
        {/* 📟 TABLET / iPAD LAYOUT (md to lg) - NEW SECTION                                  */}
        {/* ================================================================================= */}
        <div className="hidden md:flex lg:hidden flex-col h-screen w-full p-6 gap-6 overflow-hidden">
            {/* Tablet Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Состояние</h1>
                    <p className="text-white/40 text-sm capitalize">{format(new Date(), "d MMMM", { locale: ru })}</p>
                </div>
                <div className="flex gap-2">
                     <Link href="/tracker" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-cyan-400 hover:bg-white/10 transition-colors"><Activity size={18} /></Link>
                     <Link href="/gratitude" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-pink-400 hover:bg-white/10 transition-colors"><Heart size={18} /></Link>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                {/* Left Col: Water & Stats */}
                <div className="flex flex-col gap-6 h-full">
                    <div className="flex-1 relative rounded-3xl bg-[#0a0a0a] border border-white/5 overflow-hidden group flex flex-col items-center justify-between p-6">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-black to-black" />
                        <div className="absolute top-0 right-0 p-24 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="relative z-10 w-full flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <Droplet className="text-cyan-400" size={16} fill="currentColor" />
                                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Вода</span>
                            </div>
                            <span className="text-2xl font-bold">{waterML} <span className="text-sm text-white/40">/ {waterGoal}</span></span>
                        </div>

                        <div className="relative z-10 scale-110 py-4">
                            <WaterGlass current={waterML} goal={waterGoal} />
                        </div>

                        <div className="relative z-10 w-full space-y-4">
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setWaterML(prev => Math.max(0, prev - WATER_STEP))} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10"><Minus size={20}/></button>
                                <button onClick={() => setWaterML(prev => prev + WATER_STEP)} className="flex-1 h-12 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"><Plus size={18}/> {WATER_STEP} мл</button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Tablet */}
                    <div className="h-[140px] grid grid-cols-2 gap-4">
                        <Link href="/tracker" className="rounded-3xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400"><Activity size={16}/></div>
                            <div><p className="font-bold text-sm">Настроение</p><p className="text-[10px] text-white/40">Дневник</p></div>
                        </Link>
                         <Link href="/gratitude" className="rounded-3xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400"><Heart size={16}/></div>
                            <div><p className="font-bold text-sm">Благодарность</p><p className="text-[10px] text-white/40">Практика</p></div>
                        </Link>
                    </div>
                </div>

                {/* Right Col: Habits */}
                <div className="flex flex-col h-full bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden relative">
                    <div className="absolute bottom-0 left-0 p-24 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="p-6 border-b border-white/5 flex justify-between items-center relative z-10">
                        <span className="font-bold text-lg">Привычки</span>
                        <button onClick={addHabit} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white hover:text-black flex items-center justify-center transition-all"><Plus size={16} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative z-10">
                         <AnimatePresence>
                            {habits.map((habit) => (
                                <motion.div
                                    key={habit.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        habit.isCompleted ? "bg-green-900/10 border-green-500/20" : "bg-white/5 border-transparent"
                                    }`}
                                >
                                    <button onClick={() => toggleHabit(habit.id)} className={`min-w-[40px] h-10 rounded-lg flex items-center justify-center transition-all ${habit.isCompleted ? "bg-green-500 text-black" : "bg-white/5 text-white/30"}`}>
                                        {habit.isCompleted ? <Check size={18} strokeWidth={3} /> : <HabitIcon name={habit.icon} />}
                                    </button>
                                    <input 
                                        value={habit.title}
                                        onChange={(e) =>
                                            setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, title: e.target.value } : h))
                                        }
                                        className={`bg-transparent w-full outline-none text-sm font-medium ${habit.isCompleted ? "text-white/30 line-through" : "text-white"}`}
                                    />
                                    <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400"><Trash2 size={16} /></button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    {/* HISTORY (TABLET) */}
                    <div className="border-t border-white/5 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-white/80">История</span>
                        <span className="text-xs text-white/40">{history.length}</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {history.slice(0, 10).map(d => (
                        <div key={d.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="text-[10px] text-white/40">{d.date}</div>
                            <div className="text-xs text-white/80 flex justify-between">
                            <span>{d.waterML}/{d.waterGoal} мл</span>
                            <span>{d.habits.filter(h => h.isCompleted).length}/{d.habits.length}</span>
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
            </div>
        </div>


        {/* ================================================================================= */}
        {/* 💻 DESKTOP LAYOUT (>= lg) - PREMIUM DASHBOARD                                     */}
        {/* ================================================================================= */}
        <div className="hidden lg:flex h-screen w-full p-8 gap-8 overflow-hidden">
            
            {/* --- LEFT COLUMN: WATER & STATS (60%) --- */}
            <div className="flex-1 flex flex-col gap-8 h-full">
                
                {/* Header */}
                <div className="flex items-end gap-6 pb-2">
                    <h1 className="text-5xl font-bold tracking-tighter">Состояние</h1>
                    <div className="h-px flex-1 bg-white/10 mb-4" />
                    <p className="text-white/40 text-lg mb-2 capitalize">{format(new Date(), "d MMMM yyyy", { locale: ru })}</p>
                </div>

                {/* Main Water Card (Hero) */}
                <div className="flex-1 relative rounded-[40px] bg-[#0a0a0a] border border-white/5 overflow-hidden group">
                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-black to-black" />
                    <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex h-full">
                        
                        {/* Glass Section */}
                        <div className="w-1/2 flex items-center justify-center border-r border-white/5 relative">
                            {/* Upscaled Glass */}
                            <div className="scale-150 transform transition-transform duration-700 group-hover:scale-[1.6]">
                                <WaterGlass current={waterML} goal={waterGoal} />
                            </div>
                            
                            {/* Floating Bubbles Decoration */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full blur-[2px] opacity-50 animate-pulse" />
                                <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white rounded-full blur-[1px] opacity-30" />
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="w-1/2 p-12 flex flex-col justify-center gap-10">
                            
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Droplet className="text-cyan-400" fill="currentColor" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Гидратация</span>
                                </div>
                                <h2 className="text-7xl font-bold text-white tabular-nums tracking-tighter">
                                    {waterML} <span className="text-2xl text-white/30 font-medium">/ {waterGoal} мл</span>
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-medium text-white/50">
                                    <span>Дневная цель</span>
                                    <span>{percent}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setWaterML(prev => prev + WATER_STEP)}
                                    className="h-16 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-cyan-50 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                                >
                                    <Plus size={24} />
                                     {WATER_STEP} мл
                                </button>
                                <div className="flex gap-4">
                                    <button onClick={() => setWaterML(prev => Math.max(0, prev - WATER_STEP))} className="flex-1 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all">
                                        <Minus size={24} className="text-white/60" />
                                    </button>
                                    <button onClick={() => setWaterML(0)} className="flex-1 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all">
                                        <RotateCcw size={24} className="text-white/60" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="h-[180px] grid grid-cols-2 gap-6">
                    <DesktopQuickCard 
                        title="Дневник состояния" 
                        subtitle="Запишите свои ощущения" 
                        icon={Activity} 
                        color="text-green-400"
                        gradient="from-green-500/10 to-emerald-500/10"
                        href="/tracker"
                    />
                    <DesktopQuickCard 
                        title="Благодарность" 
                        subtitle="Практика осознанности" 
                        icon={Heart} 
                        color="text-pink-400"
                        gradient="from-pink-500/10 to-rose-500/10"
                        href="/gratitude"
                    />
                </div>
            </div>

            {/* --- RIGHT COLUMN: HABITS (40%) --- */}
            <div className="w-[400px] flex flex-col h-full bg-[#0a0a0a] rounded-[40px] border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
                
                <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold">Привычки</h2>
                        <p className="text-sm text-white/40 mt-1">{habits.filter(h => h.isCompleted).length} выполнено сегодня</p>
                    </div>
                    <button 
                        onClick={addHabit}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar relative z-10">
                    <AnimatePresence>
                        {habits.map((habit) => (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                    habit.isCompleted 
                                        ? "bg-green-900/10 border-green-500/20" 
                                        : "bg-[#121212] border-white/5 hover:border-white/10 hover:bg-[#151515]"
                                }`}
                            >
                                <button 
                                    onClick={() => toggleHabit(habit.id)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                        habit.isCompleted 
                                            ? "bg-green-500 text-black scale-110 shadow-lg shadow-green-500/20" 
                                            : "bg-white/5 text-white/30 group-hover:text-white group-hover:bg-white/10"
                                    }`}
                                >
                                    {habit.isCompleted ? <Check size={20} strokeWidth={3} /> : <HabitIcon name={habit.icon} />}
                                </button>
                                
                                <div className="flex-1">
                                    <input 
                                        value={habit.title}
                                        onChange={(e) =>
                                            setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, title: e.target.value } : h))
                                        }
                                        className={`bg-transparent w-full outline-none font-medium text-lg transition-colors ${
                                            habit.isCompleted ? "text-white/30 line-through" : "text-white"
                                        }`}
                                    />
                                </div>

                                <button 
                                    onClick={() => deleteHabit(habit.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {habits.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4 mt-20">
                            <Sparkles size={40} strokeWidth={1} />
                            <p>Добавьте первую привычку</p>
                        </div>
                    )}
                </div>
                {/* HISTORY (DESKTOP) */}
                <div className="border-t border-white/5 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white/80">История</h3>
                    <button
                    onClick={() => setShowAllHistory(v => !v)}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition"
                    >
                    {showAllHistory ? "Свернуть" : "Показать всё"}
                    </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {displayedHistory.map(d => (
                    <div key={d.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] text-white/40 mb-1">{d.date}</div>
                        <div className="flex justify-between text-xs text-white/80">
                        <span>💧 {d.waterML}/{d.waterGoal}</span>
                        <span>✨ {d.habits.filter(h=>h.isCompleted).length}/{d.habits.length}</span>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

            </div>

        </div>

      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function QuickActionCard({ title, subtitle, icon: Icon, gradient, glow }: any) {
    return (
        <div className={`relative h-[120px] rounded-2xl bg-white/5 border border-white/5 p-5 flex flex-col justify-between overflow-hidden group hover:border-white/10 transition-colors`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-[40px] opacity-20 group-hover:opacity-30 transition-opacity`} />
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow}`}>
                <Icon className="text-white" size={18} />
            </div>
            <div>
                <h3 className="font-bold text-sm text-white">{title}</h3>
                <p className="text-[10px] text-white/50">{subtitle}</p>
            </div>
        </div>
    )
}

function DesktopQuickCard({ title, subtitle, icon: Icon, href, color, gradient }: any) {
    return (
        <Link href={href} className="group relative flex items-center justify-between p-8 rounded-[32px] bg-[#0a0a0a] border border-white/5 overflow-hidden transition-all hover:border-white/20 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10 flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center ${color} border border-white/5 group-hover:scale-110 transition-transform`}>
                    <Icon size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm text-white/40 font-medium uppercase tracking-wider">{subtitle}</p>
                </div>
            </div>
            
            <div className="relative z-10 w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white group-hover:border-white/50 group-hover:rotate-45 transition-all">
                <ArrowUpRight size={24} />
            </div>
        </Link>
    )
}

function ControlBtn({ icon: Icon, onClick }: any) {
    return (
        <button onClick={onClick} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            <Icon size={20} />
        </button>
    )
}

function HabitIcon({ name }: { name: string }) {
    switch (name) {
        case "wind": return <Wind size={18} />;
        case "walk": return <Footprints size={18} />;
        case "moon": return <Moon size={18} />;
        default: return <Sparkles size={18} />;
    }
}

// --- WATER GLASS ANIMATION ---
function WaterGlass({ current, goal }: { current: number, goal: number }) {
    const percent = Math.min(1, current / goal);
    const heightPercent = percent * 100;

    return (
        <div className="relative w-[100px] h-[160px]">
            <div className="absolute inset-0 border-2 border-white/20 rounded-b-[40px] rounded-t-[5px] border-t-0 backdrop-blur-sm bg-white/[0.02] overflow-hidden">
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-cyan-500/80 transition-all duration-700 ease-in-out"
                    style={{ height: `${heightPercent}%` }}
                >
                    <div className="absolute -top-3 left-0 w-[200%] h-4 flex opacity-80 animate-wave">
                         <div className="w-full h-full bg-[url('/wave.svg')] bg-repeat-x bg-contain" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/50 to-cyan-400/20" />
                    {percent > 0 && (
                        <div className="absolute inset-0 w-full h-full">
                            <div className="bubble absolute bottom-0 left-[20%] w-1 h-1 bg-white/40 rounded-full animate-bubble-1" />
                            <div className="bubble absolute bottom-0 left-[60%] w-2 h-2 bg-white/30 rounded-full animate-bubble-2" />
                            <div className="bubble absolute bottom-0 left-[80%] w-1.5 h-1.5 bg-white/20 rounded-full animate-bubble-3" />
                        </div>
                    )}
                </div>
                <div className="absolute top-0 left-2 w-1 h-[90%] bg-white/10 rounded-full" />
                <div className="absolute top-0 right-2 w-1 h-[60%] bg-white/5 rounded-full" />
            </div>
            <div className="absolute -top-1 left-0 right-0 h-2 border-2 border-white/20 rounded-[100%] bg-white/[0.02]" />
        </div>
    )
}