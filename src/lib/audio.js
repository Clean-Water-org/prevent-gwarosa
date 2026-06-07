// audio.js — 간단한 BGM 매니저 (한 번에 한 곡만 재생)
// 미니게임 진입 시 playBgm, 종료/이탈 시 stopBgm 호출.

let current = null;
let currentSrc = null;
let baseVolume = 0.4;
let basePlaybackRate = 1;
let duckTimer = null;
let headacheFxActive = false;
let headacheFxTimer = null;

const HEADACHE_BGM_RATE = 0.72;
const HEADACHE_BGM_WOBBLE = 0.035;
const HEADACHE_BGM_VOLUME_MUL = 0.82;

function clearHeadacheFxTimer() {
  if (headacheFxTimer) {
    clearInterval(headacheFxTimer);
    headacheFxTimer = null;
  }
}

function applyHeadacheFxToCurrent() {
  clearHeadacheFxTimer();
  if (!current) return;

  if (!headacheFxActive) {
    current.playbackRate = basePlaybackRate;
    if (!duckTimer) current.volume = baseVolume;
    return;
  }

  let phase = 0;
  const tick = () => {
    if (!current || !headacheFxActive) return;
    phase += 0.35;
    current.playbackRate = HEADACHE_BGM_RATE + Math.sin(phase) * HEADACHE_BGM_WOBBLE;
    if (!duckTimer) current.volume = baseVolume * HEADACHE_BGM_VOLUME_MUL;
  };

  tick();
  headacheFxTimer = setInterval(tick, 350);
}

/**
 * 상태이상에 맞춰 BGM 분위기를 조절한다.
 * 두통(체력 30↓): 재생 속도를 늦추고 음량을 살짝 낮춘 뒤, 미세하게 흔들린다.
 * @param {object} [opts]
 * @param {boolean} [opts.headache=false]
 */
export function syncBgmStatusFx({ headache = false } = {}) {
  headacheFxActive = headache;
  applyHeadacheFxToCurrent();
}

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
  if (current && currentSrc === src && !current.paused && !current.ended) {
    if (!duckTimer) current.volume = volume;
    applyHeadacheFxToCurrent();
    return current;
  }
  stopBgm({ preserveStatusFx: true });
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.playbackRate = basePlaybackRate;
  audio.play().catch(() => {});
  current = audio;
  currentSrc = src;
  applyHeadacheFxToCurrent();
  return audio;
}

/** 현재 재생 중인 BGM 정지. */
export function stopBgm({ preserveStatusFx = false } = {}) {
  if (duckTimer) { clearTimeout(duckTimer); duckTimer = null; }
  clearHeadacheFxTimer();
  if (!preserveStatusFx) headacheFxActive = false;
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
    currentSrc = null;
  }
}

/** BGM 재생 속도 조절 (1 = 기본, 0.75 등으로 느리게). */
export function setBgmPlaybackRate(rate = basePlaybackRate) {
  basePlaybackRate = rate;
  if (!current) return;
  current.playbackRate = rate;
}

/** BGM 재생 속도를 기본값으로 복구. */
export function restoreBgmPlaybackRate() {
  basePlaybackRate = 1;
  if (headacheFxActive) {
    applyHeadacheFxToCurrent();
    return;
  }
  setBgmPlaybackRate(basePlaybackRate);
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
    if (!current) return;
    if (headacheFxActive) {
      current.volume = baseVolume * HEADACHE_BGM_VOLUME_MUL;
      return;
    }
    current.volume = baseVolume;
  }, durationMs);
}

let sfxCtx = null;
function getSfxCtx() {
  if (sfxCtx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    sfxCtx = AC ? new AC() : false;
  }
  return sfxCtx || null;
}

/**
 * 일회성 효과음 재생. BGM과 독립적으로 재생되며 겹쳐 재생도 가능하다.
 * gain > 1 이면 Web Audio 게인으로 1.0(HTMLAudio 한계)을 넘어 더 크게 재생한다.
 * @param {string} src 오디오 파일 경로
 * @param {object} [opts]
 * @param {number} [opts.volume=0.6] 기본 음량(0~1)
 * @param {number} [opts.gain=1] 증폭 배수. 1 초과 시 Web Audio 사용
 */
export function playSfx(src, { volume = 0.6, gain = 1 } = {}) {
  const audio = new Audio(src);
  audio.currentTime = 0;

  if (gain > 1) {
    const ctx = getSfxCtx();
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      try {
        const source = ctx.createMediaElementSource(audio);
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume * gain;
        source.connect(gainNode).connect(ctx.destination);
        audio.play().catch(() => {});
        return audio;
      } catch {
        // Web Audio 실패 시 일반 재생으로 폴백
      }
    }
  }

  audio.volume = Math.min(volume, 1);
  audio.play().catch(() => {});
  return audio;
}

const CLICK_SFX_SRC = "assets/audio/computer-mouse-click.mp3";
export function playClickSfx() {
  playSfx(CLICK_SFX_SRC, { volume: 1.0, gain: 2.5 });
}
