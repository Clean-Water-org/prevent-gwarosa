import { addLogEntry } from "../state.js";

export const items = {
  coffee: {
    label: "커피",
    icon: "☕",
    effect: "체력 +15",
    use(state) {
      state.stats.health = Math.min(100, state.stats.health + 15);
      state.counters.coffeeStreak += 1;
      addLogEntry(state, {
        cause: "커피를 마셨다.",
        delta: { health: 15 },
      });
      if (state.counters.coffeeStreak >= 2) {
        addLogEntry(state, {
          icon: "🟡",
          cause: "커피를 연속으로 마셨다.",
          effects: ["다음 미니게임 손떨림"],
        });
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
      addLogEntry(state, {
        cause: "잠깐 바람을 쐬었다.",
        delta: { stress: -12, health: -3 },
      });
      if (state.counters.smokeUses >= 3) {
        state.flags.nextBossOrderBoost = true;
        addLogEntry(state, {
          icon: "🟡",
          cause: "상사가 뭔가 째려보는 것 같다... 기분 탓인가?",
          effects: ["갑작스러운 업무 지시 확률 증가"],
        });
      }
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
      addLogEntry(state, {
        cause: "홍삼스틱을 먹었다.",
        delta: { health: 25 },
      });
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
      addLogEntry(state, {
        cause: "짧은 영상을 봤다.",
        delta: { stress: -10 },
        effects: ["다음 메인화면 상사 이벤트 확률 증가"],
        icon: "🟡",
      });
      return state;
    },
  },
};
