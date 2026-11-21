import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { ICE_CREAM_BASES, ICE_CREAM_FLAVORS, ICE_CREAM_GARNISHES, IceCreamBaseId, IceCreamGarnishId } from '../data/kitchenData';
import { getIceCreamBaseAssetUrl, getIceCreamFlavorAssetUrl, getIceCreamGarnishAssetUrl, getIceCreamSyrupAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { useIdleHint } from './MiniGameShell';
import { FeedServe } from './MissionKit';
import { createPortal } from 'react-dom';
import { ICE_CREAM_SYRUPS } from '../data/kitchenData';
import { bottleSrc, CookScreen, NeedRow, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';

interface Recipe { id: string; base: IceCreamBaseId; flavors: string[]; syrup: string; syrupColor: string; garnish: IceCreamGarnishId[] }
const RECIPES: Recipe[] = [
  { id: 'vs', base: 'cone', flavors: ['vanilla', 'strawberry'], syrup: 'strawberry', syrupColor: '#E11D48', garnish: ['cherry'] },
  { id: 'tower', base: 'choco_cone', flavors: ['chocolate', 'vanilla', 'chocolate'], syrup: 'chocolate', syrupColor: '#5C2E14', garnish: ['wafer', 'sprinkles'] },
  { id: 'green', base: 'cup', flavors: ['pistachio', 'mint'], syrup: 'caramel', syrupColor: '#D97706', garnish: ['stars', 'cream'] },
  { id: 'berry', base: 'bowl', flavors: ['blueberry', 'strawberry', 'mango'], syrup: 'blueberry', syrupColor: '#7C3AED', garnish: ['berry', 'marshmallow'] },
  { id: 'banana', base: 'cup', flavors: ['banana', 'chocolate'], syrup: 'caramel', syrupColor: '#D97706', garnish: ['cream', 'cookie'] },
  { id: 'bubble', base: 'cone', flavors: ['bubblegum', 'vanilla'], syrup: 'strawberry', syrupColor: '#E11D48', garnish: ['sprinkles', 'stars'] },
  { id: 'mango', base: 'choco_cone', flavors: ['mango', 'pistachio'], syrup: 'caramel', syrupColor: '#D97706', garnish: ['wafer', 'cherry'] },
  { id: 'party', base: 'bowl', flavors: ['strawberry', 'chocolate', 'vanilla'], syrup: 'chocolate', syrupColor: '#5C2E14', garnish: ['cream', 'cherry', 'sprinkles'] },
];
const ICONS = ['📖', '🧊', '🍦', '🍨', '🍯', '🍒', '😋'];
const STEPS = ['pick', 'freezer', 'base', 'scoops', 'syrup', 'garnish', 'serve'] as const;
type StepId = (typeof STEPS)[number];
const say = (id: string, on: boolean) => playVoice(id, on);

const SYRUPS = ICE_CREAM_SYRUPS.filter((x) => x.id !== 'none');
type Pt = { x: number; y: number };
const scoopCircle = (i: number) => ({ cy: 242 - i * 50, r: 62 - i * 3 });

/** Рисует мороженое по рецепту (SVG в координатах кухни). */
const Cone: React.FC<{ base: IceCreamBaseId | null; scoops: string[]; syrup?: string | null; garnish: IceCreamGarnishId[]; size?: string; ghosts?: number; drizzle?: Pt[][]; drizzleColor?: string }> = ({ base, scoops, syrup, garnish, size = 'min(52vw,34vh)', ghosts = 0, drizzle, drizzleColor }) => {
  const clipId = React.useId().replace(/:/g, '');
  const topIdx = scoops.length - 1;
  const topCy = 242 - topIdx * 50;
  const topR = 62 - topIdx * 3;
  return (
    <svg viewBox="90 80 300 360" style={{ width: size, height: `calc(${size} * 1.2)` }}>
      {base && <image href={getIceCreamBaseAssetUrl(base)} x={base === 'bowl' ? 116 : base === 'cup' ? 142 : 150} y={base === 'bowl' ? 238 : 246} width={base === 'bowl' ? 248 : base === 'cup' ? 196 : 180} height={base === 'bowl' ? 184 : base === 'cup' ? 176 : 182} preserveAspectRatio="xMidYMid meet" />}
      {/* пустые места под шарики: цифра = в каком порядке класть (снизу вверх) */}
      {Array.from({ length: Math.max(0, ghosts - scoops.length) }).map((_, k) => {
        const i = scoops.length + k;
        const cy = 242 - i * 50, r = 62 - i * 3;
        return (
          <g key={`g${i}`} className={k === 0 ? 'animate-pulse' : ''} opacity={k === 0 ? 1 : 0.65}>
            <ellipse cx="240" cy={cy} rx={r * 1.05} ry={r * 0.92} fill="rgba(255,255,255,0.35)" stroke="#FFB800" strokeWidth="5" strokeDasharray="12 9" />
            <circle cx="240" cy={cy} r="20" fill="#FFB800" />
            <text x="240" y={cy + 9} textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">{i + 1}</text>
          </g>
        );
      })}
      {scoops.map((f, i) => {
        const cy = 242 - i * 50, r = 62 - i * 3;
        return <image key={i} href={getIceCreamFlavorAssetUrl(f) ?? ''} x={240 - r * 1.15} y={cy - r * 1.12} width={r * 2.3} height={r * 2.24} preserveAspectRatio="xMidYMid meet" />;
      })}
      {drizzle && drizzle.length > 0 && scoops.length > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <defs><clipPath id={clipId}>{scoops.map((_, i) => { const c = scoopCircle(i); return <ellipse key={i} cx="240" cy={c.cy} rx={c.r * 1.08} ry={c.r * 0.98} />; })}</clipPath></defs>
          {drizzle.map((st, k) => st.length === 1
            ? <circle key={k} cx={st[0].x} cy={st[0].y} r="7" fill={drizzleColor} />
            : <polyline key={k} points={st.map((q) => `${q.x},${q.y}`).join(' ')} fill="none" stroke={drizzleColor} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" opacity="0.93" />)}
          {drizzle.map((st, k) => st.length > 1 && <polyline key={`h${k}`} points={st.map((q) => `${q.x - 2},${q.y - 3}`).join(' ')} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.35" />)}
        </g>
      )}
      {syrup && !drizzle?.length && scoops.length > 0 && (
        <g transform={`translate(240, ${topCy})`}>
          <path d={`M-${topR * 0.85} -${topR * 0.2} A${topR} ${topR} 0 0 1 ${topR * 0.85} -${topR * 0.2} C${topR * 0.7} ${topR * 0.35}, ${topR * 0.45} ${topR * 0.4}, ${topR * 0.35} ${topR * 0.05} C${topR * 0.22} ${topR * 0.55}, ${topR * 0.05} ${topR * 0.5}, -${topR * 0.05} ${topR * 0.12} C-${topR * 0.22} ${topR * 0.52}, -${topR * 0.48} ${topR * 0.4}, -${topR * 0.5} ${topR * 0.04} Z`} fill={syrup} opacity="0.88" />
        </g>
      )}
      {scoops.length > 0 && garnish.map((g, i) => (
        <image key={g} href={getIceCreamGarnishAssetUrl(g)} x={240 - 34 + (i % 2 ? 26 : -22)} y={topCy - topR - 34 - (i > 1 ? 24 : 0)} width="68" height="68" preserveAspectRatio="xMidYMid meet" />
      ))}
    </svg>
  );
};

export const IceCreamMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [idx, setIdx] = useState(0);
  const step: StepId = STEPS[idx];
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [basket, setBasket] = useState<string[]>([]);
  const [base, setBase] = useState<IceCreamBaseId | null>(null);
  const [scoops, setScoops] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [syrupPct, setSyrupPct] = useState(0);
  const [bottle, setBottle] = useState<string | null>(null); // выбранная бутылочка
  const [drizzle, setDrizzle] = useState<Pt[][]>([]);
  const [squeeze, setSqueeze] = useState<Pt | null>(null); // где сейчас палец с бутылочкой (экран)
  const [garnish, setGarnish] = useState<IceCreamGarnishId[]>([]);
  const [key, setKey] = useState(0);
  const [doneFx, setDoneFx] = useState(false);
  const reaction = useMemo(() => pickReaction('icecream', character.id), [key, character.id]);
  const { resetIdle } = useIdleHint(7000, step !== 'serve');
  const syrupDrag = useRef(false);

  const stepBusy = useRef(false);
  const next = useCallback((v?: string) => {
      if (stepBusy.current) return; // повторные нажатия, пока помощник договаривает, не перескакивают шаги
      stepBusy.current = true;
    soundEngine.playGameOk(soundEnabled);
    setDoneFx(true); // большая звезда: шаг выполнен
    if (v) window.setTimeout(() => say(v, soundEnabled), 150);
    // сначала договаривается фраза, потом переход к следующему шагу
    window.setTimeout(() => whenVoiceIdle(() => {
      setDoneFx(false);
      stepBusy.current = false;
      setIdx((i) => Math.min(i + 1, STEPS.length - 1));
      resetIdle();
    }), 900);
  }, [soundEnabled, resetIdle]);

  useEffect(() => {
    syrupDrag.current = false;
    if (step === 'serve') {
      setKey((k) => k + 1);
    } else say(`im_${step}`, soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const uniq = Array.from(new Set(recipe.flavors));
  useEffect(() => {
    if (step === 'freezer' && uniq.every((f) => basket.includes(f))) {
      const t = window.setTimeout(() => next('im_ok_freezer'), 500);
      return () => window.clearTimeout(t);
    }
  }, [basket, step, recipe, next]); // eslint-disable-line

  const oops = (id: string) => { soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600); say('im_wrong', soundEnabled); };

  const pickFlavor = (id: string) => {
    resetIdle();
    if (doneFx) return;
    if (step === 'freezer') {
      if (basket.includes(id)) return;
      if (uniq.includes(id)) { soundEngine.playGameOk(soundEnabled); setBasket((b) => (b.includes(id) ? b : [...b, id])); } else oops(id);
    } else if (step === 'scoops') {
      if (scoops.length >= recipe.flavors.length) return;
      const want = recipe.flavors[scoops.length];
      if (id === want) {
        soundEngine.playGamePop(soundEnabled, 3 + scoops.length);
        const ns = [...scoops, id];
        setScoops(ns);
        if (ns.length === recipe.flavors.length) window.setTimeout(() => next('im_ok_scoops'), 500);
      } else oops(id);
    }
  };
  const pickBase = (b: IceCreamBaseId) => {
    resetIdle();
    if (base || doneFx) return;
    if (b === recipe.base) { soundEngine.playGamePop(soundEnabled, 4); setBase(b); window.setTimeout(() => next(), 450); } else oops(b);
  };
  const pickGarnish = (g: IceCreamGarnishId) => {
    resetIdle();
    if (doneFx) return;
    if (!recipe.garnish.includes(g)) return oops(g);
    if (garnish.includes(g)) return;
    soundEngine.playGamePop(soundEnabled, 6);
    const ng = [...garnish, g]; setGarnish(ng);
    if (ng.length === recipe.garnish.length) window.setTimeout(() => next('im_ok_garnish'), 500);
  };
    // ---------- сироп: выбрать бутылочку и выдавить ----------
  const pickBottle = (id: string) => {
    resetIdle();
    if (doneFx || bottle) return;
    if (id === recipe.syrup) { soundEngine.playGameOk(soundEnabled); setBottle(id); } else oops(`syr_${id}`);
  };
  const SQ_UP = 46; // сироп капает чуть выше пальца, чтобы палец не закрывал
  const syrupAt = (e: React.PointerEvent): Pt | null => {
    const svg = centerRef.current?.querySelector('svg');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: 90 + ((e.clientX - r.left) / r.width) * 300, y: 80 + ((e.clientY - SQ_UP - r.top) / r.height) * 360 };
  };
  const onScoop = (q: Pt) => scoops.some((_, i) => { const c = scoopCircle(i); return Math.hypot((q.x - 240) / 1.08, (q.y - c.cy) / 0.98) < c.r; });
  const syrupDown = (e: React.PointerEvent) => {
    if (step !== 'syrup' || !bottle || doneFx) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    syrupDrag.current = true;
    setSqueeze({ x: e.clientX, y: e.clientY });
    const q = syrupAt(e);
    if (q) setDrizzle((d) => [...d, [q]]);
    soundEngine.playGamePop(soundEnabled, 1);
  };
  const syrupMove = (e: React.PointerEvent) => {
    if (!syrupDrag.current || step !== 'syrup' || !bottle) return;
    setSqueeze({ x: e.clientX, y: e.clientY });
    const q = syrupAt(e);
    if (!q) return;
    setDrizzle((d) => {
      const st = d[d.length - 1] ?? [];
      const last = st[st.length - 1];
      if (last && Math.hypot(last.x - q.x, last.y - q.y) < 6) return d;
      return [...d.slice(0, -1), [...st, q]];
    });
    if (onScoop(q)) setSyrupPct((p) => {
      const n = Math.min(1, p + 0.012);
      if (p < 1 && n >= 1) window.setTimeout(() => { syrupDrag.current = false; setSqueeze(null); next('im_ok_syrup'); }, 300);
      return n;
    });
  };
  const syrupUp = () => { syrupDrag.current = false; setSqueeze(null); };
  const restart = () => { stepBusy.current = false; setIdx(0); setBasket([]); setBase(null); setScoops([]); setSyrupPct(0); setGarnish([]); setBottle(null); setDrizzle([]); };

  // ---------- интерфейс: каждый шаг на весь экран ----------
  const centerRef = useRef<HTMLDivElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFromRef = useRef<HTMLButtonElement | null>(null);
  const showGesture = useStepHint(`${step}-${bottle ?? ''}`, 2600, 7000, step !== 'serve' && step !== 'pick' && !doneFx);
  const flavorShelf = useMemo(() => [...ICE_CREAM_FLAVORS].sort(() => Math.random() - 0.5), [recipe]);

  const nextFlavor = step === 'freezer' ? uniq.find((f) => !basket.includes(f)) : step === 'scoops' ? recipe.flavors[scoops.length] : undefined;
  const nextGarnish = recipe.garnish.find((g) => !garnish.includes(g));
  const hintFromId = step === 'freezer' || step === 'scoops' ? nextFlavor : step === 'base' ? recipe.base : step === 'garnish' ? nextGarnish : undefined;
  hintFromRef.current = hintFromId ? plateEls.current[hintFromId] ?? null : null;
  let hintKind: HintKind = 'drag';
  let hintItem: string | undefined =
    step === 'freezer' || step === 'scoops' ? (nextFlavor ? getIceCreamFlavorAssetUrl(nextFlavor) ?? undefined : undefined)
    : step === 'base' ? getIceCreamBaseAssetUrl(recipe.base)
    : step === 'garnish' && nextGarnish ? getIceCreamGarnishAssetUrl(nextGarnish) : undefined;
  if (step === 'syrup') {
    if (bottle) { hintKind = 'rub'; hintItem = undefined; }
    else { hintItem = bottleSrc(recipe.syrupColor); hintFromRef.current = plateEls.current[`syr_${recipe.syrup}`] ?? null; }
  }

  const fRef = (id: string) => (el: HTMLButtonElement | null) => { plateEls.current[id] = el; };
  const flavorName = (id: string) => ICE_CREAM_FLAVORS.find((f) => f.id === id)?.name ?? '';
  const BIG = 'min(46vmin, 400px)';
  const portraitPick = window.innerHeight > window.innerWidth * 1.2;
  // «что нужно» на каждом шаге — чтобы не угадывать
  const needItems =
    step === 'freezer' ? uniq.map((f) => ({ key: f, src: getIceCreamFlavorAssetUrl(f)!, done: basket.includes(f) }))
    : step === 'base' ? [{ key: 'b', src: getIceCreamBaseAssetUrl(recipe.base), done: !!base }]
    : step === 'scoops' ? recipe.flavors.map((f, i) => ({ key: `${f}${i}`, src: getIceCreamFlavorAssetUrl(f)!, done: i < scoops.length, now: i === scoops.length }))
    : step === 'syrup' ? [{ key: 's', src: bottleSrc(recipe.syrupColor), done: syrupPct >= 1 }]
    : step === 'garnish' ? recipe.garnish.map((g) => ({ key: g, src: getIceCreamGarnishAssetUrl(g), done: garnish.includes(g) }))
    : null;
  const needRow = needItems && <NeedRow items={needItems} ordered={step === 'scoops'} />;

  const tray =
    step === 'freezer' ? <LoopScroller>{flavorShelf.map((f) => (
      <Plate key={f.id} src={getIceCreamFlavorAssetUrl(f.id)!} label={f.name} plateRef={fRef(f.id)}
        onPick={() => pickFlavor(f.id)} target={centerRef} onDrop={() => pickFlavor(f.id)}
        dim={basket.includes(f.id)} wrong={wrong === f.id} />
    ))}</LoopScroller>
    : step === 'base' ? ICE_CREAM_BASES.map((b) => (
      <Plate key={b.id} src={getIceCreamBaseAssetUrl(b.id)} label={b.name} plateRef={fRef(b.id)}
        onPick={() => pickBase(b.id)} target={centerRef} onDrop={() => pickBase(b.id)} wrong={wrong === b.id} />
    ))
    : step === 'scoops' ? uniq.map((id) => (
      <Plate key={id} src={getIceCreamFlavorAssetUrl(id)!} label={flavorName(id)} plateRef={fRef(id)}
        onPick={() => pickFlavor(id)} target={centerRef} onDrop={() => pickFlavor(id)}
        selected={recipe.flavors[scoops.length] === id} wrong={wrong === id} />
    ))
    : step === 'syrup' ? (bottle ? undefined : SYRUPS.map((sy) => (
      <Plate key={sy.id} src={bottleSrc(sy.color)} label={sy.name} plateRef={fRef(`syr_${sy.id}`)}
        onPick={() => pickBottle(sy.id)} target={centerRef} onDrop={() => pickBottle(sy.id)} wrong={wrong === `syr_${sy.id}`} />
    )))
    : step === 'garnish' ? <LoopScroller>{ICE_CREAM_GARNISHES.map((g) => (
      <Plate key={g.id} src={getIceCreamGarnishAssetUrl(g.id)} label={g.name} plateRef={fRef(g.id)}
        onPick={() => pickGarnish(g.id)} target={centerRef} onDrop={() => pickGarnish(g.id)}
        dim={garnish.includes(g.id)} wrong={wrong === g.id} />
    ))}</LoopScroller>
    : undefined;

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'freezer' || step === 'garnish'}
      recipe={step !== 'pick' && step !== 'serve' ? <Cone base={recipe.base} scoops={recipe.flavors} syrup={recipe.syrupColor} garnish={recipe.garnish} size="68%" /> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className={`grid ${portraitPick ? 'grid-cols-2' : 'grid-cols-4 pr-[min(15vmin,140px)]'} gap-[2.5vmin]`}>
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={`рецепт ${r.id}`} onClick={() => { if (doneFx) return; setRecipe(r); next(); }}
              className="rounded-[2.5rem] bg-white/90 shadow-xl p-[1.5vmin] active:scale-95 transition-transform flex justify-center">
              <Cone base={r.base} scoops={r.flavors} syrup={r.syrupColor} garnish={r.garnish} size={portraitPick ? 'min(26vw, 12.5vh, 230px)' : 'min(20vmin, 180px)'} />
            </button>
          ))}
        </div>
      )}

      {step === 'freezer' && (
        <div className="flex flex-col items-center gap-[3vmin]">{needRow}
        <div ref={centerRef} className="relative rounded-[3rem] bg-gradient-to-b from-[#E0F2FE] to-[#93C5FD] border-[6px] border-white shadow-2xl flex flex-col items-center justify-center"
          style={{ width: 'min(62vmin, 520px)', height: 'min(50vmin, 420px)' }}>
          <div className="absolute top-[6%] text-[9vmin] opacity-80">❄️</div>
          <div className="flex flex-wrap justify-center gap-[2vmin] px-[6%]">
            {uniq.map((f) => (
              <div key={f} className="rounded-full bg-white/70 border-4 border-dashed border-[#60A5FA] flex items-center justify-center"
                style={{ width: 'min(15vmin, 128px)', height: 'min(15vmin, 128px)' }}>
                {basket.includes(f)
                  ? <img src={getIceCreamFlavorAssetUrl(f)!} alt="" className="w-[88%] h-[88%] object-contain animate-pop-in" />
                  : <img src={getIceCreamFlavorAssetUrl(f)!} alt="" className="w-[70%] h-[70%] object-contain opacity-40" />}
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {step === 'base' && (
        <div className="flex flex-col items-center gap-[3vmin]">{needRow}
        <div ref={centerRef} className="rounded-full bg-white/50 border-[6px] border-dashed border-[#FFB800] flex items-center justify-center"
          style={{ width: BIG, height: BIG }}>
          {base
            ? <img src={getIceCreamBaseAssetUrl(base)} alt="" className="w-[80%] h-[80%] object-contain animate-pop-in" />
            : <img src={getIceCreamBaseAssetUrl(recipe.base)} alt="" className="w-[70%] h-[70%] object-contain opacity-40" />}
        </div>
        </div>
      )}

      {(step === 'scoops' || step === 'syrup' || step === 'garnish') && (
        <div className="flex flex-col items-center gap-[3vmin]">{needRow}
        <div ref={centerRef} className="relative"
          onPointerDown={syrupDown} onPointerUp={syrupUp} onPointerCancel={syrupUp} onPointerMove={syrupMove}
          style={{ touchAction: 'none', cursor: step === 'syrup' && bottle ? 'none' : undefined }}>
          <Cone base={base ?? recipe.base} scoops={scoops} syrup={idx > 4 ? recipe.syrupColor : null} drizzle={drizzle} drizzleColor={recipe.syrupColor}
            garnish={garnish} size="min(54vmin, 470px)" ghosts={step === 'scoops' ? recipe.flavors.length : 0} />
          {step === 'syrup' && bottle && !squeeze && (
            <img src={bottleSrc(recipe.syrupColor)} alt="" draggable={false} className="absolute -right-[18%] top-[8%] w-[22%] pointer-events-none drop-shadow-xl animate-bounce" />
          )}
          {step === 'syrup' && squeeze && createPortal(
            <div className="fixed z-[58] pointer-events-none" style={{ left: squeeze.x, top: squeeze.y - SQ_UP }}>
              <div className="absolute left-[-4px] top-[-26px] w-[8px] h-[26px] rounded-full" style={{ background: recipe.syrupColor }} />
              <img src={bottleSrc(recipe.syrupColor)} alt="" draggable={false} className="absolute drop-shadow-2xl"
                style={{ width: 84, height: 134, maxWidth: 'none', left: -42, top: -26 - 134, transform: 'rotate(180deg) scaleX(1.1) scaleY(0.94)' }} />
            </div>,
            document.body,
          )}
          {step === 'syrup' && bottle && (
            <div className="absolute left-[10%] right-[10%] -bottom-1 h-3 rounded-full bg-white/60 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${syrupPct * 100}%`, background: recipe.syrupColor }} />
            </div>
          )}
        </div>
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={key} soundEnabled={soundEnabled} onRestart={restart}
          dish={<Cone base={base} scoops={scoops} syrup={recipe.syrupColor} drizzle={drizzle} drizzleColor={recipe.syrupColor} garnish={garnish} size="min(30vmin, 240px)" />} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={centerRef} from={hintKind === 'drag' ? hintFromRef : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
