import { AllGameMode } from './kitchenData';

/** Размер мира-карты (px) и места игр. Картинка карты — /assets/princess/bg/map.webp (3:2) */
export const WORLD = { w: 4800, h: 3200 };

/** Откуда стартует помощник (ступени замка) */
export const START_POS = { x: 2400, y: 1347 };

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
  { mode: 'pizza', img: 'pizza', aria: 'Пицца', x: 1600, y: 1667 },
  { mode: 'icecream', img: 'icecream', aria: 'Мороженое', x: 2000, y: 1840 },
  { mode: 'soup', img: 'soup', aria: 'Суп', x: 2400, y: 1933 },
  { mode: 'sandwich', img: 'sandwich', aria: 'Бутерброд', x: 2800, y: 1840 },
  { mode: 'drinks', img: 'drinks', aria: 'Напитки', x: 3200, y: 1667 },
  { mode: 'cake', img: 'cake', aria: 'Торт', x: 3227, y: 2093 },
  // По бокам замка — мастерская, зеркало, купание
  { mode: 'coloring', img: 'coloring', aria: 'Раскраска', x: 1493, y: 800 },
  { mode: 'tshirt', img: 'tshirt', aria: 'Футболка', x: 1413, y: 1200 },
  { mode: 'wash', img: 'wash', aria: 'Купание', x: 3387, y: 747 },
  { mode: 'face', img: 'face', aria: 'Волшебное зеркало', x: 3493, y: 1200 },
  // Сад
  { mode: 'shadow', img: 'shadow', aria: 'Найди тень', x: 573, y: 1307 },
  { mode: 'bubbles', img: 'bubbles', aria: 'Пузыри', x: 1147, y: 1240 },
  { mode: 'weather', img: 'weather', aria: 'По погоде', x: 720, y: 1773 },
  // Площадка
  { mode: 'bigsmall', img: 'bigsmall', aria: 'Большой и маленький', x: 3973, y: 933 },
  { mode: 'puzzle', img: 'puzzle', aria: 'Пазл', x: 3840, y: 1573 },
  { mode: 'memory', img: 'memory', aria: 'Найди пару', x: 4373, y: 1307 },
  // Тайник Зубы
  { mode: 'feed', img: 'feed', aria: 'Покорми', x: 1093, y: 2480 },
  // Картонный театр (шатёр)
  { mode: 'simon', img: 'simon', aria: 'Повтори за героями', x: 3773, y: 2360 },
  // Телевизор — мультики про Зубу и Слоню
  { mode: 'tv', img: 'tv', aria: 'Телевизор', x: 2400, y: 2520 },
  { mode: 'emotions', img: 'emotions', aria: 'Эмоции', x: 4360, y: 2560 },
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
  { x: 4344, y: 264, r: 227, aria: 'Солнышко', emojis: ['☀️', '😊', '✨'], pitch: 5 },
  { x: 492, y: 264, r: 200, aria: 'Облачко', emojis: ['☁️', '😄', '💦'], pitch: 2 },
  { x: 1224, y: 276, r: 173, aria: 'Облачко', emojis: ['☁️', '🤭', '✨'], pitch: 3 },
  { x: 3672, y: 264, r: 200, aria: 'Облачко', emojis: ['☁️', '🎈', '😆'], pitch: 1 },
  { x: 4548, y: 2316, r: 160, aria: 'Облачко', emojis: ['☁️', '🌈', '✨'], pitch: 4 },
  { x: 2016, y: 2964, r: 173, aria: 'Облачко', emojis: ['☁️', '😴', '💤'], pitch: 0 },
  { x: 1248, y: 768, r: 200, aria: 'Дерево', emojis: ['🍃', '🐦', '🍎'], pitch: 2 },
  { x: 3480, y: 792, r: 200, aria: 'Дерево', emojis: ['🍃', '🐿️', '🌰'], pitch: 3 },
  { x: 312, y: 912, r: 173, aria: 'Дерево', emojis: ['🍃', '🦋', '🌸'], pitch: 1 },
  { x: 4512, y: 912, r: 173, aria: 'Дерево', emojis: ['🍃', '🐞', '🍒'], pitch: 4 },
  { x: 2304, y: 2232, r: 267, aria: 'Пруд', emojis: ['💦', '🐸', '🫧'], pitch: 0 },
  { x: 1008, y: 1560, r: 147, aria: 'Мостик', emojis: ['🪵', '🐟', '🎵'], pitch: 2 },
  { x: 3216, y: 1728, r: 133, aria: 'Качели-балансир', emojis: ['🤸', '😂', '✨'], pitch: 5 },
  { x: 4080, y: 1272, r: 160, aria: 'Качели', emojis: ['🎠', '😆', '🎶'], pitch: 4 },
  { x: 3552, y: 1296, r: 160, aria: 'Горка', emojis: ['🛝', '😁', '💨'], pitch: 3 },
];
