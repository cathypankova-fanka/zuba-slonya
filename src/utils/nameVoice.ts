import nameVoices from '../data/nameVoices.json';
import { isVoiceEnabled, playVoice } from './voice';

const MAP = nameVoices as Record<string, string>;
let installed = false;

/** Озвучивает название выбранного предмета (продукт, цвет, штамп…) голосом помощника. */
let lastSaid = { label: '', at: 0 };
export function sayName(label: string | null | undefined): boolean {
  if (!label) return false;
  const id = MAP[label.trim()];
  if (!id) return false;
  const now = Date.now();
  if (lastSaid.label === label && now - lastSaid.at < 700) return true; // защита от двойного вызова (касание + клик)
  lastSaid = { label, at: now };
  return playVoice(id, isVoiceEnabled(), undefined, 'replace');
}

/**
 * Один общий обработчик: любая кнопка с aria-label/title из словаря (названия продуктов, цветов и т. д.)
 * называется помощником при нажатии. Не нужно править каждую игру отдельно.
 */
export function installNameVoice(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener(
    'click',
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[aria-label],[title]') as HTMLElement | null;
      if (!el) return;
      sayName(el.getAttribute('aria-label') || el.getAttribute('title'));
    },
    true,
  );
}
