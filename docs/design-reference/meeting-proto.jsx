// meeting-proto.jsx — 회의 준비 미니게임 인터랙티브 프로토타입 (픽셀아트 레트로 CRT)
// pixel-kit.jsx(SlideContent, Badge, ProgressChips, PxPanel, PxButton, PX) + mg2-game.jsx(Monitor, PixWindow/Clock/Plant/Mug) 재사용
const { useState, useEffect, useRef } = React;

function clip(sub) { return sub.split(" ").slice(0, 2).join(" ") + "…"; }
function shuffle(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

const CARD_W = 120, CARD_H = 150;

// ── 픽셀 슬라이드 카드 (드래그 가능 + 실시간 채점 + 부제 캡션) ──
function PxSlideCard({ slide, n, mark, dragging, clipSub, canDrag, onDragStart, onDragEnd, w, locked, fresh, titleBlur }) {
  const wrong = mark === "wrong", ok = mark === "ok";
  const width = w || CARD_W, height = (w || CARD_W) * (CARD_H / CARD_W);
  const bc = locked ? "var(--marker)" : wrong ? "var(--marker)" : ok ? "var(--green)" : "var(--ink)";
  const headBg = wrong ? "#ffe3e0" : ok ? "#e3f7e2" : "#eef2f8";
  return (
    <div draggable={canDrag} onDragStart={onDragStart} onDragEnd={onDragEnd}
      style={{
        width, height, background: locked ? "#fbe3dd" : "#fdfcf2", border: `${wrong || ok || locked ? 3 : 2.5}px solid ${bc}`,
        boxShadow: dragging ? "7px 9px 0 rgba(29,31,46,.35)" : fresh ? "0 0 0 3px var(--yellow), 3px 3px 0 var(--ink)" : "3px 3px 0 var(--ink)",
        display: "flex", flexDirection: "column", boxSizing: "border-box", position: "relative",
        transform: dragging ? "rotate(3deg) scale(1.04)" : wrong ? "rotate(-2deg)" : undefined,
        cursor: canDrag ? "grab" : "default", imageRendering: "pixelated", transition: "transform .08s",
      }}>
      {fresh && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontFamily: "var(--px-body)", fontSize: 10, color: "var(--ink)", background: "var(--yellow)", border: "2px solid var(--ink)", padding: "0 6px", whiteSpace: "nowrap", zIndex: 3 }}>추가</span>}
      {locked && <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 26, zIndex: 4 }}>🔒</span>}
      {wrong && <Badge bg={PX.red}>✗</Badge>}
      {ok && <Badge bg={PX.green}>✓</Badge>}
      {canDrag && <span style={{ position: "absolute", top: 3, right: 5, fontFamily: "var(--px-mono)", fontSize: 12, color: "#aab" }}>⠿</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderBottom: "2px solid var(--ink)", background: headBg }}>
        {n != null && <span style={{ fontFamily: "var(--px-mono)", fontSize: 11, color: "#fff", background: bc === "var(--ink)" ? "var(--ink)" : bc, padding: "0 4px", minWidth: 14, textAlign: "center" }}>{n}</span>}
        <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", filter: titleBlur ? "blur(2.6px)" : undefined }}>{slide.title}</span>
      </div>
      <SlideContent kind={slide.kind} />
      <div style={{ borderTop: "1.5px dashed #d8d2c0", padding: "3px 6px", minHeight: 26, display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#8a8478", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {clipSub ? clip(slide.sub) : slide.sub}
        </span>
      </div>
    </div>
  );
}

// ── 빈 슬롯 ──
function EmptySlot({ n, over, snap, w }) {
  const width = w || CARD_W, height = (w || CARD_W) * (CARD_H / CARD_W);
  return (
    <div className={snap ? "px-snap" : ""}
      style={{ width, height, border: `3px dashed ${over || snap ? "var(--yellow)" : "#9aa3b5"}`,
        background: over || snap ? "rgba(255,210,63,.18)" : "rgba(255,255,255,.4)",
        display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", position: "relative" }}>
      <span style={{ position: "absolute", top: 4, left: 6, fontFamily: "var(--px-mono)", fontSize: 13, color: over || snap ? "#b89324" : "#9aa3b5" }}>{n}</span>
      {(over || snap) && <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#b89324" }}>여기에 딱! 🧲</span>}
    </div>
  );
}

const TIERS = {
  success: { title: "회의 준비 완료!", emoji: "🎉", bg: "#eafae8", color: "var(--green)", deltas: [{ label: "업무량", v: -20 }] },
  partial: { title: "아슬아슬하게 마쳤다…", emoji: "😮‍💨", bg: "#fff3df", color: "#c98a2a", deltas: [{ label: "업무량", v: -10 }, { label: "스트레스", v: 8 }] },
  fail:    { title: "회의 준비 망했다…", emoji: "💀", bg: "#f6e3e0", color: "var(--marker)", deltas: [{ label: "업무량", v: -3 }, { label: "스트레스", v: 20 }, { label: "체력", v: -8 }] },
};

const STATUS = {
  burnout: { fx: "fx-gray", icon: "🥵", label: "번아웃", cap: "커서 움직이는 속도가 느려진 상태", cond: "스트레스 70↑" },
  headache: { fx: "fx-shake", icon: "🤕", label: "두통", cap: "커서가 크게 튀어 방향 예측 불가", cond: "체력 30↓" },
  coffee: { fx: "fx-jitter", icon: "☕", label: "손 떨림", cap: "커서가 잘게 떨림 (예측 가능)", cond: "커피 연속 2회" },
};

// PC 카톡창 (이벤트용)
function KakaoWin({ title, msgs, votes, onClose, style }) {
  return (
    <div style={{ position: "fixed", zIndex: 47, width: 380, border: "3px solid var(--ink)", boxShadow: "6px 6px 0 rgba(0,0,0,.35)", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fee500", padding: "7px 12px", borderBottom: "3px solid var(--ink)" }}>
        <span style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "#3a2e00" }}>💬 {title}</span>
        <span onClick={onClose} style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "#3a2e00", border: "2px solid var(--ink)", background: "#fff7b0", padding: "0 6px", cursor: "pointer" }}>✕</span>
      </div>
      <div style={{ background: "#b2c7d9", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <span style={{ width: 30, height: 30, border: "2px solid var(--ink)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "0 0 auto" }}>{m[0]}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#2a3a47" }}>{m[1]}</span>
              <span style={{ fontFamily: "var(--px-body)", fontSize: 13, background: "#fff", border: "2px solid var(--ink)", padding: "5px 10px" }}>{m[2]}</span>
            </div>
          </div>
        ))}
        {votes && <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4, paddingTop: 8, borderTop: "2px dashed rgba(29,31,46,.3)" }}>
          {["한식", "일식", "양식"].map((v) => <div key={v} onClick={onClose} style={{ cursor: "pointer" }}><PxButton bg="#fff" small>{v}</PxButton></div>)}
        </div>}
      </div>
    </div>
  );
}

// 상사 실루엣 (반투명 머리+어깨 흉상) — 전체 화면 기준으로 looming
function BossSilhouette() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 46, pointerEvents: "none", overflow: "hidden" }}>
      <svg viewBox="0 0 300 320" preserveAspectRatio="xMidYMax meet"
        style={{ position: "absolute", top: "-8%", right: "-2%", height: "125vh", width: "auto", opacity: .32 }}>
        <defs><filter id="bossSoftP" x="-6%" y="-6%" width="112%" height="112%"><feGaussianBlur stdDeviation="1.6" /></filter></defs>
        <g filter="url(#bossSoftP)" fill="#161616">
          <circle cx="150" cy="84" r="52" />
          <path d="M 18 320 C 26 205 80 142 150 140 C 220 142 274 205 282 320 Z" />
        </g>
      </svg>
    </div>
  );
}

function App() {
  const [stress, setStress] = useState(20);
  const [forcedTopic, setForcedTopic] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [statusFx, setStatusFx] = useState("");   // '' | burnout | headache | coffee
  const [bossEvent, setBossEvent] = useState(false);
  const [bossBanner, setBossBanner] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [floatMinus, setFloatMinus] = useState(null); // '-3초' | '-10초'
  const [trapMsg, setTrapMsg] = useState(null);
  const [overTrash, setOverTrash] = useState(false);
  const [lockId, setLockId] = useState(null);
  const [blur, setBlur] = useState(false);
  const [evToast, setEvToast] = useState(null);
  const evToastTimer = useRef(null);
  const [ev, setEv] = useState(null);             // {type, speak} 중간 이벤트 오버레이
  const [evJitter, setEvJitter] = useState(false);
  const [slipMsg, setSlipMsg] = useState(false);   // 마우스 떨림: 카드 미끄러짐 연출
  const slipTimer = useRef(null);
  const jitterTimer = useRef(null);
  const [autoEv, setAutoEv] = useState(true);     // 이벤트 자동 발생(10초 간격)
  const [headacheDlg, setHeadacheDlg] = useState(false);
  const [clockJump, setClockJump] = useState(false);
  const [statusToast, setStatusToast] = useState(null);
  const statusToastTimer = useRef(null);
  const firedPoints = useRef({});
  const usedEvents = useRef({});
  const trapMsgTimer = useRef(null);
  const floatTimer = useRef(null);

  const [game, setGame] = useState(null);
  const [place, setPlace] = useState({});
  const [time, setTime] = useState(60);
  const [phase, setPhase] = useState("play");
  const [marks, setMarks] = useState(null);
  const [result, setResult] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overSlot, setOverSlot] = useState(null);
  const lastTopic = useRef(-1);
  const gradeTimer = useRef(null);
  const bossTimer = useRef(null);
  const slowTimer = useRef(null);
  const lockTimer = useRef(null);
  const [slowMove, setSlowMove] = useState(false);

  function setBoss(on) {
    setBossEvent(on);
    if (on) { setBossBanner(true); clearTimeout(bossTimer.current); bossTimer.current = setTimeout(() => setBossBanner(false), 3000); }
    else setBossBanner(false);
  }

  function newGame(opts = {}) {
    clearTimeout(gradeTimer.current);
    clearTimeout(slowTimer.current); setSlowMove(false);
    const st = opts.stress != null ? opts.stress : stress;
    const mode = st >= 50 ? 7 : 5;
    const trapN = st >= 80 ? 3 : 2;
    const wrongMax = st >= 80 ? 3 : st >= 50 ? 4 : 5;
    let ti = opts.topic != null && opts.topic >= 0 ? opts.topic : forcedTopic;
    if (ti < 0) { do { ti = Math.floor(Math.random() * TOPICS.length); } while (TOPICS.length > 1 && ti === lastTopic.current); }
    lastTopic.current = ti;
    const slides = TOPICS[ti].slides.map((s, i) => ({ id: i, title: s[0], sub: s[1], s7: s[2], kind: s[3] }))
      .filter((s) => mode === 7 || !s.s7);
    const order = slides.map((s) => s.id);
    const traps = shuffle((TRAPS[ti] || []).slice()).slice(0, trapN).map((t, k) => ({ id: "t" + k, title: t[0], sub: t[1], kind: t[2], isTrap: true }));
    const all = [...slides, ...traps];
    const trayOrder = shuffle(all.map((s) => s.id));
    const p = {}; trayOrder.forEach((id) => (p[id] = "tray"));
    setGame({ topicIdx: ti, mode, slides, order, traps, all, trayOrder, wrongMax });
    setPlace(p); setTime(60); setPhase("play"); setMarks(null); setResult(null);
    setWrongCount(0); setLockId(null); setBlur(false); setEv(null); setTrapMsg(null); setFloatMinus(null);
    clearTimeout(lockTimer.current);
    setEvJitter(false); setSlipMsg(false); clearTimeout(jitterTimer.current); clearTimeout(slipTimer.current);
    firedPoints.current = {}; usedEvents.current = {};
  }
  const byId = (id) => game && game.all.find((s) => s.id === id);

  function penalty(answerTrash) {
    setTime((t) => Math.max(0, t - 3));
    setWrongCount((w) => w + 1);
    setFloatMinus("-3초"); clearTimeout(floatTimer.current); floatTimer.current = setTimeout(() => setFloatMinus(null), 1200);
    const msg = answerTrash ? "❌ 발표에 필요한 자료예요! 되돌립니다" : TRAP_MSGS[Math.floor(Math.random() * TRAP_MSGS.length)];
    setTrapMsg(msg); clearTimeout(trapMsgTimer.current); trapMsgTimer.current = setTimeout(() => setTrapMsg(null), 1500);
  }

  // 중간 이벤트 발동 (디버그 미리보기)
  const evTimer = useRef(null);
  function clearFreshSoon(id) {
    setTimeout(() => setGame((g) => g ? {
      ...g,
      slides: g.slides.map((c) => c.id === id ? { ...c, fresh: false } : c),
      traps: g.traps.map((c) => c.id === id ? { ...c, fresh: false } : c),
      all: g.all.map((c) => c.id === id ? { ...c, fresh: false } : c),
    } : g), 3000);
  }
  function fireEvent(type) {
    if (!game) return;
    clearTimeout(evTimer.current);
    const speakOf = { addSlide: "한 장 더 넣어주세요 📎", timeCut: "발표 시간 10분 줄였어요 ⏱️", lock: "이 슬라이드 다시 검토해보세요 🔒", signature: "잠깐... 슬라이드 순서가 이렇게 돼야하지 않나...?", chat: "어제 그 드라마 봤어요~? 📺", lunch: "오늘 점심 뭐 먹을래요? 🍱" };
    if (type === "timeCut") { setTime((t) => Math.max(0, t - 10)); setFloatMinus("-10초"); clearTimeout(floatTimer.current); floatTimer.current = setTimeout(() => setFloatMinus(null), 1300); }
    if (type === "jitter") { setEvJitter(true); clearTimeout(jitterTimer.current); jitterTimer.current = setTimeout(() => setEvJitter(false), 10000); }
    if (type === "addSlide") {
      const nid = game.order.length;
      const ns = { id: nid, title: "위험 요소", sub: "리스크 정리", kind: "problem", fresh: true };
      setGame((g) => {
        // 추가 슬라이드는 목차(맨 앞)·마무리(맨 뒤)가 아닌 중간 위치 중 한 곳이 정답
        const k = 1 + Math.floor(Math.random() * (g.order.length - 1)); // 1 ~ len-1
        const order = [...g.order]; order.splice(k, 0, nid);
        // 카드 더미에도 랜덤 위치(맨 앞·중간·맨 끝 모두 가능)에 삽입
        const trayOrder = [...g.trayOrder]; trayOrder.splice(Math.floor(Math.random() * (trayOrder.length + 1)), 0, nid);
        return { ...g, slides: [...g.slides, ns], order, all: [...g.all, ns], trayOrder };
      });
      setPlace((p) => ({ ...p, [nid]: "tray" }));
      clearFreshSoon(nid);
    }
    if (type === "addTrap") {
      const tid = "t" + (game.traps.length + 9);
      const nt = { id: tid, title: "옆 부서 발표자료", sub: "우리 발표와 무관", kind: "status", isTrap: true, fresh: true };
      setGame((g) => {
        // 카드 더미에도 랜덤 위치(맨 앞·중간·맨 끝 모두 가능)에 삽입
        const trayOrder = [...g.trayOrder]; trayOrder.splice(Math.floor(Math.random() * (trayOrder.length + 1)), 0, tid);
        return { ...g, traps: [...g.traps, nt], all: [...g.all, nt], trayOrder };
      });
      setPlace((p) => ({ ...p, [tid]: "tray" }));
      clearFreshSoon(tid);
      setEvToast("📧 옆 부서에서 메일로 자료를 보냈어요 — 카드 더미에 섞였습니다!");
      clearTimeout(evToastTimer.current); evToastTimer.current = setTimeout(() => setEvToast(null), 3000);
    }
    if (type === "lock") {
      const placed = game.order.filter((id) => typeof place[id] === "number");
      const cands = placed.length ? placed : game.order;
      const pick = cands[Math.floor(Math.random() * cands.length)]; // 랜덤 슬라이드 1개
      setLockId(pick);
      clearTimeout(lockTimer.current); lockTimer.current = setTimeout(() => setLockId(null), 5000); // 5초 잠금
    }
    if (type === "shuffle2" || type === "signature") {
      const placed = game.order.filter((id) => typeof place[id] === "number");
      if (placed.length >= 2) {
        setPlace((p) => {
          const np = { ...p };
          const arr = type === "signature" ? placed : shuffle(placed).slice(0, 2);
          const sh = shuffle(arr.map((id) => np[id]));
          arr.forEach((id, k) => (np[id] = sh[k]));
          return np;
        });
      }
      if (type === "shuffle2") { setEvToast("어? 슬라이드 순서가 바뀌었네... 😱"); clearTimeout(evToastTimer.current); evToastTimer.current = setTimeout(() => setEvToast(null), 3000); }
      if (type === "signature") { setTime((t) => Math.max(0, t - 3)); setFloatMinus("-3초"); clearTimeout(floatTimer.current); floatTimer.current = setTimeout(() => setFloatMinus(null), 1300); }
    }
    if (speakOf[type]) setBossEvent(true);
    setEv({ type, speak: speakOf[type] });
    if (type === "lunch") evTimer.current = setTimeout(() => { setEv(null); setBossEvent(false); }, 3000);
    else if (["kakao", "dinner"].includes(type)) { /* PC 카톡창: X 또는 투표로만 닫힘 (자동 닫힘 없음) */ }
    else evTimer.current = setTimeout(() => { setEv(null); if (speakOf[type]) setBossEvent(false); }, 3000);
  }
  useEffect(() => { newGame({ stress: 20 }); }, []);

  // 타이머
  useEffect(() => {
    if (phase !== "play" || paused) return;
    if (time <= 0) { finish(); return; }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [time, phase, paused]);

  // 중간 이벤트 자동 발생 — 10초에 첫 발동, 이후 20/30/40/50초 확률 트리거
  useEffect(() => {
    if (!autoEv || phase !== "play" || paused || !game) return;
    const elapsed = 60 - time;
    if (elapsed < 10 || elapsed % 10 !== 0 || firedPoints.current[elapsed]) return;
    firedPoints.current[elapsed] = true;
    // 게임이 끝나지 않은 한 매 10초마다 반드시 중간 이벤트 발생 (스트레스는 발생 여부가 아니라 종류 분포에만 영향)
    // 이전 이벤트가 진행 중이면: 까까오톡 창(수동 닫힘)은 다음 이벤트를 막지 않도록 닫고 진행, 그 외에는 건너뜀
    if (ev) {
      if (ev.type === "kakao" || ev.type === "dinner") setEv(null);
      else return;
    }
    const ALL = ["addSlide", "timeCut", "kakao", "addTrap", "lock", "shuffle2", "jitter", "signature", "chat", "dinner", "lunch"];
    // 한 판에서 같은 이벤트는 한 번만 — 아직 안 나온 이벤트 중에서 선택
    let pool = ALL.filter((t) => !usedEvents.current[t]);
    if (pool.length === 0) { usedEvents.current = {}; pool = ALL; } // 전부 소진되면 초기화 후 재사용
    const pick = pool[Math.floor(Math.random() * pool.length)];
    usedEvents.current[pick] = true;
    fireEvent(pick);
  }, [time, autoEv, phase, paused, game, stress]);

  // 실시간 채점 표시 — 제한시간 동안 계속 수정 가능, 슬라이드 전부 정답 + 함정 전부 버리면 자동 종료
  useEffect(() => {
    if (phase !== "play" || !game) return;
    const allPlaced = game.order.every((id) => typeof place[id] === "number");
    const trapsCleared = game.traps.every((t) => place[t.id] === "trash");
    if (!allPlaced) { if (marks) setMarks(null); return; }
    const m = {}; let errors = 0;
    game.order.forEach((correctId, i) => {
      const placedId = game.order.find((x) => place[x] === i);
      if (placedId === correctId) m[i] = "ok"; else { m[i] = "wrong"; errors++; }
    });
    setMarks(m);
    // 모든 슬라이드 정답 위치 + 모든 함정 휴지통 → 즉시 종료
    if (errors === 0 && trapsCleared) { gradeTimer.current = setTimeout(finish, 700); return () => clearTimeout(gradeTimer.current); }
  }, [place, phase, game]);

  function slotOf(i) { if (!game) return null; const id = game.order.find((x) => place[x] === i); return id == null ? null : game.slides.find((s) => s.id === id); }

  function finish() {
    if (!game || phase !== "play") return;
    clearTimeout(gradeTimer.current);
    clearTimeout(slowTimer.current); setSlowMove(false);
    const m = {}; let errors = 0;
    game.order.forEach((correctId, i) => {
      const placedId = game.order.find((x) => place[x] === i);
      if (placedId === correctId) m[i] = "ok"; else { m[i] = "wrong"; errors++; }
    });
    const trapsLeft = game.traps.filter((t) => place[t.id] !== "trash").length;
    // 최종 등급: 슬라이드 오류 + 휴지통에 안 버린 함정 수 합산
    const total = errors + trapsLeft;
    const tier = total <= 1 ? "success" : total <= 3 ? "partial" : "fail";
    setMarks(m); setResult({ tier, errors, trapsLeft, used: 60 - time }); setPhase("result");
  }

  function placeInSlot(did, target) {
    setPlace((prev) => {
      const np = { ...prev };
      const from = np[did];
      const occupant = game.order.find((x) => np[x] === target && x !== did);
      np[did] = target;
      if (occupant != null) np[occupant] = from;
      return np;
    });
  }

  function drop(target) {
    if (dragId == null || phase !== "play") return;
    const item = byId(dragId);
    if (lockId === dragId) { setDragId(null); setOverSlot(null); setOverTrash(false); return; }
    if (target === "trash") {
      if (item && item.isTrap) setPlace((p) => ({ ...p, [dragId]: "trash" }));
      else { penalty(true); setPlace((p) => ({ ...p, [dragId]: "tray" })); }
      setDragId(null); setOverSlot(null); setOverTrash(false); return;
    }
    if (typeof target === "number") {
      if (item && item.isTrap) { penalty(false); setPlace((p) => ({ ...p, [dragId]: "tray" })); setDragId(null); setOverSlot(null); return; }
      // 마우스 떨림: 카드가 미끄러져 슬롯에 안 들어가고 카드 더미로 되돌아감
      if (evJitter) {
        const did = dragId;
        setDragId(null); setOverSlot(null); setOverTrash(false);
        setPlace((p) => ({ ...p, [did]: "tray" }));
        setSlipMsg(true); clearTimeout(slipTimer.current); slipTimer.current = setTimeout(() => setSlipMsg(false), 850);
        return;
      }
      // 번아웃: 커서가 느려져 카드가 슬롯에 천천히 들어감
      if (statusFx === "burnout") {
        const did = dragId;
        setSlowMove(true); setDragId(null); setOverSlot(null); setOverTrash(false);
        clearTimeout(slowTimer.current);
        slowTimer.current = setTimeout(() => { placeInSlot(did, target); setSlowMove(false); }, 650);
        return;
      }
      placeInSlot(dragId, target);
    } else {
      setPlace((p) => ({ ...p, [dragId]: "tray" }));
    }
    setDragId(null); setOverSlot(null); setOverTrash(false);
  }

  if (!game) return null;
  const topic = TOPICS[game.topicIdx];
  const placedCount = game.order.filter((id) => typeof place[id] === "number").length;
  const N = game.order.length;
  const clipSub = stress >= 80;
  const tray = game.trayOrder.filter((id) => place[id] === "tray");
  const danger = time <= 10 && phase === "play";
  const hasErr = marks && Object.values(marks).some((v) => v === "wrong");
  const cw = N >= 7 ? 110 : 124;
  const trapsLeft = game.traps.filter((t) => place[t.id] !== "trash").length;
  const headBlur = statusFx === "headache";   // 두통 → 슬라이드 제목만 흐려짐
  // 드래그 중인 카드가 향할 첫 빈 슬롯 = 스냅 힌트
  const firstEmpty = game.order.findIndex((_, i) => !slotOf(i));

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#caa46a" }}>
      {/* 벽 / 책상 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "76%", background: "linear-gradient(#f3e2c0,#e9d3a8)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "76%", height: 6, background: "rgba(29,31,46,.25)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "24%", background: "linear-gradient(#b97a3e,#9c5f2c)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "24%", height: 5, background: "rgba(29,31,46,.4)" }} />
      {/* 픽셀 소품 */}
      <div style={{ position: "absolute", left: 34, top: 26 }}><PixWindow /></div>
      <div style={{ position: "absolute", right: 52, top: 30 }}><PixClock /></div>
      <div style={{ position: "absolute", right: 36, bottom: 14 }}><PixPlant /></div>
      <div style={{ position: "absolute", left: 56, bottom: 20 }}><PixMug /></div>

      {/* 모니터 중앙 배치 (스크롤 가능하도록 flex) */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 16px", overflow: "auto" }}>
        <div style={{ width: "min(1000px, 96vw)" }}>
          <Monitor variant="retro">
            <div style={{ position: "relative" }}>
            <div className={(statusFx ? STATUS[statusFx].fx : "") + (evJitter ? " fx-jitter" : "")} style={{ position: "relative" }}>
            {/* 에디터 크롬 */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* 타이틀바 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", background: "#3a6ea5", borderBottom: "3px solid var(--ink)" }}>
                <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#fff" }}>📊 발표자료_최종_진짜최종_v3.ppt — 파워포인뜨</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {["_", "▢", "✕"].map((c, i) => (
                    <span key={i} style={{ width: 18, height: 16, background: "#d8d2c0", border: "2px solid var(--ink)", fontFamily: "var(--px-body)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>{c}</span>
                  ))}
                </div>
              </div>
              {/* 메뉴바 */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "3px 12px", background: "#ece6d6", borderBottom: "3px solid var(--ink)" }}>
                {["파일", "편집", "보기", "삽입", "디자인"].map((m) => (
                  <span key={m} style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#5a5440" }}>{m}</span>
                ))}
              </div>
              {/* 게임 HUD 스트립 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "#ffe9a8", borderBottom: "3px solid var(--ink)" }}>
                <span style={{ fontFamily: "var(--px-head)", fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>📊 회의 준비 — {topic.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <ProgressChips done={placedCount} total={N} warn={hasErr} />
                  <span style={{ fontFamily: "var(--px-body)", fontSize: 12, padding: "3px 9px", border: "2px solid var(--ink)", background: wrongCount >= game.wrongMax - 1 ? "#ffd9d4" : "#fff3c4", color: wrongCount >= game.wrongMax - 1 ? "#c0392b" : "#8a6d12", whiteSpace: "nowrap" }}>오답 {wrongCount}/{game.wrongMax}</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    {floatMinus && <span className="banner-in" style={{ position: "absolute", right: "100%", marginRight: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--px-head)", fontSize: 22, color: "var(--marker)", whiteSpace: "nowrap", textShadow: "1px 1px 0 #fff" }}>{floatMinus}</span>}
                    <div className={"px-timer" + (danger ? " danger" : "")}
                      style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--px-mono)", border: "2px solid var(--ink)", background: paused ? "#cbd2e0" : danger ? PX.red : "#fff", color: paused ? "#3a3f50" : danger ? "#fff" : "var(--ink)", padding: "3px 11px" }}>
                      <span style={{ fontSize: 15 }}>{paused ? "⏸" : "⏱"}</span>
                      <span style={{ fontSize: 20, letterSpacing: 1 }}>{paused ? "정지" : "0:" + String(Math.max(0, time)).padStart(2, "0")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 보드 */}
            <div style={{ position: "relative", background: "#e8eef7", padding: "12px 16px 14px" }} className={blur ? "" : ""}>
              <div style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#5a6478", marginBottom: 8 }}>
                발표 슬라이드는 순서대로 · <b>다른 팀 자료(함정)는 🗑️로</b> · 채워진 칸에 놓으면 자리 교환
              </div>
              {/* 순서 슬롯 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
                {game.order.map((_, i) => {
                  const s = slotOf(i);
                  return (
                    <div key={i} onDragOver={(e) => { e.preventDefault(); setOverSlot(i); }}
                      onDragLeave={() => setOverSlot((o) => (o === i ? null : o))} onDrop={() => drop(i)}>
                      {s
                        ? <PxSlideCard slide={s} n={i + 1} mark={marks ? marks[i] : null} clipSub={clipSub} dragging={dragId === s.id} canDrag={phase === "play" && lockId !== s.id} locked={lockId === s.id} titleBlur={headBlur} w={cw}
                            onDragStart={() => setDragId(s.id)} onDragEnd={() => { setDragId(null); setOverSlot(null); }} />
                        : <EmptySlot n={i + 1} w={cw} over={overSlot === i} snap={dragId != null && overSlot == null && i === firstEmpty} />}
                    </div>
                  );
                })}
              </div>

              {/* 실시간 오류 안내 */}
              {phase === "play" && hasErr && (
                <div className="banner-in" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 9, background: "#ffd9d4", border: "3px solid var(--marker)", padding: "8px 14px", fontFamily: "var(--px-body)", fontSize: 13, color: "#c0392b" }}>
                  <span style={{ fontSize: 17 }}>⚠️</span>
                  오류 {Object.values(marks).filter((v) => v === "wrong").length}개 · 빨간 슬라이드의 자리를 서로 바꿔 고쳐보세요
                </div>
              )}

              {/* 트레이 + 휴지통 */}
              <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "stretch" }}>
                <div onDragOver={(e) => e.preventDefault()} onDrop={() => drop("tray")}
                  style={{ flex: 1, minWidth: 0, background: "#fff8e6", border: "3px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", padding: "9px 14px" }}>
                  <div style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#8a7d52", marginBottom: 7 }}>🗂 카드 더미 · 정답+함정 섞임 · 남은 {tray.length}장</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", minHeight: cw * (CARD_H / CARD_W), alignItems: "center" }}>
                    {tray.length === 0
                      ? <span style={{ fontFamily: "var(--px-body)", fontSize: 13, color: "#b3a08a" }}>카드 더미가 비었어요</span>
                      : tray.map((id) => { const s = byId(id); return (
                          <PxSlideCard key={id} slide={s} clipSub={clipSub} dragging={dragId === id} canDrag={phase === "play" && lockId !== id} locked={lockId === id} fresh={s.fresh} titleBlur={headBlur} w={cw}
                            onDragStart={() => setDragId(id)} onDragEnd={() => { setDragId(null); setOverSlot(null); }} />
                        ); })}
                  </div>
                </div>
                {/* 휴지통 */}
                <div onDragOver={(e) => { e.preventDefault(); setOverTrash(true); }} onDragLeave={() => setOverTrash(false)} onDrop={() => drop("trash")}
                  style={{ width: 130, flex: "0 0 auto", border: `3px ${overTrash ? "solid" : "dashed"} ${overTrash ? "var(--marker)" : "#b06b4a"}`, background: overTrash ? "#ffe3e0" : "#f5e7df", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 8 }}>
                  <span style={{ fontSize: 30 }}>🗑️</span>
                  <span style={{ fontFamily: "var(--px-head)", fontSize: 12, color: "var(--ink)", textAlign: "center" }}>발표 자료 아님</span>
                  <span style={{ fontFamily: "var(--px-body)", fontSize: 10, color: "#9a7d62", textAlign: "center" }}>함정 {trapsLeft}장 남음</span>
                </div>
              </div>

              {/* 함정/오답 토스트 */}
              {trapMsg && <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translateX(-50%)", zIndex: 22, fontFamily: "var(--px-head)", fontSize: 14, padding: "9px 18px", border: "3px solid var(--marker)", background: "#ffe3e0", color: "#b0341f", boxShadow: "4px 4px 0 rgba(0,0,0,.22)", whiteSpace: "nowrap" }}>{trapMsg}</div>}
              {slowMove && <span className="banner-in" style={{ position: "absolute", left: "50%", top: "42%", transform: "translateX(-50%)", zIndex: 23, fontFamily: "var(--px-head)", fontSize: 15, color: "#7a5a2a", background: "#fff3d6", border: "2.5px solid var(--ink)", padding: "7px 16px", boxShadow: "3px 3px 0 rgba(0,0,0,.22)" }}>🥵 느릿… 커서가 무겁다</span>}
              {slipMsg && <span className="slip-pop" style={{ position: "absolute", left: "50%", top: "40%", transform: "translateX(-50%)", zIndex: 24, fontFamily: "var(--px-head)", fontSize: 16, color: "#fff", background: "var(--marker)", border: "2.5px solid var(--ink)", padding: "7px 16px", boxShadow: "3px 3px 0 rgba(0,0,0,.25)" }}>✋ 미끄러졌다!</span>}
              {evJitter && <span style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", zIndex: 23, fontFamily: "var(--px-body)", fontSize: 12.5, color: "#fff", background: "rgba(29,31,46,.85)", border: "2px solid var(--ink)", padding: "4px 12px", whiteSpace: "nowrap" }}>✋ 마우스 떨림! 카드가 자꾸 미끄러집니다 (10초)</span>}

              {/* 결과 오버레이 */}
              {phase === "result" && (() => { const t = TIERS[result.tier]; return (
                <div style={{ position: "absolute", inset: 0, background: "rgba(20,24,40,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
                  <div className="pop-in">
                    <PxPanel bg={t.bg} shadow={6} style={{ width: 440, maxWidth: "84%", padding: "20px 26px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                      <div style={{ fontSize: 46, lineHeight: 1 }}>{t.emoji}</div>
                      <div style={{ fontFamily: "var(--px-head)", fontSize: 22, color: t.color }}>{t.title}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, background: "#fff", border: "2px solid var(--ink)", padding: "3px 11px" }}>오류 {result.errors}개</span>
                        <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, background: "#fff", border: "2px solid var(--ink)", padding: "3px 11px" }}>소요 {result.used}초</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                        {t.deltas.map((d, i) => (
                          <span key={i} style={{ fontFamily: "var(--px-body)", fontSize: 13, border: "2px solid var(--ink)", padding: "4px 12px", background: d.v < 0 ? "#d7f3d4" : "#ffdcd4", color: d.v < 0 ? "#1f8a2e" : "#c0392b" }}>
                            {d.label} {d.v < 0 ? "▼" : "▲"}{Math.abs(d.v)}
                          </span>
                        ))}
                      </div>
                      <div onClick={() => newGame()} style={{ marginTop: 4, cursor: "pointer" }}>
                        <PxButton bg="var(--yellow)">다음으로 ▶</PxButton>
                      </div>
                    </PxPanel>
                  </div>
                </div>
              ); })()}
            </div>
            </div>{/* /fx */}

            {/* 상태이상은 화면 효과(회색/흔들림/떨림)로만 표현 — 배지·캡션 없음 */}

            {/* 상사 등장 이벤트는 전체 화면 기준 오버레이로 별도 렌더 (아래) */}
            </div>{/* /relative */}
          </Monitor>
          {/* 모드 안내 칩 */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "var(--ink)", background: "var(--yellow)", border: "2px solid var(--ink)", padding: "3px 12px", boxShadow: "2px 2px 0 var(--ink)" }}>
              {game.mode}장 모드{clipSub ? " · 스트레스 80↑ 부제 축약" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* 상사 등장 이벤트 — 전체 화면 기준 */}
      {bossEvent && <BossSilhouette />}
      {bossEvent && bossBanner && (
        <div style={{ position: "fixed", left: 0, right: 0, top: "15%", zIndex: 45, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div className="banner-in" style={{ width: 480, maxWidth: "84%" }}>
            <PxPanel bg="#fff" bw={3} shadow={5} style={{ borderColor: "var(--marker)", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <span style={{ fontFamily: "var(--px-head)", fontSize: 16, color: "var(--marker)" }}>상사가 내 자리 옆에 서 있다…</span>
              </div>
              <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#4a4636" }}>아무 말 없이 모니터만 보고 있다. 난이도가 일시적으로 상승한다.</span>
            </PxPanel>
          </div>
        </div>
      )}

      {/* 중간 이벤트 오버레이 */}
      {ev && ev.speak && (
        <div className="banner-in" style={{ position: "fixed", top: 70, right: "20%", zIndex: 47, maxWidth: 320, fontFamily: "var(--px-head)", fontSize: 15, background: "#fff", border: "3px solid var(--ink)", borderRadius: 14, padding: "11px 16px", boxShadow: "4px 4px 0 rgba(0,0,0,.22)" }}>{ev.speak}</div>
      )}
      {ev && ev.type === "kakao" && <KakaoWin title="까까오톡 PC" onClose={() => setEv(null)} style={{ top: "16%", right: "8%" }}
        msgs={[["😤", "김팀장", "지금 어디까지 됐어요?"], ["😤", "김팀장", "오늘 안에 끝나죠?"], ["😤", "김팀장", "검토 빨리 부탁해요"]]} />}
      {ev && ev.type === "dinner" && <KakaoWin title="까까오톡 PC · 우리팀 단톡방" votes onClose={() => setEv(null)} style={{ top: "14%", left: "50%", transform: "translateX(-50%)", width: 410 }}
        msgs={[["🙂", "이대리", "🍻 오늘 회식 메뉴 투표 좀!"], ["😀", "박사원", "저는 고기 당겨요"], ["😋", "최주임", "아무거나 다 좋아요~"]]} />}
      {/* 중간 이벤트 토스트 (옆 부서 메일 등) */}
      {evToast && (
        <div className="banner-in" style={{ position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 48, fontFamily: "var(--px-head)", fontSize: 14, padding: "10px 20px", border: "3px solid var(--marker)", background: "#ffe3e0", color: "#b0341f", boxShadow: "4px 4px 0 rgba(0,0,0,.22)", whiteSpace: "nowrap" }}>{evToast}</div>
      )}

      {/* 상태이상 발동 토스트 */}
      {statusToast && (
        <div className="banner-in" style={{ position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 48, width: 360, maxWidth: "84%" }}>
          <PxPanel bg="#fff" bw={3} shadow={5} style={{ borderColor: "var(--marker)", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontFamily: "var(--px-head)", fontSize: 16, color: "var(--marker)" }}>⚠️ {statusToast.title}</div>
            <div style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#4a4636" }}>{statusToast.trigger}</div>
          </PxPanel>
        </div>
      )}

      {/* 두통 — 대화창 */}
      {headacheDlg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(20,18,24,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="pop-in">
            <PxPanel bg="#fff" shadow={6} style={{ width: 360, padding: "22px 26px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 48 }}>🤕</div>
              <div style={{ fontFamily: "var(--px-head)", fontSize: 18, color: "var(--ink)" }}>너무 머리가 아파서 못하겠어...</div>
              <div onClick={() => setHeadacheDlg(false)} style={{ marginTop: 4, cursor: "pointer" }}><PxButton bg="var(--yellow)">확인</PxButton></div>
            </PxPanel>
          </div>
        </div>
      )}

      {/* 디버그 버튼 / 패널 */}
      <div onClick={() => setShowDebug((v) => !v)} title="디버그"
        style={{ position: "fixed", top: 12, right: 12, zIndex: 50, width: 42, height: 42, background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}>⚙</div>
      {showDebug && (
        <div style={{ position: "fixed", top: 62, right: 12, zIndex: 50, width: 280 }}>
          <PxPanel bg="#fffdf2" shadow={5} style={{ padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--px-head)", fontSize: 15, marginBottom: 12 }}>⚙ 디버그 패널</div>
            <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>
              스트레스 {stress} <span style={{ color: "#999", fontWeight: 400 }}>(50↑ 7장 · 80↑ 부제 축약)</span>
            </label>
            <input type="range" min="0" max="100" value={stress} onChange={(e) => setStress(+e.target.value)} style={{ width: "100%" }} />
            <div style={{ display: "flex", fontFamily: "var(--px-mono)", fontSize: 10, color: "#aaa", marginBottom: 10 }}><span>0</span><span style={{ marginLeft: "auto" }}>50</span><span style={{ marginLeft: "auto" }}>80</span><span style={{ marginLeft: "auto" }}>100</span></div>
            <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>주제 강제 선택</label>
            <select value={forcedTopic} onChange={(e) => setForcedTopic(+e.target.value)} style={{ width: "100%", fontFamily: "var(--px-body)", fontSize: 12, border: "2px solid var(--ink)", padding: "5px 6px", marginBottom: 10, background: "#fff" }}>
              <option value={-1}>랜덤 (직전과 다르게)</option>
              {TOPICS.map((t, i) => <option key={i} value={i}>{i + 1}. {t.name}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} style={{ width: 16, height: 16 }} /> 타이머 일시정지
            </label>

            {/* 상태이상 케이스 */}
            <div style={{ borderTop: "2px dashed #d8d2c0", paddingTop: 10, marginBottom: 4 }}>
              <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 5 }}>상태이상 효과 미리보기</label>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[["", "없음"], ["burnout", "🥵 번아웃"], ["headache", "🤕 두통"], ["coffee", "☕ 커피"]].map(([k, lab]) => (
                  <div key={k} onClick={() => {
                    setStatusFx(k);
                    if (k) {
                      const trig = { burnout: "스트레스가 70을 넘었습니다", headache: "체력이 30 아래로 떨어졌습니다", coffee: "커피를 연속 2회 사용했습니다" };
                      setStatusToast({ title: STATUS[k].icon + " " + STATUS[k].label + " 발동", trigger: trig[k] });
                      clearTimeout(statusToastTimer.current); statusToastTimer.current = setTimeout(() => setStatusToast(null), 3000);
                    } else setStatusToast(null);
                    if (k === "headache") { setHeadacheDlg(true); } else { setHeadacheDlg(false); }
                  }} style={{ cursor: "pointer" }}>
                    <PxPanel bg={statusFx === k ? "var(--yellow)" : "#fff"} shadow={statusFx === k ? 2 : false} bw={2}
                      style={{ padding: "4px 9px", fontFamily: "var(--px-body)", fontSize: 11.5, whiteSpace: "nowrap" }}>{lab}</PxPanel>
                  </div>
                ))}
              </div>
              {statusFx && <p style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#999", margin: "6px 0 0", lineHeight: 1.5 }}>발동 조건 · {STATUS[statusFx].cond} <span style={{ color: "#bbb" }}>— 선택 시 게임 보드에 효과가 실제 적용됩니다(번아웃 느려짐·두통 흔들림·커피 떨림).</span></p>}
            </div>

            {/* 상사 등장 이벤트 */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, margin: "10px 0 10px", cursor: "pointer" }}>
              <input type="checkbox" checked={bossEvent} onChange={(e) => setBoss(e.target.checked)} style={{ width: 16, height: 16 }} /> 상사 등장 이벤트 <span style={{ color: "#999", fontWeight: 400 }}>(그림자+경고)</span>
            </label>

            {/* 중간 이벤트 미리보기 */}
            <div style={{ borderTop: "2px dashed #d8d2c0", paddingTop: 10, marginBottom: 8 }}>
              <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={autoEv} onChange={(e) => setAutoEv(e.target.checked)} style={{ width: 16, height: 16 }} /> 이벤트 자동 발생 <span style={{ color: "#999", fontWeight: 400 }}>(10초 간격)</span>
              </label>
              <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 5 }}>중간 이벤트 발동 <span style={{ color: "#999", fontWeight: 400 }}>(수동 미리보기)</span></label>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[["addSlide", "①추가"], ["timeCut", "②-10초"], ["kakao", "③카톡"], ["addTrap", "④함정"], ["lock", "⑤잠금"], ["shuffle2", "⑥셔플"], ["jitter", "⑦떨림"], ["signature", "⑧참견"], ["chat", "⑨잡담"], ["dinner", "⑩회식"], ["lunch", "⑪점심"]].map(([k, lab]) => (
                  <div key={k} onClick={() => fireEvent(k)} style={{ cursor: "pointer" }}>
                    <PxPanel bg={k === "signature" ? "#f3edfb" : k === "chat" || k === "dinner" || k === "lunch" ? "#fffbe8" : "#ffecea"} shadow={false} bw={2}
                      style={{ padding: "4px 8px", fontFamily: "var(--px-body)", fontSize: 11, whiteSpace: "nowrap" }}>{lab}</PxPanel>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#999", margin: "6px 0 0", lineHeight: 1.5 }}>강력(빨강)·시그니처(보라)·페이크(노랑). 카톡/잡담/회식은 닫기 버튼으로 닫힘.</p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => newGame()} style={{ flex: 1, cursor: "pointer" }}><PxButton bg="#e7ddc7" small style={{ width: "100%", justifyContent: "center" }}>재시작</PxButton></div>
              <div onClick={finish} style={{ flex: 1, cursor: "pointer" }}><PxButton bg="#ffd9d4" small style={{ width: "100%", justifyContent: "center" }}>강제 종료</PxButton></div>
            </div>
            <p style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#999", marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>스트레스·주제는 <b>재시작/다음 회차</b>부터 장수에 반영. 부제 축약(80↑)은 즉시 적용.</p>
          </PxPanel>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
