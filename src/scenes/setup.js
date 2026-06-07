import { PLAYER_TYPES, startingInventory } from "../data/player-types.js";
import { playSfx } from "../lib/audio.js";

const CLICK_SFX = "assets/audio/computer-mouse-click.mp3";

const PX = { ink: "#1d1f2e", red: "#ff4d4d", green: "#3fc24a", blue: "#3d8bff", yellow: "#ffd23f", white: "#fdfcf2" };

// ── 픽셀 소품 (미니게임2와 동일) ──────────────────────────────────
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

// ── 증명사진 (성별 연동) — assets/portraits/{male,female}.svg 로드 ──
function makePixPortrait(gender) {
  const key = gender === "female" ? "female" : "male";
  const img = document.createElement("img");
  img.src = `assets/portraits/${key}.svg`;
  img.alt = key === "female" ? "여성 증명사진" : "남성 증명사진";
  img.style.cssText = "width:100%;height:100%;display:block;object-fit:cover;image-rendering:pixelated";
  return img;
}

// ── 픽셀 입력/버튼 헬퍼 ───────────────────────────────────────────
function flabel(text) {
  const s = document.createElement("span");
  s.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#5a5440";
  s.textContent = text;
  return s;
}
function styleSelectable(node, selected) {
  node.style.background = selected ? PX.yellow : "#fff";
  node.style.boxShadow = selected ? `3px 3px 0 ${PX.ink}` : "none";
  node.style.border = `${selected ? 3 : 2}px solid ${PX.ink}`;
}

// ══════════════════════════════════════════════════════════════════
export function renderSetup(root, state, actions) {
  const form = { name: "", gender: "male", type: "coffee" };

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

  // ── 입사 서류 (모니터 화면) ──
  const screen = document.createElement("div");
  screen.style.cssText = "position:relative";

  // 타이틀바
  const titlebar = document.createElement("div");
  titlebar.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:#3a6ea5;border-bottom:3px solid ${PX.ink}`;
  const titleLeft = document.createElement("span");
  titleLeft.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#fff";
  titleLeft.textContent = "📋 출근부_2026.hwp — 인사팀 전산";
  const wbtns = document.createElement("div");
  wbtns.style.cssText = "display:flex;gap:4px";
  ["_", "▢", "✕"].forEach((c) => {
    const b = document.createElement("span");
    b.style.cssText = `width:18px;height:16px;background:#d8d2c0;border:2px solid ${PX.ink};font-family:Galmuri11,monospace;font-size:11px;display:flex;align-items:center;justify-content:center;color:${PX.ink}`;
    b.textContent = c;
    wbtns.append(b);
  });
  titlebar.append(titleLeft, wbtns);

  // 문서 헤더
  const docHead = document.createElement("div");
  docHead.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:#ffe9a8;border-bottom:3px solid ${PX.ink}`;
  const docTitle = document.createElement("span");
  docTitle.style.cssText = "font-family:Galmuri14,monospace;font-size:16px;color:var(--ink)";
  docTitle.textContent = "📋 오늘의 출근부";
  const docCo = document.createElement("span");
  docCo.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:#7a5a2a";
  docCo.textContent = "과로사 방지 (주)";
  docHead.append(docTitle, docCo);

  // 본문 (종이)
  const body = document.createElement("div");
  body.style.cssText = "background:#fbfaf4;padding:16px 22px;display:flex;flex-direction:column;gap:14px";

  // 상단 2열: 증명사진 | 정보
  const cols = document.createElement("div");
  cols.style.cssText = "display:flex;gap:22px";

  // 좌: 증명사진
  const photoCol = document.createElement("div");
  photoCol.style.cssText = "width:150px;flex:0 0 auto;display:flex;flex-direction:column;gap:6px";
  const photoFrame = document.createElement("div");
  photoFrame.style.cssText = `width:150px;height:180px;border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};overflow:hidden;background:#dfe7f2`;
  photoCol.append(photoFrame);
  function updatePhoto() { photoFrame.replaceChildren(makePixPortrait(form.gender)); }

  // 우: 정보 열
  const info = document.createElement("div");
  info.style.cssText = "flex:1;min-width:0;display:flex;flex-direction:column;gap:11px";

  // 이름
  const nameWrap = document.createElement("div");
  nameWrap.style.cssText = "display:flex;flex-direction:column;gap:4px";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.maxLength = 12;
  nameInput.placeholder = "이름을 입력하세요";
  nameInput.style.cssText = `font-family:Galmuri11,monospace;font-size:14px;color:${PX.ink};background:#fff;border:2px solid ${PX.ink};padding:7px 10px;outline:none`;
  nameInput.addEventListener("input", () => { form.name = nameInput.value; });
  nameWrap.append(flabel("이름"), nameInput);

  // 성별
  const genderWrap = document.createElement("div");
  genderWrap.style.cssText = "display:flex;flex-direction:column;gap:5px";
  const genderRow = document.createElement("div");
  genderRow.style.cssText = "display:flex;gap:10px";
  const genderBtns = [];
  [["male", "👨 남성"], ["female", "👩 여성"]].forEach(([key, label]) => {
    const btn = document.createElement("div");
    btn.style.cssText = `flex:1;font-family:Galmuri11,monospace;font-size:14px;color:${PX.ink};padding:7px 10px;text-align:center;cursor:pointer`;
    btn.textContent = label;
    btn.addEventListener("click", () => { playSfx(CLICK_SFX); form.gender = key; updateGenderSel(); updatePhoto(); });
    genderBtns.push({ key, btn });
    genderRow.append(btn);
  });
  function updateGenderSel() { genderBtns.forEach(({ key, btn }) => styleSelectable(btn, form.gender === key)); }
  genderWrap.append(flabel("성별 — 선택 시 증명사진이 바뀝니다"), genderRow);

  // 유형
  const typeWrap = document.createElement("div");
  typeWrap.style.cssText = "display:flex;flex-direction:column;gap:5px";
  const typeRow = document.createElement("div");
  typeRow.style.cssText = "display:flex;gap:10px";
  const typeBtns = [];
  Object.entries(PLAYER_TYPES).forEach(([key, d]) => {
    const chip = document.createElement("div");
    chip.style.cssText = "flex:1;display:flex;align-items:center;gap:9px;padding:7px 12px;cursor:pointer";
    const em = document.createElement("span");
    em.style.cssText = "font-size:24px;line-height:1";
    em.textContent = d.emoji;
    const nm = document.createElement("span");
    nm.style.cssText = "font-family:Galmuri14,monospace;font-size:15px;color:var(--ink)";
    nm.textContent = d.name;
    const ht = document.createElement("span");
    ht.style.cssText = "font-family:Galmuri11,monospace;font-size:12px;color:#888;margin-left:auto";
    ht.textContent = d.hint;
    chip.append(em, nm, ht);
    chip.addEventListener("click", () => { playSfx(CLICK_SFX); form.type = key; updateTypeSel(); updateGuide(); updateItemNote(); });
    typeBtns.push({ key, chip });
    typeRow.append(chip);
  });
  function updateTypeSel() { typeBtns.forEach(({ key, chip }) => styleSelectable(chip, form.type === key)); }
  typeWrap.append(flabel("오늘의 컨디션 — 기본 아이템이 달라집니다"), typeRow);

  // 유형 가이드 패널
  const guide = document.createElement("div");
  guide.style.cssText = `background:#fff;border:2px solid ${PX.ink};padding:9px 13px;display:flex;flex-direction:column;gap:5px`;
  function updateGuide() {
    const d = PLAYER_TYPES[form.type];
    guide.replaceChildren();
    const head = document.createElement("div");
    head.style.cssText = "display:flex;align-items:center;gap:7px;border-bottom:1.5px dashed #ccc;padding-bottom:4px;margin-bottom:1px";
    const e = document.createElement("span"); e.style.fontSize = "18px"; e.textContent = d.emoji;
    const t = document.createElement("span"); t.style.cssText = "font-family:Galmuri14,monospace;font-size:14px;color:var(--ink)"; t.textContent = `${d.name} 가이드`;
    head.append(e, t);
    guide.append(head);
    d.rows.forEach((r) => {
      const warn = r.ic === "⚠️";
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:7px;align-items:baseline";
      const ic = document.createElement("span"); ic.style.fontSize = "13px"; ic.textContent = r.ic;
      const k = document.createElement("span"); k.style.cssText = `font-family:Galmuri11,monospace;font-size:12px;width:66px;flex:0 0 auto;color:${warn ? PX.red : "#777"}`; k.textContent = r.k;
      const v = document.createElement("span"); v.style.cssText = `font-family:Galmuri11,monospace;font-size:12.5px;color:${warn ? "#c0392b" : "var(--ink)"}`; v.textContent = r.v;
      row.append(ic, k, v);
      guide.append(row);
    });
  }

  info.append(nameWrap, genderWrap, typeWrap, guide);
  cols.append(photoCol, info);

  // 하단: 아이템 안내
  const itemBox = document.createElement("div");
  itemBox.style.cssText = `border:2px dashed ${PX.ink};background:#fbf9f2;padding:9px 14px;display:flex;flex-direction:column;gap:4px`;
  const itemHead = document.createElement("span");
  itemHead.style.cssText = "font-family:Galmuri14,monospace;font-size:14px;color:var(--ink)";
  itemHead.textContent = "🎒 아이템 안내 (슬롯 3칸 · 메인화면에서만 사용)";
  const itemStart = document.createElement("span");
  itemStart.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:var(--ink);padding-left:4px";
  const itemReward = document.createElement("span");
  itemReward.style.cssText = "font-family:Galmuri11,monospace;font-size:12.5px;color:var(--ink);padding-left:4px";
  itemReward.textContent = "보상 1칸 · 동료 이벤트로 획득 (예: 홍삼스틱 🧴)";
  const itemNote = document.createElement("span");
  itemNote.style.cssText = "font-family:Galmuri11,monospace;font-size:11.5px;color:#999;padding-left:4px";
  itemNote.textContent = "※ 효과는 메인화면에서 슬롯에 마우스를 올리면 안내 (호버 토글)";
  itemBox.append(itemHead, itemStart, itemReward, itemNote);
  function updateItemNote() {
    const d = PLAYER_TYPES[form.type];
    itemStart.textContent = `시작 2칸 · ${d.name === "커피파" ? "커피 ☕" : "담배 🚬"} + 유튜브 쇼츠 📱`;
  }

  // 하단 버튼
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;justify-content:flex-end;align-items:center;padding-top:2px";
  const submitBtn = document.createElement("div");
  submitBtn.style.cssText = "cursor:pointer";
  const submitInner = document.createElement("div");
  submitInner.style.cssText = `background:${PX.yellow};border:3px solid ${PX.ink};box-shadow:4px 4px 0 ${PX.ink};padding:10px 22px;font-family:Galmuri14,monospace;font-size:18px;color:${PX.ink};display:inline-flex;align-items:center;gap:8px`;
  submitInner.textContent = "서명하고 출근 →";
  submitBtn.append(submitInner);
  submitBtn.addEventListener("click", submit);
  btnRow.append(submitBtn);

  body.append(cols, itemBox, btnRow);
  screen.append(titlebar, docHead, body);
  wrapper.append(makeMonitor(screen));
  scroll.append(wrapper);
  room.append(scroll);
  shell.append(room);

  let toastTimer = null;
  function showToast(msg) {
    let toast = shell.querySelector(".setup-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "setup-toast";
      toast.style.cssText = `position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:90;font-family:Galmuri14,monospace;font-size:15px;padding:12px 24px;border:3px solid ${PX.red};background:#ffe3e0;color:#b0341f;box-shadow:4px 4px 0 rgba(0,0,0,.25);white-space:nowrap`;
      shell.append(toast);
    }
    toast.textContent = msg;
    toast.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = "none"; }, 2500);
  }

  function submit() {
    playSfx(CLICK_SFX);
    const name = form.name.trim();
    if (!name) {
      showToast("⚠️ 이름을 입력해야 출근할 수 있어요!");
      nameInput.focus();
      return;
    }
    actions.mutateState((draft) => {
      draft.player = { ...draft.player, name, gender: form.gender, type: form.type };
      draft.inventory = startingInventory(form.type);
      draft.scene = "commute";
      return draft;
    });
  }

  // 초기화
  updatePhoto();
  updateGenderSel();
  updateTypeSel();
  updateGuide();
  updateItemNote();
  root.append(shell);
  nameInput.focus();
}
