import { el, renderNarrationPopup } from "../ui.js";
import { formatTime, applyDelta, applyWorkTimeCost, checkEnding, normalizeLogEntry, addLogEntry } from "../state.js";
import {
  bossMainEvents,
  chatPool,
  colleagueMainEvents,
  phoneCallPool,
  positiveMainEvents,
} from "../data/events.js";
import { items } from "../data/items.js";
import { PORTAL_TASKS } from "../data/portal-tasks.js";
import { makeOfficeRoom, appendDefaultRoomProps, makeMonitor } from "../components/pixel-office.js";
import { renderMiniGameBriefing } from "./minigame/briefing.js";
import { getCurrentMiniGame, getMiniGameBriefingKey } from "./minigame/flow.js";
import { renderLunchIntro, renderLunchResult } from "./lunch.js";
import { playBgm, duckBgm, playSfx, playClickSfx, syncBgmStatusFx } from "../lib/audio.js";
import {
  applyHeadacheEventToDraft,
  mountHeadacheDialog,
} from "../lib/headache-event.js";
import { formatHeadacheDisplayText } from "../lib/headache-fx.js";

const MAIN_BGM_SRC = "assets/audio/so-happy-with-my-8-bit-game.mp3";
const EVENT_SFX = "assets/audio/new-event-notification.mp3";

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
let _chatSnapshot = null;
let _spawnScheduledAt = 0;
let _spawnDelayMs = 0;
let _currentGameMinute = 9 * 60;
let _messengerState = null;
let _messengerUpdater = null;
let _intranetUpdater = null;
let _hrPortalIntroSpawned = false;
let _lastRenderedState = null;
let _openMessengerRoom = null;
let _replyExpireTimers = new Map();

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
const CHAT_SPAWN_INTERVAL_MS = 18000;
const CHAT_SPAWN_INTERVAL_BUSY_MS = 10000;
const MAX_MESSENGER_TOASTS = 5;
const MAIN_PHASE_DURATIONS_SEC = [35, 35, 40, 40];
const PHONE_CHANCE_BY_PHASE = [0.95, 0.95, 0.95, 0.95];
const PHONE_CALLS_PER_PHASE = 2;
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
  intranetPanel.style.display = "none";
  const messengerPanel = el("div", { class: "main-work-messenger-slot" });
  messengerPanel.style.display = "none";

  let intranetBtn;
  let messengerBtn;
  const toggleIntranet = () => {
    const willOpen = intranetPanel.style.display === "none";
    intranetPanel.style.display = willOpen ? "" : "none";
    intranetBtn?.classList.toggle("active", willOpen);
    if (willOpen) {
      bringWorkspacePanelToFront(intranetPanel);
      _intranetUpdater?.();
    }
  };
  const refreshMessenger = () => {
    renderMessengerShell(messengerPanel, state, actions, closeMessenger);
    updateMessengerTaskbarButton(messengerBtn);
  };
  const closeMessenger = () => {
    if (messengerPanel.style.display === "none") return;
    messengerPanel.style.display = "none";
    messengerBtn?.classList.remove("active");
    _messengerState.isOpen = false;
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
  if (_messengerState.isOpen) {
    messengerPanel.style.display = "";
    messengerBtn?.classList.add("active");
  }

  // 회의 준비 미니게임과 동일한 오피스 룸 + CHADOL-TRON 모니터 비주얼로 통일
  const room = makeOfficeRoom();
  room.classList.add("main-work-room");
  appendDefaultRoomProps(room);
  room.append(el("div", { class: "main-work-wall-note" }, [
    el("strong", { text: "TO DO" }),
    el("span", { text: "보고서" }),
    el("span", { text: "회의" }),
  ]));

  const recentLogCollapsed = Boolean(state.flags?.recentLogCollapsed);
  const monitorScroll = el("div", { class: "main-work-monitor-scroll" });
  const monitorStage = el("div", { class: "main-work-monitor-stage" }, [
    el("div", {
      class: `main-work-monitor-stage-spacer${recentLogCollapsed ? " is-collapsed" : ""}`,
      "aria-hidden": "true",
    }),
    el("div", { class: "main-work-monitor-wrapper" }, [makeMonitor(monitorScreen)]),
    renderRecentLogPanel(state, actions),
  ]);
  monitorScroll.append(monitorStage);
  room.append(monitorScroll);

  const screen = el("section", {
    class: `main-work-screen${state.stats.health <= 30 ? " fx-headache" : ""}`,
  }, [room]);

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

  if (state.flags?.lunchPhase) {
    const monitorEl = screen.querySelector(".main-work-monitor-screen") ?? screen;
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
      showStatusEventPopup(pendingStatus, state, monitorEl, actions);
    } else if (shouldShowMeetingEvent(state) || state.flags?.devTriggerMeetingEvent) {
      const monitorEl = screen.querySelector(".main-work-monitor-screen") ?? screen;
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

const INTRANET_STATIC_NOTICES = [
  "[중요] 2분기 업무 효율화 캠페인 안내",
  "사내 보안 점검으로 인한 문서 서버 순단 예정",
  "복지포인트 신청 마감: 금일 18:00",
  "회의실 예약 시스템 업데이트 안내",
];

function renderIntranetWindow(actions) {
  const shell = el("section", { class: "main-work-intranet" }, [
    el("header", { class: "main-work-intranet-tabs" }, [
      el("strong", { class: "main-work-intranet-logo", text: "DAEHAN INTRANET" }),
      el("nav", { class: "main-work-tab-menu" }, [
        el("span", { text: "마이페이지" }),
        el("span", { text: "전자결재" }),
        el("span", { text: "게시판" }),
        el("span", { text: "자료실" }),
      ]),
    ]),
    el("div", { class: "main-work-intranet-body" }),
  ]);

  const refresh = (openTaskId = null) => {
    const body = shell.querySelector(".main-work-intranet-body");
    if (!body) return;
    body.replaceChildren(...renderIntranetBody(actions, openTaskId, (taskId) => refresh(taskId)));
    updateIntranetTaskbarButton(document.querySelector(".main-work-task-intranet"));
  };

  _intranetUpdater = () => refresh();
  refresh();
  return shell;
}

function renderIntranetBody(actions, openTaskId, onOpenTask) {
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
      el("button", {
        class: "main-work-handover-close",
        text: "알겠습니다.",
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

  const startClock = () => {
    const display = el("div", { class: "main-work-clock-display" });
    const overlay = el("div", { class: "main-work-clock-cutscene" }, [display]);
    monitorScreen.append(overlay);

    for (const { text, ms, step } of clockSteps) {
      timers.push(setTimeout(() => { display.textContent = text; display.dataset.step = step; }, ms));
    }
    timers.push(setTimeout(() => {
      overlay.remove();
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
        cleanupLunchOverlay();
        playClockCutscene(screen, () => {
          actions.mutateState((draft) => {
            draft.gameMinute = Math.max(draft.gameMinute, 13 * 60);
            draft.flags = { ...draft.flags };
            delete draft.flags.lunchPhase;
            delete draft.flags.lunchQueue;
            delete draft.flags.lunchIndex;
            return draft;
          });
        }, {
          prelude: [],
          preludeMs: 0,
          steps: [
            { text: "12:59", ms: 0, step: "time" },
            { text: "13:00", ms: 1000, step: "time" },
            { text: "오후 업무 시작", ms: 2000, step: "label" },
          ],
          totalMs: 3400,
        });
      },
    });
    _lunchOverlay = result;
    monitorEl.append(result);
  }
}

function cleanupLunchOverlay() {
  _lunchOverlay?.remove();
  _lunchOverlay = null;
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
  const replies = getMessengerReplyLabels(message);
  const hasIgnoreChoice = replies.some((reply) => reply.id === "ignore");
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
  return el("article", { class: `main-work-messenger-message main-work-messenger-message-${message.kind}` }, [
    ...(message.needsReply ? [el("span", { class: `main-work-messenger-status is-${statusClass}`, text: statusText })] : []),
    el("div", { class: "main-work-messenger-message-meta" }, [
      el("strong", { text: message.from }),
      el("time", { text: formatTime(message.minute) }),
    ]),
    el("p", { text: displayText }),
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
        ...(message.allowIgnore === false || hasIgnoreChoice ? [] : [el("button", {
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

function getMessengerReplyLabels(message) {
  if (message.kind === "boss" && message.subtype === "request") {
    return [
      { id: "accept", label: "가능합니다", tone: "primary" },
      { id: "hard", label: "어려울 것 같아요", tone: "neutral" },
      { id: "ignore", label: "못 본 척", tone: "soft" },
    ];
  }
  if (message.kind === "boss" && message.subtype === "check") {
    return [
      { id: "nearly", label: "거의 끝났어요", tone: "primary" },
      { id: "check", label: "확인해볼게요", tone: "neutral" },
      { id: "ignore", label: "못 본 척", tone: "soft" },
    ];
  }
  if (message.kind === "boss" && message.subtype === "praise") {
    return [
      { id: "thanks", label: "감사합니다", tone: "primary" },
      { id: "effort", label: "더 노력할게요", tone: "neutral" },
      { id: "ignore", label: "못 본 척", tone: "soft" },
    ];
  }
  if (message.kind === "colleague") {
    return [
      { id: "reply", label: "답장", tone: "primary" },
      { id: "later", label: "나중에", tone: "neutral" },
    ];
  }
  if (message.kind === "hr") {
    if (message.portalCompleted) {
      return [{ id: "confirm", label: "확인했습니다", tone: "primary" }];
    }
    return [];
  }
  return [];
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
  const result = resolveMessengerChoice(message, choiceId);
  applyMessengerResult(result, actions, message, choiceId);
  _messengerUpdater?.();
  updateMessengerChrome();
}

function resolveMessengerChoice(message, choiceId) {
  if (message.kind === "boss") return resolveBossMessengerChoice(message, choiceId);
  if (message.kind === "colleague") return resolveColleagueMessengerChoice(message, choiceId);
  if (message.kind === "hr") return resolveHrMessengerChoice(message, choiceId);
  return { delta: {}, bossAttentionDelta: 0, colleagueIgnoreDelta: 0, hrIgnoreDelta: 0 };
}

const BOSS_ATTENTION_WARN_AT = 3;
const BOSS_ATTENTION_INTERVIEW_AT = 6;

function resolveBossMessengerChoice(message, choiceId) {
  if (choiceId === "ignore") return { delta: { stress: 3 }, bossAttentionDelta: 1 };
  if (message.subtype === "request") {
    if (choiceId === "accept") {
      return { delta: { workload: -3, gameMinute: 2, health: -1 }, bossAttentionDelta: -1 };
    }
    return { delta: getBossHardReplyDelta(), bossAttentionDelta: -1 };
  }
  if (message.subtype === "check") {
    if (choiceId === "nearly") return { delta: { stress: -1, gameMinute: 2, health: -1 }, bossAttentionDelta: -1 };
    return { delta: { gameMinute: 2, health: -1 }, bossAttentionDelta: -1 };
  }
  if (message.subtype === "praise") {
    if (choiceId === "thanks") return { delta: { stress: -3 }, bossAttentionDelta: -1 };
    return { delta: { stress: -2 }, bossAttentionDelta: -1 };
  }
  return { delta: {}, bossAttentionDelta: -1 };
}

function resolveColleagueMessengerChoice(message, choiceId) {
  if (choiceId === "later") return { delta: {}, colleagueIgnoreDelta: 0 };
  if (choiceId === "ignore") return getColleagueIgnoreResult(message);
  if (message.subtype === "favor") {
    return { delta: { workload: 3, colleagueTrust: 5, gameMinute: 2, health: -1 }, colleagueIgnoreDelta: -1 };
  }
  if (message.subtype === "smalltalk") {
    return { delta: { stress: -3, gameMinute: 1 }, colleagueIgnoreDelta: -1 };
  }
  if (message.subtype === "info") {
    return { delta: { colleagueTrust: 2 }, colleagueIgnoreDelta: -1 };
  }
  if (message.subtype === "offer") {
    return { delta: { workload: -3 }, colleagueIgnoreDelta: -1 };
  }
  return { delta: {}, colleagueIgnoreDelta: 0 };
}

function getColleagueIgnoreResult(message) {
  if (message.subtype === "favor") {
    return { delta: { stress: 2, colleagueTrust: -5 }, colleagueIgnoreDelta: 1 };
  }
  return { delta: { stress: 2 }, colleagueIgnoreDelta: 1 };
}

function resolveHrMessengerChoice(message, choiceId) {
  if (choiceId === "confirm") {
    if (!message.portalCompleted) return { delta: {}, hrIgnoreDelta: 0 };
    return { delta: { gameMinute: -5 }, hrIgnoreDelta: -1 };
  }
  if (choiceId === "ignore") return { delta: { stress: 2 }, hrIgnoreDelta: 1 };
  return { delta: {}, hrIgnoreDelta: 0 };
}

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
      cause: buildChatLogCause(message, choiceId),
      delta: logDelta,
    });
    pendingEnding = checkEnding(next);
    return next;
  });

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
    body: "팀장님이 회의실로 부릅니다. \"요즘 진행 상황 파악이 잘 안 되네요. 메신저 답장이 자주 없던데 무슨 문제 있습니까?\"",
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
  const message = {
    ...chat,
    id: messenger.nextMessageId++,
    roomId,
    text: chat.resolvedText ?? chat.text ?? "",
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
    return message.subtype === "favor" || message.subtype === "offer" ? "colleague-help" : "colleague-chat";
  }
  return "notice";
}

function getMessengerRoomIcon(roomId) {
  return MESSENGER_ROOMS.find((room) => room.id === roomId)?.icon ?? "💬";
}

function showMessengerToast(message, actions) {
  if (!_notifPanel || !message.needsReply) return;

  _notifPanel.querySelector(`.main-work-messenger-toast[data-message-id="${message.id}"]`)?.remove();

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
  ]);

  toast._messageRef = message;
  timerBar.addEventListener("animationend", () => {
    expirePendingReply(message.id, actions);
  });

  _notifPanel.append(toast);
}

function dismissMessengerToast(messageId) {
  const toast = _notifPanel?.querySelector(`.main-work-messenger-toast[data-message-id="${messageId}"]`);
  if (!toast) return;
  toast.classList.add("is-replied");
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
  if (_messengerState) {
    _chatSnapshot = captureChatSnapshot();
  }
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
  if (_meetingEventOverlay) return;
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
    _meetingEventOverlay?.replaceWith(resultPopup);
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
    onChoice: (choice) => closeMeetingEventChoice(actions, state, choice),
  });
}

function buildMeetingOutcomeEvent(outcome, state) {
  const line = getMeetingBossLine(outcome, state);
  const templates = {
    shame: {
      title: "분위기가 싸해졌다",
      body: `전체 회의 중, 팀장님이 자료를 가리키며 말했다. "${line}" 회의실 공기가 순간적으로 굳었다.`,
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
      body: `전체 회의 중, 팀장님이 고개를 끄덕이며 말했다. "${line}"`,
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
      body: `회의가 끝나갈 무렵, 팀장님이 말했다. "${line}"`,
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
    body: template.body,
    choices: template.choices,
  };
}

function closeMeetingEventChoice(actions, state, choice) {
  _meetingEventOverlay?.remove();
  _meetingEventOverlay = null;

  const finalChoice = choice.next === "meeting-reject" ? getMeetingRejectChoice(state) : choice;
  const logCause = finalChoice.reaction
    ? `${finalChoice.message} ${finalChoice.reaction}`
    : finalChoice.message;
  let pendingEnding = null;
  actions.mutateState((draft) => {
    let next = applyDelta(draft, finalChoice.delta ?? {}, null);
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
    "smart-busy": success ? "팀장님이 잠깐 눈치를 주더니 넘어갔다." : "팀장님이 \"그럼 당신이 하세요\"라고 말했다.",
    "smart-lazy": success ? "팀장님이 \"그럼 다음에 부탁할게요\"라고 말했다." : "팀장님이 \"그래도 오늘 안으로 부탁해요\"라고 말했다.",
    "clumsy-busy": success ? "팀장님이 \"음, 그럼 다른 사람한테 물어볼게요!\"라고 말했다." : "팀장님이 \"아니, 일단 해봐요!\"라고 말했다.",
    "clumsy-lazy": success ? "팀장님이 \"그래, 알았어…\"라고 중얼거렸다." : "팀장님이 \"위에서 시킨 건데…\"라고 말했다.",
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
  const lines = {
    shame: {
      "smart-busy": "이 수준이면 다음 회의에 다시 설명하세요.",
      "smart-lazy": "센스 있게 정리해 주셨어야죠. 이번엔 아쉽네요.",
      "clumsy-busy": "느낌은 있는데, 제가 원한 방향이 아니에요!",
      "clumsy-lazy": "음… 제가 뭐 시켰더라… 일단 보완해 주세요.",
    },
    praise: {
      "smart-busy": "이 정도 정리면 바로 넘어가도 되겠네요.",
      "smart-lazy": "덕분에 회의가 빨리 끝났어요.",
      "clumsy-busy": "오, 이번엔 느낌이 괜찮은데요?",
      "clumsy-lazy": "…그래. 나쁘지 않네.",
    },
    followup: {
      "smart-busy": "회의록은 오늘 안으로 올려 주세요.",
      "smart-lazy": "정리해서 공유만 해 주실래요?",
      "clumsy-busy": "일단 정리해 오세요! 방향은 보고 다시 잡아봐요!",
      "clumsy-lazy": "위에서 보내래요. 저도 내용은 잘…",
    },
  };
  return lines[outcome]?.[key] ?? lines[outcome]?.["smart-busy"] ?? "";
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
  playSfx(EVENT_SFX); // 이벤트 팝업 발생 효과음
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
        el("p", { class: "main-event-kicker", text: event.kicker ?? (event.type === "boss" ? "팀장님" : event.type === "colleague" ? "동료" : "공통 이벤트") }),
        el("h2", { text: event.title }),
        el("p", { class: "main-event-copy", text: event.body }),
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
    const minSec = slotStart + slotLen * 0.12;
    const maxSec = slotStart + slotLen * 0.72;
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
  _notifPanel = el("div", { class: "chat-notif-panel main-work-messenger-runtime" });
  container.append(_notifPanel);

  if (_chatSnapshot) {
    restoreChatSnapshot(state, actions);
    return;
  }

  _localWorkload = state.stats.workload;

  const pendingReplies = collectPendingReplyMessages();
  if (pendingReplies.length > 0) {
    for (const message of pendingReplies) {
      showMessengerToast(message, actions);
      scheduleReplyExpiry(message, actions);
    }
    scheduleSpawn(state, actions, CHAT_SPAWN_INTERVAL_MS);
    return;
  }

  scheduleSpawn(state, actions, CHAT_SPAWN_FIRST_MS);
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
  _spawnScheduledAt = Date.now();
  _spawnDelayMs = delayMs;
  _spawnTimeout = setTimeout(() => {
    if (!_notifPanel) return;
    spawnOneNotification(state, actions);
    scheduleNextSpawn(state, actions);
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
      return;
    }
  }

  const chat = pickOneChat(state);
  if (!chat) return;

  addMessengerMessage(chat, actions);
}

function getAvailableNoticePool() {
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
  const noticePool = getAvailableNoticePool();
  if (colleagueGone) {
    return pickWeightedChat([
      { pool: chatPool.boss.filter((message) => message.subtype !== "warning"), weight: 40 },
      { pool: noticePool, weight: 10 },
    ]);
  }

  const colleaguePool = chatPool.colleague.filter((message) => message.subtype !== "away" && message.subtype !== "offer");
  const offerPool = chatPool.colleague.filter((message) => message.subtype === "offer");
  const offerChance = getColleagueOfferChance(trust);
  const colleagueWeightedPool = Math.random() < offerChance ? offerPool : colleaguePool;

  return pickWeightedChat([
    { pool: chatPool.boss.filter((message) => message.subtype !== "warning"), weight: 40 },
    { pool: colleagueWeightedPool, weight: 50 },
    { pool: noticePool, weight: 10 },
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

function buildChatLogCause(chat, outcome) {
  const sender = chat.from ?? "메시지";
  const topic = summarizeChatTopic(chat);
  if (outcome === "later") return `${sender}의 ${topic} 메시지를 나중에 보기로 했다.`;
  if (outcome === "ignore") return `${sender}의 ${topic} 메시지를 못 본 척했다.`;
  if (chat.kind === "boss" && chat.subtype === "request") return `${sender}의 ${topic} 요청에 답장했다.`;
  if (chat.kind === "boss" && chat.subtype === "check") return `${sender}의 진행 확인 메시지에 답장했다.`;
  if (chat.kind === "boss" && chat.subtype === "praise") return `${sender}의 칭찬 메시지에 답장했다.`;
  if (chat.kind === "colleague" && chat.subtype === "favor") return "동료의 부탁에 답장했다.";
  if (chat.kind === "colleague" && chat.subtype === "smalltalk") return "동료와 짧게 메시지를 주고받았다.";
  if (chat.kind === "colleague" && chat.subtype === "info") return "동료가 공유한 정보를 확인했다.";
  if (chat.kind === "colleague" && chat.subtype === "offer") return "동료의 도움 제안에 답장했다.";
  if (chat.kind === "hr" && outcome === "confirm") return `${sender}에 확인 완료를 답장했다.`;
  if (chat.kind === "hr" && outcome === "process") return `${sender} 공지를 처리했다.`;
  if (chat.kind === "hr") return `${sender} 공지를 확인했다.`;
  return `${sender} 메시지를 확인했다.`;
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

function playChatNotificationSound() {
  // 알림음이 잘 들리도록 BGM을 잠시 낮춘다(덕킹).
  duckBgm();
  const audio = new Audio(CHAT_NOTIFICATION_SOUND_SRC);
  audio.volume = 1.0;
  audio.play().catch(() => {});
}
