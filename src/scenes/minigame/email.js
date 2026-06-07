import { el, renderHud } from "../../ui.js";

export function renderEmailPrototypeGame(root, state, actions, game) {
  const iframe = el("iframe", {
    class: "email-prototype-frame",
    title: game.title,
    src: buildPrototypeUrl(state),
  });

  const shell = el("section", { class: "email-prototype-shell" }, [
    renderHud(state),
    el("div", { class: "email-prototype-stage" }, [iframe]),
  ]);

  const startedAt = Date.now();

  const onMessage = (event) => {
    if (event.source !== iframe.contentWindow) return;
    if (event.data?.type !== "email-minigame-result") return;

    window.removeEventListener("message", onMessage);
    const result = event.data.result ?? "fail";
    const correct = event.data.correct ?? 0;
    const total = event.data.total ?? 10;
    // 실제 소요 시간(초): 프로토타입이 usedSec를 보내면 우선, 없으면 래퍼가 경과 시간으로 측정 (0~60)
    const usedSec = event.data.usedSec != null
      ? event.data.usedSec
      : Math.max(0, Math.min(60, Math.round((Date.now() - startedAt) / 1000)));
    actions.applyResult(result, `정확 ${correct}/${total}`, usedSec);
  };

  window.addEventListener("message", onMessage);
  root.append(shell);
}

function buildPrototypeUrl(state) {
  const params = new URLSearchParams({
    embedded: "1",
    stress: String(state.stats?.stress ?? 0),
    fx: getPrototypeFx(state),
  });

  return `./assets/minigames/email-classification-prototype.html?${params.toString()}`;
}

function getPrototypeFx(state) {
  if ((state.stats?.health ?? 100) <= 30) return "headache";
  if ((state.counters?.coffeeStreak ?? 0) >= 2) return "coffee";
  if ((state.stats?.stress ?? 0) >= 70) return "burnout";
  return "";
}
