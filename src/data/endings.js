// endings.js — 엔딩 화면 데이터 (ending.jsx 6종 포팅)
//
// checkEnding(4종) → 엔딩 카드(6종) 매핑:
//   success  → 칼퇴 S/A/B (퇴근 시각 등급)   overtime → 야근
//   quit     → 당일퇴사                        overwork → 과로사
// 카드 key는 일러스트 에셋 키(assets/endings/{key}.svg)와 동일.
// 스탯·퇴근시각·야근 잔여량 등 동적 값은 씬(ending.js)에서 실제 state로 채운다.

export const ENDINGS = {
  "clear-s": {
    key: "clear-s",
    group: "success",
    accent: "#bfe3c0",
    emoji: "🏆",
    title: "칼퇴 성공!",
    illo: "환한 오후 · 가방 메고 빈 사무실을 나서는 뒷모습",
    lines: ["오후 5시도 안 됐는데 업무가 끝났다.", "여유로운 발걸음으로 사무실을 나선다.", "완벽한 하루 — S등급, 오늘의 승자!"],
    clockLabel: "퇴근 시각",
    badge: "S",
    badgeLabel: "17:00 이전",
  },
  "clear-a": {
    key: "clear-a",
    group: "success",
    accent: "#bfe3c0",
    emoji: "🏆",
    title: "칼퇴 성공!",
    illo: "해 질 무렵 · 동료들과 인사하고 나서는 모습",
    lines: ["정시에 딱 맞춰 업무를 마무리했다.", "붐비기 전에 가뿐하게 퇴근.", "무난한 하루 — A등급, 잘 해냈다."],
    clockLabel: "퇴근 시각",
    badge: "A",
    badgeLabel: "17:00 ~ 17:30",
  },
  "clear-b": {
    key: "clear-b",
    group: "success",
    accent: "#bfe3c0",
    emoji: "🏆",
    title: "칼퇴… 성공?",
    illo: "6시 직전 · 시계 보며 서둘러 짐 챙기는 모습",
    lines: ["6시가 코앞, 막판에 겨우 끝냈다.", "야근은 면했다. 휴, 살았다.", "아슬아슬 — B등급, 그래도 칼퇴는 칼퇴!"],
    clockLabel: "퇴근 시각",
    badge: "B",
    badgeLabel: "17:30 ~ 18:00",
  },
  overtime: {
    key: "overtime",
    group: "overtime",
    accent: "#cdd3da",
    emoji: "😩",
    title: "야근 확정…",
    illo: "텅 빈 사무실 · 혼자 켜진 모니터 불빛",
    lines: ["18:00 — 아직 업무량이 남아있다.", "\"먼저 들어가세요…\" 야근이 시작된다.", "오늘도 칼퇴는 다음 생에."],
    clockLabel: "현재 시각",
    badge: "✗",
    badgeLabel: "업무량 잔여", // 씬에서 실제 잔여 업무량을 덧붙임
  },
  quit: {
    key: "quit",
    group: "quit",
    accent: "#f3c7a6",
    emoji: "😤",
    title: "저… 퇴사하겠습니다",
    illo: "책상 위 사직서 · 박차고 일어나는 뒷모습",
    lines: ["스트레스가 한계치에 도달했다.", "\"더는 못 하겠어요.\" 자리에서 일어선다.", "후련함과 막막함이 동시에 밀려온다."],
    clockLabel: "퇴사 선언 시각",
    badge: "!",
    badgeLabel: "스트레스 100 도달",
  },
  overwork: {
    key: "overwork",
    group: "overwork",
    accent: "#d8d2cb",
    emoji: "💀",
    title: "과로사…",
    illo: "책상에 엎드린 실루엣 · 흑백 연출",
    lines: ["체력이 모두 바닥났다.", "눈앞이 캄캄해지며 의식이 흐려진다.", "당신의 헌신을 회사는 기억하지 못합니다."],
    clockLabel: "쓰러진 시각",
    badge: "💀",
    badgeLabel: "체력 0 도달",
  },
};

// 최종 스탯 요약 3바 구성 (실제 값은 씬에서 state.stats로 채움)
//   dir: 좋은 방향 표시, statKey: state.stats의 키
export const STAT_BARS = [
  { statKey: "workload", label: "업무량", dir: "↓굿", color: "ink" },
  { statKey: "stress", label: "스트레스", dir: "↓굿", color: "marker" },
  { statKey: "health", label: "체력", dir: "↑굿", color: "blue" },
];

// 퇴근 시각(gameMinute) → 칼퇴 등급. S(17:00 이전) / A(17:00~17:30) / B(17:30~18:00)
export function gradeOf(gameMinute) {
  if (gameMinute < 17 * 60) return "S";
  if (gameMinute < 17 * 60 + 30) return "A";
  return "B";
}

// 게임 상태 → 표시할 엔딩 카드 1개
export function resolveEnding(state) {
  const id = state.ending;
  if (id === "success") return ENDINGS["clear-" + gradeOf(state.gameMinute).toLowerCase()];
  if (id === "overtime") return ENDINGS.overtime;
  if (id === "quit") return ENDINGS.quit;
  if (id === "overwork") return ENDINGS.overwork;
  return ENDINGS.overtime; // 알 수 없는 값 fallback
}
