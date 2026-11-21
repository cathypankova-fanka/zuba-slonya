import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import { getActiveHelper } from '../utils/activeHelper';
import { CookScreen, GestureHint, HintKind, Plate, useStepHint } from './CookKit';
import { DoneButton } from './ArtKit';
import { Celebrate, HeroFace, P, useSteps } from './PlayKit';

/**
 * Дождик и лужи: одеться (сапожки, дождевик, зонтик — любые) → прыгать по лужам (большая лужа — большой плюх,
 * в каждой луже сюрприз; помощник прыгает вместе) → ловить капли ведёрком → раскрасить радугу пальчиком → праздник.
 */

const STEPS = ['boots', 'coat', 'umbrella', 'jump', 'catch', 'rainbow', 'end'] as const;
const VOICES = { boots: 'rn_boots', coat: 'rn_coat', umbrella: 'rn_umbrella', jump: 'rn_jump', catch: 'rn_catch', rainbow: 'rn_rainbow', end: 'rn_done' };

interface Opt { id: string; name: string; src: string }
const BOOTS: Opt[] = [
  { id: 'boots_yellow', name: 'Жёлтые сапожки', src: P('boots_yellow') },
  { id: 'boots_red', name: 'Красные сапожки в горошек', src: P('boots_red') },
  { id: 'boots_frog', name: 'Сапожки-лягушки', src: P('boots_frog') },
  { id: 'boots_pink', name: 'Розовые сапожки', src: P('boots_pink') },
];
const COATS: Opt[] = [
  { id: 'coat_yellow', name: 'Жёлтый дождевик', src: P('coat_yellow') },
  { id: 'coat_green', name: 'Зелёный дождевик', src: P('coat_green') },
  { id: 'coat_purple', name: 'Дождевик со звёздочками', src: P('coat_purple') },
];
const UMBS: Opt[] = [
  { id: 'umb_yellow', name: 'Жёлтый зонтик', src: P('umb_yellow') },
  { id: 'umb_red', name: 'Зонтик в горошек', src: P('umb_red') },
  { id: 'umb_rainbow', name: 'Радужный зонтик', src: P('umb_rainbow') },
  { id: 'umb_clear', name: 'Прозрачный зонтик', src: P('umb_clear') },
];
const src = (id?: string) => [...BOOTS, ...COATS, ...UMBS].find((o) => o.id === id)?.src;

interface Outfit { boots?: string; coat?: string; umb?: string }

/** Бумажная куколка: голова героя, дождевик, сапожки, зонтик. Коробка W × 2.8W. */
const Doll: React.FC<{ hero: CharacterItem; outfit: Outfit; w: string; dollRef?: React.Ref<HTMLDivElement> }> = ({ hero, outfit, w, dollRef }) => {
  const u = (k: number) => `calc(${w} * ${k})`;
  return (
    <div ref={dollRef} className="relative shrink-0 pointer-events-none" style={{ width: w, height: u(2.8) }}>
      {outfit.umb && <img src={src(outfit.umb)} alt="" draggable={false} className="absolute animate-pop-in" style={{ left: u(0.12), top: u(-0.1), width: u(1.6), zIndex: 4 }} />}
      {outfit.boots
        ? <img src={src(outfit.boots)} alt="" draggable={false} className="absolute animate-pop-in" style={{ left: u(0.08), top: u(2.0), width: u(0.84), zIndex: 1 }} />
        : <div className="absolute flex gap-[8%] justify-center" style={{ left: u(0.2), top: u(2.25), width: u(0.6), zIndex: 1 }}>
          {[0, 1].map((k) => <span key={k} className="block rounded-full" style={{ width: '42%', height: u(0.45), background: '#F5D0B5', border: '3px solid #fff' }} />)}
        </div>}
      {outfit.coat
        ? <img src={src(outfit.coat)} alt="" draggable={false} className="absolute animate-pop-in" style={{ left: u(-0.08), top: u(1.0), width: u(1.16), zIndex: 2 }} />
        : <div className="absolute rounded-[40%_40%_30%_30%] border-4 border-white" style={{ left: u(0.18), top: u(1.32), width: u(0.64), height: u(0.98), background: hero.accentBg, zIndex: 2 }} />}
      <div className="absolute" style={{ left: u(0.07), top: u(0.55), zIndex: 3 }}>
        <HeroFace hero={hero} emotion="joy" size={u(0.86)} />
      </div>
    </div>
  );
};

/** Падающий дождик поверх сцены. */
const RainLayer: React.FC<{ n?: number }> = ({ n = 36 }) => {
  const drops = useMemo(() => Array.from({ length: n }, (_, i) => ({ x: (i * 37) % 100, d: 0.7 + ((i * 13) % 7) / 10, delay: ((i * 29) % 100) / 60 })), [n]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {drops.map((r, i) => (
        <span key={i} className="absolute top-0 w-[3px] h-[5vh] rounded-full bg-white/70" style={{ left: `${r.x}%`, animation: `rain-drop ${r.d}s linear ${r.delay}s infinite`, transform: 'translateY(-10vh)' }} />
      ))}
    </div>
  );
};

interface Puddle { x: number; y: number; s: number; fx: string }
const PUDDLES_P: Puddle[] = [
  { x: 24, y: 30, s: 0.75, fx: '🐸' }, { x: 74, y: 26, s: 0.95, fx: '🦆' }, { x: 48, y: 52, s: 1.6, fx: '⛵' },
  { x: 22, y: 74, s: 1.05, fx: '🐟' }, { x: 76, y: 72, s: 0.8, fx: '🍂' },
];
const PUDDLES_L: Puddle[] = [
  { x: 14, y: 42, s: 0.8, fx: '🐸' }, { x: 33, y: 76, s: 1.05, fx: '🦆' }, { x: 53, y: 44, s: 1.6, fx: '⛵' },
  { x: 74, y: 78, s: 0.95, fx: '🐟' }, { x: 86, y: 40, s: 0.75, fx: '🍂' },
];

interface Splash { id: number; x: number; y: number; s: number }
interface Drop { id: number; x: number; t0: number; dur: number; caught?: boolean }
const NEED_DROPS = 8;
const RAINBOW = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#38BDF8', '#3B82F6', '#A855F7'];
const SEG = 12;

export const RainMission: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const { idx, step, doneFx, next, restart: restartSteps } = useSteps(STEPS, soundEnabled, VOICES);
  const [outfit, setOutfit] = useState<Outfit>({});
  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const puddles = portrait ? PUDDLES_P : PUDDLES_L;
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 50, y: 99 });
  const [hops, setHops] = useState(0);
  const [visited, setVisited] = useState<number[]>([]);
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const [helperJump, setHelperJump] = useState(false);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [caught, setCaught] = useState(0);
  const [bx, setBx] = useState(50);
  const [, setTick] = useState(0);
  const [bands, setBands] = useState<Set<number>>(new Set());
  const [runKey, setRunKey] = useState(0);
  const busy = useRef(false);
  const idc = useRef(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dollRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const firstPlate = useRef<HTMLButtonElement | null>(null);
  const hintPuddle = useRef<Element | null>(null);
  const helper = getActiveHelper();

  const restart = () => {
    setOutfit({}); setPos({ x: 50, y: 99 }); setHops(0); setVisited([]); setSplashes([]); setDrops([]); setCaught(0); setBands(new Set());
    busy.current = false; restartSteps();
  };
  useEffect(() => { if (step === 'end') setRunKey((k) => k + 1); }, [step]);

  // ---------- одеваемся ----------
  const wear = (k: keyof Outfit, id: string) => { if (doneFx) return; soundEngine.playGamePop(soundEnabled, 4 + Math.floor(Math.random() * 4)); setOutfit((o) => ({ ...o, [k]: id })); };
  const dressKey: keyof Outfit | null = step === 'boots' ? 'boots' : step === 'coat' ? 'coat' : step === 'umbrella' ? 'umb' : null;
  const dressOpts = step === 'boots' ? BOOTS : step === 'coat' ? COATS : UMBS;

  // ---------- лужи ----------
  const jump = (i: number) => {
    if (busy.current || doneFx || step !== 'jump') return;
    busy.current = true;
    const p = puddles[i];
    setPos({ x: p.x, y: p.y + 4 });
    setHops((h) => h + 1);
    soundEngine.playGamePop(soundEnabled, 2);
    window.setTimeout(() => {
      const big = p.s >= 1.4;
      soundEngine.playGamePop(soundEnabled, big ? 0 : 3);
      window.setTimeout(() => soundEngine.playGamePop(soundEnabled, big ? 1 : 5), 90);
      const id = idc.current++;
      setSplashes((s) => [...s.slice(-4), { id, x: p.x, y: p.y, s: p.s }]);
      window.setTimeout(() => setSplashes((s) => s.filter((q) => q.id !== id)), 1400);
      if (big) { setHelperJump(true); window.setTimeout(() => setHelperJump(false), 2200); playVoice('rn_big', soundEnabled, undefined, 'replace'); }
      setVisited((v) => {
        const n = v.includes(i) ? v : [...v, i];
        if (n.length === puddles.length && v.length < puddles.length) window.setTimeout(() => next(), 1800);
        return n;
      });
      busy.current = false;
    }, 650);
  };

  // ---------- капли в ведёрко ----------
  useEffect(() => {
    if (step !== 'catch' || doneFx) return;
    const iv = window.setInterval(() => {
      setDrops((d) => [...d.filter((q) => !q.caught && performance.now() - q.t0 < q.dur * 1000).slice(-10),
        { id: idc.current++, x: 10 + Math.random() * 80, t0: performance.now(), dur: 2.4 + Math.random() * 0.8 }]);
    }, 650);
    const giveUp = window.setTimeout(() => setCaught((c) => { if (c < NEED_DROPS) window.setTimeout(() => next(), 300); return NEED_DROPS; }), 18000);
    let raf = 0;
    const f = () => { setTick((t) => t + 1); raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => { window.clearInterval(iv); window.clearTimeout(giveUp); cancelAnimationFrame(raf); };
  }, [step, doneFx, soundEnabled, next]);
  const dropY = (q: Drop) => (performance.now() - q.t0) / (q.dur * 1000);
  // проверка попадания в ведёрко
  useEffect(() => {
    if (step !== 'catch' || doneFx) return;
    const hitIds = drops.filter((q) => !q.caught && dropY(q) > 0.8 && dropY(q) < 0.95 && Math.abs(q.x - bx) < 11).map((q) => q.id);
    if (!hitIds.length) return;
    setDrops((d) => d.map((q) => (hitIds.includes(q.id) ? { ...q, caught: true } : q)));
    soundEngine.playGameOk(soundEnabled);
    setCaught((c) => {
      if (c >= NEED_DROPS) return c;
      const n = Math.min(NEED_DROPS, c + hitIds.length);
      if (n >= NEED_DROPS) window.setTimeout(() => next(), 400);
      return n;
    });
  });
  const moveBucket = (e: React.PointerEvent) => {
    const r = sceneRef.current?.getBoundingClientRect();
    if (!r) return;
    setBx(Math.min(92, Math.max(8, ((e.clientX - r.left) / r.width) * 100)));
  };

  // ---------- радуга ----------
  const paint = (e: React.PointerEvent) => {
    if (step !== 'rainbow' || doneFx || (e.type === 'pointermove' && e.buttons === 0 && e.pointerType === 'mouse')) return;
    const svg = svgRef.current; if (!svg) return;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 200, y = ((e.clientY - r.top) / r.height) * 110;
    const dist = Math.hypot(x - 100, y - 104), ang = Math.atan2(104 - y, x - 100);
    if (ang < -0.15 || ang > Math.PI + 0.15) return;
    const added: number[] = [];
    RAINBOW.forEach((_, b) => {
      const rad = 92 - b * 9;
      if (Math.abs(dist - rad) < 9) {
        const sIdx = Math.min(SEG - 1, Math.max(0, Math.floor(((Math.PI - ang) / Math.PI) * SEG)));
        [sIdx - 1, sIdx, sIdx + 1].forEach((s) => { if (s >= 0 && s < SEG) added.push(b * SEG + s); });
      }
    });
    if (!added.length) return;
    setBands((old) => {
      const fresh = added.filter((k) => !old.has(k));
      if (!fresh.length) return old;
      const n = new Set(old); fresh.forEach((k) => n.add(k));
      soundEngine.playGamePop(soundEnabled, 1 + (Math.floor(fresh[0] / SEG) % 8));
      const total = RAINBOW.length * SEG;
      if (n.size >= total * 0.8 && old.size < total * 0.8) {
        window.setTimeout(() => { setBands(new Set(Array.from({ length: total }, (_, k) => k))); next(); }, 300);
      }
      return n;
    });
  };
  const arc = (rad: number, s0: number, s1: number) => {
    const a0 = Math.PI - (s0 / SEG) * Math.PI, a1 = Math.PI - (s1 / SEG) * Math.PI;
    const p = (a: number) => `${(100 + rad * Math.cos(a)).toFixed(2)} ${(104 - rad * Math.sin(a)).toFixed(2)}`;
    return `M ${p(a0)} A ${rad} ${rad} 0 0 1 ${p(a1)}`;
  };

  // ---------- подсказки ----------
  const showGesture = useStepHint(step, 2800, 7000, step !== 'end' && step !== 'catch' && !doneFx);
  let hintKind: HintKind = 'tap';
  let hintTarget: React.RefObject<Element | null> = dollRef;
  let hintFrom: React.RefObject<Element | null> | undefined;
  if (dressKey) {
    if (outfit[dressKey]) hintTarget = doneRef;
    else { hintKind = 'drag'; hintFrom = firstPlate; }
  } else if (step === 'jump') {
    const bigIdx = puddles.findIndex((p) => p.s >= 1.4);
    const tgt = !visited.includes(bigIdx) ? bigIdx : puddles.findIndex((_, i) => !visited.includes(i));
    hintPuddle.current = tgt >= 0 ? sceneRef.current?.querySelector(`[data-puddle="${tgt}"]`) ?? null : null;
    hintTarget = hintPuddle;
  } else if (step === 'rainbow') { hintKind = 'swipe'; hintTarget = svgRef as unknown as React.RefObject<Element | null>; }

  const tray = dressKey ? (
    <>{dressOpts.map((o, i) => (
      <Plate key={o.id} src={o.src} label={o.name} plateRef={i === 0 ? (el) => { firstPlate.current = el; } : undefined}
        selected={outfit[dressKey] === o.id} onPick={() => wear(dressKey, o.id)} target={dollRef} onDrop={() => wear(dressKey, o.id)} />
    ))}</>
  ) : undefined;

  const sky = step === 'rainbow' || step === 'end'
    ? 'linear-gradient(#7DD3FC 0%, #BAE6FD 58%, #86C95F 58%, #5E9A3E 100%)'
    : step === 'jump' || step === 'catch'
      ? 'linear-gradient(#7E93AE 0%, #AFC2D6 17%, #8DBB66 17%, #5A8F3B 100%)'
      : 'linear-gradient(#7E93AE 0%, #AFC2D6 56%, #7FAF5A 56%, #5A8F3B 100%)';
  const DRESS_W = portrait ? 'min(36vw, 17vh)' : 'min(17vh, 22vw)';
  const SMALL_W = portrait ? 'min(17vw, 9vh)' : 'min(12vh, 12vw)';
  const PUD = portrait ? 30 : 17; // ширина лужи s=1 в vw

  return (
    <CookScreen stepKey={step} stepIdx={idx} total={STEPS.length} done={doneFx} bg={sky} tray={tray}>
      {step !== 'rainbow' && step !== 'end' && <RainLayer />}

      {dressKey && (
        <div className="relative z-10 flex items-end gap-[5vmin]">
          <div className="animate-gentle-float"><Doll hero={character} outfit={outfit} w={DRESS_W} dollRef={dollRef} /></div>
          <DoneButton ref={doneRef} show={!!outfit[dressKey]} onClick={() => !doneFx && next()} className="mb-[10vmin]" />
        </div>
      )}

      {step === 'jump' && (
        <div ref={sceneRef} className="relative z-10 w-full h-full">
          {puddles.map((p, i) => (
            <button key={i} data-puddle={i} type="button" aria-label={p.s >= 1.4 ? 'Большая лужа' : 'Лужа'} onClick={() => jump(i)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] active:scale-95 transition-transform"
              style={{
                left: `${p.x}%`, top: `${p.y}%`, width: `${PUD * p.s}vw`, height: `${PUD * p.s * 0.42}vw`,
                background: 'radial-gradient(ellipse at 40% 35%, #BFE3FA 0 12%, #69B3E7 30%, #3A86C8 75%, #2F6FA8)',
                boxShadow: 'inset 0 -6px 0 rgba(0,0,0,.12), 0 0 0 6px rgba(80,60,40,.18)',
              }}>
              {visited.includes(i) && <span className="absolute left-1/2 -translate-x-1/2 -top-[60%] pointer-events-none text-[min(9vmin,60px)] animate-gentle-float">{p.fx}</span>}
            </button>
          ))}
          {splashes.map((s) => (
            <React.Fragment key={s.id}>
              <span className="absolute rounded-[50%] border-4 border-white/90 pointer-events-none" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${PUD * s.s}vw`, height: `${PUD * s.s * 0.42}vw`, animation: 'ripple 1s ease-out forwards' }} />
              {Array.from({ length: Math.round(6 + s.s * 8) }).map((_, k) => {
                const a = Math.PI + (k / (5 + s.s * 8)) * Math.PI, d = (8 + s.s * 12) * (0.7 + (k % 3) * 0.2);
                return <span key={k} className="absolute rounded-full bg-[#9AD4F7] border-2 border-white pointer-events-none"
                  style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${2 + s.s * 1.6}vmin`, height: `${2 + s.s * 1.6}vmin`, ['--dx' as string]: `${Math.cos(a) * d}vmin`, ['--dy' as string]: `${Math.sin(a) * d * 1.3}vmin`, animation: `splash-fly ${0.6 + s.s * 0.3}s ease-out forwards` } as React.CSSProperties} />;
              })}
            </React.Fragment>
          ))}
          {/* помощник рядом */}
          <div className="absolute pointer-events-none transition-all duration-700 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white/60"
            style={{ left: `${Math.min(92, pos.x + (pos.x > 70 ? -16 : 16))}%`, top: `${Math.max(12, pos.y - 8)}%`, width: 'min(20vmin, 130px)', height: 'min(20vmin, 130px)', transform: 'translate(-50%,-100%)' }}>
            <img src={`/assets/helper_anim/${helper}/${helperJump ? 'jumpspin' : 'dance'}.webp`} alt="" className="w-full h-full object-cover scale-110" />
          </div>
          {/* герой */}
          <div className="absolute pointer-events-none transition-[left,top] duration-[650ms] ease-out" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-100%)', zIndex: 5 }}>
            <div key={hops} style={{ animation: hops ? 'rain-jump 0.65s ease-in-out' : undefined, transformOrigin: '50% 100%' }}>
              <Doll hero={character} outfit={outfit} w={SMALL_W} dollRef={dollRef} />
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex gap-2">
            {puddles.map((_, i) => <span key={i} className={`w-4 h-4 rounded-full border-2 border-white ${visited.includes(i) ? 'bg-[#38BDF8]' : 'bg-white/50'}`} />)}
          </div>
        </div>
      )}

      {step === 'catch' && (
        <div ref={sceneRef} onPointerDown={moveBucket} onPointerMove={moveBucket} className="relative z-10 w-full h-full" style={{ touchAction: 'none' }}>
          <div className="absolute left-1/2 -translate-x-1/2 top-0 text-[min(26vmin,200px)] leading-none pointer-events-none">☁️</div>
          {drops.filter((q) => !q.caught).map((q) => {
            const y = dropY(q);
            if (y > 1) return null;
            return <span key={q.id} className="absolute pointer-events-none text-[min(8vmin,56px)]" style={{ left: `${q.x}%`, top: `${8 + y * 80}%`, transform: 'translate(-50%,-50%)' }}>💧</span>;
          })}
          <div ref={bucketRef} className="absolute pointer-events-none" style={{ left: `${bx}%`, bottom: '2%', width: 'min(22vmin, 170px)', transform: 'translateX(-50%)' }}>
            <div className="absolute overflow-hidden" style={{ left: '16%', right: '16%', top: '30%', bottom: '10%' }}>
              <div className="absolute inset-x-0 bottom-0 bg-[#38BDF8]/80 transition-all" style={{ height: `${(caught / NEED_DROPS) * 100}%` }} />
            </div>
            <img src={P('bucket')} alt="" className="relative w-full" style={{ opacity: 0.92 }} />
          </div>
          <div className="absolute right-3 top-[40%] flex flex-col gap-1">
            {Array.from({ length: NEED_DROPS }).map((_, k) => <span key={k} className={`w-3 h-3 rounded-full border-2 border-white ${k < caught ? 'bg-[#38BDF8]' : 'bg-white/60'}`} />)}
          </div>
          <GestureHint show={caught === 0} kind="swipe" target={bucketRef} />
        </div>
      )}

      {step === 'rainbow' && (
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="absolute right-[6%] -top-[4vmin] text-[min(18vmin,140px)] animate-[spin_12s_linear_infinite] pointer-events-none">☀️</div>
          <svg ref={svgRef} viewBox="0 0 200 110" style={{ touchAction: 'none', width: portrait ? '94vw' : 'min(80vw, 85vh)' }}
            onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); paint(e); }} onPointerMove={paint}>
            {RAINBOW.map((c, b) => (
              <g key={`o${b}`}>
                <path d={arc(92 - b * 9, 0, SEG)} fill="none" stroke={c} strokeOpacity={0.16} strokeWidth={8.4} />
                <path d={arc(92 - b * 9, 0, SEG)} fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={0.8} strokeDasharray="3 3" />
              </g>
            ))}
            {Array.from(bands).map((k) => {
              const b = Math.floor(k / SEG), s = k % SEG;
              return <path key={k} d={arc(92 - b * 9, s, s + 1.05)} fill="none" stroke={RAINBOW[b]} strokeWidth={8.6} />;
            })}
          </svg>
          <div className="flex gap-[4vmin] -mt-[3vmin]">
            <div className="animate-gentle-float"><Doll hero={character} outfit={outfit} w={portrait ? SMALL_W : 'min(8vh, 8vw)'} /></div>
          </div>
        </div>
      )}

      {step === 'end' && (
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <svg viewBox="0 0 200 110" className="w-[min(50vw,40vh)]" aria-hidden>
            {RAINBOW.map((c, b) => <path key={c} d={arc(92 - b * 9, 0, SEG)} fill="none" stroke={c} strokeWidth={8.6} />)}
          </svg>
        </Celebrate>
      )}

      <GestureHint show={showGesture} kind={hintKind} target={hintTarget} from={hintKind === 'drag' ? hintFrom : undefined} itemSrc={hintKind === 'drag' ? dressOpts[0].src : undefined} />
    </CookScreen>
  );
};
