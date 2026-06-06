import { el, renderBadges, renderHud } from "../../ui.js";
import { applyDelta, checkEnding } from "../../state.js";
import { renderEmailPrototypeGame } from "./email.js";
import { renderMeetingGame } from "./meeting.js";
import { renderReportGame } from "./report.js";
import { renderMiniGameBriefing } from "./briefing.js";
import { getCurrentMiniGame, getMiniGameBriefingKey, ROTATION } from "./flow.js";

const GAME_DELTAS = {
  email: {
    success: { workload: -20, gameMinute: 60 },
    partial: { workload: -10, stress: 5, gameMinute: 60 },
    fail: { workload: -3, stress: 15, health: -5, gameMinute: 60 },
  },
  meeting: {
    success: { workload: -20, gameMinute: 60 },
    partial: { workload: -10, stress: 8, gameMinute: 60 },
    fail: { workload: -3, stress: 20, health: -8, gameMinute: 60 },
  },
  report: {
    success: { workload: -20, gameMinute: 60 },
    partial: { workload: -10, stress: 8, gameMinute: 60 },
    fail: { workload: -5, stress: 20, health: -8, gameMinute: 60 },
  },
};

export function renderMiniGame(root, state, actions) {
  if (state.minigameRound >= ROTATION.length && !state.flags.devMode) {
    actions.finishWith(state.stats.workload <= 0 ? "success" : "overtime");
    return;
  }

  const game = getCurrentMiniGame(state);
  const gameId = game.id;
  const briefingKey = getMiniGameBriefingKey(state, gameId);

  if (state.flags?.minigameBriefingKey !== briefingKey) {
    renderMiniGameBriefing(root, state, {
      onStart: () => {
        actions.mutateState((draft) => {
          draft.flags.minigameBriefingKey = briefingKey;
          draft.flags.pendingMinigameBriefing = false;
          return draft;
        });
      },
    }, game, "standalone");
    return;
  }

  const extendedActions = {
    ...actions,
    go: (scene) => {
      if (scene !== "minigame") {
        actions.go(scene);
        return;
      }

      actions.mutateState((draft) => {
        draft.scene = "minigame";
        draft.flags.minigameBriefingKey = null;
        draft.flags.pendingMinigameBriefing = false;
        return draft;
      });
    },
    applyResult: (result, message) => {
      actions.mutateState((draft) => applyMiniResult(draft, gameId, result, message));
    },
  };

  if (gameId === "email") {
    renderEmailPrototypeGame(root, state, extendedActions, game);
  } else if (gameId === "meeting") {
    renderMeetingGame(root, state, extendedActions, game);
  } else if (gameId === "report") {
    renderReportGame(root, state, extendedActions, game);
  } else {
    renderPlaceholderMiniGame(root, state, extendedActions, game);
  }
}

function applyMiniResult(state, gameId, result, message) {
  const deltas = GAME_DELTAS[gameId] || GAME_DELTAS.email;
  let next = applyDelta(state, deltas[result], message);

  if (next.flags.devMode) {
    next.scene = "title";
    next.flags.devMode = false;
    next.flags.devGameId = null;
    next.flags.minigameBriefingKey = null;
    next.flags.pendingMinigameBriefing = false;
    return next;
  }

  next.minigameRound += 1;
  next.counters.successStreak = result === "success" ? next.counters.successStreak + 1 : 0;
  next.counters.failures += result === "fail" ? 1 : 0;
  next.flags.minigameBriefingKey = null;
  next.flags.pendingMinigameBriefing = false;

  const ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.scene = "ending";
  } else if (next.minigameRound >= ROTATION.length) {
    next.ending = next.stats.workload <= 0 ? "success" : "overtime";
    next.scene = "ending";
  } else if (next.minigameRound === 2) {
    next.scene = "lunch";
    next.gameMinute = Math.max(next.gameMinute, 12 * 60);
  } else {
    next.scene = "main";
  }
  return next;
}

function renderPlaceholderMiniGame(root, state, actions, game) {
  root.append(
    el("section", { class: "game-board" }, [
      renderHud(state),
      el("div", { class: "desk" }, [
        el("div", { class: "mini-layout" }, [
          el("div", { class: "mini-header" }, [
            el("h2", { text: `${state.minigameRound + 1}/${ROTATION.length} ${game.title}` }),
            el("strong", { text: "프로토타입 판정" }),
          ]),
          renderBadges(state),
          el("article", { class: "mini-card" }, [
            el("p", { text: game.description }),
            el("p", { text: "현재는 결과 버튼으로 전체 흐름을 검증합니다." }),
          ]),
        ]),
      ]),
      el("footer", { class: "item-row" }, [
        el("button", { class: "primary", text: "성공", onClick: () => actions.applyResult("success", `${game.title} 성공`) }),
        el("button", { text: "부분성공", onClick: () => actions.applyResult("partial", `${game.title} 부분성공`) }),
        el("button", { class: "danger", text: "실패", onClick: () => actions.applyResult("fail", `${game.title} 실패`) }),
      ]),
    ]),
  );
}
