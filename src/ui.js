import { formatTime } from "./state.js";
import { items } from "./data/items.js";

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

export function renderHud(state) {
  return el("header", { class: "hud" }, [
    el("div", { class: "clock", text: formatTime(state.gameMinute) }),
    statBar("업무량", state.stats.workload, ""),
    statBar("스트레스", state.stats.stress, "stress"),
    statBar("체력", state.stats.health, "health"),
  ]);
}

export function statBar(label, value, type) {
  return el("section", { class: "stat" }, [
    el("header", {}, [el("span", { text: label }), el("strong", { text: String(value) })]),
    el("div", { class: `bar ${type}` }, [el("span", { style: `width:${value}%` })]),
  ]);
}

export function renderItems(state, actions) {
  return el(
    "footer",
    { class: "item-row" },
    state.inventory.map((itemId, index) => {
      const item = items[itemId];
      return el("button", {
        text: `${item.icon} ${item.label} · ${item.effect}`,
        onClick: () => actions.useItem(index),
      });
    }),
  );
}

export function renderLog(state) {
  return el(
    "div",
    { class: "log" },
    state.log.map((line) => el("p", { text: line })),
  );
}

export function renderBadges(state) {
  const badges = [];
  if (state.stats.stress >= 70) badges.push("번아웃");
  if (state.stats.health <= 30) badges.push("두통");
  if (state.counters.coffeeStreak >= 2) badges.push("커피 과다복용");
  badges.push(`동료 신뢰 ${state.colleagueTrust}`);
  badges.push(`상사 힌트: ${state.boss.publicHint}`);
  return el("div", { class: "status-badges" }, badges.map((badge) => el("span", { class: "badge", text: badge })));
}

export function renderNarrationPopup(lines, options = {}) {
  const lineTexts = Array.isArray(lines) ? lines : [lines];
  const typingSpeed = options.typingSpeed ?? 34;
  const lineDelay = options.lineDelay ?? 320;
  const promptKey = options.promptKey ?? "Enter";
  const promptText = options.promptText ?? "다음";
  const extraClass = options.className ? ` ${options.className}` : "";
  const actions = Array.isArray(options.actions) ? options.actions : [];
  const timers = [];
  let stopped = false;
  let cursor = null;

  const lineList = el("div", { class: "narration-popup-lines" });
  const prompt = el("footer", { class: "narration-popup-prompt" }, [
    el("kbd", { text: promptKey }),
    el("span", { text: promptText }),
  ]);
  const node = el("aside", {
    class: `narration-popup${extraClass}`,
    role: "status",
    "aria-live": "polite",
  }, [lineList, prompt]);

  if (actions.length > 0) {
    node.append(el("div", { class: "narration-popup-actions" }, actions.map((action) =>
      el("button", {
        class: `narration-popup-action${action.className ? ` ${action.className}` : ""}`,
        type: "button",
        text: action.text,
        onClick: action.onClick,
      }),
    )));
  }

  if (options.showPrompt === false) prompt.hidden = true;

  function queue(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    timers.push(timer);
    return timer;
  }

  function clearTimers() {
    while (timers.length > 0) window.clearTimeout(timers.pop());
  }

  function moveCursorTo(line) {
    cursor?.remove();
    cursor = el("span", { class: "narration-popup-cursor", "aria-hidden": "true", text: " " });
    line.append(cursor);
  }

  function typeLine(index) {
    if (stopped || index >= lineTexts.length) {
      node.classList.add("typing-complete");
      options.onComplete?.();
      return;
    }

    const text = String(lineTexts[index] ?? "");
    const line = el("p", { class: "narration-popup-line" });
    const textNode = el("span", { class: "narration-popup-text" });
    line.append(textNode);
    lineList.append(line);
    moveCursorTo(line);

    let charIndex = 0;
    const tick = () => {
      if (stopped) return;
      textNode.textContent = text.slice(0, charIndex);
      if (charIndex < text.length) {
        charIndex += 1;
        queue(tick, typingSpeed);
        return;
      }

      queue(() => typeLine(index + 1), lineDelay);
    };

    tick();
  }

  function start() {
    stopped = false;
    clearTimers();
    lineList.textContent = "";
    node.classList.remove("typing-complete");
    queue(() => typeLine(0), options.startDelay ?? 0);
  }

  function finish() {
    stopped = true;
    clearTimers();
    lineList.textContent = "";
    for (const text of lineTexts) {
      lineList.append(el("p", { class: "narration-popup-line", text: String(text ?? "") }));
    }
    cursor?.remove();
    cursor = el("span", { class: "narration-popup-cursor", "aria-hidden": "true", text: " " });
    lineList.lastElementChild?.append(cursor);
    node.classList.add("typing-complete");
  }

  function stop() {
    stopped = true;
    clearTimers();
    cursor?.remove();
  }

  if (options.autoStart !== false) start();

  return { node, start, finish, stop };
}
