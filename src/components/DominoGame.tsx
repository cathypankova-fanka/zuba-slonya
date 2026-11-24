import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, sparkleBurst } from './CookKit';
import { say } from './PlayKit';

/**
 * Домино: цепочки уже выставлены (змейка, спираль, развилка, сердечко, лесенка…).
 * Толкни любую костяшку — дальше всё падает красиво по цепочке, а в конце сюрприз (колокольчик, шарики, подарок).
 */

/** вид звена цепочки: костяшка домино, книжка, кубик с буквой, карандаш, игрушка/кегля (эмодзи) или желобок, по которому катится шарик */
type Kind = 'domino' | 'book' | 'block' | 'crayon' | 'toy' | 'track';
interface Dom { x: number; y: number; a: number; c: string; s: number; next: number[]; t?: Kind; e?: string }
interface Prize { x: number; y: number; icon: string; done: string }
interface Level { doms: Dom[]; prizes: Prize[]; prizeAt: Record<number, number> }

const RAINBOW = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#06B6D4', '#3B82F6', '#A855F7', '#EC4899'];

/** расставить костяшки вдоль кривой f(t), t∈[0,1], с шагом step (в px) */
function along(f: (t: number) => [number, number], step: number, color: (i: number) => string, size: (i: number, n: number) => number = () => 1): Dom[] {
  const pts: [number, number][] = [];
  let prev = f(0), acc = step;
  for (let k = 0; k <= 2000; k++) {
    const p = f(k / 2000);
    acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    if (acc >= step) { pts.push(p); acc = 0; }
    prev = p;
  }
  return pts.map((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    return { x: p[0], y: p[1], a: Math.atan2(q[1] - o[1], q[0] - o[0]), c: color(i), s: size(i, pts.length), next: i + 1 < pts.length ? [i + 1] : [] };
  });
}

/** склеить отрезки цепочки: последний элемент каждого толкает первый следующего */
function chain(...parts: Dom[][]): Dom[] {
  const out: Dom[] = [];
  parts.forEach((part, pi) => {
    const base = out.length;
    part.forEach((d, i) => out.push({ ...d, next: d.next.map((j) => j + base) }));
    if (pi > 0 && base > 0) out[base - 1].next = [...out[base - 1].next, base];
  });
  return out;
}
const as = (doms: Dom[], t: Kind, e?: (i: number) => string): Dom[] => doms.map((d, i) => ({ ...d, t, e: e?.(i) }));
const LEVELS = 12;
const BOOK_C = ['#B91C1C', '#1D4ED8', '#15803D', '#7E22CE', '#C2410C', '#0F766E'];
const LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФ';
const TOYS = ['🧸', '🦆', '🐰', '🚂', '🪀', '🦒', '🐢', '🚗'];

function buildLevel(n: number, W: number, H: number): Level {
  const m = Math.min(W, H);
  const step = Math.min(m * 0.085, Math.max(W, H) * 0.05);
  const cx = W / 2, cy = H / 2;
  const kind = n % LEVELS;
  if (kind === 0) { // змейка
    const doms = along((t) => [W * 0.1 + t * W * 0.8, cy + Math.sin(t * Math.PI * 3) * H * 0.26], step, (i) => RAINBOW[Math.floor(i / 3) % RAINBOW.length]);
    const L = doms[doms.length - 1];
    return { doms, prizes: [{ x: L.x + step * 0.9, y: L.y, icon: '🔔', done: '🎶' }], prizeAt: { [doms.length - 1]: 0 } };
  }
  if (kind === 1) { // спираль внутрь
    const R = m * 0.44;
    const doms = along((t) => { const ang = t * Math.PI * 5.2, r = R * (1 - t * 0.78); return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; }, step, (i) => RAINBOW[i % RAINBOW.length]);
    return { doms, prizes: [{ x: cx, y: cy, icon: '🎁', done: '🧸' }], prizeAt: { [doms.length - 1]: 0 } };
  }
  if (kind === 2) { // развилка: ствол и две ветки → два шарика
    const trunk = along((t) => [W * 0.12 + t * W * 0.34, cy], step, () => '#3B82F6');
    const bx = trunk[trunk.length - 1].x, by = cy;
    const up = along((t) => [bx + step + t * W * 0.38, by - Math.sin(t * Math.PI / 2) * H * 0.3], step, () => '#EC4899');
    const dn = along((t) => [bx + step + t * W * 0.38, by + Math.sin(t * Math.PI / 2) * H * 0.3], step, () => '#22C55E');
    const doms = [...trunk];
    const u0 = doms.length; doms.push(...up.map((d, i) => ({ ...d, next: i + 1 < up.length ? [u0 + i + 1] : [] })));
    const d0 = doms.length; doms.push(...dn.map((d, i) => ({ ...d, next: i + 1 < dn.length ? [d0 + i + 1] : [] })));
    doms[trunk.length - 1].next = [u0, d0];
    const U = doms[d0 - 1], D = doms[doms.length - 1];
    return { doms, prizes: [{ x: U.x + step, y: U.y - step * 0.3, icon: '🎈', done: '🎉' }, { x: D.x + step, y: D.y + step * 0.3, icon: '🎈', done: '🎉' }], prizeAt: { [d0 - 1]: 0, [doms.length - 1]: 1 } };
  }
  if (kind === 3) { // сердечко
    const s = m * 0.026;
    const doms = along((t) => {
      const u = Math.PI * (0.5 + t * 1.98);
      const x = 16 * Math.sin(u) ** 3, y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
      return [cx + x * s, cy - y * s + s * 2];
    }, step, () => '#EF4444');
    const L = doms[doms.length - 1];
    return { doms, prizes: [{ x: cx, y: cy + s * 2, icon: '💝', done: '💖' }], prizeAt: { [doms.length - 1]: 0 } };
  }
  if (kind === 4) { // лесенка: от крошечных до огромных
    const doms = along((t) => [W * 0.08 + t * W * 0.78, H * 0.78 - t * H * 0.5 + Math.sin(t * Math.PI * 2) * H * 0.08], step * 1.15, (i) => RAINBOW[i % RAINBOW.length], (i, k) => 0.55 + (i / Math.max(1, k - 1)) * 1.1);
    const L = doms[doms.length - 1];
    return { doms, prizes: [{ x: L.x + step * 1.2, y: L.y - step * 0.6, icon: '⭐', done: '🌟' }], prizeAt: { [doms.length - 1]: 0 } };
  }
  const end = (doms: Dom[], icon: string, done: string, dx = -0.4, dy = -1.5): Level => {
    const L = doms[doms.length - 1];
    return { doms, prizes: [{ x: L.x + step * dx, y: L.y + step * dy, icon, done }], prizeAt: { [doms.length - 1]: 0 } };
  };
  if (kind === 5) { // книжная полка волной
    const doms = as(along((t) => [W * 0.08 + t * W * 0.76, cy + Math.sin(t * Math.PI * 2) * H * 0.22], step * 0.8, (i) => BOOK_C[i % BOOK_C.length], (i) => 0.9 + (i % 3) * 0.12), 'book');
    return end(doms, '🦉', '📚', -0.6, -1.4);
  }
  if (kind === 6) { // кубики с буквами по кругу
    const R = m * 0.36;
    const doms = as(along((t) => { const a = -Math.PI / 2 + t * Math.PI * 1.85; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; }, step * 1.05, (i) => RAINBOW[i % RAINBOW.length]), 'block', (i) => LETTERS[i % LETTERS.length]);
    return { doms, prizes: [{ x: cx, y: cy, icon: '🎂', done: '🎉' }], prizeAt: { [doms.length - 1]: 0 } };
  }
  if (kind === 7) { // домино → шарик катится по желобку → кегли
    const a = along((t) => [W * 0.08 + t * W * 0.3, H * 0.2 + t * H * 0.1], step, (i) => RAINBOW[i % RAINBOW.length]);
    const b = as(along((t) => [W * 0.4 + t * W * 0.3, H * 0.3 + Math.sin(t * Math.PI) * H * 0.35], step * 0.45, () => '#94A3B8'), 'track');
    const c = as(along((t) => [W * 0.72 + t * W * 0.12, H * 0.32 + t * H * 0.3], step * 0.9, () => '#fff'), 'toy', () => 'pin');
    return end(chain(a, b, c), '🏆', '🥇', -1.2, -0.6);
  }
  if (kind === 8) { // карандаши зигзагом
    const doms = as(along((t) => [W * 0.08 + t * W * 0.78, cy + (Math.abs(((t * 4 + 1) % 2) - 1) - 0.5) * H * 0.6], step * 0.75, (i) => RAINBOW[i % RAINBOW.length]), 'crayon');
    return end(doms, '🎨', '🌈', 0.2, 1.4);
  }
  if (kind === 9) { // игрушки по большой дуге
    const doms = as(along((t) => [W * 0.1 + t * W * 0.72, H * 0.8 - Math.sin(t * Math.PI) * H * 0.6], step * 1.15, () => '#fff'), 'toy', (i) => TOYS[i % TOYS.length]);
    return end(doms, '🎪', '🎉', -0.4, -1.6);
  }
  if (kind === 10) { // смешанная: книжки → кубики → шарик → домино → шарики-сюрприз
    const a = as(along((t) => [W * 0.07 + t * W * 0.25, H * 0.25], step * 0.8, (i) => BOOK_C[i % BOOK_C.length]), 'book');
    const b = as(along((t) => [W * 0.36 + t * W * 0.22, H * 0.25 + t * H * 0.12], step * 1.05, (i) => RAINBOW[i % RAINBOW.length]), 'block', (i) => LETTERS[(i + 5) % LETTERS.length]);
    const c = as(along((t) => [W * 0.6 + Math.sin(t * Math.PI) * W * 0.25, H * 0.4 + t * H * 0.25], step * 0.45, () => '#94A3B8'), 'track');
    const d = along((t) => [W * 0.6 - t * W * 0.45, H * 0.68 + Math.sin(t * Math.PI * 2) * H * 0.08], step, (i) => RAINBOW[(i * 2) % RAINBOW.length]);
    return end(chain(a, b, c, d), '🎈', '🎉', -1, 0);
  }
  // 11: двойная спираль из кубиков и карандашей, в середине — фейерверк
  const R = m * 0.42;
  const a = as(along((t) => { const ang = t * Math.PI * 2.6, r = R * (1 - t * 0.55); return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; }, step * 1.05, (i) => RAINBOW[i % RAINBOW.length]), 'block', (i) => LETTERS[(i + 10) % LETTERS.length]);
  const L0 = a[a.length - 1];
  const b = as(along((t) => [L0.x + (cx - L0.x) * t, L0.y + (cy - L0.y) * t], step * 0.75, (i) => RAINBOW[(i + 3) % RAINBOW.length]), 'crayon');
  const mid = b.slice(1, -1).map((d, i, arr) => ({ ...d, next: i + 1 < arr.length ? [i + 1] : [] }));
  const doms = chain(a, mid);
  return { doms, prizes: [{ x: cx, y: cy, icon: '🧨', done: '🎆' }], prizeAt: { [doms.length - 1]: 0 } };
}

const PIPS: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]] };

export const DominoGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ soundEnabled }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [level, setLevel] = useState(0);
  const [fallen, setFallen] = useState<Set<number>>(new Set());
  const [won, setWon] = useState<Set<number>>(new Set());
  const [ballAt, setBallAt] = useState<number | null>(null); // где сейчас катящийся шарик (индекс желобка)
  const timers = useRef<number[]>([]);
  const count = useRef(0);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const upd = () => { const r = el.getBoundingClientRect(); setDim({ w: r.width, h: r.height }); };
    upd();
    const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { say('dm_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // на высоком экране строим цепочку «лёжа» и поворачиваем — так она занимает весь экран
  const L = useMemo(() => {
    if (!dim) return null;
    if (dim.h <= dim.w * 1.1 || [3, 6, 11].includes(level % LEVELS)) return buildLevel(level, dim.w, dim.h); // сердечко и круги не поворачиваем
    const t = buildLevel(level, dim.h, dim.w);
    return {
      doms: t.doms.map((d) => ({ ...d, x: d.y, y: d.x, a: Math.PI / 2 - d.a })),
      prizes: t.prizes.map((p) => ({ ...p, x: p.y, y: p.x })),
      prizeAt: t.prizeAt,
    };
  }, [level, dim]);
  const allDown = !!L && fallen.size === L.doms.length;

  const fallenRef = useRef<Set<number>>(new Set());
  const LRef = useRef<Level | null>(null);
  LRef.current = L;
  const topple = (i: number, delay: number) => {
    const t = window.setTimeout(() => {
      const lv = LRef.current;
      if (!lv || fallenRef.current.has(i)) return;
      fallenRef.current.add(i);
      setFallen(new Set(fallenRef.current));
      if (lv.doms[i].t === 'track') { setBallAt(i); if (count.current % 3 === 0) soundEngine.playGamePop(soundEnabled, 1); count.current++; }
      else soundEngine.playClack(soundEnabled, count.current++);
      const pz = lv.prizeAt[i];
      if (pz !== undefined) {
        timers.current.push(window.setTimeout(() => {
          setWon((w) => new Set(w).add(pz));
          const r = stageRef.current?.getBoundingClientRect();
          const P = lv.prizes[pz];
          if (r) sparkleBurst(r.left + P.x, r.top + P.y, 26);
          [523, 659, 784, 1046].forEach((fq, k) => window.setTimeout(() => soundEngine.playXylo(soundEnabled, fq), k * 110));
        }, 220));
      }
      lv.doms[i].next.forEach((j, k) => topple(j, Math.max(32, 70 - count.current * 0.7) + k * 8));
    }, delay);
    timers.current.push(t);
  };
  const push = (i: number) => { if (fallenRef.current.has(i)) return; count.current = 0; topple(i, 0); };

  useEffect(() => {
    if (!allDown || !L || won.size < L.prizes.length) return;
    const t = window.setTimeout(() => { soundEngine.playGameReward(soundEnabled); }, 400);
    return () => window.clearTimeout(t);
  }, [allDown, won, L, soundEnabled]);

  const go = (d: number) => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; fallenRef.current = new Set(); setFallen(new Set()); setWon(new Set()); setBallAt(null); setLevel((l) => l + d); };

  const step = dim ? Math.min(Math.min(dim.w, dim.h) * 0.085, Math.max(dim.w, dim.h) * 0.05) : 20;
  const firstRef = useRef<HTMLDivElement>(null);

  return (
    <CookScreen stepKey="domino" stepIdx={level % LEVELS} total={LEVELS} done={false}
      bg="linear-gradient(#FDF2F8 0%, #FCE7F3 40%, #E9D5FF 100%)">
      <div className="relative w-full h-full flex flex-col items-center">
        <div ref={stageRef} className="relative flex-1 w-[94%] my-[2vmin] rounded-[2rem] overflow-hidden" style={{ background: 'repeating-linear-gradient(45deg, #FDE68A 0 18px, #FCD34D 18px 36px)', boxShadow: 'inset 0 0 0 6px #fff, 0 10px 24px rgba(0,0,0,.18)' }}>
          {L && L.doms.map((d, i) => {
            const down = fallen.has(i);
            const t = d.t ?? 'domino';
            const w = step * 0.72 * d.s, h = step * 1.25 * d.s;
            const rot = `rotate(${d.a + Math.PI / 2}rad)`;
            let body: React.ReactNode;
            if (t === 'track') {
              body = <span className="absolute left-1/2 top-1/2 rounded-full" style={{ width: step * 0.62, height: step * 0.62, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, #CBD5E1 0 40%, #94A3B8 70%)', boxShadow: 'inset 0 2px 3px rgba(0,0,0,.3)' }} />;
            } else if (t === 'toy' && d.e === 'pin') {
              const ph = step * 1.15 * d.s, pw = ph * 0.42;
              body = (
                <div className="absolute left-1/2 top-1/2" style={{ width: pw, height: ph, marginLeft: -pw / 2, marginTop: -ph * 0.8, transformOrigin: '50% 85%', transform: `rotate(${down ? (Math.cos(d.a) >= 0 ? 90 : -90) : 0}deg)`, transition: 'transform .25s cubic-bezier(.55,0,.9,.5)', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.3))' }}>
                  <div className="absolute left-[22%] right-[22%] top-0 h-[32%] rounded-full bg-white border border-[#CBD5E1]" />
                  <div className="absolute left-[30%] right-[30%] top-[26%] h-[14%] bg-white" />
                  <div className="absolute left-0 right-0 top-[36%] bottom-0 rounded-[50%_50%_40%_40%] bg-white border border-[#CBD5E1]" />
                  <div className="absolute left-[24%] right-[24%] top-[30%] h-[6%] bg-[#EF4444]" />
                  <div className="absolute left-[10%] right-[10%] top-[44%] h-[6%] bg-[#EF4444]" />
                </div>
              );
            } else if (t === 'toy') {
              body = <span className="absolute left-1/2 top-1/2 leading-none select-none" style={{ fontSize: step * 1.05 * d.s, transform: `translate(-50%,-60%) rotate(${down ? (Math.cos(d.a) >= 0 ? 90 : -90) : 0}deg) translateY(${down ? '20%' : '0'})`, transition: 'transform .25s cubic-bezier(.55,0,.9,.5)', filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.3))' }}>{d.e}</span>;
            } else if (t === 'block') {
              const bs = step * 0.82 * d.s;
              body = (
                <div className="absolute left-1/2 top-1/2 flex items-center justify-center font-black text-white" style={{
                  width: bs, height: bs, marginLeft: -bs / 2, marginTop: -bs / 2, borderRadius: bs * 0.16,
                  background: `linear-gradient(145deg, color-mix(in srgb, ${d.c} 75%, #fff), ${d.c})`, border: `${Math.max(2, bs * 0.07)}px solid #FDE68A`,
                  transform: `${rot} ${down ? 'translateY(-55%) scale(1)' : 'scale(.82)'} rotate(${down ? 0 : -90}deg)`, transition: 'transform .22s cubic-bezier(.55,0,.9,.5)',
                  fontSize: bs * 0.62, boxShadow: down ? '0 2px 3px rgba(0,0,0,.25)' : `${bs * 0.1}px ${bs * 0.2}px 0 rgba(0,0,0,.25)`, textShadow: '0 2px 0 rgba(0,0,0,.25)',
                }}><span style={{ transform: `rotate(${-(d.a + Math.PI / 2)}rad)` }}>{d.e}</span></div>
              );
            } else {
              // домино, книжка, карандаш: стоят — вид сверху тонкой полоской, падают — ложатся во всю длину
              const bw = t === 'crayon' ? w * 0.42 : t === 'book' ? w * 0.85 : w;
              const bh = t === 'crayon' ? h * 1.25 : t === 'book' ? h * 1.15 : h;
              const look: React.CSSProperties = t === 'book'
                ? { background: down ? `linear-gradient(90deg, ${d.c} 0 82%, #FEF3C7 82%)` : d.c, borderRadius: bw * 0.12, border: `2px solid color-mix(in srgb, ${d.c} 60%, #000)` }
                : t === 'crayon'
                  ? { background: `linear-gradient(90deg, color-mix(in srgb, ${d.c} 70%, #000), ${d.c} 40%, color-mix(in srgb, ${d.c} 70%, #fff))`, borderRadius: `${bw}px ${bw}px ${bw * 0.25}px ${bw * 0.25}px`, clipPath: down ? 'polygon(50% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)' : 'none' }
                  : { background: down ? '#FFFFFF' : d.c, borderRadius: bw * 0.18, border: `${Math.max(2, bw * 0.08)}px solid ${d.c}` };
              body = (
                <div className="absolute left-1/2 bottom-1/2" style={{
                  width: bw, height: bh, marginLeft: -bw / 2, transformOrigin: '50% 100%',
                  transform: `${rot} scaleY(${down ? 1 : 0.2})`, transition: 'transform .2s cubic-bezier(.55,0,.9,.5)',
                  boxShadow: down ? '0 2px 3px rgba(0,0,0,.25)' : `${bw * 0.15}px ${bw * 0.35}px 0 rgba(0,0,0,.28)`, ...look,
                }}>
                  {t === 'domino' && down && <span className="absolute left-[10%] right-[10%] top-1/2 h-[3%] bg-black/30" />}
                  {t === 'domino' && down && [0, 1].map((half) => (PIPS[1 + ((i + half) % 3)]).map(([px, py], k) => (
                    <span key={`${half}-${k}`} className="absolute rounded-full bg-black/75" style={{ width: '16%', aspectRatio: '1', left: `${px * 0.8 + 2}%`, top: `${half * 50 + py * 0.42 + 2}%` }} />
                  )))}
                  {t === 'book' && down && <span className="absolute left-[12%] right-[30%] top-[18%] h-[10%] rounded bg-white/70" />}
                </div>
              );
            }
            return (
              <div key={i} ref={i === 0 ? firstRef : undefined} onPointerDown={() => push(i)}
                className="absolute cursor-pointer" style={{ left: d.x, top: d.y, width: Math.max(w, 26), height: Math.max(w, 26), transform: 'translate(-50%,-50%)', touchAction: 'none', zIndex: t === 'track' ? 1 : 2 }}>
                {body}
                {i === 0 && !down && <span className="absolute -top-[90%] left-1/2 -translate-x-1/2 text-[min(6vmin,32px)] animate-bounce pointer-events-none">👇</span>}
              </div>
            );
          })}
          {L && ballAt !== null && L.doms[ballAt] && (
            <span className="absolute rounded-full pointer-events-none" style={{
              left: L.doms[ballAt].x, top: L.doms[ballAt].y, width: step * 0.62, height: step * 0.62, transform: 'translate(-50%,-50%)', zIndex: 4,
              background: 'radial-gradient(circle at 35% 30%, #fff 0 14%, #EF4444 45%, #7F1D1D 110%)', transition: 'left .06s linear, top .06s linear', boxShadow: '0 3px 4px rgba(0,0,0,.3)',
            }} />
          )}
          {L && L.prizes.map((p, k) => (
            <div key={k} className="absolute pointer-events-none" style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)', fontSize: step * 1.7, zIndex: 3, animation: won.has(k) ? 'r-zoom 1s ease-out' : 'gentle-float 2.4s ease-in-out infinite' }}>
              {won.has(k) ? p.done : p.icon}
            </div>
          ))}
        </div>
        {/* кнопки: заново / следующая цепочка */}
        <div className="flex gap-[4vmin] pb-[max(5vh,40px)]">
          <button type="button" aria-label="Расставить заново" onClick={() => go(0)} className="rounded-full bg-white shadow-xl active:scale-90 transition-transform flex items-center justify-center" style={{ width: 'min(15vmin, 88px)', height: 'min(15vmin, 88px)', fontSize: 'min(8vmin, 44px)' }}>🔄</button>
          <button type="button" aria-label="Следующая цепочка" onClick={() => go(1)} className={`rounded-full bg-[#22C55E] text-white shadow-xl active:scale-90 transition-all flex items-center justify-center ${allDown ? 'animate-pulse scale-110' : ''}`} style={{ width: 'min(15vmin, 88px)', height: 'min(15vmin, 88px)', fontSize: 'min(8vmin, 44px)' }}>➡️</button>
        </div>
      </div>
      <GestureHint show={fallen.size === 0} kind="tap" target={firstRef} />
    </CookScreen>
  );
};
