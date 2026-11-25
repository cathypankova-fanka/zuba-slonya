import { MiniGameMode } from './kitchenData';

export type AlbumCategoryId = 'all' | 'food' | 'animals' | 'transport' | 'objects' | 'fashion';

export interface MiniGameAssetItem {
  id: string;
  src: string;
  label: string;
  colorGroup?: string;
}

export interface AlbumStickerDef {
  id: string;
  src: string;
  label: string;
  category: Exclude<AlbumCategoryId, 'all'>;
}

export const getCharacterEatAnimationUrl = (charId: string): string =>
  `/assets/eat-animations/${charId}.webp`;

// Verified paths on disk across /assets/cake/toppings/ and /assets/items/**
export const MINI_FOOD_ITEMS: Record<string, MiniGameAssetItem> = {
  'cake/toppings/strawberry': {
    id: 'cake/toppings/strawberry',
    src: '/assets/cake/toppings/strawberry.webp',
    label: 'Клубничка',
    colorGroup: 'red',
  },
  'cake/toppings/macaron': {
    id: 'cake/toppings/macaron',
    src: '/assets/cake/toppings/macaron.webp',
    label: 'Макарун',
    colorGroup: 'pink',
  },
  'cake/toppings/lollipop': {
    id: 'cake/toppings/lollipop',
    src: '/assets/cake/toppings/lollipop.webp',
    label: 'Леденец',
    colorGroup: 'rainbow',
  },
  'cake/toppings/donut': {
    id: 'cake/toppings/donut',
    src: '/assets/cake/toppings/donut.webp',
    label: 'Пончик',
    colorGroup: 'pink',
  },
  'cake/toppings/raspberry': {
    id: 'cake/toppings/raspberry',
    src: '/assets/cake/toppings/raspberry.webp',
    label: 'Малинка',
    colorGroup: 'red',
  },
  'cake/toppings/blueberries': {
    id: 'cake/toppings/blueberries',
    src: '/assets/cake/toppings/blueberries.webp',
    label: 'Черника',
    colorGroup: 'blue',
  },
  'cake/toppings/flower': {
    id: 'cake/toppings/flower',
    src: '/assets/cake/toppings/flower.webp',
    label: 'Сахарный цветочек',
    colorGroup: 'pink',
  },
  'icecream/flavors/bubblegum': {
    id: 'icecream/flavors/bubblegum',
    src: '/assets/items/icecream/flavors/bubblegum.webp',
    label: 'Мороженое Баблгам',
    colorGroup: 'blue',
  },
  'icecream/flavors/chocolate': {
    id: 'icecream/flavors/chocolate',
    src: '/assets/items/icecream/flavors/chocolate.webp',
    label: 'Шоколадное мороженое',
    colorGroup: 'brown',
  },
  'icecream/flavors/mint': {
    id: 'icecream/flavors/mint',
    src: '/assets/items/icecream/flavors/mint.webp',
    label: 'Мятное мороженое',
    colorGroup: 'green',
  },
  'icecream/flavors/vanilla': {
    id: 'icecream/flavors/vanilla',
    src: '/assets/items/icecream/flavors/vanilla.webp',
    label: 'Ванильное мороженое',
    colorGroup: 'cream',
  },
  'icecream/garnishes/cookie': {
    id: 'icecream/garnishes/cookie',
    src: '/assets/items/icecream/garnishes/cookie.webp',
    label: 'Печенье',
    colorGroup: 'brown',
  },
  'soup/ingredients/carrot': {
    id: 'soup/ingredients/carrot',
    src: '/assets/items/soup/ingredients/carrot.webp',
    label: 'Морковка',
    colorGroup: 'orange',
  },
  'soup/ingredients/meatball': {
    id: 'soup/ingredients/meatball',
    src: '/assets/items/soup/ingredients/meatball.webp',
    label: 'Тефтелька',
    colorGroup: 'brown',
  },
  'soup/ingredients/mushroom': {
    id: 'soup/ingredients/mushroom',
    src: '/assets/items/soup/ingredients/mushroom.webp',
    label: 'Грибочек',
    colorGroup: 'cream',
  },
  'soup/ingredients/corn': {
    id: 'soup/ingredients/corn',
    src: '/assets/items/soup/ingredients/corn.webp',
    label: 'Кукуруза',
    colorGroup: 'yellow',
  },
  'soup/ingredients/peas': {
    id: 'soup/ingredients/peas',
    src: '/assets/items/soup/ingredients/peas.webp',
    label: 'Горошек',
    colorGroup: 'green',
  },
  'soup/ingredients/potato': {
    id: 'soup/ingredients/potato',
    src: '/assets/items/soup/ingredients/potato.webp',
    label: 'Картошечка',
    colorGroup: 'yellow',
  },
  'sandwich/fillings/cucumber': {
    id: 'sandwich/fillings/cucumber',
    src: '/assets/items/sandwich/fillings/cucumber.webp',
    label: 'Огурчик',
    colorGroup: 'green',
  },
  'sandwich/fillings/lettuce': {
    id: 'sandwich/fillings/lettuce',
    src: '/assets/items/sandwich/fillings/lettuce.webp',
    label: 'Салат',
    colorGroup: 'green',
  },
  'sandwich/fillings/patty': {
    id: 'sandwich/fillings/patty',
    src: '/assets/items/sandwich/fillings/patty.webp',
    label: 'Котлетка',
    colorGroup: 'brown',
  },
  'sandwich/fillings/salmon': {
    id: 'sandwich/fillings/salmon',
    src: '/assets/items/sandwich/fillings/salmon.webp',
    label: 'Рыбка',
    colorGroup: 'orange',
  },
  'sandwich/fillings/egg': {
    id: 'sandwich/fillings/egg',
    src: '/assets/items/sandwich/fillings/egg.webp',
    label: 'Яичко',
    colorGroup: 'yellow',
  },
  'sandwich/fillings/cheese': {
    id: 'sandwich/fillings/cheese',
    src: '/assets/items/sandwich/fillings/cheese.webp',
    label: 'Сыр',
    colorGroup: 'yellow',
  },
  'sandwich/fillings/salami': {
    id: 'sandwich/fillings/salami',
    src: '/assets/items/sandwich/fillings/salami.webp',
    label: 'Колбаска',
    colorGroup: 'red',
  },
  'sandwich/fillings/ham': {
    id: 'sandwich/fillings/ham',
    src: '/assets/items/sandwich/fillings/ham.webp',
    label: 'Ветчина',
    colorGroup: 'pink',
  },
  'sandwich/fillings/banana': {
    id: 'sandwich/fillings/banana',
    src: '/assets/items/sandwich/fillings/banana.webp',
    label: 'Бананчик',
    colorGroup: 'yellow',
  },
  'sandwich/fillings/avocado_slice': {
    id: 'sandwich/fillings/avocado_slice',
    src: '/assets/items/sandwich/fillings/avocado_slice.webp',
    label: 'Авокадо',
    colorGroup: 'green',
  },
  'sandwich/fillings/tomato': {
    id: 'sandwich/fillings/tomato',
    src: '/assets/items/sandwich/fillings/tomato.webp',
    label: 'Помидорка',
    colorGroup: 'red',
  },
  'pizza/toppings/broccoli': {
    id: 'pizza/toppings/broccoli',
    src: '/assets/items/pizza/toppings/broccoli.webp',
    label: 'Брокколи',
    colorGroup: 'green',
  },
  'pizza/toppings/pepperoni': {
    id: 'pizza/toppings/pepperoni',
    src: '/assets/items/pizza/toppings/pepperoni.webp',
    label: 'Пепперони',
    colorGroup: 'red',
  },
  'pizza/toppings/pepper': {
    id: 'pizza/toppings/pepper',
    src: '/assets/items/pizza/toppings/pepper.webp',
    label: 'Перчик',
    colorGroup: 'green',
  },
  'pizza/toppings/mushroom': {
    id: 'pizza/toppings/mushroom',
    src: '/assets/items/pizza/toppings/mushroom.webp',
    label: 'Шампиньон',
    colorGroup: 'cream',
  },
  'pizza/toppings/basil': {
    id: 'pizza/toppings/basil',
    src: '/assets/items/pizza/toppings/basil.webp',
    label: 'Базилик',
    colorGroup: 'green',
  },
  'pizza/toppings/shrimp': {
    id: 'pizza/toppings/shrimp',
    src: '/assets/items/pizza/toppings/shrimp.webp',
    label: 'Креветка',
    colorGroup: 'orange',
  },
  'pizza/toppings/cheese_chunk': {
    id: 'pizza/toppings/cheese_chunk',
    src: '/assets/items/pizza/toppings/cheese_chunk.webp',
    label: 'Моцарелла',
    colorGroup: 'cream',
  },
  'drinks/recipes/tea_green': {
    id: 'drinks/recipes/tea_green',
    src: '/assets/items/drinks/recipes/tea_green.webp',
    label: 'Зелёный чай',
    colorGroup: 'green',
  },
  'drinks/recipes/coffee_cappuccino': {
    id: 'drinks/recipes/coffee_cappuccino',
    src: '/assets/items/drinks/recipes/coffee_cappuccino.webp',
    label: 'Капучино',
    colorGroup: 'brown',
  },
  'drinks/recipes/tea_berry': {
    id: 'drinks/recipes/tea_berry',
    src: '/assets/items/drinks/recipes/tea_berry.webp',
    label: 'Ягодный чай',
    colorGroup: 'red',
  },
  'drinks/recipes/coffee_latte': {
    id: 'drinks/recipes/coffee_latte',
    src: '/assets/items/drinks/recipes/coffee_latte.webp',
    label: 'Латте',
    colorGroup: 'brown',
  },
  'drinks/recipes/tea_chamomile': {
    id: 'drinks/recipes/tea_chamomile',
    src: '/assets/items/drinks/recipes/tea_chamomile.webp',
    label: 'Ромашковый чай',
    colorGroup: 'yellow',
  },
  'drinks/recipes/tea_black': {
    id: 'drinks/recipes/tea_black',
    src: '/assets/items/drinks/recipes/tea_black.webp',
    label: 'Чёрный чай',
    colorGroup: 'brown',
  },
};

export const CHARACTER_FAVORITES: Record<string, string[]> = {
  unicorn: [
    'cake/toppings/strawberry',
    'cake/toppings/macaron',
    'cake/toppings/lollipop',
    'icecream/flavors/bubblegum',
  ],
  bunny: [
    'soup/ingredients/carrot',
    'sandwich/fillings/cucumber',
    'sandwich/fillings/lettuce',
    'pizza/toppings/broccoli',
  ],
  dragon: [
    'pizza/toppings/pepperoni',
    'pizza/toppings/pepper',
    'sandwich/fillings/patty',
    'soup/ingredients/meatball',
  ],
  fox: [
    'sandwich/fillings/salmon',
    'sandwich/fillings/egg',
    'sandwich/fillings/cheese',
    'pizza/toppings/mushroom',
  ],
  bear: [
    'cake/toppings/donut',
    'cake/toppings/raspberry',
    'icecream/garnishes/cookie',
    'icecream/flavors/chocolate',
  ],
  owl: [
    'soup/ingredients/mushroom',
    'cake/toppings/blueberries',
    'sandwich/fillings/egg',
    'soup/ingredients/corn',
  ],
  lion: [
    'sandwich/fillings/patty',
    'sandwich/fillings/salami',
    'sandwich/fillings/ham',
    'pizza/toppings/pepperoni',
  ],
  frog: [
    'sandwich/fillings/cucumber',
    'soup/ingredients/peas',
    'pizza/toppings/basil',
    'icecream/flavors/mint',
  ],
  cat: [
    'sandwich/fillings/salmon',
    'pizza/toppings/shrimp',
    'sandwich/fillings/cheese',
    'pizza/toppings/cheese_chunk',
  ],
  baby: [
    'sandwich/fillings/banana',
    'cake/toppings/strawberry',
    'soup/ingredients/peas',
    'icecream/flavors/vanilla',
  ],
  aunt: [
    'sandwich/fillings/avocado_slice',
    'drinks/recipes/tea_green',
    'cake/toppings/macaron',
    'sandwich/fillings/tomato',
  ],
  dad: [
    'sandwich/fillings/patty',
    'drinks/recipes/coffee_cappuccino',
    'pizza/toppings/pepperoni',
    'soup/ingredients/potato',
  ],
  mom: [
    'drinks/recipes/tea_berry',
    'sandwich/fillings/lettuce',
    'cake/toppings/strawberry',
    'sandwich/fillings/tomato',
  ],
  uncle: [
    'sandwich/fillings/egg',
    'drinks/recipes/coffee_latte',
    'sandwich/fillings/ham',
    'pizza/toppings/mushroom',
  ],
  grandma: [
    'drinks/recipes/tea_chamomile',
    'soup/ingredients/carrot',
    'cake/toppings/flower',
    'icecream/garnishes/cookie',
  ],
  grandpa: [
    'drinks/recipes/tea_black',
    'soup/ingredients/potato',
    'sandwich/fillings/salami',
    'sandwich/fillings/cheese',
  ],
  alex: [
    'pizza/toppings/pepperoni',
    'sandwich/fillings/patty',
    'cake/toppings/donut',
    'icecream/flavors/chocolate',
  ],
  milo: [
    'sandwich/fillings/banana',
    'soup/ingredients/carrot',
    'icecream/garnishes/cookie',
    'cake/toppings/blueberries',
  ],
  tim: [
    'icecream/flavors/bubblegum',
    'cake/toppings/lollipop',
    'soup/ingredients/meatball',
    'sandwich/fillings/cheese',
  ],
  carolina: [
    'cake/toppings/strawberry',
    'cake/toppings/macaron',
    'icecream/flavors/vanilla',
    'cake/toppings/raspberry',
  ],
  pipa: [
    'icecream/flavors/strawberry',
    'cake/toppings/strawberry',
    'sandwich/fillings/cheese',
    'cake/toppings/lollipop',
  ],
};

export const MINI_FOOD_POOL = Object.values(MINI_FOOD_ITEMS);

const stickerItem = (
  id: string,
  label: string,
  category: Exclude<AlbumCategoryId, 'all'>,
  colorGroup = 'multi'
): AlbumStickerDef & { colorGroup: string } => ({
  id,
  src: `/assets/items/accessories/${id}.webp`,
  label,
  category,
  colorGroup,
});

const ALL_STICKER_ROWS: Array<AlbumStickerDef & { colorGroup: string }> = [
  // Food (15)
  stickerItem('strawberry', 'Клубника', 'food', 'red'),
  stickerItem('watermelon', 'Арбуз', 'food', 'green'),
  stickerItem('cupcake', 'Кексик', 'food', 'pink'),
  stickerItem('donut', 'Пончик', 'food', 'pink'),
  stickerItem('lollipop', 'Леденец', 'food', 'rainbow'),
  stickerItem('cherry', 'Вишенка', 'food', 'red'),
  stickerItem('apple_sticker', 'Яблоко', 'food', 'red'),
  stickerItem('icecream', 'Мороженое', 'food', 'pink'),
  stickerItem('cookie', 'Печенье', 'food', 'brown'),
  stickerItem('pizza', 'Пицца', 'food', 'orange'),
  stickerItem('banana', 'Банан', 'food', 'yellow'),
  stickerItem('orange_fruit', 'Апельсин', 'food', 'orange'),
  stickerItem('pineapple', 'Ананас', 'food', 'yellow'),
  stickerItem('avocado', 'Авокадо', 'food', 'green'),
  stickerItem('cake_slice', 'Тортик', 'food', 'cream'),

  // Transport (11)
  stickerItem('car', 'Машинка', 'transport', 'red'),
  stickerItem('train', 'Паровозик', 'transport', 'blue'),
  stickerItem('rocket', 'Ракета', 'transport', 'red'),
  stickerItem('airplane_sticker', 'Самолёт', 'transport', 'blue'),
  stickerItem('helicopter_sticker', 'Вертолёт', 'transport', 'green'),
  stickerItem('fire_truck', 'Пожарная машина', 'transport', 'red'),
  stickerItem('tractor', 'Трактор', 'transport', 'green'),
  stickerItem('bicycle', 'Велосипед', 'transport', 'blue'),
  stickerItem('hot_air_balloon', 'Воздушный шар', 'transport', 'rainbow'),
  stickerItem('sailboat', 'Парусник', 'transport', 'blue'),
  stickerItem('ufo', 'НЛО', 'transport', 'purple'),

  // Animals (36)
  stickerItem('bear', 'Мишка', 'animals', 'brown'),
  stickerItem('bunny_sticker', 'Зайчик', 'animals', 'white'),
  stickerItem('kitty', 'Котёнок', 'animals', 'orange'),
  stickerItem('puppy', 'Щенок', 'animals', 'brown'),
  stickerItem('fox_sticker', 'Лисёнок', 'animals', 'orange'),
  stickerItem('lion_sticker', 'Львёнок', 'animals', 'yellow'),
  stickerItem('frog_sticker', 'Лягушонок', 'animals', 'green'),
  stickerItem('owl_sticker', 'Совушка', 'animals', 'brown'),
  stickerItem('panda_sticker', 'Панда', 'animals', 'white'),
  stickerItem('koala_sticker', 'Коала', 'animals', 'gray'),
  stickerItem('elephant_sticker', 'Слонёнок', 'animals', 'gray'),
  stickerItem('giraffe_sticker', 'Жирафик', 'animals', 'yellow'),
  stickerItem('zebra_sticker', 'Зебра', 'animals', 'white'),
  stickerItem('monkey_sticker', 'Обезьянка', 'animals', 'brown'),
  stickerItem('hedgehog_sticker', 'Ёжик', 'animals', 'brown'),
  stickerItem('flamingo_sticker', 'Фламинго', 'animals', 'pink'),
  stickerItem('chick_sticker', 'Цыплёнок', 'animals', 'yellow'),
  stickerItem('duckling', 'Утёнок', 'animals', 'yellow'),
  stickerItem('penguin', 'Пингвин', 'animals', 'blue'),
  stickerItem('turtle', 'Черепашка', 'animals', 'green'),
  stickerItem('octopus', 'Осьминожек', 'animals', 'pink'),
  stickerItem('whale', 'Китёнок', 'animals', 'blue'),
  stickerItem('fish', 'Рыбка', 'animals', 'orange'),
  stickerItem('crab_sticker', 'Крабик', 'animals', 'red'),
  stickerItem('starfish_sticker', 'Морская звезда', 'animals', 'orange'),
  stickerItem('seahorse_sticker', 'Морской конёк', 'animals', 'yellow'),
  stickerItem('jellyfish_sticker', 'Медуза', 'animals', 'purple'),
  stickerItem('snail_sticker', 'Улитка', 'animals', 'orange'),
  stickerItem('caterpillar_sticker', 'Гусеница', 'animals', 'green'),
  stickerItem('ladybug', 'Божья коровка', 'animals', 'red'),
  stickerItem('bee', 'Пчёлка', 'animals', 'yellow'),
  stickerItem('dino', 'Динозаврик', 'animals', 'green'),
  stickerItem('dragon_cute', 'Дракончик', 'animals', 'green'),
  stickerItem('unicorn_face', 'Единорог', 'animals', 'pink'),
  stickerItem('butterfly_blue', 'Голубая бабочка', 'animals', 'blue'),
  stickerItem('butterfly_sticker', 'Бабочка', 'animals', 'orange'),

  // Objects & Nature (21)
  stickerItem('guitar', 'Гитара', 'objects', 'brown'),
  stickerItem('drum', 'Барабан', 'objects', 'red'),
  stickerItem('camera', 'Фотоаппарат', 'objects', 'gray'),
  stickerItem('soccer_ball', 'Мячик', 'objects', 'white'),
  stickerItem('umbrella_sticker', 'Зонтик', 'objects', 'rainbow'),
  stickerItem('snowman', 'Снеговик', 'objects', 'white'),
  stickerItem('trophy', 'Кубок', 'objects', 'yellow'),
  stickerItem('gift', 'Подарок', 'objects', 'red'),
  stickerItem('balloon', 'Шарик', 'objects', 'pink'),
  stickerItem('castle', 'Замок', 'objects', 'purple'),
  stickerItem('cloud_sticker', 'Облачко', 'objects', 'blue'),
  stickerItem('flower_sticker', 'Цветочек', 'objects', 'pink'),
  stickerItem('heart_sticker', 'Сердечко', 'objects', 'red'),
  stickerItem('moon_sticker', 'Месяц', 'objects', 'yellow'),
  stickerItem('music_note', 'Нотка', 'objects', 'purple'),
  stickerItem('planet', 'Планета', 'objects', 'blue'),
  stickerItem('rainbow', 'Радуга', 'objects', 'rainbow'),
  stickerItem('star_sticker', 'Звёздочка', 'objects', 'yellow'),
  stickerItem('sun', 'Солнышко', 'objects', 'yellow'),
  stickerItem('magic_wand', 'Волшебная палочка', 'objects', 'purple'),
  stickerItem('unicorn_horn', 'Рог единорога', 'objects', 'rainbow'),

  // Fashion & Accessories (44) -> Total 127
  stickerItem('beanie_pom', 'Шапочка с помпоном', 'fashion'),
  stickerItem('bear_hat', 'Шапка мишка', 'fashion'),
  stickerItem('beret', 'Берет', 'fashion'),
  stickerItem('bow', 'Бантик', 'fashion'),
  stickerItem('bowtie', 'Бабочка-галстук', 'fashion'),
  stickerItem('bunny_ears', 'Ушки зайчика', 'fashion'),
  stickerItem('cap_baseball', 'Кепка', 'fashion'),
  stickerItem('cat_whiskers', 'Кошачьи усики', 'fashion'),
  stickerItem('chef_hat', 'Колпак повара', 'fashion'),
  stickerItem('cowboy_hat', 'Ковбойская шляпа', 'fashion'),
  stickerItem('crown', 'Корона', 'fashion'),
  stickerItem('earring_butterfly', 'Серёжка бабочка', 'fashion'),
  stickerItem('earring_cherry', 'Серёжка вишенка', 'fashion'),
  stickerItem('earring_flower', 'Серёжка цветочек', 'fashion'),
  stickerItem('earring_gem', 'Серёжка кристалл', 'fashion'),
  stickerItem('earring_heart', 'Серёжка сердечко', 'fashion'),
  stickerItem('earring_hoop', 'Серёжка колечко', 'fashion'),
  stickerItem('earring_moon', 'Серёжка луна', 'fashion'),
  stickerItem('earring_star', 'Серёжка звёздочка', 'fashion'),
  stickerItem('flower_crown', 'Венок из цветов', 'fashion'),
  stickerItem('frog_hat', 'Шапка лягушка', 'fashion'),
  stickerItem('glasses', 'Очки', 'fashion'),
  stickerItem('glasses_cat', 'Очки кошечки', 'fashion'),
  stickerItem('glasses_heart', 'Очки сердечки', 'fashion'),
  stickerItem('glasses_pixel', 'Пиксельные очки', 'fashion'),
  stickerItem('glasses_rainbow', 'Радужные очки', 'fashion'),
  stickerItem('glasses_round', 'Круглые очки', 'fashion'),
  stickerItem('glasses_sun', 'Солнечные очки', 'fashion'),
  stickerItem('hairclip_heart', 'Заколка сердечко', 'fashion'),
  stickerItem('hairclip_star', 'Заколка звёздочка', 'fashion'),
  stickerItem('hat_crown_flower', 'Цветочная корона', 'fashion'),
  stickerItem('hat_grad', 'Шапочка выпускника', 'fashion'),
  stickerItem('hat_santa', 'Новогодний колпак', 'fashion'),
  stickerItem('hat_viking', 'Шлем викинга', 'fashion'),
  stickerItem('headphones', 'Наушники', 'fashion'),
  stickerItem('mask_domino', 'Маска домино', 'fashion'),
  stickerItem('mustache', 'Усики', 'fashion'),
  stickerItem('necklace', 'Бусы', 'fashion'),
  stickerItem('party_hat', 'Праздничный колпак', 'fashion'),
  stickerItem('pirate_hat', 'Шляпа пирата', 'fashion'),
  stickerItem('scarf', 'Шарфик', 'fashion'),
  stickerItem('sun_hat', 'Летняя шляпа', 'fashion'),
  stickerItem('tiara', 'Тиара', 'fashion'),
  stickerItem('wizard_hat', 'Шляпа волшебника', 'fashion'),
];

export const ALBUM_STICKERS: AlbumStickerDef[] = ALL_STICKER_ROWS.map(
  ({ colorGroup: _cg, ...rest }) => rest
);

export type PoolSetKey = 'food' | 'transport' | 'animals' | 'objects';

export const STICKER_SETS: Record<PoolSetKey, MiniGameAssetItem[]> = {
  food: ALL_STICKER_ROWS.filter((s) => s.category === 'food'),
  transport: ALL_STICKER_ROWS.filter((s) => s.category === 'transport'),
  animals: ALL_STICKER_ROWS.filter((s) => s.category === 'animals'),
  objects: ALL_STICKER_ROWS.filter((s) => s.category === 'objects'),
};

export const BUBBLE_SPRITE_POOL: MiniGameAssetItem[] = [
  ...STICKER_SETS.food,
  ...STICKER_SETS.animals.slice(0, 18),
  ...STICKER_SETS.transport,
  ...STICKER_SETS.objects.slice(0, 14),
];

// ======================== PERSISTENCE & ADAPTIVE DIFFICULTY ========================

const STORAGE_KEY = 'anyutka_minigames_v1';

export interface MiniGamesProgress {
  levels: Record<MiniGameMode, number>;
  streaks: Record<MiniGameMode, { cleanRounds: number; consecutiveMistakes: number }>;
  soundEnabled: boolean;
}

const DEFAULT_PROGRESS: MiniGamesProgress = {
  levels: {
    feed: 1,
    shadow: 1,
    bubbles: 1,
    memory: 1,
    puzzle: 1,
    weather: 1,
  },
  streaks: {
    feed: { cleanRounds: 0, consecutiveMistakes: 0 },
    shadow: { cleanRounds: 0, consecutiveMistakes: 0 },
    bubbles: { cleanRounds: 0, consecutiveMistakes: 0 },
    memory: { cleanRounds: 0, consecutiveMistakes: 0 },
    puzzle: { cleanRounds: 0, consecutiveMistakes: 0 },
    weather: { cleanRounds: 0, consecutiveMistakes: 0 },
  },
  soundEnabled: true,
};

export const MAX_GAME_LEVELS: Record<MiniGameMode, number> = {
  feed: 4,
  shadow: 5,
  bubbles: 4,
  memory: 5,
  puzzle: 3,
  weather: 3,
};

export function loadMiniGamesProgress(): MiniGamesProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<MiniGamesProgress>;
    return {
      levels: { ...DEFAULT_PROGRESS.levels, ...(parsed.levels ?? {}) },
      streaks: {
        feed: { ...DEFAULT_PROGRESS.streaks.feed, ...(parsed.streaks?.feed ?? {}) },
        shadow: { ...DEFAULT_PROGRESS.streaks.shadow, ...(parsed.streaks?.shadow ?? {}) },
        bubbles: { ...DEFAULT_PROGRESS.streaks.bubbles, ...(parsed.streaks?.bubbles ?? {}) },
        memory: { ...DEFAULT_PROGRESS.streaks.memory, ...(parsed.streaks?.memory ?? {}) },
        puzzle: { ...DEFAULT_PROGRESS.streaks.puzzle, ...(parsed.streaks?.puzzle ?? {}) },
        weather: { ...DEFAULT_PROGRESS.streaks.weather, ...(parsed.streaks?.weather ?? {}) },
      },
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveMiniGamesProgress(progress: MiniGamesProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export function saveSoundPreference(enabled: boolean): void {
  const current = loadMiniGamesProgress();
  saveMiniGamesProgress({ ...current, soundEnabled: enabled });
}

export function recordGameMistake(mode: MiniGameMode): number {
  const current = loadMiniGamesProgress();
  const streak = current.streaks[mode];
  const nextMistakes = streak.consecutiveMistakes + 1;
  let nextLevel = current.levels[mode];

  if (nextMistakes >= 3) {
    nextLevel = Math.max(1, nextLevel - 1);
    current.streaks[mode] = { cleanRounds: 0, consecutiveMistakes: 0 };
  } else {
    current.streaks[mode] = { cleanRounds: 0, consecutiveMistakes: nextMistakes };
  }
  current.levels[mode] = nextLevel;
  saveMiniGamesProgress(current);
  return nextLevel;
}

export function recordRoundComplete(mode: MiniGameMode, cleanRound: boolean): number {
  const current = loadMiniGamesProgress();
  const maxLvl = MAX_GAME_LEVELS[mode];
  const prevStreak = current.streaks[mode];
  let nextLevel = current.levels[mode];

  if (cleanRound) {
    const nextClean = prevStreak.cleanRounds + 1;
    if (nextClean >= 3 && nextLevel < maxLvl) {
      nextLevel += 1;
      current.streaks[mode] = { cleanRounds: 0, consecutiveMistakes: 0 };
    } else {
      current.streaks[mode] = { cleanRounds: nextClean, consecutiveMistakes: 0 };
    }
  } else {
    current.streaks[mode] = { cleanRounds: 0, consecutiveMistakes: 0 };
  }
  current.levels[mode] = Math.min(maxLvl, Math.max(1, nextLevel));
  saveMiniGamesProgress(current);
  return current.levels[mode];
}

export function setManualGameLevel(mode: MiniGameMode, level: number): number {
  const current = loadMiniGamesProgress();
  const clamped = Math.min(MAX_GAME_LEVELS[mode], Math.max(1, level));
  current.levels[mode] = clamped;
  current.streaks[mode] = { cleanRounds: 0, consecutiveMistakes: 0 };
  saveMiniGamesProgress(current);
  return clamped;
}
