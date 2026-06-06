// wf-kit.jsx — 손그림 로파이 와이어프레임 공통 컴포넌트
// window 로 export 하여 다른 babel 스크립트에서 공유

// 스케치 박스 (불규칙 라운드 테두리로 손그림 느낌)
function SkBox({ children, style, r, dash, bg, bw, rot, className, ...rest }) {
  const radii = [
    "255px 15px 225px 15px/15px 225px 15px 255px",
    "15px 225px 15px 255px/225px 15px 255px 15px",
    "125px 18px 195px 22px/22px 175px 18px 215px",
  ];
  return (
    <div
      className={"sk " + (className || "")}
      style={{
        border: `${bw || 2.5}px ${dash ? "dashed" : "solid"} var(--ink)`,
        borderRadius: r || radii[(rot ? 1 : 0)],
        background: bg || "transparent",
        transform: rot ? `rotate(${rot}deg)` : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// 손글씨 라벨/주석 (말풍선 화살표 톤)
function Note({ children, style, color }) {
  return (
    <div className="wf-note" style={{ color: color || "var(--marker)", ...style }}>
      {children}
    </div>
  );
}

// 이미지/일러스트 플레이스홀더 (사선 줄무늬 + 모노 캡션)
function Ph({ label, style, h }) {
  return (
    <div className="wf-ph" style={{ height: h, ...style }}>
      <span className="wf-ph-cap">{label}</span>
    </div>
  );
}

// 입력 필드 자리
function Field({ label, placeholder, style, w }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: w, ...style }}>
      {label && <span className="wf-flabel">{label}</span>}
      <SkBox style={{ padding: "12px 16px", minHeight: 30, display: "flex", alignItems: "center" }} bg="#fff">
        <span className="wf-fph">{placeholder}</span>
      </SkBox>
    </div>
  );
}

// 버튼
function SkBtn({ children, primary, style, small }) {
  return (
    <SkBox
      bg={primary ? "var(--accent)" : "#fff"}
      bw={primary ? 3 : 2.5}
      style={{
        padding: small ? "8px 18px" : "14px 30px",
        fontFamily: "var(--hand)",
        fontSize: small ? 20 : 26,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        whiteSpace: "nowrap",
        cursor: "default",
        boxShadow: primary ? "3px 4px 0 var(--ink)" : "2px 3px 0 rgba(0,0,0,.25)",
        ...style,
      }}
    >
      {children}
    </SkBox>
  );
}

// 스탯 바 (업무량/스트레스/체력)
function StatBar({ label, value, max, dir, color }) {
  const pct = Math.round((value / (max || 100)) * 100);
  const seg = 10;
  const filled = Math.round((pct / 100) * seg);
  return (
    <div className="wf-stat">
      <span className="wf-stat-l">{label}</span>
      <div className="wf-stat-track">
        {Array.from({ length: seg }).map((_, i) => (
          <span key={i} className="wf-stat-cell" style={{ background: i < filled ? (color || "var(--ink)") : "transparent" }} />
        ))}
      </div>
      <span className="wf-stat-v">{value}</span>
      {dir && <span className="wf-stat-dir">{dir}</span>}
    </div>
  );
}

// 인게임 상단 HUD (시계 + 3스탯 + 아이템)
function HUD({ time, work, stress, hp, items }) {
  return (
    <div className="wf-hud">
      <div className="wf-hud-top">
        <span className="wf-clock">🕐 {time || "13:20"}</span>
        <span className="wf-hud-name">[ 오늘의 직장인 · 김대리 ]</span>
        <div className="wf-hud-items">
          <span className="wf-flabel" style={{ fontSize: 16 }}>🎒</span>
          {(items || ["담배🚬", "커피☕", "쇼츠📱"]).map((it, i) => (
            <SkBox key={i} bg="#fff" style={{ padding: "4px 10px", fontSize: 17 }}>{it}</SkBox>
          ))}
        </div>
      </div>
      <div className="wf-hud-stats">
        <StatBar label="업무량" value={work ?? 60} dir="↓굿" />
        <StatBar label="스트레스" value={stress ?? 35} dir="↓굿" color="var(--marker)" />
        <StatBar label="체력" value={hp ?? 70} dir="↑굿" color="var(--blue)" />
      </div>
    </div>
  );
}

// 화면 프레임 (1280x720 페이퍼)
function Frame({ children, title, sub, accent }) {
  return (
    <div className="wf-frame" style={accent ? { "--accent": accent } : undefined}>
      {children}
    </div>
  );
}

// 타이머 캡슐
function Timer({ s }) {
  return (
    <SkBox bg="#fff" style={{ padding: "6px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 24 }}>⏱</span>
      <span style={{ fontFamily: "var(--hand)", fontSize: 30, fontWeight: 700 }}>00:{s || "47"}</span>
    </SkBox>
  );
}

// 화면 제목 띠 (와이어프레임용 라벨)
function Tag({ children, style }) {
  return <div className="wf-tag" style={style}>{children}</div>;
}

// 기획 설명용 주석 (파란 ✎ 메모 — 실제 게임 화면엔 안 나옴)
const ANNOT_BLUE = "#3f6fa5";
function Annot({ children, style, label }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "#e9f1fb", border: "2px dashed #7aa3cf", borderRadius: "12px 4px 12px 4px", padding: "7px 13px", ...style }}>
      <span style={{ fontFamily: "var(--pen)", fontSize: 18, fontWeight: 700, color: ANNOT_BLUE, flex: "0 0 auto", whiteSpace: "nowrap" }}>✎ {label || "설명"}</span>
      <span style={{ fontFamily: "var(--pen)", fontSize: 18.5, color: ANNOT_BLUE, lineHeight: 1.22 }}>{children}</span>
    </div>
  );
}

// 화면 상단 범례 (UI vs 주석 구분 안내)
function Legend() {
  return (
    <span style={{ fontFamily: "var(--pen)", fontSize: 16.5, color: ANNOT_BLUE, background: "#e9f1fb", border: "1.5px dashed #7aa3cf", borderRadius: 6, padding: "1px 11px 3px" }}>
      ✎ 파란 메모 = 기획 설명용 · 실제 게임 화면엔 표시 안 됨
    </span>
  );
}

Object.assign(window, { SkBox, Note, Ph, Field, SkBtn, StatBar, HUD, Frame, Timer, Tag, Annot, Legend });
