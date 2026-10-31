"use client";

/* eslint-disable @next/next/no-img-element -- inline sample art */
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SAMPLE_OCS, sampleUrl } from "@/lib/samples";
import { ButtonLink, LanguageToggle, PageShell, PaperCard } from "./ui";

const STEP_EMOJI = ["🎨", "🍙", "📮"];

export function Onboarding() {
  const { m } = useI18n();
  return (
    <PageShell className="relative flex min-h-dvh flex-col justify-center">
      <LanguageToggle className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]" />

      <div className="mb-6 text-center animate-fade-up">
        <p className="font-hand text-2xl text-clay">旅行OC</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">Travel OC</h1>
        <p className="mx-auto mt-2 max-w-xs text-ink-soft">{m.onboarding.tagline}</p>
      </div>

      <div className="relative mx-auto mb-8 flex h-40 items-end justify-center gap-1 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {SAMPLE_OCS.map((s, i) => (
          <img
            key={s.id}
            src={sampleUrl(s)}
            alt=""
            className="animate-bob drop-shadow-sm"
            style={{ height: i === 1 ? 150 : 118, animationDelay: `${i * 0.4}s` }}
          />
        ))}
        <span className="absolute -right-4 top-0 rotate-6 font-hand text-xl text-ink-soft">{m.onboarding.bye}</span>
      </div>

      <PaperCard className="mb-6 divide-y divide-line/70 animate-fade-up" style={{ animationDelay: "0.2s" }}>
        {m.onboarding.steps.map((step, i) => (
          <div key={step.title} className="flex gap-4 px-5 py-4">
            <span className="mt-0.5 text-2xl" aria-hidden>
              {STEP_EMOJI[i]}
            </span>
            <div>
              <h2 className="font-bold">{step.title}</h2>
              <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </div>
        ))}
      </PaperCard>

      <ButtonLink href="/create" className="w-full py-4 text-base">
        {m.common.createOC}
      </ButtonLink>
      <p className="mt-3 text-center text-xs text-ink-faint">{m.onboarding.local}</p>
    </PageShell>
  );
}
