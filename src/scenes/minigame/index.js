import { el, renderBadges, renderHud } from "../../ui.js";
import { applyDelta, checkEnding } from "../../state.js";
import { renderEmailGame } from "./email.js";
import { renderMeetingGame } from "./meeting.js";
import { renderReportGame } from "./report.js";
import { renderMiniGameBriefing } from "./briefing.js";
import { getCurrentMiniGame, getMiniGameBriefingKey, ROTATION } from "./flow.js";

// 미니게임 선택은 flow.js getCurrentMiniGame(4라운드 ROTATION) 사용. 시간은 실제 소요(usedSec).

// 게임시간(gameMinute)은 델타에 두지 않고, 미니게임의 실제 소요 시간(usedSec)을 applyMiniResult에서 더한다.
const GAME_DELTAS = {
  email: {
    success: { workload: -25 },
    partial: { workload: -10, stress: 8 },
    fail: { workload: -3, stress: 18, health: -8 },
  },
  meeting: {
    success: { workload: -25 },
    partial: { workload: -10, stress: 8 },
    fail: { workload: -3, stress: 20, health: -8 },
  },
  report: {
    success: { workload: -25 },
    partial: { workload: -10, stress: 8 },
    fail: { workload: -5, stress: 20, health: -8 },
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

  // 미니게임 진입 전 브리핑 게이트 (메인에서 못 본 경우의 폴백)
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
    // 실제 소요 시간(usedSec)을 받아 게임시간에 반영
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
    next.flags.minigameBriefingKey = null;
    next.flags.pendingMinigameBriefing = false;
    return next;
  }

  next.minigameRound += 1;
  next.counters.minigameResults = [
    ...(next.counters.minigameResults ?? []),
    { gameId, result },
  ].slice(-2);
  next.counters.successStreak = result === "success" ? next.counters.successStreak + 1 : 0;
  next.counters.failures += result === "fail" ? 1 : 0;
  if (gameId === "email" && result === "fail") {
    next.flags.badMailInterview = true;
  }
  next.flags.minigameBriefingKey = null;
  next.flags.pendingMinigameBriefing = false;

  const ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.scene = "ending";
  } else if (next.minigameRound >= ROTATION.length) {
    // 모든 라운드를 마쳤는데 업무량 남음 → 야근 (업무량≤0이면 위 checkEnding에서 success).
    // 야근은 18:00 기준으로 표시.
    next.ending = "overtime";
    next.gameMinute = Math.max(next.gameMinute, 18 * 60);
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
        el("button", { class: "primary", text: "성공", onClick: () => actions.applyResult("success") }),
        el("button", { text: "부분성공", onClick: () => actions.applyResult("partial") }),
        el("button", { class: "danger", text: "실패", onClick: () => actions.applyResult("fail") }),
      ]),
    ]),
  );
}
