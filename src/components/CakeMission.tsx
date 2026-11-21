import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { CakeCandleId, CakeFlavorId, CakeRosetteId, CakeToppingId, CAKE_TOPPINGS } from '../data/kitchenData';
import { getCakeBaseAssetUrl, getCakeCandleAssetUrl, getCakeToppingAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { hasReactionAnim, reactionAnimUrl } from '../data/reactionAssets';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { useIdleHint } from './MiniGameShell';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { BlowBadge } from './PlayKit';
import { useBlow } from '../utils/useBlow';

const svgUri = (body: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${body}</svg>`);
const EGG_SRC = svgUri(`<text x='50' y='80' font-size='76' text-anchor='middle'>🥚</text>`);
const swatch = (hex: string) => svgUri(`<path d='M14 62c0-18 14-30 36-30s36 12 36 30c0 14-16 22-36 22S14 76 14 62z' fill='${hex}' stroke='rgba(0,0,0,.15)' stroke-width='3'/><path d='M50 10c10 10 22 16 22 30H28c0-14 12-20 22-30z' fill='${hex}' stroke='rgba(0,0,0,.15)' stroke-width='3'/><ellipse cx='36' cy='52' rx='8' ry='4' fill='#fff' opacity='.5'/>`);

/**
 * Торт как «миссия» (картинки, без текста):
 * рецепт → яйца → замесить → духовка (голый бисквит) → намазать цветным кремом → вкусняшки → свечки → зажечь → задуть → угостить.
 */

interface Recipe {
  id: string;
  title: string;
  cake: CakeFlavorId; // готовая картинка-образец
  sponge: string;
  cream: CakeRosetteId;
  toppings: CakeToppingId[];
  candle: CakeCandleId;
}

const RECIPES: Recipe[] = [
  { id: 'strawberry', title: 'Клубничный', cake: 'pink', sponge: '#F6D58E', cream: 'pink', toppings: ['strawberry', 'cherry'], candle: 'pink' },
  { id: 'chocolate', title: 'Шоколадный', cake: 'chocolate', sponge: '#8A5233', cream: 'chocolate', toppings: ['macaron', 'donut'], candle: 'red' },
  { id: 'berry', title: 'Ягодный', cake: 'blue', sponge: '#F6D58E', cream: 'blue', toppings: ['blueberries', 'raspberry'], candle: 'blue' },
];

const CREAMS: Array<{ id: CakeRosetteId; hex: string; name: string }> = [
  { id: 'pink', hex: '#F9A8D4', name: 'Розовый крем' },
  { id: 'white', hex: '#FFFFFF', name: 'Белый крем' },
  { id: 'blue', hex: '#93C5FD', name: 'Голубой крем' },
  { id: 'yellow', hex: '#FDE68A', name: 'Жёлтый крем' },
  { id: 'mint', hex: '#86EFAC', name: 'Мятный крем' },
  { id: 'chocolate', hex: '#7B3F1D', name: 'Шоколадный крем' },
];
const creamHex = (id: string) => CREAMS.find((c) => c.id === id)?.hex ?? '#F9A8D4';

const STEPS = [
  { id: 'pick', icon: '📖' },
  { id: 'eggs', icon: '🥚' },
  { id: 'mix', icon: '🥣' },
  { id: 'bake', icon: '🔥' },
  { id: 'cream', icon: '🍥' },
  { id: 'top', icon: '🍓' },
  { id: 'candles', icon: '🕯️' },
  { id: 'light', icon: '✨' },
  { id: 'blow', icon: '💨' },
  { id: 'serve', icon: '🍽️' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

const CAKE_W = 'min(64vmin, 560px)';
const say = (id: string, on: boolean) => playVoice(id, on);
const NEED_TOP = 6;
const NEED_CANDLES = 3;

// --- геометрия торта в координатах SVG 400×380 ---
const W = 400, H = 380;
const TOP = { cx: 200, cy: 140, rx: 140, ry: 36 };
const BOT = { cx: 200, cy: 305, rx: 140, ry: 34 };
const BODY = { x: 60, y: 140, w: 280, h: 165 };
const inCake = (x: number, y: number) =>
  ((x - TOP.cx) / TOP.rx) ** 2 + ((y - TOP.cy) / TOP.ry) ** 2 <= 1 ||
  (x >= BODY.x && x <= BODY.x + BODY.w && y >= BODY.y && y <= BODY.y + BODY.h) ||
  ((x - BOT.cx) / BOT.rx) ** 2 + ((y - BOT.cy) / BOT.ry) ** 2 <= 1;
const GRID_X = 20, GRID_Y = 14;
const CELLS = (() => {
  const out: string[] = [];
  for (let gx = 0; gx < GRID_X; gx++)
    for (let gy = 0; gy < GRID_Y; gy++) {
      const x = 60 + ((gx + 0.5) * 280) / GRID_X, y = 104 + ((gy + 0.5) * 236) / GRID_Y;
      if (inCake(x, y)) out.push(`${gx},${gy}`);
    }
  return out;
})();
const cellOf = (x: number, y: number) => `${Math.floor(((x - 60) / 280) * GRID_X)},${Math.floor(((y - 104) / 236) * GRID_Y)}`;
/** Ограничить точку верхней поверхностью торта (для вкусняшек и свечек) */
const clampTop = (x: number, y: number) => {
  const rx = 112, ry = 22;
  const dx = (x - TOP.cx) / rx, dy = (y - TOP.cy) / ry;
  const d = Math.hypot(dx, dy);
  return d > 1 ? { x: TOP.cx + dx / d * rx, y: TOP.cy + dy / d * ry } : { x, y };
};

interface Blob { x: number; y: number; c: string }
interface Pt { x: number; y: number; id: string }
interface CandleT { x: number; y: number; lit: boolean }

/** Торт, нарисованный в SVG: подставка, бисквит, крем, вкусняшки, свечки — всё в одних координатах */
const CakeSvg: React.FC<{
  sponge: string; blobs?: Blob[]; tops?: Pt[]; candles?: CandleT[]; candleId: CakeCandleId; innerRef?: React.Ref<SVGSVGElement>; className?: string;
}> = ({ sponge, blobs = [], tops = [], candles = [], candleId, innerRef, className }) => {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg ref={innerRef} viewBox={`0 0 ${W} ${H}`} className={className} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}>
      <defs>
        <clipPath id={`cake-${uid}`}>
          <ellipse cx={TOP.cx} cy={TOP.cy} rx={TOP.rx} ry={TOP.ry} />
          <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} />
          <ellipse cx={BOT.cx} cy={BOT.cy} rx={BOT.rx} ry={BOT.ry} />
        </clipPath>
        <linearGradient id={`sh-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      {/* подставка */}
      <ellipse cx={200} cy={366} rx={74} ry={12} fill="#CBD5E1" />
      <rect x={186} y={322} width={28} height={44} fill="#E5E7EB" />
      <ellipse cx={200} cy={322} rx={168} ry={26} fill="#F3F4F6" stroke="#D1D5DB" strokeWidth={3} />
      {/* бисквит */}
      <g clipPath={`url(#cake-${uid})`}>
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} fill={sponge} />
        <ellipse cx={BOT.cx} cy={BOT.cy} rx={BOT.rx} ry={BOT.ry} fill={sponge} />
        <rect x={BODY.x} y={222} width={BODY.w} height={12} fill="#fff" opacity={0.55} />
        <rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h + 40} fill={`url(#sh-${uid})`} />
        <ellipse cx={TOP.cx} cy={TOP.cy} rx={TOP.rx} ry={TOP.ry} fill={sponge} />
        <ellipse cx={TOP.cx} cy={TOP.cy} rx={TOP.rx} ry={TOP.ry} fill="#fff" opacity={0.18} />
        {/* крем */}
        {blobs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={17} fill={b.c} stroke="rgba(0,0,0,0.08)" strokeWidth={1.5} />
        ))}
      </g>
      <ellipse cx={TOP.cx} cy={TOP.cy} rx={TOP.rx} ry={TOP.ry} fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth={2} />
      {/* вкусняшки */}
      {tops.map((t, i) => (
        <image key={i} href={getCakeToppingAssetUrl(t.id as CakeToppingId)} x={t.x - 19} y={t.y - 26} width={38} height={38} />
      ))}
      {/* свечки */}
      {candles.map((c, i) => (
        <g key={i}>
          <image href={getCakeCandleAssetUrl(candleId)} x={c.x - 9} y={c.y - 96} width={18} height={102} />
          {c.lit && <text x={c.x} y={c.y - 100} fontSize={28} textAnchor="middle" className="animate-pulse">🔥</text>}
        </g>
      ))}
    </svg>
  );
};

export const CakeMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const step: StepId = STEPS[stepIdx].id;
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [eggs, setEggs] = useState(0);
  const [turns, setTurns] = useState(0);
  const [oven, setOven] = useState<'idle' | 'baking' | 'ready'>('idle');
  const [creamId, setCreamId] = useState<CakeRosetteId>('pink');
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [covered, setCovered] = useState<Set<string>>(new Set());
  const [tops, setTops] = useState<Pt[]>([]);
  const [selTop, setSelTop] = useState<CakeToppingId>('strawberry');
  const [candles, setCandles] = useState<CandleT[]>([]);
  const [smoke, setSmoke] = useState(false);
  const [blowing, setBlowing] = useState(false);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('cake', character.id), [servedKey, character.id]);
  const svgRef = useRef<SVGSVGElement>(null);
  const bowlRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ a: number; acc: number } | null>(null);
  const smearing = useRef(false);
  const lastAltAt = useRef(0);
  /** Помощник комментирует выбор не по рецепту: «Думаешь, так вкуснее?» и т. п. */
  const sayAlt = () => {
    const now = Date.now();
    if (now - lastAltAt.current < 6000) return;
    lastAltAt.current = now;
    window.setTimeout(() => say(`ck_alt_${1 + Math.floor(Math.random() * 4)}`, soundEnabled), 350);
  };
  const [dragTop, setDragTop] = useState<{ id: CakeToppingId; x: number; y: number } | null>(null);
  const placeTopRef = useRef<(id: CakeToppingId, cx: number, cy: number) => void>(() => {});
  const { resetIdle } = useIdleHint(7000, step !== 'serve' && step !== 'bake');

  const [doneFx, setDoneFx] = useState(false);
  const goNext = useCallback(
    (voice?: string) => {
      soundEngine.playGameOk(soundEnabled);
      setDoneFx(true); // большая звезда: шаг выполнен
      if (voice) window.setTimeout(() => say(voice, soundEnabled), 150);
      window.setTimeout(() => whenVoiceIdle(() => {
        setDoneFx(false);
        setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
        resetIdle();
      }), 900);
    },
    [soundEnabled, resetIdle],
  );

  const restart = () => {
    setStepIdx(0); setEggs(0); setTurns(0); setOven('idle'); setBlobs([]); setCovered(new Set()); setTops([]); setCandles([]); setSmoke(false);
  };

  useEffect(() => {
    const m: Record<string, string> = {
      pick: 'ck_pick', eggs: 'ck_eggs', mix: 'ck_mix', bake: 'ck_bake', cream: 'ck_cream', top: 'ck_top',
      candles: 'ck_candles', light: 'ck_light', blow: 'ck_blow',
    };
    if (m[step]) say(m[step], soundEnabled);
    if (step === 'top') setSelTop(recipe.toppings[0]);
    if (step === 'cream') setCreamId(recipe.cream);
    if (step === 'serve') {
      setServedKey((k) => k + 1);
      window.setTimeout(() => say('ck_ok', soundEnabled), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---------- яйца ----------
  const crack = () => {
    resetIdle();
    if (eggs >= 3) return;
    soundEngine.playGamePop(soundEnabled, 2 + eggs);
    const n = eggs + 1;
    setEggs(n);
    if (n === 3) window.setTimeout(() => goNext('ck_ok_eggs'), 500);
  };

  // ---------- замес по кругу ----------
  const bowlDown = (e: React.PointerEvent) => {
    resetIdle();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const r = bowlRef.current!.getBoundingClientRect();
    drag.current = { a: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)), acc: 0 };
  };
  const bowlMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = bowlRef.current!.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    let d = a - drag.current.a;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    drag.current = { a, acc: drag.current.acc + Math.abs(d) };
    const t = Math.min(4, Math.floor(drag.current.acc / (2 * Math.PI)));
    if (t !== turns) {
      setTurns(t);
      soundEngine.playGamePop(soundEnabled, 3 + t);
      if (t >= 4) {
        drag.current = null;
        window.setTimeout(() => goNext(), 400);
      }
    }
  };

  // ---------- духовка ----------
  const bakeTap = () => {
    resetIdle();
    if (oven === 'idle') {
      setOven('baking');
      soundEngine.playGamePop(soundEnabled, 4);
      window.setTimeout(() => {
        setOven('ready');
        soundEngine.playGameReward(soundEnabled);
        say('ck_bake_ready', soundEnabled);
      }, 2500);
    } else if (oven === 'ready') {
      goNext();
    }
  };

  // ---------- работа с тортом ----------
  const toSvg = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const smear = (p: { x: number; y: number }) => {
    if (!inCake(p.x, p.y)) return;
    setBlobs((b) => {
      const last = b[b.length - 1];
      if (last && Math.hypot(last.x - p.x, last.y - p.y) < 7) return b;
      return [...b.slice(-400), { x: p.x, y: p.y, c: creamHex(creamId) }];
    });
    setCovered((prev) => {
      const next = new Set(prev);
      // закрашиваем клетки вокруг точки
      for (const dx of [-14, 0, 14]) for (const dy of [-14, 0, 14]) {
        if (inCake(p.x + dx, p.y + dy)) next.add(cellOf(p.x + dx, p.y + dy));
      }
      if (next.size !== prev.size && next.size % 9 === 0) soundEngine.playGamePop(soundEnabled, 3 + (next.size % 5));
      if (next.size >= CELLS.length * 0.82 && prev.size < CELLS.length * 0.82) window.setTimeout(() => goNext(), 500);
      return next;
    });
  };

  const cakeDown = (e: React.PointerEvent) => {
    if (step !== 'cream' && step !== 'top' && step !== 'candles') return;
    resetIdle();
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    const p = toSvg(e);
    if (step === 'cream') {
      smearing.current = true;
      smear(p);
    } else if (step === 'top' && tops.length < NEED_TOP) {
      const c = clampTop(p.x, p.y);
      soundEngine.playGamePop(soundEnabled, 5 + tops.length);
      if (!recipe.toppings.includes(selTop)) sayAlt();
      const n = [...tops, { ...c, id: selTop }];
      setTops(n);
      if (n.length === NEED_TOP) window.setTimeout(() => goNext(), 450);
    } else if (step === 'candles' && candles.length < NEED_CANDLES) {
      const c = clampTop(p.x, p.y);
      soundEngine.playGamePop(soundEnabled, 6 + candles.length);
      const n = [...candles, { ...c, lit: false }];
      setCandles(n);
      if (n.length === NEED_CANDLES) window.setTimeout(() => goNext(), 450);
    }
  };
  const cakeMove = (e: React.PointerEvent) => {
    if (step === 'cream' && smearing.current) smear(toSvg(e));
  };
  const cakeUp = () => { smearing.current = false; };

  // перетаскивание вкусняшки из набора на торт
  placeTopRef.current = (id, cx, cy) => {
    const el = svgRef.current;
    if (!el || step !== 'top' || tops.length >= NEED_TOP) return;
    const r = el.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top - 20 || cy > r.bottom) return;
    const c = clampTop(((cx - r.left) / r.width) * W, ((cy - r.top) / r.height) * H);
    soundEngine.playGamePop(soundEnabled, 5 + tops.length);
    if (!recipe.toppings.includes(id)) sayAlt();
    const n = [...tops, { ...c, id }];
    setTops(n);
    if (n.length === NEED_TOP) window.setTimeout(() => goNext(), 450);
  };
  const dropCandle = (cx: number, cy: number) => {
    const el = svgRef.current;
    if (!el || step !== 'candles' || candles.length >= NEED_CANDLES) return;
    const r = el.getBoundingClientRect();
    const c = clampTop(((cx - r.left) / r.width) * W, ((cy - r.top) / r.height) * H);
    soundEngine.playGamePop(soundEnabled, 6 + candles.length);
    const n = [...candles, { ...c, lit: false }];
    setCandles(n);
    if (n.length === NEED_CANDLES) window.setTimeout(() => goNext(), 450);
  };
  const startDragTop = (id: CakeToppingId, e: React.PointerEvent) => {
    resetIdle();
    setSelTop(id);
    setDragTop({ id, x: e.clientX, y: e.clientY });
  };
  useEffect(() => {
    if (!dragTop) return;
    const move = (e: PointerEvent) => setDragTop((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    const up = (e: PointerEvent) => {
      const d = dragTop;
      setDragTop(null);
      if (d) placeTopRef.current(d.id, e.clientX, e.clientY);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragTop?.id]);

  const light = (i: number) => {
    resetIdle();
    setCandles((c) => {
      const n = c.map((q, k) => (k === i ? { ...q, lit: true } : q));
      soundEngine.playGamePop(soundEnabled, 7);
      if (n.every((q) => q.lit)) window.setTimeout(() => goNext(), 700);
      return n;
    });
  };

  const blow = () => {
    if (blowing) return;
    setBlowing(true); // герой дует на свечки
    soundEngine.playGamePop(soundEnabled, 9);
    window.setTimeout(() => {
      setCandles((c) => c.map((q) => ({ ...q, lit: false })));
      setSmoke(true);
      soundEngine.playGameOk(soundEnabled);
    }, 1100);
    window.setTimeout(() => setSmoke(false), 2400);
    window.setTimeout(() => { setBlowing(false); goNext(); }, 2600);
  };

  // подуть в микрофон — тоже задувает свечки (если микрофона нет, работает кнопка)
  const blowAcc = useRef(0);
  const mic = useBlow(step === 'blow' && !blowing && !doneFx, (lv) => {
    blowAcc.current += lv;
    if (blowAcc.current > 8) { blowAcc.current = 0; blow(); }
  });

  // ---------- подсказки-жесты ----------
  const cakeRef = useRef<HTMLDivElement>(null);
  const ovenRef = useRef<HTMLButtonElement>(null);
  const blowRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const candleBtns = useRef<(HTMLButtonElement | null)[]>([]);
  const hintFromRef = useRef<HTMLButtonElement | null>(null);
  const tapTargetRef = useRef<Element | null>(null);
  const showGesture = useStepHint(step, 2600, 7000, step !== 'serve' && step !== 'pick' && !doneFx && !blowing && oven !== 'baking');
  const topShelf = useMemo(() => [...CAKE_TOPPINGS].sort(() => Math.random() - 0.5), [recipe]);
  const nextTopId = recipe.toppings[tops.length % recipe.toppings.length];

  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = cakeRef;
  let hintItem: string | undefined;
  hintFromRef.current = null;
  if (step === 'eggs') { hintTarget = bowlRef; hintItem = EGG_SRC; hintFromRef.current = plateEls.current[`egg${eggs}`] ?? null; }
  else if (step === 'mix') { hintKind = 'circle'; hintTarget = bowlRef; }
  else if (step === 'bake') { hintKind = 'tap'; hintTarget = ovenRef; }
  else if (step === 'cream') hintKind = 'rub';
  else if (step === 'top') { hintItem = getCakeToppingAssetUrl(nextTopId); hintFromRef.current = plateEls.current[nextTopId] ?? null; }
  else if (step === 'candles') { hintItem = getCakeCandleAssetUrl(recipe.candle); hintFromRef.current = plateEls.current.__candle ?? null; }
  else if (step === 'light') {
    hintKind = 'tap';
    tapTargetRef.current = candleBtns.current[candles.findIndex((c) => !c.lit)] ?? null;
    hintTarget = tapTargetRef;
  }
  else if (step === 'blow') { hintKind = 'tap'; hintTarget = blowRef; }

  const tray =
    step === 'eggs' ? [0, 1, 2].map((i) => (
      <Plate key={i} src={EGG_SRC} label="Яичко" plateRef={(el) => { plateEls.current[`egg${i}`] = el; }}
        onPick={() => i >= eggs && crack()} target={bowlRef} onDrop={() => i >= eggs && crack()} dim={i < eggs} />
    ))
    : step === 'cream' ? CREAMS.map((c) => (
      <Plate key={c.id} src={swatch(c.hex)} label={c.name} selected={creamId === c.id}
        onPick={() => { setCreamId(c.id); if (c.id !== recipe.cream) sayAlt(); }} />
    ))
    : step === 'top' ? <LoopScroller>{topShelf.map((t) => (
      <Plate key={t.id} src={getCakeToppingAssetUrl(t.id)} label={t.name} plateRef={(el) => { plateEls.current[t.id] = el; }}
        selected={selTop === t.id} onPick={() => { resetIdle(); setSelTop(t.id); }}
        target={cakeRef} onDrop={(x, y) => { setSelTop(t.id); placeTopRef.current(t.id, x, y); }} />
    ))}</LoopScroller>
    : step === 'candles' ? <Plate src={getCakeCandleAssetUrl(recipe.candle)} label="Свечка" plateRef={(el) => { plateEls.current.__candle = el; }}
        target={cakeRef} onDrop={dropCandle} badge={NEED_CANDLES - candles.length} />
    : undefined;

  return (
    <CookScreen stepKey={step} stepIdx={stepIdx} total={STEPS.length} done={doneFx} trayLoop={step === 'top'}
      recipe={step !== 'pick' && step !== 'serve' ? <img src={getCakeBaseAssetUrl(recipe.cake)} alt="" className="w-[86%] h-[86%] object-contain" /> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className="flex gap-[3vmin] flex-wrap justify-center">
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={r.title}
              onClick={() => { setRecipe(r); setCreamId(r.cream); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => goNext(), 250); }}
              className="rounded-full bg-white/90 shadow-xl p-[2vmin] flex items-center justify-center active:scale-95 transition-transform">
              <img src={getCakeBaseAssetUrl(r.cake)} alt="" draggable={false} style={{ width: 'min(26vmin, 230px)', height: 'min(26vmin, 230px)' }} className="object-contain" />
            </button>
          ))}
        </div>
      )}

      {step === 'eggs' && (
        <div ref={bowlRef} className="rounded-b-[50%] bg-gradient-to-b from-[#E2E8F0] to-[#94A3B8] shadow-2xl relative overflow-hidden flex items-end justify-center border-t-[10px] border-[#F1F5F9]"
          style={{ width: 'min(64vmin, 560px)', height: 'min(40vmin, 350px)' }}>
          <div className="w-full bg-[#FDE68A] transition-all duration-500 relative" style={{ height: `${eggs * 26}%` }}>
            {[...Array(eggs)].map((_, k) => <span key={k} className="absolute w-[14%] aspect-square rounded-full bg-[#F59E0B] animate-pop-in" style={{ left: `${24 + k * 20}%`, top: '18%' }} />)}
          </div>
        </div>
      )}

      {step === 'mix' && (
        <div ref={bowlRef} onPointerDown={bowlDown} onPointerMove={bowlMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}
          style={{ touchAction: 'none' }} className="relative cursor-pointer flex flex-col items-center">
          <div className="rounded-full bg-gradient-to-b from-[#E2E8F0] to-[#94A3B8] shadow-2xl flex items-center justify-center" style={{ width: 'min(62vmin, 540px)', height: 'min(62vmin, 540px)' }}>
            <div className="w-[82%] h-[82%] rounded-full shadow-inner flex items-center justify-center" style={{ background: `repeating-conic-gradient(from ${turns * 40}deg, ${recipe.sponge} 0 20deg, #FFF3C4 20deg 40deg)`, transform: `rotate(${turns * 90}deg)`, transition: 'transform .4s' }}>
              <span style={{ fontSize: 'min(16vmin, 140px)' }}>🥄</span>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {[0, 1, 2, 3].map((i) => <span key={i} className={`w-5 h-5 rounded-full border-[3px] border-white ${i < turns ? 'bg-[#10C97A]' : 'bg-white/70'}`} />)}
          </div>
        </div>
      )}

      {step === 'bake' && (
        <button ref={ovenRef} type="button" aria-label="Духовка" onClick={bakeTap}
          className="relative rounded-[3rem] bg-gradient-to-b from-[#64748B] to-[#334155] shadow-2xl p-[2.5vmin] active:scale-95 transition-transform"
          style={{ width: 'min(86vmin, 720px)', height: 'min(60vmin, 500px)' }}>
          <div className="w-full h-full rounded-[2rem] bg-[#1E293B] overflow-hidden relative flex items-center justify-center"
            style={{ boxShadow: oven === 'baking' ? 'inset 0 0 90px #FB923C' : 'inset 0 0 20px #000' }}>
            <div className="w-[50%] transition-all duration-700" style={{ opacity: oven === 'idle' ? 0.25 : 1, filter: oven === 'baking' ? 'brightness(.75)' : 'none' }}>
              <CakeSvg sponge={recipe.sponge} candleId={recipe.candle} />
            </div>
          </div>
          <div className="absolute -top-[7vmin] left-1/2 -translate-x-1/2 text-[9vmin]">{oven === 'idle' ? '🔥' : oven === 'baking' ? '⏳' : '🔔'}</div>
        </button>
      )}

      {(step === 'cream' || step === 'top' || step === 'candles' || step === 'light' || step === 'blow') && (
        <div className="flex items-center gap-[4vmin]">
          <div ref={cakeRef} className="relative" style={{ width: step === 'blow' ? 'min(54vmin, 480px)' : CAKE_W }}>
            <div onPointerDown={cakeDown} onPointerMove={cakeMove} onPointerUp={cakeUp} onPointerCancel={cakeUp} className="cursor-pointer" style={{ touchAction: 'none' }}>
              <CakeSvg innerRef={svgRef} sponge={recipe.sponge} blobs={blobs} tops={tops} candles={candles} candleId={recipe.candle} />
            </div>
            {step === 'light' && candles.map((c, i) => !c.lit && (
              <button key={i} ref={(el) => { candleBtns.current[i] = el; }} type="button" aria-label="Свечка" onClick={() => light(i)}
                className="absolute w-[13%] aspect-square rounded-full bg-white/70 animate-pulse text-[4vmin] flex items-center justify-center"
                style={{ left: `${(c.x / W) * 100}%`, top: `${((c.y - 112) / H) * 100}%`, transform: 'translate(-50%,-50%)' }}>🔥</button>
            ))}
            {smoke && <div className="absolute left-0 right-0 top-[5%] text-center text-[12vmin] animate-bounce pointer-events-none">💨</div>}
          </div>
          {step === 'blow' && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full overflow-hidden border-[6px] border-white shadow-xl" style={{ width: 'min(30vmin, 260px)', height: 'min(30vmin, 260px)', background: character.accentBg }}>
                {blowing && hasReactionAnim(character.id, 'blow') ? (
                  <img src={`${reactionAnimUrl(character.id, 'blow')}?r=${servedKey}`} alt="" draggable={false} className="w-full h-full object-cover" />
                ) : (
                  <img src={character.imageSrc} alt="" draggable={false} className={`w-full h-full object-cover object-top ${blowing ? 'scale-110 transition-transform' : ''}`} />
                )}
              </div>
              <button ref={blowRef} type="button" aria-label="Задуть" onClick={blow}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform animate-bounce"
                style={{ width: 'min(16vmin, 130px)', height: 'min(16vmin, 130px)', fontSize: 'min(10vmin, 84px)' }}>💨</button>
              <BlowBadge status={mic.status} level={mic.level} />
            </div>
          )}
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={
            <div style={{ width: 'min(36vmin, 300px)' }}>
              <CakeSvg sponge={recipe.sponge} blobs={blobs} tops={tops} candles={candles.map((c) => ({ ...c, lit: false }))} candleId={recipe.candle} />
            </div>
          } />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFromRef : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
