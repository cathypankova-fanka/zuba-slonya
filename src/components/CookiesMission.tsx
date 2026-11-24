import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { BakeOven, CookScreen, GestureHint, HintKind, NeedRow, Plate, sparkleBurst, useStepHint } from './CookKit';
import { P, say, useRub, useSteps } from './PlayKit';

/**
 * Печенье: раскатать тесто → вырезать формочками → духовка (затащить, держать огонь, открыть дверцу)
 * → глазурь мазками пальцем (каждую печеньку покрыть) → посыпка из солонки (трясти над печеньем) → угостить.
 */

const STEPS = ['roll', 'cut', 'bake', 'icing', 'sprinkle', 'serve'] as const;
const VOICES = { roll: 'co_roll', cut: 'co_cut', bake: 'co_bake', icing: 'co_icing', sprinkle: 'co_sprinkle' };
const SHAPES = [
  { id: 'star', name: 'Звёздочка', cutter: P('cutter_star'), cookie: P('cookie_star') },
  { id: 'heart', name: 'Сердечко', cutter: P('cutter_heart'), cookie: P('cookie_heart') },
  { id: 'bear', name: 'Мишка', cutter: P('cutter_bear'), cookie: P('cookie_bear') },
  // печенье-герои (формочкой служит сама картинка печеньки)
  { id: 'zuba', name: 'Зуба', cutter: P('cookie_zuba'), cookie: P('cookie_zuba') },
  { id: 'slonya', name: 'Слоня', cutter: P('cookie_slonya'), cookie: P('cookie_slonya') },
  { id: 'bulkis', name: 'Булкис', cutter: P('cookie_bulkis'), cookie: P('cookie_bulkis') },
  { id: 'hihi', name: 'Хи-Хи', cutter: P('cookie_hihi'), cookie: P('cookie_hihi') },
  { id: 'vau', name: 'Вау', cutter: P('cookie_vau'), cookie: P('cookie_vau') },
  { id: 'piu', name: 'Пиу', cutter: P('cookie_piu'), cookie: P('cookie_piu') },
  { id: 'oi', name: 'Ой', cutter: P('cookie_oi'), cookie: P('cookie_oi') },
];
const ICINGS = [
  { id: 'pink', hex: '#F9A8D4', name: 'Розовая глазурь' },
  { id: 'white', hex: '#FFFDF7', name: 'Белая глазурь' },
  { id: 'blue', hex: '#93C5FD', name: 'Голубая глазурь' },
  { id: 'yellow', hex: '#FDE68A', name: 'Жёлтая глазурь' },
  { id: 'mint', hex: '#86EFAC', name: 'Мятная глазурь' },
  { id: 'choco', hex: '#7B3F1D', name: 'Шоколадная глазурь' },
];
const RAINBOW = ['#F43F5E', '#3B82F6', '#22C55E', '#FACC15', '#A855F7', '#FB923C'];
type SprKind = 'strand' | 'dot' | 'star' | 'heart' | 'choco' | 'gold';
const SPRINKLES: { id: SprKind; name: string; colors: string[] }[] = [
  { id: 'strand', name: 'Радужная посыпка', colors: RAINBOW },
  { id: 'dot', name: 'Шарики', colors: ['#F472B6', '#60A5FA', '#FDE047', '#4ADE80', '#FFFFFF'] },
  { id: 'star', name: 'Звёздочки', colors: ['#FACC15', '#FDE68A', '#FFFFFF'] },
  { id: 'heart', name: 'Сердечки', colors: ['#F43F5E', '#FB7185', '#F9A8D4'] },
  { id: 'choco', name: 'Шоколадная крошка', colors: ['#5B2C0F', '#7B3F1D', '#3F1D0B'] },
  { id: 'gold', name: 'Золотые шарики', colors: ['#EAB308', '#FDE047', '#CA8A04'] },
];
const NEED = 6;
const SPR_NEED = 9; // крупинок на каждой печеньке
const COVER = 0.72; // доля глазури, когда печенька «готова»

const swatch = (hex: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M30 18h40l-6 44H36z' fill='${hex}' stroke='rgba(0,0,0,.18)' stroke-width='3' stroke-linejoin='round'/><path d='M36 62h28l-14 26z' fill='#E2E8F0' stroke='rgba(0,0,0,.18)' stroke-width='3' stroke-linejoin='round'/><path d='M50 88v6' stroke='${hex}' stroke-width='6' stroke-linecap='round'/><ellipse cx='42' cy='32' rx='4' ry='9' fill='#fff' opacity='.5'/></svg>`);
const sprSwatch = (k: SprKind, colors: string[]) => {
  const pts = [[30, 34], [56, 28], [72, 50], [40, 58], [62, 72], [28, 74], [50, 46], [78, 30]];
  const one = (x: number, y: number, c: string, i: number) =>
    k === 'strand' ? `<rect x='${x - 7}' y='${y - 2.5}' width='14' height='5' rx='2.5' fill='${c}' transform='rotate(${i * 47} ${x} ${y})'/>`
    : k === 'star' ? `<text x='${x}' y='${y + 6}' font-size='18' text-anchor='middle' fill='${c}' stroke='#CA8A04' stroke-width='.8'>★</text>`
    : k === 'heart' ? `<text x='${x}' y='${y + 6}' font-size='18' text-anchor='middle' fill='${c}'>♥</text>`
    : k === 'choco' ? `<rect x='${x - 5}' y='${y - 4}' width='10' height='8' rx='2' fill='${c}' transform='rotate(${i * 33} ${x} ${y})'/>`
    : `<circle cx='${x}' cy='${y}' r='5.5' fill='${c}' stroke='rgba(0,0,0,.12)'/>`;
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='52' r='44' fill='#FFF7ED' stroke='#FED7AA' stroke-width='4'/>${pts.map(([x, y], i) => one(x, y, colors[i % colors.length], i)).join('')}</svg>`);
};
const SHAKER = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 120'><rect x='14' y='30' width='52' height='82' rx='14' fill='#E0F2FE' stroke='#7DD3FC' stroke-width='4'/><rect x='20' y='60' width='40' height='46' rx='9' fill='#F9A8D4'/><circle cx='30' cy='72' r='3' fill='#3B82F6'/><circle cx='46' cy='80' r='3' fill='#FACC15'/><circle cx='36' cy='94' r='3' fill='#22C55E'/><circle cx='52' cy='96' r='3' fill='#fff'/><path d='M16 32 Q40 6 64 32z' fill='#F472B6' stroke='#DB2777' stroke-width='4' stroke-linejoin='round'/><circle cx='32' cy='22' r='2.6' fill='#9D174D'/><circle cx='40' cy='18' r='2.6' fill='#9D174D'/><circle cx='48' cy='22' r='2.6' fill='#9D174D'/><rect x='22' y='38' width='8' height='30' rx='4' fill='#fff' opacity='.6'/></svg>`);

interface Dab { x: number; y: number; c: string }
interface Spr { x: number; y: number; c: string; k: SprKind; r: number }
interface Cookie { shape: string; x: number; y: number; dabs: Dab[]; spr: Spr[] }

// ---------- покрытие глазурью: сетка точек внутри печеньки ----------
const GRID = (() => {
  const g: { x: number; y: number }[] = [];
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
    const x = 0.14 + i * 0.12, y = 0.14 + j * 0.12;
    if ((x - 0.5) ** 2 + (y - 0.52) ** 2 < 0.34 ** 2) g.push({ x, y });
  }
  return g;
})();
const DAB_R = 0.15;
const coverage = (dabs: Dab[]) => GRID.filter((p) => dabs.some((d) => (d.x - p.x) ** 2 + (d.y - p.y) ** 2 < DAB_R * DAB_R)).length / GRID.length;

const SprinkleDot: React.FC<{ s: Spr; size?: string }> = ({ s, size = '9%' }) => {
  const base: React.CSSProperties = { left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: `translate(-50%,-50%) rotate(${s.r}deg)` };
  if (s.k === 'strand') return <span className="absolute rounded-full pointer-events-none" style={{ ...base, width: size, height: `calc(${size} * 0.38)`, background: s.c, boxShadow: '0 1px 0 rgba(0,0,0,.2)' }} />;
  if (s.k === 'choco') return <span className="absolute rounded-[2px] pointer-events-none" style={{ ...base, width: `calc(${size} * 0.62)`, height: `calc(${size} * 0.5)`, background: s.c, boxShadow: '0 1px 0 rgba(0,0,0,.3)' }} />;
  if (s.k === 'dot' || s.k === 'gold') return <span className="absolute rounded-full pointer-events-none" style={{ ...base, width: `calc(${size} * 0.55)`, height: `calc(${size} * 0.55)`, background: s.k === 'gold' ? `radial-gradient(circle at 35% 30%, #FFFBEB, ${s.c} 60%)` : s.c, boxShadow: '0 1px 0 rgba(0,0,0,.25)' }} />;
  return <span className="absolute leading-none pointer-events-none font-black" style={{ ...base, color: s.c, fontSize: `calc(${size} * 1.4)`, textShadow: '0 1px 0 rgba(0,0,0,.25)' }}>{s.k === 'star' ? '★' : '♥'}</span>;
};

/** Печенька: тесто/выпечка, глазурь мазками (маска по форме), блик, посыпка. Размер задаёт родитель. */
const CookieArt: React.FC<{ c: Cookie; baked: boolean }> = ({ c, baked }) => {
  const s = SHAPES.find((x) => x.id === c.shape)!;
  const mask: React.CSSProperties = {
    // у картинок печенья снизу нарисована тень — маску чуть уменьшаем и поднимаем, чтобы глазурь не легла на тень
    WebkitMaskImage: `url(${s.cookie})`, maskImage: `url(${s.cookie})`, WebkitMaskSize: '80% 76%', maskSize: '80% 76%',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '50% 30%', maskPosition: '50% 30%',
  };
  return (
    <div className="relative w-full h-full">
      <img src={s.cookie} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ filter: baked ? 'drop-shadow(0 4px 4px rgba(90,50,10,.35))' : 'brightness(1.28) saturate(0.55) drop-shadow(0 0 2px #B07A3A)', transition: 'filter .8s' }} />
      {c.dabs.length > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={mask}>
          {c.dabs.map((d, i) => (
            <span key={i} className="absolute rounded-full" style={{
              left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${DAB_R * 220}%`, height: `${DAB_R * 220}%`, transform: 'translate(-50%,-50%)',
              background: `radial-gradient(circle at 40% 35%, ${d.c} 55%, color-mix(in srgb, ${d.c} 82%, #000) 100%)`,
            }} />
          ))}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 22% at 36% 28%, rgba(255,255,255,.75), transparent 70%)' }} />
        </div>
      )}
      {c.spr.map((p, i) => <SprinkleDot key={i} s={p} />)}
    </div>
  );
};

/** Противень с пергаментом. */
const Sheet: React.FC<{ w: string; children: React.ReactNode; sheetRef?: React.Ref<HTMLDivElement>; strays?: Spr[] }> = ({ w, children, sheetRef, strays }) => (
  <div className="relative" style={{ width: w, height: `calc(${w} * 0.62)` }}>
    <div className="absolute inset-0 rounded-[6%/10%]" style={{ background: 'linear-gradient(160deg,#E2E8F0,#94A3B8 60%,#64748B)', boxShadow: '0 14px 24px rgba(60,30,10,.35), inset 0 2px 0 rgba(255,255,255,.7)' }} />
    <div ref={sheetRef} className="absolute inset-[4%] rounded-[4%/7%] overflow-visible" style={{
      containerType: 'size',
      background: 'repeating-linear-gradient(115deg, rgba(255,255,255,.18) 0 18px, transparent 18px 36px), linear-gradient(#FBF3E4,#F3E3C6)',
      boxShadow: 'inset 0 0 18px rgba(170,120,60,.25)',
    }}>
      {strays?.map((s, i) => <SprinkleDot key={`s${i}`} s={s} size="1.8%" />)}
      {children}
    </div>
  </div>
);

export const CookiesMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [roll, setRoll] = useState(0);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [shape, setShape] = useState('star');
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [press, setPress] = useState<{ x: number; y: number; id: number; shape: string } | null>(null);
  const [icing, setIcing] = useState('pink');
  const [sprKind, setSprKind] = useState<SprKind>('strand');
  const [shaker, setShaker] = useState<{ x: number; y: number; tilt: number } | null>(null);
  const [flying, setFlying] = useState<(Spr & { id: number; x0: number; y0: number })[]>([]);
  const [strays, setStrays] = useState<Spr[]>([]);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('cake', character.id), [servedKey, character.id]);
  const centerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const advanced = useRef<string>('');
  const flyId = useRef(0);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const doneCookies = useRef<Set<number>>(new Set());

  const restart = () => {
    setRoll(0); setCookies([]); setStrays([]); setFlying([]); advanced.current = ''; doneCookies.current = new Set();
    restartSteps();
  };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);
  const goNext = (from: string, delay: number) => {
    if (advanced.current === from) return;
    advanced.current = from;
    window.setTimeout(() => next(), delay);
  };

  // ---------- 1) раскатать ----------
  const rollRub = useRub(step === 'roll' && !doneFx, (d, p) => {
    setPin(p);
    if (d <= 0) return;
    setRoll((r) => {
      const n = Math.min(1, r + d * 0.4);
      if (Math.floor(n * 6) !== Math.floor(r * 6)) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(n * 5));
      if (r < 1 && n >= 1) { setPin(null); goNext('roll', 300); }
      return n;
    });
  });
  const flour = useMemo(() => Array.from({ length: 34 }, () => ({ x: 8 + Math.random() * 84, y: 8 + Math.random() * 84, s: 0.4 + Math.random() * 1.1 })), []);

  // ---------- 2) вырезать ----------
  const cutAt = (x: number, y: number) => {
    if (step !== 'cut' || doneFx || cookies.length >= NEED) return;
    const dx = (x - 0.5) / 0.44, dy = (y - 0.5) / 0.4;
    if (dx * dx + dy * dy > 1) return;
    if (cookies.some((c) => Math.hypot((c.x - x) * 1.6, c.y - y) < 0.26)) return;
    soundEngine.playGamePop(soundEnabled, 4 + cookies.length);
    setPress({ x, y, id: Date.now(), shape });
    const n = [...cookies, { shape, x, y, dabs: [], spr: [] }]; setCookies(n);
    if (n.length >= NEED) goNext('cut', 700);
  };
  const doughClick = (e: React.MouseEvent) => {
    const r = centerRef.current!.getBoundingClientRect();
    cutAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };

  // ---------- координаты на противне ----------
  const sheetPt = (e: React.PointerEvent) => {
    const r = sheetRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, r };
  };
  // печенька = квадрат 0.2 ширины противня; по высоте это 0.2/0.62*... (противень внутри рамки — пропорции те же)
  const CW = 0.2, CH = 0.2 / 0.62;
  const hitCookie = (x: number, y: number, slack = 1) => {
    let best = -1, bd = Infinity;
    cookies.forEach((c, i) => {
      const dx = (x - c.x) / (CW / 2), dy = (y - c.y) / (CH / 2);
      const d = dx * dx + dy * dy;
      if (d < 0.85 * slack && d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const local = (c: Cookie, x: number, y: number) => ({ x: 0.5 + (x - c.x) / CW, y: 0.5 + (y - c.y) / CH });

  // ---------- 4) глазурь мазками ----------
  const hex = ICINGS.find((i) => i.id === icing)!.hex;
  const smear = (x: number, y: number) => {
    const i = hitCookie(x, y, 1.2);
    if (i < 0) return;
    setCookies((cs) => {
      const c = cs[i];
      const p = local(c, x, y);
      const last = c.dabs[c.dabs.length - 1];
      if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.05) return cs;
      const dabs = [...c.dabs, { x: p.x, y: p.y, c: hex }];
      const n = cs.map((k, j) => (j === i ? { ...k, dabs } : k));
      if (!doneCookies.current.has(i) && coverage(dabs) >= COVER) {
        doneCookies.current.add(i);
        soundEngine.playGamePop(soundEnabled, 6 + doneCookies.current.size);
        const r = sheetRef.current?.getBoundingClientRect();
        if (r) sparkleBurst(r.left + c.x * r.width, r.top + c.y * r.height, 10);
        if (doneCookies.current.size >= cs.length) goNext('icing', 900);
      } else if (dabs.length % 5 === 0) soundEngine.playGamePop(soundEnabled, 1);
      return n;
    });
  };
  const icingBind = {
    onPointerDown: (e: React.PointerEvent) => {
      if (step !== 'icing' || doneFx) return;
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const p = sheetPt(e); lastPt.current = p; smear(p.x, p.y);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!lastPt.current) return;
      const p = sheetPt(e);
      // промежуточные мазки, чтобы быстрый свайп оставлял сплошную полосу
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - lastPt.current.x, (p.y - lastPt.current.y) * 0.62) / 0.012));
      for (let k = 1; k <= steps; k++) smear(lastPt.current.x + ((p.x - lastPt.current.x) * k) / steps, lastPt.current.y + ((p.y - lastPt.current.y) * k) / steps);
      lastPt.current = p;
    },
    onPointerUp: () => { lastPt.current = null; },
    onPointerCancel: () => { lastPt.current = null; },
  };

  // ---------- 5) посыпка солонкой ----------
  const kind = SPRINKLES.find((s) => s.id === sprKind)!;
  const shake = (x: number, y: number, amount: number) => {
    const count = Math.min(6, Math.max(1, Math.round(amount * 60)));
    const born = Array.from({ length: count }, () => {
      const tx = x + (Math.random() - 0.5) * 0.1, ty = y + 0.02 + Math.random() * 0.08;
      return { id: ++flyId.current, x0: x + (Math.random() - 0.5) * 0.02, y0: y - 0.02, x: tx, y: ty, c: kind.colors[Math.floor(Math.random() * kind.colors.length)], k: kind.id, r: Math.random() * 360 };
    });
    setFlying((f) => [...f.slice(-60), ...born]);
    window.setTimeout(() => {
      setFlying((f) => f.filter((p) => !born.some((b) => b.id === p.id)));
      setCookies((cs) => {
        let n = cs;
        const lost: Spr[] = [];
        for (const b of born) {
          const i = (() => {
            let best = -1, bd = Infinity;
            n.forEach((c, j) => { const dx = (b.x - c.x) / (CW / 2), dy = (b.y - c.y) / (CH / 2), d = dx * dx + dy * dy; if (d < 0.7 && d < bd) { bd = d; best = j; } });
            return best;
          })();
          const p = i < 0 ? null : local(n[i], b.x, b.y);
          // прилипает только то, что попало на саму печеньку (без нарисованной снизу тени)
          const onTop = p && (p.x - 0.5) ** 2 / 0.36 ** 2 + (p.y - 0.42) ** 2 / 0.32 ** 2 < 1;
          if (i < 0 || !p || !onTop || n[i].spr.length > 40) { lost.push({ x: b.x, y: b.y, c: b.c, k: b.k, r: b.r }); continue; }
          n = n.map((c, j) => (j === i ? { ...c, spr: [...c.spr, { x: p.x, y: p.y, c: b.c, k: b.k, r: b.r }] } : c));
        }
        if (lost.length) setStrays((s) => [...s, ...lost].slice(-90));
        if (n.length && n.every((c) => c.spr.length >= SPR_NEED)) goNext('sprinkle', 1100);
        return n;
      });
    }, 380);
    if (Math.random() < 0.5) soundEngine.playGamePop(soundEnabled, 7 + Math.floor(Math.random() * 3));
  };
  const sprinkleBind = {
    onPointerDown: (e: React.PointerEvent) => {
      if (step !== 'sprinkle' || doneFx) return;
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const p = sheetPt(e); lastPt.current = p; setShaker({ x: p.x, y: p.y, tilt: 0 }); shake(p.x, p.y, 0.03);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!lastPt.current) return;
      const p = sheetPt(e);
      const d = Math.hypot(p.x - lastPt.current.x, (p.y - lastPt.current.y) * 0.62);
      setShaker({ x: p.x, y: p.y, tilt: Math.max(-35, Math.min(35, (p.x - lastPt.current.x) * 900)) });
      if (d > 0.012) { shake(p.x, p.y, d); lastPt.current = p; }
    },
    onPointerUp: () => { lastPt.current = null; setShaker(null); },
    onPointerCancel: () => { lastPt.current = null; setShaker(null); },
  };

  // ---------- подсказки ----------
  const showGesture = useStepHint(step, 2400, 7000, step !== 'serve' && step !== 'bake' && !doneFx);
  let hintKind: HintKind = 'tap';
  const hintTarget: React.RefObject<Element | null> = step === 'icing' || step === 'sprinkle' ? sheetRef : centerRef;
  if (step === 'roll' || step === 'icing' || step === 'sprinkle') hintKind = 'rub';

  const tray =
    step === 'cut' ? SHAPES.map((s) => <Plate key={s.id} src={s.cutter} label={s.name} selected={shape === s.id} onPick={() => setShape(s.id)} />)
    : step === 'icing' ? ICINGS.map((i) => <Plate key={i.id} src={swatch(i.hex)} label={i.name} selected={icing === i.id} onPick={() => setIcing(i.id)} />)
    : step === 'sprinkle' ? SPRINKLES.map((s) => <Plate key={s.id} src={sprSwatch(s.id, s.colors)} label={s.name} selected={sprKind === s.id} onPick={() => setSprKind(s.id)} />)
    : undefined;

  const need = step === 'icing' || step === 'sprinkle'
    ? <NeedRow items={cookies.map((c, i) => ({ key: String(i), src: SHAPES.find((s) => s.id === c.shape)!.cookie, done: step === 'icing' ? doneCookies.current.has(i) : c.spr.length >= SPR_NEED }))} />
    : null;

  const baked = idx >= 2;
  const cookieLayer = (isBaked: boolean) => cookies.map((c, i) => (
    <div key={i} className="absolute" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${CW * 100}%`, height: `${CH * 100}%`, transform: 'translate(-50%,-50%)' }}>
      <CookieArt c={c} baked={isBaked} />
    </div>
  ));
  const DOUGH_W = 'min(84vmin, 760px)';
  const SHEET_W = 'min(82vmin, 720px)';

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx}
      bg="radial-gradient(ellipse at 50% 0%, #FFF7ED 0%, #FDE7CF 45%, transparent 70%), repeating-linear-gradient(90deg, #F8D7B4 0 40px, #F3CBA2 40px 80px)"
      recipe={step !== 'serve' ? <img src={P('cookie_bear')} alt="" className="w-[70%] h-[70%] object-contain" /> : undefined}
      tray={tray}>
      <div className="flex flex-col items-center gap-[2vmin]">
        {need}

        {(step === 'roll' || step === 'cut') && (
          <div ref={centerRef} {...(step === 'roll' ? rollRub : {})} onClick={step === 'cut' ? doughClick : undefined}
            className="relative cursor-pointer" style={{ width: DOUGH_W, height: `calc(${DOUGH_W} * 0.62)`, touchAction: 'none' }}>
            {/* деревянная доска */}
            <div className="absolute inset-0 rounded-[8%/12%]" style={{ background: 'repeating-linear-gradient(90deg, #D9A066 0 22px, #CF955A 22px 26px, #DCA56C 26px 60px)', boxShadow: '0 14px 24px rgba(90,50,10,.35), inset 0 2px 0 rgba(255,255,255,.35)' }} />
            {flour.map((f, i) => <span key={i} className="absolute rounded-full bg-white/80 pointer-events-none" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.s}vmin`, height: `${f.s}vmin`, opacity: 0.35 + (1 - roll) * 0.4 }} />)}
            <div className="absolute rounded-[46%] transition-all duration-200 pointer-events-none" style={{
              left: `${50 - (14 + roll * 34)}%`, width: `${2 * (14 + roll * 34)}%`, top: `${50 - (16 + roll * 26)}%`, height: `${2 * (16 + roll * 26)}%`,
              background: 'radial-gradient(circle at 40% 35%, #FDF0D8, #EFC98F)', boxShadow: '0 10px 18px rgba(120,70,20,.3), inset 0 -6px 10px rgba(160,100,40,.25)',
            }} />
            {cookies.map((c, i) => (
              <div key={i} className="absolute animate-pop-in" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: '17%', height: '27%', transform: 'translate(-50%,-50%)' }}>
                <img src={SHAPES.find((s) => s.id === c.shape)!.cookie} alt="" className="w-full h-full object-contain" style={{ filter: 'brightness(1.28) saturate(0.55) drop-shadow(0 0 2px #B07A3A)' }} />
              </div>
            ))}
            {press && (
              <img key={press.id} src={SHAPES.find((s) => s.id === press.shape)!.cutter} alt="" className="absolute pointer-events-none animate-[pressCut_.5s_ease-out_forwards]"
                style={{ left: `${press.x * 100}%`, top: `${press.y * 100}%`, width: '19%' }} />
            )}
            {step === 'roll' && (
              <img src={P('rolling_pin')} alt="" draggable={false} className="absolute w-[44%] pointer-events-none transition-all duration-75"
                style={{ left: `${(pin?.x ?? 0.5) * 100}%`, top: `${(pin?.y ?? 0.5) * 100}%`, transform: 'translate(-50%,-50%) rotate(-25deg)' }} />
            )}
          </div>
        )}

        {step === 'bake' && (
          <BakeOven soundEnabled={soundEnabled} tray="#94A3B8"
            onReady={() => say('co_ready', soundEnabled)}
            onDone={() => goNext('bake', 400)}
            dish={(b) => (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-[92%]" style={{ aspectRatio: '1 / 0.62' }}>
                  {cookieLayer(b)}
                </div>
              </div>
            )} />
        )}

        {(step === 'icing' || step === 'sprinkle') && (
          <div {...(step === 'icing' ? icingBind : sprinkleBind)} className="relative cursor-pointer" style={{ touchAction: 'none' }}>
            <Sheet w={SHEET_W} sheetRef={sheetRef} strays={strays}>
              {cookieLayer(true)}
              {flying.map((p) => (
                <span key={p.id} className="absolute pointer-events-none animate-[sprFall_.38s_ease-in_forwards]" style={{
                  left: `${p.x0 * 100}%`, top: `${p.y0 * 100}%`,
                  ['--dx' as string]: `${(p.x - p.x0) * 100}cqw`, ['--dy' as string]: `${(p.y - p.y0) * 100}cqh`,
                }}>
                  <span className="block" style={{ width: '1.4vmin', height: '1.4vmin' }}>
                    <SprinkleDot s={{ ...p, x: 0.5, y: 0.5 }} size="100%" />
                  </span>
                </span>
              ))}
              {shaker && (
                <img src={SHAKER} alt="" className="absolute pointer-events-none" style={{
                  left: `${shaker.x * 100}%`, top: `${shaker.y * 100}%`, width: 'min(11vmin, 90px)',
                  transform: `translate(-50%,-112%) rotate(${180 + shaker.tilt}deg)`, transformOrigin: '50% 80%', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.25))',
                }} />
              )}
            </Sheet>
          </div>
        )}

        {step === 'serve' && (
          <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
            dish={<Sheet w="min(40vmin, 340px)">{cookieLayer(true)}</Sheet>} />
        )}
      </div>

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} />
    </CookScreen>
  );
};
