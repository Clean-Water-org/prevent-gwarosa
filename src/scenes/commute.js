import { el } from "../ui.js";
import { formatTime } from "../state.js";
import { DAY_FLOW_STEPS, DAY_FLOW_FOOTNOTES } from "../data/day-schedule.js";
import { makeOfficeRoom, appendDefaultRoomProps, makeMonitor } from "../components/pixel-office.js";
import { playBgm } from "../lib/audio.js";

const MAIN_BGM_SRC = "assets/audio/so-happy-with-my-8-bit-game.mp3";
const COMMUTE_MINUTE = 9 * 60;

const briefingTips = [
  "업무량만 관리해서는 살아남을 수 없습니다.",
  "스트레스 관리도 업무의 일부입니다.",
  "직장 생활은 체력전입니다.",
  "무리한 선택은 오후에 돌아올 수 있습니다.",
  "관찰도 중요한 업무 능력입니다.",
  "좋은 선택은 좋은 정보에서 시작됩니다.",
  "모든 상황에는 이유가 있습니다.",
  "상사의 행동에는 패턴이 있습니다.",
  "모든 상사가 같은 방식으로 일하지는 않습니다.",
  "상사를 이해하면 하루가 조금 편해질 수 있습니다.",
  "상사마다 중요하게 생각하는 것이 다릅니다.",
  "상사의 반응도 하나의 정보입니다.",
  "패턴을 찾으면 대처가 쉬워집니다.",
  "관찰은 생존의 첫걸음입니다.",
  "동료와의 관계도 업무에 영향을 줄 수 있습니다.",
  "도움은 언젠가 돌아올 수도 있습니다.",
  "모든 부탁을 들어줄 필요는 없습니다.",
  "회사 생활에는 우선순위가 필요합니다.",
  "혼자 해결하는 것만이 정답은 아닙니다.",
  "사람도 업무만큼 중요합니다.",
  "잠깐의 휴식이 오후를 바꿀 수 있습니다.",
  "오전의 컨디션이 하루를 결정하기도 합니다.",
  "급할수록 확인이 필요합니다.",
  "상황을 이해하면 선택도 쉬워집니다.",
  "손이 떨리기 시작했다면 충분히 마신 것입니다.",
  "상사는 바뀔 수 있습니다.\n폐는 교체가 어렵습니다.",
  "오늘 쉬지 않으면\n내일 강제로 쉬게 될 수도 있습니다.",
];

let lastTipIndex = -1;
let commuteActiveTab = "briefing";

export function renderCommute(root, state, actions) {
  playBgm(MAIN_BGM_SRC);
  commuteActiveTab = "briefing";

  const monitorScreen = el("div", { class: "main-work-monitor-screen" }, [
    renderCommuteHud(state),
    el("main", { class: "main-work-center commute-center" }, [
      renderCommutePanel(state, actions),
    ]),
    renderCommuteTaskbar(),
  ]);

  const room = makeOfficeRoom();
  room.classList.add("main-work-room");
  appendDefaultRoomProps(room);
  room.append(el("div", { class: "main-work-wall-note" }, [
    el("strong", { text: "GOAL" }),
    el("span", { text: "칼퇴" }),
    el("span", { text: "생존" }),
  ]));

  const monitorScroll = el("div", { class: "main-work-monitor-scroll" });
  monitorScroll.append(el("div", { class: "main-work-monitor-wrapper" }, [makeMonitor(monitorScreen)]));
  room.append(monitorScroll);

  root.append(el("section", { class: "main-work-screen" }, [room]));
}

function renderCommuteHud(state) {
  const { workload, stress, health } = state.stats;
  const playerName = state.player.name || "김대리";

  return el("header", { class: "main-work-hud" }, [
    el("div", { class: "main-work-hud-stats" }, [
      renderHudStat("💼", "업무량", workload, "workload"),
      renderHudStat("⚠", "스트레스", stress, "stress"),
      renderHudStat("❤", "체력", health, "health"),
    ]),
    el("div", { class: "main-work-hud-controls" }, [
      el("div", { class: "main-work-item-hub is-locked" }, [
        el("div", {
          class: "main-work-item-toggle",
          title: "업무 시작 후 사용 가능",
        }, [
          el("span", { class: "main-work-item-bag", text: "🎒" }),
          el("span", { text: "아이템" }),
          el("span", { class: "main-work-item-caret", text: "▾" }),
        ]),
      ]),
      el("div", { class: "main-work-hud-time" }, [
        el("strong", { class: "main-work-current-time", text: formatTime(COMMUTE_MINUTE) }),
        el("span", { text: "2026.06.05 금요일" }),
      ]),
      el("span", { class: "commute-player-tag", text: `사원 ${playerName}` }),
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

function renderCommutePanel(state, actions) {
  const panel = el("section", { class: "commute-briefing main-work-intranet" }, [
    renderCommuteTabs(),
    el("div", { class: "commute-panel-body-slot" }),
    renderCommuteFooter(actions),
  ]);
  panel._commuteState = state;

  const slot = panel.querySelector(".commute-panel-body-slot");
  slot.append(renderCommuteBody(state, commuteActiveTab));

  return panel;
}

function renderCommuteTabs() {
  return el("header", { class: "main-work-intranet-tabs" }, [
    el("strong", { class: "main-work-intranet-logo", text: "DAEHAN INTRANET" }),
    el("nav", { class: "main-work-tab-menu commute-tab-menu", role: "tablist" }, [
      renderCommuteTabButton("briefing", "출근 브리핑"),
      renderCommuteTabButton("schedule", "오늘의 일정"),
    ]),
  ]);
}

function renderCommuteTabButton(tabId, label) {
  const isActive = commuteActiveTab === tabId;
  return el("button", {
    class: `commute-tab${isActive ? " is-active" : ""}`,
    type: "button",
    role: "tab",
    "aria-selected": isActive ? "true" : "false",
    text: label,
    onClick: (event) => switchCommuteTab(tabId, event.currentTarget.closest(".commute-briefing")),
  });
}

function switchCommuteTab(tabId, panel) {
  if (!panel || commuteActiveTab === tabId) return;
  commuteActiveTab = tabId;

  panel.querySelectorAll(".commute-tab").forEach((btn) => {
    const active = btn.textContent === (tabId === "briefing" ? "출근 브리핑" : "오늘의 일정");
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  const slot = panel.querySelector(".commute-panel-body-slot");
  slot.replaceChildren(renderCommuteBody(panel._commuteState, tabId));
}

function renderCommuteBody(state, tab) {
  if (tab === "schedule") return renderScheduleBody(state);
  return renderBriefingBody(state);
}

function renderBriefingBody(state) {
  const playerName = state.player.name || "김대리";
  const portrait = state.player.gender === "female" ? "female" : "male";
  const tipIndex = pickTipIndex();
  const tipText = el("p", { class: "commute-tip-text", text: briefingTips[tipIndex] });

  return el("div", { class: "commute-briefing-body" }, [
    el("aside", { class: "commute-tip-panel" }, [
      el("strong", { text: "☆ 인사팀 한마디" }),
      tipText,
      el("button", {
        class: "commute-tip-next",
        type: "button",
        text: "다음 TIP ↻",
        onClick: () => {
          tipText.textContent = briefingTips[pickTipIndex()];
        },
      }),
    ]),
    el("section", { class: "commute-mission-panel" }, [
      el("p", { class: "commute-mission-kicker", text: "출근 인증 완료 ✓" }),
      el("h1", { text: "오늘도 출근! 잘 오셨어요~" }),
      el("div", { class: "commute-mission-rule" }),
      el("p", { class: "commute-mission-lead", text: "오늘의 미션은 딱 하나. 퇴근 버튼 누르기." }),
      el("p", { text: "업무는 쌓이고, 체력은 줄고, 스트레스는 웃으며 올라갑니다." }),
      el("p", { text: "괜찮아요. 회사 분위기는 아주 밝으니까요. (화면이 붉어지는 건 기분 탓.)" }),
      el("div", { class: "commute-mission-closing" }, [
        el("span", { text: "생존 보너스: 18:00 전에 자리 비우기" }),
        el("small", { text: "09:00 업무 시작 대기 중 · 오늘도 건강(?)한 하루!" }),
      ]),
    ]),
    el("aside", { class: "commute-side-panel" }, [
      renderPlayerCard(playerName, portrait),
      el("section", { class: "commute-boss-hint" }, [
        el("h2", { text: "상사 힌트" }),
        el("p", { text: state.boss?.publicHint ?? "오늘의 상사 정보를 확인하세요." }),
      ]),
    ]),
  ]);
}

function renderScheduleBody(state) {
  const playerName = state.player.name || "김대리";
  const portrait = state.player.gender === "female" ? "female" : "male";

  return el("div", { class: "commute-briefing-body commute-schedule-body" }, [
    el("section", { class: "commute-schedule-panel" }, [
      el("header", { class: "commute-schedule-head" }, [
        el("h2", { text: "오늘 하루, 대략 이런 흐름" }),
        el("p", { text: "정확한 시각은 안 알려드려요. 현장에서 확인하세요." }),
      ]),
      el("ol", { class: "commute-flow-list" },
        DAY_FLOW_STEPS.map((step) => renderFlowStep(step)),
      ),
      el("footer", { class: "commute-schedule-footnotes" },
        DAY_FLOW_FOOTNOTES.map((note) => el("p", { text: note })),
      ),
    ]),
    el("aside", { class: "commute-side-panel" }, [
      renderPlayerCard(playerName, portrait),
      el("section", { class: "commute-boss-hint" }, [
        el("h2", { text: "상사 힌트" }),
        el("p", { text: state.boss?.publicHint ?? "오늘의 상사 정보를 확인하세요." }),
      ]),
    ]),
  ]);
}

function renderFlowStep(step) {
  return el("li", { class: `commute-flow-step${step.label ? " has-label" : ""}` }, [
    ...(step.label
      ? [el("span", { class: "commute-flow-label", text: step.label })]
      : []),
    el("div", { class: "commute-flow-card" }, [
      el("span", { class: "commute-flow-icon", text: step.icon }),
      el("div", { class: "commute-flow-copy" }, [
        el("strong", { text: step.title }),
        el("p", { text: step.text }),
      ]),
    ]),
  ]);
}

function renderCommuteFooter(actions) {
  return el("footer", { class: "commute-briefing-footer" }, [
    el("button", {
      class: "commute-start-button",
      type: "button",
      onClick: () => actions.go("main"),
    }, [
      el("strong", { text: "업무 시작" }),
      el("span", { text: "→" }),
      el("small", { text: "자리에 앉으면 오늘의 생존 게임이 시작됩니다." }),
    ]),
    el("p", { text: "※ 본 게임은 과로사 예방과 건강한 직장 생활을 응원하기 위해 제작되었습니다." }),
  ]);
}

function renderPlayerCard(playerName, portrait) {
  return el("article", { class: "commute-player-card" }, [
    el("div", { class: "commute-player-photo" }, [
      el("img", {
        class: "commute-player-portrait",
        src: `assets/portraits/${portrait}.svg`,
        alt: "증명사진",
      }),
    ]),
    el("strong", { text: "오늘의 직장인" }),
    el("b", { text: `사원 ${playerName}` }),
    el("span", { text: "DAEHAN TECH 사원" }),
  ]);
}

function renderCommuteTaskbar() {
  return el("footer", { class: "main-work-taskbar" }, [
    el("div", { class: "main-work-taskbar-left" }, [
      el("span", { class: "main-work-start-icon", text: "⊞" }),
      el("span", { class: "main-work-task-icon", text: "검색" }),
      el("span", { class: "main-work-task-icon", text: "📁" }),
      el("span", { class: "main-work-task-icon is-disabled", text: "사내포털" }),
      el("span", { class: "main-work-task-icon is-disabled main-work-task-messenger", text: "💬" }),
    ]),
    el("div", { class: "main-work-taskbar-right" }, [
      el("span", { class: "main-work-task-clock", text: "오전 9:00" }),
    ]),
  ]);
}

function pickTipIndex() {
  if (briefingTips.length <= 1) return 0;

  let nextIndex = Math.floor(Math.random() * briefingTips.length);
  while (nextIndex === lastTipIndex) {
    nextIndex = Math.floor(Math.random() * briefingTips.length);
  }

  lastTipIndex = nextIndex;
  return nextIndex;
}
