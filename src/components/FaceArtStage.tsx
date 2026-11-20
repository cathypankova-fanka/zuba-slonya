import React, { useEffect, useRef, useState } from 'react';
import { PAINT_COLORS, PatternStampId, STICKERS, stickerToDataUrl } from '../data/artTools';
import { CharacterItem } from '../data/characters';
import { FACE_ART_MASKS, faceArtMaskToDataUrl } from '../data/faceArtMasks';
import { DraggableItemPayload } from '../types/drag';
import {
  drawStrokeSegment,
  NormalizedPoint,
  PaintOperation,
  PlacedFaceArtMask,
  PlacedSticker,
  renderPaintOperations,
} from '../utils/canvasRender';
import { getFaceMaskAssetUrl, getStickerAssetUrl } from '../utils/itemAssets';
import { useDragContext } from './DragContext';
import { ArtToolSvgIcon, ColorPencilSvgIcon } from './KitchenIllustrations';
import { StampPreviewIcon } from './StampPreviewIcon';

export type ToolMode = 'paint' | 'mask' | 'stamp' | 'sticker' | 'eraser';

interface FaceArtStageProps {
  character: CharacterItem;
  toolMode: ToolMode;
  selectedColor: string;
  brushSize: 'medium' | 'large';
  selectedStamp: PatternStampId;
  selectedStickerId: string;
  faceArtMask: PlacedFaceArtMask | null;
  paintOps: PaintOperation[];
  stickers: PlacedSticker[];
  praiseBubble: string | null;
  onSelectToolMode: (mode: ToolMode) => void;
  onSelectColor: (hex: string) => void;
  onSelectStamp: (stampId: PatternStampId) => void;
  onSelectSticker: (stickerId: string) => void;
  onSelectFaceArtMask: (maskId: string | null, dropPoint?: { x: number; y: number }) => void;
  onAddPaintOp: (op: PaintOperation) => void;
  onAddSticker: (sticker: PlacedSticker) => void;
  onUpdateSticker: (
    uid: string,
    patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'scale' | 'rotation'>>
  ) => void;
  onRemoveSticker: (uid: string) => void;
  onUpdateFaceArtMask: (patch: Partial<PlacedFaceArtMask>) => void;
  onTapFeedback: (kind: 'paint' | 'stamp' | 'sticker' | 'erase') => void;
}

interface PointerPos {
  clientX: number;
  clientY: number;
}

interface PinchTargetState {
  kind: 'sticker' | 'mask';
  uid?: string;
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
}

export const FaceArtStage: React.FC<FaceArtStageProps> = ({
  character,
  toolMode,
  selectedColor,
  brushSize,
  selectedStamp,
  selectedStickerId,
  faceArtMask,
  paintOps,
  stickers,
  praiseBubble,
  onSelectToolMode,
  onSelectColor,
  onSelectStamp,
  onSelectSticker,
  onSelectFaceArtMask,
  onAddPaintOp,
  onAddSticker,
  onUpdateSticker,
  onRemoveSticker,
  onUpdateFaceArtMask,
  onTapFeedback,
}) => {
  const { activeDrag, registerStageDropHandler } = useDragContext();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 480,
    height: 640,
  });

  const activePointersRef = useRef<Map<number, PointerPos>>(new Map());

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

  const draggingMaskRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const pinchRef = useRef<PinchTargetState | null>(null);

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

  // Keep canvas pixel dimensions crisp on resize / DPR
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

  // Redraw paint operations whenever paintOps or canvas size changes
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
    renderPaintOperations(ctx, paintOps, pixelW, pixelH);
  }, [paintOps, stageSize]);

  const getNormalizedPoint = (clientX: number, clientY: number): NormalizedPoint => {
    const el = stageRef.current;
    if (!el) return { x: 0.5, y: 0.5 };
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  // Register Drag-from-Toolbar Drop & Continuous Paint Handler
  const latestRef = useRef({
    toolMode,
    selectedColor,
    brushSize,
    selectedStamp,
    selectedStickerId,
    onSelectToolMode,
    onSelectColor,
    onSelectStamp,
    onSelectSticker,
    onSelectFaceArtMask,
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
    onSelectToolMode,
    onSelectColor,
    onSelectStamp,
    onSelectSticker,
    onSelectFaceArtMask,
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
            drawStrokeSegment(ctx, pt, pt, canvas.width, canvas.height, radiusRatio, item.hex, false);
          }
          latest.onTapFeedback('paint');
        } else if (item.kind === 'art_tool') {
          latest.onSelectToolMode(item.tool);
          if (item.tool === 'paint' || item.tool === 'eraser') {
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
        }
      },
      onDragDrop: (item: DraggableItemPayload, clientX, clientY) => {
        const latest = latestRef.current;
        const pt = getNormalizedPoint(clientX, clientY);

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
          latest.onAddSticker({
            uid: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            stickerId: item.stickerId,
            x: pt.x,
            y: pt.y,
            scale: latest.brushSize === 'large' ? 1.15 : 0.92,
            rotation: (Math.random() - 0.5) * 0.14,
          });
          latest.onTapFeedback('sticker');
          return;
        }

        if (item.kind === 'face_mask') {
          latest.onSelectToolMode('mask');
          latest.onSelectFaceArtMask(item.maskId, {
            x: Math.min(0.85, Math.max(0.15, pt.x)),
            y: Math.min(0.85, Math.max(0.15, pt.y)),
          });
          return;
        }

        if (item.kind === 'art_tool') {
          latest.onSelectToolMode(item.tool);
          if (item.tool === 'stamp') {
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
            latest.onAddSticker({
              uid: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              stickerId: latest.selectedStickerId,
              x: pt.x,
              y: pt.y,
              scale: latest.brushSize === 'large' ? 1.15 : 0.92,
              rotation: (Math.random() - 0.5) * 0.14,
            });
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

  const beginTwoFingerPinch = (
    kind: 'sticker' | 'mask',
    uid: string | undefined,
    baseX: number,
    baseY: number,
    baseScale: number,
    baseRotation: number
  ) => {
    const entries = Array.from(activePointersRef.current.entries());
    if (entries.length < 2) return;
    const [[p1, pos1], [p2, pos2]] = entries;
    const dx = pos2.clientX - pos1.clientX;
    const dy = pos2.clientY - pos1.clientY;
    pinchRef.current = {
      kind,
      uid,
      p1,
      p2,
      startDist: Math.max(12, Math.hypot(dx, dy)),
      startAngle: Math.atan2(dy, dx),
      startMidX: (pos1.clientX + pos2.clientX) / 2,
      startMidY: (pos1.clientY + pos2.clientY) / 2,
      baseX,
      baseY,
      baseScale,
      baseRotation,
    };
    draggingStickerRef.current = null;
    draggingMaskRef.current = null;
    activeStrokeRef.current = null;
    setActiveCursor(null);
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    if (draggingStickerRef.current && activePointersRef.current.size === 2) {
      const stk = stickers.find((s) => s.uid === draggingStickerRef.current?.uid);
      if (stk) {
        stageRef.current?.setPointerCapture(e.pointerId);
        beginTwoFingerPinch('sticker', stk.uid, stk.x, stk.y, stk.scale, stk.rotation);
      }
      return;
    }

    if (draggingMaskRef.current && faceArtMask && activePointersRef.current.size === 2) {
      stageRef.current?.setPointerCapture(e.pointerId);
      beginTwoFingerPinch(
        'mask',
        undefined,
        faceArtMask.x,
        faceArtMask.y,
        faceArtMask.scale,
        faceArtMask.rotation
      );
      return;
    }

    if (pinchRef.current || draggingStickerRef.current || draggingMaskRef.current) return;

    const pt = getNormalizedPoint(e.clientX, e.clientY);

    if (toolMode === 'mask') {
      if (faceArtMask) {
        e.currentTarget.setPointerCapture(e.pointerId);
        draggingMaskRef.current = {
          pointerId: e.pointerId,
          offsetX: pt.x - faceArtMask.x,
          offsetY: pt.y - faceArtMask.y,
        };
      }
      return;
    }

    if (toolMode === 'stamp') {
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
        scale: brushSize === 'large' ? 1.15 : 0.92,
        rotation: (Math.random() - 0.5) * 0.14,
      });
      onTapFeedback('sticker');
      return;
    }

    // Paint or Eraser continuous stroke
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
    }
    onTapFeedback(isErase ? 'erase' : 'paint');
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    const pinch = pinchRef.current;
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
      const scaleFactor = dist / pinch.startDist;
      const nextRotation = pinch.baseRotation + (angle - pinch.startAngle);

      if (pinch.kind === 'sticker' && pinch.uid) {
        onUpdateSticker(pinch.uid, {
          x: Math.min(0.95, Math.max(0.05, pinch.baseX + deltaNormX)),
          y: Math.min(0.95, Math.max(0.05, pinch.baseY + deltaNormY)),
          scale: Math.min(2.6, Math.max(0.35, pinch.baseScale * scaleFactor)),
          rotation: nextRotation,
        });
      } else if (pinch.kind === 'mask') {
        onUpdateFaceArtMask({
          x: Math.min(0.85, Math.max(0.15, pinch.baseX + deltaNormX)),
          y: Math.min(0.85, Math.max(0.15, pinch.baseY + deltaNormY)),
          scale: Math.min(1.6, Math.max(0.45, pinch.baseScale * scaleFactor)),
          rotation: nextRotation,
        });
      }
      return;
    }

    if (draggingMaskRef.current && draggingMaskRef.current.pointerId === e.pointerId) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      const nextX = Math.min(0.85, Math.max(0.15, pt.x - draggingMaskRef.current.offsetX));
      const nextY = Math.min(0.85, Math.max(0.15, pt.y - draggingMaskRef.current.offsetY));
      onUpdateFaceArtMask({ x: nextX, y: nextY });
      return;
    }

    if (draggingStickerRef.current && draggingStickerRef.current.pointerId === e.pointerId) {
      const pt = getNormalizedPoint(e.clientX, e.clientY);
      const nextX = Math.min(0.95, Math.max(0.05, pt.x - draggingStickerRef.current.offsetX));
      const nextY = Math.min(0.95, Math.max(0.05, pt.y - draggingStickerRef.current.offsetY));
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
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);

    if (
      pinchRef.current &&
      (e.pointerId === pinchRef.current.p1 || e.pointerId === pinchRef.current.p2)
    ) {
      pinchRef.current = null;
      return;
    }

    if (draggingMaskRef.current && draggingMaskRef.current.pointerId === e.pointerId) {
      draggingMaskRef.current = null;
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
        beginTwoFingerPinch(
          'sticker',
          targetSticker.uid,
          targetSticker.x,
          targetSticker.y,
          targetSticker.scale,
          targetSticker.rotation
        );
        return;
      }

      const pt = getNormalizedPoint(e.clientX, e.clientY);
      draggingStickerRef.current = {
        uid: sticker.uid,
        pointerId: e.pointerId,
        offsetX: pt.x - sticker.x,
        offsetY: pt.y - sticker.y,
      };
    }
  };

  const activeMaskDef = faceArtMask
    ? FACE_ART_MASKS.find((m) => m.id === faceArtMask.maskId) ?? null
    : null;
  const activeStickerDef = STICKERS.find((s) => s.id === selectedStickerId);
  const isDragOver = Boolean(activeDrag?.overStage);

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-0">
      {/* Praise speech bubble anchored gently at top of portrait */}
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

      {/* 3:4 Portrait Stage */}
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        style={{ touchAction: 'none' }}
        className={`relative h-full w-auto max-w-full aspect-[3/4] max-h-full rounded-[24px] sm:rounded-[28px] bg-white border-4 shadow-[0_14px_40px_rgba(36,33,29,0.10)] overflow-hidden select-none transition-shadow ${
          isDragOver ? 'border-[#FF6B4A] ring-4 ring-[#FF6B4A]/35' : 'border-[#EAE4D7]'
        } ${toolMode === 'mask' && faceArtMask ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      >
        {/* Base character portrait */}
        {!imageError ? (
          <img
            src={character.imageSrc}
            alt={character.name}
            draggable={false}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
            style={{ backgroundColor: character.accentBg }}
          >
            <span className="font-display text-2xl font-bold text-[#24211D]">
              {character.name}
            </span>
          </div>
        )}

        {/* Full Face-Art Mask (Аквагрим) overlay */}
        {faceArtMask && activeMaskDef && (
          <div
            style={{
              left: `${faceArtMask.x * 100}%`,
              top: `${faceArtMask.y * 100}%`,
              width: `${activeMaskDef.baseWidthRatio * faceArtMask.scale * 100}%`,
              transform: `translate(-50%, -50%) rotate(${faceArtMask.rotation}rad)`,
              opacity: 0.92,
            }}
            className={`absolute pointer-events-none select-none ${
              toolMode === 'mask' ? 'ring-2 ring-dashed ring-[#FF6B4A]/70 rounded-3xl' : ''
            }`}
          >
            <img
              src={getFaceMaskAssetUrl(activeMaskDef.id, activeMaskDef.svg)}
              alt={activeMaskDef.name}
              draggable={false}
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = faceArtMaskToDataUrl(activeMaskDef.svg);
                }
              }}
              className="w-full h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.14)] pointer-events-none"
            />
          </div>
        )}

        {/* Paint canvas layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.86]"
        />

        {/* Interactive sticker layer */}
        <div className="absolute inset-0 pointer-events-none">
          {stickers.map((placed) => {
            const def = STICKERS.find((s) => s.id === placed.stickerId);
            if (!def) return null;
            const widthPct = def.baseWidthRatio * placed.scale * 100;
            const canInteract = toolMode === 'sticker' || toolMode === 'eraser';

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
                }`}
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
              </div>
            );
          })}
        </div>

        {/* Active Tool Visual Indicator under/above finger during direct touch/draw */}
        {activeCursor && activeCursor.active && !activeDrag && (
          <div
            className="absolute pointer-events-none z-20"
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
