import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DIGITS, dotsFor, Glyph, LETTERS } from '../data/glyphs';
import { soundEngine } from '../utils/soundEngine';
import { playVoice, whenVoiceIdle } from '../utils/voice';
import { CookScreen, GestureHint, LoopScroller, Plate, useStepHint } from './CookKit';

/** Обводка цифр / букв по точкам: веди пальчиком от зелёной точки, в конце — название (и слово для буквы). */

const RAINBOW = ['#FF5C8A', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5'];
const chipSrc = (ch: string, i: number) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50' y='76' font-size='${ch.length > 1 ? 58 : 78}' font-family='Arial Rounded MT Bold, Arial, sans-serif' font-weight='900' text-anchor='middle' fill='${RAINBOW[i % RAINBOW.length]}' stroke='#fff' stroke-width='6' paint-order='stroke'>${ch}</text></svg>`);

export const TraceGame: React.FC<{ kind: 'numbers' | 'letters'; soundEnabled: boolean }> = ({ kind, soundEnabled }) => {
  const list = kind === 'numbers' ? DIGITS : LETTERS;
  const [gi, setGi] = useState(kind === 'numbers' ? 1 : 0);
  const g: Glyph = list[gi];
  const strokes = useMemo(() => g.strokes.map((s) => dotsFor(s)), [g]);
  const [si, setSi] = useState(0); // текущий штрих
  const [di, setDi] = useState(0); // следующая точка в штрихе
  const [done, setDone] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const startRef = useRef<SVGCircleElement>(null);
  const down = useRef(false);
  const color = RAINBOW[gi % RAINBOW.length];

  useEffect(() => { playVoice(kind === 'numbers' ? 'nu_trace' : 'le_trace', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { setSi(0); setDi(0); setDone(false); }, [gi]);

  const finish = () => {
    setDone(true);
    soundEngine.playGameReward(soundEnabled);
    playVoice(g.voice, soundEnabled, undefined, 'replace');
    window.setTimeout(() => whenVoiceIdle(() => window.setTimeout(() => setGi((i) => (i + 1) % list.length), 900)), 1200);
  };

  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 130 - 15, y: ((e.clientY - r.top) / r.height) * 170 - 20 };
  };
  const advance = (p: { x: number; y: number }) => {
    if (done) return;
    let s = si, d = di, moved = false;
    // можно «перешагнуть» близкие точки
    for (let guard = 0; guard < 4; guard++) {
      const dot = strokes[s]?.[d];
      if (!dot || Math.hypot(dot[0] - p.x, dot[1] - p.y) > 11) break;
      moved = true;
      d++;
      soundEngine.playGamePop(soundEnabled, 3 + (d % 6));
      if (d >= strokes[s].length) {
        s++; d = 0;
        if (s >= strokes.length) { setSi(s); setDi(0); finish(); return; }
        break; // новый штрих начинаем с нового касания
      }
    }
    if (moved) { setSi(s); setDi(d); }
  };

  const hint = useStepHint(`${gi}-${si}`, 2500, 6000, !done);
  const SIZE = 'min(66vmin, 560px)';
  return (
    <CookScreen stepKey={`${kind}`} stepIdx={0} total={0} bg="radial-gradient(circle at 50% 40%, #FFFFFF 0%, #EAF6FF 60%, #CDE9FF 100%)"
      trayLoop
      tray={<LoopScroller>{list.map((x, i) => (
        <Plate key={x.id} src={chipSrc(x.ch, i)} label={x.ch} selected={i === gi} onPick={() => { setGi(i); playVoice(x.voice, soundEnabled, undefined, 'replace'); }} />
      ))}</LoopScroller>}>
      <div className="flex items-center gap-[4vmin]">
        <div className="relative rounded-[3rem] bg-white shadow-2xl" style={{ width: `calc(${SIZE} * 0.78)`, height: SIZE }}>
          <svg ref={svgRef} viewBox="-15 -20 130 170" className="w-full h-full select-none" style={{ touchAction: 'none' }}
            onPointerDown={(e) => { down.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ } advance(toLocal(e)); }}
            onPointerMove={(e) => { if (down.current) advance(toLocal(e)); }}
            onPointerUp={() => { down.current = false; }} onPointerCancel={() => { down.current = false; }}>
            {/* бледный образец */}
            {g.strokes.map((s, k) => s.length > 1
              ? <polyline key={k} points={s.map((p) => p.join(',')).join(' ')} fill="none" stroke={done ? color : '#E5E7EB'} strokeWidth={done ? 14 : 12} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke .4s' }} />
              : <circle key={k} cx={s[0][0]} cy={s[0][1]} r={done ? 7 : 6} fill={done ? color : '#E5E7EB'} />)}
            {/* пройденное */}
            {!done && strokes.map((dots, k) => {
              const upto = k < si ? dots.length : k === si ? di : 0;
              if (upto < 2) return null;
              return <polyline key={`p${k}`} points={dots.slice(0, upto).map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />;
            })}
            {/* точки */}
            {!done && strokes.map((dots, k) => dots.map((p, j) => {
              const passed = k < si || (k === si && j < di);
              const isNext = k === si && j === di;
              return (
                <circle key={`${k}-${j}`} ref={isNext ? startRef : undefined} cx={p[0]} cy={p[1]} r={isNext ? 5.5 : 3}
                  fill={passed ? color : isNext ? '#22C55E' : '#9CA3AF'} stroke="#fff" strokeWidth={isNext ? 2 : 1}
                  className={isNext ? 'animate-pulse' : ''} />
              );
            }))}
          </svg>
          {done && <div className="absolute -top-[4vmin] -right-[4vmin] text-[12vmin] animate-done-pop pointer-events-none">⭐</div>}
        </div>
        {kind === 'letters' && g.emoji && (
          <div className={`transition-all duration-500 ${done ? 'opacity-100 scale-100' : 'opacity-25 scale-75 grayscale'}`} style={{ fontSize: 'min(26vmin, 220px)' }}>{g.emoji}</div>
        )}
        {kind === 'numbers' && (
          <div className={`grid grid-cols-5 gap-1 transition-all duration-500 ${done ? 'opacity-100' : 'opacity-30'}`} style={{ width: 'min(30vmin, 260px)' }}>
            {Array.from({ length: Number(g.id) }).map((_, k) => <span key={k} className={done ? 'animate-pop-in' : ''} style={{ fontSize: 'min(5vmin, 44px)', animationDelay: `${k * 0.08}s` }}>🍎</span>)}
          </div>
        )}
      </div>
      <GestureHint show={hint} kind="tap" target={startRef} />
    </CookScreen>
  );
};
