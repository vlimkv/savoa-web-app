// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/proxy";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  token?: string | null;
  headers?: Record<string, string>;
};

export class APIError extends Error {
  status: number;
  payload: any;
  constructor(status: number, payload: any) {
    super(payload?.message || `API Error ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  let data: any = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) throw new APIError(res.status, data);
  return data as T;
}