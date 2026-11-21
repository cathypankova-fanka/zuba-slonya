import React, { useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { getDrinkExtraAssetUrl, getIceCreamFlavorAssetUrl } from '../utils/itemAssets';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';
import { P, shuffle, useHold, useSteps } from './PlayKit';

/** Милкшейк: рецепт → молочко в блендер → вкусняшки → крышка → держать кнопку (ж-ж-ж) → перелить → украсить → угостить. */

interface Item { id: string; name: string; src: string }
const ITEMS: Item[] = [
  { id: 'strawberry', name: 'Клубничка', src: P('strawberry') },
  { id: 'banana', name: 'Бананчик', src: P('banana_slice') },
  { id: 'blueberry', name: 'Черничка', src: P('blueberry') },
  { id: 'kiwi', name: 'Киви', src: P('kiwi_slice') },
  { id: 'pineapple', name: 'Ананасик', src: P('pineapple') },
  { id: 'melon', name: 'Дынька', src: P('melon') },
  { id: 'grape', name: 'Виноградинка', src: P('grape') },
  { id: 'orange', name: 'Апельсинчик', src: P('orange_slice') },
  { id: 'ice_vanilla', name: 'Ванильный шарик', src: getIceCreamFlavorAssetUrl('vanilla') ?? '' },
  { id: 'ice_choco', name: 'Шоколадный шарик', src: getIceCreamFlavorAssetUrl('chocolate') ?? '' },
  { id: 'ice_berry', name: 'Клубничный шарик', src: getIceCreamFlavorAssetUrl('strawberry') ?? '' },
  { id: 'ice_mint', name: 'Мятный шарик', src: getIceCreamFlavorAssetUrl('mint') ?? '' },
];
const item = (id: string) => ITEMS.find((i) => i.id === id)!;

interface Top { id: string; name: string; src: string }
const TOPS: Top[] = [
  { id: 'cream', name: 'Сливки', src: P('whipped_cream') },
  { id: 'strawberry', name: 'Клубничка', src: P('strawberry') },
  { id: 'blueberry', name: 'Черничка', src: P('blueberry') },
  { id: 'banana', name: 'Бананчик', src: P('banana_slice') },
  { id: 'straw', name: 'Трубочка', src: getDrinkExtraAssetUrl('straw') },
  { id: 'umbrella', name: 'Зонтик', src: getDrinkExtraAssetUrl('umbrella') },
  { id: 'choco', name: 'Шоколадная крошка', src: getDrinkExtraAssetUrl('choco_chips') },
  { id: 'mint', name: 'Мятка', src: getDrinkExtraAssetUrl('mint') },
];
const top = (id: string) => TOPS.find((t) => t.id === id)!;

interface Recipe { id: string; items: string[]; color: string; tops: string[] }
const RECIPES: Recipe[] = [
  { id: 'pink', items: ['strawberry', 'ice_vanilla'], color: '#F9A8D4', tops: ['cream', 'strawberry'] },
  { id: 'sunny', items: ['banana', 'pineapple'], color: '#FDE68A', tops: ['cream', 'umbrella'] },
  { id: 'berry', items: ['blueberry', 'ice_berry'], color: '#C4B5FD', tops: ['cream', 'blueberry'] },
  { id: 'choco', items: ['banana', 'ice_choco'], color: '#A47551', tops: ['cream', 'choco'] },
];

const STEPS = ['pick', 'milk', 'fruit', 'lid', 'blend', 'pour', 'top', 'serve'] as const;
const VOICES = { pick: 'ms_pick', milk: 'ms_milk', fruit: 'ms_fruit', lid: 'ms_lid', blend: 'ms_blend', pour: 'ms_pour', top: 'ms_top' };

/** Стакан милкшейка (по картинке стакана + жидкость, сливки и украшения). */
const ShakeGlass: React.FC<{ color: string; level: number; tops: string[]; size: string }> = ({ color, level, tops, size }) => (
  <div className="relative" style={{ width: size, height: `calc(${size} * 1.88)` }}>
    <img src={P('shake_glass')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
    <div className="absolute overflow-hidden" style={{ left: '14%', right: '14%', top: '6%', bottom: '10%', clipPath: 'polygon(0 0, 100% 0, 88% 62%, 70% 100%, 30% 100%, 12% 62%)' }}>
      <div className="absolute inset-x-0 bottom-0 transition-[height] duration-300" style={{ height: `${level * 100}%`, background: `linear-gradient(${color}, ${color}cc)`, opacity: 0.9 }} />
    </div>
    {tops.includes('straw') && <img src={top('straw').src} alt="" className="absolute w-[34%] pointer-events-none" style={{ left: '52%', top: '-26%', transform: 'rotate(14deg)' }} />}
    {tops.includes('umbrella') && <img src={top('umbrella').src} alt="" className="absolute w-[62%] pointer-events-none" style={{ left: '-14%', top: '-22%', transform: 'rotate(-16deg)' }} />}
    {tops.includes('cream') && <img src={top('cream').src} alt="" className="absolute w-[86%] pointer-events-none animate-pop-in" style={{ left: '7%', top: '-16%' }} />}
    {tops.filter((t) => !['cream', 'straw', 'umbrella'].includes(t)).map((t, i) => (
      <img key={t} src={top(t).src} alt="" className="absolute w-[34%] pointer-events-none animate-pop-in" style={{ left: `${22 + i * 26}%`, top: tops.includes('cream') ? '-22%' : '0%' }} />
    ))}
  </div>
);

export const MilkshakeMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [milk, setMilk] = useState(false);
  const [inJar, setInJar] = useState<string[]>([]);
  const [lid, setLid] = useState(false);
  const [mix, setMix] = useState(0);
  const [glass, setGlass] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [tops, setTops] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('icecream', character.id), [servedKey, character.id]);
  const jarRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLButtonElement | null>(null);

  const restart = () => { setMilk(false); setInJar([]); setLid(false); setMix(0); setGlass(0); setPouring(false); setTops([]); restartSteps(); };
  const oops = (id: string) => { soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600); };

  const addMilk = () => { if (milk || doneFx) return; soundEngine.playGamePop(soundEnabled, 3); setMilk(true); window.setTimeout(() => next(), 700); };
  const addItem = (id: string) => {
    if (doneFx || inJar.includes(id)) return;
    if (!recipe.items.includes(id)) return oops(id);
    soundEngine.playGamePop(soundEnabled, 4 + inJar.length);
    const n = [...inJar, id]; setInJar(n);
    if (recipe.items.every((x) => n.includes(x))) window.setTimeout(() => next(), 500);
  };
  const putLid = () => { if (lid || doneFx) return; soundEngine.playGamePop(soundEnabled, 6); setLid(true); window.setTimeout(() => next(), 500); };
  const blend = useHold(step === 'blend' && mix < 1 && !doneFx, (dt) => {
    setMix((m) => {
      const n = Math.min(1, m + dt / 2.6);
      if (Math.floor(n * 10) !== Math.floor(m * 10)) soundEngine.playGamePop(soundEnabled, 1 + Math.floor(n * 6));
      if (m < 1 && n >= 1) window.setTimeout(() => next(), 300);
      return n;
    });
  });
  const pour = () => {
    if (pouring || doneFx) return;
    setPouring(true);
    soundEngine.playGamePop(soundEnabled, 3);
    const t0 = performance.now();
    const f = (now: number) => {
      const k = Math.min(1, (now - t0) / 1600);
      setGlass(k);
      if (k < 1) requestAnimationFrame(f); else { setPouring(false); next(); }
    };
    requestAnimationFrame(f);
  };
  const addTop = (id: string) => {
    if (doneFx || tops.includes(id)) return;
    soundEngine.playGamePop(soundEnabled, 6);
    const n = [...tops, id]; setTops(n);
    if (recipe.tops.every((t) => n.includes(t))) window.setTimeout(() => next(), 600);
  };

  React.useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);

  // ---------- подсказки ----------
  const shelf = useMemo(() => shuffle(ITEMS), [recipe]);
  const topShelf = useMemo(() => shuffle(TOPS), [recipe]);
  const showGesture = useStepHint(step, 2600, 7000, step !== 'pick' && step !== 'serve' && !doneFx && !blend.holding && !pouring);
  const nextItem = recipe.items.find((x) => !inJar.includes(x));
  const nextTop = recipe.tops.find((x) => !tops.includes(x));
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = jarRef;
  let hintItem: string | undefined;
  hintFrom.current = null;
  if (step === 'milk') { hintItem = P('milk'); hintFrom.current = plateEls.current.milk ?? null; }
  else if (step === 'fruit' && nextItem) { hintItem = item(nextItem).src; hintFrom.current = plateEls.current[nextItem] ?? null; }
  else if (step === 'lid') { hintItem = P('blender_lid'); hintFrom.current = plateEls.current.lid ?? null; }
  else if (step === 'blend') { hintKind = 'hold'; hintTarget = btnRef; }
  else if (step === 'pour') { hintKind = 'tap'; }
  else if (step === 'top' && nextTop) { hintTarget = glassRef; hintItem = top(nextTop).src; hintFrom.current = plateEls.current[`t_${nextTop}`] ?? null; }

  const pRef = (k: string) => (el: HTMLButtonElement | null) => { plateEls.current[k] = el; };
  const tray =
    step === 'milk' ? <Plate src={P('milk')} label="Молочко" plateRef={pRef('milk')} onPick={addMilk} target={jarRef} onDrop={addMilk} />
    : step === 'fruit' ? <LoopScroller>{shelf.map((it) => (
      <Plate key={it.id} src={it.src} label={it.name} plateRef={pRef(it.id)} onPick={() => addItem(it.id)} target={jarRef} onDrop={() => addItem(it.id)}
        dim={inJar.includes(it.id)} wrong={wrong === it.id} />
    ))}</LoopScroller>
    : step === 'lid' ? <Plate src={P('blender_lid')} label="Крышка" plateRef={pRef('lid')} onPick={putLid} target={jarRef} onDrop={putLid} />
    : step === 'top' ? <LoopScroller>{topShelf.map((t) => (
      <Plate key={t.id} src={t.src} label={t.name} plateRef={pRef(`t_${t.id}`)} onPick={() => addTop(t.id)} target={glassRef} onDrop={() => addTop(t.id)} dim={tops.includes(t.id)} />
    ))}</LoopScroller>
    : undefined;

  const blending = blend.holding;
  const liquid = milk ? 0.32 + inJar.length * 0.1 : 0;
  const mixColor = mix > 0 ? recipe.color : '#FFFDF7';
  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const JAR = portrait ? 'min(58vw, 34vh, 360px)' : 'min(42vmin, 360px)';
  /** что нужно положить по рецепту: кружочки, положенное — с галочкой */
  const needRow = (list: { id: string; src: string }[], has: (id: string) => boolean) => (
    <div className="flex gap-[3vmin] justify-center" aria-hidden>
      {list.map((it) => {
        const done = has(it.id);
        return (
          <span key={it.id} className={`relative rounded-full bg-white/95 shadow-lg border-4 flex items-center justify-center ${done ? 'border-[#10C97A]' : 'border-[#FFB800] animate-pulse'}`}
            style={{ width: 'min(17vmin, 100px)', height: 'min(17vmin, 100px)' }}>
            <img src={it.src} alt="" className="w-[74%] h-[74%] object-contain" />
            {done && <span className="absolute -right-1 -top-1 w-[40%] h-[40%] rounded-full bg-[#10C97A] text-white font-black flex items-center justify-center text-[min(5vmin,26px)]">✓</span>}
          </span>
        );
      })}
    </div>
  );

  const blender = (
    <div ref={jarRef} onClick={step === 'pour' ? pour : undefined} className={`relative ${blending ? 'animate-[wiggle_0.15s_infinite]' : ''}`} style={{ width: JAR, height: `calc(${JAR} * 1.375)` }}>
      <img src={P('blender')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      {/* содержимое кувшина (поверх стекла) */}
      <div className="absolute overflow-hidden" style={{ left: '9%', width: '60%', top: '6%', height: '53%', borderRadius: '0 0 18% 18%' }}>
        <div className="absolute inset-x-0 bottom-0 transition-[height,background] duration-500"
          style={{ height: `${(pouring ? liquid * (1 - glass) : liquid) * 100}%`, background: mix > 0.05 ? `linear-gradient(${mixColor}, ${mixColor}dd)` : '#FFFFFF', opacity: 0.92, boxShadow: 'inset 0 6px 10px rgba(255,255,255,.6)' }} />
        {mix < 0.95 && inJar.map((id, i) => (
          <img key={id} src={item(id).src} alt="" className="absolute w-[42%] animate-pop-in"
            style={{ left: `${10 + (i * 37) % 50}%`, bottom: `${8 + i * 14}%`, opacity: 1 - mix, transform: `rotate(${mix * 900 + i * 60}deg) scale(${1 - mix * 0.6})` }} />
        ))}
      </div>
      {lid && <img src={P('blender_lid')} alt="" draggable={false} className="absolute pointer-events-none animate-pop-in" style={{ left: '4%', width: '70%', top: '-7%' }} />}
    </div>
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'fruit' || step === 'top'}
      recipe={step !== 'pick' && step !== 'serve' ? <ShakeGlass color={recipe.color} level={0.85} tops={recipe.tops} size="38%" /> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className="flex gap-[3vmin] flex-wrap justify-center items-end">
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={`милкшейк ${r.id}`} onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-[2.5rem] bg-white/90 shadow-xl px-[2.5vmin] pt-[7vmin] pb-[2vmin] active:scale-95 transition-transform">
              <ShakeGlass color={r.color} level={0.85} tops={r.tops} size="min(13vmin, 110px)" />
              <div className="flex justify-center gap-1 mt-2">{r.items.map((x) => <img key={x} src={item(x).src} alt="" className="w-[6vmin] h-[6vmin] object-contain" />)}</div>
            </button>
          ))}
        </div>
      )}

      {(step === 'milk' || step === 'fruit' || step === 'lid' || step === 'blend' || step === 'pour') && (
        <div className="flex flex-col items-center gap-[4vmin]">
        {step === 'fruit' && needRow(recipe.items.map(item), (id) => inJar.includes(id))}
        <div className="flex items-end gap-[5vmin]">
          <div className="relative flex flex-col items-center">
            {blender}
            {step === 'blend' && (
              <button ref={btnRef} type="button" aria-label="Кнопка блендера" {...blend.bind}
                className={`absolute rounded-full border-[6px] border-white shadow-xl transition-transform ${blending ? 'scale-90 bg-[#B91C1C]' : 'bg-[#EF4444] animate-pulse'}`}
                style={{ ...blend.bind.style, width: 'min(14vmin, 120px)', height: 'min(14vmin, 120px)', left: '26%', bottom: '4%' }} />
            )}
            {step === 'blend' && (
              <div className="w-[70%] h-3 rounded-full bg-white/70 overflow-hidden mt-2">
                <div className="h-full rounded-full" style={{ width: `${mix * 100}%`, background: recipe.color }} />
              </div>
            )}
          </div>
          {step === 'pour' && (
            <div ref={glassRef} onClick={pour} className="cursor-pointer">
              <ShakeGlass color={recipe.color} level={glass * 0.85} tops={[]} size="min(18vmin, 160px)" />
            </div>
          )}
        </div>
        </div>
      )}

      {step === 'top' && (
        <div className="flex flex-col items-center gap-[4vmin]">
          {needRow(recipe.tops.map(top), (id) => tops.includes(id))}
          <div ref={glassRef} className="pt-[10vmin]"><ShakeGlass color={recipe.color} level={0.85} tops={tops} size={portrait ? 'min(36vw, 22vh, 230px)' : 'min(26vmin, 230px)'} /></div>
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={<div className="pt-[6vmin]"><ShakeGlass color={recipe.color} level={0.85} tops={tops} size="min(14vmin, 120px)" /></div>} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={step === 'pour' ? jarRef : hintTarget} from={hintKind === 'drag' ? hintFrom : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
