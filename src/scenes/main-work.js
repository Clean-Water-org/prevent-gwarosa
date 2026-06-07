import { el, getActiveStatusEffects, renderNarrationPopup, renderStatusBadge } from "../ui.js";
import { formatTime, applyDelta, applyWorkTimeCost, checkEnding, normalizeLogEntry, addLogEntry, currentDateLabel } from "../state.js";
import {
  bossMainEvents,
  chatPool,
  colleagueMainEvents,
  phoneCallPool,
  positiveMainEvents,
} from "../data/events.js";
import { items } from "../data/items.js";
import { PLAYER_TYPES } from "../data/player-types.js";
import { PORTAL_TASKS } from "../data/portal-tasks.js";
import { personalizeBossChat, personalizeBossEventBody, fillBossText } from "../lib/boss-text.js";
import { makeOfficeRoom, appendDefaultRoomProps, makeMonitor } from "../components/pixel-office.js";
import { renderMiniGameBriefing } from "./minigame/briefing.js";
import { getCurrentMiniGame, getMiniGameBriefingKey } from "./minigame/flow.js";
import { renderLunchIntro, renderLunchResult } from "./lunch.js";
import { playBgm, duckBgm, playSfx, playTimedSfx, playClickSfx, syncBgmStatusFx, pauseBgm, resumeBgm, bindBgmToggleButton } from "../lib/audio.js";
import {
  applyHeadacheEventToDraft,
  mountHeadacheDialog,
} from "../lib/headache-event.js";
import { formatHeadacheDisplayText } from "../lib/headache-fx.js";
import {
  buildChatLogCause,
  getMessageFlavorLabel,
  getMessageReplyOptions,
  resolveMessageChoice,
} from "../lib/chat-replies.js";

const MAIN_BGM_SRC = "assets/audio/so-happy-with-my-8-bit-game.mp3";
const EVENT_SFX = "assets/audio/new-event-notification.mp3";
const CLOCK_TICK_SFX = "assets/audio/clock-tick.wav";

let _notifPanel = null;
let _spawnTimeout = null;
let _localWorkload = 0;
let _clockInterval = null;
let _phaseTimeout = null;
const _phoneTimeouts = new Set();
let _phoneOverlay = null;
let _phoneRingAudio = null;
let _mainEventTimeout = null;
let _mainEventOverlay = null;
let _meetingEventTimeout = null;
let _meetingEventOverlay = null;
let _statusEventOverlay = null;
let _lunchOverlay = null;
let _lunchCutsceneRunId = null;

const LUNCH_AFTERNOON_CUTSCENE = {
  prelude: [],
  preludeMs: 0,
  steps: [
    { text: "12:59", ms: 0, step: "time" },
    { text: "13:00", ms: 1000, step: "time" },
    { text: "오후 업무 시작", ms: 2000, step: "label" },
  ],
  totalMs: 3400,
};
let _chatSnapshot = null;
let _spawnScheduledAt = 0;
let _spawnDelayMs = 0;
let _currentGameMinute = 9 * 60;
let _messengerState = null;
let _messengerUpdater = null;
let _intranetUpdater = null;
let _intranetActiveTab = "board";
let _intranetOpen = false;

const INTRANET_TABS = [
  { id: "mypage", label: "마이페이지" },
  { id: "board", label: "게시판" },
];
let _hrPortalIntroSpawned = false;
let _lastRenderedState = null;
let _openMessengerRoom = null;
let _replyExpireTimers = new Map();
let _preservingNotifications = false;
let _preservingMeetingEvent = false;
let _logHighlightClearId = null;
let _logHighlightTimer = null;
let _preserveSpawnMs = null;
let _spawnInFlight = false;

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
      "너무 머리가 아파서 못하겠어...",
      "플레이 시간 1시간이 흘렀다.",
    ],
    logCause: "두통이 와서 잠시 쉬었다. 시간이 크게 흘렀다.",
    timerLabel: "두통",
  },
};

const MAIN_CLOCK_TICK_MS = 1000;
const CHAT_NOTIFICATION_SOUND_SRC = "assets/audio/messenger-notification.mp3";
const CHAT_REPLY_TIMER_SEC = { boss: 10, colleague: 15, hr: 15 };
const CHAT_SPAWN_FIRST_MS = 2000;
const CHAT_SPAWN_INTERVAL_MS = 4000;
const CHAT_SPAWN_INTERVAL_BUSY_MS = 4000;
const HR_NOTICE_SPAWN_WEIGHT = 4;
const HR_NOTICE_MAX_PER_PHASE = 1;
const MAX_MESSENGER_TOASTS = 5;
const MAIN_PHASE_DURATIONS_SEC = [35, 35, 40, 40, 40];
const PHONE_CHANCE_BY_PHASE = [0.4, 0.45, 0.5, 0.45, 0.4];
const PHONE_CALLS_PER_PHASE = 1;
const PHONE_RING_SECONDS = 12;
const MAIN_EVENT_CHANCE = 0.75;
const MAIN_EVENT_DELAY_MS = 4500;
const MESSENGER_ROOMS = [
  { id: "boss", icon: "💼", name: "팀장", title: "팀장" },
  { id: "colleague", icon: "👨", name: "동료", title: "동료" },
  { id: "hr", icon: "🔔", name: "인사팀", title: "인사팀" },
];
const MESSENGER_ROOM_BY_FROM = {
  "팀장": "boss",
  "동료": "colleague",
  "인사팀": "hr",
};
const mainPhaseStarts = new Map();
const phonePlans = new Map();
const mainEventPlans = new Map();
const hrNoticeSpawnsByPhase = new Map();

const handoverNotes = [
  "업무량은 100에서 시작합니다. 18시 전에 모두 처리하면 퇴근할 수 있습니다.",
  "스트레스가 100이 되면 더 이상 버틸 수 없습니다. 적절히 관리하세요.",
  "업무 시간이 오래 걸릴수록 체력이 조금씩 줄어듭니다. 무리하지 마세요.",
  "상사마다 성향이 다릅니다. 관찰하면 패턴을 찾을 수 있습니다.",
  "메신저는 자주 확인하는 것이 좋습니다. 답장이 늦어질수록 업무가 늘어날 수 있습니다.",
  "아이템은 필요할 때 사용하세요. 아껴둘 이유는 없습니다.",
  "미니게임을 성공하면 업무량을 크게 줄일 수 있습니다.",
];

let stopHandoverGuide = null;

function bringWorkspacePanelToFront(panel) {
  const parent = panel?.parentElement;
  if (!parent || !panel) return;
  parent.appendChild(panel);
}

export function renderMainWork(root, state, actions) {
  _currentGameMinute = state.gameMinute;
  _lastRenderedState = state;
  if (!state.flags?.handoverGuideSeen) {
    // 새 게임 시작 시점 — 이전 판의 채팅 스냅샷이 남아있다면 폐기한다.
    _chatSnapshot = null;
    resetMessengerState(state);
  }
  const messenger = ensureMessengerState(state);
  cleanupMainWorkSystems();
  stopHandoverGuide?.();
  // 메인화면 BGM — 같은 곡이 이미 재생 중이면 idempotent (리렌더 시 끊김 없음)
  playBgm(MAIN_BGM_SRC);
  syncBgmStatusFx({ headache: state.stats.health <= 30 });

  const startChats = () => {
    const monitorEl = screen.querySelector(".main-work-monitor-screen");
    startChatNotifications(state, actions, monitorEl ?? screen);
    startMainPhaseTimer(state, actions);
    startPhoneSystem(screen, state, actions);
    startMainEventSystem(screen, state, actions);
  };

  const intranetPanel = el("div", { class: "main-work-intranet-slot" }, [
    renderIntranetWindow(actions),
  ]);
  intranetPanel.style.display = _intranetOpen ? "" : "none";
  const messengerPanel = el("div", { class: "main-work-messenger-slot" });
  messengerPanel.style.display = "none";

  let intranetBtn;
  let messengerBtn;
  const closeMessenger = () => {
    _messengerState.isOpen = false;
    if (messengerPanel.style.display === "none") {
      messengerBtn?.classList.remove("active");
      return;
    }
    messengerPanel.style.display = "none";
    messengerBtn?.classList.remove("active");
  };
  const refreshMessenger = () => {
    renderMessengerShell(messengerPanel, state, actions, closeMessenger);
    updateMessengerTaskbarButton(messengerBtn);
  };
  const toggleIntranet = () => {
    const willOpen = intranetPanel.style.display === "none";
    _intranetOpen = willOpen;
    intranetPanel.style.display = willOpen ? "" : "none";
    intranetBtn?.classList.toggle("active", willOpen);
    if (willOpen) {
      // 포털을 볼 때는 메신저 창을 닫아 두어, 알림·리렌더 후 메신저가 다시 덮지 않게 한다.
      closeMessenger();
      bringWorkspacePanelToFront(intranetPanel);
      _intranetUpdater?.();
    }
  };
  const toggleMessenger = () => {
    const willOpen = messengerPanel.style.display === "none";
    if (willOpen) {
      _messengerState.isOpen = true;
      _messengerState.activeRoomId = findFirstUnreadRoomId() ?? _messengerState.activeRoomId ?? "boss";
      markRoomRead(_messengerState.activeRoomId);
      messengerPanel.style.display = "";
      messengerBtn?.classList.add("active");
      bringWorkspacePanelToFront(messengerPanel);
      refreshMessenger();
      return;
    }
    closeMessenger();
  };
  _messengerUpdater = refreshMessenger;
  _openMessengerRoom = (roomId) => {
    if (!_messengerState) return;
    _messengerState.isOpen = true;
    _messengerState.activeRoomId = roomId;
    markRoomRead(roomId);
    messengerPanel.style.display = "";
    messengerBtn?.classList.add("active");
    bringWorkspacePanelToFront(messengerPanel);
    refreshMessenger();
  };

  const firstTime = !state.flags?.handoverGuideSeen;

  const monitorScreen = el("div", {
    class: `main-work-monitor-screen${state.stats.health <= 30 ? " fx-headache" : ""}`,
  }, [
    renderMainWorkHud(state, actions),
    el("main", { class: "main-work-center" }, [
      renderDesktopDocuments(() => screen, firstTime, actions, startChats),
      intranetPanel,
      messengerPanel,
    ]),
    renderTaskbar(
      state.gameMinute,
      toggleIntranet,
      (btn) => { intranetBtn = btn; },
      toggleMessenger,
      (btn) => { messengerBtn = btn; updateMessengerTaskbarButton(btn); },
    ),
  ]);
  refreshMessenger();
  updateIntranetTaskbarButton(intranetBtn);
  intranetBtn?.classList.toggle("active", _intranetOpen);
  if (_messengerState.isOpen) {
    messengerPanel.style.display = "";
    messengerBtn?.classList.add("active");
  }
  if (_intranetOpen) {
    bringWorkspacePanelToFront(intranetPanel);
  } else if (_messengerState.isOpen) {
    bringWorkspacePanelToFront(messengerPanel);
  }

  // 회의 준비 미니게임과 동일한 오피스 룸 + CHADOL-TRON 모니터 비주얼로 통일
  const room = makeOfficeRoom();
  room.classList.add("main-work-room");
  appendDefaultRoomProps(room);

  const monitorScroll = el("div", { class: "main-work-monitor-scroll" });
  const monitorStage = el("div", { class: "main-work-monitor-stage" }, [
    el("div", { class: "main-work-monitor-wrapper" }, [
      makeMonitor(monitorScreen),
      renderRecentLogPanel(state, actions),
    ]),
  ]);
  monitorScroll.append(monitorStage);
  room.append(monitorScroll);

  const screen = el("section", {
    class: `main-work-screen${state.stats.health <= 30 ? " fx-headache" : ""}`,
  }, [room]);

  root.append(screen);

  if (state.flags?.pendingMinigameBriefing) {
    const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
    ensureNotificationPanelMounted(monitorScreen, state, actions);
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

  if (state.flags?.lunchCutscenePending) {
    beginLunchAfternoonCutscene(screen, state, actions);
    return;
  }

  if (state.flags?.lunchPhase) {
    const monitorEl = screen.querySelector(".main-work-monitor-screen") ?? screen;
    ensureNotificationPanelMounted(monitorEl, state, actions);
    showLunchOnMain(screen, monitorEl, state, actions);
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
      ensureNotificationPanelMounted(monitorEl, state, actions);
      showStatusEventPopup(pendingStatus, state, monitorEl, actions);
    } else if (shouldShowMeetingEvent(state) || state.flags?.devTriggerMeetingEvent) {
      const monitorEl = screen.querySelector(".main-work-monitor-screen") ?? screen;
      ensureNotificationPanelMounted(monitorEl, state, actions);
      showMeetingEventPopup(state, monitorEl, actions);
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
      renderBgmToggleButton(state),
      renderPhoneButton(),
      el("div", { class: "main-work-hud-time" }, [
        el("strong", { class: "main-work-current-time", text: formatTime(state.gameMinute) }),
        el("span", { text: currentDateLabel() }),
      ]),
    ]),
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

function renderBgmToggleButton(state) {
  const btn = el("button", {
    class: "main-work-bgm-button",
    type: "button",
  });
  bindBgmToggleButton(btn, {
    onEnable: () => {
      playBgm(MAIN_BGM_SRC);
      syncBgmStatusFx({ headache: state.stats.health <= 30 });
    },
    renderState: (on) => {
      btn.textContent = on ? "♪" : "♪";
    },
  });
  return btn;
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
    ? inventory.map((itemId, index) => renderMainWorkItemButton(itemId, index, state, actions))
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

function renderMainWorkItemButton(itemId, index, state, actions) {
  const item = items[itemId];
  if (!item) return el("span", { class: "main-work-empty-items", text: "알 수 없는 아이템" });

  const actionLabel = itemId === "coffee" ? "커피 마시기" : `${item.label} 사용`;
  // 사용 제한 있는 아이템(maxUses)만 남은 횟수 배지 표시.
  const limited = item.maxUses != null;
  const used = state.counters?.itemUses?.[itemId] ?? 0;
  const remaining = limited ? Math.max(0, item.maxUses - used) : null;
  const exhausted = limited && remaining <= 0;

  // 남은 횟수 배지는 아이콘 박스 우측 하단에 표시(아이콘 안에 중첩).
  const iconChildren = [item.icon];
  if (limited) {
    iconChildren.push(el("span", {
      class: "main-work-item-badge",
      "aria-label": `남은 사용 ${remaining}회`,
      text: String(remaining),
    }));
  }
  const children = [
    el("span", { class: "main-work-item-icon" }, iconChildren),
    el("span", { class: "main-work-item-copy" }, [
      el("strong", { text: actionLabel }),
      el("small", { text: item.effect }),
    ]),
  ];

  const attrs = {
    class: `main-work-item-button${exhausted ? " is-exhausted" : ""}`,
    type: "button",
    title: limited ? `${actionLabel} · ${item.effect} · 남은 ${remaining}회` : `${actionLabel} · ${item.effect}`,
    onClick: () => actions.useItem(index),
  };
  if (exhausted) attrs.disabled = "";

  return el("button", attrs, children);
}

function renderRecentLogPanel(state, actions) {
  const logs = (state.log ?? []).map((entry) => normalizeLogEntry(state, entry));
  const collapsed = Boolean(state.flags?.recentLogCollapsed);
  const highlightId = state.flags?.recentLogHighlightId ?? null;
  const hasNewEntry = Boolean(highlightId);
  const title = `📋 업무 일지 (${logs.length})`;
  const logList = collapsed
    ? null
    : el("div", { class: "main-work-recent-log-list" }, logs.length
      ? logs.map((entry) => renderRecentLogEntry(entry, highlightId))
      : [el("p", { class: "main-work-recent-log-empty", text: "아직 기록된 변화가 없습니다." })]);

  if (logList) {
    requestAnimationFrame(() => {
      logList.scrollTop = logList.scrollHeight;
    });
  }

  if (hasNewEntry && _logHighlightClearId !== highlightId) {
    if (_logHighlightTimer) window.clearTimeout(_logHighlightTimer);
    _logHighlightClearId = highlightId;
    _logHighlightTimer = window.setTimeout(() => {
      _logHighlightClearId = null;
      _logHighlightTimer = null;
      actions.mutateState((draft) => {
        if (draft.flags?.recentLogHighlightId === highlightId) {
          draft.flags.recentLogHighlightId = null;
        }
        return draft;
      });
    }, 2800);
  }

  const workStarted = Boolean(state.flags?.handoverGuideSeen);
  // 인수인계(업무 시작) 전에는 '접기' 토글 비활성 — 누르면 재렌더로 인수인계 가이드가 중복 실행됨
  const toggleAttrs = {
    class: `main-work-recent-log-toggle${workStarted ? "" : " is-disabled"}`,
    type: "button",
    text: collapsed ? "펼치기" : "접기",
  };
  if (workStarted) {
    toggleAttrs.onMouseDown = (event) => {
      if (event.button === 0) event.preventDefault();
    };
    toggleAttrs.onClick = (event) => {
      event.currentTarget.focus({ preventScroll: true });
      actions.mutateState((draft) => {
        draft.flags.recentLogCollapsed = !Boolean(draft.flags?.recentLogCollapsed);
        if (draft.flags.recentLogCollapsed) {
          draft.flags.recentLogHighlightId = null;
        }
        return draft;
      });
    };
  } else {
    toggleAttrs.disabled = "true";
    toggleAttrs.title = "업무 시작 후 사용 가능";
  }

  return el("aside", {
    class: `main-work-recent-log${collapsed ? " is-collapsed" : ""}${hasNewEntry ? " has-new-entry" : ""}`,
    "aria-label": "업무 일지",
  }, [
    el("header", { class: "main-work-recent-log-head" }, [
      el("strong", { text: title }),
      ...(hasNewEntry
        ? [el("span", { class: "main-work-recent-log-new-dot", text: "●", "aria-label": "새 기록" })]
        : []),
      el("button", toggleAttrs),
    ]),
    ...(collapsed
      ? []
      : [logList]),
  ]);
}

function renderRecentLogEntry(entry, highlightId) {
  const isNew = Boolean(highlightId && entry.id === highlightId);
  return el("article", { class: `main-work-recent-log-entry${isNew ? " is-new" : ""}` }, [
    el("span", { class: "main-work-recent-log-icon", text: entry.icon ?? "🔵" }),
    el("div", { class: "main-work-recent-log-copy" }, [
      el("div", { class: "main-work-recent-log-meta" }, [
        el("time", { text: entry.time ?? "" }),
        ...(isNew ? [el("span", { class: "main-work-recent-log-new-badge", text: "NEW" })] : []),
      ]),
      el("p", { text: entry.cause ?? "기록된 행동" }),
      ...(entry.effects ?? []).map((effect) => el("span", { text: effect })),
    ]),
  ]);
}

const INTRANET_STATIC_NOTICES = [
  "[안내] 불필요한 야근 자제 안내",
  "[중요] 사무실 내 간이침대 사용 수칙 안내",
  "[중요] 2분기 업무 효율화 캠페인 안내",
  "[중요] 사내 수면실 이용 제한 안내",
  "사내 보안 점검으로 인한 문서 서버 순단 예정",
  "복지포인트 신청 마감: 금일 18:00",
  "회의실 예약 시스템 업데이트 안내",
];

function renderIntranetWindow(actions) {
  const shell = el("section", { class: "main-work-intranet" }, [
    el("header", { class: "main-work-intranet-tabs" }, [
      el("strong", { class: "main-work-intranet-logo", text: "DAEHAN INTRANET" }),
      el("nav", { class: "main-work-tab-menu", role: "tablist" }),
    ]),
    el("div", { class: "main-work-intranet-body" }),
  ]);

  const tabMenu = shell.querySelector(".main-work-tab-menu");
  let openTaskId = null;

  for (const tab of INTRANET_TABS) {
    tabMenu.append(el("button", {
      class: `main-work-intranet-tab${_intranetActiveTab === tab.id ? " is-active" : ""}`,
      type: "button",
      role: "tab",
      "aria-selected": _intranetActiveTab === tab.id ? "true" : "false",
      "data-tab": tab.id,
      text: tab.label,
    }));
  }

  tabMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    const tabId = button.dataset.tab;
    if (!tabId || _intranetActiveTab === tabId) return;
    _intranetActiveTab = tabId;
    refresh();
  });

  const syncTabStates = () => {
    tabMenu.querySelectorAll("[data-tab]").forEach((button) => {
      const active = button.dataset.tab === _intranetActiveTab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  const refresh = (nextOpenTaskId = openTaskId) => {
    openTaskId = nextOpenTaskId ?? null;
    const state = _lastRenderedState;
    const body = shell.querySelector(".main-work-intranet-body");
    if (!body) return;

    if (!INTRANET_TABS.some((tab) => tab.id === _intranetActiveTab)) {
      _intranetActiveTab = "board";
    }

    syncTabStates();
    body.classList.toggle("is-mypage", _intranetActiveTab === "mypage");
    body.replaceChildren(...renderIntranetBody(state, actions, openTaskId, (taskId) => refresh(taskId)));
    updateIntranetTaskbarButton(document.querySelector(".main-work-task-intranet"));
  };

  _intranetUpdater = () => refresh();
  refresh();
  return shell;
}

function renderIntranetBody(state, actions, openTaskId, onOpenTask) {
  if (_intranetActiveTab === "mypage") {
    return [renderIntranetMypage(state)];
  }
  return renderIntranetBoardBody(actions, openTaskId, onOpenTask);
}

function renderIntranetMypage(state) {
  const player = state?.player ?? {};
  const playerName = player.name || "김대리";
  const portrait = player.gender === "female" ? "female" : "male";
  const genderLabel = player.gender === "female" ? "여성" : "남성";
  const typeDef = PLAYER_TYPES[player.type] || PLAYER_TYPES.coffee;
  const typeItem = items[typeDef.item];
  const bossHint = state?.boss?.publicHint ?? "오늘의 상사 정보를 확인하세요.";
  const startItemLabel = typeDef.item === "coffee" ? "커피 ☕" : "담배 🚬";

  return el("section", { class: "main-work-mypage" }, [
    el("article", { class: "main-work-mypage-profile" }, [
      el("div", { class: "main-work-mypage-photo" }, [
        el("img", {
          src: `assets/portraits/${portrait}.svg`,
          alt: "증명사진",
        }),
      ]),
      el("div", { class: "main-work-mypage-profile-copy" }, [
        el("strong", { text: `사원 ${playerName}` }),
        el("span", { text: `${genderLabel} · ${typeDef.emoji} ${typeDef.name}` }),
      ]),
    ]),
    el("section", { class: "main-work-mypage-card" }, [
      el("h3", { text: "상사 힌트" }),
      el("p", { text: bossHint }),
    ]),
    el("section", { class: "main-work-mypage-card" }, [
      el("h3", { text: "오늘의 설정" }),
      el("p", { text: `${typeDef.name} · ${typeItem?.effect ?? ""}` }),
      el("p", { text: `시작 아이템 · ${startItemLabel} + 쇼츠 📱` }),
    ]),
  ]);
}

function renderIntranetBoardBody(actions, openTaskId, onOpenTask) {
  const pendingTasks = getPendingPortalTasks();
  const openTask = openTaskId ? PORTAL_TASKS[openTaskId] : null;

  const noticeItems = [
    ...pendingTasks.map((task) => el("li", {}, [
      el("button", {
        class: `main-work-portal-task${openTaskId === task.id ? " is-active" : ""}`,
        type: "button",
        text: task.listTitle,
        onClick: () => onOpenTask(task.id),
      }),
    ])),
    ...INTRANET_STATIC_NOTICES.map((text) => el("li", { text })),
  ];

  const noticePanel = el("section", { class: "main-work-notice-panel" }, [
    el("div", { class: "main-work-notice-head" }, [
      el("h2", { text: "공지사항" }),
      el("span", {
        class: `main-work-notice-badge${pendingTasks.length ? " has-pending" : ""}`,
        text: pendingTasks.length ? `미처리 ${pendingTasks.length}` : "사내포털",
      }),
    ]),
    el("ul", {}, noticeItems),
    ...(openTask ? [renderPortalTaskDetail(openTask, actions, () => onOpenTask(null))] : []),
  ]);

  return [
    noticePanel,
    el("section", { class: "main-work-schedule-panel" }, [
      el("h2", { text: "오늘의 일정" }),
      el("div", { class: "main-work-schedule-list" }, [
        renderSchedule("09:30", "주간 업무 공유"),
        renderSchedule("11:00", "전자결재 검토"),
        renderSchedule("13:00", "전체 회의"),
        renderSchedule("17:30", "보고서 초안 제출"),
      ]),
    ]),
  ];
}

function renderPortalTaskDetail(task, actions, onClose) {
  return el("section", { class: "main-work-portal-detail" }, [
    el("header", { class: "main-work-portal-detail-head" }, [
      el("strong", { text: task.detailTitle }),
      el("button", {
        class: "main-work-portal-detail-close",
        type: "button",
        text: "닫기",
        onClick: onClose,
      }),
    ]),
    el("div", { class: "main-work-portal-detail-body" }, task.lines.map((line) =>
      el("p", { text: line }),
    )),
    el("button", {
      class: "main-work-portal-detail-confirm",
      type: "button",
      text: task.confirmLabel,
      onClick: () => completePortalTask(task.id, actions, onClose),
    }),
  ]);
}

function getPendingPortalTasks() {
  const tasks = [];
  const seen = new Set();
  const hrMessages = _messengerState?.rooms?.hr?.messages ?? [];
  for (const message of hrMessages) {
    if (!message.portalTaskId || !message.needsReply || message.status || message.portalCompleted) continue;
    const task = PORTAL_TASKS[message.portalTaskId];
    if (!task || seen.has(task.id)) continue;
    seen.add(task.id);
    tasks.push(task);
  }
  return tasks;
}

function getActivePortalTaskIds() {
  const ids = new Set();
  const hrMessages = _messengerState?.rooms?.hr?.messages ?? [];
  for (const message of hrMessages) {
    if (message.portalTaskId && message.needsReply && !message.status) {
      ids.add(message.portalTaskId);
    }
  }
  return ids;
}

function completePortalTask(taskId, actions, onClose) {
  let updated = false;
  for (const room of Object.values(_messengerState?.rooms ?? {})) {
    for (const message of room.messages) {
      if (message.portalTaskId === taskId && !message.portalCompleted) {
        message.portalCompleted = true;
        updated = true;
      }
    }
  }
  if (!updated) return;

  actions.mutateState((draft) => {
    const next = applyDelta(draft, { gameMinute: 2 }, null);
    addLogEntry(next, {
      cause: `${PORTAL_TASKS[taskId]?.detailTitle ?? "포털 공지"}를 확인했다.`,
      delta: { gameMinute: 2 },
    });
    return next;
  });

  onClose?.();
  _intranetUpdater?.();
  _messengerUpdater?.();
  updateIntranetTaskbarButton(document.querySelector(".main-work-task-intranet"));
}

function updateIntranetTaskbarButton(button) {
  if (!button) return;
  const pending = getPendingPortalTasks().length;
  button.textContent = pending ? `사내포털 (${pending})` : "사내포털";
  button.classList.toggle("has-pending-portal", pending > 0);
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
    cancelHandoverPopup = openHandoverPopup(screen, actions, clearGuideLayer, true, onStartChats);
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

function getMainMonitorScreen(root) {
  return root.querySelector(".main-work-monitor-screen") ?? root;
}

function findGuideLayer(screen) {
  const root = screen?.classList?.contains("main-work-screen")
    ? screen
    : screen?.closest?.(".main-work-screen") ?? screen;
  return root?.querySelector?.(".main-work-guide-layer") ?? null;
}

/** 튜토리얼 가이드 레이어(fixed, z-index 9998)가 인수인계서 클릭을 가로막지 않게 한다. */
function releaseHandoverGuidePointerBlock(screen) {
  const guideLayer = findGuideLayer(screen);
  if (!guideLayer) return;
  guideLayer.style.pointerEvents = "none";
  guideLayer.querySelector(".narration-popup")?.style.setProperty("pointer-events", "auto");
  guideLayer.querySelector(".main-work-fake-cursor")?.style.setProperty("visibility", "hidden");
}

function openHandoverPopup(screen, actions, onClose, playIntro = false, onStartChats = null, options = {}) {
  const monitorScreen = getMainMonitorScreen(screen);
  const existing = monitorScreen.querySelector(".main-work-handover-overlay");
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
      el("button", {
        class: "main-work-handover-close",
        text: "알겠습니다.",
        onClick: close,
      }),
    ]),
  ]);

  monitorScreen.append(overlay);
  releaseHandoverGuidePointerBlock(screen);
  if (options.autoCloseMs) {
    autoCloseTimer = window.setTimeout(close, options.autoCloseMs);
  }

  return () => {
    if (autoCloseTimer) window.clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
    overlay.remove();
  };
}

function playClockCutscene(screen, onDone, options = {}) {
  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  const prelude = options.prelude ?? ["..."];
  const preludeMs = options.preludeMs ?? 3200;
  const clockSteps = options.steps ?? [
    { text: "08:58", ms: 0, step: "time" },
    { text: "08:59", ms: 1000, step: "time" },
    { text: "09:00", ms: 2000, step: "time" },
    { text: "업무 시작", ms: 3200, step: "label" },
  ];
  const totalMs = options.totalMs ?? 4400;
  const timers = [];
  const clockTickStops = [];

  const stopClockTicks = () => {
    for (const stop of clockTickStops) stop();
    clockTickStops.length = 0;
  };

  const startClock = () => {
    pauseBgm();
    const display = el("div", { class: "main-work-clock-display" });
    const overlay = el("div", { class: "main-work-clock-cutscene" }, [display]);
    monitorScreen.append(overlay);

    for (const { text, ms, step } of clockSteps) {
      timers.push(setTimeout(() => {
        display.textContent = text;
        display.dataset.step = step;
        if (step === "time") {
          const { stop } = playTimedSfx(CLOCK_TICK_SFX, { volume: 0.75, durationMs: 850 });
          clockTickStops.push(stop);
        }
      }, ms));
    }
    timers.push(setTimeout(() => {
      stopClockTicks();
      overlay.remove();
      resumeBgm();
      onDone?.();
    }, totalMs));
  };

  if (preludeMs <= 0 || prelude.length === 0) {
    startClock();
    return;
  }

  const narration = renderNarrationPopup(prelude, { typingSpeed: 480, showPrompt: false });
  screen.append(narration.node);
  timers.push(setTimeout(() => {
    narration.stop();
    narration.node.remove();
    startClock();
  }, preludeMs));
}

function showLunchOnMain(screen, monitorEl, state, actions) {
  cleanupLunchOverlay();

  if (state.flags.lunchPhase === "intro") {
    const intro = renderLunchIntro(state, {
      mutateState: (mutator) => actions.mutateState(mutator),
    });
    _lunchOverlay = intro;
    screen.append(intro);
    return;
  }

  if (state.flags.lunchPhase === "result") {
    const result = renderLunchResult(state, actions, {
      onAfternoonStart: () => {
        actions.mutateState((draft) => beginLunchAfternoonTransition(draft));
      },
    });
    _lunchOverlay = result;
    monitorEl.append(result);
  }
}

function beginLunchAfternoonTransition(draft) {
  draft.flags = { ...draft.flags, lunchCutscenePending: true };
  delete draft.flags.lunchPhase;
  delete draft.flags.lunchQueue;
  delete draft.flags.lunchIndex;
  return draft;
}

function beginLunchAfternoonCutscene(screen, state, actions) {
  const runId = state.flags?.runId ?? "default";
  if (_lunchCutsceneRunId === runId) return;
  _lunchCutsceneRunId = runId;

  playClockCutscene(screen, () => {
    _lunchCutsceneRunId = null;
    actions.mutateState((draft) => {
      draft.gameMinute = Math.max(draft.gameMinute, 13 * 60);
      draft.flags = { ...draft.flags };
      delete draft.flags.lunchCutscenePending;
      return draft;
    });
  }, LUNCH_AFTERNOON_CUTSCENE);
}

function cleanupLunchOverlay() {
  _lunchOverlay?.remove();
  _lunchOverlay = null;
  document.querySelector("#app")?.querySelectorAll(".lunch-result-overlay, .lunch-narration-layer").forEach((node) => {
    node.remove();
  });
}

function renderSchedule(time, text) {
  return el("p", { class: "main-work-schedule-item" }, [
    el("strong", { text: time }),
    el("span", { text }),
  ]);
}

function renderTaskbar(gameMinute, onIntranetClick, registerIntranetBtn, onMessengerClick, registerMessengerBtn) {
  const intranetBtn = el("span", {
    class: "main-work-task-icon main-work-task-intranet",
    text: "사내포털",
    onClick: onIntranetClick,
  });
  const messengerBtn = el("span", {
    class: "main-work-task-icon main-work-task-messenger",
    onClick: onMessengerClick,
  });
  registerIntranetBtn?.(intranetBtn);
  registerMessengerBtn?.(messengerBtn);

  return el("footer", { class: "main-work-taskbar" }, [
    el("div", { class: "main-work-taskbar-left" }, [
      el("span", { class: "main-work-start-icon", title: "시작", "aria-label": "시작" }),
      intranetBtn,
      messengerBtn,
    ]),
  ]);
}

function ensureMessengerState(state) {
  const runId = state.flags?.runId ?? "default";
  if (_messengerState?.runId === runId) return _messengerState;
  _messengerState = createMessengerState(runId);
  return _messengerState;
}

function resetMessengerState(state) {
  if (_notifPanel) {
    _notifPanel.remove();
    _notifPanel = null;
  }
  _preservingNotifications = false;
  _preserveSpawnMs = null;
  _chatSnapshot = null;
  _spawnInFlight = false;
  if (_spawnTimeout) {
    clearTimeout(_spawnTimeout);
    _spawnTimeout = null;
  }
  _messengerState = createMessengerState(state.flags?.runId ?? "default");
  _hrPortalIntroSpawned = false;
}

function createMessengerState(runId) {
  return {
    runId,
    activeRoomId: "boss",
    isOpen: false,
    nextMessageId: 1,
    rooms: MESSENGER_ROOMS.reduce((rooms, room) => {
      rooms[room.id] = { ...room, messages: [] };
      return rooms;
    }, {}),
  };
}

function renderMessengerShell(container, state, actions, onClose) {
  if (!container || !_messengerState) return;
  const activeRoom = _messengerState.rooms[_messengerState.activeRoomId] ?? _messengerState.rooms.boss;

  const windowEl = el("section", { class: "main-work-messenger-window", role: "dialog", "aria-label": "사내 메신저" }, [
    el("header", { class: "main-work-messenger-titlebar" }, [
      el("div", { class: "main-work-messenger-brand" }, [
        el("span", { class: "main-work-messenger-logo", text: "💬" }),
        el("strong", { text: "Daehan Works Messenger" }),
      ]),
      el("div", { class: "main-work-messenger-window-actions" }, [
        el("button", { class: "main-work-messenger-close", type: "button", text: "×", "aria-label": "메신저 닫기", onClick: onClose }),
      ]),
    ]),
    el("div", { class: "main-work-messenger-body" }, [
      el("aside", { class: "main-work-messenger-rooms" }, [
        el("div", { class: "main-work-messenger-room-head", text: "채팅방" }),
        ...MESSENGER_ROOMS.map((room) => renderMessengerRoomButton(room, activeRoom.id, state, actions, onClose)),
      ]),
      renderMessengerThread(activeRoom, state, actions),
    ]),
  ]);

  container.replaceChildren(windowEl);
  requestAnimationFrame(() => {
    const log = container.querySelector(".main-work-messenger-thread-log");
    if (log) log.scrollTop = log.scrollHeight;
  });
}

function renderMessengerRoomButton(room, activeRoomId, state, actions, onClose) {
  const unread = getRoomUnreadCount(room.id);
  const selected = room.id === activeRoomId;
  return el("button", {
    class: `main-work-messenger-room${selected ? " active" : ""}${unread ? " has-unread" : ""}`,
    type: "button",
    onClick: () => {
      _messengerState.activeRoomId = room.id;
      markRoomRead(room.id);
      renderMessengerShell(document.querySelector(".main-work-messenger-slot"), state, actions, onClose);
      updateMessengerChrome();
    },
  }, [
    el("span", { class: "main-work-messenger-room-icon", text: room.icon }),
    el("span", { class: "main-work-messenger-room-name", text: `${room.title}${unread ? ` (${unread})` : ""}` }),
    ...(unread ? [el("i", { class: "main-work-messenger-unread-dot" })] : []),
  ]);
}

function renderMessengerThread(room, state, actions) {
  const messages = room.messages ?? [];
  return el("section", { class: "main-work-messenger-thread" }, [
    el("header", { class: "main-work-messenger-thread-head" }, [
      el("div", {}, [
        el("strong", { text: `${room.icon} ${room.title}` }),
        el("span", { text: `${messages.length}개 메시지` }),
      ]),
      el("span", { class: "main-work-messenger-presence", text: room.id === "hr" ? "인사 알림" : "업무 중" }),
    ]),
    el("div", { class: "main-work-messenger-thread-log" }, messages.length
      ? messages.map((message) => renderMessengerMessage(message, state, actions))
      : [el("p", { class: "main-work-messenger-empty", text: "아직 도착한 메시지가 없습니다." })]),
  ]);
}

function renderMessengerMessage(message, state, actions) {
  const headache = state.stats.health <= 30;
  const displayText = headache
    ? formatHeadacheDisplayText(message.text, { part: "body", seed: message.id, enabled: true })
    : message.text;
  const replies = getMessageReplyOptions(message);
  const flavorLabel = getMessageFlavorLabel(message);
  const expired = isMessageReplyExpired(message);
  const statusText = message.status === "replied"
    ? "답장 완료"
    : message.status === "processed"
      ? "처리 완료"
    : message.status === "later"
      ? "나중에"
    : message.status === "ignored" || expired
      ? "못 본 척"
      : "답장 없음";
  const canReply = message.needsReply && !message.status && !expired;
  const statusClass = message.status ?? (expired ? "ignored" : "pending");
  return el("article", { class: `main-work-messenger-message main-work-messenger-message-${message.kind}${message.subtype === "lore" ? " main-work-messenger-message-lore" : ""}` }, [
    ...(message.needsReply ? [el("span", { class: `main-work-messenger-status is-${statusClass}`, text: statusText })] : []),
    el("div", { class: "main-work-messenger-message-meta" }, [
      ...(flavorLabel ? [el("span", { class: "main-work-messenger-flavor", text: flavorLabel })] : []),
      el("strong", { text: message.from }),
      el("time", { text: formatTime(message.minute) }),
    ]),
    el("p", { class: message.text.includes("\n") ? "main-work-messenger-message-body is-multiline" : "main-work-messenger-message-body", text: displayText }),
    ...(message.kind === "hr" && !message.portalCompleted && canReply
      ? [el("p", { class: "main-work-messenger-portal-hint", text: "사내포털에서 먼저 확인하세요." })]
      : []),
    ...(canReply
      ? [el("div", { class: "main-work-messenger-replies" }, [
        ...replies.map((reply) => el("button", {
          class: `main-work-messenger-reply tone-${reply.tone}`,
          type: "button",
          text: reply.label,
          onClick: () => handleMessengerChoice(message.id, reply.id, actions),
        })),
        ...(message.allowIgnore === false ? [] : [el("button", {
          class: "main-work-messenger-ignore",
          type: "button",
          text: "못 본 척",
          onClick: () => handleMessengerChoice(message.id, "ignore", actions),
        })]),
      ])]
      : []),
  ]);
}

function updateMessengerChrome() {
  updateMessengerTaskbarButton(document.querySelector(".main-work-task-messenger"));
}

function updateMessengerTaskbarButton(button) {
  if (!button) return;
  const unread = getTotalUnreadCount();
  button.textContent = unread ? `💬 (${unread})` : "💬 메신저";
  button.classList.toggle("has-unread", unread > 0);
  button.setAttribute("aria-label", unread ? `메신저 읽지 않은 메시지 ${unread}개` : "메신저");
}

function handleMessengerChoice(messageId, choiceId, actions) {
  const message = findMessengerMessage(messageId);
  if (!message || message.status) return;
  clearReplyExpiryTimer(messageId);
  dismissMessengerToast(messageId);
  message.status = choiceId === "later"
    ? "later"
    : choiceId === "ignore"
      ? "ignored"
      : "replied";
  message.unread = false;
  const result = resolveMessageChoice(message, choiceId, {
    getBossHardReplyDelta,
  });
  applyMessengerResult(result, actions, message, choiceId);
  _messengerUpdater?.();
  updateMessengerChrome();
}

const BOSS_ATTENTION_WARN_AT = 3;
const BOSS_ATTENTION_INTERVIEW_AT = 6;

function getBossHardReplyDelta() {
  const key = getBossSpeechKey(_lastRenderedState ?? {});
  if (key === "smart-lazy") return {};
  if (key === "smart-busy") return { stress: 2 };
  if (key === "clumsy-busy") return { stress: 1 };
  return Math.random() < 0.5 ? {} : { stress: 3 };
}

function applyMessengerResult(result, actions, message, choiceId) {
  let shouldOpenInterview = false;
  let shouldOpenHrCall = false;
  let pendingEnding = null;
  actions.mutateState((draft) => {
    let next = applyDelta(draft, result.delta ?? {}, null);
    const logDelta = { ...(result.delta ?? {}) };
    next.counters.bossAttention = Math.max(0, (next.counters.bossAttention ?? 0) + (result.bossAttentionDelta ?? 0));
    next.counters.colleagueIgnoreCount = Math.max(0, (next.counters.colleagueIgnoreCount ?? 0) + (result.colleagueIgnoreDelta ?? 0));
    next.counters.hrIgnoreCount = Math.max(0, (next.counters.hrIgnoreCount ?? 0) + (result.hrIgnoreDelta ?? 0));

    if (message.kind === "boss" && choiceId === "ignore" && next.counters.bossAttention >= BOSS_ATTENTION_WARN_AT) {
      const warning = pickBossWarningMessage();
      addMessengerMessage(warning, actions, { silent: true, stateOverride: next });
      next = applyDelta(next, { stress: 2 }, null);
      logDelta.stress = (logDelta.stress ?? 0) + 2;
    }

    if (message.kind === "boss" && choiceId === "ignore" && next.counters.bossAttention >= BOSS_ATTENTION_INTERVIEW_AT) {
      shouldOpenInterview = true;
    }

    if (message.kind === "colleague" && next.counters.colleagueIgnoreCount >= 3 && !next.flags.colleagueAwayMessageSent) {
      const away = { ...getColleagueAwayMessage(), id: undefined };
      addMessengerMessage(away, actions, { silent: true, stateOverride: next });
      next.flags.colleagueAwayMessageSent = true;
    }

    if (message.kind === "hr" && choiceId === "ignore" && next.counters.hrIgnoreCount >= 3 && !next.flags.hrCallDone) {
      shouldOpenHrCall = true;
    }

    addLogEntry(next, {
      cause: buildChatLogCause(message, choiceId, result),
      delta: logDelta,
    });
    pendingEnding = checkEnding(next);
    return next;
  });

  if (result.delta?.workload !== undefined) {
    _localWorkload = Math.max(0, Math.min(100, _localWorkload + result.delta.workload));
  }

  if (pendingEnding) {
    actions.finishWith(pendingEnding);
    return;
  }
  if (shouldOpenInterview) openBossAttentionInterview(actions);
  if (shouldOpenHrCall) openHrCallEvent(actions);
}

function openBossAttentionInterview(actions) {
  if (_mainEventOverlay) return;
  pauseChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  cleanupPhoneSystem();

  const event = {
    id: "messenger-boss-interview",
    type: "boss",
    speaker: "팀장님",
    title: "팀장 면담",
    body: "{name}, 회의실로 모시겠습니다. \"요즘 진행 상황 파악이 잘 되지 않습니다. 메신저 답장이 자주 없던데 무슨 문제 있으십니까?\"",
    choices: [
      getBossInterviewChoice("sorry"),
      getBossInterviewChoice("promise"),
      getBossInterviewChoice("busy"),
      getBossInterviewChoice("fine"),
    ],
  };

  const container = document.querySelector(".main-work-monitor-screen") ?? document.querySelector("#app");
  _mainEventOverlay = renderMainEventPopup(event, {
    state: _lastRenderedState ?? {},
    onChoice: (choice) => closeBossAttentionInterview(actions, choice),
  });
  container?.append(_mainEventOverlay);
}

function closeBossAttentionInterview(actions, choice) {
  _mainEventOverlay?.remove();
  _mainEventOverlay = null;
  let pendingEnding = null;
  actions.mutateState((draft) => {
    let next = applyDelta(draft, choice.delta ?? {}, null);
    next.counters.bossAttention = 0;
    addLogEntry(next, {
      cause: choice.message,
      delta: choice.delta ?? {},
    });
    pendingEnding = checkEnding(next);
    return next;
  });
  if (pendingEnding) actions.finishWith(pendingEnding);
}

function openHrCallEvent(actions) {
  if (_mainEventOverlay) return;
  pauseChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  cleanupPhoneSystem();

  const event = {
    id: "hr-call",
    type: "positive",
    speaker: "인사팀",
    title: "인사팀 호출",
    body: "인사팀에서 미처리 알림 건으로 잠깐 확인을 요청했다. 담당자가 대신 정리해주면서 남은 처리 시간이 줄었다.",
    choices: [
      { id: "confirm", label: "확인한다", delta: { gameMinute: -30 }, message: "인사팀 호출 건을 처리했다." },
    ],
  };

  const container = document.querySelector(".main-work-monitor-screen") ?? document.querySelector("#app");
  _mainEventOverlay = renderMainEventPopup(event, {
    state: _lastRenderedState ?? {},
    onChoice: (choice) => closeHrCallEvent(actions, choice),
  });
  container?.append(_mainEventOverlay);
}

function closeHrCallEvent(actions, choice) {
  _mainEventOverlay?.remove();
  _mainEventOverlay = null;
  let pendingEnding = null;
  actions.mutateState((draft) => {
    let next = applyDelta(draft, choice.delta ?? {}, null);
    next.counters.hrIgnoreCount = 0;
    next.flags.hrCallDone = true;
    addLogEntry(next, {
      cause: choice.message,
      delta: choice.delta ?? {},
    });
    pendingEnding = checkEnding(next);
    return next;
  });
  if (pendingEnding) actions.finishWith(pendingEnding);
}

function getBossInterviewChoice(choiceId) {
  const key = getBossSpeechKey(_lastRenderedState ?? {});
  const choices = {
    sorry: {
      id: "sorry",
      label: "죄송합니다",
      delta: { stress: 5, gameMinute: 20, workload: -5 },
      hint: "분위기는 풀리지만, 회의실에서 꽤 시간을 쓴다.",
      message: "팀장 면담에서 먼저 사과했다.",
    },
    promise: {
      id: "promise",
      label: "앞으로 더 챙기겠습니다",
      delta: { stress: 4, gameMinute: 16, workload: -4 },
      hint: "약속으로 넘어가지만, 눈치를 쓰며 지내야 한다.",
      message: "팀장 면담에서 앞으로 메신저를 더 챙기겠다고 말했다.",
    },
    busy: {
      id: "busy",
      label: "바빴습니다",
      delta: { workload: -10, stress: 8, gameMinute: 25 },
      hint: "업무 조정을 노릴 수 있지만, 긴 면담으로 시간을 잃고 상사와 팽팽해질 수 있다.",
      message: "팀장 면담에서 요즘 바빴다고 말했다.",
    },
    fine: {
      id: "fine",
      label: "별 문제 없습니다",
      delta: { stress: 10, workload: 8, gameMinute: 12 },
      hint: "면담은 짧게 끝나지만, 남은 시간과 이후 업무 압박이 커질 수 있다.",
      message: "팀장 면담에서 별 문제 없다고 답했다.",
    },
  };
  const choice = { ...choices[choiceId], delta: { ...choices[choiceId].delta } };

  if (choiceId === "sorry") {
    if (key === "smart-lazy") choice.delta.workload = -8;
    if (key === "smart-busy") choice.delta.stress = 7;
    if (key === "clumsy-lazy") choice.delta.stress = 3;
  }
  if (choiceId === "promise") {
    if (key === "smart-lazy") choice.delta.workload = -6;
    if (key === "smart-busy") choice.delta.stress = 6;
    if (key === "clumsy-busy") choice.delta.gameMinute = 18;
    if (key === "clumsy-lazy") {
      choice.delta.stress = 2;
      choice.delta.gameMinute = 12;
    }
  }
  if (choiceId === "busy") {
    if (key === "smart-lazy") choice.delta.workload = -15;
    if (key === "smart-busy") {
      choice.delta.workload = -5;
      choice.delta.stress = 12;
    }
    if (key === "clumsy-busy") {
      choice.delta.workload = -8;
      choice.delta.stress = 6;
    }
    if (key === "clumsy-lazy") {
      choice.delta.workload = -3;
      choice.delta.stress = 10;
    }
  }
  if (choiceId === "fine") {
    if (key === "smart-lazy") {
      choice.delta.stress = 6;
      choice.delta.workload = 5;
    }
    if (key === "smart-busy") {
      choice.delta.stress = 15;
      choice.delta.workload = 12;
    }
    if (key === "clumsy-busy") choice.delta.stress = 8;
    if (key === "clumsy-lazy") {
      choice.delta.stress = 5;
      choice.delta.workload = 5;
    }
  }

  return choice;
}

function findMessengerMessage(messageId) {
  for (const room of Object.values(_messengerState?.rooms ?? {})) {
    const found = room.messages.find((message) => message.id === messageId);
    if (found) return found;
  }
  return null;
}

function markRoomRead(roomId) {
  const room = _messengerState?.rooms?.[roomId];
  if (!room) return;
  for (const message of room.messages) message.unread = false;
}

function addMessengerMessage(chat, actions, options = {}) {
  const messenger = _messengerState;
  if (!messenger) return;
  const roomId = MESSENGER_ROOM_BY_FROM[chat.from] ?? "system";
  const room = messenger.rooms[roomId];
  if (!room) return;
  const effectiveState = options.stateOverride ?? _lastRenderedState ?? {};
  const playerName = effectiveState.player?.name;
  const resolvedChat = chat.kind === "boss" ? personalizeBossChat(chat, playerName) : chat;
  const message = {
    ...resolvedChat,
    id: messenger.nextMessageId++,
    roomId,
    text: resolvedChat.resolvedText ?? resolvedChat.text ?? "",
    minute: effectiveState.gameMinute ?? _currentGameMinute,
    unread: !messenger.isOpen || messenger.activeRoomId !== roomId,
    needsReply: (chat.kind === "boss" && chat.subtype !== "warning")
      || (chat.kind === "colleague" && chat.subtype !== "away")
      || chat.kind === "hr",
    status: null,
    portalCompleted: chat.kind === "hr" ? false : undefined,
    spawnedAt: Date.now(),
    timerSec: 0,
  };
  if (message.needsReply) {
    message.originalTimerSec = getReplyTimerSec(chat);
    message.timerSec = message.originalTimerSec;
    message.replyExpiresAt = Date.now() + message.originalTimerSec * 1000;
  }
  room.messages.push(message);
  if (messenger.isOpen && messenger.activeRoomId === roomId) message.unread = false;
  updateMessengerChrome();
  _messengerUpdater?.();
  if (message.kind === "hr") {
    _intranetUpdater?.();
    updateIntranetTaskbarButton(document.querySelector(".main-work-task-intranet"));
  }
  if (!options.silent) {
    playChatNotificationSound();
    if (message.needsReply) {
      showMessengerToast(message, actions);
      scheduleReplyExpiry(message, actions);
    }
  } else if (message.needsReply) {
    scheduleReplyExpiry(message, actions);
  }
  return message;
}

function getTotalUnreadCount() {
  return Object.values(_messengerState?.rooms ?? {}).reduce((total, room) => total + getRoomUnreadCount(room.id), 0);
}

function getRoomUnreadCount(roomId) {
  return (_messengerState?.rooms?.[roomId]?.messages ?? []).filter((message) => message.unread).length;
}

function findFirstUnreadRoomId() {
  return MESSENGER_ROOMS.find((room) => getRoomUnreadCount(room.id) > 0)?.id ?? null;
}

function getReplyTimerSec(chat) {
  if (chat.kind === "boss") return CHAT_REPLY_TIMER_SEC.boss;
  if (chat.kind === "hr") return CHAT_REPLY_TIMER_SEC.hr;
  return CHAT_REPLY_TIMER_SEC.colleague;
}

function getMessageReplyTotalSec(message) {
  return message.originalTimerSec ?? message.timerSec ?? getReplyTimerSec(message);
}

function ensureMessageReplyDeadline(message) {
  if (message.replyExpiresAt) return;
  const totalSec = getMessageReplyTotalSec(message);
  if (!totalSec) return;
  message.originalTimerSec = message.originalTimerSec ?? totalSec;
  message.replyExpiresAt = (message.spawnedAt ?? Date.now()) + totalSec * 1000;
}

function getMessageReplyRemainingMs(message, now = Date.now()) {
  ensureMessageReplyDeadline(message);
  if (!message.replyExpiresAt) return 0;
  return Math.max(0, message.replyExpiresAt - now);
}

function collectPendingReplyMessages() {
  const pending = [];
  for (const room of Object.values(_messengerState?.rooms ?? {})) {
    for (const message of room.messages) {
      if (!message.needsReply || message.status) continue;
      if (getMessageReplyRemainingMs(message) <= 0) continue;
      pending.push(message);
    }
  }
  return pending;
}

function isMessageReplyExpired(message) {
  if (!message?.needsReply || message.status) return false;
  return getMessageReplyRemainingMs(message) <= 0;
}

function getMessengerToastKind(message) {
  if (message.kind === "boss") {
    return message.subtype === "praise" ? "boss-praise" : "boss-task";
  }
  if (message.kind === "colleague") {
    if (message.subtype === "lore") return "colleague-lore";
    return message.subtype === "favor" || message.subtype === "offer" ? "colleague-help" : "colleague-chat";
  }
  return "notice";
}

function getMessengerRoomIcon(roomId) {
  return MESSENGER_ROOMS.find((room) => room.id === roomId)?.icon ?? "💬";
}

function findMessengerToast(messageId, root = null) {
  const selector = `.main-work-messenger-toast[data-message-id="${messageId}"]`;
  if (root) return root.querySelector(selector);
  return document.querySelector(selector);
}

function muteToastEnterAnimations(root = _notifPanel) {
  root?.querySelectorAll(".main-work-messenger-toast").forEach((toast) => {
    toast.classList.add("is-reattached");
  });
}

function showMessengerToast(message, actions) {
  if (!message.needsReply) return;

  const existingToast = findMessengerToast(message.id);
  if (existingToast) {
    existingToast._messageRef = message;
    return;
  }
  if (!_notifPanel) return;

  const existing = _notifPanel.querySelectorAll(".main-work-messenger-toast");
  if (existing.length >= MAX_MESSENGER_TOASTS) existing[0].remove();

  ensureMessageReplyDeadline(message);
  const totalSec = getMessageReplyTotalSec(message);
  const remainingSec = getMessageReplyRemainingMs(message) / 1000;
  const elapsedSec = Math.max(0, totalSec - remainingSec);

  const timerBar = el("div", { class: "main-work-messenger-toast-timer-bar" });
  timerBar.style.animationDuration = `${totalSec}s`;
  if (elapsedSec > 0) {
    timerBar.style.animationDelay = `-${elapsedSec}s`;
  }

  const toast = el("article", {
    class: `main-work-messenger-toast main-work-messenger-toast-${getMessengerToastKind(message)}`,
    "data-message-id": String(message.id),
  }, [
    el("div", { class: "main-work-messenger-toast-timer" }, [timerBar]),
    el("div", { class: "main-work-messenger-toast-main" }, [
      el("button", {
        class: "main-work-messenger-toast-body",
        type: "button",
        onClick: () => _openMessengerRoom?.(message.roomId),
      }, [
        el("span", { class: "main-work-messenger-toast-avatar", text: getMessengerRoomIcon(message.roomId) }),
        el("span", { class: "main-work-messenger-toast-copy" }, [
          el("strong", { text: message.from }),
          el("span", { text: message.text }),
        ]),
        el("span", { class: "main-work-messenger-toast-state", text: "답장 필요" }),
      ]),
      el("button", {
        class: "main-work-messenger-toast-close",
        type: "button",
        title: "알림 닫기",
        "aria-label": "알림 닫기",
        text: "×",
        onClick: (event) => {
          event.stopPropagation();
          playClickSfx();
          dismissMessengerToast(message.id, "is-dismissed");
        },
      }),
    ]),
  ]);

  toast._messageRef = message;
  timerBar.addEventListener("animationend", () => {
    expirePendingReply(message.id, actions);
  });

  _notifPanel.append(toast);
}

function dismissMessengerToast(messageId, exitClass = "is-replied") {
  const toast = _notifPanel?.querySelector(`.main-work-messenger-toast[data-message-id="${messageId}"]`);
  if (!toast) return;
  toast.classList.add(exitClass);
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
  setTimeout(() => toast.remove(), 220);
}

function scheduleReplyExpiry(message, actions) {
  if (!message.needsReply || message.status) return;
  clearReplyExpiryTimer(message.id);
  const remainingMs = getMessageReplyRemainingMs(message);
  if (remainingMs <= 0) {
    expirePendingReply(message.id, actions);
    return;
  }
  const timeoutId = setTimeout(() => expirePendingReply(message.id, actions), remainingMs);
  _replyExpireTimers.set(message.id, timeoutId);
}

function clearReplyExpiryTimer(messageId) {
  const timeoutId = _replyExpireTimers.get(messageId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    _replyExpireTimers.delete(messageId);
  }
}

function clearAllReplyExpiryTimers() {
  for (const timeoutId of _replyExpireTimers.values()) clearTimeout(timeoutId);
  _replyExpireTimers.clear();
}

function expirePendingReply(messageId, actions) {
  const message = findMessengerMessage(messageId);
  if (!message || message.status || !message.needsReply) return;
  if (!isMessageReplyExpired(message)) {
    scheduleReplyExpiry(message, actions);
    return;
  }
  const toast = _notifPanel?.querySelector(`.main-work-messenger-toast[data-message-id="${messageId}"]`);
  if (toast) toast.classList.add("is-expiring");
  handleMessengerChoice(messageId, "ignore", actions);
}

// ── 채팅 알림 시스템 ─────────────────────────────────────────

// app.innerHTML="" 직전에 호출. 메인→메인 리렌더면 알림 DOM을 보존하고, 메인→타씬이면 스냅샷을 남긴다.
export function prepareMainWorkForRender(prevScene, nextScene) {
  if (nextScene !== "main") {
    _lunchCutsceneRunId = null;
  }

  if (prevScene !== "main" || !_messengerState) {
    _preservingNotifications = false;
    _preservingMeetingEvent = false;
    return;
  }

  if (nextScene !== "main") {
    _preservingMeetingEvent = false;
  }

  if (nextScene === "main") {
    if (_notifPanel?.parentElement) {
      _notifPanel.remove();
      pauseChatSystem();
    }
    if (_meetingEventOverlay?.parentElement) {
      _meetingEventOverlay.remove();
      _preservingMeetingEvent = true;
    }
    _preserveSpawnMs = _spawnTimeout
      ? Math.max(0, _spawnDelayMs - (Date.now() - _spawnScheduledAt))
      : null;
    if (_spawnTimeout) {
      clearTimeout(_spawnTimeout);
      _spawnTimeout = null;
    }
    clearAllReplyExpiryTimers();
    _preservingNotifications = Boolean(_notifPanel);
    // 메인→메인 리렌더에서는 스냅샷 복원을 쓰지 않는다(미니게임 복귀용 스냅샷만 유지).
    _chatSnapshot = null;
    return;
  }

  if (!_chatSnapshot) {
    _chatSnapshot = captureChatSnapshot();
  }
  pauseChatSystem();
  if (_spawnTimeout) {
    clearTimeout(_spawnTimeout);
    _spawnTimeout = null;
  }
  clearAllReplyExpiryTimers();
  if (_notifPanel) {
    _notifPanel.remove();
    _notifPanel = null;
  }
  _preservingNotifications = false;
  _preserveSpawnMs = null;
}

function mountNotificationPanel(container) {
  container.querySelectorAll(".chat-notif-panel").forEach((panel) => {
    if (panel !== _notifPanel) panel.remove();
  });

  if (_notifPanel?.isConnected) {
    if (_notifPanel.parentElement !== container) {
      container.append(_notifPanel);
      muteToastEnterAnimations(_notifPanel);
    }
    return _notifPanel;
  }

  if (_notifPanel) {
    container.append(_notifPanel);
    muteToastEnterAnimations(_notifPanel);
    return _notifPanel;
  }

  _notifPanel = el("div", { class: "chat-notif-panel main-work-messenger-runtime" });
  container.append(_notifPanel);
  return _notifPanel;
}

function syncPendingReplyNotifications(state, actions) {
  for (const message of collectPendingReplyMessages()) {
    if (findMessengerToast(message.id)) {
      scheduleReplyExpiry(message, actions);
      continue;
    }
    showMessengerToast(message, actions);
    scheduleReplyExpiry(message, actions);
  }
}

function ensureChatSpawnLoop(state, actions) {
  if (_spawnTimeout || _chatSnapshot) return;
  const pending = collectPendingReplyMessages();
  scheduleSpawn(
    state,
    actions,
    pending.length > 0 ? CHAT_SPAWN_INTERVAL_MS : CHAT_SPAWN_FIRST_MS,
  );
}

function resumeNotificationPanel(container, state, actions) {
  mountNotificationPanel(container);
  resumeChatSystem();
  for (const message of collectPendingReplyMessages()) {
    scheduleReplyExpiry(message, actions);
  }
  ensureChatSpawnLoop(state, actions);
}

function tryReattachPreservedNotifications(container, state, actions) {
  if (!_preservingNotifications || !_notifPanel) return false;

  mountNotificationPanel(container);
  resumeChatSystem();
  _chatSnapshot = null;
  for (const message of collectPendingReplyMessages()) {
    scheduleReplyExpiry(message, actions);
  }
  if (_preserveSpawnMs != null) {
    scheduleSpawn(state, actions, _preserveSpawnMs);
  } else if (!_spawnTimeout) {
    ensureChatSpawnLoop(state, actions);
  }
  _preserveSpawnMs = null;
  _preservingNotifications = false;
  return true;
}

function ensureNotificationPanelMounted(container, state, actions) {
  if (tryReattachPreservedNotifications(container, state, actions)) return true;
  if (!_notifPanel?.isConnected) return false;
  resumeNotificationPanel(container, state, actions);
  return true;
}

export function cleanupMainWorkSystems() {
  cleanupChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  cleanupPhoneSystem();
  cleanupMainEventSystem();
  cleanupMeetingEventSystem();
  cleanupStatusEventSystem();
  cleanupLunchOverlay();
}

function cleanupStatusEventSystem() {
  if (_statusEventOverlay) {
    _statusEventOverlay.remove();
    _statusEventOverlay = null;
  }
}

// 화면 전환(미니게임 진입 등)이나 리렌더로 채팅 패널이 사라지기 직전 상태를 스냅샷으로
// 남겨둔다. startChatNotifications가 같은 판으로 복귀했을 때 이 스냅샷을 보고
// "타이머가 멈춘 채" 그대로 이어서 보여준다.
function captureChatSnapshot() {
  if (!_messengerState) return null;
  const now = Date.now();

  const pendingReplies = [];
  for (const room of Object.values(_messengerState.rooms ?? {})) {
    for (const message of room.messages) {
      if (!message.needsReply || message.status) continue;
      const remainingMs = getMessageReplyRemainingMs(message, now);
      if (remainingMs <= 0) continue;
      pendingReplies.push({ messageId: message.id, remainingMs });
    }
  }

  const nextSpawnRemainingMs = _spawnTimeout
    ? Math.max(0, _spawnDelayMs - (now - _spawnScheduledAt))
    : (_chatSnapshot?.nextSpawnRemainingMs ?? CHAT_SPAWN_FIRST_MS);

  return {
    pendingReplies,
    nextSpawnRemainingMs,
    localWorkload: _localWorkload,
  };
}

function cleanupChatSystem() {
  if (_preservingNotifications) return;

  if (_notifPanel) {
    _notifPanel.remove();
    _notifPanel = null;
  }
  if (_spawnTimeout) { clearTimeout(_spawnTimeout); _spawnTimeout = null; }
  clearAllReplyExpiryTimers();
}

function pauseChatSystem() {
  if (_spawnTimeout) { clearTimeout(_spawnTimeout); _spawnTimeout = null; }
  if (_notifPanel) {
    _notifPanel.querySelectorAll(".chat-notif-timer-bar, .main-work-messenger-toast-timer-bar").forEach((bar) => {
      bar.style.animationPlayState = "paused";
    });
  }
}

function resumeChatSystem() {
  if (!_notifPanel) return;
  _notifPanel.querySelectorAll(".chat-notif-timer-bar, .main-work-messenger-toast-timer-bar").forEach((bar) => {
    bar.style.animationPlayState = "running";
  });
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

function clearPhonePlanTimers(plan) {
  if (plan.timeoutId) {
    clearTimeout(plan.timeoutId);
    _phoneTimeouts.delete(plan.timeoutId);
    plan.timeoutId = null;
  }
  if (plan.expireTimerId) {
    clearTimeout(plan.expireTimerId);
    plan.expireTimerId = null;
  }
}

function abandonRingingPhonePlans() {
  for (const plans of phonePlans.values()) {
    for (const plan of plans) {
      if (plan.status !== "ringing") continue;
      clearPhonePlanTimers(plan);
      plan.status = "done";
    }
  }
  stopPhoneRingAudio();
  if (_phoneOverlay) {
    _phoneOverlay.remove();
    _phoneOverlay = null;
  }
}

function cleanupPhoneSystem() {
  for (const timeout of _phoneTimeouts) clearTimeout(timeout);
  _phoneTimeouts.clear();
  for (const plans of phonePlans.values()) {
    for (const plan of plans) {
      clearPhonePlanTimers(plan);
    }
  }
  stopPhoneRingAudio();
  if (_phoneOverlay) {
    _phoneOverlay.remove();
    _phoneOverlay = null;
  }
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

function cleanupMeetingEventSystem() {
  if (_preservingMeetingEvent) return;
  if (_meetingEventTimeout) {
    clearTimeout(_meetingEventTimeout);
    _meetingEventTimeout = null;
  }
  if (_meetingEventOverlay) {
    _meetingEventOverlay.remove();
    _meetingEventOverlay = null;
  }
}

function getPendingStatusEvent(state) {
  if (!state.flags?.handoverGuideSeen) return null;
  const triggered = state.flags?.statusEvents ?? {};
  if (state.stats.health <= 30 && !triggered.headache) return "headache";
  if (state.stats.stress >= 70 && !triggered.burnout) return "burnout";
  return null;
}

function pauseMainWorkForBlockingEvent() {
  pauseChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  abandonRingingPhonePlans();
}

function showStatusEventPopup(type, state, container, actions) {
  if (_statusEventOverlay) return;
  if (type === "headache") {
    showHeadacheStatusPopup(state, container, actions);
    return;
  }
  const config = STATUS_EVENT_CONFIGS[type];
  if (!config) return;
  pauseMainWorkForBlockingEvent();
  playSfx(EVENT_SFX); // 이벤트 팝업 발생 효과음

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
      const timeCost = applyWorkTimeCost(draft, 10);
      addLogEntry(draft, {
        cause: config.logCause,
        delta: { gameMinute: 10, ...timeCost.delta },
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

function showHeadacheStatusPopup(state, container, actions) {
  pauseMainWorkForBlockingEvent();
  const openedAt = Date.now();
  const clockEl = container.querySelector(".main-work-current-time");

  _statusEventOverlay = mountHeadacheDialog(container, {
    gameMinute: state.gameMinute,
    clockEl,
    onConfirm: () => {
      const phaseIndex = getMainPhaseIndex(state);
      const phaseKey = getMainPhaseKey(state, phaseIndex);
      const startedAt = mainPhaseStarts.get(phaseKey);
      if (startedAt) mainPhaseStarts.set(phaseKey, startedAt + (Date.now() - openedAt));

      let pendingEnding = null;
      let afterMinute = state.gameMinute;
      actions.mutateState((draft) => {
        pendingEnding = applyHeadacheEventToDraft(draft);
        afterMinute = draft.gameMinute;
        return draft;
      });

      if (pendingEnding) actions.finishWith(pendingEnding);
      _statusEventOverlay = null;
      return { afterMinute };
    },
  });
}

function shouldShowMeetingEvent(state) {
  const phaseIndex = getMainPhaseIndex(state);
  return phaseIndex >= 2 && phaseIndex <= 3 && state.flags?.meetingEventDone === false;
}

function showMeetingEventPopup(state, container, actions) {
  if (_meetingEventOverlay) {
    if (!_meetingEventOverlay.isConnected) {
      container.append(_meetingEventOverlay);
    }
    _preservingMeetingEvent = false;
    return;
  }
  playSfx(EVENT_SFX); // 이벤트 팝업 발생 효과음
  pauseChatSystem();
  cleanupMainClock();
  cleanupMainPhaseTimer();
  cleanupPhoneSystem();
  cleanupMainEventSystem();

  _meetingEventOverlay = renderMeetingIntroPopup();
  container.append(_meetingEventOverlay);

  _meetingEventTimeout = setTimeout(() => {
    _meetingEventTimeout = null;
    const outcome = getMeetingEventOutcome(state);
    const resultPopup = renderMeetingOutcomePopup(outcome, state, actions);
    if (_meetingEventOverlay?.isConnected) {
      _meetingEventOverlay.replaceWith(resultPopup);
    }
    _meetingEventOverlay = resultPopup;
  }, 1800);
}

function renderMeetingIntroPopup() {
  return el("div", { class: "main-event-overlay" }, [
    el("article", { class: "main-event-card main-event-common", role: "dialog", "aria-modal": "true" }, [
      el("header", { class: "main-event-titlebar" }, [
        el("div", { class: "main-event-source" }, [
          el("span", { class: "main-event-diamond", text: "◆" }),
          el("span", { text: "전체 회의" }),
        ]),
        el("time", { class: "main-event-timer", text: "13:00" }),
      ]),
      el("section", { class: "main-event-body" }, [
        el("p", { class: "main-event-kicker", text: "회의실" }),
        el("h2", { text: "회의가 진행 중이다" }),
        el("p", { class: "main-event-copy", text: "동료들이 자리에 앉았다. 프로젝터에 오늘 자료가 떴다." }),
      ]),
    ]),
  ]);
}

function getMeetingEventOutcome(state) {
  const forced = state.flags?.devMeetingOutcome;
  if (forced === "shame" || forced === "praise" || forced === "followup") return forced;

  const recent = (state.counters?.minigameResults ?? []).slice(-2).map((entry) => entry.result);
  const failCount = recent.filter((result) => result === "fail").length;
  const partialCount = recent.filter((result) => result === "partial").length;
  if (failCount >= 1 || partialCount >= 2) return "shame";

  const successCount = recent.filter((result) => result === "success").length;
  if ((recent.length >= 2 && successCount === 2) || state.stats.workload <= 50) return "praise";

  return "followup";
}

function renderMeetingOutcomePopup(outcome, state, actions) {
  const event = buildMeetingOutcomeEvent(outcome, state);

  return renderMainEventPopup(event, {
    state,
    onChoice: (choice) => closeMeetingEventChoice(actions, state, choice, outcome),
  });
}

function buildMeetingOutcomeEvent(outcome, state) {
  const line = getMeetingBossLine(outcome, state);
  const playerName = state.player?.name;
  const templates = {
    shame: {
      title: "분위기가 싸해졌다",
      body: `전체 회의 중, 팀장님이 자료를 가리키며 말씀하셨습니다. "${line}" 회의실 공기가 순간적으로 굳었습니다.`,
      kicker: "전체 회의",
      choices: [
        {
          id: "confirm",
          label: "견딘다",
          delta: { stress: 20, health: -5 },
          message: "전체 회의에서 자료가 공개적으로 지적됐다.",
        },
      ],
    },
    praise: {
      title: "짧은 칭찬",
      body: `전체 회의 중, 팀장님이 고개를 끄덕이며 말씀하셨습니다. "${line}"`,
      kicker: "전체 회의",
      choices: [
        {
          id: "confirm",
          label: "고개를 끄덕인다",
          delta: { stress: -15 },
          message: "전체 회의에서 짧게 칭찬받았다.",
        },
      ],
    },
    followup: {
      title: "추가 업무가 생겼다",
      body: `회의가 끝나갈 무렵, 팀장님이 말씀하셨습니다. "${line}"`,
      kicker: "전체 회의",
      choices: [
        {
          id: "accept",
          label: "맡는다",
          delta: { workload: 10, stress: 5 },
          message: "회의 후속 업무를 맡았다.",
        },
        {
          id: "reject",
          label: "거절한다",
          next: "meeting-reject",
          hint: "말을 잘못하면 결국 업무가 올 수 있다",
        },
      ],
    },
  };

  const template = templates[outcome] ?? templates.followup;
  return {
    id: `meeting-${outcome}`,
    type: "common",
    speaker: "전체 회의",
    kicker: template.kicker,
    title: template.title,
    body: personalizeBossEventBody(template.body, playerName),
    choices: template.choices,
  };
}

function closeMeetingEventChoice(actions, state, choice, outcome) {
  _preservingMeetingEvent = false;
  if (_meetingEventTimeout) {
    clearTimeout(_meetingEventTimeout);
    _meetingEventTimeout = null;
  }
  _meetingEventOverlay?.remove();
  _meetingEventOverlay = null;

  const finalChoice = choice.next === "meeting-reject" ? getMeetingRejectChoice(state) : choice;
  const logCause = finalChoice.reaction
    ? `${finalChoice.message} ${finalChoice.reaction}`
    : finalChoice.message;
  let pendingEnding = null;
  actions.mutateState((draft) => {
    let next = applyDelta(draft, finalChoice.delta ?? {}, null);
    if (outcome === "praise") next.counters.successStreak = 0;
    if (outcome === "shame") next.counters.failures = 0;
    next.flags.meetingEventDone = true;
    next.flags.devTriggerMeetingEvent = false;
    delete next.flags.devMeetingOutcome;
    addLogEntry(next, {
      cause: logCause,
      delta: finalChoice.delta ?? {},
    });
    pendingEnding = checkEnding(next);
    return next;
  });

  if (pendingEnding) actions.finishWith(pendingEnding);
}

function getMeetingRejectChoice(state) {
  const key = getBossSpeechKey(state);
  const success = Math.random() < getBossRejectSuccessRate(key);
  const reactions = {
    "smart-busy": success ? "팀장님이 잠깐 눈치를 주시더니 넘어가셨습니다." : "팀장님이 \"그럼 직접 처리해 주세요\"라고 말씀하셨습니다.",
    "smart-lazy": success ? "팀장님이 \"그럼 다음에 부탁드리겠습니다\"라고 말씀하셨습니다." : "팀장님이 \"그래도 오늘 안으로 부탁드립니다\"라고 말씀하셨습니다.",
    "clumsy-busy": success ? "팀장님이 \"그럼 다른 분께 여쭤볼게요!\"라고 말씀하셨습니다." : "팀장님이 \"일단 한번 해보세요!\"라고 말씀하셨습니다.",
    "clumsy-lazy": success ? "팀장님이 \"알겠습니다…\"라고 중얼거리셨습니다." : "팀장님이 \"위에서 지시하신 건데…\"라고 말씀하셨습니다.",
  };
  return {
    id: "reject",
    delta: success ? {} : { workload: 10, stress: 15 },
    message: success ? "후속 업무를 넘기지 않았다." : "결국 후속 업무를 맡게 됐다.",
    reaction: reactions[key] ?? reactions["smart-busy"],
  };
}

function getMeetingBossLine(outcome, state) {
  const key = getBossSpeechKey(state);
  const playerName = state.player?.name;
  const lines = {
    shame: {
      "smart-busy": "{name}, 이 수준이면 다음 회의에 다시 설명해 주셔야 합니다.",
      "smart-lazy": "{name}, 센스 있게 정리해 주셨어야 합니다. 이번엔 아쉽습니다.",
      "clumsy-busy": "{name}, 느낌은 있는데, 제가 원한 방향이 아닙니다!",
      "clumsy-lazy": "{name}, 제가 뭐라고 하셨는지… 일단 보완해 주세요.",
    },
    praise: {
      "smart-busy": "{name}, 이 정도 정리면 바로 넘어가도 되겠습니다.",
      "smart-lazy": "{name}, 덕분에 회의가 빨리 끝났습니다.",
      "clumsy-busy": "{name}, 오, 이번엔 느낌이 괜찮으십니다!",
      "clumsy-lazy": "{name}, 이번 결과물 괜찮으십니다.",
    },
    followup: {
      "smart-busy": "{name}, 회의록은 오늘 안으로 올려 주세요.",
      "smart-lazy": "{name}, 정리해서 공유만 부탁드립니다.",
      "clumsy-busy": "{name}, 일단 정리해 주세요! 방향은 보고 다시 잡아봅시다!",
      "clumsy-lazy": "{name}, 위에서 보내라고 하셨습니다. 저도 내용은 잘…",
    },
  };
  const raw = lines[outcome]?.[key] ?? lines[outcome]?.["smart-busy"] ?? "";
  return fillBossText(raw, playerName);
}

function getBossSpeechKey(state) {
  const raw = state.bossType ?? state.boss?.id ?? state.boss?.name;
  const aliases = {
    똑부: "smart-busy",
    똑게: "smart-lazy",
    멍부: "clumsy-busy",
    멍게: "clumsy-lazy",
    "smart-busy": "smart-busy",
    "smart-lazy": "smart-lazy",
    "clumsy-busy": "clumsy-busy",
    "clumsy-lazy": "clumsy-lazy",
  };
  return aliases[raw] ?? "smart-busy";
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
    if (isMeetingOnlyMainEvent(plan.event)) {
      plan.event = null;
      plan.status = "done";
    }
    return plan;
  }

  let event = forcedEvent ?? selectMainEvent(state, phaseIndex);
  if (isMeetingOnlyMainEvent(event)) event = null;
  plan = {
    phaseIndex,
    event,
    openAt: Date.now() + MAIN_EVENT_DELAY_MS,
    status: event ? "waiting" : "done",
  };
  mainEventPlans.set(key, plan);
  return plan;
}

function isMeetingOnlyMainEvent(event) {
  return event?.id === "public-praise" || event?.id === "public-shame";
}

function selectMainEvent(state, phaseIndex) {
  if (Math.random() >= MAIN_EVENT_CHANCE) return null;

  const bossOrderChance = getBossOrderChance(state);
  if (Math.random() < bossOrderChance) return getBossMainEvent("sudden-order");

  if (canHiddenBreak(state) && Math.random() < 0.35) return getBossMainEvent("hidden-break");
  if (Math.random() < 0.32) return getColleagueMainEvent("colleague-help");

  const generalPool = [
    { event: getBossMainEvent("sudden-order"), weight: 18 + (phaseIndex * 4) },
    { event: getColleagueMainEvent("colleague-dump"), weight: 24 },
    { event: getColleagueMainEvent("desk-chat"), weight: 18 },
    { event: getColleagueMainEvent("ginseng-gift"), weight: getGinsengGiftWeight(state) },
    { event: getPositiveMainEvent("small-bonus"), weight: 13 },
  ];
  return pickWeightedEvent(generalPool);
}

function getGinsengGiftWeight(state) {
  const trust = state.colleagueTrust ?? 30;
  return 20 + (trust >= 45 ? 6 : 0);
}

function selectForcedMainEvent(state) {
  if (state.flags?.forcedIncentive) return getIncentiveEvent(state);
  if (state.flags?.forcedShortsScolding) return getBossMainEvent("work-attitude");
  if (state.flags?.badMailInterview) return getBossMainEvent("boss-interview");
  // public-shame / public-praise는 페이즈 2~3 회의 이벤트(showMeetingEventPopup) 전용
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

// 체력 회복 인센티브 — 보유 유형 아이템(커피파→커피, 담배파→담배)을 무료로 지급(단일 사용)
function getIncentiveEvent(state) {
  const typeItem = PLAYER_TYPES[state.player?.type]?.item ?? "coffee";
  const label = items[typeItem]?.label ?? typeItem;
  return {
    id: "incentive-item",
    type: "positive",
    title: "컨디션 회복 인센티브",
    speaker: "사내 이벤트",
    body: `많이 지쳐 보이네요. 회복하라고 ${label} 하나 챙겨드릴게요.`,
    choices: [
      { id: "accept", label: "감사히 받는다", item: typeItem, delta: {}, message: `인센티브로 ${label}을(를) 받았다.` },
    ],
  };
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
  playSfx(EVENT_SFX); // 이벤트 팝업 발생 효과음
  const choices = event.choices ?? [];
  const playerName = state.player?.name;
  const bodyText = event.type === "boss" || event.speaker === "팀장님"
    ? personalizeBossEventBody(event.body, playerName)
    : event.body;
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
        el("p", { class: "main-event-kicker", text: event.kicker ?? (event.type === "boss" ? "팀장님" : event.type === "colleague" ? "동료" : "공통 이벤트") }),
        el("h2", { text: event.title }),
        el("p", { class: "main-event-copy", text: bodyText }),
        el("div", { class: getMainEventChoiceGridClass(choices.length) }, choices.map((choice, index) =>
          renderMainEventChoice(choice, state, () => onChoice(choice), index, choices.length),
        )),
      ]),
    ]),
  ]);
}

function getMainEventChoiceGridClass(count) {
  if (count === 3) return "main-event-choice-grid main-event-choice-grid--triple";
  return "main-event-choice-grid";
}

function getMainEventChoiceTone(index, total) {
  if (index === 0) return "accept";
  if (total === 4 && index === 1) return "neutral";
  return "reject";
}

function renderMainEventChoice(choice, state, onClick, index, total = 1) {
  const tone = getMainEventChoiceTone(index, total);
  return el("button", {
    class: `main-event-choice main-event-choice-${tone}`,
    type: "button",
    onClick: () => { playClickSfx(); onClick(); },
  }, [
    el("strong", { text: choice.label }),
    el("span", { class: "main-event-preview" }, renderMainEventPreview(choice, state)),
  ]);
}

function renderMainEventPreview(choice, state) {
  if (choice.hint) return [el("span", { text: choice.hint })];
  if (choice.next === "reject-reason") return [el("span", { text: "거절 사유 선택" })];
  if (choice.next === "meeting-reject") return choice.hint ? [el("span", { text: choice.hint })] : [];

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
    ]),
    el("section", { class: "main-event-body" }, [
      el("p", { class: "main-event-hint", text: "상사 성향에 따라 결과가 달라진다" }),
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
    const pickedItem = pickMainEventItem(choice, draft);
    let next = applyDelta(draft, choice.delta ?? {}, null);
    next.inventory = [...(next.inventory ?? [])];
    if (pickedItem) {
      // 카운트 기반 소비 모델: 이미 보유한 종류면 중복 추가하지 않고, 누적 사용 횟수만 초기화해 다시 사용 가능하게
      if (!next.inventory.includes(pickedItem)) next.inventory.push(pickedItem);
      next.counters = { ...next.counters, itemUses: { ...(next.counters?.itemUses ?? {}), [pickedItem]: 0 } };
    }

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

function pickMainEventItem(choice, state) {
  if (choice.item) return choice.item;
  if (!Array.isArray(choice.randomItem) || choice.randomItem.length === 0) return null;
  const pool = choice.randomItem;
  if (pool.includes("ginseng") && pool.includes("coffee") && (state?.stats?.health ?? 100) <= 50) {
    return Math.random() < 0.7 ? "ginseng" : "coffee";
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function applyMainEventFlags(state, event, choice, phaseIndex) {
  state.counters.mainEventCount = (state.counters.mainEventCount ?? 0) + 1;
  state.counters.mainPhaseEventUsed = phaseIndex;

  if (event.id === "boss-interview") state.flags.badMailInterview = false;
  if (event.id === "work-attitude") { state.flags.forcedShortsScolding = false; state.counters.shortsStreak = 0; }
  if (event.id === "incentive-item") state.flags.forcedIncentive = false;
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

  const plans = getPhonePlans(state, phaseIndex, durationSec);
  for (const plan of plans) {
    if (plan.status === "done") continue;

    if (plan.status === "ringing") {
      restoreRingingPhone(screen, state, actions, plan);
      continue;
    }

    const delayMs = Math.max(0, plan.ringAt - Date.now());
    const timeout = setTimeout(() => ringPhone(screen, state, actions, plan), delayMs);
    _phoneTimeouts.add(timeout);
    plan.timeoutId = timeout;
  }
}

function getPhonePlans(state, phaseIndex, durationSec) {
  const key = getMainPhaseKey(state, phaseIndex);
  const existing = phonePlans.get(key);
  if (existing) return existing;

  const plans = [];
  for (let slot = 0; slot < PHONE_CALLS_PER_PHASE; slot += 1) {
    if (Math.random() >= PHONE_CHANCE_BY_PHASE[phaseIndex]) continue;

    const slotStart = (durationSec / PHONE_CALLS_PER_PHASE) * slot;
    const slotLen = durationSec / PHONE_CALLS_PER_PHASE;
    const minSec = slotStart + slotLen * 0.05;
    const maxSec = slotStart + slotLen * 0.55;
    const delaySec = minSec + Math.random() * Math.max(0.5, maxSec - minSec);
    const call = phoneCallPool[Math.floor(Math.random() * phoneCallPool.length)];
    plans.push({
      phaseIndex,
      ringAt: Date.now() + delaySec * 1000,
      status: "waiting",
      call,
    });
  }

  phonePlans.set(key, plans);
  return plans;
}

function startPhoneRingAudio() {
  stopPhoneRingAudio();
  _phoneRingAudio = new Audio("assets/audio/phone-ring.wav");
  _phoneRingAudio.loop = true;
  _phoneRingAudio.play().catch(() => {});
}

function schedulePhoneExpire(plan, phoneButton, actions, delayMs) {
  clearPhonePlanTimers(plan);
  plan.expireTimerId = setTimeout(() => {
    plan.expireTimerId = null;
    if (plan.status !== "ringing") return;
    finishPhoneCall(plan, phoneButton, actions, "missed");
  }, delayMs);
}

function ringPhone(screen, state, actions, plan) {
  const phoneButton = screen.querySelector(".main-work-phone-button");
  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  if (!phoneButton || !monitorScreen || !screen.isConnected || plan.status !== "waiting") return;

  plan.status = "ringing";
  plan.expiresAt = Date.now() + PHONE_RING_SECONDS * 1000;
  activatePhoneButton(phoneButton);
  startPhoneRingAudio();
  schedulePhoneExpire(plan, phoneButton, actions, PHONE_RING_SECONDS * 1000);

  phoneButton.onclick = () => openPhoneOverlay(monitorScreen, plan, phoneButton, actions);
}

function restoreRingingPhone(screen, state, actions, plan) {
  const phoneButton = screen.querySelector(".main-work-phone-button");
  const monitorScreen = screen.querySelector(".main-work-monitor-screen") ?? screen;
  if (!phoneButton || !monitorScreen || !screen.isConnected) return;

  activatePhoneButton(phoneButton);
  startPhoneRingAudio();
  const remainingMs = Math.max(0, (plan.expiresAt ?? Date.now()) - Date.now());
  schedulePhoneExpire(plan, phoneButton, actions, remainingMs);

  phoneButton.onclick = () => openPhoneOverlay(monitorScreen, plan, phoneButton, actions);
}

function activatePhoneButton(phoneButton) {
  phoneButton.classList.add("is-ringing");
  phoneButton.setAttribute("aria-label", "전화 수신 중");
  phoneButton.title = "전화 수신 중";
}

function openPhoneOverlay(container, plan, phoneButton, actions) {
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
            clearPhonePlanTimers(plan);
            finishPhoneCall(plan, phoneButton, actions, "accept");
          },
        }),
        el("button", {
          class: "main-work-call-reject",
          type: "button",
          text: "거절",
          onClick: () => {
            clearPhonePlanTimers(plan);
            finishPhoneCall(plan, phoneButton, actions, "reject");
          },
        }),
      ]),
    ]),
  ]);

  container.append(_phoneOverlay);
}

function stopPhoneRingAudio() {
  if (!_phoneRingAudio) return;
  _phoneRingAudio.loop = false;
  _phoneRingAudio.pause();
  _phoneRingAudio.currentTime = 0;
  _phoneRingAudio.src = "";
  _phoneRingAudio = null;
}

function finishPhoneCall(plan, phoneButton, actions, outcome) {
  if (plan.status === "done") return;

  clearPhonePlanTimers(plan);
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
  _currentGameMinute = gameMinute;
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
  ensureMessengerState(state);
  if (ensureNotificationPanelMounted(container, state, actions)) return;

  mountNotificationPanel(container);

  if (_chatSnapshot) {
    restoreChatSnapshot(state, actions);
    return;
  }

  _localWorkload = state.stats.workload;
  syncPendingReplyNotifications(state, actions);
  ensureChatSpawnLoop(state, actions);
}

// 미니게임 등으로 화면을 떠났다가 돌아왔을 때, 멈춰뒀던 채팅 패널을 그대로 복원한다.
// 카드별 남은 시간·스누즈 큐·다음 알림까지 남은 시간을 모두 멈췄던 지점에서 이어간다.
function restoreChatSnapshot(state, actions) {
  const snapshot = _chatSnapshot;
  _chatSnapshot = null;
  if (!snapshot) return;

  _localWorkload = snapshot.localWorkload;

  for (const { messageId } of snapshot.pendingReplies ?? []) {
    const message = findMessengerMessage(messageId);
    if (!message || message.status) continue;
    if (getMessageReplyRemainingMs(message) <= 0) {
      expirePendingReply(message.id, actions);
      continue;
    }
    showMessengerToast(message, actions);
    scheduleReplyExpiry(message, actions);
  }

  scheduleSpawn(state, actions, snapshot.nextSpawnRemainingMs);
}

function scheduleSpawn(state, actions, delayMs) {
  if (_spawnTimeout) {
    clearTimeout(_spawnTimeout);
    _spawnTimeout = null;
  }
  _spawnScheduledAt = Date.now();
  _spawnDelayMs = delayMs;
  _spawnTimeout = setTimeout(() => {
    _spawnTimeout = null;
    if (!_notifPanel || _spawnInFlight) return;
    _spawnInFlight = true;
    try {
      spawnOneNotification(state, actions);
      scheduleNextSpawn(state, actions);
    } finally {
      _spawnInFlight = false;
    }
  }, delayMs);
}

function scheduleNextSpawn(state, actions) {
  const delay = _localWorkload >= 70 ? CHAT_SPAWN_INTERVAL_BUSY_MS : CHAT_SPAWN_INTERVAL_MS;
  scheduleSpawn(state, actions, delay);
}

function spawnOneNotification(state, actions) {
  if (!_hrPortalIntroSpawned) {
    _hrPortalIntroSpawned = true;
    const healthCheck = chatPool.notice.find((message) => message.portalTaskId === "health-check");
    if (healthCheck) {
      addMessengerMessage({ ...healthCheck }, actions);
      recordHrNoticeSpawn(state);
      return;
    }
  }

  const chat = pickOneChat(state);
  if (!chat) return;

  addMessengerMessage(chat, actions);
  if (chat.kind === "hr") recordHrNoticeSpawn(state);
}

function hasPendingHrPortalNotice() {
  const hrMessages = _messengerState?.rooms?.hr?.messages ?? [];
  return hrMessages.some((message) => message.portalTaskId && message.needsReply && !message.status);
}

function recordHrNoticeSpawn(state) {
  const phaseKey = getMainPhaseKey(state, getMainPhaseIndex(state));
  hrNoticeSpawnsByPhase.set(phaseKey, (hrNoticeSpawnsByPhase.get(phaseKey) ?? 0) + 1);
}

function getAvailableNoticePool(state) {
  if (hasPendingHrPortalNotice()) return [];

  const phaseKey = getMainPhaseKey(state, getMainPhaseIndex(state));
  if ((hrNoticeSpawnsByPhase.get(phaseKey) ?? 0) >= HR_NOTICE_MAX_PER_PHASE) return [];

  const activeTaskIds = getActivePortalTaskIds();
  return chatPool.notice.filter((message) => {
    if (!message.portalTaskId) return false;
    return !activeTaskIds.has(message.portalTaskId);
  });
}

function pickOneChat(state) {
  const trust = state.colleagueTrust ?? 30;
  const colleagueIgnoreCount = state.counters?.colleagueIgnoreCount ?? 0;
  const colleagueGone = state.flags?.colleagueAwayMessageSent || colleagueIgnoreCount >= 3;
  const noticePool = getAvailableNoticePool(state);
  if (colleagueGone) {
    return pickWeightedChat([
      { pool: chatPool.boss.filter((message) => message.subtype !== "warning"), weight: 40 },
      { pool: noticePool, weight: HR_NOTICE_SPAWN_WEIGHT },
    ]);
  }

  const lorePool = chatPool.colleague.filter((message) => message.subtype === "lore");
  const practicalPool = chatPool.colleague.filter((message) => !["away", "offer", "lore"].includes(message.subtype));
  const offerPool = chatPool.colleague.filter((message) => message.subtype === "offer");
  const offerChance = getColleagueOfferChance(trust);
  let colleagueWeightedPool = practicalPool;
  if (Math.random() < offerChance && offerPool.length) {
    colleagueWeightedPool = offerPool;
  } else if (Math.random() < 0.58 && lorePool.length) {
    colleagueWeightedPool = lorePool;
  }

  return pickWeightedChat([
    { pool: chatPool.boss.filter((message) => message.subtype !== "warning"), weight: 40 },
    { pool: colleagueWeightedPool, weight: 50 },
    { pool: noticePool, weight: HR_NOTICE_SPAWN_WEIGHT },
  ]);
}

function getColleagueOfferChance(trust) {
  if (trust < 20) return 0.02;
  if (trust < 40) return 0.08;
  if (trust < 60) return 0.16;
  return 0.3;
}

function pickWeightedChat(entries) {
  const available = entries.filter((entry) => entry.pool?.length && entry.weight > 0);
  if (!available.length) return null;
  const total = available.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of available) {
    roll -= entry.weight;
    if (roll <= 0) return cloneRandomChat(entry.pool);
  }
  return cloneRandomChat(available[available.length - 1].pool);
}

function cloneRandomChat(pool) {
  const template = pool[Math.floor(Math.random() * pool.length)];
  return { ...template };
}

function pickBossWarningMessage() {
  return cloneRandomChat(chatPool.boss.filter((message) => message.subtype === "warning"));
}

function getColleagueAwayMessage() {
  return cloneRandomChat(chatPool.colleague.filter((message) => message.subtype === "away"));
}

function applyEffect(delta, actions, cause) {
  if (!delta || Object.keys(delta).length === 0) {
    if (cause) {
      actions.mutateState(draft => addLogEntry(draft, { cause, delta: {} }));
    }
    return;
  }

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

function playChatNotificationSound() {
  // 알림음이 잘 들리도록 BGM을 잠시 낮춘다(덕킹).
  duckBgm();
  const audio = new Audio(CHAT_NOTIFICATION_SOUND_SRC);
  audio.volume = 1.0;
  audio.play().catch(() => {});
}
