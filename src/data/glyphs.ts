/**
 * Штрихи цифр и русских букв для обводки по точкам. Координаты в коробке 100×140 (y вниз).
 * A(cx, cy, rx, ry, градус_начала, градус_конца) — дуга (0° — вправо, 90° — вниз), можно убывать.
 */
type Pt = [number, number];
const A = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] => {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 12));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt;
  });
};
const L = (...p: Pt[]): Pt[] => p;
const cat = (...parts: Pt[][]): Pt[] => parts.flat();

export interface Glyph { id: string; ch: string; voice: string; emoji?: string; strokes: Pt[][] }

const BOWL = (top: number, bottom: number, x0 = 25, x1 = 55) => cat(L([x0, top], [x1, top]), A(x1, (top + bottom) / 2, 28, (bottom - top) / 2, -90, 90), L([x0, bottom]));
const DIGIT_3 = cat(A(48, 40, 28, 28, -150, 90), A(48, 98, 32, 32, -90, 150));

export const DIGITS: Glyph[] = [
  { id: '0', ch: '0', voice: 'd_0', strokes: [A(50, 70, 32, 58, -90, 270)] },
  { id: '1', ch: '1', voice: 'd_1', strokes: [L([28, 36], [56, 12], [56, 130])] },
  { id: '2', ch: '2', voice: 'd_2', strokes: [cat(A(50, 44, 30, 30, -165, 25), L([20, 130], [84, 130]))] },
  { id: '3', ch: '3', voice: 'd_3', strokes: [DIGIT_3] },
  { id: '4', ch: '4', voice: 'd_4', strokes: [L([62, 130], [62, 12], [16, 92], [86, 92])] },
  { id: '5', ch: '5', voice: 'd_5', strokes: [cat(L([80, 12], [30, 12], [26, 60]), A(48, 90, 32, 38, -130, 150))] },
  { id: '6', ch: '6', voice: 'd_6', strokes: [cat(A(74, 92, 50, 78, -100, -180), A(50, 98, 25, 30, 180, 540))] },
  { id: '7', ch: '7', voice: 'd_7', strokes: [L([18, 12], [84, 12], [38, 130])] },
  { id: '8', ch: '8', voice: 'd_8', strokes: [cat(A(50, 38, 24, 26, 90, 450), A(50, 97, 30, 33, -90, 270))] },
  { id: '9', ch: '9', voice: 'd_9', strokes: [cat(A(50, 44, 28, 32, 0, -360), L([78, 44], [60, 130]))] },
  { id: '10', ch: '10', voice: 'd_10', strokes: [L([8, 36], [28, 12], [28, 130]), A(68, 70, 24, 58, -90, 270)] },
];

export const LETTERS: Glyph[] = [
  { id: 'a', ch: 'А', voice: 'lt_a', emoji: '🍉', strokes: [L([15, 130], [50, 12], [85, 130]), L([30, 88], [70, 88])] },
  { id: 'b', ch: 'Б', voice: 'lt_b', emoji: '🍌', strokes: [L([78, 12], [25, 12], [25, 130]), BOWL(70, 130)] },
  { id: 'v', ch: 'В', voice: 'lt_v', emoji: '🍇', strokes: [L([25, 130], [25, 12]), cat(L([25, 12], [52, 12]), A(52, 38, 24, 26, -90, 90), L([25, 64])), cat(L([25, 64], [56, 64]), A(56, 97, 28, 33, -90, 90), L([25, 130]))] },
  { id: 'g', ch: 'Г', voice: 'lt_g', emoji: '🍄', strokes: [L([80, 12], [25, 12], [25, 130])] },
  { id: 'd', ch: 'Д', voice: 'lt_d', emoji: '🏠', strokes: [L([22, 112], [40, 12], [72, 12], [72, 112]), L([10, 132], [10, 112], [88, 112], [88, 132])] },
  { id: 'ye', ch: 'Е', voice: 'lt_ye', emoji: '🦝', strokes: [L([80, 12], [25, 12], [25, 130], [80, 130]), L([25, 70], [70, 70])] },
  { id: 'yo', ch: 'Ё', voice: 'lt_yo', emoji: '🦔', strokes: [L([80, 12], [25, 12], [25, 130], [80, 130]), L([25, 70], [70, 70]), L([38, -4]), L([66, -4])] },
  { id: 'zh', ch: 'Ж', voice: 'lt_zh', emoji: '🦒', strokes: [L([50, 12], [50, 130]), L([12, 12], [50, 70], [12, 130]), L([88, 12], [50, 70], [88, 130])] },
  { id: 'z', ch: 'З', voice: 'lt_z', emoji: '🐰', strokes: [DIGIT_3] },
  { id: 'i', ch: 'И', voice: 'lt_i', emoji: '🦃', strokes: [L([22, 12], [22, 130], [78, 12], [78, 130])] },
  { id: 'ik', ch: 'Й', voice: 'lt_ik', emoji: '🥛', strokes: [L([22, 12], [22, 130], [78, 12], [78, 130]), A(50, -6, 14, 8, 180, 0)] },
  { id: 'k', ch: 'К', voice: 'lt_k', emoji: '🐱', strokes: [L([25, 12], [25, 130]), L([80, 12], [25, 76], [82, 130])] },
  { id: 'l', ch: 'Л', voice: 'lt_l', emoji: '🦁', strokes: [L([12, 130], [44, 12], [80, 12], [80, 130])] },
  { id: 'm', ch: 'М', voice: 'lt_m', emoji: '⚽', strokes: [L([14, 130], [22, 12], [50, 96], [78, 12], [86, 130])] },
  { id: 'n', ch: 'Н', voice: 'lt_n', emoji: '🧦', strokes: [L([22, 12], [22, 130]), L([78, 12], [78, 130]), L([22, 70], [78, 70])] },
  { id: 'o', ch: 'О', voice: 'lt_o', emoji: '☁️', strokes: [A(50, 70, 34, 58, -90, 270)] },
  { id: 'p', ch: 'П', voice: 'lt_p', emoji: '🐧', strokes: [L([22, 130], [22, 12], [78, 12], [78, 130])] },
  { id: 'r', ch: 'Р', voice: 'lt_r', emoji: '🐟', strokes: [L([25, 130], [25, 12]), cat(L([25, 12], [52, 12]), A(52, 40, 26, 28, -90, 90), L([25, 68]))] },
  { id: 's', ch: 'С', voice: 'lt_s', emoji: '☀️', strokes: [A(54, 70, 36, 58, -40, -320)] },
  { id: 't', ch: 'Т', voice: 'lt_t', emoji: '🎂', strokes: [L([14, 12], [86, 12]), L([50, 12], [50, 130])] },
  { id: 'u', ch: 'У', voice: 'lt_u', emoji: '🦆', strokes: [L([15, 12], [50, 86]), L([85, 12], [42, 130], [24, 128])] },
  { id: 'f', ch: 'Ф', voice: 'lt_f', emoji: '🔦', strokes: [L([50, 8], [50, 132]), A(50, 60, 38, 28, -90, 270)] },
  { id: 'h', ch: 'Х', voice: 'lt_h', emoji: '🍞', strokes: [L([18, 12], [82, 130]), L([82, 12], [18, 130])] },
  { id: 'ts', ch: 'Ц', voice: 'lt_ts', emoji: '🌸', strokes: [L([20, 12], [20, 116], [76, 116], [76, 12]), L([76, 116], [88, 116], [88, 136])] },
  { id: 'ch', ch: 'Ч', voice: 'lt_ch', emoji: '⏰', strokes: [cat(L([24, 12], [24, 50]), A(44, 50, 20, 22, 180, 90), L([78, 72])), L([78, 12], [78, 130])] },
  { id: 'sh', ch: 'Ш', voice: 'lt_sh', emoji: '🎈', strokes: [L([14, 12], [14, 130], [86, 130], [86, 12]), L([50, 12], [50, 130])] },
  { id: 'sch', ch: 'Щ', voice: 'lt_sch', emoji: '🐶', strokes: [L([12, 12], [12, 118], [80, 118], [80, 12]), L([46, 12], [46, 118]), L([80, 118], [92, 118], [92, 138])] },
  { id: 'hard', ch: 'Ъ', voice: 'lt_hard', strokes: [L([8, 12], [30, 12], [30, 130]), BOWL(70, 130, 30, 58)] },
  { id: 'y', ch: 'Ы', voice: 'lt_y', emoji: '🧀', strokes: [L([16, 12], [16, 130]), cat(L([16, 70], [38, 70]), A(38, 100, 22, 30, -90, 90), L([16, 130])), L([86, 12], [86, 130])] },
  { id: 'soft', ch: 'Ь', voice: 'lt_soft', strokes: [L([25, 12], [25, 130]), BOWL(70, 130)] },
  { id: 'e', ch: 'Э', voice: 'lt_e', emoji: '🚜', strokes: [A(46, 70, 36, 58, -140, 140), L([42, 70], [82, 70])] },
  { id: 'yu', ch: 'Ю', voice: 'lt_yu', emoji: '🪀', strokes: [L([12, 12], [12, 130]), L([12, 70], [36, 70]), A(64, 70, 26, 58, -90, 270)] },
  { id: 'ya', ch: 'Я', voice: 'lt_ya', emoji: '🍎', strokes: [cat(L([76, 130], [76, 12], [48, 12]), A(48, 40, 26, 28, -90, -270), L([76, 68])), L([50, 68], [22, 130])] },
];

/** Точки вдоль штриха с шагом ~step. */
export const dotsFor = (stroke: Pt[], step = 13): Pt[] => {
  if (stroke.length === 1) return [stroke[0]];
  const out: Pt[] = [stroke[0]];
  let carry = 0;
  for (let i = 1; i < stroke.length; i++) {
    const [x0, y0] = stroke[i - 1], [x1, y1] = stroke[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    let t = step - carry;
    while (t <= seg) { out.push([x0 + ((x1 - x0) * t) / seg, y0 + ((y1 - y0) * t) / seg]); t += step; }
    carry = seg - (t - step);
  }
  const last = stroke[stroke.length - 1];
  const prev = out[out.length - 1];
  if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > step * 0.45) out.push(last);
  return out;
};
