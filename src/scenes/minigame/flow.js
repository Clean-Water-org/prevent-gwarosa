import { minigames } from "../../data/minigames.js";

export const ROTATION = ["email", "meeting", "report", "email"];

export function getCurrentMiniGame(state) {
  const round = state.minigameRound ?? 0;
  const gameId = (state.flags?.devMode && state.flags?.devGameId)
    ? state.flags.devGameId
    : ROTATION[round % ROTATION.length];
  return minigames.find((game) => game.id === gameId) || minigames[0];
}

export function getMiniGameBriefingKey(state, gameId = getCurrentMiniGame(state).id) {
  return `${state.flags?.runId ?? "run"}:${state.minigameRound ?? 0}:${gameId}`;
}
