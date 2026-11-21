import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { DrinkAddonId, DrinkCategoryId, DRINK_ADDONS, DRINK_FLAVORS, DrinkState } from '../data/kitchenData';
import { getDrinkExtraAssetUrl, getDrinkRecipeAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { FeedServe } from './MissionKit';
import { DrinksPourCanvas } from './DrinksPourCanvas';
import { bottleSrc, CookScreen, GestureHint, HintKind, LoopScroller, Plate, useStepHint } from './CookKit';

/**
 * Напитки как «миссия» (картинки, без текста), с тем же чайником:
 * рецепт → стаканчик → бутылочка нужного цвета → держать пальчик, чайник наливает →
 * льдинки (холодное) или помешать ложечкой (горячее) → украсить → угостить.
 */

type Vessel = 'cup' | 'cupmug' | 'glass';
interface Recipe { flavor: string; category: DrinkCategoryId; tops: DrinkAddonId[] }
const RECIPES: Recipe[] = [
  { flavor: 'tea_berry', category: 'tea', tops: ['lemon', 'mint'] },
  { flavor: 'coffee_cocoa', category: 'coffee', tops: ['cream', 'marshmallow'] },
  { flavor: 'juice_orange', category: 'juice', tops: ['straw', 'lemon'] },
  { flavor: 'cocktail_lagoon', category: 'cocktail', tops: ['umbrella', 'straw'] },
  { flavor: 'coffee_latte', category: 'coffee', tops: ['latte_heart'] },
  { flavor: 'tea_chamomile', category: 'tea', tops: ['berries', 'mint'] },
];
const VESSELS: { id: Vessel; name: string; src: string }[] = [
  { id: 'cup', name: 'Чашечка', src: '/assets/pour/cup.webp' },
  { id: 'cupmug', name: 'Кружечка', src: '/assets/pour/cupmug.webp' },
  { id: 'glass', name: 'Стаканчик', src: '/assets/pour/glass.webp' },
];
const vesselOf = (c: DrinkCategoryId): Vessel => (c === 'tea' ? 'cup' : c === 'coffee' ? 'cupmug' : 'glass');
const isHot = (c: DrinkCategoryId) => c === 'tea' || c === 'coffee';
const flavorOf = (id: string) => DRINK_FLAVORS.find((f) => f.id === id)!;
const say = (id: string, on: boolean) => playVoice(id, on);
const ICE_N = 3;
const STIR_TURNS = 3;

type StepId = 'pick' | 'glass' | 'pour' | 'ice' | 'stir' | 'top' | 'serve';

export const DrinksMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const steps = useMemo<StepId[]>(() => ['pick', 'glass', 'pour', isHot(recipe.category) ? 'stir' : 'ice', 'top', 'serve'], [recipe]);
  const [idx, setIdx] = useState(0);
  const step = steps[Math.min(idx, steps.length - 1)];
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [bottle, setBottle] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [ice, setIce] = useState(0);
  const [stirAngle, setStirAngle] = useState(0);
  const [stirTurns, setStirTurns] = useState(0);
  const [tops, setTops] = useState<DrinkAddonId[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [doneFx, setDoneFx] = useState(false);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('drinks', character.id), [servedKey, character.id]);
  const lastAlt = useRef(0);
  const stir = useRef<{ a: number; acc: number } | null>(null);

  const busy = useRef(false);
  const next = useCallback((v?: string) => {
    // повторные нажатия, пока помощник договаривает, не должны перескакивать шаги
    if (busy.current) return;
    busy.current = true;
    soundEngine.playGameOk(soundEnabled);
    setDoneFx(true); // большая звезда: шаг выполнен
    if (v) window.setTimeout(() => say(v, soundEnabled), 150);
    window.setTimeout(() => whenVoiceIdle(() => {
      setDoneFx(false);
      busy.current = false;
      setIdx((i) => Math.min(i + 1, steps.length - 1));
    }), 900);
  }, [soundEnabled, steps.length]);

  useEffect(() => {
    const m: Partial<Record<StepId, string>> = { pick: 'dr_pick', glass: 'dr_glass', pour: 'dr_pour', ice: 'dr_ice', stir: 'dr_stir', top: 'dr_top' };
    const v = m[step];
    if (v) say(v, soundEnabled);
    if (step === 'serve') { setServedKey((k) => k + 1); window.setTimeout(() => say('dr_ok', soundEnabled), 300); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const restart = () => { busy.current = false; setDoneFx(false); setIdx(0); setVessel(null); setBottle(null); setLevel(0); setIce(0); setStirAngle(0); setStirTurns(0); setTops([]); };
  const oops = (id: string) => { soundEngine.playGameFail(soundEnabled); setWrong(id); window.setTimeout(() => setWrong(null), 600); say('dr_wrong', soundEnabled); };

  // ---------- шаги ----------
  const pickVessel = (v: Vessel) => {
    if (doneFx || vessel) return;
    if (v === vesselOf(recipe.category)) { soundEngine.playGamePop(soundEnabled, 4); setVessel(v); window.setTimeout(() => next(), 450); } else oops(`v_${v}`);
  };
  const pickBottle = (id: string) => {
    if (doneFx || bottle) return;
    if (id === recipe.flavor) { soundEngine.playGameOk(soundEnabled); setBottle(id); } else oops(`b_${id}`);
  };
  const addIce = () => {
    if (doneFx || ice >= ICE_N) return;
    soundEngine.playGamePop(soundEnabled, 7 + ice);
    const n = ice + 1; setIce(n);
    if (n === ICE_N) window.setTimeout(() => next(), 500);
  };
  const addTop = (id: DrinkAddonId) => {
    if (doneFx || tops.includes(id)) return;
    soundEngine.playGamePop(soundEnabled, 6);
    if (!recipe.tops.includes(id)) {
      const now = Date.now();
      if (now - lastAlt.current > 6000) { lastAlt.current = now; window.setTimeout(() => say(`ck_alt_${1 + Math.floor(Math.random() * 4)}`, soundEnabled), 300); }
    }
    const nt = [...tops, id];
    setTops(nt);
    if (recipe.tops.every((t) => nt.includes(t))) window.setTimeout(() => next(), 700);
  };

  // помешать ложечкой: круги пальцем по чашке
  const centerRef = useRef<HTMLDivElement>(null);
  const stirDown = (e: React.PointerEvent) => {
    if (step !== 'stir' || doneFx) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const r = centerRef.current!.getBoundingClientRect();
    stir.current = { a: Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)), acc: stirTurns * Math.PI * 2 };
  };
  const stirMove = (e: React.PointerEvent) => {
    if (!stir.current || step !== 'stir') return;
    const r = centerRef.current!.getBoundingClientRect();
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    let d = a - stir.current.a;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    stir.current = { a, acc: stir.current.acc + Math.abs(d) };
    if (Math.abs(d) > 0.02) setStirAngle((x) => x + 1); // ложечка в чашке крутится
    const t = Math.min(STIR_TURNS, Math.floor(stir.current.acc / (2 * Math.PI)));
    if (t !== stirTurns) {
      setStirTurns(t);
      soundEngine.playGamePop(soundEnabled, 3 + t);
      if (t === 1) say('dr_stir_more', soundEnabled);
      if (t >= STIR_TURNS) { stir.current = null; window.setTimeout(() => next(), 400); }
    }
  };
  const stirUp = () => { stir.current = null; };

  // ---------- состояние для чайника ----------
  const drink: DrinkState = {
    category: recipe.category,
    flavorId: recipe.flavor,
    addons: [...(ice > 0 ? (['ice'] as DrinkAddonId[]) : []), ...tops],
    stirAngle,
    pourLevel: level,
  };

  // ---------- подсказки-жесты ----------
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFromRef = useRef<HTMLButtonElement | null>(null);
  const showGesture = useStepHint(`${step}-${bottle ?? ''}`, 2600, 7000, step !== 'serve' && step !== 'pick' && !doneFx && !(step === 'pour' && level > 0.02));
  const topShelf = useMemo(() => DRINK_ADDONS.filter((a) => a.id !== 'ice').sort(() => Math.random() - 0.5), [recipe]);
  // бутылочки на полке: нужная + 3 заметно других цветов (похожие коричневые не различить)
  const catFlavors = useMemo(() => {
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const far = (a: string, b: string) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) > 110; };
    const right = flavorOf(recipe.flavor);
    const picked = [right];
    for (const f of [...DRINK_FLAVORS].sort(() => Math.random() - 0.5)) {
      if (picked.length >= 4) break;
      if (picked.every((p) => far(p.liquidBottom, f.liquidBottom))) picked.push(f);
    }
    return picked.sort(() => Math.random() - 0.5);
  }, [recipe]);
  const nextTop = recipe.tops.find((t) => !tops.includes(t));

  let hintKind: HintKind = 'drag';
  let hintItem: string | undefined;
  hintFromRef.current = null;
  if (step === 'glass') { const v = VESSELS.find((x) => x.id === vesselOf(recipe.category))!; hintItem = v.src; hintFromRef.current = plateEls.current[`v_${v.id}`] ?? null; }
  else if (step === 'pour') {
    if (bottle) hintKind = 'hold';
    else { hintItem = bottleSrc(flavorOf(recipe.flavor).liquidBottom); hintFromRef.current = plateEls.current[`b_${recipe.flavor}`] ?? null; }
  } else if (step === 'ice') { hintItem = getDrinkExtraAssetUrl('ice'); hintFromRef.current = plateEls.current.ice ?? null; }
  else if (step === 'stir') hintKind = 'circle';
  else if (step === 'top' && nextTop) { hintItem = getDrinkExtraAssetUrl(nextTop); hintFromRef.current = plateEls.current[nextTop] ?? null; }

  const pRef = (k: string) => (el: HTMLButtonElement | null) => { plateEls.current[k] = el; };

  const tray =
    step === 'glass' ? VESSELS.map((v) => (
      <Plate key={v.id} src={v.src} label={v.name} plateRef={pRef(`v_${v.id}`)}
        onPick={() => pickVessel(v.id)} target={centerRef} onDrop={() => pickVessel(v.id)} wrong={wrong === `v_${v.id}`} />
    ))
    : step === 'pour' && !bottle ? catFlavors.map((f) => (
      <Plate key={f.id} src={bottleSrc(f.liquidBottom)} label={f.name} plateRef={pRef(`b_${f.id}`)}
        onPick={() => pickBottle(f.id)} target={centerRef} onDrop={() => pickBottle(f.id)} wrong={wrong === `b_${f.id}`} />
    ))
    : step === 'ice' ? <Plate src={getDrinkExtraAssetUrl('ice')} label="Льдинка" plateRef={pRef('ice')} badge={ICE_N - ice}
        onPick={addIce} target={centerRef} onDrop={addIce} />
    : step === 'top' ? <LoopScroller>{topShelf.map((a) => (
      <Plate key={a.id} src={getDrinkExtraAssetUrl(a.id)} label={a.name} plateRef={pRef(a.id)}
        onPick={() => addTop(a.id)} target={centerRef} onDrop={() => addTop(a.id)} dim={tops.includes(a.id)} />
    ))}</LoopScroller>
    : undefined;

  const recipeImg = getDrinkRecipeAssetUrl(recipe.flavor) ?? undefined;

  /** «Что нужно» над сценой: картинка напитка-образца и кружочки нужных вещей (положенное — с галочкой). */
  const circle = (key: string, src: string, done: boolean) => (
    <span key={key} className={`relative rounded-full bg-white/95 shadow-lg border-4 flex items-center justify-center shrink-0 ${done ? 'border-[#10C97A]' : 'border-[#FFB800] animate-pulse'}`}
      style={{ width: 'min(17vmin, 100px)', height: 'min(17vmin, 100px)' }}>
      <img src={src} alt="" className="w-[74%] h-[74%] object-contain" />
      {done && <span className="absolute -right-1 -top-1 w-[40%] h-[40%] rounded-full bg-[#10C97A] text-white font-black flex items-center justify-center text-[min(5vmin,26px)]">✓</span>}
    </span>
  );
  const needItems =
    step === 'glass' ? [circle('v', VESSELS.find((v) => v.id === vesselOf(recipe.category))!.src, !!vessel)]
    : step === 'pour' ? [circle('b', bottleSrc(flavorOf(recipe.flavor).liquidBottom), !!bottle)]
    : step === 'ice' ? [...Array(ICE_N)].map((_, k) => circle(`i${k}`, getDrinkExtraAssetUrl('ice'), k < ice))
    : step === 'top' ? recipe.tops.map((t) => circle(t, getDrinkExtraAssetUrl(t), tops.includes(t)))
    : null;
  const needRow = needItems && (
    <div className="flex items-center justify-center gap-[2.5vmin] shrink-0" aria-hidden>
      <span className="rounded-full bg-white/95 shadow-lg border-4 border-white flex items-center justify-center shrink-0" style={{ width: 'min(20vmin, 120px)', height: 'min(20vmin, 120px)' }}>
        <img src={recipeImg} alt="" className="w-[84%] h-[84%] object-contain" />
      </span>
      <span className="text-[min(8vmin,44px)] font-black text-white drop-shadow">=</span>
      {needItems}
    </div>
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={steps.length} done={doneFx} trayLoop={step === 'top'}
      recipe={step !== 'pick' && step !== 'serve' ? <img src={recipeImg} alt="" className="w-[80%] h-[80%] object-contain" /> : undefined}
      tray={tray}>
      {step === 'pick' && (
        <div className="grid grid-cols-3 gap-[2.5vmin]">
          {RECIPES.map((r) => (
            <button key={r.flavor} type="button" aria-label={flavorOf(r.flavor).name}
              onClick={() => { if (busy.current || doneFx) return; setRecipe(r); next(); }}
              className="rounded-[2.5rem] bg-white/90 shadow-xl p-[1.5vmin] active:scale-95 transition-transform flex items-center justify-center">
              <img src={getDrinkRecipeAssetUrl(r.flavor) ?? ''} alt="" draggable={false} className="object-contain" style={{ width: 'min(22vmin, 190px)', height: 'min(22vmin, 190px)' }} />
            </button>
          ))}
        </div>
      )}

      {(needRow || step === 'stir') ? <div className="flex flex-col items-center gap-[3vmin] min-h-0">
      {needRow}
      {step === 'glass' && (
        <div ref={centerRef} className="rounded-full bg-white/45 border-[6px] border-dashed border-[#FFB800] flex items-center justify-center"
          style={{ width: 'min(52vmin, 460px)', height: 'min(52vmin, 460px)' }}>
          <img src={VESSELS.find((v) => v.id === (vessel ?? vesselOf(recipe.category)))!.src} alt="" draggable={false}
            className={`w-[72%] h-[72%] object-contain ${vessel ? 'animate-pop-in' : 'opacity-35'}`} />
        </div>
      )}

      {(step === 'pour' || step === 'ice' || step === 'stir' || step === 'top') && (
        <div ref={centerRef} className="relative"
          onPointerDown={stirDown} onPointerMove={stirMove} onPointerUp={stirUp} onPointerCancel={stirUp}
          style={{ width: 'min(96vmin, 860px)', height: 'min(72vmin, 640px, calc(100dvh - 340px))', touchAction: 'none' }}>
          <DrinksPourCanvas drink={drink} soundEnabled={soundEnabled} isCarryingDish={false} isCrumbsPhase={false}
            minimal zoom={1.25} canPour={step === 'pour' && !!bottle && !doneFx}
            onSetPourLevel={setLevel} onStirDrink={() => setStirAngle((x) => x + 1)}
            onFull={() => { if (step === 'pour') next(); }} />
          {step === 'stir' && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pointer-events-none">
              {[...Array(STIR_TURNS)].map((_, k) => <span key={k} className={`w-5 h-5 rounded-full border-[3px] border-white ${k < stirTurns ? 'bg-[#10C97A]' : 'bg-white/70'}`} />)}
            </div>
          )}
        </div>
      )}
      </div> : null}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={
            <div style={{ width: 'min(34vmin, 300px)', height: 'min(30vmin, 260px)' }} className="pointer-events-none">
              <DrinksPourCanvas drink={{ ...drink, pourLevel: 1 }} soundEnabled={false} isCarryingDish={false} isCrumbsPhase={false}
                minimal hideTeapot focusVessel zoom={2.1} canPour={false} onSetPourLevel={() => {}} onStirDrink={() => {}} />
            </div>
          } />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={centerRef} from={hintKind === 'drag' ? hintFromRef : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
