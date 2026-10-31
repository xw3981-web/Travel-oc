export type Locale = "en" | "zh";

export const LOCALES: Locale[] = ["en", "zh"];
export const LOCALE_KEY = "travel-oc:v1:locale";

/** BCP-47 tags for Intl formatting and <html lang>. */
export const LOCALE_TAG: Record<Locale, string> = { en: "en-US", zh: "zh-CN" };

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "zh";
}

/** Saved preference first, then the browser language. */
export function detectLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(LOCALE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage blocked: fall through */
  }
  const langs = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [];
  return langs.some((l) => l?.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

export function saveLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* preference is best-effort */
  }
}
