import { el, renderHud } from "../../ui.js";

const GAME_ICONS = {
  email: "📧",
  meeting: "📊",
  report: "📝",
};

export function renderMiniGameBriefing(root, state, options, game, mode = "inline") {
  const statuses = describeMiniGameStatus(state, game.id);
  const icon = GAME_ICONS[game.id] ?? "💼";
  const overlayClass = mode === "overlay"
    ? "minigame-briefing-overlay"
    : "minigame-briefing-standalone";

  const briefing = el("div", { class: overlayClass }, [
    el("article", { class: "minigame-briefing-window", role: "dialog", "aria-modal": "true" }, [
      el("header", { class: "minigame-briefing-titlebar" }, [
        el("div", { class: "minigame-briefing-lights" }, [
          el("span", { class: "red" }),
          el("span", { class: "yellow" }),
          el("span", { class: "green" }),
        ]),
        el("strong", { text: "새 업무 알림" }),
        el("span", { text: "_ □ ×" }),
      ]),
      el("section", { class: "minigame-briefing-body" }, [
        el("div", { class: "minigame-briefing-heading" }, [
          el("span", { class: "minigame-briefing-icon", text: icon }),
          el("h2", { text: game.title }),
        ]),
        el("p", { class: "minigame-briefing-description", text: game.description }),
        el("div", { class: "minigame-briefing-rule" }),
        el("section", { class: "minigame-briefing-section" }, [
          el("strong", { text: "현재 상태" }),
          el("ul", { class: "minigame-briefing-status-list" },
            statuses.map((status) => el("li", { text: status })),
          ),
        ]),
        el("div", { class: "minigame-briefing-rule" }),
        el("section", { class: "minigame-briefing-time" }, [
          el("strong", { text: "예상 업무 시간" }),
          el("span", { text: "⏱ 60초" }),
        ]),
        el("footer", { class: "minigame-briefing-actions" }, [
          el("button", {
            class: "primary minigame-briefing-start",
            type: "button",
            text: "업무 시작",
            onClick: () => options.onStart?.(),
          }),
        ]),
      ]),
      el("div", { class: "px-scanline" }),
      el("div", { class: "px-glare" }),
    ]),
  ]);

  if (mode === "standalone") {
    root.append(el("section", { class: "minigame-briefing-shell" }, [
      renderHud(state),
      el("div", { class: "minigame-briefing-room" }, [
        el("div", { class: "minigame-briefing-monitor" }, [
          el("div", { class: "minigame-briefing-screen" }, [briefing]),
        ]),
        el("div", { class: "minigame-briefing-monitor-neck" }),
        el("div", { class: "minigame-briefing-monitor-base" }),
      ]),
    ]));
    return;
  }

  root.append(briefing);
}

function describeMiniGameStatus(state, gameId) {
  const statuses = [];
  const stress = state.stats?.stress ?? 0;
  const health = state.stats?.health ?? 100;
  const coffeeStreak = state.counters?.coffeeStreak ?? 0;

  if (stress >= 80) {
    statuses.push("⚠ 스트레스가 매우 높습니다.");
  } else if (stress >= 50) {
    statuses.push("⚠ 스트레스가 쌓이고 있습니다.");
  }

  if (gameId === "email") {
    if (stress >= 70) statuses.push("메일 내용이 흐릿하게 보입니다.");
    else if (stress >= 50) statuses.push("평소보다 애매한 메일이 섞입니다.");
    if (health <= 30) statuses.push("두통 때문에 메일 카드가 흔들립니다.");
    if (coffeeStreak >= 2) statuses.push("☕ 손이 미세하게 떨립니다.");
  }

  if (gameId === "meeting") {
    if (stress >= 80) statuses.push("슬라이드 부제가 일부 짧게 보입니다.");
    else if (stress >= 50) statuses.push("정리할 슬라이드가 늘어납니다.");
    if (stress >= 70) statuses.push("커서가 무겁게 움직입니다.");
    if (health <= 30) statuses.push("두통 때문에 슬라이드 제목이 흐릿합니다.");
    if (coffeeStreak >= 2) statuses.push("☕ 손이 미세하게 떨립니다.");
  }

  if (gameId === "report") {
    if (stress >= 80) statuses.push("보고서 화면이 흔들립니다.");
    else if (stress >= 50) statuses.push("검토할 보고서 분량이 늘어납니다.");
  }

  return statuses.length ? statuses : ["특별한 방해 상태는 없습니다."];
}
