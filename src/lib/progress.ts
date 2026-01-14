// src/lib/progress.ts
export type BackendLessonProgress = {
  lesson_id: string;
  seconds_watched: number;
  completed: boolean;
  updated_at?: string | null;
};

export type ProgressMap = Record<
  string,
  {
    seconds: number;
    completed: boolean;
    updatedAt?: string | null;
  }
>;

const LS_KEY = "savoa_progress_v1";

export function loadLocalProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveLocalProgress(map: ProgressMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

// merge как в Swift: seconds = max(local, server), completed = server || local
export function mergeProgress(local: ProgressMap, serverRows: BackendLessonProgress[]): ProgressMap {
  const out: ProgressMap = { ...local };

  for (const row of serverRows) {
    const id = row.lesson_id;
    const prev = out[id];

    const prevSeconds = prev?.seconds ?? 0;
    const nextSeconds = Math.max(prevSeconds, Math.max(0, row.seconds_watched ?? 0));

    const prevCompleted = !!prev?.completed;
    const nextCompleted = prevCompleted || !!row.completed;

    out[id] = {
      seconds: nextSeconds,
      completed: nextCompleted,
      updatedAt: row.updated_at ?? prev?.updatedAt,
    };
  }

  return out;
}
