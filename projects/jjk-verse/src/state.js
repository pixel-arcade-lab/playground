// Things that last longer than one level: lives, and best results saved in the browser.

export const MAX_LIVES = 3;

export const state = {
  lives: MAX_LIVES,
  // Start the whole game again (after a game over, or from the title screen)
  newGame() { this.lives = MAX_LIVES; },
};

// Best results per level, kept in the browser's local storage (it can be unavailable, e.g. private windows)
const KEY = 'jjkverse.progress';
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function saveLevelResult(level, talismans, seconds) {
  const all = loadProgress();
  const old = all[level] || {};
  all[level] = {
    done: true,
    talismans: Math.max(old.talismans || 0, talismans),
    bestTime: old.bestTime ? Math.min(old.bestTime, seconds) : seconds,
  };
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* not saved; the game still works */ }
  return all[level];
}
