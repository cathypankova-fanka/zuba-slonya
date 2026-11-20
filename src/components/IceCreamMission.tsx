import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { ICE_CREAM_BASES, ICE_CREAM_FLAVORS, ICE_CREAM_GARNISHES, IceCreamBaseId, IceCreamGarnishId } from '../data/kitchenData';
import { getIceCreamBaseAssetUrl, getIceCreamFlavorAssetUrl, getIceCreamGarnishAssetUrl, getIceCreamSyrupAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { IdleHandPointer, useIdleHint } from './MiniGameShell';
import { FeedServe, GoalCard, StepBar } from './MissionKit';

interface Recipe { id: string; base: IceCreamBaseId; flavors: string[]; syrup: string; syrupColor: string; garnish: IceCreamGarnishId[] }
const RECIPES: Recipe[] = [
  { id: 'vs', base: 'cone', flavors: ['vanilla', 'strawberry'], syrup: 'strawberry', syrupColor: '#E11D48', garnish: ['cherry'] },
  { id: 'tower', base: 'choco_cone', flavors: ['chocolate', 'vanilla', 'chocolate'], syrup: 'chocolate', syrupColor: '#5C2E14', garnish: ['wafer', 'sprinkles'] },
  { id: 'green', base: 'cup', flavors: ['pistachio', 'mint'], syrup: 'caramel', syrupColor: '#D97706', garnish: ['stars', 'cream'] },
  { id: 'berry', base: 'bowl', flavors: ['blueberry', 'strawberry', 'mango'], syrup: 'blueberry', syrupColor: '#7C3AED', garnish: ['berry', 'marshmallow'] },
];
const ICONS = ['📖', '🧊', '🍦', '🍨', '🍯', '🍒', '😋'];
const STEPS = ['pick', 'freezer', 'base', 'scoops', 'syrup', 'garnish', 'serve'] as const;
type StepId = (typeof STEPS)[number];
const say = (id: string, on: boolean) => playVoice(id, on);

/** Рисует мороженое по рецепту (SVG в координатах кухни). */
const Cone: React.FC<{ base: IceCreamBaseId | null; scoops: string[]; syrup?: string | null; garnish: IceCreamGarnishId[]; size?: string; ghosts?: number }> = ({ base, scoops, syrup, garnish, size = 'min(52vw,34vh)', ghosts = 0 }) => {
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
      {syrup && scoops.length > 0 && (
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
  const [garnish, setGarnish] = useState<IceCreamGarnishId[]>([]);
  const [key, setKey] = useState(0);
  const reaction = useMemo(() => pickReaction('icecream', character.id), [key, character.id]);
  const { showHint, resetIdle } = useIdleHint(7000, step !== 'serve');
  const syrupDrag = useRef(false);

  const next = useCallback((v?: string) => {
    soundEngine.playGameOk(soundEnabled);
    // сначала договаривается фраза про предмет, потом переход к следующему шагу
    whenVoiceIdle(() => {
      setIdx((i) => Math.min(i + 1, STEPS.length - 1));
      resetIdle();
      if (v) window.setTimeout(() => say(v, soundEnabled), 250);
    });
  }, [soundEnabled, resetIdle]);

  useEffect(() => {
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
    if (step === 'freezer') {
      if (uniq.includes(id)) { soundEngine.playGameOk(soundEnabled); setBasket((b) => (b.includes(id) ? b : [...b, id])); } else oops(id);
    } else if (step === 'scoops') {
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
    if (b === recipe.base) { setBase(b); window.setTimeout(() => next(), 350); } else oops(b);
  };
  const pickGarnish = (g: IceCreamGarnishId) => {
    resetIdle();
    if (!recipe.garnish.includes(g)) return oops(g);
    if (garnish.includes(g)) return;
    soundEngine.playGamePop(soundEnabled, 6);
    const ng = [...garnish, g]; setGarnish(ng);
    if (ng.length === recipe.garnish.length) window.setTimeout(() => next('im_ok_garnish'), 500);
  };
  const syrupMove = (e: React.PointerEvent) => {
    if (!syrupDrag.current || step !== 'syrup') return;
    setSyrupPct((p) => {
      const n = Math.min(1, p + 0.02);
      if (p < 1 && n >= 1) window.setTimeout(() => next('im_ok_syrup'), 400);
      return n;
    });
  };
  const restart = () => { setIdx(0); setBasket([]); setBase(null); setScoops([]); setSyrupPct(0); setGarnish([]); };

  const flavorBtn = (f: (typeof ICE_CREAM_FLAVORS)[number], dim = false) => (
    <button key={f.id} type="button" aria-label={f.name} onClick={() => pickFlavor(f.id)}
      className={`w-[17vw] h-[17vw] max-w-[84px] max-h-[84px] rounded-2xl bg-white shadow flex items-center justify-center transition-all ${dim ? 'opacity-30 scale-75' : wrong === f.id ? 'animate-[wiggle_0.4s] !bg-red-100' : 'active:scale-90'}`}>
      <img src={getIceCreamFlavorAssetUrl(f.id)!} alt="" draggable={false} className="w-[84%] h-[84%] object-contain" />
    </button>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center gap-2 pt-1 relative overflow-hidden" onPointerDown={() => resetIdle()}>
      <StepBar icons={ICONS} idx={idx} onTap={(i) => say(`im_${STEPS[i]}`, soundEnabled)} />
      {step !== 'pick' && step !== 'serve' && (
        <GoalCard
          dishNode={<Cone base={recipe.base} scoops={recipe.flavors} syrup={recipe.syrupColor} garnish={recipe.garnish} size="104px" />}
          numbered={step === 'scoops'}
          images={
            step === 'freezer' ? uniq.map((f) => getIceCreamFlavorAssetUrl(f)!)
            : step === 'base' ? [getIceCreamBaseAssetUrl(recipe.base)]
            : step === 'scoops' ? recipe.flavors.map((f) => getIceCreamFlavorAssetUrl(f)!)
            : step === 'syrup' ? [getIceCreamSyrupAssetUrl(recipe.syrup) ?? getIceCreamFlavorAssetUrl(recipe.flavors[0])!]
            : recipe.garnish.map(getIceCreamGarnishAssetUrl)
          }
        />
      )}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3">
        {step === 'pick' && (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 p-2">
            {RECIPES.map((r) => (
              <button key={r.id} type="button" aria-label={`рецепт ${r.id}`} onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
                className="toy-pill rounded-3xl p-2 bg-white/90 active:scale-95 transition-transform flex justify-center">
                <Cone base={r.base} scoops={r.flavors} syrup={r.syrupColor} garnish={r.garnish} size="min(36vw,20vh)" />
              </button>
            ))}
          </div>
        )}
        {step === 'freezer' && (
          <div className="flex flex-col items-center gap-3 px-2">
            <div className="text-5xl">❄️ ➜ 🧺</div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-white/80 rounded-3xl p-3">{ICE_CREAM_FLAVORS.map((f) => flavorBtn(f, basket.includes(f.id)))}</div>
            <div className="toy-pill px-3 py-2 flex items-center gap-1 min-h-[56px] min-w-[120px] justify-center"><span className="text-3xl">🧺</span>{basket.map((b) => <img key={b} src={getIceCreamFlavorAssetUrl(b)!} alt="" className="w-9 h-9 object-contain" />)}</div>
          </div>
        )}
        {step === 'base' && (
          <div className="grid grid-cols-2 gap-3 bg-white/80 rounded-3xl p-3">
            {ICE_CREAM_BASES.map((b) => (
              <button key={b.id} type="button" aria-label={b.name} onClick={() => pickBase(b.id)}
                className={`w-[30vw] h-[30vw] max-w-[150px] max-h-[150px] rounded-2xl bg-white shadow flex items-center justify-center ${wrong === b.id ? 'animate-[wiggle_0.4s] !bg-red-100' : 'active:scale-90'}`}>
                <img src={getIceCreamBaseAssetUrl(b.id)} alt="" draggable={false} className="w-[86%] h-[86%] object-contain" />
              </button>
            ))}
          </div>
        )}
        {(step === 'scoops' || step === 'syrup' || step === 'garnish') && (
          <div className="relative" onPointerDown={() => { syrupDrag.current = true; }} onPointerUp={() => { syrupDrag.current = false; }} onPointerLeave={() => { syrupDrag.current = false; }} onPointerMove={syrupMove} style={{ touchAction: 'none' }}>
            <Cone base={base} scoops={scoops} syrup={step === 'syrup' || idx > 4 ? recipe.syrupColor : null} garnish={garnish} size="min(46vw,30vh)" ghosts={step === 'scoops' ? recipe.flavors.length : 0} />
            {step === 'syrup' && <div className="absolute inset-0 flex items-start justify-center pointer-events-none text-5xl opacity-70">🍯〰️</div>}
            {step === 'syrup' && <div className="absolute left-0 right-0 -bottom-2 h-2 rounded bg-white/50"><div className="h-2 rounded bg-[#FFB800]" style={{ width: `${syrupPct * 100}%` }} /></div>}
            {showHint && <IdleHandPointer className="absolute left-[40%] top-[30%]" />}
          </div>
        )}
        {step === 'scoops' && (
          <div className="toy-pill px-2 py-2 flex gap-2">{uniq.map((id) => flavorBtn(ICE_CREAM_FLAVORS.find((f) => f.id === id)!))}</div>
        )}
        {step === 'garnish' && (
          <div className="toy-pill px-2 py-2 flex flex-wrap gap-2 justify-center max-w-[92vw]">
            {ICE_CREAM_GARNISHES.map((g) => (
              <button key={g.id} type="button" aria-label={g.name} onClick={() => pickGarnish(g.id)}
                className={`w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center ${garnish.includes(g.id) ? 'opacity-30 scale-75' : wrong === g.id ? 'animate-[wiggle_0.4s] !bg-red-100' : 'active:scale-90'}`}>
                <img src={getIceCreamGarnishAssetUrl(g.id)} alt="" draggable={false} className="w-[80%] h-[80%] object-contain" />
              </button>
            ))}
          </div>
        )}
        {step === 'serve' && (
          <FeedServe character={character} reaction={reaction} runKey={key} soundEnabled={soundEnabled} onRestart={restart}
            dish={<Cone base={base} scoops={scoops} syrup={recipe.syrupColor} garnish={garnish} size="min(36vw,22vh)" />} />
        )}
      </div>
    </div>
  );
};
