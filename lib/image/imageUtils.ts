/** Browser-only helpers for preparing OC images. */

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_SIDE = 560;

export type ImageErrorCode = "type" | "size" | "open" | "read" | "canvas";

export class ImageProcessingError extends Error {
  constructor(public readonly code: ImageErrorCode) {
    super(code);
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageProcessingError("open"));
    img.src = src;
  });
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ImageProcessingError("read"));
    reader.readAsDataURL(file);
  });
}

function canvasFor(img: HTMLImageElement, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ImageProcessingError("canvas");
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

/** WebP keeps transparency and stays small; fall back to PNG where unsupported. */
function encode(canvas: HTMLCanvasElement): string {
  const webp = canvas.toDataURL("image/webp", 0.86);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
}

/** Reads, validates and downsizes an upload so it fits comfortably in local storage. */
export async function prepareUpload(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new ImageProcessingError("type");
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageProcessingError("size");
  const img = await loadImage(await readFile(file));
  return encode(canvasFor(img).canvas);
}

/** Rasterise any image source (e.g. a sample SVG) into a compact data URL. */
export async function rasterize(src: string): Promise<string> {
  const img = await loadImage(src);
  return encode(canvasFor(img).canvas);
}

/**
 * Local "cartoon" filter: smooth, posterise, boost saturation and ink the edges.
 * Stands in for an AI stylisation model in mock mode.
 */
export async function cartoonize(src: string): Promise<string> {
  const img = await loadImage(src);
  const { canvas, ctx, w, h } = canvasFor(img);
  const source = ctx.getImageData(0, 0, w, h);
  const d = source.data;
  const out = ctx.createImageData(w, h);
  const o = out.data;

  // luminance for edge detection
  const lum = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) lum[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

  const levels = 6;
  const step = 255 / (levels - 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      // 3x3 box blur for flatter colour regions
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const j = (yy * w + xx) * 4;
          r += d[j]; g += d[j + 1]; b += d[j + 2]; n++;
        }
      }
      r /= n; g /= n; b /= n;
      // saturation boost
      const avg = (r + g + b) / 3;
      r = avg + (r - avg) * 1.35;
      g = avg + (g - avg) * 1.35;
      b = avg + (b - avg) * 1.35;
      // posterise
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
      // Sobel edge
      let edge = 0;
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
        const gx = -lum[p - w - 1] - 2 * lum[p - 1] - lum[p + w - 1] + lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1];
        const gy = -lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1] + lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1];
        edge = Math.sqrt(gx * gx + gy * gy);
      }
      const ink = edge > 110 ? 0.25 : edge > 70 ? 0.6 : 1;
      o[i] = Math.min(255, Math.max(0, r * ink + (1 - ink) * 50));
      o[i + 1] = Math.min(255, Math.max(0, g * ink + (1 - ink) * 40));
      o[i + 2] = Math.min(255, Math.max(0, b * ink + (1 - ink) * 35));
      o[i + 3] = d[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
  return encode(canvas);
}

/** A few dominant colours, for prompts and UI accents. */
export async function extractPalette(src: string, count = 3): Promise<string[]> {
  const img = await loadImage(src);
  const { ctx, w, h } = canvasFor(img, 48);
  const { data } = ctx.getImageData(0, 0, w, h);
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 245 && min > 235) continue; // skip paper-white backgrounds
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++; bucket.r += r; bucket.g += g; bucket.b += b;
    buckets.set(key, bucket);
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map(({ n, r, g, b }) => `#${[r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("")}`);
}

export type CutoutResult = {
  url: string;
  /** "removed": background cut away · "transparent": already had alpha · "complex": background too busy, kept as is. */
  status: "removed" | "transparent" | "complex";
};

/**
 * Local background removal for plain or clean backgrounds (illustrations,
 * figure photos, scans). Flood-fills from the border through pixels that look
 * like the background, stopping at outlines and sudden colour jumps, then drops
 * small leftover specks (watermarks, captions) and crops to the character.
 * Stands in for a segmentation model in mock mode.
 */
export async function autoCutout(src: string): Promise<CutoutResult> {
  const img = await loadImage(src);
  const { canvas, ctx, w, h } = canvasFor(img);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  const n = w * h;

  // Already a cut-out? Respect it.
  let clear = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 200) clear++;
  if (clear / n > 0.01) return { url: src, status: "transparent" };

  // Background colour = the dominant colour around the border.
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  const buckets = new Map<number, { c: number; r: number; g: number; b: number }>();
  for (const p of border) {
    const i = p * 4;
    const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    const bk = buckets.get(key) ?? { c: 0, r: 0, g: 0, b: 0 };
    bk.c++; bk.r += d[i]; bk.g += d[i + 1]; bk.b += d[i + 2];
    buckets.set(key, bk);
  }
  const top = [...buckets.values()].sort((a, b) => b.c - a.c)[0];
  const bg = [top.r / top.c, top.g / top.c, top.b / top.c];
  const distBg = (p: number) => {
    const i = p * 4;
    return Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
  };
  const distPx = (p: number, q: number) => {
    const i = p * 4, j = q * 4;
    return Math.hypot(d[i] - d[j], d[i + 1] - d[j + 1], d[i + 2] - d[j + 2]);
  };

  const TOL = 42; // how far from the background colour a pixel may drift
  const STEP = 16; // largest neighbour-to-neighbour jump the fill may cross
  const matching = border.filter((p) => distBg(p) < TOL).length / border.length;
  if (matching < 0.6) return { url: src, status: "complex" };

  // Flood fill the background from the border.
  const isBg = new Uint8Array(n);
  const stack: number[] = [];
  for (const p of border) {
    if (!isBg[p] && distBg(p) < TOL) {
      isBg[p] = 1;
      stack.push(p);
    }
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w;
    const y = (p - x) / w;
    const neighbours = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of neighbours) {
      if (q < 0 || isBg[q]) continue;
      if (distBg(q) < TOL && distPx(p, q) < STEP) {
        isBg[q] = 1;
        stack.push(q);
      }
    }
  }

  // Keep only substantial foreground pieces; drop specks like captions and watermarks.
  const label = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  for (let s = 0; s < n; s++) {
    if (isBg[s] || label[s] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    label[s] = id;
    stack.push(s);
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      const x = p % w;
      const y = (p - x) / w;
      const neighbours = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of neighbours) {
        if (q >= 0 && !isBg[q] && label[q] < 0) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    sizes.push(size);
  }
  const largest = Math.max(0, ...sizes);
  const keepMin = Math.max(n * 0.004, largest * 0.03);
  let kept = 0;
  for (let p = 0; p < n; p++) {
    if (!isBg[p] && sizes[label[p]] < keepMin) isBg[p] = 1;
    if (!isBg[p]) kept++;
  }
  if (kept / n < 0.03 || kept / n > 0.97) return { url: src, status: "complex" };

  // Apply alpha with a soft one-pixel edge, and find the crop box.
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let p = 0; p < n; p++) {
    const x = p % w;
    const y = (p - x) / w;
    if (isBg[p]) {
      d[p * 4 + 3] = 0;
      continue;
    }
    const edge = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
    if (edge) d[p * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0.35, distBg(p) / TOL)));
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  ctx.putImageData(image, 0, 0);

  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04);
  const cx0 = Math.max(0, minX - pad);
  const cy0 = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad + 1) - cx0;
  const ch = Math.min(h, maxY + pad + 1) - cy0;
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  out.getContext("2d")!.drawImage(canvas, cx0, cy0, cw, ch, 0, 0, cw, ch);
  return { url: encode(out), status: "removed" };
}
