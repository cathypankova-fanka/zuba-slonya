import { createPortal } from 'react-dom';
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
import { CookScreen, GestureHint, HintKind, LoopScroller, NeedRow, Plate, TopBasket, useStepHint } from './CookKit';

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
  { id: 'mushroom', title: 'Грибная', sauce: 'cream', toppings: ['mushroom', 'cheese_chunk', 'basil'], perTopping: 2 },
  { id: 'sea', title: 'Морская', sauce: 'tomato', toppings: ['shrimp', 'olive', 'basil'], perTopping: 2 },
  { id: 'ham_mush', title: 'Ветчина и грибы', sauce: 'tomato', toppings: ['ham', 'mushroom'], perTopping: 3 },
  { id: 'cheesy', title: 'Четыре сыра', sauce: 'cheese', toppings: ['cheese_chunk'], perTopping: 6 },
  { id: 'green', title: 'Зелёная', sauce: 'pesto', toppings: ['broccoli', 'pepper', 'basil'], perTopping: 2 },
  { id: 'sunny', title: 'Солнышко', sauce: 'cheese', toppings: ['corn', 'pineapple', 'tomato'], perTopping: 2 },
  { id: 'kids', title: 'Детская', sauce: 'tomato', toppings: ['ham', 'corn', 'cheese_chunk'], perTopping: 2 },
  { id: 'spicy', title: 'Пепперони с перчиком', sauce: 'tomato', toppings: ['pepperoni', 'pepper', 'olive'], perTopping: 2 },
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
  // dev: ?step=bake открывает сразу на шаге
  const [stepIdx, setStepIdx] = useState(() => (import.meta.env.DEV ? Math.max(0, STEPS.findIndex((x) => x.id === new URLSearchParams(location.search).get('step'))) : 0));
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
  // духовка: пицца на лопатке → внутрь (тащить) → держать огонь → дверца открыть → пицца выезжает
  const [ovenState, setOvenState] = useState<'idle' | 'in' | 'baking' | 'ready' | 'open' | 'out'>('idle');
  const [pizzaDrag, setPizzaDrag] = useState<{ x: number; y: number } | null>(null);
  const [heating, setHeating] = useState(false);
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
    setPlaced([]); setSelTop(null); setOvenState('idle'); setBakePct(0); setHeating(false); setCuts([]);
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
  const putIn = () => {
    if (ovenState !== 'idle') return;
    setOvenState('in');
    soundEngine.playGamePop(soundEnabled, 3);
  };
  // держишь огонь — печётся; отпустил — пауза
  useEffect(() => {
    if (!heating || (ovenState !== 'in' && ovenState !== 'baking')) return;
    if (ovenState === 'in') setOvenState('baking');
    let raf = 0, last = performance.now(), tick = 0;
    const f = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      tick += dt;
      if (tick > 0.35) { tick = 0; soundEngine.playGamePop(soundEnabled, 1); }
      setBakePct((p) => {
        const n = Math.min(1, p + dt / 3.6);
        if (p < 1 && n >= 1) {
          setHeating(false);
          setOvenState('ready');
          soundEngine.playGameReward(soundEnabled);
          say('pm_bake_ready', soundEnabled);
        }
        return n;
      });
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    const up = () => setHeating(false);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [heating, ovenState, soundEnabled]);
  const openDoor = () => {
    if (ovenState !== 'ready') return;
    setOvenState('open');
    soundEngine.playGameFlip(soundEnabled);
    window.setTimeout(() => { setOvenState('out'); soundEngine.playGameOk(soundEnabled); }, 900);
    window.setTimeout(() => goNext(), 2000);
  };
  // перетаскивание пиццы с лопатки в духовку
  const pizzaDown = (e: React.PointerEvent) => {
    if (ovenState !== 'idle') return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setPizzaDrag({ x: e.clientX, y: e.clientY });
  };
  const pizzaMove = (e: React.PointerEvent) => { if (pizzaDrag) setPizzaDrag({ x: e.clientX, y: e.clientY }); };
  const pizzaUp = (e: React.PointerEvent) => {
    if (!pizzaDrag) return;
    setPizzaDrag(null);
    const r = ovenRef.current?.getBoundingClientRect();
    if (r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) putIn();
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
  const baked = step === 'cut' || step === 'serve' || ovenState === 'ready' || ovenState === 'open' || ovenState === 'out';
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
  const ovenRef = useRef<HTMLDivElement>(null);
  const peelRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLButtonElement>(null);
  const doorRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFromRef = useRef<HTMLButtonElement | null>(null);
  const showGesture = useStepHint(step, 2600, 7000, step !== 'serve' && step !== 'pick' && !doneFx && !(step === 'bake' && (heating || ovenState === 'open' || ovenState === 'out')));

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
  else if (step === 'bake') {
    if (ovenState === 'idle') { hintKind = 'drag'; hintTarget = ovenRef; hintFromRef.current = peelRef.current as unknown as HTMLButtonElement; }
    else if (ovenState === 'in' || ovenState === 'baking') { hintKind = 'hold'; hintTarget = knobRef; }
    else { hintKind = 'swipe'; hintTarget = doorRef; }
  }
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
        <div className={`grid ${window.innerHeight > window.innerWidth * 1.2 ? 'grid-cols-3' : 'grid-cols-6 pr-[min(15vmin,140px)]'} gap-[2vmin] px-2`}>
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={r.title}
              onClick={() => { if (doneFx) return; setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => goNext(), 250); }}
              className="rounded-full bg-white/90 shadow-xl p-[1.5vmin] active:scale-95 transition-transform">
              <PizzaPreview r={r} size={window.innerHeight > window.innerWidth * 1.2 ? 'min(25vw, 14vh)' : 'min(15vmin, 150px)'} />
            </button>
          ))}
        </div>
      )}

      {step === 'gather' && (
        <div className="flex flex-col items-center gap-[3vmin]">
        <NeedRow items={recipe.toppings.map((t) => ({ key: t, src: getPizzaToppingAssetUrl(t), done: basket.includes(t) }))} />
        <TopBasket boxRef={basketRef} size="min(86vw, 72vmin, 560px)" items={basket.map((b) => getPizzaToppingAssetUrl(b))} />
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

      {step === 'bake' && (() => {
        const portraitOven = window.innerHeight > window.innerWidth * 1.2;
        const OV = portraitOven ? 'min(84vw, 44vh, 520px)' : 'min(58vmin, 520px)';
        const inside = ovenState !== 'idle';
        const glow = heating ? 1 : ovenState === 'baking' ? 0.45 : ovenState === 'ready' ? 0.6 : 0;
        return (
          <div className={`flex ${portraitOven ? 'flex-col' : 'flex-row'} items-center gap-[4vmin]`}>
            {/* духовка */}
            <div ref={ovenRef} className="relative rounded-[2rem] shrink-0" style={{ width: OV, height: `calc(${OV} * 0.86)`, background: 'linear-gradient(#CBD5E1, #94A3B8)', boxShadow: '0 18px 30px rgba(0,0,0,.3), inset 0 4px 0 #F1F5F9' }}>
              {/* панель с кнопкой огня */}
              <div className="absolute left-[5%] right-[5%] top-[4%] h-[16%] rounded-xl bg-[#334155] flex items-center justify-between px-[4%]">
                <div className="flex gap-1">{[0, 1, 2].map((k) => <span key={k} className="w-3 h-3 rounded-full" style={{ background: glow > 0 ? '#FB923C' : '#475569' }} />)}</div>
                <div className="h-[40%] w-[44%] rounded-full bg-[#1E293B] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${bakePct * 100}%`, background: 'linear-gradient(90deg,#FDE047,#F97316,#DC2626)' }} /></div>
                <button ref={knobRef} type="button" aria-label="Огонь"
                  onPointerDown={(e) => { e.preventDefault(); if (ovenState === 'in' || ovenState === 'baking') setHeating(true); }}
                  className={`relative h-[86%] aspect-square rounded-full border-4 border-white flex items-center justify-center touch-none transition-transform ${heating ? 'scale-90 bg-[#F97316]' : 'bg-[#EF4444]'} ${(ovenState === 'in' || ovenState === 'baking') && !heating ? 'animate-pulse ring-4 ring-[#FDE047]' : ''}`}
                  style={{ fontSize: `calc(${OV} * 0.07)` }}>🔥</button>
              </div>
              {/* камера: пицца внутри, светится жаром */}
              <div className="absolute left-[7%] right-[7%] top-[24%] bottom-[7%] rounded-[1.2rem] overflow-hidden flex items-center justify-center" style={{ background: '#1E1B1A', boxShadow: `inset 0 0 ${40 + glow * 80}px rgba(251,146,60,${0.25 + glow * 0.7})` }}>
                {/* спиральки-тэны */}
                <div className="absolute left-[6%] right-[6%] top-[8%] h-[4%] rounded-full" style={{ background: glow > 0 ? '#F97316' : '#57534E', boxShadow: glow > 0 ? '0 0 14px #F97316' : undefined }} />
                <div className="absolute left-[6%] right-[6%] bottom-[8%] h-[4%] rounded-full" style={{ background: glow > 0 ? '#F97316' : '#57534E', boxShadow: glow > 0 ? '0 0 14px #F97316' : undefined }} />
                {inside && ovenState !== 'out' && (
                  <div className="w-[62%]" style={{ aspectRatio: '1', animation: ovenState === 'in' ? 'drop-in .5s ease-out both' : undefined, transform: ovenState === 'open' ? 'translateY(28%) scale(1.08)' : undefined, transition: 'transform .8s ease-out' }}>
                    {pizzaBoard(false, '100%')}
                  </div>
                )}
                {heating && [0, 1, 2].map((k) => <span key={k} className="absolute text-[min(7vmin,40px)] pointer-events-none" style={{ left: `${20 + k * 28}%`, bottom: '14%', animation: `steam-rise 1.2s ease-out ${k * 0.3}s infinite`, opacity: 0 }}>〰️</span>)}
                {(ovenState === 'open' || ovenState === 'out') && [0, 1, 2].map((k) => (
                  <img key={k} src="/assets/items/soup2/steam.webp" alt="" className="absolute w-[34%] pointer-events-none" style={{ left: `${10 + k * 26}%`, top: '10%', animation: `steam-rise 1.8s ease-out ${k * 0.4}s infinite`, opacity: 0 }} />
                ))}
              </div>
              {/* дверца со стеклом: открывается вниз */}
              <button ref={doorRef} type="button" aria-label="Дверца духовки"
                onClick={openDoor}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).dataset.y = String(e.clientY); }}
                onPointerUp={(e) => { const y0 = Number((e.currentTarget as HTMLElement).dataset.y || e.clientY); if (e.clientY - y0 > 30) openDoor(); }}
                className="absolute left-[5%] right-[5%] top-[22%] bottom-[5%] rounded-[1.4rem]"
                style={{
                  transformOrigin: '50% 100%', transform: ovenState === 'open' || ovenState === 'out' ? 'perspective(700px) rotateX(-78deg)' : 'none',
                  transition: 'transform .7s cubic-bezier(.3,1.3,.6,1)', pointerEvents: ovenState === 'ready' ? 'auto' : 'none',
                  background: 'transparent', border: `calc(${OV} * 0.035) solid #E2E8F0`, borderTopWidth: `calc(${OV} * 0.09)`, boxShadow: '0 6px 10px rgba(0,0,0,.25), inset 0 0 0 3px rgba(255,255,255,.5)',
                }}>
                <span className="absolute left-[10%] right-[10%] rounded-full bg-[#64748B]" style={{ top: `calc(${OV} * -0.065)`, height: `calc(${OV} * 0.035)` }} />
                <span className="absolute inset-0 rounded-[0.8rem]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.22) 0 18%, rgba(255,255,255,0) 30%, rgba(255,255,255,.12) 45%, rgba(255,255,255,0) 55%)' }} />
                {ovenState === 'ready' && <span className="absolute -top-[30%] left-1/2 -translate-x-1/2 text-[min(10vmin,56px)] animate-bounce">🔔</span>}
              </button>
            </div>
            {/* пицца на лопатке — тащи в духовку */}
            {!inside && (
              <div ref={peelRef} className="relative shrink-0" style={{ width: `calc(${OV} * 0.62)` }}>
                <div className="absolute left-1/2 -translate-x-1/2 top-[92%] w-[16%] h-[40%] rounded-b-xl bg-[#B7793F]" />
                <div onPointerDown={pizzaDown} onPointerMove={pizzaMove} onPointerUp={pizzaUp} onPointerCancel={() => setPizzaDrag(null)}
                  className="relative rounded-full p-[6%] cursor-grab touch-none" style={{ aspectRatio: '1', background: '#D6A56A', boxShadow: '0 10px 18px rgba(0,0,0,.25)', opacity: pizzaDrag ? 0.4 : 1 }}>
                  <div className="w-full h-full pointer-events-none">{pizzaBoard(false, '100%')}</div>
                </div>
              </div>
            )}
            {pizzaDrag && createPortal(
              <div className="fixed z-[60] pointer-events-none" style={{ left: pizzaDrag.x, top: pizzaDrag.y, width: `calc(${OV} * 0.5)`, transform: 'translate(-50%,-50%) scale(1.05)', filter: 'drop-shadow(0 12px 14px rgba(0,0,0,.35))' }}>
                <div style={{ aspectRatio: '1' }}>{pizzaBoard(false, '100%')}</div>
              </div>,
              document.body,
            )}
          </div>
        );
      })()}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={pizzaBoard(false, 'min(40vmin, 320px)')} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFromRef : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
