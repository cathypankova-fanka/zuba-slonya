import React, { useEffect, useRef, useState } from 'react';
import { Flame, Heart, Sparkles, Utensils } from 'lucide-react';
import { CharacterItem } from '../data/characters';
import { Reaction, pickReaction, REACTIONS } from '../data/reactions';
import { ReactionHero } from './ReactionHero';
import {
  CakeCandleId,
  CakeFlavorId,
  CakeRosetteId,
  CakeState,
  CakeToolTab,
  CakeToppingId,
  DRINK_FLAVORS,
  DrinkAddonId,
  DrinkCategoryId,
  DrinkState,
  ICE_CREAM_BASES,
  ICE_CREAM_FLAVORS,
  ICE_CREAM_SYRUPS,
  IceCreamBaseId,
  IceCreamGarnishId,
  IceCreamState,
  KitchenMode,
  PIZZA_SAUCES,
  PizzaState,
  PizzaToppingId,
  PlacedCakeItem,
  SANDWICH_BREADS,
  SANDWICH_SPREADS,
  SandwichBreadId,
  SandwichFillingId,
  SandwichState,
  SOUP_BROTHS,
  SoupIngredientId,
  SoupState,
} from '../data/kitchenData';
import { DraggableItemPayload } from '../types/drag';
import { CakeCanvas } from './CakeCanvas';
import { useDragContext } from './DragContext';
import { DrinksPourCanvas } from './DrinksPourCanvas';
import { PizzaToppingSvgIcon, StirSpoonSvgIcon } from './KitchenIllustrations';
import {
  getIceCreamBaseAssetUrl,
  getIceCreamFlavorAssetUrl,
  getIceCreamGarnishAssetUrl,
  getPizzaSauceAssetUrl,
  getPizzaToppingAssetUrl,
  getSoupIngredientAssetUrl,
  PIZZA_CHEESE_LAYER_PNG,
  PIZZA_DOUGH_PNG,
} from '../utils/itemAssets';

interface KitchenStageProps {
  mode: KitchenMode;
  character: CharacterItem;
  pizza: PizzaState;
  selectedPizzaTopping: PizzaToppingId;
  iceCream: IceCreamState;
  drink: DrinkState;
  soup: SoupState;
  sandwich: SandwichState;
  cake: CakeState;
  cakeTab: CakeToolTab;
  selectedCakeRosette: CakeRosetteId;
  selectedCakeTopping: CakeToppingId;
  selectedCakeCandle: CakeCandleId;
  praiseBubble: string | null;
  soundEnabled: boolean;
  svgExportRef?: React.MutableRefObject<SVGSVGElement | null>;
  onSelectPizzaTopping: (id: PizzaToppingId) => void;
  onUpdatePizza: (patch: Partial<PizzaState>) => void;
  onPlacePizzaTopping: (x: number, y: number, overrideId?: PizzaToppingId) => void;
  onSelectIceCreamBase: (baseId: IceCreamBaseId) => void;
  onAddIceCreamScoop: (flavorId: string) => void;
  onPopIceCreamScoop: () => void;
  onSelectIceCreamSyrup: (syrupId: string) => void;
  onToggleIceCreamGarnish: (garnishId: IceCreamGarnishId) => void;
  onSelectDrinkCategory: (cat: DrinkCategoryId) => void;
  onSelectDrinkFlavor: (flavorId: string) => void;
  onToggleDrinkAddon: (addonId: DrinkAddonId) => void;
  onStirDrink: () => void;
  onSetDrinkPourLevel: (level: number) => void;
  onSelectSoupBroth: (brothId: string) => void;
  onToggleSoupBowl: () => void;
  onAddSoupIngredient: (
    ingredientId: SoupIngredientId,
    dropPos?: { radius: number; angle: number }
  ) => void;
  onStirSoupBy: (deltaDeg: number) => void;
  onSelectSandwichBread: (breadId: SandwichBreadId) => void;
  onToggleSandwichTopBread: () => void;
  onSelectSandwichSpread: (spreadId: string) => void;
  onAddSandwichFilling: (fillingId: SandwichFillingId) => void;
  onSelectCakeBase: (cakeId: CakeFlavorId) => void;
  onAddCakeItem: (item: Omit<PlacedCakeItem, 'uid' | 't0'>) => void;
  onUpdateCakeItems: (items: PlacedCakeItem[], blown?: boolean) => void;
  onFeedCharacter: () => void;
  onResetDishToEmpty: (mode: KitchenMode) => void;
  externalFeedTick?: number;
}

type MealPhase = 'cooking' | 'eating' | 'crumbs';

function renderPizzaToppingPng(
  toppingId: PizzaToppingId,
  x: number,
  y: number,
  rot: number,
  scale: number,
  key: string
) {
  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rot}) scale(${scale})`}
    >
      <image
        href={getPizzaToppingAssetUrl(toppingId)}
        x="-26"
        y="-26"
        width="52"
        height="52"
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function renderSoupIngredientPng(
  id: SoupIngredientId,
  x: number,
  y: number,
  rot: number,
  key: string
) {
  return (
    <g key={key} transform={`translate(${x}, ${y}) rotate(${rot})`}>
      <image
        href={getSoupIngredientAssetUrl(id)}
        x="-21"
        y="-21"
        width="42"
        height="42"
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

function renderSandwichLayerSvg(
  fillingId: SandwichFillingId,
  y: number,
  idx: number
) {
  const key = `layer_${idx}_${fillingId}`;
  switch (fillingId) {
    case 'cheese':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          <path
            d="M-128 -6 L128 -6 L118 8 L40 8 L22 20 L4 8 L-118 8 Z"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'ham':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          <rect x="-124" y="-8" width="248" height="16" rx="8" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2" />
        </g>
      );
    case 'salami':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          {[-72, 0, 72].map((ox, i) => (
            <ellipse
              key={i}
              cx={ox}
              cy="0"
              rx="46"
              ry="10"
              fill="#DC2626"
              stroke="#991B1B"
              strokeWidth="2"
            />
          ))}
        </g>
      );
    case 'patty':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          <rect x="-122" y="-12" width="244" height="24" rx="12" fill="#7C2D12" stroke="#451A03" strokeWidth="2.5" />
          <line x1="-80" y1="-4" x2="-45" y2="4" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          <line x1="-10" y1="-4" x2="25" y2="4" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="-4" x2="95" y2="4" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'egg':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          <ellipse cx="0" cy="2" rx="115" ry="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          <ellipse cx="0" cy="-4" rx="34" ry="11" fill="#FACC15" stroke="#EAB308" strokeWidth="2" />
        </g>
      );
    case 'lettuce':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          <path
            d="M-132 2 Q-105 -12 -78 2 T-26 2 T26 2 T78 2 T132 2 Q115 14 84 10 T24 10 T-36 10 T-96 10 Z"
            fill="#22C55E"
            stroke="#15803D"
            strokeWidth="2"
          />
        </g>
      );
    case 'tomato':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          {[-64, 64].map((ox, i) => (
            <rect
              key={i}
              x={ox - 54}
              y="-8"
              width="108"
              height="16"
              rx="8"
              fill="#EF4444"
              stroke="#B91C1C"
              strokeWidth="2"
            />
          ))}
        </g>
      );
    case 'cucumber':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          {[-76, 0, 76].map((ox, i) => (
            <ellipse
              key={i}
              cx={ox}
              cy="0"
              rx="38"
              ry="9"
              fill="#86EFAC"
              stroke="#16A34A"
              strokeWidth="3"
            />
          ))}
        </g>
      );
    case 'salmon':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          <path
            d="M-120 -6 Q-40 -14 40 -4 T120 -6 L118 10 Q40 14 -40 8 T-120 10 Z"
            fill="#FB923C"
            stroke="#EA580C"
            strokeWidth="2"
          />
        </g>
      );
    case 'avocado_slice':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          {[-68, 0, 68].map((ox, i) => (
            <ellipse
              key={i}
              cx={ox}
              cy="0"
              rx="36"
              ry="9"
              fill="#A3E635"
              stroke="#4D7C0F"
              strokeWidth="2.5"
            />
          ))}
        </g>
      );
    case 'banana':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          {[-76, -25, 25, 76].map((ox, i) => (
            <ellipse
              key={i}
              cx={ox}
              cy="0"
              rx="24"
              ry="9"
              fill="#FEF08A"
              stroke="#CA8A04"
              strokeWidth="2"
            />
          ))}
        </g>
      );
    case 'strawberry':
      return (
        <g key={key} transform={`translate(240, ${y})`}>
          {[-72, 0, 72].map((ox, i) => (
            <ellipse
              key={i}
              cx={ox}
              cy="0"
              rx="34"
              ry="10"
              fill="#F43F5E"
              stroke="#BE123C"
              strokeWidth="2"
            />
          ))}
        </g>
      );
  }
}

export const KitchenStage: React.FC<KitchenStageProps> = ({
  mode,
  character,
  pizza,
  selectedPizzaTopping,
  iceCream,
  drink,
  soup,
  sandwich,
  cake,
  cakeTab,
  selectedCakeRosette,
  selectedCakeTopping,
  selectedCakeCandle,
  praiseBubble,
  soundEnabled,
  svgExportRef,
  onSelectPizzaTopping,
  onUpdatePizza,
  onPlacePizzaTopping,
  onSelectIceCreamBase,
  onAddIceCreamScoop,
  onPopIceCreamScoop,
  onSelectIceCreamSyrup,
  onToggleIceCreamGarnish,
  onSelectDrinkCategory,
  onSelectDrinkFlavor,
  onToggleDrinkAddon,
  onStirDrink,
  onSetDrinkPourLevel,
  onSelectSoupBroth,
  onToggleSoupBowl,
  onAddSoupIngredient,
  onStirSoupBy,
  onSelectSandwichBread,
  onToggleSandwichTopBread,
  onSelectSandwichSpread,
  onAddSandwichFilling,
  onSelectCakeBase,
  onAddCakeItem,
  onUpdateCakeItems,
  onFeedCharacter,
  onResetDishToEmpty,
  externalFeedTick = 0,
}) => {
  const { activeDrag, registerStageDropHandler, registerFeedTarget, startDrag } = useDragContext();
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const dinerAvatarRef = useRef<HTMLButtonElement | null>(null);
  const internalSvgRef = useRef<SVGSVGElement | null>(null);
  const cakeDropHandlerRef = useRef<
    ((item: DraggableItemPayload, clientX: number, clientY: number) => void) | null
  >(null);
  const [imageError, setImageError] = useState(false);
  const [eatGifError, setEatGifError] = useState(false);
  const [eatRunId, setEatRunId] = useState(0);
  const [reaction, setReaction] = useState<Reaction>(REACTIONS.chewing);
  const [mealPhase, setMealPhase] = useState<MealPhase>('cooking');
  const [stageCursor, setStageCursor] = useState<{
    leftPct: number;
    topPct: number;
    pointerType: string;
    kind: 'pizza_topping' | 'drink_stir';
  } | null>(null);

  const eatTimerRef = useRef<number | null>(null);
  const crumbsTimerRef = useRef<number | null>(null);
  const stageCursorTimerRef = useRef<number | null>(null);
  const lastDrinkStirAtRef = useRef<number>(0);
  const justClearedRef = useRef<boolean>(false);
  const suppressNextClickRef = useRef<boolean>(false);
  const pendingDishCleanupRef = useRef<(() => void) | null>(null);
  const lastHandledFeedTickRef = useRef<number>(externalFeedTick);

  // Interactive finger-stirring tracker for soup pot
  const soupStirRef = useRef<{
    pointerId: number;
    pointerType: string;
    startX: number;
    startY: number;
    lastAngle: number;
    moved: boolean;
  } | null>(null);

  const setSvgRef = (el: SVGSVGElement | null) => {
    internalSvgRef.current = el;
    if (svgExportRef) {
      svgExportRef.current = el;
    }
  };

  // Clear timers on unmount or mode/character change
  useEffect(() => {
    setImageError(false);
    setEatGifError(false);
    setMealPhase('cooking');
    setStageCursor(null);
    if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
    if (crumbsTimerRef.current) window.clearTimeout(crumbsTimerRef.current);
    if (stageCursorTimerRef.current) window.clearTimeout(stageCursorTimerRef.current);
    return () => {
      if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
      if (crumbsTimerRef.current) window.clearTimeout(crumbsTimerRef.current);
      if (stageCursorTimerRef.current) window.clearTimeout(stageCursorTimerRef.current);
    };
  }, [character.id, mode]);

  // If the child adds a new ingredient while crumbs are still visible, immediately return to 'cooking'
  useEffect(() => {
    if (justClearedRef.current) {
      justClearedRef.current = false;
      return;
    }
    if (mealPhase === 'crumbs') {
      if (crumbsTimerRef.current) window.clearTimeout(crumbsTimerRef.current);
      setMealPhase('cooking');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pizza, iceCream, drink, soup, sandwich, cake]);

  const handleTriggerFeed = () => {
    if (mealPhase !== 'cooking') return;
    if (eatTimerRef.current) window.clearTimeout(eatTimerRef.current);
    if (crumbsTimerRef.current) window.clearTimeout(crumbsTimerRef.current);

    setEatGifError(false);
    setEatRunId((n) => n + 1);
    setReaction(pickReaction(mode as 'pizza' | 'icecream' | 'soup' | 'sandwich' | 'drinks' | 'cake', character.id));
    setMealPhase('eating');
    onFeedCharacter();

    eatTimerRef.current = window.setTimeout(() => {
      justClearedRef.current = true;
      onResetDishToEmpty(mode);
      setMealPhase('crumbs');

      crumbsTimerRef.current = window.setTimeout(() => {
        setMealPhase('cooking');
      }, 2000);
    }, 2800);
  };

  const latestFeedHandlerRef = useRef(handleTriggerFeed);
  latestFeedHandlerRef.current = handleTriggerFeed;

  useEffect(() => {
    if (externalFeedTick !== lastHandledFeedTickRef.current) {
      lastHandledFeedTickRef.current = externalFeedTick;
      latestFeedHandlerRef.current();
    }
  }, [externalFeedTick]);

  useEffect(() => {
    return () => {
      pendingDishCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    registerFeedTarget('stage-avatar', {
      containsPoint: (clientX, clientY) => {
        const el = dinerAvatarRef.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const pad = 16;
        return (
          clientX >= rect.left - pad &&
          clientX <= rect.right + pad &&
          clientY >= rect.top - pad &&
          clientY <= rect.bottom + pad
        );
      },
      onDrop: () => {
        latestFeedHandlerRef.current();
      },
    });
    return () => {
      registerFeedTarget('stage-avatar', null);
    };
  }, [registerFeedTarget]);

  const getSvgCoords = (clientX: number, clientY: number) => {
    const svg = internalSvgRef.current;
    if (!svg) return { vx: 240, vy: 230 };
    const rect = svg.getBoundingClientRect();
    return {
      vx: ((clientX - rect.left) / rect.width) * 480,
      vy: ((clientY - rect.top) / rect.height) * 460,
    };
  };

  // Register Drag-from-Toolbar drop & continuous stir handler for KitchenStage
  const latestKitchenRef = useRef({
    mode,
    pizza,
    mealPhase,
    onSelectPizzaTopping,
    onUpdatePizza,
    onPlacePizzaTopping,
    onSelectIceCreamBase,
    onAddIceCreamScoop,
    onSelectIceCreamSyrup,
    onToggleIceCreamGarnish,
    onSelectDrinkCategory,
    onSelectDrinkFlavor,
    onToggleDrinkAddon,
    onStirDrink,
    onSelectSoupBroth,
    onToggleSoupBowl,
    onAddSoupIngredient,
    onSelectSandwichBread,
    onToggleSandwichTopBread,
    onSelectSandwichSpread,
    onAddSandwichFilling,
  });
  latestKitchenRef.current = {
    mode,
    pizza,
    mealPhase,
    onSelectPizzaTopping,
    onUpdatePizza,
    onPlacePizzaTopping,
    onSelectIceCreamBase,
    onAddIceCreamScoop,
    onSelectIceCreamSyrup,
    onToggleIceCreamGarnish,
    onSelectDrinkCategory,
    onSelectDrinkFlavor,
    onToggleDrinkAddon,
    onStirDrink,
    onSelectSoupBroth,
    onToggleSoupBowl,
    onAddSoupIngredient,
    onSelectSandwichBread,
    onToggleSandwichTopBread,
    onSelectSandwichSpread,
    onAddSandwichFilling,
  };

  useEffect(() => {
    registerStageDropHandler({
      containsPoint: (clientX, clientY) => {
        const el = stageContainerRef.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      },
      onDragMove: (item: DraggableItemPayload) => {
        const latest = latestKitchenRef.current;
        if (latest.mealPhase === 'eating') return;
        if (item.kind === 'drink_stir' && latest.mode === 'drinks') {
          const now = Date.now();
          if (now - lastDrinkStirAtRef.current > 130) {
            lastDrinkStirAtRef.current = now;
            latest.onStirDrink();
          }
        }
      },
      onDragDrop: (item: DraggableItemPayload, clientX, clientY) => {
        const latest = latestKitchenRef.current;
        if (latest.mealPhase === 'eating') return;
        const { vx, vy } = getSvgCoords(clientX, clientY);

        switch (item.kind) {
          case 'pizza_sauce':
            latest.onUpdatePizza({ sauceId: item.sauceId });
            break;
          case 'pizza_cheese':
            latest.onUpdatePizza({ hasCheese: !latest.pizza.hasCheese });
            break;
          case 'pizza_oven':
            latest.onUpdatePizza({ isBaked: !latest.pizza.isBaked });
            break;
          case 'pizza_cutter':
            latest.onUpdatePizza({ isSliced: !latest.pizza.isSliced });
            break;
          case 'pizza_topping': {
            latest.onSelectPizzaTopping(item.toppingId);
            const dx = (vx - 240) / 138;
            const dy = (vy - 235) / 138;
            const len = Math.hypot(dx, dy);
            const clampedX = len > 0.9 ? (dx / len) * 0.85 : dx;
            const clampedY = len > 0.9 ? (dy / len) * 0.85 : dy;
            latest.onPlacePizzaTopping(clampedX, clampedY, item.toppingId);
            break;
          }
          case 'icecream_base':
            latest.onSelectIceCreamBase(item.baseId);
            break;
          case 'icecream_scoop':
            latest.onAddIceCreamScoop(item.flavorId);
            break;
          case 'icecream_syrup':
            latest.onSelectIceCreamSyrup(item.syrupId);
            break;
          case 'icecream_garnish':
            latest.onToggleIceCreamGarnish(item.garnishId);
            break;
          case 'drink_category':
            latest.onSelectDrinkCategory(item.category);
            break;
          case 'drink_flavor':
            latest.onSelectDrinkFlavor(item.flavorId);
            break;
          case 'drink_addon':
            latest.onToggleDrinkAddon(item.addonId);
            break;
          case 'drink_stir':
            latest.onStirDrink();
            break;
          case 'soup_broth':
            latest.onSelectSoupBroth(item.brothId);
            break;
          case 'soup_pot_toggle':
            latest.onToggleSoupBowl();
            break;
          case 'soup_ingredient': {
            const dx = (vx - 240) / 116;
            const dy = (vy - 212) / 52;
            const r = Math.min(0.82, Math.max(0.12, Math.hypot(dx, dy)));
            const angle = Math.atan2(dy, dx);
            latest.onAddSoupIngredient(item.ingredientId, { radius: r, angle });
            break;
          }
          case 'sandwich_bread':
            latest.onSelectSandwichBread(item.breadId);
            break;
          case 'sandwich_top_bread':
            latest.onToggleSandwichTopBread();
            break;
          case 'sandwich_spread':
            latest.onSelectSandwichSpread(item.spreadId);
            break;
          case 'sandwich_filling':
            latest.onAddSandwichFilling(item.fillingId);
            break;
          case 'cake_base':
          case 'cake_rosette':
          case 'cake_topping':
          case 'cake_candle':
            cakeDropHandlerRef.current?.(item, clientX, clientY);
            break;
        }
      },
    });

    return () => {
      registerStageDropHandler(null);
    };
  }, [registerStageDropHandler]);

  const showTransientStageCursor = (
    clientX: number,
    clientY: number,
    pointerType: string,
    kind: 'pizza_topping' | 'drink_stir'
  ) => {
    const svg = internalSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const leftPct = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
    const topPct = Math.min(95, Math.max(5, ((clientY - rect.top) / rect.height) * 100));
    if (stageCursorTimerRef.current) window.clearTimeout(stageCursorTimerRef.current);
    setStageCursor({ leftPct, topPct, pointerType, kind });
    stageCursorTimerRef.current = window.setTimeout(() => {
      setStageCursor(null);
    }, 280);
  };

  const pizzaSauce = PIZZA_SAUCES.find((s) => s.id === pizza.sauceId) ?? PIZZA_SAUCES[0];
  const iceBase = ICE_CREAM_BASES.find((b) => b.id === iceCream.baseId) ?? ICE_CREAM_BASES[0];
  const iceSyrup =
    ICE_CREAM_SYRUPS.find((s) => s.id === iceCream.syrupId) ?? ICE_CREAM_SYRUPS[0];
  const drinkFlavor =
    DRINK_FLAVORS.find((d) => d.id === drink.flavorId) ?? DRINK_FLAVORS[0];
  const soupBroth = SOUP_BROTHS.find((b) => b.id === soup.brothId) ?? SOUP_BROTHS[0];
  const breadDef =
    SANDWICH_BREADS.find((b) => b.id === sandwich.breadId) ?? SANDWICH_BREADS[0];
  const spreadDef =
    SANDWICH_SPREADS.find((s) => s.id === sandwich.spreadId) ?? SANDWICH_SPREADS[0];

  const hasPizzaContent =
    Boolean(pizza.sauceId) ||
    pizza.hasCheese ||
    pizza.toppings.length > 0 ||
    pizza.isBaked ||
    pizza.isSliced;
  const hasIceCreamContent = iceCream.scoops.length > 0;
  const hasDrinkContent = drink.pourLevel > 0.08 && mealPhase === 'cooking';
  const hasSoupContent = Boolean(soup.brothId) || soup.ingredients.length > 0;
  const hasSandwichContent =
    sandwich.layers.length > 0 || sandwich.hasTopBread || sandwich.spreadId !== 'none';

  const hasCarryableDish =
    mealPhase === 'cooking' &&
    (mode === 'pizza'
      ? hasPizzaContent
      : mode === 'icecream'
      ? hasIceCreamContent
      : mode === 'drinks'
      ? hasDrinkContent
      : mode === 'soup'
      ? hasSoupContent
      : mode === 'cake'
      ? true
      : hasSandwichContent);

  const buildFinishedDishPayload = (): DraggableItemPayload => ({
    kind: 'finished_dish',
    mode,
    label: character.name,
    sauceId: pizza.sauceId,
    sauceColor: pizzaSauce.color,
    hasCheese: pizza.hasCheese,
    isBaked: pizza.isBaked,
    scoopFlavorIds: iceCream.scoops,
    scoopColors: iceCream.scoops.map(
      (id) => (ICE_CREAM_FLAVORS.find((f) => f.id === id) ?? ICE_CREAM_FLAVORS[0]).color
    ),
    iceBaseId: iceCream.baseId,
    drinkFlavorId: drink.flavorId,
    drinkTop: drinkFlavor.liquidTop,
    drinkBottom: drinkFlavor.liquidBottom,
    brothId: soup.brothId,
    brothColor: soupBroth.color,
    inBowl: soup.inBowl,
    breadId: breadDef.id,
    breadColor: breadDef.crustColor,
    crumbColor: breadDef.crumbColor,
    sandwichFillingIds: sandwich.layers,
    cakeBaseId: cake.cakeId,
    cakeTopIds: cake.items
      .filter((i) => i.type === 'topping')
      .map((i) => i.id as CakeToppingId),
  });

  const startPendingDishDrag = (e: React.PointerEvent<Element>) => {
    if (mealPhase !== 'cooking' || !hasCarryableDish) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    pendingDishCleanupRef.current?.();
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    const pointerType = e.pointerType;
    let active = true;

    const cleanup = () => {
      if (!active) return;
      active = false;
      window.removeEventListener('pointermove', onPendingMove);
      window.removeEventListener('pointerup', onPendingEnd);
      window.removeEventListener('pointercancel', onPendingEnd);
      pendingDishCleanupRef.current = null;
    };

    const onPendingMove = (ev: PointerEvent) => {
      if (!active || ev.pointerId !== pointerId) return;
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (dist > 14) {
        cleanup();
        setStageCursor(null);
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 260);
        startDrag(buildFinishedDishPayload(), ev.clientX, ev.clientY, pointerType, pointerId);
      }
    };

    const onPendingEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      cleanup();
    };

    pendingDishCleanupRef.current = cleanup;
    window.addEventListener('pointermove', onPendingMove);
    window.addEventListener('pointerup', onPendingEnd);
    window.addEventListener('pointercancel', onPendingEnd);
  };

  const handlePointerDownSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mealPhase !== 'cooking') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (mode === 'soup') {
      e.currentTarget.setPointerCapture(e.pointerId);
      const { vx, vy } = getSvgCoords(e.clientX, e.clientY);
      const angle = Math.atan2(vy - 212, vx - 240);
      soupStirRef.current = {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
        lastAngle: angle,
        moved: false,
      };
      return;
    }

    if (mode === 'pizza') {
      showTransientStageCursor(e.clientX, e.clientY, e.pointerType, 'pizza_topping');
    } else if (mode === 'drinks') {
      showTransientStageCursor(e.clientX, e.clientY, e.pointerType, 'drink_stir');
    }

    startPendingDishDrag(e);
  };

  const handlePointerMoveSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== 'soup' || !soupStirRef.current) return;
    if (soupStirRef.current.pointerId !== e.pointerId) return;

    const { vx, vy } = getSvgCoords(e.clientX, e.clientY);
    const dragDist = Math.hypot(
      e.clientX - soupStirRef.current.startX,
      e.clientY - soupStirRef.current.startY
    );
    const distFromPotCenter = Math.hypot((vx - 240) / 160, (vy - 212) / 96);

    // If the child drags the soup out past the pot rim toward the character avatar, carry the soup!
    if (
      hasSoupContent &&
      dragDist > 28 &&
      (vy < 112 || vy > 395 || distFromPotCenter > 1.15)
    ) {
      const pointerId = soupStirRef.current.pointerId;
      const pointerType = soupStirRef.current.pointerType;
      soupStirRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(pointerId);
      } catch {
        // Ignore if capture already released
      }
      startDrag(buildFinishedDishPayload(), e.clientX, e.clientY, pointerType, pointerId);
      return;
    }

    const angle = Math.atan2(vy - 212, vx - 240);
    let deltaRad = angle - soupStirRef.current.lastAngle;
    while (deltaRad > Math.PI) deltaRad -= Math.PI * 2;
    while (deltaRad < -Math.PI) deltaRad += Math.PI * 2;

    if (Math.abs(deltaRad) > 0.04) {
      soupStirRef.current.lastAngle = angle;
      soupStirRef.current.moved = true;
      onStirSoupBy((deltaRad * 180) / Math.PI);
    }
  };

  const handlePointerUpSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === 'soup' && soupStirRef.current?.pointerId === e.pointerId) {
      if (!soupStirRef.current.moved) {
        onStirSoupBy(38);
      }
      soupStirRef.current = null;
      return;
    }
  };

  const handleStageSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (mealPhase === 'crumbs') {
      setMealPhase('cooking');
      return;
    }
    if (mealPhase === 'eating') return;

    const { vx, vy } = getSvgCoords(e.clientX, e.clientY);
    if (mode === 'pizza') {
      const dx = (vx - 240) / 138;
      const dy = (vy - 235) / 138;
      if (Math.hypot(dx, dy) <= 1.02) {
        onPlacePizzaTopping(dx, dy);
      }
    } else if (mode === 'drinks') {
      onStirDrink();
    }
  };

  const feedLabel =
    mode === 'drinks' ? `Напоить ${character.name}` : `Угостить ${character.name}!`;

  // Spoon orbital position for soup mode
  const spoonAngleRad = (soup.stirAngle * Math.PI) / 180;
  const spoonX = 240 + Math.cos(spoonAngleRad) * 68;
  const spoonY = 212 + Math.sin(spoonAngleRad) * 28;

  const isDragOver = Boolean(activeDrag?.overStage);
  const isCarryingDish = activeDrag?.item.kind === 'finished_dish';
  const isStageAvatarFeedHovered = activeDrag?.overFeedTargetId === 'stage-avatar';

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-0">
      <div
        ref={stageContainerRef}
        className={`relative h-full w-auto max-w-full aspect-[3/4] max-h-full rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_14px_38px_rgba(36,33,29,0.12)] border-4 select-none flex flex-col justify-between transition-shadow ${
          isDragOver ? 'border-[#FF6B4A] ring-4 ring-[#FF6B4A]/35' : 'border-white'
        }`}
        style={{ backgroundColor: '#FFFDF8' }}
      >
        {/* Top Character Diner Header */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-2.5 pb-1 bg-gradient-to-b from-[#FAF5EB] to-transparent z-10 shrink-0">
          <button
            ref={dinerAvatarRef}
            type="button"
            onClick={handleTriggerFeed}
            className="flex items-center gap-2 group cursor-pointer text-left min-w-0"
          >
            <div
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-3 border-white shadow-md overflow-hidden shrink-0 transition-transform duration-300 ${
                mealPhase === 'eating'
                  ? 'scale-110 rotate-3'
                  : isStageAvatarFeedHovered
                  ? 'scale-115 ring-4 ring-[#10C97A] shadow-xl'
                  : isCarryingDish
                  ? 'scale-105 ring-3 ring-[#FFB800] animate-pulse'
                  : 'group-hover:scale-105'
              }`}
              style={{ backgroundColor: character.accentBg }}
            >
              {mealPhase === 'eating' ? (
                <ReactionHero
                  character={character}
                  reaction={reaction}
                  runKey={`head-${eatRunId}`}
                  eatSrc={`/assets/eat-animations/${character.id}.webp?run=${eatRunId}`}
                />
              ) : !imageError ? (
                <img
                  src={character.imageSrc}
                  alt={character.name}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display font-bold text-base">
                  {character.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-extrabold text-xs sm:text-sm text-[#24211D] truncate">
                {character.name}
              </span>
              <span className="text-[11px] font-bold text-[#6B645B] truncate">
                {isStageAvatarFeedHovered
                  ? 'Отпусти, чтобы угостить!'
                  : activeDrag?.overFeedTargetId === 'pizza-oven'
                  ? 'Отпусти в печку!'
                  : isCarryingDish
                  ? mode === 'pizza' && !pizza.isBaked
                    ? 'В печь или на аватар!'
                    : 'Неси на аватар!'
                  : mealPhase === 'eating'
                  ? 'Ммм, вкусно!'
                  : mealPhase === 'crumbs'
                  ? 'Всё съели! Крошки'
                  : mode === 'soup'
                  ? 'Покрути ложку пальцем'
                  : mode === 'pizza'
                  ? 'Нажми на пиццу'
                  : mode === 'drinks'
                  ? drink.pourLevel <= 0.08
                    ? 'Налей из чайника!'
                    : 'Укрась или напои!'
                  : mode === 'cake'
                  ? 'Укрась торт!'
                  : 'Собери вкусняшку'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleTriggerFeed}
            disabled={mealPhase !== 'cooking' || (mode === 'drinks' && drink.pourLevel <= 0.08)}
            className="min-h-[40px] sm:min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FF6B4A] hover:bg-[#F25534] active:translate-y-0.5 disabled:opacity-50 text-white font-display font-extrabold text-xs sm:text-sm shadow-[0_3px_0_#C93B1D] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Utensils className="w-4 h-4" />
            <span>{feedLabel}</span>
          </button>
        </div>

        {/* Interactive Culinary Canvas */}
        <div className="relative flex-1 w-full min-h-0 flex items-center justify-center px-2 pb-2">
          {mode === 'cake' ? (
            <CakeCanvas
              cake={cake}
              activeTab={cakeTab}
              selectedRosette={selectedCakeRosette}
              selectedTopping={selectedCakeTopping}
              selectedCandle={selectedCakeCandle}
              soundEnabled={soundEnabled}
              isCarryingDish={isCarryingDish}
              isCrumbsPhase={mealPhase === 'crumbs'}
              dropHandlerRef={cakeDropHandlerRef}
              onSelectCakeBase={onSelectCakeBase}
              onAddCakeItem={onAddCakeItem}
              onUpdateCakeItems={onUpdateCakeItems}
              onStartDishDrag={startPendingDishDrag}
            />
          ) : mode === 'drinks' ? (
            <DrinksPourCanvas
              drink={drink}
              soundEnabled={soundEnabled}
              isCarryingDish={isCarryingDish}
              isCrumbsPhase={mealPhase === 'crumbs'}
              onSetPourLevel={onSetDrinkPourLevel}
              onStirDrink={() => {
                if (suppressNextClickRef.current) {
                  suppressNextClickRef.current = false;
                  return;
                }
                if (mealPhase === 'crumbs') {
                  setMealPhase('cooking');
                  return;
                }
                onStirDrink();
              }}
              onStartDishDrag={startPendingDishDrag}
            />
          ) : (
          <svg
            ref={setSvgRef}
            viewBox="0 0 480 460"
            onPointerDown={handlePointerDownSvg}
            onPointerMove={handlePointerMoveSvg}
            onPointerUp={handlePointerUpSvg}
            onPointerCancel={handlePointerUpSvg}
            onClick={handleStageSvgClick}
            style={{ touchAction: hasCarryableDish || mode === 'soup' ? 'none' : 'manipulation' }}
            className={`w-full h-full max-h-full transition-opacity duration-150 ${
              isCarryingDish ? 'opacity-35 cursor-grabbing' : 'cursor-pointer'
            }`}
          >
            <rect x="0" y="0" width="480" height="460" fill="#FFFDF8" />
            <ellipse cx="240" cy="402" rx="215" ry="44" fill="#F3ECE0" />

            {/* ================= 1. PIZZA MODE ================= */}
            {mode === 'pizza' && (
              <g>
                {/* Wooden Pizza Board */}
                <circle cx="240" cy="235" r="190" fill="#D99B58" stroke="#B47330" strokeWidth="6" />
                <rect x="218" y="405" width="44" height="45" rx="14" fill="#D99B58" stroke="#B47330" strokeWidth="5" />

                {mealPhase === 'crumbs' ? (
                  <g>
                    {/* Leftover Pizza Crumbs & Sauce Smudge */}
                    <path d="M180 235 Q215 215 245 245 Q220 265 180 235 Z" fill={pizzaSauce.color} opacity="0.28" />
                    <path d="M270 190 Q298 184 312 204 L290 212 Z" fill="#D97706" opacity="0.7" />
                    <g fill="#B45309">
                      <circle cx="192" cy="210" r="4" />
                      <circle cx="228" cy="260" r="5" />
                      <circle cx="268" cy="238" r="3.5" />
                      <circle cx="206" cy="278" r="3" />
                      <circle cx="290" cy="265" r="4.5" />
                      <circle cx="242" cy="195" r="3.5" />
                      <circle cx="174" cy="256" r="3" />
                      <circle cx="255" cy="285" r="4" />
                    </g>
                    <g fill="#FACC15" opacity="0.75">
                      <ellipse cx="215" cy="228" rx="6" ry="3" />
                      <ellipse cx="275" cy="252" rx="5" ry="2.5" />
                    </g>
                  </g>
                ) : (Boolean(pizza.sauceId) || pizza.hasCheese || pizza.toppings.length > 0 || pizza.isBaked || pizza.isSliced) ? (
                  <g>
                    <defs>
                      <filter id="pizzaBakedFilter" colorInterpolationFilters="sRGB">
                        <feComponentTransfer>
                          <feFuncR type="linear" slope="1.05" intercept="-0.02" />
                          <feFuncG type="linear" slope="0.96" intercept="-0.03" />
                          <feFuncB type="linear" slope="0.82" intercept="-0.04" />
                        </feComponentTransfer>
                      </filter>
                    </defs>

                    <g filter={pizza.isBaked ? 'url(#pizzaBakedFilter)' : undefined}>
                      {/* Pizza Dough */}
                      <image
                        href={PIZZA_DOUGH_PNG}
                        x="68"
                        y="63"
                        width="344"
                        height="344"
                        preserveAspectRatio="xMidYMid meet"
                      />

                      {/* Sauce */}
                      {(() => {
                        const saucePng = getPizzaSauceAssetUrl(pizza.sauceId || 'tomato');
                        return saucePng ? (
                          <image
                            href={saucePng}
                            x="98"
                            y="93"
                            width="284"
                            height="284"
                            preserveAspectRatio="xMidYMid meet"
                          />
                        ) : (
                          <circle
                            cx="240"
                            cy="235"
                            r="140"
                            fill={pizzaSauce.color}
                            stroke={pizzaSauce.ringColor}
                            strokeWidth="4"
                          />
                        );
                      })()}

                      {/* Melted Cheese Layer */}
                      {pizza.hasCheese && (
                        <image
                          href={PIZZA_CHEESE_LAYER_PNG}
                          x="108"
                          y="103"
                          width="264"
                          height="264"
                          preserveAspectRatio="xMidYMid meet"
                          opacity="0.96"
                        />
                      )}

                      {pizza.toppings.map((t) =>
                        renderPizzaToppingPng(
                          t.toppingId,
                          240 + t.x * 116,
                          235 + t.y * 116,
                          t.rotation,
                          t.scale,
                          t.uid
                        )
                      )}
                    </g>

                    {pizza.isSliced && (
                      <g stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" opacity="0.72">
                        <line x1="240" y1="74" x2="240" y2="396" />
                        <line x1="79" y1="235" x2="401" y2="235" />
                        <line x1="126" y1="121" x2="354" y2="349" />
                        <line x1="354" y1="121" x2="126" y2="349" />
                      </g>
                    )}

                    {pizza.isBaked && (
                      <g fill="none" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.7">
                        <path d="M180 65 Q168 42 184 22" />
                        <path d="M240 55 Q252 32 238 12" />
                        <path d="M300 65 Q312 42 296 22" />
                      </g>
                    )}
                  </g>
                ) : null}
              </g>
            )}

            {/* ================= 2. ICE CREAM MODE ================= */}
            {mode === 'icecream' && (
              <g>
                <ellipse cx="240" cy="410" rx="110" ry="18" fill="#E5DFD2" />

                {mealPhase === 'crumbs' ? (
                  <g>
                    {/* Empty Dish + Melted Drops & Waffle Crumbs */}
                    <ellipse cx="240" cy="390" rx="115" ry="24" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="4" />
                    <path d="M195 388 Q218 375 245 390 Q268 400 288 386 Q262 406 210 400 Z" fill="#FB7185" opacity="0.45" />
                    <g fill="#D97706">
                      <circle cx="212" cy="382" r="4" />
                      <circle cx="246" cy="394" r="3.5" />
                      <circle cx="272" cy="380" r="4" />
                      <circle cx="228" cy="398" r="3" />
                    </g>
                    <circle cx="255" cy="385" r="4" fill="#E11D48" opacity="0.75" />
                  </g>
                ) : (
                  <g>
                    {/* Cone / Cup / Bowl Base */}
                    {(iceBase.id === 'cone' || iceBase.id === 'choco_cone') && (
                      <image
                        href={getIceCreamBaseAssetUrl(iceBase.id)}
                        x="150"
                        y="246"
                        width="180"
                        height="182"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}
                    {iceBase.id === 'cup' && (
                      <image
                        href={getIceCreamBaseAssetUrl('cup')}
                        x="142"
                        y="246"
                        width="196"
                        height="176"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}
                    {iceBase.id === 'bowl' && (
                      <image
                        href={getIceCreamBaseAssetUrl('bowl')}
                        x="116"
                        y="238"
                        width="248"
                        height="184"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}

                    {iceCream.scoops.length > 0 && (() => {
                      const topIdx = iceCream.scoops.length - 1;
                      const topCy = 242 - topIdx * 50;
                      const topR = 62 - topIdx * 3;
                      return (
                        <g>
                          {iceCream.garnishes.includes('wafer') && (
                            <image
                              href={getIceCreamGarnishAssetUrl('wafer')}
                              x="254"
                              y={topCy - topR - 54}
                              width="108"
                              height="108"
                              preserveAspectRatio="xMidYMid meet"
                            />
                          )}
                          {iceCream.garnishes.includes('cookie') && (
                            <image
                              href={getIceCreamGarnishAssetUrl('cookie')}
                              x="132"
                              y={topCy - topR - 22}
                              width="78"
                              height="78"
                              preserveAspectRatio="xMidYMid meet"
                            />
                          )}
                        </g>
                      );
                    })()}

                    {iceCream.scoops.map((flavorId, idx) => {
                      const scoopUrl = getIceCreamFlavorAssetUrl(flavorId);
                      const flavor =
                        ICE_CREAM_FLAVORS.find((f) => f.id === flavorId) ?? ICE_CREAM_FLAVORS[0];
                      const cy = 242 - idx * 50;
                      const r = 62 - idx * 3;
                      return (
                        <g
                          key={`scoop_${idx}_${flavorId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (suppressNextClickRef.current) {
                              suppressNextClickRef.current = false;
                              return;
                            }
                            onPopIceCreamScoop();
                          }}
                          className="cursor-pointer"
                        >
                          {scoopUrl ? (
                            <image
                              href={scoopUrl}
                              x={240 - r * 1.15}
                              y={cy - r * 1.12}
                              width={r * 2.3}
                              height={r * 2.24}
                              preserveAspectRatio="xMidYMid meet"
                            />
                          ) : (
                            <circle cx="240" cy={cy} r={r} fill={flavor.color} stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
                          )}
                        </g>
                      );
                    })}

                    {iceCream.scoops.length > 0 && iceCream.syrupId !== 'none' && (() => {
                      const topIdx = iceCream.scoops.length - 1;
                      const topCy = 242 - topIdx * 50;
                      const topR = 54 - topIdx * 2.5;
                      const isRainbow = iceCream.syrupId === 'rainbow';
                      return (
                        <g transform={`translate(240, ${topCy})`}>
                          <path
                            d={`M-${topR * 0.85} -${topR * 0.2} A${topR} ${topR} 0 0 1 ${topR * 0.85} -${topR * 0.2} C${topR * 0.7} ${topR * 0.35}, ${topR * 0.45} ${topR * 0.4}, ${topR * 0.35} ${topR * 0.05} C${topR * 0.22} ${topR * 0.55}, ${topR * 0.05} ${topR * 0.5}, -${topR * 0.05} ${topR * 0.12} C-${topR * 0.22} ${topR * 0.52}, -${topR * 0.48} ${topR * 0.4}, -${topR * 0.5} ${topR * 0.04} Z`}
                            fill={isRainbow ? '#EC4899' : iceSyrup.color}
                            opacity="0.88"
                          />
                          {isRainbow && (
                            <g strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.85">
                              <path d={`M-${topR * 0.55} -${topR * 0.55} Q0 -${topR * 0.85} ${topR * 0.55} -${topR * 0.55}`} stroke="#FACC15" />
                              <path d={`M-${topR * 0.65} -${topR * 0.35} Q0 -${topR * 0.65} ${topR * 0.65} -${topR * 0.35}`} stroke="#38BDF8" />
                            </g>
                          )}
                        </g>
                      );
                    })()}

                    {iceCream.scoops.length > 0 && (() => {
                      const topIdx = iceCream.scoops.length - 1;
                      const topCy = 242 - topIdx * 50;
                      const topR = 62 - topIdx * 3;
                      return (
                        <g>
                          {iceCream.garnishes.includes('cream') && (
                            <image
                              href={getIceCreamGarnishAssetUrl('cream')}
                              x="192"
                              y={topCy - topR - 32}
                              width="96"
                              height="72"
                              preserveAspectRatio="xMidYMid meet"
                            />
                          )}
                          {iceCream.garnishes.includes('sprinkles') && (
                            <g transform={`translate(240, ${topCy - 12})`} strokeWidth="4" strokeLinecap="round">
                              <line x1="-28" y1="-12" x2="-18" y2="-18" stroke="#F43F5E" />
                              <line x1="12" y1="-22" x2="22" y2="-15" stroke="#38BDF8" />
                              <line x1="-10" y1="4" x2="2" y2="8" stroke="#FACC15" />
                              <line x1="20" y1="0" x2="30" y2="-8" stroke="#10B981" />
                              <line x1="-24" y1="8" x2="-15" y2="14" stroke="#A855F7" />
                            </g>
                          )}
                          {iceCream.garnishes.includes('stars') && (
                            <g fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5">
                              <polygon points="212,185 215,193 224,193 217,198 220,206 212,201 204,206 207,198 200,193 209,193" transform={`translate(0, ${topCy - 210})`} />
                              <polygon points="268,175 271,182 279,182 273,187 275,194 268,189 261,194 263,187 257,182 265,182" transform={`translate(0, ${topCy - 205})`} />
                            </g>
                          )}
                          {iceCream.garnishes.includes('marshmallow') && (
                            <g>
                              <image
                                href={getIceCreamGarnishAssetUrl('marshmallow')}
                                x="180"
                                y={topCy - topR * 0.85}
                                width="50"
                                height="50"
                                preserveAspectRatio="xMidYMid meet"
                              />
                              <image
                                href={getIceCreamGarnishAssetUrl('marshmallow')}
                                x="248"
                                y={topCy - topR * 0.8}
                                width="50"
                                height="50"
                                preserveAspectRatio="xMidYMid meet"
                              />
                            </g>
                          )}
                          {iceCream.garnishes.includes('berry') && (
                            <image
                              href={getIceCreamGarnishAssetUrl('berry')}
                              x="188"
                              y={topCy - topR - 14}
                              width="48"
                              height="48"
                              preserveAspectRatio="xMidYMid meet"
                            />
                          )}
                          {iceCream.garnishes.includes('cherry') && (
                            <image
                              href={getIceCreamGarnishAssetUrl('cherry')}
                              x="216"
                              y={topCy - topR - (iceCream.garnishes.includes('cream') ? 56 : 30)}
                              width="48"
                              height="48"
                              preserveAspectRatio="xMidYMid meet"
                            />
                          )}
                        </g>
                      );
                    })()}
                  </g>
                )}
              </g>
            )}

            {/* ================= 4. SOUP MODE (with interactive rotating spoon!) ================= */}
            {mode === 'soup' && (
              <g>
                <path d="M74 220 C42 220, 42 276, 76 276" fill="none" stroke="#64748B" strokeWidth="14" strokeLinecap="round" />
                <path d="M406 220 C438 220, 438 276, 404 276" fill="none" stroke="#64748B" strokeWidth="14" strokeLinecap="round" />

                <path
                  d="M78 210 L402 210 L386 355 Q376 410 240 410 Q104 410 94 355 Z"
                  fill={soup.inBowl ? '#FFFFFF' : '#94A3B8'}
                  stroke={soup.inBowl ? '#CBD5E1' : '#475569'}
                  strokeWidth="6"
                />
                {!soup.inBowl && (
                  <path d="M98 308 Q240 326 382 308" fill="none" stroke="#CBD5E1" strokeWidth="6" opacity="0.6" />
                )}

                <ellipse
                  cx="240"
                  cy="210"
                  rx="164"
                  ry="88"
                  fill={soup.inBowl ? '#F8FAFC' : '#CBD5E1'}
                  stroke={soup.inBowl ? '#94A3B8' : '#475569'}
                  strokeWidth="6"
                />

                {mealPhase === 'crumbs' ? (
                  <g>
                    {/* Nearly empty pot/bowl with tasty broth drops */}
                    <ellipse cx="240" cy="212" rx="148" ry="76" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="4" />
                    <g fill={soupBroth.color} opacity="0.65">
                      <ellipse cx="205" cy="222" rx="20" ry="9" />
                      <ellipse cx="272" cy="204" rx="16" ry="7" />
                      <circle cx="240" cy="238" r="7" />
                    </g>
                    <g fill="#D97706">
                      <circle cx="226" cy="210" r="4" />
                      <circle cx="256" cy="228" r="3.5" />
                    </g>
                  </g>
                ) : (Boolean(soup.brothId) || soup.ingredients.length > 0) ? (
                  <g>
                    {/* Broth */}
                    <ellipse
                      cx="240"
                      cy="212"
                      rx="148"
                      ry="76"
                      fill={soupBroth.color}
                      stroke={soupBroth.rimColor}
                      strokeWidth="4"
                    />

                    {/* Broth Swirl Ripples */}
                    <g
                      transform={`translate(240, 212) rotate(${soup.stirAngle})`}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      opacity="0.48"
                    >
                      <path d="M-88 0 A88 40 0 0 1 88 0" />
                      <path d="M-48 10 A48 22 0 0 0 48 10" />
                    </g>

                    {/* Floating Ingredients */}
                    {soup.ingredients.map((item) => {
                      const angle = item.angle + (soup.stirAngle * Math.PI) / 180;
                      const ix = 240 + Math.cos(angle) * item.radius * 116;
                      const iy = 212 + Math.sin(angle) * item.radius * 52;
                      return renderSoupIngredientPng(
                        item.ingredientId,
                        ix,
                        iy,
                        item.rotation + soup.stirAngle * 0.5,
                        item.uid
                      );
                    })}

                    {/* Interactive Wooden Spoon orbiting inside the pot! */}
                    <g transform={`translate(${spoonX}, ${spoonY}) rotate(${18 + Math.cos(spoonAngleRad) * 18})`}>
                      {/* Spoon bowl dipped into broth */}
                      <ellipse cx="0" cy="6" rx="22" ry="13" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
                      <ellipse cx="0" cy="5" rx="16" ry="8" fill="#D97706" />
                      {/* Broth ripple ring around spoon */}
                      <ellipse cx="0" cy="10" rx="28" ry="14" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.55" />
                      {/* Wooden Spoon Handle */}
                      <rect x="-6" y="-118" width="12" height="122" rx="6" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
                      <circle cx="0" cy="-110" r="4" fill="#FEF3C7" opacity="0.6" />
                    </g>

                    <g fill="#FFFFFF" opacity="0.65">
                      <circle cx="176" cy="196" r="5" />
                      <circle cx="295" cy="224" r="6" />
                      <circle cx="232" cy="176" r="4" />
                    </g>
                    <g fill="none" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.72">
                      <path d="M170 112 Q158 84 176 58" />
                      <path d="M240 100 Q254 72 238 44" />
                      <path d="M310 112 Q324 84 306 58" />
                    </g>
                  </g>
                ) : (
                  <ellipse cx="240" cy="212" rx="148" ry="76" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="4" />
                )}
              </g>
            )}

            {/* ================= 5. SANDWICH MODE ================= */}
            {mode === 'sandwich' && (
              <g>
                <ellipse cx="240" cy="390" rx="185" ry="44" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" />
                <ellipse cx="240" cy="388" rx="145" ry="30" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2.5" />

                {mealPhase === 'crumbs' ? (
                  <g>
                    {/* Sandwich Crumbs on Empty Plate */}
                    <g fill="#D97706">
                      <circle cx="178" cy="384" r="4.5" />
                      <circle cx="215" cy="396" r="5" />
                      <circle cx="248" cy="382" r="4" />
                      <circle cx="288" cy="394" r="5" />
                      <circle cx="312" cy="382" r="3.5" />
                      <circle cx="195" cy="398" r="3" />
                      <circle cx="265" cy="398" r="3.5" />
                    </g>
                    <ellipse cx="232" cy="388" rx="14" ry="5" fill="#22C55E" opacity="0.55" />
                    <ellipse cx="264" cy="386" rx="10" ry="4" fill="#FACC15" opacity="0.65" />
                  </g>
                ) : (
                  (() => {
                    const hasAnySandwich =
                      sandwich.layers.length > 0 ||
                      sandwich.hasTopBread ||
                      sandwich.spreadId !== 'none';
                    if (!hasAnySandwich) {
                      return null;
                    }
                    const bottomY = 358;
                    return (
                      <g>
                        <rect
                          x="108"
                          y={bottomY - 16}
                          width="264"
                          height="34"
                          rx={breadDef.id === 'bun' || breadDef.id === 'baguette' ? 17 : 10}
                          fill={breadDef.crustColor}
                          stroke="rgba(0,0,0,0.18)"
                          strokeWidth="2.5"
                        />
                        <rect
                          x="116"
                          y={bottomY - 14}
                          width="248"
                          height="16"
                          rx="8"
                          fill={breadDef.crumbColor}
                        />
                        {spreadDef.id !== 'none' && (
                          <ellipse cx="240" cy={bottomY - 14} rx="116" ry="7" fill={spreadDef.color} />
                        )}

                        {sandwich.layers.map((layerId, idx) =>
                          renderSandwichLayerSvg(layerId, bottomY - 26 - idx * 22, idx)
                        )}

                        {sandwich.hasTopBread && (() => {
                          const topY = bottomY - 32 - sandwich.layers.length * 22;
                          if (breadDef.id === 'bun') {
                            return (
                              <g>
                                <path
                                  d={`M108 ${topY + 6} C108 ${topY - 56}, 372 ${topY - 56}, 372 ${topY + 6} Z`}
                                  fill={breadDef.crustColor}
                                  stroke="rgba(0,0,0,0.18)"
                                  strokeWidth="2.5"
                                />
                                <g fill="#FEF3C7">
                                  <ellipse cx="184" cy={topY - 22} rx="6" ry="3" transform={`rotate(-18 184 ${topY - 22})`} />
                                  <ellipse cx="240" cy={topY - 30} rx="6" ry="3" />
                                  <ellipse cx="294" cy={topY - 20} rx="6" ry="3" transform={`rotate(20 294 ${topY - 20})`} />
                                  <ellipse cx="212" cy={topY - 12} rx="5" ry="2.5" />
                                  <ellipse cx="268" cy={topY - 10} rx="5" ry="2.5" />
                                </g>
                              </g>
                            );
                          }
                          return (
                            <g>
                              <rect
                                x="108"
                                y={topY - 22}
                                width="264"
                                height="32"
                                rx={breadDef.id === 'baguette' ? 16 : 10}
                                fill={breadDef.crustColor}
                                stroke="rgba(0,0,0,0.18)"
                                strokeWidth="2.5"
                              />
                              <rect
                                x="116"
                                y={topY - 17}
                                width="248"
                                height="15"
                                rx="7"
                                fill={breadDef.crumbColor}
                              />
                            </g>
                          );
                        })()}
                      </g>
                    );
                  })()
                )}
              </g>
            )}
          </svg>
          )}

          {/* Active Stage Tool Visual (pizza topping or drink stir spoon) when touching directly */}
          {stageCursor && !activeDrag && mealPhase === 'cooking' && (
            <div
              className="absolute pointer-events-none z-20 animate-pop-in"
              style={{
                left: `${stageCursor.leftPct}%`,
                top: `${stageCursor.topPct}%`,
                transform: `translate(-50%, ${stageCursor.pointerType === 'touch' ? '-95%' : '-55%'})`,
              }}
            >
              {stageCursor.kind === 'pizza_topping' ? (
                <PizzaToppingSvgIcon id={selectedPizzaTopping} className="w-12 h-12 drop-shadow-lg" />
              ) : (
                <StirSpoonSvgIcon className="w-12 h-12 drop-shadow-lg" />
              )}
            </div>
          )}

          {/* Animated Character Eating GIF Overlay */}
          {mealPhase === 'eating' && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-[#FFFDF8]/70 backdrop-blur-[2px] p-3 sm:p-5 animate-pop-in">
              <div
                className="relative w-full max-w-[300px] h-full max-h-[380px] rounded-[24px] border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: character.accentBg }}
              >
                {true ? (
                  <ReactionHero
                    character={character}
                    reaction={reaction}
                    runKey={`stage-${eatRunId}`}
                    eatSrc={`/assets/eat-animations/${character.id}.webp?run=${eatRunId}`}
                  />
                ) : !imageError ? (
                  <img
                    src={character.imageSrc}
                    alt={character.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover animate-gentle-float"
                  />
                ) : (
                  <span className="font-display font-extrabold text-4xl text-[#24211D]">
                    {character.name}
                  </span>
                )}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 px-4 py-1.5 rounded-2xl shadow-lg border-2 border-[#FF6B4A] whitespace-nowrap">
                  <Heart className="w-5 h-5 text-[#FF3B5C] fill-[#FF3B5C]" />
                  <span className="font-display font-extrabold text-sm sm:text-base text-[#24211D]">
                    {mode === 'drinks' ? 'Буль-буль!' : 'Ням-ням!'}
                  </span>
                  <Sparkles className="w-5 h-5 text-[#FACC15]" />
                </div>
              </div>
            </div>
          )}

          {mode === 'pizza' && pizza.isBaked && mealPhase === 'cooking' && (
            <div className="absolute bottom-3 left-3 pointer-events-none flex items-center gap-1 text-xs font-bold text-[#B45309] bg-[#FEF3C7]/90 px-2.5 py-1 rounded-xl">
              <Flame className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Из печки</span>
            </div>
          )}
        </div>

        {/* Praise Speech Bubble */}
        {praiseBubble && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pop-in">
            <div className="bg-white/95 backdrop-blur-xs text-[#24211D] font-display font-extrabold text-xs sm:text-base px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-lg border-2 border-[#FFD13B] whitespace-nowrap">
              {praiseBubble}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
