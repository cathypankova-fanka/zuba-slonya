import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { pickReaction } from '../data/reactions';
import { soundEngine } from '../utils/soundEngine';
import { FeedServe } from './MissionKit';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { P, say, useRub, useSteps } from './PlayKit';

/** Печенье: раскатать тесто → вырезать формочками → духовка → глазурь → посыпка → угостить. */

const STEPS = ['roll', 'cut', 'bake', 'icing', 'sprinkle', 'serve'] as const;
const VOICES = { roll: 'co_roll', cut: 'co_cut', bake: 'co_bake', icing: 'co_icing', sprinkle: 'co_sprinkle' };
const SHAPES = [
  { id: 'star', name: 'Звёздочка', cutter: P('cutter_star'), cookie: P('cookie_star') },
  { id: 'heart', name: 'Сердечко', cutter: P('cutter_heart'), cookie: P('cookie_heart') },
  { id: 'bear', name: 'Мишка', cutter: P('cutter_bear'), cookie: P('cookie_bear') },
];
const ICINGS = [
  { id: 'pink', hex: '#F9A8D4', name: 'Розовая глазурь' },
  { id: 'white', hex: '#FFFFFF', name: 'Белая глазурь' },
  { id: 'blue', hex: '#93C5FD', name: 'Голубая глазурь' },
  { id: 'yellow', hex: '#FDE68A', name: 'Жёлтая глазурь' },
  { id: 'choco', hex: '#7B3F1D', name: 'Шоколадная глазурь' },
];
const SPR = ['#F43F5E', '#3B82F6', '#22C55E', '#FACC15', '#A855F7', '#FB923C'];
const NEED = 6;
const swatch = (hex: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M14 62c0-18 14-30 36-30s36 12 36 30c0 14-16 22-36 22S14 76 14 62z' fill='${hex}' stroke='rgba(0,0,0,.15)' stroke-width='3'/><path d='M50 10c10 10 22 16 22 30H28c0-14 12-20 22-30z' fill='${hex}' stroke='rgba(0,0,0,.15)' stroke-width='3'/></svg>`);

interface Cookie { shape: string; x: number; y: number; icing?: string; spr: { x: number; y: number; c: string }[] }

const CookieView: React.FC<{ c: Cookie; baked: boolean; size: string }> = ({ c, baked, size }) => {
  const s = SHAPES.find((x) => x.id === c.shape)!;
  const ic = c.icing && ICINGS.find((i) => i.id === c.icing);
  return (
    <div className="absolute" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: size, height: size, transform: 'translate(-50%,-50%)' }}>
      <img src={s.cookie} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none"
        style={{ filter: baked ? 'drop-shadow(0 3px 3px rgba(0,0,0,.25))' : 'brightness(1.28) saturate(0.55)' }} />
      {ic && (
        <div className="absolute inset-[10%] pointer-events-none animate-pop-in" style={{
          background: ic.hex, opacity: 0.85,
          WebkitMaskImage: `url(${s.cookie})`, maskImage: `url(${s.cookie})`, WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center',
        }} />
      )}
      {c.spr.map((p, i) => <span key={i} className="absolute w-[9%] h-[4%] rounded-full pointer-events-none" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, background: p.c, transform: `rotate(${i * 47}deg)` }} />)}
    </div>
  );
};

export const CookiesMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [roll, setRoll] = useState(0);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [shape, setShape] = useState('star');
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [oven, setOven] = useState<'idle' | 'baking' | 'ready'>('idle');
  const [icing, setIcing] = useState('pink');
  const [sprCount, setSprCount] = useState(0);
  const [servedKey, setServedKey] = useState(0);
  const reaction = useMemo(() => pickReaction('cake', character.id), [servedKey, character.id]);
  const centerRef = useRef<HTMLDivElement>(null);
  const ovenRef = useRef<HTMLButtonElement>(null);
  const plateEls = useRef<Record<string, HTMLButtonElement | null>>({});

  const restart = () => { setRoll(0); setCookies([]); setOven('idle'); setSprCount(0); restartSteps(); };
  useEffect(() => { if (step === 'serve') setServedKey((k) => k + 1); }, [step]);

  const rollRub = useRub(step === 'roll' && !doneFx, (d, p) => {
    setPin(p);
    if (d <= 0) return;
    setRoll((r) => {
      const n = Math.min(1, r + d * 0.4);
      if (Math.floor(n * 6) !== Math.floor(r * 6)) soundEngine.playGamePop(soundEnabled, 2 + Math.floor(n * 5));
      if (r < 1 && n >= 1) { setPin(null); window.setTimeout(() => next(), 300); }
      return n;
    });
  });

  const cutAt = (x: number, y: number) => {
    if (step !== 'cut' || doneFx || cookies.length >= NEED) return;
    const dx = (x - 0.5) / 0.44, dy = (y - 0.5) / 0.4;
    if (dx * dx + dy * dy > 1) return;
    if (cookies.some((c) => Math.hypot(c.x - x, c.y - y) < 0.16)) return;
    soundEngine.playGamePop(soundEnabled, 4 + cookies.length);
    const n = [...cookies, { shape, x, y, spr: [] }]; setCookies(n);
    if (n.length >= NEED) window.setTimeout(() => next(), 500);
  };
  const doughClick = (e: React.MouseEvent) => {
    const r = centerRef.current!.getBoundingClientRect();
    cutAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };

  const bake = () => {
    if (oven === 'baking') return;
    if (oven === 'ready') { next(); return; }
    setOven('baking'); soundEngine.playGamePop(soundEnabled, 3);
    window.setTimeout(() => { setOven('ready'); soundEngine.playGameReward(soundEnabled); say('co_ready', soundEnabled); window.setTimeout(() => next(), 1600); }, 2800);
  };

  const icingRub = useRub(step === 'icing' && !doneFx, (_d, p) => {
    setCookies((cs) => {
      let changed = false;
      const n = cs.map((c) => {
        if (c.icing || Math.hypot(c.x - p.x, c.y - p.y) > 0.11) return c;
        changed = true; return { ...c, icing };
      });
      if (!changed) return cs;
      soundEngine.playGamePop(soundEnabled, 5);
      if (n.every((c) => c.icing)) window.setTimeout(() => next(), 500);
      return n;
    });
  });
  const sprinkle = (e: React.MouseEvent) => {
    if (step !== 'sprinkle' || doneFx) return;
    const r = centerRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const c = cookies.findIndex((k) => Math.hypot(k.x - x, k.y - y) < 0.13);
    if (c < 0) return;
    soundEngine.playGamePop(soundEnabled, 6 + (sprCount % 4));
    setCookies((cs) => cs.map((k, i) => i !== c ? k : { ...k, spr: [...k.spr, ...Array.from({ length: 6 }, () => ({ x: 0.2 + Math.random() * 0.55, y: 0.2 + Math.random() * 0.55, c: SPR[Math.floor(Math.random() * SPR.length)] }))] }));
    const n = sprCount + 1; setSprCount(n);
    if (n >= NEED) window.setTimeout(() => next(), 600);
  };

  // ---------- подсказки ----------
  const showGesture = useStepHint(step, 2400, 7000, step !== 'serve' && !doneFx && oven !== 'baking');
  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = centerRef;
  if (step === 'roll') hintKind = 'rub';
  else if (step === 'bake') hintTarget = ovenRef;
  else if (step === 'icing') hintKind = 'rub';

  const tray =
    step === 'cut' ? SHAPES.map((s) => <Plate key={s.id} src={s.cutter} label={s.name} plateRef={(el) => { plateEls.current[s.id] = el; }} selected={shape === s.id} onPick={() => setShape(s.id)} />)
    : step === 'icing' ? ICINGS.map((i) => <Plate key={i.id} src={swatch(i.hex)} label={i.name} selected={icing === i.id} onPick={() => setIcing(i.id)} />)
    : undefined;

  const DOUGH_W = 'min(84vmin, 760px)';
  const baked = idx >= 3;
  const trayView = (w: string, interactive: boolean) => (
    <div ref={interactive ? centerRef : undefined} className="relative" style={{ width: w, height: `calc(${w} * 0.62)` }}>
      <img src={P('tray')} alt="" draggable={false} className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
      {cookies.map((c, i) => <CookieView key={i} c={c} baked={baked} size={`calc(${w} * 0.2)`} />)}
    </div>
  );

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx}
      recipe={step !== 'serve' ? <img src={P('cookie_bear')} alt="" className="w-[70%] h-[70%] object-contain" /> : undefined}
      tray={tray}>
      {(step === 'roll' || step === 'cut') && (
        <div ref={centerRef} {...(step === 'roll' ? rollRub : {})} onClick={step === 'cut' ? doughClick : undefined}
          className="relative cursor-pointer" style={{ width: DOUGH_W, height: `calc(${DOUGH_W} * 0.62)`, touchAction: 'none' }}>
          <div className="absolute rounded-[46%] transition-all duration-200" style={{
            left: `${50 - (14 + roll * 34)}%`, width: `${2 * (14 + roll * 34)}%`, top: `${50 - (16 + roll * 26)}%`, height: `${2 * (16 + roll * 26)}%`,
            background: 'radial-gradient(circle at 40% 35%, #FBE7C6, #EFC98F)', boxShadow: '0 10px 18px rgba(120,70,20,.25), inset 0 -6px 10px rgba(160,100,40,.25)',
          }} />
          {cookies.map((c, i) => (
            <div key={i} className="absolute animate-pop-in" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: '17%', height: '27%', transform: 'translate(-50%,-50%)' }}>
              <img src={SHAPES.find((s) => s.id === c.shape)!.cookie} alt="" className="w-full h-full object-contain" style={{ filter: 'brightness(1.28) saturate(0.55) drop-shadow(0 0 2px #B07A3A)' }} />
            </div>
          ))}
          {step === 'roll' && (
            <img src={P('rolling_pin')} alt="" draggable={false} className="absolute w-[44%] pointer-events-none transition-all duration-75"
              style={{ left: `${(pin?.x ?? 0.5) * 100}%`, top: `${(pin?.y ?? 0.5) * 100}%`, transform: 'translate(-50%,-50%) rotate(-25deg)' }} />
          )}
        </div>
      )}

      {step === 'bake' && (
        <button ref={ovenRef} type="button" aria-label="Духовка" onClick={bake}
          className="relative rounded-[3rem] bg-gradient-to-b from-[#64748B] to-[#334155] shadow-2xl p-[2.5vmin] active:scale-95 transition-transform"
          style={{ width: 'min(86vmin, 720px)', height: 'min(56vmin, 470px)' }}>
          <div className="w-full h-full rounded-[2rem] bg-[#1E293B] overflow-hidden relative flex items-center justify-center"
            style={{ boxShadow: oven === 'baking' ? 'inset 0 0 90px #FB923C' : 'inset 0 0 20px #000' }}>
            <div style={{ opacity: oven === 'idle' ? 0.35 : 1, transition: 'opacity .6s', filter: oven === 'ready' ? 'none' : 'brightness(.85)' }}>{trayView('min(60vmin, 500px)', false)}</div>
          </div>
          <div className="absolute -top-[7vmin] left-1/2 -translate-x-1/2 text-[9vmin]">{oven === 'idle' ? '🔥' : oven === 'baking' ? '⏳' : '🔔'}</div>
        </button>
      )}

      {(step === 'icing' || step === 'sprinkle') && (
        <div {...(step === 'icing' ? icingRub : {})} onClick={step === 'sprinkle' ? sprinkle : undefined} className="cursor-pointer" style={{ touchAction: 'none' }}>
          {trayView('min(80vmin, 700px)', true)}
        </div>
      )}

      {step === 'serve' && (
        <FeedServe character={character} reaction={reaction} runKey={servedKey} soundEnabled={soundEnabled} onRestart={restart}
          dish={trayView('min(40vmin, 340px)', false)} />
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} />
    </CookScreen>
  );
};
