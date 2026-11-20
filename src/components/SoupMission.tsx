import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { SOUP_INGREDIENTS, SoupIngredientId } from '../data/kitchenData';
import { getSoupBaseAssetUrl, getSoupIngredientAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, sayRandom, whenVoiceIdle } from '../utils/voice';
import { useIdleHint } from './MiniGameShell';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';

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
      <img src={S2(`broth_${broth}`)} alt="" draggable={false} className="absolute inset-0 w-full h-full object-fill" />
      {items.map((p, i) => {
        // кусочки плавают по кругу, когда помешиваем
        const ang = (i / Math.max(1, items.length)) * Math.PI * 2 + turn * Math.PI * 2;
        return (
          <img key={p} src={chopped(p)} alt="" draggable={false} className="absolute w-[30%] soup-drop"
            style={{ left: `${35 + Math.cos(ang) * 24}%`, top: `${12 + Math.sin(ang) * 22}%`, transition: 'left .25s, top .25s', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.25))' }} />
        );
      })}
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
  const { resetIdle } = useIdleHint(7000, step !== 'serve');
  const potRef = useRef<HTMLDivElement | null>(null);
  const spin = useRef<{ down: boolean; a0: number }>({ down: false, a0: 0 });
  const chopAt = useRef<Record<string, { t: number; x: number }>>({});

  const [doneFx, setDoneFx] = useState(false);
  const next = useCallback((v?: string) => {
    soundEngine.playGameOk(soundEnabled);
    setDoneFx(true); // большая звезда: шаг выполнен
    if (v) window.setTimeout(() => say(v, soundEnabled), 150);
    // сначала договаривается фраза, потом переход к следующему шагу
    window.setTimeout(() => whenVoiceIdle(() => {
      setDoneFx(false);
      setIdx((i) => Math.min(i + 1, STEPS.length - 1));
      resetIdle();
    }), 900);
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
  const potSize = 'min(64vmin, 560px)';
  const restart = () => { setIdx(0); setBasket([]); setCuts({}); setInPot([]); setTurns(0); setTasted(false); setTops([]); };

  // ---------- действия ----------
  const pantryPick = (id: SoupIngredientId) => {
    resetIdle();
    if (doneFx || basket.includes(id)) return;
    if (recipe.items.includes(id)) { soundEngine.playGameOk(soundEnabled); setBasket((b) => (b.includes(id) ? b : [...b, id])); } else oops(id);
  };
  const toPot = (id: SoupIngredientId) => {
    resetIdle();
    if (doneFx || inPot.includes(id)) return;
    soundEngine.playGamePop(soundEnabled, 4);
    setInPot((a) => (a.includes(id) ? a : [...a, id]));
  };
  const addTop = (id: SoupIngredientId) => {
    resetIdle();
    if (doneFx) return;
    if (!recipe.toppings.includes(id)) return oops(id);
    if (tops.includes(id)) return;
    soundEngine.playGamePop(soundEnabled, 6);
    setTops((t) => [...t, id]);
  };
  const taste = () => {
    if (tasted) return;
    setTasted(true); soundEngine.playGameOk(soundEnabled); say('sm_hot', soundEnabled);
    window.setTimeout(() => next(), 2000);
  };

  // ---------- подсказки-жесты ----------
  const centerRef = useRef<HTMLDivElement>(null);
  const spoonRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const chopEls = useRef<Record<string, HTMLDivElement | null>>({});
  const hintFromRef = useRef<HTMLButtonElement | null>(null);
  const chopTargetRef = useRef<HTMLDivElement | null>(null);
  const showGesture = useStepHint(step, 2600, 7000, step !== 'serve' && step !== 'pick' && !doneFx && !tasted);
  const pantryShelf = useMemo(() => [...MAIN].sort(() => Math.random() - 0.5), [recipe]);

  const nextNeed = step === 'pantry' ? recipe.items.find((x) => !basket.includes(x))
    : step === 'pot' ? recipe.items.find((x) => !inPot.includes(x))
    : step === 'garnish' ? recipe.toppings.find((x) => !tops.includes(x)) : undefined;
  const nextChop = recipe.items.find((x) => (cuts[x] ?? 0) < CHOPS);
  hintFromRef.current = nextNeed ? plateEls.current[nextNeed] ?? null : null;
  chopTargetRef.current = nextChop ? chopEls.current[nextChop] ?? null : null;

  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = centerRef;
  let hintItem: string | undefined = nextNeed ? (step === 'pot' ? chopped(nextNeed) : ing(nextNeed)) : undefined;
  if (step === 'chop') { hintKind = 'tap'; hintTarget = chopTargetRef; hintItem = undefined; }
  else if (step === 'stir') { hintKind = 'circle'; hintItem = undefined; }
  else if (step === 'taste') { hintKind = 'tap'; hintTarget = spoonRef; hintItem = undefined; }

  const nameOf = (id: SoupIngredientId) => SOUP_INGREDIENTS.find((x) => x.id === id)?.name ?? '';
  const pRef = (id: string) => (el: HTMLButtonElement | null) => { plateEls.current[id] = el; };

  const trayNode =
    step === 'pantry' ? <LoopScroller>{pantryShelf.map((i) => (
      <Plate key={i.id} src={ing(i.id)} label={i.name} plateRef={pRef(i.id)}
        onPick={() => pantryPick(i.id)} target={centerRef} onDrop={() => pantryPick(i.id)}
        dim={basket.includes(i.id)} wrong={wrong === i.id} />
    ))}</LoopScroller>
    : step === 'pot' ? recipe.items.map((p) => (
      <Plate key={p} src={chopped(p)} label={nameOf(p)} plateRef={pRef(p)}
        onPick={() => toPot(p)} target={centerRef} onDrop={() => toPot(p)} dim={inPot.includes(p)} />
    ))
    : step === 'garnish' ? TOP.map((i) => (
      <Plate key={i.id} src={ing(i.id)} label={i.name} plateRef={pRef(i.id)}
        onPick={() => addTop(i.id)} target={centerRef} onDrop={() => addTop(i.id)}
        dim={tops.includes(i.id)} wrong={wrong === i.id} />
    ))
    : undefined;

  const bowl = (size: string, ref?: React.Ref<HTMLDivElement>) => (
    <div ref={ref} className="relative" style={{ width: size, height: `calc(${size} * 0.83)` }}>
      <img src={dishUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      {tops.map((p, i) => <img key={p} src={ing(p)} alt="" draggable={false} className="absolute w-[30%] soup-drop pointer-events-none" style={{ left: `${30 + i * 16}%`, top: `${20 + i * 8}%` }} />)}
    </div>
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} trayLoop={step === 'pantry'}
      recipe={step !== 'pick' && step !== 'serve' ? <img src={dishUrl} alt="" className="w-[88%] h-[88%] object-contain" /> : undefined}
      tray={trayNode}>
      {step === 'pick' && (
        <div className="grid grid-cols-2 gap-[3vmin]">
          {RECIPES.map((r) => (
            <button key={r.id} type="button" aria-label={`рецепт ${r.id}`} onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => next(), 250); }}
              className="rounded-[2.5rem] bg-white/90 shadow-xl p-[1.5vmin] active:scale-95 transition-transform flex flex-col items-center gap-1">
              <img src={getSoupBaseAssetUrl(r.broth)!} alt="" draggable={false} className="object-contain" style={{ width: 'min(30vmin, 250px)', height: 'min(24vmin, 200px)' }} />
              <div className="flex gap-1">{r.items.map((p) => <img key={p} src={ing(p)} alt="" className="w-[6vmin] h-[6vmin] max-w-12 max-h-12 object-contain" />)}</div>
            </button>
          ))}
        </div>
      )}

      {step === 'pantry' && (
        <div ref={centerRef} className="relative flex flex-col items-center justify-end" style={{ width: 'min(58vmin, 480px)', height: 'min(44vmin, 360px)' }}>
          <div className="absolute inset-x-[8%] bottom-[18%] flex flex-wrap justify-center gap-1 z-10">
            {basket.map((b) => <img key={b} src={ing(b)} alt="" className="w-[24%] object-contain animate-pop-in drop-shadow" />)}
          </div>
          <div className="text-[min(40vmin,330px)] leading-none select-none">🧺</div>
        </div>
      )}

      {step === 'chop' && (
        <div className="relative" style={{ width: 'min(92vmin, 820px)', touchAction: 'none' }}>
          <img src={S2('board')} alt="" draggable={false} className="w-full pointer-events-none drop-shadow-xl" />
          <div className="absolute inset-0 flex items-center justify-center gap-[2vmin] px-[8%]">
            {recipe.items.map((p) => {
              const c = cuts[p] ?? 0;
              const done = c >= CHOPS;
              return (
                <div key={p} className="flex flex-col items-center gap-1" style={{ width: `${88 / recipe.items.length}%` }}>
                  <div ref={(el) => { chopEls.current[p] = el; }}
                    onPointerDown={(e) => { try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ } chopAt.current[p] = { t: chopAt.current[p]?.t ?? 0, x: e.clientX }; chop(p, e.clientX); }}
                    onPointerMove={(e) => chopMove(e, p)}
                    className={`relative w-full aspect-square flex items-center justify-center select-none cursor-pointer ${hit === p ? 'chop-hit' : ''}`}>
                    <img src={done ? chopped(p) : raw(p)} alt="" draggable={false} className={`w-[92%] h-[92%] object-contain pointer-events-none drop-shadow-lg ${done ? 'piece-pop' : ''}`} />
                    {!done && [...Array(c)].map((_, k) => (
                      <span key={k} className="absolute top-[12%] bottom-[12%] w-[5px] rounded bg-[#5B3A1E]/70 pointer-events-none" style={{ left: `${30 + k * 20}%`, transform: 'rotate(10deg)' }} />
                    ))}
                    <img src={S2('knife')} alt="" draggable={false} className="absolute w-[70%] pointer-events-none transition-all duration-150"
                      style={{ right: '-18%', top: hit === p ? '-6%' : '-52%', transform: `rotate(${hit === p ? 50 : 20}deg)`, opacity: done ? 0 : 1 }} />
                    {done && <span className="absolute -top-2 -right-1 text-[5vmin]">✅</span>}
                  </div>
                  <div className="flex gap-1.5">{[...Array(CHOPS)].map((_, k) => <span key={k} className={`w-4 h-4 rounded-full border-2 border-white ${k < c ? 'bg-[#10C97A]' : 'bg-white/70'}`} />)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(step === 'pot' || step === 'stir' || step === 'taste') && (
        <div className="flex items-center gap-[4vmin]">
          <div ref={(el) => { potRef.current = el; centerRef.current = el; }} className="relative" style={{ touchAction: 'none' }}
            onPointerDown={step === 'stir' ? sDown : undefined} onPointerMove={sMove} onPointerUp={sUp} onPointerCancel={sUp}>
            <Pot broth={recipe.broth} filled={idx >= 3} items={inPot} turn={turns} hot={step !== 'pot' || inPot.length > 0} size={potSize}>
              {step === 'stir' && (
                <img src={S2('ladle')} alt="" draggable={false} className="absolute w-[34%] pointer-events-none drop-shadow-lg" style={{ left: `${30 + 14 * Math.cos(turns * 6.28)}%`, top: `${-4 + 6 * Math.sin(turns * 6.28)}%`, transform: 'rotate(28deg)', transformOrigin: '30% 80%' }} />
              )}
            </Pot>
            {step === 'stir' && (
              <div className="absolute inset-x-0 -bottom-[5vmin] flex justify-center gap-2 pointer-events-none">
                {[0, 1, 2].map((k) => <span key={k} className={`w-5 h-5 rounded-full border-[3px] border-white ${k < Math.floor(turns) ? 'bg-[#10C97A]' : 'bg-white/70'}`} />)}
              </div>
            )}
          </div>
          {step === 'taste' && (
            <div className="flex flex-col items-center gap-2">
              <button ref={spoonRef} type="button" aria-label="Попробовать" onClick={taste}
                className="rounded-full bg-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ width: 'min(22vmin, 180px)', height: 'min(22vmin, 180px)', fontSize: 'min(13vmin, 110px)' }}>{tasted ? '🥵' : '🥄'}</button>
              {tasted && <div className="text-[10vmin] animate-bounce">💨</div>}
            </div>
          )}
        </div>
      )}

      {step === 'garnish' && bowl('min(66vmin, 580px)', centerRef)}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={key} soundEnabled={soundEnabled} onRestart={restart}
          dish={bowl('min(36vmin, 300px)')} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFromRef : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
