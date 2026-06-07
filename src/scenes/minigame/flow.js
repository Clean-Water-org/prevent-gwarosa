import { minigames } from "../../data/minigames.js";
import { MINI_ROUNDS } from "../../state.js";

export { MINI_ROUNDS };

// 미니게임 결과 등급 → 업무 일지 표시용 한글 라벨 (success/partial/fail 영어 노출 방지)
export const MINI_TIER_LABEL = {
  success: "성공",
  partial: "부분 성공",
  fail: "실패",
};

// 저장본에 순서가 없을 때만 쓰는 결정적 폴백(매 호출 동일 → 도중 변경 방지)
const FALLBACK_ORDER = ["email", "meeting", "report", "email", "meeting"];

export function getCurrentMiniGame(state) {
  const round = state.minigameRound ?? 0;
  const order = state.miniOrder?.length ? state.miniOrder : FALLBACK_ORDER;
  const gameId = (state.flags?.devMode && state.flags?.devGameId)
    ? state.flags.devGameId
    : order[round % order.length];
  return minigames.find((game) => game.id === gameId) || minigames[0];
}

export function getMiniGameBriefingKey(state, gameId = getCurrentMiniGame(state).id) {
  return `${state.flags?.runId ?? "run"}:${state.minigameRound ?? 0}:${gameId}`;
}

// 1~3라운드 결과로 4·5라운드를 결정한다.
//  - 4라운드: 직전(라운드3=prevGame)과 연속되지 않도록 prevGame을 제외한 게임 중 '성공률 최저'(차순위 대체).
//    실패 < 부분성공 < 성공. 동점이면 그중 랜덤.
//  - 5라운드: 3개 중 랜덤 (4라운드와 연속 중복 금지)
const TIER = { fail: 0, partial: 1, success: 2 };
export function buildLateRounds(resultByGame, prevGame) {
  const GAMES = ["email", "meeting", "report"];
  const tierOf = (g) => (TIER[resultByGame?.[g]] ?? 2);
  const eligible = GAMES.filter((g) => g !== prevGame);
  const minTier = Math.min(...eligible.map(tierOf));
  const cands = eligible.filter((g) => tierOf(g) === minTier);
  const r4 = cands[Math.floor(Math.random() * cands.length)];
  let r5;
  do { r5 = GAMES[Math.floor(Math.random() * GAMES.length)]; } while (r5 === r4);
  return [r4, r5];
}
