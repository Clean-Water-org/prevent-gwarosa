// pixel-office.js — 픽셀아트 오피스 비주얼 공통 컴포넌트 (회의 준비 미니게임 스타일 기준)
//
// 회의 준비 프로토타입(meeting.js)에서 추출한 "오피스 룸 + CHADOL-TRON 모니터" 비주얼을
// 다른 씬(메인 업무화면 등)에서도 재사용하기 위해 공통화했다.
// PX 색상 팔레트, 픽셀 소품(창문·시계·화분·머그컵), 모니터 베젤이 포함된다.

export const PX = { ink: "#1d1f2e", red: "#ff4d4d", green: "#3fc24a", blue: "#3d8bff", yellow: "#ffd23f", white: "#fdfcf2" };

// ── 오피스 룸 배경 ──────────────────────────────────────────────────
export function makeOfficeRoom() {
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

  return room;
}

// ── 픽셀 소품 ──────────────────────────────────────────────────────
export function makePixWindow() {
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

export function makePixClock() {
  const d = document.createElement("div");
  d.style.cssText = `width:56px;height:56px;border-radius:50%;border:3px solid ${PX.ink};background:${PX.white};box-shadow:3px 3px 0 ${PX.ink};position:relative`;
  const h = document.createElement("span");
  h.style.cssText = `position:absolute;left:50%;top:50%;width:3px;height:16px;background:${PX.ink};transform:translate(-50%,-100%)`;
  const m = document.createElement("span");
  m.style.cssText = `position:absolute;left:50%;top:50%;width:12px;height:3px;background:${PX.ink};transform:translate(-2px,-50%)`;
  d.append(h, m);
  return d;
}

export function makePixPlant() {
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

export function makePixMug() {
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

// ── 기본 소품 배치 (회의 준비 프로토타입과 동일한 좌표) ────────────
export function appendDefaultRoomProps(room) {
  [
    [makePixWindow, "position:absolute;left:34px;top:26px"],
    [makePixClock,  "position:absolute;right:52px;top:30px"],
    [makePixPlant,  "position:absolute;right:36px;bottom:14px"],
    [makePixMug,    "position:absolute;left:56px;bottom:20px"],
  ].forEach(([fn, css]) => {
    const p = fn();
    p.style.cssText = (p.style.cssText ? p.style.cssText + ";" : "") + css;
    room.append(p);
  });
}

// ── CHADOL-TRON 모니터 베젤 ────────────────────────────────────────
export function makeMonitor(content, { brand = "CHADOL-TRON", led = PX.green } = {}) {
  const bezel = document.createElement("div");
  bezel.className = "px-monitor-bezel";
  bezel.style.cssText = `width:100%;background:linear-gradient(#efe7d2,#ddd2b6);border:4px solid ${PX.ink};border-radius:14px;box-shadow:7px 8px 0 rgba(29,31,46,.35);padding:16px 16px 26px;position:relative;image-rendering:pixelated`;

  const screen = document.createElement("div");
  screen.className = "px-monitor-screen";
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
  const brandEl = document.createElement("span");
  brandEl.style.cssText = "font-family:Galmuri11,monospace;font-size:11px;color:#9a8f72;letter-spacing:2px";
  brandEl.textContent = brand;
  const ledEl = document.createElement("span");
  ledEl.style.cssText = `width:9px;height:9px;border-radius:50%;background:${led};border:2px solid ${PX.ink}`;
  label.append(brandEl, ledEl);
  bezel.append(label);

  const stand1 = document.createElement("div");
  stand1.style.cssText = `width:120px;height:16px;background:${PX.ink};margin:0 auto`;
  const stand2 = document.createElement("div");
  stand2.style.cssText = `width:200px;height:12px;background:${PX.ink};border-radius:0 0 6px 6px;box-shadow:4px 4px 0 rgba(29,31,46,.25);margin:0 auto`;

  const wrapper = document.createElement("div");
  wrapper.className = "px-monitor";
  wrapper.append(bezel, stand1, stand2);
  return wrapper;
}
