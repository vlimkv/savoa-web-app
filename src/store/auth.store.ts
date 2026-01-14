// src/store/auth.store.ts
import { create } from "zustand";
import { api } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";

type User = {
  id: string;
  login?: string;
  email?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;

  hydrate: () => void;
  fetchMe: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: () => {
    const t = getToken();
    set({ token: t, hydrated: true });
  },

  fetchMe: async () => {
    const token = get().token ?? getToken();
    if (!token) {
      set({ user: null });
      return;
    }
    const me = await api<User>("/me", { token });
    set({ user: me, token });
  },

  login: async (login, password) => {
    // подстрой под твой payload/ответ
    const resp = await api<{ token: string }>("/auth/login", {
      method: "POST",
      body: { login, password },
    });

    setToken(resp.token);
    set({ token: resp.token });

    await get().fetchMe();
  },

  logout: () => {
    clearToken();
    set({ token: null, user: null });
  },
}));