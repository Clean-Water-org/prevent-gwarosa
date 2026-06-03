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
