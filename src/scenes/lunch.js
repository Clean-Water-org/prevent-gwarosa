import { lunchEvents } from "../data/events.js";
import { applyDelta } from "../state.js";
import { el, renderHud } from "../ui.js";

export function renderLunch(root, state, actions) {
  const event = lunchEvents[Math.floor(Math.random() * lunchEvents.length)];
  root.append(
    el("section", { class: "game-board" }, [
      renderHud(state),
      el("article", { class: "document" }, [
        el("h1", { text: "12:00 점심시간" }),
        el("h2", { text: event.title }),
        el("p", { text: event.text }),
        el("div", { class: "actions" }, [
          el("button", {
            class: "primary",
            text: "오후 업무 시작",
            onClick: () => actions.mutateState((draft) => {
              const next = applyDelta(draft, { ...event.delta, gameMinute: 60 }, `점심시간: ${event.title}`);
              next.scene = "main";
              return next;
            }),
          }),
        ]),
      ]),
      el("footer", { class: "item-row" }, [el("span", { text: "밥 먹는 시간에도 업무 카톡은 올 수 있습니다." })]),
    ]),
  );
}
