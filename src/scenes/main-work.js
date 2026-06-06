import { el, renderNarrationPopup } from "../ui.js";

const chats = [
  { from: "팀장", text: "이거 오늘 오후까지 됩니까?", seconds: 7, color: "red" },
  { from: "동료_박주임", text: "나 지금 너무 바쁜데 이거 좀 봐줄 수 있어?", seconds: 10, color: "blue" },
  { from: "시스템 공지", text: "오늘 오후 3시 전체 회의가 있습니다.", seconds: 12, color: "green" },
];

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
  stopHandoverGuide?.();

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
          renderMainWorkHud(),
          el("main", { class: "main-work-center" }, [
            renderIntranetWindow(() => screen, actions),
            renderChatPanel(),
          ]),
          renderTaskbar(),
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
      stopHandoverGuide = playHandoverGuide(screen, actions);
    });
  }
}

function renderMainWorkHud() {
  return el("header", { class: "main-work-hud" }, [
    el("div", { class: "main-work-hud-stats" }, [
      renderHudStat("💼", "업무량", 62, "workload"),
      renderHudStat("⚠", "스트레스", 48, "stress"),
      renderHudStat("❤", "체력", 74, "health"),
    ]),
    el("div", { class: "main-work-hud-time" }, [
      el("strong", { text: "AM 09:05" }),
      el("span", { text: "2026.06.05 금요일" }),
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

function renderIntranetWindow(getScreen, actions) {
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
          el("button", {
            class: "main-work-handover-button",
            text: "📄 인수인계서",
            onClick: () => openHandoverPopup(getScreen(), actions, stopHandoverGuide),
          }),
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

function playHandoverGuide(screen, actions) {
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
    el("div", { class: "main-work-fake-cursor", text: "🖱️" }),
  ]);
  const cursor = guideLayer.querySelector(".main-work-fake-cursor");
  screen.append(guideLayer);

  const startX = Math.max(24, window.innerWidth * 0.68);
  const startY = Math.max(24, window.innerHeight * 0.76);
  cursor.style.transform = `translate(${startX}px, ${startY}px) scale(1)`;

  timers.push(window.setTimeout(() => {
    const button = screen.querySelector(".main-work-handover-button");
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width * 0.66;
    const y = rect.top + rect.height * 0.56;
    cursor.style.setProperty("--main-work-cursor-target", `translate(${x}px, ${y}px)`);
    cursor.classList.add("moving");
    cursor.style.transform = `translate(${x}px, ${y}px) scale(1)`;
  }, 1700));

  timers.push(window.setTimeout(() => {
    cursor.classList.add("clicking");
  }, 2750));

  timers.push(window.setTimeout(() => {
    cursor.classList.remove("clicking");
    openHandoverPopup(screen, actions, clearGuideLayer);
  }, 2950));

  function clearGuideLayer() {
    for (const timer of timers) window.clearTimeout(timer);
    narration.stop();
    guideLayer.remove();
    if (stopHandoverGuide === clearGuideLayer) stopHandoverGuide = null;
  }

  return clearGuideLayer;
}

function openHandoverPopup(screen, actions, onClose) {
  const existing = screen.querySelector(".main-work-handover-overlay");
  if (existing) {
    onClose?.();
    return;
  }

  const close = () => {
    overlay.remove();
    onClose?.();
    actions.mutateState((draft) => {
      draft.flags.handoverGuideSeen = true;
      return draft;
    });
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

function renderSchedule(time, text) {
  return el("p", { class: "main-work-schedule-item" }, [
    el("strong", { text: time }),
    el("span", { text }),
  ]);
}

function renderChatPanel() {
  return el("aside", { class: "main-work-chat-panel" }, [
    el("header", { class: "main-work-chat-header" }, [
      el("strong", { text: "사내 메신저" }),
      el("span", { text: "3 unread" }),
    ]),
    el("div", { class: "main-work-chat-list" }, chats.map((chat, index) => renderChatCard(chat, index + 1))),
    el("p", { class: "main-work-more-message", text: "메시지 더보기" }),
  ]);
}

function renderChatCard(chat, number) {
  return el("article", { class: `main-work-chat-card main-work-chat-${chat.color}` }, [
    el("div", { class: "main-work-chat-card-top" }, [
      el("span", { class: "main-work-chat-number", text: String(number).padStart(2, "0") }),
      el("strong", { text: chat.from }),
      el("time", { text: `00:${String(chat.seconds).padStart(2, "0")}` }),
    ]),
    el("p", { text: chat.text }),
    el("button", { class: "main-work-reply-button", text: "답장" }),
  ]);
}

function renderTaskbar() {
  return el("footer", { class: "main-work-taskbar" }, [
    el("div", { class: "main-work-taskbar-left" }, [
      el("span", { class: "main-work-start-icon", text: "⊞" }),
      el("span", { class: "main-work-task-icon", text: "검색" }),
      el("span", { class: "main-work-task-icon", text: "📁" }),
      el("span", { class: "main-work-task-icon active", text: "사내포털" }),
    ]),
    el("div", { class: "main-work-taskbar-right" }, [
      el("span", { class: "main-work-task-clock", text: "AM 09:05" }),
      el("span", { class: "main-work-item-slot", text: "커피☕" }),
      el("span", { class: "main-work-item-slot", text: "쇼츠📱" }),
    ]),
  ]);
}
