"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNumberLocale,
  getT,
  LOCALE_STORAGE_KEY,
  type Locale,
  type MessageKey,
} from "./messages";

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (raw === "en" || raw === "zh-TW") return raw;
  return null;
}

/**
 * Default UI language: Traditional Chinese (zh-TW).
 * Spec: persist choice in localStorage; on first visit we use this default (not navigator).
 */
const DEFAULT_LOCALE: Locale = "zh-TW";

export function useDashboardLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocaleState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale === "zh-TW" ? "zh-Hant" : "en";
  }, [locale, hydrated]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => getT(locale)(key),
    [locale]
  );

  const numberLocale = getNumberLocale(locale);

  return { locale, setLocale, t, numberLocale, hydrated };
}
