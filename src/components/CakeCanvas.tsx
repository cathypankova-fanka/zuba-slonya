import React, { useEffect, useRef, useState } from 'react';
import { Wind } from 'lucide-react';
import {
  CAKE_CANDLES,
  CAKE_FLAVORS,
  CAKE_ROSETTES,
  CAKE_TOPPINGS,
  CakeCandleId,
  CakeFlavorId,
  CakeItemType,
  CakeRosetteId,
  CakeState,
  CakeToolTab,
  CakeToppingId,
  PlacedCakeItem,
} from '../data/kitchenData';
import { DraggableItemPayload } from '../types/drag';
import {
  CAKE_STAND_WEBP,
  getCakeBaseAssetUrl,
  getCakeCandleAssetUrl,
  getCakeRosetteAssetUrl,
  getCakeToppingAssetUrl,
} from '../utils/itemAssets';
import { soundEngine } from '../utils/soundEngine';

interface CakeCanvasProps {
  cake: CakeState;
  activeTab: CakeToolTab;
  selectedRosette: CakeRosetteId;
  selectedTopping: CakeToppingId;
  selectedCandle: CakeCandleId;
  soundEnabled: boolean;
  isCarryingDish: boolean;
  isCrumbsPhase: boolean;
  dropHandlerRef: React.MutableRefObject<
    ((item: DraggableItemPayload, clientX: number, clientY: number) => void) | null
  >;
  onSelectCakeBase: (cakeId: CakeFlavorId) => void;
  onAddCakeItem: (item: Omit<PlacedCakeItem, 'uid' | 't0'>) => void;
  onUpdateCakeItems: (items: PlacedCakeItem[], blown?: boolean) => void;
  onStartDishDrag: (e: React.PointerEvent<Element>) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CakeMask {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

interface SmokePuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  c: string;
  r: number;
  rot: number;
}

const STAGE_W = 680;
const STAGE_H = 640;
const STAND_W = 540;
const CAKE_W = 330;
const ITEM_SIZE = { rosette: 76, topping: 64, candleH: 108 };
const BIN = { x: 604, y: 556, r: 44 };
const CONF_COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#facc15'];

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function springEase(t: number) {
  const c = clamp(t, 0, 1);
  return 1 + 2.7 * Math.pow(c - 1, 3) + 1.7 * Math.pow(c - 1, 2);
}

export const CakeCanvas: React.FC<CakeCanvasProps> = ({
  cake,
  activeTab,
  selectedRosette,
  selectedTopping,
  selectedCandle,
  soundEnabled,
  isCarryingDish,
  isCrumbsPhase,
  dropHandlerRef,
  onSelectCakeBase,
  onAddCakeItem,
  onUpdateCakeItems,
  onStartDishDrag,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stageLayout, setStageLayout] = useState<{ w: number; h: number }>({
    w: 440,
    h: 414,
  });

  // Preloaded WebP assets
  const imgsRef = useRef<Record<string, HTMLImageElement>>({});
  const [assetsReadyTick, setAssetsReadyTick] = useState(0);

  // Geometry + hit mask for active cake flavor
  const standRectRef = useRef<Rect>({
    x: STAGE_W / 2 - STAND_W / 2,
    y: 626 - 293,
    w: STAND_W,
    h: 293,
  });
  const cakeRectRef = useRef<Rect>({
    x: STAGE_W / 2 - CAKE_W / 2,
    y: 150,
    w: CAKE_W,
    h: 311,
  });
  const cakeMaskRef = useRef<CakeMask | null>(null);

  // Visual animation state kept in refs for 60fps rendering
  const cakeBounceRef = useRef(0);
  const smokeRef = useRef<SmokePuff[]>([]);
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const smokedUidsRef = useRef<Set<string>>(new Set());
  const localItemsRef = useRef<PlacedCakeItem[]>(cake.items);
  const isLocalDraggingRef = useRef(false);

  // Interaction refs
  const activeDragItemRef = useRef<{
    uid: string;
    dx: number;
    dy: number;
  } | null>(null);
  const pendingTapOrDragRef = useRef<{
    uid: string;
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    pointerId: number;
  } | null>(null);
  const pendingTopPressRef = useRef<{
    sx: number;
    sy: number;
    clientStartY: number;
    pointerId: number;
    resolved: boolean;
  } | null>(null);
  const strokeRef = useRef<{ lx: number; ly: number; pointerId: number } | null>(null);
  const binHotRef = useRef(false);
  const blowTimerRef = useRef<number | null>(null);

  // Sync props into refs for RAF & event handlers
  const propsRef = useRef({
    cake,
    activeTab,
    selectedRosette,
    selectedTopping,
    selectedCandle,
    soundEnabled,
    isCrumbsPhase,
    onSelectCakeBase,
    onAddCakeItem,
    onUpdateCakeItems,
    onStartDishDrag,
  });
  propsRef.current = {
    cake,
    activeTab,
    selectedRosette,
    selectedTopping,
    selectedCandle,
    soundEnabled,
    isCrumbsPhase,
    onSelectCakeBase,
    onAddCakeItem,
    onUpdateCakeItems,
    onStartDishDrag,
  };

  if (!isLocalDraggingRef.current) {
    localItemsRef.current = cake.items;
  }

  // Fit 680x640 wrapper inside parent stage cleanly
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const updateSize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      const s = Math.min(w / STAGE_W, h / STAGE_H);
      setStageLayout({
        w: Math.max(180, Math.round(STAGE_W * s)),
        h: Math.max(170, Math.round(STAGE_H * s)),
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Preload all cake assets once
  useEffect(() => {
    let cancelled = false;
    const entries: Array<[string, string]> = [['stand', CAKE_STAND_WEBP]];
    CAKE_FLAVORS.forEach((f) => entries.push([`cake_${f.id}`, getCakeBaseAssetUrl(f.id)]));
    CAKE_ROSETTES.forEach((r) => entries.push([`ros_${r.id}`, getCakeRosetteAssetUrl(r.id)]));
    CAKE_TOPPINGS.forEach((t) => entries.push([`top_${t.id}`, getCakeToppingAssetUrl(t.id)]));
    CAKE_CANDLES.forEach((c) => entries.push([`can_${c.id}`, getCakeCandleAssetUrl(c.id)]));

    entries.forEach(([key, src]) => {
      if (imgsRef.current[key]) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        imgsRef.current[key] = img;
        setAssetsReadyTick((t) => t + 1);
      };
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Recompute stand/cake rects & pixel hit mask when stand or cake flavor image loads/changes
  useEffect(() => {
    const si = imgsRef.current.stand;
    if (si && si.naturalWidth > 0) {
      const sh = (si.naturalHeight * STAND_W) / si.naturalWidth;
      standRectRef.current = {
        x: STAGE_W / 2 - STAND_W / 2,
        y: 626 - sh,
        w: STAND_W,
        h: sh,
      };
    }

    const ci = imgsRef.current[`cake_${cake.cakeId}`];
    if (ci && ci.naturalWidth > 0) {
      const sr = standRectRef.current;
      const ch = (ci.naturalHeight * CAKE_W) / ci.naturalWidth;
      const baseY = sr.y + sr.h * 0.4;
      const cr: Rect = {
        x: STAGE_W / 2 - CAKE_W / 2,
        y: baseY - ch + 12,
        w: CAKE_W,
        h: ch,
      };
      cakeRectRef.current = cr;

      const oc = document.createElement('canvas');
      oc.width = Math.round(CAKE_W);
      oc.height = Math.round(ch);
      const octx = oc.getContext('2d', { willReadFrequently: true });
      if (octx) {
        octx.drawImage(ci, 0, 0, oc.width, oc.height);
        cakeMaskRef.current = {
          w: oc.width,
          h: oc.height,
          data: octx.getImageData(0, 0, oc.width, oc.height).data,
        };
      }
    }
  }, [cake.cakeId, assetsReadyTick]);

  // Clear timers & smoked tracking on reset
  useEffect(() => {
    if (cake.items.length === 0) {
      smokedUidsRef.current.clear();
    }
  }, [cake.items.length]);

  useEffect(() => {
    return () => {
      if (blowTimerRef.current) window.clearTimeout(blowTimerRef.current);
    };
  }, []);

  const onCake = (x: number, y: number): boolean => {
    const mask = cakeMaskRef.current;
    const cr = cakeRectRef.current;
    if (!mask) {
      return x >= cr.x && x <= cr.x + cr.w && y >= cr.y && y <= cr.y + cr.h;
    }
    const lx = Math.round(x - cr.x);
    const ly = Math.round(y - cr.y);
    return (
      lx >= 0 &&
      ly >= 0 &&
      lx < mask.w &&
      ly < mask.h &&
      mask.data[(ly * mask.w + lx) * 4 + 3] > 60
    );
  };

  const onTop = (x: number, y: number): boolean => {
    const cr = cakeRectRef.current;
    return onCake(x, y) && y < cr.y + cr.h * 0.42;
  };

  const clampToCakeSurface = (x: number, y: number, requireTop: boolean): { x: number; y: number } => {
    const cr = cakeRectRef.current;
    const check = requireTop ? onTop : onCake;
    if (check(x, y)) return { x, y };

    // Clamp toward cake top/center ellipsoid so dropping from toolbar feels forgiving for toddlers
    const targetCx = cr.x + cr.w * 0.5;
    const targetCy = requireTop ? cr.y + cr.h * 0.24 : cr.y + cr.h * 0.42;
    let cx = clamp(x, cr.x + 28, cr.x + cr.w - 28);
    let cy = requireTop
      ? clamp(y, cr.y + 18, cr.y + cr.h * 0.36)
      : clamp(y, cr.y + 20, cr.y + cr.h - 24);

    if (check(cx, cy)) return { x: cx, y: cy };

    // Step inward toward target center until pixel is on mask
    for (let step = 1; step <= 12; step++) {
      const t = step / 12;
      const sx = cx + (targetCx - cx) * t;
      const sy = cy + (targetCy - cy) * t;
      if (check(sx, sy)) return { x: sx, y: sy };
    }
    return { x: targetCx, y: targetCy };
  };

  const itemSize = (type: CakeItemType, id: string): { w: number; h: number } => {
    const prefix = type === 'rosette' ? 'ros_' : type === 'topping' ? 'top_' : 'can_';
    const im = imgsRef.current[prefix + id];
    if (!im || im.naturalWidth === 0) return { w: 40, h: 40 };
    if (type === 'candle') {
      const h = ITEM_SIZE.candleH;
      return { w: (im.naturalWidth * h) / im.naturalHeight, h };
    }
    const w = type === 'rosette' ? ITEM_SIZE.rosette : ITEM_SIZE.topping;
    return { w, h: (im.naturalHeight * w) / im.naturalWidth };
  };

  const anchorTopLeft = (type: CakeItemType, sz: { w: number; h: number }) =>
    type === 'topping' ? { x: -sz.w / 2, y: -sz.h / 2 } : { x: -sz.w / 2, y: -sz.h };

  const hitItem = (x: number, y: number, skipRosettes: boolean): PlacedCakeItem | null => {
    const list = localItemsRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i];
      if (skipRosettes && it.type === 'rosette') continue;
      const sz = itemSize(it.type, it.id);
      const a = anchorTopLeft(it.type, sz);
      if (
        x > it.x + a.x - 8 &&
        x < it.x + a.x + sz.w + 8 &&
        y > it.y + a.y - 8 &&
        y < it.y + a.y + sz.h + 8
      ) {
        return it;
      }
    }
    return null;
  };

  const toStage = (clientX: number, clientY: number) => {
    const cv = canvasRef.current;
    if (!cv) return { x: STAGE_W / 2, y: STAGE_H / 2 };
    const r = cv.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * STAGE_W,
      y: ((clientY - r.top) / r.height) * STAGE_H,
    };
  };

  // Expose drop handler from KitchenStage toolbar drags
  useEffect(() => {
    dropHandlerRef.current = (item: DraggableItemPayload, clientX: number, clientY: number) => {
      const {
        soundEnabled: snd,
        onSelectCakeBase: selectBase,
        onAddCakeItem: addCakeItem,
      } = propsRef.current;
      const p = toStage(clientX, clientY);

      if (item.kind === 'cake_base') {
        selectBase(item.cakeId);
        cakeBounceRef.current = 1;
        soundEngine.playTapPop(snd, 2);
        return;
      }

      if (item.kind === 'cake_rosette') {
        const pt = clampToCakeSurface(p.x, p.y, false);
        addCakeItem({
          type: 'rosette',
          id: item.rosetteId,
          x: pt.x,
          y: pt.y,
          rot: (Math.random() - 0.5) * 0.5,
          lit: false,
          out: 0,
          outAt: 0,
        });
        soundEngine.playCakeSquish(snd);
        return;
      }

      if (item.kind === 'cake_topping') {
        const pt = clampToCakeSurface(p.x, p.y, false);
        addCakeItem({
          type: 'topping',
          id: item.toppingId,
          x: pt.x,
          y: pt.y,
          rot: (Math.random() - 0.5) * 0.5,
          lit: false,
          out: 0,
          outAt: 0,
        });
        soundEngine.playCakePlace(snd);
        return;
      }

      if (item.kind === 'cake_candle') {
        const pt = clampToCakeSurface(p.x, p.y, true);
        addCakeItem({
          type: 'candle',
          id: item.candleId,
          x: pt.x,
          y: pt.y,
          rot: 0,
          lit: true,
          out: 0,
          outAt: 0,
        });
        soundEngine.playCakePlace(snd);
      }
    };

    return () => {
      dropHandlerRef.current = null;
    };
  }, [dropHandlerRef]);

  const runTabAction = (x: number, y: number, allowStroke: boolean, pointerId: number): boolean => {
    const {
      activeTab: tab,
      selectedRosette: rosId,
      selectedTopping: topId,
      selectedCandle: canId,
      soundEnabled: snd,
      onAddCakeItem: addCakeItem,
    } = propsRef.current;

    if (tab === 'pipe' && onCake(x, y)) {
      if (allowStroke) strokeRef.current = { lx: x, ly: y, pointerId };
      addCakeItem({
        type: 'rosette',
        id: rosId,
        x,
        y,
        rot: (Math.random() - 0.5) * 0.5,
        lit: false,
        out: 0,
        outAt: 0,
      });
      soundEngine.playCakeSquish(snd);
      return true;
    }

    if (tab === 'top' && onCake(x, y)) {
      addCakeItem({
        type: 'topping',
        id: topId,
        x,
        y,
        rot: (Math.random() - 0.5) * 0.5,
        lit: false,
        out: 0,
        outAt: 0,
      });
      soundEngine.playCakePlace(snd);
      return true;
    }

    if (tab === 'candle' && onTop(x, y)) {
      addCakeItem({
        type: 'candle',
        id: canId,
        x,
        y,
        rot: 0,
        lit: true,
        out: 0,
        outAt: 0,
      });
      soundEngine.playCakePlace(snd);
      return true;
    }

    if (onCake(x, y)) {
      cakeBounceRef.current = 1;
      soundEngine.playTapPop(snd, 3);
    }
    return false;
  };

  const handleBlowCandles = () => {
    const { cake: curCake, soundEnabled: snd, onUpdateCakeItems: updateItems } = propsRef.current;
    const lit = curCake.items.filter((i) => i.type === 'candle' && i.lit && !i.outAt);
    if (lit.length === 0) return;

    soundEngine.playCakeWhoosh(snd);
    const now = performance.now();
    const outAtMap = new Map<string, number>();
    lit.forEach((c, idx) => {
      outAtMap.set(c.uid, now + 120 + idx * 140);
    });

    const nextItems = curCake.items.map((it) => {
      const outAt = outAtMap.get(it.uid);
      return outAt ? { ...it, outAt } : it;
    });
    updateItems(nextItems, false);

    const lastOut = Math.max(...Array.from(outAtMap.values()));
    if (blowTimerRef.current) window.clearTimeout(blowTimerRef.current);
    blowTimerRef.current = window.setTimeout(() => {
      const latest = propsRef.current;
      const doneItems = latest.cake.items.map((it) =>
        it.type === 'candle' && it.outAt ? { ...it, lit: false, out: 1 } : it
      );
      latest.onUpdateCakeItems(doneItems, true);
      cakeBounceRef.current = 1;
      soundEngine.playCakeBirthdaySong(latest.soundEnabled);

      const cr = cakeRectRef.current;
      for (let i = 0; i < 65; i++) {
        confettiRef.current.push({
          x: STAGE_W / 2 + (Math.random() - 0.5) * 200,
          y: cr.y,
          vx: (Math.random() - 0.5) * 600,
          vy: -(220 + Math.random() * 400),
          life: 2 + Math.random() * 0.8,
          c: CONF_COLORS[i % CONF_COLORS.length],
          r: 3 + Math.random() * 5,
          rot: Math.random() * 6,
        });
      }
    }, lastOut - now + 450);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (propsRef.current.isCrumbsPhase) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();

    const p = toStage(e.clientX, e.clientY);

    // 1. Check if hitting an existing draggable topping or candle
    const hit = hitItem(p.x, p.y, true);
    if (hit) {
      e.currentTarget.setPointerCapture(e.pointerId);
      pendingTapOrDragRef.current = {
        uid: hit.uid,
        dx: hit.x - p.x,
        dy: hit.y - p.y,
        sx: p.x,
        sy: p.y,
        pointerId: e.pointerId,
      };
      return;
    }

    // 2. If pressing outside cake (e.g. stand or air) OR in cake flavor tab -> carry cake to feed
    if (!onCake(p.x, p.y) || propsRef.current.activeTab === 'cake') {
      if (onCake(p.x, p.y)) {
        cakeBounceRef.current = 1;
        soundEngine.playTapPop(propsRef.current.soundEnabled, 3);
      }
      propsRef.current.onStartDishDrag(e);
      return;
    }

    // 3. In pipe tab on cake -> start cream piping stroke
    if (propsRef.current.activeTab === 'pipe') {
      e.currentTarget.setPointerCapture(e.pointerId);
      runTabAction(p.x, p.y, true, e.pointerId);
      return;
    }

    // 4. In top / candle tab on cake -> defer tap until pointerup unless child drags toward character avatar
    e.currentTarget.setPointerCapture(e.pointerId);
    pendingTopPressRef.current = {
      sx: p.x,
      sy: p.y,
      clientStartY: e.clientY,
      pointerId: e.pointerId,
      resolved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toStage(e.clientX, e.clientY);

    // Promote hit item to free drag if moved > 10px
    const pend = pendingTapOrDragRef.current;
    if (pend && pend.pointerId === e.pointerId && !activeDragItemRef.current) {
      if (Math.hypot(p.x - pend.sx, p.y - pend.sy) > 10) {
        const list = [...localItemsRef.current];
        const idx = list.findIndex((i) => i.uid === pend.uid);
        if (idx >= 0) {
          const [moved] = list.splice(idx, 1);
          list.push({ ...moved, t0: performance.now() });
          localItemsRef.current = list;
        }
        isLocalDraggingRef.current = true;
        activeDragItemRef.current = { uid: pend.uid, dx: pend.dx, dy: pend.dy };
        pendingTapOrDragRef.current = null;
        soundEngine.playTapPop(propsRef.current.soundEnabled, 4);
      }
    }

    // Move dragged cake item & update trash bin hover
    const dragItem = activeDragItemRef.current;
    if (dragItem) {
      localItemsRef.current = localItemsRef.current.map((it) =>
        it.uid === dragItem.uid ? { ...it, x: p.x + dragItem.dx, y: p.y + dragItem.dy } : it
      );
      binHotRef.current = Math.hypot(p.x - BIN.x, p.y - BIN.y) < BIN.r + 20;
      return;
    }

    // If holding in top/candle mode and dragging upward off cake toward avatar -> carry cake!
    const topPress = pendingTopPressRef.current;
    if (topPress && topPress.pointerId === e.pointerId && !topPress.resolved) {
      const dist = Math.hypot(p.x - topPress.sx, p.y - topPress.sy);
      if (dist > 18 && (p.y < 55 || !onCake(p.x, p.y))) {
        topPress.resolved = true;
        pendingTopPressRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        propsRef.current.onStartDishDrag(e);
        return;
      }
    }

    // Cream piping continuous stroke
    const stroke = strokeRef.current;
    if (stroke && stroke.pointerId === e.pointerId && onCake(p.x, p.y)) {
      const d = Math.hypot(p.x - stroke.lx, p.y - stroke.ly);
      if (d > 30) {
        const n = Math.floor(d / 30);
        for (let i = 1; i <= n; i++) {
          const t = (i * 30) / d;
          propsRef.current.onAddCakeItem({
            type: 'rosette',
            id: propsRef.current.selectedRosette,
            x: stroke.lx + (p.x - stroke.lx) * t,
            y: stroke.ly + (p.y - stroke.ly) * t,
            rot: (Math.random() - 0.5) * 0.5,
            lit: false,
            out: 0,
            outAt: 0,
          });
        }
        stroke.lx = p.x;
        stroke.ly = p.y;
        soundEngine.playCakeSquish(propsRef.current.soundEnabled);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toStage(e.clientX, e.clientY);

    const pend = pendingTapOrDragRef.current;
    if (pend && pend.pointerId === e.pointerId) {
      pendingTapOrDragRef.current = null;
      runTabAction(pend.sx, pend.sy, false, e.pointerId);
    }

    const topPress = pendingTopPressRef.current;
    if (topPress && topPress.pointerId === e.pointerId) {
      pendingTopPressRef.current = null;
      if (!topPress.resolved) {
        runTabAction(topPress.sx, topPress.sy, false, e.pointerId);
      }
    }

    const dragItem = activeDragItemRef.current;
    if (dragItem) {
      const inBin = Math.hypot(p.x - BIN.x, p.y - BIN.y) < BIN.r + 20;
      let nextList = localItemsRef.current;
      if (inBin) {
        nextList = nextList.filter((i) => i.uid !== dragItem.uid);
        soundEngine.playEraseSwoosh(propsRef.current.soundEnabled);
      } else {
        nextList = nextList.map((i) =>
          i.uid === dragItem.uid && i.type === 'candle' ? { ...i, t0: performance.now() } : i
        );
      }
      isLocalDraggingRef.current = false;
      activeDragItemRef.current = null;
      binHotRef.current = false;
      propsRef.current.onUpdateCakeItems(nextList);
    }

    if (strokeRef.current?.pointerId === e.pointerId) {
      strokeRef.current = null;
    }
  };

  // 60fps Canvas Draw Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const drawFlame = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      t: number,
      out: number
    ) => {
      const s = 1 - out;
      if (s <= 0.02) return;
      const fl = 1 + Math.sin(t * 14 + x) * 0.08 + Math.sin(t * 23 + x * 2) * 0.05;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s * fl);

      const g = ctx.createRadialGradient(0, -14, 1, 0, -14, 34);
      g.addColorStop(0, 'rgba(255,230,120,.55)');
      g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -14, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.bezierCurveTo(13, -19, 11, -2, 0, 0);
      ctx.bezierCurveTo(-11, -2, -13, -19, 0, -36);
      const fg = ctx.createLinearGradient(0, -36, 0, 0);
      fg.addColorStop(0, '#fde047');
      fg.addColorStop(0.6, '#fb923c');
      fg.addColorStop(1, '#ef4444');
      ctx.fillStyle = fg;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.bezierCurveTo(5.5, -13, 4.5, -3, 0, -1);
      ctx.bezierCurveTo(-4.5, -3, -5.5, -13, 0, -22);
      ctx.fillStyle = '#fff7c2';
      ctx.fill();

      ctx.restore();
    };

    const frame = (now: number) => {
      const cv = canvasRef.current;
      if (!cv) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      const ctx = cv.getContext('2d');
      if (!ctx) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now / 1000;

      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);

      // Soft kitchen table
      const tg = ctx.createLinearGradient(0, 520, 0, STAGE_H);
      tg.addColorStop(0, '#FDE68A');
      tg.addColorStop(1, '#FBBF24');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.roundRect(12, 578, STAGE_W - 24, 54, 24);
      ctx.fill();

      const imgs = imgsRef.current;
      const sr = standRectRef.current;
      const cr = cakeRectRef.current;

      if (imgs.stand) {
        ctx.fillStyle = 'rgba(120,70,20,.16)';
        ctx.beginPath();
        ctx.ellipse(STAGE_W / 2, 608, 210, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(imgs.stand, sr.x, sr.y, sr.w, sr.h);
      }

      if (propsRef.current.isCrumbsPhase) {
        // Empty plate with sweet cake crumbs
        const cy = sr.y + sr.h * 0.3;
        ctx.fillStyle = 'rgba(244, 114, 182, 0.38)';
        ctx.beginPath();
        ctx.ellipse(STAGE_W / 2 - 26, cy, 42, 12, -0.1, 0, Math.PI * 2);
        ctx.fill();

        const crumbs = [
          [-64, -8, 5, '#D97706'],
          [-18, 10, 6, '#F472B6'],
          [32, -4, 5, '#D97706'],
          [66, 8, 4.5, '#92400E'],
          [-44, 14, 4, '#B45309'],
          [8, -14, 4, '#FDE047'],
          [48, -12, 3.5, '#F472B6'],
        ] as const;
        for (const [ox, oy, rad, col] of crumbs) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(STAGE_W / 2 + ox, cy + oy, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        rafId = requestAnimationFrame(frame);
        return;
      }

      // Cake bounce
      cakeBounceRef.current = Math.max(0, cakeBounceRef.current - dt * 1.6);
      const b = cakeBounceRef.current;
      const bs = 1 + Math.sin(b * Math.PI * 3) * 0.06 * b;
      const cx = cr.x + cr.w / 2;
      const cb = cr.y + cr.h - 12;

      const cakeImg = imgs[`cake_${propsRef.current.cake.cakeId}`];
      if (cakeImg) {
        ctx.save();
        ctx.translate(cx, cb);
        ctx.scale(1 / bs, bs);
        ctx.translate(-cx, -cb);
        ctx.drawImage(cakeImg, cr.x, cr.y, cr.w, cr.h);

        // Depth-sorted items on cake
        const order = localItemsRef.current.slice().sort((a, bItem) => a.y - bItem.y);
        for (const it of order) {
          const sz = itemSize(it.type, it.id);
          const a = anchorTopLeft(it.type, sz);
          const k = springEase((now - it.t0) / 320);
          const prefix = it.type === 'rosette' ? 'ros_' : it.type === 'topping' ? 'top_' : 'can_';
          const im = imgs[prefix + it.id];
          if (!im) continue;

          const grabbed = activeDragItemRef.current?.uid === it.uid;
          ctx.save();
          ctx.translate(it.x, it.y - (grabbed ? 10 : 0));
          ctx.rotate(it.rot);
          ctx.scale(k * (grabbed ? 1.1 : 1), k * (grabbed ? 1.1 : 1));
          if (grabbed) {
            ctx.shadowColor = 'rgba(0,0,0,.3)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 8;
          }
          ctx.drawImage(im, a.x, a.y, sz.w, sz.h);
          ctx.restore();

          if (it.type === 'candle') {
            let outVal = it.out;
            let litVal = it.lit;
            if (it.outAt && now >= it.outAt && it.lit) {
              outVal = clamp((now - it.outAt) / 350, 0, 1);
              if (!smokedUidsRef.current.has(it.uid)) {
                smokedUidsRef.current.add(it.uid);
                for (let i = 0; i < 7; i++) {
                  smokeRef.current.push({
                    x: it.x + (Math.random() - 0.5) * 6,
                    y: it.y - sz.h - 6,
                    vx: (Math.random() - 0.5) * 14,
                    vy: -(30 + Math.random() * 30),
                    life: 1.3 + Math.random() * 0.6,
                    r: 5 + Math.random() * 5,
                  });
                }
              }
              if (outVal >= 1) litVal = false;
            }
            if (litVal || outVal < 1) {
              drawFlame(ctx, it.x, it.y - sz.h * k + 4, t, outVal);
            }
          }
        }

        ctx.restore();
      }

      // Rising candle smoke puffs
      const smoke = smokeRef.current;
      for (let i = smoke.length - 1; i >= 0; i--) {
        const s = smoke[i];
        s.life -= dt;
        if (s.life <= 0) {
          smoke.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.r += dt * 8;
        ctx.fillStyle = `rgba(180,180,190,${clamp(s.life / 1.6, 0, 1) * 0.45})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Confetti when candles are blown out
      const conf = confettiRef.current;
      for (let i = conf.length - 1; i >= 0; i--) {
        const p = conf[i];
        p.life -= dt;
        if (p.life <= 0) {
          conf.splice(i, 1);
          continue;
        }
        p.vy += 560 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.99;
        p.rot += dt * 8;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = clamp(p.life * 2, 0, 1);
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      }

      // Red trash circle when dragging an item on the cake
      if (activeDragItemRef.current) {
        const hot = binHotRef.current;
        ctx.save();
        ctx.translate(BIN.x, BIN.y);
        ctx.scale(hot ? 1.25 : 1, hot ? 1.25 : 1);
        ctx.fillStyle = hot ? '#ef4444' : 'rgba(239,68,68,.78)';
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-16, -11);
        ctx.lineTo(16, -11);
        ctx.moveTo(-5.5, -11);
        ctx.lineTo(-5.5, -18);
        ctx.lineTo(5.5, -18);
        ctx.lineTo(5.5, -11);
        ctx.moveTo(-13, -11);
        ctx.lineTo(-10, 18);
        ctx.lineTo(10, 18);
        ctx.lineTo(13, -11);
        ctx.stroke();
        ctx.restore();
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const hasLitCandles =
    !isCrumbsPhase && cake.items.some((i) => i.type === 'candle' && i.lit && !i.outAt);

  return (
    <div
      ref={hostRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none transition-opacity duration-150 ${
        isCarryingDish ? 'opacity-35' : ''
      }`}
    >
      <div
        className="relative shrink-0"
        style={{
          width: `${stageLayout.w}px`,
          height: `${stageLayout.h}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={STAGE_W * 2}
          height={STAGE_H * 2}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className="w-full h-full block cursor-pointer"
        />

        {hasLitCandles && (
          <button
            type="button"
            onClick={handleBlowCandles}
            aria-label="Задуть свечи"
            title="Задуть свечи"
            className="absolute right-2.5 bottom-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#38BDF8] hover:bg-[#0EA5E9] active:scale-95 text-white flex items-center justify-center shadow-[0_5px_0_#0369A1] animate-pulse cursor-pointer z-10 border-2 border-white"
          >
            <Wind className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.6]" />
          </button>
        )}
      </div>
    </div>
  );
};
