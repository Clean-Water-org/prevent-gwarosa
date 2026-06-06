import { el } from "../ui.js";

const chats = [
  { from: "팀장", text: "이거 오늘 오후까지 됩니까?", seconds: 7, color: "red" },
  { from: "동료_박주임", text: "나 지금 너무 바쁜데 이거 좀 봐줄 수 있어?", seconds: 10, color: "blue" },
  { from: "시스템 공지", text: "오늘 오후 3시 전체 회의가 있습니다.", seconds: 12, color: "green" },
];

const phone = { from: "대표이사실", ext: "내선 1004" };

export function renderMainWork(root, state, actions) {
  root.append(
    el("section", { class: "main-work-screen" }, [
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
              renderIntranetWindow(),
              renderChatPanel(),
            ]),
            renderPhonePopup(),
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
    ]),
  );
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
        el("h2", { text: "공지사항" }),
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

function renderPhonePopup() {
  return el("div", { class: "main-work-phone-overlay" }, [
    el("article", { class: "main-work-phone-card" }, [
      el("header", { class: "main-work-phone-header" }, [
        el("strong", { text: "전화 수신" }),
        el("time", { text: "00:05" }),
      ]),
      el("div", { class: "main-work-phone-body" }, [
        el("span", { class: "main-work-phone-icon", text: "☎" }),
        el("h2", { text: phone.from }),
        el("p", { text: phone.ext }),
      ]),
      el("div", { class: "main-work-phone-actions" }, [
        el("button", { class: "main-work-call-accept", text: "받기" }),
        el("button", { class: "main-work-call-reject", text: "거절" }),
      ]),
    ]),
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
