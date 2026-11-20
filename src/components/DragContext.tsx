import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { stickerToDataUrl } from '../data/artTools';
import { faceArtMaskToDataUrl } from '../data/faceArtMasks';
import {
  DraggableItemPayload,
  FeedDropTarget,
  StageDropHandler,
} from '../types/drag';
import {
  ArtToolSvgIcon,
  ColorPencilSvgIcon,
  DrinkAddonSvgIcon,
  DrinkCategorySvgIcon,
  DrinkFlavorCupSvgIcon,
  IceCreamBaseSvgIcon,
  IceCreamGarnishSvgIcon,
  IceCreamScoopSvgIcon,
  IceCreamSyrupBottleSvgIcon,
  MessPresetSvg,
  PizzaCheeseSvgIcon,
  PizzaCutterSvgIcon,
  PizzaOvenSvgIcon,
  PizzaSauceSvgIcon,
  PizzaToppingSvgIcon,
  SandwichBreadSvgIcon,
  SandwichFillingSvgIcon,
  SandwichSpreadSvgIcon,
  SandwichTopBreadSvgIcon,
  SoupBrothSvgIcon,
  SoupIngredientSvgIcon,
  SoupPotToggleSvgIcon,
  StirSpoonSvgIcon,
  TShirtColorSvgIcon,
  WashToolSvg,
} from './KitchenIllustrations';
import { StampPreviewIcon } from './StampPreviewIcon';
import {
  getCakeBaseAssetUrl,
  getCakeCandleAssetUrl,
  getCakeRosetteAssetUrl,
  getCakeToppingAssetUrl,
  getDrinkRecipeAssetUrl,
  getFaceMaskAssetUrl,
  getIceCreamBaseAssetUrl,
  getIceCreamFlavorAssetUrl,
  getPizzaSauceAssetUrl,
  getSandwichBreadAssetUrl,
  getSandwichFillingAssetUrl,
  getSoupBaseAssetUrl,
  getStickerAssetUrl,
  PIZZA_CHEESE_LAYER_PNG,
  PIZZA_DOUGH_PNG,
  SOUP_POT_PNG,
} from '../utils/itemAssets';

export interface ActiveDragState {
  item: DraggableItemPayload;
  clientX: number;
  clientY: number;
  pointerType: string;
  overStage: boolean;
  overFeedTargetId: string | null;
}

interface DragContextValue {
  activeDrag: ActiveDragState | null;
  registerStageDropHandler: (handler: StageDropHandler | null) => void;
  registerFeedTarget: (id: string, target: FeedDropTarget | null) => void;
  startDrag: (
    item: DraggableItemPayload,
    clientX: number,
    clientY: number,
    pointerType: string,
    pointerId: number
  ) => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export const useDragContext = () => {
  const ctx = useContext(DragContext);
  if (!ctx) {
    throw new Error('useDragContext must be used inside DragProvider');
  }
  return ctx;
};

const DragPreviewVisual: React.FC<{ item: DraggableItemPayload }> = ({ item }) => {
  switch (item.kind) {
    case 'wash_tool':
      return (
        <div className="relative">
          {item.tool === 'dryer' && (
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
          <WashToolSvg tool={item.tool} className="w-16 h-16 drop-shadow-xl" />
        </div>
      );
    case 'mess_preset':
      return <MessPresetSvg messType={item.messType} className="w-14 h-14 drop-shadow-xl" />;
    case 'art_tool':
      return <ArtToolSvgIcon tool={item.tool} className="w-14 h-14 drop-shadow-xl" />;
    case 'paint_color':
      return <ColorPencilSvgIcon color={item.hex} ringColor={item.ringHex} className="w-16 h-16 drop-shadow-xl" />;
    case 'tshirt_color':
      return <TShirtColorSvgIcon color={item.hex} ringColor={item.ringHex} className="w-16 h-16 drop-shadow-xl" />;
    case 'face_mask':
      return (
        <div
          className="w-16 h-16 rounded-2xl p-1.5 border-2 border-white shadow-xl flex items-center justify-center"
          style={{ backgroundColor: item.previewBg }}
        >
          <img
            src={getFaceMaskAssetUrl(item.maskId, item.svg)}
            alt={item.label}
            onError={(e) => {
              e.currentTarget.src = faceArtMaskToDataUrl(item.svg);
            }}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      );
    case 'stamp':
      return <StampPreviewIcon stampId={item.stampId} color={item.color} className="w-14 h-14 drop-shadow-xl" />;
    case 'sticker':
      return (
        <img
          src={getStickerAssetUrl(item.stickerId, item.svg)}
          alt={item.label}
          onError={(e) => {
            e.currentTarget.src = stickerToDataUrl(item.svg);
          }}
          className="w-16 h-16 object-contain drop-shadow-xl pointer-events-none"
        />
      );
    case 'pizza_sauce':
      return (
        <PizzaSauceSvgIcon
          sauceId={item.sauceId}
          color={item.color}
          ringColor={item.ringColor}
          className="w-14 h-14 drop-shadow-xl"
        />
      );
    case 'pizza_cheese':
      return <PizzaCheeseSvgIcon className="w-14 h-14 drop-shadow-xl" />;
    case 'pizza_oven':
      return <PizzaOvenSvgIcon baked={item.baked} className="w-14 h-14 drop-shadow-xl" />;
    case 'pizza_cutter':
      return <PizzaCutterSvgIcon className="w-14 h-14 drop-shadow-xl" />;
    case 'pizza_topping':
      return <PizzaToppingSvgIcon id={item.toppingId} className="w-14 h-14 drop-shadow-xl" />;
    case 'icecream_base':
      return <IceCreamBaseSvgIcon id={item.baseId} className="w-14 h-14 drop-shadow-xl" />;
    case 'icecream_scoop':
      return (
        <IceCreamScoopSvgIcon
          flavorId={item.flavorId}
          color={item.color}
          highlight={item.highlight}
          className="w-14 h-14 drop-shadow-xl"
        />
      );
    case 'icecream_syrup':
      return <IceCreamSyrupBottleSvgIcon syrupId={item.syrupId} color={item.color} className="w-14 h-14 drop-shadow-xl" />;
    case 'icecream_garnish':
      return <IceCreamGarnishSvgIcon id={item.garnishId} className="w-14 h-14 drop-shadow-xl" />;
    case 'drink_category':
      return <DrinkCategorySvgIcon id={item.category} className="w-14 h-14 drop-shadow-xl" />;
    case 'drink_flavor':
      return (
        <DrinkFlavorCupSvgIcon
          flavorId={item.flavorId}
          liquidTop={item.liquidTop}
          liquidBottom={item.liquidBottom}
          foamColor={item.foamColor}
          className="w-14 h-14 drop-shadow-xl"
        />
      );
    case 'drink_addon':
      return <DrinkAddonSvgIcon id={item.addonId} className="w-14 h-14 drop-shadow-xl" />;
    case 'drink_stir':
      return <StirSpoonSvgIcon className="w-14 h-14 drop-shadow-xl" />;
    case 'soup_broth':
      return (
        <SoupBrothSvgIcon
          brothId={item.brothId}
          color={item.color}
          rimColor={item.rimColor}
          className="w-14 h-14 drop-shadow-xl"
        />
      );
    case 'soup_pot_toggle':
      return <SoupPotToggleSvgIcon inBowl={item.inBowl} className="w-14 h-14 drop-shadow-xl" />;
    case 'soup_ingredient':
      return <SoupIngredientSvgIcon id={item.ingredientId} className="w-14 h-14 drop-shadow-xl" />;
    case 'sandwich_bread':
      return <SandwichBreadSvgIcon id={item.breadId} className="w-14 h-14 drop-shadow-xl" />;
    case 'sandwich_top_bread':
      return <SandwichTopBreadSvgIcon hasTop={item.hasTop} className="w-14 h-14 drop-shadow-xl" />;
    case 'sandwich_spread':
      return <SandwichSpreadSvgIcon spreadId={item.spreadId} color={item.color} className="w-14 h-14 drop-shadow-xl" />;
    case 'sandwich_filling':
      return <SandwichFillingSvgIcon id={item.fillingId} className="w-14 h-14 drop-shadow-xl" />;
    case 'cake_base':
      return (
        <img
          src={getCakeBaseAssetUrl(item.cakeId)}
          alt=""
          className="w-16 h-16 object-contain drop-shadow-xl pointer-events-none"
        />
      );
    case 'cake_rosette':
      return (
        <img
          src={getCakeRosetteAssetUrl(item.rosetteId)}
          alt=""
          className="w-14 h-14 object-contain drop-shadow-xl pointer-events-none"
        />
      );
    case 'cake_topping':
      return (
        <img
          src={getCakeToppingAssetUrl(item.toppingId)}
          alt=""
          className="w-14 h-14 object-contain drop-shadow-xl pointer-events-none"
        />
      );
    case 'cake_candle':
      return (
        <img
          src={getCakeCandleAssetUrl(item.candleId)}
          alt=""
          className="w-10 h-16 object-contain drop-shadow-xl pointer-events-none"
        />
      );
    case 'finished_dish': {
      const pizzaSaucePng = item.sauceId ? getPizzaSauceAssetUrl(item.sauceId) : null;
      const drinkPng = item.drinkFlavorId ? getDrinkRecipeAssetUrl(item.drinkFlavorId) : null;
      const soupPng =
        item.inBowl && item.brothId
          ? getSoupBaseAssetUrl(item.brothId) ?? SOUP_POT_PNG
          : !item.inBowl
          ? SOUP_POT_PNG
          : getSoupBaseAssetUrl(item.brothId);

      return (
        <div className="relative flex items-center justify-center drop-shadow-2xl">
          {item.mode === 'pizza' && (
            <div
              className={`relative w-20 h-20 flex items-center justify-center ${
                item.isBaked ? 'brightness-95 saturate-125' : ''
              }`}
            >
              <img
                src={PIZZA_DOUGH_PNG}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
              />
              {pizzaSaucePng && (
                <img
                  src={pizzaSaucePng}
                  alt=""
                  className="absolute inset-2.5 w-[calc(100%-20px)] h-[calc(100%-20px)] object-contain"
                />
              )}
              {item.hasCheese && (
                <img
                  src={PIZZA_CHEESE_LAYER_PNG}
                  alt=""
                  className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] object-contain"
                />
              )}
            </div>
          )}
          {item.mode === 'icecream' && (
            <div className="relative w-20 h-24 flex items-end justify-center">
              <img
                src={getIceCreamBaseAssetUrl(item.iceBaseId ?? 'cone')}
                alt=""
                className="w-14 h-14 object-contain"
              />
              {(item.scoopFlavorIds && item.scoopFlavorIds.length > 0
                ? item.scoopFlavorIds.slice(0, 3)
                : ['strawberry', 'vanilla']
              ).map((flavorId, idx) => {
                const scoopUrl = getIceCreamFlavorAssetUrl(flavorId);
                return scoopUrl ? (
                  <img
                    key={`${flavorId}_${idx}`}
                    src={scoopUrl}
                    alt=""
                    style={{ bottom: `${34 + idx * 14}px`, zIndex: idx + 1 }}
                    className="absolute left-1/2 -translate-x-1/2 w-12 h-12 object-contain"
                  />
                ) : null;
              })}
            </div>
          )}
          {item.mode === 'drinks' &&
            (drinkPng ? (
              <img src={drinkPng} alt="" className="w-20 h-20 object-contain" />
            ) : (
              <DrinkFlavorCupSvgIcon
                flavorId={item.drinkFlavorId}
                liquidTop={item.drinkTop || '#FB923C'}
                liquidBottom={item.drinkBottom || '#EA580C'}
                className="w-20 h-20"
              />
            ))}
          {item.mode === 'soup' &&
            (soupPng ? (
              <img src={soupPng} alt="" className="w-20 h-20 object-contain" />
            ) : (
              <SoupBrothSvgIcon
                brothId={item.brothId}
                color={item.brothColor || '#FACC15'}
                rimColor="#D97706"
                className="w-20 h-20"
              />
            ))}
          {item.mode === 'sandwich' && (
            <div className="relative w-20 h-20 flex items-center justify-center">
              <img
                src={getSandwichBreadAssetUrl(item.breadId ?? 'toast')}
                alt=""
                className="w-18 h-18 object-contain"
              />
              {(item.sandwichFillingIds ?? []).slice(-3).map((fid, idx) => (
                <img
                  key={`${fid}_${idx}`}
                  src={getSandwichFillingAssetUrl(fid)}
                  alt=""
                  style={{
                    transform: `translate(${(idx - 1) * 8}px, ${-8 - idx * 4}px) scale(0.75)`,
                  }}
                  className="absolute w-12 h-12 object-contain"
                />
              ))}
            </div>
          )}
          {item.mode === 'cake' && (
            <div className="relative w-20 h-20 flex items-center justify-center">
              <img
                src={getCakeBaseAssetUrl(item.cakeBaseId ?? 'pink')}
                alt=""
                className="w-20 h-20 object-contain"
              />
              {(item.cakeTopIds ?? []).slice(-3).map((tid, idx) => (
                <img
                  key={`${tid}_${idx}`}
                  src={getCakeToppingAssetUrl(tid)}
                  alt=""
                  style={{
                    transform: `translate(${(idx - 1) * 14}px, -18px)`,
                  }}
                  className="absolute w-7 h-7 object-contain"
                />
              ))}
            </div>
          )}
        </div>
      );
    }
  }
};

export const DragProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const stageHandlerRef = useRef<StageDropHandler | null>(null);
  const feedTargetsRef = useRef<Map<string, FeedDropTarget>>(new Map());
  const dragSessionRef = useRef<{
    item: DraggableItemPayload;
    pointerId: number;
    pointerType: string;
    wasOverStage: boolean;
  } | null>(null);

  const registerStageDropHandler = useCallback((handler: StageDropHandler | null) => {
    stageHandlerRef.current = handler;
  }, []);

  const registerFeedTarget = useCallback((id: string, target: FeedDropTarget | null) => {
    if (target) {
      feedTargetsRef.current.set(id, target);
    } else {
      feedTargetsRef.current.delete(id);
    }
  }, []);

  const findHoveredFeedTarget = (
    clientX: number,
    clientY: number,
    item: DraggableItemPayload
  ): { id: string; target: FeedDropTarget } | null => {
    const preferredOrder = ['stage-avatar', 'pizza-oven'];
    for (const id of preferredOrder) {
      const target = feedTargetsRef.current.get(id);
      if (target && (!target.accepts || target.accepts(item)) && target.containsPoint(clientX, clientY)) {
        return { id, target };
      }
    }
    for (const [id, target] of feedTargetsRef.current.entries()) {
      if ((!target.accepts || target.accepts(item)) && target.containsPoint(clientX, clientY)) {
        return { id, target };
      }
    }
    return null;
  };

  const endGlobalDrag = useCallback((clientX: number, clientY: number, cancelled: boolean) => {
    const session = dragSessionRef.current;
    if (!session) return;
    dragSessionRef.current = null;

    if (session.item.kind === 'finished_dish') {
      if (!cancelled) {
        const hit = findHoveredFeedTarget(clientX, clientY, session.item);
        if (hit) {
          hit.target.onDrop();
        }
      }
      setActiveDrag(null);
      return;
    }

    const handler = stageHandlerRef.current;
    if (handler) {
      if (cancelled) {
        handler.onDragCancel?.(session.item);
      } else if (handler.containsPoint(clientX, clientY)) {
        handler.onDragDrop(session.item, clientX, clientY);
      } else if (session.wasOverStage) {
        handler.onDragCancel?.(session.item);
      }
    }

    setActiveDrag(null);
  }, []);

  const startDrag = useCallback(
    (
      item: DraggableItemPayload,
      clientX: number,
      clientY: number,
      pointerType: string,
      pointerId: number
    ) => {
      const isDish = item.kind === 'finished_dish';
      const handler = isDish ? null : stageHandlerRef.current;
      const overStage = Boolean(handler?.containsPoint(clientX, clientY));
      const overFeedTargetId = isDish ? findHoveredFeedTarget(clientX, clientY, item)?.id ?? null : null;

      dragSessionRef.current = {
        item,
        pointerId,
        pointerType,
        wasOverStage: overStage,
      };

      if (overStage && handler) {
        handler.onDragEnter?.(item, clientX, clientY);
        handler.onDragMove?.(item, clientX, clientY);
      }

      setActiveDrag({
        item,
        clientX,
        clientY,
        pointerType,
        overStage,
        overFeedTargetId,
      });
    },
    []
  );

  const isDragging = activeDrag !== null;

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;

      const isDish = session.item.kind === 'finished_dish';
      const handler = isDish ? null : stageHandlerRef.current;
      const overStage = Boolean(handler?.containsPoint(e.clientX, e.clientY));
      const overFeedTargetId = isDish
        ? findHoveredFeedTarget(e.clientX, e.clientY, session.item)?.id ?? null
        : null;

      if (overStage && handler) {
        if (!session.wasOverStage) {
          handler.onDragEnter?.(session.item, e.clientX, e.clientY);
        }
        handler.onDragMove?.(session.item, e.clientX, e.clientY);
      } else if (session.wasOverStage && !overStage && handler) {
        handler.onDragCancel?.(session.item);
      }

      session.wasOverStage = overStage;
      setActiveDrag({
        item: session.item,
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: session.pointerType,
        overStage,
        overFeedTargetId,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;
      endGlobalDrag(e.clientX, e.clientY, false);
    };

    const onPointerCancel = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;
      endGlobalDrag(e.clientX, e.clientY, true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (dragSessionRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [isDragging, endGlobalDrag]);

  return (
    <DragContext.Provider value={{ activeDrag, registerStageDropHandler, registerFeedTarget, startDrag }}>
      {children}

      {activeDrag && (
        <div
          className="fixed inset-0 z-50 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div
            style={{
              transform: `translate3d(${activeDrag.clientX}px, ${activeDrag.clientY}px, 0) translate(-50%, ${
                activeDrag.pointerType === 'touch' ? '-95%' : '-55%'
              }) scale(${activeDrag.overStage || activeDrag.overFeedTargetId ? 1.15 : 1.05})`,
            }}
            className="fixed top-0 left-0 will-change-transform transition-transform duration-75"
          >
            <DragPreviewVisual item={activeDrag.item} />
          </div>
        </div>
      )}
    </DragContext.Provider>
  );
};

interface DraggableToolButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  dragItem: DraggableItemPayload;
  onTap: () => void;
  /** True for buttons inside rows that don't scroll horizontally (enables immediate drag in any direction) */
  allowAnyDirection?: boolean;
}

function hasHorizontalScrollParent(el: HTMLElement | null): boolean {
  let curr = el?.parentElement ?? null;
  while (curr && curr !== document.body) {
    const style = window.getComputedStyle(curr);
    if (
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      curr.scrollWidth > curr.clientWidth + 4
    ) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

export const DraggableToolButton: React.FC<DraggableToolButtonProps> = ({
  dragItem,
  onTap,
  allowAnyDirection,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const { startDrag } = useDragContext();
  const suppressClickRef = useRef(false);
  const cleanupPendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupPendingRef.current?.();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    cleanupPendingRef.current?.();

    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    const pointerType = e.pointerType;
    const canDragAnyDir = allowAnyDirection ?? !hasHorizontalScrollParent(e.currentTarget);

    let lastX = startX;
    let lastY = startY;
    let active = true;

    const cleanup = () => {
      if (!active) return;
      active = false;
      window.clearTimeout(holdTimer);
      window.removeEventListener('pointermove', onPendingMove);
      window.removeEventListener('pointerup', onPendingEnd);
      window.removeEventListener('pointercancel', onPendingEnd);
      cleanupPendingRef.current = null;
    };

    const triggerDrag = (cx: number, cy: number) => {
      cleanup();
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 220);
      startDrag(dragItem, cx, cy, pointerType, pointerId);
    };

    const holdTimer = window.setTimeout(() => {
      triggerDrag(lastX, lastY);
    }, canDragAnyDir ? 140 : 165);

    const onPendingMove = (ev: PointerEvent) => {
      if (!active || ev.pointerId !== pointerId) return;
      lastX = ev.clientX;
      lastY = ev.clientY;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const dist = Math.hypot(dx, dy);

      if (canDragAnyDir) {
        if (dist > 6) {
          triggerDrag(ev.clientX, ev.clientY);
        }
      } else {
        // Inside horizontally scrollable mobile strip:
        // Dragging downward toward the stage starts drag immediately;
        // Swiping horizontally lets the toolbar scroll natively.
        if (dy > 8 && Math.abs(dy) >= Math.abs(dx) * 0.7) {
          triggerDrag(ev.clientX, ev.clientY);
        } else if (Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          cleanup();
        }
      }
    };

    const onPendingEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      cleanup();
    };

    cleanupPendingRef.current = cleanup;
    window.addEventListener('pointermove', onPendingMove);
    window.addEventListener('pointerup', onPendingEnd);
    window.addEventListener('pointercancel', onPendingEnd);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!disabled) {
      onTap();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`${className} select-none ${allowAnyDirection ? 'touch-none' : 'lg:touch-none'}`}
      {...rest}
    >
      {children}
    </button>
  );
};
