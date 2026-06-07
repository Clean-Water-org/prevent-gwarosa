import { bosses } from "./data/bosses.js";
import { startingInventory } from "./data/player-types.js";

// 미니게임 순서·라운드 수는 flow.js(ROTATION)에서 관리한다.

export function createInitialState() {
  const boss = bosses[Math.floor(Math.random() * bosses.length)];

  return {
    scene: "title",
    phaseIndex: 0,
    minigameRound: 0,
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
      mainEventCount: 0,
      mainPhaseEventUsed: null,
    },
    flags: {
      runId: createRunId(),
      forcedMeeting: false,
      nextBossOrderBoost: false,
      forcedBossOrder: false,
      hiddenBreakPenalty: false,
      badMailInterview: false,
      statusEvents: {},
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

function createRunId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
      if (key === "gameMinute") {
        return value > 0 ? `시간 경과 ${value}분` : `시간 단축 ${Math.abs(value)}분`;
      }
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

// 엔딩 판정 (우선순위: 과로사 > 당일퇴사 > 칼퇴(즉시) > 야근(18:00))
export function checkEnding(state) {
  if (state.stats.health <= 0) return "overwork"; // 체력 0 — 게임오버 최우선
  if (state.stats.stress >= 100) return "quit"; // 스트레스 100 — 당일퇴사
  if (state.stats.workload <= 0) return "success"; // 업무량 0 — 즉시 칼퇴 (등급은 현재 시각 기준)
  if (state.gameMinute >= 18 * 60) return "overtime"; // 18:00에 업무량 남음 — 야근 (위에서 success 처리됨)
  return null;
}

export function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
