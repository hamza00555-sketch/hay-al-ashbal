const KEY = 'hay_tut_v1';
export const isTutorialDone = () => localStorage.getItem(KEY) === '1';
export const markTutorialDone = () => localStorage.setItem(KEY, '1');
export const resetTutorial = () => localStorage.removeItem(KEY);
