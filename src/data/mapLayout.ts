import { AllGameMode } from './kitchenData';

/** Размер мира-карты (px) и места игр. Картинка карты — /assets/princess/bg/map_big.webp (6272×2651, растянута в 1,5 раза) */
export const WORLD = { w: 9408, h: 3976 };

/** Откуда стартует помощник (ступени замка) */
export const START_POS = { x: 4380, y: 1990 };

export interface MapMarker {
  mode: AllGameMode;
  /** вывеска-значок: /assets/princess/markers/<img>.webp */
  img: string;
  aria: string;
  x: number;
  y: number;
}

export const MAP_MARKERS: MapMarker[] = [
  // Дорожка у замка — кухня
  { mode: 'pizza', img: 'pizza', aria: 'Пицца', x: 3900, y: 1950 },
  { mode: 'icecream', img: 'icecream', aria: 'Мороженое', x: 7800, y: 900 },
  { mode: 'soup', img: 'soup', aria: 'Суп', x: 4000, y: 2750 },
  { mode: 'sandwich', img: 'sandwich', aria: 'Бутерброд', x: 5350, y: 2800 },
  { mode: 'drinks', img: 'drinks', aria: 'Напитки', x: 8300, y: 1650 },
  { mode: 'cake', img: 'cake', aria: 'Торт', x: 4950, y: 3200 },
  // По бокам замка — мастерская, зеркало, купание
  { mode: 'coloring', img: 'coloring', aria: 'Раскраска', x: 3250, y: 900 },
  { mode: 'tshirt', img: 'tshirt', aria: 'Футболка', x: 3500, y: 2450 },
  { mode: 'wash', img: 'wash', aria: 'Купание', x: 5900, y: 750 },
  { mode: 'face', img: 'face', aria: 'Волшебное зеркало', x: 5950, y: 1350 },
  // Сад
  { mode: 'shadow', img: 'shadow', aria: 'Магазин', x: 2450, y: 1950 },
  { mode: 'bubbles', img: 'bubbles', aria: 'Пузыри', x: 2850, y: 1350 },
  { mode: 'weather', img: 'weather', aria: 'По погоде', x: 2250, y: 2500 },
  // Площадка
  { mode: 'bigsmall', img: 'bigsmall', aria: 'Большой и маленький', x: 6700, y: 1100 },
  { mode: 'puzzle', img: 'puzzle', aria: 'Пазл', x: 7100, y: 2200 },
  { mode: 'memory', img: 'memory', aria: 'Найди пару', x: 6600, y: 1750 },
  // Тайник Зубы
  { mode: 'feed', img: 'feed', aria: 'Покорми', x: 3000, y: 3200 },
  // Картонный театр (шатёр)
  { mode: 'simon', img: 'simon', aria: 'Повтори за героями', x: 6300, y: 2800 },
  // Телевизор — мультики про Зубу и Слоню
  { mode: 'tv', img: 'tv', aria: 'Телевизор', x: 4200, y: 3500 },
  { mode: 'emotions', img: 'emotions', aria: 'Эмоции', x: 6800, y: 3400 },
  // Новые мини-игры
  { mode: 'milkshake', img: 'milkshake', aria: 'Милкшейк', x: 7250, y: 1450 },
  { mode: 'pancakes', img: 'pancakes', aria: 'Блинчики', x: 2300, y: 800 },
  { mode: 'cookies', img: 'cookies', aria: 'Печенье', x: 1450, y: 2420 },
  { mode: 'popcorn', img: 'popcorn', aria: 'Попкорн', x: 5600, y: 3600 },
  { mode: 'skewers', img: 'skewers', aria: 'Фруктовые шашлычки', x: 1450, y: 1850 },
  { mode: 'picnic', img: 'picnic', aria: 'Пикник', x: 7700, y: 2850 },
  { mode: 'bedtime', img: 'bedtime', aria: 'Уложи спать', x: 2050, y: 3250 },
  { mode: 'doctor', img: 'doctor', aria: 'Доктор', x: 1000, y: 3000 },
  { mode: 'garden', img: 'garden', aria: 'Садик', x: 750, y: 1800 },
  { mode: 'laundry', img: 'laundry', aria: 'Стирка', x: 1400, y: 1050 },
  { mode: 'popit', img: 'popit', aria: 'Попит', x: 5750, y: 2050 },
  { mode: 'phone', img: 'phone', aria: 'Телефон', x: 4650, y: 2250 },
  { mode: 'numbers', img: 'numbers', aria: 'Цифры', x: 8250, y: 2450 },
  { mode: 'letters', img: 'letters', aria: 'Буквы', x: 8500, y: 3250 },
  { mode: 'music', img: 'music', aria: 'Музыка', x: 4650, y: 1500 },
  { mode: 'house', img: 'house', aria: 'Домик', x: 2150, y: 2700 },
  { mode: 'birthday', img: 'birthday', aria: 'День рождения', x: 4650, y: 700 },
  { mode: 'pasta', img: 'pasta', aria: 'Паста', x: 5150, y: 2450 },
  { mode: 'rain', img: 'rain', aria: 'Дождик и лужи', x: 8000, y: 3400 },
  { mode: 'burger', img: 'burger', aria: 'Бургер и картошка', x: 6650, y: 2350 },
];

export interface MapDecor {
  x: number;
  y: number;
  r: number;
  aria: string;
  emojis: string[];
  /** высота ноты в звуке нажатия */
  pitch: number;
}

/** Предметы карты, которые «оживают» по нажатию */
export const MAP_DECOR: MapDecor[] = [
  { x: 2530, y: 330, r: 260, aria: 'Мельница', emojis: ['🌾', '💨', '🎵'], pitch: 3 },
  { x: 4650, y: 2620, r: 340, aria: 'Пруд', emojis: ['💦', '🐸', '🫧'], pitch: 0 },
  { x: 3250, y: 1960, r: 170, aria: 'Мостик', emojis: ['🪵', '🐟', '🎵'], pitch: 2 },
  { x: 9050, y: 900, r: 420, aria: 'Море', emojis: ['🌊', '🐬', '⛵'], pitch: 1 },
  { x: 6350, y: 2230, r: 220, aria: 'Песочница', emojis: ['🏖️', '🪣', '✨'], pitch: 4 },
  { x: 600, y: 3300, r: 320, aria: 'Лес', emojis: ['🌳', '🐿️', '🍄'], pitch: 2 },
  { x: 7350, y: 3450, r: 300, aria: 'Цветочная поляна', emojis: ['🌼', '🦋', '🐝'], pitch: 5 },
  { x: 900, y: 1000, r: 260, aria: 'Ферма', emojis: ['🐮', '🐔', '🐷'], pitch: 1 },
];
