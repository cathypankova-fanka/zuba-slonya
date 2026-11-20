import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, LayoutGrid, Star, Trash2, Undo2 } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { IdleHandPointer } from './MiniGameShell';

interface ColoringGameProps {
  soundEnabled: boolean;
}

const COLORING_PAGES = [
  'zs_01',
  'zs_02',
  'zs_03',
  'zs_04',
  'zs_05',
  'zs_06',
  'zs_07',
  'zs_08',
  'zs_09',
  'zs_10',
  'zs_11',
  'zs_12',
  'zs_13',
  'zs_14',
  'zs_15',
  'zs_16',
  'bear',
  'bunny',
  'kitten',
  'puppy',
  'fox',
  'lion',
  'frog',
  'owl',
  'panda',
  'koala',
  'elephant',
  'giraffe',
  'zebra',
  'monkey',
  'hedgehog',
  'flamingo',
  'chick',
  'duckling',
  'penguin',
  'turtle',
  'octopus',
  'whale',
  'fish',
  'crab',
  'starfish',
  'seahorse',
  'jellyfish',
  'snail',
  'caterpillar',
  'ladybug',
  'bee',
  'dino',
  'dragon',
  'unicorn',
  'butterfly_a',
  'butterfly_b',
] as const;

const COLORING_COLORS = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#92400e',
  '#fcd9b6',
  '#9ca3af',
  '#ffffff',
] as const;

type ColoringTool = 'fill' | 'brush' | 'magic' | 'erase';

const STAGE_W = 960;
const STAGE_H = 640;
const BRUSH_WIDTHS = [14, 30, 60] as const;
const DONE_STORAGE_KEY = 'anyutka_coloring_done_v1';

interface PageState {
  id: string;
  w: number;
  h: number;
  line: HTMLImageElement;
  lab: Int32Array;
  paint: HTMLCanvasElement;
  pctx: CanvasRenderingContext2D;
  rect: { x: number; y: number; s: number };
}

interface FillAnimation {
  mask: HTMLCanvasElement;
  cx: number;
  cy: number;
  t0: number;
}

interface StrokeState {
  pointerId: number;
  regionId: number;
  mask: HTMLCanvasElement;
  lx: number;
  ly: number;
}

function loadDonePages(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(DONE_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function saveDonePages(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DONE_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Ignore storage quota errors
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildRegionMask(page: PageState, regionId: number, hexColor: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = page.w;
  c.height = page.h;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const im = ctx.createImageData(page.w, page.h);
  const d = im.data;
  const lab = page.lab;
  const [r, g, b] = hexToRgb(hexColor);
  for (let i = 0; i < lab.length; i++) {
    if (lab[i] === regionId) {
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = b;
      d[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  return c;
}

function easeOutCubic(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - clamped, 3);
}

const ToolIconSvg: React.FC<{ tool: ColoringTool }> = ({ tool }) => {
  switch (tool) {
    case 'fill':
      return (
        <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12l6-8 8 8-6 8z" />
          <path d="M5 12h14" />
          <path d="M20 15c1.4 1.8 2 3 2 4a2 2 0 0 1-4 0c0-1 .6-2.2 2-4z" fill="currentColor" />
        </svg>
      );
    case 'brush':
      return (
        <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 4l-9 9" />
          <path d="M11 13c-2.5-.6-4.6 1-4.6 3.4 0 1.8-1.4 2.6-2.4 3 3.6 1.6 8.4 1 8.4-3.4 0-1.2-.6-2.4-1.4-3z" fill="currentColor" />
        </svg>
      );
    case 'magic':
      return (
        <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M3 15a9 9 0 0 1 18 0" stroke="#ef4444" />
          <path d="M6 15a6 6 0 0 1 12 0" stroke="#facc15" />
          <path d="M9 15a3 3 0 0 1 6 0" stroke="#3b82f6" />
          <path d="M12 3v2M20 6l-1.4 1.4M4 6l1.4 1.4" stroke="#a855f7" />
        </svg>
      );
    case 'erase':
      return (
        <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 16l9-10a2 2 0 0 1 3 0l3 3a2 2 0 0 1 0 3l-6 6H8z" fill="currentColor" fillOpacity=".25" />
          <path d="M8 19h12" />
        </svg>
      );
  }
};

export const ColoringGame: React.FC<ColoringGameProps> = ({ soundEnabled }) => {
  const [showGallery, setShowGallery] = useState(true);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => loadDonePages());
  const [tool, setTool] = useState<ColoringTool>('fill');
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState<number>(1);
  const [everActed, setEverActed] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tmpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageRef = useRef<PageState | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const animsRef = useRef<FillAnimation[]>([]);
  const strokeRef = useRef<StrokeState | null>(null);
  const hueRef = useRef<number>(0);
  const soundEnabledRef = useRef(soundEnabled);
  const toolRef = useRef(tool);
  const colorIdxRef = useRef(colorIdx);
  const sizeIdxRef = useRef(sizeIdx);

  const [stageScale, setStageScale] = useState(0.8);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    colorIdxRef.current = colorIdx;
  }, [colorIdx]);

  useEffect(() => {
    sizeIdxRef.current = sizeIdx;
  }, [sizeIdx]);

  // Fit 960x640 logical stage inside available play container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const updateFit = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scale = Math.min(rect.width / STAGE_W, rect.height / STAGE_H) * 0.96;
      setStageScale(Math.max(0.28, scale));
    };

    updateFit();
    const ro = new ResizeObserver(updateFit);
    ro.observe(el);
    window.addEventListener('resize', updateFit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateFit);
    };
  }, [showGallery]);

  // Continuous render loop for smooth fill reveal animations
  useEffect(() => {
    if (showGallery) return;
    let rafId = 0;

    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      const page = pageRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(2, 0, 0, 2, 0, 0);
          ctx.clearRect(0, 0, STAGE_W, STAGE_H);

          if (page) {
            const { x, y, s } = page.rect;
            const w = page.w * s;
            const h = page.h * s;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 8;
            ctx.beginPath();
            ctx.roundRect(x - 14, y - 14, w + 28, h + 28, 30);
            ctx.fill();
            ctx.shadowColor = 'transparent';

            ctx.drawImage(page.paint, x, y, w, h);

            const anims = animsRef.current;
            const maxR = Math.hypot(page.w, page.h);
            for (let i = anims.length - 1; i >= 0; i--) {
              const a = anims[i];
              const k = easeOutCubic((now - a.t0) / 380);
              ctx.save();
              ctx.beginPath();
              ctx.arc(x + a.cx * s, y + a.cy * s, maxR * s * k, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(a.mask, x, y, w, h);
              ctx.restore();

              if (k >= 1) {
                page.pctx.drawImage(a.mask, 0, 0);
                anims.splice(i, 1);
              }
            }

            ctx.drawImage(page.line, x, y, w, h);
          }
        }
      }
      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [showGallery]);

  const openPage = useCallback((id: string) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const oc = document.createElement('canvas');
      oc.width = w;
      oc.height = h;
      const octx = oc.getContext('2d', { willReadFrequently: true });
      if (!octx) return;

      octx.drawImage(img, 0, 0);
      const data = octx.getImageData(0, 0, w, h).data;
      const lab = new Int32Array(w * h); // 0 = outline line
      const isLine = (idx: number) => data[idx * 4 + 3] > 110;

      let regionNum = 0;
      const stack = new Int32Array(w * h);
      for (let start = 0; start < w * h; start++) {
        if (lab[start] || isLine(start)) continue;
        regionNum += 1;
        let sp = 0;
        stack[sp++] = start;
        lab[start] = regionNum;
        while (sp > 0) {
          const p = stack[--sp];
          const px = p % w;
          const py = (p / w) | 0;
          if (px > 0 && !lab[p - 1] && !isLine(p - 1)) {
            lab[p - 1] = regionNum;
            stack[sp++] = p - 1;
          }
          if (px < w - 1 && !lab[p + 1] && !isLine(p + 1)) {
            lab[p + 1] = regionNum;
            stack[sp++] = p + 1;
          }
          if (py > 0 && !lab[p - w] && !isLine(p - w)) {
            lab[p - w] = regionNum;
            stack[sp++] = p - w;
          }
          if (py < h - 1 && !lab[p + w] && !isLine(p + w)) {
            lab[p + w] = regionNum;
            stack[sp++] = p + w;
          }
        }
      }

      // Dilate region IDs slightly under anti-aliased outlines so no white halo remains
      for (let pass = 0; pass < 3; pass++) {
        const nextLab = lab.slice();
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const p = y * w + x;
            if (lab[p]) continue;
            const neighbor = lab[p - 1] || lab[p + 1] || lab[p - w] || lab[p + w];
            if (neighbor) nextLab[p] = neighbor;
          }
        }
        lab.set(nextLab);
      }

      const paint = document.createElement('canvas');
      paint.width = w;
      paint.height = h;
      const pctx = paint.getContext('2d');
      if (!pctx) return;

      const scale = Math.min(780 / w, 580 / h);
      pageRef.current = {
        id,
        w,
        h,
        line: img,
        lab,
        paint,
        pctx,
        rect: {
          x: STAGE_W / 2 - (w * scale) / 2,
          y: STAGE_H / 2 - (h * scale) / 2,
          s: scale,
        },
      };

      undoStackRef.current = [];
      animsRef.current = [];
      strokeRef.current = null;
      setUndoCount(0);
      setEverActed(false);
      setCelebrating(false);
      setShowGallery(false);
    };
    img.src = `/assets/coloring/pages/${id}.webp`;
  }, []);

  const pushUndo = useCallback((page: PageState) => {
    const snap = page.pctx.getImageData(0, 0, page.w, page.h);
    undoStackRef.current.push(snap);
    if (undoStackRef.current.length > 12) {
      undoStackRef.current.shift();
    }
    setUndoCount(undoStackRef.current.length);
  }, []);

  const toPageCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const page = pageRef.current;
    if (!canvas || !page) return null;
    const r = canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    const sx = ((clientX - r.left) / r.width) * STAGE_W;
    const sy = ((clientY - r.top) / r.height) * STAGE_H;
    return {
      x: (sx - page.rect.x) / page.rect.s,
      y: (sy - page.rect.y) / page.rect.s,
    };
  }, []);

  const labAt = useCallback((page: PageState, px: number, py: number): number => {
    const x = Math.round(px);
    const y = Math.round(py);
    if (x < 0 || y < 0 || x >= page.w || y >= page.h) return -1;
    return page.lab[y * page.w + x];
  }, []);

  const drawBrushDab = useCallback(
    (page: PageState, mask: HTMLCanvasElement, x1: number, y1: number, x2?: number, y2?: number) => {
      let tmp = tmpCanvasRef.current;
      if (!tmp) {
        tmp = document.createElement('canvas');
        tmpCanvasRef.current = tmp;
      }
      if (tmp.width !== page.w || tmp.height !== page.h) {
        tmp.width = page.w;
        tmp.height = page.h;
      }
      const tctx = tmp.getContext('2d');
      if (!tctx) return;

      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, page.w, page.h);
      tctx.lineCap = 'round';
      tctx.lineJoin = 'round';

      const currentTool = toolRef.current;
      const strokeColor =
        currentTool === 'magic'
          ? `hsl(${Math.round(hueRef.current) % 360}, 90%, 58%)`
          : COLORING_COLORS[colorIdxRef.current];

      tctx.strokeStyle = strokeColor;
      tctx.fillStyle = strokeColor;
      tctx.lineWidth = BRUSH_WIDTHS[sizeIdxRef.current] * (page.w / 780) * 0.9;

      tctx.beginPath();
      tctx.moveTo(x1, y1);
      tctx.lineTo(x2 ?? x1, y2 ?? y1);
      tctx.stroke();

      // Clip strictly inside tapped region so color never crosses outline lines
      tctx.globalCompositeOperation = 'destination-in';
      tctx.drawImage(mask, 0, 0);

      page.pctx.drawImage(tmp, 0, 0);
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const page = pageRef.current;
    if (!page || celebrating) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setEverActed(true);

    const pt = toPageCoords(e.clientX, e.clientY);
    if (!pt) return;

    let regionId = labAt(page, pt.x, pt.y);
    if (regionId <= 0) {
      // Snap to nearest valid region if finger landed directly on black outline
      const dirs: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ];
      for (let r = 2; r <= 14 && regionId <= 0; r += 3) {
        for (const [dx, dy] of dirs) {
          const candidate = labAt(page, pt.x + dx * r, pt.y + dy * r);
          if (candidate > 0) {
            regionId = candidate;
            break;
          }
        }
      }
    }
    if (regionId <= 0) return;

    const currentTool = toolRef.current;
    if (currentTool === 'fill' || currentTool === 'erase') {
      pushUndo(page);
      if (currentTool === 'erase') {
        const mask = buildRegionMask(page, regionId, '#000000');
        page.pctx.globalCompositeOperation = 'destination-out';
        page.pctx.drawImage(mask, 0, 0);
        page.pctx.globalCompositeOperation = 'source-over';
        soundEngine.playEraseSwoosh(soundEnabledRef.current);
      } else {
        const mask = buildRegionMask(page, regionId, COLORING_COLORS[colorIdxRef.current]);
        animsRef.current.push({
          mask,
          cx: pt.x,
          cy: pt.y,
          t0: performance.now(),
        });
        soundEngine.playGameOk(soundEnabledRef.current, colorIdxRef.current);
      }
      return;
    }

    pushUndo(page);
    const mask = buildRegionMask(page, regionId, '#000000');
    strokeRef.current = {
      pointerId: e.pointerId,
      regionId,
      mask,
      lx: pt.x,
      ly: pt.y,
    };
    drawBrushDab(page, mask, pt.x, pt.y);
    soundEngine.playGamePop(soundEnabledRef.current, colorIdxRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    const page = pageRef.current;
    if (!stroke || !page || stroke.pointerId !== e.pointerId) return;

    const pt = toPageCoords(e.clientX, e.clientY);
    if (!pt) return;

    const dist = Math.hypot(pt.x - stroke.lx, pt.y - stroke.ly);
    if (labAt(page, pt.x, pt.y) !== stroke.regionId && dist < 1) return;

    if (toolRef.current === 'magic') {
      hueRef.current += dist * 0.9;
    }

    drawBrushDab(page, stroke.mask, stroke.lx, stroke.ly, pt.x, pt.y);
    stroke.lx = pt.x;
    stroke.ly = pt.y;

    if (dist > 6 && Math.random() < 0.14) {
      soundEngine.playGamePop(soundEnabledRef.current, Math.floor(Math.random() * 6));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (strokeRef.current && strokeRef.current.pointerId === e.pointerId) {
      strokeRef.current = null;
    }
  };

  const handleUndo = () => {
    const page = pageRef.current;
    if (!page || undoStackRef.current.length === 0) return;
    // Commit any active fill animations first so undo restores cleanly
    for (const a of animsRef.current) {
      page.pctx.drawImage(a.mask, 0, 0);
    }
    animsRef.current = [];
    const snap = undoStackRef.current.pop();
    if (snap) {
      page.pctx.putImageData(snap, 0, 0);
      setUndoCount(undoStackRef.current.length);
      soundEngine.playEraseSwoosh(soundEnabled);
    }
  };

  const handleClear = () => {
    const page = pageRef.current;
    if (!page) return;
    pushUndo(page);
    animsRef.current = [];
    page.pctx.clearRect(0, 0, page.w, page.h);
    soundEngine.playEraseSwoosh(soundEnabled);
  };

  const handleDone = () => {
    const page = pageRef.current;
    if (!page || celebrating) return;
    setCelebrating(true);

    const updated = new Set(doneIds);
    updated.add(page.id);
    setDoneIds(updated);
    saveDonePages(updated);

    soundEngine.playGameReward(soundEnabled);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.56 },
        colors: ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#ec4899'],
        disableForReducedMotion: true,
      });
    }

    window.setTimeout(() => {
      setCelebrating(false);
      setShowGallery(true);
    }, 1700);
  };

  if (showGallery) {
    return (
      <div className="relative w-full h-full overflow-y-auto no-scrollbar rounded-3xl border-2 border-[#FBCFE8] bg-gradient-to-b from-[#FDF2F8] via-[#F0F9FF] to-[#E0F2FE] p-3 sm:p-5 shadow-sm">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-[940px] mx-auto pb-4">
          {COLORING_PAGES.map((id) => {
            const isDone = doneIds.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  soundEngine.playGamePop(soundEnabled, 2);
                  openPage(id);
                }}
                aria-label={id}
                className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-white p-2.5 sm:p-3 border-2 border-white/80 shadow-[0_5px_0_rgba(148,163,184,0.22)] hover:scale-[1.04] active:scale-95 transition-transform cursor-pointer"
              >
                <img
                  src={`/assets/coloring/pages/${id}.webp`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
                {isDone && (
                  <span
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-[#FEF3C7] border border-[#FACC15] flex items-center justify-center shadow-xs"
                    aria-hidden="true"
                  >
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#FACC15]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between rounded-3xl border-2 border-[#BAE6FD] bg-gradient-to-b from-[#FDF2F8] to-[#E0F2FE] overflow-hidden select-none touch-none shadow-sm">
      {/* Main Coloring Canvas Stage */}
      <div ref={wrapRef} className="relative flex-1 w-full min-h-0 overflow-hidden flex items-center justify-center">
        <div
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${stageScale})`,
            transformOrigin: 'center center',
          }}
          className="relative shrink-0"
        >
          <canvas
            ref={canvasRef}
            width={STAGE_W * 2}
            height={STAGE_H * 2}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: STAGE_W, height: STAGE_H }}
            className="block touch-none cursor-crosshair"
          />

          {!everActed && (
            <div className="absolute left-[54%] top-[42%] pointer-events-none">
              <IdleHandPointer />
            </div>
          )}
        </div>

        {/* Top-left Gallery Picker Button */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playGamePop(soundEnabled, 1);
            setShowGallery(true);
          }}
          aria-label="Выбрать другую раскраску"
          className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-20 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-[#FAF8F4] text-[#475569] border-2 border-[#E2E8F0] shadow-[0_4px_0_rgba(148,163,184,0.35)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        >
          <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Bottom-left Clear & Undo Floating Buttons */}
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClear}
            aria-label="Стереть всё"
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white border-2 border-white shadow-[0_4px_0_#B91C1C] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          >
            <Trash2 className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={undoCount === 0}
            aria-label="Отменить"
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-45 text-white border-2 border-white shadow-[0_5px_0_#B45309] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          >
            <Undo2 className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* Bottom-right Done Floating Button */}
        <button
          type="button"
          onClick={handleDone}
          disabled={celebrating}
          aria-label="Готово"
          className={`absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-white border-3 border-white shadow-[0_6px_0_#15803D] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${
            undoCount >= 3 && !celebrating ? 'animate-pulse' : ''
          }`}
        >
          <Check className="w-9 h-9 sm:w-11 sm:h-11 stroke-[3.4]" />
        </button>
      </div>

      {/* Bottom Palette & Tool Tray */}
      <div className="w-full px-2 sm:px-4 py-2 sm:py-2.5 bg-white/75 backdrop-blur-md border-t border-white/80 rounded-t-[26px] shadow-[0_-4px_18px_rgba(0,0,0,0.06)] flex flex-col gap-2 items-center shrink-0 z-20">
        {/* Color Swatches */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {COLORING_COLORS.map((hex, idx) => {
            const active = idx === colorIdx;
            return (
              <button
                key={hex}
                type="button"
                onClick={() => {
                  soundEngine.playGamePop(soundEnabled, idx);
                  setColorIdx(idx);
                  if (tool === 'erase' || tool === 'magic') {
                    setTool('fill');
                  }
                }}
                aria-label={hex}
                aria-pressed={active}
                style={{ backgroundColor: hex }}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full cursor-pointer transition-transform ${
                  active
                    ? '-translate-y-1 scale-115 shadow-[0_5px_0_rgba(124,58,237,0.4),0_0_0_3px_#fff_inset,0_0_0_6px_#7c3aed]'
                    : 'shadow-[0_3px_0_rgba(0,0,0,0.18),0_0_0_3px_#fff_inset] hover:scale-105'
                }`}
              />
            );
          })}
        </div>

        {/* Tools & Brush Sizes */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {(['fill', 'brush', 'magic', 'erase'] as const).map((t) => {
            const active = tool === t;
            const ariaMap: Record<ColoringTool, string> = {
              fill: 'Заливка',
              brush: 'Кисть',
              magic: 'Радужная кисть',
              erase: 'Ластик',
            };
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  soundEngine.playGamePop(soundEnabled, 2);
                  setTool(t);
                }}
                aria-label={ariaMap[t]}
                aria-pressed={active}
                className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[18px] flex items-center justify-center cursor-pointer transition-all ${
                  active
                    ? 'bg-[#7C3AED] text-white -translate-y-0.5 shadow-[0_5px_0_rgba(76,29,149,0.5)]'
                    : 'bg-white text-[#475569] shadow-[0_4px_0_rgba(0,0,0,0.12)] hover:scale-105'
                }`}
              >
                <ToolIconSvg tool={t} />
              </button>
            );
          })}

          {(tool === 'brush' || tool === 'magic') && (
            <>
              <div className="w-px h-8 bg-[#CBD5E1] mx-0.5" aria-hidden="true" />
              {[10, 18, 28].map((dotPx, idx) => {
                const active = sizeIdx === idx;
                return (
                  <button
                    key={dotPx}
                    type="button"
                    onClick={() => {
                      soundEngine.playGamePop(soundEnabled, idx + 3);
                      setSizeIdx(idx);
                    }}
                    aria-label={`Размер ${idx + 1}`}
                    aria-pressed={active}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white flex items-center justify-center cursor-pointer transition-all ${
                      active
                        ? 'shadow-[0_0_0_4px_#7c3aed_inset,0_4px_0_rgba(0,0,0,0.12)]'
                        : 'shadow-[0_3px_0_rgba(0,0,0,0.12)] hover:scale-105'
                    }`}
                  >
                    <span
                      style={{ width: dotPx, height: dotPx }}
                      className="block rounded-full bg-[#475569]"
                    />
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
