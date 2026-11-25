import bearImg from '../assets/images/fairytale_bear_1794911906178.webp';
import bunnyImg from '../assets/images/fairytale_bunny_1794910313488.webp';
import catImg from '../assets/images/fairytale_cat_1794911905411.webp';
import dragonImg from '../assets/images/fairytale_dragon_1794910312946.webp';
import foxImg from '../assets/images/fairytale_fox_1794910313829.webp';
import frogImg from '../assets/images/fairytale_frog_1794911903196.webp';
import lionImg from '../assets/images/fairytale_lion_1794911905238.webp';
import owlImg from '../assets/images/fairytale_owl_1794911905809.webp';
import unicornImg from '../assets/images/fairytale_unicorn_1794910346746.webp';

export type CharacterCategory = 'fairytale' | 'family';

export interface CharacterItem {
  id: string;
  name: string;
  category: CharacterCategory;
  imageSrc: string;
  accentBg: string;
  praiseSubject: string;
  faceMaskAnchor: {
    y: number;
    scale: number;
  };
}

export const CHARACTERS: CharacterItem[] = [
  {
    id: 'unicorn',
    name: 'Единорожек',
    category: 'fairytale',
    imageSrc: unicornImg,
    accentBg: '#FCE7F3',
    praiseSubject: 'Единорожек в восторге!',
    faceMaskAnchor: { y: 0.56, scale: 0.86 },
  },
  {
    id: 'bunny',
    name: 'Зайчик',
    category: 'fairytale',
    imageSrc: bunnyImg,
    accentBg: '#E0F2FE',
    praiseSubject: 'Зайчик улыбается тебе!',
    faceMaskAnchor: { y: 0.57, scale: 0.88 },
  },
  {
    id: 'dragon',
    name: 'Дракончик',
    category: 'fairytale',
    imageSrc: dragonImg,
    accentBg: '#D1FAE5',
    praiseSubject: 'Дракончик такой нарядный!',
    faceMaskAnchor: { y: 0.37, scale: 0.96 },
  },
  {
    id: 'fox',
    name: 'Лисёнок',
    category: 'fairytale',
    imageSrc: foxImg,
    accentBg: '#FFEDD5',
    praiseSubject: 'Лисёнок очень рад!',
    faceMaskAnchor: { y: 0.48, scale: 0.96 },
  },
  {
    id: 'bear',
    name: 'Мишка',
    category: 'fairytale',
    imageSrc: bearImg,
    accentBg: '#FEF3C7',
    praiseSubject: 'Мишка хлопает в ладоши!',
    faceMaskAnchor: { y: 0.42, scale: 0.84 },
  },
  {
    id: 'owl',
    name: 'Совушка',
    category: 'fairytale',
    imageSrc: owlImg,
    accentBg: '#E0E7FF',
    praiseSubject: 'Совушка любуется тобой!',
    faceMaskAnchor: { y: 0.42, scale: 1.04 },
  },
  {
    id: 'lion',
    name: 'Львёнок',
    category: 'fairytale',
    imageSrc: lionImg,
    accentBg: '#FFEDD5',
    praiseSubject: 'Львёнок гордится рисунком!',
    faceMaskAnchor: { y: 0.41, scale: 0.84 },
  },
  {
    id: 'frog',
    name: 'Лягушонок',
    category: 'fairytale',
    imageSrc: frogImg,
    accentBg: '#DCFCE7',
    praiseSubject: 'Лягушонок прыгает от радости!',
    faceMaskAnchor: { y: 0.4, scale: 1.06 },
  },
  {
    id: 'cat',
    name: 'Котёнок',
    category: 'fairytale',
    imageSrc: catImg,
    accentBg: '#FFE4E6',
    praiseSubject: 'Котёнок мурлычет от счастья!',
    faceMaskAnchor: { y: 0.45, scale: 0.94 },
  },
  {
    id: 'baby',
    name: 'Анна',
    category: 'family',
    imageSrc: '/assets/aistudio/Person_looking_at_camera_705f02e4_dd7374f5.webp',
    accentBg: '#FFE4E6',
    praiseSubject: 'Анна сияет от счастья!',
    faceMaskAnchor: { y: 0.51, scale: 1.02 },
  },
  {
    id: 'aunt',
    name: 'Тётя',
    category: 'family',
    imageSrc: '/assets/aistudio/Person_looking_into_camera_9485ca4b_b98cedab.webp',
    accentBg: '#FEF3C7',
    praiseSubject: 'Тёте очень идёт!',
    faceMaskAnchor: { y: 0.45, scale: 0.82 },
  },
  {
    id: 'dad',
    name: 'Папа',
    category: 'family',
    imageSrc: '/assets/aistudio/Person_looking_into_camera_eef3e2fb_a3a432b8.webp',
    accentBg: '#ECFCCB',
    praiseSubject: 'Папа выглядит круто!',
    faceMaskAnchor: { y: 0.42, scale: 0.84 },
  },
  {
    id: 'mom',
    name: 'Мама',
    category: 'family',
    imageSrc: '/assets/aistudio/Close-up_face_looking_into_camera_108c6d04_117be83c.webp',
    accentBg: '#FEE2E2',
    praiseSubject: 'Маме очень нравится!',
    faceMaskAnchor: { y: 0.47, scale: 0.8 },
  },
  {
    id: 'uncle',
    name: 'Дядя',
    category: 'family',
    imageSrc: '/assets/aistudio/Person_looking_into_camera_611a2389_ee7cb4d1.webp',
    accentBg: '#E0E7FF',
    praiseSubject: 'Дядя стал ещё веселее!',
    faceMaskAnchor: { y: 0.42, scale: 0.82 },
  },
  {
    id: 'grandma',
    name: 'Бабушка',
    category: 'family',
    imageSrc: '/assets/aistudio/Close-up_of_face_13304539_0a4cac2a.webp',
    accentBg: '#F3E8FF',
    praiseSubject: 'Бабушка в полном восторге!',
    faceMaskAnchor: { y: 0.44, scale: 0.9 },
  },
  {
    id: 'grandpa',
    name: 'Дедушка',
    category: 'family',
    imageSrc: '/assets/aistudio/Close-up_of_face_2228de04_8ebd8a38.webp',
    accentBg: '#DBEAFE',
    praiseSubject: 'Дедушка улыбается!',
    faceMaskAnchor: { y: 0.43, scale: 0.96 },
  },
  {
    id: 'alex',
    name: 'Алекс',
    category: 'family',
    imageSrc: '/assets/aistudio/alex_1310f3ed.webp',
    accentBg: '#DBEAFE',
    praiseSubject: 'Алексу очень нравится!',
    faceMaskAnchor: { y: 0.48, scale: 0.94 },
  },
  {
    id: 'milo',
    name: 'Майло',
    category: 'family',
    imageSrc: '/assets/aistudio/milo_a59baa9a.webp',
    accentBg: '#D1FAE5',
    praiseSubject: 'Майло в восторге!',
    faceMaskAnchor: { y: 0.5, scale: 0.96 },
  },
  {
    id: 'tim',
    name: 'Тим',
    category: 'family',
    imageSrc: '/assets/aistudio/tim_964a60d7.webp',
    accentBg: '#E0F2FE',
    praiseSubject: 'Тим хлопает в ладоши!',
    faceMaskAnchor: { y: 0.51, scale: 0.96 },
  },
  {
    id: 'carolina',
    name: 'Каролина',
    category: 'family',
    imageSrc: '/assets/aistudio/carolina_6287d0c9.webp',
    accentBg: '#F3E8FF',
    praiseSubject: 'Каролина сияет от счастья!',
    faceMaskAnchor: { y: 0.51, scale: 0.96 },
  },
  {
    id: 'pipa',
    name: 'Пипа',
    category: 'family',
    imageSrc: '/assets/aistudio/pipa.webp',
    accentBg: '#FCE7F3',
    praiseSubject: 'Пипа хрюкает от радости!',
    faceMaskAnchor: { y: 0.66, scale: 0.86 },
  },
  {
    id: 'letka',
    name: 'Скаечка',
    category: 'family',
    imageSrc: '/assets/aistudio/letka.webp',
    accentBg: '#FCE7F3',
    praiseSubject: 'Скаечка летит от радости!',
    faceMaskAnchor: { y: 0.43, scale: 0.78 },
  },
  {
    id: 'pyatnysh',
    name: 'Маршик',
    category: 'family',
    imageSrc: '/assets/aistudio/pyatnysh.webp',
    accentBg: '#FEE2E2',
    praiseSubject: 'Маршик виляет хвостиком!',
    faceMaskAnchor: { y: 0.46, scale: 0.78 },
  },
  {
    id: 'luchik',
    name: 'Рублик',
    category: 'family',
    imageSrc: '/assets/aistudio/luchik.webp',
    accentBg: '#FEF9C3',
    praiseSubject: 'Рублик сияет от счастья!',
    faceMaskAnchor: { y: 0.47, scale: 0.8 },
  },
  {
    id: 'golubika',
    name: 'Блюша',
    category: 'family',
    imageSrc: '/assets/aistudio/golubika.webp',
    accentBg: '#DBEAFE',
    praiseSubject: 'Блюша прыгает от радости!',
    faceMaskAnchor: { y: 0.46, scale: 0.85 },
  },
];
