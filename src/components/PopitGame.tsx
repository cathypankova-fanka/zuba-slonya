import React, { useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../utils/soundEngine';
import { CookScreen, Plate } from './CookKit';
import { say } from './PlayKit';

/** Попит: силиконовая игрушка разных форм; пупырышки вдавливаются с «пум», можно водить пальцем. Все лопнули — переворачиваем. */

interface Shape { id: string; name: string; d: string }
const SHAPES: Shape[] = [
  { id: 'heart', name: 'Сердечко', d: 'M50 92 C14 66 2 44 10 26 C18 8 40 8 50 26 C60 8 82 8 90 26 C98 44 86 66 50 92 Z' },
  { id: 'star', name: 'Звёздочка', d: 'M50 4 L62 36 L96 37 L69 58 L79 92 L50 72 L21 92 L31 58 L4 37 L38 36 Z' },
  { id: 'circle', name: 'Кружок', d: 'M50 4 A46 46 0 1 1 49.9 4 Z' },
  { id: 'flower', name: 'Цветочек', d: 'M50 8 C62 -4 80 8 72 26 C92 22 100 42 84 52 C100 64 88 86 70 78 C72 98 52 100 50 84 C48 100 28 98 30 78 C12 86 0 64 16 52 C0 42 8 22 28 26 C20 8 38 -4 50 8 Z' },
  { id: 'dino', name: 'Динозаврик', d: 'M10 70 C10 50 22 40 40 40 L48 40 C50 24 58 10 72 8 C86 6 94 16 92 26 C90 34 82 36 76 34 L74 50 C84 54 92 66 90 80 L84 94 L72 94 L70 84 L44 84 L42 94 L30 94 L28 84 C18 84 10 80 10 70 Z' },
];
const RAINBOW = ['#FF5C8A', '#FF9F43', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5'];

interface Bubble { x: number; y: number; row: number }

const bubblesFor = (d: string): Bubble[] => {
  const p = new Path2D(d);
  const ctx = document.createElement('canvas').getContext('2d')!;
  const out: Bubble[] = [];
  const step = 10.5;
  let row = 0;
  for (let y = 8; y <= 96; y += step * 0.88, row++) {
    const off = row % 2 ? step / 2 : 0;
    for (let x = 6 + off; x <= 96; x += step) {
      const r = 4.2;
      if ([[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => ctx.isPointInPath(p, x + dx, y + dy))) out.push({ x, y, row });
    }
  }
  return out;
};

const shapeIcon = (s: Shape) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 108 108'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>${RAINBOW.map((c, i) => `<stop offset='${i / 5}' stop-color='${c}'/>`).join('')}</linearGradient></defs><path d='${s.d}' fill='url(#g)' stroke='#fff' stroke-width='3'/></svg>`);

interface Burst { id: number; x: number; y: number; c: string }

export const PopitGame: React.FC<{ soundEnabled: boolean }> = ({ soundEnabled }) => {
  const [shape, setShape] = useState<Shape>(SHAPES[0]);
  const bubbles = useMemo(() => bubblesFor(shape.d), [shape]);
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const [side, setSide] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const down = useRef(false);
  const bid = useRef(0);
  const rows = Math.max(1, ...bubbles.map((b) => b.row)) + 1;

  useEffect(() => { say('po_start', soundEnabled); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { setPressed(new Set()); }, [shape]);

  const pop = (i: number) => {
    if (flipping || pressed.has(i)) return;
    const b = bubbles[i];
    soundEngine.playGamePop(soundEnabled, 9 - Math.round((b.row / rows) * 8));
    if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* ignore */ }
    const c = RAINBOW[Math.floor((b.row / rows) * RAINBOW.length) % RAINBOW.length];
    const id = bid.current++;
    setBursts((x) => [...x.slice(-12), { id, x: b.x, y: b.y, c }]);
    window.setTimeout(() => setBursts((x) => x.filter((q) => q.id !== id)), 600);
    setPressed((p) => {
      const n = new Set(p); n.add(i);
      if (n.size === bubbles.length) {
        window.setTimeout(() => {
          soundEngine.playGameReward(soundEnabled);
          say('po_done', soundEnabled);
          setFlipping(true);
          window.setTimeout(() => { setSide((s) => 1 - s); setPressed(new Set()); }, 450);
          window.setTimeout(() => setFlipping(false), 950);
        }, 300);
      }
      return n;
    });
  };
  const hitAt = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 108 - 4, y = ((e.clientY - r.top) / r.height) * 108 - 4;
    const i = bubbles.findIndex((b) => Math.hypot(b.x - x, b.y - y) < 5);
    if (i >= 0) pop(i);
  };

  const SIZE = 'min(76vmin, 640px)';
  const uid = `po-${shape.id}`;
  return (
    <CookScreen stepKey="popit" stepIdx={0} total={0} bg="radial-gradient(circle at 50% 40%, #FFF7FB 0%, #FBE3F1 55%, #E9D5FF 100%)"
      tray={SHAPES.map((s) => <Plate key={s.id} src={shapeIcon(s)} label={s.name} selected={shape.id === s.id} onPick={() => { setShape(s); soundEngine.playGamePop(soundEnabled, 5); }} />)}>
      <div style={{ width: SIZE, height: SIZE, perspective: '1200px' }}>
        <svg ref={svgRef} viewBox="-4 -4 108 108" className="w-full h-full select-none"
          style={{ touchAction: 'none', transition: 'transform 0.9s cubic-bezier(.4,1.4,.5,1)', transform: `rotateY(${flipping ? 180 : 0}deg)`, filter: 'drop-shadow(0 14px 16px rgba(120,60,140,.35))' }}
          onPointerDown={(e) => { down.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ } hitAt(e); }}
          onPointerMove={(e) => { if (down.current) hitAt(e); }}
          onPointerUp={() => { down.current = false; }} onPointerCancel={() => { down.current = false; }}>
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
              {(side ? [...RAINBOW].reverse() : RAINBOW).map((c, i) => <stop key={i} offset={i / (RAINBOW.length - 1)} stopColor={c} />)}
            </linearGradient>
            <radialGradient id={`${uid}-up`} cx="38%" cy="32%" r="70%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.75" /><stop offset="0.45" stopColor="#fff" stopOpacity="0.12" /><stop offset="1" stopColor="#000" stopOpacity="0.22" />
            </radialGradient>
            <radialGradient id={`${uid}-dn`} cx="62%" cy="68%" r="70%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="0.5" stopColor="#000" stopOpacity="0.05" /><stop offset="1" stopColor="#000" stopOpacity="0.35" />
            </radialGradient>
            <clipPath id={`${uid}-clip`}><path d={shape.d} /></clipPath>
          </defs>
          <path d={shape.d} fill={`url(#${uid}-g)`} stroke="#fff" strokeWidth="2.2" />
          <path d={shape.d} fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="5" clipPath={`url(#${uid}-clip)`} />
          {bubbles.map((b, i) => {
            const on = pressed.has(i);
            return (
              <g key={i} style={{ transition: 'transform .12s', transformOrigin: `${b.x}px ${b.y}px`, transform: on ? 'scale(0.9)' : 'scale(1)' }}>
                <circle cx={b.x} cy={b.y} r="4.4" fill="rgba(0,0,0,.10)" />
                <circle cx={b.x} cy={b.y} r="4" fill={`url(#${uid}-${on ? 'dn' : 'up'})`} />
                {!on && <ellipse cx={b.x - 1.3} cy={b.y - 1.5} rx="1.3" ry="0.8" fill="#fff" opacity="0.8" />}
              </g>
            );
          })}
          {bursts.map((q) => (
            <g key={q.id} className="pointer-events-none">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <circle key={k} cx={q.x} cy={q.y} r="1.1" fill={q.c} style={{ animation: 'popburst .55s ease-out forwards', ['--dx' as string]: `${Math.cos(k * 1.05) * 9}px`, ['--dy' as string]: `${Math.sin(k * 1.05) * 9}px` } as React.CSSProperties} />
              ))}
            </g>
          ))}
        </svg>
      </div>
    </CookScreen>
  );
};
