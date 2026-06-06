// mg2-traps-pixel.jsx — 미니게임2 픽셀 게임화면: 함정 슬라이드 + 중간 이벤트 12종
// 재사용(window): Monitor, EditorChrome, DeskScene, RetroDeco, Screen, EditorShell,
//   SlideContent, SnapSlot, Arrow, PxPanel, PxButton, PX
const PXINK = "var(--ink)", PXMK = "#e5383b", PXGN = "#2e8b57", PXYL = "var(--yellow)";

// ───────── 카드 (제목+부제+미니비주얼) — 함정/일반 공용 ─────────
function PxCard({ title, sub, kind, n, mark, trap, fresh, locked, drag, w }) {
  const width = w || 120, height = width * 0.96;
  const wrong = mark === "wrong", ok = mark === "ok", trash = mark === "trash";
  const bc = wrong ? PXMK : ok || trash ? PXGN : PXINK;
  const headBg = wrong ? "#ffe3e0" : ok || trash ? "#e3f7e2" : "#eef2f8";
  return (
    <div style={{ position: "relative", width, height, background: "#fdfcf2", border: `${wrong || ok || trash ? 3 : 2.5}px solid ${bc}`,
      boxShadow: locked ? "3px 3px 0 " + PXMK : "3px 3px 0 var(--ink)", display: "flex", flexDirection: "column",
      boxSizing: "border-box", imageRendering: "pixelated", transform: wrong ? "rotate(-2deg)" : undefined, opacity: trash ? .6 : 1 }}>
      {fresh && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontFamily: "var(--px-body)", fontSize: 10, color: "var(--ink)", background: PXYL, border: "2px solid var(--ink)", padding: "0 6px", whiteSpace: "nowrap", zIndex: 3 }}>추가</span>}
      {wrong && <span style={{ position: "absolute", top: -10, right: -9, width: 23, height: 23, borderRadius: "50%", background: PXMK, color: "#fff", border: "2.5px solid #fff", boxShadow: "0 0 0 2px var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--px-head)", fontSize: 11, zIndex: 3 }}>✗</span>}
      {(ok || trash) && <span style={{ position: "absolute", top: -10, right: -9, width: 23, height: 23, borderRadius: "50%", background: PXGN, color: "#fff", border: "2.5px solid #fff", boxShadow: "0 0 0 2px var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, zIndex: 3 }}>{trash ? "🗑" : "✓"}</span>}
      {locked && <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 26, zIndex: 4 }}>🔒</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderBottom: "2px solid var(--ink)", background: headBg }}>
        {n != null && <span style={{ fontFamily: "var(--px-mono)", fontSize: 11, color: "#fff", background: bc === PXINK ? "var(--ink)" : bc, padding: "0 4px", minWidth: 14, textAlign: "center" }}>{n}</span>}
        <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}><SlideContent kind={kind || "status"} /></div>
      <div style={{ borderTop: "1.5px dashed #d8d2c0", padding: "2px 6px", minHeight: 22, display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--px-body)", fontSize: 10, color: "#8a8478", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
      </div>
    </div>
  );
}
function PxEmpty({ n, w }) {
  const width = w || 120, height = width * 0.96;
  return <div style={{ width, height, border: "3px dashed #9aa3b5", background: "rgba(255,255,255,.4)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxSizing: "border-box" }}>
    <span style={{ position: "absolute", top: 4, left: 6, fontFamily: "var(--px-mono)", fontSize: 12, color: "#9aa3b5" }}>{n}</span>
    <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#9aa3b5" }}>비어있음</span>
  </div>;
}
function PxSnap({ n, w }) {
  const width = w || 120, height = width * 0.96;
  return <div className="px-snap" style={{ width, height, border: "3px dashed var(--yellow)", background: "rgba(255,210,63,.2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxSizing: "border-box" }}>
    <span style={{ position: "absolute", top: 4, left: 6, fontFamily: "var(--px-mono)", fontSize: 12, color: "#b89324" }}>{n}</span>
    <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#b89324" }}>여기 🧲</span>
  </div>;
}

// 휴지통
function PxTrash({ ok, wrong }) {
  const bc = ok ? PXGN : wrong ? PXMK : "#b06b4a";
  const bg = ok ? "#e3f7e2" : wrong ? "#ffe3e0" : "#f5e7df";
  return <div style={{ width: 156, flex: "0 0 auto", border: `3px ${ok || wrong ? "solid" : "dashed"} ${bc}`, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, padding: 8 }}>
    <span style={{ fontSize: 30 }}>🗑️</span>
    <span style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "var(--ink)" }}>발표 자료 아님</span>
    <span style={{ fontFamily: "var(--px-body)", fontSize: 10, color: "#9a7d62" }}>함정을 여기로</span>
  </div>;
}

// 토스트
function PxToast({ children, tone, pos }) {
  const neg = tone !== "fake";
  return <div style={{ position: "absolute", left: "50%", top: pos === "mid" ? "44%" : 10, transform: "translateX(-50%)", zIndex: 20,
    fontFamily: "var(--px-head)", fontSize: 14, padding: "9px 18px", border: `3px solid ${neg ? PXMK : "#d9b73a"}`,
    background: neg ? "#ffe3e0" : "#fff3c4", color: neg ? "#b0341f" : "#8a6d12", boxShadow: "4px 4px 0 rgba(0,0,0,.22)", whiteSpace: "nowrap" }}>{children}</div>;
}

// 카드/부제 데이터
const NSUB = { agenda: "발표 순서 안내", status: "지난 분기 지표", problem: "병목·이슈 정리", solution: "3가지 개선안", effect: "ROI 전망", plan: "일정·담당", closing: "요약·Q&A" };
const ncard = (id) => ({ title: SL[id].title, sub: NSUB[id], kind: SL[id].kind });
const TCARD = [
  { title: "고객 만족도 조사", sub: "응답률 78%·평균 4.2점", kind: "status", trap: true },
  { title: "재택근무 현황 분석", sub: "비대면 비율 65%", kind: "problem", trap: true },
  { title: "직원 휴가 사용률", sub: "평균 12.3일·권장 미달", kind: "status", trap: true },
];

// 함정 보드 (슬롯 줄 + 트레이+휴지통)
function TrapBoardPx({ slots, tray, w, trash, note, shake, dim }) {
  return (
    <div className={shake ? "mg-st-shake" : ""} style={dim ? { opacity: .5 } : undefined}>
      <div style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#5a6478", marginBottom: 7 }}>{note || "발표 순서 ▶ 빈 칸에 드래그 · 함정은 휴지통으로"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", flexWrap: "nowrap" }}>
        {slots.map((sl, i) => (
          <React.Fragment key={i}>
            {sl.snap ? <PxSnap n={sl.n} w={w} /> : sl.empty ? <PxEmpty n={sl.n} w={w} /> : <PxCard {...sl} w={w} />}
            {i < slots.length - 1 && <Arrow />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, background: "#fff8e6", border: "3px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", padding: "8px 12px" }}>
          <div style={{ fontFamily: "var(--px-body)", fontSize: 11.5, color: "#8a7d52", marginBottom: 6 }}>🗂 카드 더미 · 정답+함정 섞임 ({tray.length}장)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
            {tray.map((c, i) => <PxCard key={i} {...c} w={w} />)}
          </div>
        </div>
        <PxTrash {...(trash || {})} />
      </div>
    </div>
  );
}

// ═══════════ 함정 상태 6종 ═══════════
function PxTrapBasic() {
  const slots = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { snap: true, n: 3 }, { empty: true, n: 4 }, { empty: true, n: 5 }];
  const tray = [ncard("problem"), TCARD[0], ncard("solution"), TCARD[1], ncard("closing")];
  return <DeskScene deco={<RetroDeco />}>
    <EditorShell hud={{ done: 2, total: 5, s: "48" }} board={<TrapBoardPx slots={slots} tray={tray} w={112} trash={{}} />} />
  </DeskScene>;
}
function PxTrap50() {
  const slots = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { ...ncard("problem"), n: 3 }, { snap: true, n: 4 }, { empty: true, n: 5 }, { empty: true, n: 6 }, { empty: true, n: 7 }];
  const tray = [ncard("solution"), TCARD[0], ncard("effect"), ncard("plan"), TCARD[2], ncard("closing")];
  return <DeskScene deco={<RetroDeco />}>
    <EditorShell hud={{ done: 3, total: 7, s: "50" }} board={<TrapBoardPx slots={slots} tray={tray} w={92} trash={{}} note="발표 순서 ▶ 7장 모드 · 카드 9장(정답7+함정2)" />} />
  </DeskScene>;
}
function PxTrap80() {
  const slots = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { ...ncard("problem"), n: 3 }, { ...ncard("solution"), n: 4 }, { snap: true, n: 5 }, { empty: true, n: 6 }, { empty: true, n: 7 }];
  const tray = [ncard("effect"), TCARD[0], ncard("plan"), TCARD[1], ncard("closing"), TCARD[2]];
  return <DeskScene deco={<RetroDeco />} filter="grayscale(.1)">
    <EditorShell hud={{ done: 4, total: 7, s: "33", danger: true }} board={<TrapBoardPx slots={slots} tray={tray} w={92} trash={{}} shake note="발표 순서 ▶ 80↑ 고난도 · 카드 10장(정답7+함정3)·흔들림" />} />
  </DeskScene>;
}
function PxTrapTrashOk() {
  const slots = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { snap: true, n: 3 }, { empty: true, n: 4 }, { empty: true, n: 5 }];
  const tray = [ncard("problem"), ncard("solution"), ncard("closing")];
  return <DeskScene deco={<RetroDeco />}>
    <EditorShell hud={{ done: 2, total: 5, s: "44" }} board={<TrapBoardPx slots={slots} tray={tray} w={112} trash={{ ok: true }} note="함정 1장을 휴지통에 넣어 제거 (정답 처리)" />} />
    <PxToast tone="fake">🗑️ 함정 제거됨 ✓ (패널티 없음)</PxToast>
  </DeskScene>;
}
function PxTrapSlotWrong() {
  const slots = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { ...TCARD[0], mark: "wrong", n: 3 }, { empty: true, n: 4 }, { empty: true, n: 5 }];
  const tray = [ncard("problem"), ncard("solution"), ncard("closing")];
  return <DeskScene deco={<RetroDeco />}>
    <EditorShell hud={{ done: 3, total: 5, s: "41", danger: true, status: { bg: "#ffd9d4", icon: "⚠️", color: "#c0392b", text: "함정을 슬롯에 배치 → 오답 (-3초, 자동 복귀)" } }}
      board={<TrapBoardPx slots={slots} tray={tray} w={112} trash={{}} note="3번 슬롯에 함정 — 오답, 곧 복귀" />} />
    <PxToast tone="neg" pos="mid">🤔 우리 부서의 슬라이드가 아닌 것 같은데...?</PxToast>
    <span style={{ position: "absolute", top: 70, right: 60, fontFamily: "var(--px-head)", fontSize: 30, color: PXMK, zIndex: 20 }}>-3초</span>
  </DeskScene>;
}
function PxAnswerTrash() {
  const slots = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { snap: true, n: 3 }, { empty: true, n: 4 }, { empty: true, n: 5 }];
  const tray = [{ ...ncard("problem"), mark: "wrong" }, ncard("solution"), ncard("closing")];
  return <DeskScene deco={<RetroDeco />}>
    <EditorShell hud={{ done: 2, total: 5, s: "39", danger: true, status: { bg: "#ffd9d4", icon: "⚠️", color: "#c0392b", text: "정답을 휴지통에 → 오답 (-3초, 자동 복귀)" } }}
      board={<TrapBoardPx slots={slots} tray={tray} w={112} trash={{ wrong: true }} note="‘문제점(정답)’을 휴지통에 — 오답" />} />
    <PxToast tone="neg" pos="mid">❌ 발표에 필요한 자료예요! 되돌립니다</PxToast>
    <span style={{ position: "absolute", top: 70, right: 60, fontFamily: "var(--px-head)", fontSize: 30, color: PXMK, zIndex: 20 }}>-3초</span>
  </DeskScene>;
}

// ═══════════ 중간 이벤트 12종 ═══════════
const EV_SLOTS = [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { ...ncard("problem"), n: 3 }, { snap: true, n: 4 }, { empty: true, n: 5 }];
const EV_TRAY = [ncard("solution"), TCARD[0], ncard("closing")];
function EvBoard({ dim, shake, extraSlot, extraTray }) {
  const slots = extraSlot ? [{ ...ncard("agenda"), n: 1 }, { ...ncard("status"), n: 2 }, { snap: true, n: 3 }, { ...ncard("problem"), n: 4 }, { empty: true, n: 5 }, { empty: true, n: 6 }] : EV_SLOTS;
  const tray = extraTray ? [...extraTray, ...EV_TRAY] : EV_TRAY;
  return <TrapBoardPx slots={slots} tray={tray} w={extraSlot ? 96 : 108} trash={{}} dim={dim} shake={shake} note="진행 중 보드 (이벤트 발동)" />;
}
function EvShell({ board }) {
  return <DeskScene deco={<RetroDeco />}><EditorShell hud={{ done: 3, total: 5, s: "40" }} board={board} /></DeskScene>;
}

// 상사 흉상 실루엣
function BossBustPx() {
  return <div style={{ position: "absolute", inset: 0, zIndex: 16, pointerEvents: "none", overflow: "hidden" }}>
    <svg viewBox="0 0 300 320" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", top: "-6%", right: "2%", height: "80%", opacity: .32 }}>
      <defs><filter id="evbossPx" x="-6%" y="-6%" width="112%" height="112%"><feGaussianBlur stdDeviation="1.6" /></filter></defs>
      <g filter="url(#evbossPx)" fill="#161616"><circle cx="150" cy="84" r="52" /><path d="M 18 320 C 26 205 80 142 150 140 C 220 142 274 205 282 320 Z" /></g>
    </svg>
  </div>;
}
function BossSpeakPx({ children }) {
  return <React.Fragment>
    <div style={{ position: "absolute", top: 8, left: 8, zIndex: 19, fontFamily: "var(--px-body)", fontSize: 11, color: "#3f6fa5", background: "#e9f1fb", border: "1.5px dashed #7aa3cf", padding: "2px 9px" }}>⑥ 상사 등장(3초) → 사라지며 이 이벤트</div>
    <BossBustPx />
    <div style={{ position: "absolute", top: 40, right: 180, zIndex: 19, maxWidth: 320, fontFamily: "var(--px-head)", fontSize: 15, background: "#fff", border: "3px solid var(--ink)", borderRadius: 14, padding: "11px 16px", boxShadow: "4px 4px 0 rgba(0,0,0,.22)" }}>{children}</div>
  </React.Fragment>;
}
// 페이크 이벤트용 — 사람 그림자(실루엣) + 말풍선 + 3초 자동 소멸
function PersonSpeakPx({ children, who }) {
  return <React.Fragment>
    <div style={{ position: "absolute", top: 8, left: 8, zIndex: 19, fontFamily: "var(--px-body)", fontSize: 11, color: "#3f6fa5", background: "#e9f1fb", border: "1.5px dashed #7aa3cf", padding: "2px 9px" }}>{who} 그림자 등장 → 말풍선 → 3초 후 자동 소멸</div>
    <BossBustPx />
    <div style={{ position: "absolute", top: 40, right: 180, zIndex: 19, maxWidth: 320, fontFamily: "var(--px-head)", fontSize: 15, background: "#fff", border: "3px solid var(--ink)", borderRadius: 14, padding: "11px 16px", boxShadow: "4px 4px 0 rgba(0,0,0,.22)" }}>{children}</div>
  </React.Fragment>;
}
// PC 카톡창
function KakaoPCPx({ title, msgs, votes, style }) {
  return <div style={{ position: "absolute", zIndex: 20, width: 380, border: "3px solid var(--ink)", boxShadow: "6px 6px 0 rgba(0,0,0,.3)", ...style }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fee500", padding: "7px 12px", borderBottom: "3px solid var(--ink)" }}>
      <span style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "#3a2e00" }}>💬 {title}</span>
      <span style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "#3a2e00", border: "2px solid var(--ink)", background: "#fff7b0", padding: "0 6px" }}>✕</span>
    </div>
    <div style={{ background: "#b2c7d9", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      {msgs.map((m, i) => <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
        <span style={{ width: 30, height: 30, border: "2px solid var(--ink)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "0 0 auto" }}>{m[0]}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#2a3a47" }}>{m[1]}</span>
          <span style={{ fontFamily: "var(--px-body)", fontSize: 13, background: "#fff", border: "2px solid var(--ink)", padding: "5px 10px" }}>{m[2]}</span>
        </div>
      </div>)}
      {votes && <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4, paddingTop: 8, borderTop: "2px dashed rgba(29,31,46,.3)" }}>
        {["한식", "일식", "양식"].map((v) => <PxButton key={v} bg="#fff" small>{v}</PxButton>)}
      </div>}
    </div>
  </div>;
}

function EvWrap({ children, overlay }) {
  return <div style={{ position: "relative", height: "100%" }}>{children}{overlay}</div>;
}
const Float = ({ children, big }) => <span style={{ position: "absolute", top: 66, right: 56, fontFamily: "var(--px-head)", fontSize: big ? 38 : 28, color: PXMK, zIndex: 20 }}>{children}</span>;

// 1. 슬라이드 추가 요청 (팀장)
function PxEvAddSlide() {
  return <EvWrap overlay={<BossSpeakPx>한 장 더 넣어주세요 📎</BossSpeakPx>}>
    <EvShell board={<EvBoard extraSlot extraTray={[{ title: "위험 요소", sub: "리스크 정리", kind: "problem", fresh: true }]} />} />
  </EvWrap>;
}
// 2. 발표 시간 단축 (팀장)
function PxEvTimeCut() {
  return <EvWrap overlay={<React.Fragment>
    <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", zIndex: 19, fontFamily: "var(--px-head)", fontSize: 26, background: "#fff", border: "3px solid " + PXMK, padding: "6px 18px", color: PXMK }} className="px-timer danger">⏱ 0:34 → 0:24</div>
    <Float big>-10초</Float>
    <BossSpeakPx>발표 시간 10분 줄였어요 ⏱️</BossSpeakPx>
  </React.Fragment>}>
    <EvShell board={<EvBoard dim />} />
  </EvWrap>;
}
// 4. 상사 카톡 폭격 (PC 카톡창) — 슬라이드 흐려짐은 두통 상태이상으로 이동
function PxEvKakao() {
  return <EvWrap overlay={<React.Fragment>
    <KakaoPCPx title="까까오톡 PC" style={{ top: 36, right: 24 }}
      msgs={[["😤", "김팀장", "지금 어디까지 됐어요?"], ["😤", "김팀장", "오늘 안에 끝나죠?"], ["😤", "김팀장", "검토 빨리 부탁해요"]]} />
  </React.Fragment>}>
    <EvShell board={<EvBoard dim />} />
  </EvWrap>;
}
// 5. 추가 함정 등장 (옆 부서 메일)
function PxEvAddTrap() {
  return <EvWrap overlay={<PxToast tone="neg">📧 옆 부서에서 메일로 자료를 보냈어요 — 카드 더미에 섞였습니다!</PxToast>}>
    <EvShell board={<EvBoard extraTray={[{ title: "옆 부서 발표자료", sub: "메일로 잘못 전달됨", kind: "status", trap: true, fresh: true }]} />} />
  </EvWrap>;
}
// 6. 슬라이드 잠금 (팀장)
function PxEvLock() {
  const slots = [{ ...ncard("agenda"), n: 1, locked: true }, { ...ncard("status"), n: 2 }, { ...ncard("problem"), n: 3 }, { snap: true, n: 4 }, { empty: true, n: 5 }];
  return <EvWrap overlay={<BossSpeakPx>이 슬라이드 다시 검토해보세요 🔒</BossSpeakPx>}>
    <DeskScene deco={<RetroDeco />}><EditorShell hud={{ done: 3, total: 5, s: "40" }}
      board={<TrapBoardPx slots={slots} tray={EV_TRAY} w={108} trash={{}} note="진행 중 보드 — 잠긴 카드 5초간 드래그 불가" />} /></DeskScene>
  </EvWrap>;
}
// 7. 슬라이드 셔플 2장
function PxEvShuffle() {
  return <EvWrap overlay={<React.Fragment>
    <span style={{ position: "absolute", left: "11%", top: 60, fontFamily: "var(--px-head)", fontSize: 30, color: PXMK, zIndex: 18 }}>⇄</span>
    <PxToast tone="neg">어? 슬라이드 순서가 바뀌었네... 😱</PxToast>
  </React.Fragment>}>
    <div className="mg-st-shake"><EvShell board={<EvBoard />} /></div>
  </EvWrap>;
}
// 8. 마우스 떨림
function PxEvJitter() {
  return <EvWrap overlay={<React.Fragment>
    <span style={{ position: "absolute", left: "32%", top: "54%", fontSize: 28, zIndex: 18 }} className="mg-st-jitter">🖐️</span>
    <span style={{ position: "absolute", left: "50%", top: "40%", transform: "translateX(-50%)", zIndex: 19, fontFamily: "var(--px-head)", fontSize: 15, color: "#fff", background: "var(--marker)", border: "2.5px solid var(--ink)", padding: "6px 14px", boxShadow: "3px 3px 0 rgba(0,0,0,.25)" }}>✋ 미끄러졌다!</span>
    <PxToast tone="neg">손이 떨려 카드가 자꾸 미끄러진다... 😰</PxToast>
  </React.Fragment>}>
    <div className="mg-st-jitter"><EvShell board={<EvBoard />} /></div>
  </EvWrap>;
}
// 9. 멍게 상사의 참견 (시그니처)
function PxEvSignature() {
  return <EvWrap overlay={<React.Fragment>
    <BossSpeakPx>잠깐... 슬라이드 순서가 이렇게 돼야하지 않나...?</BossSpeakPx>
    <Float>-3초</Float>
  </React.Fragment>}>
    <div className="mg-st-shake"><EvShell board={<EvBoard />} /></div>
  </EvWrap>;
}
// 10. 멍게 상사의 잡담 (페이크)
function PxEvChat() {
  return <EvWrap overlay={<PersonSpeakPx who="상사">어제 그 드라마 봤어요~? 📺</PersonSpeakPx>}>
    <EvShell board={<EvBoard />} />
  </EvWrap>;
}
// 11. 회식 메뉴 카톡 (PC 단톡방)
function PxEvDinner() {
  return <EvWrap overlay={<React.Fragment>
    <KakaoPCPx title="까까오톡 PC · 우리팀 단톡방" votes style={{ top: 30, left: "50%", transform: "translateX(-50%)", width: 410 }}
      msgs={[["🙂", "이대리", "🍻 오늘 회식 메뉴 투표 좀!"], ["😀", "박사원", "저는 고기 당겨요"], ["😋", "최주임", "아무거나 다 좋아요~"]]} />
    <PxToast tone="fake">회식 메뉴 투표 알림 🍻</PxToast>
  </React.Fragment>}>
    <EvShell board={<EvBoard dim />} />
  </EvWrap>;
}
// 12. 옆자리 동료 점심 (페이크 · 작은 말풍선)
function PxEvLunch() {
  return <EvWrap overlay={<PersonSpeakPx who="옆자리 동료">오늘 점심 뭐 먹을래요? 🍱</PersonSpeakPx>}>
    <EvShell board={<EvBoard />} />
  </EvWrap>;
}

Object.assign(window, {
  PxCard, PxTrash, PxToast, TrapBoardPx, EvBoard, EvShell, BossSpeakPx, KakaoPCPx, EvWrap,
  PxTrapBasic, PxTrap50, PxTrap80, PxTrapTrashOk, PxTrapSlotWrong, PxAnswerTrash,
  PxEvAddSlide, PxEvTimeCut, PxEvKakao, PxEvAddTrap, PxEvLock,
  PxEvShuffle, PxEvJitter, PxEvSignature, PxEvChat, PxEvDinner, PxEvLunch,
});
