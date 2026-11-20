export interface PaintColor {
  id: string;
  name: string;
  hex: string;
  ringHex: string;
}

export const PAINT_COLORS: PaintColor[] = [
  { id: 'red', name: 'Красный', hex: '#FF3B5C', ringHex: '#E11D48' },
  { id: 'orange', name: 'Оранжевый', hex: '#FF7A1A', ringHex: '#EA580C' },
  { id: 'yellow', name: 'Солнечный', hex: '#FFC700', ringHex: '#D97706' },
  { id: 'green', name: 'Зелёный', hex: '#10C97A', ringHex: '#059669' },
  { id: 'cyan', name: 'Бирюзовый', hex: '#06B6D4', ringHex: '#0891B2' },
  { id: 'blue', name: 'Синий', hex: '#2563EB', ringHex: '#1D4ED8' },
  { id: 'purple', name: 'Сиреневый', hex: '#8B5CF6', ringHex: '#7C3AED' },
  { id: 'pink', name: 'Розовый', hex: '#FF5CA8', ringHex: '#DB2777' },
  { id: 'white', name: 'Белый', hex: '#FFFFFF', ringHex: '#CBD5E1' },
];

export type PatternStampId =
  | 'blush'
  | 'star'
  | 'heart'
  | 'flower'
  | 'butterfly'
  | 'dots'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'crown'
  | 'paw'
  | 'lightning'
  | 'spiral'
  | 'leaf'
  | 'sparkle'
  | 'diamond'
  | 'music'
  | 'snow'
  | 'clover'
  | 'apple'
  | 'smile'
  | 'wave'
  | 'shell'
  | 'rainbow_arc'
  | 'bow_stamp'
  | 'swirl'
  | 'double_heart'
  | 'triple_star'
  | 'comet'
  | 'planet_stamp'
  | 'rocket_stamp'
  | 'tulip'
  | 'daisy'
  | 'rose'
  | 'cactus'
  | 'mushroom'
  | 'acorn'
  | 'cherry_stamp'
  | 'berry'
  | 'lemon'
  | 'candy'
  | 'lollipop_stamp'
  | 'cupcake_stamp'
  | 'donut_stamp'
  | 'icecream_stamp'
  | 'cat_face'
  | 'bunny_face'
  | 'bear_face'
  | 'fish_stamp'
  | 'bird'
  | 'whale_stamp'
  | 'ladybug_stamp'
  | 'bee_stamp'
  | 'snail'
  | 'feather'
  | 'wing'
  | 'angel_halo'
  | 'balloon_stamp'
  | 'flag'
  | 'anchor'
  | 'boat'
  | 'car_stamp'
  | 'airplane'
  | 'train_stamp'
  | 'umbrella'
  | 'raindrop'
  | 'fire'
  | 'gem_oval'
  | 'key'
  | 'bell'
  | 'treble_clef'
  | 'paw_double'
  | 'kiss'
  | 'wink'
  | 'confetti_stamp';

export interface PatternStamp {
  id: PatternStampId;
  name: string;
}

export const PATTERN_STAMPS: PatternStamp[] = [
  { id: 'blush', name: 'Румянец' },
  { id: 'star', name: 'Звезда' },
  { id: 'heart', name: 'Сердечко' },
  { id: 'flower', name: 'Цветочек' },
  { id: 'butterfly', name: 'Бабочка' },
  { id: 'dots', name: 'Веснушки' },
  { id: 'sun', name: 'Солнышко' },
  { id: 'moon', name: 'Месяц' },
  { id: 'cloud', name: 'Облачко' },
  { id: 'crown', name: 'Коронка' },
  { id: 'paw', name: 'Лапка' },
  { id: 'lightning', name: 'Молния' },
  { id: 'spiral', name: 'Завиток' },
  { id: 'leaf', name: 'Листик' },
  { id: 'sparkle', name: 'Искорка' },
  { id: 'diamond', name: 'Кристалл' },
  { id: 'music', name: 'Нотка' },
  { id: 'snow', name: 'Снежинка' },
  { id: 'clover', name: 'Клевер' },
  { id: 'apple', name: 'Яблочко' },
  { id: 'smile', name: 'Смайлик' },
  { id: 'wave', name: 'Волна' },
  { id: 'shell', name: 'Ракушка' },
  { id: 'rainbow_arc', name: 'Радуга' },
  { id: 'bow_stamp', name: 'Бантик' },
  { id: 'swirl', name: 'Завитушка' },
  { id: 'double_heart', name: 'Два сердца' },
  { id: 'triple_star', name: 'Созвездие' },
  { id: 'comet', name: 'Комета' },
  { id: 'planet_stamp', name: 'Планетка' },
  { id: 'rocket_stamp', name: 'Ракета' },
  { id: 'tulip', name: 'Тюльпан' },
  { id: 'daisy', name: 'Ромашка' },
  { id: 'rose', name: 'Розочка' },
  { id: 'cactus', name: 'Кактус' },
  { id: 'mushroom', name: 'Грибок' },
  { id: 'acorn', name: 'Жёлудь' },
  { id: 'cherry_stamp', name: 'Вишня' },
  { id: 'berry', name: 'Ягодка' },
  { id: 'lemon', name: 'Лимончик' },
  { id: 'candy', name: 'Конфетка' },
  { id: 'lollipop_stamp', name: 'Леденец' },
  { id: 'cupcake_stamp', name: 'Кексик' },
  { id: 'donut_stamp', name: 'Пончик' },
  { id: 'icecream_stamp', name: 'Рожок' },
  { id: 'cat_face', name: 'Котик' },
  { id: 'bunny_face', name: 'Зайчик' },
  { id: 'bear_face', name: 'Мишка' },
  { id: 'fish_stamp', name: 'Рыбка' },
  { id: 'bird', name: 'Птичка' },
  { id: 'whale_stamp', name: 'Китёнок' },
  { id: 'ladybug_stamp', name: 'Жучок' },
  { id: 'bee_stamp', name: 'Пчёлка' },
  { id: 'snail', name: 'Улитка' },
  { id: 'feather', name: 'Пёрышко' },
  { id: 'wing', name: 'Крылышко' },
  { id: 'angel_halo', name: 'Сияние' },
  { id: 'balloon_stamp', name: 'Шарик' },
  { id: 'flag', name: 'Флажок' },
  { id: 'anchor', name: 'Якорь' },
  { id: 'boat', name: 'Кораблик' },
  { id: 'car_stamp', name: 'Машинка' },
  { id: 'airplane', name: 'Самолёт' },
  { id: 'train_stamp', name: 'Паровоз' },
  { id: 'umbrella', name: 'Зонтик' },
  { id: 'raindrop', name: 'Капелька' },
  { id: 'fire', name: 'Огонёк' },
  { id: 'gem_oval', name: 'Самоцвет' },
  { id: 'key', name: 'Ключик' },
  { id: 'bell', name: 'Колокольчик' },
  { id: 'treble_clef', name: 'Мелодия' },
  { id: 'paw_double', name: 'Следы' },
  { id: 'kiss', name: 'Губки' },
  { id: 'wink', name: 'Подмиг' },
  { id: 'confetti_stamp', name: 'Конфетти' },
];

export interface StickerDef {
  id: string;
  name: string;
  aspectRatio: number; // width / height
  baseWidthRatio: number; // relative to canvas width
  svg: string;
}

export const STICKERS: StickerDef[] = [
  {
    id: 'crown',
    name: 'Корона',
    aspectRatio: 1.4,
    baseWidthRatio: 0.34,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <path d="M12 82 L8 28 L42 52 L70 14 L98 52 L132 28 L128 82 Z" fill="#FFD13B" stroke="#D97706" stroke-width="5" stroke-linejoin="round"/>
      <rect x="10" y="76" width="120" height="16" rx="8" fill="#F59E0B" stroke="#B45309" stroke-width="4"/>
      <circle cx="70" cy="14" r="9" fill="#FF3B5C" stroke="#B45309" stroke-width="3"/>
      <circle cx="8" cy="28" r="7" fill="#38BDF8" stroke="#B45309" stroke-width="3"/>
      <circle cx="132" cy="28" r="7" fill="#38BDF8" stroke="#B45309" stroke-width="3"/>
      <circle cx="44" cy="64" r="6" fill="#A855F7"/>
      <circle cx="70" cy="58" r="7" fill="#FF3B5C"/>
      <circle cx="96" cy="64" r="6" fill="#10B981"/>
    </svg>`,
  },
  {
    id: 'glasses',
    name: 'Очки',
    aspectRatio: 2.2,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 100">
      <path d="M52 14 L63 36 L88 39 L69 56 L74 82 L52 69 L30 82 L35 56 L16 39 L41 36 Z" fill="#FF5CA8" stroke="#BE185D" stroke-width="5" stroke-linejoin="round"/>
      <path d="M168 14 L179 36 L204 39 L185 56 L190 82 L168 69 L146 82 L151 56 L132 39 L157 36 Z" fill="#FF5CA8" stroke="#BE185D" stroke-width="5" stroke-linejoin="round"/>
      <path d="M84 44 Q110 30 136 44" fill="none" stroke="#BE185D" stroke-width="7" stroke-linecap="round"/>
      <path d="M40 34 L50 24 M156 34 L166 24" stroke="#FFF" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    </svg>`,
  },
  {
    id: 'beanie_pom',
    name: 'Шапочка',
    aspectRatio: 1.18,
    baseWidthRatio: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 110">
      <circle cx="65" cy="18" r="14" fill="#FFFBEB" stroke="#D97706" stroke-width="4"/>
      <path d="M22 76 C22 36, 108 36, 108 76 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 58 Q65 46 98 58" fill="none" stroke="#FFD13B" stroke-width="7" stroke-linecap="round"/>
      <rect x="14" y="72" width="102" height="24" rx="12" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <line x1="36" y1="74" x2="36" y2="94" stroke="#0369A1" stroke-width="3" opacity="0.45"/>
      <line x1="55" y1="74" x2="55" y2="94" stroke="#0369A1" stroke-width="3" opacity="0.45"/>
      <line x1="75" y1="74" x2="75" y2="94" stroke="#0369A1" stroke-width="3" opacity="0.45"/>
      <line x1="94" y1="74" x2="94" y2="94" stroke="#0369A1" stroke-width="3" opacity="0.45"/>
    </svg>`,
  },
  {
    id: 'cap_baseball',
    name: 'Кепка',
    aspectRatio: 1.5,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
      <circle cx="70" cy="16" r="6" fill="#FFD13B" stroke="#1D4ED8" stroke-width="3"/>
      <path d="M24 68 C24 28, 116 28, 116 68 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="4" stroke-linejoin="round"/>
      <path d="M70 20 C62 34, 60 50, 60 66" fill="none" stroke="#1D4ED8" stroke-width="3" opacity="0.5"/>
      <path d="M70 20 C84 34, 88 50, 88 66" fill="none" stroke="#1D4ED8" stroke-width="3" opacity="0.5"/>
      <path d="M20 68 C58 58, 128 60, 142 78 C144 84, 128 88, 98 84 C68 80, 38 78, 20 68 Z" fill="#FFD13B" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <path d="M46 42 L50 50 L58 51 L52 56 L54 64 L46 60 L38 64 L40 56 L34 51 L42 50 Z" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'frog_hat',
    name: 'Шапка-жабка',
    aspectRatio: 1.33,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 105">
      <circle cx="42" cy="26" r="18" fill="#4ADE80" stroke="#15803D" stroke-width="4"/>
      <circle cx="98" cy="26" r="18" fill="#4ADE80" stroke="#15803D" stroke-width="4"/>
      <path d="M18 84 C18 40, 122 40, 122 84 Q70 94 18 84 Z" fill="#4ADE80" stroke="#15803D" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="42" cy="26" r="10" fill="#FFFFFF"/>
      <circle cx="98" cy="26" r="10" fill="#FFFFFF"/>
      <circle cx="43" cy="26" r="5" fill="#0F172A"/>
      <circle cx="97" cy="26" r="5" fill="#0F172A"/>
      <circle cx="34" cy="68" r="7" fill="#FDA4AF"/>
      <circle cx="106" cy="68" r="7" fill="#FDA4AF"/>
      <path d="M54 70 Q70 80 86 70" fill="none" stroke="#14532D" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bear_hat',
    name: 'Шапка-мишка',
    aspectRatio: 1.27,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110">
      <circle cx="36" cy="30" r="18" fill="#D9945E" stroke="#78350F" stroke-width="4"/>
      <circle cx="36" cy="30" r="9" fill="#FDE68A"/>
      <circle cx="104" cy="30" r="18" fill="#D9945E" stroke="#78350F" stroke-width="4"/>
      <circle cx="104" cy="30" r="9" fill="#FDE68A"/>
      <path d="M20 82 C20 38, 120 38, 120 82 Z" fill="#C27D48" stroke="#78350F" stroke-width="4" stroke-linejoin="round"/>
      <rect x="14" y="76" width="112" height="20" rx="10" fill="#FEF3C7" stroke="#78350F" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'sun_hat',
    name: 'Шляпка',
    aspectRatio: 1.79,
    baseWidthRatio: 0.48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 95">
      <path d="M44 58 C46 22, 124 22, 126 58 Z" fill="#FDE047" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 50 Q85 56 126 50 L127 60 Q85 66 43 60 Z" fill="#FF5CA8"/>
      <ellipse cx="85" cy="68" rx="78" ry="18" fill="#FACC15" stroke="#D97706" stroke-width="4"/>
      <path d="M44 58 Q85 68 126 58" fill="none" stroke="#BE185D" stroke-width="3.5"/>
      <circle cx="122" cy="48" r="8" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
      <circle cx="122" cy="48" r="3" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'wizard_hat',
    name: 'Шляпа мага',
    aspectRatio: 1.17,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120">
      <path d="M34 92 L66 14 Q74 8 82 22 L106 92 Z" fill="#7C3AED" stroke="#4C1D95" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="70" cy="96" rx="62" ry="14" fill="#8B5CF6" stroke="#4C1D95" stroke-width="4"/>
      <path d="M40 84 Q70 90 100 84" fill="none" stroke="#FFD13B" stroke-width="7" stroke-linecap="round"/>
      <path d="M70 38 L74 48 L84 49 L76 55 L78 65 L70 60 L62 65 L64 55 L56 49 L66 48 Z" fill="#FFD13B"/>
      <circle cx="54" cy="70" r="4" fill="#FEF08A"/>
      <circle cx="88" cy="66" r="3.5" fill="#38BDF8"/>
    </svg>`,
  },
  {
    id: 'pirate_hat',
    name: 'Пиратка',
    aspectRatio: 1.6,
    baseWidthRatio: 0.48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">
      <path d="M12 72 C24 38, 56 14, 80 14 C104 14, 136 38, 148 72 Q80 90 12 72 Z" fill="#1E293B" stroke="#0F172A" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 70 Q80 86 144 70" fill="none" stroke="#FFD13B" stroke-width="5" stroke-linecap="round"/>
      <path d="M80 28 L86 42 L101 44 L90 53 L93 67 L80 60 L67 67 L70 53 L59 44 L74 42 Z" fill="#FFD13B"/>
      <circle cx="80" cy="49" r="5" fill="#FF3B5C"/>
    </svg>`,
  },
  {
    id: 'party_hat',
    name: 'Колпачок',
    aspectRatio: 0.83,
    baseWidthRatio: 0.3,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
      <path d="M16 102 L50 18 L84 102 Q50 112 16 102 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <path d="M29 72 L71 72" stroke="#FFD13B" stroke-width="9" stroke-linecap="round"/>
      <path d="M38 50 L62 50" stroke="#FF5CA8" stroke-width="8" stroke-linecap="round"/>
      <circle cx="50" cy="15" r="11" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
      <circle cx="24" cy="100" r="6" fill="#FFD13B"/>
      <circle cx="50" cy="104" r="6" fill="#FF5CA8"/>
      <circle cx="76" cy="100" r="6" fill="#10C97A"/>
    </svg>`,
  },
  {
    id: 'cowboy_hat',
    name: 'Ковбой',
    aspectRatio: 1.79,
    baseWidthRatio: 0.48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 95">
      <path d="M46 58 L54 20 Q72 28 85 22 Q98 28 116 20 L124 58 Z" fill="#B45309" stroke="#78350F" stroke-width="4" stroke-linejoin="round"/>
      <path d="M47 50 Q85 58 123 50" fill="none" stroke="#F59E0B" stroke-width="7"/>
      <path d="M12 52 C28 74, 142 74, 158 52 C164 68, 134 86, 85 86 C36 86, 6 68, 12 52 Z" fill="#D97706" stroke="#78350F" stroke-width="4" stroke-linejoin="round"/>
      <path d="M85 32 L88 39 L96 40 L90 45 L92 52 L85 48 L78 52 L80 45 L74 40 L82 39 Z" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'chef_hat',
    name: 'Колпак повара',
    aspectRatio: 1.13,
    baseWidthRatio: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 115">
      <path d="M30 68 C10 64, 10 34, 34 32 C38 14, 60 8, 65 16 C70 8, 92 14, 96 32 C120 34, 120 64, 100 68 L98 98 L32 98 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4" stroke-linejoin="round"/>
      <rect x="30" y="76" width="70" height="22" rx="4" fill="#F8FAFC" stroke="#94A3B8" stroke-width="3.5"/>
      <line x1="48" y1="78" x2="48" y2="96" stroke="#CBD5E1" stroke-width="3"/>
      <line x1="65" y1="78" x2="65" y2="96" stroke="#CBD5E1" stroke-width="3"/>
      <line x1="82" y1="78" x2="82" y2="96" stroke="#CBD5E1" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'beret',
    name: 'Беретик',
    aspectRatio: 1.47,
    baseWidthRatio: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 95">
      <line x1="70" y1="10" x2="72" y2="24" stroke="#9F1239" stroke-width="5" stroke-linecap="round"/>
      <path d="M16 64 C8 38, 38 18, 74 20 C110 22, 134 40, 124 64 C112 78, 30 78, 16 64 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4" stroke-linejoin="round"/>
      <path d="M26 70 Q70 80 114 70" fill="none" stroke="#881337" stroke-width="7" stroke-linecap="round"/>
      <path d="M36 38 Q56 26 84 30" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },
  {
    id: 'glasses_round',
    name: 'Круглые очки',
    aspectRatio: 2.32,
    baseWidthRatio: 0.43,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 95">
      <circle cx="56" cy="48" r="36" fill="#E0F2FE" fill-opacity="0.55" stroke="#2563EB" stroke-width="8"/>
      <circle cx="164" cy="48" r="36" fill="#E0F2FE" fill-opacity="0.55" stroke="#2563EB" stroke-width="8"/>
      <path d="M92 44 Q110 30 128 44" fill="none" stroke="#2563EB" stroke-width="8" stroke-linecap="round"/>
      <line x1="10" y1="42" x2="20" y2="42" stroke="#2563EB" stroke-width="8" stroke-linecap="round"/>
      <line x1="200" y1="42" x2="210" y2="42" stroke="#2563EB" stroke-width="8" stroke-linecap="round"/>
      <path d="M36 32 Q44 22 58 24 M144 32 Q152 22 166 24" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'glasses_heart',
    name: 'Очки-сердца',
    aspectRatio: 2.32,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 95">
      <path d="M56 80 C56 80 16 56 16 32 C16 18 28 10 40 12 C48 13 53 19 56 24 C59 19 64 13 72 12 C84 10 96 18 96 32 C96 56 56 80 56 80 Z" fill="#FBCFE8" fill-opacity="0.72" stroke="#DB2777" stroke-width="7" stroke-linejoin="round"/>
      <path d="M164 80 C164 80 124 56 124 32 C124 18 136 10 148 12 C156 13 161 19 164 24 C167 19 172 13 180 12 C192 10 204 18 204 32 C204 56 164 80 164 80 Z" fill="#FBCFE8" fill-opacity="0.72" stroke="#DB2777" stroke-width="7" stroke-linejoin="round"/>
      <path d="M94 34 Q110 24 126 34" fill="none" stroke="#DB2777" stroke-width="7" stroke-linecap="round"/>
      <path d="M30 28 Q35 20 43 22 M138 28 Q143 20 151 22" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'glasses_sun',
    name: 'Солнечные',
    aspectRatio: 2.44,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 90">
      <path d="M12 24 L98 24 C98 62, 78 76, 54 76 C28 76, 12 58, 12 24 Z" fill="#1E293B" stroke="#FFD13B" stroke-width="7" stroke-linejoin="round"/>
      <path d="M122 24 L208 24 C208 58, 192 76, 166 76 C142 76, 122 62, 122 24 Z" fill="#1E293B" stroke="#FFD13B" stroke-width="7" stroke-linejoin="round"/>
      <line x1="96" y1="28" x2="124" y2="28" stroke="#FFD13B" stroke-width="8" stroke-linecap="round"/>
      <path d="M26 36 L44 58 M136 36 L154 58" stroke="#38BDF8" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    </svg>`,
  },
  {
    id: 'glasses_cat',
    name: 'Кошачьи очки',
    aspectRatio: 2.32,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 95">
      <path d="M12 18 L92 32 C94 64, 72 78, 48 76 C22 74, 12 50, 12 18 Z" fill="#DDD6FE" fill-opacity="0.7" stroke="#7C3AED" stroke-width="7" stroke-linejoin="round"/>
      <path d="M208 18 L128 32 C126 64, 148 78, 172 76 C198 74, 208 50, 208 18 Z" fill="#DDD6FE" fill-opacity="0.7" stroke="#7C3AED" stroke-width="7" stroke-linejoin="round"/>
      <path d="M90 36 Q110 26 130 36" fill="none" stroke="#7C3AED" stroke-width="7" stroke-linecap="round"/>
      <circle cx="20" cy="22" r="4" fill="#FFD13B"/>
      <circle cx="200" cy="22" r="4" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'earring_star',
    name: 'Серьга-звезда',
    aspectRatio: 0.7,
    baseWidthRatio: 0.12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100">
      <circle cx="35" cy="18" r="9" fill="none" stroke="#F59E0B" stroke-width="5"/>
      <line x1="35" y1="27" x2="35" y2="38" stroke="#F59E0B" stroke-width="4.5"/>
      <path d="M35 34 L43 52 L62 54 L48 67 L52 86 L35 76 L18 86 L22 67 L8 54 L27 52 Z" fill="#FFD13B" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="35" cy="61" r="4" fill="#FFF"/>
    </svg>`,
  },
  {
    id: 'earring_heart',
    name: 'Серьга-сердце',
    aspectRatio: 0.7,
    baseWidthRatio: 0.12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100">
      <circle cx="35" cy="18" r="9" fill="none" stroke="#F59E0B" stroke-width="5"/>
      <line x1="35" y1="27" x2="35" y2="40" stroke="#F59E0B" stroke-width="4.5"/>
      <path d="M35 88 C35 88 10 70 10 52 C10 41 18 35 26 35 C31 35 34 38 35 42 C36 38 39 35 44 35 C52 35 60 41 60 52 C60 70 35 88 35 88 Z" fill="#FF3B5C" stroke="#BE123C" stroke-width="4" stroke-linejoin="round"/>
      <path d="M19 48 Q22 42 27 43" fill="none" stroke="#FFF" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'earring_hoop',
    name: 'Серьга-кольцо',
    aspectRatio: 0.8,
    baseWidthRatio: 0.12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
      <circle cx="40" cy="52" r="28" fill="none" stroke="#FBBF24" stroke-width="11"/>
      <circle cx="40" cy="52" r="28" fill="none" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="40" cy="18" r="7" fill="#38BDF8" stroke="#0369A1" stroke-width="3"/>
      <path d="M22 36 Q16 50 22 64" fill="none" stroke="#FFFBEB" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'earring_flower',
    name: 'Серьга-цветок',
    aspectRatio: 0.75,
    baseWidthRatio: 0.12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 100">
      <circle cx="37.5" cy="16" r="8" fill="none" stroke="#F59E0B" stroke-width="4.5"/>
      <circle cx="37.5" cy="40" r="11" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="54" cy="53" r="11" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="48" cy="72" r="11" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="27" cy="72" r="11" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="21" cy="53" r="11" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="37.5" cy="58" r="10" fill="#FFD13B" stroke="#D97706" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'earring_gem',
    name: 'Серьга-капля',
    aspectRatio: 0.7,
    baseWidthRatio: 0.11,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100">
      <circle cx="35" cy="18" r="8" fill="#FFD13B" stroke="#D97706" stroke-width="3.5"/>
      <polygon points="35,30 56,56 35,88 14,56" fill="#38BDF8" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="35,36 46,56 35,78 24,56" fill="#BAE6FD" opacity="0.65"/>
    </svg>`,
  },
  {
    id: 'tiara',
    name: 'Диадема',
    aspectRatio: 1.67,
    baseWidthRatio: 0.4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 90">
      <path d="M14 74 Q75 48 136 74" fill="none" stroke="#F59E0B" stroke-width="8" stroke-linecap="round"/>
      <path d="M26 66 L36 38 L56 54 L75 18 L94 54 L114 38 L124 66" fill="none" stroke="#FFD13B" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="75" cy="18" r="8" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="36" cy="38" r="6" fill="#38BDF8" stroke="#0369A1" stroke-width="2.5"/>
      <circle cx="114" cy="38" r="6" fill="#38BDF8" stroke="#0369A1" stroke-width="2.5"/>
      <circle cx="75" cy="48" r="5" fill="#A855F7"/>
    </svg>`,
  },
  {
    id: 'flower_crown',
    name: 'Веночек',
    aspectRatio: 2.0,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 85">
      <path d="M16 62 Q85 26 154 62" fill="none" stroke="#15803D" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="48" cy="40" rx="10" ry="5" transform="rotate(-24 48 40)" fill="#22C55E"/>
      <ellipse cx="122" cy="40" rx="10" ry="5" transform="rotate(24 122 40)" fill="#22C55E"/>
      <circle cx="30" cy="54" r="14" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="30" cy="54" r="5" fill="#FFD13B"/>
      <circle cx="66" cy="38" r="15" fill="#38BDF8" stroke="#0369A1" stroke-width="3"/>
      <circle cx="66" cy="38" r="5" fill="#FFD13B"/>
      <circle cx="104" cy="38" r="15" fill="#A855F7" stroke="#6B21A8" stroke-width="3"/>
      <circle cx="104" cy="38" r="5" fill="#FFD13B"/>
      <circle cx="140" cy="54" r="14" fill="#FF3B5C" stroke="#9F1239" stroke-width="3"/>
      <circle cx="140" cy="54" r="5" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'headphones',
    name: 'Наушники',
    aspectRatio: 1.23,
    baseWidthRatio: 0.48,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 130">
      <path d="M26 78 C26 24, 134 24, 134 78" fill="none" stroke="#8B5CF6" stroke-width="12" stroke-linecap="round"/>
      <path d="M36 58 C46 28, 114 28, 124 58" fill="none" stroke="#C4B5FD" stroke-width="4" stroke-linecap="round"/>
      <rect x="12" y="64" width="26" height="48" rx="13" fill="#FF5CA8" stroke="#9D174D" stroke-width="4"/>
      <rect x="122" y="64" width="26" height="48" rx="13" fill="#FF5CA8" stroke="#9D174D" stroke-width="4"/>
      <rect x="30" y="72" width="10" height="32" rx="5" fill="#1E293B"/>
      <rect x="120" y="72" width="10" height="32" rx="5" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'bowtie',
    name: 'Галстук',
    aspectRatio: 1.67,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 90">
      <path d="M70 45 L14 14 L14 76 Z" fill="#2563EB" stroke="#1E3A8A" stroke-width="4" stroke-linejoin="round"/>
      <path d="M80 45 L136 14 L136 76 Z" fill="#2563EB" stroke="#1E3A8A" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="34" cy="36" r="5" fill="#FFD13B"/>
      <circle cx="34" cy="56" r="4.5" fill="#FFD13B"/>
      <circle cx="116" cy="36" r="5" fill="#FFD13B"/>
      <circle cx="116" cy="56" r="4.5" fill="#FFD13B"/>
      <rect x="64" y="30" width="22" height="30" rx="8" fill="#3B82F6" stroke="#1E3A8A" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'mustache',
    name: 'Усики',
    aspectRatio: 2.4,
    baseWidthRatio: 0.28,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 75">
      <path d="M90 38 C76 14, 46 16, 36 34 C28 46, 16 44, 12 34 C10 52, 28 64, 54 58 C72 54, 84 48, 90 42 C96 48, 108 54, 126 58 C152 64, 170 52, 168 34 C164 44, 152 46, 144 34 C134 16, 104 14, 90 38 Z" fill="#78350F" stroke="#451A03" stroke-width="4" stroke-linejoin="round"/>
      <path d="M52 32 Q66 26 78 34 M102 34 Q114 26 128 32" fill="none" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'necklace',
    name: 'Бусы',
    aspectRatio: 1.68,
    baseWidthRatio: 0.36,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 95">
      <path d="M18 18 Q80 86 142 18" fill="none" stroke="#F59E0B" stroke-width="4"/>
      <circle cx="24" cy="24" r="9" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
      <circle cx="38" cy="40" r="9.5" fill="#FFD13B" stroke="#D97706" stroke-width="2.5"/>
      <circle cx="56" cy="52" r="10" fill="#10C97A" stroke="#065F46" stroke-width="2.5"/>
      <circle cx="104" cy="52" r="10" fill="#38BDF8" stroke="#0369A1" stroke-width="2.5"/>
      <circle cx="122" cy="40" r="9.5" fill="#A855F7" stroke="#6B21A8" stroke-width="2.5"/>
      <circle cx="136" cy="24" r="9" fill="#FF5CA8" stroke="#BE185D" stroke-width="2.5"/>
      <path d="M80 84 C80 84 62 72 62 59 C62 51 69 47 75 49 C78 50 79 52 80 54 C81 52 82 50 85 49 C91 47 98 51 98 59 C98 72 80 84 80 84 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="3" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'scarf',
    name: 'Шарфик',
    aspectRatio: 1.36,
    baseWidthRatio: 0.42,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 110">
      <path d="M38 42 L26 98 L58 102 L66 44 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <line x1="33" y1="68" x2="62" y2="72" stroke="#FFD13B" stroke-width="8"/>
      <line x1="29" y1="86" x2="59" y2="90" stroke="#FF5CA8" stroke-width="8"/>
      <rect x="16" y="16" width="118" height="36" rx="18" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <line x1="48" y1="18" x2="48" y2="50" stroke="#FFD13B" stroke-width="8"/>
      <line x1="78" y1="18" x2="78" y2="50" stroke="#FF5CA8" stroke-width="8"/>
      <line x1="108" y1="18" x2="108" y2="50" stroke="#FFD13B" stroke-width="8"/>
    </svg>`,
  },
  {
    id: 'rainbow',
    name: 'Радуга',
    aspectRatio: 1.6,
    baseWidthRatio: 0.30,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">
      <path d="M22 80 A58 58 0 0 1 138 80" fill="none" stroke="#FF3B5C" stroke-width="11" stroke-linecap="round"/>
      <path d="M33 80 A47 47 0 0 1 127 80" fill="none" stroke="#FF9F1C" stroke-width="11" stroke-linecap="round"/>
      <path d="M44 80 A36 36 0 0 1 116 80" fill="none" stroke="#FFD13B" stroke-width="11" stroke-linecap="round"/>
      <path d="M55 80 A25 25 0 0 1 105 80" fill="none" stroke="#10C97A" stroke-width="10" stroke-linecap="round"/>
      <path d="M65 80 A15 15 0 0 1 95 80" fill="none" stroke="#38BDF8" stroke-width="9" stroke-linecap="round"/>
      <circle cx="24" cy="82" r="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      <circle cx="38" cy="79" r="11" fill="#FFFFFF"/>
      <circle cx="136" cy="82" r="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
      <circle cx="122" cy="79" r="11" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'butterfly_sticker',
    name: 'Бабочка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 100">
      <path d="M60 48 C35 12, 6 20, 12 48 C16 64, 42 64, 60 56 Z" fill="#A855F7" stroke="#6B21A8" stroke-width="4"/>
      <path d="M65 48 C90 12, 119 20, 113 48 C109 64, 83 64, 65 56 Z" fill="#A855F7" stroke="#6B21A8" stroke-width="4"/>
      <path d="M60 56 C38 62, 18 76, 28 88 C38 98, 56 80, 60 66 Z" fill="#FF5CA8" stroke="#9D174D" stroke-width="4"/>
      <path d="M65 56 C87 62, 107 76, 97 88 C87 98, 69 80, 65 66 Z" fill="#FF5CA8" stroke="#9D174D" stroke-width="4"/>
      <circle cx="33" cy="40" r="7" fill="#FFD13B"/>
      <circle cx="92" cy="40" r="7" fill="#FFD13B"/>
      <rect x="58" y="34" width="9" height="44" rx="4.5" fill="#4C1D95"/>
      <path d="M60 36 Q48 16 40 20 M65 36 Q77 16 85 20" fill="none" stroke="#4C1D95" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'cat_whiskers',
    name: 'Котик',
    aspectRatio: 2.1,
    baseWidthRatio: 0.36,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 100">
      <path d="M90 42 Q105 32 120 42 Q118 62 105 64 Q92 62 90 42 Z" fill="#FF5CA8" stroke="#9D174D" stroke-width="4"/>
      <ellipse cx="101" cy="45" rx="4" ry="2.5" fill="#FFF" opacity="0.7"/>
      <path d="M72 46 L14 34 M70 54 L10 56 M74 62 L20 76" stroke="#292524" stroke-width="5" stroke-linecap="round"/>
      <path d="M138 46 L196 34 M140 54 L200 56 M136 62 L190 76" stroke="#292524" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bunny_ears',
    name: 'Ушки',
    aspectRatio: 1.5,
    baseWidthRatio: 0.38,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
      <ellipse cx="44" cy="52" rx="18" ry="42" transform="rotate(-14 44 52)" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
      <ellipse cx="44" cy="54" rx="9" ry="28" transform="rotate(-14 44 54)" fill="#FDA4AF"/>
      <ellipse cx="106" cy="52" rx="18" ry="42" transform="rotate(14 106 52)" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
      <ellipse cx="106" cy="54" rx="9" ry="28" transform="rotate(14 106 54)" fill="#FDA4AF"/>
    </svg>`,
  },
  {
    id: 'bow',
    name: 'Бантик',
    aspectRatio: 1.5,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
      <path d="M70 50 L18 18 C8 38 8 62 18 82 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4" stroke-linejoin="round"/>
      <path d="M80 50 L132 18 C142 38 142 62 132 82 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="34" cy="44" r="5" fill="#FFF" opacity="0.75"/>
      <circle cx="116" cy="44" r="5" fill="#FFF" opacity="0.75"/>
      <circle cx="75" cy="50" r="15" fill="#FB7185" stroke="#9F1239" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'star_sticker',
    name: 'Звёздочка',
    aspectRatio: 1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M50 8 L62 35 L92 38 L69 58 L76 88 L50 72 L24 88 L31 58 L8 38 L38 35 Z" fill="#FFD13B" stroke="#D97706" stroke-width="4.5" stroke-linejoin="round"/>
      <circle cx="42" cy="46" r="4" fill="#78350F"/>
      <circle cx="58" cy="46" r="4" fill="#78350F"/>
      <path d="M43 56 Q50 63 57 56" fill="none" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'heart_sticker',
    name: 'Сердечко',
    aspectRatio: 1.1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100">
      <path d="M55 88 C55 88 12 62 12 34 C12 18 25 8 39 8 C47 8 52 13 55 19 C58 13 63 8 71 8 C85 8 98 18 98 34 C98 62 55 88 55 88 Z" fill="#FF3B5C" stroke="#BE123C" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M27 25 Q32 18 40 19" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    </svg>`,
  },
  {
    id: 'flower_sticker',
    name: 'Цветок',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="22" r="16" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5"/>
      <circle cx="77" cy="41" r="16" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5"/>
      <circle cx="67" cy="72" r="16" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5"/>
      <circle cx="33" cy="72" r="16" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5"/>
      <circle cx="23" cy="41" r="16" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5"/>
      <circle cx="50" cy="50" r="17" fill="#FFD13B" stroke="#D97706" stroke-width="3.5"/>
      <circle cx="44" cy="47" r="2.8" fill="#78350F"/>
      <circle cx="56" cy="47" r="2.8" fill="#78350F"/>
      <path d="M45 55 Q50 60 55 55" fill="none" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'sun',
    name: 'Солнышко',
    aspectRatio: 1,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <g stroke="#F59E0B" stroke-width="6" stroke-linecap="round">
        <line x1="50" y1="6" x2="50" y2="18"/>
        <line x1="50" y1="82" x2="50" y2="94"/>
        <line x1="6" y1="50" x2="18" y2="50"/>
        <line x1="82" y1="50" x2="94" y2="50"/>
        <line x1="19" y1="19" x2="27" y2="27"/>
        <line x1="73" y1="73" x2="81" y2="81"/>
        <line x1="81" y1="19" x2="73" y2="27"/>
        <line x1="27" y1="73" x2="19" y2="81"/>
      </g>
      <circle cx="50" cy="50" r="25" fill="#FFD13B" stroke="#D97706" stroke-width="4"/>
      <circle cx="42" cy="47" r="3" fill="#78350F"/>
      <circle cx="58" cy="47" r="3" fill="#78350F"/>
      <path d="M43 56 Q50 62 57 56" fill="none" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'unicorn_horn',
    name: 'Волшебство',
    aspectRatio: 0.7,
    baseWidthRatio: 0.16,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100">
      <path d="M35 6 L56 90 Q35 96 14 90 Z" fill="#FDE047" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <path d="M26 36 L47 46 M21 56 L51 68 M17 75 L54 86" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
      <circle cx="14" cy="22" r="5" fill="#38BDF8"/>
      <circle cx="56" cy="28" r="4" fill="#FF5CA8"/>
    </svg>`,
  },
  {
    id: 'rocket',
    name: 'Ракета',
    aspectRatio: 0.85,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <path d="M42.5 8 C58 26 62 50 56 72 L29 72 C23 50 27 26 42.5 8 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="4" stroke-linejoin="round"/>
      <path d="M42.5 8 C50 18 54 27 56 32 L29 32 C31 27 35 18 42.5 8 Z" fill="#FF3B5C"/>
      <path d="M27 52 L11 69 L28 70 Z" fill="#FF7A1A" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M58 52 L74 69 L57 70 Z" fill="#FF7A1A" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="42.5" cy="48" r="10" fill="#38BDF8" stroke="#1E293B" stroke-width="3.5"/>
      <path d="M34 74 L42.5 94 L51 74 Z" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'dino',
    name: 'Динозаврик',
    aspectRatio: 1.05,
    baseWidthRatio: 0.25,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <path d="M22 72 C14 72 10 60 22 52 C28 48 34 48 38 42 C40 24 52 14 68 16 C84 18 90 30 86 42 C82 52 72 52 68 56 C70 68 74 78 66 84 L54 84 L54 74 L42 74 L42 84 L28 84 C24 84 22 78 22 72 Z" fill="#10C97A" stroke="#065F46" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="72" cy="28" r="4" fill="#1E293B"/>
      <circle cx="73.5" cy="26.5" r="1.3" fill="#FFF"/>
      <path d="M40 28 L33 22 L43 22 Z M36 38 L27 34 L37 32 Z M52 18 L48 9 L58 14 Z" fill="#FFD13B" stroke="#D97706" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="52" cy="56" r="5" fill="#A7F3D0"/>
      <circle cx="62" cy="64" r="4" fill="#A7F3D0"/>
    </svg>`,
  },
  {
    id: 'car',
    name: 'Машинка',
    aspectRatio: 1.45,
    baseWidthRatio: 0.28,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 100">
      <path d="M20 66 L26 44 L48 26 L98 26 L118 46 L132 54 L132 72 L16 72 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <path d="M52 32 L92 32 L106 46 L38 46 Z" fill="#E0F2FE" stroke="#0369A1" stroke-width="3"/>
      <circle cx="42" cy="74" r="14" fill="#334155" stroke="#0F172A" stroke-width="4"/>
      <circle cx="42" cy="74" r="6" fill="#E2E8F0"/>
      <circle cx="106" cy="74" r="14" fill="#334155" stroke="#0F172A" stroke-width="4"/>
      <circle cx="106" cy="74" r="6" fill="#E2E8F0"/>
      <circle cx="127" cy="59" r="5" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'icecream',
    name: 'Мороженое',
    aspectRatio: 0.72,
    baseWidthRatio: 0.19,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 100">
      <path d="M22 50 L36 92 L50 50 Z" fill="#FBBF24" stroke="#B45309" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="26" cy="40" r="14" fill="#FF5CA8" stroke="#BE185D" stroke-width="3"/>
      <circle cx="46" cy="40" r="14" fill="#38BDF8" stroke="#0369A1" stroke-width="3"/>
      <circle cx="36" cy="24" r="15" fill="#FFFBEB" stroke="#D97706" stroke-width="3"/>
      <circle cx="36" cy="11" r="5" fill="#FF3B5C"/>
    </svg>`,
  },
  {
    id: 'bear',
    name: 'Мишка',
    aspectRatio: 1.05,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <circle cx="26" cy="26" r="14" fill="#C27D48" stroke="#78350F" stroke-width="4"/>
      <circle cx="26" cy="26" r="7" fill="#FDE68A"/>
      <circle cx="79" cy="26" r="14" fill="#C27D48" stroke="#78350F" stroke-width="4"/>
      <circle cx="79" cy="26" r="7" fill="#FDE68A"/>
      <circle cx="52.5" cy="54" r="34" fill="#D9945E" stroke="#78350F" stroke-width="4"/>
      <ellipse cx="52.5" cy="64" rx="15" ry="12" fill="#FEF3C7"/>
      <ellipse cx="52.5" cy="59" rx="6" ry="4.5" fill="#451A03"/>
      <circle cx="39" cy="47" r="4" fill="#451A03"/>
      <circle cx="66" cy="47" r="4" fill="#451A03"/>
      <path d="M46 68 Q52.5 73 59 68" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'kitty',
    name: 'Кошечка',
    aspectRatio: 1.05,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <path d="M22 44 L18 14 L44 28 Z" fill="#FFFBEB" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <path d="M83 44 L87 14 L61 28 Z" fill="#FFFBEB" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 38 L22 21 L38 30 Z" fill="#FDA4AF"/>
      <path d="M81 38 L83 21 L67 30 Z" fill="#FDA4AF"/>
      <ellipse cx="52.5" cy="58" rx="34" ry="29" fill="#FFFBEB" stroke="#D97706" stroke-width="4"/>
      <circle cx="39" cy="54" r="4" fill="#1E293B"/>
      <circle cx="66" cy="54" r="4" fill="#1E293B"/>
      <polygon points="48,62 57,62 52.5,67" fill="#FF5CA8"/>
      <path d="M12 58 L28 60 M12 66 L28 65 M93 58 L77 60 M93 66 L77 65" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'puppy',
    name: 'Щенуля',
    aspectRatio: 1.1,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100">
      <ellipse cx="22" cy="54" rx="13" ry="24" transform="rotate(14 22 54)" fill="#92400E" stroke="#451A03" stroke-width="3.5"/>
      <ellipse cx="88" cy="54" rx="13" ry="24" transform="rotate(-14 88 54)" fill="#92400E" stroke="#451A03" stroke-width="3.5"/>
      <circle cx="55" cy="52" r="31" fill="#F59E0B" stroke="#78350F" stroke-width="4"/>
      <circle cx="42" cy="46" r="10" fill="#92400E" opacity="0.45"/>
      <circle cx="42" cy="47" r="4" fill="#1E293B"/>
      <circle cx="68" cy="47" r="4" fill="#1E293B"/>
      <ellipse cx="55" cy="58" rx="7" ry="5" fill="#1E293B"/>
      <path d="M47 67 Q55 74 63 67" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="55" cy="73" rx="5" ry="6" fill="#FB7185"/>
    </svg>`,
  },
  {
    id: 'ladybug',
    name: 'Жучок',
    aspectRatio: 1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M22 36 L10 26 M20 54 L6 54 M22 72 L10 82 M78 36 L90 26 M80 54 L94 54 M78 72 L90 82" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="50" cy="26" r="14" fill="#1E293B"/>
      <circle cx="50" cy="56" r="30" fill="#FF3B5C" stroke="#1E293B" stroke-width="4"/>
      <line x1="50" y1="28" x2="50" y2="86" stroke="#1E293B" stroke-width="4"/>
      <circle cx="36" cy="46" r="5" fill="#1E293B"/>
      <circle cx="64" cy="46" r="5" fill="#1E293B"/>
      <circle cx="34" cy="66" r="6" fill="#1E293B"/>
      <circle cx="66" cy="66" r="6" fill="#1E293B"/>
      <circle cx="44" cy="22" r="2.5" fill="#FFF"/>
      <circle cx="56" cy="22" r="2.5" fill="#FFF"/>
    </svg>`,
  },
  {
    id: 'bee',
    name: 'Пчёлка',
    aspectRatio: 1.1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100">
      <ellipse cx="38" cy="28" rx="16" ry="20" transform="rotate(-20 38 28)" fill="#E0F2FE" stroke="#38BDF8" stroke-width="3.5"/>
      <ellipse cx="72" cy="28" rx="16" ry="20" transform="rotate(20 72 28)" fill="#E0F2FE" stroke="#38BDF8" stroke-width="3.5"/>
      <ellipse cx="55" cy="60" rx="34" ry="24" fill="#FFD13B" stroke="#78350F" stroke-width="4"/>
      <path d="M42 38 L42 82 M57 36 L57 84 M72 41 L72 79" stroke="#1E293B" stroke-width="7"/>
      <circle cx="30" cy="56" r="3.5" fill="#1E293B"/>
      <path d="M24 65 Q28 69 33 66" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'fish',
    name: 'Рыбка',
    aspectRatio: 1.3,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 100">
      <path d="M92 50 L122 24 L116 50 L122 76 Z" fill="#FF7A1A" stroke="#9A3412" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="56" cy="50" rx="42" ry="28" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <path d="M44 24 Q58 50 44 76" fill="none" stroke="#FFD13B" stroke-width="7" stroke-linecap="round"/>
      <circle cx="30" cy="44" r="5" fill="#FFF"/>
      <circle cx="29" cy="44" r="2.5" fill="#0F172A"/>
      <path d="M22 57 Q28 62 34 58" fill="none" stroke="#0369A1" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'whale',
    name: 'Китёнок',
    aspectRatio: 1.3,
    baseWidthRatio: 0.25,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 100">
      <path d="M48 22 Q42 8 32 14 M52 22 Q58 8 68 14" fill="none" stroke="#38BDF8" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M16 58 C16 32, 82 28, 92 56 C96 64, 108 62, 114 48 C118 58, 124 66, 110 74 C98 80, 32 86, 16 58 Z" fill="#60A5FA" stroke="#1D4ED8" stroke-width="4" stroke-linejoin="round"/>
      <path d="M22 65 Q52 78 82 68 L76 78 Q46 84 22 65 Z" fill="#DBEAFE"/>
      <circle cx="36" cy="52" r="4" fill="#0F172A"/>
      <path d="M24 60 Q30 65 36 61" fill="none" stroke="#1D4ED8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'planet',
    name: 'Планета',
    aspectRatio: 1.4,
    baseWidthRatio: 0.26,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <circle cx="70" cy="50" r="30" fill="#A855F7" stroke="#581C87" stroke-width="4"/>
      <ellipse cx="70" cy="52" rx="60" ry="15" transform="rotate(-18 70 52)" fill="none" stroke="#FFD13B" stroke-width="8"/>
      <circle cx="58" cy="40" r="5" fill="#DDD6FE" opacity="0.6"/>
      <circle cx="82" cy="60" r="4" fill="#DDD6FE" opacity="0.6"/>
    </svg>`,
  },
  {
    id: 'moon_sticker',
    name: 'Месяц',
    aspectRatio: 1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M62 12 C34 14 14 38 18 65 C22 86 48 94 74 82 C48 80 38 56 44 36 C48 24 54 17 62 12 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="76" cy="30" r="5" fill="#FDE047"/>
      <circle cx="84" cy="52" r="3.5" fill="#FDE047"/>
    </svg>`,
  },
  {
    id: 'cloud_sticker',
    name: 'Облачко',
    aspectRatio: 1.4,
    baseWidthRatio: 0.25,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <path d="M34 78 L108 78 C122 78 130 68 128 55 C126 44 115 38 106 40 C102 22 84 14 68 20 C56 24 50 32 48 38 C32 36 18 46 18 60 C18 71 25 78 34 78 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="58" cy="54" r="3.5" fill="#334155"/>
      <circle cx="84" cy="54" r="3.5" fill="#334155"/>
      <path d="M64 62 Q71 68 78 62" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'strawberry',
    name: 'Клубничка',
    aspectRatio: 0.9,
    baseWidthRatio: 0.19,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
      <path d="M45 90 C22 76 12 46 20 30 C28 18 62 18 70 30 C78 46 68 76 45 90 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <path d="M26 24 Q36 10 45 20 Q54 10 64 24 Q52 30 45 26 Q38 30 26 24 Z" fill="#10C97A" stroke="#065F46" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="34" cy="44" r="2.5" fill="#FEF08A"/>
      <circle cx="54" cy="44" r="2.5" fill="#FEF08A"/>
      <circle cx="45" cy="56" r="2.5" fill="#FEF08A"/>
      <circle cx="37" cy="68" r="2.5" fill="#FEF08A"/>
      <circle cx="53" cy="68" r="2.5" fill="#FEF08A"/>
    </svg>`,
  },
  {
    id: 'watermelon',
    name: 'Арбузик',
    aspectRatio: 1.4,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <path d="M14 34 A58 58 0 0 0 126 34 Z" fill="#10C97A" stroke="#065F46" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 34 A48 48 0 0 0 116 34 Z" fill="#FF3B5C"/>
      <circle cx="48" cy="48" r="3" fill="#1E293B"/>
      <circle cx="70" cy="58" r="3" fill="#1E293B"/>
      <circle cx="92" cy="48" r="3" fill="#1E293B"/>
      <circle cx="60" cy="42" r="2.5" fill="#1E293B"/>
      <circle cx="80" cy="42" r="2.5" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'cupcake',
    name: 'Кексик',
    aspectRatio: 0.85,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <path d="M20 54 L65 54 L58 88 L27 88 Z" fill="#FBBF24" stroke="#B45309" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 54 C12 36 28 24 42.5 22 C58 24 73 36 69 54 Z" fill="#FF5CA8" stroke="#9D174D" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="42.5" cy="15" r="7" fill="#FF3B5C" stroke="#9F1239" stroke-width="3"/>
      <circle cx="30" cy="40" r="3" fill="#FEF08A"/>
      <circle cx="52" cy="36" r="3" fill="#38BDF8"/>
      <circle cx="42" cy="46" r="3" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'balloon',
    name: 'Шарик',
    aspectRatio: 0.75,
    baseWidthRatio: 0.18,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 100">
      <path d="M37.5 64 Q44 76 34 86 Q28 92 38 96" fill="none" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="37.5" cy="36" rx="26" ry="30" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <polygon points="33,64 42,64 37.5,70" fill="#38BDF8" stroke="#0369A1" stroke-width="2.5"/>
      <ellipse cx="27" cy="24" rx="5" ry="9" transform="rotate(-22 27 24)" fill="#FFF" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'music_note',
    name: 'Нотка',
    aspectRatio: 0.9,
    baseWidthRatio: 0.18,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
      <path d="M34 72 L34 24 L74 14 L74 62" fill="none" stroke="#8B5CF6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="34" y1="36" x2="74" y2="26" stroke="#8B5CF6" stroke-width="8"/>
      <ellipse cx="25" cy="74" rx="13" ry="10" transform="rotate(-18 25 74)" fill="#A855F7" stroke="#581C87" stroke-width="3"/>
      <ellipse cx="65" cy="64" rx="13" ry="10" transform="rotate(-18 65 64)" fill="#A855F7" stroke="#581C87" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'magic_wand',
    name: 'Палочка',
    aspectRatio: 1,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <line x1="16" y1="84" x2="62" y2="38" stroke="#A855F7" stroke-width="9" stroke-linecap="round"/>
      <path d="M68 10 L74 26 L91 28 L78 39 L82 56 L68 47 L54 56 L58 39 L45 28 L62 26 Z" fill="#FFD13B" stroke="#D97706" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="34" cy="24" r="4" fill="#38BDF8"/>
      <circle cx="84" cy="70" r="4.5" fill="#FF5CA8"/>
    </svg>`,
  },
  {
    id: 'owl_sticker',
    name: 'Совушка',
    aspectRatio: 1,
    baseWidthRatio: 0.23,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="56" rx="34" ry="34" fill="#8B5CF6" stroke="#5B21B6" stroke-width="4"/>
      <path d="M22 30 L18 14 L36 24 Z M78 30 L82 14 L64 24 Z" fill="#7C3AED" stroke="#5B21B6" stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="50" cy="68" rx="20" ry="18" fill="#EDE9FE"/>
      <circle cx="37" cy="44" r="13" fill="#FFFFFF" stroke="#5B21B6" stroke-width="3"/>
      <circle cx="63" cy="44" r="13" fill="#FFFFFF" stroke="#5B21B6" stroke-width="3"/>
      <circle cx="38" cy="44" r="6" fill="#1E293B"/>
      <circle cx="62" cy="44" r="6" fill="#1E293B"/>
      <circle cx="40" cy="42" r="2" fill="#FFFFFF"/>
      <circle cx="64" cy="42" r="2" fill="#FFFFFF"/>
      <polygon points="44,52 56,52 50,61" fill="#FF9F1C" stroke="#B45309" stroke-width="2" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'frog_sticker',
    name: 'Лягушка',
    aspectRatio: 1.15,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 115 100">
      <circle cx="35" cy="28" r="16" fill="#22C55E" stroke="#15803D" stroke-width="4"/>
      <circle cx="80" cy="28" r="16" fill="#22C55E" stroke="#15803D" stroke-width="4"/>
      <ellipse cx="57.5" cy="58" rx="40" ry="29" fill="#4ADE80" stroke="#15803D" stroke-width="4"/>
      <circle cx="35" cy="28" r="9" fill="#FFFFFF"/>
      <circle cx="80" cy="28" r="9" fill="#FFFFFF"/>
      <circle cx="36" cy="28" r="4.5" fill="#0F172A"/>
      <circle cx="79" cy="28" r="4.5" fill="#0F172A"/>
      <circle cx="28" cy="58" r="6" fill="#FDA4AF"/>
      <circle cx="87" cy="58" r="6" fill="#FDA4AF"/>
      <path d="M36 62 Q57.5 76 79 62" fill="none" stroke="#14532D" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'lion_sticker',
    name: 'Львёнок',
    aspectRatio: 1,
    baseWidthRatio: 0.25,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#FF7A1A" stroke="#C2410C" stroke-width="4" stroke-dasharray="14 6"/>
      <circle cx="50" cy="50" r="34" fill="#F97316"/>
      <circle cx="29" cy="27" r="9" fill="#FBBF24" stroke="#B45309" stroke-width="3"/>
      <circle cx="71" cy="27" r="9" fill="#FBBF24" stroke="#B45309" stroke-width="3"/>
      <circle cx="50" cy="53" r="25" fill="#FDE047" stroke="#B45309" stroke-width="3"/>
      <circle cx="41" cy="48" r="3.5" fill="#1E293B"/>
      <circle cx="59" cy="48" r="3.5" fill="#1E293B"/>
      <polygon points="45,56 55,56 50,62" fill="#9A3412"/>
      <path d="M43 65 Q50 70 57 65" fill="none" stroke="#9A3412" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'octopus',
    name: 'Осьминог',
    aspectRatio: 1.05,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <path d="M24 62 Q12 78 24 88 M38 66 Q32 86 42 90 M52.5 68 Q52.5 88 54 90 M67 66 Q73 86 63 90 M81 62 Q93 78 81 88" fill="none" stroke="#EC4899" stroke-width="10" stroke-linecap="round"/>
      <circle cx="52.5" cy="44" r="30" fill="#FF5CA8" stroke="#BE185D" stroke-width="4"/>
      <circle cx="42" cy="44" r="4.5" fill="#0F172A"/>
      <circle cx="63" cy="44" r="4.5" fill="#0F172A"/>
      <circle cx="43.5" cy="42.5" r="1.5" fill="#FFF"/>
      <circle cx="64.5" cy="42.5" r="1.5" fill="#FFF"/>
      <path d="M46 53 Q52.5 59 59 53" fill="none" stroke="#831843" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'penguin',
    name: 'Пингвин',
    aspectRatio: 0.9,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
      <ellipse cx="45" cy="54" rx="31" ry="37" fill="#1E293B" stroke="#0F172A" stroke-width="4"/>
      <ellipse cx="45" cy="60" rx="21" ry="27" fill="#FFFFFF"/>
      <circle cx="35" cy="40" r="4" fill="#FFFFFF"/>
      <circle cx="55" cy="40" r="4" fill="#FFFFFF"/>
      <circle cx="35" cy="40" r="2" fill="#0F172A"/>
      <circle cx="55" cy="40" r="2" fill="#0F172A"/>
      <polygon points="39,46 51,46 45,54" fill="#FF9F1C"/>
      <ellipse cx="32" cy="89" rx="10" ry="5" fill="#FF9F1C"/>
      <ellipse cx="58" cy="89" rx="10" ry="5" fill="#FF9F1C"/>
    </svg>`,
  },
  {
    id: 'turtle',
    name: 'Черепашка',
    aspectRatio: 1.3,
    baseWidthRatio: 0.25,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 100">
      <circle cx="104" cy="54" r="14" fill="#4ADE80" stroke="#15803D" stroke-width="3.5"/>
      <circle cx="109" cy="50" r="2.8" fill="#0F172A"/>
      <ellipse cx="34" cy="76" rx="9" ry="7" fill="#4ADE80" stroke="#15803D" stroke-width="3"/>
      <ellipse cx="78" cy="76" rx="9" ry="7" fill="#4ADE80" stroke="#15803D" stroke-width="3"/>
      <path d="M18 68 C18 32, 92 32, 92 68 Z" fill="#10B981" stroke="#065F46" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="42" cy="50" r="8" fill="#A7F3D0"/>
      <circle cx="64" cy="48" r="9" fill="#A7F3D0"/>
      <line x1="14" y1="68" x2="96" y2="68" stroke="#065F46" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'duckling',
    name: 'Утёнок',
    aspectRatio: 1.05,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <ellipse cx="50" cy="64" rx="30" ry="22" fill="#FFD13B" stroke="#D97706" stroke-width="4"/>
      <circle cx="62" cy="36" r="21" fill="#FFD13B" stroke="#D97706" stroke-width="4"/>
      <path d="M80 34 L96 38 L80 44 Z" fill="#FF7A1A" stroke="#C2410C" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="67" cy="32" r="3.5" fill="#1E293B"/>
      <path d="M36 62 Q50 54 58 66 Q44 74 36 62 Z" fill="#FDE047" stroke="#D97706" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'ufo',
    name: 'НЛО',
    aspectRatio: 1.4,
    baseWidthRatio: 0.27,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <path d="M48 48 C48 22, 92 22, 92 48 Z" fill="#BAE6FD" stroke="#0284C7" stroke-width="4"/>
      <ellipse cx="70" cy="54" rx="54" ry="18" fill="#8B5CF6" stroke="#4C1D95" stroke-width="4"/>
      <circle cx="34" cy="54" r="5" fill="#FFD13B"/>
      <circle cx="58" cy="59" r="5" fill="#10C97A"/>
      <circle cx="82" cy="59" r="5" fill="#FF5CA8"/>
      <circle cx="106" cy="54" r="5" fill="#FFD13B"/>
      <path d="M50 72 L38 92 L102 92 L90 72 Z" fill="#FDE047" opacity="0.45"/>
    </svg>`,
  },
  {
    id: 'donut',
    name: 'Пончик',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="#FBBF24" stroke="#B45309" stroke-width="4"/>
      <path d="M16 46 C18 24, 34 14, 50 14 C68 14, 84 26, 84 46 C76 54, 68 44, 60 52 C52 58, 44 46, 36 52 C28 58, 22 50, 16 46 Z" fill="#FF5CA8"/>
      <circle cx="50" cy="50" r="13" fill="#FAF8F4" stroke="#B45309" stroke-width="3.5"/>
      <line x1="34" y1="28" x2="40" y2="33" stroke="#FEF08A" stroke-width="4" stroke-linecap="round"/>
      <line x1="60" y1="24" x2="66" y2="30" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
      <line x1="48" y1="22" x2="50" y2="29" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'lollipop',
    name: 'Леденец',
    aspectRatio: 0.72,
    baseWidthRatio: 0.17,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 100">
      <line x1="36" y1="58" x2="36" y2="94" stroke="#E2E8F0" stroke-width="7" stroke-linecap="round"/>
      <circle cx="36" cy="34" r="26" fill="#FF3B5C" stroke="#BE123C" stroke-width="4"/>
      <path d="M36 34 C42 34 42 26 35 25 C26 24 23 34 27 41 C32 49 46 49 50 38 C54 25 44 15 30 16" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'cherry',
    name: 'Вишенки',
    aspectRatio: 1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M32 60 Q44 26 56 16 Q64 34 68 60" fill="none" stroke="#15803D" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M56 16 Q76 12 80 28 Q64 32 56 16 Z" fill="#22C55E" stroke="#15803D" stroke-width="3"/>
      <circle cx="30" cy="68" r="18" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <circle cx="70" cy="68" r="18" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <circle cx="24" cy="61" r="4" fill="#FFFFFF" opacity="0.75"/>
      <circle cx="64" cy="61" r="4" fill="#FFFFFF" opacity="0.75"/>
    </svg>`,
  },
  {
    id: 'apple_sticker',
    name: 'Яблочко',
    aspectRatio: 0.95,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95 100">
      <path d="M47 22 Q48 10 56 8" fill="none" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 18 Q68 8 72 22 Q58 28 50 18 Z" fill="#22C55E" stroke="#15803D" stroke-width="3"/>
      <path d="M47.5 28 C28 20, 12 36, 16 60 C20 82, 34 90, 47.5 85 C61 90, 75 82, 79 60 C83 36, 67 20, 47.5 28 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <path d="M27 38 Q30 30 37 30" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" opacity="0.75"/>
    </svg>`,
  },
  {
    id: 'sailboat',
    name: 'Кораблик',
    aspectRatio: 1.05,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <line x1="52" y1="12" x2="52" y2="66" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>
      <path d="M54 14 L86 58 L54 58 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M48 24 L22 58 L48 58 Z" fill="#FFD13B" stroke="#D97706" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M14 66 L91 66 L78 86 L27 86 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'train',
    name: 'Паровозик',
    aspectRatio: 1.35,
    baseWidthRatio: 0.28,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135 100">
      <circle cx="106" cy="18" r="8" fill="#E2E8F0"/>
      <circle cx="118" cy="10" r="6" fill="#E2E8F0"/>
      <rect x="92" y="24" width="16" height="20" rx="3" fill="#475569" stroke="#1E293B" stroke-width="3"/>
      <rect x="20" y="24" width="40" height="44" rx="6" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <rect x="60" y="38" width="54" height="30" rx="6" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <rect x="28" y="32" width="24" height="16" rx="3" fill="#FEF08A"/>
      <circle cx="36" cy="76" r="12" fill="#334155" stroke="#0F172A" stroke-width="4"/>
      <circle cx="72" cy="76" r="11" fill="#334155" stroke="#0F172A" stroke-width="4"/>
      <circle cx="102" cy="76" r="11" fill="#334155" stroke="#0F172A" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'castle',
    name: 'Замок',
    aspectRatio: 1,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="16" y="42" width="20" height="48" fill="#FDE68A" stroke="#B45309" stroke-width="3.5"/>
      <rect x="64" y="42" width="20" height="48" fill="#FDE68A" stroke="#B45309" stroke-width="3.5"/>
      <rect x="34" y="48" width="32" height="42" fill="#FEF3C7" stroke="#B45309" stroke-width="3.5"/>
      <polygon points="12,42 26,18 40,42" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5" stroke-linejoin="round"/>
      <polygon points="60,42 74,18 88,42" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5" stroke-linejoin="round"/>
      <polygon points="36,48 50,12 64,48" fill="#8B5CF6" stroke="#5B21B6" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M41 90 L41 68 A9 9 0 0 1 59 68 L59 90 Z" fill="#92400E"/>
    </svg>`,
  },
  {
    id: 'gift',
    name: 'Подарок',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="16" y="38" width="68" height="50" rx="6" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <rect x="12" y="28" width="76" height="16" rx="5" fill="#60A5FA" stroke="#0369A1" stroke-width="4"/>
      <rect x="44" y="28" width="12" height="60" fill="#FF3B5C"/>
      <path d="M50 28 C34 10, 20 18, 28 28 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="3"/>
      <path d="M50 28 C66 10, 80 18, 72 28 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'butterfly_blue',
    name: 'Морфо',
    aspectRatio: 1.25,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 100">
      <path d="M60 48 C35 12, 6 20, 12 48 C16 64, 42 64, 60 56 Z" fill="#06B6D4" stroke="#0E7490" stroke-width="4"/>
      <path d="M65 48 C90 12, 119 20, 113 48 C109 64, 83 64, 65 56 Z" fill="#06B6D4" stroke="#0E7490" stroke-width="4"/>
      <path d="M60 56 C38 62, 18 76, 28 88 C38 98, 56 80, 60 66 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <path d="M65 56 C87 62, 107 76, 97 88 C87 98, 69 80, 65 66 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <circle cx="33" cy="40" r="7" fill="#FFFFFF" opacity="0.8"/>
      <circle cx="92" cy="40" r="7" fill="#FFFFFF" opacity="0.8"/>
      <rect x="58" y="34" width="9" height="44" rx="4.5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'unicorn_face',
    name: 'Единорог',
    aspectRatio: 1,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="43,32 50,6 57,32" fill="#FFD13B" stroke="#D97706" stroke-width="3" stroke-linejoin="round"/>
      <path d="M26 42 L20 20 L38 34 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" stroke-linejoin="round"/>
      <path d="M74 42 L80 20 L62 34 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="58" r="28" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
      <path d="M32 34 Q46 24 62 34 Q54 44 38 40 Z" fill="#FF5CA8"/>
      <circle cx="40" cy="56" r="3.5" fill="#1E293B"/>
      <circle cx="60" cy="56" r="3.5" fill="#1E293B"/>
      <ellipse cx="50" cy="72" rx="18" ry="11" fill="#FBCFE8"/>
      <circle cx="43" cy="70" r="2" fill="#BE185D"/>
      <circle cx="57" cy="70" r="2" fill="#BE185D"/>
    </svg>`,
  },
  {
    id: 'hat_crown_flower',
    name: 'Венок-корона',
    aspectRatio: 1.5,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
      <path d="M16 78 L12 36 L44 54 L75 20 L106 54 L138 36 L134 78 Z" fill="#FDE047" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="42" cy="72" r="11" fill="#FF5CA8" stroke="#BE185D" stroke-width="2.5"/><circle cx="42" cy="72" r="4" fill="#FFD13B"/>
      <circle cx="75" cy="70" r="12" fill="#38BDF8" stroke="#0369A1" stroke-width="2.5"/><circle cx="75" cy="70" r="4.5" fill="#FFD13B"/>
      <circle cx="108" cy="72" r="11" fill="#A855F7" stroke="#6B21A8" stroke-width="2.5"/><circle cx="108" cy="72" r="4" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'hat_viking',
    name: 'Шлем',
    aspectRatio: 1.4,
    baseWidthRatio: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <path d="M28 52 C10 42, 8 18, 22 10 C20 26, 26 36, 36 40 Z" fill="#FFFBEB" stroke="#B45309" stroke-width="3.5"/>
      <path d="M112 52 C130 42, 132 18, 118 10 C120 26, 114 36, 104 40 Z" fill="#FFFBEB" stroke="#B45309" stroke-width="3.5"/>
      <path d="M28 78 C28 34, 112 34, 112 78 Z" fill="#94A3B8" stroke="#334155" stroke-width="4"/>
      <rect x="24" y="70" width="92" height="16" rx="8" fill="#F59E0B" stroke="#92400E" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'hat_santa',
    name: 'Колпак зимы',
    aspectRatio: 1.3,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 100">
      <path d="M22 72 C28 32, 68 14, 108 32 C104 44, 96 52, 88 54 L94 72 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="112" cy="36" r="11" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3"/>
      <rect x="14" y="68" width="88" height="22" rx="11" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'hat_grad',
    name: 'Академик',
    aspectRatio: 1.5,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
      <path d="M40 52 L40 78 Q75 90 110 78 L110 52 Z" fill="#1E293B" stroke="#0F172A" stroke-width="4"/>
      <polygon points="75,18 142,42 75,66 8,42" fill="#334155" stroke="#0F172A" stroke-width="4" stroke-linejoin="round"/>
      <path d="M126 48 L126 82" stroke="#FFD13B" stroke-width="4" stroke-linecap="round"/>
      <circle cx="126" cy="84" r="5" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'glasses_pixel',
    name: 'Крутые очки',
    aspectRatio: 2.3,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 100">
      <rect x="14" y="22" width="88" height="52" rx="6" fill="#0F172A"/>
      <rect x="128" y="22" width="88" height="52" rx="6" fill="#0F172A"/>
      <rect x="96" y="30" width="38" height="14" fill="#0F172A"/>
      <g fill="#FFFFFF">
        <rect x="26" y="32" width="12" height="12"/><rect x="38" y="44" width="12" height="12"/>
        <rect x="140" y="32" width="12" height="12"/><rect x="152" y="44" width="12" height="12"/>
      </g>
    </svg>`,
  },
  {
    id: 'glasses_rainbow',
    name: 'Радуга-очки',
    aspectRatio: 2.3,
    baseWidthRatio: 0.44,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 100">
      <rect x="14" y="20" width="86" height="58" rx="22" fill="#38BDF8" fill-opacity="0.65" stroke="#FF3B5C" stroke-width="7"/>
      <rect x="130" y="20" width="86" height="58" rx="22" fill="#FFD13B" fill-opacity="0.65" stroke="#8B5CF6" stroke-width="7"/>
      <path d="M100 42 Q115 30 130 42" fill="none" stroke="#10C97A" stroke-width="8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'earring_moon',
    name: 'Серьга-луна',
    aspectRatio: 0.75,
    baseWidthRatio: 0.12,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 100">
      <circle cx="38" cy="18" r="8" fill="none" stroke="#F59E0B" stroke-width="4.5"/>
      <path d="M48 34 C26 36 16 54 20 72 C24 86 42 92 58 82 C38 80 32 62 36 48 C39 40 43 36 48 34 Z" fill="#FDE047" stroke="#D97706" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'earring_cherry',
    name: 'Серьга-вишня',
    aspectRatio: 0.85,
    baseWidthRatio: 0.13,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <circle cx="42.5" cy="16" r="8" fill="none" stroke="#F59E0B" stroke-width="4"/>
      <path d="M26 68 Q34 38 42.5 24 Q51 38 59 68" fill="none" stroke="#15803D" stroke-width="4"/>
      <circle cx="25" cy="74" r="14" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
      <circle cx="60" cy="74" r="14" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'earring_butterfly',
    name: 'Серьга-бабочка',
    aspectRatio: 0.85,
    baseWidthRatio: 0.13,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <circle cx="42.5" cy="18" r="8" fill="none" stroke="#F59E0B" stroke-width="4.5"/>
      <ellipse cx="26" cy="54" rx="16" ry="12" transform="rotate(-20 26 54)" fill="#A855F7" stroke="#6B21A8" stroke-width="3"/>
      <ellipse cx="59" cy="54" rx="16" ry="12" transform="rotate(20 59 54)" fill="#A855F7" stroke="#6B21A8" stroke-width="3"/>
      <ellipse cx="28" cy="74" rx="12" ry="9" transform="rotate(20 28 74)" fill="#FF5CA8" stroke="#9D174D" stroke-width="3"/>
      <ellipse cx="57" cy="74" rx="12" ry="9" transform="rotate(-20 57 74)" fill="#FF5CA8" stroke="#9D174D" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'mask_domino',
    name: 'Маска',
    aspectRatio: 2.3,
    baseWidthRatio: 0.46,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 100">
      <path fill-rule="evenodd" d="M12 42 Q60 12 115 34 Q170 12 218 42 Q208 86 154 84 Q126 82 115 62 Q104 82 76 84 Q22 86 12 42 Z M66 36 A26 18 0 1 0 66 72 A26 18 0 1 0 66 36 Z M164 36 A26 18 0 1 0 164 72 A26 18 0 1 0 164 36 Z" fill="#8B5CF6" stroke="#FFD13B" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'hairclip_star',
    name: 'Заколка-звезда',
    aspectRatio: 1.4,
    baseWidthRatio: 0.18,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <rect x="20" y="42" width="102" height="18" rx="9" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <path d="M40 16 L47 34 L66 36 L52 48 L56 66 L40 57 L24 66 L28 48 L14 36 L33 34 Z" fill="#FFD13B" stroke="#D97706" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'hairclip_heart',
    name: 'Заколка-сердце',
    aspectRatio: 1.4,
    baseWidthRatio: 0.18,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <rect x="20" y="42" width="102" height="18" rx="9" fill="#FF5CA8" stroke="#BE185D" stroke-width="4"/>
      <path d="M42 74 C42 74 16 56 16 38 C16 26 26 20 35 22 C39 23 41 26 42 29 C43 26 45 23 49 22 C58 20 68 26 68 38 C68 56 42 74 42 74 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'dragon_cute',
    name: 'Дракоша',
    aspectRatio: 1.1,
    baseWidthRatio: 0.25,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100">
      <polygon points="34,28 24,10 44,20" fill="#FFD13B" stroke="#D97706" stroke-width="3"/>
      <polygon points="76,28 86,10 66,20" fill="#FFD13B" stroke="#D97706" stroke-width="3"/>
      <circle cx="55" cy="56" r="32" fill="#10C97A" stroke="#065F46" stroke-width="4"/>
      <ellipse cx="55" cy="68" rx="22" ry="15" fill="#A7F3D0"/>
      <circle cx="42" cy="46" r="4" fill="#0F172A"/><circle cx="68" cy="46" r="4" fill="#0F172A"/>
      <circle cx="46" cy="66" r="3" fill="#065F46"/><circle cx="64" cy="66" r="3" fill="#065F46"/>
    </svg>`,
  },
  {
    id: 'fox_sticker',
    name: 'Лисичка',
    aspectRatio: 1.05,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <polygon points="18,46 16,12 44,28" fill="#FF7A1A" stroke="#9A3412" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="87,46 89,12 61,28" fill="#FF7A1A" stroke="#9A3412" stroke-width="4" stroke-linejoin="round"/>
      <path d="M16 54 C16 28, 89 28, 89 54 C89 76, 66 86, 52.5 86 C39 86, 16 76, 16 54 Z" fill="#FF7A1A" stroke="#9A3412" stroke-width="4"/>
      <path d="M18 58 Q36 62 52.5 84 Q69 62 87 58 C82 76, 64 84, 52.5 84 C41 84, 23 76, 18 58 Z" fill="#FFFFFF"/>
      <circle cx="38" cy="50" r="4" fill="#0F172A"/><circle cx="67" cy="50" r="4" fill="#0F172A"/>
      <circle cx="52.5" cy="76" r="5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'panda_sticker',
    name: 'Панда',
    aspectRatio: 1.05,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105 100">
      <circle cx="24" cy="24" r="14" fill="#1E293B"/>
      <circle cx="81" cy="24" r="14" fill="#1E293B"/>
      <circle cx="52.5" cy="56" r="34" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
      <ellipse cx="37" cy="50" rx="10" ry="12" transform="rotate(-14 37 50)" fill="#1E293B"/>
      <ellipse cx="68" cy="50" rx="10" ry="12" transform="rotate(14 68 50)" fill="#1E293B"/>
      <circle cx="38" cy="49" r="3" fill="#FFF"/><circle cx="67" cy="49" r="3" fill="#FFF"/>
      <ellipse cx="52.5" cy="64" rx="6" ry="4" fill="#1E293B"/>
      <circle cx="28" cy="64" r="5" fill="#FDA4AF"/><circle cx="77" cy="64" r="5" fill="#FDA4AF"/>
    </svg>`,
  },
  {
    id: 'koala_sticker',
    name: 'Коала',
    aspectRatio: 1.15,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 115 100">
      <circle cx="24" cy="40" r="18" fill="#94A3B8" stroke="#475569" stroke-width="3.5"/>
      <circle cx="24" cy="40" r="9" fill="#F1F5F9"/>
      <circle cx="91" cy="40" r="18" fill="#94A3B8" stroke="#475569" stroke-width="3.5"/>
      <circle cx="91" cy="40" r="9" fill="#F1F5F9"/>
      <circle cx="57.5" cy="56" r="30" fill="#CBD5E1" stroke="#475569" stroke-width="4"/>
      <ellipse cx="57.5" cy="58" rx="8" ry="12" fill="#334155"/>
      <circle cx="40" cy="48" r="3.5" fill="#0F172A"/><circle cx="75" cy="48" r="3.5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'elephant_sticker',
    name: 'Слонёнок',
    aspectRatio: 1.2,
    baseWidthRatio: 0.26,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">
      <ellipse cx="24" cy="48" rx="18" ry="26" fill="#60A5FA" stroke="#1D4ED8" stroke-width="3.5"/>
      <ellipse cx="96" cy="48" rx="18" ry="26" fill="#60A5FA" stroke="#1D4ED8" stroke-width="3.5"/>
      <circle cx="60" cy="48" r="28" fill="#93C5FD" stroke="#1D4ED8" stroke-width="4"/>
      <path d="M54 54 C54 78, 72 86, 78 72" fill="none" stroke="#60A5FA" stroke-width="12" stroke-linecap="round"/>
      <circle cx="48" cy="42" r="3.5" fill="#0F172A"/><circle cx="72" cy="42" r="3.5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'giraffe_sticker',
    name: 'Жирафик',
    aspectRatio: 0.85,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <line x1="30" y1="28" x2="26" y2="10" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>
      <line x1="55" y1="28" x2="59" y2="10" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>
      <circle cx="26" cy="10" r="5" fill="#92400E"/><circle cx="59" cy="10" r="5" fill="#92400E"/>
      <ellipse cx="42.5" cy="54" rx="26" ry="30" fill="#FFD13B" stroke="#B45309" stroke-width="4"/>
      <ellipse cx="42.5" cy="68" rx="18" ry="14" fill="#FEF3C7"/>
      <circle cx="32" cy="44" r="3.5" fill="#0F172A"/><circle cx="53" cy="44" r="3.5" fill="#0F172A"/>
      <circle cx="30" cy="34" r="4" fill="#D97706"/><circle cx="56" cy="56" r="4" fill="#D97706"/>
    </svg>`,
  },
  {
    id: 'zebra_sticker',
    name: 'Зебра',
    aspectRatio: 1,
    baseWidthRatio: 0.23,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <ellipse cx="50" cy="54" rx="30" ry="32" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
      <path d="M24 38 L42 42 M22 52 L40 52 M76 38 L58 42 M78 52 L60 52" stroke="#1E293B" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="50" cy="70" rx="20" ry="13" fill="#CBD5E1"/>
      <circle cx="38" cy="46" r="3.5" fill="#0F172A"/><circle cx="62" cy="46" r="3.5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'monkey_sticker',
    name: 'Мартышка',
    aspectRatio: 1.15,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 115 100">
      <circle cx="20" cy="46" r="14" fill="#C27D48" stroke="#78350F" stroke-width="3.5"/>
      <circle cx="95" cy="46" r="14" fill="#C27D48" stroke="#78350F" stroke-width="3.5"/>
      <circle cx="57.5" cy="52" r="31" fill="#92400E" stroke="#451A03" stroke-width="4"/>
      <ellipse cx="57.5" cy="62" rx="24" ry="18" fill="#FDE68A"/>
      <circle cx="46" cy="46" r="4" fill="#0F172A"/><circle cx="69" cy="46" r="4" fill="#0F172A"/>
      <path d="M46 66 Q57.5 76 69 66" fill="none" stroke="#451A03" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'bunny_sticker',
    name: 'Зайчонок',
    aspectRatio: 0.9,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
      <ellipse cx="32" cy="28" rx="9" ry="22" transform="rotate(-10 32 28)" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3.5"/>
      <ellipse cx="58" cy="28" rx="9" ry="22" transform="rotate(10 58 28)" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3.5"/>
      <circle cx="45" cy="64" r="27" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4"/>
      <circle cx="35" cy="60" r="3.5" fill="#0F172A"/><circle cx="55" cy="60" r="3.5" fill="#0F172A"/>
      <polygon points="41,68 49,68 45,73" fill="#FF5CA8"/>
    </svg>`,
  },
  {
    id: 'hedgehog_sticker',
    name: 'Ёжик',
    aspectRatio: 1.2,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">
      <path d="M16 74 C12 36, 46 18, 74 26 L68 74 Z" fill="#78350F" stroke="#451A03" stroke-width="4"/>
      <path d="M60 32 C84 32, 106 54, 106 70 C94 78, 66 78, 52 74 Z" fill="#FDE68A" stroke="#78350F" stroke-width="3.5"/>
      <circle cx="80" cy="54" r="3.5" fill="#0F172A"/>
      <circle cx="105" cy="66" r="5" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'flamingo_sticker',
    name: 'Фламинго',
    aspectRatio: 0.85,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <line x1="42" y1="66" x2="42" y2="94" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="44" cy="60" rx="22" ry="15" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5"/>
      <path d="M26 56 C18 42, 24 16, 44 16 C56 16, 56 26, 48 28" fill="none" stroke="#FF5CA8" stroke-width="8" stroke-linecap="round"/>
      <circle cx="48" cy="20" r="8" fill="#FF5CA8"/>
      <polygon points="54,18 66,24 54,26" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'chick_sticker',
    name: 'Цыплёнок',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="54" r="32" fill="#FDE047" stroke="#D97706" stroke-width="4"/>
      <circle cx="38" cy="48" r="4" fill="#0F172A"/><circle cx="62" cy="48" r="4" fill="#0F172A"/>
      <polygon points="44,56 56,56 50,66" fill="#FF7A1A" stroke="#C2410C" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="28" cy="58" r="5" fill="#FB7185"/><circle cx="72" cy="58" r="5" fill="#FB7185"/>
    </svg>`,
  },
  {
    id: 'crab_sticker',
    name: 'Крабик',
    aspectRatio: 1.25,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 100">
      <circle cx="24" cy="28" r="14" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
      <circle cx="101" cy="28" r="14" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
      <ellipse cx="62.5" cy="64" rx="34" ry="22" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <circle cx="50" cy="54" r="4" fill="#0F172A"/><circle cx="75" cy="54" r="4" fill="#0F172A"/>
      <path d="M52 68 Q62.5 76 73 68" fill="none" stroke="#9F1239" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'starfish_sticker',
    name: 'Морская звезда',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M50 8 C58 26, 62 32, 88 36 C72 52, 70 58, 76 86 C56 72, 44 72, 24 86 C30 58, 28 52, 12 36 C38 32, 42 26, 50 8 Z" fill="#FF7A1A" stroke="#C2410C" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="42" cy="48" r="3.5" fill="#0F172A"/><circle cx="58" cy="48" r="3.5" fill="#0F172A"/>
      <circle cx="50" cy="30" r="3" fill="#FED7AA"/><circle cx="34" cy="64" r="3" fill="#FED7AA"/><circle cx="66" cy="64" r="3" fill="#FED7AA"/>
    </svg>`,
  },
  {
    id: 'seahorse_sticker',
    name: 'Конёк',
    aspectRatio: 0.72,
    baseWidthRatio: 0.17,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 100">
      <path d="M40 16 C56 16, 58 34, 44 42 C54 54, 54 76, 36 86 C26 90, 20 82, 26 74" fill="none" stroke="#06B6D4" stroke-width="14" stroke-linecap="round"/>
      <line x1="48" y1="24" x2="64" y2="26" stroke="#06B6D4" stroke-width="6" stroke-linecap="round"/>
      <circle cx="42" cy="22" r="3" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'jellyfish_sticker',
    name: 'Медуза',
    aspectRatio: 0.9,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 100">
      <path d="M24 54 Q20 74 28 88 M45 54 Q45 76 42 90 M66 54 Q70 74 62 88" fill="none" stroke="#F472B6" stroke-width="6" stroke-linecap="round"/>
      <path d="M14 54 C14 16, 76 16, 76 54 Z" fill="#A855F7" stroke="#6B21A8" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="36" cy="40" r="3" fill="#FFF"/><circle cx="54" cy="40" r="3" fill="#FFF"/>
    </svg>`,
  },
  {
    id: 'snail_sticker',
    name: 'Улитка',
    aspectRatio: 1.25,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 100">
      <path d="M16 78 L102 78 C114 78, 118 64, 108 56 L104 34 M96 56 L92 34" fill="none" stroke="#4ADE80" stroke-width="12" stroke-linecap="round"/>
      <circle cx="52" cy="52" r="28" fill="#FF9F1C" stroke="#B45309" stroke-width="4"/>
      <path d="M52 52 C58 52 58 42 50 40 C40 38 36 48 40 58 C46 68 62 66 66 52" fill="none" stroke="#78350F" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'caterpillar_sticker',
    name: 'Гусеница',
    aspectRatio: 1.5,
    baseWidthRatio: 0.28,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100">
      <circle cx="28" cy="64" r="18" fill="#22C55E" stroke="#15803D" stroke-width="3.5"/>
      <circle cx="56" cy="56" r="18" fill="#4ADE80" stroke="#15803D" stroke-width="3.5"/>
      <circle cx="84" cy="62" r="18" fill="#22C55E" stroke="#15803D" stroke-width="3.5"/>
      <circle cx="114" cy="48" r="22" fill="#4ADE80" stroke="#15803D" stroke-width="3.5"/>
      <circle cx="110" cy="42" r="3.5" fill="#0F172A"/><circle cx="122" cy="42" r="3.5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'airplane_sticker',
    name: 'Самолётик',
    aspectRatio: 1.35,
    baseWidthRatio: 0.27,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135 100">
      <path d="M16 58 L48 52 L66 16 L84 16 L78 52 L114 48 L124 62 L78 66 L72 88 L56 88 L56 66 L22 68 Z" fill="#38BDF8" stroke="#0369A1" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="96" cy="56" r="5" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'helicopter_sticker',
    name: 'Вертолёт',
    aspectRatio: 1.4,
    baseWidthRatio: 0.28,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <line x1="28" y1="20" x2="112" y2="20" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
      <line x1="70" y1="20" x2="70" y2="34" stroke="#1E293B" stroke-width="5"/>
      <path d="M16 56 L48 54 C54 34, 102 32, 108 58 C108 74, 52 76, 44 62 L16 62 Z" fill="#FF3B5C" stroke="#9F1239" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 40 C92 40, 102 48, 102 58 L72 58 Z" fill="#BAE6FD"/>
      <line x1="48" y1="84" x2="104" y2="84" stroke="#1E293B" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'fire_truck',
    name: 'Пожарная',
    aspectRatio: 1.45,
    baseWidthRatio: 0.28,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 100">
      <rect x="14" y="34" width="114" height="40" rx="8" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <rect x="88" y="40" width="32" height="18" rx="4" fill="#E0F2FE"/>
      <rect x="20" y="24" width="60" height="10" rx="3" fill="#CBD5E1" stroke="#475569" stroke-width="2.5"/>
      <circle cx="104" cy="28" r="6" fill="#38BDF8"/>
      <circle cx="40" cy="78" r="12" fill="#1E293B"/><circle cx="106" cy="78" r="12" fill="#1E293B"/>
    </svg>`,
  },
  {
    id: 'tractor',
    name: 'Трактор',
    aspectRatio: 1.3,
    baseWidthRatio: 0.26,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 100">
      <rect x="24" y="22" width="44" height="40" rx="6" fill="#10C97A" stroke="#065F46" stroke-width="4"/>
      <rect x="68" y="40" width="42" height="24" rx="5" fill="#22C55E" stroke="#065F46" stroke-width="4"/>
      <rect x="32" y="28" width="28" height="20" rx="3" fill="#E0F2FE"/>
      <circle cx="40" cy="72" r="18" fill="#1E293B" stroke="#0F172A" stroke-width="4"/><circle cx="40" cy="72" r="7" fill="#FFD13B"/>
      <circle cx="96" cy="78" r="12" fill="#1E293B" stroke="#0F172A" stroke-width="4"/><circle cx="96" cy="78" r="5" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'bicycle',
    name: 'Велосипед',
    aspectRatio: 1.4,
    baseWidthRatio: 0.27,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100">
      <circle cx="34" cy="68" r="22" fill="none" stroke="#2563EB" stroke-width="6"/>
      <circle cx="106" cy="68" r="22" fill="none" stroke="#2563EB" stroke-width="6"/>
      <path d="M34 68 L64 40 L94 40 L68 68 Z M94 40 L106 68 M92 28 L104 28 M56 32 L72 32" fill="none" stroke="#FF3B5C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'hot_air_balloon',
    name: 'Шар в небе',
    aspectRatio: 0.78,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 100">
      <ellipse cx="39" cy="38" rx="28" ry="30" fill="#FF3B5C" stroke="#9F1239" stroke-width="3.5"/>
      <ellipse cx="39" cy="38" rx="14" ry="30" fill="#FFD13B"/>
      <rect x="30" y="78" width="18" height="14" rx="3" fill="#B45309" stroke="#78350F" stroke-width="3"/>
      <line x1="28" y1="66" x2="32" y2="78" stroke="#78350F" stroke-width="2.5"/>
      <line x1="50" y1="66" x2="46" y2="78" stroke="#78350F" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'cake_slice',
    name: 'Тортик',
    aspectRatio: 1.1,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100">
      <polygon points="18,46 92,34 92,82 18,82" fill="#FDE68A" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <line x1="20" y1="64" x2="90" y2="60" stroke="#FF5CA8" stroke-width="8"/>
      <path d="M16 46 L92 34 L62 18 Z" fill="#FF5CA8" stroke="#BE185D" stroke-width="3.5" stroke-linejoin="round"/>
      <circle cx="58" cy="22" r="8" fill="#FF3B5C" stroke="#9F1239" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'cookie',
    name: 'Печенька',
    aspectRatio: 1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="36" fill="#D97706" stroke="#78350F" stroke-width="4"/>
      <circle cx="34" cy="36" r="5" fill="#451A03"/><circle cx="62" cy="34" r="5" fill="#451A03"/>
      <circle cx="50" cy="54" r="5.5" fill="#451A03"/><circle cx="34" cy="64" r="4.5" fill="#451A03"/><circle cx="66" cy="64" r="5" fill="#451A03"/>
    </svg>`,
  },
  {
    id: 'pizza',
    name: 'Пицца',
    aspectRatio: 1,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="50,88 16,24 84,24" fill="#FFD13B" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <path d="M12 24 Q50 10 88 24" fill="none" stroke="#D97706" stroke-width="12" stroke-linecap="round"/>
      <circle cx="42" cy="40" r="6" fill="#FF3B5C"/><circle cx="60" cy="44" r="6" fill="#FF3B5C"/><circle cx="50" cy="64" r="5.5" fill="#FF3B5C"/>
    </svg>`,
  },
  {
    id: 'banana',
    name: 'Бананчик',
    aspectRatio: 1.15,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 115 100">
      <path d="M22 70 C48 86, 86 64, 94 22 C86 14, 78 20, 74 30 C64 52, 42 62, 22 60 C16 62, 16 68, 22 70 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="4" stroke-linejoin="round"/>
      <rect x="86" y="14" width="10" height="8" rx="3" fill="#78350F"/>
    </svg>`,
  },
  {
    id: 'orange_fruit',
    name: 'Апельсин',
    aspectRatio: 1,
    baseWidthRatio: 0.2,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="56" r="32" fill="#FF7A1A" stroke="#C2410C" stroke-width="4"/>
      <ellipse cx="62" cy="20" rx="12" ry="6" transform="rotate(-24 62 20)" fill="#22C55E" stroke="#15803D" stroke-width="2.5"/>
      <circle cx="38" cy="44" r="4" fill="#FED7AA"/>
    </svg>`,
  },
  {
    id: 'pineapple',
    name: 'Ананас',
    aspectRatio: 0.78,
    baseWidthRatio: 0.19,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 100">
      <path d="M39 34 L22 10 L36 22 L39 6 L42 22 L56 10 Z" fill="#22C55E" stroke="#15803D" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="39" cy="62" rx="24" ry="30" fill="#FBBF24" stroke="#B45309" stroke-width="4"/>
      <path d="M22 48 L56 76 M22 76 L56 48" stroke="#D97706" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'avocado',
    name: 'Авокадо',
    aspectRatio: 0.85,
    baseWidthRatio: 0.19,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <path d="M42.5 10 C26 10, 14 42, 14 64 C14 82, 26 92, 42.5 92 C59 92, 71 82, 71 64 C71 42, 59 10, 42.5 10 Z" fill="#15803D" stroke="#065F46" stroke-width="4"/>
      <path d="M42.5 18 C30 18, 21 44, 21 63 C21 77, 30 85, 42.5 85 C55 85, 64 77, 64 63 C64 44, 55 18, 42.5 18 Z" fill="#BEF264"/>
      <circle cx="42.5" cy="64" r="14" fill="#92400E"/>
    </svg>`,
  },
  {
    id: 'soccer_ball',
    name: 'Мячик',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
      <polygon points="50,34 65,45 59,62 41,62 35,45" fill="#1E293B"/>
      <line x1="50" y1="34" x2="50" y2="14" stroke="#1E293B" stroke-width="3.5"/>
      <line x1="65" y1="45" x2="84" y2="38" stroke="#1E293B" stroke-width="3.5"/>
      <line x1="35" y1="45" x2="16" y2="38" stroke="#1E293B" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'guitar',
    name: 'Гитара',
    aspectRatio: 0.85,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <line x1="42.5" y1="10" x2="42.5" y2="54" stroke="#78350F" stroke-width="8" stroke-linecap="round"/>
      <circle cx="42.5" cy="68" r="24" fill="#FF7A1A" stroke="#9A3412" stroke-width="4"/>
      <circle cx="42.5" cy="52" r="16" fill="#FF7A1A" stroke="#9A3412" stroke-width="4"/>
      <circle cx="42.5" cy="64" r="8" fill="#451A03"/>
    </svg>`,
  },
  {
    id: 'drum',
    name: 'Барабан',
    aspectRatio: 1.2,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">
      <rect x="20" y="34" width="80" height="48" rx="10" fill="#FF3B5C" stroke="#9F1239" stroke-width="4"/>
      <ellipse cx="60" cy="34" rx="40" ry="12" fill="#FFFBEB" stroke="#9F1239" stroke-width="4"/>
      <path d="M28 44 L44 76 L60 46 L76 76 L92 44" fill="none" stroke="#FFD13B" stroke-width="4" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'camera',
    name: 'Камера',
    aspectRatio: 1.25,
    baseWidthRatio: 0.24,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 100">
      <rect x="40" y="18" width="44" height="14" rx="5" fill="#60A5FA" stroke="#1D4ED8" stroke-width="3.5"/>
      <rect x="16" y="30" width="93" height="54" rx="12" fill="#38BDF8" stroke="#0369A1" stroke-width="4"/>
      <circle cx="62.5" cy="57" r="18" fill="#1E293B" stroke="#FFFFFF" stroke-width="4"/>
      <circle cx="62.5" cy="57" r="7" fill="#60A5FA"/>
      <circle cx="92" cy="42" r="4" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'umbrella_sticker',
    name: 'Зонтик',
    aspectRatio: 1,
    baseWidthRatio: 0.22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M50 52 L50 84 C50 92, 38 92, 38 84" fill="none" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>
      <path d="M12 52 A38 38 0 0 1 88 52 Z" fill="#FF5CA8" stroke="#BE185D" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 52 A16 38 0 0 1 66 52 Z" fill="#FFD13B"/>
    </svg>`,
  },
  {
    id: 'snowman',
    name: 'Снеговик',
    aspectRatio: 0.85,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 100">
      <circle cx="42.5" cy="70" r="22" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3.5"/>
      <circle cx="42.5" cy="40" r="16" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3.5"/>
      <rect x="28" y="14" width="29" height="14" rx="3" fill="#1E293B"/>
      <line x1="22" y1="26" x2="63" y2="26" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
      <polygon points="42,40 56,43 42,46" fill="#FF7A1A"/>
      <circle cx="37" cy="36" r="2.5" fill="#0F172A"/><circle cx="48" cy="36" r="2.5" fill="#0F172A"/>
    </svg>`,
  },
  {
    id: 'trophy',
    name: 'Кубок',
    aspectRatio: 1,
    baseWidthRatio: 0.21,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M24 24 C10 24, 10 48, 28 50 M76 24 C90 24, 90 48, 72 50" fill="none" stroke="#F59E0B" stroke-width="5"/>
      <path d="M26 16 L74 16 L66 56 Q50 68 34 56 Z" fill="#FFD13B" stroke="#D97706" stroke-width="4" stroke-linejoin="round"/>
      <rect x="44" y="60" width="12" height="16" fill="#F59E0B"/>
      <rect x="30" y="76" width="40" height="12" rx="4" fill="#D97706"/>
    </svg>`,
  },
];

export const TSHIRT_COLORS: PaintColor[] = [
  { id: 'shirt-white', name: 'Белая', hex: '#FFFFFF', ringHex: '#CBD5E1' },
  { id: 'shirt-sky', name: 'Небесная', hex: '#BAE6FD', ringHex: '#0284C7' },
  { id: 'shirt-sunny', name: 'Жёлтая', hex: '#FEF08A', ringHex: '#CA8A04' },
  { id: 'shirt-pink', name: 'Розовая', hex: '#FBCFE8', ringHex: '#DB2777' },
  { id: 'shirt-mint', name: 'Мятная', hex: '#A7F3D0', ringHex: '#059669' },
  { id: 'shirt-lavender', name: 'Сиреневая', hex: '#DDD6FE', ringHex: '#7C3AED' },
  { id: 'shirt-coral', name: 'Коралловая', hex: '#FF7A59', ringHex: '#C2410C' },
  { id: 'shirt-cobalt', name: 'Синяя', hex: '#3B82F6', ringHex: '#1D4ED8' },
  { id: 'shirt-navy', name: 'Тёмно-синяя', hex: '#1E293B', ringHex: '#0F172A' },
];

export function stickerToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
