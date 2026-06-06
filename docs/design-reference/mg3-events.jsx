// mg3-events.jsx — 중간 이벤트 6종 + 결과 3종 + 상태이상 3종 + 레퍼런스 표/보고서 본문
// 의존: Mg3Frame, Mg3Head, Mg3Report (mg3-core) · Frame, Tag, SkBox, SkBtn (wf-kit) · Annot, Legend (minigame)

// 사람 실루엣(동료/상사) — 머리+어깨 흉상
function PersonBust3({ side }) {
  return (
    <div className={"mg3-bust" + (side === "left" ? " left" : "")} aria-hidden="true">
      <svg viewBox="0 0 200 240" width="180" height="216">
        <circle cx="100" cy="58" r="40" fill="#1a1a1a" />
        <rect x="86" y="94" width="28" height="16" fill="#1a1a1a" />
        <path d="M 44 120 Q 100 108 156 120 L 176 240 L 24 240 Z" fill="#1a1a1a" />
      </svg>
    </div>
  );
}

// PC 까까오톡 창
function KkakaoMini({ msgs }) {
  return (
    <div className="mg3-kkakao">
      <div className="mg3-kkakao-head"><span>💬 까까오톡 PC</span><span className="mg3-kkakao-x">✕</span></div>
      <div className="mg3-kkakao-body">
        <div className="mg3-kkakao-name">🙂 옆자리 동료</div>
        {msgs.map((m, i) => <div key={i} className="mg3-kkakao-msg">{m}</div>)}
      </div>
    </div>
  );
}

// 이벤트 토스트
function EvToast3({ tone, children }) {
  return <div className={"mg3-evtoast " + (tone || "neg")}>{children}</div>;
}

function evFrame(tag, body, annot, opts = {}) {
  return (
    <Mg3Frame tag={tag}
      head={<Mg3Head found={opts.found ?? 1} total={opts.total ?? 3} wrong={opts.wrong ?? 0} wrongMax={opts.wrongMax ?? 5} s={opts.s ?? "30"} danger={opts.danger} />}
      body={body} shake={opts.shake}
      annots={annot} />
  );
}

// 1. 동료의 잘못된 수정 (멍부·강력)
function Ev3WrongFix() {
  return evFrame("미니게임3 · 이벤트 ① 동료의 잘못된 수정 (강력·멍부)",
    <React.Fragment>
      <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[]} trapWrong={3} />
      <EvToast3 tone="neg">🤦 동료가 수정해줬어요... 근데 또 틀렸네요?</EvToast3>
    </React.Fragment>,
    <Annot label="효과 · 멍부">이미 발견한 오탈자가 <b>자동으로 다른 오답으로 바뀜</b> → <b>발견 카운터 -1</b>, 해당 위치에 새 오탈자 생성.</Annot>,
    { found: 1, wrong: 0 });
}

// 2. 자동 맞춤법 검사 오작동 (똑부·강력)
function Ev3Spell() {
  return evFrame("미니게임3 · 이벤트 ② 자동 맞춤법 검사 오작동 (강력·똑부)",
    <React.Fragment>
      <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} spellWords={["임원진", "추세", "자료이다"]} />
      <EvToast3 tone="neg">🔄 맞춤법 검사기 오작동 중...</EvToast3>
    </React.Fragment>,
    <Annot label="효과 · 똑부">정상 단어 2~3개에 <b>빨간 물결 밑줄(워드 맞춤법 표시처럼)</b>이 5초간 표시 → <b>클릭 유도해 오답 유발</b>.</Annot>);
}

// 3. 보고서 페이지 추가 (똑부·멍부·강력)
function Ev3AddPage() {
  return evFrame("미니게임3 · 이벤트 ③ 보고서 페이지 추가 (강력·똑부/멍부)",
    <React.Fragment>
      <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]}
        addLines={["9. (추가) 부록 — 세부 항목은 별도 «첩부|첨부|kr» 자료로 갈음한다.", "10. (추가) 보완 — 추가 «겁토|검토|kr» 사항은 다음 회의에서 다룬다."]} />
      <EvToast3 tone="neg">📄 팀장님: 이 내용도 추가해주세요</EvToast3>
    </React.Fragment>,
    <Annot label="효과 · 똑부/멍부">보고서에 <b>새 줄 2개가 슬라이드인하며 추가</b>(줄 수 +2) · <b>새 줄에 오탈자 1개 추가</b>(예: 겁토→검토). 발견 총수도 +1.</Annot>);
}

// 4. 자동 저장 실패 (멍게·강력)
function Ev3SaveFail() {
  return evFrame("미니게임3 · 이벤트 ④ 자동 저장 실패 (강력·멍게)",
    <React.Fragment>
      <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} />
      <div className="mg3-saving">💾 저장 중...</div>
      <EvToast3 tone="neg">💾 저장 실패! 일부 수정사항이 사라졌어요</EvToast3>
    </React.Fragment>,
    <Annot label="효과 · 멍게">상단에 <b>“저장 중...” 3초</b> 표시 후 사라지며 → <b>발견한 오탈자 중 1개가 다시 미발견 상태로</b> 되돌아감(발견 -1).</Annot>);
}

// 5. 동료의 카톡 (멍게·똑게·페이크)
function Ev3Kakao() {
  return evFrame("미니게임3 · 이벤트 ⑤ 동료의 카톡 (페이크·멍게/똑게)",
    <React.Fragment>
      <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} />
      <KkakaoMini msgs={["오늘 점심 약속 잊지마! 🍱", "이번 주말 약속 시간 어때?"]} />
    </React.Fragment>,
    <Annot label="효과 · 페이크">PC 까까오톡 창이 <b>시야 일부를 가림(3초)</b> · <b>클릭(✕)으로 닫기 가능</b>. 게임 영향은 시야 방해뿐.</Annot>,
    { s: "28" });
}

// 6. 모니터 깜빡임 (멍게·페이크)
function Ev3Flicker() {
  return evFrame("미니게임3 · 이벤트 ⑥ 모니터 깜빡임 (페이크·멍게)",
    <React.Fragment>
      <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} />
      <div className="mg3-flicker" />
    </React.Fragment>,
    <Annot label="효과 · 페이크">화면 전체가 <b>1초간 한 번 깜빡</b> · 토스트 없음 · 잠깐의 시야 방해 + 분위기 연출용(게임 수치 영향 없음).</Annot>);
}

// ───────── 결과 3종 ─────────
function Mg3Result({ tone, emoji, title, sub, deltas }) {
  return (
    <div className="mg3-result-wrap">
      <div className={"mg3-result " + tone}>
        <div style={{ fontSize: 50 }}>{emoji}</div>
        <div className="mg3-result-title">{title}</div>
        <div className="mg3-result-sub">{sub}</div>
        <div className="mg3-result-deltas">
          {deltas.map((d, i) => (
            <span key={i} className="mg3-delta" style={{ background: d.v < 0 ? "#e3f7e2" : "#ffe3dd", color: d.v < 0 ? "#1f8a2e" : "var(--marker)" }}>{d.label} {d.v < 0 ? "▼" : "▲"}{Math.abs(d.v)}</span>
          ))}
        </div>
        <SkBtn primary style={{ marginTop: 4 }}>메인 화면으로 ▶</SkBtn>
        <span className="mg3-result-foot">미니게임이 끝나면 항상 메인 화면으로 돌아갑니다</span>
      </div>
    </div>
  );
}
function ResFrame(tag, head, result, annot) {
  return (
    <Frame accent="#ffe08a">
      <div style={{ padding: "16px 34px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><Tag>{tag}</Tag><Legend /></div>
        {head}
        <SkBox bg="#fff" style={{ marginTop: 12, padding: "14px 24px", flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>{result}</SkBox>
        <div style={{ marginTop: 10 }}>{annot}</div>
      </div>
    </Frame>
  );
}
function Typo3Success() {
  return ResFrame("미니게임3 — 결과 ① 성공",
    <Mg3Head found={3} total={3} wrong={1} wrongMax={5} s="06" />,
    <Mg3Result tone="ok" emoji="🎉" title="오탈자 전부 발견!" sub="60초 내 모든 오탈자 발견" deltas={[{ label: "업무량", v: -20 }]} />,
    <Annot label="채점 · 4-2"><b style={{ color: "#1f8a2e" }}>성공</b> = 제한시간 내 모든 오탈자 발견 → <b>업무량 -20</b>.</Annot>);
}
function Typo3Partial() {
  return ResFrame("미니게임3 — 결과 ② 부분성공",
    <Mg3Head found={2} total={3} wrong={2} wrongMax={5} s="00" />,
    <Mg3Result tone="partial" emoji="😮‍💨" title="절반만 찾았다…" sub="오탈자 절반 발견" deltas={[{ label: "업무량", v: -10 }, { label: "스트레스", v: 8 }]} />,
    <Annot label="채점 · 4-2"><b style={{ color: "#c98a2a" }}>부분성공</b> = 절반 발견 → <b>업무량 -10, 스트레스 +8</b>.</Annot>);
}
function Typo3Fail() {
  return ResFrame("미니게임3 — 결과 ③ 실패",
    <Mg3Head found={1} total={3} wrong={5} wrongMax={5} s="00" danger />,
    <Mg3Result tone="fail" emoji="💀" title="결재 반려…" sub="1개 이하 발견 또는 오답 허용치 초과" deltas={[{ label: "업무량", v: -5 }, { label: "스트레스", v: 20 }, { label: "체력", v: -8 }]} />,
    <Annot label="채점 · 4-2"><b style={{ color: "var(--marker)" }}>실패</b> = 1개 이하 발견 또는 <b>오답 허용치 초과</b> → <b>업무량 -5, 스트레스 +20, 체력 -8</b>.</Annot>);
}

// ───────── 상태이상 3종 (회의 준비와 동일) ─────────
function Mg3Status({ tag, badge, caption, cls, head, dialog, memo }) {
  return (
    <Frame accent="#ffe08a">
      <div style={{ padding: "16px 34px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><Tag>{tag}</Tag><Legend /></div>
        {head}
        <SkBox bg="#fff" style={{ marginTop: 12, padding: "14px 24px", flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          <div className={cls + " mg3-status-stage"}>
            <div className="mg3-status-badge">{badge}</div>
            <div className="mg3-status-cap">{caption}</div>
            <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} />
          </div>
          {dialog}
        </SkBox>
        <div style={{ marginTop: 10 }}>{memo}</div>
      </div>
    </Frame>
  );
}
function Typo3Burnout() {
  return <Mg3Status
    tag="미니게임3 · 상태이상 — 🥵 번아웃 (스트레스 70↑)" cls="mg3-fx-gray"
    badge="🥵 번아웃" caption="커서 움직이는 속도가 느려진 상태"
    head={<Mg3Head found={1} total={3} wrong={1} wrongMax={5} s="40" />}
    memo={<Annot label="기획서 6-4 (시각 효과)">스트레스 <b>70↑</b> → <b>커서 속도 느려짐 + 회색 필터</b>. 메인화면에선 채팅 타이머 단축.</Annot>} />;
}
function Typo3Headache() {
  return <Mg3Status
    tag="미니게임3 · 상태이상 — 🤕 두통 (체력 30↓)" cls="mg3-fx-shake"
    badge="🤕 두통" caption="커서가 크게 튀어 방향 예측 불가"
    head={<Mg3Head found={1} total={3} wrong={1} wrongMax={5} s="33" />}
    dialog={<div className="mg3-dialog"><span style={{ fontSize: 40 }}>🤕</span><div className="mg3-dialog-box">너무 머리가 아파서 못하겠어…<div className="mg3-dialog-ok">확인</div></div></div>}
    memo={<Annot label="기획서 6-4 (시각 효과)">체력 <b>30↓</b> → <b>화면 흔들림</b> + 발동 즉시 <b>“너무 머리가 아파서…” 대화창</b> + 게임 시계 <b>1시간 점프</b>.</Annot>} />;
}
function Typo3Coffee() {
  return <Mg3Status
    tag="미니게임3 · 상태이상 — ☕ 커피 과다복용 (커피 연속 2회)" cls="mg3-fx-jitter"
    badge="☕ 손 떨림" caption="UI가 잘게 떨림 (갈색 톤)"
    head={<Mg3Head found={1} total={3} wrong={1} wrongMax={5} s="45" />}
    memo={<Annot label="기획서 6-4 (시각 효과)">커피 <b>연속 2회</b> → <b>UI 미세한 떨림 + 갈색 톤</b>(카페인 느낌). 방향은 어느정도 예측 가능.</Annot>} />;
}

// ───────── 레퍼런스 표 ─────────
function RefTables() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#f3eddf", padding: "22px 30px", overflow: "auto" }}>
      <div style={{ fontFamily: "var(--hand)", fontWeight: 700, fontSize: 26 }}>📑 미니게임3 레퍼런스 — 오탈자/함정 유형 · 상사 비율 · 이벤트</div>
      <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <table className="mg3-ref"><thead><tr><th>오탈자 유형</th><th>발견 방법</th><th>예시</th></tr></thead><tbody>
          <tr><td>형식상 불가능한 표기</td><td>일반 상식·형식</td><td>2026.13.05 · 25:00</td></tr>
          <tr><td>한국어 흔한 오타</td><td>한국어 어휘</td><td>부구→부각 · 회이→회의</td></tr>
        </tbody></table>
        <table className="mg3-ref"><thead><tr><th>함정 카테고리</th><th>예시</th></tr></thead><tbody>
          <tr><td>한자어 (정상)</td><td>결재 · 도출 · 점검 · 추진</td></tr>
          <tr><td>안/않 (정상)</td><td>“안 좋은” · “않을 것이다”</td></tr>
          <tr><td>되/돼 (정상)</td><td>“잘 안 되고 있다” · “되고 있다”</td></tr>
          <tr><td>이중부정·어색 (정상)</td><td>“부족하지 않다” · “없지 않다”</td></tr>
        </tbody></table>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <table className="mg3-ref"><thead><tr><th>상사 유형</th><th>진짜</th><th>반쪽</th><th>페이크</th><th>코멘트 X</th></tr></thead><tbody>
          {MG3_BOSS.map((b, i) => <tr key={i}><td>{b.who}</td><td>{b.real || "-"}</td><td>{b.half || "-"}</td><td>{b.fake || "-"}</td><td>{b.none || "-"}</td></tr>)}
        </tbody></table>
        <table className="mg3-ref"><thead><tr><th>난이도</th><th>줄</th><th>오탈자</th><th>함정</th><th>의심</th><th>오답허용</th><th>효과</th></tr></thead><tbody>
          {MG3_DIFF.map((d, i) => <tr key={i}><td>{d.label}</td><td>{d.lines}</td><td>{d.typo}</td><td>{d.trap}</td><td>{d.suspect}</td><td>{d.wrongMax}회</td><td>{d.fx}</td></tr>)}
        </tbody></table>
      </div>
      <table className="mg3-ref" style={{ marginTop: 16, width: "100%" }}><thead><tr><th>중간 이벤트(6종)</th><th>유형</th><th>상사</th><th>효과</th></tr></thead><tbody>
        {MG3_EVENTS.map((e, i) => <tr key={i}><td>{e.name}</td><td>{e.kind}</td><td>{e.who}</td><td>{e.effect}</td></tr>)}
      </tbody></table>
      <div style={{ marginTop: 10 }}><Annot label="함정 오답 토스트(랜덤 1.5초)">{MG3_TRAP_TOASTS.join(" · ")}</Annot></div>
      <div style={{ marginTop: 8 }}><Annot label="이벤트 발생 규칙 · 신규">10초 간격(10·20·30·40·50초)으로 발생 · <b>한 판에서 같은 이벤트는 한 번만</b>(매번 다른 이벤트). 페이크/강력 섞여 등장.</Annot></div>
    </div>
  );
}

// 보고서 본문 + 정답표 (1장당 1보드)
function ReportRef({ idx }) {
  const rep = MG3_REPORTS[idx];
  const keys = [];
  rep.lines.forEach((ln, li) => {
    const segs = parseMg3Line(ln);
    segs.forEach((s) => {
      if (s.typo) keys.push({ from: s.wrong, to: s.correct, type: s.cat === "fmt" ? "오탈자·형식" : "오탈자·한국어", basic: li < 8 });
      if (s.trap) keys.push({ from: s.word, to: "정상(클릭 금지)", type: MG3_CAT[s.cat].replace("함정 · ", "함정·"), basic: li < 8 });
    });
  });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#f3eddf", padding: "20px 30px", overflow: "auto", display: "flex", gap: 18 }}>
      <div style={{ flex: 1.3 }}>
        <div style={{ fontFamily: "var(--hand)", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>📄 보고서 {idx + 1}. {rep.title}</div>
        <SkBox bg="#fff" style={{ padding: "14px 22px" }}>
          <Mg3Report report={rep} lineCount={12} found={[]} />
        </SkBox>
        <div style={{ marginTop: 8 }}><Annot label="표기 범례"><b className="mg3-typo">물결 밑줄</b> = 오탈자(정답) · <b style={{ borderBottom: "2px dotted #888" }}>점선</b> = 함정(정상·클릭 금지). 실제 게임에선 둘 다 평범하게 보이고 표시 없음.</Annot></div>
      </div>
      <div style={{ width: 320, flex: "0 0 auto" }}>
        <div style={{ fontFamily: "var(--hand)", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>✅ 정답표 (8줄=●기본 / 12줄 추가)</div>
        <table className="mg3-ref"><thead><tr><th></th><th>표기</th><th>판정</th></tr></thead><tbody>
          {keys.map((k, i) => (
            <tr key={i}><td style={{ textAlign: "center" }}>{k.basic ? "●" : "+"}</td><td><b>{k.from}</b> → {k.to}</td><td style={{ whiteSpace: "nowrap" }}>{k.type}</td></tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
function ReportRef1() { return <Frame accent="#ffe08a"><div style={{ position: "relative", height: "100%" }}><ReportRef idx={0} /></div></Frame>; }
function ReportRef2() { return <Frame accent="#ffe08a"><div style={{ position: "relative", height: "100%" }}><ReportRef idx={1} /></div></Frame>; }
function ReportRef3() { return <Frame accent="#ffe08a"><div style={{ position: "relative", height: "100%" }}><ReportRef idx={2} /></div></Frame>; }
function ReportRef4() { return <Frame accent="#ffe08a"><div style={{ position: "relative", height: "100%" }}><ReportRef idx={3} /></div></Frame>; }
function ReportRef5() { return <Frame accent="#ffe08a"><div style={{ position: "relative", height: "100%" }}><ReportRef idx={4} /></div></Frame>; }
function RefTablesFrame() { return <Frame accent="#ffe08a"><div style={{ position: "relative", height: "100%" }}><RefTables /></div></Frame>; }

Object.assign(window, {
  Ev3WrongFix, Ev3Spell, Ev3AddPage, Ev3SaveFail, Ev3Kakao, Ev3Flicker,
  Typo3Success, Typo3Partial, Typo3Fail,
  Typo3Burnout, Typo3Headache, Typo3Coffee,
  RefTablesFrame, ReportRef1, ReportRef2, ReportRef3, ReportRef4, ReportRef5,
});
