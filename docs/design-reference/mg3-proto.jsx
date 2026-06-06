// mg3-proto.jsx — 보고서 오탈자 찾기 미니게임 인터랙티브 프로토타입 (픽셀아트 레트로 CRT)
// 재사용: pixel-kit(PxPanel, PxButton, PX) · mg2-game(Monitor, PixWindow/Clock/Plant/Mug) · mg3-data(MG3_*, parseMg3Line)
const { useState, useEffect, useRef } = React;

// 난이도 (스트레스 기준)
function diffOf(stress) {
  if (stress >= 80) return { key: "lv2", lines: 12, wrongMax: 3, shake: true, label: "난이도2 (80↑)" };
  if (stress >= 50) return { key: "lv1", lines: 12, wrongMax: 4, shake: false, label: "난이도1 (50↑)" };
  return { key: "basic", lines: 8, wrongMax: 5, shake: false, label: "기본" };
}

// 보고서 → 토큰 인덱스 (라인별 세그먼트). typo=정답, trap=오답(정상표기)
function buildReport(repIdx, lineCount) {
  const rep = MG3_REPORTS[repIdx];
  const lines = rep.lines.slice(0, lineCount).map((raw, li) => {
    const segs = parseMg3Line(raw).map((s, si) => ({ ...s, key: li + "-" + si }));
    return { li, segs };
  });
  const typoKeys = [];
  lines.forEach((ln) => ln.segs.forEach((s) => { if (s.typo) typoKeys.push(s.key); }));
  return { title: rep.title, lines, typoKeys };
}

const MG3_TIERS = {
  success: { title: "오탈자 전부 발견!", emoji: "🎉", bg: "#eafae8", color: "var(--green)", deltas: [{ label: "업무량", v: -20 }] },
  partial: { title: "절반만 찾았다…", emoji: "😮‍💨", bg: "#fff3df", color: "#c98a2a", deltas: [{ label: "업무량", v: -10 }, { label: "스트레스", v: 8 }] },
  fail:    { title: "결재 반려…", emoji: "💀", bg: "#f6e3e0", color: "var(--marker)", deltas: [{ label: "업무량", v: -5 }, { label: "스트레스", v: 20 }, { label: "체력", v: -8 }] },
};
const MG3_STATUS = {
  burnout: { fx: "fx-gray", cond: "스트레스 70↑", trig: "스트레스가 70을 넘었습니다", icon: "🥵", label: "번아웃" },
  headache: { fx: "fx-shake", cond: "체력 30↓", trig: "체력이 30 아래로 떨어졌습니다", icon: "🤕", label: "두통" },
  coffee: { fx: "fx-jitter-sepia", cond: "커피 연속 2회", trig: "커피를 연속 2회 사용했습니다", icon: "☕", label: "손 떨림" },
};

// PC 까까오톡 (동료)
function KkakaoWin({ onClose }) {
  return (
    <div style={{ position: "absolute", zIndex: 19, top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 340, border: "3px solid var(--ink)", boxShadow: "6px 6px 0 rgba(0,0,0,.35)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fee500", padding: "7px 12px", borderBottom: "3px solid var(--ink)" }}>
        <span style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "#3a2e00" }}>💬 까까오톡 PC</span>
        <span onClick={onClose} style={{ fontFamily: "var(--px-head)", fontSize: 13, color: "#3a2e00", border: "2px solid var(--ink)", background: "#fff7b0", padding: "0 6px", cursor: "pointer" }}>✕</span>
      </div>
      <div style={{ background: "#b2c7d9", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[["🙂", "옆자리 동료", "오늘 점심 약속 잊지마! 🍱"], ["🙂", "옆자리 동료", "이번 주말 약속 시간 어때?"]].map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <span style={{ width: 30, height: 30, border: "2px solid var(--ink)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "0 0 auto" }}>{m[0]}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#2a3a47" }}>{m[1]}</span>
              <span style={{ fontFamily: "var(--px-body)", fontSize: 13, background: "#fff", border: "2px solid var(--ink)", padding: "5px 10px" }}>{m[2]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [stress, setStress] = useState(20);
  const [forcedRep, setForcedRep] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [statusFx, setStatusFx] = useState("");
  const [statusToast, setStatusToast] = useState(null);
  const [headacheDlg, setHeadacheDlg] = useState(false);
  const [autoEv, setAutoEv] = useState(true);

  const [report, setReport] = useState(null);   // {title, lines, typoKeys}
  const [diff, setDiff] = useState(diffOf(20));
  const [found, setFound] = useState([]);        // 발견한 typo key
  const [wrong, setWrong] = useState(0);
  const [time, setTime] = useState(60);
  const [phase, setPhase] = useState("play");
  const [result, setResult] = useState(null);

  const [flashKey, setFlashKey] = useState(null);   // 정답 깜빡
  const [wrongKey, setWrongKey] = useState(null);   // 오답 깜빡
  const [floatMinus, setFloatMinus] = useState(null);
  const [trapToast, setTrapToast] = useState(null);
  const [warnNear, setWarnNear] = useState(false);
  const [penKey, setPenKey] = useState(null);       // 상사 빨간펜 동그라미 대상
  const [penSpeak, setPenSpeak] = useState(false);
  const [spellKeys, setSpellKeys] = useState([]);   // 맞춤법 오작동 강조(trap에 빨간줄)
  const [saving, setSaving] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const [ev, setEv] = useState(null);               // 'kakao'
  const [evToast, setEvToast] = useState(null);

  const lastRep = useRef(-1);
  const tFloat = useRef(null), tTrap = useRef(null), tFlash = useRef(null), tWrong = useRef(null);
  const tPen = useRef(null), tSpell = useRef(null), tSave = useRef(null), tFlick = useRef(null), tEv = useRef(null), tStatus = useRef(null), tWarn = useRef(null);
  const firedPoints = useRef({}), usedEvents = useRef({}), penFired = useRef(false), endTimer = useRef(null);

  function newGame(opts = {}) {
    const st = opts.stress != null ? opts.stress : stress;
    const d = diffOf(st);
    let ri = opts.rep != null && opts.rep >= 0 ? opts.rep : forcedRep;
    if (ri < 0) { do { ri = Math.floor(Math.random() * MG3_REPORTS.length); } while (MG3_REPORTS.length > 1 && ri === lastRep.current); }
    lastRep.current = ri;
    setReport(buildReport(ri, d.lines)); setDiff(d);
    setFound([]); setWrong(0); setTime(60); setPhase("play"); setResult(null);
    setFlashKey(null); setWrongKey(null); setFloatMinus(null); setTrapToast(null); setWarnNear(false);
    setPenKey(null); setPenSpeak(false); setSpellKeys([]); setSaving(false); setFlicker(false); setEv(null); setEvToast(null);
    firedPoints.current = {}; usedEvents.current = {}; penFired.current = false;
    clearTimeout(endTimer.current);
  }
  useEffect(() => { newGame({ stress: 20, rep: 0 }); }, []);

  function finish(forceTier) {
    if (!report) return;
    clearTimeout(endTimer.current);
    const total = report.typoKeys.length;
    const fc = found.length;
    let tier = forceTier;
    if (!tier) {
      if (fc >= total) tier = "success";
      else if (fc >= Math.ceil(total / 2)) tier = "partial";
      else tier = "fail";
    }
    setResult({ tier, found: fc, total, wrong, used: 60 - time });
    setPhase("result");
  }

  // 타이머
  useEffect(() => {
    if (phase !== "play" || paused) return;
    if (time <= 0) { finish(); return; }
    const id = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [time, phase, paused]);

  // 전부 발견 → 자동 성공
  useEffect(() => {
    if (phase !== "play" || !report) return;
    if (found.length >= report.typoKeys.length && report.typoKeys.length > 0) {
      endTimer.current = setTimeout(() => finish("success"), 600);
      return () => clearTimeout(endTimer.current);
    }
  }, [found, phase, report]);

  // 상사 빨간펜 — 15초 시점 1회
  useEffect(() => {
    if (phase !== "play" || !report || penFired.current) return;
    if (60 - time >= 15) { penFired.current = true; firePen(); }
  }, [time, phase, report]);

  // 중간 이벤트 자동 발생 (10초 간격)
  useEffect(() => {
    if (!autoEv || phase !== "play" || paused || !report) return;
    const elapsed = 60 - time;
    if (elapsed < 10 || elapsed % 10 !== 0 || firedPoints.current[elapsed]) return;
    firedPoints.current[elapsed] = true;
    if (ev === "kakao") setEv(null);
    const ALL = ["wrongFix", "spell", "addPage", "saveFail", "kakao", "flicker"];
    let pool = ALL.filter((t) => !usedEvents.current[t]);
    if (pool.length === 0) { usedEvents.current = {}; pool = ALL; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    usedEvents.current[pick] = true;
    fireEvent(pick);
  }, [time, autoEv, phase, paused, report]);

  const bossType = stress >= 80 ? 1 : 0; // 데모용

  function firePen(kind) {
    if (!report) return;
    // kind: real | half | fake (미지정 시 랜덤)
    const k = kind || ["real", "half", "fake"][Math.floor(Math.random() * 3)];
    let target = null;
    const unfoundTypos = report.typoKeys.filter((key) => !found.includes(key));
    const trapKeys = [];
    report.lines.forEach((ln) => ln.segs.forEach((s) => { if (s.trap) trapKeys.push({ key: s.key, li: ln.li }); }));
    const typoLines = new Set(report.typoKeys.map((key) => +key.split("-")[0]));
    if (k === "real" && unfoundTypos.length) target = unfoundTypos[0];
    else if (k === "half") { const t = trapKeys.find((x) => typoLines.has(x.li)); target = t ? t.key : (trapKeys[0] && trapKeys[0].key); }
    else { const t = trapKeys.find((x) => !typoLines.has(x.li)); target = t ? t.key : (trapKeys[0] && trapKeys[0].key); }
    if (!target) return;
    setPenKey(target); setPenSpeak(true);
    clearTimeout(tPen.current); tPen.current = setTimeout(() => { setPenKey(null); setPenSpeak(false); }, 3000);
  }

  function fireEvent(type) {
    if (!report) return;
    if (type === "wrongFix") {
      // 발견한 오탈자 중 1개를 미발견으로 되돌림(동료가 또 틀림)
      setFound((f) => f.length ? f.slice(0, -1) : f);
      toast("🤦 동료가 수정해줬어요... 근데 또 틀렸네요?");
    } else if (type === "spell") {
      const trapKeys = []; report.lines.forEach((ln) => ln.segs.forEach((s) => { if (s.trap) trapKeys.push(s.key); }));
      setSpellKeys(trapKeys.slice(0, 3));
      clearTimeout(tSpell.current); tSpell.current = setTimeout(() => setSpellKeys([]), 5000);
      toast("🔄 맞춤법 검사기 오작동 중...");
    } else if (type === "addPage") {
      setReport((r) => {
        if (!r) return r;
        const baseLi = r.lines.length;
        const extra = [
          parseLineToObj("9. (추가) 부록 — 세부 항목은 별도 «첩부|첨부|kr» 자료로 갈음한다.", baseLi),
          parseLineToObj("10. (추가) 보완 — 추가 사항은 다음 회의에서 다룬다.", baseLi + 1),
        ];
        const lines = [...r.lines, ...extra];
        const typoKeys = [...r.typoKeys];
        extra.forEach((ln) => ln.segs.forEach((s) => { if (s.typo) typoKeys.push(s.key); }));
        return { ...r, lines, typoKeys };
      });
      toast("📄 팀장님: 이 내용도 추가해주세요");
    } else if (type === "saveFail") {
      setSaving(true); clearTimeout(tSave.current);
      tSave.current = setTimeout(() => { setSaving(false); setFound((f) => f.length ? f.slice(0, -1) : f); toast("💾 저장 실패! 일부 수정사항이 사라졌어요"); }, 1800);
    } else if (type === "kakao") {
      setEv("kakao");
    } else if (type === "flicker") {
      setFlicker(true); clearTimeout(tFlick.current); tFlick.current = setTimeout(() => setFlicker(false), 1000);
    }
  }
  function parseLineToObj(raw, li) {
    return { li, segs: parseMg3Line(raw).map((s, si) => ({ ...s, key: li + "-" + si })) };
  }
  function toast(msg) { setEvToast(msg); clearTimeout(tEv.current); tEv.current = setTimeout(() => setEvToast(null), 3000); }

  // 토큰 클릭
  function clickTypo(key) {
    if (phase !== "play" || found.includes(key)) return;
    setFound((f) => [...f, key]);
    setFlashKey(key); clearTimeout(tFlash.current); tFlash.current = setTimeout(() => setFlashKey(null), 600);
  }
  function clickWrong(key, isTrap) {
    if (phase !== "play") return;
    setWrongKey(key); clearTimeout(tWrong.current); tWrong.current = setTimeout(() => setWrongKey(null), 500);
    setTime((t) => Math.max(0, t - 3));
    setFloatMinus("-3초"); clearTimeout(tFloat.current); tFloat.current = setTimeout(() => setFloatMinus(null), 1200);
    const msg = isTrap ? MG3_TRAP_TOASTS[Math.floor(Math.random() * MG3_TRAP_TOASTS.length)] : "❌ 오탈자가 아니에요";
    setTrapToast(msg);
    clearTimeout(tTrap.current); tTrap.current = setTimeout(() => setTrapToast(null), 1500);
    setWrong((w) => {
      const nw = w + 1;
      if (nw >= diff.wrongMax) { endTimer.current = setTimeout(() => finish("fail"), 900); }
      else if (nw === diff.wrongMax - 1) { setWarnNear(true); clearTimeout(tWarn.current); tWarn.current = setTimeout(() => setWarnNear(false), 2000); }
      return nw;
    });
  }

  function applyStatus(k) {
    setStatusFx(k);
    if (k) {
      setStatusToast({ title: MG3_STATUS[k].icon + " " + MG3_STATUS[k].label + " 발동", trigger: MG3_STATUS[k].trig });
      clearTimeout(tStatus.current); tStatus.current = setTimeout(() => setStatusToast(null), 3000);
      setHeadacheDlg(k === "headache");
    } else { setStatusToast(null); setHeadacheDlg(false); }
  }

  if (!report) return null;
  const total = report.typoKeys.length;
  const danger = time <= 10 && phase === "play";
  // 번아웃: 모니터는 회색, 추가로 화면 전체에 가장자리→가운데 회색 그라데이션
  const fxClass = statusFx ? MG3_STATUS[statusFx].fx : "";

  // 토큰 렌더 — 모든 단어가 클릭 가능(힌트 방지): 오탈자=정답 / 함정·일반 단어=오답
  function renderSeg(s) {
    if (s.plain != null) {
      // 일반 텍스트도 단어 단위로 쪼개서 모두 클릭 가능 (오답 처리)
      const parts = s.plain.split(/(\s+)/);
      return parts.map((tok, i) => {
        if (tok === "" ) return null;
        if (/^\s+$/.test(tok)) return <span key={s.key + "-s" + i}>{tok}</span>;
        const wk = s.key + "-w" + i;
        return <span key={wk} className={"mg3p-word" + (wrongKey === wk ? " wrongflash" : "")} onClick={() => clickWrong(wk, false)}>{tok}</span>;
      });
    }
    if (s.typo) {
      const isFound = found.includes(s.key);
      if (isFound) return (
        <span key={s.key} className={"mg3p-fixed" + (flashKey === s.key ? " flash" : "")}>
          <span className="mg3p-old">{s.wrong}</span><span className="mg3p-new">{s.correct} ✓</span>
        </span>
      );
      return (
        <span key={s.key} className={"mg3p-word" + (penKey === s.key ? " pen" : "") + (wrongKey === s.key ? " wrongflash" : "")} onClick={() => clickTypo(s.key)}>{s.wrong}</span>
      );
    }
    // trap
    const cls = "mg3p-word" + (spellKeys.includes(s.key) ? " spell" : "") + (penKey === s.key ? " pen" : "") + (wrongKey === s.key ? " wrongflash" : "");
    return <span key={s.key} className={cls} onClick={() => clickWrong(s.key, true)}>{s.word}</span>;
  }

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#caa46a" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "76%", background: "linear-gradient(#f3e2c0,#e9d3a8)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "76%", height: 6, background: "rgba(29,31,46,.25)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "24%", background: "linear-gradient(#b97a3e,#9c5f2c)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: "24%", height: 5, background: "rgba(29,31,46,.4)" }} />
      <div style={{ position: "absolute", left: 34, top: 26 }}><PixWindow /></div>
      <div style={{ position: "absolute", right: 52, top: 30 }}><PixClock /></div>
      <div style={{ position: "absolute", right: 36, bottom: 14 }}><PixPlant /></div>
      <div style={{ position: "absolute", left: 56, bottom: 20 }}><PixMug /></div>

      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 16px", overflow: "auto" }}>
        <div style={{ width: "min(1000px, 96vw)" }}>
          <Monitor variant="retro">
            <div style={{ position: "relative" }}>
            <div className={fxClass} style={{ position: "relative" }}>
            {/* 에디터 크롬 */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", background: "#3a6ea5", borderBottom: "3px solid var(--ink)" }}>
                <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#fff" }}>📝 1분기보고서_검토본.hwp — 흔글</span>
                <div style={{ display: "flex", gap: 4 }}>{["_", "▢", "✕"].map((c, i) => <span key={i} style={{ width: 18, height: 16, background: "#d8d2c0", border: "2px solid var(--ink)", fontFamily: "var(--px-body)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)" }}>{c}</span>)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "3px 12px", background: "#ece6d6", borderBottom: "3px solid var(--ink)" }}>
                {["파일", "편집", "보기", "입력", "검토"].map((m) => <span key={m} style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "#5a5440" }}>{m}</span>)}
              </div>
              {/* HUD */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "#ffe9a8", borderBottom: "3px solid var(--ink)" }}>
                <span style={{ fontFamily: "var(--px-head)", fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>📝 보고서 오탈자 찾기</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--px-body)", fontSize: 12, padding: "3px 9px", border: "2px solid var(--ink)", background: "#dff5e3", color: "#1f7a44", whiteSpace: "nowrap" }}>발견 {found.length}/{total}</span>
                  <span style={{ fontFamily: "var(--px-body)", fontSize: 12, padding: "3px 9px", border: "2px solid var(--ink)", background: wrong >= diff.wrongMax - 1 ? "#ffd9d4" : "#fff3c4", color: wrong >= diff.wrongMax - 1 ? "#c0392b" : "#8a6d12", whiteSpace: "nowrap" }}>오답 {wrong}/{diff.wrongMax}</span>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    {floatMinus && <span className="banner-in" style={{ position: "absolute", right: "100%", marginRight: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--px-head)", fontSize: 22, color: "var(--marker)", whiteSpace: "nowrap", textShadow: "1px 1px 0 #fff" }}>{floatMinus}</span>}
                    <div className={"px-timer" + (danger ? " danger" : "")} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--px-mono)", border: "2px solid var(--ink)", background: paused ? "#cbd2e0" : danger ? PX.red : "#fff", color: paused ? "#3a3f50" : danger ? "#fff" : "var(--ink)", padding: "3px 11px" }}>
                      <span style={{ fontSize: 15 }}>{paused ? "⏸" : "⏱"}</span>
                      <span style={{ fontSize: 20, letterSpacing: 1 }}>{paused ? "정지" : "0:" + String(Math.max(0, time)).padStart(2, "0")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 보고서 본문 */}
            <div className={diff.shake ? "fx-shake" : ""} style={{ position: "relative", background: "#fbfaf4", padding: "16px 26px", minHeight: 300 }}>
              {saving && <div style={{ position: "absolute", left: 20, top: 12, zIndex: 8, fontFamily: "var(--px-body)", fontSize: 12, color: "#777", background: "#eef0f3", border: "2px solid #c5c9cf", padding: "3px 11px" }}>💾 저장 중...</div>}
              {diff.shake && <span style={{ position: "absolute", right: 14, top: 10, zIndex: 8, fontFamily: "var(--px-body)", fontSize: 11, color: "var(--marker)", background: "#fff", border: "1.5px solid var(--marker)", padding: "1px 8px" }}>⚠ 화면 흔들림</span>}
              <div className="mg3p-report">
                <p className="mg3p-title">제목. {report.title}</p>
                {report.lines.map((ln) => <p key={ln.li} className="mg3p-line">{ln.segs.map(renderSeg)}</p>)}
              </div>
              <p style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#9a948a", marginTop: 10, marginBottom: 0 }}>의심 가는 단어를 클릭 · 오탈자=정답 / 정상 표기(함정)=오답(-3초)</p>

              {/* 상사 빨간펜 말풍선 */}
              {penSpeak && <div style={{ position: "absolute", right: 22, top: 10, zIndex: 9, fontFamily: "var(--px-head)", fontSize: 14, color: "var(--marker)", background: "#fff", border: "2.5px solid var(--marker)", borderRadius: "12px 12px 12px 2px", padding: "7px 14px", boxShadow: "3px 4px 0 rgba(0,0,0,.18)" }}>🖋️ 여기 좀 이상한데?</div>}
              {/* 함정 토스트 */}
              {trapToast && <div style={{ position: "absolute", left: "50%", top: 26, transform: "translateX(-50%)", zIndex: 9, fontFamily: "var(--px-head)", fontSize: 13, color: "#8a6d12", background: "#fff7d6", border: "2.5px solid #caa83a", padding: "8px 16px", boxShadow: "3px 4px 0 rgba(0,0,0,.18)", whiteSpace: "nowrap" }}>{trapToast}</div>}
              {/* 오답 위험 경고 */}
              {warnNear && <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%,-50%)", zIndex: 12, textAlign: "center", background: "#fff", border: "3px solid var(--marker)", padding: "16px 26px", boxShadow: "5px 6px 0 rgba(0,0,0,.25)" }}>
                <div style={{ fontFamily: "var(--px-head)", fontSize: 18, color: "var(--marker)" }}>⚠️ 오답이 너무 많습니다!</div>
                <div style={{ fontFamily: "var(--px-body)", fontSize: 13, color: "#b0341f", marginTop: 5 }}>한 번 더 틀리면 실패합니다</div>
              </div>}
              {/* 모니터 깜빡임 */}
              {flicker && <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 13, animation: "mg3pFlick 1s steps(1)" }} />}
              {/* 동료 까까오톡 — 모니터 가운데 */}
              {ev === "kakao" && <KkakaoWin onClose={() => setEv(null)} />}

              {/* 결과 오버레이 */}
              {phase === "result" && (() => { const t = MG3_TIERS[result.tier]; return (
                <div style={{ position: "absolute", inset: 0, background: "rgba(20,24,40,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
                  <div className="pop-in">
                    <PxPanel bg={t.bg} shadow={6} style={{ width: 440, maxWidth: "84%", padding: "20px 26px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                      <div style={{ fontSize: 46 }}>{t.emoji}</div>
                      <div style={{ fontFamily: "var(--px-head)", fontSize: 22, color: t.color }}>{t.title}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, background: "#fff", border: "2px solid var(--ink)", padding: "3px 11px" }}>발견 {result.found}/{result.total}</span>
                        <span style={{ fontFamily: "var(--px-body)", fontSize: 12.5, background: "#fff", border: "2px solid var(--ink)", padding: "3px 11px" }}>오답 {result.wrong}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                        {t.deltas.map((d, i) => <span key={i} style={{ fontFamily: "var(--px-body)", fontSize: 13, border: "2px solid var(--ink)", padding: "4px 12px", background: d.v < 0 ? "#d7f3d4" : "#ffdcd4", color: d.v < 0 ? "#1f8a2e" : "#c0392b" }}>{d.label} {d.v < 0 ? "▼" : "▲"}{Math.abs(d.v)}</span>)}
                      </div>
                      <span style={{ fontFamily: "var(--px-body)", fontSize: 11, color: "#8a8478" }}>미니게임이 끝나면 항상 메인 화면으로</span>
                      <div onClick={() => newGame()} style={{ marginTop: 2, cursor: "pointer" }}><PxButton bg="var(--yellow)">메인 화면으로 ▶</PxButton></div>
                    </PxPanel>
                  </div>
                </div>
              ); })()}
            </div>
            </div>{/* /fx */}
            </div>{/* /relative */}
          </Monitor>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
            <span style={{ fontFamily: "var(--px-body)", fontSize: 12, color: "var(--ink)", background: "var(--yellow)", border: "2px solid var(--ink)", padding: "3px 12px", boxShadow: "2px 2px 0 var(--ink)" }}>
              {diff.label} · {diff.lines}줄 · 오답 허용 {diff.wrongMax}회
            </span>
          </div>
        </div>
      </div>

      {/* 번아웃 — 화면 전체 회색 비네팅 (가장자리→가운데 그라데이션) */}
      {statusFx === "burnout" && <div style={{ position: "fixed", inset: 0, zIndex: 44, pointerEvents: "none", background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(90,90,100,0) 30%, rgba(70,70,80,0.45) 78%, rgba(40,40,48,0.7) 100%)", mixBlendMode: "multiply" }} />}

      {/* 동료 까까오톡 */}
      {/* (모니터 내부 중앙에 렌더 — 아래 보드 영역에서 처리) */}
      {/* 이벤트 토스트 */}
      {evToast && <div className="banner-in" style={{ position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 48, fontFamily: "var(--px-head)", fontSize: 14, padding: "10px 20px", border: "3px solid var(--marker)", background: "#ffe3e0", color: "#b0341f", boxShadow: "4px 4px 0 rgba(0,0,0,.22)", whiteSpace: "nowrap" }}>{evToast}</div>}
      {/* 상태이상 발동 토스트 */}
      {statusToast && <div className="banner-in" style={{ position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)", zIndex: 48, width: 360, maxWidth: "84%" }}>
        <PxPanel bg="#fff" bw={3} shadow={5} style={{ borderColor: "var(--marker)", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontFamily: "var(--px-head)", fontSize: 16, color: "var(--marker)" }}>⚠️ {statusToast.title}</div>
          <div style={{ fontFamily: "var(--px-body)", fontSize: 12.5, color: "#4a4636" }}>{statusToast.trigger}</div>
        </PxPanel>
      </div>}
      {/* 두통 대화창 */}
      {headacheDlg && <div style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(20,18,24,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="pop-in"><PxPanel bg="#fff" shadow={6} style={{ width: 360, padding: "22px 26px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 48 }}>🤕</div>
          <div style={{ fontFamily: "var(--px-head)", fontSize: 18, color: "var(--ink)" }}>너무 머리가 아파서 못하겠어...</div>
          <div onClick={() => setHeadacheDlg(false)} style={{ marginTop: 4, cursor: "pointer" }}><PxButton bg="var(--yellow)">확인</PxButton></div>
        </PxPanel></div>
      </div>}

      {/* 디버그 */}
      <div onClick={() => setShowDebug((v) => !v)} title="디버그" style={{ position: "fixed", top: 12, right: 12, zIndex: 50, width: 42, height: 42, background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", boxShadow: "3px 3px 0 rgba(0,0,0,.3)" }}>⚙</div>
      {showDebug && <div style={{ position: "fixed", top: 62, right: 12, zIndex: 50, width: 286, maxHeight: "88vh", overflow: "auto" }}>
        <PxPanel bg="#fffdf2" shadow={5} style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "var(--px-head)", fontSize: 15, marginBottom: 12 }}>⚙ 디버그 패널</div>
          <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>스트레스 {stress} <span style={{ color: "#999", fontWeight: 400 }}>(50↑·80↑ 난이도)</span></label>
          <input type="range" min="0" max="100" value={stress} onChange={(e) => setStress(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ display: "flex", fontFamily: "var(--px-mono)", fontSize: 10, color: "#aaa", marginBottom: 10 }}><span>0</span><span style={{ marginLeft: "auto" }}>50</span><span style={{ marginLeft: "auto" }}>80</span><span style={{ marginLeft: "auto" }}>100</span></div>
          <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 4 }}>보고서 강제 선택</label>
          <select value={forcedRep} onChange={(e) => setForcedRep(+e.target.value)} style={{ width: "100%", fontFamily: "var(--px-body)", fontSize: 12, border: "2px solid var(--ink)", padding: "5px 6px", marginBottom: 10, background: "#fff" }}>
            <option value={-1}>랜덤 (직전과 다르게)</option>
            {MG3_REPORTS.map((r, i) => <option key={i} value={i}>{i + 1}. {r.title}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} style={{ width: 16, height: 16 }} /> 타이머 일시정지
          </label>

          <div style={{ borderTop: "2px dashed #d8d2c0", paddingTop: 10, marginBottom: 4 }}>
            <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 5 }}>상태이상 효과 미리보기</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[["", "없음"], ["burnout", "🥵 번아웃"], ["headache", "🤕 두통"], ["coffee", "☕ 커피"]].map(([k, lab]) => (
                <div key={k} onClick={() => applyStatus(k)} style={{ cursor: "pointer" }}>
                  <PxPanel bg={statusFx === k ? "var(--yellow)" : "#fff"} shadow={statusFx === k ? 2 : false} bw={2} style={{ padding: "4px 9px", fontFamily: "var(--px-body)", fontSize: 11.5, whiteSpace: "nowrap" }}>{lab}</PxPanel>
                </div>
              ))}
            </div>
            {statusFx && <p style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#999", margin: "6px 0 0", lineHeight: 1.5 }}>발동 조건 · {MG3_STATUS[statusFx].cond} — 보고서에 효과 적용(번아웃 회색·두통 흔들림·커피 떨림).</p>}
          </div>

          <div style={{ borderTop: "2px dashed #d8d2c0", paddingTop: 10, marginTop: 10, marginBottom: 4 }}>
            <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 5 }}>상사 빨간펜 미리보기</label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[["real", "진짜"], ["half", "반쪽"], ["fake", "페이크"]].map(([k, lab]) => (
                <div key={k} onClick={() => firePen(k)} style={{ cursor: "pointer" }}><PxPanel bg="#f3edfb" shadow={false} bw={2} style={{ padding: "4px 9px", fontFamily: "var(--px-body)", fontSize: 11.5, whiteSpace: "nowrap" }}>{lab}</PxPanel></div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "2px dashed #d8d2c0", paddingTop: 10, marginTop: 10, marginBottom: 8 }}>
            <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={autoEv} onChange={(e) => setAutoEv(e.target.checked)} style={{ width: 16, height: 16 }} /> 이벤트 자동 발생 <span style={{ color: "#999", fontWeight: 400 }}>(10초 간격)</span>
            </label>
            <label style={{ fontFamily: "var(--px-body)", fontSize: 12.5, fontWeight: 700, display: "block", marginBottom: 5 }}>중간 이벤트 발동 <span style={{ color: "#999", fontWeight: 400 }}>(수동)</span></label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[["wrongFix", "①잘못수정"], ["spell", "②맞춤법"], ["addPage", "③페이지+"], ["saveFail", "④저장실패"], ["kakao", "⑤카톡"], ["flicker", "⑥깜빡임"]].map(([k, lab]) => (
                <div key={k} onClick={() => fireEvent(k)} style={{ cursor: "pointer" }}>
                  <PxPanel bg={k === "kakao" || k === "flicker" ? "#fffbe8" : "#ffecea"} shadow={false} bw={2} style={{ padding: "4px 8px", fontFamily: "var(--px-body)", fontSize: 11, whiteSpace: "nowrap" }}>{lab}</PxPanel>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#999", margin: "6px 0 0", lineHeight: 1.5 }}>강력(빨강)·페이크(노랑). 카톡은 ✕로 닫힘.</p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => newGame()} style={{ flex: 1, cursor: "pointer" }}><PxButton bg="#e7ddc7" small style={{ width: "100%", justifyContent: "center" }}>재시작</PxButton></div>
            <div onClick={() => finish()} style={{ flex: 1, cursor: "pointer" }}><PxButton bg="#ffd9d4" small style={{ width: "100%", justifyContent: "center" }}>강제 종료</PxButton></div>
          </div>
          <p style={{ fontFamily: "var(--px-body)", fontSize: 10.5, color: "#999", marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>스트레스·보고서는 <b>재시작</b>부터 난이도에 반영.</p>
        </PxPanel>
      </div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
