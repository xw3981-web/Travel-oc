import { createRng, type Rng } from "@/lib/game/random";
import type { SceneSpec, TravelConditions } from "@/types/journey";

/**
 * Procedural, seeded SVG "travel photo" backdrops for mock mode.
 * The OC is composited on top in the UI, so these scenes leave room in the foreground.
 */

const W = 400;
const H = 300;

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255;
    const y = (pb >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

type Ctx = {
  rng: Rng;
  c: TravelConditions;
  accent: string;
  night: boolean;
  dusk: boolean;
  /** Windows glow in the evening and at night. */
  lit: boolean;
};

const SKY: Record<TravelConditions["timeOfDay"], [string, string]> = {
  morning: ["#b9d6e4", "#f5dcc2"],
  afternoon: ["#97c2da", "#e8f1ee"],
  evening: ["#76739f", "#f3ac80"],
  night: ["#1c2343", "#46507a"],
};

function skyColors(c: TravelConditions): [string, string] {
  const [top, bottom] = SKY[c.timeOfDay];
  const grey = ["cloudy", "drizzle", "foggy", "snowy"].includes(c.weather);
  if (!grey) return [top, bottom];
  const g = c.timeOfDay === "night" ? "#30354a" : "#c3c4c4";
  return [mix(top, g, 0.55), mix(bottom, g, 0.5)];
}

function windowFill(ctx: Ctx) {
  return ctx.lit ? (ctx.rng.chance(0.7) ? "#f6d58a" : "#4a4f68") : "#dfe7ea";
}

// ── Sky layers ───────────────────────────────────────────────────────────

function sky(ctx: Ctx, y0 = 0, y1 = H, x0 = 0, x1 = W): string {
  const [top, bottom] = skyColors(ctx.c);
  const id = `sky${Math.floor(ctx.rng.next() * 1e6)}`;
  let out = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>`;
  out += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="url(#${id})"/>`;
  const clear = ctx.c.weather === "sunny" || ctx.c.weather === "windy";

  if (ctx.night) {
    const stars = clear ? 46 : 10;
    for (let i = 0; i < stars; i++) {
      const r = ctx.rng.range(0.4, 1.3);
      out += `<circle cx="${ctx.rng.range(x0, x1).toFixed(1)}" cy="${ctx.rng.range(y0, y0 + (y1 - y0) * 0.6).toFixed(1)}" r="${r.toFixed(2)}" fill="#fff8e0" opacity="${ctx.rng.range(0.4, 1).toFixed(2)}"/>`;
    }
    const mx = ctx.rng.range(x0 + 40, x1 - 40);
    out += `<circle cx="${mx}" cy="${y0 + 44}" r="15" fill="#fbf2d0"/><circle cx="${mx + 7}" cy="${y0 + 39}" r="13" fill="${top}"/>`;
  } else if (clear || ctx.c.weather === "cloudy") {
    const sx = ctx.rng.range(x0 + 50, x1 - 50);
    const sy = ctx.dusk ? y0 + (y1 - y0) * 0.55 : y0 + 46;
    const col = ctx.dusk ? "#f7c08a" : "#fff3cf";
    out += `<circle cx="${sx}" cy="${sy}" r="${ctx.dusk ? 24 : 18}" fill="${col}" opacity="${ctx.c.weather === "cloudy" ? 0.45 : 0.95}"/>`;
  }

  const cloudCount = { sunny: 2, windy: 3, cloudy: 5, drizzle: 5, foggy: 2, snowy: 4 }[ctx.c.weather];
  const cloudCol = ctx.night ? "#59607e" : ctx.dusk ? "#f6d2bd" : "#ffffff";
  for (let i = 0; i < cloudCount; i++) {
    const cx = ctx.rng.range(x0 - 20, x1);
    const cy = ctx.rng.range(y0 + 15, y0 + (y1 - y0) * 0.45);
    const s = ctx.rng.range(0.7, 1.4);
    out += `<g opacity="${ctx.rng.range(0.55, 0.9).toFixed(2)}" fill="${cloudCol}"><ellipse cx="${cx}" cy="${cy}" rx="${26 * s}" ry="${9 * s}"/><ellipse cx="${cx + 12 * s}" cy="${cy - 7 * s}" rx="${15 * s}" ry="${10 * s}"/><ellipse cx="${cx - 10 * s}" cy="${cy - 4 * s}" rx="${12 * s}" ry="${8 * s}"/></g>`;
  }
  return out;
}

// ── Reusable pieces ──────────────────────────────────────────────────────

function hills(ctx: Ctx, baseY: number, amp: number, color: string): string {
  let d = `M0 ${H} L0 ${baseY}`;
  const n = 4;
  for (let i = 0; i < n; i++) {
    const x1 = ((i + 0.5) / n) * W;
    const x2 = ((i + 1) / n) * W;
    d += ` Q${x1.toFixed(0)} ${(baseY - ctx.rng.range(amp * 0.3, amp)).toFixed(0)} ${x2.toFixed(0)} ${(baseY + ctx.rng.range(-amp * 0.3, amp * 0.3)).toFixed(0)}`;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${color}"/>`;
}

function mountains(ctx: Ctx, baseY: number, height: number, color: string, snowCap = false): string {
  let out = "";
  let x = -40;
  while (x < W + 40) {
    const w = ctx.rng.range(90, 170);
    const h = ctx.rng.range(height * 0.6, height);
    const peakX = x + w / 2;
    out += `<path d="M${x} ${baseY} L${peakX} ${baseY - h} L${x + w} ${baseY} Z" fill="${color}"/>`;
    if (snowCap) {
      out += `<path d="M${peakX - w * 0.12} ${baseY - h * 0.76} L${peakX} ${baseY - h} L${peakX + w * 0.12} ${baseY - h * 0.76} L${peakX + w * 0.04} ${baseY - h * 0.8} L${peakX - w * 0.03} ${baseY - h * 0.74} Z" fill="#fbfaf6" opacity="0.9"/>`;
    }
    x += w * 0.62;
  }
  return out;
}

function buildings(ctx: Ctx, baseY: number, minH: number, maxH: number, palette: string[], windowScale = 1): string {
  let out = "";
  let x = -10;
  while (x < W) {
    const w = ctx.rng.range(38, 72);
    const h = ctx.rng.range(minH, maxH);
    const col = ctx.rng.pick(palette);
    out += `<rect x="${x.toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${col}"/>`;
    const ws = 6 * windowScale;
    for (let wy = baseY - h + 8; wy < baseY - 12; wy += ws * 2.2) {
      for (let wx = x + 6; wx < x + w - ws - 3; wx += ws * 1.9) {
        if (ctx.rng.chance(0.82)) out += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${ws}" height="${(ws * 1.2).toFixed(1)}" rx="1" fill="${windowFill(ctx)}" opacity="0.85"/>`;
      }
    }
    x += w + ctx.rng.range(-2, 6);
  }
  return out;
}

function tree(x: number, y: number, s: number, leaf: string, trunk = "#7a5a42"): string {
  return `<rect x="${x - 4 * s}" y="${y - 40 * s}" width="${8 * s}" height="${40 * s}" fill="${trunk}"/><circle cx="${x}" cy="${y - 52 * s}" r="${26 * s}" fill="${leaf}"/><circle cx="${x - 18 * s}" cy="${y - 40 * s}" r="${17 * s}" fill="${leaf}"/><circle cx="${x + 19 * s}" cy="${y - 42 * s}" r="${18 * s}" fill="${leaf}"/>`;
}

function house(ctx: Ctx, x: number, y: number, s: number, wall: string, roof: string, snowRoof = false): string {
  const w = 44 * s;
  const h = 30 * s;
  let out = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/>`;
  out += `<path d="M${x - 6 * s} ${y - h} L${x + w / 2} ${y - h - 20 * s} L${x + w + 6 * s} ${y - h} Z" fill="${snowRoof ? "#fbfaf6" : roof}"/>`;
  out += `<rect x="${x + 8 * s}" y="${y - h + 9 * s}" width="${9 * s}" height="${9 * s}" fill="${windowFill(ctx)}"/>`;
  out += `<rect x="${x + w - 17 * s}" y="${y - h + 9 * s}" width="${9 * s}" height="${9 * s}" fill="${windowFill(ctx)}"/>`;
  return out;
}

function weatherOverlay(ctx: Ctx): string {
  let out = "";
  if (ctx.c.weather === "drizzle") {
    for (let i = 0; i < 70; i++) {
      const x = ctx.rng.range(0, W);
      const y = ctx.rng.range(0, H);
      out += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 3).toFixed(0)}" y2="${(y + 11).toFixed(0)}" stroke="#ffffff" stroke-width="0.9" opacity="0.45"/>`;
    }
  } else if (ctx.c.weather === "snowy") {
    for (let i = 0; i < 80; i++) {
      out += `<circle cx="${ctx.rng.range(0, W).toFixed(0)}" cy="${ctx.rng.range(0, H).toFixed(0)}" r="${ctx.rng.range(0.8, 2.4).toFixed(1)}" fill="#ffffff" opacity="${ctx.rng.range(0.55, 0.95).toFixed(2)}"/>`;
    }
  } else if (ctx.c.weather === "foggy") {
    out += `<rect width="${W}" height="${H}" fill="#f4f1ea" opacity="0.32"/>`;
    for (let i = 0; i < 3; i++) out += `<ellipse cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(140, 240)}" rx="180" ry="18" fill="#ffffff" opacity="0.3"/>`;
  } else if (ctx.c.weather === "windy") {
    for (let i = 0; i < 7; i++) {
      const x = ctx.rng.range(0, W);
      const y = ctx.rng.range(40, 260);
      out += `<path d="M${x} ${y} q8 -6 16 0 t16 0" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.5"/>`;
    }
    for (let i = 0; i < 5; i++) out += `<ellipse cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(60, 260)}" rx="3.5" ry="1.8" fill="#c99a4a" opacity="0.8" transform="rotate(${ctx.rng.range(-40, 40).toFixed(0)})"/>`;
  }
  return out;
}

function lightGrade(ctx: Ctx, outdoor: boolean): string {
  if (ctx.night && outdoor) return `<rect width="${W}" height="${H}" fill="#18203f" opacity="0.38"/>`;
  if (ctx.dusk) return `<rect width="${W}" height="${H}" fill="#f08a4b" opacity="0.1"/>`;
  if (ctx.c.timeOfDay === "morning") return `<rect width="${W}" height="${H}" fill="#fff1d8" opacity="0.08"/>`;
  return "";
}

// ── Scenes ───────────────────────────────────────────────────────────────

function street(ctx: Ctx): string {
  let out = sky(ctx, 0, 200);
  out += buildings(ctx, 210, 70, 140, ["#d9cdbd", "#cbbfae", "#e2d6c5", "#c9b9a6"], 0.9);
  out += buildings(ctx, 232, 50, 95, ["#b9a58f", "#a99580", ctx.accent, "#c8b49b"]);
  // utility poles and drooping wires
  const p1 = ctx.rng.range(40, 120);
  const p2 = p1 + ctx.rng.range(180, 240);
  out += `<rect x="${p1}" y="80" width="5" height="155" fill="#6b5a4c"/><rect x="${p2}" y="74" width="5" height="160" fill="#6b5a4c"/>`;
  for (let i = 0; i < 3; i++) out += `<path d="M-10 ${92 + i * 7} Q${p1 / 2} ${104 + i * 7} ${p1 + 2} ${88 + i * 7} Q${(p1 + p2) / 2} ${110 + i * 7} ${p2 + 2} ${84 + i * 7} Q${(p2 + W) / 2} ${98 + i * 7} ${W + 10} ${90 + i * 7}" fill="none" stroke="#4d4038" stroke-width="0.9" opacity="0.7"/>`;
  out += `<rect y="232" width="${W}" height="68" fill="#cdc2b2"/><rect y="232" width="${W}" height="7" fill="#b6a998"/>`;
  // vending machine glow
  const vx = ctx.rng.chance(0.5) ? ctx.rng.range(20, 70) : ctx.rng.range(310, 350);
  out += `<rect x="${vx}" y="186" width="30" height="48" rx="2" fill="${ctx.accent}"/><rect x="${vx + 4}" y="190" width="22" height="22" fill="${ctx.lit ? "#fff2c4" : "#eef3f0"}"/>`;
  for (let i = 0; i < 4; i++) out += `<circle cx="${vx + 7 + i * 5.5}" cy="${195 + (i % 2) * 9}" r="2" fill="${["#e46a5a", "#5fa07a", "#e0b25a", "#6c8fb0"][i]}"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function river(ctx: Ctx): string {
  let out = sky(ctx, 0, 200);
  out += hills(ctx, 170, 40, "#a8b894");
  if (ctx.rng.chance(0.6)) {
    const bx = ctx.rng.range(60, 300);
    out += `<path d="M${bx - 60} 196 Q${bx} 150 ${bx + 60} 196" fill="none" stroke="#9b8a7a" stroke-width="6"/>`;
  }
  out += `<rect y="186" width="${W}" height="22" fill="#9cad7f"/>`;
  out += `<rect y="206" width="${W}" height="46" fill="${ctx.night ? "#3f5670" : "#8db0c2"}"/>`;
  for (let i = 0; i < 12; i++) {
    const x = ctx.rng.range(0, W);
    const y = ctx.rng.range(212, 246);
    out += `<path d="M${x} ${y} q6 -3 12 0" fill="none" stroke="#e9f2f4" stroke-width="1.2" opacity="0.7"/>`;
  }
  out += `<rect y="250" width="${W}" height="50" fill="#93a675"/>`;
  for (let i = 0; i < 26; i++) {
    const x = ctx.rng.range(0, W);
    out += `<line x1="${x}" y1="${ctx.rng.range(222, 245)}" x2="${x + ctx.rng.range(-4, 4)}" y2="262" stroke="#6f7f50" stroke-width="1.5"/>`;
  }
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function park(ctx: Ctx): string {
  let out = sky(ctx, 0, 210);
  out += hills(ctx, 180, 26, "#a3b48b");
  for (let x = -10; x < W + 20; x += ctx.rng.range(26, 40)) out += `<circle cx="${x}" cy="${ctx.rng.range(170, 182)}" r="${ctx.rng.range(16, 26)}" fill="#86986a"/>`;
  out += `<rect y="196" width="${W}" height="104" fill="#a7b884"/>`;
  out += `<path d="M${ctx.rng.range(120, 220)} 300 Q200 240 ${ctx.rng.range(230, 330)} 196" fill="none" stroke="#e1d3b6" stroke-width="22"/>`;
  const left = ctx.rng.chance(0.5);
  out += tree(left ? 60 : 340, 230, 1.6, "#6f8559");
  const bx = left ? 250 : 80;
  out += `<rect x="${bx}" y="226" width="70" height="6" rx="2" fill="#8a6a4f"/><rect x="${bx}" y="214" width="70" height="5" rx="2" fill="#8a6a4f"/><rect x="${bx + 6}" y="232" width="4" height="14" fill="#5c4a3c"/><rect x="${bx + 60}" y="232" width="4" height="14" fill="#5c4a3c"/>`;
  for (let i = 0; i < 18; i++) out += `<circle cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(250, 295)}" r="1.8" fill="${ctx.rng.pick(["#f2e7c9", "#e8a9a0", "#f0d27a"])}"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function garden(ctx: Ctx): string {
  let out = sky(ctx, 0, 210);
  for (let x = -10; x < W + 20; x += 30) out += `<circle cx="${x}" cy="${ctx.rng.range(185, 200)}" r="${ctx.rng.range(18, 28)}" fill="#7f9566"/>`;
  out += `<path d="M90 230 L90 140 Q200 50 310 140 L310 230 Z" fill="#e6f1ea" opacity="0.55" stroke="#f7faf7" stroke-width="3"/>`;
  for (let i = 1; i < 6; i++) out += `<line x1="${90 + i * 36.6}" y1="230" x2="${90 + i * 36.6}" y2="${140 - Math.sin((i / 6) * Math.PI) * 60}" stroke="#f7faf7" stroke-width="2"/>`;
  out += `<path d="M90 170 Q200 110 310 170" fill="none" stroke="#f7faf7" stroke-width="2"/>`;
  for (let i = 0; i < 9; i++) out += `<ellipse cx="${ctx.rng.range(100, 300)}" cy="${ctx.rng.range(185, 225)}" rx="${ctx.rng.range(10, 22)}" ry="${ctx.rng.range(14, 30)}" fill="${ctx.rng.pick(["#5f8f6a", "#4f7a5a", "#77a07a"])}"/>`;
  out += `<rect y="226" width="${W}" height="74" fill="#9fb27f"/><path d="M160 300 L190 226 L210 226 L240 300 Z" fill="#e4d6bb"/>`;
  for (let i = 0; i < 30; i++) {
    const x = ctx.rng.range(0, W);
    const y = ctx.rng.range(236, 296);
    if (x > 150 && x < 250) continue;
    out += `<circle cx="${x}" cy="${y}" r="${ctx.rng.range(2, 4)}" fill="${ctx.rng.pick(["#e88f8a", "#f2c55c", "#d58fc0", "#ffffff", ctx.accent])}"/>`;
  }
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function landmark(ctx: Ctx): string {
  let out = sky(ctx, 0, 220);
  out += buildings(ctx, 222, 40, 110, ["#cdbfb0", "#bfb1a3", "#d6c9b8"], 0.8);
  const tx = ctx.rng.range(150, 250);
  out += `<rect x="${tx - 22}" y="70" width="44" height="160" fill="${mix(ctx.accent, "#d9c8b0", 0.35)}"/><path d="M${tx - 28} 70 L${tx} 22 L${tx + 28} 70 Z" fill="${ctx.accent}"/>`;
  out += `<circle cx="${tx}" cy="98" r="15" fill="#fbf4e4" stroke="#5a4636" stroke-width="2"/><line x1="${tx}" y1="98" x2="${tx}" y2="88" stroke="#3b3129" stroke-width="2"/><line x1="${tx}" y1="98" x2="${tx + 7}" y2="101" stroke="#3b3129" stroke-width="2"/>`;
  for (let y = 130; y < 220; y += 22) out += `<rect x="${tx - 8}" y="${y}" width="16" height="12" rx="6" fill="${windowFill(ctx)}"/>`;
  out += `<rect y="228" width="${W}" height="72" fill="#d8cbb6"/>`;
  for (let x = -20; x < W; x += 34) out += `<line x1="${x}" y1="300" x2="${x + 30}" y2="228" stroke="#c4b6a0" stroke-width="1"/>`;
  out += `<line x1="0" y1="252" x2="${W}" y2="252" stroke="#c4b6a0"/><line x1="0" y1="278" x2="${W}" y2="278" stroke="#c4b6a0"/>`;
  for (let i = 0; i < 5; i++) out += `<ellipse cx="${ctx.rng.range(20, 380)}" cy="${ctx.rng.range(260, 292)}" rx="5" ry="3.5" fill="#8f8a8a"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function lighthouse(ctx: Ctx): string {
  let out = `<path d="M-10 300 L-10 150 Q60 140 120 180 L150 300 Z" fill="#8f9a7c"/>`;
  out += `<path d="M48 158 L76 158 L70 70 L54 70 Z" fill="#fbfaf4"/><rect x="51" y="100" width="22" height="9" fill="${ctx.accent}"/><rect x="50" y="130" width="25" height="9" fill="${ctx.accent}"/>`;
  out += `<rect x="52" y="54" width="20" height="16" fill="#f6d58a"/><path d="M48 54 L62 40 L76 54 Z" fill="${ctx.accent}"/><rect x="46" y="68" width="32" height="4" fill="#3b3129"/>`;
  if (ctx.lit) out += `<path d="M62 62 L400 30 L400 100 Z" fill="#f6d58a" opacity="0.18"/>`;
  return out;
}

function sea(ctx: Ctx, spec: SceneSpec): string {
  let out = sky(ctx, 0, 170);
  if (spec.landmark !== "lighthouse" && ctx.rng.chance(0.7)) {
    const ix = ctx.rng.range(230, 330);
    out += `<path d="M${ix - 70} 168 Q${ix - 30} 120 ${ix} 128 Q${ix + 40} 118 ${ix + 80} 168 Z" fill="#7b8f78"/><rect x="${ix - 4}" y="96" width="8" height="30" fill="#ece5d7"/><circle cx="${ix}" cy="96" r="5" fill="${ctx.accent}"/>`;
  }
  const seaTop = ctx.night ? "#33456a" : "#6f9fbb";
  const seaBottom = ctx.night ? "#22304d" : "#a6cad6";
  out += `<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${seaTop}"/><stop offset="1" stop-color="${seaBottom}"/></linearGradient></defs>`;
  out += `<rect y="166" width="${W}" height="80" fill="url(#sea)"/>`;
  for (let i = 0; i < 16; i++) {
    const x = ctx.rng.range(0, W);
    const y = ctx.rng.range(172, 236);
    out += `<path d="M${x} ${y} q7 -3 14 0" fill="none" stroke="#f5fbfc" stroke-width="1.2" opacity="0.65"/>`;
  }
  out += `<path d="M0 240 Q100 230 200 238 T400 236 L400 300 L0 300 Z" fill="#e8d7b6"/><path d="M0 242 Q100 232 200 240 T400 238" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8"/>`;
  for (let i = 0; i < 3; i++) {
    const gx = ctx.rng.range(40, 360);
    const gy = ctx.rng.range(50, 120);
    out += `<path d="M${gx - 7} ${gy} q4 -4 7 0 q3 -4 7 0" fill="none" stroke="#4d4a4a" stroke-width="1.4"/>`;
  }
  for (let i = 0; i < 10; i++) out += `<circle cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(256, 296)}" r="1.4" fill="#cdb894"/>`;
  if (spec.landmark === "lighthouse") out += lighthouse(ctx);
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function mountain(ctx: Ctx): string {
  let out = sky(ctx, 0, 200);
  out += mountains(ctx, 175, 120, "#9aa6a8", ctx.c.season === "winter");
  out += mountains(ctx, 200, 80, "#7f9271");
  for (let i = 0; i < 6; i++) out += house(ctx, ctx.rng.range(0, 360), ctx.rng.range(212, 226), ctx.rng.range(0.7, 1), "#efe4d2", ctx.rng.pick([ctx.accent, "#6c5a4c", "#8a6a5a"]));
  out += `<rect y="228" width="${W}" height="72" fill="#a5a088"/><path d="M180 300 Q210 260 260 228 L290 228 Q250 262 250 300 Z" fill="#cfc3ab"/>`;
  for (let i = 0; i < 4; i++) {
    const x = ctx.rng.range(40, 360);
    out += `<path d="M${x} 226 q-6 -14 0 -26 q6 -12 0 -24" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="${ctx.rng.range(0.15, 0.35).toFixed(2)}"/>`;
  }
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function station(ctx: Ctx): string {
  let out = sky(ctx, 0, 200);
  out += mountains(ctx, 190, 50, "#9aaa9a");
  out += `<rect y="186" width="${W}" height="40" fill="${ctx.night ? "#2d3a2f" : "#a9b97f"}"/>`;
  for (let y = 192; y < 224; y += 7) out += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#93a46d" stroke-width="1"/>`;
  if (ctx.night) {
    for (let i = 0; i < 14; i++) out += `<circle cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(190, 214)}" r="1.4" fill="#f6d58a"/>`;
  }
  // canopy + posts
  out += `<rect x="-10" y="120" width="190" height="10" fill="${ctx.accent}"/><rect x="20" y="130" width="5" height="100" fill="#6b5a4c"/><rect x="140" y="130" width="5" height="100" fill="#6b5a4c"/>`;
  if (ctx.lit) out += `<circle cx="82" cy="136" r="4" fill="#f6d58a"/><circle cx="82" cy="140" r="18" fill="#f6d58a" opacity="0.18"/>`;
  // station sign
  const sx = ctx.rng.range(210, 290);
  out += `<rect x="${sx + 4}" y="190" width="3" height="40" fill="#6b5a4c"/><rect x="${sx + 63}" y="190" width="3" height="40" fill="#6b5a4c"/><rect x="${sx}" y="166" width="70" height="28" rx="2" fill="#fbfaf4" stroke="#6b5a4c"/><rect x="${sx}" y="186" width="70" height="4" fill="${ctx.accent}"/><rect x="${sx + 15}" y="173" width="40" height="5" rx="2" fill="#3b3129" opacity="0.7"/>`;
  out += `<rect y="226" width="${W}" height="40" fill="#bcb2a4"/><rect y="226" width="${W}" height="4" fill="#e3c05a"/>`;
  out += `<rect y="266" width="${W}" height="34" fill="#8a8073"/><rect y="276" width="${W}" height="3" fill="#cfc7bb"/><rect y="290" width="${W}" height="3" fill="#cfc7bb"/>`;
  for (let x = 0; x < W; x += 16) out += `<rect x="${x}" y="272" width="8" height="26" fill="#6b5f54" opacity="0.6"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function snow(ctx: Ctx): string {
  let out = sky(ctx, 0, 200);
  out += mountains(ctx, 185, 90, "#e7eaee", true);
  out += hills(ctx, 210, 22, "#f3f4f6");
  for (let i = 0; i < 5; i++) out += house(ctx, 20 + i * 76 + ctx.rng.range(-10, 10), ctx.rng.range(228, 240), ctx.rng.range(0.9, 1.15), ctx.rng.pick(["#8a5a4a", "#6c5a4c", "#a26a52"]), ctx.accent, true);
  out += `<rect y="238" width="${W}" height="62" fill="#fbfbfc"/>`;
  for (let i = 0; i < 8; i++) out += `<ellipse cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(250, 290)}" rx="${ctx.rng.range(20, 50)}" ry="3" fill="#dfe5ec"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function island(ctx: Ctx): string {
  let out = sky(ctx, 0, 160);
  out += `<rect y="150" width="${W}" height="150" fill="${ctx.night ? "#2a3a5c" : "#6aa3b5"}"/>`;
  const ix = ctx.rng.range(140, 260);
  out += `<path d="M${ix - 110} 158 Q${ix - 40} 90 ${ix + 10} 104 Q${ix + 70} 96 ${ix + 120} 158 Z" fill="#6f8f68"/>`;
  for (let i = 0; i < 8; i++) out += `<circle cx="${ix - 60 + ctx.rng.range(0, 130)}" cy="${ctx.rng.range(112, 140)}" r="${ctx.rng.range(8, 14)}" fill="#5c7d55"/>`;
  for (let i = 0; i < 5; i++) out += `<rect x="${ix - 70 + i * 26}" y="${146 - ctx.rng.range(0, 6)}" width="14" height="10" fill="#f0e6d6"/>`;
  for (let i = 0; i < 24; i++) {
    const x = ctx.rng.range(0, W);
    const y = ctx.rng.range(168, 260);
    out += `<path d="M${x} ${y} q6 -3 12 0" fill="none" stroke="#e9f6f8" stroke-width="1.2" opacity="0.6"/>`;
  }
  const bx = ctx.rng.chance(0.5) ? 60 : 300;
  out += `<path d="M${bx - 16} 180 L${bx + 16} 180 L${bx + 11} 188 L${bx - 11} 188 Z" fill="#fbfaf4"/><rect x="${bx - 5}" y="172" width="10" height="8" fill="${ctx.accent}"/>`;
  // ferry deck railing in the foreground
  out += `<rect y="262" width="${W}" height="38" fill="#e9e1d2"/><rect y="236" width="${W}" height="4" fill="#fbfaf4"/>`;
  for (let x = 6; x < W; x += 28) out += `<rect x="${x}" y="236" width="3" height="28" fill="#fbfaf4"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function field(ctx: Ctx): string {
  let out = sky(ctx, 0, 230);
  if (ctx.night) {
    out += `<ellipse cx="200" cy="90" rx="260" ry="30" fill="#c9c6ea" opacity="0.12" transform="rotate(-18 200 90)"/>`;
    for (let i = 0; i < 70; i++) out += `<circle cx="${ctx.rng.range(0, W)}" cy="${ctx.rng.range(10, 180)}" r="${ctx.rng.range(0.4, 1.1)}" fill="#fffbe8" opacity="${ctx.rng.range(0.3, 0.9).toFixed(2)}"/>`;
    out += `<line x1="${ctx.rng.range(60, 200)}" y1="40" x2="${ctx.rng.range(220, 320)}" y2="80" stroke="#fffbe8" stroke-width="1" opacity="0.8"/>`;
  }
  out += hills(ctx, 220, 50, ctx.night ? "#22332c" : "#91a874");
  out += tree(ctx.rng.range(260, 340), 214, 1.1, ctx.night ? "#1b2924" : "#5c7d55", ctx.night ? "#1b2420" : "#6b4f3a");
  out += `<rect y="250" width="${W}" height="50" fill="${ctx.night ? "#1d2b25" : "#87a06b"}"/>`;
  out += weatherOverlay(ctx) + lightGrade(ctx, true);
  return out;
}

function interior(ctx: Ctx, variant: NonNullable<SceneSpec["interior"]>): string {
  const wall = mix(ctx.accent, "#f6ecdc", 0.78);
  let out = `<rect width="${W}" height="${H}" fill="${wall}"/>`;

  if (variant === "tank") {
    out = `<rect width="${W}" height="${H}" fill="#0f2a3d"/>`;
    out += `<defs><linearGradient id="tank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8fb5"/><stop offset="1" stop-color="#123c58"/></linearGradient></defs>`;
    out += `<rect x="16" y="18" width="368" height="226" rx="14" fill="url(#tank)"/>`;
    for (let i = 0; i < 5; i++) out += `<path d="M${40 + i * 75} 18 L${10 + i * 75} 244 L${60 + i * 75} 244 Z" fill="#ffffff" opacity="0.05"/>`;
    for (let i = 0; i < 12; i++) {
      const x = ctx.rng.range(40, 360);
      const y = ctx.rng.range(40, 220);
      const s = ctx.rng.range(0.6, 1.6);
      out += `<g fill="#0b2233" opacity="${ctx.rng.range(0.5, 0.85).toFixed(2)}"><ellipse cx="${x}" cy="${y}" rx="${10 * s}" ry="${4 * s}"/><path d="M${x + 9 * s} ${y} l${6 * s} -${4 * s} l0 ${8 * s} Z"/></g>`;
    }
    out += `<path d="M120 120 q30 -30 60 0 q-30 8 -60 0" fill="#0b2233" opacity="0.6"/>`;
    for (let i = 0; i < 16; i++) out += `<circle cx="${ctx.rng.range(30, 370)}" cy="${ctx.rng.range(30, 230)}" r="${ctx.rng.range(1, 2.6)}" fill="#cfefff" opacity="0.5"/>`;
    out += `<rect y="244" width="${W}" height="56" fill="#0a1f2e"/>`;
    return out;
  }

  if (variant === "books") {
    for (let row = 0; row < 5; row++) {
      const y = 20 + row * 46;
      out += `<rect x="0" y="${y + 40}" width="${W}" height="6" fill="#6b4a32"/>`;
      let x = 4;
      while (x < W) {
        const w = ctx.rng.range(6, 14);
        const h = ctx.rng.range(26, 40);
        out += `<rect x="${x}" y="${y + 40 - h}" width="${w}" height="${h}" fill="${ctx.rng.pick(["#8a3f36", "#3f5a6a", "#6a7a4a", "#c49a5a", "#5a4a6a", "#e0d2b6", "#7a5a3a"])}"/>`;
        x += w + ctx.rng.range(0, 2);
      }
    }
    out += `<rect y="252" width="${W}" height="48" fill="#a57a58"/>`;
    return out + lightGrade(ctx, false);
  }

  // window onto the outside world
  const winX = variant === "shelves" ? 24 : ctx.rng.range(30, 230);
  const winW = variant === "shelves" ? 130 : 150;
  out += `<clipPath id="win"><rect x="${winX}" y="34" width="${winW}" height="120" rx="4"/></clipPath>`;
  out += `<g clip-path="url(#win)">${sky(ctx, 34, 154, winX, winX + winW)}${buildings(ctx, 160, 20, 60, ["#cdbfb0", "#bfb1a3"], 0.6)}</g>`;
  out += `<rect x="${winX}" y="34" width="${winW}" height="120" rx="4" fill="none" stroke="#fbf6ec" stroke-width="7"/><line x1="${winX + winW / 2}" y1="34" x2="${winX + winW / 2}" y2="154" stroke="#fbf6ec" stroke-width="5"/>`;

  if (variant === "shelves") {
    for (let row = 0; row < 4; row++) {
      const y = 40 + row * 48;
      out += `<rect x="180" y="${y + 38}" width="210" height="5" fill="#d6d2c8"/>`;
      for (let x = 184; x < 384; x += 16) out += `<rect x="${x}" y="${y + 38 - ctx.rng.range(16, 30)}" width="12" height="30" rx="2" fill="${ctx.rng.pick(["#e46a5a", "#5fa07a", "#e0b25a", "#6c8fb0", "#f2efe6", "#d98fb0"])}"/>`;
    }
    out += `<rect y="236" width="${W}" height="64" fill="#e6e3dc"/>`;
    for (let x = 0; x < W; x += 40) out += `<line x1="${x}" y1="236" x2="${x}" y2="300" stroke="#d6d2c8"/>`;
  } else if (variant === "counter") {
    out += `<rect x="0" y="172" width="${W}" height="70" fill="#c69a6f"/><rect x="0" y="166" width="${W}" height="10" fill="#f1e9dc" opacity="0.85"/>`;
    for (let i = 0; i < 9; i++) out += `<ellipse cx="${30 + i * 42}" cy="162" rx="16" ry="9" fill="${ctx.rng.pick(["#d9a35a", "#c98a45", "#e6b86f", "#b8783f"])}"/>`;
    out += `<rect y="242" width="${W}" height="58" fill="#b88b62"/>`;
  } else if (variant === "table") {
    out += `<rect y="230" width="${W}" height="70" fill="#a77d5a"/>`;
    for (let x = 0; x < W; x += 50) out += `<line x1="${x}" y1="230" x2="${x - 30}" y2="300" stroke="#956d4c"/>`;
    const tx = winX + winW / 2;
    out += `<line x1="${tx}" y1="0" x2="${tx}" y2="20" stroke="#3b3129"/><path d="M${tx - 16} 34 L${tx + 16} 34 L${tx + 8} 20 L${tx - 8} 20 Z" fill="${ctx.accent}"/>`;
    if (ctx.lit) out += `<circle cx="${tx}" cy="40" r="26" fill="#f6d58a" opacity="0.25"/>`;
    out += `<ellipse cx="${tx}" cy="200" rx="70" ry="12" fill="#7a5a42"/><rect x="${tx - 3}" y="200" width="6" height="40" fill="#5c4434"/>`;
    out += `<rect x="${tx - 30}" y="182" width="16" height="16" rx="3" fill="#fbf6ec"/><path d="M${tx - 14} 186 q6 2 0 8" fill="none" stroke="#fbf6ec" stroke-width="2"/>`;
    out += `<rect x="${tx + 20}" y="178" width="12" height="20" rx="2" fill="#7a9a6a"/><circle cx="${tx + 26}" cy="172" r="9" fill="#6f8f5a"/>`;
  } else if (variant === "frames") {
    out = `<rect width="${W}" height="${H}" fill="${wall}"/>`;
    const frames: [number, number, number, number][] = [[40, 50, 90, 70], [160, 36, 80, 100], [270, 56, 96, 66]];
    for (const [x, y, w, h] of frames) {
      out += `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="#b58a52"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ctx.rng.pick(["#e8dcc4", "#d7e2dc", "#efe0cf"])}"/>`;
      out += `<circle cx="${x + w / 2}" cy="${y + h / 2 + 4}" r="${Math.min(w, h) / 4}" fill="${ctx.rng.pick(["#b9c46a", ctx.accent, "#8db0c2", "#d98f6a"])}"/>`;
      out += `<path d="M${x} ${y + h * 0.75} Q${x + w / 2} ${y + h * 0.6} ${x + w} ${y + h * 0.78} L${x + w} ${y + h} L${x} ${y + h} Z" fill="#9aa67a" opacity="0.7"/>`;
    }
    out += `<rect y="226" width="${W}" height="74" fill="#c7b8a2"/><rect x="140" y="214" width="120" height="10" rx="3" fill="#6b5a4c"/><rect x="150" y="224" width="6" height="18" fill="#4d4038"/><rect x="244" y="224" width="6" height="18" fill="#4d4038"/>`;
  }
  return out + lightGrade(ctx, false);
}

export function renderTravelScene(spec: SceneSpec, conditions: TravelConditions, seed: string): string {
  const rng = createRng(seed, "art");
  const ctx: Ctx = {
    rng,
    c: conditions,
    accent: spec.accent,
    night: conditions.timeOfDay === "night",
    dusk: conditions.timeOfDay === "evening",
    lit: conditions.timeOfDay === "night" || conditions.timeOfDay === "evening",
  };
  const painters: Record<SceneSpec["kind"], () => string> = {
    street: () => street(ctx),
    river: () => river(ctx),
    park: () => park(ctx),
    garden: () => garden(ctx),
    landmark: () => landmark(ctx),
    sea: () => sea(ctx, spec),
    mountain: () => mountain(ctx),
    station: () => station(ctx),
    snow: () => snow(ctx),
    island: () => island(ctx),
    field: () => field(ctx),
    interior: () => interior(ctx, spec.interior ?? "table"),
  };
  const body = painters[spec.kind]();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
