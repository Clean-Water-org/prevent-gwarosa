import { bosses } from "./data/bosses.js";

export function createInitialState() {
  const boss = bosses[Math.floor(Math.random() * bosses.length)];

  return {
    scene: "title",
    phaseIndex: 0,
    minigameRound: 0,
    gameMinute: 9 * 60,
    ending: null,
    player: {
      name: "오늘의 직장인",
      gender: "neutral",
      type: "coffee",
    },
    boss,
    colleagueTrust: 35,
    stats: {
      workload: 100,
      stress: 0,
      health: 100,
    },
    inventory: ["coffee", "shorts"],
    counters: {
      coffeeStreak: 0,
      smokeUses: 0,
      successStreak: 0,
      failures: 0,
    },
    flags: {
      forcedMeeting: false,
      nextBossOrderBoost: false,
    },
    log: ["09:00 출근 준비 완료. 오늘 안에 업무량을 0으로 만들어야 합니다."],
  };
}

export function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

export function applyDelta(state, delta, message) {
  const next = { ...state, stats: { ...state.stats } };
  for (const [key, value] of Object.entries(delta)) {
    if (key in next.stats) next.stats[key] = clampStat(next.stats[key] + value);
    if (key === "colleagueTrust") next.colleagueTrust = clampStat(next.colleagueTrust + value);
    if (key === "gameMinute") next.gameMinute += value;
  }
  if (message) next.log = [message, ...next.log].slice(0, 8);
  return next;
}

export function checkEnding(state) {
  if (state.stats.health <= 0) return "overwork";
  if (state.stats.stress >= 100) return "quit";
  if (state.stats.workload <= 0) return "success";
  if (state.gameMinute >= 18 * 60) return state.stats.workload <= 0 ? "success" : "overtime";
  return null;
}

export function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
