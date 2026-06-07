import { applyDelta, applyWorkTimeCost } from "../../state.js";

export const MINIGAME_WORK_MINUTES = 28;
export const MINIGAME_HEALTH_MULTIPLIER = 1;

export const GAME_DELTAS = {
  email: {
    success: { workload: -20, stress: 3 },
    partial: { workload: -10, stress: 8, health: -3 },
    fail: { workload: -3, stress: 16, health: -8 },
  },
  meeting: {
    success: { workload: -20, stress: 4 },
    partial: { workload: -10, stress: 10, health: -3 },
    fail: { workload: -3, stress: 20, health: -10 },
  },
  report: {
    success: { workload: -20, stress: 4 },
    partial: { workload: -10, stress: 10, health: -3 },
    fail: { workload: -5, stress: 20, health: -10 },
  },
};

/** 미니게임 결과 적용 전·후 스탯 변화(피로 포함)를 시뮬레이션한다. */
export function previewMiniGameResult(state, gameId, result, usedSec = 60) {
  const tierDelta = GAME_DELTAS[gameId]?.[result] ?? GAME_DELTAS.email[result];
  const before = {
    workload: state.stats.workload,
    stress: state.stats.stress,
    health: state.stats.health,
  };

  let draft = structuredClone(state);
  draft = applyDelta(draft, tierDelta, null);
  const workMinutes = Math.max(MINIGAME_WORK_MINUTES, Math.min(60, Math.round(usedSec)));
  applyWorkTimeCost(draft, workMinutes, { healthMultiplier: MINIGAME_HEALTH_MULTIPLIER });

  const after = {
    workload: draft.stats.workload,
    stress: draft.stats.stress,
    health: draft.stats.health,
  };

  return {
    before,
    after,
    delta: {
      workload: after.workload - before.workload,
      stress: after.stress - before.stress,
      health: after.health - before.health,
    },
    workMinutes,
  };
}

export function getMiniResultStatDeltas(preview) {
  const items = [];
  const entries = [
    ["업무량", preview.delta.workload],
    ["스트레스", preview.delta.stress],
    ["체력", preview.delta.health],
  ];
  for (const [label, value] of entries) {
    if (value !== 0) items.push({ label, v: value });
  }
  return items;
}

export function appendMiniResultDeltaRow(parent, deltas, ink = "#1d1f2e") {
  const deltaRow = document.createElement("div");
  deltaRow.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:center";
  deltas.forEach((d) => {
    const s = document.createElement("span");
    s.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:13px;border:2px solid ${ink};padding:4px 12px;background:${d.v < 0 ? "#d7f3d4" : "#ffdcd4"};color:${d.v < 0 ? "#1f8a2e" : "#c0392b"}`;
    s.textContent = `${d.label} ${d.v < 0 ? "▼" : "▲"}${Math.abs(d.v)}`;
    deltaRow.append(s);
  });
  parent.append(deltaRow);
  return deltaRow;
}

export function appendMiniResultHealthSummary(parent, preview, ink = "#1d1f2e") {
  const { before, after, delta } = preview;
  if (delta.health === 0) return null;

  const line = document.createElement("p");
  line.style.cssText = `margin:0;font-family:NeoDunggeunmo,monospace;font-size:12.5px;color:${ink};opacity:.92`;
  const sign = delta.health > 0 ? "+" : "";
  line.textContent = `❤ 체력 ${before.health} → ${after.health} (${sign}${delta.health}, 업무 ${preview.workMinutes}분 반영)`;
  parent.append(line);
  return line;
}
