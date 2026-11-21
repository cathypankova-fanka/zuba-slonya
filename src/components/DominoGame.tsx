import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, sparkleBurst } from './CookKit';
import { say } from './PlayKit';

/**
 * Домино: цепочки уже выставлены (змейка, спираль, развилка, сердечко, лесенка…).
 * Толкни любую костяшку — дальше всё падает красиво по цепочке, а в конце сюрприз (колокольчик, шарики, подарок).
 */

interface Dom { x: number; y: number; a: number; c: string; s: number; next: number[] }
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

function buildLevel(n: number, W: number, H: number): Level {
  const m = Math.min(W, H);
  const step = Math.min(m * 0.085, Math.max(W, H) * 0.05);
  const cx = W / 2, cy = H / 2;
  const kind = n % 5;
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
  // лесенка: от крошечных до огромных
  const doms = along((t) => [W * 0.08 + t * W * 0.78, H * 0.78 - t * H * 0.5 + Math.sin(t * Math.PI * 2) * H * 0.08], step * 1.15, (i) => RAINBOW[i % RAINBOW.length], (i, k) => 0.55 + (i / Math.max(1, k - 1)) * 1.1);
  const L = doms[doms.length - 1];
  return { doms, prizes: [{ x: L.x + step * 1.2, y: L.y - step * 0.6, icon: '⭐', done: '🌟' }], prizeAt: { [doms.length - 1]: 0 } };
}

const PIPS: Record<number, [number, number][]> = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]] };

export const DominoGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ soundEnabled }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [level, setLevel] = useState(0);
  const [fallen, setFallen] = useState<Set<number>>(new Set());
  const [won, setWon] = useState<Set<number>>(new Set());
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
    if (dim.h <= dim.w * 1.1 || level % 5 === 3) return buildLevel(level, dim.w, dim.h); // сердечко не поворачиваем
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
      soundEngine.playClack(soundEnabled, count.current++);
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

  const go = (d: number) => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; fallenRef.current = new Set(); setFallen(new Set()); setWon(new Set()); setLevel((l) => l + d); };

  const step = dim ? Math.min(Math.min(dim.w, dim.h) * 0.085, Math.max(dim.w, dim.h) * 0.05) : 20;
  const firstRef = useRef<HTMLDivElement>(null);

  return (
    <CookScreen stepKey="domino" stepIdx={level % 5} total={5} done={false}
      bg="linear-gradient(#FDF2F8 0%, #FCE7F3 40%, #E9D5FF 100%)">
      <div className="relative w-full h-full flex flex-col items-center">
        <div ref={stageRef} className="relative flex-1 w-[94%] my-[2vmin] rounded-[2rem] overflow-hidden" style={{ background: 'repeating-linear-gradient(45deg, #FDE68A 0 18px, #FCD34D 18px 36px)', boxShadow: 'inset 0 0 0 6px #fff, 0 10px 24px rgba(0,0,0,.18)' }}>
          {L && L.doms.map((d, i) => {
            const down = fallen.has(i);
            const w = step * 0.72 * d.s, h = step * 1.25 * d.s;
            return (
              <div key={i} ref={i === 0 ? firstRef : undefined} onPointerDown={() => push(i)}
                className="absolute cursor-pointer" style={{ left: d.x, top: d.y, width: Math.max(w, 26), height: Math.max(w, 26), transform: 'translate(-50%,-50%)', touchAction: 'none', zIndex: 2 }}>
                <div className="absolute left-1/2 bottom-1/2" style={{
                  width: w, height: h, marginLeft: -w / 2,
                  transformOrigin: '50% 100%',
                  transform: `rotate(${d.a + Math.PI / 2}rad) scaleY(${down ? 1 : 0.2})`,
                  transition: 'transform .2s cubic-bezier(.55,0,.9,.5)',
                  background: down ? '#FFFFFF' : d.c, borderRadius: w * 0.18,
                  border: `${Math.max(2, w * 0.08)}px solid ${d.c}`,
                  boxShadow: down ? '0 2px 3px rgba(0,0,0,.25)' : `${w * 0.15}px ${w * 0.35}px 0 rgba(0,0,0,.28)`,
                }}>
                  {down && <span className="absolute left-[10%] right-[10%] top-1/2 h-[3%] bg-black/30" />}
                  {down && [0, 1].map((half) => (PIPS[1 + ((i + half) % 3)]).map(([px, py], k) => (
                    <span key={`${half}-${k}`} className="absolute rounded-full bg-black/75" style={{ width: '16%', aspectRatio: '1', left: `${px * 0.8 + 2}%`, top: `${half * 50 + py * 0.42 + 2}%` }} />
                  )))}
                </div>
                {i === 0 && !down && <span className="absolute -top-[90%] left-1/2 -translate-x-1/2 text-[min(6vmin,32px)] animate-bounce pointer-events-none">👇</span>}
              </div>
            );
          })}
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
