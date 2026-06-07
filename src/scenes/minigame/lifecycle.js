let _minigameCleanup = null;

/** 미니게임 씬 이탈 시 window 리스너·타이머 정리 (두통→엔딩 등 cleanup 없이 전환될 때). */
export function setMinigameCleanup(fn) {
  _minigameCleanup = fn;
}

export function cleanupMinigameScene() {
  _minigameCleanup?.();
  _minigameCleanup = null;
}
