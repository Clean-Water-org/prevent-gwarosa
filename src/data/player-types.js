// player-types.js — 설정 화면 유형(커피파/담배파) 데이터
// setup.jsx의 TYPE_DATA 포팅. 유형 고유 정보(기본 아이템·효과·패널티)와 시작 인벤토리 매핑.

export const PLAYER_TYPES = {
  coffee: {
    name: "커피파",
    emoji: "☕",
    hint: "체력형",
    item: "coffee", // 기본 아이템 id (data/items.js)
    rows: [
      { ic: "🎒", k: "기본 아이템", v: "커피 ☕ — 게임 시작 시 1개 지급" },
      { ic: "💧", k: "효과", v: "사용 시 체력 +15" },
      { ic: "⚠️", k: "패널티", v: "연속 2회 사용 시 '커피 과다복용' → 미니게임 중 커서가 잘게 떨림" },
    ],
  },
  cigarette: {
    name: "담배파",
    emoji: "🚬",
    hint: "멘탈형",
    item: "smoke", // 담배 아이템 id는 smoke
    rows: [
      { ic: "🎒", k: "기본 아이템", v: "담배 🚬 — 게임 시작 시 1개 지급" },
      { ic: "💧", k: "효과", v: "사용 시 스트레스 -12 · 플레이 시간 소폭 단축" },
      { ic: "⚠️", k: "패널티", v: "체력 감소 · 30% 확률 '흡연 초과' → 스트레스 +15 · 다음 업무지시 100%" },
    ],
  },
};

// 시작 인벤토리 (슬롯 3칸 중 시작 2칸: 유형 기본 아이템 + 유튜브 쇼츠).
// 보상 1칸은 인게임 동료 이벤트로 채워짐.
export function startingInventory(type) {
  const def = PLAYER_TYPES[type] || PLAYER_TYPES.coffee;
  return [def.item, "shorts"];
}
