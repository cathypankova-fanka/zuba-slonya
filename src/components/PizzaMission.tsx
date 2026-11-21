import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { PizzaToppingId, PIZZA_TOPPINGS } from '../data/kitchenData';
import { getPizzaSauceAssetUrl, getPizzaToppingAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { IdleHandPointer, useIdleHint } from './MiniGameShell';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, NeedRow, Plate, useStepHint } from './CookKit';

/**
 * Пицца как «миссия» из шагов (картинки, без текста):
 * рецепт → достать продукты → замесить тесто → соус → сыр → начинка → духовка → нарезать → угостить гостя.
 */

interface Recipe {
  id: string;
  title: string;
  sauce: string;
  toppings: PizzaToppingId[];
  perTopping: number;
}

const RECIPES: Recipe[] = [
  { id: 'margherita', title: 'Маргарита', sauce: 'tomato', toppings: ['tomato', 'basil', 'cheese_chunk'], perTopping: 2 },
  { id: 'pepperoni', title: 'Пепперони', sauce: 'tomato', toppings: ['pepperoni', 'olive'], perTopping: 3 },
  { id: 'veggie', title: 'Овощная', sauce: 'pesto', toppings: ['mushroom', 'pepper', 'broccoli', 'corn'], perTopping: 2 },
  { id: 'hawaii', title: 'Гавайская', sauce: 'cream', toppings: ['ham', 'pineapple'], perTopping: 3 },
];

const STEPS = [
  { id: 'pick', icon: '📖' },
  { id: 'gather', icon: '🧺' },
  { id: 'dough', icon: '🥣' },
  { id: 'sauce', icon: '🍅' },
  { id: 'cheese', icon: '🧀' },
  { id: 'top', icon: '🍄' },
  { id: 'bake', icon: '🔥' },
  { id: 'cut', icon: '🔪' },
  { id: 'serve', icon: '🍽️' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

const BOARD = 'min(66vmin, 600px)';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const say = (id: string, on: boolean) => playVoice(id, on);

interface Placed { uid: string; id: PizzaToppingId; x: number; y: number; r: number; s: number }

const PizzaPreview: React.FC<{ r: Recipe; size: string }> = ({ r, size }) => (
  <div className="relative rounded-full overflow-hidden" style={{ width: size, height: size }}>
    <img src="/assets/items/pizza/dough.webp" alt="" className="absolute inset-0 w-full h-full object-contain" />
    {getPizzaSauceAssetUrl(r.sauce) && <img src={getPizzaSauceAssetUrl(r.sauce)!} alt="" className="absolute inset-[8%] w-[84%] h-[84%] object-contain" />}
    <img src="/assets/items/pizza/cheese_layer.webp" alt="" className="absolute inset-[8%] w-[84%] h-[84%] object-contain" />
    {r.toppings.flatMap((t, ti) => [0, 1, 2].map((k) => (
      <img key={`${t}${k}`} src={getPizzaToppingAssetUrl(t)} alt="" className="absolute w-[22%]"
        style={{ left: `${50 + 26 * Math.cos((ti * 3 + k) * 1.3)}%`, top: `${50 + 26 * Math.sin((ti * 3 + k) * 1.3)}%`, transform: 'translate(-50%,-50%)' }} />
    )))}
  </div>
);

export const PizzaMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const step: StepId = STEPS[stepIdx].id;
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [basket, setBasket] = useState<PizzaToppingId[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [turns, setTurns] = useState(0);
  const [blobs, setBlobs] = useState<{ x: number; y: number }[]>([]);
  const [sauceDone, setSauceDone] = useState(false);
  const [cheese, setCheese] = useState(0);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selTop, setSelTop] = useState<PizzaToppingId | null>(null);
  const [ovenState, setOvenState] = useState<'idle' | 'baking' | 'ready' | 'out'>('idle');
  const [bakePct, setBakePct] = useState(0);
  const [cuts, setCuts] = useState<number[]>([]);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('pizza', character.id), [servedKey, character.id]);

  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ a0?: number; sx?: number; sy?: number; down: boolean }>({ down: false });
  const need = recipe.toppings.length * recipe.perTopping;
  const { showHint, resetIdle } = useIdleHint(7000, step !== 'serve' && step !== 'bake');

  const [doneFx, setDoneFx] = useState(false);
  const stepBusy = useRef(false);
  const goNext = useCallback(
    (voice?: string) => {
      if (stepBusy.current) return; // повторные нажатия, пока помощник договаривает, не перескакивают шаги
      stepBusy.current = true;
      soundEngine.playGameOk(soundEnabled);
      setDoneFx(true); // большая звезда: шаг выполнен
      if (voice) window.setTimeout(() => say(voice, soundEnabled), 150);
      window.setTimeout(() => whenVoiceIdle(() => {
        setDoneFx(false);
        stepBusy.current = false;
        setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
        resetIdle();
      }), 900);
    },
    [soundEnabled, resetIdle],
  );

  const restart = () => {
    stepBusy.current = false; setStepIdx(0); setBasket([]); setTurns(0); setBlobs([]); setSauceDone(false); setCheese(0);
    setPlaced([]); setSelTop(null); setOvenState('idle'); setBakePct(0); setCuts([]);
  };

  // подсказка-озвучка шага при входе
  useEffect(() => {
    drag.current.down = false;
    const m: Record<string, string> = { pick: 'pm_pick', gather: 'pm_gather', dough: 'pm_dough', sauce: 'pm_sauce', cheese: 'pm_cheese', top: 'pm_top', bake: 'pm_bake', cut: 'pm_cut', serve: 'pm_serve' };
    if (m[step] && step !== 'serve') say(m[step], soundEnabled);
    if (step === 'serve') {
      setServedKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---------- геометрия доски ----------
  const toLocal = (e: React.PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    return { x, y, d: Math.hypot(x, y) };
  };

  const onDown = (e: React.PointerEvent) => {
    resetIdle();
    const p = toLocal(e);
    drag.current = { down: true, a0: Math.atan2(p.y, p.x), sx: p.x, sy: p.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    if (step === 'cheese' && p.d < 0.95) addCheese(p);
    if (step === 'top' && p.d < 0.82) placeTopping(p);
  };

  const addCheese = (p: { x: number; y: number }) => {
    soundEngine.playGamePop(soundEnabled, 3 + (cheese % 4));
    setCheese((c) => {
      const n = c + 1;
      if (n === 14) window.setTimeout(() => goNext('pm_ok_cheese'), 250);
      return Math.min(n, 14);
    });
  };

  const placeTopping = (p: { x: number; y: number }) => {
    const id = selTop ?? recipe.toppings.find((t) => placed.filter((q) => q.id === t).length < recipe.perTopping);
    if (!id) return;
    placeToppingId(id, p);
  };
  const placeToppingId = (id: PizzaToppingId, p: { x: number; y: number }) => {
    if (placed.filter((q) => q.id === id).length >= recipe.perTopping) return;
    soundEngine.playGamePop(soundEnabled, 5);
    const np = [...placed, { uid: `${id}-${Date.now()}`, id, x: p.x, y: p.y, r: rnd(-40, 40), s: rnd(0.9, 1.15) }];
    setPlaced(np);
    const left = recipe.toppings.find((t) => np.filter((q) => q.id === t).length < recipe.perTopping);
    setSelTop(left ?? null);
    if (np.length >= need) window.setTimeout(() => goNext('pm_ok_top'), 400);
  };

  /** Вкусняшку перетащили с тарелки на пиццу */
  const dropTopping = (id: PizzaToppingId, cx: number, cy: number) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((cx - r.left) / r.width) * 2 - 1, y = ((cy - r.top) / r.height) * 2 - 1;
    const d = Math.hypot(x, y);
    const k = d > 0.78 ? 0.78 / d : 1;
    setSelTop(id);
    placeToppingId(id, { x: x * k, y: y * k });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.down) return;
    const p = toLocal(e);
    if (step === 'dough') {
      const a = Math.atan2(p.y, p.x);
      let da = a - (drag.current.a0 ?? a);
      if (da > Math.PI) da -= 2 * Math.PI;
      if (da < -Math.PI) da += 2 * Math.PI;
      drag.current.a0 = a;
      if (p.d > 0.15 && p.d < 1.1) {
        setTurns((t) => {
          const n = t + Math.abs(da) / (2 * Math.PI);
          if (t < 3 && n >= 3) window.setTimeout(() => goNext('pm_ok_dough'), 250);
          return Math.min(n, 3);
        });
      }
    } else if (step === 'sauce' && p.d < 0.9) {
      setBlobs((b) => {
        const last = b[b.length - 1];
        if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.09) return b;
        const nb = [...b, { x: p.x, y: p.y }];
        if (nb.length >= 70 && !sauceDone) {
          setSauceDone(true);
          window.setTimeout(() => goNext('pm_ok_sauce'), 450);
        }
        return nb;
      });
    } else if (step === 'cheese' && p.d < 0.95) {
      const dx = p.x - (drag.current.sx ?? 0), dy = p.y - (drag.current.sy ?? 0);
      if (Math.hypot(dx, dy) > 0.22) { drag.current.sx = p.x; drag.current.sy = p.y; addCheese(p); }
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (step === 'cut' && drag.current.down) {
      const p = toLocal(e);
      const s = { x: drag.current.sx ?? 0, y: drag.current.sy ?? 0 };
      const len = Math.hypot(p.x - s.x, p.y - s.y);
      // расстояние от центра до прямой свайпа
      const dist = Math.abs(s.x * p.y - s.y * p.x) / Math.max(len, 0.001);
      if (len > 0.9 && dist < 0.4) {
        const ang = Math.atan2(p.y - s.y, p.x - s.x);
        soundEngine.playEraseSwoosh?.(soundEnabled);
        setCuts((c) => {
          const nc = [...c, ang];
          if (nc.length >= 3) window.setTimeout(() => goNext(), 500);
          return nc.slice(0, 3);
        });
      }
    }
    drag.current.down = false;
  };

  // ---------- духовка ----------
  const startBake = () => {
    if (ovenState !== 'idle') return;
    setOvenState('baking');
    soundEngine.playGamePop(soundEnabled, 2);
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      const pct = Math.min(1, (Date.now() - t0) / 4200);
      setBakePct(pct);
      if (pct >= 1) {
        window.clearInterval(iv);
        setOvenState('ready');
        soundEngine.playGameReward(soundEnabled);
        say('pm_bake_ready', soundEnabled);
      }
    }, 100);
  };
  const takeOut = () => {
    if (ovenState !== 'ready') return;
    setOvenState('out');
    window.setTimeout(() => goNext(), 700);
  };

  // ---------- сбор продуктов ----------
  const needSet = new Set<PizzaToppingId>(recipe.toppings);
  const pickIngredient = (id: PizzaToppingId) => {
    resetIdle();
    if (basket.includes(id)) return;
    if (needSet.has(id)) {
      soundEngine.playGameOk(soundEnabled);
      setBasket((b) => (b.includes(id) ? b : [...b, id]));
    } else {
      soundEngine.playGameFail(soundEnabled);
      setWrong(id);
      window.setTimeout(() => setWrong(null), 700);
      say('pm_wrong', soundEnabled);
    }
  };

  useEffect(() => {
    if (step === 'gather' && recipe.toppings.every((t) => basket.includes(t))) {
      const t = window.setTimeout(() => goNext('pm_ok_gather'), 600);
      return () => window.clearTimeout(t);
    }
  }, [basket, step, recipe, goNext]);

  // ---------- рисунки ----------
  const sauceUrl = getPizzaSauceAssetUrl(recipe.sauce);
  const baked = step === 'cut' || step === 'serve' || ovenState === 'out';
  const showDough = stepIdx >= 3 || turns >= 3;
  const doughScale = 0.55 + Math.min(turns, 3) / 3 * 0.45;
  const showSauce = sauceDone || stepIdx > 3;
  const showCheese = stepIdx > 4 ? 1 : cheese / 14;
  const pizzaBoard = (interactive: boolean, size: string = BOARD) => (
    <div
      ref={boardRef}
      onPointerDown={interactive ? onDown : undefined}
      onPointerMove={interactive ? onMove : undefined}
      onPointerUp={interactive ? onUp : undefined}
      onPointerCancel={interactive ? onUp : undefined}
      className="relative rounded-full select-none"
      style={{ width: size, height: size, touchAction: 'none', filter: baked ? 'sepia(0.45) saturate(1.3) brightness(0.92)' : undefined }}
    >
      {stepIdx >= 2 && (
        <img src="/assets/items/pizza/dough.webp" alt="" draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ transform: `scale(${showDough ? 1 : doughScale}) rotate(${turns * 120}deg)`, transition: 'transform 0.2s' }} />
      )}
      {step === 'sauce' && !sauceDone && sauceUrl && blobs.map((b, i) => (
        <span key={i} className="absolute rounded-full pointer-events-none"
          style={{ left: `${(b.x + 1) * 50}%`, top: `${(b.y + 1) * 50}%`, width: '15%', height: '15%', transform: 'translate(-50%,-50%)',
            backgroundImage: `url(${sauceUrl})`, backgroundSize: '600%', backgroundPosition: 'center' }} />
      ))}
      {showSauce && sauceUrl && <img src={sauceUrl} alt="" draggable={false} className="absolute inset-[6%] w-[88%] h-[88%] object-contain pointer-events-none animate-[fadeIn_0.5s]" />}
      {showCheese > 0 && <img src="/assets/items/pizza/cheese_layer.webp" alt="" draggable={false} className="absolute inset-[6%] w-[88%] h-[88%] object-contain pointer-events-none" style={{ opacity: showCheese }} />}
      {placed.map((t) => (
        <img key={t.uid} src={getPizzaToppingAssetUrl(t.id)} alt="" draggable={false}
          className="absolute pointer-events-none"
          style={{ left: `${(t.x + 1) * 50}%`, top: `${(t.y + 1) * 50}%`, width: '17%', transform: `translate(-50%,-50%) rotate(${t.r}deg) scale(${t.s})` }} />
      ))}
      {cuts.map((a, i) => (
        <span key={i} className="absolute left-1/2 top-1/2 h-[3px] bg-white/90 shadow origin-center pointer-events-none"
          style={{ width: '100%', transform: `translate(-50%,-50%) rotate(${a}rad)` }} />
      ))}
    </div>
  );

  // ---------- интерфейс: каждый шаг на весь экран ----------
  const basketRef = useRef<HTMLDivElement>(null);
  const ovenRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFromRef = useRef<HTMLButtonElement | null>(null);
  const showGesture = useStepHint(step, 2600, 7000, step !== 'serve' && step !== 'pick' && !doneFx && !(step === 'bake' && ovenState === 'baking'));

  const nextGather = recipe.toppings.find((t) => !basket.includes(t));
  // на полке только нужные продукты + 2–3 лишних (не перегружаем экран)
  // на полке все 12 продуктов в бесконечной ленте
  const gatherShelf = useMemo(() => [...PIZZA_TOPPINGS].sort(() => Math.random() - 0.5), [recipe]);
  const nextTop = recipe.toppings.find((t) => placed.filter((q) => q.id === t).length < recipe.perTopping);
  const hintFromId = step === 'gather' ? nextGather : step === 'top' ? (selTop ?? nextTop) : undefined;
  hintFromRef.current = hintFromId ? plateEls.current[hintFromId] ?? null : null;

  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = boardRef;
  let hintItem: string | undefined;
  if (step === 'gather') { hintKind = 'drag'; hintTarget = basketRef; hintItem = nextGather && getPizzaToppingAssetUrl(nextGather); }
  else if (step === 'dough') hintKind = 'circle';
  else if (step === 'sauce') hintKind = 'rub';
  else if (step === 'cheese') hintKind = 'rub';
  else if (step === 'top') { hintKind = 'drag'; hintItem = hintFromId && getPizzaToppingAssetUrl(hintFromId); }
  else if (step === 'bake') { hintKind = 'tap'; hintTarget = ovenRef; }
  else if (step === 'cut') hintKind = 'swipe';

  const toppingName = (id: PizzaToppingId) => PIZZA_TOPPINGS.find((p) => p.id === id)?.name ?? '';

  const tray =
    step === 'gather' ? <LoopScroller>{gatherShelf.map((t) => (
      <Plate key={t.id} src={getPizzaToppingAssetUrl(t.id)} label={t.name}
        plateRef={(el) => { plateEls.current[t.id] = el; }}
        onPick={() => pickIngredient(t.id)} target={basketRef} onDrop={() => pickIngredient(t.id)}
        dim={basket.includes(t.id)} wrong={wrong === t.id} />
    ))}</LoopScroller>
    : step === 'sauce' && sauceUrl ? <Plate src={sauceUrl} label="Соус" />
    : step === 'cheese' ? <Plate src="/assets/items/pizza/cheese_layer.webp" label="Сыр" />
    : step === 'top' ? recipe.toppings.map((t) => {
        const left = recipe.perTopping - placed.filter((q) => q.id === t).length;
        return (
          <Plate key={t} src={getPizzaToppingAssetUrl(t)} label={toppingName(t)}
            plateRef={(el) => { plateEls.current[t] = el; }}
            onPick={() => setSelTop(t)} target={boardRef} onDrop={(x, y) => dropTopping(t, x, y)}
            selected={(selTop ?? nextTop) === t && left > 0} dim={left <= 0} badge={Math.max(left, 0)} />
        );
      })
    : undefined;

  return (
    <CookScreen stepKey={step} stepIdx={stepIdx} total={STEPS.length} done={doneFx} trayLoop={step === 'gather'}
      recipe={step !== 'pick' && step !== 'serve' ? <PizzaPreview r={recipe} size="92%" /> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className="grid grid-cols-2 gap-[3vmin]">
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={r.title}
              onClick={() => { if (doneFx) return; setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => goNext(), 250); }}
              className="rounded-full bg-white/90 shadow-xl p-[1.5vmin] active:scale-95 transition-transform">
              <PizzaPreview r={r} size="min(32vmin, 260px)" />
            </button>
          ))}
        </div>
      )}

      {step === 'gather' && (
        <div className="flex flex-col items-center gap-[3vmin]">
        <NeedRow items={recipe.toppings.map((t) => ({ key: t, src: getPizzaToppingAssetUrl(t), done: basket.includes(t) }))} />
        <div ref={basketRef} className="relative flex flex-col items-center justify-end" style={{ width: 'min(58vmin, 480px)', height: 'min(44vmin, 360px)' }}>
          <div className="absolute inset-x-[8%] bottom-[18%] flex flex-wrap justify-center gap-1 z-10">
            {basket.map((b) => <img key={b} src={getPizzaToppingAssetUrl(b)} alt="" className="w-[22%] object-contain animate-pop-in drop-shadow" />)}
          </div>
          <div className="text-[min(40vmin,330px)] leading-none select-none">🧺</div>
        </div>
        </div>
      )}

      {(step === 'dough' || step === 'sauce' || step === 'cheese' || step === 'top' || step === 'cut') && (
        <div className="flex flex-col items-center gap-[3vmin]">
        {step === 'top' && <NeedRow items={recipe.toppings.map((t) => ({ key: t, src: getPizzaToppingAssetUrl(t), done: placed.filter((q) => q.id === t).length >= recipe.perTopping }))} />}
        <div className="rounded-full bg-[#C7A27C] shadow-[0_14px_0_#A07C58,0_24px_40px_rgba(0,0,0,0.25)] flex items-center justify-center"
          style={{ width: `calc(${BOARD} * 1.1)`, height: `calc(${BOARD} * 1.1)` }}>
          {pizzaBoard(true)}
        </div>
        </div>
      )}

      {step === 'bake' && (
        <button ref={ovenRef} type="button" aria-label="Духовка" onClick={ovenState === 'idle' ? startBake : takeOut}
          className="relative rounded-[3rem] bg-gradient-to-b from-[#64748B] to-[#334155] shadow-2xl p-[2.5vmin] active:scale-95 transition-transform"
          style={{ width: 'min(86vmin, 720px)', height: 'min(60vmin, 500px)' }}>
          <div className="w-full h-full rounded-[2rem] bg-[#1E293B] overflow-hidden relative flex items-center justify-center"
            style={{ boxShadow: ovenState === 'baking' ? 'inset 0 0 90px #FB923C' : 'inset 0 0 20px #000' }}>
            <div className="w-[58%]" style={{ aspectRatio: '1', opacity: ovenState === 'idle' ? 0.25 : 1, transition: 'opacity .6s' }}>{pizzaBoard(false, '100%')}</div>
            {ovenState === 'baking' && <div className="absolute left-0 bottom-0 h-3 bg-[#FB923C]" style={{ width: `${bakePct * 100}%` }} />}
          </div>
          <div className="absolute -top-[7vmin] left-1/2 -translate-x-1/2 text-[9vmin]">{ovenState === 'idle' ? '🔥' : ovenState === 'baking' ? '⏳' : '🔔'}</div>
        </button>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={pizzaBoard(false, 'min(40vmin, 320px)')} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFromRef : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
