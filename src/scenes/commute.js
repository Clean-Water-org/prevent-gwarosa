import { el } from "../ui.js";

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

export function renderCommute(root, state, actions) {
  const playerName = state.player.name || "김대리";

  root.append(
    el("section", { class: "briefing-screen survival-briefing" }, [
      el("header", { class: "briefing-hero survival-hero" }, [
        renderEmployeeBadge(playerName),
        el("div", { class: "briefing-clock survival-clock" }, [
          el("strong", { text: "09:00" }),
          el("span", { text: "월요일  |  2026년 5월 27일" }),
          el("p", { text: "또 하루가 시작됐다." }),
          el("p", { text: "오늘도 무사히 퇴근할 수 있을까?" }),
        ]),
      ]),
      el("main", { class: "survival-layout" }, [
        renderBriefingTip(),
        renderMoodCard(),
        renderInitialStats(state),
      ]),
      el("footer", { class: "survival-footer" }, [
        el("button", {
          class: "briefing-start-button survival-start-button",
          onClick: () => actions.go("main"),
        }, [
          el("strong", { text: "업무 시작" }),
          el("span", { text: "→" }),
          el("small", { text: "자리에 앉아 오늘 하루를 시작합니다." }),
        ]),
        el("p", { text: "※ 본 게임은 과로사 예방과 건강한 직장 생활을 응원하기 위해 제작되었습니다." }),
      ]),
    ]),
  );
}

function renderBriefingTip() {
  const tipIndex = pickTipIndex();
  const tipText = el("p", { class: "note-warning tip-text", text: briefingTips[tipIndex] });

  return el("aside", { class: "briefing-note" }, [
    el("strong", { text: "☆ 인사팀 한마디" }),
    tipText,
    el("button", {
      class: "tip-next-button",
      text: "다음 TIP ↻",
      onClick: () => {
        const nextIndex = pickTipIndex();
        tipText.textContent = briefingTips[nextIndex];
      },
    }),
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

function renderEmployeeBadge(playerName) {
  return el("article", { class: "employee-badge survival-badge" }, [
    el("div", { class: "badge-clip" }),
    el("div", { class: "badge-company" }, [
      el("span", { text: "DAEHAN TECH" }),
    ]),
    el("div", { class: "badge-photo" }, [
      el("span", { class: "badge-face" }),
      el("span", { class: "badge-body" }),
    ]),
    el("strong", { text: "오늘의 직장인" }),
    el("b", { text: `사원 ${playerName}` }),
    el("span", { text: "DAEHAN TECH 사원" }),
    el("i", { class: "badge-barcode" }),
  ]);
}

function renderMoodCard() {
  return el("section", { class: "mission-card" }, [
    el("p", { class: "mission-kicker", text: "출근 기록" }),
    el("h1", { text: "또 하루가 시작됐다." }),
    el("div", { class: "mission-divider" }),
    el("p", { class: "mood-line", text: "오늘은 무사히 퇴근할 수 있을까?" }),
    el("p", { text: "업무는 쌓이고, 체력은 줄고, 스트레스는 조용히 올라간다." }),
    el("p", { text: "대단한 목표는 없다. 오늘 하루를 버티고 집에 가는 것." }),
    el("div", { class: "mission-closing" }, [
      el("span", { text: "퇴근 전까지 버티세요." }),
      el("small", { text: "09:00 업무 시작 대기 중" }),
    ]),
  ]);
}

function renderInitialStats(state) {
  return el("aside", { class: "briefing-card survival-status-card" }, [
    el("h2", { text: "현재 상태" }),
    renderBriefingStat("업무량", state.stats.workload, "workload", "업무량이 높을수록 실수가 증가합니다."),
    renderBriefingStat("스트레스", state.stats.stress, "stress", "스트레스가 높을수록 체력이 감소합니다."),
    renderBriefingStat("체력", state.stats.health, "health", "체력이 0이 되면 퇴근에 실패합니다."),
  ]);
}

function renderBriefingStat(label, value, type, caption) {
  return el("div", { class: "briefing-stat survival-stat" }, [
    el("div", { class: "stat-title" }, [
      el("span", { class: `stat-icon ${type}` }),
      el("strong", { text: label }),
      el("b", { text: `${value} / 100` }),
    ]),
    el("div", { class: `briefing-stat-bar ${type}` }, [
      el("i", { style: `width:${value}%` }),
    ]),
    el("p", { text: caption }),
  ]);
}
