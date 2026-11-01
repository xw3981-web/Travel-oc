"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectLocale, LOCALE_TAG, saveLocale, type Locale } from "./locale";
import { MESSAGES, type Messages } from "./messages";

const ZH_FONT_ID = "zh-hand-font";

type I18nValue = { locale: Locale; m: Messages; setLocale(locale: Locale): void };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = LOCALE_TAG[locale];
  }, [locale]);

  // Chinese handwriting accent font. Injected after load so that a blocked or slow
  // Google Fonts (e.g. in mainland China) never delays the page; text falls back to system fonts.
  useEffect(() => {
    if (locale !== "zh" || document.getElementById(ZH_FONT_ID)) return;
    const link = document.createElement("link");
    link.id = ZH_FONT_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap";
    document.head.appendChild(link);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    saveLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(() => ({ locale, m: MESSAGES[locale], setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
