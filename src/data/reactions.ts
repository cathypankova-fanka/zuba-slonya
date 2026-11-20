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

const POOLS: Record<ReactionContext, string[]> = {
  pizza: ['yum_jump', 'hot_blow', 'giggle_roll', 'proud_pose', 'dance', 'wow_zoom', 'chewing', 'flip', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  icecream: ['brr_cold', 'yum_jump', 'shy_blush', 'spin_joy', 'wow_zoom', 'giggle_roll', 'tickled', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  soup: ['hot_blow', 'yum_jump', 'food_coma', 'chewing', 'dance', 'sneaky', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  sandwich: ['wow_zoom', 'chewing', 'proud_pose', 'giggle_roll', 'flip', 'sneaky', 'yum_jump', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  drinks: ['burp', 'brr_cold', 'spin_joy', 'giggle_roll', 'dance', 'tickled', 'wow_zoom', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  cake: ['wow_zoom', 'shy_blush', 'spin_joy', 'dance', 'proud_pose', 'flip', 'yum_jump', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  feed_favorite: ['yum_jump', 'spin_joy', 'flip', 'dance', 'giggle_roll', 'wow_zoom', 'proud_pose', 'tickled', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  feed_neutral: ['thinking', 'shy_blush', 'chewing', 'food_coma', 'sneaky', 'peekaboo', 'wave', 'bigeyes', 'hiccup'],
  celebrate: ['dance', 'spin_joy', 'flip', 'proud_pose', 'yum_jump', 'giggle_roll', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  wash: ['tickled', 'giggle_roll', 'brr_cold', 'shy_blush', 'spin_joy', 'wow_zoom', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
  tap: ['tickled', 'giggle_roll', 'wow_zoom', 'sneaky', 'shy_blush', 'thinking', 'sneeze', 'hiccup', 'heli', 'bigeyes', 'dizzy', 'singer', 'flex', 'partypop', 'shrink', 'raspberry', 'peekaboo', 'snorebubble', 'kiss', 'mindblown', 'fullbelly', 'stomp', 'superhero', 'headbang', 'wave', 'iceblock', 'magic'],
};

let lastId = '';

/**
 * Случайная реакция для ситуации; не повторяет предыдущую подряд.
 * Если у героя есть готовые видео-реакции — выбираем в основном из них.
 */
export function pickReaction(context: ReactionContext, heroId?: string): Reaction {
  const base = POOLS[context].filter((id) => id !== lastId && REACTIONS[id]);
  const withAnim = heroId
    ? base.filter((id) => {
        const anim = REACTIONS[id].anim;
        return anim ? hasReactionAnim(heroId, anim) : false;
      })
    : [];
  const pool = withAnim.length > 0 && Math.random() < 0.85 ? withAnim : base;
  const id = pool[Math.floor(Math.random() * pool.length)];
  lastId = id;
  return REACTIONS[id];
}
