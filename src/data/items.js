export const items = {
  coffee: {
    label: "커피",
    icon: "☕",
    effect: "체력 +15",
    use(state) {
      state.stats.health = Math.min(100, state.stats.health + 15);
      state.counters.coffeeStreak += 1;
      state.log.unshift("커피를 마셨습니다. 체력이 조금 회복됩니다.");
      if (state.counters.coffeeStreak >= 2) {
        state.log.unshift("손이 미세하게 떨립니다. 다음 미니게임이 불안정해집니다.");
      }
      return state;
    },
  },
  smoke: {
    label: "담배",
    icon: "🚬",
    effect: "스트레스 -12, 체력 -3",
    use(state) {
      state.stats.stress = Math.max(0, state.stats.stress - 12);
      state.stats.health = Math.max(0, state.stats.health - 3);
      state.counters.smokeUses += 1;
      state.counters.coffeeStreak = 0;
      state.log.unshift("잠깐 바람을 쐬었습니다. 스트레스가 내려갑니다.");
      if (Math.random() < 0.3) state.flags.nextBossOrderBoost = true;
      return state;
    },
  },
  ginseng: {
    label: "홍삼스틱",
    icon: "🧴",
    effect: "체력 +25",
    use(state) {
      state.stats.health = Math.min(100, state.stats.health + 25);
      state.counters.coffeeStreak = 0;
      state.log.unshift("홍삼스틱을 먹었습니다. 몸이 조금 돌아옵니다.");
      return state;
    },
  },
  shorts: {
    label: "쇼츠",
    icon: "📱",
    effect: "스트레스 -10",
    use(state) {
      state.stats.stress = Math.max(0, state.stats.stress - 10);
      state.flags.nextBossOrderBoost = true;
      state.counters.coffeeStreak = 0;
      state.log.unshift("짧은 영상을 봤습니다. 마음은 풀렸지만 찜찜합니다.");
      return state;
    },
  },
};
