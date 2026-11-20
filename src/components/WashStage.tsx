import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CharacterItem } from '../data/characters';
import { MessType, WashToolMode } from '../data/kitchenData';
import { DraggableItemPayload } from '../types/drag';
import { NormalizedPoint } from '../utils/canvasRender';
import {
  applyWashSegment,
  CharacterWashState,
  drawInitialMess,
  measureCanvasOpaqueCount,
  renderFullWashLayers,
  WashOperation,
} from '../utils/washRender';
import { useDragContext } from './DragContext';
import { WashToolSvg } from './KitchenIllustrations';
import { ReactionHero } from './ReactionHero';
import { pickReaction, Reaction } from '../data/reactions';

interface WashStageProps {
  character: CharacterItem;
  washTool: WashToolMode;
  washState: CharacterWashState;
  praiseBubble: string | null;
  onSelectWashTool: (tool: WashToolMode) => void;
  onResetMess: (messType?: MessType) => void;
  onAddWashOp: (op: WashOperation) => void;
  onMarkCleanCelebrated: () => void;
  onToolSound: (kind: WashToolMode) => void;
}

interface WaterDrop {
  id: number;
  x: number;
  y: number;
}

export const WashStage: React.FC<WashStageProps> = ({
  character,
  washTool,
  washState,
  praiseBubble,
  onSelectWashTool,
  onResetMess,
  onAddWashOp,
  onMarkCleanCelebrated,
  onToolSound,
}) => {
  const { activeDrag, registerStageDropHandler } = useDragContext();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const foamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 480,
    height: 640,
  });
  const [imageError, setImageError] = useState(false);
  // реакция героя, когда он помылся
  const [endReaction, setEndReaction] = useState<{ r: Reaction; key: number } | null>(null);
  const wasCelebratedRef = useRef(false);
  useEffect(() => {
    if (washState.celebrated && !wasCelebratedRef.current) {
      wasCelebratedRef.current = true;
      setEndReaction({ r: pickReaction('wash', character.id), key: Date.now() });
      const t = window.setTimeout(() => setEndReaction(null), 4200);
      return () => window.clearTimeout(t);
    }
    if (!washState.celebrated) wasCelebratedRef.current = false;
  }, [washState.celebrated, character.id]);
  const [cleanPercent, setCleanPercent] = useState(0);
  const [hasFoamRemaining, setHasFoamRemaining] = useState(false);
  const [hasWaterRemaining, setHasWaterRemaining] = useState(false);
  const [waterDrops, setWaterDrops] = useState<WaterDrop[]>([]);
  const [pointerPos, setPointerPos] = useState<{
    x: number;
    y: number;
    active: boolean;
    pointerType: string;
  }>({
    x: 0.5,
    y: 0.5,
    active: false,
    pointerType: 'touch',
  });

  const baselineMessCountRef = useRef<number>(1);
  const lastSoundAtRef = useRef<number>(0);
  const dropCounterRef = useRef<number>(0);
  const activeStrokeRef = useRef<{
    pointerId: number;
    kind: WashToolMode;
    points: NormalizedPoint[];
    pointerType: string;
  } | null>(null);

  const toolbarDragStrokeRef = useRef<{
    kind: WashToolMode;
    points: NormalizedPoint[];
  } | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [character.id]);

  // Keep canvas crisp on resize
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const recomputeCleanliness = useCallback(() => {
    const dirtCanvas = dirtCanvasRef.current;
    const foamCanvas = foamCanvasRef.current;
    const waterCanvas = waterCanvasRef.current;
    if (!dirtCanvas || !foamCanvas || !waterCanvas) return;

    const dirtRemaining = measureCanvasOpaqueCount(dirtCanvas);
    const foamRemaining = measureCanvasOpaqueCount(foamCanvas);
    const waterRemaining = measureCanvasOpaqueCount(waterCanvas);
    const base = Math.max(1, baselineMessCountRef.current);

    const dirtRatio = Math.min(1, dirtRemaining / base);
    const foamPenalty = Math.min(0.28, (foamRemaining / Math.max(20, base * 1.6)) * 0.28);
    const waterPenalty =
      waterRemaining > 4 ? Math.min(0.14, 0.04 + (waterRemaining / 120) * 0.1) : 0;
    const rawPct = Math.round(
      Math.max(
        0,
        Math.min(100, (1 - dirtRatio) * 100 - foamPenalty * 100 - waterPenalty * 100)
      )
    );

    const dirtCleared = dirtRemaining <= Math.max(2, base * 0.08);
    const foamCleared = foamRemaining <= 6;
    const waterCleared = waterRemaining <= 4;

    setHasFoamRemaining(dirtCleared && !foamCleared);
    setHasWaterRemaining(dirtCleared && foamCleared && !waterCleared);
    setCleanPercent(washState.celebrated ? 100 : rawPct);

    if (!washState.celebrated && dirtCleared && foamCleared && waterCleared) {
      const dCtx = dirtCanvas.getContext('2d');
      const fCtx = foamCanvas.getContext('2d');
      const wCtx = waterCanvas.getContext('2d');
      dCtx?.clearRect(0, 0, dirtCanvas.width, dirtCanvas.height);
      fCtx?.clearRect(0, 0, foamCanvas.width, foamCanvas.height);
      wCtx?.clearRect(0, 0, waterCanvas.width, waterCanvas.height);
      setHasFoamRemaining(false);
      setHasWaterRemaining(false);
      setCleanPercent(100);
      onMarkCleanCelebrated();
    }
  }, [onMarkCleanCelebrated, washState.celebrated]);

  // Redraw dirt, foam & water droplet layers whenever character, washState, or stage size changes
  useEffect(() => {
    const dirtCanvas = dirtCanvasRef.current;
    const foamCanvas = foamCanvasRef.current;
    const waterCanvas = waterCanvasRef.current;
    if (!dirtCanvas || !foamCanvas || !waterCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelW = Math.round(stageSize.width * dpr);
    const pixelH = Math.round(stageSize.height * dpr);

    if (dirtCanvas.width !== pixelW || dirtCanvas.height !== pixelH) {
      dirtCanvas.width = pixelW;
      dirtCanvas.height = pixelH;
    }
    if (foamCanvas.width !== pixelW || foamCanvas.height !== pixelH) {
      foamCanvas.width = pixelW;
      foamCanvas.height = pixelH;
    }
    if (waterCanvas.width !== pixelW || waterCanvas.height !== pixelH) {
      waterCanvas.width = pixelW;
      waterCanvas.height = pixelH;
    }

    const dCtx = dirtCanvas.getContext('2d');
    const fCtx = foamCanvas.getContext('2d');
    const wCtx = waterCanvas.getContext('2d');
    if (!dCtx || !fCtx || !wCtx) return;

    drawInitialMess(
      dCtx,
      pixelW,
      pixelH,
      character.id,
      washState.messType,
      washState.messSeed
    );
    baselineMessCountRef.current = Math.max(1, measureCanvasOpaqueCount(dirtCanvas));

    if (washState.celebrated) {
      dCtx.clearRect(0, 0, pixelW, pixelH);
      fCtx.clearRect(0, 0, pixelW, pixelH);
      wCtx.clearRect(0, 0, pixelW, pixelH);
      setCleanPercent(100);
      setHasFoamRemaining(false);
      setHasWaterRemaining(false);
      return;
    }

    renderFullWashLayers(dCtx, fCtx, wCtx, pixelW, pixelH, character.id, washState);
    recomputeCleanliness();
  }, [character.id, recomputeCleanliness, stageSize, washState]);

  const getNormalizedPoint = (clientX: number, clientY: number): NormalizedPoint => {
    const el = stageRef.current;
    if (!el) return { x: 0.5, y: 0.5 };
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const spawnWaterDrops = useCallback((pt: NormalizedPoint) => {
    const nextDrops: WaterDrop[] = Array.from({ length: 3 }).map((_, idx) => ({
      id: ++dropCounterRef.current + idx,
      x: Math.min(0.95, Math.max(0.05, pt.x + (Math.random() - 0.5) * 0.14)),
      y: Math.min(0.92, Math.max(0.05, pt.y + (Math.random() - 0.5) * 0.08)),
    }));
    setWaterDrops((prev) => [...prev.slice(-14), ...nextDrops]);
  }, []);

  const playThrottledSound = useCallback(
    (kind: WashToolMode) => {
      const now = Date.now();
      if (now - lastSoundAtRef.current > 110) {
        lastSoundAtRef.current = now;
        onToolSound(kind);
      }
    },
    [onToolSound]
  );

  // Register Drag-from-Toolbar handler so dragging soap/sponge/shower/dryer scrubs continuously!
  const latestCallbacksRef = useRef({
    onSelectWashTool,
    onResetMess,
    onAddWashOp,
    onToolSound,
    recomputeCleanliness,
    spawnWaterDrops,
    playThrottledSound,
  });
  latestCallbacksRef.current = {
    onSelectWashTool,
    onResetMess,
    onAddWashOp,
    onToolSound,
    recomputeCleanliness,
    spawnWaterDrops,
    playThrottledSound,
  };

  useEffect(() => {
    const commitToolbarStroke = () => {
      const ds = toolbarDragStrokeRef.current;
      if (!ds) return;
      toolbarDragStrokeRef.current = null;
      setWaterDrops([]);
      if (ds.points.length > 0) {
        latestCallbacksRef.current.onAddWashOp({
          id: `wash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          kind: ds.kind,
          points: ds.points,
        });
        latestCallbacksRef.current.recomputeCleanliness();
      }
    };

    registerStageDropHandler({
      containsPoint: (clientX, clientY) => {
        const el = stageRef.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      },
      onDragEnter: (item: DraggableItemPayload, clientX, clientY) => {
        if (item.kind !== 'wash_tool') return;
        latestCallbacksRef.current.onSelectWashTool(item.tool);
        const pt = getNormalizedPoint(clientX, clientY);
        toolbarDragStrokeRef.current = { kind: item.tool, points: [pt] };

        const dirtCanvas = dirtCanvasRef.current;
        const foamCanvas = foamCanvasRef.current;
        const waterCanvas = waterCanvasRef.current;
        const dCtx = dirtCanvas?.getContext('2d');
        const fCtx = foamCanvas?.getContext('2d');
        const wCtx = waterCanvas?.getContext('2d') ?? null;
        if (dirtCanvas && foamCanvas && dCtx && fCtx) {
          applyWashSegment(
            dCtx,
            fCtx,
            wCtx,
            item.tool,
            pt,
            pt,
            dirtCanvas.width,
            dirtCanvas.height,
            Math.round(pt.x * 1000 + pt.y * 500)
          );
          if (item.tool === 'shower') latestCallbacksRef.current.spawnWaterDrops(pt);
          latestCallbacksRef.current.playThrottledSound(item.tool);
          latestCallbacksRef.current.recomputeCleanliness();
        }
      },
      onDragMove: (item: DraggableItemPayload, clientX, clientY) => {
        if (item.kind !== 'wash_tool') return;
        const ds = toolbarDragStrokeRef.current;
        if (!ds) return;
        const pt = getNormalizedPoint(clientX, clientY);
        const prevPt = ds.points[ds.points.length - 1];
        if (Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y) < 0.006) return;

        ds.points.push(pt);
        const dirtCanvas = dirtCanvasRef.current;
        const foamCanvas = foamCanvasRef.current;
        const waterCanvas = waterCanvasRef.current;
        const dCtx = dirtCanvas?.getContext('2d');
        const fCtx = foamCanvas?.getContext('2d');
        const wCtx = waterCanvas?.getContext('2d') ?? null;
        if (dirtCanvas && foamCanvas && dCtx && fCtx) {
          applyWashSegment(
            dCtx,
            fCtx,
            wCtx,
            ds.kind,
            prevPt,
            pt,
            dirtCanvas.width,
            dirtCanvas.height,
            ds.points.length * 29
          );
          if (ds.kind === 'shower') latestCallbacksRef.current.spawnWaterDrops(pt);
          latestCallbacksRef.current.playThrottledSound(ds.kind);
          if (ds.points.length % 5 === 0) {
            latestCallbacksRef.current.recomputeCleanliness();
          }
        }
      },
      onDragDrop: (item: DraggableItemPayload) => {
        if (item.kind === 'wash_tool') {
          commitToolbarStroke();
        } else if (item.kind === 'mess_preset') {
          latestCallbacksRef.current.onResetMess(item.messType);
        }
      },
      onDragCancel: () => {
        commitToolbarStroke();
      },
    });

    return () => {
      registerStageDropHandler(null);
    };
  }, [registerStageDropHandler]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);

    const pt = getNormalizedPoint(e.clientX, e.clientY);
    setPointerPos({ x: pt.x, y: pt.y, active: true, pointerType: e.pointerType });

    activeStrokeRef.current = {
      pointerId: e.pointerId,
      kind: washTool,
      points: [pt],
      pointerType: e.pointerType,
    };

    const dirtCanvas = dirtCanvasRef.current;
    const foamCanvas = foamCanvasRef.current;
    const waterCanvas = waterCanvasRef.current;
    const dCtx = dirtCanvas?.getContext('2d');
    const fCtx = foamCanvas?.getContext('2d');
    const wCtx = waterCanvas?.getContext('2d') ?? null;
    if (dirtCanvas && foamCanvas && dCtx && fCtx) {
      applyWashSegment(
        dCtx,
        fCtx,
        wCtx,
        washTool,
        pt,
        pt,
        dirtCanvas.width,
        dirtCanvas.height,
        Math.round(pt.x * 1000 + pt.y * 500)
      );
      if (washTool === 'shower') spawnWaterDrops(pt);
      onToolSound(washTool);
      lastSoundAtRef.current = Date.now();
      recomputeCleanliness();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const stroke = activeStrokeRef.current;
    const pt = getNormalizedPoint(e.clientX, e.clientY);
    if (!stroke || stroke.pointerId !== e.pointerId) return;

    setPointerPos({ x: pt.x, y: pt.y, active: true, pointerType: stroke.pointerType });
    const prevPt = stroke.points[stroke.points.length - 1];
    if (Math.hypot(pt.x - prevPt.x, pt.y - prevPt.y) < 0.006) return;

    stroke.points.push(pt);

    const dirtCanvas = dirtCanvasRef.current;
    const foamCanvas = foamCanvasRef.current;
    const waterCanvas = waterCanvasRef.current;
    const dCtx = dirtCanvas?.getContext('2d');
    const fCtx = foamCanvas?.getContext('2d');
    const wCtx = waterCanvas?.getContext('2d') ?? null;
    if (dirtCanvas && foamCanvas && dCtx && fCtx) {
      applyWashSegment(
        dCtx,
        fCtx,
        wCtx,
        stroke.kind,
        prevPt,
        pt,
        dirtCanvas.width,
        dirtCanvas.height,
        stroke.points.length * 29
      );
      if (stroke.kind === 'shower') spawnWaterDrops(pt);
      playThrottledSound(stroke.kind);
      if (stroke.points.length % 5 === 0) {
        recomputeCleanliness();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const stroke = activeStrokeRef.current;
    if (!stroke || stroke.pointerId !== e.pointerId) return;
    activeStrokeRef.current = null;
    setPointerPos((p) => ({ ...p, active: false }));
    setWaterDrops([]);

    onAddWashOp({
      id: `wash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: stroke.kind,
      points: stroke.points,
    });
    recomputeCleanliness();
  };

  const isClean =
    washState.celebrated || (cleanPercent >= 96 && !hasFoamRemaining && !hasWaterRemaining);
  const isDragTargetHighlight =
    Boolean(activeDrag?.overStage) &&
    (activeDrag?.item.kind === 'wash_tool' || activeDrag?.item.kind === 'mess_preset');

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-0 gap-1.5">
      {/* Cleanliness Bar */}
      <div className="w-full max-w-[360px] flex items-center justify-between gap-2.5 px-2 shrink-0">
        <span className="font-display font-bold text-xs sm:text-sm text-[#4A443D] whitespace-nowrap">
          {isClean
            ? 'Чистюля!'
            : hasFoamRemaining
            ? 'Смой пену душем!'
            : hasWaterRemaining
            ? 'Высуши феном!'
            : `Чистота · ${cleanPercent}%`}
        </span>
        <div className="flex-1 h-2.5 sm:h-3 rounded-full bg-[#E5DFD2] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${isClean ? 100 : cleanPercent}%`,
              backgroundColor: isClean ? '#10B981' : hasWaterRemaining ? '#06B6D4' : '#38BDF8',
            }}
          />
        </div>
      </div>

      {/* Main Face Wash Stage */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center">
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ backgroundColor: character.accentBg, touchAction: 'none' }}
          className={`relative h-full w-auto max-w-full aspect-[3/4] max-h-full rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_14px_38px_rgba(36,33,29,0.12)] border-4 select-none cursor-pointer transition-shadow ${
            isDragTargetHighlight ? 'border-[#FF6B4A] ring-4 ring-[#FF6B4A]/35' : 'border-white'
          }`}
        >
          {/* Character Photo */}
          {!imageError ? (
            <img
              src={character.imageSrc}
              alt={character.name}
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center text-4xl font-display font-extrabold text-[#24211D]">
                {character.name.slice(0, 1)}
              </div>
              <p className="mt-3 font-display font-bold text-lg text-[#24211D]">{character.name}</p>
            </div>
          )}

          {/* Dirt / Jam / Paint Layer */}
          <canvas
            ref={dirtCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Soap Foam Bubbles Layer */}
          <canvas
            ref={foamCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Persistent Water Droplets Layer left after shower */}
          <canvas
            ref={waterCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {endReaction && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-white/30 rounded-[inherit]">
              <ReactionHero character={character} reaction={endReaction.r} runKey={endReaction.key} className="w-full h-full" />
            </div>
          )}

          {/* Shower Droplets Animation Layer */}
          {waterDrops.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {waterDrops.map((d) => (
                <svg
                  key={d.id}
                  viewBox="0 0 24 32"
                  className="absolute w-5 h-7 animate-bounce"
                  style={{
                    left: `${d.x * 100}%`,
                    top: `${d.y * 100}%`,
                    transform: 'translate(-50%, -20%)',
                  }}
                >
                  <path
                    d="M12 2 C18 11, 21 17, 21 22 A9 9 0 0 1 3 22 C3 17, 6 11, 12 2 Z"
                    fill="#38BDF8"
                    fillOpacity="0.85"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </svg>
              ))}
            </div>
          )}

          {/* Active Tool Visual Indicator under/above finger during direct touch */}
          {pointerPos.active && !activeDrag && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: `${pointerPos.x * 100}%`,
                top: `${pointerPos.y * 100}%`,
                transform: `translate(-50%, ${pointerPos.pointerType === 'touch' ? '-95%' : '-50%'})`,
              }}
            >
              {washTool === 'dryer' && (
                <svg
                  viewBox="0 0 60 40"
                  className="w-12 h-8 absolute -left-10 top-1.5 animate-pulse"
                  aria-hidden="true"
                >
                  <path d="M52 10 Q36 8 24 12" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                  <path d="M54 20 Q34 18 16 22" fill="none" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                  <path d="M52 30 Q36 29 22 32" fill="none" stroke="#7DD3FC" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                </svg>
              )}
              <WashToolSvg tool={washTool} className="w-14 h-14 drop-shadow-lg" />
            </div>
          )}

          {/* Clean Sparkles Celebration Overlay */}
          {isClean && (
            <div className="absolute inset-0 pointer-events-none">
              <Sparkles className="w-9 h-9 text-[#FACC15] absolute top-[18%] left-[16%] animate-pulse drop-shadow" />
              <Sparkles className="w-8 h-8 text-[#38BDF8] absolute top-[22%] right-[15%] animate-pulse drop-shadow" />
              <Sparkles className="w-7 h-7 text-[#F472B6] absolute bottom-[26%] left-[14%] animate-pulse drop-shadow" />
              <Sparkles className="w-9 h-9 text-[#34D399] absolute bottom-[24%] right-[16%] animate-pulse drop-shadow" />
            </div>
          )}

          {/* Praise Speech Bubble */}
          {praiseBubble && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pop-in">
              <div className="bg-white/95 backdrop-blur-xs text-[#24211D] font-display font-extrabold text-sm sm:text-base px-4 py-2 rounded-2xl shadow-lg border-2 border-[#FFD13B] whitespace-nowrap">
                {praiseBubble}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
