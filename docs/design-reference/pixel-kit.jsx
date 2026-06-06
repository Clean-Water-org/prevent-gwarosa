// pixel-kit.jsx — 픽셀아트 공통 컴포넌트 (미니게임2 실제 게임 화면용)
// 색/폰트는 HTML <style> 의 :root 변수 사용. 모든 컴포넌트를 window 로 export.

const PX = {
  ink: "#1d1f2e",
  white: "#fdfcf2",
  red: "#ff4d4d",
  green: "#3fc24a",
  blue: "#3d8bff",
  yellow: "#ffd23f",
};

// 청크 픽셀 패널 (두꺼운 외곽선 + 하드 그림자)
function PxPanel({ children, bg, style, shadow, bw, inset, className, ...rest }) {
  return (
    <div
      className={"px " + (className || "")}
      style={{
        background: bg || PX.white,
        border: `${bw || 3}px solid var(--ink)`,
        boxShadow: shadow === false ? "none" : `${shadow || 5}px ${shadow || 5}px 0 var(--ink)`,
        imageRendering: "pixelated",
        position: "relative",
        ...style,
      }}
      {...rest}
    >
      {inset && <span style={{ position: "absolute", inset: 0, boxShadow: "inset 2px 2px 0 rgba(255,255,255,.5), inset -2px -2px 0 rgba(0,0,0,.18)", pointerEvents: "none" }} />}
      {children}
    </div>
  );
}

// 픽셀 버튼
function PxButton({ children, bg, style, small }) {
  return (
    <PxPanel bg={bg || PX.yellow} shadow={small ? 3 : 4}
      style={{ padding: small ? "6px 14px" : "10px 22px", fontFamily: "var(--px-head)", fontSize: small ? 15 : 19, color: "var(--ink)", display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", lineHeight: 1, ...style }}>
      {children}
    </PxPanel>
  );
}

// 게임 시계 픽셀 캡슐
function GameClock({ time }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--px-mono)" }}>
      <span style={{ fontSize: 16 }}>🕐</span>
      <span style={{ fontSize: 17, color: "var(--ink)", letterSpacing: 1 }}>{time || "13:20"}</span>
    </div>
  );
}

// 진행도 픽셀 칩 (6칸)
function ProgressChips({ done, total, warn }) {
  const t = total || 6;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap" }}>배치</span>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: t }).map((_, i) => (
          <span key={i} style={{ width: 13, height: 16, border: "2px solid var(--ink)", background: i < done ? (warn ? PX.red : PX.green) : "#fff", imageRendering: "pixelated" }} />
        ))}
      </div>
      <span style={{ fontFamily: "var(--px-mono)", fontSize: 14, color: "var(--ink)" }}>{done}/{t}</span>
    </div>
  );
}

// 제한시간 픽셀 타이머 (danger 시 깜빡임/흔들림 · paused 시 정지 표시)
function PxTimer({ s, danger, paused }) {
  return (
    <div className={danger && !paused ? "px-timer danger" : "px-timer"}
      style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--px-mono)", border: "2px solid var(--ink)", background: paused ? "#cbd2e0" : danger ? PX.red : "#fff", color: paused ? "#3a3f50" : danger ? "#fff" : "var(--ink)", padding: "3px 11px", imageRendering: "pixelated" }}>
      <span style={{ fontSize: 15 }}>{paused ? "⏸" : "⏱"}</span>
      <span style={{ fontSize: 20, letterSpacing: 1 }}>{paused ? "정지" : "0:" + (s || "47")}</span>
    </div>
  );
}

// 픽셀 미니 게이지 (업무량/스트레스/체력)
function PxGauge({ label, value, delta, color }) {
  const seg = 8;
  const filled = Math.round((value / 100) * seg);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 11, whiteSpace: "nowrap", width: 42 }}>{label}</span>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: seg }).map((_, i) => (
          <span key={i} style={{ width: 9, height: 12, border: "1.5px solid var(--ink)", background: i < filled ? (color || "var(--ink)") : "#fff", imageRendering: "pixelated" }} />
        ))}
      </div>
      <span style={{ fontFamily: "var(--px-mono)", fontSize: 12, width: 18 }}>{value}</span>
      {delta != null && <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: delta < 0 ? "#1f8a2e" : PX.red }}>{delta < 0 ? "▼" : "▲"}{Math.abs(delta)}</span>}
    </div>
  );
}

// ── 미니 PPT 썸네일 (진짜 슬라이드처럼: 제목줄 + 본문 비주얼) ───────────
function SlideContent({ kind }) {
  const wrap = { flex: 1, display: "flex", padding: "5px 7px", minHeight: 0 };
  if (kind === "agenda") {
    return (
      <div style={{ ...wrap, flexDirection: "column", gap: 4, justifyContent: "center" }}>
        {["01", "02", "03"].map((n) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: "var(--px-mono)", fontSize: 9, color: PX.blue }}>{n}</span>
            <span style={{ height: 5, background: "#c7cdd8", flex: 1 }} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "status") {
    const hs = [22, 34, 28, 44];
    return (
      <div style={{ ...wrap, alignItems: "flex-end", gap: 5, justifyContent: "center", paddingBottom: 8 }}>
        {hs.map((h, i) => (
          <span key={i} style={{ width: 11, height: h, background: PX.blue, border: "1.5px solid var(--ink)" }} />
        ))}
      </div>
    );
  }
  if (kind === "problem") {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span style={{ fontSize: 26 }}>📉</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ height: 5, width: 40, background: PX.red }} />
          <span style={{ height: 5, width: 30, background: "#c7cdd8" }} />
          <span style={{ height: 5, width: 36, background: "#c7cdd8" }} />
        </div>
      </div>
    );
  }
  if (kind === "solution") {
    return (
      <div style={{ ...wrap, flexDirection: "column", gap: 5, justifyContent: "center" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, background: PX.green, border: "1.5px solid var(--ink)", color: "#fff", fontSize: 8, lineHeight: "9px", textAlign: "center" }}>✓</span>
            <span style={{ height: 5, background: "#c7cdd8", flex: 1 }} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "effect") {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid var(--ink)", background: `conic-gradient(${PX.green} 0 62%, ${PX.yellow} 62% 100%)` }} />
        <span style={{ fontSize: 22 }}>📈</span>
      </div>
    );
  }
  if (kind === "plan") {
    return (
      <div style={{ ...wrap, flexDirection: "column", gap: 5, justifyContent: "center" }}>
        {[[0, 46], [10, 34], [22, 40]].map(([off, len], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontFamily: "var(--px-mono)", fontSize: 8, color: "#9aa3b5", width: 8 }}>{i + 1}</span>
            <span style={{ height: 7, background: "#e7ecf3", flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: off, width: len, top: 0, bottom: 0, background: PX.blue, border: "1px solid var(--ink)" }} />
            </span>
          </div>
        ))}
      </div>
    );
  }
  // closing
  return (
    <div style={{ ...wrap, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
      <span style={{ fontFamily: "var(--px-head)", fontSize: 12, color: "var(--ink)" }}>Q & A</span>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 9, color: "#888" }}>감사합니다</span>
    </div>
  );
}

// 슬라이드 카드. mark: 'ok' | 'wrong'. n: 순서번호. ghost: 빈 슬롯. drag: 손잡이.
function MiniSlide({ kind, title, n, mark, ghost, drag, w, dragging }) {
  const wrong = mark === "wrong";
  const ok = mark === "ok";
  const width = w || 150;
  if (ghost) {
    return (
      <div style={{ width, height: width * 0.78, border: "3px dashed #9aa3b5", background: "rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", position: "relative" }}>
        {n && <span style={{ position: "absolute", top: 4, left: 5, fontFamily: "var(--px-mono)", fontSize: 12, color: "#9aa3b5" }}>{n}</span>}
        <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#9aa3b5" }}>비어있음</span>
      </div>
    );
  }
  const bw = wrong ? 3 : ok ? 3 : 2.5;
  const bc = wrong ? PX.red : ok ? PX.green : "var(--ink)";
  return (
    <div style={{
      width, height: width * 0.78, background: PX.white, border: `${bw}px solid ${bc}`,
      boxShadow: dragging ? "7px 9px 0 rgba(29,31,46,.35)" : "3px 3px 0 var(--ink)",
      display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative",
      transform: wrong ? "rotate(-2deg)" : dragging ? "rotate(3deg) scale(1.04)" : undefined,
      imageRendering: "pixelated",
    }}>
      {/* 상태 배지 */}
      {wrong && <Badge bg={PX.red}>✗</Badge>}
      {ok && <Badge bg={PX.green}>✓</Badge>}
      {drag && <span style={{ position: "absolute", top: 3, right: 5, fontFamily: "var(--px-mono)", fontSize: 12, color: "#aab" }}>⠿</span>}
      {/* 제목 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderBottom: "2px solid var(--ink)", background: wrong ? "#ffe3e0" : ok ? "#e3f7e2" : "#eef2f8" }}>
        {n && <span style={{ fontFamily: "var(--px-mono)", fontSize: 11, color: "#fff", background: bc === "var(--ink)" ? "var(--ink)" : bc, padding: "0 4px", minWidth: 13, textAlign: "center" }}>{n}</span>}
        <span className="px-mini-title" style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      </div>
      <SlideContent kind={kind} />
    </div>
  );
}

function Badge({ children, bg }) {
  return (
    <span style={{ position: "absolute", top: -11, right: -10, width: 26, height: 26, borderRadius: "50%", background: bg, color: "#fff", border: "3px solid #fff", boxShadow: "0 0 0 2px var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--px-head)", fontSize: 13, zIndex: 3 }}>{children}</span>
  );
}

// 기획 설명용 파란 메모 (실제 게임 화면엔 안 나옴)
function Annot({ children, label, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "#e9f1fb", border: "2px dashed #7aa3cf", padding: "7px 13px", imageRendering: "pixelated", ...style }}>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#3f6fa5", flex: "0 0 auto", whiteSpace: "nowrap" }}>✎ {label}</span>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#3f6fa5", lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function Legend() {
  return (
    <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#3f6fa5", background: "#e9f1fb", border: "1.5px dashed #7aa3cf", padding: "2px 10px" }}>
      ✎ 파란 메모 = 기획 설명용 · 실제 게임엔 미표시
    </span>
  );
}

function WfTag({ children }) {
  return <div className="px-screentag">{children}</div>;
}

Object.assign(window, { PX, PxPanel, PxButton, GameClock, ProgressChips, PxTimer, PxGauge, MiniSlide, SlideContent, Badge, Annot, Legend, WfTag });
