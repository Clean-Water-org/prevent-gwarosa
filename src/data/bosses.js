export const BOSS_TYPE_GUIDE = {
  intro: "상사마다 성향이 다릅니다.",
  types: [
    {
      id: "smart-busy",
      label: "꼼꼼 · 바쁨",
      tip: "지시 많음 · 거절 어려움 → 답장 빠르게",
    },
    {
      id: "smart-lazy",
      label: "똑똑 · 여유",
      tip: "거절 쉬움 · 책임 넘김 조심 → 선 긋기",
    },
    {
      id: "clumsy-busy",
      label: "열정 · 바쁨",
      tip: "지시·방향 자주 바뀜 → 우선순위 정리",
    },
    {
      id: "clumsy-lazy",
      label: "자유 · 여유",
      tip: "압박 적음 · 지시 애매 → 여유 미리 확보",
    },
  ],
  footer: "오늘 힌트와 맞춰 거절·답장 전략을 바꿔보세요.",
};

export const bosses = [
  {
    id: "smart-busy",
    name: "똑부",
    publicHint: "꼼꼼하고 성과 지향적인 팀장님",
    trait: "업무 지시가 잦지만 성과를 인정한다.",
    weights: { order: 40, watch: 30, help: 20, praise: 50, shame: 50 },
    speechNote: "간결·직접적. 마침표 강조. 성과 압박.",
  },
  {
    id: "smart-lazy",
    name: "똑게",
    publicHint: "워라밸을 중시하지만 사고에는 민감한 팀장님",
    trait: "거절은 잘 통하지만 책임 전가가 무섭다.",
    weights: { order: 10, watch: 5, help: 0, praise: 10, shame: 5 },
    speechNote: "부드럽지만 논리적. 선택지를 주는 척 선긋기.",
  },
  {
    id: "clumsy-busy",
    name: "멍부",
    publicHint: "열정적이지만 방향이 자주 바뀌는 팀장님",
    trait: "업무 지시가 많고 방향도 엉뚱하다.",
    weights: { order: 40, watch: 40, help: 30, praise: 10, shame: 30 },
    speechNote: "열정적·느낌표 남발. 두리뭉실한 지시.",
  },
  {
    id: "clumsy-lazy",
    name: "멍게",
    publicHint: "자유로운 분위기를 선호하는 팀장님",
    trait: "패널티는 적지만 행동이 예측 불가하다.",
    weights: { order: 20, watch: 10, help: 10, praise: 5, shame: 10 },
    speechNote: "무심·줄임표. 애매한 지시. 책임 소재 불명.",
  },
];
