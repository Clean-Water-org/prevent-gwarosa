import { el, renderNarrationPopup } from "../ui.js";
import { formatTime, applyDelta, checkEnding, normalizeLogEntry, addLogEntry } from "../state.js";
import {
  bossMainEvents,
  chatPool,
  colleagueMainEvents,
  phoneCallPool,
  positiveMainEvents,
} from "../data/events.js";
import { items } from "../data/items.js";
import { renderMiniGameBriefing } from "./minigame/briefing.js";
import { getCurrentMiniGame, getMiniGameBriefingKey } from "./minigame/flow.js";

let _notifPanel = null;
let _spawnTimeout = null;
let _localWorkload = 0;
let _clockInterval = null;
let _phaseTimeout = null;
let _phoneTimeout = null;
let _phoneOverlay = null;
let _phoneRingAudio = null;
let _mainEventTimeout = null;
let _mainEventOverlay = null;
let _statusEventOverlay = null;
let _snoozedChats = [];
let _nextBossTaskTimerPenalty = 0;

const STATUS_EVENT_CONFIGS = {
  burnout: {
    title: "번아웃",
    kicker: "스트레스 한계",
    lines: [
      "머리가 하얘졌다. 방금 하던 일을 다시 확인해야 했다.",
      "근무 시간이 10분 사라졌다.",
    ],
    logCause: "번아웃 증상이 왔다. 잠깐 멍하니 있었다.",
    timerLabel: "번아웃",
  },
  headache: {
    title: "두통",
    kicker: "체력 부족",
    lines: [
      "관자놀이가 지끈거린다. 화면을 잠깐 놓쳤다.",
      "근무 시간이 10분 사라졌다.",
    ],
    logCause: "두통이 왔다. 잠깐 쉬어야 했다.",
    timerLabel: "두통",
  },
};

const MAIN_CLOCK_TICK_MS = 1000;
const CHAT_NOTIFICATION_SOUND_SRC = "assets/audio/messenger-notification.mp3";
const MAIN_PHASE_DURATIONS_SEC = [35, 35, 40, 40];
const PHONE_CHANCE_BY_PHASE = [0.75, 0.75, 0.75, 0.75];
const PHONE_RING_SECONDS = 12;
const MAIN_EVENT_CHANCE = 0.75;
const MAIN_EVENT_DELAY_MS = 4500;
const CHAT_READ_MINUTES = {
  "boss-task": 7,
  "boss-praise": 2,
  "colleague-help": 6,
  "colleague-chat": 4,
  "colleague-offer": 3,
  notice: 2,
};
const CHAT_SNOOZE_MINUTES = 2;
const CHAT_IGNORE_MINUTES = 1;
const mainPhaseStarts = new Map();
const phonePlans = new Map();
const mainEventPlans = new Map();

const handoverNotes = [
  "업무량은 100에서 시작합니다. 18시 전에 모두 처리하면 퇴근할 수 있습니다.",
  "스트레스가 100이 되면 더 이상 버틸 수 없습니다. 적절히 관리하세요.",
  "체력이 0이 되면 업무를 진행할 수 없습니다. 무리하지 마세요.",
  "상사마다 성향이 다릅니다. 관찰하면 패턴을 찾을 수 있습니다.",
  "메신저는 자주 확인하는 것이 좋습니다. 답장이 늦어질수록 업무가 늘어날 수 있습니다.",
  "아이템은 필요할 때 사용하세요. 아껴둘 이유는 없습니다.",
  "미니게임을 성공하면 업무량을 크게 줄일 수 있습니다.",
];

let stopHandoverGuide = null;

export function renderMainWork(root, state, actions) {
  cleanupMainWorkSystems();
  stopHandoverGuide?.();

  const startChats = () => {
    const monitorEl = screen.querySelector(".main-work-monitor-screen");
    startChatNotifications(state, actions, monitorEl ?? screen);
    startMainPhaseTimer(state, actions);
    startPhoneSystem(screen, state, actions);
    startMainEventSystem(screen, state, actions);
  };

  const intranetPanel = renderIntranetWindow();
  intranetPanel.style.display = "none";

  let intranetBtn;
  const toggleIntranet = () => {
    const willOpen = intranetPanel.style.display === "none";
    intranetPanel.style.display = willOpen ? "" : "none";
    intranetBtn?.classList.toggle("active", willOpen);
  };

  const firstTime = !state.flags?.handoverGuideSeen;

  const screen = el("section", { class: "main-work-screen" }, [
    el("div", { class: "main-work-room" }, [
      el("div", { class: "main-work-wall-note" }, [
        el("strong", { text: "TO DO" }),
        el("span", { text: "보고서" }),
        el("span", { text: "회의" }),
      ]),
      el("div", { class: "main-work-monitor" }, [
        el("div", { class: "main-work-monitor-camera" }),
        el("div", { class: "main-work-monitor-screen" }, [
          renderMainWorkHud(state, actions),
          el("main", { class: "main-work-center" }, [
            renderDesktopDocuments(() => screen, firstTime, actions, startChats),
            intranetPanel,
          ]),
          renderRecentLogPanel(state, actions),
          renderTaskbar(toggleIntranet, (btn) => { intranetBtn = btn; }),
        ]),
      ]),
      el("div", { class: "main-work-monitor-neck" }),
      el("div", { class: "main-work-monitor-base" }),
      el("div", { class: "main-work-desk" }, [
        el("div", { class: "main-work-keyboard" }),
        el("div", { class: "main-work-mouse" }),
        el("div", { class: "main-work-coffee" }),
      ]),
    ]),
  ]);

  root.append(screen);

  if (state.flags?.pendingMinigameBriefing) {
    const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
    const game = getCurrentMiniGame(state);
    renderMiniGameBriefing(monitorScreen, state, {
      onStart: () => {
        actions.mutateState((draft) => {
          const nextGame = getCurrentMiniGame(draft);
          draft.flags.pendingMinigameBriefing = false;
          draft.flags.minigameBriefingKey = getMiniGameBriefingKey(draft, nextGame.id);
          draft.scene = "minigame";
          return draft;
        });
      },
    }, game, "overlay");
    return;
  }

  const guideSeen = Boolean(state.flags?.handoverGuideSeen);
  if (!guideSeen) {
    requestAnimationFrame(() => {
      stopHandoverGuide = playHandoverGuide(screen, actions, startChats);
    });
  } else {
    const pendingStatus = getPendingStatusEvent(state);
    if (pendingStatus) {
      const monitorEl = screen.querySelector(".main-work-monitor-screen") ?? screen;
      showStatusEventPopup(pendingStatus, state, monitorEl, actions);
    } else {
      startChats();
      startMainClock(screen, state, actions);
    }
  }
}

function renderMainWorkHud(state, actions) {
  const { workload, stress, health } = state.stats;
  const statusEffects = getActiveStatusEffects(state);
  return el("header", { class: "main-work-hud" }, [
    el("div", { class: "main-work-hud-stats" }, [
      renderHudStat("💼", "업무량", workload, "workload"),
      renderHudStat("⚠", "스트레스", stress, "stress"),
      renderHudStat("❤", "체력", health, "health"),
    ]),
    ...(statusEffects.length > 0
      ? [el("div", { class: "main-work-hud-status-effects" }, statusEffects.map(renderStatusBadge))]
      : []),
    el("div", { class: "main-work-hud-controls" }, [
      renderMainWorkItemHub(state, actions),
      renderPhoneButton(),
      el("button", { class: "main-work-gear", type: "button", "aria-label": "설정", text: "⚙" }),
      el("div", { class: "main-work-hud-time" }, [
        el("strong", { class: "main-work-current-time", text: formatTime(state.gameMinute) }),
        el("span", { text: "2026.06.05 금요일" }),
      ]),
    ]),
  ]);
}

function getActiveStatusEffects(state) {
  const effects = [];
  if (state.stats.stress >= 70) effects.push({ id: "burnout", label: "번아웃", icon: "⚠" });
  if (state.stats.health <= 30) effects.push({ id: "headache", label: "두통", icon: "❤" });
  if ((state.counters?.coffeeStreak ?? 0) >= 2) effects.push({ id: "coffee", label: "손떨림", icon: "☕" });
  return effects;
}

function renderStatusBadge({ id, label, icon }) {
  return el("span", { class: `main-work-status-badge main-work-status-badge-${id}` }, [
    el("span", { class: "main-work-status-badge-icon", text: icon }),
    el("span", { text: label }),
  ]);
}

function renderPhoneButton() {
  return el("button", {
    class: "main-work-phone-button",
    type: "button",
    title: "휴대폰",
    "aria-label": "휴대폰",
    "aria-live": "polite",
    text: "☎",
  }, [
    el("span", { class: "main-work-phone-badge", text: "!" }),
  ]);
}

function renderHudStat(icon, label, value, type) {
  return el("section", { class: `main-work-stat main-work-stat-${type}` }, [
    el("div", { class: "main-work-stat-meta" }, [
      el("span", { class: "main-work-stat-icon", text: icon }),
      el("span", { text: label }),
      el("strong", { text: String(value) }),
    ]),
    el("div", { class: "main-work-stat-bar" }, [
      el("i", { style: `width:${value}%` }),
    ]),
  ]);
}

function renderMainWorkItemHub(state, actions) {
  const canUseItems = Boolean(state.flags?.handoverGuideSeen);
  if (!canUseItems) {
    return el("div", { class: "main-work-item-hub is-locked" }, [
      el("button", {
        class: "main-work-item-toggle",
        type: "button",
        disabled: "",
        title: "업무 시작 후 사용 가능",
      }, [
        el("span", { class: "main-work-item-bag", text: "🎒" }),
        el("span", { text: "아이템" }),
        el("span", { class: "main-work-item-caret", text: "▾" }),
      ]),
    ]);
  }

  const inventory = state.inventory ?? [];
  const children = inventory.length
    ? inventory.map((itemId, index) => renderMainWorkItemButton(itemId, index, actions))
    : [el("p", { class: "main-work-empty-items", text: "아이템 없음" })];

  return el("details", { class: "main-work-item-hub" }, [
    el("summary", { class: "main-work-item-toggle" }, [
      el("span", { class: "main-work-item-bag", text: "🎒" }),
      el("span", { text: "아이템" }),
      el("span", { class: "main-work-item-caret", text: "▾" }),
    ]),
    el("div", { class: "main-work-item-popover" }, children),
  ]);
}

function renderMainWorkItemButton(itemId, index, actions) {
  const item = items[itemId];
  if (!item) return el("span", { class: "main-work-empty-items", text: "알 수 없는 아이템" });

  const actionLabel = itemId === "coffee" ? "커피 마시기" : `${item.label} 사용`;
  return el("button", {
    class: "main-work-item-button",
    type: "button",
    title: `${actionLabel} · ${item.effect}`,
    onClick: () => actions.useItem(index),
  }, [
    el("span", { class: "main-work-item-icon", text: item.icon }),
    el("span", { class: "main-work-item-copy" }, [
      el("strong", { text: actionLabel }),
      el("small", { text: item.effect }),
    ]),
  ]);
}

function renderRecentLogPanel(state, actions) {
  const logs = (state.log ?? []).map((entry) => normalizeLogEntry(state, entry));
  const collapsed = Boolean(state.flags?.recentLogCollapsed);
  const title = `📋 업무 일지 (${logs.length})`;
  const logList = collapsed
    ? null
    : el("div", { class: "main-work-recent-log-list" }, logs.length
      ? logs.map(renderRecentLogEntry)
      : [el("p", { class: "main-work-recent-log-empty", text: "아직 기록된 변화가 없습니다." })]);

  if (logList) {
    requestAnimationFrame(() => {
      logList.scrollTop = logList.scrollHeight;
    });
  }

  return el("aside", {
    class: `main-work-recent-log${collapsed ? " is-collapsed" : ""}`,
    "aria-label": "업무 일지",
  }, [
    el("header", { class: "main-work-recent-log-head" }, [
      el("strong", { text: title }),
      el("button", {
        class: "main-work-recent-log-toggle",
        type: "button",
        text: collapsed ? "펼치기" : "접기",
        onClick: () => actions.mutateState((draft) => {
          draft.flags.recentLogCollapsed = !Boolean(draft.flags?.recentLogCollapsed);
          return draft;
        }),
      }),
    ]),
    ...(collapsed
      ? []
      : [logList]),
  ]);
}

function renderRecentLogEntry(entry) {
  return el("article", { class: "main-work-recent-log-entry" }, [
    el("span", { class: "main-work-recent-log-icon", text: entry.icon ?? "🔵" }),
    el("div", { class: "main-work-recent-log-copy" }, [
      el("time", { text: entry.time ?? "" }),
      el("p", { text: entry.cause ?? "기록된 행동" }),
      ...(entry.effects ?? []).map((effect) => el("span", { text: effect })),
    ]),
  ]);
}

function renderIntranetWindow() {
  return el("section", { class: "main-work-intranet" }, [
    el("header", { class: "main-work-intranet-tabs" }, [
      el("strong", { class: "main-work-intranet-logo", text: "DAEHAN INTRANET" }),
      el("nav", { class: "main-work-tab-menu" }, [
        el("span", { text: "마이페이지" }),
        el("span", { text: "전자결재" }),
        el("span", { text: "게시판" }),
        el("span", { text: "자료실" }),
      ]),
    ]),
    el("div", { class: "main-work-intranet-body" }, [
      el("section", { class: "main-work-notice-panel" }, [
        el("div", { class: "main-work-notice-head" }, [
          el("h2", { text: "공지사항" }),
          el("span", { class: "main-work-notice-badge", text: "사내포털" }),
        ]),
        el("ul", {}, [
          el("li", { text: "[중요] 2분기 업무 효율화 캠페인 안내" }),
          el("li", { text: "사내 보안 점검으로 인한 문서 서버 순단 예정" }),
          el("li", { text: "복지포인트 신청 마감: 금일 18:00" }),
          el("li", { text: "회의실 예약 시스템 업데이트 안내" }),
        ]),
      ]),
      el("section", { class: "main-work-schedule-panel" }, [
        el("h2", { text: "오늘의 일정" }),
        el("div", { class: "main-work-schedule-list" }, [
          renderSchedule("09:30", "주간 업무 공유"),
          renderSchedule("11:00", "전자결재 검토"),
          renderSchedule("15:00", "전체 회의"),
          renderSchedule("17:30", "보고서 초안 제출"),
        ]),
      ]),
    ]),
  ]);
}

function renderDesktopDocuments(getScreen, firstTime, actions, onStartChats) {
  return el("div", { class: "main-work-desktop-icons" }, [
    el("button", {
      class: "main-work-handover-doc-icon",
      title: "인수인계서.docx",
      onClick: () => openHandoverPopup(getScreen(), actions, stopHandoverGuide, firstTime, onStartChats),
    }, [
      el("span", { class: "main-work-doc-paper", text: "DOC" }),
      el("strong", { text: "인수인계서.docx" }),
    ]),
  ]);
}

function playHandoverGuide(screen, actions, onStartChats) {
  const timers = [];
  const narration = renderNarrationPopup([
    "오전 9:00. 출근 시작이다.",
    "일단... 인수인계서부터 살펴볼까?",
  ], {
    className: "main-work-guide-narration",
    typingSpeed: 42,
    lineDelay: 180,
    showPrompt: false,
    actions: [{
      className: "main-work-guide-skip",
      text: "Skip · 바로 게임 시작",
      onClick: () => startGameFromGuide(),
    }],
  });
  let cancelHandoverPopup = null;
  const guideLayer = el("div", { class: "main-work-guide-layer" }, [
    narration.node,
    el("div", { class: "main-work-fake-cursor", text: "🖱️" }),
  ]);
  const cursor = guideLayer.querySelector(".main-work-fake-cursor");
  screen.append(guideLayer);

  const startX = Math.max(24, window.innerWidth * 0.68);
  const startY = Math.max(24, window.innerHeight * 0.76);
  cursor.style.transform = `translate(${startX}px, ${startY}px) scale(1)`;

  timers.push(window.setTimeout(() => {
    const documentIcon = screen.querySelector(".main-work-handover-doc-icon");
    if (!documentIcon) return;
    const rect = documentIcon.getBoundingClientRect();
    const x = rect.left + rect.width * 0.66;
    const y = rect.top + rect.height * 0.56;
    cursor.style.setProperty("--main-work-cursor-target", `translate(${x}px, ${y}px)`);
    cursor.classList.add("moving");
    cursor.style.transform = `translate(${x}px, ${y}px) scale(1)`;
  }, 1700));

  timers.push(window.setTimeout(() => { cursor.classList.add("clicking"); }, 2750));

  timers.push(window.setTimeout(() => {
    cursor.classList.remove("clicking");
    cancelHandoverPopup = openHandoverPopup(screen, actions, clearGuideLayer, true, onStartChats, {
      autoCloseMs: 5600,
    });
  }, 2950));

  function clearGuideLayer() {
    for (const timer of timers) window.clearTimeout(timer);
    cancelHandoverPopup?.();
    cancelHandoverPopup = null;
    narration.stop();
    guideLayer.remove();
    if (stopHandoverGuide === clearGuideLayer) stopHandoverGuide = null;
  }

  function startGameFromGuide() {
    clearGuideLayer();
    actions.mutateState((draft) => {
      draft.flags.handoverGuideSeen = true;
      draft.gameMinute = 9 * 60;
      return draft;
    });
  }

  return clearGuideLayer;
}

function openHandoverPopup(screen, actions, onClose, playIntro = false, onStartChats = null, options = {}) {
  const existing = screen.querySelector(".main-work-handover-overlay");
  if (existing) { onClose?.(); return; }
  let autoCloseTimer = null;

  const close = () => {
    if (autoCloseTimer) {
      window.clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    overlay.remove();
    onClose?.();
    if (playIntro) {
      playClockCutscene(screen, () => {
        actions.mutateState((draft) => {
          draft.flags.handoverGuideSeen = true;
          draft.gameMinute = 9 * 60;
          return draft;
        });
      });
    } else {
      actions.mutateState((draft) => {
        draft.flags.handoverGuideSeen = true;
        return draft;
      });
    }
  };

  const overlay = el("div", { class: "main-work-handover-overlay" }, [
    el("article", { class: "main-work-handover-card" }, [
      el("div", { class: "main-work-handover-title", text: "📄 업무 인수인계서" }),
      el("div", { class: "main-work-handover-meta" }, [
        el("span", { text: "작성자: 전임자" }),
        el("span", { class: "main-work-handover-meta-sep", text: "ㅣ" }),
        el("span", { text: "열람 권장" }),
      ]),
      el("div", { class: "main-work-handover-rule" }),
      el("ol", { class: "main-work-handover-items" }, handoverNotes.map((note) =>
        el("li", { class: "main-work-handover-item", text: note }),
      )),
      el("div", { class: "main-work-handover-rule" }),
      el("p", { class: "main-work-handover-closing", text: "마지막으로. 아직 늦지 않았습니다." }),
      el("button", {
        class: "main-work-handover-close",
        text: "알겠습니다 (아마도)",
        onClick: close,
      }),
    ]),
  ]);

  screen.append(overlay);
  if (options.autoCloseMs) {
    autoCloseTimer = window.setTimeout(close, options.autoCloseMs);
  }

  return () => {
    if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
    overlay.remove();
  };
}

function playClockCutscene(screen, onDone) {
  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  const narration = renderNarrationPopup(["..."], { typingSpeed: 480, showPrompt: false });
  screen.append(narration.node);

  const timers = [];
  timers.push(setTimeout(() => {
    narration.stop();
    narration.node.remove();

    const display = el("div", { class: "main-work-clock-display" });
    const overlay = el("div", { class: "main-work-clock-cutscene" }, [display]);
    monitorScreen.append(overlay);

    const clockSteps = [
      { text: "08:58", ms: 0,    step: "time" },
      { text: "08:59", ms: 1000, step: "time" },
      { text: "09:00", ms: 2000, step: "time" },
      { text: "업무 시작", ms: 3200, step: "label" },
    ];
    for (const { text, ms, step } of clockSteps) {
      timers.push(setTimeout(() => { display.textContent = text; display.dataset.step = step; }, ms));
    }
    timers.push(setTimeout(onDone, 4400));
  }, 3200));
}

function renderSchedule(time, text) {
  return el("p", { class: "main-work-schedule-item" }, [
    el("strong", { text: time }),
    el("span", { text }),
  ]);
}

function renderTaskbar(onIntranetClick, registerIntranetBtn) {
  const intranetBtn = el("span", {
    class: "main-work-task-icon",
    text: "사내포털",
    onClick: onIntranetClick,
  });
  registerIntranetBtn?.(intranetBtn);

  return el("footer", { class: "main-work-taskbar" }, [
    el("div", { class: "main-work-taskbar-left" }, [
      el("span", { class: "main-work-start-icon", text: "⊞" }),
      el("span", { class: "main-work-task-icon", text: "검색" }),
      el("span", { class: "main-work-task-icon", text: "📁" }),
      intranetBtn,
    ]),
    el("div", { class: "main-work-taskbar-right" }, [
      el("span", { class: "main-work-task-clock", text: "AM 09:00" }),
    ]),
  ]);
}

// ── 채팅 알림 시스템 ─────────────────────────────────────────

function cleanupMainWorkSystems() {
  cleanupChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  cleanupPhoneSystem();
  cleanupMainEventSystem();
  cleanupStatusEventSystem();
}

function cleanupStatusEventSystem() {
  if (_statusEventOverlay) {
    _statusEventOverlay.remove();
    _statusEventOverlay = null;
  }
}

function cleanupChatSystem() {
  if (_notifPanel) { _notifPanel.remove(); _notifPanel = null; }
  if (_spawnTimeout) { clearTimeout(_spawnTimeout); _spawnTimeout = null; }
  _nextBossTaskTimerPenalty = 0;
  _snoozedChats = [];
}

function pauseChatSystem() {
  if (_spawnTimeout) { clearTimeout(_spawnTimeout); _spawnTimeout = null; }
  if (_notifPanel) {
    _notifPanel.querySelectorAll(".chat-notif-timer-bar").forEach((bar) => {
      bar.style.animationPlayState = "paused";
    });
  }
}

function cleanupMainClock() {
  if (_clockInterval) {
    clearInterval(_clockInterval);
    _clockInterval = null;
  }
}

function cleanupMainPhaseTimer() {
  if (_phaseTimeout) {
    clearTimeout(_phaseTimeout);
    _phaseTimeout = null;
  }
}

function cleanupPhoneSystem() {
  if (_phoneTimeout) {
    clearTimeout(_phoneTimeout);
    _phoneTimeout = null;
  }
  if (_phoneOverlay) {
    _phoneOverlay.remove();
    _phoneOverlay = null;
  }
  stopPhoneRingAudio();
}

function cleanupMainEventSystem() {
  if (_mainEventTimeout) {
    clearTimeout(_mainEventTimeout);
    _mainEventTimeout = null;
  }
  if (_mainEventOverlay) {
    _mainEventOverlay.remove();
    _mainEventOverlay = null;
  }
}

function getPendingStatusEvent(state) {
  if (!state.flags?.handoverGuideSeen) return null;
  const triggered = state.flags?.statusEvents ?? {};
  if (state.stats.health <= 30 && !triggered.headache) return "headache";
  if (state.stats.stress >= 70 && !triggered.burnout) return "burnout";
  return null;
}

function showStatusEventPopup(type, state, container, actions) {
  if (_statusEventOverlay) return;
  const config = STATUS_EVENT_CONFIGS[type];
  if (!config) return;

  const openedAt = Date.now();

  const close = () => {
    _statusEventOverlay?.remove();
    _statusEventOverlay = null;

    const phaseIndex = getMainPhaseIndex(state);
    const phaseKey = getMainPhaseKey(state, phaseIndex);
    const startedAt = mainPhaseStarts.get(phaseKey);
    if (startedAt) mainPhaseStarts.set(phaseKey, startedAt + (Date.now() - openedAt));

    let pendingEnding = null;
    actions.mutateState((draft) => {
      if (!draft.flags.statusEvents) draft.flags.statusEvents = {};
      draft.flags.statusEvents[type] = true;
      draft.gameMinute += 10;
      addLogEntry(draft, {
        cause: config.logCause,
        delta: { gameMinute: 10 },
        icon: "🔴",
      });
      pendingEnding = checkEnding(draft);
      return draft;
    });

    if (pendingEnding) actions.finishWith(pendingEnding);
  };

  _statusEventOverlay = el("div", { class: "main-event-overlay" }, [
    el("article", { class: "main-event-card main-event-common", role: "dialog", "aria-modal": "true" }, [
      el("header", { class: "main-event-titlebar" }, [
        el("div", { class: "main-event-source" }, [
          el("span", { class: "main-event-diamond", text: "◆" }),
          el("span", { text: "상태이상" }),
        ]),
        el("time", { class: "main-event-timer", text: config.timerLabel }),
      ]),
      el("section", { class: "main-event-body" }, [
        el("p", { class: "main-event-kicker", text: config.kicker }),
        el("h2", { text: config.title }),
        ...config.lines.map((line) => el("p", { class: "main-event-copy", text: line })),
        el("div", { class: "main-event-choice-grid" }, [
          el("button", {
            class: "main-event-choice main-event-choice-accept",
            type: "button",
            onClick: close,
          }, [
            el("strong", { text: "확인" }),
            el("span", { class: "main-event-preview" }, [
              el("span", { class: "main-event-chip main-event-chip-time", text: "시간 +10분" }),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]);

  container.append(_statusEventOverlay);
}

function startMainPhaseTimer(state, actions) {
  cleanupMainPhaseTimer();
  const phaseIndex = getMainPhaseIndex(state);
  const durationSec = MAIN_PHASE_DURATIONS_SEC[phaseIndex];
  if (!durationSec) return;

  const phaseKey = getMainPhaseKey(state, phaseIndex);
  const phaseStartedAt = mainPhaseStarts.get(phaseKey) ?? Date.now();
  mainPhaseStarts.set(phaseKey, phaseStartedAt);
  const remainingMs = Math.max(0, (durationSec * 1000) - (Date.now() - phaseStartedAt));

  _phaseTimeout = setTimeout(() => {
    if (state.scene !== "main") return;
    cleanupMainWorkSystems();
    actions.mutateState((draft) => {
      draft.flags.pendingMinigameBriefing = true;
      return draft;
    });
  }, remainingMs);
}

function getMainPhaseIndex(state) {
  return Math.max(0, Math.min(MAIN_PHASE_DURATIONS_SEC.length - 1, state.minigameRound ?? 0));
}

function getMainPhaseKey(state, phaseIndex) {
  return `${state.flags?.runId ?? "default"}:${phaseIndex}`;
}

function startMainEventSystem(screen, state, actions) {
  cleanupMainEventSystem();
  const phaseIndex = getMainPhaseIndex(state);
  if (phaseIndex === 0 || state.counters?.mainPhaseEventUsed === phaseIndex) return;

  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  const plan = getMainEventPlan(state, phaseIndex);
  if (!plan.event || plan.status === "done") return;

  if (plan.status === "opening") {
    openMainEventPopup(monitorScreen, state, actions, plan);
    return;
  }

  const delayMs = Math.max(0, plan.openAt - Date.now());
  _mainEventTimeout = setTimeout(() => openMainEventPopup(monitorScreen, state, actions, plan), delayMs);
}

function getMainEventPlan(state, phaseIndex) {
  const key = getMainPhaseKey(state, phaseIndex);
  let plan = mainEventPlans.get(key);
  const forcedEvent = selectForcedMainEvent(state);
  if (plan) {
    if (forcedEvent && plan.status !== "done" && plan.event?.id !== forcedEvent.id) {
      plan.event = forcedEvent;
      plan.openAt = Date.now() + 600;
      plan.status = "waiting";
    } else if (!plan.event && plan.status === "done" && state.flags?.nextBossOrderBoost === true && Math.random() < 0.3) {
      plan.event = getBossMainEvent("sudden-order");
      plan.openAt = Date.now() + 600;
      plan.status = "waiting";
    }
    return plan;
  }

  const event = forcedEvent ?? selectMainEvent(state, phaseIndex);
  plan = {
    phaseIndex,
    event,
    openAt: Date.now() + MAIN_EVENT_DELAY_MS,
    status: event ? "waiting" : "done",
  };
  mainEventPlans.set(key, plan);
  return plan;
}

function selectMainEvent(state, phaseIndex) {
  if (Math.random() >= MAIN_EVENT_CHANCE) return null;

  const bossOrderChance = getBossOrderChance(state);
  if (Math.random() < bossOrderChance) return getBossMainEvent("sudden-order");

  if (canHiddenBreak(state) && Math.random() < 0.35) return getBossMainEvent("hidden-break");
  if (Math.random() < 0.35) return getColleagueMainEvent("colleague-help");

  const generalPool = [
    { event: getBossMainEvent("sudden-order"), weight: 18 + (phaseIndex * 4) },
    { event: getColleagueMainEvent("colleague-dump"), weight: 24 },
    { event: getColleagueMainEvent("desk-chat"), weight: 18 },
    { event: getColleagueMainEvent("ginseng-gift"), weight: 14 },
    { event: getPositiveMainEvent("small-bonus"), weight: 12 },
  ];
  return pickWeightedEvent(generalPool);
}

function selectForcedMainEvent(state) {
  if (state.flags?.badMailInterview) return getBossMainEvent("boss-interview");
  if ((state.counters?.failures ?? 0) >= 2) return getBossMainEvent("public-shame");
  if ((state.counters?.successStreak ?? 0) >= 2) return getBossMainEvent("public-praise");
  if (state.flags?.forcedBossOrder) return getBossMainEvent("sudden-order");
  return null;
}

function getBossOrderChance(state) {
  const bossOrderWeight = (state.boss?.weights?.order ?? 20) / 100;
  const boost = (state.flags?.hiddenBreakPenalty ? 0.3 : 0) + (state.flags?.nextBossOrderBoost === true ? 0.3 : 0);
  return Math.min(0.95, bossOrderWeight + boost);
}

function canHiddenBreak(state) {
  return state.boss?.id === "smart-lazy" || state.boss?.id === "clumsy-lazy";
}

function pickWeightedEvent(entries) {
  const available = entries.filter((entry) => entry.event && entry.weight > 0);
  const total = available.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of available) {
    roll -= entry.weight;
    if (roll <= 0) return entry.event;
  }
  return available[available.length - 1]?.event ?? null;
}

function getBossMainEvent(id) {
  return bossMainEvents.find((event) => event.id === id);
}

function getColleagueMainEvent(id) {
  return colleagueMainEvents.find((event) => event.id === id);
}

function getPositiveMainEvent(id) {
  return positiveMainEvents.find((event) => event.id === id);
}

function openMainEventPopup(container, state, actions, plan) {
  if (!plan.event || _mainEventOverlay) return;
  plan.status = "opening";
  plan.openedAt = Date.now();
  pauseChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  cleanupPhoneSystem();

  const closeWithChoice = (choice, options = {}) => {
    markMainEventPause(plan, state);
    plan.status = "done";
    _mainEventOverlay?.remove();
    _mainEventOverlay = null;
    applyMainEventChoice(actions, plan.event, choice, plan.phaseIndex, options);
  };

  _mainEventOverlay = renderMainEventPopup(plan.event, {
    state,
    onChoice: (choice) => {
      if (choice.next === "reject-reason") {
        renderRejectReasonPopup(plan.event, state, closeWithChoice);
        return;
      }
      closeWithChoice(choice);
    },
  });
  container.append(_mainEventOverlay);
}

function markMainEventPause(plan, state) {
  const openedAt = plan.openedAt ?? Date.now();
  const phaseKey = getMainPhaseKey(state, plan.phaseIndex);
  const startedAt = mainPhaseStarts.get(phaseKey);
  if (startedAt) mainPhaseStarts.set(phaseKey, startedAt + (Date.now() - openedAt));
}

function renderMainEventPopup(event, { state, onChoice }) {
  const choices = event.choices ?? [];
  return el("div", { class: "main-event-overlay" }, [
    el("article", { class: `main-event-card main-event-${event.type}`, role: "dialog", "aria-modal": "true" }, [
      el("header", { class: "main-event-titlebar" }, [
        el("div", { class: "main-event-source" }, [
          el("span", { class: "main-event-diamond", text: "◆" }),
          el("span", { text: event.speaker ?? "이벤트" }),
        ]),
        el("time", { class: "main-event-timer", text: "EVENT" }),
      ]),
      el("section", { class: "main-event-body" }, [
        el("p", { class: "main-event-kicker", text: event.type === "boss" ? "팀장님" : event.type === "colleague" ? "동료" : "공통 이벤트" }),
        el("h2", { text: event.title }),
        el("p", { class: "main-event-copy", text: event.body }),
        el("div", { class: "main-event-choice-grid" }, choices.map((choice, index) =>
          renderMainEventChoice(choice, state, () => onChoice(choice), index),
        )),
      ]),
    ]),
  ]);
}

function renderMainEventChoice(choice, state, onClick, index) {
  const tone = index === 0 ? "accept" : "reject";
  return el("button", {
    class: `main-event-choice main-event-choice-${tone}`,
    type: "button",
    onClick,
  }, [
    el("strong", { text: choice.label }),
    el("span", { class: "main-event-preview" }, renderMainEventPreview(choice, state)),
  ]);
}

function renderMainEventPreview(choice, state) {
  if (choice.next === "reject-reason") return [el("span", { text: "거절 사유 선택" })];

  const preview = deltaToEventChips(choice.delta ?? {});
  const itemId = choice.item ?? getPreviewRandomItem(choice);
  if (itemId) {
    const item = items[itemId];
    preview.push(el("span", { class: "main-event-chip main-event-chip-item", text: `${item?.icon ?? "□"} ${item?.label ?? itemId} 획득` }));
  }
  if (!preview.length) preview.push(el("span", { text: "영향 없음" }));
  return preview;
}

function getPreviewRandomItem(choice) {
  return Array.isArray(choice.randomItem) ? choice.randomItem[0] : null;
}

function deltaToEventChips(delta = {}) {
  const meta = {
    workload: { label: "업무량", className: "workload" },
    stress: { label: "스트레스", className: "stress" },
    health: { label: "체력", className: "health" },
    colleagueTrust: { label: "동료 신뢰도", className: "trust" },
    gameMinute: { label: "시간", className: "time" },
  };

  return Object.entries(delta)
    .filter(([key, value]) => value !== 0 && meta[key])
    .map(([key, value]) => {
      const suffix = key === "gameMinute" ? "분" : "";
      return el("span", {
        class: `main-event-chip main-event-chip-${meta[key].className}`,
        text: `${meta[key].label} ${value > 0 ? "+" : ""}${value}${suffix}`,
      });
    });
}

function renderRejectReasonPopup(event, state, closeWithChoice) {
  const reasons = [
    "현재 진행 중인 업무 마감이 우선입니다",
    "오늘 일정상 어렵습니다",
    "다른 담당자에게 요청하는 것이 좋겠습니다",
  ];
  const card = _mainEventOverlay?.querySelector(".main-event-card");
  if (!card) return;

  card.replaceChildren(
    el("header", { class: "main-event-titlebar" }, [
      el("div", { class: "main-event-source" }, [
        el("span", { class: "main-event-diamond", text: "◆" }),
        el("span", { text: "거절 사유 선택" }),
      ]),
      el("time", { class: "main-event-timer", text: "판단" }),
    ]),
    el("section", { class: "main-event-body" }, [
      el("p", { class: "main-event-kicker", text: state.boss?.name ?? "상사" }),
      el("h2", { text: event.title }),
      el("p", { class: "main-event-copy", text: "어떤 말로 거절할까?" }),
      el("div", { class: "main-event-choice-grid main-event-reason-grid" }, reasons.map((reason) =>
        el("button", {
          class: "main-event-choice main-event-reason-choice",
          type: "button",
          onClick: () => {
            const success = Math.random() < getBossRejectSuccessRate(state.boss?.id);
            closeWithChoice({
              id: "reject-reason",
              label: reason,
              delta: success ? {} : { workload: 15, stress: 20 },
              message: success ? "상사의 추가 업무를 무리 없이 거절했다." : "상사의 추가 업무 거절이 실패했다.",
            }, { rejectSucceeded: success });
          },
        }, [
          el("strong", { text: reason }),
          el("span", { class: "main-event-preview" }, [
            el("span", { text: "상사 성향에 따라 결과가 달라진다" }),
          ]),
        ]),
      )),
    ]),
  );
}

function getBossRejectSuccessRate(bossId) {
  const rates = {
    "smart-lazy": 1,
    "clumsy-busy": 0.7,
    "smart-busy": 0.25,
    "clumsy-lazy": 0.1,
  };
  return rates[bossId] ?? 0.25;
}

function applyMainEventChoice(actions, event, choice, phaseIndex, options = {}) {
  let pendingEnding = null;
  actions.mutateState((draft) => {
    const pickedItem = pickMainEventItem(choice);
    let next = applyDelta(draft, choice.delta ?? {}, null);
    next.inventory = [...(next.inventory ?? [])];
    if (pickedItem) next.inventory.push(pickedItem);

    applyMainEventFlags(next, event, choice, phaseIndex, options);

    addLogEntry(next, {
      cause: choice.message ?? `${event.title} 이벤트를 처리했다.`,
      delta: choice.delta ?? {},
      effects: pickedItem ? [`${items[pickedItem]?.label ?? pickedItem} 획득`] : [],
    });
    pendingEnding = checkEnding(next);
    return next;
  });

  if (pendingEnding) actions.finishWith(pendingEnding);
}

function pickMainEventItem(choice) {
  if (choice.item) return choice.item;
  if (!Array.isArray(choice.randomItem) || choice.randomItem.length === 0) return null;
  return choice.randomItem[Math.floor(Math.random() * choice.randomItem.length)];
}

function applyMainEventFlags(state, event, choice, phaseIndex) {
  state.counters.mainEventCount = (state.counters.mainEventCount ?? 0) + 1;
  state.counters.mainPhaseEventUsed = phaseIndex;

  if (event.id === "boss-interview") state.flags.badMailInterview = false;
  if (event.id === "public-shame") state.counters.failures = 0;
  if (event.id === "public-praise") state.counters.successStreak = 0;

  if (event.id === "sudden-order") {
    state.flags.forcedBossOrder = false;
    state.flags.hiddenBreakPenalty = false;
    if (state.flags.nextBossOrderBoost === true) state.flags.nextBossOrderBoost = false;
  }

  if (event.id === "hidden-break" && choice.id === "accept" && state.boss?.id === "smart-lazy") {
    state.flags.hiddenBreakPenalty = true;
  }
}

function startPhoneSystem(screen, state, actions) {
  cleanupPhoneSystem();
  const phaseIndex = getMainPhaseIndex(state);
  const durationSec = MAIN_PHASE_DURATIONS_SEC[phaseIndex];
  if (!durationSec) return;

  const plan = getPhonePlan(state, phaseIndex, durationSec);
  if (!plan.willRing || plan.status === "done") return;

  if (plan.status === "ringing") {
    restoreRingingPhone(screen, state, actions, plan);
    return;
  }

  const delayMs = Math.max(0, plan.ringAt - Date.now());
  _phoneTimeout = setTimeout(() => ringPhone(screen, state, actions, plan), delayMs);
}

function getPhonePlan(state, phaseIndex, durationSec) {
  const key = getMainPhaseKey(state, phaseIndex);
  let plan = phonePlans.get(key);
  if (plan) return plan;

  const minSec = durationSec * 0.3;
  const maxSec = durationSec * 0.8;
  const delaySec = minSec + Math.random() * (maxSec - minSec);
  const call = phoneCallPool[Math.floor(Math.random() * phoneCallPool.length)];
  plan = {
    phaseIndex,
    willRing: Math.random() < PHONE_CHANCE_BY_PHASE[phaseIndex],
    ringAt: Date.now() + delaySec * 1000,
    status: "waiting",
    call,
  };
  phonePlans.set(key, plan);
  return plan;
}

function ringPhone(screen, state, actions, plan) {
  const phoneButton = screen.querySelector(".main-work-phone-button");
  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  if (!phoneButton || !monitorScreen || !screen.isConnected || plan.status !== "waiting") return;

  plan.status = "ringing";
  plan.expiresAt = Date.now() + PHONE_RING_SECONDS * 1000;
  activatePhoneButton(phoneButton);

  _phoneRingAudio = new Audio("assets/audio/phone-ring.wav");
  _phoneRingAudio.loop = true;
  _phoneRingAudio.play().catch(() => {});

  const expireTimer = setTimeout(() => {
    if (plan.status !== "ringing") return;
    finishPhoneCall(plan, phoneButton, actions, "missed");
  }, PHONE_RING_SECONDS * 1000);

  phoneButton.onclick = () => openPhoneOverlay(monitorScreen, plan, phoneButton, actions, expireTimer);
}

function restoreRingingPhone(screen, state, actions, plan) {
  const phoneButton = screen.querySelector(".main-work-phone-button");
  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  if (!phoneButton || !monitorScreen || !screen.isConnected) return;

  activatePhoneButton(phoneButton);
  const remainingMs = Math.max(0, (plan.expiresAt ?? Date.now()) - Date.now());
  const expireTimer = setTimeout(() => {
    if (plan.status !== "ringing") return;
    finishPhoneCall(plan, phoneButton, actions, "missed");
  }, remainingMs);

  phoneButton.onclick = () => openPhoneOverlay(monitorScreen, plan, phoneButton, actions, expireTimer);
}

function activatePhoneButton(phoneButton) {
  phoneButton.classList.add("is-ringing");
  phoneButton.setAttribute("aria-label", "전화 수신 중");
  phoneButton.title = "전화 수신 중";
}

function openPhoneOverlay(container, plan, phoneButton, actions, expireTimer) {
  if (plan.status !== "ringing" || _phoneOverlay) return;
  pauseChatSystem();

  const call = plan.call ?? { type: "unknown", name: "모르는 번호", number: "010-****-****", bodyText: "전화가 왔습니다." };
  const isUnknown = call.type === "unknown";
  const callerIcon = isUnknown ? "❓" : "📞";

  const bodyChildren = [
    el("div", { class: "main-work-phone-icon", text: callerIcon }),
    el("h2", { text: call.name }),
  ];
  if (isUnknown && call.number) {
    bodyChildren.push(el("p", { class: "main-work-phone-number", text: call.number }));
  }
  bodyChildren.push(el("p", { text: call.bodyText ?? "전화가 왔습니다." }));

  _phoneOverlay = el("div", { class: "main-work-phone-overlay" }, [
    el("article", { class: `main-work-phone-card main-work-phone-type-${call.type}` }, [
      el("header", { class: "main-work-phone-header" }, [
        el("strong", { text: "☎ 수신 전화" }),
        el("time", { text: "수신 중" }),
      ]),
      el("div", { class: "main-work-phone-body" }, bodyChildren),
      el("div", { class: "main-work-phone-actions" }, [
        el("button", {
          class: "main-work-call-accept",
          type: "button",
          text: "받기",
          onClick: () => {
            clearTimeout(expireTimer);
            finishPhoneCall(plan, phoneButton, actions, "accept");
          },
        }),
        el("button", {
          class: "main-work-call-reject",
          type: "button",
          text: "거절",
          onClick: () => {
            clearTimeout(expireTimer);
            finishPhoneCall(plan, phoneButton, actions, "reject");
          },
        }),
      ]),
    ]),
  ]);

  container.append(_phoneOverlay);
}

function stopPhoneRingAudio() {
  if (_phoneRingAudio) {
    _phoneRingAudio.pause();
    _phoneRingAudio.currentTime = 0;
    _phoneRingAudio = null;
  }
}

function finishPhoneCall(plan, phoneButton, actions, outcome) {
  if (plan.status === "done") return;

  plan.status = "done";
  stopPhoneRingAudio();
  phoneButton.classList.remove("is-ringing");
  phoneButton.setAttribute("aria-label", "휴대폰");
  phoneButton.title = "휴대폰";
  phoneButton.onclick = null;
  if (_phoneOverlay) {
    _phoneOverlay.remove();
    _phoneOverlay = null;
  }

  const call = plan.call;
  if (!call) {
    applyEffect({ stress: 5, gameMinute: 2 }, actions, "전화를 처리했습니다.");
    return;
  }

  if (outcome === "accept") {
    if (call.type === "unknown" && call.accept?.outcomes) {
      const picked = pickWeightedOutcome(call.accept.outcomes);
      applyEffect(picked.delta, actions, picked.log);
    } else {
      applyEffect(call.accept.delta, actions, call.accept.log);
    }
  } else if (outcome === "reject") {
    applyEffect(call.reject.delta, actions, call.reject.log);
  } else {
    applyEffect(call.missed.delta, actions, call.missed.log);
  }
}

function pickWeightedOutcome(outcomes) {
  const rand = Math.random();
  let cumulative = 0;
  for (const outcome of outcomes) {
    cumulative += outcome.weight;
    if (rand < cumulative) return outcome;
  }
  return outcomes[outcomes.length - 1];
}

function startMainClock(screen, state, actions) {
  cleanupMainClock();
  if (!state.flags?.handoverGuideSeen) return;

  let currentMinute = state.gameMinute;
  updateMainClockDisplay(screen, currentMinute);

  _clockInterval = setInterval(() => {
    const nextMinute = actions.advanceGameMinute?.(1) ?? currentMinute + 1;
    if (!screen.isConnected) {
      cleanupMainWorkSystems();
      return;
    }

    currentMinute = nextMinute;
    updateMainClockDisplay(screen, currentMinute);
  }, MAIN_CLOCK_TICK_MS);
}

function updateMainClockDisplay(screen, gameMinute) {
  const time = formatTime(gameMinute);
  const hudClock = screen.querySelector(".main-work-current-time");
  if (hudClock) hudClock.textContent = time;

  const taskClock = screen.querySelector(".main-work-task-clock");
  if (taskClock) taskClock.textContent = toTaskbarTime(gameMinute);
}

function toTaskbarTime(gameMinute) {
  const hours = Math.floor(gameMinute / 60);
  const minutes = gameMinute % 60;
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 || 12;
  return `${period} ${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function startChatNotifications(state, actions, container) {
  _localWorkload = state.stats.workload;
  _notifPanel = el("div", { class: "chat-notif-panel" });
  container.append(_notifPanel);

  // 첫 메시지는 3초 후 즉시 등장, 이후 정상 간격
  _spawnTimeout = setTimeout(() => {
    if (!_notifPanel) return;
    spawnOneNotification(state, actions);
    scheduleNextSpawn(state, actions);
  }, 3000);
}

function scheduleNextSpawn(state, actions) {
  const delay = _localWorkload >= 70 ? 15000 : 30000;
  _spawnTimeout = setTimeout(() => {
    if (!_notifPanel) return;
    spawnOneNotification(state, actions);
    scheduleNextSpawn(state, actions);
  }, delay);
}

function spawnOneNotification(state, actions) {
  const cards = _notifPanel.querySelectorAll(".chat-notif-card");
  if (cards.length >= 5) cards[0].remove();

  const activeSenders = new Set(
    [..._notifPanel.querySelectorAll(".chat-notif-sender")].map(el => el.textContent),
  );

  const chat = takeSnoozedChat(activeSenders) ?? pickOneChat(state, activeSenders);
  if (!chat) return;

  const card = renderNotifCard(chat, actions);
  _notifPanel.append(card);
  playChatNotificationSound();
}

function pickOneChat(state, activeSenders = new Set()) {
  const trust = state.colleagueTrust ?? 30;

  // trust >= 70: 15% chance for colleague to offer unprompted help
  if (trust >= 70 && !activeSenders.has("동료") && Math.random() < 0.15) {
    return {
      kind: "colleague-offer",
      from: "동료",
      timerSec: 15,
      resolvedText: "지금 업무 좀 나눠서 봐줄게. 어때?",
      reply: { workload: -5 },
      miss: {},
    };
  }

  const basePool = [
    ...chatPool.bossTask,
    ...chatPool.bossTask,
    ...chatPool.bossPraise,
    ...chatPool.colleagueHelp,
    ...chatPool.colleagueChat,
    ...chatPool.notice,
  ];

  // trust < 30: more burden-heavy colleague-help in pool
  const pool = trust < 30 ? [...basePool, ...chatPool.colleagueHelp] : basePool;

  const available = pool.filter(t => !activeSenders.has(t.from));
  if (available.length === 0) return null;

  const template = available[Math.floor(Math.random() * available.length)];
  const text = template.texts
    ? (template.texts[state.boss.id] ?? Object.values(template.texts)[0])
    : template.text;

  const isBoss = template.kind === "boss-task" || template.kind === "boss-praise";
  const baseSec = isBoss ? 10 : 15;
  const penalty = template.kind === "boss-task" ? _nextBossTaskTimerPenalty : 0;
  if (template.kind === "boss-task") _nextBossTaskTimerPenalty = 0;
  return { ...template, resolvedText: text, timerSec: Math.max(3, baseSec - penalty) };
}

function takeSnoozedChat(activeSenders) {
  const index = _snoozedChats.findIndex(chat => !activeSenders.has(chat.from));
  if (index < 0) return null;
  const [chat] = _snoozedChats.splice(index, 1);
  // boss-task 재등장 시 업무량 +8 페널티
  const extraReply = chat.kind === "boss-task" ? { workload: 8 } : {};
  return {
    ...chat,
    done: false,
    timerSec: Math.max(5, chat.timerSec - 4),
    reply: { ...(chat.reply ?? {}), ...extraReply },
  };
}

function renderNotifCard(chat, actions) {
  const timerBar = el("div", { class: "chat-notif-timer-bar" });
  timerBar.style.animationDuration = `${chat.timerSec}s`;
  const [readSpec, snoozeSpec, ignoreSpec] = buildChatActionSpecs(chat);

  const card = el("article", { class: `chat-notif-card chat-notif-${chat.kind}` }, [
    el("div", { class: "chat-notif-timer" }, [timerBar]),
    el("div", { class: "chat-notif-header" }, [
      el("strong", { class: "chat-notif-sender", text: chat.from }),
    ]),
    el("p", { class: "chat-notif-body", text: chat.resolvedText }),
    el("div", { class: "chat-notif-footer" }),
  ]);

  card.querySelector(".chat-notif-footer").append(
    renderNotifPrimaryButton(readSpec, chat, card, actions),
    el("div", { class: "chat-notif-secondary-row" }, [
      renderNotifSecondaryButton(snoozeSpec, chat, card, actions),
      renderNotifSecondaryButton(ignoreSpec, chat, card, actions),
    ]),
  );

  timerBar.addEventListener("animationend", () => {
    if (!chat.done && _notifPanel) handleNotifExpire(chat, card, actions);
  });

  return card;
}

function renderNotifPrimaryButton(spec, chat, card, actions) {
  const previewDelta = { ...spec.delta, gameMinute: (spec.delta.gameMinute ?? 0) + spec.minutes };
  const chips = getAllDeltaChips(previewDelta, false);
  return el("button", {
    class: "chat-notif-primary chat-notif-action-read",
    onClick: () => handleNotifRead(chat, card, actions, spec),
  }, [
    el("span", { class: "chat-notif-btn-label", text: spec.label }),
    ...(chips.length ? [el("div", { class: "chat-notif-btn-chips" }, chips)] : []),
  ]);
}

function renderNotifSecondaryButton(spec, chat, card, actions) {
  const isIgnore = spec.type === "ignore";
  const previewDelta = isIgnore
    ? { ...spec.delta, gameMinute: (spec.delta.gameMinute ?? 0) + spec.minutes }
    : (spec.minutes ? { gameMinute: spec.minutes } : null);
  const chips = previewDelta ? getAllDeltaChips(previewDelta, isIgnore) : [];
  return el("button", {
    class: `chat-notif-secondary${isIgnore ? " chat-notif-secondary-ignore" : ""}`,
    onClick: () => {
      if (spec.type === "snooze") handleNotifSnooze(chat, card, actions, spec);
      if (spec.type === "ignore") handleNotifIgnore(chat, card, actions, spec);
    },
  }, [
    el("span", { text: spec.label }),
    ...(chips.length ? [el("div", { class: "chat-notif-btn-chips" }, chips)] : []),
  ]);
}

function getAllDeltaChips(delta = {}, isBad = false) {
  const chips = [];
  const defs = [
    { key: "workload", cls: "workload", label: "업무량" },
    { key: "stress",   cls: "stress",   label: "스트레스" },
    { key: "health",   cls: "health",   label: "체력" },
    { key: "colleagueTrust", cls: "trust", label: "신뢰도" },
    { key: "gameMinute", cls: "time", label: null },
  ];
  for (const { key, cls, label } of defs) {
    const v = delta[key];
    if (!v) continue;
    const sign = v > 0 ? "+" : "";
    const text = label ? `${label} ${sign}${v}` : `${sign}${v}분`;
    chips.push(el("span", {
      class: `chat-notif-chip chat-notif-chip-${cls}${isBad ? " is-bad" : ""}`,
      text,
    }));
  }
  return chips;
}

function buildChatActionSpecs(chat) {
  const readMinutes = chat.readMinutes ?? CHAT_READ_MINUTES[chat.kind] ?? 3;
  return [
    {
      type: "read",
      label: chat.readLabel ?? getReadActionLabel(chat),
      minutes: readMinutes,
      delta: chat.reply ?? {},
      className: "chat-notif-action-read",
    },
    {
      type: "snooze",
      label: "나중에",
      minutes: chat.snoozeMinutes ?? CHAT_SNOOZE_MINUTES,
      delta: {},
      note: "후속 채팅",
      className: "chat-notif-action-later",
    },
    {
      type: "ignore",
      label: "무시",
      minutes: chat.ignoreMinutes ?? CHAT_IGNORE_MINUTES,
      delta: chat.miss ?? {},
      note: isEmptyDelta(chat.miss) ? "영향 없음" : "",
      className: "chat-notif-action-ignore",
    },
  ];
}


function getReadActionLabel(chat) {
  if (chat.kind === "boss-task") return "바로 답장";
  if (chat.kind === "boss-praise") return "확인";
  if (chat.kind === "colleague-help") return "도와준다";
  if (chat.kind === "colleague-chat") return "잠깐 대화";
  if (chat.kind === "colleague-offer") return "고마워, 부탁해";
  if (chat.kind === "notice") return "공지 확인";
  return "읽기";
}

function isEmptyDelta(delta = {}) {
  return Object.entries(delta).filter(([, value]) => value !== 0).length === 0;
}

function handleNotifRead(chat, card, actions, spec = buildChatActionSpecs(chat)[0]) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  applyEffect(withChatTimeCost(spec.delta, spec.minutes), actions, buildChatLogCause(chat, "read"));
  dismissCard(card);
}

function handleNotifSnooze(chat, card, actions, spec = buildChatActionSpecs(chat)[1]) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  applyEffect(withChatTimeCost(spec.delta, spec.minutes), actions, buildChatLogCause(chat, "snooze"));
  _snoozedChats.push({ ...chat, snoozeCount: (chat.snoozeCount ?? 0) + 1 });
  dismissCard(card);
}

function handleNotifIgnore(chat, card, actions, spec = buildChatActionSpecs(chat)[2]) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  let effectiveDelta = { ...spec.delta };
  if (chat.kind === "notice" && Math.random() < 0.2) {
    effectiveDelta.workload = (effectiveDelta.workload ?? 0) + 5;
  }
  if (chat.kind === "boss-task") _nextBossTaskTimerPenalty = 3;
  applyEffect(withChatTimeCost(effectiveDelta, spec.minutes), actions, buildChatLogCause(chat, "ignore"));
  dismissCard(card);
}

function handleNotifExpire(chat, card, actions) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  let missedDelta = { ...(chat.miss ?? {}) };
  if (chat.kind === "notice" && Math.random() < 0.2) {
    missedDelta.workload = (missedDelta.workload ?? 0) + 5;
  }
  if (chat.kind === "boss-task") _nextBossTaskTimerPenalty = 3;
  applyEffect(missedDelta, actions, buildChatLogCause(chat, "expire"));
  dismissCard(card);
}

function applyEffect(delta, actions, cause) {
  if (!delta || Object.keys(delta).length === 0) return;

  if (delta.workload !== undefined) {
    _localWorkload = Math.max(0, Math.min(100, _localWorkload + delta.workload));
  }

  let pendingEnding = null;
  actions.mutateState(draft => {
    const next = applyDelta(draft, delta, cause);
    pendingEnding = checkEnding(next);
    return next;
  });
  if (pendingEnding) actions.finishWith(pendingEnding);
}

function withChatTimeCost(delta = {}, minutes = 0) {
  return { ...delta, gameMinute: (delta.gameMinute ?? 0) + minutes };
}

function buildChatLogCause(chat, outcome) {
  const sender = chat.from ?? "메시지";
  const topic = summarizeChatTopic(chat);
  if (outcome === "read") {
    if (chat.kind === "boss-task") return `${sender}의 ${topic} 요청을 처리했다.`;
    if (chat.kind === "boss-praise") return `${sender}의 ${topic} 메시지를 확인했다.`;
    if (chat.kind === "colleague-help") return `동료의 ${topic} 부탁을 도와주었다.`;
    if (chat.kind === "colleague-chat") return "동료와 잠깐 대화했다.";
    if (chat.kind === "colleague-offer") return "동료의 도움을 받았다. 업무가 조금 줄었다.";
    return `${sender}의 ${topic} 공지를 확인했다.`;
  }

  if (outcome === "snooze") {
    return `${sender}의 ${topic} 메시지를 나중에 보기로 했다.`;
  }

  if (outcome === "ignore") {
    if (chat.kind === "boss-task") return `${sender}의 ${topic} 요청을 무시했다.`;
    if (chat.kind === "colleague-help") return `동료의 ${topic} 부탁을 거절했다.`;
    if (chat.kind === "colleague-offer") return "동료의 도움 제안을 거절했다.";
    return `${sender} 메시지를 무시했다.`;
  }

  if (chat.kind === "boss-task") return `${sender}의 ${topic} 요청을 놓쳐 스트레스가 쌓였다.`;
  if (chat.kind === "colleague-help") return `동료의 ${topic} 부탁에 답하지 못했다.`;
  if (chat.kind === "colleague-offer") return "동료의 도움 제안을 놓쳤다.";
  return `${sender} 메시지를 제때 확인하지 못했다.`;
}

function summarizeChatTopic(chat) {
  const text = chat.resolvedText ?? chat.text ?? "";
  if (text.includes("보고서")) return "보고서 수정";
  if (text.includes("이메일") || text.includes("회신")) return "거래처 이메일";
  if (text.includes("회의") || text.includes("자료")) return "회의 자료";
  if (text.includes("문서")) return "문서 검토";
  if (text.includes("발표")) return "발표";
  if (text.includes("복지포인트")) return "복지포인트";
  if (text.includes("네트워크")) return "네트워크 점검";
  return "업무";
}

function dismissCard(card) {
  card.classList.add("notif-dismissed");
  setTimeout(() => card.remove(), 220);
}

function playChatNotificationSound() {
  const audio = new Audio(CHAT_NOTIFICATION_SOUND_SRC);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}
