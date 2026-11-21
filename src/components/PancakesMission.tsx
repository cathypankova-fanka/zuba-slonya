import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { P, say, Stove, useHold, useRub, useSteps } from './PlayKit';

/** Блинчики: яйцо+мука+молоко → венчик → 3 блинчика (налить, подождать, перевернуть) → сироп → ягодки → угостить. */

const STEPS = ['mix', 'whisk', 'cook', 'syrup', 'top', 'serve'] as const;
const VOICES = { mix: 'pc_mix', whisk: 'pc_whisk', cook: 'pc_pour', syrup: 'pc_syrup', top: 'pc_top' };
const NEED = 3;
const INGR = [
  { id: 'egg', name: 'Яичко', src: P('egg') },
  { id: 'flour', name: 'Мука', src: P('flour') },
  { id: 'milk', name: 'Молочко', src: P('milk') },
];
const TOPS = [
  { id: 'strawberry', name: 'Клубничка', src: P('strawberry') },
  { id: 'blueberry', name: 'Черничка', src: P('blueberry') },
  { id: 'banana', name: 'Бананчик', src: P('banana_slice') },
  { id: 'kiwi', name: 'Киви', src: P('kiwi_slice') },
  { id: 'cream', name: 'Сливки', src: P('whipped_cream') },
];

interface Placed { id: string; x: number; y: number }

const Stack: React.FC<{ n: number; syrup: number; tops: Placed[]; w: string }> = ({ n, syrup, tops, w }) => (
  <div className="relative" style={{ width: w, height: `calc(${w} * ${0.62 + n * 0.12})` }}>
    {Array.from({ length: n }).map((_, i) => (
      <img key={i} src={P('pancake')} alt="" draggable={false} className="absolute left-0 w-full pointer-events-none"
        style={{ bottom: `${(i * 0.12 * 100) / (0.62 + n * 0.12)}%` }} />
    ))}
    {syrup > 0 && (
      <svg viewBox="0 0 100 60" className="absolute left-0 w-full pointer-events-none" style={{ top: 0, opacity: Math.min(1, syrup * 1.4) }}>
        <path d="M14 22 Q50 2 86 22 Q88 30 84 34 L82 46 Q80 50 78 46 L76 34 Q60 40 50 38 L48 52 Q46 56 44 52 L42 37 Q28 36 20 32 L18 42 Q16 46 14 42 Z" fill="#B45309" opacity="0.85" />
        <path d="M24 18 Q50 6 76 18" stroke="#FCD34D" strokeWidth="2.5" fill="none" opacity="0.7" />
      </svg>
    )}
    {tops.map((t, i) => (
      <img key={i} src={TOPS.find((x) => x.id === t.id)!.src} alt="" className="absolute w-[24%] pointer-events-none animate-pop-in"
        style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: 'translate(-50%,-50%)' }} />
    ))}
  </div>
);

export const PancakesMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [bowl, setBowl] = useState<string[]>([]);
  // замешиваем по-настоящему: яйцо разбить (2 тапа), муку насыпать и молоко налить (держать)
  const [eggTaps, setEggTaps] = useState(0);
  const [flourAmt, setFlourAmt] = useState(0);
  const [milkAmt, setMilkAmt] = useState(0);
  const actorRef = useRef<HTMLDivElement>(null);
  const [whisk, setWhisk] = useState(0);
  const [made, setMade] = useState(0);
  const [phase, setPhase] = useState<'pour' | 'wait' | 'flip' | 'fly'>('pour');
  const [size, setSize] = useState(0);
  const [golden, setGolden] = useState(false);
  const [syrup, setSyrup] = useState(0);
  const [tops, setTops] = useState<Placed[]>([]);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('cake', character.id), [servedKey, character.id]);
  const centerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const hintFrom = useRef<HTMLButtonElement | null>(null);
  const flipStart = useRef<number | null>(null);

  const restart = () => { setEggTaps(0); setFlourAmt(0); setMilkAmt(0); setBowl([]); setWhisk(0); setMade(0); setPhase('pour'); setSize(0); setGolden(false); setSyrup(0); setTops([]); restartSteps(); };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);

  const addIngr = (id: string) => {
    if (doneFx || bowl.includes(id)) return;
    soundEngine.playGameOk(soundEnabled);
    const n = [...bowl, id]; setBowl(n);
    if (n.length === INGR.length) window.setTimeout(() => next(), 500);
  };
  const cur = step === 'mix' ? INGR.find((i) => !bowl.includes(i.id))?.id : undefined;
  const tapEgg = () => {
    if (cur !== 'egg' || doneFx) return;
    const n = eggTaps + 1; setEggTaps(n);
    soundEngine.playGamePop(soundEnabled, n === 1 ? 2 : 6);
    if (n >= 2) window.setTimeout(() => addIngr('egg'), 450);
  };
  const pourStop = useRef<() => void>(() => {});
  const pourIn = useHold(step === 'mix' && (cur === 'flour' || cur === 'milk') && !doneFx, (dt) => {
    const setter = cur === 'flour' ? setFlourAmt : setMilkAmt;
    const id = cur!;
    setter((a) => {
      const n = Math.min(1, a + dt / 1.6);
      if (Math.floor(n * 5) !== Math.floor(a * 5)) soundEngine.playGamePop(soundEnabled, id === 'flour' ? 2 : 4);
      if (a < 1 && n >= 1) { pourStop.current(); window.setTimeout(() => addIngr(id), 200); }
      return n;
    });
  });
  const whiskRub = useRub(step === 'whisk' && !doneFx, (d) => {
    if (d <= 0) return;
    setWhisk((w) => {
      const n = Math.min(1, w + d * 0.22);
      if (Math.floor(n * 8) !== Math.floor(w * 8)) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(n * 6));
      if (w < 1 && n >= 1) window.setTimeout(() => next(), 300);
      return n;
    });
  });

  pourStop.current = pourIn.stop;

  // ----- жарим: налить (держать) → подождать → перевернуть (смахнуть вверх) -----
  const pourHold = useHold(step === 'cook' && phase === 'pour' && !doneFx, (dt) => {
    setSize((s) => {
      const n = Math.min(1, s + dt / 1.4);
      if (s < 1 && n >= 1) {
        setPhase('wait');
        soundEngine.playGamePop(soundEnabled, 3);
        say('pc_wait', soundEnabled);
        window.setTimeout(() => { setPhase('flip'); say('pc_flip', soundEnabled); }, 3000);
      }
      return n;
    });
  });
  const flipDown = (e: React.PointerEvent) => { if (phase === 'flip') flipStart.current = e.clientY; };
  const flipMove = (e: React.PointerEvent) => {
    if (phase !== 'flip' || flipStart.current == null) return;
    if (flipStart.current - e.clientY > 50) {
      flipStart.current = null;
      setPhase('fly');
      soundEngine.playGamePop(soundEnabled, 7);
      window.setTimeout(() => setGolden(true), 350);
      window.setTimeout(() => {
        const m = made + 1;
        setMade(m);
        if (m >= NEED) { next(); return; }
        setSize(0); setGolden(false); setPhase('pour');
        say('pc_more', soundEnabled);
      }, 1300);
    }
  };

  const syrupRub = useRub(step === 'syrup' && !doneFx, (d) => {
    if (d <= 0) return;
    setSyrup((s) => {
      const n = Math.min(1, s + d * 0.35);
      if (s < 1 && n >= 1) window.setTimeout(() => next(), 300);
      return n;
    });
  });
  const addTop = (id: string, cx?: number, cy?: number) => {
    if (doneFx || tops.length >= 4) return;
    const r = centerRef.current?.getBoundingClientRect();
    let x = 0.3 + Math.random() * 0.4, y = 0.12 + Math.random() * 0.1;
    if (r && cx != null && cy != null) { x = Math.min(0.85, Math.max(0.15, (cx - r.left) / r.width)); y = Math.min(0.3, Math.max(0.08, (cy - r.top) / r.height)); }
    soundEngine.playGamePop(soundEnabled, 5 + tops.length);
    const n = [...tops, { id, x, y }]; setTops(n);
    if (n.length >= 3) window.setTimeout(() => next(), 700);
  };

  // ---------- подсказки ----------
  const showGesture = useStepHint(`${step}-${phase}-${made}`, 2400, 7000, step !== 'serve' && !doneFx && !pourHold.holding && phase !== 'wait' && phase !== 'fly');
  const nextIngr = INGR.find((i) => !bowl.includes(i.id));
  let hintKind: HintKind = 'drag';
  let hintTarget: React.RefObject<Element | null> = centerRef;
  let hintItem: string | undefined;
  hintFrom.current = null;
  if (step === 'mix' && nextIngr) { hintKind = nextIngr.id === 'egg' ? 'tap' : 'hold'; hintTarget = actorRef; }
  else if (step === 'whisk') hintKind = 'circle';
  else if (step === 'cook') { hintTarget = panRef; hintKind = phase === 'flip' ? 'swipe' : 'hold'; }
  else if (step === 'syrup') hintKind = 'rub';
  else if (step === 'top') { hintItem = TOPS[0].src; hintFrom.current = plateEls.current.strawberry ?? null; }

  const pRef = (k: string) => (el: HTMLButtonElement | null) => { plateEls.current[k] = el; };
  const tray =
    step === 'top' ? TOPS.map((t) => <Plate key={t.id} src={t.src} label={t.name} plateRef={pRef(t.id)} onPick={() => addTop(t.id)} target={centerRef} onDrop={(x, y) => addTop(t.id, x, y)} />)
    : undefined;

  const BOWL = 'min(56vmin, 480px)';
  const PAN = 'min(64vmin, 560px)';
  const pancake = (
    <div className="absolute pointer-events-none" style={{ left: '15%', top: '23%', width: '45%', aspectRatio: '1' }}>
      <img src={golden ? P('pancake') : P('pancake_raw')} alt="" draggable={false}
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          transform: phase === 'fly' ? 'translateY(-90%) rotateX(180deg) scale(1.05)' : `scale(${size})`,
          transition: phase === 'fly' ? 'transform 0.6s cubic-bezier(.3,1.4,.6,1)' : 'transform 0.1s',
          filter: phase === 'flip' && !golden ? 'sepia(0.35) saturate(1.3)' : undefined,
        }} />
      {(phase === 'wait' || phase === 'flip') && !golden && [0, 1, 2, 3, 4].map((k) => (
        <span key={k} className="absolute w-[6%] h-[6%] rounded-full bg-white/70 animate-ping" style={{ left: `${25 + (k * 37) % 50}%`, top: `${25 + (k * 23) % 50}%`, animationDelay: `${k * 0.3}s` }} />
      ))}
    </div>
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx}
      recipe={step !== 'serve' ? <div className="w-[78%]"><Stack n={3} syrup={1} tops={[{ id: 'strawberry', x: 0.4, y: 0.15 }, { id: 'blueberry', x: 0.62, y: 0.2 }]} w="100%" /></div> : undefined}
      tray={tray}>
      {(step === 'mix' || step === 'whisk') && (
        <div ref={centerRef} {...(step === 'whisk' ? whiskRub : {})} className="relative cursor-pointer" style={{ width: BOWL, height: `calc(${BOWL} * 0.82)`, ...(step === 'whisk' ? whiskRub.style : {}) }}>
          <img src={P('batter')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          {/* до замеса в миске видно продукты, тесто проявляется венчиком */}
          <div className="absolute rounded-[50%] pointer-events-none" style={{ left: '9%', right: '9%', top: '4%', height: '34%', background: 'radial-gradient(ellipse at 50% 40%, #E6EEF5, #CBD8E3)', opacity: 1 - whisk }} />
          {/* что уже в миске: молоко, мука горкой, желток */}
          <div className="absolute rounded-[50%] pointer-events-none" style={{ left: '12%', right: '12%', top: '7%', height: '28%', background: '#FFFFFF', opacity: milkAmt * (1 - whisk) * 0.9 }} />
          {flourAmt > 0 && <div className="absolute rounded-[50%] pointer-events-none" style={{ left: `${44 - flourAmt * 18}%`, width: `${flourAmt * 36}%`, top: `${16 - flourAmt * 10}%`, height: `${flourAmt * 22}%`, background: 'radial-gradient(circle at 45% 35%, #FFFDF8, #E8DCC6)', opacity: 1 - whisk, boxShadow: '0 2px 4px rgba(0,0,0,.08)' }} />}
          {bowl.includes('egg') && (
            <div className="absolute pointer-events-none animate-pop-in" style={{ left: '26%', top: '10%', width: '20%', aspectRatio: '1.2', opacity: 1 - whisk }}>
              <div className="absolute inset-0 rounded-[50%] bg-white/90" /><div className="absolute left-[28%] top-[22%] w-[44%] h-[52%] rounded-full" style={{ background: 'radial-gradient(circle at 40% 35%, #FDE047, #F59E0B)' }} />
            </div>
          )}
          {step === 'mix' && cur && (
            <div ref={actorRef} {...(cur !== 'egg' ? pourIn.bind : {})} onClick={cur === 'egg' ? tapEgg : undefined}
              className="absolute cursor-pointer select-none" style={{ right: '-14%', top: '-58%', width: '42%', aspectRatio: '1', ...(cur !== 'egg' ? pourIn.bind.style : {}) }}>
              {cur === 'egg' && (
                <div className={`relative w-full h-full ${eggTaps === 0 ? 'animate-bounce' : ''}`}>
                  <img src={P('egg')} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" style={{ transform: eggTaps ? 'rotate(-35deg) translate(-10%, 10%)' : undefined, transition: 'transform .3s' }} />
                  {eggTaps >= 1 && <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none"><polyline points="28,52 38,44 46,54 55,43 63,53 72,46" fill="none" stroke="#7C5A3A" strokeWidth="4" strokeLinejoin="round" /></svg>}
                  {eggTaps >= 2 && <div className="absolute left-[20%] top-[60%] w-[30%] h-[30%] rounded-full animate-[eggdrop_.45s_ease-in_forwards]" style={{ background: 'radial-gradient(circle at 40% 35%, #FDE047, #F59E0B)' }} />}
                </div>
              )}
              {cur !== 'egg' && (
                <>
                  <img src={cur === 'flour' ? P('flour') : P('milk')} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none transition-transform duration-300"
                    style={{ transform: pourIn.holding ? 'rotate(-115deg) translate(10%, -10%)' : 'rotate(0deg)', transformOrigin: '50% 60%' }} />
                  {pourIn.holding && (cur === 'milk'
                    ? <div className="absolute left-[2%] top-[62%] w-[9%] rounded-full bg-white pointer-events-none" style={{ height: '120%', boxShadow: '0 0 4px rgba(0,0,0,.15)' }} />
                    : [0, 1, 2, 3, 4, 5].map((k) => <span key={k} className="absolute w-[7%] h-[7%] rounded-full bg-white pointer-events-none animate-bounce" style={{ left: `${-2 + (k % 3) * 6}%`, top: `${70 + k * 12}%`, animationDelay: `${k * 0.07}s`, boxShadow: '0 0 2px #ccc' }} />))}
                </>
              )}
            </div>
          )}
          {step === 'whisk' && <img src={P('whisk')} alt="" className="absolute w-[30%] pointer-events-none" style={{ left: `${38 + Math.cos(whisk * 30) * 14}%`, top: `${-30 + Math.sin(whisk * 30) * 6}%`, transform: 'rotate(-20deg)' }} />}
        </div>
      )}

      {step === 'cook' && (
        <div className="flex items-end gap-[4vmin]">
          <Stove width={`calc(${PAN} * 1.05)`} burnerX={39}>
          <div ref={panRef} {...pourHold.bind} onPointerDownCapture={flipDown} onPointerMove={flipMove}
            className="relative cursor-pointer" style={{ width: PAN, height: `calc(${PAN} * 0.654)`, perspective: '800px', ...pourHold.bind.style }}>
            <img src={P('pan')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            {(size > 0 || phase !== 'pour') && pancake}
            {pourHold.holding && <img src={P('batter')} alt="" className="absolute w-[34%] pointer-events-none" style={{ left: '22%', top: '-40%', transform: 'rotate(-35deg)' }} />}
          </div>
          </Stove>
          <div className="flex flex-col items-center">
            <Stack n={made} syrup={0} tops={[]} w="min(18vmin, 150px)" />
            <div className="flex gap-1.5 mt-2">{Array.from({ length: NEED }).map((_, k) => <span key={k} className={`w-4 h-4 rounded-full border-2 border-white ${k < made ? 'bg-[#10C97A]' : 'bg-white/70'}`} />)}</div>
          </div>
        </div>
      )}

      {(step === 'syrup' || step === 'top') && (
        <div ref={centerRef} {...(step === 'syrup' ? syrupRub : {})} className="relative cursor-pointer" style={step === 'syrup' ? syrupRub.style : undefined}>
          <Stack n={NEED} syrup={syrup} tops={tops} w="min(46vmin, 400px)" />
          {step === 'syrup' && <img src="/assets/items/icecream/syrups/caramel.webp" alt="" className="absolute -right-[16%] -top-[14%] w-[16%] pointer-events-none animate-bounce" />}
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={<Stack n={NEED} syrup={1} tops={tops} w="min(30vmin, 250px)" />} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFrom : undefined} itemSrc={hintItem} />
    </CookScreen>
  );
};
