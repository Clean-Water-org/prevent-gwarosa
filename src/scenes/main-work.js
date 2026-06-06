import { el, renderNarrationPopup } from "../ui.js";
import { formatTime, applyDelta, checkEnding, normalizeLogEntry, MAIN_PHASE_MINUTES } from "../state.js";
import { chatPool } from "../data/events.js";
import { items } from "../data/items.js";

let _notifPanel = null;
let _spawnTimeout = null;
let _localWorkload = 0;
let _clockInterval = null;
let _snoozedChats = [];

const MAIN_CLOCK_TICK_MS = 1000;
const CHAT_NOTIFICATION_SOUND_SRC = "assets/audio/messenger-notification.mp3";

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

  const guideSeen = Boolean(state.flags?.handoverGuideSeen);
  if (!guideSeen) {
    requestAnimationFrame(() => {
      stopHandoverGuide = playHandoverGuide(screen, actions, startChats);
    });
  } else {
    startChats();
    startMainClock(screen, state, actions);
  }
}

function renderMainWorkHud(state, actions) {
  const { workload, stress, health } = state.stats;
  return el("header", { class: "main-work-hud" }, [
    el("div", { class: "main-work-hud-stats" }, [
      renderHudStat("💼", "업무량", workload, "workload"),
      renderHudStat("⚠", "스트레스", stress, "stress"),
      renderHudStat("❤", "체력", health, "health"),
    ]),
    el("div", { class: "main-work-hud-controls" }, [
      renderMainWorkItemHub(state, actions),
      el("button", { class: "main-work-gear", type: "button", "aria-label": "설정", text: "⚙" }),
      el("div", { class: "main-work-hud-time" }, [
        el("strong", { class: "main-work-current-time", text: formatTime(state.gameMinute) }),
        el("span", { text: "2026.06.05 금요일" }),
      ]),
    ]),
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
      : [el("div", { class: "main-work-recent-log-list" }, logs.length
        ? logs.map(renderRecentLogEntry)
        : [el("p", { class: "main-work-recent-log-empty", text: "아직 기록된 변화가 없습니다." })])]),
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
  });
  const guideLayer = el("div", { class: "main-work-guide-layer" }, [
    narration.node,
    el("button", {
      class: "main-work-guide-skip",
      type: "button",
      text: "Skip · 바로 게임 시작",
      onClick: () => startGameFromGuide(),
    }),
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
    openHandoverPopup(screen, actions, clearGuideLayer, true, onStartChats);
  }, 2950));

  function clearGuideLayer() {
    for (const timer of timers) window.clearTimeout(timer);
    narration.stop();
    guideLayer.remove();
    if (stopHandoverGuide === clearGuideLayer) stopHandoverGuide = null;
  }

  function startGameFromGuide() {
    clearGuideLayer();
    actions.mutateState((draft) => {
      draft.flags.handoverGuideSeen = true;
      draft.gameMinute = 9 * 60;
      draft.flags.mainPhaseEnd = draft.gameMinute + MAIN_PHASE_MINUTES;
      return draft;
    });
  }

  return clearGuideLayer;
}

function openHandoverPopup(screen, actions, onClose, playIntro = false, onStartChats = null) {
  const existing = screen.querySelector(".main-work-handover-overlay");
  if (existing) { onClose?.(); return; }

  const close = () => {
    overlay.remove();
    onClose?.();
    if (playIntro) {
      playClockCutscene(screen, () => {
        actions.mutateState((draft) => {
          draft.flags.handoverGuideSeen = true;
          draft.gameMinute = 9 * 60;
          draft.flags.mainPhaseEnd = draft.gameMinute + MAIN_PHASE_MINUTES;
          return draft;
        });
        onStartChats?.();
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
}

function cleanupChatSystem() {
  if (_notifPanel) { _notifPanel.remove(); _notifPanel = null; }
  if (_spawnTimeout) { clearTimeout(_spawnTimeout); _spawnTimeout = null; }
}

function cleanupMainClock() {
  if (_clockInterval) {
    clearInterval(_clockInterval);
    _clockInterval = null;
  }
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
  const pool = [
    ...chatPool.bossTask,
    ...chatPool.bossTask,
    ...chatPool.bossPraise,
    ...chatPool.colleagueHelp,
    ...chatPool.colleagueChat,
    ...chatPool.notice,
  ];

  const available = pool.filter(t => !activeSenders.has(t.from));
  if (available.length === 0) return null;

  const template = available[Math.floor(Math.random() * available.length)];
  const text = template.texts
    ? (template.texts[state.boss.id] ?? Object.values(template.texts)[0])
    : template.text;

  const isBoss = template.kind === "boss-task" || template.kind === "boss-praise";
  return { ...template, resolvedText: text, timerSec: isBoss ? 10 : 15 };
}

function takeSnoozedChat(activeSenders) {
  const index = _snoozedChats.findIndex(chat => !activeSenders.has(chat.from));
  if (index < 0) return null;
  const [chat] = _snoozedChats.splice(index, 1);
  return { ...chat, done: false, timerSec: Math.max(5, chat.timerSec - 4) };
}

function renderNotifCard(chat, actions) {
  const timerBar = el("div", { class: "chat-notif-timer-bar" });
  timerBar.style.animationDuration = `${chat.timerSec}s`;

  const card = el("article", { class: `chat-notif-card chat-notif-${chat.kind}` }, [
    el("div", { class: "chat-notif-header" }, [
      el("strong", { class: "chat-notif-sender", text: chat.from }),
    ]),
    el("p", { class: "chat-notif-body", text: chat.resolvedText }),
    el("div", { class: "chat-notif-footer" }, [
      el("button", {
        class: "chat-notif-action chat-notif-action-read",
        text: "읽기",
        onClick: () => handleNotifRead(chat, card, actions),
      }),
      el("button", {
        class: "chat-notif-action chat-notif-action-later",
        text: "나중에",
        onClick: () => handleNotifSnooze(chat, card, actions),
      }),
      el("button", {
        class: "chat-notif-action chat-notif-action-ignore",
        text: "무시",
        onClick: () => handleNotifIgnore(chat, card, actions),
      }),
    ]),
    el("div", { class: "chat-notif-timer" }, [timerBar]),
  ]);

  timerBar.addEventListener("animationend", () => {
    if (!chat.done && _notifPanel) handleNotifExpire(chat, card, actions);
  });

  return card;
}

function handleNotifRead(chat, card, actions) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  actions.advanceGameMinute?.(1);
  applyEffect(chat.reply, actions, buildChatLogCause(chat, "read"));
  dismissCard(card);
}

function handleNotifSnooze(chat, card) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  _snoozedChats.push({ ...chat, snoozeCount: (chat.snoozeCount ?? 0) + 1 });
  dismissCard(card);
}

function handleNotifIgnore(chat, card, actions) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  applyEffect(chat.miss, actions, buildChatLogCause(chat, "ignore"));
  dismissCard(card);
}

function handleNotifExpire(chat, card, actions) {
  if (chat.done || !_notifPanel) return;
  chat.done = true;
  applyEffect(chat.miss, actions, buildChatLogCause(chat, "expire"));
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

function buildChatLogCause(chat, outcome) {
  const sender = chat.from ?? "메시지";
  const topic = summarizeChatTopic(chat);
  if (outcome === "read") {
    if (chat.kind === "boss-task") return `${sender}의 ${topic} 요청을 처리했다.`;
    if (chat.kind === "boss-praise") return `${sender}의 ${topic} 메시지를 확인했다.`;
    if (chat.kind === "colleague-help") return `동료의 ${topic} 부탁을 도와주었다.`;
    if (chat.kind === "colleague-chat") return "동료와 잠깐 대화했다.";
    return `${sender}의 ${topic} 공지를 확인했다.`;
  }

  if (outcome === "ignore") {
    if (chat.kind === "boss-task") return `${sender}의 ${topic} 요청을 무시했다.`;
    if (chat.kind === "colleague-help") return `동료의 ${topic} 부탁을 거절했다.`;
    return `${sender} 메시지를 무시했다.`;
  }

  if (chat.kind === "boss-task") return `${sender}의 ${topic} 요청을 놓쳐 일이 밀렸다.`;
  if (chat.kind === "colleague-help") return `동료의 ${topic} 부탁에 답하지 못했다.`;
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
