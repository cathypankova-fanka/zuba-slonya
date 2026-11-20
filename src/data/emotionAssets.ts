/** Какие картинки эмоций есть у героев: определяется по файлам public/assets/emotions/<герой>/<эмоция>.webp */
export const HERO_EMOTIONS: Record<string, string[]> = {};
for (const p of Object.keys(import.meta.glob('/public/assets/emotions/*/*.webp'))) {
  const parts = p.split('/');
  (HERO_EMOTIONS[parts[4]] ??= []).push(parts[5].replace('.webp', ''));
}

export const EMOTION_HEROES: string[] = Object.keys(HERO_EMOTIONS);

export const hasEmotion = (heroId: string, emotion: string) =>
  HERO_EMOTIONS[heroId]?.includes(emotion) ?? false;

export const emotionUrl = (heroId: string, emotion: string) =>
  `/assets/emotions/${heroId}/${emotion}.webp`;
