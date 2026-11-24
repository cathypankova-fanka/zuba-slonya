import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, GestureHint, sparkleBurst } from './CookKit';
import { say } from './PlayKit';

/**
 * Шарики (marble run): готовые горки с колокольчиками-ксилофоном. Нажимаешь на цветной шарик сверху — он катится,
 * разгоняется на спусках, звенит на каждом колокольчике и падает в баночку. На развилке стрелку можно переключать.
 */

type Pt = [number, number];
interface Seg { pts: Pt[]; next?: string; sw?: { id: string; a: string; b: string }; cup?: number }
interface Bell { seg: string; at: number; f: number; c: string }
interface Board { segs: Record<string, Seg>; start: string; bells: Bell[]; cups: { x: number; y: number; c: string }[]; switches: { id: string; x: number; y: number }[] }

const NOTES = [523, 587, 659, 784, 880, 1046, 1175, 1319];
const BELL_C = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#06B6D4', '#3B82F6', '#A855F7', '#EC4899'];
const BALLS = ['#EF4444', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#F97316'];

/** точки поворотов полилинии → колокольчики на каждом углу */
const bellsOn = (seg: string, pts: Pt[], from = 0, notes = NOTES): Bell[] => {
  let total = 0; const acc = [0];
  for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(total); }
  // по одному колокольчику на поворот (два близких угла — один поворот)
  const out: Bell[] = [];
  let lastP: Pt | null = null;
  pts.slice(1, -1).forEach((p, k) => {
    if (lastP && Math.hypot(p[0] - lastP[0], p[1] - lastP[1]) < 0.09) return;
    lastP = p;
    const n = out.length;
    out.push({ seg, at: acc[k + 1] / total, f: notes[(from + n) % notes.length], c: BELL_C[(from + n) % BELL_C.length] });
  });
  return out;
};

const BOARDS: Board[] = (() => {
  // 1. зигзаг
  const z: Pt[] = [[0.5, 0.05], [0.5, 0.11], [0.86, 0.2], [0.9, 0.25], [0.14, 0.36], [0.1, 0.41], [0.86, 0.52], [0.9, 0.57], [0.14, 0.68], [0.1, 0.73], [0.62, 0.84], [0.66, 0.9]];
  // 2. развилка со стрелкой
  const t2: Pt[] = [[0.5, 0.05], [0.5, 0.1], [0.5, 0.2], [0.5, 0.3]];
  const L2: Pt[] = [[0.5, 0.3], [0.12, 0.4], [0.08, 0.45], [0.4, 0.56], [0.44, 0.6], [0.1, 0.72], [0.18, 0.9]];
  const R2: Pt[] = [[0.5, 0.3], [0.88, 0.4], [0.92, 0.45], [0.6, 0.56], [0.56, 0.6], [0.9, 0.72], [0.82, 0.9]];
  // 3. лесенка-водопад: короткие ступеньки и падения
  const st: Pt[] = [[0.5, 0.05], [0.5, 0.1]];
  for (let k = 0; k < 6; k++) {
    const y = 0.14 + k * 0.12, dir = k % 2 ? -1 : 1;
    const x0 = k === 0 ? 0.5 : st[st.length - 1][0];
    st.push([x0, y], [x0 + dir * 0.32, y + 0.04], [x0 + dir * 0.34, y + 0.1]);
  }
  st.push([st[st.length - 1][0], 0.9]);
  const boards: Board[] = [
    { segs: { a: { pts: z, cup: 0 } }, start: 'a', bells: bellsOn('a', z), cups: [{ x: 0.66, y: 0.93, c: '#60A5FA' }], switches: [] },
    {
      segs: { t: { pts: t2, sw: { id: 's', a: 'l', b: 'r' } }, l: { pts: L2, cup: 0 }, r: { pts: R2, cup: 1 } }, start: 't',
      bells: [...bellsOn('l', L2, 0, [392, 440, 494, 523, 587]), ...bellsOn('r', R2, 3, [784, 880, 988, 1046, 1175])],
      cups: [{ x: 0.18, y: 0.93, c: '#F472B6' }, { x: 0.82, y: 0.93, c: '#34D399' }], switches: [{ id: 's', x: 0.5, y: 0.3 }],
    },
    { segs: { a: { pts: st, cup: 0 } }, start: 'a', bells: bellsOn('a', st).filter((_, i) => i % 3 !== 0), cups: [{ x: st[st.length - 1][0], y: 0.93, c: '#FBBF24' }], switches: [] },
  ];

  // 4. слалом: шарик петляет из стороны в сторону, колокольчик в каждой крайней точке
  const sl: Pt[] = [[0.5, 0.05]];
  for (let k = 0; k <= 48; k++) { const t = k / 48; sl.push([0.5 + 0.36 * Math.sin(t * Math.PI * 7), 0.09 + t * 0.78]); }
  sl.push([0.5, 0.9]);
  const slBells: Bell[] = [];
  { let total = 0; const acc = [0]; for (let i = 1; i < sl.length; i++) { total += Math.hypot(sl[i][0] - sl[i - 1][0], sl[i][1] - sl[i - 1][1]); acc.push(total); }
    let n = 0; for (let i = 2; i < sl.length - 2; i++) { const d0 = sl[i][0] - sl[i - 1][0], d1 = sl[i + 1][0] - sl[i][0]; if (d0 * d1 < 0) { slBells.push({ seg: 'a', at: acc[i] / total, f: NOTES[n % NOTES.length], c: BELL_C[n % BELL_C.length] }); n++; } } }
  boards.push({ segs: { a: { pts: sl, cup: 0 } }, start: 'a', bells: slBells, cups: [{ x: 0.5, y: 0.93, c: '#A78BFA' }], switches: [] });

  // 5. мёртвая петля
  const lp: Pt[] = [[0.14, 0.05], [0.14, 0.1], [0.3, 0.3], [0.52, 0.66]];
  for (let k = 0; k <= 24; k++) { const a = Math.PI / 2 - (k / 24) * Math.PI * 2; lp.push([0.6 + Math.cos(a) * 0.16, 0.5 + Math.sin(a) * 0.16]); }
  lp.push([0.78, 0.7], [0.86, 0.8], [0.86, 0.88]);
  boards.push({ segs: { a: { pts: lp, cup: 0 } }, start: 'a', bells: [
    { seg: 'a', at: 0.12, f: 523, c: BELL_C[0] }, { seg: 'a', at: 0.45, f: 659, c: BELL_C[2] }, { seg: 'a', at: 0.62, f: 784, c: BELL_C[4] }, { seg: 'a', at: 0.78, f: 1046, c: BELL_C[6] },
  ], cups: [{ x: 0.86, y: 0.93, c: '#F87171' }], switches: [] });

  // 6. волны: три этажа холмиков
  const wv: Pt[] = [[0.08, 0.05], [0.08, 0.12]];
  [[0.18, 1], [0.45, -1], [0.72, 1]].forEach(([y0, dir], row) => {
    for (let k = 0; k <= 30; k++) { const t = k / 30; wv.push([dir === 1 ? 0.08 + t * 0.84 : 0.92 - t * 0.84, y0 + t * 0.1 - Math.abs(Math.sin(t * Math.PI * 3)) * 0.06]); }
    if (row < 2) wv.push([dir === 1 ? 0.92 : 0.08, y0 + 0.2]);
  });
  wv.push([0.86, 0.84], [0.84, 0.9]);
  const wvBells: Bell[] = [];
  { let total = 0; const acc = [0]; for (let i = 1; i < wv.length; i++) { total += Math.hypot(wv[i][0] - wv[i - 1][0], wv[i][1] - wv[i - 1][1]); acc.push(total); }
    let n = 0; for (let i = 2; i < wv.length - 2; i++) { if (wv[i][1] > wv[i - 1][1] && wv[i][1] >= wv[i + 1][1]) { wvBells.push({ seg: 'a', at: acc[i] / total, f: NOTES[(n * 2) % NOTES.length], c: BELL_C[n % BELL_C.length] }); n++; } } }
  boards.push({ segs: { a: { pts: wv, cup: 0 } }, start: 'a', bells: wvBells, cups: [{ x: 0.84, y: 0.93, c: '#34D399' }], switches: [] });

  // 7. двойная развилка: две стрелки, три баночки
  const t7: Pt[] = [[0.5, 0.05], [0.5, 0.12], [0.5, 0.2]];
  const l7: Pt[] = [[0.5, 0.2], [0.28, 0.34], [0.26, 0.44]];
  const ll7: Pt[] = [[0.26, 0.44], [0.08, 0.6], [0.12, 0.72], [0.14, 0.9]];
  const lr7: Pt[] = [[0.26, 0.44], [0.44, 0.6], [0.4, 0.72], [0.44, 0.9]];
  const r7: Pt[] = [[0.5, 0.2], [0.82, 0.36], [0.74, 0.52], [0.92, 0.7], [0.82, 0.9]];
  boards.push({
    segs: { t: { pts: t7, sw: { id: 's1', a: 'l', b: 'r' } }, l: { pts: l7, sw: { id: 's2', a: 'll', b: 'lr' } }, ll: { pts: ll7, cup: 0 }, lr: { pts: lr7, cup: 1 }, r: { pts: r7, cup: 2 } }, start: 't',
    bells: [...bellsOn('ll', ll7, 0, [392, 440, 494]), ...bellsOn('lr', lr7, 0, [587, 659, 698]), ...bellsOn('r', r7, 0, [784, 880, 1046, 1175])],
    cups: [{ x: 0.14, y: 0.93, c: '#F472B6' }, { x: 0.44, y: 0.93, c: '#60A5FA' }, { x: 0.82, y: 0.93, c: '#FBBF24' }],
    switches: [{ id: 's1', x: 0.5, y: 0.2 }, { id: 's2', x: 0.26, y: 0.44 }],
  });

  // 8. песенка: колокольчики на поворотах играют «Twinkle, Twinkle, Little Star»
  const tune = [523, 523, 784, 784, 880, 880, 784, 698, 698, 659, 659, 587, 587, 523];
  const sg: Pt[] = [[0.5, 0.05], [0.5, 0.08]];
  tune.forEach((_, k) => { sg.push([k % 2 ? 0.2 : 0.8, 0.12 + (k + 1) * 0.054]); });
  sg.push([0.5, 0.9]);
  const sgBells: Bell[] = [];
  { let total = 0; const acc = [0]; for (let i = 1; i < sg.length; i++) { total += Math.hypot(sg[i][0] - sg[i - 1][0], sg[i][1] - sg[i - 1][1]); acc.push(total); }
    tune.forEach((f, k) => sgBells.push({ seg: 'a', at: acc[k + 2] / total, f, c: BELL_C[k % BELL_C.length] })); }
  boards.push({ segs: { a: { pts: sg, cup: 0 } }, start: 'a', bells: sgBells, cups: [{ x: 0.5, y: 0.93, c: '#FDE047' }], switches: [] });

  // 9. гамма: длинный спуск до-ре-ми-фа-соль-ля-си-до
  const scale = [523, 587, 659, 698, 784, 880, 988, 1046];
  const gm: Pt[] = [[0.12, 0.05], [0.12, 0.1]];
  scale.forEach((_, k) => { const x = k % 2 ? 0.14 : 0.86; gm.push([x, 0.14 + k * 0.095], [x, 0.14 + k * 0.095 + 0.03]); });
  gm.push([0.5, 0.9]);
  const gmBells: Bell[] = [];
  { let total = 0; const acc = [0]; for (let i = 1; i < gm.length; i++) { total += Math.hypot(gm[i][0] - gm[i - 1][0], gm[i][1] - gm[i - 1][1]); acc.push(total); }
    scale.forEach((f, k) => gmBells.push({ seg: 'a', at: acc[2 + k * 2] / total, f, c: BELL_C[k % BELL_C.length] })); }
  boards.push({ segs: { a: { pts: gm, cup: 0 } }, start: 'a', bells: gmBells, cups: [{ x: 0.5, y: 0.93, c: '#22D3EE' }], switches: [] });

  return boards;
})();

interface Ball { id: number; seg: string; d: number; v: number; c: string }

export const MarbleRun: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ soundEnabled }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  const [bi, setBi] = useState(0);
  const [sw, setSw] = useState<Record<string, boolean>>({});
  const [cups, setCups] = useState<string[][]>([[], [], []]);
  const [lit, setLit] = useState<Record<number, number>>({});
  const balls = useRef<Ball[]>([]);
  const [, setTick] = useState(0);
  const idc = useRef(0);
  const switchSaid = useRef(false);
  const swRef = useRef(sw); swRef.current = sw;

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const upd = () => { const r = el.getBoundingClientRect(); setDim({ w: r.width, h: r.height }); };
    upd(); const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { say('mr_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const B = BOARDS[bi % BOARDS.length];
  // доска в пикселях: ширину ограничиваем, чтобы горка не растягивалась в «блин» на планшете
  const geo = useMemo(() => {
    if (!dim) return null;
    const bw = Math.min(dim.w, dim.h * 0.78), bh = dim.h, ox = (dim.w - bw) / 2;
    const P = (p: Pt): Pt => [ox + p[0] * bw, p[1] * bh];
    const segs: Record<string, { pts: Pt[]; acc: number[]; len: number }> = {};
    for (const [k, s] of Object.entries(B.segs)) {
      const pts = s.pts.map(P); const acc = [0];
      for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      segs[k] = { pts, acc, len: acc[acc.length - 1] };
    }
    return { P, segs, r: Math.min(bw, bh) * 0.046, bw, bh };
  }, [dim, B]);

  const at = (seg: string, d: number) => {
    const s = geo!.segs[seg];
    let i = 1; while (i < s.acc.length - 1 && s.acc[i] < d) i++;
    const a = s.pts[i - 1], b = s.pts[i], L = s.acc[i] - s.acc[i - 1] || 1, t = Math.min(1, Math.max(0, (d - s.acc[i - 1]) / L));
    const dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L;
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx, dy };
  };

  useEffect(() => {
    if (!geo) return;
    let raf = 0, last = performance.now();
    const G = geo.bh * 1.6;
    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      for (const b of [...balls.current]) {
        const p = at(b.seg, b.d);
        b.v = Math.min(geo.bh * 1.1, Math.max(geo.bh * 0.12, b.v + G * p.dy * dt - b.v * 0.25 * dt));
        const before = b.d / geo.segs[b.seg].len;
        b.d += b.v * dt;
        const after = b.d / geo.segs[b.seg].len;
        B.bells.forEach((bell, k) => {
          if (bell.seg === b.seg && before < bell.at && after >= bell.at) {
            soundEngine.playXylo(soundEnabled, bell.f);
            setLit((l) => ({ ...l, [k]: now }));
          }
        });
        const S = B.segs[b.seg];
        if (b.d >= geo.segs[b.seg].len) {
          const over = b.d - geo.segs[b.seg].len;
          const nxt = S.sw ? (swRef.current[S.sw.id] ? S.sw.b : S.sw.a) : S.next;
          if (nxt) { b.seg = nxt; b.d = over; }
          else {
            balls.current = balls.current.filter((z) => z !== b);
            const ci = S.cup ?? 0;
            setCups((c) => c.map((arr, k) => (k === ci ? [...arr, b.c].slice(-14) : arr)));
            const cup = B.cups[ci], r = stageRef.current?.getBoundingClientRect();
            if (r) { const q = geo.P([cup.x, cup.y]); sparkleBurst(r.left + q[0], r.top + q[1], 14); }
            soundEngine.playGamePop(soundEnabled, 6);
          }
        }
      }
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, soundEnabled]);

  const drop = (c: string) => {
    if (!geo || balls.current.length > 8) return;
    balls.current.push({ id: idc.current++, seg: B.start, d: 0, v: geo.bh * 0.15, c });
    soundEngine.playGamePop(soundEnabled, 2);
  };
  const nextBoard = () => { balls.current = []; setCups([[], [], []]); setLit({}); setSw({}); setBi((b) => b + 1); };
  const firstBall = useRef<HTMLButtonElement>(null);
  const now = performance.now();

  return (
    <CookScreen stepKey="marble" stepIdx={bi % BOARDS.length} total={BOARDS.length} done={false}
      bg="linear-gradient(#E0F2FE 0%, #DBEAFE 50%, #C7D2FE 100%)">
      <div className="relative w-full h-full flex flex-col items-center">
        {/* шарики-дозатор */}
        <div className="flex gap-[2vmin] pt-[max(52px,6vh)] pb-[1.5vmin] shrink-0 px-[40px] flex-wrap justify-center">
          {BALLS.map((c, k) => (
            <button key={c} ref={k === 0 ? firstBall : undefined} type="button" aria-label="Шарик" onPointerDown={(e) => { e.preventDefault(); drop(c); }}
              className="rounded-full active:scale-75 transition-transform touch-none"
              style={{ width: 'min(9vmin, 58px)', height: 'min(9vmin, 58px)', background: `radial-gradient(circle at 35% 30%, #fff 0 12%, ${c} 40%, #000a 120%)`, boxShadow: '0 6px 10px rgba(0,0,0,.25)' }} />
          ))}
        </div>
        <div ref={stageRef} className="relative flex-1 w-full mb-[max(4vh,30px)]">
          {geo && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${dim!.w} ${dim!.h}`}>
              {/* стойки-держатели */}
              {Object.values(geo.segs).flatMap((s) => s.pts.slice(1).map((p, k) => <line key={`${p[0]}-${k}`} x1={p[0]} y1={p[1] + geo.r} x2={p[0]} y2={p[1] + geo.r * 4} stroke="#94A3B8" strokeWidth={geo.r * 0.35} strokeLinecap="round" opacity={0.5} />))}
              {/* желобки */}
              {Object.entries(geo.segs).map(([k, s]) => (
                <g key={k}>
                  <polyline points={s.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#7C3AED" strokeWidth={geo.r * 1.3} strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={s.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#C4B5FD" strokeWidth={geo.r * 0.6} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ))}
              {/* колокольчики-пластинки */}
              {B.bells.map((bell, k) => {
                const p = at(bell.seg, bell.at * geo.segs[bell.seg].len);
                const on = lit[k] && now - lit[k] < 350;
                return (
                  <g key={k} transform={`translate(${p.x},${p.y - geo.r * 2.6}) scale(${on ? 1.35 : 1})`}>
                    <rect x={-geo.r * 1.4} y={-geo.r * 0.5} width={geo.r * 2.8} height={geo.r} rx={geo.r * 0.4} fill={bell.c} stroke="#fff" strokeWidth={2} />
                    {on && <circle r={geo.r * 2.2} fill="none" stroke={bell.c} strokeWidth={3} opacity={0.6} />}
                  </g>
                );
              })}
              {/* баночки */}
              {B.cups.map((c, k) => {
                const q = geo.P([c.x, c.y]); const w = geo.r * 5, h = geo.r * 4.2;
                return (
                  <g key={k}>
                    <rect x={q[0] - w / 2} y={q[1] - h * 0.55} width={w} height={h} rx={geo.r} fill={c.c} opacity={0.35} stroke="#fff" strokeWidth={3} />
                    {(cups[k] ?? []).map((bc, i) => <circle key={i} cx={q[0] - w / 2 + geo.r * (1 + (i % 4) * 1.0)} cy={q[1] + h * 0.45 - geo.r * (0.9 + Math.floor(i / 4) * 0.9)} r={geo.r * 0.55} fill={bc} />)}
                  </g>
                );
              })}
              {/* шарики */}
              {balls.current.map((b) => {
                const p = at(b.seg, b.d);
                const nx = p.dy, ny = -p.dx; // нормаль вверх
                const s = ny > 0 ? -1 : 1;
                return (
                  <g key={b.id} transform={`translate(${p.x + nx * geo.r * s * 0.9},${p.y + ny * geo.r * s * 0.9})`}>
                    <circle r={geo.r} fill={b.c} />
                    <circle r={geo.r * 0.35} cx={-geo.r * 0.35} cy={-geo.r * 0.35} fill="#fff" opacity={0.75} />
                  </g>
                );
              })}
            </svg>
          )}
          {/* стрелки-развилки: нажми, чтобы повернуть */}
          {geo && B.switches.map((s) => {
            const q = geo.P([s.x, s.y]);
            return (
              <button key={s.id} type="button" aria-label="Стрелка" onPointerDown={(e) => { e.preventDefault(); setSw((m) => ({ ...m, [s.id]: !m[s.id] })); soundEngine.playGameFlip(soundEnabled); if (!switchSaid.current) { switchSaid.current = true; say('mr_switch', soundEnabled); } }}
                className="absolute rounded-full bg-white shadow-xl border-4 border-[#FACC15] flex items-center justify-center active:scale-90 transition-transform touch-none"
                style={{ left: q[0], top: q[1] - geo.r * 3.4, width: geo.r * 3.4, height: geo.r * 3.4, transform: 'translate(-50%,-50%)', fontSize: geo.r * 2 }}>
                {sw[s.id] ? '➡️' : '⬅️'}
              </button>
            );
          })}
          <button type="button" aria-label="Другая горка" onClick={nextBoard}
            className="absolute right-[3%] top-[2%] rounded-full bg-[#22C55E] text-white shadow-xl active:scale-90 transition-transform flex items-center justify-center"
            style={{ width: 'min(13vmin, 76px)', height: 'min(13vmin, 76px)', fontSize: 'min(7vmin, 38px)' }}>➡️</button>
        </div>
      </div>
      <GestureHint show={cups.every((c) => c.length === 0) && balls.current.length === 0} kind="tap" target={firstBall} />
    </CookScreen>
  );
};
