// mg2-game.jsx — 미니게임2 실제 게임 화면 (픽셀아트) · A안(레트로 CRT) / B안(모던 플랫)
// 상태: ① 배치 중 / ② 오류 표시(자동 채점) / ③ 클리어
// pixel-kit.jsx 의 window 전역 컴포넌트 사용.

// 정답 순서: 1목차 2현황 3문제점 4개선안 5기대효과 6마무리
const SL = {
  agenda:   { kind: "agenda",   title: "목차" },
  status:   { kind: "status",   title: "현황 분석" },
  problem:  { kind: "problem",  title: "문제점" },
  solution: { kind: "solution", title: "개선안" },
  effect:   { kind: "effect",   title: "기대효과" },
  plan:     { kind: "plan",     title: "실행 일정" },
  closing:  { kind: "closing",  title: "마무리" },
};

// ───────── 픽셀 오피스 소품 ─────────
function PixWindow({ style }) {
  return (
    <div style={{ width: 150, height: 104, border: "3px solid var(--ink)", background: "#7ec8ff", boxShadow: "4px 4px 0 var(--ink)", position: "relative", imageRendering: "pixelated", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#aee0ff 0 40%,#7ec8ff 40%)" }} />
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: "var(--ink)", transform: "translateX(-1px)" }} />
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 3, background: "var(--ink)", transform: "translateY(-1px)" }} />
      <div style={{ position: "absolute", right: 10, top: 8, width: 16, height: 16, borderRadius: "50%", background: "#fff3a8", border: "2px solid var(--ink)" }} />
    </div>
  );
}
function PixClock({ style }) {
  return (
    <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--ink)", background: "#fdfcf2", boxShadow: "3px 3px 0 var(--ink)", position: "relative", ...style }}>
      <span style={{ position: "absolute", left: "50%", top: "50%", width: 3, height: 16, background: "var(--ink)", transform: "translate(-50%,-100%)" }} />
      <span style={{ position: "absolute", left: "50%", top: "50%", width: 12, height: 3, background: "var(--ink)", transform: "translate(-2px,-50%)" }} />
    </div>
  );
}
function PixPlant({ style }) {
  return (
    <div style={{ position: "relative", width: 56, height: 70, ...style }}>
      <div style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
        <span style={{ width: 14, height: 40, background: "#3fc24a", border: "2px solid var(--ink)", borderRadius: "60% 0 60% 0", transform: "rotate(-12deg)" }} />
        <span style={{ width: 14, height: 48, background: "#5ad65f", border: "2px solid var(--ink)", borderRadius: "60% 60% 0 0" }} />
        <span style={{ width: 14, height: 40, background: "#3fc24a", border: "2px solid var(--ink)", borderRadius: "0 60% 0 60%", transform: "rotate(12deg)" }} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 38, height: 26, background: "#e0703a", border: "3px solid var(--ink)", borderRadius: "0 0 6px 6px", boxShadow: "3px 3px 0 var(--ink)" }} />
    </div>
  );
}
function PixMug({ style }) {
  return (
    <div style={{ position: "relative", width: 38, height: 32, ...style }}>
      <div style={{ width: 30, height: 30, background: "#ff6f59", border: "3px solid var(--ink)", borderRadius: "3px 3px 7px 7px", boxShadow: "3px 3px 0 var(--ink)" }} />
      <div style={{ position: "absolute", right: -8, top: 6, width: 12, height: 14, border: "3px solid var(--ink)", borderLeft: "none", borderRadius: "0 8px 8px 0" }} />
      <div style={{ position: "absolute", left: 7, top: -7, width: 3, height: 8, background: "#cfd6e2" }} />
      <div style={{ position: "absolute", left: 16, top: -9, width: 3, height: 10, background: "#cfd6e2" }} />
    </div>
  );
}
function StickyNote({ children, color, rot, style }) {
  return (
    <div style={{ width: 64, height: 58, background: color || "#ffe66d", border: "2px solid var(--ink)", boxShadow: "2px 2px 0 rgba(0,0,0,.25)", transform: `rotate(${rot || -4}deg)`, padding: 6, fontFamily: "var(--px-body)", fontSize: 10.5, color: "var(--ink)", lineHeight: 1.35, ...style }}>{children}</div>
  );
}

// ───────── 모니터 베젤 ─────────
function Monitor({ variant, children }) {
  const retro = variant === "retro";
  return (
    <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* 베젤 */}
      <div style={{
        width: "100%",
        background: retro ? "linear-gradient(#efe7d2,#ddd2b6)" : "linear-gradient(#2a2e3f,#1a1d2a)",
        border: "4px solid var(--ink)",
        borderRadius: retro ? 14 : 8,
        boxShadow: "7px 8px 0 rgba(29,31,46,.35)",
        padding: retro ? "16px 16px 26px" : "12px 12px 16px",
        position: "relative",
        imageRendering: "pixelated",
      }}>
        {/* 화면 (스크린) */}
        <div style={{ border: "4px solid var(--ink)", borderRadius: retro ? 8 : 4, overflow: "hidden", background: "#dfe7f2", position: "relative" }}>
          {children}
          {retro && <div className="px-scanline" />}
          <div className="px-glare" />
        </div>
        {/* 베젤 디테일 */}
        {retro
          ? <div style={{ position: "absolute", bottom: 7, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--px-head)", fontSize: 11, color: "#9a8f72", letterSpacing: 2 }}>CHADOL-TRON</span>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3fc24a", border: "2px solid var(--ink)" }} />
            </div>
          : <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3d8bff" }} />
            </div>}
      </div>
      {/* 스탠드 */}
      <div style={{ width: retro ? 120 : 150, height: 16, background: "var(--ink)" }} />
      <div style={{ width: retro ? 200 : 230, height: 12, background: "var(--ink)", borderRadius: "0 0 6px 6px", boxShadow: "4px 4px 0 rgba(29,31,46,.25)" }} />
    </div>
  );
}

Object.assign(window, { SL, PixWindow, PixClock, PixPlant, PixMug, StickyNote, Monitor });
