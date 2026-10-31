"use client";

import Link from "next/link";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGame } from "@/lib/hooks/useGame";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-clay text-card shadow-[0_3px_0_var(--color-clay-deep)] hover:bg-clay-deep active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-clay-deep)]",
  secondary:
    "bg-card text-ink border border-line shadow-[0_3px_0_var(--color-line)] hover:bg-paper-deep/50 active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-line)]",
  ghost: "text-ink-soft hover:text-ink hover:bg-paper-deep/60",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold tracking-wide transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...props} />;
}

export function PaperCard({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-3xl border border-line bg-card shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

export function PageShell({ children, className, withNav = false }: { children: ReactNode; className?: string; withNav?: boolean }) {
  return (
    <main
      className={cx(
        "mx-auto w-full max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg",
        withNav ? "pb-32" : "pb-12",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({ title, back, kicker }: { title: string; back?: string; kicker?: string }) {
  const { m } = useI18n();
  return (
    <header className="mb-5 flex items-center gap-3">
      {back && (
        <Link
          href={back}
          aria-label={m.common.back}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-card text-ink-soft shadow-card transition hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      )}
      <div>
        {kicker && <p className="font-hand text-lg leading-none text-clay">{kicker}</p>}
        <h1 className="text-xl font-bold text-ink">{title}</h1>
      </div>
    </header>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { m } = useI18n();
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-ink-soft">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 animate-bob rounded-full bg-clay/70" style={{ animationDelay: `${i * 0.18}s`, animationDuration: "1.2s" }} />
          ))}
        </div>
        <p className="font-hand text-xl">{label ?? m.common.loading}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <PaperCard className="flex flex-col items-center px-6 py-10 text-center animate-fade-up">
      <div className="mb-3 text-5xl" aria-hidden>
        {emoji}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-soft">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </PaperCard>
  );
}

export function NoticeToast() {
  const { notice, dismissNotice } = useGame();
  const { m } = useI18n();
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(dismissNotice, notice.kind === "error" ? 7000 : 5000);
    return () => window.clearTimeout(id);
  }, [notice, dismissNotice]);
  if (!notice) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4">
      <div
        role={notice.kind === "error" ? "alert" : "status"}
        className={cx(
          "pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lift animate-fade-up",
          notice.kind === "error" ? "border-clay/40 bg-[#fbeae2] text-clay-deep" : "border-line bg-card text-ink",
        )}
      >
        <span aria-hidden>{notice.kind === "error" ? "🫧" : "📮"}</span>
        <p className="flex-1 leading-snug">{notice.message(m)}</p>
        <button onClick={dismissNotice} className="text-ink-faint hover:text-ink" aria-label={m.common.dismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}

/** Small hand-written label, like a note scribbled in a travel journal. */
export function HandNote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("font-hand text-xl leading-tight text-ink-soft", className)}>{children}</p>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between px-1">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-soft">{children}</h2>
      {aside}
    </div>
  );
}

/** EN / 中文 switch. */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, m } = useI18n();
  return (
    <div role="radiogroup" aria-label={m.common.language} className={cx("flex rounded-full border border-line bg-card p-0.5 text-xs font-bold shadow-card", className)}>
      {(["en", "zh"] as const).map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={locale === l}
          onClick={() => setLocale(l)}
          className={cx("rounded-full px-2.5 py-1 transition", locale === l ? "bg-paper-deep text-ink" : "text-ink-faint hover:text-ink")}
        >
          {l === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}
