export type KitchenMode = 'pizza' | 'icecream' | 'drinks' | 'soup' | 'sandwich' | 'cake';
export type MiniGameMode = 'feed' | 'shadow' | 'bubbles' | 'memory' | 'puzzle' | 'weather';
/** Новые пошаговые мини-игры (CookKit/PlayKit) */
export type PlayMode = 'milkshake' | 'pancakes' | 'cookies' | 'popcorn' | 'skewers' | 'picnic' | 'bedtime' | 'doctor' | 'garden' | 'laundry' | 'popit' | 'phone' | 'numbers' | 'letters' | 'music' | 'house' | 'birthday' | 'pasta' | 'rain' | 'burger' | 'straws' | 'domino' | 'marble' | 'fruitart' | 'coins' | 'fishing' | 'lift';
export const PLAY_MODES: PlayMode[] = ['milkshake', 'pancakes', 'cookies', 'popcorn', 'skewers', 'picnic', 'bedtime', 'doctor', 'garden', 'laundry', 'popit', 'phone', 'numbers', 'letters', 'music', 'house', 'birthday', 'pasta', 'rain', 'burger', 'straws', 'domino', 'marble', 'fruitart', 'coins', 'fishing', 'lift'];
export type AllGameMode =
  | 'face'
  | 'tshirt'
  | 'wash'
  | 'coloring'
  | 'simon'
  | 'bigsmall'
  | 'emotions'
  | 'tv'
  | PlayMode
  | KitchenMode
  | MiniGameMode;

export type WashToolMode = 'soap' | 'sponge' | 'shower' | 'dryer';
export type MessType = 'mix' | 'mud' | 'jam' | 'paint';

export interface MessPreset {
  id: MessType;
  name: string;
  previewColor: string;
}

export const MESS_PRESETS: MessPreset[] = [
  { id: 'mix', name: 'Всё сразу', previewColor: '#FB7185' },
  { id: 'mud', name: 'Грязь', previewColor: '#854D0E' },
  { id: 'jam', name: 'Варенье', previewColor: '#E11D48' },
  { id: 'paint', name: 'Краски', previewColor: '#38BDF8' },
];

// ======================== PIZZA ========================
export interface PizzaSauceDef {
  id: string;
  name: string;
  color: string;
  ringColor: string;
}

export const PIZZA_SAUCES: PizzaSauceDef[] = [
  { id: 'tomato', name: 'Томатный', color: '#E11D48', ringColor: '#BE123C' },
  { id: 'cream', name: 'Сливочный', color: '#FEF3C7', ringColor: '#FDE68A' },
  { id: 'cheese', name: 'Сырный', color: '#FACC15', ringColor: '#EAB308' },
  { id: 'pesto', name: 'Песто', color: '#22C55E', ringColor: '#16A34A' },
];

export type PizzaToppingId =
  | 'pepperoni'
  | 'mushroom'
  | 'tomato'
  | 'olive'
  | 'pepper'
  | 'pineapple'
  | 'ham'
  | 'corn'
  | 'basil'
  | 'shrimp'
  | 'broccoli'
  | 'cheese_chunk';

export interface PizzaToppingDef {
  id: PizzaToppingId;
  name: string;
  previewColor: string;
}

export const PIZZA_TOPPINGS: PizzaToppingDef[] = [
  { id: 'pepperoni', name: 'Пепперони', previewColor: '#DC2626' },
  { id: 'cheese_chunk', name: 'Моцарелла', previewColor: '#FEF08A' },
  { id: 'mushroom', name: 'Грибочки', previewColor: '#D6D3D1' },
  { id: 'tomato', name: 'Черри', previewColor: '#EF4444' },
  { id: 'olive', name: 'Оливки', previewColor: '#1F2937' },
  { id: 'pepper', name: 'Перчик', previewColor: '#22C55E' },
  { id: 'ham', name: 'Ветчина', previewColor: '#FDA4AF' },
  { id: 'pineapple', name: 'Ананас', previewColor: '#FACC15' },
  { id: 'corn', name: 'Кукуруза', previewColor: '#FDE047' },
  { id: 'basil', name: 'Базилик', previewColor: '#16A34A' },
  { id: 'shrimp', name: 'Креветка', previewColor: '#FB923C' },
  { id: 'broccoli', name: 'Брокколи', previewColor: '#15803D' },
];

export interface PlacedPizzaTopping {
  uid: string;
  toppingId: PizzaToppingId;
  x: number; // normalized offset from pizza center (-1..1 inside sauce radius)
  y: number;
  rotation: number;
  scale: number;
}

export interface PizzaState {
  sauceId: string;
  hasCheese: boolean;
  toppings: PlacedPizzaTopping[];
  isBaked: boolean;
  isSliced: boolean;
}

export const INITIAL_PIZZA_STATE: PizzaState = {
  sauceId: 'tomato',
  hasCheese: true,
  toppings: [],
  isBaked: false,
  isSliced: false,
};

// ======================== ICE CREAM ========================
export type IceCreamBaseId = 'cone' | 'choco_cone' | 'cup' | 'bowl';

export interface IceCreamBaseDef {
  id: IceCreamBaseId;
  name: string;
  color: string;
}

export const ICE_CREAM_BASES: IceCreamBaseDef[] = [
  { id: 'cone', name: 'Рожок', color: '#F59E0B' },
  { id: 'choco_cone', name: 'Шоко-рожок', color: '#78350F' },
  { id: 'cup', name: 'Стаканчик', color: '#60A5FA' },
  { id: 'bowl', name: 'Креманка', color: '#F472B6' },
];

export interface IceCreamFlavorDef {
  id: string;
  name: string;
  color: string;
  highlight: string;
  speckColor?: string;
}

export const ICE_CREAM_FLAVORS: IceCreamFlavorDef[] = [
  { id: 'strawberry', name: 'Клубника', color: '#FB7185', highlight: '#FECDD3', speckColor: '#E11D48' },
  { id: 'vanilla', name: 'Ваниль', color: '#FEF9C3', highlight: '#FFFFFF', speckColor: '#D97706' },
  { id: 'chocolate', name: 'Шоколад', color: '#7C4A2D', highlight: '#A16240', speckColor: '#451A03' },
  { id: 'pistachio', name: 'Фисташка', color: '#86EFAC', highlight: '#DCFCE7', speckColor: '#15803D' },
  { id: 'blueberry', name: 'Черника', color: '#A78BFA', highlight: '#DDD6FE', speckColor: '#5B21B6' },
  { id: 'mango', name: 'Манго', color: '#FBBF24', highlight: '#FDE68A' },
  { id: 'mint', name: 'Мята-шоко', color: '#6EE7B7', highlight: '#D1FAE5', speckColor: '#451A03' },
  { id: 'bubblegum', name: 'Бабл-гам', color: '#67E8F9', highlight: '#CFFAFE', speckColor: '#EC4899' },
  { id: 'banana', name: 'Банан', color: '#FDE047', highlight: '#FEF9C3' },
  { id: 'watermelon', name: 'Арбуз', color: '#F43F5E', highlight: '#FDA4AF', speckColor: '#1E293B' },
];

export interface IceCreamSyrupDef {
  id: string;
  name: string;
  color: string;
}

export const ICE_CREAM_SYRUPS: IceCreamSyrupDef[] = [
  { id: 'none', name: 'Без сиропа', color: 'transparent' },
  { id: 'strawberry', name: 'Клубничный', color: '#E11D48' },
  { id: 'chocolate', name: 'Шоколадный', color: '#5C2E14' },
  { id: 'caramel', name: 'Карамель', color: '#D97706' },
  { id: 'blueberry', name: 'Черничный', color: '#7C3AED' },
  { id: 'rainbow', name: 'Радужный', color: '#EC4899' },
];

export type IceCreamGarnishId =
  | 'cherry'
  | 'wafer'
  | 'sprinkles'
  | 'stars'
  | 'cream'
  | 'cookie'
  | 'marshmallow'
  | 'berry';

export interface IceCreamGarnishDef {
  id: IceCreamGarnishId;
  name: string;
}

export const ICE_CREAM_GARNISHES: IceCreamGarnishDef[] = [
  { id: 'sprinkles', name: 'Посыпка' },
  { id: 'cherry', name: 'Вишенка' },
  { id: 'wafer', name: 'Трубочка' },
  { id: 'cream', name: 'Сливки' },
  { id: 'stars', name: 'Звёздочки' },
  { id: 'cookie', name: 'Печенька' },
  { id: 'marshmallow', name: 'Зефирки' },
  { id: 'berry', name: 'Клубника' },
];

export interface IceCreamState {
  baseId: IceCreamBaseId;
  scoops: string[]; // flavorIds bottom to top (max 4)
  syrupId: string;
  garnishes: IceCreamGarnishId[];
}

export const INITIAL_ICECREAM_STATE: IceCreamState = {
  baseId: 'cone',
  scoops: ['strawberry', 'vanilla'],
  syrupId: 'none',
  garnishes: [],
};

// ======================== DRINKS ========================
export type DrinkCategoryId = 'tea' | 'coffee' | 'juice' | 'cocktail';

export interface DrinkCategoryDef {
  id: DrinkCategoryId;
  name: string;
}

export const DRINK_CATEGORIES: DrinkCategoryDef[] = [
  { id: 'tea', name: 'Чай' },
  { id: 'coffee', name: 'Кофе' },
  { id: 'juice', name: 'Сок' },
  { id: 'cocktail', name: 'Коктейль' },
];

export interface DrinkFlavorDef {
  id: string;
  category: DrinkCategoryId;
  name: string;
  liquidTop: string;
  liquidBottom: string;
  foamColor?: string;
}

export const DRINK_FLAVORS: DrinkFlavorDef[] = [
  // Tea
  { id: 'tea_black', category: 'tea', name: 'Чёрный чай', liquidTop: '#B45309', liquidBottom: '#78350F' },
  { id: 'tea_green', category: 'tea', name: 'Зелёный чай', liquidTop: '#A3E635', liquidBottom: '#65A30D' },
  { id: 'tea_berry', category: 'tea', name: 'Малиновый', liquidTop: '#FB7185', liquidBottom: '#BE123C' },
  { id: 'tea_buckthorn', category: 'tea', name: 'Облепиховый', liquidTop: '#FBBF24', liquidBottom: '#EA580C' },
  { id: 'tea_chamomile', category: 'tea', name: 'Ромашковый', liquidTop: '#FDE047', liquidBottom: '#EAB308' },
  // Coffee & Cocoa
  { id: 'coffee_latte', category: 'coffee', name: 'Латте', liquidTop: '#D6A374', liquidBottom: '#7C4A2D', foamColor: '#FFFBEB' },
  { id: 'coffee_cocoa', category: 'coffee', name: 'Какао', liquidTop: '#8B5A3C', liquidBottom: '#4A2511', foamColor: '#FDE68A' },
  { id: 'coffee_cappuccino', category: 'coffee', name: 'Капучино', liquidTop: '#B07D56', liquidBottom: '#5C341E', foamColor: '#FFFFFF' },
  { id: 'coffee_strawberry', category: 'coffee', name: 'Ягодный раф', liquidTop: '#F9A8D4', liquidBottom: '#DB2777', foamColor: '#FFF1F2' },
  { id: 'coffee_caramel', category: 'coffee', name: 'Карамель', liquidTop: '#E6A962', liquidBottom: '#92400E', foamColor: '#FEF3C7' },
  // Juice
  { id: 'juice_orange', category: 'juice', name: 'Апельсиновый', liquidTop: '#FB923C', liquidBottom: '#EA580C' },
  { id: 'juice_apple', category: 'juice', name: 'Яблочный', liquidTop: '#BEF264', liquidBottom: '#84CC16' },
  { id: 'juice_cherry', category: 'juice', name: 'Вишнёвый', liquidTop: '#F43F5E', liquidBottom: '#9F1239' },
  { id: 'juice_pineapple', category: 'juice', name: 'Ананасовый', liquidTop: '#FEF08A', liquidBottom: '#EAB308' },
  { id: 'juice_carrot', category: 'juice', name: 'Морковный', liquidTop: '#FDBA74', liquidBottom: '#F97316' },
  // Cocktails / Smoothies
  { id: 'cocktail_berry', category: 'cocktail', name: 'Клубничный', liquidTop: '#FDA4AF', liquidBottom: '#E11D48', foamColor: '#FFF1F2' },
  { id: 'cocktail_lagoon', category: 'cocktail', name: 'Голубая лагуна', liquidTop: '#67E8F9', liquidBottom: '#0284C7', foamColor: '#ECFEFF' },
  { id: 'cocktail_tropical', category: 'cocktail', name: 'Тропики', liquidTop: '#FDE047', liquidBottom: '#F43F5E', foamColor: '#FEF9C3' },
  { id: 'cocktail_banana', category: 'cocktail', name: 'Банановый', liquidTop: '#FEF9C3', liquidBottom: '#FACC15', foamColor: '#FFFFFF' },
  { id: 'cocktail_mint', category: 'cocktail', name: 'Мятный микс', liquidTop: '#6EE7B7', liquidBottom: '#059669', foamColor: '#ECFDF5' },
];

export type DrinkAddonId =
  | 'ice'
  | 'lemon'
  | 'berries'
  | 'mint'
  | 'cream'
  | 'marshmallow'
  | 'straw'
  | 'umbrella'
  | 'choco_chips'
  | 'latte_heart';

export interface DrinkAddonDef {
  id: DrinkAddonId;
  name: string;
}

export const DRINK_ADDONS: DrinkAddonDef[] = [
  { id: 'ice', name: 'Лёд' },
  { id: 'lemon', name: 'Лимон' },
  { id: 'berries', name: 'Ягоды' },
  { id: 'mint', name: 'Мята' },
  { id: 'cream', name: 'Сливки' },
  { id: 'marshmallow', name: 'Зефирки' },
  { id: 'straw', name: 'Трубочка' },
  { id: 'umbrella', name: 'Зонтик' },
  { id: 'choco_chips', name: 'Крошка' },
  { id: 'latte_heart', name: 'Сердечко' },
];

export interface DrinkState {
  category: DrinkCategoryId;
  flavorId: string;
  addons: DrinkAddonId[];
  stirAngle: number;
  pourLevel: number; // 0..1 filled via teapot pouring
}

export const INITIAL_DRINK_STATE: DrinkState = {
  category: 'tea',
  flavorId: 'tea_berry',
  addons: [],
  stirAngle: 0,
  pourLevel: 0,
};

// ======================== SOUP ========================
export interface SoupBrothDef {
  id: string;
  name: string;
  color: string;
  rimColor: string;
}

export const SOUP_BROTHS: SoupBrothDef[] = [
  { id: 'chicken', name: 'Куриный', color: '#FDE047', rimColor: '#EAB308' },
  { id: 'tomato', name: 'Томатный', color: '#EF4444', rimColor: '#DC2626' },
  { id: 'cheese', name: 'Сырный', color: '#FEF08A', rimColor: '#FACC15' },
  { id: 'veggie', name: 'Овощной', color: '#86EFAC', rimColor: '#22C55E' },
  { id: 'pumpkin', name: 'Тыквенный', color: '#FB923C', rimColor: '#EA580C' },
];

export type SoupIngredientId =
  | 'potato'
  | 'carrot'
  | 'broccoli'
  | 'peas'
  | 'corn'
  | 'tomato'
  | 'mushroom'
  | 'noodles'
  | 'meatball'
  | 'crouton'
  | 'herbs'
  | 'sour_cream';

export interface SoupIngredientDef {
  id: SoupIngredientId;
  name: string;
  color: string;
}

export const SOUP_INGREDIENTS: SoupIngredientDef[] = [
  { id: 'potato', name: 'Картошка', color: '#FDE68A' },
  { id: 'carrot', name: 'Морковка', color: '#FB923C' },
  { id: 'broccoli', name: 'Брокколи', color: '#16A34A' },
  { id: 'peas', name: 'Горошек', color: '#4ADE80' },
  { id: 'corn', name: 'Кукуруза', color: '#FACC15' },
  { id: 'tomato', name: 'Помидорка', color: '#EF4444' },
  { id: 'mushroom', name: 'Грибочек', color: '#D6D3D1' },
  { id: 'noodles', name: 'Лапша', color: '#FDE047' },
  { id: 'meatball', name: 'Фрикаделька', color: '#9A3412' },
  { id: 'crouton', name: 'Сухарики', color: '#D97706' },
  { id: 'herbs', name: 'Укроп', color: '#15803D' },
  { id: 'sour_cream', name: 'Сметана', color: '#FFFFFF' },
];

export interface PlacedSoupIngredient {
  uid: string;
  ingredientId: SoupIngredientId;
  radius: number; // 0..0.75 polar distance from pot center
  angle: number; // radians
  rotation: number;
}

export interface SoupState {
  brothId: string;
  ingredients: PlacedSoupIngredient[];
  stirAngle: number;
  inBowl: boolean;
}

export const INITIAL_SOUP_STATE: SoupState = {
  brothId: 'chicken',
  ingredients: [],
  stirAngle: 0,
  inBowl: false,
};

// ======================== SANDWICH ========================
export type SandwichBreadId = 'toast' | 'bun' | 'baguette' | 'rye';

export interface SandwichBreadDef {
  id: SandwichBreadId;
  name: string;
  crustColor: string;
  crumbColor: string;
}

export const SANDWICH_BREADS: SandwichBreadDef[] = [
  { id: 'toast', name: 'Тостовый', crustColor: '#D97706', crumbColor: '#FEF3C7' },
  { id: 'bun', name: 'Булочка', crustColor: '#EA580C', crumbColor: '#FDE68A' },
  { id: 'baguette', name: 'Багет', crustColor: '#B45309', crumbColor: '#FFFBEB' },
  { id: 'rye', name: 'Ржаной', crustColor: '#573B26', crumbColor: '#8D6E63' },
];

export interface SandwichSpreadDef {
  id: string;
  name: string;
  color: string;
}

export const SANDWICH_SPREADS: SandwichSpreadDef[] = [
  { id: 'none', name: 'Без соуса', color: 'transparent' },
  { id: 'butter', name: 'Масло', color: '#FEF08A' },
  { id: 'cream_cheese', name: 'Творожный', color: '#FFFBEB' },
  { id: 'ketchup', name: 'Кетчуп', color: '#DC2626' },
  { id: 'avocado', name: 'Авокадо', color: '#84CC16' },
  { id: 'jam', name: 'Джем', color: '#E11D48' },
  { id: 'choco', name: 'Шоко-паста', color: '#5C2E14' },
];

export type SandwichFillingId =
  | 'cheese'
  | 'ham'
  | 'salami'
  | 'patty'
  | 'egg'
  | 'lettuce'
  | 'tomato'
  | 'cucumber'
  | 'salmon'
  | 'avocado_slice'
  | 'banana'
  | 'strawberry';

export interface SandwichFillingDef {
  id: SandwichFillingId;
  name: string;
  color: string;
}

export const SANDWICH_FILLINGS: SandwichFillingDef[] = [
  { id: 'cheese', name: 'Сыр', color: '#FACC15' },
  { id: 'ham', name: 'Ветчина', color: '#FDA4AF' },
  { id: 'salami', name: 'Колбаска', color: '#DC2626' },
  { id: 'patty', name: 'Котлетка', color: '#7C2D12' },
  { id: 'egg', name: 'Яичница', color: '#FFFFFF' },
  { id: 'lettuce', name: 'Салат', color: '#22C55E' },
  { id: 'tomato', name: 'Помидор', color: '#EF4444' },
  { id: 'cucumber', name: 'Огурчик', color: '#4ADE80' },
  { id: 'salmon', name: 'Рыбка', color: '#FB923C' },
  { id: 'avocado_slice', name: 'Авокадо', color: '#84CC16' },
  { id: 'banana', name: 'Банан', color: '#FEF08A' },
  { id: 'strawberry', name: 'Клубника', color: '#F43F5E' },
];

export interface SandwichState {
  breadId: SandwichBreadId;
  spreadId: string;
  layers: SandwichFillingId[]; // stacked bottom to top (max 7)
  hasTopBread: boolean;
}

export const INITIAL_SANDWICH_STATE: SandwichState = {
  breadId: 'toast',
  spreadId: 'butter',
  layers: ['cheese'],
  hasTopBread: true,
};

// ======================== CAKE ========================
export type CakeFlavorId = 'pink' | 'white' | 'chocolate' | 'blue' | 'mint' | 'yellow';
export type CakeRosetteId = 'pink' | 'white' | 'blue' | 'yellow' | 'mint' | 'chocolate';
export type CakeToppingId =
  | 'strawberry'
  | 'cherry'
  | 'blueberries'
  | 'raspberry'
  | 'macaron'
  | 'donut'
  | 'lollipop'
  | 'heart'
  | 'star'
  | 'flower'
  | 'gummy'
  | 'chocolate';
export type CakeCandleId = 'pink' | 'blue' | 'yellow' | 'green' | 'purple' | 'red';
export type CakeToolTab = 'cake' | 'pipe' | 'top' | 'candle';
export type CakeItemType = 'rosette' | 'topping' | 'candle';

export const CAKE_FLAVORS: Array<{ id: CakeFlavorId; name: string }> = [
  { id: 'pink', name: 'Клубничный' },
  { id: 'white', name: 'Ванильный' },
  { id: 'chocolate', name: 'Шоколадный' },
  { id: 'blue', name: 'Голубичный' },
  { id: 'mint', name: 'Мятный' },
  { id: 'yellow', name: 'Лимонный' },
];

export const CAKE_ROSETTES: Array<{ id: CakeRosetteId; name: string }> = [
  { id: 'pink', name: 'Розовый крем' },
  { id: 'white', name: 'Белый крем' },
  { id: 'blue', name: 'Голубой крем' },
  { id: 'yellow', name: 'Жёлтый крем' },
  { id: 'mint', name: 'Мятный крем' },
  { id: 'chocolate', name: 'Шоколадный крем' },
];

export const CAKE_TOPPINGS: Array<{ id: CakeToppingId; name: string }> = [
  { id: 'strawberry', name: 'Клубника' },
  { id: 'cherry', name: 'Вишенка' },
  { id: 'blueberries', name: 'Черника' },
  { id: 'raspberry', name: 'Малинка' },
  { id: 'macaron', name: 'Макарун' },
  { id: 'donut', name: 'Пончик' },
  { id: 'lollipop', name: 'Леденец' },
  { id: 'heart', name: 'Сердечко' },
  { id: 'star', name: 'Звёздочка' },
  { id: 'flower', name: 'Цветочек' },
  { id: 'gummy', name: 'Мармеладка' },
  { id: 'chocolate', name: 'Шоколадка' },
];

export const CAKE_CANDLES: Array<{ id: CakeCandleId; name: string }> = [
  { id: 'pink', name: 'Розовая свечка' },
  { id: 'blue', name: 'Голубая свечка' },
  { id: 'yellow', name: 'Жёлтая свечка' },
  { id: 'green', name: 'Зелёная свечка' },
  { id: 'purple', name: 'Фиолетовая свечка' },
  { id: 'red', name: 'Красная свечка' },
];

export interface PlacedCakeItem {
  uid: string;
  type: CakeItemType;
  id: string;
  x: number;
  y: number;
  rot: number;
  t0: number;
  lit: boolean;
  out: number;
  outAt: number;
  smoked?: boolean;
}

export interface CakeState {
  cakeId: CakeFlavorId;
  items: PlacedCakeItem[];
  blown: boolean;
}

export const INITIAL_CAKE_STATE: CakeState = {
  cakeId: 'pink',
  items: [],
  blown: false,
};
