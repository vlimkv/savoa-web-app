// src/hooks/useProgressSync.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProgress, pushProgress } from "@/lib/progressApi";
import { loadLocalProgress, mergeProgress, saveLocalProgress, type ProgressMap } from "@/lib/progress";

export function useProgressSync() {
  const [map, setMap] = useState<ProgressMap>(() => loadLocalProgress());
  const [ready, setReady] = useState(false);

  const pullAndMerge = useCallback(async () => {
    try {
      const rows = await fetchProgress();
      setMap((prev) => {
        const merged = mergeProgress(prev, rows);
        saveLocalProgress(merged);
        return merged;
      });
    } finally {
      setReady(true);
    }
  }, []);

  const heartbeat = useCallback(async (lessonId: string, seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    // локально обновим сразу (как Swift local tick)
    setMap((prev) => {
      const cur = prev[lessonId];
      const nextSeconds = Math.max(cur?.seconds ?? 0, s);
      const next = {
        ...prev,
        [lessonId]: { seconds: nextSeconds, completed: !!cur?.completed, updatedAt: cur?.updatedAt },
      };
      saveLocalProgress(next);
      return next;
    });

    // сеть (молчаливо можно глотать ошибки)
    try {
      await pushProgress(lessonId, s, undefined);
    } catch {}
  }, []);

  const complete = useCallback(async (lessonId: string, seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    setMap((prev) => {
      const cur = prev[lessonId];
      const nextSeconds = Math.max(cur?.seconds ?? 0, s);
      const next = {
        ...prev,
        [lessonId]: { seconds: nextSeconds, completed: true, updatedAt: cur?.updatedAt },
      };
      saveLocalProgress(next);
      return next;
    });

    try {
      await pushProgress(lessonId, s, true);
    } catch {}
  }, []);

  useEffect(() => {
    // один раз при старте (как pullAndMerge)
    pullAndMerge();
  }, [pullAndMerge]);

  const completedCount = useMemo(() => Object.values(map).filter((x) => x.completed).length, [map]);

  return { map, ready, pullAndMerge, heartbeat, complete, completedCount };
}