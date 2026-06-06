import { bosses } from "./data/bosses.js";
import { startingInventory } from "./data/player-types.js";

export const MINI_GAMES = ["email", "meeting", "report"];
export const MINI_ROUNDS = 5;
export const MAIN_PHASE_MINUTES = 35; // 메인화면 1회 체류 게임시간 (실시간 35초)

// 미니게임 5라운드 순서 생성:
//   1~3라운드 = 3종 셔플 (모두 1회 등장 · 서로 달라 연속 중복 없음)
//   4~5라운드 = 직전 라운드와 다른 것 랜덤
// → 3종 각각 최소 1회 보장 + 같은 미니게임 연속(예: 1→1) 금지.
export function buildMiniOrder() {
  const order = MINI_GAMES.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  while (order.length < MINI_ROUNDS) {
    let pick;
    do { pick = MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)]; }
    while (pick === order[order.length - 1]);
    order.push(pick);
  }
  return order;
}

export function createInitialState() {
  const boss = bosses[Math.floor(Math.random() * bosses.length)];

  return {
    scene: "title",
    phaseIndex: 0,
    minigameRound: 0,
    miniOrder: buildMiniOrder(),
    gameMinute: 8 * 60 + 58,
    ending: null,
    player: {
      name: "오늘의 직장인",
      gender: "male",
      type: "coffee",
    },
    boss,
    colleagueTrust: 30,
    stats: {
      workload: 100,
      stress: 0,
      health: 100,
    },
    // 설정 화면(서명하고 출근)에서 유형 기준으로 다시 설정됨. 기본값은 커피파.
    inventory: startingInventory("coffee"),
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
    log: [
      {
        time: "09:00",
        icon: "🔵",
        cause: "출근 준비를 마쳤다.",
        effects: ["오늘 안에 업무량을 0으로 만들어야 한다."],
      },
    ],
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
  if (message) addLogEntry(next, { cause: message, delta });
  return next;
}

export function addLogEntry(state, entry) {
  const normalized = normalizeLogEntry(state, entry);
  state.log = [...(state.log ?? []), normalized].slice(-20);
  return state;
}

export function normalizeLogEntry(state, entry) {
  if (typeof entry === "string") {
    return {
      time: formatTime(state.gameMinute),
      icon: "🔵",
      cause: entry,
      effects: [],
    };
  }

  const effects = [...describeDelta(entry.delta ?? {}), ...(entry.effects ?? [])];
  return {
    time: entry.time ?? formatTime(state.gameMinute),
    icon: entry.icon ?? iconForDelta(entry.delta ?? {}, effects),
    cause: entry.cause,
    effects,
  };
}

function describeDelta(delta) {
  const labels = {
    workload: "업무량",
    stress: "스트레스",
    health: "체력",
    colleagueTrust: "신뢰도",
    gameMinute: "시간",
  };

  return Object.entries(delta)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => {
      const label = labels[key] ?? key;
      const suffix = key === "gameMinute" ? "분" : "";
      return `${label} ${value > 0 ? "+" : ""}${value}${suffix}`;
    });
}

function iconForDelta(delta, effects) {
  const values = Object.entries(delta).filter(([key, value]) => key !== "gameMinute" && value !== 0);
  if (values.some(([key]) => key === "workload")) return "🔵";

  const score = values.reduce((total, [key, value]) => {
    if (key === "stress") return total + (value < 0 ? 1 : -1);
    if (key === "health" || key === "colleagueTrust") return total + (value > 0 ? 1 : -1);
    return total;
  }, 0);

  if (score > 0) return "🟢";
  if (score < 0) return "🔴";
  return effects.length > 1 ? "🟡" : "🔵";
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
