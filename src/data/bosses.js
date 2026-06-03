export const bosses = [
  {
    id: "smart-busy",
    name: "똑부",
    publicHint: "꼼꼼하고 성과 지향적인 팀장님",
    trait: "업무 지시가 잦지만 성과를 인정한다.",
    weights: { order: 40, watch: 30, help: 20, praise: 50, shame: 50 },
  },
  {
    id: "smart-lazy",
    name: "똑게",
    publicHint: "워라밸을 중시하지만 사고에는 민감한 팀장님",
    trait: "거절은 잘 통하지만 책임 전가가 무섭다.",
    weights: { order: 10, watch: 5, help: 0, praise: 10, shame: 5 },
  },
  {
    id: "clumsy-busy",
    name: "멍부",
    publicHint: "열정적이지만 방향이 자주 바뀌는 팀장님",
    trait: "업무 지시가 많고 방향도 엉뚱하다.",
    weights: { order: 40, watch: 40, help: 30, praise: 10, shame: 30 },
  },
  {
    id: "clumsy-lazy",
    name: "멍게",
    publicHint: "자유로운 분위기를 선호하는 팀장님",
    trait: "패널티는 적지만 행동이 예측 불가하다.",
    weights: { order: 20, watch: 10, help: 10, praise: 5, shame: 10 },
  },
];
