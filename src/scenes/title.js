import { el } from "../ui.js";
import {
  playBgm,
  playClickSfx,
  pulseTitleBgmGlitch,
  cleanupTitleBgmFx,
  bindBgmToggleButton,
  isAudioUnlocked,
  onAudioUnlock,
} from "../lib/audio.js";

const TITLE_BGM_SRC = "assets/audio/title-bgm.mp3";

const WINDOW_TITLE_NORMAL = "🏢 overwork_prevention.exe — 출근 준비";
const WINDOW_TITLE_ALTS = [
  "attendance_required.exe",
  "employee_status_unknown.exe",
  "workstation_inactive.exe",
  "return_to_work.exe",
];

const QUESTION_NORMAL = "출근하시겠습니까?";
const QUESTION_ALTS = [
  "출근하십시오.",
  "출근하셔야 합니다.",
  "출근하시겠습ㄴ까?",
];

const TAGLINE_NORMAL = "근무 종료까지 540분";
const TAGLINE_BASE_MINUTES = 540;

const WINDOW_TITLE_GLITCH_MS = 1400;
const QUESTION_GLITCH_MS = 600;
const TAGLINE_GLITCH_MS = 900;

function randomOvertimeMinutes() {
  return Math.floor(randBetween(TAGLINE_BASE_MINUTES + 8, TAGLINE_BASE_MINUTES + 380));
}

function buildTaglineGlitchText() {
  return `예상 근무시간 ${randomOvertimeMinutes()}분`;
}

let titleFxTimers = [];
let titleAudioUnlockOff = null;

export function cleanupTitleFx() {
  titleFxTimers.forEach(clearTimeout);
  titleFxTimers = [];
  titleAudioUnlockOff?.();
  titleAudioUnlockOff = null;
  cleanupTitleBgmFx();
}

function scheduleTitleFx(fn, delayMs) {
  const id = setTimeout(() => {
    titleFxTimers = titleFxTimers.filter((timerId) => timerId !== id);
    fn();
  }, delayMs);
  titleFxTimers.push(id);
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function maybe(probability) {
  return Math.random() < probability;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function setupTitleGlitches({ windowTitleEl, taglineEl, questionEl, crtCard, logoEl }) {
  function fireWindowTitleGlitch() {
    if (!windowTitleEl.isConnected) return;
    pulseTitleBgmGlitch(520);
    windowTitleEl.textContent = pickRandom(WINDOW_TITLE_ALTS);
    scheduleTitleFx(() => {
      if (windowTitleEl.isConnected) windowTitleEl.textContent = WINDOW_TITLE_NORMAL;
    }, WINDOW_TITLE_GLITCH_MS);
  }

  function fireTaglineGlitch() {
    if (!taglineEl.isConnected) return;
    pulseTitleBgmGlitch(780);
    taglineEl.textContent = buildTaglineGlitchText();
    taglineEl.classList.add("title-tagline-glitch");
    scheduleTitleFx(() => {
      if (!taglineEl.isConnected) return;
      taglineEl.textContent = TAGLINE_NORMAL;
      taglineEl.classList.remove("title-tagline-glitch");
    }, TAGLINE_GLITCH_MS);
  }

  function fireQuestionGlitch() {
    if (!questionEl.isConnected) return;
    pulseTitleBgmGlitch(480);
    questionEl.textContent = pickRandom(QUESTION_ALTS);
    questionEl.classList.add("title-question-glitch");
    scheduleTitleFx(() => {
      if (!questionEl.isConnected) return;
      questionEl.textContent = QUESTION_NORMAL;
      questionEl.classList.remove("title-question-glitch");
    }, QUESTION_GLITCH_MS);
  }

  function fireCrtRoll() {
    if (!crtCard.isConnected) return;
    pulseTitleBgmGlitch(160);
    crtCard.classList.add("title-crt-roll");
    scheduleTitleFx(() => {
      if (crtCard.isConnected) crtCard.classList.remove("title-crt-roll");
    }, 90);
  }

  function fireTextJitter() {
    if (!logoEl.isConnected) return;
    pulseTitleBgmGlitch(220);
    logoEl.classList.add("title-jitter-frame");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (logoEl.isConnected) logoEl.classList.remove("title-jitter-frame");
      });
    });
  }

  function runIntroGlitches() {
    scheduleTitleFx(fireWindowTitleGlitch, 120);
    scheduleTitleFx(fireCrtRoll, 220);
    scheduleTitleFx(fireTaglineGlitch, 380);
    scheduleTitleFx(fireQuestionGlitch, 620);
    scheduleTitleFx(fireTextJitter, 840);
  }

  function loopWindowTitleGlitch() {
    scheduleTitleFx(() => {
      if (!windowTitleEl.isConnected) return;
      if (maybe(0.5)) fireWindowTitleGlitch();
      loopWindowTitleGlitch();
    }, randBetween(2800, 5500));
  }

  function loopTaglineGlitch() {
    scheduleTitleFx(() => {
      if (!taglineEl.isConnected) return;
      if (maybe(0.58)) fireTaglineGlitch();
      loopTaglineGlitch();
    }, randBetween(2000, 4200));
  }

  function loopQuestionGlitch() {
    scheduleTitleFx(() => {
      if (!questionEl.isConnected) return;
      if (maybe(0.52)) fireQuestionGlitch();
      loopQuestionGlitch();
    }, randBetween(2200, 4500));
  }

  function loopCrtRoll() {
    scheduleTitleFx(() => {
      if (!crtCard.isConnected) return;
      if (maybe(0.38)) fireCrtRoll();
      loopCrtRoll();
    }, randBetween(2800, 6000));
  }

  function loopTextJitter() {
    scheduleTitleFx(() => {
      if (!logoEl.isConnected) return;
      if (maybe(0.24)) fireTextJitter();
      loopTextJitter();
    }, randBetween(3500, 7500));
  }

  runIntroGlitches();
  loopWindowTitleGlitch();
  loopTaglineGlitch();
  loopQuestionGlitch();
  loopCrtRoll();
  loopTextJitter();
}

function renderTitleSettingsPanel(onClose) {
  const bgmToggle = el("button", {
    class: "title-settings-toggle",
    type: "button",
  });
  bindBgmToggleButton(bgmToggle, {
    onEnable: () => playBgm(TITLE_BGM_SRC, { volume: 0.42 }),
  });

  return el("div", { class: "title-settings-panel", role: "dialog", "aria-label": "설정" }, [
    el("header", { class: "title-settings-head" }, [
      el("strong", { text: "설정" }),
      el("button", {
        class: "title-settings-close",
        type: "button",
        text: "✕",
        "aria-label": "닫기",
        onClick: () => { playClickSfx(); onClose(); },
      }),
    ]),
    el("div", { class: "title-settings-row" }, [
      el("span", { text: "BGM" }),
      bgmToggle,
    ]),
  ]);
}

export function renderTitle(root, state, actions) {
  cleanupTitleFx();
  playBgm(TITLE_BGM_SRC, { volume: 0.42 });

  let settingsOpen = false;
  let settingsPanel = null;
  let settingsBtn = null;
  let settingsWrap = null;
  const menuContent = el("div", { class: "title-menu-content" });

  function closeSettings() {
    settingsOpen = false;
    settingsPanel?.remove();
    settingsPanel = null;
    settingsBtn?.classList.remove("is-active");
  }

  function openSettings() {
    if (settingsOpen) {
      closeSettings();
      return;
    }
    settingsOpen = true;
    settingsBtn?.classList.add("is-active");
    settingsPanel = renderTitleSettingsPanel(closeSettings);
    settingsWrap.append(settingsPanel);
  }

  settingsBtn = el("button", {
    class: "title-menu-settings",
    type: "button",
    text: "설정",
    onClick: () => { playClickSfx(); openSettings(); },
  });

  settingsWrap = el("div", { class: "title-menu-settings-wrap" }, [settingsBtn]);

  const windowTitleEl = el("span", { text: WINDOW_TITLE_NORMAL });
  const taglineEl = el("p", { class: "title-tagline", text: TAGLINE_NORMAL });
  const questionEl = el("p", { class: "title-question", text: QUESTION_NORMAL });
  const logoEl = el("h1", { class: "title-logo", text: "과로사 방지" });
  const startGate = el("button", {
    class: "title-start-gate",
    type: "button",
    "aria-label": "화면을 클릭하여 시작",
  }, [
    el("span", { class: "title-audio-hint-mark", text: "▶" }),
    el("span", { class: "title-audio-hint-text", text: "화면을 클릭하세요" }),
    el("span", { class: "title-audio-hint-sub", text: "클릭 후 출근·도움말 이용 가능" }),
  ]);

  const titleLocked = !isAudioUnlocked();

  const mainBtn = el("button", {
    class: "title-main-button",
    type: "button",
    ...(titleLocked ? { disabled: "" } : {}),
    onClick: () => { playClickSfx(); actions.go("setup"); },
  }, [
    el("span", { class: "play-mark", text: "▶" }),
    el("span", { text: "출근하기" }),
  ]);

  const helpBtn = el("button", {
    class: "title-help-button",
    type: "button",
    ...(titleLocked ? { disabled: "" } : {}),
    text: "도움말",
    onClick: () => { playClickSfx(); actions.go("onboarding"); },
  });

  const buttonsWrap = el("div", { class: "title-buttons-wrap" }, [
    el("div", { class: "title-buttons" }, [mainBtn, helpBtn]),
    startGate,
  ]);

  function unlockTitle() {
    if (!buttonsWrap.isConnected) return;
    mainBtn.removeAttribute("disabled");
    helpBtn.removeAttribute("disabled");
    startGate.hidden = true;
    startGate.setAttribute("aria-hidden", "true");
    buttonsWrap.classList.remove("is-locked");
  }

  if (titleLocked) buttonsWrap.classList.add("is-locked");
  else unlockTitle();

  const crtCard = el("div", { class: "title-crt-card" }, [
    logoEl,
    taglineEl,
    questionEl,
    buttonsWrap,
    el("div", { class: "px-scanline title-crt-scanline" }),
    el("div", { class: "title-crt-noise" }),
    el("div", { class: "px-glare title-crt-glare" }),
  ]);

  titleAudioUnlockOff?.();
  titleAudioUnlockOff = onAudioUnlock(unlockTitle);

  root.append(
    el("section", { class: "title-menu-screen" }, [
      el("div", { class: "title-game-window" }, [
        el("header", { class: "title-window-bar" }, [
          windowTitleEl,
          el("div", { class: "window-buttons" }, [
            el("span", { text: "_" }),
            el("span", { text: "▢" }),
            el("span", { text: "✕" }),
          ]),
        ]),
        el("nav", { class: "title-menu-bar" }, [
          settingsWrap,
          el("strong", { text: "v0.3" }),
        ]),
        menuContent,
      ]),
    ]),
  );

  menuContent.append(crtCard);

  setupTitleGlitches({ windowTitleEl, taglineEl, questionEl, crtCard, logoEl });
}
