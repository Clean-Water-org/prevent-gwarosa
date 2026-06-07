import { el, renderBadges, renderHud } from "../../ui.js";
import { applyDelta, applyWorkTimeCost, checkEnding } from "../../state.js";
import { renderEmailGame } from "./email.js";
import { renderMeetingGame } from "./meeting.js";
import { renderReportGame } from "./report.js";
import { renderMiniGameBriefing } from "./briefing.js";
import { getCurrentMiniGame, getMiniGameBriefingKey, MINI_ROUNDS, buildLateRounds } from "./flow.js";

// 미니게임 씬 이탈 시 window 리스너·타이머 정리 (두통→엔딩 등 cleanup 없이 전환될 때).
export { cleanupMinigameScene, setMinigameCleanup } from "./lifecycle.js";

// 미니게임 선택은 flow.js getCurrentMiniGame(state.miniOrder, 5라운드) 사용. 시간은 실제 소요(usedSec).

// 게임시간(gameMinute)은 델타에 두지 않고, 미니게임의 실제 소요 시간(usedSec)을 applyMiniResult에서 더한다.
const MINIGAME_WORK_MINUTES = 42;
const MINIGAME_HEALTH_MULTIPLIER = 1.5;

const GAME_DELTAS = {
  email: {
    success: { workload: -20, stress: 3, health: -3 },
    partial: { workload: -10, stress: 8, health: -5 },
    fail: { workload: -3, stress: 16, health: -10 },
  },
  meeting: {
    success: { workload: -20, stress: 4, health: -3 },
    partial: { workload: -10, stress: 10, health: -5 },
    fail: { workload: -3, stress: 20, health: -12 },
  },
  report: {
    success: { workload: -20, stress: 4, health: -3 },
    partial: { workload: -10, stress: 10, health: -5 },
    fail: { workload: -5, stress: 20, health: -12 },
  },
};

export function renderMiniGame(root, state, actions) {
  if (state.minigameRound >= MINI_ROUNDS && !state.flags.devMode) {
    actions.finishWith(state.stats.workload <= 0 ? "success" : "overtime");
    return;
  }

  const game = getCurrentMiniGame(state);
  const gameId = game.id;
  const briefingKey = getMiniGameBriefingKey(state, gameId);

  // 미니게임 진입 전 브리핑 게이트 (메인에서 못 본 경우의 폴백)
  if (state.flags?.minigameBriefingKey !== briefingKey && !state.flags?.devMode) {
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
  // 미니게임 실제 소요 + 최소 업무 블록 (빨리 깰수록 일찍 퇴근·체력 소모는 줄지만 기본 피로는 발생)
  const workMinutes = Math.max(MINIGAME_WORK_MINUTES, Math.min(60, Math.round(usedSec)));
  applyWorkTimeCost(next, workMinutes, { healthMultiplier: MINIGAME_HEALTH_MULTIPLIER });

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
  // 1~3라운드 결과를 게임별로 기록 (4·5라운드 최저 성공 게임 산정용)
  next.counters.miniResultByGame = { ...(next.counters.miniResultByGame ?? {}), [gameId]: result };
  // 체력 40 이하 + 미니게임 성공 시 35% 확률로 인센티브 이벤트 예약(다음 메인화면에서 보유 유형 아이템 무료 지급)
  if (result === "success" && next.stats.health <= 40 && Math.random() < 0.35) {
    next.flags.forcedIncentive = true;
  }
  // 3라운드(이메일·회의·보고서) 종료 직후 4·5라운드 확정:
  //   4라운드 = 1~3 중 성공률 최저 게임(직전과 연속되면 차순위), 5라운드 = 랜덤(연속 금지)
  if (next.minigameRound === 3 && Array.isArray(next.miniOrder) && next.miniOrder.length >= 5) {
    const [r4, r5] = buildLateRounds(next.counters.miniResultByGame, next.miniOrder[2]);
    next.miniOrder = [...next.miniOrder.slice(0, 3), r4, r5];
  }
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
  } else if (next.minigameRound >= MINI_ROUNDS) {
    // 모든 라운드를 마쳤는데 업무량 남음 → 야근 (업무량≤0이면 위 checkEnding에서 success).
    // 야근은 18:00 기준으로 표시.
    next.ending = "overtime";
    next.gameMinute = Math.max(next.gameMinute, 18 * 60);
    next.scene = "ending";
  } else if (next.minigameRound === 2) {
    next.scene = "main";
    next.gameMinute = Math.max(next.gameMinute, 12 * 60);
    next.flags = { ...next.flags, lunchPhase: "intro" };
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
        el("button", { class: "primary", text: "성공", onClick: () => actions.applyResult("success") }),
        el("button", { text: "부분성공", onClick: () => actions.applyResult("partial") }),
        el("button", { class: "danger", text: "실패", onClick: () => actions.applyResult("fail") }),
      ]),
    ]),
  );
}
