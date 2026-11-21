import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { getDrinkExtraAssetUrl } from '../utils/itemAssets';
import { CookScreen, GestureHint, sparkleBurst } from './CookKit';
import { Celebrate, say } from './PlayKit';

/**
 * Трубочки (аркада): по экрану носятся стаканчики с соком — всё быстрее и быстрее.
 * Нажми на стаканчик — в него встаёт трубочка; держи пальчик на стаканчике (веди за ним!) — сок выпивается.
 * Не успел — стаканчик убегает за край. Выпей GOAL стаканчиков!
 */

const GOAL = 10;
const JUICES = [
  { top: '#FDBA74', bottom: '#F97316' }, // апельсиновый
  { top: '#BEF264', bottom: '#65A30D' }, // яблочный
  { top: '#F9A8D4', bottom: '#DB2777' }, // клубничный
  { top: '#C4B5FD', bottom: '#7C3AED' }, // виноградный
  { top: '#FEF08A', bottom: '#EAB308' }, // лимонад
  { top: '#67E8F9', bottom: '#0284C7' }, // лагуна
];
const FACES = ['😋', '🤪', '😜', '😝', '🥳'];

interface Glass { id: number; x: number; y: number; vx: number; vy: number; level: number; straw: boolean; c: number; born: number; leaving: boolean; wob: number; face: string }

export const StrawGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const glasses = useRef<Glass[]>([]);
  const finger = useRef<{ x: number; y: number } | null>(null);
  const [, setTick] = useState(0);
  const [drunk, setDrunk] = useState(0);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; face: string }[]>([]);
  const idc = useRef(0);
  const t0 = useRef(performance.now());
  const lastSpawn = useRef(0);
  const lastSlurp = useRef(0);
  const drunkRef = useRef(0);
  const fastSaid = useRef(false);

  const portrait = window.innerHeight > window.innerWidth * 1.2;
  const size = () => {
    const r = stageRef.current?.getBoundingClientRect();
    const w = r?.width ?? 400, h = r?.height ?? 600;
    return { w, h, g: Math.min(portrait ? w * 0.26 : h * 0.24, 150) };
  };

  useEffect(() => { say('st_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [runKey]);

  // игровой цикл
  useEffect(() => {
    if (done) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { w, h, g } = size();
      const el = (now - t0.current) / 1000;
      const speed = 1 + el / 35 + drunkRef.current * 0.06; // постепенно ускоряемся
      if (!fastSaid.current && speed > 1.8) { fastSaid.current = true; say('st_fast', soundEnabled); }
      // новые стаканчики
      const live = glasses.current.filter((q) => !q.leaving).length;
      if ((live < 2 || now - lastSpawn.current > Math.max(1400, 3200 - el * 30)) && live < 4) {
        lastSpawn.current = now;
        const fromLeft = Math.random() < 0.5;
        const a = (Math.random() * 0.8 - 0.4);
        const v = (70 + Math.random() * 50);
        glasses.current.push({
          id: idc.current++, x: fromLeft ? -g * 0.5 : w + g * 0.5, y: h * (0.2 + Math.random() * 0.55),
          vx: (fromLeft ? 1 : -1) * v * Math.cos(a), vy: v * Math.sin(a), level: 1, straw: false,
          c: Math.floor(Math.random() * JUICES.length), born: now, leaving: false, wob: Math.random() * 6, face: FACES[Math.floor(Math.random() * FACES.length)],
        });
      }
      // движение: прыгают от краёв, через время убегают
      for (const q of glasses.current) {
        if (!q.leaving && now - q.born > 9000 - Math.min(4000, el * 60)) q.leaving = true;
        q.x += q.vx * dt * speed; q.y += q.vy * dt * speed;
        q.wob += dt * 6;
        if (!q.leaving) {
          const inside = q.x > g * 0.5 && q.x < w - g * 0.5;
          if (inside || now - q.born > 1500) {
            if (q.x < g * 0.5) { q.x = g * 0.5; q.vx = Math.abs(q.vx); }
            if (q.x > w - g * 0.5) { q.x = w - g * 0.5; q.vx = -Math.abs(q.vx); }
          }
          if (q.y < g * 0.7) { q.y = g * 0.7; q.vy = Math.abs(q.vy); }
          if (q.y > h - g * 0.7) { q.y = h - g * 0.7; q.vy = -Math.abs(q.vy); }
          // иногда меняет направление — хаотично
          if (Math.random() < dt * 0.6) { const ang = Math.atan2(q.vy, q.vx) + (Math.random() - 0.5) * 1.6; const sp = Math.hypot(q.vx, q.vy); q.vx = Math.cos(ang) * sp; q.vy = Math.sin(ang) * sp; }
        }
      }
      // пьём: палец на стаканчике с трубочкой
      const f = finger.current;
      if (f) {
        const q = glasses.current.find((z) => z.straw && Math.abs(z.x - f.x) < g * 0.6 && Math.abs(z.y - f.y) < g * 0.75);
        if (q) {
          q.level = Math.max(0, q.level - dt / 1.5);
          if (now - lastSlurp.current > 260) { lastSlurp.current = now; soundEngine.playSlurp(soundEnabled); }
          if (q.level <= 0) {
            const r = stageRef.current!.getBoundingClientRect();
            sparkleBurst(r.left + q.x, r.top + q.y, 18);
            soundEngine.playGameOk(soundEnabled, drunkRef.current);
            setPops((p) => [...p.slice(-4), { id: q.id, x: q.x, y: q.y, face: q.face }]);
            glasses.current = glasses.current.filter((z) => z !== q);
            drunkRef.current += 1;
            setDrunk(drunkRef.current);
            if (drunkRef.current >= GOAL) { setDone(true); say('st_ok', soundEnabled); }
          }
        }
      }
      // убежавшие за край
      glasses.current = glasses.current.filter((q) => q.x > -g * 1.5 && q.x < w + g * 1.5 && q.y > -g * 1.5 && q.y < h + g * 1.5);
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, runKey, soundEnabled]);

  const local = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    if (done) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const p = local(e);
    finger.current = p;
    const { g } = size();
    const q = glasses.current.find((z) => Math.abs(z.x - p.x) < g * 0.6 && Math.abs(z.y - p.y) < g * 0.75);
    if (q && !q.straw) { q.straw = true; soundEngine.playGamePop(soundEnabled, 4); }
  };
  const move = (e: React.PointerEvent) => { if (finger.current) finger.current = local(e); };
  const up = () => { finger.current = null; };

  const restart = () => {
    glasses.current = []; drunkRef.current = 0; fastSaid.current = false; t0.current = performance.now();
    setDrunk(0); setPops([]); setDone(false); setRunKey((k) => k + 1);
  };

  const { g } = size();
  const straw = getDrinkExtraAssetUrl('straw');
  const firstGlass = glasses.current[0];
  const hintRef = useRef<HTMLDivElement>(null);

  return (
    <CookScreen stepKey={`s-${runKey}`} stepIdx={0} total={0} done={false}
      bg="radial-gradient(circle at 50% 30%, #FFF7D6 0%, #FFE3A3 45%, #FFB86B 100%)">
      {!done ? (
        <div ref={stageRef} className="relative w-full h-full overflow-hidden select-none" style={{ touchAction: 'none' }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {/* весёлые полоски-лучи на фоне */}
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: 'repeating-conic-gradient(from 0deg at 50% 45%, #FFFFFF 0deg 10deg, transparent 10deg 20deg)' }} />
          {glasses.current.map((q) => {
            const j = JUICES[q.c];
            const drinking = finger.current && q.straw && Math.abs(q.x - finger.current.x) < g * 0.6 && Math.abs(q.y - finger.current.y) < g * 0.75;
            return (
              <div key={q.id} className="absolute pointer-events-none" style={{ left: q.x, top: q.y, width: g, height: g * 1.3, transform: `translate(-50%,-50%) rotate(${Math.sin(q.wob) * 8}deg) scale(${drinking ? 0.94 + Math.sin(q.wob * 4) * 0.04 : 1})` }}>
                {q.straw && <img src={straw} alt="" className="absolute w-[46%] animate-pop-in" style={{ left: '40%', top: '-34%', transform: 'rotate(12deg)', zIndex: 1 }} />}
                {/* сок внутри стакана */}
                <div className="absolute overflow-hidden" style={{ left: '17%', right: '17%', top: '14%', bottom: '8%', borderRadius: '0 0 22% 22%', zIndex: 2 }}>
                  <div className="absolute inset-x-0 bottom-0 transition-[height] duration-100" style={{ height: `${q.level * 92}%`, background: `linear-gradient(${j.top}, ${j.bottom})` }}>
                    {drinking && [0, 1, 2, 3].map((k) => <span key={k} className="absolute rounded-full border-2 border-white/80" style={{ left: `${20 + k * 18}%`, bottom: `${10 + (k * 23) % 60}%`, width: '14%', aspectRatio: '1', animation: `bubble-pop .5s ease-out ${k * 0.12}s infinite` }} />)}
                  </div>
                </div>
                <img src="/assets/pour/glass.webp" alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain" style={{ zIndex: 3, opacity: 0.85 }} />
                {/* глазки на стаканчике — смешные */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[44%] flex gap-[10%] w-[60%] justify-center" style={{ zIndex: 4 }}>
                  {[0, 1].map((k) => <span key={k} className="rounded-full bg-white border-2 border-black/70 flex items-center justify-center" style={{ width: '30%', aspectRatio: '1' }}><span className="rounded-full bg-black" style={{ width: '45%', aspectRatio: '1', transform: `translate(${Math.sign(q.vx) * 25}%, ${drinking ? -25 : 0}%)` }} /></span>)}
                </div>
                {q.leaving && <span className="absolute -top-[18%] left-1/2 -translate-x-1/2 text-[min(7vmin,40px)]" style={{ zIndex: 5 }}>💨</span>}
              </div>
            );
          })}
          {pops.map((p) => (
            <span key={p.id} className="absolute pointer-events-none" style={{ left: p.x, top: p.y, fontSize: g * 0.55, animation: 'r-float 1.2s ease-out both' }}>{p.face}</span>
          ))}
          {/* счёт */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[max(5vh,40px)] flex gap-1 pointer-events-none">
            {Array.from({ length: GOAL }).map((_, k) => (
              <span key={k} className={`rounded-full border-[3px] border-white shadow transition-all ${k < drunk ? 'bg-[#F97316] scale-110' : 'bg-white/60'}`} style={{ width: 'min(5.5vmin, 30px)', height: 'min(5.5vmin, 30px)' }} />
            ))}
          </div>
          <div ref={hintRef} className="absolute pointer-events-none" style={firstGlass ? { left: firstGlass.x - g / 2, top: firstGlass.y - g / 2, width: g, height: g } : { display: 'none' }} />
          <GestureHint show={drunk === 0 && !!firstGlass && (firstGlass.straw ? !finger.current : true)} kind={firstGlass?.straw ? 'hold' : 'tap'} target={hintRef} />
        </div>
      ) : (
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart} />
      )}
    </CookScreen>
  );
};
