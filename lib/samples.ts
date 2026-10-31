import { svgToDataUrl } from "@/lib/ai/sceneArt";
import type { Locale } from "@/lib/i18n/locale";

/** Built-in characters so anyone can try a journey before drawing their own OC. */
export type SampleOC = { id: string; name: Record<Locale, string>; description: Record<Locale, string>; svg: string };

const mochi = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="480" height="560">
<ellipse cx="120" cy="262" rx="56" ry="8" fill="#000" opacity="0.08"/>
<path d="M120 22c6 12 4 26-2 34" fill="none" stroke="#6f8f5a" stroke-width="5" stroke-linecap="round"/>
<path d="M118 34c-18-14-38-8-40 2 14 8 30 8 40-2z" fill="#86a86a"/>
<path d="M122 30c14-14 32-12 36-2-12 8-26 8-36 2z" fill="#9cbc7c"/>
<path d="M40 190c0-78 36-134 80-134s80 56 80 134c0 44-36 66-80 66s-80-22-80-66z" fill="#fbf4e6" stroke="#3b3129" stroke-width="5"/>
<ellipse cx="90" cy="168" rx="7" ry="9" fill="#3b3129"/><ellipse cx="150" cy="168" rx="7" ry="9" fill="#3b3129"/>
<circle cx="92" cy="165" r="2.4" fill="#fff"/><circle cx="152" cy="165" r="2.4" fill="#fff"/>
<ellipse cx="74" cy="190" rx="13" ry="8" fill="#f2a5a0" opacity="0.8"/><ellipse cx="166" cy="190" rx="13" ry="8" fill="#f2a5a0" opacity="0.8"/>
<path d="M112 186q8 8 16 0" fill="none" stroke="#3b3129" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="88" cy="254" rx="16" ry="9" fill="#fbf4e6" stroke="#3b3129" stroke-width="4"/><ellipse cx="152" cy="254" rx="16" ry="9" fill="#fbf4e6" stroke="#3b3129" stroke-width="4"/>
</svg>`;

const kumo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="480" height="560">
<ellipse cx="120" cy="266" rx="50" ry="7" fill="#000" opacity="0.08"/>
<path d="M50 140c0-56 30-100 70-100s70 44 70 100v98c-10 10-20-6-30 4s-20-6-30 4-20-6-30 4-20-6-30 4-20-4-20-14z" fill="#d8e8f0" stroke="#3b3129" stroke-width="5" stroke-linejoin="round"/>
<path d="M54 160c40 14 92 14 132 0v22c-40 12-92 12-132 0z" fill="#c4704f" stroke="#3b3129" stroke-width="4"/>
<path d="M150 178l14 46-20-4z" fill="#c4704f" stroke="#3b3129" stroke-width="4" stroke-linejoin="round"/>
<path d="M88 116q8-8 16 0" fill="none" stroke="#3b3129" stroke-width="5" stroke-linecap="round"/>
<path d="M136 116q8-8 16 0" fill="none" stroke="#3b3129" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="80" cy="134" rx="11" ry="7" fill="#f2a5a0" opacity="0.7"/><ellipse cx="160" cy="134" rx="11" ry="7" fill="#f2a5a0" opacity="0.7"/>
<ellipse cx="120" cy="138" rx="6" ry="5" fill="#3b3129"/>
</svg>`;

const tora = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" width="480" height="560">
<ellipse cx="120" cy="268" rx="54" ry="7" fill="#000" opacity="0.08"/>
<path d="M76 168h88l14 82c-20 10-96 10-116 0z" fill="#7d8c5d" stroke="#3b3129" stroke-width="5" stroke-linejoin="round"/>
<path d="M120 170v80" stroke="#3b3129" stroke-width="3"/><circle cx="110" cy="196" r="3.5" fill="#e0b25a"/><circle cx="110" cy="222" r="3.5" fill="#e0b25a"/>
<path d="M98 250v14M142 250v14" stroke="#3b3129" stroke-width="10" stroke-linecap="round"/>
<path d="M62 60l14 46 34-26z" fill="#e8a45c" stroke="#3b3129" stroke-width="5" stroke-linejoin="round"/>
<path d="M178 60l-14 46-34-26z" fill="#e8a45c" stroke="#3b3129" stroke-width="5" stroke-linejoin="round"/>
<circle cx="120" cy="122" r="58" fill="#f4c08a" stroke="#3b3129" stroke-width="5"/>
<path d="M78 92c14 8 26 8 34-2M128 90c8 10 22 10 34 2" fill="none" stroke="#c97a3a" stroke-width="5" stroke-linecap="round"/>
<circle cx="98" cy="126" r="6.5" fill="#3b3129"/><circle cx="142" cy="126" r="6.5" fill="#3b3129"/>
<circle cx="100" cy="123" r="2" fill="#fff"/><circle cx="144" cy="123" r="2" fill="#fff"/>
<path d="M114 142l6 5 6-5" fill="none" stroke="#3b3129" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
<ellipse cx="84" cy="144" rx="10" ry="6" fill="#ee8f7a" opacity="0.6"/><ellipse cx="156" cy="144" rx="10" ry="6" fill="#ee8f7a" opacity="0.6"/>
</svg>`;

export const SAMPLE_OCS: SampleOC[] = [
  {
    id: "mochi",
    name: { en: "Mochi", zh: "麻薯" },
    description: {
      en: "a small round cream-coloured blob with a leaf sprout and pink cheeks",
      zh: "圆滚滚的奶油色小团子，头上长着一片小嫩芽，脸颊粉粉的",
    },
    svg: mochi,
  },
  {
    id: "kumo",
    name: { en: "Kumo", zh: "阿云" },
    description: { en: "a pale blue little ghost wearing a rust-red scarf", zh: "淡蓝色的小幽灵，围着一条铁锈红的围巾" },
    svg: kumo,
  },
  {
    id: "tora",
    name: { en: "Tora", zh: "小虎" },
    description: { en: "a cat-eared kid with orange fur and an olive raincoat", zh: "长着猫耳朵的橘色毛小孩，穿着橄榄绿雨衣" },
    svg: tora,
  },
].map((s) => ({ ...s, svg: s.svg.replace(/\n/g, "") }));

export function sampleUrl(sample: SampleOC): string {
  return svgToDataUrl(sample.svg);
}
