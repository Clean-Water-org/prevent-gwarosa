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
        : renderLunchIntro(actions),
    ]),
  );
}

function renderLunchIntro(actions) {
  const narration = renderNarrationPopup(["12:00. 점심시간이다."], {
    typingSpeed: 42,
    lineDelay: 180,
    showPrompt: false,
    actions: [{
      text: "점심식사",
      onClick: () => actions.mutateState((draft) => {
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
      }),
    }],
  });

  return el("div", { class: "lunch-narration-layer" }, [narration.node]);
}

function renderLunchResult(state, actions) {
  const queue = state.flags?.lunchQueue?.length ? state.flags.lunchQueue : getLunchQueue(state);

  return el("div", { class: "lunch-result-overlay" }, [
    el("article", { class: "lunch-result-card" }, [
      el("h1", { text: "점심식사중.." }),
      el("div", { class: "lunch-result-events" }, queue.map((event) =>
        el("section", { class: "lunch-result-event" }, [
          el("h2", { text: event.title }),
          el("p", { text: event.text }),
          el("div", { class: "lunch-result-stats" }, describeDelta(event.delta).map((text) =>
            el("span", { text }),
          )),
        ]),
      )),
      el("div", { class: "actions" }, [
        el("button", {
          class: "primary",
          text: "오후 업무 시작",
          onClick: () => actions.mutateState((draft) => {
            draft.gameMinute = Math.max(draft.gameMinute, 13 * 60);
            draft.scene = "main";
            draft.flags = { ...draft.flags };
            delete draft.flags.lunchPhase;
            delete draft.flags.lunchQueue;
            delete draft.flags.lunchIndex;
            return draft;
          }),
        }),
      ]),
    ]),
  ]);
}

function getLunchQueue(state) {
  if (state.flags?.lunchQueue?.length) return state.flags.lunchQueue;

  const events = [pickOne(lunchEvents.base)];
  for (const interrupt of lunchEvents.interrupt) {
    if (Math.random() < interrupt.chance) events.push(interrupt);
  }
  return events;
}

function pickOne(events) {
  return events[Math.floor(Math.random() * events.length)];
}

function describeDelta(delta) {
  const labels = {
    stress: "스트레스",
    health: "체력",
    colleagueTrust: "동료 신뢰",
  };

  return Object.entries(delta)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${labels[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
}
