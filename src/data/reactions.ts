import { hasReactionAnim } from './reactionAssets';

/**
 * Реакции героев: картинка-эмоция + смешное движение + летящие смайлики.
 * Нужны, чтобы герой не отвечал на всё одним и тем же «радостным жеванием».
 */

export type ReactionMotion =
  | 'hop'
  | 'spin'
  | 'jelly'
  | 'sway'
  | 'shake'
  | 'zoom'
  | 'flip'
  | 'wobble'
  | 'dance'
  | 'tilt'
  | 'lookdown';

export interface Reaction {
  id: string;
  /** 'eat' — анимация жевания; иначе имя эмоции (joy, laugh, sad, ...) */
  emotion: string;
  motion: ReactionMotion;
  fx: string[];
  /** имя готовой видео-реакции (assets/reactions/<герой>/<anim>.webp), если она есть у героя */
  anim?: string;
}

export const REACTIONS: Record<string, Reaction> = {
  look_down: { id: 'look_down', emotion: 'curious', motion: 'lookdown', fx: ['👀', '👕', '❓'] },
  proud_chest: { id: 'proud_chest', emotion: 'proud', motion: 'jelly', fx: ['✨', '👕', '⭐'] },
  chewing: { id: 'chewing', emotion: 'eat', motion: 'wobble', fx: ['🍴', '✨'] },
  yum_jump: { id: 'yum_jump', emotion: 'joy', motion: 'hop', fx: ['❤️', '✨', '💖'] },
  giggle_roll: { id: 'giggle_roll', emotion: 'laugh', motion: 'wobble', fx: ['😂', '✨', '🎈'] },
  spin_joy: { id: 'spin_joy', emotion: 'joy', motion: 'spin', fx: ['⭐', '✨', '🌟'] },
  wow_zoom: { id: 'wow_zoom', emotion: 'surprised', motion: 'zoom', fx: ['❗', '✨', '😮'] },
  blow_cool: { id: 'blow_cool', anim: 'blow', emotion: 'curious', motion: 'sway', fx: ['💨', '🌬️', '✨'] },
  hot_blow: { anim: 'hot', id: 'hot_blow', emotion: 'surprised', motion: 'shake', fx: ['🔥', '💨', '🥵'] },
  brr_cold: { anim: 'cold', id: 'brr_cold', emotion: 'scared', motion: 'shake', fx: ['❄️', '🥶', '💧'] },
  food_coma: { anim: 'sleepy', id: 'food_coma', emotion: 'sleepy', motion: 'sway', fx: ['💤', '😴', '💤'] },
  proud_pose: { id: 'proud_pose', emotion: 'proud', motion: 'jelly', fx: ['⭐', '👑', '✨'] },
  shy_blush: { id: 'shy_blush', emotion: 'shy', motion: 'sway', fx: ['💕', '🌸', '💗'] },
  thinking: { id: 'thinking', emotion: 'curious', motion: 'tilt', fx: ['❓', '💭', '🤔'] },
  dance: { anim: 'dance', id: 'dance', emotion: 'joy', motion: 'dance', fx: ['🎵', '🎶', '💃'] },
  flip: { anim: 'jumpspin', id: 'flip', emotion: 'laugh', motion: 'flip', fx: ['🤩', '✨', '🎉'] },
  burp: { anim: 'burp', id: 'burp', emotion: 'surprised', motion: 'jelly', fx: ['💨', '🫧', '😳'] },
  tickled: { id: 'tickled', emotion: 'laugh', motion: 'shake', fx: ['😆', '🤭', '✨'] },
  sneaky: { id: 'sneaky', emotion: 'curious', motion: 'sway', fx: ['👀', '🤫', '✨'] },
  sneeze: { id: 'sneeze', anim: 'sneeze', emotion: 'surprised', motion: 'jelly', fx: ['🤧', '🌸', '🎊'] },
  hiccup: { id: 'hiccup', anim: 'hiccup', emotion: 'surprised', motion: 'hop', fx: ['😳', '❗', '💫'] },
  heli: { id: 'heli', anim: 'heli', emotion: 'laugh', motion: 'spin', fx: ['🚁', '☁️', '✨'] },
  bigeyes: { id: 'bigeyes', anim: 'bigeyes', emotion: 'surprised', motion: 'zoom', fx: ['👀', '✨', '🤩'] },
  dizzy: { id: 'dizzy', anim: 'dizzy', emotion: 'curious', motion: 'spin', fx: ['💫', '🌀', '⭐'] },
  singer: { id: 'singer', anim: 'singer', emotion: 'joy', motion: 'sway', fx: ['🎤', '🎵', '🎶'] },
  flex: { id: 'flex', anim: 'flex', emotion: 'proud', motion: 'jelly', fx: ['💪', '✨', '😎'] },
  partypop: { id: 'partypop', anim: 'partypop', emotion: 'joy', motion: 'hop', fx: ['🎉', '🎊', '🥳'] },
  shrink: { id: 'shrink', anim: 'shrink', emotion: 'surprised', motion: 'zoom', fx: ['🔍', '✨', '💥'] },
  raspberry: { id: 'raspberry', anim: 'raspberry', emotion: 'laugh', motion: 'shake', fx: ['😜', '💦', '🤪'] },
  peekaboo: { id: 'peekaboo', anim: 'peekaboo', emotion: 'shy', motion: 'tilt', fx: ['🙈', '👋', '✨'] },
  snorebubble: { id: 'snorebubble', anim: 'snorebubble', emotion: 'sleepy', motion: 'sway', fx: ['💤', '🫧', '😴'] },
  kiss: { id: 'kiss', anim: 'kiss', emotion: 'shy', motion: 'tilt', fx: ['😘', '💋', '💕'] },
  mindblown: { id: 'mindblown', anim: 'mindblown', emotion: 'surprised', motion: 'zoom', fx: ['🤯', '🌈', '⭐'] },
  fullbelly: { id: 'fullbelly', anim: 'fullbelly', emotion: 'proud', motion: 'jelly', fx: ['😋', '🍽️', '💛'] },
  stomp: { id: 'stomp', anim: 'stomp', emotion: 'angry', motion: 'shake', fx: ['💢', '💨', '😤'] },
  superhero: { id: 'superhero', anim: 'superhero', emotion: 'proud', motion: 'hop', fx: ['🦸', '⭐', '✨'] },
  headbang: { id: 'headbang', anim: 'headbang', emotion: 'joy', motion: 'dance', fx: ['🎸', '🤘', '🎶'] },
  wave: { id: 'wave', anim: 'wave', emotion: 'joy', motion: 'hop', fx: ['👋', '😊', '✨'] },
  iceblock: { id: 'iceblock', anim: 'iceblock', emotion: 'scared', motion: 'shake', fx: ['🧊', '❄️', '🥶'] },
  magic: { id: 'magic', anim: 'magic', emotion: 'surprised', motion: 'sway', fx: ['🪄', '✨', '🌟'] },
};

export type ReactionContext =
  | 'pizza'
  | 'icecream'
  | 'soup'
  | 'sandwich'
  | 'drinks'
  | 'cake'
  | 'feed_favorite'
  | 'feed_neutral'
  | 'celebrate'
  | 'wash'
  | 'tap';

/** Видео-реакции, которые подходят только к определённым ситуациям */
const ONLY_IN: Record<string, ReactionContext[]> = {
  hot_blow: ['pizza', 'soup', 'sandwich', 'drinks', 'celebrate', 'tap'],
  blow_cool: ['pizza', 'soup', 'sandwich', 'drinks', 'cake', 'celebrate', 'tap'],
  brr_cold: ['icecream', 'drinks', 'wash', 'tap'],
  iceblock: ['icecream', 'drinks', 'wash', 'tap', 'celebrate'],
  food_coma: ['pizza', 'soup', 'sandwich', 'cake', 'feed_favorite', 'feed_neutral', 'tap'],
  fullbelly: ['pizza', 'icecream', 'soup', 'sandwich', 'drinks', 'cake', 'feed_favorite', 'feed_neutral'],
  burp: ['pizza', 'soup', 'sandwich', 'drinks', 'cake', 'feed_favorite', 'icecream'],
};

/** Картинки-эмоции без видео — для каждой ситуации свои */
const STATIC_POOLS: Record<ReactionContext, string[]> = {
  pizza: ['yum_jump', 'giggle_roll', 'proud_pose', 'wow_zoom', 'chewing'],
  icecream: ['yum_jump', 'shy_blush', 'spin_joy', 'wow_zoom', 'giggle_roll', 'tickled'],
  soup: ['yum_jump', 'chewing', 'sneaky', 'proud_pose'],
  sandwich: ['wow_zoom', 'chewing', 'proud_pose', 'giggle_roll', 'sneaky', 'yum_jump'],
  drinks: ['spin_joy', 'giggle_roll', 'tickled', 'wow_zoom'],
  cake: ['wow_zoom', 'shy_blush', 'spin_joy', 'proud_pose', 'yum_jump'],
  feed_favorite: ['yum_jump', 'spin_joy', 'giggle_roll', 'wow_zoom', 'proud_pose', 'tickled'],
  feed_neutral: ['thinking', 'shy_blush', 'chewing', 'sneaky'],
  celebrate: ['spin_joy', 'proud_pose', 'yum_jump', 'giggle_roll'],
  wash: ['tickled', 'giggle_roll', 'shy_blush', 'spin_joy', 'wow_zoom'],
  tap: ['tickled', 'giggle_roll', 'wow_zoom', 'sneaky', 'shy_blush', 'thinking'],
};

/** Для «не любимой» еды — только спокойные видео */
const NEUTRAL_ANIMS = ['peekaboo', 'wave', 'bigeyes', 'hiccup', 'dizzy', 'snorebubble', 'food_coma', 'fullbelly', 'kiss', 'sneeze', 'shrink'];

const ANIM_IDS = Object.values(REACTIONS).filter((r) => r.anim).map((r) => r.id);

function animPool(context: ReactionContext): string[] {
  const base = context === 'feed_neutral' ? NEUTRAL_ANIMS : ANIM_IDS;
  return base.filter((id) => !ONLY_IN[id] || ONLY_IN[id].includes(context));
}

let lastId = '';

/**
 * Случайная реакция для ситуации (не повторяет предыдущую подряд). Если у героя есть
 * видео-реакции — в основном (85%) берём любое из ВСЕХ его видео, подходящих к ситуации.
 */
export function pickReaction(context: ReactionContext, heroId?: string): Reaction {
  const withAnim = heroId
    ? animPool(context).filter((id) => hasReactionAnim(heroId, REACTIONS[id].anim!))
    : [];
  if (withAnim.length > 0 && Math.random() < 0.85) {
    const fresh = withAnim.length > 1 ? withAnim.filter((x) => x !== lastId) : withAnim;
    const id = fresh[Math.floor(Math.random() * fresh.length)];
    lastId = id;
    return REACTIONS[id];
  }
  const stat = STATIC_POOLS[context].filter((id) => id !== lastId);
  const id = stat[Math.floor(Math.random() * stat.length)];
  lastId = id;
  return REACTIONS[id];
}
