/** Готовые видео-реакции героев (animated WebP): public/assets/reactions/<герой>/<имя>.webp */
export const HERO_REACTION_ANIMS: Record<string, string[]> = {};
for (const p of Object.keys(import.meta.glob('/public/assets/reactions/*/*.webp'))) {
  const parts = p.split('/');
  (HERO_REACTION_ANIMS[parts[4]] ??= []).push(parts[5].replace('.webp', ''));
}

export const hasReactionAnim = (heroId: string, anim: string) =>
  HERO_REACTION_ANIMS[heroId]?.includes(anim) ?? false;

export const reactionAnimUrl = (heroId: string, anim: string) =>
  `/assets/reactions/${heroId}/${anim}.webp`;
