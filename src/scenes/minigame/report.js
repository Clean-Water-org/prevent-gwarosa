import { REPORTS, parseReportLine, TRAP_TOASTS, DIFFICULTY } from "../../data/report-typos.js";
import { el, renderHud } from "../../ui.js";

const PX = { ink: "#1d1f2e", red: "#ff4d4d", green: "#3fc24a", blue: "#3d8bff", yellow: "#ffd23f", white: "#fdfcf2" };

// ── 픽셀 소품 (meeting.js와 동일 비주얼) ──────────────────────────
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
  const steam1 = document.createElement("div");
  steam1.style.cssText = "position:absolute;left:7px;top:-7px;width:3px;height:8px;background:#cfd6e2";
  const steam2 = document.createElement("div");
  steam2.style.cssText = "position:absolute;left:16px;top:-9px;width:3px;height:10px;background:#cfd6e2";
  d.append(cup, handle, steam1, steam2);
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

// ── 게임 데이터 헬퍼 ──────────────────────────────────────────────
function diffOf(stress) {
  if (stress >= 80) return DIFFICULTY[2];
  if (stress >= 50) return DIFFICULTY[1];
  return DIFFICULTY[0];
}

// 보고서 → 라인별 세그먼트 (typo=정답, trap=오답). 세그먼트마다 key 부여
function buildReport(repIdx, lineCount) {
  const rep = REPORTS[repIdx];
  const lines = rep.lines.slice(0, lineCount).map((raw, li) => ({
    li,
    segs: parseReportLine(raw).map((s, si) => ({ ...s, key: li + "-" + si })),
  }));
  const typoKeys = [];
  lines.forEach((ln) => ln.segs.forEach((s) => { if (s.typo) typoKeys.push(s.key); }));
  return { title: rep.title, lines, typoKeys };
}

const TIERS = {
  success: { title: "오탈자 전부 발견!", emoji: "🎉", bg: "#eafae8", color: "#1f8a2e", deltas: [{ label: "업무량", v: -20 }] },
  partial: { title: "절반만 찾았다…", emoji: "😮‍💨", bg: "#fff3df", color: "#c98a2a", deltas: [{ label: "업무량", v: -10 }, { label: "스트레스", v: 8 }] },
  fail: { title: "결재 반려…", emoji: "💀", bg: "#f6e3e0", color: PX.red, deltas: [{ label: "업무량", v: -5 }, { label: "스트레스", v: 20 }, { label: "체력", v: -8 }] },
};

// 직전에 출제한 보고서를 기억해 매번 다른 주제가 나오도록 (연속 중복 회피)
let lastRepIdx = -1;
function pickReportIdx() {
  if (REPORTS.length <= 1) return 0;
  let ri;
  do { ri = Math.floor(Math.random() * REPORTS.length); } while (ri === lastRepIdx);
  lastRepIdx = ri;
  return ri;
}

// ══════════════════════════════════════════════════════════════════
export function renderReportGame(root, state, actions, game) {
  const stress = state.stats.stress;
  const diff = diffOf(stress);
  const repIdx = pickReportIdx();
  const report = buildReport(repIdx, diff.lines);
  const total = report.typoKeys.length;

  const run = {
    time: 60, found: [], wrong: 0, phase: "play", done: false, ending: false,
    flashKey: null, wrongKey: null,
    timerInterval: null, flashTimer: null, wrongTimer: null, floatTimer: null,
    toastTimer: null, warnTimer: null, endTimer: null,
  };

  // ── 오피스 배경 셸 ──
  const shell = document.createElement("section");
  shell.style.cssText = "position:fixed;inset:0;overflow:hidden;background:#caa46a;display:grid;grid-template-rows:auto 1fr";
  shell.append(renderHud(state));

  const room = document.createElement("div");
  room.style.cssText = "position:relative;overflow:hidden";
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

  const monitorScroll = document.createElement("div");
  monitorScroll.style.cssText = "position:absolute;inset:0;display:flex;align-items:safe center;justify-content:center;padding:18px 16px;overflow:auto";
  const monitorWrapper = document.createElement("div");
  monitorWrapper.style.cssText = "width:min(1000px, 96vw)";
  const gameContent = document.createElement("div");
  gameContent.style.cssText = "position:relative";

  // ── 에디터 크롬 (타이틀바 / 메뉴바) ──
  const titlebar = document.createElement("div");
  titlebar.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:#3a6ea5;border-bottom:3px solid ${PX.ink}`;
  const titleLeft = document.createElement("span");
  titleLeft.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#fff";
  titleLeft.textContent = "📝 1분기보고서_검토본.hwp — 흔글";
  const wbtns = document.createElement("div");
  wbtns.style.cssText = "display:flex;gap:4px";
  ["_", "▢", "✕"].forEach((c) => {
    const b = document.createElement("span");
    b.style.cssText = `width:18px;height:16px;background:#d8d2c0;border:2px solid ${PX.ink};font-family:Galmuri11,monospace;font-size:11px;display:flex;align-items:center;justify-content:center;color:${PX.ink}`;
    b.textContent = c;
    wbtns.append(b);
  });
  titlebar.append(titleLeft, wbtns);

  const menubar = document.createElement("div");
  menubar.style.cssText = `display:flex;align-items:center;gap:14px;padding:3px 12px;background:#ece6d6;border-bottom:3px solid ${PX.ink}`;
  ["파일", "편집", "보기", "입력", "검토"].forEach((m) => {
    const s = document.createElement("span");
    s.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#5a5440";
    s.textContent = m;
    menubar.append(s);
  });

  // ── HUD 스트립 (발견 / 오답 / 타이머) ──
  const hud = document.createElement("div");
  hud.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#ffe9a8;border-bottom:3px solid ${PX.ink}`;
  const hudTitle = document.createElement("span");
  hudTitle.style.cssText = "font-family:Galmuri14,monospace;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0";
  hudTitle.textContent = "📝 보고서 오탈자 찾기";
  const hudRight = document.createElement("div");
  hudRight.style.cssText = "display:flex;align-items:center;gap:8px;flex-shrink:0";

  const foundPill = document.createElement("span");
  foundPill.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;padding:3px 9px;border:2px solid var(--ink);background:#dff5e3;color:#1f7a44;white-space:nowrap";
  const wrongPill = document.createElement("span");
  wrongPill.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;padding:3px 9px;border:2px solid var(--ink);white-space:nowrap";

  const timerWrap = document.createElement("div");
  timerWrap.style.cssText = "position:relative;display:flex;align-items:center";
  const floatEl = document.createElement("span");
  floatEl.style.cssText = `position:absolute;right:100%;margin-right:8px;top:50%;transform:translateY(-50%);font-family:Galmuri14,monospace;font-size:22px;color:${PX.red};white-space:nowrap;text-shadow:1px 1px 0 #fff;pointer-events:none`;
  floatEl.hidden = true;
  const timerPill = document.createElement("div");
  timerPill.style.cssText = `display:flex;align-items:center;gap:7px;font-family:Galmuri9,monospace;border:2px solid ${PX.ink};background:#fff;color:${PX.ink};padding:3px 11px`;
  const timerIcon = document.createElement("span");
  timerIcon.style.fontSize = "15px";
  timerIcon.textContent = "⏱";
  const timerNum = document.createElement("span");
  timerNum.style.cssText = "font-size:20px;letter-spacing:1px";
  timerPill.append(timerIcon, timerNum);
  timerWrap.append(floatEl, timerPill);
  hudRight.append(foundPill, wrongPill, timerWrap);
  hud.append(hudTitle, hudRight);

  // ── 보고서 본문 영역 ──
  const board = document.createElement("div");
  board.style.cssText = "position:relative;background:#fbfaf4;padding:16px 26px;min-height:300px";
  if (diff.fx === "화면 흔들림") board.className = "fx-shake";

  const reportHolder = document.createElement("div");
  board.append(reportHolder);

  const hint = document.createElement("p");
  hint.style.cssText = "font-family:Galmuri11,monospace;font-size:11px;color:#9a948a;margin-top:10px;margin-bottom:0";
  hint.textContent = "의심 가는 단어를 클릭 · 오탈자=정답 / 정상 표기(함정)=오답(-3초)";
  board.append(hint);

  if (diff.fx === "화면 흔들림") {
    const shakeBadge = document.createElement("span");
    shakeBadge.style.cssText = `position:absolute;right:14px;top:10px;z-index:8;font-family:Galmuri11,monospace;font-size:11px;color:${PX.red};background:#fff;border:1.5px solid ${PX.red};padding:1px 8px`;
    shakeBadge.textContent = "⚠ 화면 흔들림";
    board.append(shakeBadge);
  }

  // 함정 토스트
  const trapToastEl = document.createElement("div");
  trapToastEl.style.cssText = "position:absolute;left:50%;top:26px;transform:translateX(-50%);z-index:9;font-family:Galmuri14,monospace;font-size:13px;color:#8a6d12;background:#fff7d6;border:2.5px solid #caa83a;padding:8px 16px;box-shadow:3px 4px 0 rgba(0,0,0,.18);white-space:nowrap;display:none";
  board.append(trapToastEl);

  // 오답 위험 경고
  const warnEl = document.createElement("div");
  warnEl.style.cssText = `position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);z-index:12;text-align:center;background:#fff;border:3px solid ${PX.red};padding:16px 26px;box-shadow:5px 6px 0 rgba(0,0,0,.25);display:none`;
  const warnTitle = document.createElement("div");
  warnTitle.style.cssText = `font-family:Galmuri14,monospace;font-size:18px;color:${PX.red}`;
  warnTitle.textContent = "⚠️ 오답이 너무 많습니다!";
  const warnSub = document.createElement("div");
  warnSub.style.cssText = "font-family:Galmuri11,monospace;font-size:13px;color:#b0341f;margin-top:5px";
  warnSub.textContent = "한 번 더 틀리면 실패합니다";
  warnEl.append(warnTitle, warnSub);
  board.append(warnEl);

  // 결과 오버레이
  const resultOverlay = document.createElement("div");
  resultOverlay.style.cssText = "position:absolute;inset:0;background:rgba(20,24,40,.5);display:none;align-items:center;justify-content:center;z-index:20";
  board.append(resultOverlay);

  gameContent.append(titlebar, menubar, hud, board);
  monitorWrapper.append(makeMonitor(gameContent));

  // 난이도 칩
  const diffChip = document.createElement("div");
  diffChip.style.cssText = "display:flex;justify-content:center;margin-top:10px";
  const diffChipInner = document.createElement("span");
  diffChipInner.style.cssText = `font-family:Galmuri11,monospace;font-size:12px;color:${PX.ink};background:${PX.yellow};border:2px solid ${PX.ink};padding:3px 12px;box-shadow:2px 2px 0 ${PX.ink}`;
  diffChipInner.textContent = `${diff.label} · ${diff.lines}줄 · 오답 허용 ${diff.wrongMax}회`;
  diffChip.append(diffChipInner);
  monitorWrapper.append(diffChip);

  monitorScroll.append(monitorWrapper);
  room.append(monitorScroll);
  shell.append(room);

  // ── 렌더 헬퍼 ──────────────────────────────────────────────────
  function renderSeg(s) {
    if (s.plain != null) {
      const parts = s.plain.split(/(\s+)/);
      const nodes = [];
      parts.forEach((tok, i) => {
        if (tok === "") return;
        if (/^\s+$/.test(tok)) { nodes.push(document.createTextNode(tok)); return; }
        const wk = s.key + "-w" + i;
        nodes.push(el("span", {
          class: "mg3p-word" + (run.wrongKey === wk ? " wrongflash" : ""),
          text: tok,
          onClick: () => clickWrong(wk, false),
        }));
      });
      return nodes;
    }
    if (s.typo) {
      if (run.found.includes(s.key)) {
        return [el("span", { class: "mg3p-fixed" + (run.flashKey === s.key ? " flash" : "") }, [
          el("span", { class: "mg3p-old", text: s.wrong }),
          el("span", { class: "mg3p-new", text: s.correct + " ✓" }),
        ])];
      }
      return [el("span", {
        class: "mg3p-word" + (run.wrongKey === s.key ? " wrongflash" : ""),
        text: s.wrong,
        onClick: () => clickTypo(s.key),
      })];
    }
    // trap
    return [el("span", {
      class: "mg3p-word" + (run.wrongKey === s.key ? " wrongflash" : ""),
      text: s.word,
      onClick: () => clickWrong(s.key, true),
    })];
  }

  function buildReportNode() {
    const rep = el("div", { class: "mg3p-report" });
    rep.append(el("p", { class: "mg3p-title", text: "제목. " + report.title }));
    report.lines.forEach((ln) => {
      const p = el("p", { class: "mg3p-line" });
      ln.segs.forEach((s) => renderSeg(s).forEach((n) => p.append(n)));
      rep.append(p);
    });
    return rep;
  }
  function updateBody() { reportHolder.replaceChildren(buildReportNode()); }

  function updateFoundPill() { foundPill.textContent = `발견 ${run.found.length}/${total}`; }
  function updateWrongPill() {
    const near = run.wrong >= diff.wrongMax - 1;
    wrongPill.textContent = `오답 ${run.wrong}/${diff.wrongMax}`;
    wrongPill.style.background = near ? "#ffd9d4" : "#fff3c4";
    wrongPill.style.color = near ? "#c0392b" : "#8a6d12";
  }
  function updateTimer() {
    timerNum.textContent = "0:" + String(Math.max(0, run.time)).padStart(2, "0");
    const danger = run.time <= 10 && run.phase === "play";
    timerPill.style.background = danger ? PX.red : "#fff";
    timerPill.style.color = danger ? "#fff" : PX.ink;
    timerPill.className = danger ? "px-timer danger" : "px-timer";
  }
  function showFloat(text) {
    floatEl.textContent = text;
    floatEl.hidden = false;
    floatEl.className = "banner-in";
    clearTimeout(run.floatTimer);
    run.floatTimer = setTimeout(() => { floatEl.hidden = true; }, 1200);
  }
  function showToast(msg) {
    trapToastEl.textContent = msg;
    trapToastEl.style.display = "block";
    clearTimeout(run.toastTimer);
    run.toastTimer = setTimeout(() => { trapToastEl.style.display = "none"; }, 1500);
  }
  function showWarn() {
    warnEl.style.display = "block";
    clearTimeout(run.warnTimer);
    run.warnTimer = setTimeout(() => { warnEl.style.display = "none"; }, 2000);
  }

  // ── 인터랙션 ──────────────────────────────────────────────────
  function clickTypo(key) {
    if (run.phase !== "play" || run.ending || run.found.includes(key)) return;
    run.found.push(key);
    run.flashKey = key;
    updateBody();
    updateFoundPill();
    clearTimeout(run.flashTimer);
    run.flashTimer = setTimeout(() => { run.flashKey = null; updateBody(); }, 600);
    checkAutoSuccess();
  }

  function clickWrong(key, isTrap) {
    if (run.phase !== "play" || run.ending) return;
    run.wrongKey = key;
    updateBody();
    clearTimeout(run.wrongTimer);
    run.wrongTimer = setTimeout(() => { run.wrongKey = null; updateBody(); }, 500);

    run.time = Math.max(0, run.time - 3);
    updateTimer();
    showFloat("-3초");

    showToast(isTrap ? TRAP_TOASTS[Math.floor(Math.random() * TRAP_TOASTS.length)] : "❌ 오탈자가 아니에요");

    run.wrong += 1;
    updateWrongPill();
    if (run.wrong >= diff.wrongMax) {
      run.ending = true;
      run.endTimer = setTimeout(() => finish("fail"), 900);
    } else if (run.wrong === diff.wrongMax - 1) {
      showWarn();
    }
  }

  function checkAutoSuccess() {
    if (run.phase !== "play" || run.ending) return;
    if (run.found.length >= total && total > 0) {
      run.ending = true;
      run.endTimer = setTimeout(() => finish("success"), 600);
    }
  }

  // ── 타이머 ──
  function startTimer() {
    run.timerInterval = setInterval(() => {
      if (run.done || run.phase !== "play") return;
      run.time = Math.max(0, run.time - 1);
      updateTimer();
      if (run.time <= 0) { clearInterval(run.timerInterval); finish(); }
    }, 1000);
  }

  // ── 종료 ──
  function finish(forceTier) {
    if (run.done) return;
    run.done = true;
    run.phase = "result";
    clearInterval(run.timerInterval);
    const fc = run.found.length;
    let tier = forceTier;
    if (!tier) {
      if (fc >= total) tier = "success";
      else if (fc >= Math.ceil(total / 2)) tier = "partial";
      else tier = "fail";
    }
    showResult(tier, fc, run.wrong, 60 - run.time);
  }

  function showResult(tier, found, wrong, usedSec) {
    const t = TIERS[tier];
    const panel = document.createElement("div");
    panel.className = "pop-in";
    panel.style.cssText = `width:440px;max-width:84%;background:${t.bg};border:4px solid ${PX.ink};box-shadow:6px 6px 0 rgba(29,31,46,.35);padding:20px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px`;

    const emojiEl = document.createElement("div");
    emojiEl.style.cssText = "font-size:46px;line-height:1";
    emojiEl.textContent = t.emoji;
    const titleEl = document.createElement("div");
    titleEl.style.cssText = `font-family:Galmuri14,monospace;font-size:22px;color:${t.color}`;
    titleEl.textContent = t.title;

    const statsRow = document.createElement("div");
    statsRow.style.cssText = "display:flex;gap:8px";
    [["발견", `${found}/${total}`], ["오답", `${wrong}`], ["소요", `${usedSec}초`]].forEach(([lbl, v]) => {
      const s = document.createElement("span");
      s.style.cssText = `font-family:Galmuri11,monospace;font-size:12.5px;background:#fff;border:2px solid ${PX.ink};padding:3px 11px`;
      s.textContent = `${lbl} ${v}`;
      statsRow.append(s);
    });

    const deltaRow = document.createElement("div");
    deltaRow.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:center";
    t.deltas.forEach((d) => {
      const s = document.createElement("span");
      s.style.cssText = `font-family:Galmuri11,monospace;font-size:13px;border:2px solid ${PX.ink};padding:4px 12px;background:${d.v < 0 ? "#d7f3d4" : "#ffdcd4"};color:${d.v < 0 ? "#1f8a2e" : "#c0392b"}`;
      s.textContent = `${d.label} ${d.v < 0 ? "▼" : "▲"}${Math.abs(d.v)}`;
      deltaRow.append(s);
    });

    const note = document.createElement("span");
    note.style.cssText = "font-family:Galmuri11,monospace;font-size:11px;color:#8a8478";
    note.textContent = "미니게임이 끝나면 항상 메인 화면으로";

    const nextBtn = document.createElement("div");
    nextBtn.style.cssText = "margin-top:2px;cursor:pointer";
    const btnInner = document.createElement("div");
    btnInner.style.cssText = `background:${PX.yellow};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:10px 22px;font-family:Galmuri14,monospace;font-size:19px;color:${PX.ink};display:inline-flex;align-items:center;gap:8px`;
    btnInner.textContent = "메인 화면으로 ▶";
    btnInner.addEventListener("click", () => { cleanup(); actions.applyResult(tier, `보고서 오탈자 ${tier}: 발견 ${found}/${total}`); });
    nextBtn.append(btnInner);

    panel.append(emojiEl, titleEl, statsRow, deltaRow, note, nextBtn);
    resultOverlay.replaceChildren(panel);
    resultOverlay.style.display = "flex";
  }

  function cleanup() {
    clearInterval(run.timerInterval);
    [run.flashTimer, run.wrongTimer, run.floatTimer, run.toastTimer, run.warnTimer, run.endTimer].forEach(clearTimeout);
  }

  // ── 초기화 ──
  root.append(shell);
  updateBody();
  updateFoundPill();
  updateWrongPill();
  updateTimer();
  startTimer();
}
