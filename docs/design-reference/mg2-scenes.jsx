// mg2-scenes.jsx — 미니게임2 A안(레트로 CRT) 전체 상태 화면
// 공통: 책상 씬 + 모니터 + 에디터(HUD 시계/3게이지/제한시간) + 보드 + 하단 아이템 바
// 상태: ①배치(5) ①′배치(7) ②오류 ③성공 ④부분성공 ⑤실패 ⑥팝업2종 ⑦상태이상3종 + 흐름도

// ───────── 책상+벽 씬 ─────────
function DeskScene({ children, deco, filter }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#caa46a", filter: filter || undefined }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "78%", background: "linear-gradient(#f3e2c0,#e9d3a8)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "78%", height: 6, background: "rgba(29,31,46,.25)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "22%", background: "linear-gradient(#b97a3e,#9c5f2c)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "22%", height: 5, background: "rgba(29,31,46,.4)" }} />
      {deco}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 50px" }}>
        {children}
      </div>
    </div>
  );
}
function RetroDeco() {
  return (
    <React.Fragment>
      <PixWindow style={{ position: "absolute", left: 36, top: 26 }} />
      <PixClock style={{ position: "absolute", right: 50, top: 28 }} />
      <PixPlant style={{ position: "absolute", right: 36, bottom: 12 }} />
      <PixMug style={{ position: "absolute", left: 54, bottom: 18 }} />
    </React.Fragment>
  );
}

// ───────── 공통 프레임 ─────────
function Screen({ tag, stage, annot }) {
  return (
    <div className="mg2-frame">
      <div className="mg2-top"><WfTag>{tag}</WfTag><Legend /></div>
      <div className="mg2-stage">{stage}</div>
      <div className="mg2-annot">{annot}</div>
    </div>
  );
}

// ───────── 슬롯 데이터 ─────────
const OK5 = [
  { id: "agenda", n: 1, mark: "ok" }, { id: "status", n: 2, mark: "ok" }, { id: "problem", n: 3, mark: "ok" },
  { id: "solution", n: 4, mark: "ok" }, { id: "closing", n: 5, mark: "ok" },
];
const ERR5 = [
  { id: "agenda", n: 1, mark: "ok" }, { id: "status", n: 2, mark: "ok" },
  { id: "solution", n: 3, mark: "wrong" }, { id: "problem", n: 4, mark: "wrong" }, { id: "closing", n: 5, mark: "ok" },
];
const PLACING5 = [
  { id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 }, { snap: true, n: 4 }, { empty: true, n: 5 },
];
const PLACING7 = [
  { id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 }, { id: "solution", n: 4 },
  { snap: true, n: 5 }, { empty: true, n: 6 }, { empty: true, n: 7 },
];
const FAIL5 = [
  { id: "agenda", n: 1, mark: "ok" }, { id: "solution", n: 2, mark: "wrong" }, { id: "closing", n: 3, mark: "wrong" },
  { snap: true, n: 4 }, { empty: true, n: 5 },
];

// ───────── 모니터+에디터 셸 ─────────
function EditorShell({ hud, status, board, w1080 }) {
  return (
    <div style={{ maxWidth: 1150, width: "100%", margin: "0 auto" }}>
      <Monitor variant="retro">
        <EditorChrome variant="retro" {...hud} status={status} />
        <div style={{ position: "relative", background: "#e8eef7", padding: "12px 16px 14px", minHeight: 232 }}>
          {board}
        </div>
      </Monitor>
    </div>
  );
}

// 보드: 순서 줄 + 트레이
function Board({ slots, w, label, tray, trayEmpty, dragId, dragRight, dragTop, sevenDrag }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#5a6478", marginBottom: 7 }}>{label}</div>
      <FilmstripA slots={slots} w={w} />
      {dragId && (
        <div style={{ position: "absolute", right: dragRight, top: dragTop, zIndex: 6 }}>
          <MiniSlide {...SL[dragId]} dragging w={w} />
          <span style={{ position: "absolute", left: -15, top: -13, fontSize: 19 }}>🖐️</span>
        </div>
      )}
      {tray !== undefined && (
        <div style={{ marginTop: 14, background: "#fff8e6", border: "3px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", padding: "8px 12px" }}>
          <div style={{ fontFamily: "var(--px-body)", fontSize: 11.5, color: "#8a7d52", marginBottom: 6 }}>🗂 섞인 슬라이드 · 남은 {trayEmpty ? 0 : tray.length}장</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", minHeight: w * 0.78 }}>
            {trayEmpty
              ? <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#b3a08a", alignSelf: "center" }}>모두 배치 완료 — 자동 채점됨</span>
              : tray.map((id, i) => <MiniSlide key={i} {...SL[id]} drag w={w} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════ 상태 ① 배치 중 (5장) ═══════════
function StagePlacing() {
  return (
    <DeskScene deco={<RetroDeco />}>
      <EditorShell
        hud={{ clock: "13:20", work: 62, stress: 34, hp: 70, done: 3, total: 5, s: "47" }}
        board={<Board slots={PLACING5} w={132} label="발표 순서 ▶ 빈 칸에 드래그 · 배치 3 / 5" tray={["closing"]} dragId="solution" dragRight={150} dragTop={70} />} />
    </DeskScene>
  );
}

// ═══════════ 상태 ①′ 난이도 (7장) ═══════════
function StagePlacing7() {
  return (
    <DeskScene deco={<RetroDeco />}>
      <EditorShell
        hud={{ clock: "15:10", work: 48, stress: 56, hp: 58, done: 4, total: 7, s: "52" }}
        board={<Board slots={PLACING7} w={98} label="발표 순서 ▶ 7장으로 증가 · 배치 4 / 7" tray={["plan", "closing"]} dragId="effect" dragRight={130} dragTop={48} />} />
    </DeskScene>
  );
}

// ═══════════ 상태 ② 오류 표시 ═══════════
function StageError() {
  return (
    <DeskScene deco={<RetroDeco />}>
      <EditorShell
        hud={{ clock: "13:20", work: 62, stress: 34, hp: 70, done: 5, total: 5, warn: true, s: "31", danger: true }}
        status={{ bg: "#ffd9d4", icon: "⚠️", color: "#c0392b", text: "오류 2개 · 빨간 슬라이드의 자리를 서로 바꾸세요" }}
        board={<Board slots={ERR5} w={132} label="발표 순서 ▶ 5 / 5 배치 완료 · 자동 채점됨" tray={[]} trayEmpty />} />
    </DeskScene>
  );
}

// ───────── 결과 오버레이 ─────────
function ResultOverlay({ tone, emoji, title, sub, deltas }) {
  const bg = tone === "ok" ? "#eafae8" : tone === "partial" ? "#fff3df" : "#f6e3e0";
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(20,24,40,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9 }}>
      <PxPanel bg={bg} shadow={6} style={{ width: 470, padding: "18px 26px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>{emoji}</div>
        <div style={{ fontFamily: "var(--px-head)", fontSize: 22, color: "var(--ink)" }}>{title}</div>
        <div style={{ fontFamily: "var(--px-body)", fontSize: 13, color: "#5a6478" }}>{sub}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {deltas.map((d, i) => (
            <span key={i} style={{ fontFamily: "var(--px-body)", fontSize: 12.5, border: "2px solid var(--ink)", padding: "4px 11px", background: d.v < 0 ? "#d7f3d4" : "#ffdcd4", color: d.v < 0 ? "#1f8a2e" : "#c0392b" }}>{d.label} {d.v < 0 ? "▼" : "▲"}{Math.abs(d.v)}</span>
          ))}
        </div>
        <PxButton bg="var(--yellow)" style={{ marginTop: 4 }}>메인 화면으로 ▶</PxButton>
        <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#8a8a8a" }}>미니게임이 끝나면 항상 메인 화면으로</span>
      </PxPanel>
    </div>
  );
}

function StageSuccess() {
  return (
    <DeskScene deco={<RetroDeco />} filter="saturate(1.05)">
      <EditorShell
        hud={{ clock: "13:21", work: 42, stress: 34, hp: 70, dWork: -20, done: 5, total: 5, s: "06" }}
        board={<div style={{ opacity: .5 }}><Board slots={OK5} w={132} label="발표 순서 ▶ 완성" /></div>} />
      <ResultOverlay tone="ok" emoji="🎉" title="회의 준비 완료!" sub="시간 내 전체 배치 + 오류 0개" deltas={[{ label: "업무량", v: -20 }]} />
    </DeskScene>
  );
}
function StagePartial() {
  return (
    <DeskScene deco={<RetroDeco />}>
      <EditorShell
        hud={{ clock: "13:21", work: 52, stress: 42, hp: 70, dWork: -10, dStress: 8, done: 5, total: 5, s: "00" }}
        board={<div style={{ opacity: .5 }}><Board slots={ERR5} w={132} label="발표 순서 ▶ 완성(오류 잔존)" /></div>} />
      <ResultOverlay tone="partial" emoji="😮‍💨" title="아슬아슬하게 마쳤다…" sub="전체 배치 완료 + 오류 2~3개" deltas={[{ label: "업무량", v: -10 }, { label: "스트레스", v: 8 }]} />
    </DeskScene>
  );
}
function StageFail() {
  return (
    <DeskScene deco={<RetroDeco />} filter="grayscale(.2)">
      <EditorShell
        hud={{ clock: "13:22", work: 59, stress: 54, hp: 62, dWork: -3, dStress: 20, dHp: -8, done: 3, total: 5, warn: true, s: "00", danger: true }}
        board={<div style={{ opacity: .5 }}><Board slots={FAIL5} w={132} label="발표 순서 ▶ 시간 초과 (미완성)" /></div>} />
      <ResultOverlay tone="fail" emoji="💀" title="회의 준비 망했다…" sub="시간 초과 또는 오류 4개 이상" deltas={[{ label: "업무량", v: -3 }, { label: "스트레스", v: 20 }, { label: "체력", v: -8 }]} />
    </DeskScene>
  );
}

// ───────── 팝업 오버레이 ─────────
function PopupOverlay({ icon, title, desc, buttons }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(16,18,28,.66)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9 }}>
      <PxPanel bg="#fffdf2" shadow={6} style={{ width: 480, padding: "18px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
        <div style={{ fontSize: 38 }}>{icon}</div>
        <div style={{ fontFamily: "var(--px-head)", fontSize: 19, color: "var(--ink)" }}>{title}</div>
        <div style={{ fontFamily: "var(--px-body)", fontSize: 13, color: "#4a4636", lineHeight: 1.5 }}>{desc}</div>
        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 4 }}>
          {buttons.map((b, i) => (
            <PxButton key={i} bg={b.primary ? "var(--yellow)" : "#fff"} small style={{ flex: 1, justifyContent: "center" }}>{b.label}</PxButton>
          ))}
        </div>
      </PxPanel>
    </div>
  );
}
// ───────── 상사 그림자 + 자동 닫힘 경고 (확인 버튼 없음) ─────────
function BossShadowPx() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", overflow: "hidden" }}>
      <svg viewBox="0 0 300 320" preserveAspectRatio="xMidYMax meet"
        style={{ position: "absolute", top: "-18%", right: "-6%", height: "150%", width: "auto", opacity: .4 }}>
        <defs><filter id="bossSoftPx" x="-6%" y="-6%" width="112%" height="112%"><feGaussianBlur stdDeviation="1.6" /></filter></defs>
        <g filter="url(#bossSoftPx)" fill="#161616">
          <circle cx="150" cy="84" r="52" />
          <path d="M 18 320 C 26 205 80 142 150 140 C 220 142 274 205 282 320 Z" />
        </g>
      </svg>
    </div>
  );
}
function WarnBannerPx({ title, desc }) {
  return (
    <div style={{ position: "absolute", left: "50%", top: 64, transform: "translateX(-50%)", zIndex: 9, width: 540, maxWidth: "76%" }}>
      <PxPanel bg="#fff" bw={3} shadow={5} style={{ borderColor: PX.red, padding: "12px 18px", display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontFamily: "var(--px-head)", fontSize: 16, color: PX.red }}>{title}</span>
        </div>
        <div style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#4a4636" }}>{desc}</div>
      </PxPanel>
    </div>
  );
}
function StagePopupBoss() {
  return (
    <DeskScene deco={<RetroDeco />}>
      <EditorShell
        hud={{ done: 3, total: 5, s: "44" }}
        board={<Board slots={PLACING5} w={132} label="발표 순서 ▶ 배치 3 / 5 (상사가 지켜보는 중)" tray={["closing"]} />} />
      <BossShadowPx />
      <WarnBannerPx title="상사가 내 자리 옆에 서 있다…" desc="아무 말 없이 모니터만 보고 있다. 난이도가 일시적으로 상승한다." />
    </DeskScene>
  );
}
function StagePopupHelp() {
  return (
    <DeskScene deco={<RetroDeco />}>
      <EditorShell
        hud={{ clock: "13:20", work: 62, stress: 34, hp: 70, done: 3, total: 5, paused: true }}
        board={<div style={{ opacity: .55 }}><Board slots={PLACING5} w={132} label="발표 순서 ▶ 배치 3 / 5" tray={["closing"]} /></div>} />
      <PopupOverlay icon="🧑‍💼🤝" title="상사의 도움 제안"
        desc="“이거 내가 마저 할게. 가서 좀 쉬어.”"
        buttons={[{ label: "수락 — 성공 처리", primary: true }, { label: "거절 — 스스로 마무리" }]} />
    </DeskScene>
  );
}

// ───────── 상태이상 ─────────
function StatusBadgePx({ icon, label, caption }) {
  return (
    <React.Fragment>
      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 7, fontFamily: "var(--px-head)", fontSize: 13, background: "var(--ink)", color: "#fff", padding: "4px 11px", boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}>{icon} {label}</div>
      <div style={{ position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)", zIndex: 7, fontFamily: "var(--px-body)", fontSize: 12, color: "#c0392b", background: "#fff", border: "2px solid #c0392b", padding: "2px 10px", whiteSpace: "nowrap" }}>{caption}</div>
    </React.Fragment>
  );
}
function StageStatus({ kind }) {
  const cfg = {
    burnout: { s: "40", icon: "🥵", label: "번아웃", caption: "커서 움직이는 속도가 느려진 상태", cls: "mg-st-gray" },
    headache: { s: "33", icon: "🤕", label: "두통", caption: "커서가 크게 튀어 방향 예측 불가", cls: "mg-st-shake" },
    coffee: { s: "45", icon: "☕", label: "손 떨림", caption: "커서가 잘게 떨림 (예측 가능)", cls: "mg-st-jitter" },
  }[kind];
  return (
    <DeskScene deco={<RetroDeco />}>
      <div className={cfg.cls} style={{ maxWidth: 1150, width: "100%", margin: "0 auto", position: "relative" }}>
        <Monitor variant="retro">
          <EditorChrome variant="retro" done={3} total={5} s={cfg.s} />
          <div style={{ position: "relative", background: "#e8eef7", padding: "12px 16px 14px", minHeight: 232 }}>
            <StatusBadgePx icon={cfg.icon} label={cfg.label} caption={cfg.caption} />
            <div style={{ marginTop: 20 }} className={kind === "headache" ? "px-headblur" : undefined}><Board slots={PLACING5} w={132} label="발표 순서 ▶ 배치 3 / 5" tray={["closing"]} /></div>
          </div>
        </Monitor>
      </div>
    </DeskScene>
  );
}

// ───────── 상태 전이 흐름도 (픽셀) ─────────
function FNode({ children, bg, w }) {
  return <PxPanel bg={bg || "#fff"} shadow={4} style={{ padding: "9px 13px", width: w, textAlign: "center", fontFamily: "var(--px-body)", fontSize: 12.5, lineHeight: 1.4 }}>{children}</PxPanel>;
}
function FArrow({ children }) {
  return <span style={{ fontFamily: "var(--px-body)", fontSize: 11.5, color: "#3a3f50", whiteSpace: "nowrap", padding: "0 2px" }}>{children}</span>;
}
function StageFlow() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#efe7d2", padding: "26px 40px", overflow: "auto" }}>
      <div style={{ fontFamily: "var(--px-head)", fontSize: 18, marginBottom: 18 }}>🔁 미니게임2 상태 전이 흐름</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <FNode bg="#fff3c4" w={150}><b>① 배치 중</b><br/><span style={{ color: "#777" }}>제한시간 60초만 표시</span></FNode>
        <FArrow>슬라이드 전부 정답 + 함정 전부 휴지통 ▶</FArrow>
        <FNode bg="#eef2f8" w={140}><b>자동 종료</b><br/><span style={{ color: "#777" }}>제한시간 전에도 / 버튼 없음</span></FNode>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FArrow>오류 0~1 ▶</FArrow><FNode bg="#d7f6d4" w={170}>③ 성공 · 업무량 -20</FNode></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FArrow>오류 2~3 ▶</FArrow><FNode bg="#fff0d0" w={170}>④ 부분성공 · -10·스트+8</FNode></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FArrow>시간초과/오류4+ ▶</FArrow><FNode bg="#f6d9d4" w={170}>⑤ 실패 · -3·스트+20·체력-8</FNode></div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, marginLeft: 4 }}>
        <FArrow>스트레스 50↑ ▼</FArrow>
        <FNode bg="#ffe0d6" w={210}>①′ 7장 난이도 · 80↑ 힌트 짧아짐</FNode>
        <FArrow>↩ 같은 배치 흐름</FArrow>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        <div style={{ flex: 1, border: "2px dashed #b9ac86", background: "#f6efdd", padding: "10px 14px", fontFamily: "var(--px-body)", fontSize: 12, lineHeight: 1.6 }}>
          <b>⑥ 팝업 이벤트</b> (배치 중 랜덤 끼어듦)<br/>· 상사 옆에 서 있음 → 확인 후 재개(난이도↑)<br/>· 상사 도움 → 수락=성공처리 / 거절=속행
        </div>
        <div style={{ flex: 1, border: "2px dashed #b9ac86", background: "#f6efdd", padding: "10px 14px", fontFamily: "var(--px-body)", fontSize: 12, lineHeight: 1.6 }}>
          <b>⑦ 상태이상</b> (배치 중 상시 시각효과)<br/>· 🥵 번아웃(스트70↑) · 🤕 두통(체력30↓)<br/>· ☕ 커피 과다복용(연속 2회)
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
        <FNode bg="#fff" w={150}>결과 ③④⑤</FNode>
        <FArrow>▶</FArrow>
        <FNode bg="#fff" w={210}>다음 미니게임 / 메인화면</FNode>
      </div>
    </div>
  );
}

Object.assign(window, {
  DeskScene, RetroDeco, Screen, EditorShell, Board, ResultOverlay, PopupOverlay, StatusBadgePx,
  StagePlacing, StagePlacing7, StageError, StageSuccess, StagePartial, StageFail,
  StagePopupBoss, StagePopupHelp, StageStatus, StageFlow,
});
