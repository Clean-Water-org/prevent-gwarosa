// audio.js — 간단한 BGM 매니저 (한 번에 한 곡만 재생)
// 미니게임 진입 시 playBgm, 종료/이탈 시 stopBgm 호출.

let current = null;
let currentSrc = null;
let baseVolume = 0.4;
let duckTimer = null;

/**
 * BGM 재생. 기존에 재생 중이던 곡은 자동으로 정지한다.
 * 같은 곡이 이미 재생 중이면 다시 시작하지 않는다(씬 리렌더 시 끊김 방지).
 * @param {string} src 오디오 파일 경로
 * @param {object} [opts]
 * @param {number} [opts.volume=0.4]
 * @param {boolean} [opts.loop=true]
 */
export function playBgm(src, { volume = 0.4, loop = true } = {}) {
  baseVolume = volume;
  // 동일 곡이 이미 재생 중이면 그대로 유지 (메인화면처럼 잦은 리렌더 대응)
  if (current && currentSrc === src && !current.paused && !current.ended) {
    if (!duckTimer) current.volume = volume;
    return current;
  }
  stopBgm();
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  // 자동재생 정책에 막히면 조용히 무시 (미니게임은 클릭으로 진입하므로 보통 정상 재생)
  audio.play().catch(() => {});
  current = audio;
  currentSrc = src;
  return audio;
}

/** 현재 재생 중인 BGM 정지. */
export function stopBgm() {
  if (duckTimer) { clearTimeout(duckTimer); duckTimer = null; }
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
    currentSrc = null;
  }
}

/**
 * 재생 중인 BGM 음량을 잠시 낮췄다가 원래대로 복구한다(알림음 등이 잘 들리도록).
 * @param {object} [opts]
 * @param {number} [opts.volume=0.12] 일시적으로 낮출 음량
 * @param {number} [opts.durationMs=900] 복구까지의 시간(ms)
 */
export function duckBgm({ volume = 0.12, durationMs = 900 } = {}) {
  if (!current) return;
  current.volume = Math.min(volume, baseVolume);
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    duckTimer = null;
    if (current) current.volume = baseVolume;
  }, durationMs);
}

/**
 * 일회성 효과음 재생. BGM과 독립적으로 재생되며 겹쳐 재생도 가능하다.
 * @param {string} src 오디오 파일 경로
 * @param {object} [opts]
 * @param {number} [opts.volume=0.6]
 */
export function playSfx(src, { volume = 0.6 } = {}) {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.currentTime = 0;
  // 자동재생 정책에 막히면 조용히 무시
  audio.play().catch(() => {});
  return audio;
}
