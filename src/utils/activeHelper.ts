/** Помощник (Зуба или Слоня) выбирается случайно один раз при открытии всей игры */
export type HelperId = 'zuba' | 'slonya';
const activeHelper: HelperId = Math.random() < 0.5 ? 'zuba' : 'slonya';
export const getActiveHelper = (): HelperId => activeHelper;
