"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SetAction<T> = T | ((prev: T) => T);

export function useLocalStorage<T>(key: string, initialValue: T) {
  const isClient = typeof window !== "undefined";

  // держим initialValue стабильно (не пересоздаётся при рендерах)
  const initialRef = useRef<T>(initialValue);

  const [value, setValueState] = useState<T>(() => initialRef.current);
  const [ready, setReady] = useState(false);

  // 1) читаем localStorage один раз на key
  useEffect(() => {
    if (!isClient) return;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValueState(JSON.parse(raw) as T);
      } else {
        // если ключа нет — запишем initial (полезно для предсказуемости)
        window.localStorage.setItem(key, JSON.stringify(initialRef.current));
      }
    } catch (e) {
      console.error("[useLocalStorage] read error:", e);
    } finally {
      setReady(true);
    }
  }, [key, isClient]);

  // 2) setter без stale-замыканий
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
