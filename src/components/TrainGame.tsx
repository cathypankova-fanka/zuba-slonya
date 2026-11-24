import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CharacterItem } from '../data/characters';
import { soundEngine } from '../utils/soundEngine';
import { playVoice } from '../utils/voice';
import { CookScreen, GestureHint, Plate, sparkleBurst, useStepHint } from './CookKit';
import { Celebrate, P, say, shuffle } from './PlayKit';

/**
 * Паровозик: вагончики с цифрами стоят вперемешку в депо — перетащи их к паровозику по порядку (1, 2, 3…),
 * каждый сцепленный называется вслух; собрали — «Ту-ту!», поезд уезжает.
 * Раунды: 1–3, 1–5, а в третьем вагончики уже стоят — положи в каждый столько игрушек, какая на нём цифра.
 */

const COLORS = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7'];
const ROUNDS: { kind: 'order' | 'load'; n: number }[] = [{ kind: 'order', n: 3 }, { kind: 'order', n: 5 }, { kind: 'load', n: 4 }];
const CARGO = [P('apple'), P('strawberry'), P('banana'), P('teddy_happy'), P('cookie_zuba'), P('grape')];

const Wheel: React.FC<{ x: string; spin: boolean }> = ({ x, spin }) => (
  <span className={`absolute bottom-[-14%] w-[26%] aspect-square rounded-full ${spin ? 'animate-spin' : ''}`} style={{ left: x, background: 'radial-gradient(circle, #CBD5E1 0 22%, #334155 24% 62%, #0F172A 64%)', animationDuration: '.5s' }} />
);

const Wagon: React.FC<{ n: number; spin?: boolean; cargo?: number; need?: number }> = ({ n, spin = false, cargo = 0, need }) => (
  <div className="relative w-full h-full">
    {/* груз над вагоном */}
    {cargo > 0 && (
      <div className="absolute left-[6%] right-[6%] bottom-[78%] flex flex-wrap-reverse justify-center">
        {Array.from({ length: cargo }).map((_, i) => <img key={i} src={CARGO[(n + i) % CARGO.length]} alt="" className="w-[42%] -mb-[8%] animate-pop-in object-contain" />)}
      </div>
    )}
    <div className="absolute inset-x-0 bottom-[8%] top-[20%] rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(${COLORS[(n - 1) % 5]}, color-mix(in srgb, ${COLORS[(n - 1) % 5]} 70%, #000))`, border: '3px solid rgba(0,0,0,.25)', boxShadow: 'inset 0 4px 0 rgba(255,255,255,.35)' }}>
      <span className="rounded-full bg-white flex items-center justify-center font-black text-[#1E293B] leading-none" style={{ width: '62%', aspectRatio: '1', fontSize: 'min(7vmin, 52px)' }}>{n}</span>
    </div>
    {need != null && (
      <div className="absolute left-0 right-0 bottom-[-34%] flex justify-center gap-[6%]">
        {Array.from({ length: need }).map((_, i) => <span key={i} className="rounded-full border-2 border-[#78350F]" style={{ width: '14%', aspectRatio: '1', background: i < cargo ? '#FACC15' : '#fff' }} />)}
      </div>
    )}
    <Wheel x="8%" spin={spin} /><Wheel x="66%" spin={spin} />
  </div>
);

const Loco: React.FC<{ spin: boolean; smoke: boolean }> = ({ spin, smoke }) => (
  <div className="relative w-full h-full">
    {smoke && ['0s', '.4s', '.8s'].map((d, i) => <span key={i} className="absolute left-[22%] bottom-[96%] text-[min(6vmin,40px)] r-fx" style={{ animationDelay: d }}>☁️</span>)}
    <div className="absolute left-[16%] w-[16%] bottom-[60%] h-[28%] rounded-t-md" style={{ background: '#1E293B' }} />
    <div className="absolute left-[4%] right-[34%] bottom-[8%] top-[36%] rounded-l-full" style={{ background: 'linear-gradient(#475569, #1E293B)' }} />
    <div className="absolute right-[2%] w-[38%] bottom-[8%] top-[6%] rounded-md" style={{ background: 'linear-gradient(#EF4444, #B91C1C)', border: '3px solid #7F1D1D' }}>
      <div className="absolute left-[18%] right-[18%] top-[14%] h-[34%] rounded bg-[#BAE6FD]" />
    </div>
    <div className="absolute left-[0%] bottom-[30%] w-[10%] aspect-square rounded-full bg-[#FDE047] shadow-[0_0_12px_#FDE047]" />
    <Wheel x="6%" spin={spin} /><Wheel x="40%" spin={spin} /><Wheel x="70%" spin={spin} />
  </div>
);

export const TrainGame: React.FC<{ character: CharacterItem; soundEnabled: boolean }> = ({ character, soundEnabled }) => {
  const [runKey, setRunKey] = useState(0);
  const [ri, setRi] = useState(0);
  const round = ROUNDS[ri];
  const done = ri >= ROUNDS.length;
  const depotOrder = useMemo(() => (round ? shuffle(Array.from({ length: round.n }, (_, i) => i + 1)) : []), [ri, runKey]);
  const [linked, setLinked] = useState<number[]>([]);
  const [cargo, setCargo] = useState<number[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [drag, setDrag] = useState<{ n: number; x: number; y: number } | null>(null);
  const [bounce, setBounce] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const depotRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const busy = useRef(false);
  const portrait = window.innerHeight > window.innerWidth * 1.15;

  useEffect(() => {
    if (done) return;
    setLeaving(false); busy.current = false;
    if (round.kind === 'order') { setLinked([]); setCargo([]); say(ri === 0 ? 'tr_start' : 'tr_more', soundEnabled); }
    else { setLinked(Array.from({ length: round.n }, (_, i) => i + 1)); setCargo(Array(round.n).fill(0)); say('tr_load', soundEnabled); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ri, runKey]);

  const depart = () => {
    busy.current = true;
    window.setTimeout(() => { say('tr_go', soundEnabled); soundEngine.playGameReward(soundEnabled); setLeaving(true); }, 700);
    window.setTimeout(() => setRi((i) => i + 1), 4200);
  };

  // ---------- сцепка вагончиков ----------
  const tryLink = (n: number) => {
    const next = linked.length + 1;
    if (n !== next) {
      setBounce(n); window.setTimeout(() => setBounce(null), 500);
      soundEngine.playGamePop(soundEnabled, 1);
      say('tr_wrong', soundEnabled); playVoice(`d_${next}`, soundEnabled);
      return;
    }
    const nl = [...linked, n]; setLinked(nl);
    soundEngine.playClack(soundEnabled, n);
    playVoice(`d_${n}`, soundEnabled, undefined, 'replace');
    const el = slotRefs.current[n - 1]?.getBoundingClientRect();
    if (el) sparkleBurst(el.left + el.width / 2, el.top + el.height / 2, 10);
    if (nl.length >= round.n) depart();
  };
  const down = (n: number) => (e: React.PointerEvent) => {
    if (busy.current || round.kind !== 'order') return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setDrag({ n, x: e.clientX, y: e.clientY });
  };
  const move = (e: React.PointerEvent) => { if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY }); };
  const up = (e: React.PointerEvent) => {
    if (!drag) return;
    const n = drag.n; setDrag(null);
    const r = trackRef.current?.getBoundingClientRect();
    const onTrack = r && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
    // просто нажатие тоже работает: вагончик сам едет к паровозику
    if (onTrack || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) tryLink(n);
  };

  // ---------- погрузка ----------
  const load = (x: number, y: number) => {
    if (busy.current || round.kind !== 'load') return;
    const i = slotRefs.current.findIndex((el) => { const r = el?.getBoundingClientRect(); return r && x > r.left - 10 && x < r.right + 10 && y > r.top - 60 && y < r.bottom + 20; });
    if (i < 0 || i >= round.n) return;
    const need = i + 1;
    if (cargo[i] >= need) { setBounce(need); window.setTimeout(() => setBounce(null), 500); say('tr_full', soundEnabled); return; }
    const nc = cargo.map((c, k) => (k === i ? c + 1 : c)); setCargo(nc);
    soundEngine.playGamePop(soundEnabled, 3 + nc[i]);
    playVoice(`d_${nc[i]}`, soundEnabled, undefined, 'replace');
    if (nc.every((c, k) => c >= k + 1)) depart();
  };

  const restart = () => { setRi(0); setRunKey((k) => k + 1); };
  const hintOn = useStepHint(`${ri}-${linked.length}-${cargo.join()}`, 3000, 9000, !done && !busy.current);

  if (done) {
    return (
      <CookScreen stepKey="done" stepIdx={ROUNDS.length} total={ROUNDS.length} done={false} bg="linear-gradient(#BAE6FD, #86EFAC)">
        <Celebrate hero={character} runKey={runKey} soundEnabled={soundEnabled} onRestart={restart} />
      </CookScreen>
    );
  }

  const total = round.n;
  const W = portrait ? 'min(96vw, 700px)' : 'min(120vmin, 1100px)';
  const unit = `calc(${W} / ${total + 2})`; // ширина вагончика
  const tray = round.kind === 'load'
    ? CARGO.slice(0, 4).map((src, i) => <Plate key={i} src={src} label="" target={trackRef} onDrop={load} onPick={() => {
        // нажатие: кладём в первый неполный вагончик
        const k = cargo.findIndex((c, j) => c < j + 1);
        const el = slotRefs.current[k]?.getBoundingClientRect();
        if (el) load(el.left + el.width / 2, el.top + el.height / 2);
      }} />)
    : undefined;

  return (
    <CookScreen stepKey={`r${ri}`} stepIdx={ri} total={ROUNDS.length} done={false} tray={tray}
      bg="linear-gradient(#BAE6FD 0%, #E0F2FE 46%, #86EFAC 46%, #4ADE80 100%)">
      <div className="flex flex-col items-center justify-center gap-[5vmin] w-full h-full" onPointerMove={move} onPointerUp={up}>
        {/* рельсы с поездом */}
        <div ref={trackRef} className="relative" style={{ width: W, height: `calc(${unit} * 0.95)` }}>
          <div className="absolute left-[-5%] right-[-5%] bottom-[-10%] h-[8%] rounded" style={{ background: 'repeating-linear-gradient(90deg, #78350F 0 10px, transparent 10px 26px), #64748B' }} />
          <div className="absolute inset-0 flex items-end" style={{ transform: leaving ? 'translateX(130vw)' : 'none', transition: leaving ? 'transform 3s ease-in' : 'none' }}>
            {/* вагончики: слоты справа налево от паровоза (паровоз впереди, справа) */}
            {Array.from({ length: total }).map((_, i) => {
              const n = total - i; // самый левый — последний
              const has = linked.includes(n);
              return (
                <div key={n} ref={(el) => { slotRefs.current[n - 1] = el; }} className="relative h-full" style={{ width: unit, marginRight: '1%' }}>
                  {has
                    ? <div className={`w-full h-full ${bounce === n ? 'animate-[shakeX_.4s]' : ''}`}><Wagon n={n} spin={leaving} cargo={round.kind === 'load' ? cargo[n - 1] : 0} need={round.kind === 'load' ? n : undefined} /></div>
                    : <div className="w-full h-[70%] mt-auto rounded-lg border-4 border-dashed border-white/80 flex items-center justify-center font-black text-white/90" style={{ fontSize: 'min(6vmin, 44px)', background: n === linked.length + 1 ? 'rgba(253,224,71,.45)' : 'transparent' }}>{n}</div>}
                </div>
              );
            })}
            <div className="relative h-full" style={{ width: `calc(${unit} * 1.5)`, transform: 'scaleX(-1)' /* фонарём вперёд, по ходу поезда */ }}><Loco spin={leaving} smoke={leaving || linked.length > 0} /></div>
          </div>
        </div>

        {/* депо с вагончиками вперемешку */}
        {round.kind === 'order' && (
          <div ref={depotRef} className="flex flex-wrap justify-center gap-[3vmin] rounded-[2rem] bg-white/40 px-[3vmin] py-[3vmin]" style={{ maxWidth: W }}>
            {depotOrder.filter((n) => !linked.includes(n)).map((n) => (
              <div key={n} onPointerDown={down(n)} className={`relative cursor-grab touch-none ${bounce === n ? 'animate-[shakeX_.4s]' : ''}`}
                style={{ width: unit, height: `calc(${unit} * 0.95)`, opacity: drag?.n === n ? 0.3 : 1 }}>
                <Wagon n={n} />
              </div>
            ))}
          </div>
        )}
      </div>

      {drag && (
        <div className="fixed pointer-events-none z-50" style={{ left: drag.x, top: drag.y, width: unit, height: `calc(${unit} * 0.95)`, transform: 'translate(-50%,-60%) scale(1.1)' }}>
          <Wagon n={drag.n} />
        </div>
      )}
      <GestureHint show={hintOn} kind={round.kind === 'order' ? 'drag' : 'tap'} target={round.kind === 'order' ? trackRef : trackRef} from={round.kind === 'order' ? depotRef : undefined} />
    </CookScreen>
  );
};
