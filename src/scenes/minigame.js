import { mailDeck, minigames } from "../data/minigames.js";
import { applyDelta, checkEnding } from "../state.js";
import { el, renderBadges, renderHud } from "../ui.js";

export function renderMiniGame(root, state, actions) {
  if (state.minigameRound >= 5) {
    actions.finishWith(state.stats.workload <= 0 ? "success" : "overtime");
    return;
  }

  const game = minigames[state.minigameRound % minigames.length];
  if (game.id === "email") renderEmailGame(root, state, actions, game);
  else renderPlaceholderMiniGame(root, state, actions, game);
}

function renderEmailGame(root, state, actions, game) {
  let index = 0;
  let score = 0;

  const content = el("section", { class: "game-board" }, [renderHud(state), el("div", { class: "desk" }), el("footer", { class: "item-row" })]);
  root.append(content);
  const desk = content.querySelector(".desk");
  const footer = content.querySelector("footer");

  function draw() {
    desk.innerHTML = "";
    footer.innerHTML = "";
    if (index >= mailDeck.length) return finish();
    const mail = mailDeck[index];
    desk.append(
      el("div", { class: "mini-layout" }, [
        el("div", { class: "mini-header" }, [
          el("h2", { text: `${state.minigameRound + 1}/5 ${game.title}` }),
          el("strong", { text: `정답 ${score}/${mailDeck.length}` }),
        ]),
        renderBadges(state),
        el("article", { class: "mail-card mini-card" }, [el("p", { text: mail.subject })]),
      ]),
    );
    footer.append(
      el("button", { text: "스팸", onClick: () => choose("spam") }),
      el("button", { class: "primary", text: "중요", onClick: () => choose("important") }),
    );
  }

  function choose(type) {
    if (mailDeck[index].type === type) score += 1;
    index += 1;
    draw();
  }

  function finish() {
    const result = score >= 8 ? "success" : score >= 5 ? "partial" : "fail";
    actions.mutateState((draft) => applyMiniResult(draft, result, `${game.title}: ${score}개 정확히 분류했습니다.`));
  }

  draw();
}

function renderPlaceholderMiniGame(root, state, actions, game) {
  root.append(
    el("section", { class: "game-board" }, [
      renderHud(state),
      el("div", { class: "desk" }, [
        el("div", { class: "mini-layout" }, [
          el("div", { class: "mini-header" }, [
            el("h2", { text: `${state.minigameRound + 1}/5 ${game.title}` }),
            el("strong", { text: "프로토타입 판정" }),
          ]),
          renderBadges(state),
          el("article", { class: "mini-card" }, [
            el("p", { text: game.description }),
            el("p", { text: "지금은 뼈대 단계라 성공/부분성공/실패 버튼으로 결과 흐름을 검증합니다." }),
          ]),
        ]),
      ]),
      el("footer", { class: "item-row" }, [
        el("button", { class: "primary", text: "성공", onClick: () => actions.mutateState((draft) => applyMiniResult(draft, "success", `${game.title} 성공`)) }),
        el("button", { text: "부분성공", onClick: () => actions.mutateState((draft) => applyMiniResult(draft, "partial", `${game.title} 부분성공`)) }),
        el("button", { class: "danger", text: "실패", onClick: () => actions.mutateState((draft) => applyMiniResult(draft, "fail", `${game.title} 실패`)) }),
      ]),
    ]),
  );
}

function applyMiniResult(state, result, message) {
  const deltas = {
    success: { workload: -20, gameMinute: 60 },
    partial: { workload: -10, stress: 8, gameMinute: 60 },
    fail: { workload: -3, stress: 18, health: -8, gameMinute: 60 },
  };
  let next = applyDelta(state, deltas[result], message);
  next.minigameRound += 1;
  next.counters.successStreak = result === "success" ? next.counters.successStreak + 1 : 0;
  next.counters.failures += result === "fail" ? 1 : 0;
  const ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.scene = "ending";
  } else if (next.minigameRound === 2) {
    next.scene = "lunch";
    next.gameMinute = Math.max(next.gameMinute, 12 * 60);
  } else {
    next.scene = "main";
  }
  return next;
}
