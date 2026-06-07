import { el } from "../ui.js";
import { applyWorkTimeCost, addLogEntry, checkEnding, formatTime } from "../state.js";

export const HEADACHE_TIME_COST_MINUTES = 45;

export function isHeadacheEventPending(state) {
  return state.stats.health <= 30 && !state.flags?.statusEvents?.headache;
}

export function applyHeadacheEventToDraft(draft) {
  if (!draft.flags.statusEvents) draft.flags.statusEvents = {};
  draft.flags.statusEvents.headache = true;
  const timeCost = applyWorkTimeCost(draft, HEADACHE_TIME_COST_MINUTES);
  addLogEntry(draft, {
    cause: "두통이 와서 잠시 쉬었다. 시간이 크게 흘렀다.",
    delta: { gameMinute: HEADACHE_TIME_COST_MINUTES, ...timeCost.delta },
    icon: "🔴",
  });
  return checkEnding(draft);
}

export function animateHeadacheClockJump(clockEl, beforeMinute, afterMinute) {
  if (!clockEl) return;

  const beforeText = formatTime(beforeMinute);
  const afterText = formatTime(afterMinute);
  clockEl.textContent = beforeText;

  const host = clockEl.closest(".clock, .main-work-hud-time, .hud")
    ?? clockEl.parentElement
    ?? clockEl;
  if (host && getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }

  const float = el("span", {
    class: "headache-clock-float",
    text: `-${HEADACHE_TIME_COST_MINUTES}분`,
  });
  host.append(float);

  requestAnimationFrame(() => {
    clockEl.textContent = afterText;
    clockEl.classList.add("headache-clock-jump");
  });

  float.addEventListener("animationend", () => float.remove(), { once: true });
  clockEl.addEventListener("animationend", () => {
    clockEl.classList.remove("headache-clock-jump");
  }, { once: true });
}

export function mountHeadacheDialog(container, { onConfirm, gameMinute, clockEl } = {}) {
  const beforeMinute = gameMinute;

  const overlay = el("div", { class: "headache-dialog-overlay", role: "dialog", "aria-modal": "true" }, [
    el("div", { class: "headache-dialog pop-in" }, [
      el("span", { class: "headache-dialog-icon", text: "🤕" }),
      el("p", { class: "headache-dialog-text", text: "너무 머리가 아파서 못하겠어..." }),
      el("p", { class: "headache-dialog-hint", text: `플레이 시간 ${HEADACHE_TIME_COST_MINUTES}분 경과` }),
      el("button", {
        class: "headache-dialog-ok",
        type: "button",
        text: "확인",
        onClick: () => {
          const result = onConfirm?.();
          if (clockEl && result?.afterMinute != null) {
            animateHeadacheClockJump(clockEl, beforeMinute, result.afterMinute);
          }
          overlay.remove();
        },
      }),
    ]),
  ]);

  container.append(overlay);
  return overlay;
}

export function maybeShowHeadacheDialog(container, state, actions, options = {}) {
  if (!isHeadacheEventPending(state)) return null;

  const { run, clockEl, getClockEl } = options;
  if (run) run.paused = true;

  const targetClock = clockEl ?? getClockEl?.() ?? container.querySelector(".hud .clock, .main-work-current-time");

  return mountHeadacheDialog(container, {
    gameMinute: state.gameMinute,
    clockEl: targetClock,
    onConfirm: () => {
      const beforeMinute = state.gameMinute;
      let pendingEnding = null;
      let afterMinute = beforeMinute + HEADACHE_TIME_COST_MINUTES;

      if (actions.patchGameState) {
        const next = actions.patchGameState((draft) => {
          pendingEnding = applyHeadacheEventToDraft(draft);
          return draft;
        });
        afterMinute = next.gameMinute;
      } else {
        actions.mutateState((draft) => {
          pendingEnding = applyHeadacheEventToDraft(draft);
          afterMinute = draft.gameMinute;
          return draft;
        });
      }

      if (pendingEnding) {
        actions.finishWith(pendingEnding);
        return { afterMinute };
      }

      if (run) run.paused = false;
      options.onResume?.();
      return { afterMinute };
    },
  });
}
