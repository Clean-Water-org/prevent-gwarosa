import { emailDeck } from "../../data/minigames.js";
import { renderStatHud } from "../../ui.js";
import { makeBossSilhouette } from "../../components/boss-silhouette.js";
import { buildBossKakaoMsgs } from "../../lib/boss-text.js";
import { playBgm, stopBgm, playSfx, playClickSfx, syncBgmStatusFx } from "../../lib/audio.js";
import { maybeShowHeadacheDialog } from "../../lib/headache-event.js";
import { syncHeadacheTextLayers } from "../../lib/headache-fx.js";
import { PX, makeOfficeRoom, appendDefaultRoomProps, makeMonitor } from "../../components/pixel-office.js";
import { MINI_TIER_LABEL } from "./flow.js";

const MAIL_START_Y = -16;
const CARD_FALL_SPEED = 0.42;
const DROP_ZONE_W = 168;
const STAGE_H = 440;

function shuffled(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function pickFrom(pool, count) {
  return shuffled(pool).slice(0, count);
}

function buildRoundDeck(stress = 0) {
  const byType = (type, difficulty) => emailDeck.filter((m) => m.type === type && m.difficulty === difficulty);
  const byTypeHard = (type) => emailDeck.filter((m) => m.type === type && ["hard", "evil"].includes(m.difficulty));

  const good = [
    ...pickFrom(byType("good", "easy"), 2),
    ...pickFrom(byType("good", "normal"), 2),
    ...pickFrom(byTypeHard("good"), 1),
  ];
  const spam = stress >= 80
    ? [
        ...pickFrom(byType("spam", "easy"), 2),
        ...pickFrom(byType("spam", "normal"), 1),
        ...pickFrom(byType("spam", "hard"), 1),
        ...pickFrom(byType("spam", "evil"), 1),
      ]
    : stress >= 50
      ? [
          ...pickFrom(byType("spam", "easy"), 3),
          ...pickFrom(byType("spam", "normal"), 1),
          ...pickFrom(byType("spam", "hard"), 1),
        ]
      : [
          ...pickFrom(byType("spam", "easy"), 4),
          ...pickFrom(byType("spam", "normal"), 1),
        ];
  return shuffled([...good, ...spam]);
}

// ── 본문 미리보기 요약 (제목 키워드 기반) ──────────────────────────
function makeBasicPreview(mail) {
  const s = mail.subject;
  if (mail.type === "spam") {
    if (s.includes("지원금") || s.includes("생활안정")) return "지급 대상자로 선정되었습니다. 미신청 시 자동 소멸됩니다.";
    if (s.includes("대출") && s.includes("승인")) return "한도 8,000만원. 지금 바로 입금 신청하세요.";
    if (s.includes("당첨") || s.includes("축하")) return "24시간 내 수령 신청하지 않으면 당첨이 취소됩니다.";
    if (s.includes("아이폰") || s.includes("에어팟") || s.includes("이벤트")) return "당첨! 본인 확인 후 수령지를 입력해주세요.";
    if (s.includes("투자") || s.includes("삼미전자")) return "직장인 한정 선착순. 최소 투자금 100만원.";
    if (s.includes("자동매매") || s.includes("부수입")) return "월 300만원 수익 사례. 무료 체험/상담 신청.";
    if (mail.attachment && /\.(zip|exe|xlsm)$/i.test(mail.attachment)) return "첨부 파일 실행 또는 보안 확인이 필요합니다.";
    if (mail.link && mail.link !== "없음") return "링크에서 로그인 또는 인증을 완료해주세요.";
    return "즉시 확인하지 않으면 제한될 수 있습니다.";
  }
  if (s.includes("법인카드")) return "정산 대상 여부를 확인해주세요.";
  if (s.includes("회의실")) return "예약 상태가 변경되었습니다.";
  if (s.includes("VPN")) return "인증 방식 확인이 필요합니다.";
  if (s.includes("연차")) return "사용 계획 등록이 필요합니다.";
  if (s.includes("견적서")) return "수정본 확인 부탁드립니다.";
  if (s.includes("보안교육")) return "교육 이수 상태를 확인해주세요.";
  if (s.includes("급한 건")) return "우선 확인 부탁드립니다.";
  if (s.includes("송금")) return "결제 건 확인 부탁드립니다.";
  if (s.includes("공지")) return "안내 사항을 확인해주세요.";
  return "관련 내용 확인 부탁드립니다.";
}

function corruptText(text, ratio, seed) {
  const noise = ["□", "▒", "?", "_", "…"];
  return Array.from(text).map((ch, i) => {
    if (ch === " " || /[.,:[\]()]/.test(ch)) return ch;
    const wave = Math.sin((i + seed * 7) * 2.17) * 0.5 + 0.5;
    return wave < ratio ? noise[(i + seed) % noise.length] : ch;
  }).join("");
}

// ── 분류함 ─────────────────────────────────────────────────────────
function makeDropZone(kind) {
  const isGood = kind === "good";
  const accent = isGood ? PX.green : PX.red;
  const bg = isGood ? "#e3f7e2" : "#ffe3e0";
  const wrap = document.createElement("div");
  wrap.style.cssText = `flex:0 0 ${DROP_ZONE_W}px;width:${DROP_ZONE_W}px;max-width:${DROP_ZONE_W}px;min-width:${DROP_ZONE_W}px;align-self:stretch;min-height:${STAGE_H}px;border:3px dashed ${accent};background:${bg};display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:14px 10px;box-sizing:border-box;overflow:hidden;cursor:pointer`;
  const header = document.createElement("div");
  header.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0";
  const icon = document.createElement("span");
  icon.style.fontSize = "30px";
  icon.textContent = isGood ? "📥" : "🗑️";
  const title = document.createElement("span");
  title.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:18px;color:${accent}`;
  title.textContent = isGood ? "중요" : "스팸";
  const key = document.createElement("span");
  key.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:11px;color:#8a8478";
  key.textContent = isGood ? "← / A" : "D / →";
  header.append(icon, title, key);
  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column-reverse;gap:4px;flex:1;min-height:0;min-width:0;width:100%;max-width:100%;overflow:hidden";
  const count = document.createElement("span");
  count.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:13px;color:#fff;background:${accent};border:2px solid ${PX.ink};padding:1px 9px;flex-shrink:0;align-self:center`;
  count.textContent = "0";
  wrap.append(header, list, count);
  return { wrap, list, count, accent, kind };
}

// ── 까까오톡 팝업 ──────────────────────────────────────────────────
function makeKakaoWin({ msgs, onClose }) {
  const win = document.createElement("div");
  win.style.cssText = `position:fixed;z-index:47;width:340px;max-width:calc(100vw - 32px);border:3px solid ${PX.ink};box-shadow:6px 6px 0 rgba(0,0,0,.35);top:50%;left:50%;transform:translate(-50%,-50%)`;
  const bar = document.createElement("div");
  bar.style.cssText = `display:flex;align-items:center;justify-content:space-between;background:#fee500;padding:7px 12px;border-bottom:3px solid ${PX.ink}`;
  const barTitle = document.createElement("span");
  barTitle.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:13px;color:#3a2e00;font-weight:700";
  barTitle.textContent = "💬 까까오톡 PC";
  const closeBtn = document.createElement("span");
  closeBtn.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:13px;color:#3a2e00;border:2px solid ${PX.ink};background:#fff7b0;padding:0 6px;cursor:pointer`;
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", onClose);
  bar.append(barTitle, closeBtn);
  const body = document.createElement("div");
  body.style.cssText = "background:#b2c7d9;padding:10px 12px;display:flex;flex-direction:column;gap:8px";
  msgs.forEach(([emo, name, text]) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:7px;align-items:flex-start";
    const avatar = document.createElement("span");
    avatar.style.cssText = `width:30px;height:30px;border:2px solid ${PX.ink};background:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;flex:0 0 auto`;
    avatar.textContent = emo;
    const msgBody = document.createElement("div");
    msgBody.style.cssText = "display:flex;flex-direction:column;gap:2px";
    const nameEl = document.createElement("span");
    nameEl.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:11px;color:#2a3a47";
    nameEl.textContent = name;
    const textEl = document.createElement("span");
    textEl.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:13px;background:#fff;border:2px solid ${PX.ink};padding:5px 10px`;
    textEl.textContent = text;
    msgBody.append(nameEl, textEl);
    row.append(avatar, msgBody);
    body.append(row);
  });
  win.append(bar, body);
  return win;
}

// ══════════════════════════════════════════════════════════════════
export function renderEmailGame(root, state, actions, game) {
  const ALL_EVENTS = ["boss", "kakao", "chat"];

  const stress = state.stats.stress;
  const isHeadache = state.stats.health <= 30;
  const isCoffee = state.counters.coffeeStreak >= 2;

  const run = {
    phase: "play", time: 60, done: false,
    deck: buildRoundDeck(stress), index: 0,
    correct: 0, wrong: 0, missed: 0,
    locked: false, detailOpen: false, cardY: MAIL_START_Y,
    sortedGood: [], sortedSpam: [],
    bossWatching: false, evJitter: false, paused: false,
    raf: null, timerInterval: null, elapsed: 0, usedEvents: {},
    floatTimer: null, feedbackTimer: null, evToastTimer: null, evTimer: null, bossTimer: null, kakaoTimer: null, classifyTimer: null,
  };

  // ── HUD 참조 ──
  let scorePill = null, timerPill = null, timerNum = null, floatEl = null;

  // ── 오피스 배경 + 소품 ──
  const shell = document.createElement("section");
  shell.style.cssText = "position:fixed;inset:0;overflow:hidden;background:#caa46a;display:grid;grid-template-rows:auto 1fr";
  shell.append(renderStatHud(state));

  const room = makeOfficeRoom();
  appendDefaultRoomProps(room);

  const monitorScroll = document.createElement("div");
  monitorScroll.style.cssText = "position:absolute;inset:0;display:flex;align-items:safe center;justify-content:center;padding:18px 16px;overflow:auto";

  const monitorWrapper = document.createElement("div");
  monitorWrapper.style.cssText = "width:min(1180px, 96vw)";

  const gameContent = document.createElement("div");
  gameContent.style.cssText = "position:relative";

  const fxWrap = document.createElement("div");
  fxWrap.style.cssText = "position:relative";

  // 타이틀바
  const titlebar = document.createElement("div");
  titlebar.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:#3a6ea5;border-bottom:3px solid ${PX.ink}`;
  const titleLeft = document.createElement("span");
  titleLeft.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:12.5px;color:#fff";
  titleLeft.textContent = "📧 받은편지함_정리_확인요망.eml — 아웃클룩";
  const wbtns = document.createElement("div");
  wbtns.style.cssText = "display:flex;gap:4px";
  ["_", "▢", "✕"].forEach((c) => {
    const b = document.createElement("span");
    b.style.cssText = `width:18px;height:16px;background:#d8d2c0;border:2px solid ${PX.ink};font-family:NeoDunggeunmo,monospace;font-size:11px;display:flex;align-items:center;justify-content:center;color:${PX.ink}`;
    b.textContent = c;
    wbtns.append(b);
  });
  titlebar.append(titleLeft, wbtns);

  // 메뉴바
  const menubar = document.createElement("div");
  menubar.style.cssText = `display:flex;align-items:center;gap:14px;padding:3px 12px;background:#ece6d6;border-bottom:3px solid ${PX.ink}`;
  ["파일", "편집", "보기", "메일", "도구"].forEach((m) => {
    const s = document.createElement("span");
    s.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:12px;color:#5a5440";
    s.textContent = m;
    menubar.append(s);
  });

  // HUD 스트립
  const hud = document.createElement("div");
  hud.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#ffe9a8;border-bottom:3px solid ${PX.ink}`;
  const topicLabel = document.createElement("span");
  topicLabel.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0";
  topicLabel.textContent = "📧 이메일 분류 — 받은편지함";
  const hudRight = document.createElement("div");
  hudRight.style.cssText = "display:flex;align-items:center;gap:10px;flex-shrink:0";

  scorePill = document.createElement("span");
  scorePill.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:12px;padding:3px 9px;border:2px solid ${PX.ink};background:#fff3c4;color:#8a6d12;white-space:nowrap`;

  const timerWrap = document.createElement("div");
  timerWrap.style.cssText = "position:relative;display:flex;align-items:center";
  floatEl = document.createElement("span");
  floatEl.style.cssText = `position:absolute;right:100%;margin-right:8px;top:50%;transform:translateY(-50%);font-family:NeoDunggeunmo,monospace;font-size:22px;color:${PX.red};white-space:nowrap;text-shadow:1px 1px 0 #fff;pointer-events:none`;
  floatEl.hidden = true;
  timerPill = document.createElement("div");
  timerPill.style.cssText = `display:flex;align-items:center;gap:7px;font-family:NeoDunggeunmo,monospace;border:2px solid ${PX.ink};background:#fff;color:${PX.ink};padding:3px 11px`;
  const timerIcon = document.createElement("span");
  timerIcon.style.fontSize = "15px";
  timerIcon.textContent = "⏱";
  timerNum = document.createElement("span");
  timerNum.style.cssText = "font-size:20px;letter-spacing:1px";
  timerNum.textContent = "0:60";
  timerPill.append(timerIcon, timerNum);
  timerWrap.append(floatEl, timerPill);

  hudRight.append(scorePill, timerWrap);
  hud.append(topicLabel, hudRight);

  // 보드 영역
  const board = document.createElement("div");
  board.style.cssText = "position:relative;background:#e8eef7;padding:14px 18px 16px";

  const hintEl = document.createElement("div");
  hintEl.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:12px;color:#5a6478;margin-bottom:8px;display:flex;gap:4px;flex-wrap:wrap";
  ["← / A 분류: 중요  ·", "SPACE 상세 확인 (-2초)", "· D / → 분류: 스팸"].forEach((txt, i) => {
    const s = document.createElement("span");
    if (i === 1) s.style.cssText = "font-weight:700;color:#3a6ea5";
    s.textContent = txt;
    hintEl.append(s);
  });

  const statusRow = document.createElement("div");
  statusRow.style.cssText = "display:none;align-items:center;gap:8px;margin-bottom:8px;font-family:NeoDunggeunmo,monospace;font-size:12px;color:#8a6d12;background:#fff3c4;border:2px solid #d8c27a;padding:5px 11px";
  const statusIcon = document.createElement("span");
  statusIcon.style.fontSize = "15px";
  const statusCap = document.createElement("span");
  statusRow.append(statusIcon, statusCap);

  const gameRow = document.createElement("div");
  gameRow.style.cssText = "display:flex;gap:14px;align-items:stretch";

  const goodZone = makeDropZone("good");
  const spamZone = makeDropZone("spam");
  goodZone.wrap.addEventListener("click", () => classify("good"));
  spamZone.wrap.addEventListener("click", () => classify("spam"));

  const stage = document.createElement("div");
  stage.style.cssText = `position:relative;flex:1;min-width:0;height:${STAGE_H}px;background:#fbfaf5;border:3px solid ${PX.ink};overflow:hidden;box-sizing:border-box`;

  const mailSlot = document.createElement("div");
  mailSlot.className = "mg-mail-slot";
  mailSlot.style.cssText = "position:absolute;left:50%;transform:translateX(-50%);width:420px;max-width:calc(100% - 36px)";

  const mailCard = document.createElement("article");
  mailCard.className = "mg-mail-card";
  mailCard.style.cssText = `width:100%;border:3px solid ${PX.ink};background:#fff;box-shadow:4px 4px 0 ${PX.ink};padding:15px 18px;cursor:pointer;box-sizing:border-box;transition:width .15s,box-shadow .15s`;
  mailCard.addEventListener("click", () => toggleDetail());

  const feedbackEl = document.createElement("span");
  feedbackEl.style.cssText = "position:absolute;left:50%;top:46%;transform:translateX(-50%);z-index:5;font-family:NeoDunggeunmo,monospace;font-size:22px;text-shadow:2px 2px 0 #fff;display:none;pointer-events:none";

  mailSlot.append(mailCard);
  stage.append(mailSlot, feedbackEl);
  gameRow.append(goodZone.wrap, stage, spamZone.wrap);

  const resultOverlay = document.createElement("div");
  resultOverlay.style.cssText = "position:absolute;inset:0;background:rgba(20,24,40,.5);display:none;align-items:center;justify-content:center;z-index:20";

  board.append(hintEl, statusRow, gameRow, resultOverlay);

  fxWrap.append(titlebar, menubar, hud, board);
  gameContent.append(fxWrap);

  monitorWrapper.append(makeMonitor(gameContent));
  monitorScroll.append(monitorWrapper);
  room.append(monitorScroll);

  // 고정 오버레이들
  const bossOverlayEl = makeBossSilhouette({ direction: "right" });
  bossOverlayEl.hidden = true;

  const bossBannerEl = document.createElement("div");
  bossBannerEl.style.cssText = "position:fixed;left:0;right:0;top:15%;z-index:45;display:none;justify-content:center;pointer-events:none";
  bossBannerEl.className = "banner-in";

  const kakaoEl = document.createElement("div");
  kakaoEl.hidden = true;

  const evToastEl = document.createElement("div");
  evToastEl.style.cssText = `position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:48;font-family:NeoDunggeunmo,monospace;font-size:14px;padding:10px 20px;border:3px solid ${PX.red};background:#ffe3e0;color:#b0341f;box-shadow:4px 4px 0 rgba(0,0,0,.22);white-space:nowrap;display:none`;
  evToastEl.className = "banner-in";

  shell.append(room, bossOverlayEl, bossBannerEl, kakaoEl, evToastEl);
  root.append(shell);

  // ── 헬퍼 ──────────────────────────────────────────────────────
  function refreshFxClass() {
    const c = [];
    if (stress >= 70) c.push("fx-gray");
    if (isHeadache) c.push("fx-shake");
    if (isCoffee || run.evJitter) c.push("fx-jitter");
    fxWrap.className = c.join(" ");
  }

  function activeStatus() {
    if (isHeadache) return "headache";
    if (stress >= 70) return "burnout";
    if (isCoffee) return "coffee";
    return null;
  }

  function refreshStatusBadge() {
    const id = activeStatus();
    if (!id) { statusRow.style.display = "none"; return; }
    const info = { burnout: { icon: "🥵", text: "번아웃 — 글자가 깨져 보인다" }, headache: { icon: "🤕", text: "두통 — 글자가 번져 보인다" }, coffee: { icon: "☕", text: "손 떨림 — 메일이 잘게 떨려 보인다" } }[id];
    statusIcon.textContent = info.icon;
    statusCap.textContent = info.text;
    statusRow.style.display = "flex";
  }

  function statusText(text, part) {
    if (isHeadache) return text;
    if (stress >= 70) return corruptText(text, part === "subject" ? 0.22 : 0.18, run.index);
    return text;
  }

  function clipForStress(text) {
    return stress >= 80 ? text.split(" ").slice(0, 3).join(" ") + "…" : text;
  }

  function updateScorePill() {
    scorePill.textContent = `처리 ${Math.min(run.index, run.deck.length)}/${run.deck.length}`;
  }

  function updateTimerDisplay() {
    timerNum.textContent = "0:" + String(Math.max(0, Math.round(run.time))).padStart(2, "0");
    const danger = run.time <= 10 && run.phase === "play";
    timerPill.style.background = danger ? PX.red : "#fff";
    timerPill.style.color = danger ? "#fff" : PX.ink;
    timerPill.className = danger ? "px-timer danger" : "px-timer";
  }

  function showFloat(text) {
    floatEl.textContent = text;
    floatEl.hidden = false;
    clearTimeout(run.floatTimer);
    run.floatTimer = setTimeout(() => { floatEl.hidden = true; }, 1300);
  }

  function showEvToast(msg) {
    evToastEl.textContent = msg;
    evToastEl.style.display = "block";
    clearTimeout(run.evToastTimer);
    run.evToastTimer = setTimeout(() => { evToastEl.style.display = "none"; }, 3000);
  }

  function showFeedback(text, color) {
    feedbackEl.textContent = text;
    feedbackEl.style.color = color;
    feedbackEl.style.display = "block";
    feedbackEl.classList.remove("pop-in");
    void feedbackEl.offsetWidth;
    feedbackEl.classList.add("pop-in");
    clearTimeout(run.feedbackTimer);
    run.feedbackTimer = setTimeout(() => { feedbackEl.style.display = "none"; }, 520);
  }

  // ── 메일 카드 렌더 ──
  function renderMailCard(mail) {
    mailCard.replaceChildren();
    const cardWidth = run.detailOpen ? "620px" : "420px";
    mailSlot.style.width = cardWidth;
    mailCard.style.width = "100%";

    const top = document.createElement("div");
    top.style.cssText = "display:flex;justify-content:space-between;gap:12px;font-family:NeoDunggeunmo,monospace;font-size:13px;color:#9a9a9a;margin-bottom:8px";
    const from = document.createElement("span");
    from.textContent = mail.from;
    const domain = document.createElement("span");
    domain.style.fontWeight = "700";
    domain.textContent = mail.domain;
    top.append(from, domain);

    const subject = document.createElement("div");
    subject.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:18px;color:${PX.ink};line-height:1.25;margin-bottom:8px`;
    const previewText = clipForStress(makeBasicPreview(mail));
    const subjectText = statusText(mail.subject, "subject");
    const previewDisplay = statusText(previewText, "body");

    subject.textContent = subjectText;

    const preview = document.createElement("div");
    preview.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:13.5px;color:#777;line-height:1.45;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden";
    preview.textContent = previewDisplay;

    mailCard.append(top, subject, preview);

    if (run.detailOpen) {
      const detail = document.createElement("div");
      detail.style.cssText = "border-top:1.5px dashed #d8d2c0;margin-top:12px;padding-top:11px;display:grid;gap:8px;font-family:NeoDunggeunmo,monospace;font-size:13px;line-height:1.4;color:#666";
      [["본문", clipForStress(mail.body)], ["첨부파일", mail.attachment || "없음"], ["링크", mail.link || "없음"], ["수신", mail.recipient || "없음"], ["발신시간", mail.time || "없음"]].forEach(([label, value]) => {
        const row = document.createElement("div");
        row.style.cssText = "display:grid;grid-template-columns:86px 1fr;gap:10px";
        const l = document.createElement("span");
        l.style.cssText = "color:#999;font-weight:700";
        l.textContent = label;
        const v = document.createElement("span");
        v.textContent = value;
        row.append(l, v);
        detail.append(row);
      });
      mailCard.append(detail);
    }

    const hint = document.createElement("span");
    hint.style.cssText = "display:block;text-align:right;margin-top:8px;font-family:NeoDunggeunmo,monospace;font-size:11px;color:#aaa";
    hint.textContent = run.detailOpen ? "SPACE 접기" : "SPACE 상세 확인 (-2초)";
    mailCard.append(hint);

    syncHeadacheTextLayers(mailCard, {
      enabled: isHeadache,
      title: mail.subject,
      body: previewText,
    });
  }

  function showNextMail() {
    const mail = run.deck[run.index];
    if (!mail) { finish(); return; }
    run.cardY = MAIL_START_Y;
    run.detailOpen = false;
    mailCard.className = "mg-mail-card";
    mailSlot.style.top = run.cardY + "%";
    renderMailCard(mail);
    updateScorePill();
  }

  function pushSorted(mail, target) {
    const isGood = target === "good";
    const zone = isGood ? goodZone : spamZone;
    const arr = isGood ? run.sortedGood : run.sortedSpam;
    arr.push(mail);
    const item = document.createElement("span");
    item.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:10.5px;border:1.5px solid ${zone.accent};background:#fff;color:#666;padding:2px 7px;display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0`;
    item.textContent = mail.subject;
    item.title = mail.subject;
    zone.list.prepend(item);
    while (zone.list.children.length > 4) zone.list.removeChild(zone.list.lastChild);
    zone.count.textContent = String(arr.length);
  }

  // ── 분류 ──
  function classify(target) {
    if (run.phase !== "play" || run.locked) return;
    const mail = run.deck[run.index];
    if (!mail) return;
    run.locked = true;

    if (target === "missed") {
      run.missed++;
      mailCard.classList.add("mg-mail-missed");
      showFeedback("시간 초과…", "#777");
    } else {
      const ok = mail.type === target;
      if (ok) run.correct++; else run.wrong++;
      mailCard.classList.add(target === "good" ? "mg-mail-throw-left" : "mg-mail-throw-right");
      pushSorted(mail, target);
      showFeedback(ok ? "정확!" : "오분류!", ok ? PX.green : PX.red);
    }

    clearTimeout(run.classifyTimer);
    run.classifyTimer = setTimeout(() => {
      run.index++;
      run.locked = false;
      updateScorePill();
      if (run.index >= run.deck.length) finish();
      else showNextMail();
    }, 240);
  }

  function toggleDetail() {
    if (run.phase !== "play" || run.locked) return;
    if (!run.detailOpen) {
      run.time = Math.max(0, run.time - 2);
      showFloat("상세 확인 -2초");
      updateTimerDisplay();
    }
    run.detailOpen = !run.detailOpen;
    renderMailCard(run.deck[run.index]);
  }

  // ── 낙하 애니메이션 ──
  function tick() {
    if (run.phase !== "play" || run.done) return;
    if (run.paused) {
      run.raf = requestAnimationFrame(tick);
      return;
    }
    const stressBoost = stress >= 80 ? 0.09 : stress >= 50 ? 0.05 : 0;
    if (!run.locked) {
      run.cardY += CARD_FALL_SPEED + stressBoost;
      mailSlot.style.top = run.cardY + "%";
      if (run.cardY >= 84) classify("missed");
    }
    run.raf = requestAnimationFrame(tick);
  }

  // ── 타이머 / 이벤트 ──
  function startTimer() {
    run.timerInterval = setInterval(() => {
      if (run.paused || run.done || run.phase !== "play") return;
      run.time = Math.max(0, run.time - 1);
      run.elapsed += 1;
      updateTimerDisplay();
      if (run.elapsed % 10 === 0) fireEvent(pickNextEvent());
      if (run.time <= 0) { clearInterval(run.timerInterval); finish(); }
    }, 1000);
  }

  function pickNextEvent() {
    let pool = ALL_EVENTS.filter((t) => !run.usedEvents[t]);
    if (pool.length === 0) { run.usedEvents = {}; pool = ALL_EVENTS.slice(); }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    run.usedEvents[pick] = true;
    return pick;
  }

  function fireEvent(type) {
    if (type === "boss") setBoss(true);
    if (type === "kakao") {
      kakaoEl.replaceChildren();
      kakaoEl.append(makeKakaoWin({
        onClose: () => { kakaoEl.replaceChildren(); kakaoEl.hidden = true; },
        msgs: buildBossKakaoMsgs(state, [
          ["😤", "{name}, 받은편지함 정리 다 하셨습니까?"],
          ["😤", "{name}, 중요한 메일을 놓치시면 안 됩니다."],
          ["😤", "{name}, 빠르게 확인 부탁드립니다."],
        ]),
      }));
      kakaoEl.hidden = false;
      clearTimeout(run.kakaoTimer);
      run.kakaoTimer = setTimeout(() => { kakaoEl.replaceChildren(); kakaoEl.hidden = true; }, 6000);
    }
    if (type === "chat") {
      run.time = Math.max(0, run.time - 3);
      showFloat("-3초");
      updateTimerDisplay();
      showEvToast("옆자리 동료: 어제 그 드라마 봤어요? 📺");
    }
  }

  function setBoss(on) {
    bossOverlayEl.hidden = !on;
    run.bossWatching = on;
    refreshFxClass();
    if (on) {
      bossBannerEl.style.display = "flex";
      bossBannerEl.replaceChildren();
      const card = document.createElement("div");
      card.style.cssText = `width:480px;max-width:84%;background:#fff;border:3px solid ${PX.red};box-shadow:5px 5px 0 rgba(0,0,0,.22);padding:12px 18px;display:flex;flex-direction:column;gap:6px`;
      const top = document.createElement("div");
      top.style.cssText = "display:flex;align-items:center;gap:8px";
      const warn = document.createElement("span");
      warn.style.fontSize = "20px";
      warn.textContent = "⚠️";
      const title = document.createElement("span");
      title.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:16px;color:${PX.red}`;
      title.textContent = "상사가 내 자리 옆에 서 있다…";
      top.append(warn, title);
      const desc = document.createElement("span");
      desc.style.cssText = "font-family:NeoDunggeunmo,monospace;font-size:12.5px;color:#4a4636";
      desc.textContent = "아무 말 없이 모니터만 보고 있다. 긴장된다.";
      card.append(top, desc);
      bossBannerEl.append(card);
      clearTimeout(run.bossTimer);
      run.bossTimer = setTimeout(() => { bossBannerEl.style.display = "none"; }, 3000);
    } else {
      bossBannerEl.style.display = "none";
    }
  }

  // ── 키보드 ──
  function onKeydown(e) {
    if (run.phase !== "play") return;
    const key = e.key.toLowerCase();
    if (key === "a" || key === "arrowleft") classify("good");
    else if (key === "d" || key === "arrowright") classify("spam");
    else if (key === " " || key === "spacebar") { e.preventDefault(); toggleDetail(); }
  }

  // ── 종료 ──
  function finish() {
    if (run.done || run.phase !== "play") return;
    run.done = true;
    run.phase = "result";
    stopBgm();
    cancelAnimationFrame(run.raf);
    clearInterval(run.timerInterval);
    // 결과 팝업이 가려지지 않도록 진행 중이던 이벤트 UI 정리 (까까오 PC창·상사 실루엣·배너·토스트)
    kakaoEl.replaceChildren(); kakaoEl.hidden = true;
    bossOverlayEl.hidden = true;
    bossBannerEl.style.display = "none";
    evToastEl.style.display = "none";
    [run.kakaoTimer, run.evTimer, run.bossTimer, run.evToastTimer].forEach(clearTimeout);
    const tier = run.correct >= 8 ? "success" : run.correct >= 5 ? "partial" : "fail";
    showResult(tier, run.correct, run.deck.length, 60 - run.time);
  }

  function showResult(tier, correct, total, usedSec) {
    playSfx("assets/audio/gameboy-pluck.mp3"); // 결과 팝업 효과음
    const TIERS = {
      success: { title: "받은편지함 클리어!", emoji: "🎉", bg: "#eafae8", color: PX.green, deltas: [{ label: "업무량", v: -20 }] },
      partial: { title: "아슬아슬하게 분류했다…", emoji: "😮‍💨", bg: "#fff3df", color: "#c98a2a", deltas: [{ label: "업무량", v: -18 }, { label: "스트레스", v: 8 }] },
      fail: { title: "받은편지함이 터졌다…", emoji: "💀", bg: "#f6e3e0", color: PX.red, deltas: [{ label: "업무량", v: -8 }, { label: "스트레스", v: 18 }, { label: "체력", v: -8 }] },
    };
    const t = TIERS[tier];
    const card = document.createElement("div");
    card.className = "pop-in";
    const panel = document.createElement("div");
    panel.style.cssText = `width:440px;max-width:84%;background:${t.bg};border:4px solid ${PX.ink};box-shadow:6px 6px 0 rgba(29,31,46,.35);padding:20px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px`;
    const emojiEl = document.createElement("div");
    emojiEl.style.cssText = "font-size:46px;line-height:1";
    emojiEl.textContent = t.emoji;
    const titleEl = document.createElement("div");
    titleEl.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:22px;color:${t.color}`;
    titleEl.textContent = t.title;
    const statsRow = document.createElement("div");
    statsRow.style.cssText = "display:flex;gap:8px";
    [["정확", `${correct}/${total}`, ""], ["소요", usedSec, "초"]].forEach(([lbl, v, unit]) => {
      const s = document.createElement("span");
      s.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:12.5px;background:#fff;border:2px solid ${PX.ink};padding:3px 11px`;
      s.textContent = `${lbl} ${v}${unit}`;
      statsRow.append(s);
    });
    const deltaRow = document.createElement("div");
    deltaRow.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:center";
    t.deltas.forEach((d) => {
      const s = document.createElement("span");
      s.style.cssText = `font-family:NeoDunggeunmo,monospace;font-size:13px;border:2px solid ${PX.ink};padding:4px 12px;background:${d.v < 0 ? "#d7f3d4" : "#ffdcd4"};color:${d.v < 0 ? "#1f8a2e" : "#c0392b"}`;
      s.textContent = `${d.label} ${d.v < 0 ? "▼" : "▲"}${Math.abs(d.v)}`;
      deltaRow.append(s);
    });
    const nextBtn = document.createElement("div");
    nextBtn.style.cssText = "margin-top:4px;cursor:pointer";
    const btnInner = document.createElement("div");
    btnInner.style.cssText = `background:${PX.yellow};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:10px 22px;font-family:NeoDunggeunmo,monospace;font-size:19px;color:${PX.ink};display:inline-flex;align-items:center;gap:8px`;
    btnInner.textContent = "메인 화면으로 ▶";
    btnInner.addEventListener("click", () => { playClickSfx(); cleanup(); actions.applyResult(tier, `이메일 분류 ${MINI_TIER_LABEL[tier] ?? tier}: 정확 ${correct}/${total}`, usedSec); });
    nextBtn.append(btnInner);
    panel.append(emojiEl, titleEl, statsRow, deltaRow, nextBtn);
    card.append(panel);
    resultOverlay.replaceChildren(card);
    resultOverlay.style.display = "flex";
  }

  function cleanup() {
    stopBgm();
    cancelAnimationFrame(run.raf);
    clearInterval(run.timerInterval);
    window.removeEventListener("keydown", onKeydown);
    if (run.onFitResize) window.removeEventListener("resize", run.onFitResize);
    [run.floatTimer, run.feedbackTimer, run.evToastTimer, run.evTimer, run.bossTimer, run.kakaoTimer, run.classifyTimer].forEach(clearTimeout);
  }

  // ── 모니터 자동 맞춤 — 세로 오버플로 시 비율 유지로 축소(스크롤 제거) ──
  // transform:scale 만 적용해 내부 좌표·낙하 애니메이션·게임 로직은 그대로 유지.
  function fitMonitor() {
    monitorWrapper.style.transform = "";
    monitorWrapper.style.marginBottom = "";
    const natural = monitorWrapper.offsetHeight;
    if (!natural) return;
    const avail = monitorScroll.clientHeight - 36; // 상하 패딩(18px*2) 보정
    const scale = Math.min(1, avail / natural);
    if (scale < 1) {
      monitorWrapper.style.transformOrigin = "top center";
      monitorWrapper.style.transform = `scale(${scale})`;
      // 축소된 만큼 레이아웃 높이를 줄여 빈 스크롤 영역이 생기지 않게 보정.
      monitorWrapper.style.marginBottom = `${-natural * (1 - scale)}px`;
    }
  }
  run.onFitResize = () => fitMonitor();

  // ── 초기화 ──
  refreshFxClass();
  refreshStatusBadge();
  showNextMail();
  updateTimerDisplay();
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("resize", run.onFitResize);
  playBgm("assets/audio/email_bgm.mp3");
  syncBgmStatusFx({ headache: isHeadache });
  maybeShowHeadacheDialog(shell, state, actions, {
    run,
    clockEl: shell.querySelector(".hud .clock"),
  });
  startTimer();
  run.raf = requestAnimationFrame(tick);
  requestAnimationFrame(fitMonitor);
  setTimeout(fitMonitor, 250); // 픽셀 폰트 로드 후 한 번 더 보정
}
