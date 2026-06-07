const KEY = "gwarosa_v1";
const SETTINGS_KEY = "gwarosa_settings_v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { bgmEnabled: parsed.bgmEnabled !== false };
  } catch {
    return { bgmEnabled: true };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function saveGame(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearGame() {
  localStorage.removeItem(KEY);
}
