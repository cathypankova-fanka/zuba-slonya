import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { bottleSrc, CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { P, say, shuffle, Stove, useHold, useRub, useSteps } from './PlayKit';

/**
 * Бургер и картошка фри: выбрать бургер → котлетку на сковородку → перевернуть (смахнуть вверх) →
 * собрать бургер по рецепту (по порядку) → кетчуп пальчиком → крышечка-булочка →
 * нарезать картошку → обжарить во фритюре (держать) → посолить → угостить героя.
 */

const STEPS = ['pick', 'grill', 'flip', 'build', 'ketchup', 'lid', 'cut', 'fry', 'salt', 'serve'] as const;
const VOICES = { pick: 'bg_pick', grill: 'bg_grill', flip: 'bg_flip', build: 'bg_build', ketchup: 'bg_ketchup', cut: 'bg_cut', fry: 'bg_fry', salt: 'bg_salt' };

interface Layer { id: string; name: string; src: string; /** толщина слоя в долях ширины бургера */ h: number; /** ширина картинки относительно булочки */ w: number; /** высота картинки / ширина */ a: number }
const LAYERS: Layer[] = [
  { id: 'bun_bottom', name: 'Нижняя булочка', src: P('bun_bottom'), h: 0.2, w: 1, a: 0.58 },
  { id: 'patty', name: 'Котлетка', src: P('patty_cooked'), h: 0.17, w: 0.98, a: 0.7 },
  { id: 'cheese', name: 'Сыр', src: P('cheese_slice'), h: 0.08, w: 1.04, a: 0.66 },
  { id: 'lettuce', name: 'Салат', src: P('lettuce_leaf'), h: 0.1, w: 1.1, a: 0.66 },
  { id: 'tomato', name: 'Помидорка', src: P('tomato_slice'), h: 0.09, w: 0.74, a: 0.83 },
  { id: 'pickles', name: 'Огурчики', src: P('pickles'), h: 0.09, w: 0.86, a: 0.69 },
  { id: 'egg', name: 'Яичко', src: '/assets/items/sandwich/fillings/egg.webp', h: 0.08, w: 0.86, a: 0.86 },
  { id: 'ham', name: 'Ветчина', src: '/assets/items/sandwich/fillings/ham.webp', h: 0.08, w: 0.9, a: 0.82 },
  { id: 'salami', name: 'Колбаска', src: '/assets/items/sandwich/fillings/salami.webp', h: 0.08, w: 0.9, a: 0.81 },
  { id: 'avocado', name: 'Авокадо', src: '/assets/items/sandwich/fillings/avocado_slice.webp', h: 0.09, w: 0.84, a: 0.86 },
  { id: 'salmon', name: 'Рыбка', src: '/assets/items/sandwich/fillings/salmon.webp', h: 0.12, w: 0.84, a: 0.75 },
  { id: 'mushroom', name: 'Грибочки', src: '/assets/items/soup2/mushroom_slices.webp', h: 0.09, w: 0.78, a: 0.8 },
  { id: 'bun_top', name: 'Верхняя булочка', src: P('bun_top'), h: 0.34, w: 1, a: 0.69 },
];
const layer = (id: string) => LAYERS.find((l) => l.id === id)!;

interface Recipe { id: string; name: string; mid: string[] }
const RECIPES: Recipe[] = [
  { id: 'classic', name: 'Чизбургер', mid: ['patty', 'cheese', 'lettuce', 'tomato'] },
  { id: 'garden', name: 'Огородный', mid: ['patty', 'lettuce', 'tomato', 'pickles'] },
  { id: 'cheesy', name: 'Сырный', mid: ['patty', 'cheese', 'pickles'] },
  { id: 'fresh', name: 'Свежий', mid: ['lettuce', 'patty', 'tomato'] },
  { id: 'double', name: 'Двойной', mid: ['patty', 'cheese', 'patty', 'cheese'] },
  { id: 'egg', name: 'С яичком', mid: ['patty', 'cheese', 'egg'] },
  { id: 'avocado', name: 'С авокадо', mid: ['lettuce', 'patty', 'avocado', 'tomato'] },
  { id: 'ham', name: 'С ветчиной', mid: ['patty', 'ham', 'cheese', 'pickles'] },
  { id: 'salami', name: 'С колбаской', mid: ['patty', 'salami', 'lettuce'] },
  { id: 'fish', name: 'Рыбный', mid: ['lettuce', 'salmon', 'tomato'] },
  { id: 'mushroom', name: 'Грибной', mid: ['patty', 'mushroom', 'cheese'] },
  { id: 'rainbow', name: 'Радужный', mid: ['lettuce', 'patty', 'cheese', 'tomato', 'pickles'] },
];

/** Бургер стопкой: слои снизу вверх; ketchup — точки кетчупа (доли ширины/высоты коробки). */
const Burger: React.FC<{ layers: string[]; w: string; ketchup?: { x: number; y: number }[]; anim?: boolean; boxRef?: React.Ref<HTMLDivElement> }> = ({ layers, w, ketchup = [], anim, boxRef }) => {
  let y = 0;
  const placed = layers.map((id) => { const l = layer(id); const at = y; y += l.h; return { l, at }; });
  const total = 1.25; // высота коробки в долях ширины (с запасом под верхнюю булочку)
  return (
    <div ref={boxRef} className="relative shrink-0" style={{ width: w, height: `calc(${w} * ${total})` }}>
      {placed.map(({ l, at }, i) => (
        <img key={`${l.id}-${i}`} src={l.src} alt="" draggable={false}
          className="absolute pointer-events-none"
          style={{
            left: `${(1 - l.w) * 50}%`, width: `${l.w * 100}%`,
            bottom: `${((at - (l.id === 'bun_bottom' ? 0 : 0.05)) / total) * 100}%`, zIndex: i + 1,
            filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.18))',
            animation: anim && i === placed.length - 1 ? 'drop-in .5s cubic-bezier(.3,1.4,.5,1) both' : undefined,
          }} />
      ))}
      {ketchup.length > 0 && (
        <svg viewBox="0 0 100 125" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: layers.includes('bun_top') ? layers.indexOf('bun_top') : layers.length + 1 }}>
          {ketchup.map((p, i) => <circle key={i} cx={p.x * 100} cy={p.y * 125} r="2.6" fill="#DC2626" />)}
        </svg>
      )}
    </div>
  );
};

/** Коробочка картошки фри (с солью). */
const FriesBox: React.FC<{ w: string; salt?: number }> = ({ w, salt = 0 }) => (
  <div className="relative shrink-0" style={{ width: w }}>
    <img src={P('fries_box')} alt="" draggable={false} className="w-full pointer-events-none" />
    {Array.from({ length: Math.floor(salt * 26) }).map((_, i) => (
      <span key={i} className="absolute w-[3.5%] h-[2.5%] rounded-sm bg-white pointer-events-none" style={{ left: `${18 + (i * 37) % 64}%`, top: `${4 + (i * 13) % 30}%`, boxShadow: '0 0 2px #999' }} />
    ))}
  </div>
);

/** кружочек «что нужно»: текущий мигает, сделанное — с галочкой */
const Need: React.FC<{ src: string; done: boolean; now: boolean; size?: string }> = ({ src, done, now, size = 'min(14vmin, 84px)' }) => (
  <span className={`relative rounded-full bg-white/95 shadow-lg border-4 flex items-center justify-center shrink-0 transition-all ${done ? 'border-[#10C97A]' : now ? 'border-[#FFB800] animate-pulse scale-110' : 'border-white opacity-70'}`}
    style={{ width: size, height: size }}>
    <img src={src} alt="" className="w-[76%] h-[76%] object-contain" />
    {done && <span className="absolute -right-1 -top-1 w-[42%] h-[42%] rounded-full bg-[#10C97A] text-white font-black flex items-center justify-center text-[min(4.5vmin,22px)]">✓</span>}
  </span>
);

const CUTS = 4;
const KETCHUP = 60;

export const BurgerMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const s0 = useRef(STEPS.indexOf(step)).current; // dev ?step=…
  const [onPan, setOnPan] = useState(s0 > 1);
  const [sizzle, setSizzle] = useState(0); // 0..1 подрумянилась снизу
  const [flipped, setFlipped] = useState(s0 > 2);
  const [stack, setStack] = useState<string[]>(s0 > 3 ? ['bun_bottom', ...RECIPES[0].mid] : []);
  const [ketchup, setKetchup] = useState<{ x: number; y: number }[]>([]);
  const [bottleAt, setBottleAt] = useState<{ x: number; y: number } | null>(null);
  const [cuts, setCuts] = useState(s0 > 6 ? CUTS : 0);
  const [chop, setChop] = useState(0);
  const [fry, setFry] = useState(s0 > 7 ? 1 : 0);
  const [salt, setSalt] = useState(0);
  const [shaker, setShaker] = useState<{ x: number; y: number } | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('pizza', character.id), [servedKey, character.id]);
  const panRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const potatoRef = useRef<HTMLButtonElement>(null);
  const fryerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const flipStart = useRef<number | null>(null);
  const lastWrongVoice = useRef(0);

  const order = useMemo(() => ['bun_bottom', ...recipe.mid], [recipe]);
  const restart = () => {
    setOnPan(false); setSizzle(0); setFlipped(false); setStack([]); setKetchup([]); setCuts(0); setFry(0); setSalt(0);
    restartSteps();
  };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);

  // ---------- котлетка ----------
  const putPatty = () => { if (onPan || doneFx) return; soundEngine.playGamePop(soundEnabled, 3); setOnPan(true); window.setTimeout(() => next(), 900); };
  // пока лежит — шкварчит и румянится (до переворота)
  useEffect(() => {
    if (!onPan || flipped) return;
    const iv = window.setInterval(() => {
      setSizzle((s) => Math.min(1, s + 0.05));
      if (Math.random() < 0.5) soundEngine.playGamePop(soundEnabled, 1 + Math.floor(Math.random() * 3));
    }, 260);
    return () => window.clearInterval(iv);
  }, [onPan, flipped, soundEnabled]);
  const flipDown = (e: React.PointerEvent) => { if (step === 'flip' && !flipped) flipStart.current = e.clientY; };
  const flipMove = (e: React.PointerEvent) => {
    if (step !== 'flip' || flipped || flipStart.current == null) return;
    if (flipStart.current - e.clientY > 40) { flipStart.current = null; doFlip(); }
  };
  const doFlip = () => {
    if (flipped || doneFx) return;
    soundEngine.playGamePop(soundEnabled, 7);
    setFlipped(true);
    window.setTimeout(() => next(), 1400);
  };

  // ---------- сборка ----------
  const nextLayer = order[stack.length];
  const addLayer = (id: string) => {
    if (doneFx || step !== 'build' || !nextLayer) return;
    if (id !== nextLayer) {
      soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600);
      const now = Date.now();
      if (now - lastWrongVoice.current > 6000) { lastWrongVoice.current = now; say('bg_wrong', soundEnabled); }
      return;
    }
    soundEngine.playGamePop(soundEnabled, 3 + stack.length);
    const n = [...stack, id]; setStack(n);
    if (n.length === order.length) window.setTimeout(() => next(), 800);
  };

  // ---------- кетчуп ----------
  const ketchupRub = useRub(step === 'ketchup' && !doneFx, (d, p) => {
    setBottleAt(p);
    if (d <= 0 && ketchup.length) return;
    // кетчуп ложится на верхний слой: середина его видимой поверхности
    const last = layer(order[order.length - 1]);
    const lastAt = order.slice(0, -1).reduce((a, id) => a + layer(id).h, 0) - 0.05;
    const surf = 1 - (lastAt + last.a * last.w * 0.62) / 1.25;
    const half = (last.w * 0.42);
    if (p.x < 0.5 - half || p.x > 0.5 + half || p.y < surf - 0.3 || p.y > surf + 0.25) return;
    const q = { x: p.x, y: Math.max(surf - 0.09, Math.min(surf + 0.07, p.y)) };
    setKetchup((k) => {
      const prev = d > 0 && k.length ? k[k.length - 1] : null;
      const dist = prev ? Math.hypot(prev.x - q.x, prev.y - q.y) : 1;
      if (prev && dist < 0.025) return k;
      // сплошная струйка: точки между прошлым и новым положением пальца
      const steps = prev ? Math.min(12, Math.ceil(dist / 0.025)) : 1;
      const add = Array.from({ length: steps }, (_, i) => prev ? { x: prev.x + (q.x - prev.x) * (i + 1) / steps, y: prev.y + (q.y - prev.y) * (i + 1) / steps } : q);
      const n = [...k, ...add].slice(0, 160);
      if (Math.floor(n.length / 6) !== Math.floor(k.length / 6)) soundEngine.playGamePop(soundEnabled, 2 + (n.length % 5));
      if (k.length < KETCHUP && n.length >= KETCHUP) window.setTimeout(() => next(), 600);
      return n;
    });
  });

  const putLid = () => { if (doneFx || stack.includes('bun_top')) return; soundEngine.playGamePop(soundEnabled, 8); setStack((s) => [...s, 'bun_top']); window.setTimeout(() => next(), 900); };

  // ---------- картошка ----------
  const cutPotato = () => {
    if (doneFx || step !== 'cut' || cuts >= CUTS) return;
    soundEngine.playGamePop(soundEnabled, 5 + cuts);
    setChop((c) => c + 1);
    const n = cuts + 1; setCuts(n);
    if (n === CUTS) window.setTimeout(() => next(), 900);
  };
  const fryHold = useHold(step === 'fry' && fry < 1 && !doneFx, (dt) => {
    setFry((f) => {
      const n = Math.min(1, f + dt / 3.2);
      if (Math.floor(n * 12) !== Math.floor(f * 12)) soundEngine.playGamePop(soundEnabled, 1 + Math.floor(Math.random() * 3));
      if (f < 1 && n >= 1) window.setTimeout(() => next(), 500);
      return n;
    });
  });
  const saltRub = useRub(step === 'salt' && !doneFx, (d, p) => {
    setShaker(p);
    if (d <= 0) return;
    setSalt((s) => {
      const n = Math.min(1, s + d * 0.35);
      if (Math.floor(n * 8) !== Math.floor(s * 8)) soundEngine.playGamePop(soundEnabled, 8);
      if (s < 1 && n >= 1) window.setTimeout(() => next(), 400);
      return n;
    });
  });

  // ---------- подсказки ----------
  const shelf = useMemo(() => shuffle(LAYERS.filter((l) => l.id !== 'bun_top')), [recipe]);
  const showGesture = useStepHint(`${step}-${stack.length}`, 2600, 7000, step !== 'pick' && step !== 'serve' && !doneFx && !fryHold.holding && !(step === 'flip' && flipped));
  const fromRef = useRef<Element | null>(null);
  fromRef.current = null;
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = stackRef;
  let hintItem: string | undefined;
  if (step === 'grill') { hintTarget = panRef; hintItem = P('patty_raw'); fromRef.current = plateEls.current.patty ?? null; }
  else if (step === 'flip') { hintKind = 'swipe'; hintTarget = panRef; }
  else if (step === 'build' && nextLayer) { hintItem = layer(nextLayer).src; fromRef.current = plateEls.current[nextLayer] ?? null; }
  else if (step === 'ketchup') hintKind = 'rub';
  else if (step === 'lid') { hintItem = P('bun_top'); fromRef.current = plateEls.current.bun_top ?? null; }
  else if (step === 'cut') { hintKind = 'tap'; hintTarget = potatoRef; }
  else if (step === 'fry') { hintKind = 'hold'; hintTarget = fryerRef; }
  else if (step === 'salt') { hintKind = 'rub'; hintTarget = boxRef; }

  const pRef = (k: string) => (el: HTMLButtonElement | null) => { plateEls.current[k] = el; };
  const tray =
    step === 'grill' ? <Plate src={P('patty_raw')} label="Котлетка" plateRef={pRef('patty')} onPick={putPatty} target={panRef} onDrop={putPatty} dim={onPan} />
    : step === 'flip' ? <div className="h-[min(14vmin,110px)]" aria-hidden />
    : step === 'build' ? <LoopScroller>{shelf.map((l) => (
      <Plate key={l.id} src={l.src} label={l.name} plateRef={pRef(l.id)} onPick={() => addLayer(l.id)} target={stackRef} onDrop={() => addLayer(l.id)} wrong={wrong === l.id} />
    ))}</LoopScroller>
    : step === 'lid' ? <Plate src={P('bun_top')} label="Верхняя булочка" plateRef={pRef('bun_top')} onPick={putLid} target={stackRef} onDrop={putLid} dim={stack.includes('bun_top')} />
    : step === 'cut' || step === 'fry' || step === 'salt' ? <div className="h-[min(14vmin,110px)]" aria-hidden />
    : undefined;

  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const BW = portrait ? 'min(64vw, 27vh, 420px)' : 'min(40vmin, 420px)';
  const STOVE = portrait ? 'min(92vw, 44vh, 520px)' : 'min(58vmin, 520px)';
  const finishedBurger = [...order, 'bun_top'];

  const needRow = (items: { key: string; src: string; done: boolean; now: boolean }[]) => (
    <div className={`flex items-center justify-center ${items.length > 4 ? 'gap-[0.8vmin]' : 'gap-[2vmin]'} px-2`} aria-hidden>
      {items.map((it, i) => (
        <React.Fragment key={it.key}>
          {i > 0 && <span className="text-white/90 font-black text-[min(4vmin,24px)] drop-shadow">›</span>}
          <Need src={it.src} done={it.done} now={it.now} size={items.length > 4 ? 'min(11vmin, 72px)' : undefined} />
        </React.Fragment>
      ))}
    </div>
  );

  // сковородка с котлеткой
  const pan = (
    <div ref={panRef} onPointerDown={flipDown} onPointerMove={flipMove} onPointerUp={() => { flipStart.current = null; }}
      className="relative w-[92%]" style={{ touchAction: 'none', perspective: '700px' }}>
      <img src={P('pan')} alt="" draggable={false} className="w-full pointer-events-none" />
      {onPan && (
        <div className="absolute pointer-events-none" style={{ left: '13%', width: '44%', top: '24%' }}>
          {/* шкварчащие брызги масла */}
          {!flipped && Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="absolute rounded-full bg-[#FDE68A]" style={{ left: `${8 + (i * 13) % 84}%`, top: `${30 + (i * 17) % 50}%`, width: '4%', aspectRatio: '1', animation: `bubble-pop ${0.5 + (i % 3) * 0.2}s ease-out ${(i * 0.11) % 0.6}s infinite` }} />
          ))}
          <div style={{
            transform: flipped ? 'rotateX(360deg) translateY(0)' : 'rotateX(0)',
            transition: flipped ? 'transform .9s cubic-bezier(.3,1.3,.6,1)' : undefined,
            animation: flipped ? 'pp-flip .9s ease-out' : 'drop-in .45s ease-out both',
          }}>
            <img src={flipped ? P('patty_cooked') : P('patty_raw')} alt="" className="w-full"
              style={{ filter: flipped ? undefined : `sepia(${sizzle * 0.4}) brightness(${1 - sizzle * 0.08})` }} />
          </div>
          {/* дымок */}
          {[0, 1, 2].map((k) => (
            <img key={k} src="/assets/items/soup2/steam.webp" alt="" className="absolute w-[46%]"
              style={{ left: `${4 + k * 26}%`, top: '-70%', animation: `steam-rise 2.2s ease-out ${k * 0.7}s infinite`, opacity: 0 }} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <CookScreen stepKey={step === 'flip' ? 'grill' : step === 'lid' ? 'ketchup' : step} stepIdx={idx} total={STEPS.length} done={doneFx}
      trayLoop={step === 'build'}
      recipe={step !== 'pick' && step !== 'serve' ? <div className="w-[70%]"><Burger layers={finishedBurger} w="100%" /></div> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className={`grid ${portrait ? 'grid-cols-3 px-3' : 'grid-cols-6 pl-3 pr-[min(15vmin,140px)]'} gap-[2vmin]`}>
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={r.name} onClick={() => { if (doneFx) return; setRecipe(r); next(); }}
              className="rounded-[1.6rem] bg-white/90 shadow-xl p-[1.5vmin] flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Burger layers={['bun_bottom', ...r.mid, 'bun_top']} w={portrait ? 'min(21vw, 9.5vh)' : 'min(12vmin, 130px)'} />
              <div className="flex justify-center flex-wrap gap-0.5 max-w-[26vw] sm:max-w-none">{r.mid.map((x, i) => <img key={i} src={layer(x).src} alt="" className="w-[min(5.5vmin,34px)] h-[min(5.5vmin,34px)] object-contain" />)}</div>
            </button>
          ))}
        </div>
      )}

      {(step === 'grill' || step === 'flip') && (
        <div className="flex flex-col items-center gap-[4vmin]">
          {needRow([{ key: 'raw', src: P('patty_raw'), done: onPan, now: !onPan }, { key: 'cooked', src: P('patty_cooked'), done: flipped, now: onPan && !flipped }])}
          <Stove width={STOVE} burnerX={42}>{pan}</Stove>
        </div>
      )}

      {(step === 'build' || step === 'ketchup' || step === 'lid') && (
        <div className="flex flex-col items-center gap-[3vmin]">
          {step === 'build' && needRow(order.map((id, i) => ({ key: `${id}${i}`, src: layer(id).src, done: i < stack.length, now: i === stack.length })))}
          {step === 'ketchup' && needRow([{ key: 'k', src: bottleSrc('#DC2626'), done: ketchup.length >= KETCHUP, now: ketchup.length < KETCHUP }])}
          {step === 'lid' && needRow([{ key: 'lid', src: P('bun_top'), done: stack.includes('bun_top'), now: !stack.includes('bun_top') }])}
          <div className="relative" {...(step === 'ketchup' ? ketchupRub : {})} onPointerUp={() => { if (step === 'ketchup') { ketchupRub.onPointerUp(); setBottleAt(null); } }}>
            {/* тарелочка-доска под бургером */}
            <div className="absolute left-[-12%] right-[-12%] bottom-[-6%] h-[22%] rounded-[50%] pointer-events-none" style={{ background: 'radial-gradient(ellipse, #FFFFFF 0 55%, #E5E7EB 70%, #FFFFFF 78%, #D1D5DB)', boxShadow: '0 10px 18px rgba(0,0,0,.2)' }} />
            <Burger layers={stack} w={BW} ketchup={ketchup} anim boxRef={stackRef} />
            {step === 'ketchup' && bottleAt && (
              <img src={bottleSrc('#DC2626')} alt="" className="absolute w-[18%] pointer-events-none"
                style={{ left: `${bottleAt.x * 100}%`, top: `${bottleAt.y * 100}%`, transform: 'translate(-50%, -105%) rotate(180deg)', zIndex: 30 }} />
            )}
          </div>
        </div>
      )}

      {step === 'cut' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          {needRow([{ key: 'p', src: P('potato'), done: cuts > 0, now: cuts === 0 }, { key: 'r', src: P('fries_raw'), done: cuts >= CUTS, now: cuts > 0 && cuts < CUTS }])}
          {/* разделочная доска */}
          <div className="relative rounded-[2rem] flex items-center justify-center" style={{ width: portrait ? 'min(86vw, 420px)' : 'min(60vmin, 480px)', aspectRatio: '1.5', background: 'linear-gradient(#E7B984, #C98B4F)', boxShadow: 'inset 0 -8px 0 rgba(0,0,0,.12), 0 14px 22px rgba(0,0,0,.25)' }}>
            {cuts < CUTS && (
              <button ref={potatoRef} type="button" aria-label="Картошка" onPointerDown={(e) => { e.preventDefault(); cutPotato(); }}
                className="relative w-[46%] active:scale-95 transition-transform touch-none">
                <img src={P('potato')} alt="" draggable={false} className="w-full pointer-events-none" style={{ clipPath: `inset(0 ${cuts * 22}% 0 0)` }} />
                <span key={chop} className="absolute -top-[30%] pointer-events-none text-[min(16vmin,110px)]" style={{ right: `${cuts * 22 - 6}%`, animation: chop ? 'chop-hit .3s ease-out' : undefined }}>🔪</span>
              </button>
            )}
            {cuts > 0 && (
              <img src={P('fries_raw')} alt="" className="absolute pointer-events-none animate-pop-in"
                style={{ width: `${20 + cuts * 10}%`, right: cuts >= CUTS ? '27%' : '6%', bottom: '12%', transition: 'all .4s' }} />
            )}
          </div>
        </div>
      )}

      {step === 'fry' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          {needRow([{ key: 'r', src: P('fries_raw'), done: true, now: false }, { key: 'f', src: P('fries'), done: fry >= 1, now: fry < 1 }])}
          {/* фритюрница: держишь — корзинка опускается в масло */}
          <div ref={fryerRef} {...fryHold.bind} className="relative cursor-pointer select-none" style={{ ...fryHold.bind.style, width: portrait ? 'min(80vw, 400px)' : 'min(54vmin, 440px)', aspectRatio: '1.1' }}>
            {/* корзинка с картошкой (ручка торчит вверх) */}
            <div className="absolute left-[18%] right-[18%] transition-all duration-300 pointer-events-none" style={{ top: fryHold.holding || fry >= 1 ? (fry >= 1 ? '6%' : '30%') : '6%', height: '46%', zIndex: 2 }}>
              <span className="absolute left-[44%] -top-[34%] w-[12%] h-[40%] rounded-t-full bg-[#27272A]" />
              <div className="absolute inset-0 rounded-b-[30%] border-[5px] border-[#A1A1AA]" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 10%, rgba(161,161,170,.9) 10% 12%), repeating-linear-gradient(0deg, transparent 0 14%, rgba(161,161,170,.9) 14% 17%)' }} />
              <img src={P('fries_raw')} alt="" className="absolute left-[8%] w-[84%] top-[12%]" style={{ opacity: 1 - fry }} />
              <img src={P('fries')} alt="" className="absolute left-[8%] w-[84%] top-[12%]" style={{ opacity: fry }} />
            </div>
            {/* кастрюля с маслом */}
            <div className="absolute left-[6%] right-[6%] bottom-0 h-[56%] rounded-b-[2.4rem] rounded-t-xl" style={{ background: 'linear-gradient(#D4D4D8, #71717A)', boxShadow: '0 14px 22px rgba(0,0,0,.3)', zIndex: 3 }}>
              <div className="absolute left-[6%] right-[6%] top-[-8%] h-[26%] rounded-[50%] overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 40%, #FDE68A, #F59E0B 70%, #B45309)' }}>
                {fryHold.holding && Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="absolute rounded-full border-2 border-[#FEF3C7] bg-[#FEF3C7]/60" style={{ left: `${4 + (i * 37) % 90}%`, top: `${10 + (i * 23) % 70}%`, width: `${5 + (i % 3) * 3}%`, aspectRatio: '1', animation: `bubble-pop ${0.35 + (i % 4) * 0.12}s ease-out ${(i * 0.07) % 0.5}s infinite` }} />
                ))}
              </div>
            </div>
            {fryHold.holding && [0, 1, 2].map((k) => (
              <img key={k} src="/assets/items/soup2/steam.webp" alt="" className="absolute w-[30%] pointer-events-none"
                style={{ left: `${12 + k * 26}%`, top: '18%', zIndex: 4, animation: `steam-rise 1.6s ease-out ${k * 0.5}s infinite`, opacity: 0 }} />
            ))}
          </div>
          <div className="w-[min(60vw,320px)] h-3 rounded-full bg-white/70 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${fry * 100}%`, background: 'linear-gradient(90deg, #FDE68A, #F59E0B)' }} />
          </div>
        </div>
      )}

      {step === 'salt' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          {needRow([{ key: 's', src: P('fries_box'), done: salt >= 1, now: salt < 1 }])}
          <div ref={(el) => { (saltRub.ref as React.MutableRefObject<HTMLDivElement | null>).current = el; (boxRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
            onPointerDown={saltRub.onPointerDown} onPointerMove={saltRub.onPointerMove} onPointerUp={() => { saltRub.onPointerUp(); setShaker(null); }} onPointerCancel={saltRub.onPointerCancel}
            className="relative cursor-pointer p-[6vmin]" style={{ touchAction: 'none' }}>
            <FriesBox w={portrait ? 'min(54vw, 30vh, 300px)' : 'min(38vmin, 320px)'} salt={salt} />
            <div className="absolute pointer-events-none text-[min(14vmin,96px)]" style={{ left: `${(shaker?.x ?? 0.75) * 100}%`, top: `${(shaker?.y ?? 0.12) * 100}%`, transform: 'translate(-50%,-90%) rotate(160deg)' }}>🧂</div>
            {/* крупинки соли сыплются из солонки */}
            {shaker && Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="absolute w-[1.6%] aspect-square rounded-full bg-white pointer-events-none"
                style={{ left: `calc(${shaker.x * 100}% + ${(i % 4) * 5 - 8}px)`, top: `${shaker.y * 100}%`, boxShadow: '0 0 2px #888', animation: `rainfall .6s linear ${i * 0.08}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={<div className="flex items-end gap-2"><Burger layers={finishedBurger} w="min(30vmin, 200px)" ketchup={ketchup} /><FriesBox w="min(16vmin, 110px)" salt={1} /></div>} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? fromRef : undefined} itemSrc={hintKind === 'drag' ? hintItem : undefined} />
    </CookScreen>
  );
};
