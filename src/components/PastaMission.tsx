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
const PastaDish: React.FC<{ width: string; sauce?: Recipe; blobs: Blob[] | 'full'; tops: Top[]; pasta?: boolean; boxRef?: React.Ref<HTMLDivElement>; className?: string } & React.HTMLAttributes<HTMLDivElement>> =
  ({ width, sauce, blobs, tops, pasta = true, boxRef, className = '', style, ...rest }) => (
    <div ref={boxRef} className={`relative shrink-0 ${className}`} style={{ width, height: `calc(${width} * 0.66)`, ...style }} {...rest}>
      {/* тарелка (рисуем сами — без тени-ореола) */}
      <div className="absolute left-0 right-0 bottom-[2%] h-[62%] rounded-[50%] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 45%, #FFFFFF 0 52%, #EEF0F3 58%, #FFFFFF 66%, #E3E6EA 100%)', boxShadow: '0 10px 18px rgba(0,0,0,.22)' }} />
      {pasta && <img src={P('spaghetti')} alt="" draggable={false} className="absolute pointer-events-none animate-pop-in" style={{ left: '15%', width: '70%', top: '6%' }} />}
      {sauce && (
        <div className="absolute pointer-events-none" style={{ left: '17%', width: '66%', top: '8%', height: '58%', borderRadius: '50%', overflow: 'hidden' }}>
          {(blobs === 'full' ? FULL : blobs).map((b, i) => (
              <span key={i} className="absolute rounded-full" style={{
                left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.r * 100}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)',
                background: `radial-gradient(circle at 40% 35%, ${sauce.color}, ${sauce.dark} 80%, transparent 82%)`, opacity: 0.92,
              }} />
            ))}
        </div>
      )}
      {tops.map((t, i) => (
        <span key={i} className="absolute pointer-events-none" style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, width: `${21 * t.k}%`, transform: `translate(-50%,-50%) rotate(${t.rot}deg)` }}>
          <img src={ing(t.id).src} alt="" draggable={false} className="w-full animate-pop-in drop-shadow" />
        </span>
      ))}
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
  const [fire, setFire] = useState(false);
  const [inPot, setInPot] = useState(false);
  const [cook, setCook] = useState(0);
  const [spoon, setSpoon] = useState<{ x: number; y: number } | null>(null);
  const [drained, setDrained] = useState(false);
  const [inPan, setInPan] = useState<string[]>([]);
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
  const [cover, setCover] = useState(0);

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
    window.setTimeout(() => next(), 1500);
  };
  const addToPan = (id: string) => {
    if (doneFx || inPan.includes(id)) return;
    if (!recipe.items.includes(id)) return oops(id);
    soundEngine.playGamePop(soundEnabled, 4 + inPan.length);
    const n = [...inPan, id]; setInPan(n);
    if (recipe.items.every((x) => n.includes(x))) window.setTimeout(() => next(), 900);
  };
  const pourRub = useRub(step === 'pour' && !doneFx, (_d, p) => {
    // точка в коробке тарелки → в коробку соуса (left 17% w 66%, top 8% h 58%)
    const sx = (p.x - 0.17) / 0.66, sy = (p.y - 0.08) / 0.58;
    if (sx < -0.05 || sx > 1.05 || sy < -0.05 || sy > 1.05) return;
    setBlobs((b) => (b.length > 90 ? b : [...b, { x: sx, y: sy, r: 0.2 + Math.random() * 0.08 }]));
    let added = 0;
    CELLS.forEach(([cx, cy], i) => { if (!hit.current.has(i) && Math.hypot(cx - sx, (cy - sy) * 0.6) < 0.16) { hit.current.add(i); added++; } });
    if (added) {
      soundEngine.playGamePop(soundEnabled, 3 + (hit.current.size % 5));
      const v = hit.current.size / CELLS.length;
      setCover(v);
      if (v >= 0.75 && v - added / CELLS.length < 0.75) window.setTimeout(() => { setCover(1); next(); }, 400);
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

  const pot = (
    <div ref={potRef} className="relative w-[78%]">
    <div {...(step === 'stir' ? stirRub : {})} className="relative w-full" style={{ touchAction: 'none' }}>
      <img src="/assets/items/soup2/pot_open.webp" alt="" draggable={false} className={`w-full pointer-events-none ${step === 'stir' && cook > 0 && cook < 1 ? 'animate-[wiggle_0.6s_infinite]' : ''}`} />
      {/* водичка */}
      <div className="absolute pointer-events-none overflow-hidden rounded-[50%]" style={{ left: '14%', width: '72%', top: '17%', height: '30%', background: 'radial-gradient(circle at 50% 40%, #CFEFFF, #7CC6F0 70%, #4FA6DA)' }}>
        {boiling && Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="absolute rounded-full bg-white/80 animate-[pop-in_0.9s_ease-out_infinite]" style={{ left: `${10 + (i * 37) % 78}%`, top: `${20 + (i * 23) % 55}%`, width: '9%', aspectRatio: '1', animationDelay: `${(i * 0.17) % 0.9}s` }} />
        ))}
        {inPot && (cook < 0.5
          ? <img src={P('spaghetti_dry')} alt="" className="absolute left-1/2 top-[-60%] w-[28%]" style={{ transform: `translateX(-50%) rotate(${12 + cook * 120}deg)` }} />
          : <img src={P('spaghetti')} alt="" className="absolute left-[8%] w-[84%] top-[2%]" style={{ transform: `rotate(${cook * 360}deg)` }} />)}
      </div>
      {inPot && cook < 0.5 && <img src={P('spaghetti_dry')} alt="" className="absolute left-[38%] w-[22%] -top-[28%] pointer-events-none" style={{ transform: `rotate(${14 + cook * 70}deg)`, transformOrigin: '50% 100%' }} />}
      {boiling && <img src="/assets/items/soup2/steam.webp" alt="" className="absolute left-[22%] w-[50%] -top-[34%] opacity-70 pointer-events-none animate-gentle-float" />}
      {step === 'stir' && (
        <img src={P('spoon')} alt="" className="absolute w-[34%] pointer-events-none transition-all duration-75"
          style={{ left: `${(spoon?.x ?? 0.6) * 100}%`, top: `${(spoon?.y ?? 0.25) * 100}%`, transform: 'translate(-30%,-85%) rotate(-20deg)' }} />
      )}
      {step === 'stir' && (
        <div className="absolute left-[15%] right-[15%] -bottom-[10%] h-3 rounded-full bg-white/70 overflow-hidden">
          <div className="h-full rounded-full bg-[#FBBF24]" style={{ width: `${cook * 100}%` }} />
        </div>
      )}
    </div>
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
        <div className="relative flex flex-col items-center">
          <div ref={colanderRef} onClick={drain} className="relative" style={{ width: portrait ? 'min(70vw, 34vh)' : 'min(50vmin, 420px)' }}>
            {drained && (
              <img src="/assets/items/soup2/pot_open.webp" alt="" className="absolute left-[18%] w-[64%] -top-[70%] pointer-events-none"
                style={{ transform: 'rotate(-70deg)', transformOrigin: '80% 80%' }} />
            )}
            {drained && Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="absolute w-[3%] h-[14%] rounded-full bg-[#7CC6F0] pointer-events-none animate-[rain-fall_0.6s_linear_infinite]"
                style={{ left: `${30 + (i * 7) % 40}%`, top: '-10%', animationDelay: `${i * 0.06}s` }} />
            ))}
            {drained && <img src={P('spaghetti')} alt="" className="absolute left-[14%] w-[72%] -top-[8%] pointer-events-none animate-pop-in" style={{ animationDelay: '.5s' }} />}
            <img src={P('colander')} alt="" draggable={false} className="relative w-full pointer-events-none" />
            {drained && Array.from({ length: 8 }).map((_, i) => (
              <span key={`d${i}`} className="absolute w-[3%] h-[10%] rounded-full bg-[#7CC6F0] pointer-events-none animate-[rain-fall_0.5s_linear_infinite]"
                style={{ left: `${25 + (i * 9) % 50}%`, top: '80%', animationDelay: `${i * 0.07}s` }} />
            ))}
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
          <img src={recipe.bowl} alt="" className="w-[min(22vmin,150px)] pointer-events-none animate-gentle-float" />
          <PastaDish width={DISH} sauce={recipe} blobs={cover >= 1 ? 'full' : blobs} tops={[]} boxRef={(el: HTMLDivElement | null) => { (pourRub.ref as React.MutableRefObject<HTMLDivElement | null>).current = el; (dishRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
            onPointerDown={pourRub.onPointerDown} onPointerMove={pourRub.onPointerMove} onPointerUp={pourRub.onPointerUp} onPointerCancel={pourRub.onPointerCancel}
            style={{ touchAction: 'none' }} className="cursor-pointer" />
          <div className="w-[min(50vw,300px)] h-3 rounded-full bg-white/70 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(1, cover / 0.75) * 100}%`, background: recipe.color }} />
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
