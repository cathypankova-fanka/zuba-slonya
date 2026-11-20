import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { PizzaToppingId, PIZZA_TOPPINGS } from '../data/kitchenData';
import { getPizzaSauceAssetUrl, getPizzaToppingAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { IdleHandPointer, useIdleHint } from './MiniGameShell';
import { FeedServe, GoalCard } from './MissionKit';

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

const BOARD = 'min(58vw, 36vh)';
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
    setStepIdx(0); setBasket([]); setTurns(0); setBlobs([]); setSauceDone(false); setCheese(0);
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
    if (placed.filter((q) => q.id === id).length >= recipe.perTopping) return;
    soundEngine.playGamePop(soundEnabled, 5);
    const np = [...placed, { uid: `${id}-${Date.now()}`, id, x: p.x, y: p.y, r: rnd(-40, 40), s: rnd(0.9, 1.15) }];
    setPlaced(np);
    const left = recipe.toppings.find((t) => np.filter((q) => q.id === t).length < recipe.perTopping);
    setSelTop(left ?? null);
    if (np.length >= need) window.setTimeout(() => goNext('pm_ok_top'), 400);
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

  // ---------- интерфейс ----------
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center gap-2 pt-1 relative overflow-hidden" onPointerDown={() => resetIdle()}>
      {/* Панель шагов: картинки */}
      <div className="toy-pill flex items-center gap-1 px-2 py-1 z-10">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" aria-label={`шаг ${i + 1}`}
            onClick={() => { say(`pm_${s.id}`, soundEnabled); }}
            className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full text-lg sm:text-2xl flex items-center justify-center transition-all ${
              i < stepIdx ? 'bg-[#10C97A] text-white scale-90' : i === stepIdx ? 'bg-[#FFB800] animate-pulse scale-110' : 'bg-white/70 opacity-60'}`}>
            {i < stepIdx ? '✓' : s.icon}
          </button>
        ))}
      </div>

      {/* Цель — готовая пицца крупно + то, что нужно на этом шаге */}
      {step !== 'pick' && step !== 'serve' && (
        <GoalCard
          dishNode={<PizzaPreview r={recipe} size="112px" />}
          images={
            step === 'gather' || step === 'top' ? recipe.toppings.map((t) => getPizzaToppingAssetUrl(t))
            : step === 'sauce' && sauceUrl ? [sauceUrl]
            : step === 'cheese' ? ['/assets/items/pizza/cheese_layer.webp']
            : []
          }
        />
      )}

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3 relative">
        {step === 'pick' && (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 p-2">
            {RECIPES.map((r) => (
              <button key={r.id} type="button" aria-label={r.title}
                onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => goNext(), 250); }}
                className="toy-pill rounded-3xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform bg-white/90">
                <div className="relative w-[34vw] h-[34vw] max-w-[190px] max-h-[190px] rounded-full overflow-hidden bg-[#FDE68A] flex items-center justify-center">
                  <img src="/assets/items/pizza/dough.webp" alt="" className="absolute inset-0 w-full h-full object-contain" />
                  {getPizzaSauceAssetUrl(r.sauce) && <img src={getPizzaSauceAssetUrl(r.sauce)!} alt="" className="absolute inset-[8%] w-[84%] h-[84%] object-contain" />}
                  {r.toppings.flatMap((t, ti) => [0, 1, 2].map((k) => (
                    <img key={`${t}${k}`} src={getPizzaToppingAssetUrl(t)} alt="" className="absolute w-[22%]"
                      style={{ left: `${50 + 26 * Math.cos((ti * 3 + k) * 1.3)}%`, top: `${50 + 26 * Math.sin((ti * 3 + k) * 1.3)}%`, transform: 'translate(-50%,-50%)' }} />
                  )))}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'gather' && (
          <div className="flex flex-col items-center gap-3 w-full px-2">
            <div className="text-5xl">🧊 ➜ 🧺</div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-white/80 rounded-3xl p-3 shadow-inner">
              {PIZZA_TOPPINGS.map((t) => (
                <button key={t.id} type="button" aria-label={t.name} onClick={() => pickIngredient(t.id)}
                  className={`w-[17vw] h-[17vw] max-w-[86px] max-h-[86px] rounded-2xl bg-white shadow flex items-center justify-center transition-all ${
                    basket.includes(t.id) ? 'opacity-30 scale-75' : wrong === t.id ? 'animate-[wiggle_0.4s]' : 'active:scale-90'}`}
                  style={wrong === t.id ? { background: '#FEE2E2' } : undefined}>
                  <img src={getPizzaToppingAssetUrl(t.id)} alt="" draggable={false} className="w-[80%] h-[80%] object-contain" />
                </button>
              ))}
            </div>
            <div className="toy-pill px-3 py-2 flex items-center gap-1 min-h-[56px] min-w-[120px] justify-center">
              <span className="text-3xl">🧺</span>
              {basket.map((b) => <img key={b} src={getPizzaToppingAssetUrl(b)} alt="" className="w-9 h-9 object-contain" />)}
            </div>
          </div>
        )}

        {(step === 'dough' || step === 'sauce' || step === 'cheese' || step === 'top' || step === 'cut') && (
          <div className="relative">
            <div className="rounded-full bg-[#C7A27C] shadow-[0_10px_0_#A07C58] p-[3%]" style={{ width: `calc(${BOARD} * 1.12)`, height: `calc(${BOARD} * 1.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pizzaBoard(true)}
            </div>
            {step === 'dough' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-6xl opacity-60">🔄</div>}
            {step === 'cut' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-5xl opacity-70">🔪✂️</div>}
            {showHint && !step.startsWith('x') && <IdleHandPointer className="absolute left-[44%] top-[44%]" />}
          </div>
        )}

        {step === 'top' && (
          <div className="toy-pill px-2 py-2 flex gap-2">
            {recipe.toppings.map((t) => {
              const left = recipe.perTopping - placed.filter((q) => q.id === t).length;
              return (
                <button key={t} type="button" aria-label={PIZZA_TOPPINGS.find((p) => p.id === t)?.name} onClick={() => setSelTop(t)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white flex items-center justify-center ${selTop === t || (!selTop && left > 0 && recipe.toppings.find((x) => placed.filter((q) => q.id === x).length < recipe.perTopping) === t) ? 'ring-4 ring-[#FFB800] scale-110' : ''} ${left <= 0 ? 'opacity-30' : ''}`}>
                  <img src={getPizzaToppingAssetUrl(t)} alt="" className="w-[80%] h-[80%] object-contain" />
                  <span className="absolute -top-1 -right-1 bg-[#FF3B5C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{Math.max(left, 0)}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 'bake' && (
          <div className="flex flex-col items-center gap-3">
            <button type="button" aria-label="Духовка" onClick={ovenState === 'idle' ? startBake : takeOut}
              className="relative rounded-[2rem] bg-gradient-to-b from-[#64748B] to-[#334155] shadow-xl p-4 active:scale-95 transition-transform"
              style={{ width: 'min(70vw, 340px)', height: 'min(50vw, 250px)' }}>
              <div className="w-full h-full rounded-2xl bg-[#1E293B] overflow-hidden relative flex items-center justify-center"
                style={{ boxShadow: ovenState === 'baking' ? 'inset 0 0 60px #FB923C' : 'inset 0 0 20px #000' }}>
                <div className="absolute inset-0 transition-all duration-700 flex items-center justify-center"
                  style={{ transform: ovenState === 'idle' ? 'translateY(120%) scale(0.9)' : 'translateY(0) scale(0.55)' }}>
                  <div className="w-[70%]" style={{ aspectRatio: '1' }}>{pizzaBoard(false)}</div>
                </div>
                {ovenState === 'baking' && <div className="absolute inset-x-0 bottom-0 h-2 bg-[#FB923C]" style={{ width: `${bakePct * 100}%` }} />}
              </div>
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-4xl">{ovenState === 'idle' ? '👆🔥' : ovenState === 'baking' ? '⏳' : '🔔'}</div>
            </button>
            {ovenState === 'idle' && <div className="w-28 sm:w-36"><div className="w-full" style={{ aspectRatio: '1' }}>{pizzaBoard(false)}</div></div>}
          </div>
        )}

        {step === 'serve' && (
          <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
            dish={pizzaBoard(false, 'min(36vw, 22vh)')} />
        )}
      </div>
    </div>
  );
};
