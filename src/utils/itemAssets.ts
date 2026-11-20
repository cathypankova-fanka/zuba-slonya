import { stickerToDataUrl } from '../data/artTools';
import { faceArtMaskToDataUrl } from '../data/faceArtMasks';
import {
  CakeCandleId,
  CakeFlavorId,
  CakeRosetteId,
  CakeToppingId,
  DrinkAddonId,
  DrinkCategoryId,
  IceCreamBaseId,
  IceCreamGarnishId,
  MessType,
  PizzaToppingId,
  SandwichBreadId,
  SandwichFillingId,
  SoupIngredientId,
} from '../data/kitchenData';

export const PIZZA_DOUGH_PNG = '/assets/items/pizza/dough.webp';
export const PIZZA_CHEESE_LAYER_PNG = '/assets/items/pizza/cheese_layer.webp';
export const SOUP_POT_PNG = '/assets/items/soup/pot.webp';

const PIZZA_SAUCE_IDS = new Set(['tomato', 'cream', 'cheese', 'pesto']);
const ICECREAM_SYRUP_IDS = new Set([
  'strawberry',
  'chocolate',
  'caramel',
  'blueberry',
  'rainbow',
]);
const SOUP_BASE_IDS = new Set(['chicken', 'tomato', 'cheese', 'veggie', 'pumpkin']);
const SOUP_TOPPING_IDS = new Set<SoupIngredientId>(['crouton', 'herbs', 'sour_cream']);
const SANDWICH_SPREAD_IDS = new Set([
  'butter',
  'cream_cheese',
  'ketchup',
  'avocado',
  'jam',
  'choco',
]);

export function getStickerAssetUrl(stickerId: string, fallbackSvg?: string): string {
  if (stickerId) {
    return `/assets/items/accessories/${stickerId}.webp`;
  }
  return fallbackSvg ? stickerToDataUrl(fallbackSvg) : '';
}

export function getFaceMaskAssetUrl(maskId: string, fallbackSvg?: string): string {
  if (maskId) {
    return `/assets/items/facepaint/${maskId}.webp`;
  }
  return fallbackSvg ? faceArtMaskToDataUrl(fallbackSvg) : '';
}

export function getPizzaSauceAssetUrl(sauceId?: string): string | null {
  if (sauceId && PIZZA_SAUCE_IDS.has(sauceId)) {
    return `/assets/items/pizza/sauces/${sauceId}.webp`;
  }
  return null;
}

export function getPizzaToppingAssetUrl(toppingId: PizzaToppingId): string {
  return `/assets/items/pizza/toppings/${toppingId}.webp`;
}

export function getIceCreamBaseAssetUrl(baseId: IceCreamBaseId): string {
  return `/assets/items/icecream/cones/${baseId}.webp`;
}

export function getIceCreamFlavorAssetUrl(flavorId?: string): string | null {
  if (!flavorId) return null;
  return `/assets/items/icecream/flavors/${flavorId}.webp`;
}

export function getIceCreamSyrupAssetUrl(syrupId: string): string | null {
  if (ICECREAM_SYRUP_IDS.has(syrupId)) {
    return `/assets/items/icecream/syrups/${syrupId}.webp`;
  }
  return null;
}

export function getIceCreamGarnishAssetUrl(garnishId: IceCreamGarnishId): string {
  return `/assets/items/icecream/garnishes/${garnishId}.webp`;
}

export function getDrinkCategoryAssetUrl(category: DrinkCategoryId): string {
  return `/assets/items/drinks/categories/${category}.webp`;
}

export function getDrinkRecipeAssetUrl(flavorId?: string): string | null {
  if (!flavorId) return null;
  return `/assets/items/drinks/recipes/${flavorId}.webp`;
}

export function getDrinkExtraAssetUrl(addonId: DrinkAddonId): string {
  return `/assets/items/drinks/extras/${addonId}.webp`;
}

export function getSoupBaseAssetUrl(brothId?: string): string | null {
  if (brothId && SOUP_BASE_IDS.has(brothId)) {
    return `/assets/items/soup/bases/${brothId}.webp`;
  }
  return null;
}

export function getSoupIngredientAssetUrl(ingredientId: SoupIngredientId): string {
  if (SOUP_TOPPING_IDS.has(ingredientId)) {
    return `/assets/items/soup/toppings/${ingredientId}.webp`;
  }
  return `/assets/items/soup/ingredients/${ingredientId}.webp`;
}

export function getSandwichBreadAssetUrl(breadId: SandwichBreadId): string {
  return `/assets/items/sandwich/breads/${breadId}.webp`;
}

export function getSandwichSpreadAssetUrl(spreadId: string): string | null {
  if (SANDWICH_SPREAD_IDS.has(spreadId)) {
    return `/assets/items/sandwich/spreads/${spreadId}.webp`;
  }
  return null;
}

export function getSandwichFillingAssetUrl(fillingId: SandwichFillingId): string {
  return `/assets/items/sandwich/fillings/${fillingId}.webp`;
}

export function getWashMessAssetUrl(messType: MessType): string | null {
  if (messType === 'mud' || messType === 'jam' || messType === 'paint') {
    return `/assets/items/wash/${messType}.webp`;
  }
  return null;
}

export const CAKE_STAND_WEBP = '/assets/cake/stand/stand.webp';

export function getCakeBaseAssetUrl(cakeId: CakeFlavorId): string {
  return `/assets/cake/cakes/${cakeId}.webp`;
}

export function getCakeRosetteAssetUrl(rosetteId: CakeRosetteId): string {
  return `/assets/cake/rosettes/${rosetteId}.webp`;
}

export function getCakeToppingAssetUrl(toppingId: CakeToppingId): string {
  return `/assets/cake/toppings/${toppingId}.webp`;
}

export function getCakeCandleAssetUrl(candleId: CakeCandleId): string {
  return `/assets/cake/candles/${candleId}.webp`;
}
