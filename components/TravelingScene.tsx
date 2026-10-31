"use client";

/* eslint-disable @next/next/no-img-element -- OC data URL */
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cx } from "./ui";

/**
 * Deliberately calm: slow clouds, slow hills, the OC walking in place.
 * Nothing to click, nothing that reveals where they're headed.
 */
export function TravelingScene({ src, name, paused }: { src: string; name: string; paused: boolean }) {
  const { m } = useI18n();
  const play = paused ? "paused" : "running";
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-line bg-[#dfeaec] shadow-card">
      {/* clouds */}
      <div className="absolute inset-x-0 top-[8%] flex w-[200%] animate-drift" style={{ animationDuration: "120s", animationPlayState: play }}>
        {[0, 1].map((k) => (
          <svg key={k} viewBox="0 0 400 80" className="w-1/2" aria-hidden>
            <g fill="#fff" opacity="0.9">
              <ellipse cx="60" cy="40" rx="34" ry="11" />
              <ellipse cx="74" cy="31" rx="18" ry="11" />
              <ellipse cx="250" cy="22" rx="26" ry="8" />
              <ellipse cx="340" cy="56" rx="30" ry="9" />
              <ellipse cx="352" cy="49" rx="14" ry="8" />
            </g>
          </svg>
        ))}
      </div>
      {/* far hills */}
      <div className="absolute inset-x-0 bottom-[22%] flex w-[200%] animate-drift" style={{ animationDuration: "90s", animationPlayState: play }}>
        {[0, 1].map((k) => (
          <svg key={k} viewBox="0 0 400 100" className="w-1/2" preserveAspectRatio="none" aria-hidden>
            <path d="M0 100 L0 60 Q60 20 120 50 T240 40 T400 60 L400 100Z" fill="#b8c8a6" />
          </svg>
        ))}
      </div>
      {/* near ground with path */}
      <div className="absolute inset-x-0 bottom-0 flex h-[30%] w-[200%] animate-drift" style={{ animationDuration: "30s", animationPlayState: play }}>
        {[0, 1].map((k) => (
          <svg key={k} viewBox="0 0 400 90" className="h-full w-1/2" preserveAspectRatio="none" aria-hidden>
            <path d="M0 18 Q100 4 200 16 T400 18 V90 H0Z" fill="#a3b685" />
            <path d="M0 52 Q100 44 200 52 T400 52" fill="none" stroke="#e6d8b8" strokeWidth="14" />
            {[30, 110, 180, 260, 330].map((x) => (
              <g key={x}>
                <line x1={x} y1="22" x2={x - 2} y2="10" stroke="#7d8c5d" strokeWidth="2" />
                <line x1={x + 4} y1="22" x2={x + 6} y2="12" stroke="#7d8c5d" strokeWidth="2" />
              </g>
            ))}
          </svg>
        ))}
      </div>
      <div className="absolute bottom-[13%] left-1/2 -translate-x-1/2">
        <div className={cx(!paused && "animate-walk")}>
          <img src={src} alt={name} className="sticker h-24 w-24 rounded-xl object-contain sm:h-28 sm:w-28" draggable={false} />
          <span className="absolute -right-3 bottom-2 text-2xl" aria-hidden>
            🎒
          </span>
        </div>
      </div>
      {paused && (
        <div className="absolute inset-0 grid place-items-center bg-paper/30">
          <span className="rounded-full bg-card/90 px-4 py-1.5 font-hand text-xl text-ink-soft shadow-card">{m.journey.resting}</span>
        </div>
      )}
    </div>
  );
}
