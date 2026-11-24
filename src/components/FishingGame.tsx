import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import { CookScreen, GestureHint, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, say } from './PlayKit';

/**
 * Рыбалка с цифрами: в пруду плавают рыбки с цифрами. Ведёшь пальчиком крючок (леска от удочки сверху),
 * рыбка клюёт, отпускаешь — рыбка летит в ведёрко.
 * Задания по очереди: «поймай рыбку с цифрой N» и «поймай столько рыбок, сколько точек на ведёрке» (каждую считаем вслух).
 */

type Task = { kind: 'find'; n: number } | { kind: 'count'; n: number };
const COLORS = ['#F97316', '#3B82F6', '#EC4899', '#22C55E', '#A855F7', '#EAB308', '#06B6D4', '#EF4444'];
const fishSvg = (c: string, n: number, right = false) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 90'>
    <g transform='${right ? 'translate(140 0) scale(-1 1)' : ''}'>
    <path d='M104 45 L136 18 L130 45 L136 72 Z' fill='${c}' stroke='rgba(0,0,0,.2)' stroke-width='3' stroke-linejoin='round'/>
    <ellipse cx='62' cy='45' rx='54' ry='36' fill='${c}' stroke='rgba(0,0,0,.2)' stroke-width='3'/>
    <path d='M58 12 Q72 0 86 14' fill='${c}' stroke='rgba(0,0,0,.2)' stroke-width='3'/>
    <ellipse cx='50' cy='30' rx='26' ry='10' fill='#fff' opacity='.25'/>
    <circle cx='26' cy='38' r='8' fill='#fff'/><circle cx='24' cy='38' r='4.5' fill='#1E293B'/>
    <path d='M12 54 Q18 60 24 55' stroke='#1E293B' stroke-width='3' fill='none' stroke-linecap='round'/>
    </g>
    <circle cx='70' cy='47' r='22' fill='#fff' stroke='rgba(0,0,0,.15)' stroke-width='2'/>
    <text x='70' y='59' text-anchor='middle' font-family='Arial Rounded MT Bold, Arial, sans-serif' font-weight='900' font-size='34' fill='#1E293B'>${n}</text>
  </svg>`);

interface Fish { id: number; n: number; c: string; x: number; y: number; vx: number; ph: number; hooked: boolean; gone: boolean; flee: number }

const TASKS = (): Task[] => {
  const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  return [{ kind: 'find', n: r(1, 5) }, { kind: 'count', n: r(2, 3) }, { kind: 'find', n: r(3, 9) }, { kind: 'count', n: r(3, 5) }, { kind: 'find', n: r(1, 9) }];
};

export const FishingGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [ti, setTi] = useState(0);
  const [caught, setCaught] = useState(0);
  const [bucket, setBucket] = useState<{ n: number; c: string }[]>([]);
  const [, setTick] = useState(0);
  const pondRef = useRef<HTMLDivElement>(null);
  const bucketRef = useRef<HTMLDivElement>(null);
  const fish = useRef<Fish[]>([]);
  const hook = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.25 });
  const holding = useRef(false);
  const hooked = useRef<Fish | null>(null);
  const idc = useRef(0);
  const busy = useRef(false);
  const caughtRef = useRef(0);
  // сколько рыбок с нужной цифрой плавает — ловить можно (и нужно) всех
  const targetsRef = useRef(2);
  const [targets, setTargets] = useState(2);
  const task = tasks[ti];
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__fishDbg = { fish, hook, holding, hooked };
  const done = ti >= tasks.length;

  // новая стайка рыбок под задание: нужная цифра обязательно есть (2 раза)
  const spawn = (t: Task) => {
    const nums: number[] = [];
    if (t.kind === 'find') { const k = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < k; i++) nums.push(t.n); targetsRef.current = k; setTargets(k); while (nums.length < 7) { const k = 1 + Math.floor(Math.random() * 9); if (k !== t.n) nums.push(k); } }
    else while (nums.length < 7) nums.push(1 + Math.floor(Math.random() * 9));
    fish.current = nums.map((n, i) => ({
      id: ++idc.current, n, c: COLORS[i % COLORS.length], x: Math.random(), y: 0.32 + (i / nums.length) * 0.58,
      vx: (0.04 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1), ph: Math.random() * 6, hooked: false, gone: false, flee: 0,
    }));
  };
  const announce = (t: Task) => {
    if (t.kind === 'find') { say('fi_find', soundEnabled); playVoice(`d_${t.n}`, soundEnabled); }
    else say('fi_count', soundEnabled);
  };

  useEffect(() => {
    if (done) return;
    spawn(task); caughtRef.current = 0; setCaught(0);
    if (ti === 0) say('fi_start', soundEnabled);
    announce(task);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ti, runKey]);

  // плаваем
  useEffect(() => {
    if (done) return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (const f of fish.current) {
        if (f.hooked || f.gone) continue;
        const sp = f.flee > 0 ? 3.2 : 1;
        f.flee = Math.max(0, f.flee - dt);
        f.x += f.vx * dt * sp; f.ph += dt * 2.2;
        if (f.x < -0.12) f.x = 1.12; if (f.x > 1.12) f.x = -0.12;
        // клюёт, если крючок рядом и пальчик держит
        if (holding.current && !hooked.current && !busy.current && f.flee <= 0) {
          const dx = (f.x - hook.current.x) * 1.6, dy = f.y + Math.sin(f.ph) * 0.015 - hook.current.y;
          if (dx * dx + dy * dy < 0.006) {
            hooked.current = f; f.hooked = true;
            soundEngine.playGamePop(soundEnabled, 8);
          }
        }
      }
      if (hooked.current) { hooked.current.x = hook.current.x; hooked.current.y = hook.current.y + 0.04; }
      setTick((t) => (t + 1) % 1000000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ti, runKey, done]);

  const pt = (e: React.PointerEvent) => {
    const r = pondRef.current!.getBoundingClientRect();
    return { x: Math.max(0.03, Math.min(0.97, (e.clientX - r.left) / r.width)), y: Math.max(0.12, Math.min(0.97, (e.clientY - r.top) / r.height)) };
  };
  const down = (e: React.PointerEvent) => {
    if (done || busy.current) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    holding.current = true; hook.current = pt(e);
  };
  const move = (e: React.PointerEvent) => { if (holding.current) hook.current = pt(e); };
  const up = () => {
    holding.current = false;
    const f = hooked.current;
    if (!f) return;
    hooked.current = null;
    const ok = task.kind === 'count' || f.n === task.n;
    if (!ok) {
      // не та рыбка — срывается и уплывает
      f.hooked = false; f.flee = 1.2; f.vx = Math.abs(f.vx) * (Math.random() < 0.5 ? -1 : 1);
      soundEngine.playGamePop(soundEnabled, 1);
      say('fi_wrong', soundEnabled); if (task.kind === 'find') playVoice(`d_${task.n}`, soundEnabled);
      return;
    }
    f.gone = true;
    const r = pondRef.current?.getBoundingClientRect();
    if (r) sparkleBurst(r.left + f.x * r.width, r.top + f.y * r.height, 12);
    soundEngine.playGameReward(soundEnabled);
    setBucket((b) => [...b, { n: f.n, c: f.c }]);
    const k = ++caughtRef.current; setCaught(k);
    if (task.kind === 'count') playVoice(`d_${k}`, soundEnabled, undefined, 'replace'); else say('fi_yes', soundEnabled);
    const need = task.kind === 'count' ? task.n : targetsRef.current;
    if (k >= need) {
      busy.current = true;
      window.setTimeout(() => { busy.current = false; setTi((i) => i + 1); }, 1800);
    }
  };

  const restart = () => { setTasks(TASKS()); setTi(0); setBucket([]); setRunKey((k) => k + 1); };
  const hintOn = useStepHint(`${ti}-${caught}`, 3000, 9000, !done && !busy.current);

  if (done) {
    return (
      <CookScreen stepKey="done" stepIdx={tasks.length} total={tasks.length} done={false} bg="linear-gradient(#BAE6FD, #38BDF8)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart}>
          <div className="flex flex-wrap justify-center gap-[1vmin] max-w-[80vw]">
            {bucket.map((b, i) => <img key={i} src={fishSvg(b.c, b.n)} alt="" className="w-[min(14vmin,100px)] animate-pop-in" style={{ animationDelay: `${i * 0.08}s` }} />)}
          </div>
        </Celebrate>
      </CookScreen>
    );
  }

  const W = 'min(96vw, 140vmin, 1000px)';
  const tip = { x: 0.5, y: 0.02 };
  const h = hook.current;
  return (
    <CookScreen stepKey={`t${ti}`} stepIdx={ti} total={tasks.length} done={false} bg="linear-gradient(#E0F2FE 0%, #BAE6FD 30%, #86EFAC 30%, #4ADE80 100%)">
      <div className="flex flex-col items-center gap-[1.5vmin] w-full h-full justify-center">
        {/* ведёрко с заданием */}
        <div ref={bucketRef} className="flex items-center gap-[2vmin] rounded-[2rem] bg-white/85 shadow-xl px-[2.5vmin] py-[1vmin]">
          <span className="text-[min(9vmin,64px)] leading-none">🪣</span>
          {task.kind === 'find'
            ? (
              <span className="flex items-center gap-[1.5vmin]">
                <span className="font-black text-[#0369A1] leading-none" style={{ fontSize: 'min(13vmin, 96px)' }}>{task.n}</span>
                <span className="flex gap-[0.8vmin]">
                  {Array.from({ length: targets }).map((_, i) => (
                    <span key={i} className="rounded-full border-4 border-[#0369A1] transition-colors" style={{ width: 'min(5vmin, 38px)', height: 'min(5vmin, 38px)', background: i < caught ? '#0EA5E9' : '#fff' }} />
                  ))}
                </span>
              </span>
            )
            : (
              <span className="flex gap-[1vmin]">
                {Array.from({ length: task.n }).map((_, i) => (
                  <span key={i} className="rounded-full border-4 border-[#0369A1] transition-colors" style={{ width: 'min(6vmin, 44px)', height: 'min(6vmin, 44px)', background: i < caught ? '#0EA5E9' : '#fff' }} />
                ))}
              </span>
            )}
        </div>

        {/* пруд */}
        <div ref={pondRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          className="relative overflow-hidden rounded-[45%/30%] shadow-2xl" style={{
            width: W, aspectRatio: '1.6', touchAction: 'none', maxHeight: '62vh',
            background: 'radial-gradient(ellipse at 50% 35%, #7DD3FC, #0EA5E9 60%, #0369A1)', border: '10px solid #A3E635',
          }}>
          {/* кувшинки и блики */}
          {[[0.12, 0.2], [0.85, 0.75], [0.78, 0.18], [0.18, 0.82]].map(([x, y], i) => (
            <span key={i} className="absolute text-[min(7vmin,50px)] pointer-events-none" style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: 'translate(-50%,-50%)' }}>{i % 2 ? '🪷' : '🍃'}</span>
          ))}
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: 'repeating-radial-gradient(ellipse at 30% 40%, transparent 0 22px, rgba(255,255,255,.25) 22px 24px)' }} />
          {fish.current.filter((f) => !f.gone).map((f) => (
            <img key={f.id} src={fishSvg(f.c, f.n, f.vx > 0 && !f.hooked)} alt="" draggable={false} className="absolute pointer-events-none" style={{
              left: `${f.x * 100}%`, top: `${(f.y + (f.hooked ? 0 : Math.sin(f.ph) * 0.015)) * 100}%`, width: '15%',
              transform: `translate(-50%,-50%) ${f.hooked ? 'rotate(-20deg)' : ''}`,
              filter: 'drop-shadow(0 4px 3px rgba(0,0,0,.25))', transition: f.hooked ? 'transform .2s' : 'none',
            }} />
          ))}
          {/* леска и крючок */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={`M${tip.x * 100} ${tip.y * 100} Q ${(tip.x + h.x) * 50} ${h.y * 60} ${h.x * 100} ${h.y * 100}`} stroke="#F8FAFC" strokeWidth="0.4" fill="none" />
          </svg>
          <span className="absolute pointer-events-none font-black text-[#334155]" style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%`, transform: 'translate(-30%, -10%)', fontSize: 'min(6vmin, 44px)' }}>ʖ</span>
          <span className="absolute pointer-events-none" style={{ left: '50%', top: '-1%', transform: 'translate(-50%,0)', fontSize: 'min(9vmin, 64px)' }}>🎣</span>
        </div>
      </div>
      <GestureHint show={hintOn} kind="drag" target={pondRef} />
    </CookScreen>
  );
};
