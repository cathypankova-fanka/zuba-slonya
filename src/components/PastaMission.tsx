import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { DoneButton } from './ArtKit';
import { P, Stove, shuffle, useRub, useSteps } from './PlayKit';

/**
 * Паста: выбрать соус → включить плиту → спагетти в кастрюлю → помешать → откинуть на дуршлаг →
 * соус в сковородке по рецепту → полить пальчиком → украсить как хочется → угостить героя.
 */

const STEPS = ['pick', 'fire', 'pasta', 'stir', 'drain', 'sauce', 'pour', 'top', 'serve'] as const;
const VOICES = { pick: 'pa_pick', fire: 'pa_fire', pasta: 'pa_pasta', stir: 'pa_stir', drain: 'pa_drain', sauce: 'pa_sauce', pour: 'pa_pour', top: 'pa_top' };

interface Ing { id: string; name: string; src: string }
const INGS: Ing[] = [
  { id: 'tomato', name: 'Помидорки', src: P('cherry_tomato') },
  { id: 'basil', name: 'Базилик', src: P('basil') },
  { id: 'cheese', name: 'Сыр', src: P('parmesan') },
  { id: 'milk', name: 'Молочко', src: P('milk') },
  { id: 'meat', name: 'Фрикадельки', src: '/assets/items/soup2/meatballs.webp' },
  { id: 'mozza', name: 'Моцарелла', src: P('mozzarella') },
  { id: 'carrot', name: 'Морковка', src: '/assets/items/soup2/carrot_slices.webp' },
  { id: 'mushroom', name: 'Грибочки', src: '/assets/items/soup2/mushroom_slices.webp' },
];
const ing = (id: string) => INGS.find((i) => i.id === id)!;

interface Recipe { id: string; name: string; bowl: string; color: string; dark: string; items: string[]; tops: string[] }
const RECIPES: Recipe[] = [
  { id: 'tomato', name: 'Красный соус', bowl: P('sauce_tomato'), color: '#E0402A', dark: '#B4281A', items: ['tomato', 'basil'], tops: ['cheese', 'basil'] },
  { id: 'cream', name: 'Сливочный соус', bowl: P('sauce_cream'), color: '#F6E7BF', dark: '#E2CB8E', items: ['milk', 'cheese'], tops: ['cheese', 'mushroom'] },
  { id: 'pesto', name: 'Зелёный соус', bowl: P('sauce_pesto'), color: '#5FA832', dark: '#3E7F1D', items: ['basil', 'cheese'], tops: ['mozza', 'tomato'] },
  { id: 'bolognese', name: 'Болоньезе', bowl: P('sauce_bolognese'), color: '#A4502A', dark: '#7A3416', items: ['tomato', 'meat', 'carrot'], tops: ['cheese', 'meat'] },
];

/** украшения: всё, что можно положить сверху (сколько хочешь) */
const TOPS = ['cheese', 'basil', 'tomato', 'mozza', 'meat', 'mushroom'];

interface Blob { x: number; y: number; r: number }
interface Top { id: string; x: number; y: number; rot: number; k: number }

/** Тарелка пасты: тарелка, горка спагетти, пятна соуса, украшения. Координаты — доли коробки. */
const PastaDish: React.FC<{ width: string; children?: React.ReactNode; sauce?: Recipe; blobs: Blob[] | 'full'; tops: Top[]; pasta?: boolean; boxRef?: React.Ref<HTMLDivElement>; className?: string } & React.HTMLAttributes<HTMLDivElement>> =
  ({ width, children, sauce, blobs, tops, pasta = true, boxRef, className = '', style, ...rest }) => (
    <div ref={boxRef} className={`relative shrink-0 ${className}`} style={{ width, height: `calc(${width} * 0.66)`, ...style }} {...rest}>
      {/* тарелка (рисуем сами — без тени-ореола) */}
      <div className="absolute left-0 right-0 bottom-[2%] h-[62%] rounded-[50%] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 45%, #FFFFFF 0 52%, #EEF0F3 58%, #FFFFFF 66%, #E3E6EA 100%)', boxShadow: '0 10px 18px rgba(0,0,0,.22)' }} />
      {pasta && <img src={P('spaghetti')} alt="" draggable={false} className="absolute pointer-events-none animate-pop-in" style={{ left: '15%', width: '70%', top: '6%' }} />}
      {sauce && (
        <div className="absolute pointer-events-none" style={{ left: '19%', width: '62%', top: '5%', height: '48%', borderRadius: '50% 50% 44% 44% / 62% 62% 38% 38%', overflow: 'hidden', mixBlendMode: sauce.id === 'cream' ? 'normal' : 'multiply', opacity: sauce.id === 'cream' ? 0.8 : 1 }}>
          {(blobs === 'full' ? FULL : blobs).map((b, i) => (
              <span key={i} className="absolute" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.r * 100}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)' }}>
                <span className="block w-full h-full rounded-full" style={{
                  background: `radial-gradient(circle at 38% 32%, ${sauce.color}, ${sauce.dark} 78%, transparent 82%)`, opacity: 0.92,
                  animation: blobs === 'full' ? undefined : 'sauce-spread .6s ease-out both',
                }} />
              </span>
            ))}
          {/* блики на соусе */}
          {blobs === 'full' && [[34, 26, 16], [58, 20, 10], [46, 44, 8]].map(([x, y, w], k) => (
            <span key={`g${k}`} className="absolute rounded-[50%] bg-white" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${w * 0.45}%`, opacity: 0.35, transform: 'rotate(-18deg)' }} />
          ))}
        </div>
      )}
      {tops.map((t, i) => (
        <span key={i} className="absolute pointer-events-none" style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: `${21 * t.k}%`, transform: `translate(-50%,-50%) rotate(${t.rot}deg)` }}>
          <img src={ing(t.id).src} alt="" draggable={false} className="w-full animate-pop-in drop-shadow" />
        </span>
      ))}
      {children}
    </div>
  );

/** клетки сетки соуса (для «полито ли везде») — внутри овала горки спагетти */
const CELLS: [number, number][] = [];
for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) {
  const cx = (x + 0.5) / 7, cy = (y + 0.5) / 5;
  if (((cx - 0.5) / 0.42) ** 2 + ((cy - 0.42) / 0.36) ** 2 <= 1) CELLS.push([cx, cy]);
}

/** соус целиком: пятна по всем клеткам (неровный «живой» край) */
const FULL: Blob[] = CELLS.map(([x, y], i) => ({ x: 0.5 + (x - 0.5) * 0.78 + ((i * 37) % 7 - 3) / 120, y: 0.44 + (y - 0.42) * 0.72 + ((i * 13) % 5 - 2) / 120, r: 0.22 + ((i * 7) % 5) / 100 }));

export const PastaMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  // dev ?step=…: состояние как будто предыдущие шаги уже пройдены
  const s0 = useRef(STEPS.indexOf(step)).current;
  const [fire, setFire] = useState(s0 > 1);
  const [inPot, setInPot] = useState(s0 > 2);
  const [cook, setCook] = useState(s0 > 3 ? 1 : 0);
  const [spoon, setSpoon] = useState<{ x: number; y: number } | null>(null);
  const [drained, setDrained] = useState(s0 > 4);
  const [inPan, setInPan] = useState<string[]>(s0 > 5 ? RECIPES[0].items : []);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [tops, setTops] = useState<Top[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('pizza', character.id), [servedKey, character.id]);
  const potRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLButtonElement>(null);
  const colanderRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const dishRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hit = useRef<Set<number>>(new Set());
  const [cover, setCover] = useState(s0 > 6 ? 1 : 0);
  const [pourAt, setPourAt] = useState<{ x: number; y: number } | null>(null);

  const restart = () => {
    setFire(false); setInPot(false); setCook(0); setDrained(false); setInPan([]); setBlobs([]); setTops([]); setCover(0); hit.current = new Set();
    restartSteps();
  };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);
  const oops = (id: string) => { soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600); };

  const lightFire = () => { if (fire || doneFx || step !== 'fire') return; soundEngine.playGamePop(soundEnabled, 4); setFire(true); window.setTimeout(() => next(), 1100); };
  const addPasta = () => { if (inPot || doneFx) return; soundEngine.playGamePop(soundEnabled, 3); setInPot(true); window.setTimeout(() => next(), 700); };
  const stirRub = useRub(step === 'stir' && !doneFx, (d, p) => {
    setSpoon(p);
    if (d <= 0) return;
    setCook((c) => {
      const n = Math.min(1, c + d * 0.22);
      if (Math.floor(n * 8) !== Math.floor(c * 8)) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(n * 5));
      if (c < 1 && n >= 1) window.setTimeout(() => next(), 300);
      return n;
    });
  });
  const drain = () => {
    if (drained || doneFx || step !== 'drain') return;
    soundEngine.playGamePop(soundEnabled, 1);
    setDrained(true);
    window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 5), 500);
    window.setTimeout(() => next(), 2600);
  };
  const addToPan = (id: string) => {
    if (doneFx || inPan.includes(id)) return;
    if (!recipe.items.includes(id)) return oops(id);
    soundEngine.playGamePop(soundEnabled, 4 + inPan.length);
    const n = [...inPan, id]; setInPan(n);
    if (recipe.items.every((x) => n.includes(x))) window.setTimeout(() => next(), 900);
  };
  const pourRub = useRub(step === 'pour' && !doneFx, (_d, p) => {
    setPourAt(p);
    // точка в коробке тарелки → в коробку соуса (left 20% w 60%, top 4% h 52%)
    const sx = (p.x - 0.19) / 0.62, sy = (p.y - 0.05) / 0.48;
    if (sx < -0.05 || sx > 1.05 || sy < -0.05 || sy > 1.05) return;
    setBlobs((b) => (b.length > 90 ? b : [...b, { x: sx, y: sy, r: 0.2 + Math.random() * 0.08 }]));
    let added = 0;
    CELLS.forEach(([cx, cy], i) => { if (!hit.current.has(i) && Math.hypot(cx - sx, (cy - sy) * 0.6) < 0.12) { hit.current.add(i); added++; } });
    if (added) {
      soundEngine.playGamePop(soundEnabled, 3 + (hit.current.size % 5));
      const v = hit.current.size / CELLS.length;
      setCover(v);
      if (v >= 0.85 && v - added / CELLS.length < 0.85) window.setTimeout(() => { setCover(1); next(); }, 400);
    }
  });
  const addTop = (id: string, at?: { x: number; y: number }) => {
    if (doneFx || tops.length >= 40) return;
    soundEngine.playGamePop(soundEnabled, 5 + (tops.length % 4));
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
    const p = at ?? { x: 0.5 + Math.cos(a) * r * 0.26, y: 0.36 + Math.sin(a) * r * 0.17 };
    setTops((t) => [...t, { id, x: p.x, y: p.y, rot: Math.random() * 60 - 30, k: id === 'cheese' ? 1.3 : id === 'basil' ? 1.1 : 0.9 }]);
  };
  const dropTop = (id: string) => (x: number, y: number) => {
    const r = dishRef.current?.getBoundingClientRect();
    addTop(id, r ? { x: Math.min(0.85, Math.max(0.15, (x - r.left) / r.width)), y: Math.min(0.7, Math.max(0.1, (y - r.top) / r.height)) } : undefined);
  };
  const finishTop = () => { if (doneFx || tops.length < 1) return; next(); };

  // ---------- подсказки ----------
  const panShelf = useMemo(() => shuffle(INGS.filter((i) => i.id !== 'mozza')), [recipe]);
  const showGesture = useStepHint(step, 2600, 7000, step !== 'pick' && step !== 'serve' && !doneFx && !(step === 'drain' && drained));
  const nextIng = recipe.items.find((x) => !inPan.includes(x));
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = potRef;
  let hintItem: string | undefined;
  let hintFrom: React.RefObject<Element | null> | undefined;
  const fromRef = useRef<Element | null>(null);
  fromRef.current = null;
  if (step === 'fire') { hintKind = 'tap'; hintTarget = knobRef; }
  else if (step === 'pasta') { hintItem = P('spaghetti_dry'); fromRef.current = plateEls.current.pasta ?? null; hintFrom = fromRef; }
  else if (step === 'stir') { hintKind = 'circle'; }
  else if (step === 'drain') { hintTarget = colanderRef; hintItem = '/assets/items/soup2/pot_open.webp'; fromRef.current = plateEls.current.pot ?? null; hintFrom = fromRef; }
  else if (step === 'sauce' && nextIng) { hintTarget = panRef; hintItem = ing(nextIng).src; fromRef.current = plateEls.current[nextIng] ?? null; hintFrom = fromRef; }
  else if (step === 'pour') { hintKind = 'rub'; hintTarget = dishRef; }
  else if (step === 'top') {
    if (tops.length >= 3) { hintKind = 'tap'; hintTarget = doneRef; }
    else { hintTarget = dishRef; hintItem = ing(recipe.tops[0]).src; fromRef.current = plateEls.current[`t_${recipe.tops[0]}`] ?? null; hintFrom = fromRef; }
  }

  const pRef = (k: string) => (el: HTMLButtonElement | null) => { plateEls.current[k] = el; };
  const tray =
    step === 'fire' ? <div className="h-[min(14vmin,110px)]" aria-hidden />
    : step === 'pasta' ? <Plate src={P('spaghetti_dry')} label="Спагетти" plateRef={pRef('pasta')} onPick={addPasta} target={potRef} onDrop={addPasta} />
    : step === 'drain' ? <Plate src="/assets/items/soup2/pot_open.webp" label="Кастрюлька" plateRef={pRef('pot')} onPick={drain} target={colanderRef} onDrop={drain} dim={drained} />
    : step === 'sauce' ? <LoopScroller>{panShelf.map((it) => (
      <Plate key={it.id} src={it.src} label={it.name} plateRef={pRef(it.id)} onPick={() => addToPan(it.id)} target={panRef} onDrop={() => addToPan(it.id)}
        dim={inPan.includes(it.id)} wrong={wrong === it.id} />
    ))}</LoopScroller>
    : step === 'top' ? <LoopScroller>{TOPS.map((id) => (
      <Plate key={id} src={ing(id).src} label={ing(id).name} plateRef={pRef(`t_${id}`)} onPick={() => addTop(id)} target={dishRef} onDrop={dropTop(id)}
        badge={tops.filter((t) => t.id === id).length} />
    ))}</LoopScroller>
    : undefined;

  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const STOVE = portrait ? 'min(92vw, 44vh, 520px)' : 'min(58vmin, 520px)';
  const DISH = portrait ? 'min(88vw, 52vh, 560px)' : 'min(74vmin, 620px)';
  const boiling = fire && step !== 'fire';

  /** ряд «что положить»: кружочки, положенное — с галочкой */
  const needRow = (
    <div className="flex gap-[3vmin] justify-center" aria-hidden>
      {recipe.items.map((id) => {
        const done = inPan.includes(id);
        return (
          <span key={id} className={`relative rounded-full bg-white/95 shadow-lg border-4 flex items-center justify-center ${done ? 'border-[#10C97A]' : 'border-[#FFB800] animate-pulse'}`}
            style={{ width: 'min(17vmin, 100px)', height: 'min(17vmin, 100px)' }}>
            <img src={ing(id).src} alt="" className="w-[74%] h-[74%] object-contain" />
            {done && <span className="absolute -right-1 -top-1 w-[40%] h-[40%] rounded-full bg-[#10C97A] text-white font-black flex items-center justify-center text-[min(5vmin,26px)]">✓</span>}
          </span>
        );
      })}
    </div>
  );

  /** пучок сухих спагетти: торчит из воды веером и мягчает (изгибается и тонет) по мере варки */
  const fan = [-16, 4, 22];
  const pot = (
    <div ref={potRef} className="relative w-[78%]">
    <div {...(step === 'stir' ? stirRub : {})} className="relative w-full" style={{ touchAction: 'none' }}>
      {/* пар над кастрюлей */}
      {boiling && [0, 1, 2].map((k) => (
        <img key={`st${k}`} src="/assets/items/soup2/steam.webp" alt="" className="absolute w-[42%] pointer-events-none"
          style={{ left: `${12 + k * 22}%`, top: '-42%', animation: `steam-rise 2.4s ease-out ${k * 0.8}s infinite`, opacity: 0 }} />
      ))}
      <img src="/assets/items/soup2/pot_open.webp" alt="" draggable={false} className={`relative w-full pointer-events-none ${step === 'stir' && cook > 0 && cook < 1 ? 'animate-[wiggle_0.6s_infinite]' : ''}`} />
      {/* водичка */}
      <div className="absolute pointer-events-none overflow-hidden rounded-[50%]" style={{ left: '13%', width: '74%', top: '15%', height: '32%', background: 'radial-gradient(ellipse at 50% 40%, #E3F6FF, #8ED0F4 60%, #4FA6DA)', boxShadow: 'inset 0 6px 10px rgba(255,255,255,.7)' }}>
        {boiling && Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="absolute rounded-full border-2 border-white/90 bg-white/40"
            style={{ left: `${6 + (i * 37) % 84}%`, top: `${14 + (i * 23) % 66}%`, width: `${6 + (i % 3) * 3}%`, aspectRatio: '1', animation: `bubble-pop ${0.7 + (i % 4) * 0.2}s ease-out ${(i * 0.13) % 0.9}s infinite` }} />
        ))}
        {/* варёные спагетти кружатся в воде */}
        {inPot && cook > 0.2 && (
          <img src={P('spaghetti')} alt="" className="absolute left-[6%] w-[88%] top-[-4%]"
            style={{ opacity: Math.min(1, (cook - 0.2) * 2.5), transform: `rotate(${cook * 300}deg) scale(${0.7 + cook * 0.3})`, transition: 'transform .15s' }} />
        )}
      </div>
      {/* горка варёных спагетти поверх воды — хорошо видна */}
      {inPot && cook >= 0.6 && (
        <img src={P('spaghetti')} alt="" className="absolute left-[16%] w-[68%] pointer-events-none animate-pop-in" style={{ top: '6%' }} />
      )}
      {/* сухой пучок: торчит веером из кастрюли, мягчеет и тонет */}
      {inPot && cook < 0.6 && (
        <div className="absolute pointer-events-none" style={{ left: '50%', top: '30%', width: '24%', transform: `translate(-50%, -100%) translateY(${cook * 70}%)`, opacity: 1 - Math.max(0, cook - 0.35) * 4 }}>
          <div className="relative" style={{ animation: 'drop-in .5s ease-out both' }}>
          {fan.map((r, k) => (
            <img key={k} src={P('spaghetti_dry')} alt="" className="absolute left-0 bottom-0 w-full"
              style={{ transformOrigin: '50% 100%', transform: `rotate(${r * (1 + cook * 4)}deg) skewX(${(k - 1) * cook * 30}deg)`, transition: 'transform .2s' }} />
          ))}
          <img src={P('spaghetti_dry')} alt="" className="relative w-full invisible" />
          </div>
        </div>
      )}
      {step === 'stir' && (
        <img src={P('spoon')} alt="" className="absolute w-[34%] pointer-events-none transition-all duration-75"
          style={{ left: `${(spoon?.x ?? 0.6) * 100}%`, top: `${(spoon?.y ?? 0.25) * 100}%`, transform: 'translate(-30%,-85%) rotate(-20deg)', zIndex: 3 }} />
      )}
      {step === 'stir' && (
        <div className="absolute left-[15%] right-[15%] -bottom-[10%] h-3 rounded-full bg-white/70 overflow-hidden">
          <div className="h-full rounded-full bg-[#FBBF24]" style={{ width: `${cook * 100}%` }} />
        </div>
      )}
    </div>
    </div>
  );

  const COL = portrait ? 'min(74vw, 32vh)' : 'min(46vmin, 400px)';
  /** кастрюля с варёными спагетти (для шага «откинуть») */
  const cookedPot = (empty: boolean) => (
    <div className="relative w-full">
      <img src="/assets/items/soup2/pot_open.webp" alt="" draggable={false} className="relative w-full" />
      <div className="absolute overflow-hidden rounded-[50%]" style={{ left: '13%', width: '74%', top: '15%', height: '32%', background: 'radial-gradient(ellipse at 50% 40%, #E3F6FF, #8ED0F4 60%, #4FA6DA)' }} />
      <img src={P('spaghetti')} alt="" className="absolute left-[16%] w-[68%]" style={{ top: '6%', opacity: empty ? 0 : 1, transition: 'opacity .3s .5s' }} />
    </div>
  );

  return (
    <CookScreen stepKey={step === 'pasta' || step === 'stir' ? 'fire' : step} stepIdx={idx} total={STEPS.length} done={doneFx}
      trayLoop={step === 'sauce' || step === 'top'}
      recipe={step !== 'pick' && step !== 'serve' ? <PastaDish width="88%" sauce={recipe} blobs="full" tops={[]} /> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className={`grid ${portrait ? 'grid-cols-2' : 'grid-cols-4'} gap-[3vmin] px-3`}>
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={r.name} onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-[2rem] bg-white/90 shadow-xl p-[2vmin] flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <PastaDish width={portrait ? 'min(38vw, 20vh)' : 'min(26vmin, 220px)'} sauce={r} blobs="full" tops={[]} />
              <div className="flex justify-center gap-1">{r.items.map((x) => <img key={x} src={ing(x).src} alt="" className="w-[min(7vmin,48px)] h-[min(7vmin,48px)] object-contain" />)}</div>
            </button>
          ))}
        </div>
      )}

      {(step === 'fire' || step === 'pasta' || step === 'stir') && (
        <Stove width={STOVE} on={fire} knob={
          <button ref={knobRef} type="button" aria-label="Включить плиту" onPointerDown={(e) => { e.preventDefault(); lightFire(); }} onClick={lightFire}
            className="absolute right-[1%] top-1/2 -translate-y-1/2 w-[26%] aspect-square rounded-full flex items-center justify-center touch-none">
            <span className={`relative w-[66%] aspect-square rounded-full bg-[#E4E4E7] border-4 border-white shadow-lg transition-transform ${fire ? 'rotate-90' : step === 'fire' ? 'animate-pulse ring-4 ring-[#F97316]' : ''}`}>
              <span className="absolute left-1/2 top-[8%] -translate-x-1/2 w-[16%] h-[42%] bg-[#3F3F46] rounded" />
            </span>
          </button>}>
          {pot}
        </Stove>
      )}

      {step === 'drain' && (
        <div className="relative flex flex-col items-center" style={{ paddingTop: `calc(${COL} * 0.55)` }}>
          <div ref={colanderRef} onClick={drain} className="relative cursor-pointer" style={{ width: COL }}>
            {/* кастрюля: стоит рядом, при «откинуть» наклоняется над дуршлагом */}
            <button type="button" aria-label="Откинуть спагетти" onClick={(e) => { e.stopPropagation(); drain(); }}
              className={`absolute ${drained ? '' : 'animate-gentle-float'}`}
              style={{ width: '62%', left: drained ? '30%' : '58%', top: drained ? '-62%' : '-78%', zIndex: drained ? 1 : 4, transition: 'left .5s, top .5s' }}>
              <div style={{ transformOrigin: '20% 30%', transform: drained ? 'rotate(-80deg)' : 'rotate(0)', transition: 'transform .55s ease-in' }}>{cookedPot(drained)}</div>
            </button>
            {/* струя воды из кастрюли */}
            {drained && (
              <span className="absolute pointer-events-none rounded-full" style={{ left: '44%', width: '12%', top: '-32%', height: '52%', background: 'linear-gradient(#8ED0F4cc, #8ED0F466)', animation: 'stream 1.6s ease-in .45s both', zIndex: 2 }} />
            )}
            {/* брызги на дне раковины */}
            {drained && Array.from({ length: 12 }).map((_, i) => (
              <span key={`d${i}`} className="absolute rounded-full bg-[#7CC6F0] pointer-events-none"
                style={{ left: `${28 + (i * 9) % 44}%`, top: `${78 + (i % 3) * 5}%`, width: '2.6%', height: '7%', zIndex: 5, animation: `drip ${0.55 + (i % 4) * 0.12}s ease-in ${0.6 + (i * 0.11) % 0.7}s infinite` }} />
            ))}
            {/* лужица под дуршлагом */}
            {drained && <span className="absolute left-[18%] right-[18%] rounded-[50%] bg-[#8ED0F4]/60 pointer-events-none" style={{ top: '104%', height: '14%', zIndex: 5, animation: 'pop-in .8s ease-out .8s both' }} />}
            {/* дуршлаг: спагетти лежат в нём, горкой над краем */}
            <img src={P('colander')} alt="" draggable={false} className="relative w-full pointer-events-none" style={{ zIndex: 2 }} />
            {drained && (
              <img src={P('spaghetti')} alt="" className="absolute left-[15%] w-[70%] pointer-events-none" style={{ top: '-30%', zIndex: 3, animation: 'drop-in .55s cubic-bezier(.3,1.4,.5,1) .55s both' }} />
            )}
            {/* передний край дуршлага поверх спагетти — они внутри */}
            {drained && <img src={P('colander')} alt="" draggable={false} className="absolute left-0 top-0 w-full pointer-events-none" style={{ zIndex: 4, clipPath: 'inset(30% 0 0 0)' }} />}
          </div>
        </div>
      )}

      {step === 'sauce' && (
        <div className="flex flex-col items-center gap-[4vmin]">
          {needRow}
          <Stove width={STOVE} on burnerX={42}>
            <div ref={panRef} className="relative w-[92%]">
              <img src={P('pan')} alt="" draggable={false} className="w-full pointer-events-none" />
              <div className="absolute rounded-[50%] transition-all duration-700 pointer-events-none" style={{
                left: '7%', width: '60%', top: '30%', height: '50%',
                background: `radial-gradient(circle at 45% 40%, ${recipe.color}, ${recipe.dark})`,
                opacity: Math.min(0.95, inPan.length / recipe.items.length), transform: `scale(${0.5 + 0.5 * inPan.length / recipe.items.length})`,
              }} />
              {inPan.map((id, i) => (
                <img key={id} src={ing(id).src} alt="" className="absolute w-[18%] pointer-events-none animate-pop-in" style={{ left: `${16 + (i * 17) % 36}%`, top: `${34 + (i * 11) % 22}%` }} />
              ))}
            </div>
          </Stove>
        </div>
      )}

      {step === 'pour' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          <img src={recipe.bowl} alt="" className="w-[min(22vmin,150px)] pointer-events-none animate-gentle-float" style={{ visibility: pourAt ? 'hidden' : 'visible' }} />
          <PastaDish width={DISH} sauce={recipe} blobs={cover >= 1 ? 'full' : blobs} tops={[]} boxRef={(el: HTMLDivElement | null) => { (pourRub.ref as React.MutableRefObject<HTMLDivElement | null>).current = el; (dishRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
            onPointerDown={pourRub.onPointerDown} onPointerMove={pourRub.onPointerMove}
            onPointerUp={() => { pourRub.onPointerUp(); setPourAt(null); }} onPointerCancel={() => { pourRub.onPointerCancel(); setPourAt(null); }}
            style={{ touchAction: 'none' }} className="cursor-pointer">
            {/* мисочка с соусом следует за пальцем и льёт струйкой */}
            {pourAt && cover < 1 && (
              <span className="absolute pointer-events-none" style={{ left: `${pourAt.x * 100}%`, top: `${pourAt.y * 100}%`, width: '26%', transform: 'translate(-20%, -150%)', zIndex: 5 }}>
                <span className="absolute rounded-full" style={{ left: '4%', top: '58%', width: '9%', height: '96%', background: `linear-gradient(${recipe.color}, ${recipe.dark})` }} />
                <img src={recipe.bowl} alt="" className="relative w-full" style={{ transform: 'rotate(-38deg)', transformOrigin: '20% 60%' }} />
              </span>
            )}
          </PastaDish>
          <div className="w-[min(50vw,300px)] h-3 rounded-full bg-white/70 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(1, cover / 0.85) * 100}%`, background: recipe.color }} />
          </div>
        </div>
      )}

      {step === 'top' && (
        <div className="flex flex-col items-center gap-[3vmin]">
          <PastaDish width={DISH} sauce={recipe} blobs="full" tops={tops} boxRef={dishRef} />
          <DoneButton ref={doneRef} show={tops.length >= 3} onClick={finishTop} />
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={<PastaDish width="min(56vw, 30vh, 300px)" sauce={recipe} blobs="full" tops={tops} />} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFrom : undefined} itemSrc={hintKind === 'drag' ? hintItem : undefined} />
    </CookScreen>
  );
};
