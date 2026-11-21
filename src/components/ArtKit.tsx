import React, { useEffect, useRef, useState } from 'react';
import { PAINT_COLORS, PatternStampId } from '../data/artTools';
import { drawPatternStamp, drawStrokeSegment, NormalizedPoint } from '../utils/canvasRender';
import { soundEngine } from '../utils/soundEngine';
import { StampPreviewIcon } from './StampPreviewIcon';

/** Рисовалка для творческих миссий: краски (и радуга), кисть и кисти-штампы, кнопка «готово». */

export const RAINBOW = 'rainbow';
export type ArtTool = 'brush' | PatternStampId;
const RAINBOW_HUES = ['#FF3B5C', '#FF7A1A', '#FFC700', '#10C97A', '#06B6D4', '#2563EB', '#8B5CF6'];

/** Рисование на холсте. clip — ограничить рисование (например, контуром футболки). */
export function usePaint(opts: { color: string; tool: ArtTool; soundEnabled: boolean; clip?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; brush?: number; active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<NormalizedPoint | null>(null);
  const dist = useRef(0);
  const hue = useRef(0);
  const [activity, setActivity] = useState(0);
  const o = useRef(opts); o.current = opts;

  const size = () => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect();
    const w = Math.round(r.width * 2), h = Math.round(r.height * 2);
    if (c.width !== w || c.height !== h) {
      // сохраняем нарисованное при изменении размера
      const old = c.width > 10 ? c.getContext('2d')!.getImageData(0, 0, c.width, c.height) : null;
      const ow = c.width, oh = c.height;
      c.width = w; c.height = h;
      if (old) { const t = document.createElement('canvas'); t.width = ow; t.height = oh; t.getContext('2d')!.putImageData(old, 0, 0); c.getContext('2d')!.drawImage(t, 0, 0, w, h); }
    }
    return c;
  };
  useEffect(() => { size(); }, []);
  const colorNow = () => {
    if (o.current.color !== RAINBOW) return o.current.color;
    hue.current = (hue.current + 0.18) % RAINBOW_HUES.length;
    return RAINBOW_HUES[Math.floor(hue.current)];
  };
  const withClip = (fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = size(); if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.save();
    o.current.clip?.(ctx, c.width, c.height);
    fn(ctx, c.width, c.height);
    ctx.restore();
  };
  const stamp = (p: NormalizedPoint) => withClip((ctx, w, h) => {
    drawPatternStamp(ctx, o.current.tool as PatternStampId, p.x * w, p.y * h, w * (o.current.tool === 'blush' ? 0.16 : 0.1), colorNow(), (Math.random() - 0.5) * 0.8);
  });
  const pt = (e: React.PointerEvent): NormalizedPoint => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const bump = () => setActivity((a) => a + 1);
  const bind = {
    onPointerDown: (e: React.PointerEvent) => {
      if (o.current.active === false) return;
      try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const p = pt(e); last.current = p; dist.current = 0;
      if (o.current.tool === 'brush') withClip((ctx, w, h) => drawStrokeSegment(ctx, p, p, w, h, o.current.brush ?? 0.035, colorNow(), false));
      else { stamp(p); soundEngine.playGamePop(o.current.soundEnabled, 4 + Math.floor(Math.random() * 5)); }
      bump();
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!last.current || o.current.active === false) return;
      const p = pt(e), q = last.current;
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (o.current.tool === 'brush') {
        if (d < 0.004) return;
        withClip((ctx, w, h) => drawStrokeSegment(ctx, q, p, w, h, o.current.brush ?? 0.035, colorNow(), false));
        last.current = p;
        dist.current += d;
        if (dist.current > 0.12) { dist.current = 0; bump(); if (Math.random() < 0.4) soundEngine.playGamePop(o.current.soundEnabled, 2 + Math.floor(Math.random() * 4)); }
      } else if (d > 0.09) {
        stamp(p); last.current = p; bump();
        soundEngine.playGamePop(o.current.soundEnabled, 4 + Math.floor(Math.random() * 5));
      }
    },
    onPointerUp: () => { last.current = null; },
    onPointerCancel: () => { last.current = null; },
    style: { touchAction: 'none' as const },
  };
  const snapshot = () => canvasRef.current?.toDataURL() ?? '';
  const clear = () => { const c = canvasRef.current; if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setActivity(0); };
  return { canvasRef, bind, activity, clear, snapshot };
}

/** Две полоски: краски сверху, кисти снизу. */
export const ArtPalette: React.FC<{
  color: string; onColor: (c: string) => void;
  tool?: ArtTool; onTool?: (t: ArtTool) => void; tools?: ArtTool[];
  soundEnabled: boolean;
}> = ({ color, onColor, tool, onTool, tools, soundEnabled }) => {
  const S = 'min(6.6vmin, 58px)';
  const sw = (c: string) => c === RAINBOW ? `conic-gradient(${RAINBOW_HUES.join(',')},${RAINBOW_HUES[0]})` : c;
  return (
    <div className="flex flex-col items-center gap-[1.2vmin] pb-[1vmin]">
      <div className="flex gap-[1.1vmin] flex-nowrap justify-center">
        {[...PAINT_COLORS.map((p) => p.hex), RAINBOW].map((c) => (
          <button key={c} type="button" aria-label="краска" onClick={() => { onColor(c); soundEngine.playGamePop(soundEnabled, 6); }}
            className="rounded-full transition-transform active:scale-90"
            style={{ width: S, height: S, background: sw(c), border: '4px solid #fff', boxShadow: color === c ? '0 0 0 5px #F59E0B, 0 6px 12px rgba(0,0,0,.25)' : '0 4px 8px rgba(0,0,0,.2)', transform: color === c ? 'scale(1.15)' : undefined }} />
        ))}
      </div>
      {tools && onTool && (
        <div className="flex gap-[1.1vmin] flex-nowrap justify-center">
          {tools.map((t) => (
            <button key={t} type="button" aria-label="кисточка" onClick={() => { onTool(t); soundEngine.playGamePop(soundEnabled, 4); }}
              className="rounded-[1.4rem] bg-white flex items-center justify-center transition-transform active:scale-90"
              style={{ width: S, height: S, boxShadow: tool === t ? '0 0 0 5px #F59E0B, 0 6px 12px rgba(0,0,0,.25)' : '0 4px 8px rgba(0,0,0,.2)', transform: tool === t ? 'scale(1.15)' : undefined }}>
              {t === 'brush'
                ? <span style={{ fontSize: `calc(${S} * 0.6)` }}>🖌️</span>
                : <StampPreviewIcon stampId={t} color={color === RAINBOW ? '#FF5CA8' : color} className="w-[70%] h-[70%]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Большая кнопка «Готово» (появляется, когда можно идти дальше). */
export const DoneButton = React.forwardRef<HTMLButtonElement, { show: boolean; onClick: () => void; className?: string }>(({ show, onClick, className = '' }, ref) => (
  <button ref={ref} type="button" aria-label="Готово" onClick={onClick}
    className={`rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-xl transition-all duration-300 active:scale-90 ${show ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-50 pointer-events-none'} ${className}`}
    style={{ width: 'min(14vmin, 112px)', height: 'min(14vmin, 112px)', fontSize: 'min(8vmin, 64px)', boxShadow: '0 6px 0 #15803D, 0 12px 20px rgba(0,0,0,.25)' }}>✓</button>
));
DoneButton.displayName = 'DoneButton';

/** Фото на память: вспышка и «щёлк». */
export function usePhoto(soundEnabled: boolean) {
  const [flash, setFlash] = useState(false);
  const [taken, setTaken] = useState(false);
  const shoot = () => {
    soundEngine.playGamePop(soundEnabled, 9);
    window.setTimeout(() => soundEngine.playGamePop(soundEnabled, 7), 90);
    setFlash(true); window.setTimeout(() => setFlash(false), 350);
    window.setTimeout(() => { setTaken(true); soundEngine.playGameReward(soundEnabled); }, 400);
  };
  const reset = () => setTaken(false);
  const overlay = flash ? <div className="fixed inset-0 z-[80] bg-white pointer-events-none" style={{ animation: 'fadeIn .05s reverse' }} /> : null;
  return { shoot, taken, overlay, reset };
}
