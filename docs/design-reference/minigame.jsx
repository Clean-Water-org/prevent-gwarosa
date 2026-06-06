// minigame.jsx — 미니게임2(회의 준비) 와이어프레임 전면 개정 + 미니게임3(오탈자) 보존
// 공통 HUD(게임시계+업무량/스트레스/체력 게이지+미니게임 제한시간) / 하단 아이템 슬롯(미니게임 중 비활성)
// 상태: ①배치 중 / ①난이도(7장) / ②오류 표시 / ③성공 / ④부분성공 / ⑤실패 / ⑥팝업 2종 / ⑦상태이상 3종 / 흐름도

const GREEN = "#2e8b57";
const ANNOT = "#3f6fa5";

// 기획 설명용 파란 메모 (실제 게임 화면엔 안 나옴)
function Annot({ children, style, label }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "#e9f1fb", border: "2px dashed #7aa3cf", borderRadius: "12px 4px 12px 4px", padding: "7px 13px", ...style }}>
      <span style={{ fontFamily: "var(--pen)", fontSize: 18, fontWeight: 700, color: ANNOT, flex: "0 0 auto", whiteSpace: "nowrap" }}>✎ {label || "설명"}</span>
      <span style={{ fontFamily: "var(--pen)", fontSize: 18, color: ANNOT, lineHeight: 1.25 }}>{children}</span>
    </div>
  );
}
function Legend() {
  return (
    <span style={{ fontFamily: "var(--pen)", fontSize: 16.5, color: ANNOT, background: "#e9f1fb", border: "1.5px dashed #7aa3cf", borderRadius: 6, padding: "1px 11px 3px" }}>
      ✎ 파란 메모 = 기획 설명용 · 실제 게임 화면엔 표시 안 됨
    </span>
  );
}

// ───────── 미니게임 제한시간 (게임 시계·스탯·아이템은 미표시) ─────────
function MgTimerBox({ s, danger, paused }) {
  return (
    <div className={"mg-timer" + (danger ? " danger" : "")}>
      <span className="mg-timer-sub">{paused ? "일시정지" : "남은 시간"}</span>
      <div className="mg-timer-t"><span style={{ fontSize: 17 }}>⏱</span><span>{paused ? "—:—" : "0:" + (s || "47")}</span></div>
      <span className="mg-timer-cap">미니게임 제한 60초</span>
    </div>
  );
}

// ───────── 공통 화면 래퍼 (슬림 헤더: 목표 + 제한시간) ─────────
function MgScreen({ tag, goal, goalWarn, s, danger, paused, hideTimer, children, annot }) {
  const showHeader = goal || !hideTimer;
  return (
    <Frame accent="#ffe08a">
      <div className="mg-root">
        <div className="mg-tagrow"><Tag>{tag}</Tag><Legend /></div>
        {showHeader && (
          <div className="mg-header">
            {goal && <span className={"mg-goal" + (goalWarn ? " warn" : "")}>{goal}</span>}
            <span style={{ flex: 1 }} />
            {!hideTimer && <MgTimerBox s={s} danger={danger} paused={paused} />}
          </div>
        )}
        <div className="mg-stage">{children}</div>
        {annot && <div className="mg-annot">{annot}</div>}
      </div>
    </Frame>
  );
}

// ───────── 슬라이드 카드 + 순서 줄 ─────────
const SLIDES = {
  agenda: "목차", status: "현황 분석", problem: "문제점", solution: "개선안",
  effect: "기대효과", plan: "실행 일정", closing: "마무리",
};
const HINTS = {
  agenda: "발표 흐름", status: "지표·그래프", problem: "병목·이슈", solution: "3가지 방안",
  effect: "ROI 전망", plan: "일정·담당", closing: "요약·Q&A",
};

function Slide({ id, n, mark, ghost, snap, drag, w }) {
  const width = w || 150;
  if (snap) {
    return (
      <div className="mg-slot snap" style={{ width, height: width * 0.74 }}>
        {n && <span className="mg-slot-n">{n}</span>}
        <span className="mg-snap-tip">여기에 딱! 🧲</span>
      </div>
    );
  }
  if (ghost) {
    return (
      <div className="mg-slot ghost" style={{ width, height: width * 0.74 }}>
        {n && <span className="mg-slot-n">{n}</span>}
        <span className="mg-slot-empty">비어 있음</span>
      </div>
    );
  }
  const wrong = mark === "wrong", ok = mark === "ok";
  return (
    <div className={"mg-slide" + (wrong ? " wrong" : "") + (ok ? " ok" : "") + (drag ? " drag" : "")} style={{ width, height: width * 0.74 }}>
      {wrong && <span className="mg-mark wrong">✗</span>}
      {ok && <span className="mg-mark ok">✓</span>}
      <div className="mg-slide-head">
        {n && <span className="wf-slide-no" style={{ background: wrong ? "var(--marker)" : ok ? GREEN : "var(--ink)" }}>{n}</span>}
        <span className="mg-slide-title">{SLIDES[id]}</span>
      </div>
      <div className="mg-slide-body">
        <span className="wf-line" style={{ width: "88%" }} />
        <span className="wf-line" style={{ width: "62%" }} />
        <span className="mg-slide-hint">힌트: {HINTS[id]}</span>
      </div>
    </div>
  );
}

function OrderRow({ slots, w }) {
  return (
    <div className="mg-order">
      {slots.map((sl, i) => (
        <React.Fragment key={i}>
          <Slide {...sl} w={w} />
          {i < slots.length - 1 && <span className="mg-arrow">▶</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Tray({ items, w, empty }) {
  return (
    <div className="mg-tray">
      <span className="mg-tray-l">🗂 섞인 슬라이드 · 남은 {empty ? 0 : items.length}장</span>
      <div className="mg-tray-row">
        {empty
          ? <span className="mg-tray-empty">모두 배치 완료 — 자동 채점됨</span>
          : items.map((id, i) => <Slide key={i} id={id} drag w={w} />)}
      </div>
    </div>
  );
}

// ═══════════ 상태 ① 배치 중 (5장) ═══════════
function MeetingPlacing() {
  const slots = [
    { id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 },
    { snap: true, n: 4 }, { ghost: true, n: 5 },
  ];
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ① 배치 중 (5장)"
      s="47"
      goal="📊 섞인 슬라이드를 발표 순서대로 빈 칸에 드래그하세요"
      annot={<React.Fragment>
        <Annot label="이 화면에서 하는 일">제목·내용 힌트를 읽고 발표 흐름대로 빈 슬롯에 <b>드래그</b>. 슬롯 가까이 가면 <b>자석처럼 스냅</b>됩니다.</Annot>
        <Annot label="자동 채점·종료">5칸을 모두 채우면 자동 채점 → <b>오류 표시/결과</b>로 진행 (제출 버튼 없음). <b>모든 슬라이드가 정답 위치 + 함정 카드를 전부 휴지통에 버리면 제한시간이 남아도 즉시 종료</b>. 기본 5장: 목차→현황 분석→문제점→개선안→마무리.</Annot>
      </React.Fragment>}>
      <div className="mg-board">
        <span className="mg-board-l">발표 순서 ▸ 빈 칸에 드래그 · 배치 3 / 5</span>
        <OrderRow slots={slots} w={150} />
        <div className="mg-drag-card"><Slide id="solution" drag w={150} /><span className="mg-hand">🖐️</span></div>
        <Tray items={["closing"]} w={150} />
      </div>
    </MgScreen>
  );
}

// ═══════════ 상태 ①' 난이도 상승 (7장 · 스트레스 50↑) ═══════════
function MeetingPlacing7() {
  const slots = [
    { id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 }, { id: "solution", n: 4 },
    { snap: true, n: 5 }, { ghost: true, n: 6 }, { ghost: true, n: 7 },
  ];
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ①′ 난이도 상승 (7장 · 스트레스 50↑)"
      s="52"
      goal="📊 슬라이드가 7장으로 늘었습니다 — 순서를 끝까지 맞추세요"
      annot={<React.Fragment>
        <Annot label="난이도 상승 · 기획서 4-2"><b>스트레스 50↑</b> → 슬라이드 5장이 <b>7장으로 증가</b>. <b>80↑</b> → 힌트 텍스트가 짧아져 파악 난이도↑.</Annot>
        <Annot label="7장 구성 ※ 2장은 제안">기획서는 “5→7장” 수치만 명시. 추가 2장은 <b>기대효과</b>(기획서 예시)+<b>실행 일정</b>(제안)으로 구성했습니다.</Annot>
      </React.Fragment>}>
      <div className="mg-board">
        <span className="mg-board-l">발표 순서 ▸ 배치 4 / 7</span>
        <OrderRow slots={slots} w={120} />
        <div className="mg-drag-card seven"><Slide id="effect" drag w={120} /><span className="mg-hand">🖐️</span></div>
        <Tray items={["plan", "closing"]} w={120} />
      </div>
    </MgScreen>
  );
}

// ═══════════ 상태 ② 오류 표시 (자동 채점) ═══════════
function MeetingCheck() {
  const slots = [
    { id: "agenda", n: 1, mark: "ok" }, { id: "status", n: 2, mark: "ok" },
    { id: "solution", n: 3, mark: "wrong" }, { id: "problem", n: 4, mark: "wrong" }, { id: "closing", n: 5, mark: "ok" },
  ];
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ② 오류 표시 (자동 채점)"
      s="31" danger
      goal="⚠️ 오류 2개 · 빨간 슬라이드의 자리를 서로 바꿔 수정하세요" goalWarn
      annot={<React.Fragment>
        <Annot label="잘못 배치 표시 ※ 기획서에 없는 UX 제안"><b style={{ color: "var(--marker)" }}>빨간 점선+✗+기울어짐</b> = 위치 오류 · <b style={{ color: GREEN }}>초록 ✓</b> = 정답 위치.</Annot>
        <Annot label="수정 방법">빨간 슬라이드 둘을 <b>드래그해 자리 교환</b> → 즉시 재채점. 정답: 목차→현황 분석→문제점→개선안→마무리.</Annot>
      </React.Fragment>}>
      <div className="mg-board">
        <span className="mg-board-l">발표 순서 ▸ 5 / 5 배치 완료 · 자동 채점됨</span>
        <OrderRow slots={slots} w={150} />
        <Tray items={[]} empty w={150} />
      </div>
    </MgScreen>
  );
}

// ───────── 결과 패널 ─────────
function ResultPanel({ tone, emoji, title, sub, deltas, note }) {
  return (
    <div className="mg-result-wrap">
      <div className={"mg-result " + tone}>
        <div className="mg-result-emoji">{emoji}</div>
        <div className="mg-result-title">{title}</div>
        <div className="mg-result-sub">{sub}</div>
        <div className="mg-result-deltas">
          {deltas.map((d, i) => (
            <span key={i} className="mg-delta" style={{ background: d.v < 0 ? "#e3f7e2" : "#ffe3dd", color: d.v < 0 ? "#1f8a2e" : "var(--marker)" }}>
              {d.label} {d.v < 0 ? "▼" : "▲"}{Math.abs(d.v)}
            </span>
          ))}
        </div>
        {note && <div className="mg-result-note">{note}</div>}
        <SkBtn primary style={{ marginTop: 4 }}>메인 화면으로 ▶</SkBtn>
        <span className="mg-result-foot">미니게임이 끝나면 항상 메인 화면으로 돌아갑니다</span>
      </div>
    </div>
  );
}

// ═══════════ 상태 ③ 결과 : 성공 ═══════════
function ResultSuccess() {
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ③ 결과 : 성공"
      hideTimer
      annot={<Annot label="채점 · 기획서 4-2"><b style={{ color: GREEN }}>성공</b> = 제한시간 내 전체 배치 + 오류 <b>1개 이하</b> → <b>업무량 -20</b>. (이 화면은 오류 0개 예시)</Annot>}>
      <ResultPanel tone="ok" emoji="🎉" title="회의 준비 완료!"
        sub="시간 내 전체 배치 + 오류 0개"
        deltas={[{ label: "업무량", v: -20 }]} />
    </MgScreen>
  );
}

// ═══════════ 상태 ④ 결과 : 부분성공 ═══════════
function ResultPartial() {
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ④ 결과 : 부분성공"
      hideTimer
      annot={<Annot label="채점 · 기획서 4-2"><b style={{ color: "#c98a2a" }}>부분성공</b> = 전체 배치 완료 + 오류 <b>2~3개</b> → <b>업무량 -10, 스트레스 +8</b>.</Annot>}>
      <ResultPanel tone="partial" emoji="😮‍💨" title="아슬아슬하게 마쳤다…"
        sub="전체 배치 완료 + 오류 2~3개"
        deltas={[{ label: "업무량", v: -10 }, { label: "스트레스", v: 8 }]} />
    </MgScreen>
  );
}

// ═══════════ 상태 ⑤ 결과 : 실패 ═══════════
function ResultFail() {
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ⑤ 결과 : 실패"
      hideTimer
      annot={<Annot label="채점 · 기획서 4-2"><b style={{ color: "var(--marker)" }}>실패</b> = 시간 초과 또는 오류 <b>4개 이상</b> → <b>업무량 -3, 스트레스 +20, 체력 -8</b>.</Annot>}>
      <ResultPanel tone="fail" emoji="💀" title="회의 준비 망했다…"
        sub="시간 초과 또는 오류 4개 이상"
        deltas={[{ label: "업무량", v: -3 }, { label: "스트레스", v: 20 }, { label: "체력", v: -8 }]} />
    </MgScreen>
  );
}

// ───────── 팝업 오버레이 ─────────
function PopupOverlay({ icon, title, desc, buttons }) {
  return (
    <div className="mg-popup-overlay">
      <div className="mg-popup">
        <div className="mg-popup-icon">{icon}</div>
        <div className="mg-popup-title">{title}</div>
        <div className="mg-popup-desc">{desc}</div>
        <div className="mg-popup-btns">
          {buttons.map((b, i) => (
            <SkBtn key={i} primary={b.primary} small style={{ flex: 1 }}>{b.label}</SkBtn>
          ))}
        </div>
      </div>
    </div>
  );
}

// 흐릿하게 깔리는 진행 중 보드 (팝업/상태이상 배경)
function DimBoard() {
  const slots = [
    { id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 },
    { snap: true, n: 4 }, { ghost: true, n: 5 },
  ];
  return (
    <div className="mg-board">
      <span className="mg-board-l">발표 순서 ▸ 배치 3 / 5</span>
      <OrderRow slots={slots} w={150} />
      <Tray items={["closing"]} w={150} />
    </div>
  );
}

// ───────── 상사 그림자 + 자동 닫힘 경고 (확인 버튼 없음) ─────────
function BossShadow() {
  return (
    <div className="mg-boss-shadow" aria-hidden="true">
      <svg className="mg-boss-svg" viewBox="0 0 300 320" preserveAspectRatio="xMidYMax meet">
        <defs><filter id="bossSoft" x="-6%" y="-6%" width="112%" height="112%"><feGaussianBlur stdDeviation="1.6" /></filter></defs>
        <g filter="url(#bossSoft)" fill="#161616">
          <circle cx="150" cy="84" r="52" />
          <path d="M 18 320 C 26 205 80 142 150 140 C 220 142 274 205 282 320 Z" />
        </g>
      </svg>
    </div>
  );
}
function WarnBanner({ title, desc }) {
  return (
    <div className="mg-warn-banner">
      <div className="mg-warn-row"><span className="mg-warn-ico">⚠️</span><span className="mg-warn-title">{title}</span></div>
      <div className="mg-warn-desc">{desc}</div>
    </div>
  );
}

// ═══════════ 상태 ⑥-a : 상사가 옆에 서 있음 (자동 닫힘 경고) ═══════════
function PopupBoss() {
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ⑥ 이벤트 : 상사가 옆에 서 있음"
      s="44"
      goal="📊 발표 순서를 계속 맞추세요 (상사가 지켜보는 중)"
      annot={<Annot label="기획서 6-1 (공통)">발생확률 똑부 30 / 멍부 40 / 멍게 10 / 똑게 5% · 효과: 난이도 일시↑ · <b>성공 시 업무량 -10 추가(총 -30)</b> · 실패 시 스트레스 +20. <b>확인 버튼 없이 2~3초 경고만 노출 후 자동으로 닫히고</b>, 상사 그림자가 화면에 드리워집니다 (게임은 멈추지 않음).</Annot>}>
      <div style={{ position: "relative", height: "100%" }}>
        <DimBoard />
        <BossShadow />
        <WarnBanner title="상사가 내 자리 옆에 서 있다…" desc="아무 말 없이 모니터만 보고 있다. 난이도가 일시적으로 상승한다." />
      </div>
    </MgScreen>
  );
}

// ═══════════ 상태 ⑥-b 팝업 : 상사의 도움 제안 ═══════════
function PopupHelp() {
  return (
    <MgScreen tag="미니게임2 · 회의 준비 — ⑥ 팝업 : 상사의 도움 제안"
      paused
      annot={<Annot label="기획서 6-1 (공통)">발생확률 멍부 30 / 똑부 20 / 멍게 10% · <b>수락 → 미니게임 성공 처리(성공 카운트 미반영) + 스트레스 +10</b> · <b>거절 → 스트레스 -5</b>.</Annot>}>
      <div style={{ position: "relative", height: "100%" }}>
        <DimBoard />
        <PopupOverlay icon="🧑‍💼🤝" title="상사의 도움 제안"
          desc="“이거 내가 마저 할게. 가서 좀 쉬어.”"
          buttons={[{ label: "수락 — 미니게임 성공 처리", primary: true }, { label: "거절 — 스스로 마무리" }]} />
      </div>
    </MgScreen>
  );
}

// ───────── 상태이상 보완 컴포넌트 ─────────
// 영구 상태 배너 (작은 배지 대체)
function StatusBanner({ tone, icon, name, metric, val, max, recover }) {
  const pct = Math.round((val / max) * 100);
  return (
    <div className={"st-banner " + tone}>
      <span className="st-banner-ico">{icon}</span>
      <span className="st-banner-name">{name}</span>
      {metric && (
        <div className="st-banner-metric">
          <span>{metric}</span>
          <div className="st-banner-bar"><div style={{ width: pct + "%" }} /></div>
          <span>{val}/{max}</span>
        </div>
      )}
      <span className="st-banner-recover">💊 회복: {recover}</span>
    </div>
  );
}

// 첫 발동 토스트 (3초 후 자동 소멸)
function StatusToast({ title, trigger }) {
  return (
    <div className="st-toast">
      <div className="st-toast-title">{title}</div>
      <div className="st-toast-trigger">{trigger}</div>
    </div>
  );
}

// 커서 잔상(번아웃) / 떨림(커피) 표현
function CursorFx({ kind }) {
  if (kind === "trail") {
    return (
      <div className="st-cursor">
        <span style={{ position: "absolute", left: 30, top: 22, fontSize: 26, opacity: .2 }}>↖</span>
        <span style={{ position: "absolute", left: 15, top: 11, fontSize: 28, opacity: .42 }}>↖</span>
        <span style={{ position: "absolute", left: 0, top: 0, fontSize: 30 }}>↖</span>
        <span className="st-cursor-cap">커서 잔상 · 느려짐</span>
      </div>
    );
  }
  return (
    <div className="st-cursor jitter">
      <span style={{ position: "absolute", left: 0, top: 0, fontSize: 30 }}>↖</span>
      <span style={{ position: "absolute", left: 7, top: -5, width: 5, height: 5, background: "#7a5a2a", borderRadius: "50%", opacity: .6 }} />
      <span style={{ position: "absolute", left: -5, top: 6, width: 4, height: 4, background: "#7a5a2a", borderRadius: "50%", opacity: .5 }} />
      <span className="st-cursor-cap">커서 잘게 떨림</span>
    </div>
  );
}

// 두통: 게임 시계 1시간 점프 위젯
function ClockJump() {
  return (
    <div className="st-clockjump">
      <span style={{ fontSize: 18 }}>🕐</span>
      <span className="st-cj-old">14:00</span><span>→</span><span className="st-cj-new">15:00</span>
      <span className="st-cj-minus">-1시간</span>
    </div>
  );
}

// 두통 발동 대화창
function HeadacheDialog() {
  return (
    <div className="st-dialog-ov">
      <div className="st-dialog">
        <span className="st-dialog-emoji">🤕</span>
        <div className="st-dialog-text">“너무 머리가 아파서 못하겠어…”</div>
        <SkBtn primary>확인</SkBtn>
      </div>
    </div>
  );
}

// 공통 상태이상 뷰
function StatusView({ tag, s, env, fxgray, vig, shake, jitter, tint, banner, toast, flash, dialog, clockJump, coffeeCup, cursor, slideBlur, annot }) {
  return (
    <MgScreen tag={tag} s={s} annot={annot}>
      <div className={"st-stage" + (shake ? " shake" : "") + (jitter ? " jitter" : "")}>
        {flash && <div className="st-flash" />}
        {vig && <div className={"st-vig st-vig-" + vig} />}
        <StatusBanner {...banner} />
        <div className={"st-boardwrap" + (fxgray ? " fx-gray" : "") + (slideBlur ? " st-slideblur" : "")}>
          {tint && <div className={"st-tint st-tint-" + tint} />}
          <DimBoard />
          {cursor && <CursorFx kind={cursor} />}
          {coffeeCup && <div className="st-coffeecup">☕</div>}
        </div>
        {clockJump && <ClockJump />}
        {toast && <StatusToast {...toast} />}
        {dialog && <HeadacheDialog />}
      </div>
    </MgScreen>
  );
}

// 정상 비교 화면
function StatusNormal() {
  return (
    <MgScreen tag="미니게임2 · 상태이상 비교용 — 😀 정상 상태" s="47"
      goal="📊 정상 상태 — 필터·흔들림·배너 없음 (상태이상과 비교)"
      annot={<Annot label="비교용">상태이상이 없을 때의 기본 화면입니다. 아래 상태이상 화면들과 나란히 두고 차이를 확인하세요.</Annot>}>
      <div className="st-stage">
        <div className="st-boardwrap"><DimBoard /></div>
      </div>
    </MgScreen>
  );
}

// 7-1 번아웃
const BURNOUT_BANNER = { tone: "burnout", icon: "🥵", name: "번아웃", metric: "스트레스", val: 78, max: 100, recover: "메인화면에서 휴식 권장" };
function BurnoutToast() {
  return <StatusView tag="미니게임2 · ⑦-1 번아웃 — 발동 토스트 (0~3초)" s="42"
    fxgray vig="gray" cursor="trail" flash banner={BURNOUT_BANNER}
    toast={{ title: "⚠️ 번아웃 발동", trigger: "스트레스가 70을 넘었습니다 (78/100)" }}
    annot={<Annot label="기획서 6-4 · 회복">스트레스 <b>70↑</b> 발동 · 화면 회색·어둡게 + 회색 비네팅 + 슬라이드 흐릿(0.85) + 커서 잔상. 효과: 커서 느려짐·채팅 타이머 단축. <b>회복: 메인화면 휴식·스트레스 70 미만으로</b>. <span style={{ color: "#888" }}>※ 토스트는 3초 후 자동 소멸.</span></Annot>} />;
}
function BurnoutSettled() {
  return <StatusView tag="미니게임2 · ⑦-1 번아웃 — 토스트 사라진 후" s="33"
    fxgray vig="gray" cursor="trail" banner={BURNOUT_BANNER}
    annot={<Annot label="지속 상태">토스트는 사라지고 <b>상단 배너로 상태가 계속 표시</b>됩니다. 환경 효과(회색·비네팅·잔상)는 스트레스가 70 미만이 될 때까지 유지.</Annot>} />;
}

// 7-2 두통
const HEAD_BANNER = { tone: "headache", icon: "🤕", name: "두통", metric: "체력", val: 25, max: 100, recover: "체력 회복(커피·홍삼)·시간 손실 주의" };
function HeadacheToast() {
  return <StatusView tag="미니게임2 · ⑦-2 두통 — 발동 토스트 (0~3초)" s="40"
    tint="headache" shake vig="redstrong" flash slideBlur banner={HEAD_BANNER}
    toast={{ title: "⚠️ 두통 발동", trigger: "체력이 30 아래로 떨어졌습니다 (25/100)" }}
    annot={<Annot label="기획서 6-4 · 회복">체력 <b>30↓</b> 발동 · 노랑/빨강 색조 + 2px 흔들림 + 강한 빨간 비네팅(펄스) + <b>슬라이드 흐려짐</b> + 곧 대화창. <b>회복: 체력 30 이상으로(커피·홍삼)</b>. <span style={{ color: "#888" }}>※ 토스트는 3초 후 자동 소멸.</span></Annot>} />;
}
function HeadacheDialogScreen() {
  return <StatusView tag="미니게임2 · ⑦-2 두통 — 대화창 + 시계 1시간 점프" s="38"
    tint="headache" shake vig="redstrong" dialog clockJump slideBlur banner={HEAD_BANNER}
    annot={<Annot label="발동 즉시 연출">중앙 대화창 “너무 머리가 아파서 못하겠어…” + <b>게임 시계 1시간 점프</b>(14:00→15:00, ‘-1시간’ 빨강 플로팅). 확인 누르면 닫힘. <span style={{ color: "#888" }}>※ 시계는 메인 HUD 소속 — 두통 시 시간 손실 피드백.</span></Annot>} />;
}
function HeadacheSettled() {
  return <StatusView tag="미니게임2 · ⑦-2 두통 — 대화창 닫힌 후" s="30"
    tint="headache" shake vig="redstrong" slideBlur
    banner={{ tone: "headache", icon: "🤕", name: "두통", metric: "체력", val: 25, max: 100, recover: "체력 회복 필요 · 시간 1시간 손실됨" }}
    annot={<Annot label="지속 상태">대화창이 닫히고 미니게임 재개. 배너에 <b>‘체력 25 · 시간 1시간 손실됨’</b> 유지. 흔들림·비네팅은 체력 30 이상이 될 때까지 지속.</Annot>} />;
}

// 7-3 커피 과다복용
const COFFEE_BANNER = { tone: "coffee", icon: "☕", name: "손 떨림 (커피 과다)", recover: "커피 사용 자제 · 시간 경과로 해소" };
function CoffeeToast() {
  return <StatusView tag="미니게임2 · ⑦-3 커피 과다복용 — 발동 토스트 (0~3초)" s="45"
    tint="coffee" jitter coffeeCup cursor="jitter" flash banner={COFFEE_BANNER}
    toast={{ title: "⚠️ 커피 과다복용", trigger: "커피를 연속 2회 사용했습니다" }}
    annot={<Annot label="기획서 6-4 · 회복">커피 <b>연속 2회</b> 발동 · 따뜻한 갈색/노란 톤 + 1px 떨림 + 좌하단 커피잔 깜빡임. 손 떨려 커서 진동(예측 가능). <b>회복: 커피 사용 자제·시간 경과</b>. <span style={{ color: "#888" }}>※ 토스트는 3초 후 자동 소멸.</span></Annot>} />;
}
function CoffeeSettled() {
  return <StatusView tag="미니게임2 · ⑦-3 커피 과다복용 — 토스트 사라진 후" s="36"
    tint="coffee" jitter coffeeCup cursor="jitter" banner={COFFEE_BANNER}
    annot={<Annot label="지속 상태">토스트 소멸 후 배너 유지. 떨림·갈색 톤·커피잔 깜빡임은 지속되며, 커피를 더 쓰지 않고 시간이 지나면 해소됩니다.</Annot>} />;
}

// 7-3 보조 : 메인화면에서 커피 사용 시도 시 경고 (별도 화면)
function CoffeeUseWarning() {
  return (
    <Frame accent="#ffe08a">
      <div className="mg-root">
        <div className="mg-tagrow"><Tag>상태이상 보조 — ☕ 메인화면에서 커피 사용 시도</Tag><Legend /></div>
        <div className="mg-header"><span className="mg-goal">🖥 메인화면 (아이템 사용 가능 구간) — 커피를 한 번 더 누르려 하면</span></div>
        <div className="mg-stage">
          <div style={{ position: "relative", height: "100%" }}>
            {/* 메인화면 아이템 바 (여기선 활성) */}
            <div className="cw-itembar">
              <span className="mg-item-label">🎒 아이템</span>
              <div className="cw-slots">
                <div className="cw-slot">담배 🚬</div>
                <div className="cw-slot warn">커피 ☕<span className="cw-tap">눌림</span></div>
                <div className="cw-slot">홍삼 🧴</div>
              </div>
            </div>
            <div className="mg-popup-overlay">
              <div className="mg-popup">
                <div className="mg-popup-icon">☕😵</div>
                <div className="mg-popup-title" style={{ color: "var(--marker)" }}>한 잔 더 마시면 큰일난다!</div>
                <div className="mg-popup-desc">이미 커피 과다복용 상태입니다. 지금 더 마시면 손 떨림이 심해집니다.</div>
                <div className="mg-popup-btns">
                  <SkBtn primary style={{ flex: 1 }}>참는다 (취소)</SkBtn>
                  <SkBtn style={{ flex: 1 }}>그래도 마신다</SkBtn>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mg-annot"><Annot label="별도 화면 · 메인화면">커피 과다복용 상태에서 <b>메인화면</b>의 커피 아이템을 다시 누르면 경고가 뜹니다. (미니게임 중에는 아이템 자체가 비활성이라 이 경고는 메인화면 전용)</Annot></div>
      </div>
    </Frame>
  );
}

// ═══════════ 상태 전이 흐름도 ═══════════
function FlowNode({ children, tone, w }) {
  return <div className={"flow-node " + (tone || "")} style={{ width: w }}>{children}</div>;
}
function MeetingFlow() {
  return (
    <Frame accent="#ffe08a">
      <div className="mg-root">
        <div className="mg-tagrow"><Tag>미니게임2 · 회의 준비 — 상태 전이 흐름도</Tag><Legend /></div>
        <div className="flow-wrap">
          <div className="flow-col">
            <FlowNode tone="start">진입<br/><b>① 배치 중</b><span className="flow-sub">제한시간 60초만 표시</span></FlowNode>
            <div className="flow-side">
              <span className="flow-side-l">스트레스 50↑</span>
              <span className="flow-down">▼</span>
              <FlowNode tone="warn" w={190}>①′ 7장 난이도<span className="flow-sub">80↑ 힌트 짧아짐</span></FlowNode>
            </div>
          </div>

          <span className="flow-arrow">슬라이드 전부 정답 + 함정 전부 휴지통 ▶</span>

          <FlowNode tone="grade"><b>자동 종료</b><span className="flow-sub">제한시간 전에도 / 제출 버튼 없음</span></FlowNode>

          <div className="flow-branch">
            <div className="flow-brow"><span className="flow-cond">오류 0~1</span><span className="flow-arrow">▶</span><FlowNode tone="ok">③ 성공<span className="flow-sub">업무량 -20</span></FlowNode></div>
            <div className="flow-brow"><span className="flow-cond">오류 2~3</span><span className="flow-arrow">▶</span><FlowNode tone="partial">④ 부분성공<span className="flow-sub">-10 · 스트레스 +8</span></FlowNode></div>
            <div className="flow-brow"><span className="flow-cond">시간초과 / 오류 4+</span><span className="flow-arrow">▶</span><FlowNode tone="fail">⑤ 실패<span className="flow-sub">-3 · 스트 +20 · 체력 -8</span></FlowNode></div>
          </div>

          <span className="flow-arrow">▶ 다음 미니게임 / 메인화면</span>
        </div>

        <div className="flow-bottom">
          <div className="flow-inter">
            <span className="flow-tag2">⑥ 팝업 이벤트 (배치 중 랜덤 끼어듦)</span>
            <span>상사 옆에 서 있음 → 확인 후 재개(난이도↑) · 상사 도움 → 수락=성공처리 / 거절=속행</span>
          </div>
          <div className="flow-inter">
            <span className="flow-tag2">⑦ 상태이상 (배치 중 상시 시각효과)</span>
            <span>🥵 번아웃(스트 70↑) · 🤕 두통(체력 30↓) · ☕ 커피 과다복용(연속 2회)</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}><Legend /></div>
      </div>
    </Frame>
  );
}


Object.assign(window, {
  MeetingPlacing, MeetingPlacing7, MeetingCheck,
  ResultSuccess, ResultPartial, ResultFail,
  PopupBoss, PopupHelp,
  StatusNormal, BurnoutToast, BurnoutSettled,
  HeadacheToast, HeadacheDialogScreen, HeadacheSettled,
  CoffeeToast, CoffeeSettled, CoffeeUseWarning,
  MeetingFlow,
  // 함정·이벤트 시스템에서 재사용할 빌딩 블록
  MgScreen, Slide, OrderRow, Annot, Legend, SLIDES, HINTS, GREEN,
});
