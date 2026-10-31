"use client";

import type { ReactNode } from "react";
import { useNow } from "@/lib/hooks/useGame";

const WINDOW_SKY: [number, string, string][] = [
  [5, "#b9d6e4", "#f5dcc2"],
  [11, "#97c2da", "#e8f1ee"],
  [16, "#8a83a8", "#f3ac80"],
  [20, "#1c2343", "#46507a"],
];

function skyFor(hour: number) {
  let pick = WINDOW_SKY[WINDOW_SKY.length - 1];
  for (const row of WINDOW_SKY) if (hour >= row[0]) pick = row;
  if (hour < 5) pick = WINDOW_SKY[3];
  return { top: pick[1], bottom: pick[2], night: hour >= 20 || hour < 5 };
}

/** The OC's little room. The window follows the real time of day. */
export function OCRoom({ children, away = false }: { children?: ReactNode; away?: boolean }) {
  const now = useNow(60_000);
  const sky = skyFor(new Date(now).getHours());

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-line bg-[#f3e6d2] shadow-card">
      <svg viewBox="0 0 360 300" className="block w-full" aria-hidden>
        <defs>
          <linearGradient id="room-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky.top} />
            <stop offset="1" stopColor={sky.bottom} />
          </linearGradient>
        </defs>
        {/* wall + skirting */}
        <rect width="360" height="300" fill="#f3e6d2" />
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={i * 20 + 10} y1="0" x2={i * 20 + 10} y2="214" stroke="#ead9c0" strokeWidth="1" />
        ))}
        {/* window */}
        <rect x="214" y="34" width="104" height="96" rx="6" fill="url(#room-sky)" />
        {sky.night ? (
          <>
            <circle cx="290" cy="60" r="9" fill="#fbf2d0" />
            <circle cx="294" cy="57" r="8" fill={sky.top} />
            {[[232, 52], [252, 76], [300, 96], [240, 104], [270, 46]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.2" fill="#fff8e0" />
            ))}
          </>
        ) : (
          <g fill="#fff" opacity="0.85">
            <ellipse cx="248" cy="70" rx="18" ry="6" />
            <ellipse cx="258" cy="65" rx="10" ry="6" />
            <ellipse cx="296" cy="98" rx="14" ry="4.5" />
          </g>
        )}
        <path d="M214 120 Q240 104 266 120 T318 116 V130 H214Z" fill="#a5b58a" opacity="0.9" />
        <rect x="214" y="34" width="104" height="96" rx="6" fill="none" stroke="#fffaf2" strokeWidth="7" />
        <line x1="266" y1="34" x2="266" y2="130" stroke="#fffaf2" strokeWidth="5" />
        <rect x="206" y="128" width="120" height="8" rx="3" fill="#d9c3a2" />
        {/* plant on sill */}
        <rect x="292" y="112" width="16" height="16" rx="3" fill="#c4704f" />
        <path d="M300 112 q-10 -14 -2 -22 M300 112 q8 -16 14 -14 M300 112 q0 -16 4 -24" fill="none" stroke="#6f8f5a" strokeWidth="3.5" strokeLinecap="round" />
        {/* framed postcard + shelf */}
        <rect x="38" y="46" width="62" height="44" rx="2" fill="#fffaf2" transform="rotate(-4 69 68)" />
        <rect x="44" y="51" width="50" height="30" fill="#c9dbe2" transform="rotate(-4 69 68)" />
        <path d="M44 76 q12 -10 24 -2 t26 -4 v10 h-50z" fill="#9fb27f" transform="rotate(-4 69 68)" />
        <rect x="30" y="118" width="110" height="7" rx="2" fill="#c49a6c" />
        <rect x="40" y="96" width="10" height="22" fill="#7d8c5d" />
        <rect x="52" y="100" width="9" height="18" fill="#c4704f" />
        <rect x="63" y="94" width="11" height="24" fill="#8db0c2" />
        <circle cx="118" cy="110" r="8" fill="#e0b25a" />
        {/* floor + rug */}
        <rect y="214" width="360" height="86" fill="#d8b98f" />
        <rect y="210" width="360" height="6" fill="#c9a77b" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1="0" y1={230 + i * 14} x2="360" y2={230 + i * 14} stroke="#cfae84" strokeWidth="1" />
        ))}
        <ellipse cx="180" cy="262" rx="120" ry="24" fill="#c97f63" opacity="0.85" />
        <ellipse cx="180" cy="262" rx="104" ry="18" fill="none" stroke="#f3e6d2" strokeWidth="2" strokeDasharray="6 5" opacity="0.7" />
        {away && (
          <g>
            <rect x="148" y="236" width="64" height="24" rx="3" fill="#fffaf2" transform="rotate(-6 180 248)" />
            <line x1="156" y1="244" x2="200" y2="240" stroke="#a8998a" strokeWidth="2" transform="rotate(-6 180 248)" />
            <line x1="156" y1="252" x2="190" y2="249" stroke="#a8998a" strokeWidth="2" transform="rotate(-6 180 248)" />
          </g>
        )}
      </svg>
      {children && <div className="absolute inset-x-0 bottom-[14%] flex justify-center">{children}</div>}
    </div>
  );
}
