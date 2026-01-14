// src/lib/progressApi.ts
import type { BackendLessonProgress } from "./progress";

const API_BASE = "http://77.240.39.104/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("savoa_auth_token");
}

function authHeaders() {
  const token = getToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  };
}

export async function fetchProgress(): Promise<BackendLessonProgress[]> {
  const res = await fetch(`${API_BASE}/progress`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`progress_failed_${res.status}`);
  const data = await res.json();
  return (data?.progress ?? []) as BackendLessonProgress[];
}

export async function pushProgress(lessonId: string, secondsWatched: number, completed?: boolean) {
  const body = { seconds_watched: secondsWatched, completed: completed ?? null };

  const res = await fetch(`${API_BASE}/lessons/${lessonId}/progress`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new Error(`push_progress_failed_${res.status}_${raw}`);
  }
}