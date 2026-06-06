import { el } from "../ui.js";

export function renderTitle(root, state, actions) {
  root.append(
    el("section", { class: "title-menu-screen" }, [
      el("div", { class: "title-game-window" }, [
        el("header", { class: "title-window-bar" }, [
          el("span", { text: "🏢 overwork_prevention.exe — 출근 준비" }),
          el("div", { class: "window-buttons" }, [
            el("span", { text: "_" }),
            el("span", { text: "▢" }),
            el("span", { text: "✕" }),
          ]),
        ]),
        el("nav", { class: "title-menu-bar" }, [
          el("span", { text: "파일" }),
          el("span", { text: "설정" }),
          el("span", { text: "도움말" }),
          el("strong", { text: "v0.3" }),
        ]),
        el("div", { class: "title-menu-content" }, [
          el("div", { class: "title-crt-card" }, [
            el("h1", { class: "title-logo", text: "과로사 방지" }),
            el("p", { class: "title-tagline", text: "야근 없이 칼퇴하라" }),
            el("p", { class: "title-question", text: "출근하시겠습니까?" }),
            el("div", { class: "title-buttons" }, [
              el("button", {
                class: "title-main-button",
                onClick: () => actions.go("commute"),
              }, [
                el("span", { class: "play-mark", text: "▶" }),
                el("span", { text: "출근하기" }),
              ]),
              el("button", {
                class: "title-help-button",
                text: "도움말",
                onClick: () => actions.go("onboarding"),
              }),
            ]),
            el("div", { class: "px-scanline" }),
            el("div", { class: "px-glare" }),
          ]),
          el("details", { class: "dev-panel" }, [
            el("summary", { text: "개발자 모드" }),
            el("div", { class: "dev-actions" }, [
              el("button", {
                text: "09:00 시작화면 바로 보기",
                onClick: () => actions.go("commute"),
              }),
              el("button", {
                text: "메인화면 바로 보기",
                onClick: () => actions.go("main"),
              }),
              el("button", {
                text: "이메일 분류 원본 실행",
                onClick: () => {
                  window.location.href = "./assets/minigames/email-classification-prototype.html";
                },
              }),
              el("button", {
                text: "회의 준비 바로 보기",
                onClick: () => actions.mutateState((draft) => ({
                  ...draft,
                  scene: "minigame",
                  flags: { ...draft.flags, devMode: true, devGameId: "meeting" },
                })),
              }),
              el("button", {
                text: "보고서 오탈자 바로 보기",
                onClick: () => actions.mutateState((draft) => ({
                  ...draft,
                  scene: "minigame",
                  flags: { ...draft.flags, devMode: true, devGameId: "report" },
                })),
              }),
            ]),
          ]),
        ]),
      ]),
    ]),
  );
}
