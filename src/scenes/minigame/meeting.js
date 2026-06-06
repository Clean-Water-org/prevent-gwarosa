import { TOPICS, TRAPS, TRAP_MSGS } from "../../data/meeting-slides.js";
import { renderHud } from "../../ui.js";
import { makeBossSilhouette } from "../../components/boss-silhouette.js";

const CARD_W = 120, CARD_H = 150;
const PX = { ink: "#1d1f2e", red: "#ff4d4d", green: "#3fc24a", blue: "#3d8bff", yellow: "#ffd23f", white: "#fdfcf2" };

// ── 픽셀아트 슬라이드 비주얼 ──────────────────────────────────────
function makeSlideContent(kind) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "flex:1;display:flex;padding:5px 7px;min-height:0";

  if (kind === "agenda") {
    wrap.style.cssText += ";flex-direction:column;gap:4px;justify-content:center";
    ["01","02","03"].forEach((n) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:5px";
      const num = document.createElement("span");
      num.style.cssText = `font-size:9px;color:${PX.blue};font-family:Galmuri9,monospace`;
      num.textContent = n;
      const line = document.createElement("span");
      line.style.cssText = "height:5px;background:#c7cdd8;flex:1";
      row.append(num, line);
      wrap.append(row);
    });
  } else if (kind === "status") {
    wrap.style.cssText += ";align-items:flex-end;gap:5px;justify-content:center;padding-bottom:8px";
    [22,34,28,44].forEach((h) => {
      const bar = document.createElement("span");
      bar.style.cssText = `width:11px;height:${h}px;background:${PX.blue};border:1.5px solid ${PX.ink}`;
      wrap.append(bar);
    });
  } else if (kind === "problem") {
    wrap.style.cssText += ";align-items:center;justify-content:center;gap:6px";
    const icon = document.createElement("span");
    icon.textContent = "📉"; icon.style.fontSize = "26px";
    const lines = document.createElement("div");
    lines.style.cssText = "display:flex;flex-direction:column;gap:4px";
    [[PX.red,40],["#c7cdd8",30],["#c7cdd8",36]].forEach(([bg,w]) => {
      const l = document.createElement("span");
      l.style.cssText = `height:5px;width:${w}px;background:${bg}`;
      lines.append(l);
    });
    wrap.append(icon, lines);
  } else if (kind === "solution") {
    wrap.style.cssText += ";flex-direction:column;gap:5px;justify-content:center";
    for (let i=0;i<3;i++) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:5px";
      const check = document.createElement("span");
      check.style.cssText = `width:10px;height:10px;background:${PX.green};border:1.5px solid ${PX.ink};color:#fff;font-size:8px;line-height:9px;text-align:center;flex-shrink:0`;
      check.textContent = "✓";
      const line = document.createElement("span");
      line.style.cssText = "height:5px;background:#c7cdd8;flex:1";
      row.append(check, line);
      wrap.append(row);
    }
  } else if (kind === "effect") {
    wrap.style.cssText += ";align-items:center;justify-content:center;gap:8px";
    const pie = document.createElement("span");
    pie.style.cssText = `width:38px;height:38px;border-radius:50%;border:2px solid ${PX.ink};background:conic-gradient(${PX.green} 0 62%,${PX.yellow} 62% 100%)`;
    const icon = document.createElement("span");
    icon.textContent = "📈"; icon.style.fontSize = "22px";
    wrap.append(pie, icon);
  } else if (kind === "plan") {
    wrap.style.cssText += ";flex-direction:column;gap:5px;justify-content:center";
    [[0,46],[10,34],[22,40]].forEach(([off,len],i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:4px";
      const n = document.createElement("span");
      n.style.cssText = `font-size:8px;color:#9aa3b5;width:8px;font-family:Galmuri9,monospace`;
      n.textContent = i+1;
      const track = document.createElement("span");
      track.style.cssText = "height:7px;background:#e7ecf3;flex:1;position:relative;overflow:hidden";
      const bar = document.createElement("span");
      bar.style.cssText = `position:absolute;left:${off}px;width:${len}px;top:0;bottom:0;background:${PX.blue};border:1px solid ${PX.ink}`;
      track.append(bar);
      row.append(n, track);
      wrap.append(row);
    });
  } else {
    wrap.style.cssText += ";flex-direction:column;align-items:center;justify-content:center;gap:3px";
    const qa = document.createElement("span");
    qa.style.cssText = "font-size:12px;color:var(--ink);font-family:Galmuri11,monospace;font-weight:700";
    qa.textContent = "Q & A";
    const thanks = document.createElement("span");
    thanks.style.cssText = "font-size:9px;color:#888;font-family:Galmuri11,monospace";
    thanks.textContent = "감사합니다";
    wrap.append(qa, thanks);
  }
  return wrap;
}

// ── 픽셀 소품 ──────────────────────────────────────────────────────
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
  [[14,40,"#3fc24a","60% 0 60% 0","-12deg"],[14,48,"#5ad65f","60% 60% 0 0","0deg"],[14,40,"#3fc24a","0 60% 0 60%","12deg"]].forEach(([w,h,bg,br,rot]) => {
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

// ── 상사 실루엣 SVG → src/components/boss-silhouette.js 로 공통화 (Phase 5) ──

// ── 모니터 베젤 ────────────────────────────────────────────────────
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

// ── ProgressChips ─────────────────────────────────────────────────
function makeProgressChips(done, total, warn) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;align-items:center;gap:7px";
  const lbl = document.createElement("span");
  lbl.style.cssText = "font-family:Galmuri11,monospace;font-size:13px;color:var(--ink);white-space:nowrap";
  lbl.textContent = "배치";
  const chips = document.createElement("div");
  chips.style.cssText = "display:flex;gap:3px";
  for (let i=0;i<total;i++) {
    const c = document.createElement("span");
    c.style.cssText = `width:13px;height:16px;border:2px solid ${PX.ink};background:${i<done?(warn?PX.red:PX.green):"#fff"};image-rendering:pixelated`;
    chips.append(c);
  }
  const num = document.createElement("span");
  num.style.cssText = "font-family:Galmuri9,monospace;font-size:14px;color:var(--ink)";
  num.textContent = `${done}/${total}`;
  wrap.append(lbl, chips, num);
  return wrap;
}

// ── 슬라이드 카드 ──────────────────────────────────────────────────
function makeSlideCard(slide, { n, mark, clipSub, canDrag, locked, fresh, titleBlur, w }) {
  const wrong = mark === "wrong", ok = mark === "ok";
  const width = w || CARD_W, height = width * (CARD_H / CARD_W);
  const bc = locked ? PX.red : wrong ? PX.red : ok ? PX.green : PX.ink;
  const headBg = wrong ? "#ffe3e0" : ok ? "#e3f7e2" : "#eef2f8";
  const shadow = fresh ? `0 0 0 3px ${PX.yellow},3px 3px 0 ${PX.ink}` : `3px 3px 0 ${PX.ink}`;
  const transform = wrong ? "rotate(-2deg)" : undefined;

  const card = document.createElement("div");
  card.style.cssText = `width:${width}px;height:${height}px;background:${locked?"#fbe3dd":PX.white};border:${wrong||ok||locked?3:2.5}px solid ${bc};box-shadow:${shadow};display:flex;flex-direction:column;box-sizing:border-box;position:relative;cursor:${canDrag?"grab":"default"};image-rendering:pixelated;transition:transform .08s`;
  if (transform) card.style.transform = transform;
  if (canDrag) card.setAttribute("draggable", "true");

  // 추가 배지
  if (fresh) {
    const b = document.createElement("span");
    b.style.cssText = `position:absolute;top:-11px;left:50%;transform:translateX(-50%);font-family:Galmuri11,monospace;font-size:10px;color:${PX.ink};background:${PX.yellow};border:2px solid ${PX.ink};padding:0 6px;white-space:nowrap;z-index:3`;
    b.textContent = "추가";
    card.append(b);
  }
  // 잠금
  if (locked) {
    const l = document.createElement("span");
    l.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:26px;z-index:4`;
    l.textContent = "🔒";
    card.append(l);
  }
  // 채점 배지
  if (wrong) {
    const b = document.createElement("span");
    b.style.cssText = `position:absolute;top:-11px;right:-10px;width:26px;height:26px;border-radius:50%;background:${PX.red};color:#fff;border:3px solid #fff;box-shadow:0 0 0 2px ${PX.ink};display:flex;align-items:center;justify-content:center;font-family:Galmuri14,monospace;font-size:13px;z-index:3`;
    b.textContent = "✗";
    card.append(b);
  }
  if (ok) {
    const b = document.createElement("span");
    b.style.cssText = `position:absolute;top:-11px;right:-10px;width:26px;height:26px;border-radius:50%;background:${PX.green};color:#fff;border:3px solid #fff;box-shadow:0 0 0 2px ${PX.ink};display:flex;align-items:center;justify-content:center;font-family:Galmuri14,monospace;font-size:13px;z-index:3`;
    b.textContent = "✓";
    card.append(b);
  }
  // 드래그 핸들
  if (canDrag) {
    const h = document.createElement("span");
    h.style.cssText = "position:absolute;top:3px;right:5px;font-family:Galmuri9,monospace;font-size:12px;color:#aab";
    h.textContent = "⠿";
    card.append(h);
  }

  // 제목 바
  const head = document.createElement("div");
  head.style.cssText = `display:flex;align-items:center;gap:5px;padding:3px 6px;border-bottom:2px solid ${PX.ink};background:${headBg}`;
  if (n != null) {
    const num = document.createElement("span");
    num.style.cssText = `font-family:Galmuri9,monospace;font-size:11px;color:#fff;background:${bc === PX.ink ? PX.ink : bc};padding:0 4px;min-width:14px;text-align:center`;
    num.textContent = n;
    head.append(num);
  }
  const titleEl = document.createElement("span");
  titleEl.style.cssText = `font-family:Galmuri11,monospace;font-size:12.5px;color:${PX.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
  if (titleBlur) titleEl.style.filter = "blur(2.6px)";
  titleEl.textContent = slide.title;
  head.append(titleEl);
  card.append(head);

  // 슬라이드 콘텐츠 비주얼
  card.append(makeSlideContent(slide.kind));

  // 부제
  const sub = document.createElement("div");
  sub.style.cssText = `border-top:1.5px dashed #d8d2c0;padding:3px 6px;min-height:26px;display:flex;align-items:center`;
  const subTxt = document.createElement("span");
  subTxt.style.cssText = "font-family:Galmuri11,monospace;font-size:10.5px;color:#8a8478;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden";
  subTxt.textContent = clipSub ? slide.sub.split(" ").slice(0,2).join(" ") + "…" : slide.sub;
  sub.append(subTxt);
  card.append(sub);

  return card;
}

// ── 빈 슬롯 ──────────────────────────────────────────────────────
// over/snap 시각은 부모 wrapper에 CSS 클래스로 제어 (DOM 교체 없음)
function makeEmptySlotEl(n, w) {
  const width = w || CARD_W, height = width * (CARD_H / CARD_W);
  const d = document.createElement("div");
  d.className = "mg-empty-slot";
  d.style.cssText = `width:${width}px;height:${height}px;border:3px dashed #9aa3b5;background:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;box-sizing:border-box;position:relative;transition:border-color .08s,background .08s`;
  const numEl = document.createElement("span");
  numEl.className = "mg-slot-num";
  numEl.style.cssText = "position:absolute;top:4px;left:6px;font-family:Galmuri9,monospace;font-size:13px;color:#9aa3b5";
  numEl.textContent = n;
  const placeholder = document.createElement("span");
  placeholder.className = "mg-slot-placeholder";
  placeholder.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#9aa3b5";
  placeholder.textContent = "비어있음";
  const hint = document.createElement("span");
  hint.className = "mg-slot-hint";
  hint.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#b89324;display:none";
  hint.textContent = "여기에 딱! 🧲";
  d.append(numEl, placeholder, hint);
  return d;
}

// ── KakaoWin ─────────────────────────────────────────────────────
function makeKakaoWin({ title, msgs, votes, onClose, styleStr }) {
  const win = document.createElement("div");
  win.style.cssText = `position:fixed;z-index:47;width:380px;border:3px solid ${PX.ink};box-shadow:6px 6px 0 rgba(0,0,0,.35);${styleStr||"top:16%;right:8%"}`;

  const bar = document.createElement("div");
  bar.style.cssText = `display:flex;align-items:center;justify-content:space-between;background:#fee500;padding:7px 12px;border-bottom:3px solid ${PX.ink}`;
  const barTitle = document.createElement("span");
  barTitle.style.cssText = "font-family:Galmuri11,monospace;font-size:13px;color:#3a2e00;font-weight:700";
  barTitle.textContent = `💬 ${title}`;
  const closeBtn = document.createElement("span");
  closeBtn.style.cssText = `font-family:Galmuri11,monospace;font-size:13px;color:#3a2e00;border:2px solid ${PX.ink};background:#fff7b0;padding:0 6px;cursor:pointer`;
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
    nameEl.style.cssText = "font-family:Galmuri11,monospace;font-size:11px;color:#2a3a47";
    nameEl.textContent = name;
    const textEl = document.createElement("span");
    textEl.style.cssText = `font-family:Galmuri11,monospace;font-size:13px;background:#fff;border:2px solid ${PX.ink};padding:5px 10px`;
    textEl.textContent = text;
    msgBody.append(nameEl, textEl);
    row.append(avatar, msgBody);
    body.append(row);
  });

  if (votes) {
    const voteRow = document.createElement("div");
    voteRow.style.cssText = `display:flex;gap:8px;justify-content:center;margin-top:4px;padding-top:8px;border-top:2px dashed rgba(29,31,46,.3)`;
    ["한식","일식","양식"].forEach((v) => {
      const btn = document.createElement("div");
      btn.style.cssText = `background:${PX.white};border:3px solid ${PX.ink};box-shadow:3px 3px 0 ${PX.ink};padding:6px 14px;font-family:Galmuri11,monospace;font-size:15px;color:${PX.ink};cursor:pointer`;
      btn.textContent = v;
      btn.addEventListener("click", onClose);
      voteRow.append(btn);
    });
    body.append(voteRow);
  }

  win.append(bar, body);
  return win;
}

// ══════════════════════════════════════════════════════════════════
export function renderMeetingGame(root, state, actions, game) {
  const ALL_EVENTS = ["addSlide","timeCut","kakao","addTrap","lock","shuffle2","jitter","signature","chat","dinner","lunch"];

  function shuffled(a) {
    const r=a.slice(); for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];} return r;
  }

  // ── 게임 데이터 ──
  const stress = state.stats.stress;
  const topicIdx = Math.floor(Math.random() * TOPICS.length);
  const topic = TOPICS[topicIdx];
  const mode = stress >= 50 ? 7 : 5;
  const trapN = stress >= 80 ? 3 : 2;

  const slides = topic.slides
    .map((s,i) => ({ id:i, title:s[0], sub:s[1], s7:s[2], kind:s[3] }))
    .filter((s) => mode === 7 || !s.s7);
  const order = slides.map((s) => s.id);
  const traps = shuffled(TRAPS[topicIdx]||[]).slice(0,trapN)
    .map((t,k) => ({ id:`t${k}`, title:t[0], sub:t[1], kind:t[2], isTrap:true }));
  const mg = {
    topicIdx, mode, slides, order, traps,
    all:[...slides,...traps],
    trayOrder: shuffled([...slides,...traps].map((s)=>s.id)),
    wrongMax: stress >= 80 ? 3 : stress >= 50 ? 4 : 5,
  };
  const place = {};
  mg.trayOrder.forEach((id) => { place[id] = "tray"; });

  // ── 런타임 상태 ──
  const run = {
    phase:"play", time:60, done:false,
    dragId:null, overSlot:null,
    wrongCount:0, lockId:null, lockTimer:null,
    evJitter:false, jitterTimer:null,
    bossWatching:false,
    marks:null, result:null, gradeTimer:null, timerInterval:null,
    usedEvents:{}, firedPoints:{},
    floatTimer:null, trapTimer:null, evToastTimer:null, slipTimer:null, slowTimer:null,
  };

  function byId(id) { return mg.all.find((s) => String(s.id)===String(id)); }
  function slotOf(i) { return mg.all.find((s) => place[s.id]===i) || null; }
  function cw() { return mg.order.length >= 7 ? 110 : 124; }

  // ── HUD 참조 (ProgressChips 업데이트용) ──
  let progressChipsWrap = null;
  let wrongPill = null;
  let timerPill = null;
  let floatEl = null;

  // ── 오피스 배경 + 소품 ──
  const shell = document.createElement("section");
  shell.style.cssText = "position:fixed;inset:0;overflow:hidden;background:#caa46a;display:grid;grid-template-rows:auto 1fr";

  shell.append(renderHud(state));

  const room = document.createElement("div");
  room.style.cssText = "position:relative;overflow:hidden";

  // 벽/책상 배경
  [["top:0;left:0;right:0;height:76%","linear-gradient(#f3e2c0,#e9d3a8)"],
   ["top:76%;left:0;right:0;height:6px","rgba(29,31,46,.25)"],
   ["bottom:0;left:0;right:0;height:24%","linear-gradient(#b97a3e,#9c5f2c)"],
   ["bottom:24%;left:0;right:0;height:5px","rgba(29,31,46,.4)"],
  ].forEach(([pos,bg]) => {
    const layer = document.createElement("div");
    layer.style.cssText = `position:absolute;${pos};background:${bg}`;
    room.append(layer);
  });

  // 픽셀 소품
  const propsData = [
    [makePixWindow, "position:absolute;left:34px;top:26px"],
    [makePixClock,  "position:absolute;right:52px;top:30px"],
    [makePixPlant,  "position:absolute;right:36px;bottom:14px"],
    [makePixMug,    "position:absolute;left:56px;bottom:20px"],
  ];
  propsData.forEach(([fn, css]) => {
    const p = fn();
    p.style.cssText = (p.style.cssText ? p.style.cssText + ";" : "") + css;
    room.append(p);
  });

  // ── 모니터 영역 ──
  const monitorScroll = document.createElement("div");
  monitorScroll.style.cssText = "position:absolute;inset:0;display:flex;align-items:safe center;justify-content:center;padding:18px 16px;overflow:auto";

  const monitorWrapper = document.createElement("div");
  monitorWrapper.style.cssText = "width:min(1000px, 96vw)";

  // ── 게임 내용 (모니터 스크린) ──
  const gameContent = document.createElement("div");
  gameContent.style.cssText = "position:relative";

  const fxWrap = document.createElement("div");
  fxWrap.style.cssText = "position:relative";
  refreshFxClass();

  // 타이틀바
  const titlebar = document.createElement("div");
  titlebar.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:#3a6ea5;border-bottom:3px solid ${PX.ink}`;
  const titleLeft = document.createElement("span");
  titleLeft.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#fff";
  titleLeft.textContent = "📊 발표자료_최종_진짜최종_v3.ppt — 파워포인뜨";
  const wbtns = document.createElement("div");
  wbtns.style.cssText = "display:flex;gap:4px";
  ["_","▢","✕"].forEach((c) => {
    const b = document.createElement("span");
    b.style.cssText = `width:18px;height:16px;background:#d8d2c0;border:2px solid ${PX.ink};font-family:Galmuri11,monospace;font-size:11px;display:flex;align-items:center;justify-content:center;color:${PX.ink}`;
    b.textContent = c;
    wbtns.append(b);
  });
  titlebar.append(titleLeft, wbtns);

  // 메뉴바
  const menubar = document.createElement("div");
  menubar.style.cssText = `display:flex;align-items:center;gap:14px;padding:3px 12px;background:#ece6d6;border-bottom:3px solid ${PX.ink}`;
  ["파일","편집","보기","삽입","디자인"].forEach((m) => {
    const s = document.createElement("span");
    s.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#5a5440";
    s.textContent = m;
    menubar.append(s);
  });

  // HUD 스트립
  const hud = document.createElement("div");
  hud.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#ffe9a8;border-bottom:3px solid ${PX.ink}`;
  const topicLabel = document.createElement("span");
  topicLabel.style.cssText = "font-family:Galmuri14,monospace;font-size:14px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0";
  topicLabel.textContent = `📊 회의 준비 — ${topic.name}`;
  const hudRight = document.createElement("div");
  hudRight.style.cssText = "display:flex;align-items:center;gap:10px;flex-shrink:0";

  // progressChips는 나중에 업데이트를 위해 컨테이너로 감싸기
  const chipsContainer = document.createElement("div");
  chipsContainer.append(makeProgressChips(0, mg.order.length, false));
  progressChipsWrap = chipsContainer;

  wrongPill = document.createElement("span");
  wrongPill.style.cssText = `font-family:Galmuri11,monospace;font-size:12px;padding:3px 9px;border:2px solid ${PX.ink};background:#fff3c4;color:#8a6d12;white-space:nowrap`;
  wrongPill.textContent = `오답 0/${mg.wrongMax}`;

  const timerWrap = document.createElement("div");
  timerWrap.style.cssText = "position:relative;display:flex;align-items:center";
  floatEl = document.createElement("span");
  floatEl.style.cssText = `position:absolute;right:100%;margin-right:8px;top:50%;transform:translateY(-50%);font-family:Galmuri14,monospace;font-size:22px;color:${PX.red};white-space:nowrap;text-shadow:1px 1px 0 #fff;pointer-events:none`;
  floatEl.hidden = true;
  timerPill = document.createElement("div");
  timerPill.style.cssText = `display:flex;align-items:center;gap:7px;font-family:Galmuri9,monospace;border:2px solid ${PX.ink};background:#fff;color:${PX.ink};padding:3px 11px`;
  const timerIcon = document.createElement("span");
  timerIcon.style.fontSize = "15px";
  timerIcon.textContent = "⏱";
  const timerNum = document.createElement("span");
  timerNum.style.cssText = "font-size:20px;letter-spacing:1px";
  timerNum.textContent = "0:60";
  timerPill.append(timerIcon, timerNum);
  timerWrap.append(floatEl, timerPill);

  hudRight.append(chipsContainer, wrongPill, timerWrap);
  hud.append(topicLabel, hudRight);

  // 보드 영역
  const board = document.createElement("div");
  board.style.cssText = "position:relative;background:#e8eef7;padding:12px 16px 14px";

  const hintEl = document.createElement("div");
  hintEl.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#5a6478;margin-bottom:8px;display:flex;gap:4px;flex-wrap:wrap";
  ["발표 슬라이드는 순서대로 ·", "다른 팀 자료(함정)는 🗑️로", "· 채워진 칸에 놓으면 자리 교환"].forEach((txt, i) => {
    const s = document.createElement("span");
    if (i === 1) { s.style.cssText = "font-weight:700;color:#c0392b"; }
    s.textContent = txt;
    hintEl.append(s);
  });

  const slotsArea = document.createElement("div");
  slotsArea.style.cssText = "display:flex;flex-wrap:wrap;gap:9px;justify-content:center";

  const errBanner = document.createElement("div");
  errBanner.style.cssText = `display:none;margin-top:12px;align-items:center;gap:9px;background:#ffd9d4;border:3px solid ${PX.red};padding:8px 14px;font-family:Galmuri11,monospace;font-size:13px;color:#c0392b`;
  errBanner.className = "banner-in";

  // 트레이 + 휴지통
  const trayRow = document.createElement("div");
  trayRow.style.cssText = "display:flex;gap:12px;margin-top:14px;align-items:stretch";

  const trayEl = document.createElement("div");
  trayEl.style.cssText = `flex:1;min-width:0;background:#fff8e6;border:3px solid ${PX.ink};box-shadow:3px 3px 0 ${PX.ink};padding:9px 14px`;
  trayEl.addEventListener("dragover", (e) => e.preventDefault());
  trayEl.addEventListener("drop", () => doDropTarget("tray"));

  const trayLbl = document.createElement("div");
  trayLbl.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#8a7d52;margin-bottom:7px";

  const trayList = document.createElement("div");
  trayList.style.cssText = `display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:${cw()*(CARD_H/CARD_W)}px;align-items:center`;

  trayEl.append(trayLbl, trayList);

  const trashEl = document.createElement("div");
  trashEl.style.cssText = `width:130px;flex:0 0 auto;border:3px dashed #b06b4a;background:#f5e7df;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px`;
  trashEl.addEventListener("dragover", (e) => { e.preventDefault(); setTrashOver(true); });
  trashEl.addEventListener("dragleave", () => setTrashOver(false));
  trashEl.addEventListener("drop", () => { setTrashOver(false); doDropTarget("trash"); });

  function setTrashOver(on) {
    trashEl.style.border = `3px ${on?"solid":"dashed"} ${on?PX.red:"#b06b4a"}`;
    trashEl.style.background = on ? "#ffe3e0" : "#f5e7df";
  }

  const trashIcon = document.createElement("span");
  trashIcon.style.fontSize = "30px"; trashIcon.textContent = "🗑️";
  const trashLbl = document.createElement("span");
  trashLbl.style.cssText = "font-family:Galmuri14,monospace;font-size:12px;color:var(--ink);text-align:center";
  trashLbl.textContent = "발표 자료 아님";
  const trashCount = document.createElement("span");
  trashCount.style.cssText = "font-family:Galmuri11,monospace;font-size:10px;color:#9a7d62;text-align:center";
  trashEl.append(trashIcon, trashLbl, trashCount);

  trayRow.append(trayEl, trashEl);

  // 보드 내 토스트
  const trapToast = document.createElement("div");
  trapToast.style.cssText = `position:absolute;left:50%;top:42%;transform:translateX(-50%);z-index:22;font-family:Galmuri14,monospace;font-size:14px;padding:9px 18px;border:3px solid ${PX.red};background:#ffe3e0;color:#b0341f;box-shadow:4px 4px 0 rgba(0,0,0,.22);white-space:nowrap;display:none`;

  const slowToast = document.createElement("span");
  slowToast.style.cssText = `position:absolute;left:50%;top:42%;transform:translateX(-50%);z-index:23;font-family:Galmuri14,monospace;font-size:15px;color:#7a5a2a;background:#fff3d6;border:2.5px solid ${PX.ink};padding:7px 16px;box-shadow:3px 3px 0 rgba(0,0,0,.22);display:none`;
  slowToast.className = "banner-in";
  slowToast.textContent = "🥵 느릿… 커서가 무겁다";

  const slipToast = document.createElement("span");
  slipToast.style.cssText = `position:absolute;left:50%;top:40%;transform:translateX(-50%);z-index:24;font-family:Galmuri14,monospace;font-size:16px;color:#fff;background:${PX.red};border:2.5px solid ${PX.ink};padding:7px 16px;box-shadow:3px 3px 0 rgba(0,0,0,.25);display:none`;
  slipToast.className = "slip-pop";
  slipToast.textContent = "✋ 미끄러졌다!";

  const jitterBar = document.createElement("span");
  jitterBar.style.cssText = `position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:23;font-family:Galmuri11,monospace;font-size:12.5px;color:#fff;background:rgba(29,31,46,.85);border:2px solid ${PX.ink};padding:4px 12px;white-space:nowrap;display:none`;
  jitterBar.textContent = "✋ 마우스 떨림! 카드가 자꾸 미끄러집니다 (10초)";

  const resultOverlay = document.createElement("div");
  resultOverlay.style.cssText = "position:absolute;inset:0;background:rgba(20,24,40,.5);display:none;align-items:center;justify-content:center;z-index:20";

  board.append(hintEl, slotsArea, errBanner, trayRow, trapToast, slowToast, slipToast, jitterBar, resultOverlay);

  fxWrap.append(titlebar, menubar, hud, board);
  gameContent.append(fxWrap);

  // 모드 칩
  const modeChip = document.createElement("div");
  modeChip.style.cssText = "display:flex;justify-content:center;margin-top:10px";
  const modeChipInner = document.createElement("span");
  modeChipInner.style.cssText = `font-family:Galmuri11,monospace;font-size:12px;color:${PX.ink};background:${PX.yellow};border:2px solid ${PX.ink};padding:3px 12px;box-shadow:2px 2px 0 ${PX.ink}`;
  modeChipInner.textContent = `${mode}장 모드${stress>=80?" · 스트레스 80↑ 부제 축약":""}`;
  modeChip.append(modeChipInner);

  monitorWrapper.append(makeMonitor(gameContent), modeChip);
  monitorScroll.append(monitorWrapper);
  room.append(monitorScroll);

  // 고정 오버레이들
  const bossOverlayEl = makeBossSilhouette({ direction: "right" });
  bossOverlayEl.hidden = true;

  const bossBannerEl = document.createElement("div");
  bossBannerEl.style.cssText = "position:fixed;left:0;right:0;top:15%;z-index:45;display:none;justify-content:center;pointer-events:none";
  bossBannerEl.className = "banner-in";

  const evSpeechEl = document.createElement("div");
  evSpeechEl.style.cssText = `position:fixed;top:70px;right:20%;z-index:47;max-width:320px;font-family:Galmuri14,monospace;font-size:15px;background:#fff;border:3px solid ${PX.ink};border-radius:14px;padding:11px 16px;box-shadow:4px 4px 0 rgba(0,0,0,.22);display:none`;
  evSpeechEl.className = "banner-in";

  const kakaoEl = document.createElement("div");
  kakaoEl.hidden = true;

  const evToastEl = document.createElement("div");
  evToastEl.style.cssText = `position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:48;font-family:Galmuri14,monospace;font-size:14px;padding:10px 20px;border:3px solid ${PX.red};background:#ffe3e0;color:#b0341f;box-shadow:4px 4px 0 rgba(0,0,0,.22);white-space:nowrap;display:none`;
  evToastEl.className = "banner-in";

  shell.append(room, bossOverlayEl, bossBannerEl, evSpeechEl, kakaoEl, evToastEl);
  root.append(shell);

  // ── 헬퍼 ──────────────────────────────────────────────────────
  function refreshFxClass() {
    const c=[];
    if (stress>=70) c.push("fx-gray");
    if (state.stats.health<=30) c.push("fx-shake");
    if (state.counters.coffeeStreak>=2||run.evJitter) c.push("fx-jitter");
    fxWrap.className = c.join(" ");
  }

  function updateProgressChips() {
    const placed = mg.order.filter((id) => typeof place[id]==="number").length;
    const hasErr = run.marks && Object.values(run.marks).some((v)=>v==="wrong");
    progressChipsWrap.replaceChildren(makeProgressChips(placed, mg.order.length, hasErr));
  }

  function updateWrongPill() {
    wrongPill.textContent = `오답 ${run.wrongCount}/${mg.wrongMax}`;
    wrongPill.style.background = run.wrongCount>=mg.wrongMax-1 ? "#ffd9d4" : "#fff3c4";
    wrongPill.style.color = run.wrongCount>=mg.wrongMax-1 ? "#c0392b" : "#8a6d12";
  }

  function updateTimerDisplay() {
    timerNum.textContent = "0:" + String(Math.max(0,run.time)).padStart(2,"0");
    const danger = run.time <= 10 && run.phase === "play";
    timerPill.style.background = danger ? PX.red : "#fff";
    timerPill.style.color = danger ? "#fff" : PX.ink;
    timerPill.className = danger ? "px-timer danger" : "px-timer";
    timerIcon.textContent = "⏱";
  }

  function showFloat(text) {
    floatEl.textContent = text;
    floatEl.hidden = false;
    clearTimeout(run.floatTimer);
    run.floatTimer = setTimeout(() => { floatEl.hidden = true; }, 1300);
  }

  function updateSlots() {
    const w = cw();
    const firstEmpty = run.dragId!=null ? mg.order.findIndex((_,i) => !slotOf(i)) : -1;

    slotsArea.replaceChildren();
    mg.order.forEach((correctId, i) => {
      const wrapper = document.createElement("div");
      wrapper.className = "mg-slot-wrapper";

      wrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (run.overSlot !== i) {
          if (run.overSlot != null) {
            const prev = slotsArea.children[run.overSlot];
            if (prev) prev.classList.remove("drag-over");
          }
          run.overSlot = i;
          wrapper.classList.add("drag-over");
        }
      });
      wrapper.addEventListener("dragleave", (e) => {
        if (wrapper.contains(e.relatedTarget)) return;
        if (run.overSlot === i) run.overSlot = null;
        wrapper.classList.remove("drag-over");
      });
      wrapper.addEventListener("drop", () => {
        wrapper.classList.remove("drag-over");
        run.overSlot = null;
        doDropTarget(i);
      });

      updateOneSlot(wrapper, i, w, firstEmpty===i);
      slotsArea.append(wrapper);
    });

    const hasErr = run.marks && Object.values(run.marks).some((v)=>v==="wrong");
    if (hasErr) {
      const errs = Object.values(run.marks).filter((v)=>v==="wrong").length;
      errBanner.style.display = "flex";
      errBanner.textContent = "";
      const icon = document.createElement("span");
      icon.style.fontSize = "17px"; icon.textContent = "⚠️";
      const msg = document.createElement("span");
      msg.textContent = `오류 ${errs}개 · 빨간 슬라이드의 자리를 서로 바꿔 고쳐보세요`;
      errBanner.append(icon, msg);
    } else {
      errBanner.style.display = "none";
    }

    updateProgressChips();
  }

  function updateOneSlot(wrapper, i, w, snap) {
    wrapper.replaceChildren();
    const s = slotOf(i);
    if (s) {
      const mark = run.marks ? run.marks[i] : null;
      const card = makeSlideCard(s, {
        n: i+1, mark, clipSub: stress>=80,
        canDrag: run.phase==="play" && run.lockId!==s.id,
        locked: run.lockId===s.id,
        fresh: s.fresh,
        titleBlur: state.stats.health<=30,
        w,
      });
      card.addEventListener("dragstart", (e) => { e.stopPropagation(); run.dragId=s.id; updateSnapHints(); });
      card.addEventListener("dragend", () => { run.dragId=null; updateSnapHints(); });
      wrapper.append(card);
    } else {
      const el = makeEmptySlotEl(i+1, w);
      if (snap) el.classList.add("snap");
      wrapper.append(el);
    }
  }

  function updateSnapHints() {
    const w = cw();
    const firstEmpty = run.dragId!=null ? mg.order.findIndex((_,i)=>!slotOf(i)) : -1;
    for (let i=0;i<mg.order.length;i++) {
      const wrapper = slotsArea.children[i];
      if (!wrapper) continue;
      const emptyEl = wrapper.querySelector(".mg-empty-slot");
      if (!emptyEl) continue;
      const isSnap = run.dragId!=null && run.overSlot==null && i===firstEmpty;
      emptyEl.classList.toggle("snap", isSnap);
    }
  }

  function updateTray() {
    const w = cw();
    const trayIds = mg.trayOrder.filter((id) => place[id]==="tray");
    trayLbl.textContent = `🗂 카드 더미 · 정답+함정 섞임 · 남은 ${trayIds.length}장`;
    trayList.style.minHeight = `${w*(CARD_H/CARD_W)}px`;
    trayList.replaceChildren();
    if (trayIds.length===0) {
      const e = document.createElement("span");
      e.style.cssText = "font-family:Galmuri11,monospace;font-size:13px;color:#b3a08a";
      e.textContent = "카드 더미가 비었어요";
      trayList.append(e);
    } else {
      trayIds.forEach((id) => {
        const s = byId(id);
        if (!s) return;
        const card = makeSlideCard(s, {
          clipSub: stress>=80,
          canDrag: run.phase==="play" && run.lockId!==id,
          locked: run.lockId===id,
          fresh: s.fresh,
          titleBlur: state.stats.health<=30,
          w,
        });
        card.addEventListener("dragstart", (e) => { e.stopPropagation(); run.dragId=id; });
        card.addEventListener("dragend", () => { run.dragId=null; });
        trayList.append(card);
      });
    }
  }

  function updateTrashCount() {
    const left = mg.traps.filter((t) => place[t.id]!=="trash").length;
    trashCount.textContent = `함정 ${left}장 남음`;
  }

  function updateBoard() {
    updateSlots();
    updateTray();
    updateWrongPill();
    updateTrashCount();
  }

  // ── 채점 ──
  function checkMarksAndAutoFinish() {
    const allPlaced = mg.order.every((id) => typeof place[id]==="number");
    if (!allPlaced) { if(run.marks){run.marks=null;updateSlots();} return; }
    const m={}; let errors=0;
    mg.order.forEach((correctId,i) => {
      const placed = mg.order.find((x) => place[x]===i);
      if (placed===correctId) m[i]="ok"; else { m[i]="wrong"; errors++; }
    });
    run.marks=m; updateSlots();
    const trapsCleared = mg.traps.every((t) => place[t.id]==="trash");
    if (errors===0 && trapsCleared) { clearTimeout(run.gradeTimer); run.gradeTimer=setTimeout(finish,700); }
  }

  // ── 드래그앤드롭 ──
  function placeInSlot(dragId, target) {
    const from = place[dragId];
    const occupant = mg.all.find((s) => place[s.id]===target && String(s.id)!==String(dragId));
    place[dragId]=target;
    if (occupant) place[occupant.id]=from;
  }

  function penalty(answerTrash) {
    run.time = Math.max(0, run.time-3);
    run.wrongCount++;
    showFloat("-3초");
    const msg = answerTrash ? "❌ 발표에 필요한 자료예요! 되돌립니다" : TRAP_MSGS[Math.floor(Math.random()*TRAP_MSGS.length)];
    trapToast.textContent=msg; trapToast.style.display="block";
    clearTimeout(run.trapTimer); run.trapTimer=setTimeout(()=>{trapToast.style.display="none";},1500);
    updateWrongPill(); updateTimerDisplay();
  }

  function doDropTarget(target) {
    const dragId = run.dragId;
    run.dragId=null; run.overSlot=null;
    if (dragId == null || run.phase!=="play") return;
    const item = byId(dragId);
    if (!item) return;
    if (run.lockId!==null && String(run.lockId)===String(dragId)) return;

    if (target==="trash") {
      if (item.isTrap) place[dragId]="trash";
      else { penalty(true); place[dragId]="tray"; }
      updateBoard(); checkMarksAndAutoFinish(); return;
    }
    if (target==="tray") {
      place[dragId]="tray"; updateBoard();
      if (run.marks) { run.marks=null; } return;
    }
    if (typeof target==="number") {
      if (item.isTrap) { penalty(false); place[dragId]="tray"; updateBoard(); return; }
      if (run.evJitter) {
        place[dragId]="tray";
        slipToast.style.display="block"; clearTimeout(run.slipTimer); run.slipTimer=setTimeout(()=>{slipToast.style.display="none";},850);
        updateBoard(); return;
      }
      if (stress>=70 || run.bossWatching) {
        const did=String(dragId);
        slowToast.textContent = run.bossWatching ? "👀 상사가 보고 있다… 손이 굳는다" : "🥵 느릿… 커서가 무겁다";
        slowToast.style.display="block";
        clearTimeout(run.slowTimer); run.slowTimer=setTimeout(()=>{
          slowToast.style.display="none"; placeInSlot(did,target);
          updateBoard(); checkMarksAndAutoFinish();
        },650); return;
      }
      placeInSlot(dragId, target); updateBoard(); checkMarksAndAutoFinish();
    }
  }

  // ── 타이머 ──
  function startTimer() {
    run.timerInterval = setInterval(() => {
      if (run.done||run.phase!=="play") return;
      run.time=Math.max(0,run.time-1);
      updateTimerDisplay();
      const elapsed=60-run.time;
      if (elapsed>0 && elapsed%10===0 && !run.firedPoints[elapsed]) {
        run.firedPoints[elapsed]=true;
        fireEvent(pickNextEvent());
      }
      if (run.time<=0) { clearInterval(run.timerInterval); finish(); }
    },1000);
  }

  function pickNextEvent() {
    let pool = ALL_EVENTS.filter((t)=>!run.usedEvents[t]);
    if (pool.length===0) { run.usedEvents={}; pool=ALL_EVENTS.slice(); }
    const pick = pool[Math.floor(Math.random()*pool.length)];
    run.usedEvents[pick]=true; return pick;
  }

  // ── 이벤트 ──
  function fireEvent(type) {
    const speakOf = { addSlide:"한 장 더 넣어주세요 📎", timeCut:"발표 시간 10분 줄였어요 ⏱️", lock:"이 슬라이드 다시 검토해보세요 🔒", signature:"잠깐... 슬라이드 순서가 이렇게 돼야하지 않나...?", chat:"어제 그 드라마 봤어요~? 📺", lunch:"오늘 점심 뭐 먹을래요? 🍱" };

    if (type==="timeCut") { run.time=Math.max(0,run.time-10); showFloat("-10초"); updateTimerDisplay(); }
    if (type==="jitter") {
      run.evJitter=true; jitterBar.style.display="block"; refreshFxClass();
      showEvToast("✋ 손이 떨린다…! 10초간 카드가 미끄러집니다");
      clearTimeout(run.jitterTimer); run.jitterTimer=setTimeout(()=>{ run.evJitter=false; jitterBar.style.display="none"; refreshFxClass(); },10000);
    }
    if (type==="addSlide") {
      const nid=mg.slides.length;
      const ns={ id:nid, title:"위험 요소", sub:"리스크 정리", kind:"problem", fresh:true };
      const k=1+Math.floor(Math.random()*(mg.order.length-1));
      mg.order.splice(k,0,nid); mg.slides.push(ns); mg.all.push(ns);
      mg.trayOrder.splice(Math.floor(Math.random()*(mg.trayOrder.length+1)),0,nid);
      place[nid]="tray"; updateBoard();
      setTimeout(()=>{ ns.fresh=false; updateTray(); },3000);
    }
    if (type==="addTrap") {
      const tid=`t${mg.traps.length+9}`;
      const nt={ id:tid, title:"옆 부서 발표자료", sub:"우리 발표와 무관", kind:"status", isTrap:true, fresh:true };
      mg.traps.push(nt); mg.all.push(nt);
      mg.trayOrder.splice(Math.floor(Math.random()*(mg.trayOrder.length+1)),0,tid);
      place[tid]="tray"; updateBoard();
      showEvToast("📧 옆 부서에서 메일로 자료를 보냈어요 — 카드 더미에 섞였습니다!");
      setTimeout(()=>{ nt.fresh=false; updateTray(); },3000);
    }
    if (type==="lock") {
      const allPlaced=mg.order.every((id)=>typeof place[id]==="number");
      let cands;
      if (!allPlaced) {
        // 미배치 상태: 트레이에 남은 정답 슬라이드(함정 제외) 중 랜덤
        cands=mg.order.filter((id)=>place[id]==="tray");
        if (!cands.length) cands=mg.order.slice();
      } else {
        // 전부 배치됨: 잘못된 위치에 있는 슬라이드 중 랜덤
        cands=mg.order.filter((id,ci)=>typeof place[id]==="number" && place[id]!==ci);
        if (!cands.length) cands=mg.order.filter((id)=>typeof place[id]==="number");
      }
      run.lockId=cands[Math.floor(Math.random()*cands.length)];
      updateBoard(); clearTimeout(run.lockTimer); run.lockTimer=setTimeout(()=>{ run.lockId=null; updateBoard(); },5000);
    }
    if (type==="shuffle2"||type==="signature") {
      const placed=mg.order.filter((id)=>typeof place[id]==="number");
      if (placed.length>=2) {
        const arr=type==="signature"?placed:shuffled(placed).slice(0,2);
        const sh=shuffled(arr.map((id)=>place[id]));
        arr.forEach((id,k)=>{ place[id]=sh[k]; });
        if (type==="signature") { run.time=Math.max(0,run.time-3); showFloat("-3초"); updateTimerDisplay(); }
        else showEvToast("어? 슬라이드 순서가 바뀌었네... 😱");
        updateBoard(); checkMarksAndAutoFinish();
      }
    }
    if (speakOf[type]) setBoss(true);
    if (speakOf[type] && !["kakao","dinner"].includes(type)) {
      evSpeechEl.textContent=speakOf[type]; evSpeechEl.style.display="block";
      clearTimeout(run.evTimer); run.evTimer=setTimeout(()=>{ evSpeechEl.style.display="none"; setBoss(false); },3000);
    }
    if (type==="kakao") {
      kakaoEl.replaceChildren();
      kakaoEl.append(makeKakaoWin({ title:"까까오톡 PC", onClose:()=>{ kakaoEl.replaceChildren(); kakaoEl.hidden=true; }, styleStr:`top:16%;right:8%`,
        msgs:[["😤","김팀장","지금 어디까지 됐어요?"],["😤","김팀장","오늘 안에 끝나죠?"],["😤","김팀장","검토 빨리 부탁해요"]] }));
      kakaoEl.hidden=false;
    }
    if (type==="dinner") {
      kakaoEl.replaceChildren();
      kakaoEl.append(makeKakaoWin({ title:"까까오톡 PC · 우리팀 단톡방", votes:true, onClose:()=>{ kakaoEl.replaceChildren(); kakaoEl.hidden=true; }, styleStr:`top:14%;left:50%;transform:translateX(-50%);width:410px`,
        msgs:[["🙂","이대리","🍻 오늘 회식 메뉴 투표 좀!"],["😀","박사원","저는 고기 당겨요"],["😋","최주임","아무거나 다 좋아요~"]] }));
      kakaoEl.hidden=false;
    }
    if (type==="lunch") { evSpeechEl.textContent="오늘 점심 뭐 먹을래요? 🍱"; evSpeechEl.style.display="block"; clearTimeout(run.evTimer); run.evTimer=setTimeout(()=>{ evSpeechEl.style.display="none"; },3000); }
  }

  function setBoss(on) {
    bossOverlayEl.hidden=!on;
    run.bossWatching=on;
    refreshFxClass();
    if (on) {
      bossBannerEl.style.display="flex";
      bossBannerEl.replaceChildren();
      const card = document.createElement("div");
      card.style.cssText = `width:480px;max-width:84%;background:#fff;border:3px solid ${PX.red};box-shadow:5px 5px 0 rgba(0,0,0,.22);padding:12px 18px;display:flex;flex-direction:column;gap:6px`;
      const top = document.createElement("div");
      top.style.cssText = "display:flex;align-items:center;gap:8px";
      const warn = document.createElement("span");
      warn.style.fontSize="20px"; warn.textContent="⚠️";
      const title = document.createElement("span");
      title.style.cssText = `font-family:Galmuri14,monospace;font-size:16px;color:${PX.red}`;
      title.textContent = "상사가 내 자리 옆에 서 있다…";
      top.append(warn, title);
      const desc = document.createElement("span");
      desc.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#4a4636";
      desc.textContent = "아무 말 없이 모니터만 보고 있다. 난이도가 일시적으로 상승한다.";
      card.append(top, desc);
      bossBannerEl.append(card);
      clearTimeout(run.bossTimer); run.bossTimer=setTimeout(()=>{ bossBannerEl.style.display="none"; },3000);
    } else {
      bossBannerEl.style.display="none";
    }
  }

  function showEvToast(msg) {
    evToastEl.textContent=msg; evToastEl.style.display="block";
    clearTimeout(run.evToastTimer); run.evToastTimer=setTimeout(()=>{ evToastEl.style.display="none"; },3000);
  }

  // ── 종료 ──
  function finish() {
    if (run.done||run.phase!=="play") return;
    run.done=true; run.phase="result";
    clearInterval(run.timerInterval); clearTimeout(run.gradeTimer);
    const m={}; let errors=0;
    mg.order.forEach((correctId,i) => {
      const placed=mg.order.find((x)=>place[x]===i);
      if (placed===correctId) m[i]="ok"; else { m[i]="wrong"; errors++; }
    });
    const trapsLeft=mg.traps.filter((t)=>place[t.id]!=="trash").length;
    const total=errors+trapsLeft;
    const tier=total<=1?"success":total<=3?"partial":"fail";
    run.marks=m; updateSlots();
    showResult(tier, errors, trapsLeft, 60-run.time);
  }

  function showResult(tier, errors, trapsLeft, usedSec) {
    const TIERS = {
      success:{ title:"회의 준비 완료!", emoji:"🎉", bg:"#eafae8", color:PX.green, deltas:[{label:"업무량",v:-20}] },
      partial:{ title:"아슬아슬하게 마쳤다…", emoji:"😮‍💨", bg:"#fff3df", color:"#c98a2a", deltas:[{label:"업무량",v:-10},{label:"스트레스",v:8}] },
      fail:   { title:"회의 준비 망했다…", emoji:"💀", bg:"#f6e3e0", color:PX.red, deltas:[{label:"업무량",v:-3},{label:"스트레스",v:20},{label:"체력",v:-8}] },
    };
    const t=TIERS[tier];
    const card = document.createElement("div");
    card.className = "pop-in";
    const panel = document.createElement("div");
    panel.style.cssText = `width:440px;max-width:84%;background:${t.bg};border:4px solid ${PX.ink};box-shadow:6px 6px 0 rgba(29,31,46,.35);padding:20px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px`;
    const emojiEl = document.createElement("div");
    emojiEl.style.cssText = "font-size:46px;line-height:1";
    emojiEl.textContent = t.emoji;
    const titleEl = document.createElement("div");
    titleEl.style.cssText = `font-family:Galmuri14,monospace;font-size:22px;color:${t.color}`;
    titleEl.textContent = t.title;
    const statsRow = document.createElement("div");
    statsRow.style.cssText = "display:flex;gap:8px";
    [["오류",errors,"개"],["소요",usedSec,"초"]].forEach(([lbl,v,unit]) => {
      const s = document.createElement("span");
      s.style.cssText = `font-family:Galmuri11,monospace;font-size:12.5px;background:#fff;border:2px solid ${PX.ink};padding:3px 11px`;
      s.textContent = `${lbl} ${v}${unit}`;
      statsRow.append(s);
    });
    const deltaRow = document.createElement("div");
    deltaRow.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;justify-content:center";
    t.deltas.forEach((d) => {
      const s = document.createElement("span");
      s.style.cssText = `font-family:Galmuri11,monospace;font-size:13px;border:2px solid ${PX.ink};padding:4px 12px;background:${d.v<0?"#d7f3d4":"#ffdcd4"};color:${d.v<0?"#1f8a2e":"#c0392b"}`;
      s.textContent = `${d.label} ${d.v<0?"▼":"▲"}${Math.abs(d.v)}`;
      deltaRow.append(s);
    });
    const nextBtn = document.createElement("div");
    nextBtn.style.cssText = "margin-top:4px;cursor:pointer";
    const btnInner = document.createElement("div");
    btnInner.style.cssText = `background:${PX.yellow};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:10px 22px;font-family:Galmuri14,monospace;font-size:19px;color:${PX.ink};display:inline-flex;align-items:center;gap:8px`;
    btnInner.textContent = "다음으로 ▶";
    btnInner.addEventListener("click", () => { cleanup(); actions.applyResult(tier, `회의 준비 ${tier}: 오류 ${errors}개`); });
    nextBtn.append(btnInner);
    panel.append(emojiEl, titleEl, statsRow, deltaRow, nextBtn);
    card.append(panel);
    resultOverlay.replaceChildren(card);
    resultOverlay.style.display="flex";
  }

  function cleanup() {
    clearInterval(run.timerInterval);
    [run.gradeTimer,run.lockTimer,run.jitterTimer,run.slowTimer,run.floatTimer,run.trapTimer,run.evToastTimer,run.slipTimer,run.evTimer,run.bossTimer].forEach(clearTimeout);
  }

  // ── 초기화 ──
  updateBoard();
  updateTimerDisplay();
  startTimer();
}
