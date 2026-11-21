/** Помощник (Зуба или Слоня) выбирается на заставке нажатием на героя и остаётся на всю игру. */
export type HelperId = 'zuba' | 'slonya';
let activeHelper: HelperId = 'zuba';
export const getActiveHelper = (): HelperId => activeHelper;
export const setActiveHelper = (h: HelperId) => { activeHelper = h; };
