import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { SOUP_INGREDIENTS, SoupIngredientId } from '../data/kitchenData';
import { getSoupBaseAssetUrl, getSoupIngredientAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { IdleHandPointer, useIdleHint } from './MiniGameShell';
import { FeedServe, GoalCard, StepBar } from './MissionKit';

interface Recipe { id: string; broth: string; color: string; items: SoupIngredientId[]; toppings: SoupIngredientId[] }
const RECIPES: Recipe[] = [
  { id: 'veggie', broth: 'veggie', color: '#C9D97A', items: ['carrot', 'potato', 'peas'], toppings: ['herbs'] },
  { id: 'tomato', broth: 'tomato', color: '#E5533D', items: ['tomato', 'mushroom', 'noodles'], toppings: ['crouton', 'sour_cream'] },
  { id: 'chicken', broth: 'chicken', color: '#F2C94C', items: ['noodles', 'carrot', 'meatball'], toppings: ['herbs'] },
  { id: 'pumpkin', broth: 'pumpkin', color: '#F2994A', items: ['corn', 'broccoli'], toppings: ['crouton', 'sour_cream'] },
];
const MAIN = SOUP_INGREDIENTS.filter((i) => !['crouton', 'herbs', 'sour_cream'].includes(i.id));
const TOP = SOUP_INGREDIENTS.filter((i) => ['crouton', 'herbs', 'sour_cream'].includes(i.id));
const ICONS = ['📖', '🧺', '🔪', '🍲', '🥄', '👅', '🌿', '😋'];
const STEPS = ['pick', 'pantry', 'chop', 'pot', 'stir', 'taste', 'garnish', 'serve'] as const;
type StepId = (typeof STEPS)[number];
const say = (id: string, on: boolean) => playVoice(id, on);
const ing = (i: SoupIngredientId) => getSoupIngredientAssetUrl(i);
const CHOPS = 3;
const S2 = (n: string) => `/assets/items/soup2/${n}.webp`;
/** сырой вид (для резки) и нарезанный вид (после резки, в кастрюле) */
const RAW: Partial<Record<SoupIngredientId, string>> = { carrot: S2('carrot_whole'), potato: S2('potato_whole'), tomato: S2('tomato_whole') };
const CHOPPED: Record<string, string> = {
  carrot: S2('carrot_slices'), potato: S2('potato_cubes'), peas: S2('peas'), broccoli: S2('broccoli_florets'), tomato: S2('tomato_wedges'),
  mushroom: S2('mushroom_slices'), noodles: S2('noodles_cut'), meatball: S2('meatballs'), corn: S2('corn_kernels'),
};
const raw = (i: SoupIngredientId) => RAW[i] ?? ing(i);
const chopped = (i: SoupIngredientId) => CHOPPED[i] ?? ing(i);

/** Кастрюля (Kling), внутри — поверхность бульона и плавающие нарезанные кусочки. */
const Pot: React.FC<{ broth: string; filled: boolean; items: SoupIngredientId[]; turn: number; hot?: boolean; size: string; children?: React.ReactNode }> = ({ broth, filled, items, turn, hot, size, children }) => (
  <div className="relative" style={{ width: size, height: `calc(${size} * 0.83)` }}>
    <img src={S2('pot_open')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
    <div className="absolute pointer-events-none" style={{ left: '15%', top: '9%', width: '67%', height: '30%', opacity: filled ? 1 : 0, transition: 'opacity 0.6s' }}>
      <img src={S2(`broth_${broth}`)} alt="" draggable={false} className="absolute inset-0 w-full h-full object-fill" style={{ transform: `rotate(${turn * 25}deg) scaleY(1)`, transition: 'transform 0.3s' }} />
      {items.map((p, i) => (
        <img key={p} src={chopped(p)} alt="" draggable={false} className="absolute w-[34%] soup-drop"
          style={{ left: `${8 + ((i * 31 + 6) % 52)}%`, top: `${8 + ((i * 23) % 30)}%`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.25))' }} />
      ))}
    </div>
    {hot && [0, 1, 2].map((k) => (
      <img key={k} src={S2('steam')} alt="" draggable={false} className="absolute w-[20%] soup-steam pointer-events-none" style={{ left: `${24 + k * 20}%`, top: '2%', animationDelay: `${k * 0.8}s` }} />
    ))}
    {children}
  </div>
);

export const SoupMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [idx, setIdx] = useState(0);
  const step: StepId = STEPS[idx];
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [basket, setBasket] = useState<SoupIngredientId[]>([]);
  const [cuts, setCuts] = useState<Record<string, number>>({});
  const [hit, setHit] = useState<string | null>(null);
  const [inPot, setInPot] = useState<SoupIngredientId[]>([]);
  const [turns, setTurns] = useState(0);
  const [tasted, setTasted] = useState(false);
  const [tops, setTops] = useState<SoupIngredientId[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const reaction = useMemo(() => pickReaction('soup', character.id), [key, character.id]);
  const { showHint, resetIdle } = useIdleHint(7000, step !== 'serve');
  const potRef = useRef<HTMLDivElement>(null);
  const spin = useRef<{ down: boolean; a0: number }>({ down: false, a0: 0 });
  const chopAt = useRef<Record<string, { t: number; x: number }>>({});

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
    spin.current.down = false;
    if (step === 'serve') {
      setKey((k) => k + 1);
    } else say(`sm_${step}`, soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const oops = (id: string) => { soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600); say('sm_wrong', soundEnabled); };

  useEffect(() => {
    let t: number | undefined;
    if (step === 'pantry' && recipe.items.every((x) => basket.includes(x))) t = window.setTimeout(() => next('sm_ok_pantry'), 600);
    if (step === 'chop' && recipe.items.every((x) => (cuts[x] ?? 0) >= CHOPS)) t = window.setTimeout(() => next('sm_ok_chop'), 900);
    if (step === 'pot' && recipe.items.every((x) => inPot.includes(x))) t = window.setTimeout(() => next(), 900);
    if (step === 'garnish' && recipe.toppings.every((x) => tops.includes(x))) t = window.setTimeout(() => next('sm_ok_garnish'), 600);
    return () => { if (t) window.clearTimeout(t); };
  }, [basket, cuts, inPot, tops, step]); // eslint-disable-line

  // ---------- помешать ----------
  const sDown = (e: React.PointerEvent) => {
    const r = potRef.current!.getBoundingClientRect();
    spin.current = { down: true, a0: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const sMove = (e: React.PointerEvent) => {
    if (!spin.current.down || step !== 'stir') return;
    const r = potRef.current!.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    let da = a - spin.current.a0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    spin.current.a0 = a;
    setTurns((t) => { const n = Math.min(3, t + Math.abs(da) / (2 * Math.PI)); if (t < 3 && n >= 3) window.setTimeout(() => next(), 400); return n; });
  };
  const sUp = () => { spin.current.down = false; };

  // ---------- резать: тык ИЛИ проведи пальцем ----------
  const chop = (id: SoupIngredientId, x: number) => {
    const now = Date.now();
    const last = chopAt.current[id];
    if (last && now - last.t < 130) return;
    chopAt.current[id] = { t: now, x };
    if ((cuts[id] ?? 0) >= CHOPS) return;
    resetIdle();
    soundEngine.playEraseSwoosh?.(soundEnabled);
    soundEngine.playGamePop(soundEnabled, 2 + (cuts[id] ?? 0));
    setHit(id); window.setTimeout(() => setHit((h) => (h === id ? null : h)), 320);
    setCuts((c) => ({ ...c, [id]: Math.min(CHOPS, (c[id] ?? 0) + 1) }));
  };
  const chopMove = (e: React.PointerEvent, id: SoupIngredientId) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const last = chopAt.current[id];
    if (last && Math.abs(e.clientX - last.x) > 42) chop(id, e.clientX);
  };

  const dishUrl = getSoupBaseAssetUrl(recipe.broth) ?? undefined;
  const potSize = 'min(72vw, 40vh)';
  const restart = () => { setIdx(0); setBasket([]); setCuts({}); setInPot([]); setTurns(0); setTasted(false); setTops([]); };

  const tray = (i: { id: SoupIngredientId; name: string; img?: string }, cb: () => void, dim: boolean) => (
    <button key={i.id} type="button" aria-label={i.name} onClick={cb}
      className={`w-[18vw] h-[18vw] max-w-[88px] max-h-[88px] rounded-2xl bg-white shadow flex items-center justify-center transition-all ${dim ? 'opacity-25 scale-75' : wrong === i.id ? 'animate-[wiggle_0.4s] !bg-red-100' : 'active:scale-90'}`}>
      <img src={i.img ?? ing(i.id)} alt="" draggable={false} className="w-[84%] h-[84%] object-contain" />
    </button>
  );

  const goal = step === 'garnish' ? recipe.toppings : recipe.items;

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center gap-2 pt-1 relative overflow-hidden" onPointerDown={() => resetIdle()}>
      <StepBar icons={ICONS} idx={idx} onTap={(i) => say(`sm_${STEPS[i]}`, soundEnabled)} />
      {step !== 'pick' && step !== 'serve' && <GoalCard dish={dishUrl} images={step === 'stir' || step === 'taste' ? [] : goal.map(ing)} />}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3">
        {step === 'pick' && (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 p-2">
            {RECIPES.map((r) => (
              <button key={r.id} type="button" aria-label={`рецепт ${r.id}`} onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
                className="toy-pill rounded-3xl p-3 bg-white/90 active:scale-95 transition-transform flex flex-col items-center gap-1">
                <img src={getSoupBaseAssetUrl(r.broth)!} alt="" draggable={false} className="w-[34vw] max-w-[190px] h-[28vw] max-h-[160px] object-contain" />
                <div className="flex gap-1">{r.items.map((p) => <img key={p} src={ing(p)} alt="" className="w-7 h-7 object-contain" />)}</div>
              </button>
            ))}
          </div>
        )}

        {step === 'pantry' && (
          <div className="flex flex-col items-center gap-3 px-2">
            <div className="text-5xl">🗄️ ➜ 🧺</div>
            <div className="grid grid-cols-3 gap-2 bg-white/80 rounded-3xl p-3">
              {MAIN.map((i) => tray(i, () => { resetIdle(); if (recipe.items.includes(i.id)) { soundEngine.playGameOk(soundEnabled); setBasket((b) => (b.includes(i.id) ? b : [...b, i.id])); } else oops(i.id); }, basket.includes(i.id)))}
            </div>
            <div className="toy-pill px-3 py-2 flex items-center gap-1 min-h-[56px] min-w-[120px] justify-center"><span className="text-3xl">🧺</span>{basket.map((b) => <img key={b} src={ing(b)} alt="" className="w-9 h-9 object-contain" />)}</div>
          </div>
        )}

        {step === 'chop' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">👆👆👆</div>
            <div className="relative" style={{ width: 'min(92vw, 560px)', touchAction: 'none' }}>
              <img src={S2('board')} alt="" draggable={false} className="w-full pointer-events-none drop-shadow-xl" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 px-[8%]">
                {recipe.items.map((p) => {
                  const c = cuts[p] ?? 0;
                  const done = c >= CHOPS;
                  return (
                    <div key={p} className="flex flex-col items-center gap-1" style={{ width: `${88 / recipe.items.length}%` }}>
                      <div
                        onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); chopAt.current[p] = { t: chopAt.current[p]?.t ?? 0, x: e.clientX }; chop(p, e.clientX); }}
                        onPointerMove={(e) => chopMove(e, p)}
                        className={`relative w-full aspect-square flex items-center justify-center select-none cursor-pointer ${hit === p ? 'chop-hit' : ''}`}>
                        <img src={done ? chopped(p) : raw(p)} alt="" draggable={false} className={`w-[92%] h-[92%] object-contain pointer-events-none drop-shadow-lg ${done ? 'piece-pop' : ''}`}
                          style={{ ['--r' as string]: '0deg', clipPath: undefined } as React.CSSProperties} />
                        {!done && [...Array(c)].map((_, k) => (
                          <span key={k} className="absolute top-[12%] bottom-[12%] w-[4px] rounded bg-[#5B3A1E]/70 pointer-events-none" style={{ left: `${30 + k * 20}%`, transform: 'rotate(10deg)' }} />
                        ))}
                        <img src={S2('knife')} alt="" draggable={false} className="absolute w-[70%] pointer-events-none transition-all duration-150"
                          style={{ right: '-18%', top: hit === p ? '-6%' : '-52%', transform: `rotate(${hit === p ? 50 : 20}deg)`, opacity: done ? 0 : 1 }} />
                        {done && <span className="absolute -top-2 -right-1 text-3xl">✅</span>}
                      </div>
                      <div className="flex gap-1">{[...Array(CHOPS)].map((_, k) => <span key={k} className={`w-3 h-3 rounded-full ${k < c ? 'bg-[#10C97A]' : 'bg-white/80'}`} />)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(step === 'pot' || step === 'stir' || step === 'taste') && (
          <div className="flex flex-col items-center gap-3">
            <div ref={potRef} className="relative" style={{ touchAction: 'none' }} onPointerDown={step === 'stir' ? sDown : undefined} onPointerMove={sMove} onPointerUp={sUp} onPointerCancel={sUp}>
              <Pot broth={recipe.broth} filled={idx >= 3} items={inPot} turn={turns} hot={step !== 'pot' || inPot.length > 0} size={potSize}>
                {step === 'stir' && (
                  <>
                    <img src={S2('ladle')} alt="" draggable={false} className="absolute w-[34%] pointer-events-none drop-shadow-lg" style={{ left: `${30 + 14 * Math.cos(turns * 6.28)}%`, top: `${-4 + 6 * Math.sin(turns * 6.28)}%`, transform: 'rotate(28deg)', transformOrigin: '30% 80%' }} />
                    <span className="absolute inset-x-0 -bottom-8 text-center text-3xl pointer-events-none">🔄 {'●'.repeat(Math.floor(turns))}{'○'.repeat(3 - Math.floor(turns))}</span>
                  </>
                )}
                {step === 'stir' && showHint && <IdleHandPointer className="absolute left-[40%] top-[26%]" />}
              </Pot>
            </div>
            {step === 'pot' && (
              <div className="toy-pill px-2 py-2 flex gap-2">
                {recipe.items.map((p) => tray({ id: p, name: SOUP_INGREDIENTS.find((x) => x.id === p)!.name, img: chopped(p) }, () => { resetIdle(); if (!inPot.includes(p)) { soundEngine.playGamePop(soundEnabled, 4); setInPot((a) => [...a, p]); } }, inPot.includes(p)))}
              </div>
            )}
            {step === 'taste' && (
              <>
                <button type="button" aria-label="Попробовать" onClick={() => { if (tasted) return; setTasted(true); soundEngine.playGameOk(soundEnabled); say('sm_hot', soundEnabled); window.setTimeout(() => next(), 2000); }}
                  className="toy-pill w-24 h-24 text-5xl flex items-center justify-center active:scale-90 transition-transform">{tasted ? '🥵' : '🥄'}</button>
                {tasted && <div className="text-6xl animate-bounce">💨</div>}
              </>
            )}
          </div>
        )}

        {step === 'garnish' && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: 'min(60vw, 34vh)', height: 'min(50vw, 28vh)' }}>
              <img src={dishUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
              {tops.map((p, i) => <img key={p} src={ing(p)} alt="" className="absolute w-[34%] soup-drop pointer-events-none" style={{ left: `${30 + i * 16}%`, top: `${22 + i * 8}%` }} />)}
            </div>
            <div className="toy-pill px-2 py-2 flex gap-2">
              {TOP.map((i) => tray(i, () => { resetIdle(); if (recipe.toppings.includes(i.id)) { if (!tops.includes(i.id)) { soundEngine.playGamePop(soundEnabled, 6); setTops((t) => [...t, i.id]); } } else oops(i.id); }, tops.includes(i.id)))}
            </div>
          </div>
        )}

        {step === 'serve' && (
          <FeedServe character={character} reaction={reaction} runKey={key} soundEnabled={soundEnabled} onRestart={restart}
            dish={
              <div className="relative" style={{ width: 'min(48vw, 26vh)', height: 'min(40vw, 22vh)' }}>
                <img src={dishUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" draggable={false} />
                {tops.map((p, i) => <img key={p} src={ing(p)} alt="" draggable={false} className="absolute w-[34%] pointer-events-none" style={{ left: `${30 + i * 16}%`, top: `${22 + i * 8}%` }} />)}
              </div>
            } />
        )}
      </div>
    </div>
  );
};
