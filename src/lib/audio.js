// audio.js — 간단한 BGM 매니저 (한 번에 한 곡만 재생)
// 미니게임 진입 시 playBgm, 종료/이탈 시 stopBgm 호출.

let current = null;

/**
 * BGM 재생. 기존에 재생 중이던 곡은 자동으로 정지한다.
 * @param {string} src 오디오 파일 경로
 * @param {object} [opts]
 * @param {number} [opts.volume=0.4]
 * @param {boolean} [opts.loop=true]
 */
export function playBgm(src, { volume = 0.4, loop = true } = {}) {
  stopBgm();
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  // 자동재생 정책에 막히면 조용히 무시 (미니게임은 클릭으로 진입하므로 보통 정상 재생)
  audio.play().catch(() => {});
  current = audio;
  return audio;
}

/** 현재 재생 중인 BGM 정지. */
export function stopBgm() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
}
