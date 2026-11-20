import { PatternStampId } from '../data/artTools';
import {
  CakeCandleId,
  CakeFlavorId,
  CakeRosetteId,
  CakeToppingId,
  DrinkAddonId,
  DrinkCategoryId,
  IceCreamBaseId,
  IceCreamGarnishId,
  KitchenMode,
  MessType,
  PizzaToppingId,
  SandwichBreadId,
  SandwichFillingId,
  SoupIngredientId,
  WashToolMode,
} from '../data/kitchenData';
import { ToolMode } from '../components/FaceArtStage';

export type DraggableItemPayload =
  | { kind: 'wash_tool'; tool: WashToolMode; label: string }
  | { kind: 'mess_preset'; messType: MessType; label: string }
  | { kind: 'art_tool'; tool: ToolMode; label: string }
  | { kind: 'paint_color'; hex: string; ringHex: string; label: string }
  | { kind: 'tshirt_color'; hex: string; ringHex: string; label: string }
  | { kind: 'face_mask'; maskId: string; svg: string; previewBg: string; label: string }
  | { kind: 'stamp'; stampId: PatternStampId; color: string; label: string }
  | { kind: 'sticker'; stickerId: string; svg: string; label: string }
  | { kind: 'pizza_sauce'; sauceId: string; color: string; ringColor: string; label: string }
  | { kind: 'pizza_cheese'; label: string }
  | { kind: 'pizza_oven'; baked: boolean; label: string }
  | { kind: 'pizza_cutter'; label: string }
  | { kind: 'pizza_topping'; toppingId: PizzaToppingId; label: string }
  | { kind: 'icecream_base'; baseId: IceCreamBaseId; label: string }
  | { kind: 'icecream_scoop'; flavorId: string; color: string; highlight: string; label: string }
  | { kind: 'icecream_syrup'; syrupId: string; color: string; label: string }
  | { kind: 'icecream_garnish'; garnishId: IceCreamGarnishId; label: string }
  | { kind: 'drink_category'; category: DrinkCategoryId; label: string }
  | {
      kind: 'drink_flavor';
      flavorId: string;
      liquidTop: string;
      liquidBottom: string;
      foamColor?: string;
      label: string;
    }
  | { kind: 'drink_addon'; addonId: DrinkAddonId; label: string }
  | { kind: 'drink_stir'; label: string }
  | { kind: 'soup_broth'; brothId: string; color: string; rimColor: string; label: string }
  | { kind: 'soup_pot_toggle'; inBowl: boolean; label: string }
  | { kind: 'soup_ingredient'; ingredientId: SoupIngredientId; label: string }
  | { kind: 'sandwich_bread'; breadId: SandwichBreadId; label: string }
  | { kind: 'sandwich_top_bread'; hasTop: boolean; label: string }
  | { kind: 'sandwich_spread'; spreadId: string; color: string; label: string }
  | { kind: 'sandwich_filling'; fillingId: SandwichFillingId; label: string }
  | { kind: 'cake_base'; cakeId: CakeFlavorId; label: string }
  | { kind: 'cake_rosette'; rosetteId: CakeRosetteId; label: string }
  | { kind: 'cake_topping'; toppingId: CakeToppingId; label: string }
  | { kind: 'cake_candle'; candleId: CakeCandleId; label: string }
  | {
      kind: 'finished_dish';
      mode: KitchenMode;
      label: string;
      sauceId?: string;
      sauceColor?: string;
      hasCheese?: boolean;
      isBaked?: boolean;
      scoopFlavorIds?: string[];
      scoopColors?: string[];
      iceBaseId?: IceCreamBaseId;
      drinkFlavorId?: string;
      drinkTop?: string;
      drinkBottom?: string;
      brothId?: string;
      brothColor?: string;
      inBowl?: boolean;
      breadId?: SandwichBreadId;
      breadColor?: string;
      crumbColor?: string;
      sandwichFillingIds?: SandwichFillingId[];
      cakeBaseId?: CakeFlavorId;
      cakeTopIds?: CakeToppingId[];
    };

export interface StageDropHandler {
  containsPoint: (clientX: number, clientY: number) => boolean;
  onDragEnter?: (item: DraggableItemPayload, clientX: number, clientY: number) => void;
  onDragMove?: (item: DraggableItemPayload, clientX: number, clientY: number) => void;
  onDragDrop: (item: DraggableItemPayload, clientX: number, clientY: number) => void;
  onDragCancel?: (item: DraggableItemPayload) => void;
}

export interface FeedDropTarget {
  containsPoint: (clientX: number, clientY: number) => boolean;
  accepts?: (item: DraggableItemPayload) => boolean;
  onDrop: () => void;
}
