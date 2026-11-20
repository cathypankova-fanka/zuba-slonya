import React, { useEffect, useRef } from 'react';
import {
  CAKE_CANDLES,
  CAKE_FLAVORS,
  CAKE_ROSETTES,
  CAKE_TOPPINGS,
  CakeCandleId,
  CakeFlavorId,
  CakeRosetteId,
  CakeState,
  CakeToolTab,
  CakeToppingId,
  DRINK_ADDONS,
  DRINK_CATEGORIES,
  DRINK_FLAVORS,
  DrinkAddonId,
  DrinkCategoryId,
  DrinkState,
  ICE_CREAM_BASES,
  ICE_CREAM_FLAVORS,
  ICE_CREAM_GARNISHES,
  ICE_CREAM_SYRUPS,
  IceCreamBaseId,
  IceCreamGarnishId,
  IceCreamState,
  MESS_PRESETS,
  MessType,
  PIZZA_SAUCES,
  PIZZA_TOPPINGS,
  PizzaState,
  PizzaToppingId,
  SANDWICH_BREADS,
  SANDWICH_FILLINGS,
  SANDWICH_SPREADS,
  SandwichBreadId,
  SandwichFillingId,
  SandwichState,
  SOUP_BROTHS,
  SOUP_INGREDIENTS,
  SoupIngredientId,
  SoupState,
  WashToolMode,
} from '../data/kitchenData';
import {
  getCakeBaseAssetUrl,
  getCakeCandleAssetUrl,
  getCakeRosetteAssetUrl,
  getCakeToppingAssetUrl,
} from '../utils/itemAssets';
import { DraggableToolButton, useDragContext } from './DragContext';
import {
  DrinkAddonSvgIcon,
  DrinkCategorySvgIcon,
  DrinkFlavorCupSvgIcon,
  IceCreamBaseSvgIcon,
  IceCreamGarnishSvgIcon,
  IceCreamScoopSvgIcon,
  IceCreamSyrupBottleSvgIcon,
  MessPresetSvg,
  MinusLayerSvgIcon,
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
  WashRefreshSvgIcon,
  WashToolSvg,
} from './KitchenIllustrations';

interface ModeToolbarProps {
  mode: 'wash' | 'pizza' | 'icecream' | 'drinks' | 'soup' | 'sandwich' | 'cake';

  // Wash
  washTool: WashToolMode;
  messType: MessType;
  onSelectWashTool: (tool: WashToolMode) => void;
  onResetMess: (messType?: MessType) => void;

  // Pizza
  pizza: PizzaState;
  selectedPizzaTopping: PizzaToppingId;
  onSelectPizzaTopping: (id: PizzaToppingId) => void;
  onUpdatePizza: (patch: Partial<PizzaState>) => void;
  onScatterPizzaTopping: (id: PizzaToppingId) => void;

  // Ice Cream
  iceCream: IceCreamState;
  onSelectIceCreamBase: (baseId: IceCreamBaseId) => void;
  onAddIceCreamScoop: (flavorId: string) => void;
  onPopIceCreamScoop: () => void;
  onSelectIceCreamSyrup: (syrupId: string) => void;
  onToggleIceCreamGarnish: (garnishId: IceCreamGarnishId) => void;

  // Drinks
  drink: DrinkState;
  onSelectDrinkCategory: (cat: DrinkCategoryId) => void;
  onSelectDrinkFlavor: (flavorId: string) => void;
  onToggleDrinkAddon: (addonId: DrinkAddonId) => void;
  onStirDrink: () => void;

  // Soup
  soup: SoupState;
  onSelectSoupBroth: (brothId: string) => void;
  onAddSoupIngredient: (ingredientId: SoupIngredientId) => void;
  onStirSoup: () => void;
  onToggleSoupBowl: () => void;

  // Sandwich
  sandwich: SandwichState;
  onSelectSandwichBread: (breadId: SandwichBreadId) => void;
  onSelectSandwichSpread: (spreadId: string) => void;
  onAddSandwichFilling: (fillingId: SandwichFillingId) => void;
  onPopSandwichFilling: () => void;
  onToggleSandwichTopBread: () => void;

  // Cake
  cake: CakeState;
  cakeTab: CakeToolTab;
  selectedCakeRosette: CakeRosetteId;
  selectedCakeTopping: CakeToppingId;
  selectedCakeCandle: CakeCandleId;
  onSelectCakeTab: (tab: CakeToolTab) => void;
  onSelectCakeBase: (cakeId: CakeFlavorId) => void;
  onSelectCakeRosette: (rosetteId: CakeRosetteId) => void;
  onSelectCakeTopping: (toppingId: CakeToppingId) => void;
  onSelectCakeCandle: (candleId: CakeCandleId) => void;
}

const iconBtnCls = (active: boolean) =>
  `toy-chip p-1.5 flex items-center justify-center shrink-0 cursor-pointer outline-none ${active ? 'toy-chip-on' : ''}`;

export const ModeToolbar: React.FC<ModeToolbarProps> = (props) => {
  const { mode } = props;
  const { activeDrag, registerFeedTarget } = useDragContext();
  const ovenDropRef = useRef<HTMLDivElement | null>(null);
  const latestToggleBakeRef = useRef<() => void>(() => {});
  latestToggleBakeRef.current = () => {
    props.onUpdatePizza({ isBaked: !props.pizza.isBaked });
  };

  useEffect(() => {
    if (mode !== 'pizza') {
      registerFeedTarget('pizza-oven', null);
      return;
    }
    registerFeedTarget('pizza-oven', {
      accepts: (item) => item.kind === 'finished_dish' && item.mode === 'pizza',
      containsPoint: (clientX, clientY) => {
        const el = ovenDropRef.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const pad = 18;
        return (
          clientX >= rect.left - pad &&
          clientX <= rect.right + pad &&
          clientY >= rect.top - pad &&
          clientY <= rect.bottom + pad
        );
      },
      onDrop: () => {
        latestToggleBakeRef.current();
      },
    });
    return () => {
      registerFeedTarget('pizza-oven', null);
    };
  }, [mode, registerFeedTarget]);

  const isCarryingPizza =
    activeDrag?.item.kind === 'finished_dish' && activeDrag.item.mode === 'pizza';
  const isOvenHovered = activeDrag?.overFeedTargetId === 'pizza-oven';

  return (
    <aside
      aria-label="Инструменты игры"
      className="order-1 lg:order-3 toy-panel p-2 sm:p-3 lg:p-4 w-full lg:w-[340px] shrink-0 flex flex-col gap-2 lg:gap-3.5 lg:overflow-y-auto lg:max-h-[calc(100vh-110px)] no-scrollbar"
    >
      {/* ==================== WASH MODE ==================== */}
      {mode === 'wash' && (
        <>
          {/* Soap / Sponge / Shower / Dryer Icons */}
          <div className="toy-tray flex items-center lg:grid lg:grid-cols-4 justify-items-center gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 shrink-0">
            {(
              [
                { id: 'soap', label: 'Мыло' },
                { id: 'sponge', label: 'Мочалка' },
                { id: 'shower', label: 'Душ' },
                { id: 'dryer', label: 'Фен' },
              ] as Array<{ id: WashToolMode; label: string }>
            ).map((t) => (
              <DraggableToolButton
                key={t.id}
                dragItem={{ kind: 'wash_tool', tool: t.id, label: t.label }}
                onTap={() => props.onSelectWashTool(t.id)}
                aria-label={t.label}
                title={t.label}
                className={iconBtnCls(props.washTool === t.id)}
              >
                <WashToolSvg tool={t.id} className="w-11 h-11 lg:w-12 lg:h-12" />
              </DraggableToolButton>
            ))}
          </div>

          {/* Mess Preset Icons */}
          <div className="toy-tray flex lg:grid lg:grid-cols-5 items-center justify-items-center gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x px-2 pt-2.5 pb-1 lg:px-2 lg:pt-2.5 lg:pb-2 border-t border-[#E6DFD0]/70 shrink-0">
              {MESS_PRESETS.map((preset) => (
                <DraggableToolButton
                  key={preset.id}
                  dragItem={{ kind: 'mess_preset', messType: preset.id, label: preset.name }}
                  onTap={() => props.onResetMess(preset.id)}
                  aria-label={preset.name}
                  title={preset.name}
                  className={iconBtnCls(props.messType === preset.id)}
                >
                  <MessPresetSvg messType={preset.id} className="w-9 h-9 lg:w-10 lg:h-10" />
                </DraggableToolButton>
              ))}
              <button
                type="button"
                onClick={() => props.onResetMess(props.messType)}
                aria-label="Испачкать снова"
                title="Испачкать снова"
                className={iconBtnCls(false)}
              >
                <WashRefreshSvgIcon className="w-9 h-9 lg:w-10 lg:h-10" />
              </button>
            </div>
        </>
      )}

      {/* ==================== PIZZA MODE ==================== */}
      {mode === 'pizza' && (
        <>
          <div className="toy-tray flex items-center lg:flex-wrap lg:justify-center gap-2 lg:gap-2.5 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 shrink-0">
              {PIZZA_SAUCES.map((s) => (
                <DraggableToolButton
                  key={s.id}
                  dragItem={{
                    kind: 'pizza_sauce',
                    sauceId: s.id,
                    color: s.color,
                    ringColor: s.ringColor,
                    label: s.name,
                  }}
                  onTap={() => props.onUpdatePizza({ sauceId: s.id })}
                  title={s.name}
                  aria-label={s.name}
                  className={iconBtnCls(props.pizza.sauceId === s.id)}
                >
                  <PizzaSauceSvgIcon
                    sauceId={s.id}
                    color={s.color}
                    ringColor={s.ringColor}
                    className="w-9 h-9 lg:w-11 lg:h-11"
                  />
                </DraggableToolButton>
              ))}

              <DraggableToolButton
                dragItem={{ kind: 'pizza_cheese', label: 'Сыр' }}
                onTap={() => props.onUpdatePizza({ hasCheese: !props.pizza.hasCheese })}
                title="Сыр"
                aria-label="Сыр"
                className={iconBtnCls(props.pizza.hasCheese)}
              >
                <PizzaCheeseSvgIcon className="w-9 h-9 lg:w-11 lg:h-11" />
              </DraggableToolButton>
          </div>

          <div className="toy-tray flex lg:grid lg:grid-cols-4 gap-2 lg:gap-2.5 overflow-x-auto lg:overflow-x-visible lg:max-h-[300px] lg:overflow-y-auto no-scrollbar touch-pan-x p-2.5 justify-items-center">
            {PIZZA_TOPPINGS.map((t) => (
              <DraggableToolButton
                key={t.id}
                dragItem={{ kind: 'pizza_topping', toppingId: t.id, label: t.name }}
                onTap={() => {
                  props.onSelectPizzaTopping(t.id);
                  props.onScatterPizzaTopping(t.id);
                }}
                aria-label={t.name}
                title={t.name}
                className={iconBtnCls(props.selectedPizzaTopping === t.id)}
              >
                <PizzaToppingSvgIcon id={t.id} className="w-10 h-10 lg:w-12 lg:h-12" />
              </DraggableToolButton>
            ))}
          </div>

          <div className="toy-tray py-2 lg:py-3 flex items-center justify-center gap-4 lg:gap-6 shrink-0">
            <div ref={ovenDropRef} className="inline-flex">
              <DraggableToolButton
                dragItem={{ kind: 'pizza_oven', baked: !props.pizza.isBaked, label: 'В печь' }}
                onTap={() => props.onUpdatePizza({ isBaked: !props.pizza.isBaked })}
                title="В печь"
                aria-label="Испечь"
                className={`p-2.5 lg:p-3 rounded-full flex items-center justify-center shrink-0 transition-transform duration-150 cursor-pointer border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A] ${
                  isOvenHovered
                    ? 'scale-110 ring-4 ring-[#FF6B4A] bg-[#FEF3C7] shadow-xl animate-pulse'
                    : isCarryingPizza
                    ? 'scale-105 ring-3 ring-[#F59E0B] bg-[#FFFBEB] shadow-md'
                    : props.pizza.isBaked
                    ? 'scale-105 ring-3 ring-[#FF6B4A] bg-[#FFFBEB]/90 drop-shadow-md'
                    : 'bg-transparent hover:scale-105 active:scale-95 drop-shadow-xs'
                }`}
              >
                <PizzaOvenSvgIcon
                  baked={props.pizza.isBaked || isOvenHovered}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
                />
              </DraggableToolButton>
            </div>

            <DraggableToolButton
              dragItem={{ kind: 'pizza_cutter', label: 'Нарезать' }}
              onTap={() => props.onUpdatePizza({ isSliced: !props.pizza.isSliced })}
              title="Нарезать"
              aria-label="Нарезать"
              className={`p-2.5 lg:p-3 rounded-full flex items-center justify-center shrink-0 transition-transform duration-150 cursor-pointer border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A] ${
                props.pizza.isSliced
                  ? 'scale-105 ring-3 ring-[#FF6B4A] bg-[#FFFBEB]/90 drop-shadow-md'
                  : 'bg-transparent hover:scale-105 active:scale-95 drop-shadow-xs'
              }`}
            >
              <PizzaCutterSvgIcon className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
            </DraggableToolButton>
          </div>
        </>
      )}

      {/* ==================== ICE CREAM MODE ==================== */}
      {mode === 'icecream' && (
        <>
          <div className="toy-tray flex items-center lg:flex-wrap lg:justify-center gap-2 lg:gap-2.5 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 shrink-0">
              {ICE_CREAM_BASES.map((b) => (
                <DraggableToolButton
                  key={b.id}
                  dragItem={{ kind: 'icecream_base', baseId: b.id, label: b.name }}
                  onTap={() => props.onSelectIceCreamBase(b.id)}
                  aria-label={b.name}
                  title={b.name}
                  className={iconBtnCls(props.iceCream.baseId === b.id)}
                >
                  <IceCreamBaseSvgIcon id={b.id} className="w-9 h-9 lg:w-11 lg:h-11" />
                </DraggableToolButton>
              ))}
              <button
                type="button"
                onClick={props.onPopIceCreamScoop}
                disabled={props.iceCream.scoops.length === 0}
                aria-label="Убрать шарик"
                title="Убрать шарик"
                className={`${iconBtnCls(false)} disabled:opacity-35`}
              >
                <MinusLayerSvgIcon className="w-8 h-8 lg:w-9 lg:h-9" />
              </button>
          </div>

          <div className="toy-tray flex lg:grid lg:grid-cols-5 gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2.5 justify-items-center">
            {ICE_CREAM_FLAVORS.map((f) => (
              <DraggableToolButton
                key={f.id}
                dragItem={{
                  kind: 'icecream_scoop',
                  flavorId: f.id,
                  color: f.color,
                  highlight: f.highlight,
                  label: f.name,
                }}
                onTap={() => props.onAddIceCreamScoop(f.id)}
                aria-label={f.name}
                title={f.name}
                className={iconBtnCls(false)}
              >
                <IceCreamScoopSvgIcon
                  flavorId={f.id}
                  color={f.color}
                  highlight={f.highlight}
                  className="w-9 h-9 lg:w-10 lg:h-10"
                />
              </DraggableToolButton>
            ))}
          </div>

          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x px-2 py-1 lg:p-0">
            <div className="toy-tray flex items-center lg:flex-wrap lg:justify-center gap-1.5 lg:gap-2 shrink-0 p-2">
              {ICE_CREAM_SYRUPS.map((s) => (
                <DraggableToolButton
                  key={s.id}
                  dragItem={{ kind: 'icecream_syrup', syrupId: s.id, color: s.color, label: s.name }}
                  onTap={() => props.onSelectIceCreamSyrup(s.id)}
                  aria-label={s.name}
                  title={s.name}
                  className={iconBtnCls(props.iceCream.syrupId === s.id)}
                >
                  <IceCreamSyrupBottleSvgIcon
                    syrupId={s.id}
                    color={s.color}
                    className="w-9 h-9 lg:w-10 lg:h-10"
                  />
                </DraggableToolButton>
              ))}
            </div>

            <div className="toy-tray flex lg:grid lg:grid-cols-4 gap-2 shrink-0 justify-items-center p-2.5">
              {ICE_CREAM_GARNISHES.map((g) => (
                <DraggableToolButton
                  key={g.id}
                  dragItem={{ kind: 'icecream_garnish', garnishId: g.id, label: g.name }}
                  onTap={() => props.onToggleIceCreamGarnish(g.id)}
                  aria-label={g.name}
                  title={g.name}
                  className={iconBtnCls(props.iceCream.garnishes.includes(g.id))}
                >
                  <IceCreamGarnishSvgIcon id={g.id} className="w-9 h-9 lg:w-11 lg:h-11" />
                </DraggableToolButton>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ==================== DRINKS MODE ==================== */}
      {mode === 'drinks' && (
        <div className="flex flex-row lg:flex-col items-stretch gap-1.5 lg:gap-3 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x">
          <div className="toy-tray flex items-center lg:flex-wrap lg:justify-around gap-1.5 lg:gap-2 p-1.5 lg:p-2 shrink-0">
              {DRINK_CATEGORIES.map((cat) => (
                <DraggableToolButton
                  key={cat.id}
                  dragItem={{ kind: 'drink_category', category: cat.id, label: cat.name }}
                  onTap={() => props.onSelectDrinkCategory(cat.id)}
                  aria-label={cat.name}
                  title={cat.name}
                  className={iconBtnCls(props.drink.category === cat.id)}
                >
                  <DrinkCategorySvgIcon id={cat.id} className="w-10 h-10 lg:w-12 lg:h-12" />
                </DraggableToolButton>
              ))}
          </div>

          <div className="toy-tray flex lg:grid lg:grid-cols-5 gap-1.5 lg:gap-2 p-1.5 lg:p-2.5 justify-items-center shrink-0">
            {DRINK_FLAVORS.filter((f) => f.category === props.drink.category).map((f) => (
              <DraggableToolButton
                key={f.id}
                dragItem={{
                  kind: 'drink_flavor',
                  flavorId: f.id,
                  liquidTop: f.liquidTop,
                  liquidBottom: f.liquidBottom,
                  foamColor: f.foamColor,
                  label: f.name,
                }}
                onTap={() => props.onSelectDrinkFlavor(f.id)}
                aria-label={f.name}
                title={f.name}
                className={iconBtnCls(props.drink.flavorId === f.id)}
              >
                <DrinkFlavorCupSvgIcon
                  flavorId={f.id}
                  liquidTop={f.liquidTop}
                  liquidBottom={f.liquidBottom}
                  foamColor={f.foamColor}
                  className="w-9 h-9 lg:w-10 lg:h-10"
                />
              </DraggableToolButton>
            ))}
          </div>

          <div className="toy-tray flex lg:grid lg:grid-cols-4 gap-1.5 lg:gap-2 p-1.5 lg:p-2.5 justify-items-center shrink-0">
            {DRINK_ADDONS.map((a) => (
              <DraggableToolButton
                key={a.id}
                dragItem={{ kind: 'drink_addon', addonId: a.id, label: a.name }}
                onTap={() => props.onToggleDrinkAddon(a.id)}
                title={a.name}
                aria-label={a.name}
                className={iconBtnCls(props.drink.addons.includes(a.id))}
              >
                <DrinkAddonSvgIcon id={a.id} className="w-9 h-9 lg:w-11 lg:h-11" />
              </DraggableToolButton>
            ))}
          </div>

          <div className="toy-tray py-1 lg:py-3 px-1 flex items-center justify-center shrink-0">
            <DraggableToolButton
              dragItem={{ kind: 'drink_stir', label: 'Размешать' }}
              onTap={props.onStirDrink}
              title="Размешать"
              aria-label="Размешать"
              className="p-1 lg:p-3 rounded-full flex items-center justify-center shrink-0 transition-transform duration-150 cursor-pointer bg-transparent border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B4A] hover:scale-105 active:scale-95 drop-shadow-xs"
            >
              <StirSpoonSvgIcon className="w-11 h-11 sm:w-12 sm:h-12 lg:w-20 lg:h-20" />
            </DraggableToolButton>
          </div>
        </div>
      )}

      {/* ==================== SOUP MODE ==================== */}
      {mode === 'soup' && (
        <>
          <div className="toy-tray flex items-center lg:flex-wrap lg:justify-center gap-2 lg:gap-2.5 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 shrink-0">
              {SOUP_BROTHS.map((b) => (
                <DraggableToolButton
                  key={b.id}
                  dragItem={{
                    kind: 'soup_broth',
                    brothId: b.id,
                    color: b.color,
                    rimColor: b.rimColor,
                    label: b.name,
                  }}
                  onTap={() => props.onSelectSoupBroth(b.id)}
                  title={b.name}
                  aria-label={b.name}
                  className={iconBtnCls(props.soup.brothId === b.id)}
                >
                  <SoupBrothSvgIcon
                    brothId={b.id}
                    color={b.color}
                    rimColor={b.rimColor}
                    className="w-9 h-9 lg:w-10 lg:h-10"
                  />
                </DraggableToolButton>
              ))}

              <DraggableToolButton
                dragItem={{
                  kind: 'soup_pot_toggle',
                  inBowl: !props.soup.inBowl,
                  label: props.soup.inBowl ? 'В кастрюлю' : 'В тарелку',
                }}
                onTap={props.onToggleSoupBowl}
                title={props.soup.inBowl ? 'В кастрюлю' : 'В тарелку'}
                aria-label={props.soup.inBowl ? 'В кастрюлю' : 'В тарелку'}
                className={iconBtnCls(props.soup.inBowl)}
              >
                <SoupPotToggleSvgIcon inBowl={props.soup.inBowl} className="w-9 h-9 lg:w-10 lg:h-10" />
              </DraggableToolButton>
          </div>

          <div className="toy-tray flex lg:grid lg:grid-cols-4 gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[290px] lg:overflow-y-auto no-scrollbar touch-pan-x p-2.5 justify-items-center">
            {SOUP_INGREDIENTS.map((ing) => (
              <DraggableToolButton
                key={ing.id}
                dragItem={{ kind: 'soup_ingredient', ingredientId: ing.id, label: ing.name }}
                onTap={() => props.onAddSoupIngredient(ing.id)}
                aria-label={ing.name}
                title={ing.name}
                className={iconBtnCls(false)}
              >
                <SoupIngredientSvgIcon id={ing.id} className="w-10 h-10 lg:w-12 lg:h-12" />
              </DraggableToolButton>
            ))}
          </div>
        </>
      )}

      {/* ==================== SANDWICH MODE ==================== */}
      {mode === 'sandwich' && (
        <>
          <div className="toy-tray flex items-center lg:flex-wrap lg:justify-center gap-2 lg:gap-2.5 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 shrink-0">
              {SANDWICH_BREADS.map((b) => (
                <DraggableToolButton
                  key={b.id}
                  dragItem={{ kind: 'sandwich_bread', breadId: b.id, label: b.name }}
                  onTap={() => props.onSelectSandwichBread(b.id)}
                  title={b.name}
                  aria-label={b.name}
                  className={iconBtnCls(props.sandwich.breadId === b.id)}
                >
                  <SandwichBreadSvgIcon id={b.id} className="w-9 h-9 lg:w-11 lg:h-11" />
                </DraggableToolButton>
              ))}
              <DraggableToolButton
                dragItem={{
                  kind: 'sandwich_top_bread',
                  hasTop: !props.sandwich.hasTopBread,
                  label: 'Хлеб сверху',
                }}
                onTap={props.onToggleSandwichTopBread}
                title="Хлеб сверху"
                aria-label="Хлеб сверху"
                className={iconBtnCls(props.sandwich.hasTopBread)}
              >
                <SandwichTopBreadSvgIcon
                  hasTop={props.sandwich.hasTopBread}
                  className="w-9 h-9 lg:w-10 lg:h-10"
                />
              </DraggableToolButton>
              <button
                type="button"
                onClick={props.onPopSandwichFilling}
                disabled={props.sandwich.layers.length === 0}
                aria-label="Убрать верхний слой"
                title="Убрать верхний слой"
                className={`${iconBtnCls(false)} disabled:opacity-35`}
              >
                <MinusLayerSvgIcon className="w-8 h-8 lg:w-9 lg:h-9" />
              </button>
          </div>

          <div className="toy-tray flex items-center lg:flex-wrap lg:justify-center gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2">
            {SANDWICH_SPREADS.map((s) => (
              <DraggableToolButton
                key={s.id}
                dragItem={{
                  kind: 'sandwich_spread',
                  spreadId: s.id,
                  color: s.color,
                  label: s.name,
                }}
                onTap={() => props.onSelectSandwichSpread(s.id)}
                aria-label={s.name}
                title={s.name}
                className={iconBtnCls(props.sandwich.spreadId === s.id)}
              >
                <SandwichSpreadSvgIcon
                  spreadId={s.id}
                  color={s.color}
                  className="w-8 h-8 lg:w-9 lg:h-9"
                />
              </DraggableToolButton>
            ))}
          </div>

          <div className="toy-tray flex lg:grid lg:grid-cols-4 gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[250px] lg:overflow-y-auto no-scrollbar touch-pan-x p-2.5 justify-items-center">
            {SANDWICH_FILLINGS.map((f) => (
              <DraggableToolButton
                key={f.id}
                dragItem={{ kind: 'sandwich_filling', fillingId: f.id, label: f.name }}
                onTap={() => props.onAddSandwichFilling(f.id)}
                aria-label={f.name}
                title={f.name}
                className={iconBtnCls(false)}
              >
                <SandwichFillingSvgIcon id={f.id} className="w-10 h-10 lg:w-12 lg:h-12" />
              </DraggableToolButton>
            ))}
          </div>
        </>
      )}

      {/* ==================== CAKE MODE ==================== */}
      {mode === 'cake' && (
        <>
          <div className="toy-tray flex items-center lg:grid lg:grid-cols-4 justify-items-center gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 shrink-0">
            {(
              [
                { id: 'cake', label: 'Корж', img: getCakeBaseAssetUrl('pink') },
                { id: 'pipe', label: 'Крем', img: getCakeRosetteAssetUrl('pink') },
                { id: 'top', label: 'Украшения', img: getCakeToppingAssetUrl('strawberry') },
                { id: 'candle', label: 'Свечки', img: getCakeCandleAssetUrl('pink') },
              ] as Array<{ id: CakeToolTab; label: string; img: string }>
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => props.onSelectCakeTab(t.id)}
                aria-label={t.label}
                title={t.label}
                className={iconBtnCls(props.cakeTab === t.id)}
              >
                <img
                  src={t.img}
                  alt=""
                  draggable={false}
                  aria-hidden="true"
                  className="w-11 h-11 lg:w-12 lg:h-12 object-contain pointer-events-none select-none"
                />
              </button>
            ))}
          </div>

          <div className="border-t border-[#E6DFD0]/70 pt-2 lg:pt-3">
            {props.cakeTab === 'cake' && (
              <div className="toy-tray flex lg:grid lg:grid-cols-3 gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 justify-items-center">
                {CAKE_FLAVORS.map((c) => (
                  <DraggableToolButton
                    key={c.id}
                    dragItem={{ kind: 'cake_base', cakeId: c.id, label: c.name }}
                    onTap={() => props.onSelectCakeBase(c.id)}
                    aria-label={c.name}
                    title={c.name}
                    className={iconBtnCls(props.cake.cakeId === c.id)}
                  >
                    <img
                      src={getCakeBaseAssetUrl(c.id)}
                      alt=""
                      draggable={false}
                      aria-hidden="true"
                      className="w-12 h-12 lg:w-14 lg:h-14 object-contain pointer-events-none select-none"
                    />
                  </DraggableToolButton>
                ))}
              </div>
            )}

            {props.cakeTab === 'pipe' && (
              <div className="toy-tray flex lg:grid lg:grid-cols-3 gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 justify-items-center">
                {CAKE_ROSETTES.map((r) => (
                  <DraggableToolButton
                    key={r.id}
                    dragItem={{ kind: 'cake_rosette', rosetteId: r.id, label: r.name }}
                    onTap={() => props.onSelectCakeRosette(r.id)}
                    aria-label={r.name}
                    title={r.name}
                    className={iconBtnCls(props.selectedCakeRosette === r.id)}
                  >
                    <img
                      src={getCakeRosetteAssetUrl(r.id)}
                      alt=""
                      draggable={false}
                      aria-hidden="true"
                      className="w-11 h-11 lg:w-13 lg:h-13 object-contain pointer-events-none select-none"
                    />
                  </DraggableToolButton>
                ))}
              </div>
            )}

            {props.cakeTab === 'top' && (
              <div className="toy-tray flex lg:grid lg:grid-cols-4 gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[300px] lg:overflow-y-auto no-scrollbar touch-pan-x p-2 justify-items-center">
                {CAKE_TOPPINGS.map((t) => (
                  <DraggableToolButton
                    key={t.id}
                    dragItem={{ kind: 'cake_topping', toppingId: t.id, label: t.name }}
                    onTap={() => props.onSelectCakeTopping(t.id)}
                    aria-label={t.name}
                    title={t.name}
                    className={iconBtnCls(props.selectedCakeTopping === t.id)}
                  >
                    <img
                      src={getCakeToppingAssetUrl(t.id)}
                      alt=""
                      draggable={false}
                      aria-hidden="true"
                      className="w-10 h-10 lg:w-12 lg:h-12 object-contain pointer-events-none select-none"
                    />
                  </DraggableToolButton>
                ))}
              </div>
            )}

            {props.cakeTab === 'candle' && (
              <div className="toy-tray flex lg:grid lg:grid-cols-3 gap-2 lg:gap-3 overflow-x-auto lg:overflow-x-visible no-scrollbar touch-pan-x p-2 justify-items-center">
                {CAKE_CANDLES.map((c) => (
                  <DraggableToolButton
                    key={c.id}
                    dragItem={{ kind: 'cake_candle', candleId: c.id, label: c.name }}
                    onTap={() => props.onSelectCakeCandle(c.id)}
                    aria-label={c.name}
                    title={c.name}
                    className={iconBtnCls(props.selectedCakeCandle === c.id)}
                  >
                    <img
                      src={getCakeCandleAssetUrl(c.id)}
                      alt=""
                      draggable={false}
                      aria-hidden="true"
                      className="w-9 h-12 lg:w-10 lg:h-14 object-contain pointer-events-none select-none"
                    />
                  </DraggableToolButton>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
