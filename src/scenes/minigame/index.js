import { el, renderBadges, renderHud } from "../../ui.js";
import { applyDelta, checkEnding, buildMiniOrder, MINI_ROUNDS, MAIN_PHASE_MINUTES } from "../../state.js";
import { minigames } from "../../data/minigames.js";
import { renderEmailGame } from "../minigame.js";
import { renderMeetingGame } from "./meeting.js";
import { renderReportGame } from "./report.js";

// 미니게임 순서: state.miniOrder(게임 시작 시 생성, 3종 보장+연속 중복 없음). 총 MINI_ROUNDS(5)회.

// 게임시간(gameMinute)은 델타에 두지 않고, 미니게임의 실제 소요 시간(usedSec)을 applyMiniResult에서 더한다.
const GAME_DELTAS = {
  // 이메일은 원본 src/scenes/minigame.js의 자체 결과 처리(local applyMiniResult)를 사용함.
  // 아래 email 항목은 폴백 기본값일 뿐 — 실제 이메일 보상은 minigame.js 기준.
  email: {
    success: { workload: -20 },
    partial: { workload: -10, stress: 8 },
    fail: { workload: -3, stress: 18, health: -8 },
  },
  meeting: {
    success: { workload: -20 },
    partial: { workload: -10, stress: 8 },
    fail: { workload: -3, stress: 20, health: -8 },
  },
  report: {
    success: { workload: -20 },
    partial: { workload: -10, stress: 8 },
    fail: { workload: -5, stress: 20, health: -8 },
  },
};

export function renderMiniGame(root, state, actions) {
  if (state.minigameRound >= MINI_ROUNDS && !state.flags.devMode) {
    actions.finishWith(state.stats.workload <= 0 ? "success" : "overtime");
    return;
  }

  const round = state.minigameRound;
  const order = state.miniOrder && state.miniOrder.length ? state.miniOrder : buildMiniOrder();
  const gameId = (state.flags.devMode && state.flags.devGameId)
    ? state.flags.devGameId
    : order[round % order.length];
  const game = minigames.find((g) => g.id === gameId) || minigames[0];

  const extendedActions = {
    ...actions,
    applyResult: (result, message, usedSec = 60) => {
      actions.mutateState((draft) => applyMiniResult(draft, gameId, result, message, usedSec));
    },
  };

  if (gameId === "email") {
    renderEmailGame(root, state, extendedActions, game);
  } else if (gameId === "meeting") {
    renderMeetingGame(root, state, extendedActions, game);
  } else if (gameId === "report") {
    renderReportGame(root, state, extendedActions, game);
  } else {
    renderPlaceholderMiniGame(root, state, extendedActions, game);
  }
}

function applyMiniResult(state, gameId, result, message, usedSec = 60) {
  const deltas = GAME_DELTAS[gameId] || GAME_DELTAS.email;
  let next = applyDelta(state, deltas[result], message);
  // 미니게임 실제 소요 시간만큼 게임시간 진행 (빨리 깰수록 일찍 퇴근)
  next.gameMinute += Math.max(0, Math.min(60, Math.round(usedSec)));

  if (next.flags.devMode) {
    next.scene = "title";
    next.flags.devMode = false;
    next.flags.devGameId = null;
    return next;
  }

  next.minigameRound += 1;
  next.counters.successStreak = result === "success" ? next.counters.successStreak + 1 : 0;
  next.counters.failures += result === "fail" ? 1 : 0;

  const ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.scene = "ending";
  } else if (next.minigameRound >= MINI_ROUNDS) {
    // 5라운드 모두 마쳤는데 업무량 남음 → 야근 (업무량≤0이면 위 checkEnding에서 success).
    // 야근은 18:00 기준으로 표시.
    next.ending = "overtime";
    next.gameMinute = Math.max(next.gameMinute, 18 * 60);
    next.scene = "ending";
  } else if (next.minigameRound === 2) {
    next.scene = "lunch";
    next.gameMinute = Math.max(next.gameMinute, 12 * 60);
  } else {
    next.scene = "main";
    next.flags.mainPhaseEnd = next.gameMinute + MAIN_PHASE_MINUTES;
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
            el("h2", { text: `${state.minigameRound + 1}/${MINI_ROUNDS} ${game.title}` }),
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
