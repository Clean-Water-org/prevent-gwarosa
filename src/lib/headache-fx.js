const NOISE = ["□", "▒", "?", "_", "…", "░", "▓"];

export function headacheCorruptText(text, ratio = 0.08, seed = 0) {
  return Array.from(String(text)).map((ch, i) => {
    if (ch === " " || /[.,:[\]()]/.test(ch)) return ch;
    const wave = Math.sin((i + seed * 7) * 2.17) * 0.5 + 0.5;
    return wave < ratio ? NOISE[(i + seed) % NOISE.length] : ch;
  }).join("");
}

export function formatHeadacheDisplayText(text, { part = "body", seed = 0, enabled = true } = {}) {
  if (!enabled || !text) return text;
  const ratio = part === "title" || part === "subject" ? 0.09 : 0.07;
  return headacheCorruptText(text, ratio, seed);
}

function ensureHeadacheLayer(host, className) {
  let node = host.querySelector(`:scope > .${className}`);
  if (!node) {
    node = document.createElement(className.startsWith("headache-ghost") ? "div" : "span");
    node.className = className;
    node.setAttribute("aria-hidden", "true");
    host.append(node);
  }
  return node;
}

export function syncHeadacheTextLayers(host, { enabled = false, title = "", body = "" } = {}) {
  if (!host) return;
  host.classList.toggle("headache-text-host", enabled);
  if (!enabled) return;

  ensureHeadacheLayer(host, "headache-smear");
  const titleGhost = ensureHeadacheLayer(host, "headache-ghost-title");
  const bodyGhost = ensureHeadacheLayer(host, "headache-ghost-body");
  titleGhost.textContent = title;
  bodyGhost.textContent = body;
  titleGhost.style.display = title ? "" : "none";
  bodyGhost.style.display = body ? "" : "none";
}

export function isHeadacheActive(state) {
  return state.stats.health <= 30;
}
