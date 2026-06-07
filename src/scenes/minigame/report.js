import { REPORTS, parseReportLine, TRAP_TOASTS, DIFFICULTY, BOSS_RED_PEN } from "../../data/report-typos.js";
import { el, renderHud } from "../../ui.js";
import { makeBossSilhouette } from "../../components/boss-silhouette.js";
import { playBgm, stopBgm } from "../../lib/audio.js";

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
  success: { title: "오탈자 전부 발견!", emoji: "🎉", bg: "#eafae8", color: "#1f8a2e", deltas: [{ label: "업무량", v: -25 }] },
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
  let total = report.typoKeys.length; // addPage 이벤트로 증가할 수 있음

  const run = {
    time: 60, found: [], wrong: 0, phase: "play", done: false, ending: false,
    elapsed: 0,
    flashKey: null, wrongKey: null,
    penActive: false, penKey: null, firedPen: false,
    spellKeys: [], usedEvents: {},
    timerInterval: null, flashTimer: null, wrongTimer: null, floatTimer: null,
    toastTimer: null, warnTimer: null, endTimer: null, penHoldTimer: null, penOutTimer: null,
    evToastTimer: null, spellTimer: null, saveTimer: null, flickTimer: null,
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

  monitorScroll.append(monitorWrapper);
  room.append(monitorScroll);
  shell.append(room);

  // ── 상사 빨간펜 연출 오버레이 (고정) ──
  // 화면 전체 어두운 오버레이
  const darkOverlayEl = document.createElement("div");
  darkOverlayEl.style.cssText = "position:fixed;inset:0;z-index:43;pointer-events:none;background:rgba(0,0,0,.15);opacity:0;transition:opacity .45s";
  // 실루엣 뒤 빨간 비네팅
  const vignetteEl = document.createElement("div");
  vignetteEl.style.cssText = "position:fixed;inset:0;z-index:44;pointer-events:none;opacity:0;transition:opacity .45s;background:radial-gradient(ellipse 80% 80% at 80% 40%, rgba(200,40,40,0) 45%, rgba(170,30,30,.28) 80%, rgba(120,20,20,.42) 100%);mix-blend-mode:multiply";
  // 상사 실루엣 (우측 상단에서 등장)
  const bossOverlayEl = makeBossSilhouette({ direction: "right-top" });
  bossOverlayEl.hidden = true;
  // 빨간펜 말풍선
  const penSpeechEl = document.createElement("div");
  penSpeechEl.style.cssText = `position:fixed;top:16%;right:20%;z-index:47;font-family:Galmuri14,monospace;font-size:16px;color:${PX.red};background:#fff;border:2.5px solid ${PX.red};border-radius:14px 14px 14px 2px;padding:9px 16px;box-shadow:4px 4px 0 rgba(0,0,0,.22);white-space:nowrap;display:none`;
  penSpeechEl.textContent = "여기 좀 이상한데? 🖋️";

  // 중간 이벤트 토스트 — 모니터 화면(board) 안 상단에 표시
  const evToastEl = document.createElement("div");
  evToastEl.style.cssText = `position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:18;font-family:Galmuri14,monospace;font-size:13.5px;padding:8px 16px;border:3px solid ${PX.red};background:#ffe3e0;color:#b0341f;box-shadow:3px 4px 0 rgba(0,0,0,.22);white-space:nowrap;display:none`;
  board.append(evToastEl);

  // 중간 이벤트용 풀스크린 오버레이
  const flickerEl = document.createElement("div");
  flickerEl.style.cssText = "position:fixed;inset:0;z-index:49;pointer-events:none;background:#fff;opacity:0";
  const kakaoEl = document.createElement("div");
  kakaoEl.hidden = true;
  shell.append(darkOverlayEl, vignetteEl, bossOverlayEl, penSpeechEl, flickerEl, kakaoEl);

  // 본문 영역 내부의 '저장 중...' 인디케이터
  const savingEl = document.createElement("div");
  savingEl.style.cssText = "position:absolute;left:20px;top:12px;z-index:8;font-family:Galmuri11,monospace;font-size:12px;color:#777;background:#eef0f3;border:2px solid #c5c9cf;padding:3px 11px;display:none";
  savingEl.textContent = "💾 저장 중...";
  board.append(savingEl);

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
          class: "mg3p-word" + (run.wrongKey === wk ? " wrongflash" : "") + (run.penKey === wk ? " pen" : "") + (run.spellKeys.includes(wk) ? " spell" : ""),
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
        class: "mg3p-word" + (run.wrongKey === s.key ? " wrongflash" : "") + (run.penKey === s.key ? " pen" : ""),
        text: s.wrong,
        onClick: () => clickTypo(s.key),
      })];
    }
    // trap
    return [el("span", {
      class: "mg3p-word" + (run.wrongKey === s.key ? " wrongflash" : "") + (run.penKey === s.key ? " pen" : "") + (run.spellKeys.includes(s.key) ? " spell" : ""),
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

  // ── 상사 빨간펜 코멘트 ──────────────────────────────────────────
  const bossRatio = BOSS_RED_PEN[state.boss && state.boss.id] || BOSS_RED_PEN["smart-busy"];

  // 진실성 비율에 따라 real|half|fake|none 가중 추첨
  function pickPenKind() {
    const roll = Math.random() * 100;
    let acc = 0;
    for (const k of ["real", "half", "fake", "none"]) {
      acc += bossRatio[k] || 0;
      if (roll < acc) return k;
    }
    return "none";
  }

  // 줄 li에서 동그라미 칠 단어 키 하나 선택 (오탈자 세그먼트는 제외)
  function pickWordKeyOnLine(li) {
    const ln = report.lines.find((l) => l.li === li);
    if (!ln) return null;
    for (const s of ln.segs) {
      if (s.plain != null) {
        const parts = s.plain.split(/(\s+)/);
        for (let i = 0; i < parts.length; i++) {
          // 줄번호("1.")·기호("—") 등은 건너뛰고, 실제 글자가 있는 단어만 동그라미 대상으로
          if (parts[i] && /[가-힣A-Za-z]/.test(parts[i])) return s.key + "-w" + i;
        }
      } else if (s.trap) {
        return s.key;
      }
      // typo 세그먼트는 건너뜀
    }
    return null;
  }

  // kind별 동그라미 대상 키 결정
  function resolvePenTarget(kind) {
    const typoLines = new Set(report.typoKeys.map((k) => +k.split("-")[0]));
    if (kind === "real") {
      const unfound = report.typoKeys.filter((k) => !run.found.includes(k));
      return unfound.length ? unfound[Math.floor(Math.random() * unfound.length)] : null;
    }
    if (kind === "half") {
      // 오탈자가 있는 줄의 '다른 단어'
      const lines = [...typoLines];
      for (const li of lines.sort(() => Math.random() - 0.5)) {
        const wk = pickWordKeyOnLine(li);
        if (wk) return wk;
      }
      return null;
    }
    // fake: 오탈자가 없는 줄의 단어
    const noTypoLines = report.lines.map((l) => l.li).filter((li) => !typoLines.has(li));
    for (const li of noTypoLines.sort(() => Math.random() - 0.5)) {
      const wk = pickWordKeyOnLine(li);
      if (wk) return wk;
    }
    return null;
  }

  // 상사 빨간펜 발동 (forceKind 지정 시 강제). 실제 발동 시 true 반환
  function firePen(forceKind) {
    if (run.phase !== "play" || run.penActive || run.ending) return false;
    const kind = forceKind || pickPenKind();
    if (kind === "none") return false; // 똑게 등: 코멘트 안 함
    const target = resolvePenTarget(kind);
    if (!target) return false;

    run.penActive = true;
    run.penKey = target;
    updateBody();

    // 등장: 어두운 오버레이 + 빨간 비네팅 + 실루엣 슬라이드인 + 말풍선
    darkOverlayEl.style.opacity = "1";
    vignetteEl.style.opacity = "1";
    bossOverlayEl.hidden = false;
    bossOverlayEl.classList.remove("boss-leave");
    bossOverlayEl.classList.add("boss-enter");
    penSpeechEl.style.display = "block";
    penSpeechEl.classList.remove("boss-leave");
    penSpeechEl.classList.add("boss-enter");

    // 3초 유지 후 페이드아웃(0.5초)
    clearTimeout(run.penHoldTimer);
    run.penHoldTimer = setTimeout(() => {
      darkOverlayEl.style.opacity = "0";
      vignetteEl.style.opacity = "0";
      bossOverlayEl.classList.remove("boss-enter");
      bossOverlayEl.classList.add("boss-leave");
      penSpeechEl.classList.remove("boss-enter");
      penSpeechEl.classList.add("boss-leave");
      clearTimeout(run.penOutTimer);
      run.penOutTimer = setTimeout(() => {
        bossOverlayEl.hidden = true;
        bossOverlayEl.classList.remove("boss-leave");
        penSpeechEl.style.display = "none";
        penSpeechEl.classList.remove("boss-leave");
        run.penKey = null;
        run.penActive = false;
        if (run.phase === "play") updateBody();
      }, 500);
    }, 3000);
    return true;
  }

  // ── 중간 이벤트 (6종) ──────────────────────────────────────────
  const ALL_EVENTS = ["wrongFix", "spell", "addPage", "saveFail", "kakao", "flicker"];

  function pickNextEvent() {
    let pool = ALL_EVENTS.filter((t) => !run.usedEvents[t]);
    if (pool.length === 0) { run.usedEvents = {}; pool = ALL_EVENTS.slice(); }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    run.usedEvents[pick] = true;
    return pick;
  }

  function showEvToast(msg) {
    evToastEl.textContent = msg;
    evToastEl.style.display = "block";
    evToastEl.className = "banner-in";
    clearTimeout(run.evToastTimer);
    run.evToastTimer = setTimeout(() => { evToastEl.style.display = "none"; }, 3000);
  }

  function parseLineToObj(raw, li) {
    return { li, segs: parseReportLine(raw).map((s, si) => ({ ...s, key: li + "-" + si })) };
  }

  // 발견한 오탈자 1개를 미발견 상태로 되돌림
  function loseOneFound() {
    if (run.found.length) { run.found.pop(); updateBody(); updateFoundPill(); }
  }

  function fireMidEvent(type) {
    if (run.phase !== "play" || run.ending) return;
    if (type === "wrongFix") {
      loseOneFound();
      showEvToast("🤦 동료가 수정해줬어요... 근데 또 틀렸네요?");
    } else if (type === "spell") {
      const trapKeys = [];
      report.lines.forEach((ln) => ln.segs.forEach((s) => { if (s.trap) trapKeys.push(s.key); }));
      run.spellKeys = trapKeys.slice(0, 3);
      updateBody();
      clearTimeout(run.spellTimer);
      run.spellTimer = setTimeout(() => { run.spellKeys = []; if (run.phase === "play") updateBody(); }, 5000);
      showEvToast("🔄 맞춤법 검사기 오작동 중...");
    } else if (type === "addPage") {
      const baseLi = report.lines.length;
      const extra = [
        parseLineToObj("＋ 부록 — 세부 항목은 별도 «첩부|첨부|kr» 자료로 갈음한다.", baseLi),
        parseLineToObj("＋ 보완 — 추가 사항은 다음 회의에서 다룬다.", baseLi + 1),
      ];
      report.lines.push(...extra);
      extra.forEach((ln) => ln.segs.forEach((s) => { if (s.typo) report.typoKeys.push(s.key); }));
      total = report.typoKeys.length;
      updateBody();
      updateFoundPill();
      showEvToast("📄 팀장님: 이 내용도 추가해주세요");
    } else if (type === "saveFail") {
      savingEl.style.display = "block";
      clearTimeout(run.saveTimer);
      run.saveTimer = setTimeout(() => {
        savingEl.style.display = "none";
        loseOneFound();
        showEvToast("💾 저장 실패! 일부 수정사항이 사라졌어요");
      }, 1800);
    } else if (type === "kakao") {
      showKakao();
    } else if (type === "flicker") {
      flickerEl.style.animation = "mg3pFlick 1s steps(1)";
      clearTimeout(run.flickTimer);
      run.flickTimer = setTimeout(() => { flickerEl.style.animation = ""; }, 1000);
      showEvToast("방금 모니터가 깜빡인 것 같은데....");
    }
  }

  function showKakao() {
    kakaoEl.replaceChildren();
    const win = document.createElement("div");
    win.style.cssText = `position:fixed;z-index:48;top:50%;left:50%;transform:translate(-50%,-50%);width:340px;border:3px solid ${PX.ink};box-shadow:6px 6px 0 rgba(0,0,0,.35)`;
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;align-items:center;justify-content:space-between;background:#fee500;padding:7px 12px;border-bottom:3px solid ${PX.ink}`;
    const barTitle = document.createElement("span");
    barTitle.style.cssText = "font-family:Galmuri14,monospace;font-size:13px;color:#3a2e00";
    barTitle.textContent = "💬 까까오톡 PC";
    const closeBtn = document.createElement("span");
    closeBtn.style.cssText = `font-family:Galmuri14,monospace;font-size:13px;color:#3a2e00;border:2px solid ${PX.ink};background:#fff7b0;padding:0 6px;cursor:pointer`;
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => { kakaoEl.replaceChildren(); kakaoEl.hidden = true; });
    bar.append(barTitle, closeBtn);
    const body = document.createElement("div");
    body.style.cssText = "background:#b2c7d9;padding:10px 12px;display:flex;flex-direction:column;gap:8px";
    [["오늘 점심 약속 잊지마! 🍱"], ["이번 주말 약속 시간 어때?"]].forEach(([msg]) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:7px;align-items:flex-start";
      const av = document.createElement("span");
      av.style.cssText = `width:30px;height:30px;border:2px solid ${PX.ink};background:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto`;
      av.textContent = "🙂";
      const col = document.createElement("div");
      col.style.cssText = "display:flex;flex-direction:column;gap:2px";
      const who = document.createElement("span");
      who.style.cssText = "font-family:Galmuri11,monospace;font-size:11px;color:#2a3a47";
      who.textContent = "옆자리 동료";
      const bubble = document.createElement("span");
      bubble.style.cssText = `font-family:Galmuri11,monospace;font-size:13px;background:#fff;border:2px solid ${PX.ink};padding:5px 10px`;
      bubble.textContent = msg;
      col.append(who, bubble);
      row.append(av, col);
      body.append(row);
    });
    win.append(bar, body);
    kakaoEl.append(win);
    kakaoEl.hidden = false;
  }

  // ── 타이머 ──
  function startTimer() {
    run.timerInterval = setInterval(() => {
      if (run.done || run.phase !== "play") return;
      run.time = Math.max(0, run.time - 1);
      run.elapsed += 1; // 실제 경과 초 (run.time 조작과 무관 — 10초 주기 보장)
      updateTimer();
      // 10초마다: 첫 발동은 상사 빨간펜 시도(코멘트 안 하면 대신 중간 이벤트), 이후는 중간 이벤트
      if (run.elapsed % 10 === 0 && !run.ending) {
        let bossFired = false;
        if (!run.firedPen) { run.firedPen = true; bossFired = firePen(); }
        if (!bossFired) fireMidEvent(pickNextEvent());
      }
      if (run.time <= 0) { clearInterval(run.timerInterval); finish(); }
    }, 1000);
  }

  // ── 종료 ──
  function finish(forceTier) {
    if (run.done) return;
    run.done = true;
    run.phase = "result";
    stopBgm();
    clearInterval(run.timerInterval);
    // 결과 팝업이 가려지지 않도록 진행 중이던 이벤트 UI 전부 정리 (까까오 PC창·상사 펜·토스트·깜빡임)
    kakaoEl.replaceChildren(); kakaoEl.hidden = true;
    penSpeechEl.style.display = "none";
    darkOverlayEl.style.opacity = "0";
    vignetteEl.style.opacity = "0";
    bossOverlayEl.hidden = true;
    flickerEl.style.animation = "";
    evToastEl.style.display = "none";
    run.penActive = false;
    [run.penHoldTimer, run.flickTimer, run.evToastTimer, run.toastTimer].forEach(clearTimeout);
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

    const nextBtn = document.createElement("div");
    nextBtn.style.cssText = "margin-top:2px;cursor:pointer";
    const btnInner = document.createElement("div");
    btnInner.style.cssText = `background:${PX.yellow};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:10px 22px;font-family:Galmuri14,monospace;font-size:19px;color:${PX.ink};display:inline-flex;align-items:center;gap:8px`;
    btnInner.textContent = "메인 화면으로 ▶";
    btnInner.addEventListener("click", () => { cleanup(); actions.applyResult(tier, `보고서 오탈자 ${tier}: 발견 ${found}/${total}`, usedSec); });
    nextBtn.append(btnInner);

    panel.append(emojiEl, titleEl, statsRow, deltaRow, nextBtn);
    resultOverlay.replaceChildren(panel);
    resultOverlay.style.display = "flex";
  }

  function cleanup() {
    stopBgm();
    clearInterval(run.timerInterval);
    [run.flashTimer, run.wrongTimer, run.floatTimer, run.toastTimer, run.warnTimer, run.endTimer, run.penHoldTimer, run.penOutTimer,
     run.evToastTimer, run.spellTimer, run.saveTimer, run.flickTimer].forEach(clearTimeout);
  }

  // ── 초기화 ──
  root.append(shell);
  updateBody();
  updateFoundPill();
  updateWrongPill();
  updateTimer();
  playBgm("assets/audio/report_bgm.mp3");
  startTimer();
}
