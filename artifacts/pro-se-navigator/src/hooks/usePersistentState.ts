import { useEffect, useMemo, useState } from "react";

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(key: string, fallback: T) {
  const stableFallback = useMemo(() => fallback, [fallback]);
  const [value, setValue] = useState<T>(() => readStoredValue(key, stableFallback));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local persistence is a convenience layer. If storage is unavailable,
      // keep the in-memory workflow usable instead of breaking the page.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
