import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { CakeCandleId, CakeFlavorId, CakeRosetteId, CakeToppingId, CAKE_TOPPINGS } from '../data/kitchenData';
import { getCakeBaseAssetUrl, getCakeCandleAssetUrl, getCakeToppingAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { hasReactionAnim, reactionAnimUrl } from '../data/reactionAssets';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { IdleHandPointer, useIdleHint } from './MiniGameShell';
import { FeedServe, GoalCard, StepBar } from './MissionKit';

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

const CAKE_W = 'min(66vw, 40vh)';
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
  const bowlRef = useRef<HTMLDivElement>(null);
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
  const { showHint, resetIdle } = useIdleHint(7000, step !== 'serve' && step !== 'bake');

  const goNext = useCallback(
    (voice?: string) => {
      soundEngine.playGameOk(soundEnabled);
      whenVoiceIdle(() => {
        setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
        resetIdle();
        if (voice) window.setTimeout(() => say(voice, soundEnabled), 250);
      });
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

  const goalImages =
    step === 'top' ? recipe.toppings.map((t) => getCakeToppingAssetUrl(t))
    : step === 'candles' || step === 'light' ? [getCakeCandleAssetUrl(recipe.candle)]
    : [];

  return (
    <div className="relative w-full h-full flex flex-col items-center gap-2 p-2 sm:p-3 select-none overflow-hidden">
      <StepBar icons={STEPS.map((s) => s.icon)} idx={stepIdx} />

      {step !== 'pick' && step !== 'serve' && (
        <GoalCard
          dishNode={<img src={getCakeBaseAssetUrl(recipe.cake)} alt="" className="w-[116px] h-[104px] object-contain drop-shadow" />}
          images={goalImages}
        />
      )}

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3 relative">
        {step === 'pick' && (
          <div className="grid grid-cols-3 gap-3 sm:gap-5 p-2">
            {RECIPES.map((r) => (
              <button key={r.id} type="button" aria-label={r.title}
                onClick={() => { setRecipe(r); setCreamId(r.cream); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => goNext(), 250); }}
                className="toy-pill rounded-3xl p-3 flex items-center justify-center active:scale-95 transition-transform bg-white/90">
                <img src={getCakeBaseAssetUrl(r.cake)} alt="" draggable={false} style={{ width: 'min(26vw, 160px)' }} className="object-contain" />
              </button>
            ))}
          </div>
        )}

        {step === 'eggs' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <button key={i} type="button" aria-label="Яичко" onClick={crack} disabled={i < eggs}
                  className={`text-6xl sm:text-7xl transition-all ${i < eggs ? 'opacity-30 scale-75 grayscale' : 'active:scale-90 animate-bounce'}`}>
                  {i < eggs ? '🍳' : '🥚'}
                </button>
              ))}
            </div>
            <div className="w-[56vw] max-w-[300px] aspect-[3/2] rounded-b-[50%] bg-gradient-to-b from-[#E2E8F0] to-[#94A3B8] shadow-xl relative overflow-hidden flex items-end justify-center">
              <div className="w-full bg-[#FDE68A] transition-all duration-500" style={{ height: `${eggs * 28}%` }} />
            </div>
          </div>
        )}

        {step === 'mix' && (
          <div ref={bowlRef} onPointerDown={bowlDown} onPointerMove={bowlMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}
            style={{ touchAction: 'none' }} className="relative cursor-pointer">
            <div className="w-[62vw] max-w-[340px] aspect-square rounded-full bg-gradient-to-b from-[#E2E8F0] to-[#94A3B8] shadow-xl flex items-center justify-center">
              <div className="w-[82%] h-[82%] rounded-full shadow-inner flex items-center justify-center" style={{ background: recipe.sponge, transform: `rotate(${turns * 90}deg)`, transition: 'transform .4s' }}>
                <span className="text-6xl">🥄</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-6xl opacity-50">🔄</div>
            <div className="flex justify-center gap-2 mt-3">
              {[0, 1, 2, 3].map((i) => <span key={i} className={`w-4 h-4 rounded-full ${i < turns ? 'bg-[#10C97A]' : 'bg-[#CBD5E1]'}`} />)}
            </div>
            {showHint && <IdleHandPointer className="absolute left-[44%] top-[30%]" />}
          </div>
        )}

        {step === 'bake' && (
          <button type="button" aria-label="Духовка" onClick={bakeTap}
            className="relative rounded-[2rem] bg-gradient-to-b from-[#64748B] to-[#334155] shadow-xl p-4 active:scale-95 transition-transform"
            style={{ width: 'min(70vw, 340px)', height: 'min(50vw, 250px)' }}>
            <div className="w-full h-full rounded-2xl bg-[#1E293B] overflow-hidden relative flex items-center justify-center"
              style={{ boxShadow: oven === 'baking' ? 'inset 0 0 60px #FB923C' : 'inset 0 0 20px #000' }}>
              <div className="w-[62%] transition-all duration-700" style={{ opacity: oven === 'idle' ? 0 : 1, filter: oven === 'baking' ? 'brightness(.75)' : 'none' }}>
                <CakeSvg sponge={recipe.sponge} candleId={recipe.candle} />
              </div>
            </div>
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-4xl">{oven === 'idle' ? '👆🔥' : oven === 'baking' ? '⏳' : '🔔'}</div>
          </button>
        )}

        {(step === 'cream' || step === 'top' || step === 'candles' || step === 'light' || step === 'blow') && (
          <div className="relative flex flex-col items-center gap-3">
            <div className="relative" style={{ width: CAKE_W }}>
              <div onPointerDown={cakeDown} onPointerMove={cakeMove} onPointerUp={cakeUp} onPointerCancel={cakeUp} className="cursor-pointer" style={{ touchAction: 'none' }}>
                <CakeSvg innerRef={svgRef} sponge={recipe.sponge} blobs={blobs} tops={tops} candles={candles} candleId={recipe.candle} />
              </div>
              {step === 'light' && candles.map((c, i) => !c.lit && (
                <button key={i} type="button" aria-label="Свечка" onClick={() => light(i)} className="absolute w-[13%] aspect-square rounded-full bg-white/60 animate-pulse text-xl"
                  style={{ left: `${(c.x / W) * 100}%`, top: `${((c.y - 112) / H) * 100}%`, transform: 'translate(-50%,-50%)' }}>🔥</button>
              ))}
              {smoke && <div className="absolute left-0 right-0 top-[5%] text-center text-6xl animate-bounce pointer-events-none">💨</div>}
              {step === 'cream' && blobs.length === 0 && showHint && <IdleHandPointer className="absolute left-[44%] top-[30%]" />}
            </div>

            {step === 'cream' && (
              <div className="toy-pill px-2 py-2 flex gap-2">
                {CREAMS.map((c) => (
                  <button key={c.id} type="button" aria-label={c.name} onClick={() => { setCreamId(c.id); if (c.id !== recipe.cream) sayAlt(); }}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full border-4 border-white shadow ${creamId === c.id ? 'ring-4 ring-[#FFB800] scale-110' : ''}`}
                    style={{ background: c.hex }} />
                ))}
              </div>
            )}

            {step === 'top' && (
              <div className="toy-pill px-2 py-2 flex gap-1.5 flex-wrap justify-center" style={{ maxWidth: 'min(92vw, 520px)' }}>
                {CAKE_TOPPINGS.map((t) => (
                  <button key={t.id} type="button" aria-label={t.name} onPointerDown={(e) => startDragTop(t.id, e)}
                    style={{ touchAction: 'none' }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center cursor-grab ${selTop === t.id ? 'ring-4 ring-[#FFB800] scale-110' : ''}`}>
                    <img src={getCakeToppingAssetUrl(t.id)} alt="" className="w-[80%] h-[80%] object-contain" />
                  </button>
                ))}
              </div>
            )}

            {step === 'blow' && (
              <div className="flex items-center gap-4">
                <div className="rounded-full overflow-hidden border-4 border-white shadow-xl" style={{ width: 'min(30vw, 18vh)', height: 'min(30vw, 18vh)', background: character.accentBg }}>
                  {blowing && hasReactionAnim(character.id, 'blow') ? (
                    <img src={`${reactionAnimUrl(character.id, 'blow')}?r=${servedKey}`} alt="" draggable={false} className="w-full h-full object-cover" />
                  ) : (
                    <img src={character.imageSrc} alt="" draggable={false} className={`w-full h-full object-cover object-top ${blowing ? 'scale-110 transition-transform' : ''}`} />
                  )}
                </div>
                <button type="button" aria-label="Задуть" onClick={blow} className="toy-pill px-6 py-3 text-5xl active:scale-90 transition-transform animate-bounce">💨</button>
              </div>
            )}
          </div>
        )}

        {step === 'serve' && (
          <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
            dish={
              <div style={{ width: 'min(46vw, 28vh)' }}>
                <CakeSvg sponge={recipe.sponge} blobs={blobs} tops={tops} candles={candles.map((c) => ({ ...c, lit: false }))} candleId={recipe.candle} />
              </div>
            } />
        )}
      </div>
      {dragTop && (
        <img src={getCakeToppingAssetUrl(dragTop.id)} alt="" draggable={false}
          className="fixed z-50 w-16 h-16 object-contain pointer-events-none drop-shadow-xl"
          style={{ left: dragTop.x, top: dragTop.y, transform: 'translate(-50%,-70%) scale(1.15)' }} />
      )}
    </div>
  );
};
