// mg2-screens.jsx — 에디터 크롬(HUD+게이지) + 아이템 바 + 보드 조각

// ───────── 에디터 크롬 (모니터 화면 내부 상단) ─────────
function EditorChrome({ variant, clock, done, total, warn, s, danger, paused, status,
  work = 62, stress = 34, hp = 70, dWork, dStress, dHp, hideProg }) {
  const retro = variant === "retro";
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 타이틀바 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px",
        background: retro ? "#3a6ea5" : "#15182a", borderBottom: "3px solid var(--ink)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!retro && <div style={{ display: "flex", gap: 5 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57", border: "1.5px solid var(--ink)" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e", border: "1.5px solid var(--ink)" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840", border: "1.5px solid var(--ink)" }} />
          </div>}
          {retro && <span style={{ fontSize: 13 }}>📊</span>}
          <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#fff" }}>발표자료_최종_진짜최종_v3.ppt — 파워포인뜨</span>
        </div>
        {retro && <div style={{ display: "flex", gap: 4 }}>
          {["_", "▢", "✕"].map((c, i) => (
            <span key={i} style={{ width: 18, height: 16, background: "#d8d2c0", border: "2px solid var(--ink)", fontFamily: "var(--px-body)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>{c}</span>
          ))}
        </div>}
      </div>
      {/* 메뉴/툴바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "3px 12px",
        background: retro ? "#ece6d6" : "#222639", borderBottom: "3px solid var(--ink)" }}>
        {["파일", "편집", "보기", "삽입", "디자인"].map((m) => (
          <span key={m} style={{ fontFamily: "var(--px-body)", fontSize: 12, color: retro ? "#5a5440" : "#a9b2cc" }}>{m}</span>
        ))}
      </div>
      {/* 게임 HUD 스트립 — 제목 + (진행도) + 제한시간 (시계·스탯 미표시) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px",
        background: retro ? "#ffe9a8" : "#2c3350", borderBottom: "3px solid var(--ink)" }}>
        <span style={{ fontFamily: "var(--px-head)", fontSize: 14, color: retro ? "var(--ink)" : "#fff", whiteSpace: "nowrap" }}>📊 회의 준비 — 발표 순서 맞추기</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!hideProg && <ProgressChips done={done} total={total || 5} warn={warn} />}
          <PxTimer s={s} danger={danger} paused={paused} />
        </div>
      </div>
      {status && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", background: status.bg, borderBottom: "3px solid var(--ink)" }}>
          <span style={{ fontSize: 16 }}>{status.icon}</span>
          <span style={{ fontFamily: "var(--px-body)", fontSize: 13.5, color: status.color }}>{status.text}</span>
        </div>
      )}
    </div>
  );
}

// ───────── 하단 아이템 바 (미니게임 중 비활성) ─────────
function ItemBarPixel({ variant }) {
  const retro = variant !== "modern";
  const items = ["담배 🚬", "커피 ☕", "홍삼 🧴"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 14px", borderTop: "3px solid var(--ink)",
      background: retro ? "#e7ddc7" : "#161a28" }}>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: retro ? "#5a5440" : "#a9b2cc", whiteSpace: "nowrap" }}>🎒 아이템</span>
      <div style={{ display: "flex", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 5, padding: "4px 11px",
            border: "2px solid #9aa3b5", background: "repeating-linear-gradient(45deg,#d9d4c4 0 6px,#cfcab8 6px 12px)",
            fontFamily: "var(--px-body)", fontSize: 12, color: "#7a7466", opacity: .7 }}>
            <span>{it}</span><span style={{ fontSize: 11 }}>🔒</span>
          </div>
        ))}
      </div>
      <span style={{ fontFamily: "var(--px-body)", fontSize: 11.5, color: retro ? "#8a7d52" : "#7b86a8" }}>미니게임 중에는 사용 불가 · 아이템은 <b>메인화면에서만</b></span>
    </div>
  );
}

// 순서 화살표
function Arrow() {
  return <span style={{ fontFamily: "var(--px-head)", fontSize: 16, color: "#9aa3b5", alignSelf: "center" }}>▶</span>;
}

// ───────── A안: 클래식 필름스트립 (상단 슬롯 줄 + 하단 트레이) ─────────
function FilmstripA({ slots, w }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "nowrap" }}>
      {slots.map((sl, i) => (
        <React.Fragment key={i}>
          {sl.snap
            ? <SnapSlot n={sl.n} w={w} />
            : sl.empty
              ? <MiniSlide ghost n={sl.n} w={w} />
              : <MiniSlide {...SL[sl.id]} n={sl.n} mark={sl.mark} w={w} />}
          {i < slots.length - 1 && <Arrow />}
        </React.Fragment>
      ))}
    </div>
  );
}

// 자석 스냅 타겟 슬롯 (드래그 중 강조)
function SnapSlot({ n, w }) {
  const width = w || 138;
  return (
    <div style={{ position: "relative", width, height: width * 0.78 }}>
      <div className="px-snap" style={{ position: "absolute", inset: 0, border: "3px dashed var(--yellow)", background: "rgba(255,210,63,.22)", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ position: "absolute", top: 4, left: 5, fontFamily: "var(--px-mono)", fontSize: 12, color: "#b89324" }}>{n}</span>
      </div>
      <span style={{ position: "absolute", left: "50%", bottom: -24, transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: "var(--px-body)", fontSize: 11, color: "var(--ink)", background: "var(--yellow)", border: "2px solid var(--ink)", padding: "1px 7px" }}>여기에 딱! 🧲</span>
    </div>
  );
}

Object.assign(window, { EditorChrome, ItemBarPixel, Arrow, FilmstripA, SnapSlot });
