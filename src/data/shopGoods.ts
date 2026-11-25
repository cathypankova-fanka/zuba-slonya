/** Общий каталог товаров для магазинных игр (список покупок, герои-покупатели, доставка). */

const PL = (n: string) => `/assets/items/play/${n}.webp`;
const A = (n: string) => `/assets/items/accessories/${n}.webp`;

export type GoodColor = 'red' | 'yellow' | 'green' | 'orange' | 'brown' | 'blue' | 'pink' | 'white';
export type GoodKind = 'fruit' | 'veg' | 'sweet' | 'toy' | 'food';

export interface Good {
  id: string;
  name: string;
  src: string;
  color: GoodColor;
  kind: GoodKind;
}

export const GOODS: Good[] = [
  // фрукты
  { id: 'apple', name: 'Яблоко', src: PL('apple'), color: 'red', kind: 'fruit' },
  { id: 'strawberry', name: 'Клубника', src: A('strawberry'), color: 'red', kind: 'fruit' },
  { id: 'cherry', name: 'Вишня', src: A('cherry'), color: 'red', kind: 'fruit' },
  { id: 'banana', name: 'Банан', src: PL('banana'), color: 'yellow', kind: 'fruit' },
  { id: 'pineapple', name: 'Ананас', src: A('pineapple'), color: 'yellow', kind: 'fruit' },
  { id: 'orange', name: 'Апельсин', src: A('orange_fruit'), color: 'orange', kind: 'fruit' },
  { id: 'grape', name: 'Виноград', src: PL('grape'), color: 'green', kind: 'fruit' },
  { id: 'kiwi', name: 'Киви', src: PL('kiwi'), color: 'brown', kind: 'fruit' },
  { id: 'watermelon', name: 'Арбуз', src: A('watermelon'), color: 'green', kind: 'fruit' },
  // овощи
  { id: 'tomato', name: 'Помидор', src: PL('cherry_tomato'), color: 'red', kind: 'veg' },
  { id: 'lettuce', name: 'Салат', src: PL('lettuce_leaf'), color: 'green', kind: 'veg' },
  { id: 'pickles', name: 'Огурчики', src: PL('pickles'), color: 'green', kind: 'veg' },
  { id: 'avocado', name: 'Авокадо', src: A('avocado'), color: 'green', kind: 'veg' },
  { id: 'potato', name: 'Картошка', src: PL('potato'), color: 'brown', kind: 'veg' },
  // сладкое
  { id: 'cookie_star', name: 'Печенье', src: PL('cookie_star'), color: 'brown', kind: 'sweet' },
  { id: 'cookie_heart', name: 'Печенье', src: PL('cookie_heart'), color: 'brown', kind: 'sweet' },
  { id: 'donut', name: 'Пончик', src: A('donut'), color: 'pink', kind: 'sweet' },
  { id: 'cupcake', name: 'Кекс', src: A('cupcake'), color: 'pink', kind: 'sweet' },
  { id: 'cake', name: 'Тортик', src: A('cake_slice'), color: 'pink', kind: 'sweet' },
  { id: 'lollipop', name: 'Леденец', src: A('lollipop'), color: 'pink', kind: 'sweet' },
  { id: 'icecream', name: 'Мороженое', src: A('icecream'), color: 'blue', kind: 'sweet' },
  // еда
  { id: 'milk', name: 'Молоко', src: PL('milk'), color: 'white', kind: 'food' },
  { id: 'egg', name: 'Яйцо', src: PL('egg'), color: 'white', kind: 'food' },
  { id: 'pizza', name: 'Пицца', src: A('pizza'), color: 'orange', kind: 'food' },
  // игрушки
  { id: 'teddy', name: 'Мишка', src: A('bear'), color: 'brown', kind: 'toy' },
  { id: 'duck', name: 'Утёнок', src: A('duckling'), color: 'yellow', kind: 'toy' },
  { id: 'car', name: 'Машинка', src: A('car'), color: 'red', kind: 'toy' },
  { id: 'balloon', name: 'Шарик', src: A('balloon'), color: 'red', kind: 'toy' },
  { id: 'rocket', name: 'Ракета', src: A('rocket'), color: 'red', kind: 'toy' },
  { id: 'dino', name: 'Динозаврик', src: A('dino'), color: 'green', kind: 'toy' },
  { id: 'tractor', name: 'Трактор', src: A('tractor'), color: 'green', kind: 'toy' },
  { id: 'book', name: 'Книжка', src: PL('book'), color: 'blue', kind: 'toy' },
  { id: 'crown', name: 'Корона', src: A('crown'), color: 'yellow', kind: 'toy' },
  { id: 'puppy', name: 'Щенок', src: A('puppy'), color: 'orange', kind: 'toy' },
  { id: 'kitty', name: 'Котёнок', src: A('kitty'), color: 'orange', kind: 'toy' },
];

export const goodById = (id: string) => GOODS.find((g) => g.id === id)!;

/** Еда для списка покупок (то, что покупают в продуктовом). */
export const GROCERY = GOODS.filter((g) => g.kind !== 'toy');

export const COLOR_HEX: Record<GoodColor, string> = {
  red: '#EF4444', yellow: '#FACC15', green: '#22C55E', orange: '#F97316', brown: '#92400E', blue: '#38BDF8', pink: '#F472B6', white: '#FFFFFF',
};

export const KIND_ICON: Record<GoodKind, string> = { fruit: '🍎', veg: '🥕', sweet: '🍭', toy: '🧸', food: '🍽️' };
