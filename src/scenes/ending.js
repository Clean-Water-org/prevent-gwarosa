import { createInitialState, formatTime } from "../state.js";
import { resolveEnding, STAT_BARS } from "../data/endings.js";

const PX = { ink: "#1d1f2e", red: "#ff4d4d", green: "#3fc24a", blue: "#3d8bff", yellow: "#ffd23f", white: "#fdfcf2" };
const STAT_COLOR = { ink: PX.ink, marker: PX.red, blue: PX.blue };

// ── 픽셀 소품 (설정·미니게임과 동일) ──────────────────────────────
function makePixWindow() {
  const d = document.createElement("div");
  d.style.cssText = `width:150px;height:104px;border:3px solid ${PX.ink};background:#7ec8ff;box-shadow:4px 4px 0 ${PX.ink};position:relative;image-rendering:pixelated`;
  const grad = document.createElement("div");
  grad.style.cssText = "position:absolute;inset:0;background:linear-gradient(135deg,#aee0ff 0 40%,#7ec8ff 40%)";
  const vline = document.createElement("div");
  vline.style.cssText = `position:absolute;left:50%;top:0;bottom:0;width:3px;background:${PX.ink};transform:translateX(-1px)`;
  const hline = document.createElement("div");
  hline.style.cssText = `position:absolute;top:50%;left:0;right:0;height:3px;background:${PX.ink};transform:translateY(-1px)`;
  const sun = document.createElement("div");
  sun.style.cssText = `position:absolute;right:10px;top:8px;width:16px;height:16px;border-radius:50%;background:#fff3a8;border:2px solid ${PX.ink}`;
  d.append(grad, vline, hline, sun);
  return d;
}
function makePixClock() {
  const d = document.createElement("div");
  d.style.cssText = `width:56px;height:56px;border-radius:50%;border:3px solid ${PX.ink};background:${PX.white};box-shadow:3px 3px 0 ${PX.ink};position:relative`;
  const h = document.createElement("span");
  h.style.cssText = `position:absolute;left:50%;top:50%;width:3px;height:16px;background:${PX.ink};transform:translate(-50%,-100%)`;
  const m = document.createElement("span");
  m.style.cssText = `position:absolute;left:50%;top:50%;width:12px;height:3px;background:${PX.ink};transform:translate(-2px,-50%)`;
  d.append(h, m);
  return d;
}
function makePixPlant() {
  const d = document.createElement("div");
  d.style.cssText = "position:relative;width:56px;height:70px";
  const stems = document.createElement("div");
  stems.style.cssText = "position:absolute;bottom:22px;left:50%;transform:translateX(-50%);display:flex;gap:2px";
  [[14, 40, "#3fc24a", "60% 0 60% 0", "-12deg"], [14, 48, "#5ad65f", "60% 60% 0 0", "0deg"], [14, 40, "#3fc24a", "0 60% 0 60%", "12deg"]].forEach(([w, h, bg, br, rot]) => {
    const leaf = document.createElement("span");
    leaf.style.cssText = `width:${w}px;height:${h}px;background:${bg};border:2px solid ${PX.ink};border-radius:${br};transform:rotate(${rot})`;
    stems.append(leaf);
  });
  const pot = document.createElement("div");
  pot.style.cssText = `position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:38px;height:26px;background:#e0703a;border:3px solid ${PX.ink};border-radius:0 0 6px 6px;box-shadow:3px 3px 0 ${PX.ink}`;
  d.append(stems, pot);
  return d;
}
function makePixMug() {
  const d = document.createElement("div");
  d.style.cssText = "position:relative;width:38px;height:32px";
  const cup = document.createElement("div");
  cup.style.cssText = `width:30px;height:30px;background:#ff6f59;border:3px solid ${PX.ink};border-radius:3px 3px 7px 7px;box-shadow:3px 3px 0 ${PX.ink}`;
  const handle = document.createElement("div");
  handle.style.cssText = `position:absolute;right:-8px;top:6px;width:12px;height:14px;border:3px solid ${PX.ink};border-left:none;border-radius:0 8px 8px 0`;
  d.append(cup, handle);
  return d;
}
function makeMonitor(content) {
  const bezel = document.createElement("div");
  bezel.style.cssText = `width:100%;background:linear-gradient(#efe7d2,#ddd2b6);border:4px solid ${PX.ink};border-radius:14px;box-shadow:7px 8px 0 rgba(29,31,46,.35);padding:16px 16px 26px;position:relative;image-rendering:pixelated`;
  const screen = document.createElement("div");
  screen.style.cssText = `border:4px solid ${PX.ink};border-radius:8px;overflow:hidden;background:#dfe7f2;position:relative`;
  screen.append(content);
  const scanline = document.createElement("div");
  scanline.className = "px-scanline";
  const glare = document.createElement("div");
  glare.className = "px-glare";
  screen.append(scanline, glare);
  bezel.append(screen);
  const label = document.createElement("div");
  label.style.cssText = "position:absolute;bottom:7px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:10px";
  const brand = document.createElement("span");
  brand.style.cssText = "font-family:Galmuri11,monospace;font-size:11px;color:#9a8f72;letter-spacing:2px";
  brand.textContent = "CHADOL-TRON";
  const led = document.createElement("span");
  led.style.cssText = `width:9px;height:9px;border-radius:50%;background:${PX.green};border:2px solid ${PX.ink}`;
  label.append(brand, led);
  bezel.append(label);
  const stand1 = document.createElement("div");
  stand1.style.cssText = `width:120px;height:16px;background:${PX.ink};margin:0 auto`;
  const stand2 = document.createElement("div");
  stand2.style.cssText = `width:200px;height:12px;background:${PX.ink};border-radius:0 0 6px 6px;box-shadow:4px 4px 0 rgba(29,31,46,.25);margin:0 auto`;
  const wrapper = document.createElement("div");
  wrapper.append(bezel, stand1, stand2);
  return wrapper;
}

// ── 엔딩 부품 ─────────────────────────────────────────────────────
// card.key → 실제 일러스트 파일명 (assets/endings/). 여성은 _f 변형, 과로사(death)는 공통.
const ILLO_FILE = {
  "clear-s": "ending_clear_s",
  "clear-a": "ending_clear_a",
  "clear-b": "ending_clear_b",
  overtime: "ending_overtime",
  quit: "ending_quit",
  overwork: "ending_death",
};

// 일러스트 영역: 엔딩·성별에 맞는 SVG 로드, 없으면 설명 placeholder 표시
function makeIllo(card, gender) {
  const wrap = document.createElement("div");
  wrap.style.cssText = `position:relative;width:100%;aspect-ratio:16/9;border:3px solid ${PX.ink};background:#eef1f6;overflow:hidden;box-shadow:4px 4px 0 ${PX.ink}`;
  const ph = document.createElement("div");
  ph.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;text-align:center";
  const phTag = document.createElement("span");
  phTag.style.cssText = "font-family:Galmuri14,monospace;font-size:13px;color:#9aa0ac";
  phTag.textContent = "[일러스트]";
  const phDesc = document.createElement("span");
  phDesc.style.cssText = "font-family:Galmuri11,monospace;font-size:13px;color:#6b7280;line-height:1.6";
  phDesc.textContent = card.illo;
  ph.append(phTag, phDesc);
  wrap.append(ph);

  const img = document.createElement("img");
  img.alt = card.title;
  img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;display:none";
  img.addEventListener("load", () => { img.style.display = "block"; });
  img.addEventListener("error", () => { img.remove(); }); // 에셋 없으면 placeholder 유지
  const base = ILLO_FILE[card.key] ?? card.key;
  const suffix = (gender === "female" && card.key !== "overwork") ? "_f" : "";
  img.src = `assets/endings/${base}${suffix}.svg`;
  wrap.append(img);
  return wrap;
}

function makeStatBar(label, dir, color, value) {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;flex-direction:column;gap:4px";
  const head = document.createElement("div");
  head.style.cssText = "display:flex;align-items:baseline;gap:6px";
  const lbl = document.createElement("span");
  lbl.style.cssText = "font-family:Galmuri11,monospace;font-size:13px;color:var(--ink)";
  lbl.textContent = label;
  const dirEl = document.createElement("span");
  dirEl.style.cssText = `font-family:Galmuri9,monospace;font-size:11px;color:${color}`;
  dirEl.textContent = dir;
  const valEl = document.createElement("strong");
  valEl.style.cssText = "margin-left:auto;font-family:Galmuri9,monospace;font-size:14px;color:var(--ink)";
  valEl.textContent = String(value);
  head.append(lbl, dirEl, valEl);
  const track = document.createElement("div");
  track.style.cssText = `height:11px;border:2px solid ${PX.ink};background:#fff;overflow:hidden`;
  const fill = document.createElement("div");
  fill.style.cssText = `height:100%;width:${Math.max(0, Math.min(100, value))}%;background:${color}`;
  track.append(fill);
  row.append(head, track);
  return row;
}

// ══════════════════════════════════════════════════════════════════
export function renderEnding(root, state, actions) {
  const card = resolveEnding(state);
  const clockText = formatTime(state.gameMinute);
  const badgeLabel = card.key === "overtime" ? `${card.badgeLabel} ${state.stats.workload}` : card.badgeLabel;

  // ── 오피스 배경 셸 ──
  const shell = document.createElement("section");
  shell.style.cssText = "position:fixed;inset:0;overflow:hidden;background:#caa46a";

  const room = document.createElement("div");
  room.style.cssText = "position:absolute;inset:0;overflow:hidden";
  [["top:0;left:0;right:0;height:76%", "linear-gradient(#f3e2c0,#e9d3a8)"],
   ["top:76%;left:0;right:0;height:6px", "rgba(29,31,46,.25)"],
   ["bottom:0;left:0;right:0;height:24%", "linear-gradient(#b97a3e,#9c5f2c)"],
   ["bottom:24%;left:0;right:0;height:5px", "rgba(29,31,46,.4)"],
  ].forEach(([pos, bg]) => {
    const layer = document.createElement("div");
    layer.style.cssText = `position:absolute;${pos};background:${bg}`;
    room.append(layer);
  });
  [[makePixWindow, "position:absolute;left:34px;top:26px"],
   [makePixClock, "position:absolute;right:52px;top:30px"],
   [makePixPlant, "position:absolute;right:36px;bottom:14px"],
   [makePixMug, "position:absolute;left:56px;bottom:20px"],
  ].forEach(([fn, css]) => {
    const p = fn();
    p.style.cssText = (p.style.cssText ? p.style.cssText + ";" : "") + css;
    room.append(p);
  });

  const scroll = document.createElement("div");
  scroll.style.cssText = "position:absolute;inset:0;display:flex;align-items:safe center;justify-content:center;padding:18px 16px;overflow:auto";
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "width:min(1000px, 96vw)";

  // ── 엔딩 내용 (모니터 화면) ──
  const screen = document.createElement("div");
  screen.className = "pop-in";
  screen.style.cssText = "position:relative;background:#fbfaf4;padding:18px 22px";

  // 상단 태그
  const tag = document.createElement("div");
  tag.style.cssText = `display:inline-flex;align-items:center;gap:8px;font-family:Galmuri11,monospace;font-size:12.5px;color:var(--ink);background:${card.accent};border:2px solid ${PX.ink};padding:3px 12px;box-shadow:2px 2px 0 ${PX.ink};margin-bottom:14px`;
  tag.textContent = `${card.emoji} 오늘의 퇴근 기록`;

  const cols = document.createElement("div");
  cols.style.cssText = "display:flex;gap:24px;align-items:stretch";

  // 좌: 일러스트 + 이모지 + 제목 + 문구
  const left = document.createElement("div");
  left.style.cssText = "flex:1.1;min-width:0;display:flex;flex-direction:column;gap:13px";
  left.append(makeIllo(card, state.player?.gender));
  const titleRow = document.createElement("div");
  titleRow.style.cssText = "display:flex;align-items:center;gap:12px";
  const emoji = document.createElement("span");
  emoji.style.cssText = "font-size:46px;line-height:1";
  emoji.textContent = card.emoji;
  const title = document.createElement("h1");
  title.style.cssText = `margin:0;font-family:Galmuri14,monospace;font-size:30px;color:${PX.ink}`;
  title.textContent = card.title;
  titleRow.append(emoji, title);
  const linesBox = document.createElement("div");
  linesBox.style.cssText = `background:#fff;border:2px solid ${PX.ink};padding:11px 15px;display:flex;flex-direction:column;gap:6px`;
  card.lines.forEach((l) => {
    const s = document.createElement("span");
    s.style.cssText = "font-family:Galmuri11,monospace;font-size:14px;color:var(--ink);line-height:1.4";
    s.textContent = l;
    linesBox.append(s);
  });
  left.append(titleRow, linesBox);

  // 우: 결과 패널
  const right = document.createElement("div");
  right.style.cssText = "width:340px;flex:0 0 auto;display:flex;flex-direction:column;gap:14px;justify-content:center";

  // 퇴근시각·등급 박스
  const clockBox = document.createElement("div");
  clockBox.style.cssText = `background:${card.accent};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:14px 18px;text-align:center;display:flex;flex-direction:column;gap:5px`;
  const clockLbl = document.createElement("span");
  clockLbl.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#4a4636";
  clockLbl.textContent = card.clockLabel;
  const clockBig = document.createElement("div");
  clockBig.style.cssText = "font-family:Galmuri14,monospace;font-size:42px;line-height:1.1;color:var(--ink)";
  clockBig.textContent = clockText;
  const badgeRow = document.createElement("div");
  badgeRow.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;margin-top:2px";
  const badge = document.createElement("span");
  badge.style.cssText = `font-family:Galmuri14,monospace;font-size:18px;color:#fff;background:${PX.ink};border:2px solid ${PX.ink};padding:1px 10px`;
  badge.textContent = card.badge;
  const badgeLbl = document.createElement("span");
  badgeLbl.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#4a4636";
  badgeLbl.textContent = badgeLabel;
  badgeRow.append(badge, badgeLbl);
  clockBox.append(clockLbl, clockBig, badgeRow);

  // 최종 스탯 요약
  const statBox = document.createElement("div");
  statBox.style.cssText = `background:#fff;border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:14px 18px;display:flex;flex-direction:column;gap:11px`;
  const statTitle = document.createElement("span");
  statTitle.style.cssText = "font-family:Galmuri14,monospace;font-size:14px;color:var(--ink)";
  statTitle.textContent = "최종 스탯 요약";
  statBox.append(statTitle);
  STAT_BARS.forEach((s) => {
    statBox.append(makeStatBar(s.label, s.dir, STAT_COLOR[s.color] || PX.ink, state.stats[s.statKey]));
  });

  // 다시하기 버튼
  const retryBtn = document.createElement("div");
  retryBtn.style.cssText = "cursor:pointer;align-self:stretch";
  const retryInner = document.createElement("div");
  retryInner.style.cssText = `background:${PX.yellow};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:11px 22px;font-family:Galmuri14,monospace;font-size:18px;color:${PX.ink};display:flex;align-items:center;justify-content:center;gap:8px`;
  retryInner.textContent = "🔄 다시하기";
  retryBtn.append(retryInner);
  retryBtn.addEventListener("click", () => actions.mutateState(() => createInitialState()));

  right.append(clockBox, statBox, retryBtn);

  cols.append(left, right);
  screen.append(tag, cols);
  wrapper.append(makeMonitor(screen));
  scroll.append(wrapper);
  room.append(scroll);
  shell.append(room);
  root.append(shell);
}
