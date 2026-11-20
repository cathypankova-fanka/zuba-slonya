import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { PAINT_COLORS, PatternStampId, STICKERS, stickerToDataUrl } from '../data/artTools';
import { CharacterItem } from '../data/characters';
import { DraggableItemPayload } from '../types/drag';
import {
  buildTShirtPath2D,
  drawStrokeSegment,
  NormalizedPoint,
  PaintOperation,
  PlacedSticker,
  renderPaintOperations,
  TSHIRT_SVG_PATH,
} from '../utils/canvasRender';
import { getStickerAssetUrl } from '../utils/itemAssets';
import { useDragContext } from './DragContext';
import { IdleAvatar } from './IdleAvatar';
import { ToolMode } from './FaceArtStage';
import { ArtToolSvgIcon, ColorPencilSvgIcon } from './KitchenIllustrations';
import { StampPreviewIcon } from './StampPreviewIcon';

interface TShirtStageProps {
  character: CharacterItem;
  tshirtColor: string;
  toolMode: ToolMode;
  selectedColor: string;
  brushSize: 'medium' | 'large';
  selectedStamp: PatternStampId;
  selectedStickerId: string;
  paintOps: PaintOperation[];
  stickers: PlacedSticker[];
  selectedStickerUid: string | null;
  praiseBubble: string | null;
  onSelectTShirtColor: (hex: string) => void;
  onSelectToolMode: (mode: ToolMode) => void;
  onSelectColor: (hex: string) => void;
  onSelectStamp: (stampId: PatternStampId) => void;
  onSelectSticker: (stickerId: string) => void;
  onSelectStickerUid: (uid: string | null) => void;
  onAddPaintOp: (op: PaintOperation) => void;
  onAddSticker: (sticker: PlacedSticker) => void;
  onUpdateSticker: (
    uid: string,
    patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'scale' | 'rotation'>>
  ) => void;
  onRemoveSticker: (uid: string) => void;
  onTapFeedback: (kind: 'paint' | 'stamp' | 'sticker' | 'erase') => void;
}

export const TShirtStage: React.FC<TShirtStageProps> = ({
  character,
  tshirtColor,
  toolMode,
  selectedColor,
  brushSize,
  selectedStamp,
  selectedStickerId,
  paintOps,
  stickers,
  selectedStickerUid,
  praiseBubble,
  onSelectTShirtColor,
  onSelectToolMode,
  onSelectColor,
  onSelectStamp,
  onSelectSticker,
  onSelectStickerUid,
  onAddPaintOp,
  onAddSticker,
  onUpdateSticker,
  onRemoveSticker,
  onTapFeedback,
}) => {
  const { activeDrag, registerStageDropHandler } = useDragContext();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 480,
    height: 640,
  });

  const activePointersRef = useRef<
    Map<number, { clientX: number; clientY: number }>
  >(new Map());

  const activeStrokeRef = useRef<{
    pointerId: number;
    points: NormalizedPoint[];
    isErase: boolean;
    radiusRatio: number;
    color: string;
    pointerType: string;
  } | null>(null);

  const toolbarDragStrokeRef = useRef<{
    points: NormalizedPoint[];
    isErase: boolean;
    radiusRatio: number;
    color: string;
  } | null>(null);

  const draggingStickerRef = useRef<{
    uid: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const transformingStickerRef = useRef<{
    uid: string;
    pointerId: number;
    centerX: number;
    centerY: number;
    startDist: number;
    startAngle: number;
    baseScale: number;
    baseRotation: number;
  } | null>(null);

  const pinchStickerRef = useRef<{
    uid: string;
    p1: number;
    p2: number;
    startDist: number;
    startAngle: number;
    startMidX: number;
    startMidY: number;
    baseX: number;
    baseY: number;
    baseScale: number;
    baseRotation: number;
  } | null>(null);

  const [imageError, setImageError] = useState(false);
  const [activeCursor, setActiveCursor] = useState<{
    x: number;
    y: number;
    active: boolean;
    pointerType: string;
    mode: ToolMode;
  } | null>(null);
  const cursorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [character.id]);

  useEffect(() => {
    return () => {
      if (cursorTimeoutRef.current) window.clearTimeout(cursorTimeoutRef.current);
    };
  }, []);

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

  // Redraw clipped paint layer whenever paintOps or size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelW = Math.round(stageSize.width * dpr);
    const pixelH = Math.round(stageSize.height * dpr);

    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.clip(buildTShirtPath2D(pixelW, pixelH));
    renderPaintOperations(ctx, paintOps, pixelW, pixelH);
    ctx.restore();
  }, [paintOps, stageSize]);

  const getNormalizedPoint = (clientX: number, clientY: number): NormalizedPoint => {
    const el = stageRef.current;
    if (!el) return { x: 0.5, y: 0.5 };
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const isInsideShirtArea = (pt: NormalizedPoint): boolean => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return pt.y >= 0.28;
    const path = buildTShirtPath2D(canvas.width, canvas.height);
    return ctx.isPointInPath(path, pt.x * canvas.width, pt.y * canvas.height);
  };

  const clampToShirt = (pt: NormalizedPoint): NormalizedPoint => {
    if (isInsideShirtArea(pt)) return pt;
    return {
      x: Math.min(0.75, Math.max(0.25, pt.x)),
      y: Math.min(0.86, Math.max(0.38, pt.y)),
    };
  };

  // Register Drag-from-Toolbar Drop & Continuous Paint Handler
  const latestRef = useRef({
    toolMode,
    selectedColor,
    brushSize,
    selectedStamp,
    selectedStickerId,
    onSelectTShirtColor,
    onSelectToolMode,
    onSelectColor,
    onSelectStamp,
    onSelectSticker,
    onSelectStickerUid,
    onAddPaintOp,
    onAddSticker,
    onTapFeedback,
  });
  latestRef.current = {
    toolMode,
    selectedColor,
    brushSize,
    selectedStamp,
    selectedStickerId,
    onSelectTShirtColor,
    onSelectToolMode,
    onSelectColor,
    onSelectStamp,
    onSelectSticker,
    onSelectStickerUid,
    onAddPaintOp,
    onAddSticker,
    onTapFeedback,
  };

  useEffect(() => {
    const commitToolbarStroke = () => {
      const ds = toolbarDragStrokeRef.current;
      if (!ds) return;
      toolbarDragStrokeRef.current = null;
      if (ds.points.length > 0) {
        const op: PaintOperation = ds.isErase
          ? {
              kind: 'erase',
              id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              radiusRatio: ds.radiusRatio,
              points: ds.points,
            }
          : {
              kind: 'stroke',
              id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              color: ds.color,
              radiusRatio: ds.radiusRatio,
              points: ds.points,
            };
        latestRef.current.onAddPaintOp(op);
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
        const latest = latestRef.current;
        const pt = getNormalizedPoint(clientX, clientY);

        if (item.kind === 'paint_color') {
          latest.onSelectColor(item.hex);
          if (latest.toolMode !== 'paint' && latest.toolMode !== 'stamp') {
            latest.onSelectToolMode('paint');
          }
          latest.onSelectStickerUid(null);
          const radiusRatio = latest.brushSize === 'large' ? 0.044 : 0.028;
          toolbarDragStrokeRef.current = {
            points: [pt],
            isErase: false,
            radiusRatio,
            color: item.hex,
          };
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
            ctx.save();
            ctx.clip(buildTShirtPath2D(canvas.width, canvas.height));
            drawStrokeSegment(ctx, pt, pt, canvas.width, canvas.height, radiusRatio, item.hex, false);
            ctx.restore();
          }
          latest.onTapFeedback('paint');
        } else if (item.kind === 'art_tool') {
          latest.onSelectToolMode(item.tool);
          if (item.tool === 'paint' || item.tool === 'eraser') {
            latest.onSelectStickerUid(null);
            const isErase = item.tool === 'eraser';
            const radiusRatio = isErase
              ? 0.055
              : latest.brushSize === 'large'
              ? 0.044
              : 0.028;
            toolbarDragStrokeRef.current = {
              points: [pt],
              isErase,
              radiusRatio,
              color: latest.selectedColor,
            };
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
              ctx.save();
              ctx.clip(buildTShirtPath2D(canvas.width, canvas.height));
              drawStrokeSegment(
                ctx,
                pt,
                pt,
                canvas.width,
                canvas.height,
                radiusRatio,
                isErase ? '#000000' : latest.selectedColor,
                isErase
              );
              ctx.restore();
            }
            latest.onTapFeedback(isErase ? 'erase' : 'paint');
          }
        }
      },
      onDragMove: (item: DraggableItemPayload, clientX, clientY) => {
        if (
          item.kind !== 'paint_color' &&
          !(item.kind === 'art_tool' && (item.tool === 'paint' || item.tool === 'eraser'))
        ) {
          return;
        }
        const ds = toolbarDragStrokeRef.current;
        if (!ds) return;
        const pt = getNormalizedPoint(clientX, clientY);
        const prev = ds.points[ds.points.length - 1];
        if (Math.hypot(pt.x - prev.x, pt.y - prev.y) < 0.004) return;
        ds.points.push(pt);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
          ctx.save();
          ctx.clip(buildTShirtPath2D(canvas.width, canvas.height));
          drawStrokeSegment(
            ctx,
            prev,
            pt,
            canvas.width,
            canvas.height,
            ds.radiusRatio,
            ds.isErase ? '#000000' : ds.color,
            ds.isErase
          );
          ctx.restore();
        }
      },
      onDragDrop: (item: DraggableItemPayload, clientX, clientY) => {
        const latest = latestRef.current;
        const rawPt = getNormalizedPoint(clientX, clientY);
        const pt = clampToShirt(rawPt);

        if (item.kind === 'tshirt_color') {
          latest.onSelectTShirtColor(item.hex);
          return;
        }

        if (
          item.kind === 'paint_color' ||
          (item.kind === 'art_tool' && (item.tool === 'paint' || item.tool === 'eraser'))
        ) {
          commitToolbarStroke();
          return;
        }

        if (item.kind === 'stamp') {
          latest.onSelectToolMode('stamp');
          latest.onSelectStamp(item.stampId);
          latest.onSelectStickerUid(null);
          latest.onAddPaintOp({
            kind: 'stamp',
            id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            stampId: item.stampId,
            color: item.color,
            x: pt.x,
            y: pt.y,
            sizeRatio: latest.brushSize === 'large' ? 0.145 : 0.105,
            rotation: (Math.random() - 0.5) * 0.25,
          });
          latest.onTapFeedback('stamp');
          return;
        }

        if (item.kind === 'sticker') {
          latest.onSelectToolMode('sticker');
          latest.onSelectSticker(item.stickerId);
          const newUid = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          latest.onAddSticker({
            uid: newUid,
            stickerId: item.stickerId,
            x: pt.x,
            y: pt.y,
            scale: latest.brushSize === 'large' ? 1.15 : 0.95,
            rotation: 0,
          });
          latest.onSelectStickerUid(newUid);
          latest.onTapFeedback('sticker');
          return;
        }

        if (item.kind === 'art_tool') {
          latest.onSelectToolMode(item.tool);
          if (item.tool === 'stamp') {
            latest.onSelectStickerUid(null);
            latest.onAddPaintOp({
              kind: 'stamp',
              id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              stampId: latest.selectedStamp,
              color: latest.selectedColor,
              x: pt.x,
              y: pt.y,
              sizeRatio: latest.brushSize === 'large' ? 0.145 : 0.105,
              rotation: (Math.random() - 0.5) * 0.25,
            });
            latest.onTapFeedback('stamp');
          } else if (item.tool === 'sticker') {
            const newUid = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            latest.onAddSticker({
              uid: newUid,
              stickerId: latest.selectedStickerId,
              x: pt.x,
              y: pt.y,
              scale: latest.brushSize === 'large' ? 1.15 : 0.95,
              rotation: 0,
            });
            latest.onSelectStickerUid(newUid);
            latest.onTapFeedback('sticker');
          }
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

  const showTransientCursor = (pt: NormalizedPoint, pointerType: string, mode: ToolMode) => {
    if (cursorTimeoutRef.current) window.clearTimeout(cursorTimeoutRef.current);
    setActiveCursor({ x: pt.x, y: pt.y, active: true, pointerType, mode });
    cursorTimeoutRef.current = window.setTimeout(() => {
      setActiveCursor(null);
    }, 260);
  };

  const beginTwoFingerPinch = (sticker: PlacedSticker) => {
    const entries = Array.from(activePointersRef.current.entries());
    if (entries.length < 2) return;
    const [[p1, pos1], [p2, pos2]] = entries;
    const dx = pos2.clientX - pos1.clientX;
    const dy = pos2.clientY - pos1.clientY;
    pinchStickerRef.current = {
      uid: sticker.uid,
      p1,
      p2,
      startDist: Math.max(12, Math.hypot(dx, dy)),
      startAngle: Math.atan2(dy, dx),
      startMidX: (pos1.clientX + pos2.clientX) / 2,
      startMidY: (pos1.clientY + pos2.clientY) / 2,
      baseX: sticker.x,
      baseY: sticker.y,
      baseScale: sticker.scale,
      baseRotation: sticker.rotation,
    };
    draggingStickerRef.current = null;
    transformingStickerRef.current = null;
    activeStrokeRef.current = null;
    setActiveCursor(null);
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    if (draggingStickerRef.current && activePointersRef.current.size === 2) {
      const stk = stickers.find((s) => s.uid === draggingStickerRef.current?.uid);
      if (stk) {
        stageRef.current?.setPointerCapture(e.pointerId);
        beginTwoFingerPinch(stk);
      }
      return;
    }

    if (pinchStickerRef.current || draggingStickerRef.current || transformingStickerRef.current) return;
    const pt = getNormalizedPoint(e.clientX, e.clientY);

    if (!isInsideShirtArea(pt)) {
      onSelectStickerUid(null);
      return;
    }

    if (toolMode === 'stamp') {
      onSelectStickerUid(null);
      showTransientCursor(pt, e.pointerType, 'stamp');
      const stampOp: PaintOperation = {
        kind: 'stamp',
        id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        stampId: selectedStamp,
        color: selectedColor,
        x: pt.x,
        y: pt.y,
        sizeRatio: brushSize === 'large' ? 0.145 : 0.105,
        rotation: (Math.random() - 0.5) * 0.25,
      };
      onAddPaintOp(stampOp);
      onTapFeedback('stamp');
      return;
    }

    if (toolMode === 'sticker') {
      showTransientCursor(pt, e.pointerType, 'sticker');
      const newUid = `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      onAddSticker({
        uid: newUid,
        stickerId: selectedStickerId,
        x: pt.x,
        y: pt.y,
        scale: brushSize === 'large' ? 1.15 : 0.95,
        rotation: 0,
      });
      onSelectStickerUid(newUid);
      onTapFeedback('sticker');
      return;
    }

    onSelectStickerUid(null);
    const isErase = toolMode === 'eraser';
    const radiusRatio = isErase
      ? 0.055
      : brushSize === 'large'
        ? 0.044
        : 0.028;

    e.currentTarget.setPointerCapture(e.pointerId);
    activeStrokeRef.current = {
      pointerId: e.pointerId,
      points: [pt],
      isErase,
      radiusRatio,
      color: selectedColor,
      pointerType: e.pointerType,
    };

    if (cursorTimeoutRef.current) window.clearTimeout(cursorTimeoutRef.current);
    setActiveCursor({
      x: pt.x,
      y: pt.y,
      active: true,
      pointerType: e.pointerType,
      mode: toolMode,
    });

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.save();
      ctx.clip(buildTShirtPath2D(canvas.width, canvas.height));
      drawStrokeSegment(
        ctx,
        pt,
        pt,
        canvas.width,
        canvas.height,
        radiusRatio,
        isErase ? '#000000' : selectedColor,
        isErase
      );
      ctx.restore();
    }
    onTapFeedback(isErase ? 'erase' : 'paint');
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    const pinch = pinchStickerRef.current;
    if (pinch && (e.pointerId === pinch.p1 || e.pointerId === pinch.p2)) {
      const pos1 = activePointersRef.current.get(pinch.p1);
      const pos2 = activePointersRef.current.get(pinch.p2);
      const el = stageRef.current;
      if (!pos1 || !pos2 || !el) return;

      const rect = el.getBoundingClientRect();
      const dx = pos2.clientX - pos1.clientX;
      const dy = pos2.clientY - pos1.clientY;
      const dist = Math.max(12, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const midX = (pos1.clientX + pos2.clientX) / 2;
      const midY = (pos1.clientY + pos2.clientY) / 2;

      const deltaNormX = (midX - pinch.startMidX) / Math.max(1, rect.width);
      const deltaNormY = (midY - pinch.startMidY) / Math.max(1, rect.height);
      const nextScale = Math.min(2.3, Math.max(0.45, pinch.baseScale * (dist / pinch.startDist)));
      const nextRotation = pinch.baseRotation + (angle - pinch.startAngle);

      onUpdateSticker(pinch.uid, {
        x: Math.min(0.84, Math.max(0.16, pinch.baseX + deltaNormX)),
        y: Math.min(0.92, Math.max(0.32, pinch.baseY + deltaNormY)),
        scale: nextScale,
        rotation: nextRotation,
      });
      return;
    }

    if (transformingStickerRef.current && transformingStickerRef.current.pointerId === e.pointerId) {
      const tr = transformingStickerRef.current;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dx = px - tr.centerX;
      const dy = py - tr.centerY;
      const dist = Math.max(18, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);

      const nextScale = Math.min(2.3, Math.max(0.45, tr.baseScale * (dist / tr.startDist)));
      const nextRotation = tr.baseRotation + (angle - tr.startAngle);
      onUpdateSticker(tr.uid, { scale: nextScale, rotation: nextRotation });
      return;
    }

    if (draggingStickerRef.current && draggingStickerRef.current.pointerId === e.pointerId) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      const nextX = Math.min(0.84, Math.max(0.16, pt.x - draggingStickerRef.current.offsetX));
      const nextY = Math.min(0.92, Math.max(0.32, pt.y - draggingStickerRef.current.offsetY));
      onUpdateSticker(draggingStickerRef.current.uid, { x: nextX, y: nextY });
      return;
    }

    const stroke = activeStrokeRef.current;
    if (!stroke || stroke.pointerId !== e.pointerId) return;

    const pt = getNormalizedPoint(e.clientX, e.clientY);
    setActiveCursor({
      x: pt.x,
      y: pt.y,
      active: true,
      pointerType: stroke.pointerType,
      mode: stroke.isErase ? 'eraser' : 'paint',
    });

    const prev = stroke.points[stroke.points.length - 1];
    if (Math.hypot(pt.x - prev.x, pt.y - prev.y) < 0.004) return;

    stroke.points.push(pt);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.save();
      ctx.clip(buildTShirtPath2D(canvas.width, canvas.height));
      drawStrokeSegment(
        ctx,
        prev,
        pt,
        canvas.width,
        canvas.height,
        stroke.radiusRatio,
        stroke.isErase ? '#000000' : stroke.color,
        stroke.isErase
      );
      ctx.restore();
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);

    if (
      pinchStickerRef.current &&
      (e.pointerId === pinchStickerRef.current.p1 || e.pointerId === pinchStickerRef.current.p2)
    ) {
      pinchStickerRef.current = null;
      return;
    }

    if (transformingStickerRef.current && transformingStickerRef.current.pointerId === e.pointerId) {
      transformingStickerRef.current = null;
      return;
    }

    if (draggingStickerRef.current && draggingStickerRef.current.pointerId === e.pointerId) {
      draggingStickerRef.current = null;
      return;
    }

    const stroke = activeStrokeRef.current;
    if (!stroke || stroke.pointerId !== e.pointerId) return;
    activeStrokeRef.current = null;
    setActiveCursor(null);

    const op: PaintOperation = stroke.isErase
      ? {
          kind: 'erase',
          id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          radiusRatio: stroke.radiusRatio,
          points: stroke.points,
        }
      : {
          kind: 'stroke',
          id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          color: stroke.color,
          radiusRatio: stroke.radiusRatio,
          points: stroke.points,
        };
    onAddPaintOp(op);
  };

  const handleStickerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    sticker: PlacedSticker
  ) => {
    if (toolMode === 'eraser') {
      e.stopPropagation();
      onRemoveSticker(sticker.uid);
      if (selectedStickerUid === sticker.uid) {
        onSelectStickerUid(null);
      }
      onTapFeedback('erase');
      return;
    }

    if (toolMode === 'sticker') {
      e.stopPropagation();
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      stageRef.current?.setPointerCapture(e.pointerId);

      if (activePointersRef.current.size === 2) {
        const targetSticker =
          stickers.find((s) => s.uid === draggingStickerRef.current?.uid) ?? sticker;
        onSelectStickerUid(targetSticker.uid);
        beginTwoFingerPinch(targetSticker);
        return;
      }

      onSelectStickerUid(sticker.uid);
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      draggingStickerRef.current = {
        uid: sticker.uid,
        pointerId: e.pointerId,
        offsetX: pt.x - sticker.x,
        offsetY: pt.y - sticker.y,
      };
    }
  };

  const handleTransformHandlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    sticker: PlacedSticker
  ) => {
    e.stopPropagation();
    const el = stageRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const centerX = sticker.x * rect.width;
    const centerY = sticker.y * rect.height;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    transformingStickerRef.current = {
      uid: sticker.uid,
      pointerId: e.pointerId,
      centerX,
      centerY,
      startDist: Math.max(18, Math.hypot(px - centerX, py - centerY)),
      startAngle: Math.atan2(py - centerY, px - centerX),
      baseScale: sticker.scale,
      baseRotation: sticker.rotation,
    };
  };

  const activeStickerDef = STICKERS.find((s) => s.id === selectedStickerId);
  const isDragOver = Boolean(activeDrag?.overStage);

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-0">
      {praiseBubble && (
        <div
          key={praiseBubble}
          className="animate-pop-in pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-30 bg-[#FFFBEB] border-2 border-[#F59E0B] text-[#78350F] px-4 py-1.5 rounded-2xl shadow-lg text-center max-w-[90%]"
        >
          <p className="font-display font-bold text-xs sm:text-base leading-snug whitespace-nowrap truncate">
            {praiseBubble}
          </p>
        </div>
      )}

      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        style={{ touchAction: 'none' }}
        className={`relative h-full w-auto max-w-full aspect-[3/4] max-h-full rounded-[24px] sm:rounded-[28px] bg-[#FAF8F4] border-4 shadow-[0_14px_40px_rgba(36,33,29,0.10)] overflow-hidden select-none cursor-crosshair transition-shadow ${
          isDragOver ? 'border-[#FF6B4A] ring-4 ring-[#FF6B4A]/35' : 'border-[#EAE4D7]'
        }`}
      >
        {/* Smiling character portrait badge above T-shirt collar */}
        <div
          style={{
            left: '50%',
            top: '14.7%',
            width: '28.3%',
            aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)',
            backgroundColor: character.accentBg,
          }}
          className="absolute rounded-full overflow-hidden border-4 border-white shadow-md pointer-events-none flex items-center justify-center z-10"
        >
          {!imageError ? (
            <IdleAvatar character={character} />
          ) : (
            <span className="font-display font-bold text-lg text-[#24211D]">
              {character.name.slice(0, 2)}
            </span>
          )}
        </div>

        {/* T-shirt base SVG */}
        <svg
          viewBox="0 0 480 640"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-label={`Футболка для: ${character.name}`}
        >
          <defs>
            <filter id="shirt-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#24211D" floodOpacity="0.11" />
            </filter>
          </defs>
          <path
            d={TSHIRT_SVG_PATH}
            fill={tshirtColor}
            stroke="rgba(36, 33, 29, 0.16)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="url(#shirt-shadow)"
          />
          {/* Subtle crew-neck ribbing */}
          <path
            d="M 174 185 Q 240 240 306 185"
            fill="none"
            stroke="rgba(36, 33, 29, 0.14)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Subtle sleeve seams */}
          <path
            d="M 112 196 L 116 314 M 368 196 L 364 314"
            fill="none"
            stroke="rgba(36, 33, 29, 0.08)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Paint canvas layer clipped inside T-shirt */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.92]"
        />

        {/* Interactive graphics / stickers layer */}
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <clipPath id="tshirt-clip" clipPathUnits="objectBoundingBox">
              <path d={TSHIRT_SVG_PATH} transform="scale(0.0020833 0.0015625)" />
            </clipPath>
          </defs>
        </svg>
        {/* Всё, что выходит за контур футболки, обрезается */}
        <div className="absolute inset-0 pointer-events-none z-20" style={{ clipPath: 'url(#tshirt-clip)' }}>
          {stickers.map((placed) => {
            const def = STICKERS.find((s) => s.id === placed.stickerId);
            if (!def) return null;
            const widthPct = def.baseWidthRatio * placed.scale * 100;
            const canInteract = toolMode === 'sticker' || toolMode === 'eraser';
            const isSelected = toolMode === 'sticker' && selectedStickerUid === placed.uid;

            return (
              <div
                key={placed.uid}
                onPointerDown={(e) => handleStickerPointerDown(e, placed)}
                style={{
                  left: `${placed.x * 100}%`,
                  top: `${placed.y * 100}%`,
                  width: `${widthPct}%`,
                  transform: `translate(-50%, -50%) rotate(${placed.rotation}rad)`,
                  pointerEvents: canInteract ? 'auto' : 'none',
                  touchAction: 'none',
                }}
                className={`absolute select-none ${
                  canInteract
                    ? toolMode === 'eraser'
                      ? 'cursor-pointer hover:scale-90 transition-transform'
                      : 'cursor-grab active:cursor-grabbing'
                    : ''
                } ${isSelected ? 'ring-3 ring-[#FF6B4A] ring-dashed rounded-2xl p-1 bg-white/25' : ''}`}
              >
                <img
                  src={getStickerAssetUrl(def.id, def.svg)}
                  alt={def.name}
                  draggable={false}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = '1';
                      img.src = stickerToDataUrl(def.svg);
                    }
                  }}
                  className="w-full h-auto drop-shadow-[0_3px_6px_rgba(0,0,0,0.16)] pointer-events-none"
                />

                {/* Direct drag handle to resize + rotate */}
                {isSelected && (
                  <button
                    type="button"
                    aria-label="Повернуть и изменить размер"
                    onPointerDown={(e) => handleTransformHandlePointerDown(e, placed)}
                    style={{ touchAction: 'none' }}
                    className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-[#FF6B4A] text-white border-2 border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Tool Visual Indicator under/above finger during direct touch/draw */}
        {activeCursor && activeCursor.active && !activeDrag && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: `${activeCursor.x * 100}%`,
              top: `${activeCursor.y * 100}%`,
              transform: `translate(-50%, ${activeCursor.pointerType === 'touch' ? '-100%' : '-55%'})`,
            }}
          >
            {activeCursor.mode === 'paint' && (
              <ColorPencilSvgIcon
                color={selectedColor}
                ringColor={
                  PAINT_COLORS.find((c) => c.hex === selectedColor)?.ringHex ?? '#64748B'
                }
                className="w-12 h-12 drop-shadow-lg"
              />
            )}
            {activeCursor.mode === 'eraser' && (
              <ArtToolSvgIcon tool="eraser" className="w-12 h-12 drop-shadow-lg" />
            )}
            {activeCursor.mode === 'stamp' && (
              <StampPreviewIcon
                stampId={selectedStamp}
                color={selectedColor}
                className="w-12 h-12 drop-shadow-lg animate-pop-in"
              />
            )}
            {activeCursor.mode === 'sticker' && activeStickerDef && (
              <img
                src={getStickerAssetUrl(activeStickerDef.id, activeStickerDef.svg)}
                alt={activeStickerDef.name}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = stickerToDataUrl(activeStickerDef.svg);
                  }
                }}
                className="w-14 h-14 object-contain drop-shadow-lg animate-pop-in"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
