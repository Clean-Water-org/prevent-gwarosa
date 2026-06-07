import { lunchEvents } from "../data/events.js";
import { applyDelta } from "../state.js";
import { el, renderHud, renderNarrationPopup } from "../ui.js";

export function renderLunch(root, state, actions) {
  const phase = state.flags?.lunchPhase ?? "intro";

  root.append(
    el("section", { class: "game-board lunch-scene" }, [
      renderHud(state),
      phase === "result"
        ? renderLunchResult(state, actions)
        : renderLunchIntro(state, actions),
    ]),
  );
}

export function renderLunchIntro(state, actions) {
  const narration = renderNarrationPopup(["12:00. 점심시간이다."], {
    typingSpeed: 42,
    lineDelay: 180,
    showPrompt: false,
    actions: [{
      text: "점심식사",
      onClick: () => actions.mutateState((draft) => applyLunchMeal(draft)),
    }],
  });

  return el("div", { class: "lunch-narration-layer" }, [narration.node]);
}

export function renderLunchResult(state, actions, options = {}) {
  const queue = state.flags?.lunchQueue?.length ? state.flags.lunchQueue : getLunchQueue(state);
  const onAfternoonStart = options.onAfternoonStart ?? (() => {
    actions.mutateState((draft) => {
      draft.scene = "main";
      draft.flags = { ...draft.flags, lunchCutscenePending: true };
      delete draft.flags.lunchPhase;
      delete draft.flags.lunchQueue;
      delete draft.flags.lunchIndex;
      return draft;
    });
  });

  return el("div", { class: "lunch-result-overlay" }, [
    el("article", { class: "lunch-result-card" }, [
      el("h1", { text: "점심식사중.." }),
      el("div", { class: "lunch-result-events" }, queue.map((event) =>
        el("section", { class: "lunch-result-event" }, [
          el("h2", { text: event.title }),
          el("p", { text: event.text }),
          el("div", { class: "lunch-result-stats" }, describeLunchDelta(event.delta).map((text) =>
            el("span", { text }),
          )),
        ]),
      )),
      el("div", { class: "actions" }, [
        el("button", {
          class: "primary",
          type: "button",
          text: "오후 업무 시작",
          onClick: onAfternoonStart,
        }),
      ]),
    ]),
  ]);
}

export function applyLunchMeal(draft) {
  const queue = getLunchQueue(draft);
  let next = draft;
  for (const event of queue) {
    next = applyDelta(next, event.delta, `점심시간: ${event.title}`);
  }
  next.flags = {
    ...next.flags,
    lunchPhase: "result",
    lunchQueue: queue,
  };
  return next;
}

export function getLunchQueue(state) {
  if (state.flags?.lunchQueue?.length) return state.flags.lunchQueue;

  const events = [pickWeightedBaseEvent(state)];
  for (const interrupt of lunchEvents.interrupt) {
    if (Math.random() < getWorkChatChance(state)) events.push(interrupt);
  }
  return events;
}

function pickWeightedBaseEvent(state) {
  const weighted = lunchEvents.base.map((event) => ({
    event,
    weight: getBaseEventWeight(event, state),
  }));
  return pickWeighted(weighted);
}

function getBaseEventWeight(event, state) {
  const trust = state.colleagueTrust ?? 30;
  const bossId = state.boss?.id ?? "";
  const bossAttention = state.counters?.bossAttention ?? 0;

  switch (event.title) {
    case "혼밥": {
      let weight = 28;
      if (trust < 38) weight += 8;
      if (bossId !== "smart-busy" && bossId !== "clumsy-busy") weight += 6;
      if (bossAttention < 2) weight += 4;
      return weight;
    }
    case "동료 점심": {
      let weight = 12;
      if (trust >= 40) weight += (trust - 30) * 1.5;
      if (trust >= 50) weight += 12;
      if (trust >= 60) weight += 8;
      return weight;
    }
    case "상사 점심 합류": {
      let weight = 8;
      if (bossId === "smart-busy" || bossId === "clumsy-busy") {
        weight += 24;
        if (bossAttention >= 2) weight += bossAttention * 3;
        if (bossAttention >= 4) weight += 8;
      } else {
        weight += 3;
      }
      return weight;
    }
    case "점심 메뉴 갈등": {
      let weight = 16;
      if (trust >= 35 && trust < 55) weight += 6;
      return weight;
    }
    default:
      return 10;
  }
}

function getWorkChatChance(state) {
  let chance = 0.18;
  const workload = state.stats?.workload ?? 50;
  const bossAttention = state.counters?.bossAttention ?? 0;
  const results = state.counters?.minigameResults ?? [];
  const poorResults = results.filter((entry) => entry.result !== "success").length;
  const flags = state.flags ?? {};

  if (workload >= 75) chance += 0.22;
  else if (workload >= 55) chance += 0.14;
  else if (workload >= 40) chance += 0.06;

  if (poorResults >= 2) chance += 0.16;
  else if (poorResults >= 1) chance += 0.10;

  if (bossAttention >= 4) chance += 0.18;
  else if (bossAttention >= 2) chance += 0.12;

  if (flags.forcedBossOrder || flags.nextBossOrderBoost || flags.forcedMeeting) {
    chance += 0.08;
  }

  return Math.min(0.82, Math.max(0.08, chance));
}

function pickWeighted(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.event;
  }
  return entries[entries.length - 1].event;
}

export function describeLunchDelta(delta) {
  const labels = {
    stress: "스트레스",
    health: "체력",
    colleagueTrust: "동료 신뢰",
  };

  return Object.entries(delta)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
}
