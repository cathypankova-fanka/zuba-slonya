import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { SandwichBreadId, SandwichFillingId, SANDWICH_FILLINGS } from '../data/kitchenData';
import { getSandwichBreadAssetUrl, getSandwichFillingAssetUrl, getSandwichSpreadAssetUrl } from '../utils/itemAssets';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { IdleHandPointer, useIdleHint } from './MiniGameShell';
import { FeedServe, GoalCard, StepBar } from './MissionKit';

/**
 * Бутерброд как «миссия» (картинки, без текста):
 * рецепт → намазать → выложить слои по порядку → накрыть вторым ломтиком → разрезать → угостить гостя.
 */

interface Recipe {
  id: string;
  title: string;
  bread: SandwichBreadId;
  spread: string;
  layers: SandwichFillingId[];
  decoys: SandwichFillingId[];
}

const RECIPES: Recipe[] = [
  { id: 'cheese', title: 'Сырный', bread: 'toast', spread: 'butter', layers: ['cheese', 'tomato'], decoys: ['banana', 'strawberry'] },
  { id: 'ham', title: 'С ветчиной', bread: 'rye', spread: 'cream_cheese', layers: ['ham', 'lettuce', 'cucumber'], decoys: ['banana', 'egg'] },
  { id: 'sweet', title: 'Сладкий', bread: 'toast', spread: 'jam', layers: ['banana', 'strawberry'], decoys: ['ham', 'lettuce'] },
];

const STEPS = [
  { id: 'pick', icon: '📖' },
  { id: 'spread', icon: '🧈' },
  { id: 'layers', icon: '🧀' },
  { id: 'top', icon: '🍞' },
  { id: 'cut', icon: '🔪' },
  { id: 'serve', icon: '🍽️' },
] as const;
type StepId = (typeof STEPS)[number]['id'];

const BOARD = 'min(58vw, 36vh)';
const say = (id: string, on: boolean) => playVoice(id, on);
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const nameOf = (id: SandwichFillingId) => SANDWICH_FILLINGS.find((f) => f.id === id)?.name ?? '';

interface Blob { x: number; y: number }

/** Готовый бутерброд (вид сверху) */
const SandwichPicture: React.FC<{ r: Recipe; size: string; cut?: boolean; closed?: boolean }> = ({ r, size, cut, closed = true }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <img src={getSandwichBreadAssetUrl(r.bread)} alt="" className="absolute inset-0 w-full h-full object-contain" />
    {!closed && (
      <>
        {getSandwichSpreadAssetUrl(r.spread) && <img src={getSandwichSpreadAssetUrl(r.spread)!} alt="" className="absolute inset-[16%] w-[68%] h-[68%] object-contain" />}
        {r.layers.map((l, i) => (
          <img key={l} src={getSandwichFillingAssetUrl(l)} alt="" className="absolute w-[62%]" style={{ left: '50%', top: '50%', transform: `translate(-50%,-50%) translate(${i * 3}%, ${i * -4}%) rotate(${i * 7 - 6}deg)` }} />
        ))}
      </>
    )}
    {closed && cut && <div className="absolute left-0 top-1/2 w-full h-[3px] bg-white/90 rounded" style={{ transform: 'rotate(40deg)', boxShadow: '0 0 0 1px rgba(0,0,0,.25)' }} />}
  </div>
);

export const SandwichMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const step: StepId = STEPS[stepIdx].id;
  const [recipe, setRecipe] = useState<Recipe>(RECIPES[0]);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [placed, setPlaced] = useState<SandwichFillingId[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [topOn, setTopOn] = useState(false);
  const [cutProgress, setCutProgress] = useState(0);
  const [cutDone, setCutDone] = useState(false);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('sandwich', character.id), [servedKey, character.id]);
  const shelf = useMemo(() => shuffle([...recipe.layers, ...recipe.decoys]), [recipe]);
  const boardRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ sx: number; sy: number } | null>(null);
  const { showHint, resetIdle } = useIdleHint(7000, step !== 'serve');

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
    setStepIdx(0); setBlobs([]); setPlaced([]); setTopOn(false); setCutProgress(0); setCutDone(false); setWrong(null);
  };

  useEffect(() => {
    const m: Record<string, string> = { pick: 'sw_pick', spread: 'sw_spread', layers: 'sw_layers', top: 'sw_top', cut: 'sw_cut' };
    if (m[step]) say(m[step], soundEnabled);
    if (step === 'serve') setServedKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ---------- намазывание ----------
  const spreadDown = (e: React.PointerEvent) => {
    resetIdle();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    swipe.current = { sx: e.clientX, sy: e.clientY };
    if (step === 'spread') addBlob(e);
    if (step === 'cut') swipe.current = { sx: e.clientX, sy: e.clientY };
  };
  const addBlob = (e: React.PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0.1 || x > 0.9 || y < 0.1 || y > 0.9) return;
    setBlobs((b) => {
      if (b.length > 0 && Math.hypot(b[b.length - 1].x - x, b[b.length - 1].y - y) < 0.04) return b;
      const nb = [...b, { x, y }];
      if (nb.length % 4 === 0) soundEngine.playGamePop(soundEnabled, 3 + (nb.length % 5));
      if (nb.length === 26) window.setTimeout(() => goNext('pm_ok_sauce'), 300);
      return nb.slice(-60);
    });
  };
  const spreadMove = (e: React.PointerEvent) => {
    if (!swipe.current) return;
    if (step === 'spread') {
      addBlob(e);
      return;
    }
    if (step === 'cut' && !cutDone) {
      const r = boardRef.current!.getBoundingClientRect();
      const d = Math.hypot(e.clientX - swipe.current.sx, e.clientY - swipe.current.sy) / r.width;
      setCutProgress(Math.min(1, d));
      if (d > 0.7) {
        swipe.current = null;
        setCutDone(true);
        soundEngine.playGameOk(soundEnabled);
        window.setTimeout(() => goNext(), 900);
      }
    }
  };
  const spreadUp = () => {
    swipe.current = null;
    if (step === 'cut' && !cutDone) setCutProgress(0);
  };

  // ---------- слои ----------
  const pickFilling = (id: SandwichFillingId) => {
    resetIdle();
    const nextNeeded = recipe.layers[placed.length];
    if (id === nextNeeded) {
      soundEngine.playGamePop(soundEnabled, 4 + placed.length);
      const np = [...placed, id];
      setPlaced(np);
      if (np.length === recipe.layers.length) window.setTimeout(() => goNext('pm_ok_top'), 350);
    } else {
      setWrong(id);
      soundEngine.playGameFail(soundEnabled);
      say('pm_wrong', soundEnabled);
      window.setTimeout(() => setWrong(null), 500);
    }
  };

  const placeTop = () => {
    if (topOn) return;
    setTopOn(true);
    soundEngine.playGamePop(soundEnabled, 6);
    window.setTimeout(() => goNext(), 500);
  };

  const sandwichBoard = (size: string, closed: boolean, cutLine = false) => (
    <div className="relative" style={{ width: size, height: size }}>
      <img src={getSandwichBreadAssetUrl(recipe.bread)} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain" />
      {(step === 'spread' || (step !== 'pick' && stepIdx > 1)) && (
        <>
          {step === 'spread' ? (
            blobs.map((b, i) => (
              <span key={i} className="absolute rounded-full" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: '13%', height: '13%', transform: 'translate(-50%,-50%)', background: recipe.spread === 'jam' ? '#E11D48' : recipe.spread === 'cream_cheese' ? '#FFFBEB' : '#FEF08A', opacity: 0.9 }} />
            ))
          ) : (
            getSandwichSpreadAssetUrl(recipe.spread) && <img src={getSandwichSpreadAssetUrl(recipe.spread)!} alt="" className="absolute inset-[16%] w-[68%] h-[68%] object-contain" />
          )}
        </>
      )}
      {(step === 'layers' ? placed : stepIdx > 2 ? recipe.layers : []).map((l, i) => (
        <img key={l} src={getSandwichFillingAssetUrl(l)} alt="" draggable={false} className="absolute w-[62%] animate-pop-in" style={{ left: '50%', top: '50%', transform: `translate(-50%,-50%) translate(${i * 3}%, ${i * -4}%) rotate(${i * 7 - 6}deg)` }} />
      ))}
      {closed && (topOn || stepIdx > 3) && (
        <img src={getSandwichBreadAssetUrl(recipe.bread)} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain animate-pop-in" style={{ filter: 'drop-shadow(0 6px 4px rgba(0,0,0,.25))' }} />
      )}
      {cutLine && (cutProgress > 0 || cutDone) && (
        <div className="absolute left-[-5%] top-1/2 h-[4px] bg-white rounded pointer-events-none" style={{ width: `${(cutDone ? 1 : cutProgress) * 110}%`, transform: 'rotate(40deg)', transformOrigin: 'left center', boxShadow: '0 0 0 2px rgba(0,0,0,.3)' }} />
      )}
    </div>
  );

  const goalImages =
    step === 'spread' ? (getSandwichSpreadAssetUrl(recipe.spread) ? [getSandwichSpreadAssetUrl(recipe.spread)!] : [])
    : step === 'layers' ? recipe.layers.map((l) => getSandwichFillingAssetUrl(l))
    : step === 'top' ? [getSandwichBreadAssetUrl(recipe.bread)]
    : [];

  return (
    <div className="relative w-full h-full flex flex-col items-center gap-2 p-2 sm:p-3 select-none overflow-hidden">
      <StepBar icons={STEPS.map((s) => s.icon)} idx={stepIdx} />

      {step !== 'pick' && step !== 'serve' && (
        <GoalCard dishNode={<SandwichPicture r={recipe} size="112px" closed={false} />} images={goalImages} numbered={step === 'layers'} />
      )}

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-3 relative">
        {step === 'pick' && (
          <div className="grid grid-cols-3 gap-3 sm:gap-5 p-2">
            {RECIPES.map((r) => (
              <button key={r.id} type="button" aria-label={r.title}
                onClick={() => { setRecipe(r); soundEngine.playGameOk(soundEnabled); window.setTimeout(() => goNext(), 250); }}
                className="toy-pill rounded-3xl p-3 flex items-center justify-center active:scale-95 transition-transform bg-white/90">
                <SandwichPicture r={r} size="min(26vw, 160px)" closed={false} />
              </button>
            ))}
          </div>
        )}

        {(step === 'spread' || step === 'layers' || step === 'top' || step === 'cut') && (
          <div className="relative flex flex-col items-center gap-3">
            <div className="rounded-[2rem] bg-[#C7A27C] shadow-[0_10px_0_#A07C58] p-[4%] relative" style={{ width: `calc(${BOARD} * 1.12)`, height: `calc(${BOARD} * 1.12)` }}>
              <div
                ref={boardRef}
                onPointerDown={step === 'spread' || step === 'cut' ? spreadDown : undefined}
                onPointerMove={step === 'spread' || step === 'cut' ? spreadMove : undefined}
                onPointerUp={spreadUp}
                onPointerCancel={spreadUp}
                onClick={step === 'top' ? placeTop : undefined}
                style={{ touchAction: 'none', width: '100%', height: '100%', cursor: 'pointer' }}
              >
                {sandwichBoard('100%', step === 'top' || step === 'cut', step === 'cut')}
              </div>
              {step === 'spread' && showHint && <IdleHandPointer className="absolute left-[44%] top-[44%]" />}
              {step === 'cut' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-5xl opacity-60">🔪</div>}
            </div>

            {step === 'top' && !topOn && (
              <button type="button" aria-label="Накрыть" onClick={placeTop} className="toy-pill px-3 py-2 active:scale-90 transition-transform animate-bounce">
                <img src={getSandwichBreadAssetUrl(recipe.bread)} alt="" className="w-16 h-16 object-contain" />
              </button>
            )}

            {step === 'layers' && (
              <div className="toy-pill px-2 py-2 flex gap-2 flex-wrap justify-center">
                {shelf.map((f) => {
                  const used = placed.includes(f);
                  return (
                    <button key={f} type="button" aria-label={nameOf(f)} onClick={() => !used && pickFilling(f)}
                      className={`w-[18vw] h-[18vw] max-w-[80px] max-h-[80px] rounded-2xl bg-white shadow flex items-center justify-center transition-all ${used ? 'opacity-25 scale-75' : wrong === f ? 'animate-[wiggle_0.4s] bg-[#FEE2E2]' : 'active:scale-90'}`}>
                      <img src={getSandwichFillingAssetUrl(f)} alt="" draggable={false} className="w-[82%] h-[82%] object-contain" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 'serve' && (
          <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
            dish={<SandwichPicture r={recipe} size="min(40vw, 24vh)" cut />} />
        )}
      </div>
    </div>
  );
};
