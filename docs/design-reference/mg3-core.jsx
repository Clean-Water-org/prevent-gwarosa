// mg3-core.jsx — 보고서 렌더러 + 난이도 3종 + 인터랙션 상태 + 상사 빨간펜 코멘트
// 공통: Frame, Tag, SkBox, SkBtn (wf-kit) · Annot, Legend (minigame.jsx) · 데이터 (mg3-data.js)
// 라인별 토큰은 최대 1개 → found/flash/redPen/trapWrong/circle 를 "라인 인덱스(0-base)"로 키잉.

// 빨간 동그라미(상사 펜) — 토큰/단어 위에 겹침
function RedCircle({ children, big }) {
  return <span className={"mg3-redcircle" + (big ? " big" : "")}>{children}</span>;
}

// 한 줄 렌더
function Mg3Line({ raw, idx, found, flash, redPen, trapWrong, spellWords, half }) {
  const segs = parseMg3Line(raw);
  return (
    <p className="mg3-rline">
      {segs.map((s, i) => {
        if (s.plain != null) {
          // 맞춤법 오작동(spell): 정상 단어에 빨간 물결 밑줄 / 반쪽 힌트(half): 정상 단어에 빨간 동그라미
          let text = s.plain;
          if (spellWords && spellWords.some((w) => text.includes(w))) {
            const w = spellWords.find((x) => text.includes(x));
            const parts = text.split(w);
            return <span key={i}>{parts[0]}<span className="mg3-spell">{w}</span>{parts.slice(1).join(w)}</span>;
          }
          if (half && half.word && text.includes(half.word)) {
            const parts = text.split(half.word);
            return <span key={i}>{parts[0]}<RedCircle>{half.word}</RedCircle>{parts.slice(1).join(half.word)}</span>;
          }
          return <span key={i}>{text}</span>;
        }
        if (s.typo) {
          const isFound = found && found.includes(idx);
          const node = isFound
            ? <span className={"mg3-fixed" + (flash === idx ? " flash" : "")}>
                <span className="mg3-fixed-old">{s.wrong}</span>
                <span className="mg3-fixed-new">{s.correct} ✓</span>
              </span>
            : <span className="mg3-typo">{s.wrong}</span>;
          return redPen === idx ? <RedCircle key={i}>{node}</RedCircle> : <span key={i}>{node}</span>;
        }
        // trap
        const node = trapWrong === idx
          ? <span className="mg3-trapwrong">{s.word}<span className="mg3-wrong-x">✗</span></span>
          : <span className="mg3-trap">{s.word}</span>;
        return redPen === idx ? <RedCircle key={i}>{node}</RedCircle> : <span key={i}>{node}</span>;
      })}
    </p>
  );
}

// 보고서 본문 렌더 (난이도 = 줄 수)
function Mg3Report({ report, lineCount = 8, found = [], flash, redPen, trapWrong, spellWords, half, addLines }) {
  const rep = report || MG3_REPORTS[0];
  const lines = rep.lines.slice(0, lineCount);
  return (
    <div className="mg3-report">
      <p className="mg3-rtitle">제목. {rep.title}</p>
      {lines.map((ln, i) => (
        <Mg3Line key={i} raw={ln} idx={i} found={found} flash={flash} redPen={redPen} trapWrong={trapWrong} spellWords={spellWords} half={i === (half && half.line) ? half : null} />
      ))}
      {addLines && addLines.map((ln, i) => (
        <Mg3Line key={"add" + i} raw={ln} idx={lineCount + i} found={found} flash={flash} redPen={redPen} trapWrong={trapWrong} />
      ))}
    </div>
  );
}

// 상단 카운터 HUD : 제목 + [발견] + [오답] + [타이머]
function Mg3Head({ found, total, wrong, wrongMax, s, danger }) {
  const near = wrong >= wrongMax - 1;
  return (
    <div className="mg3-head">
      <span className="mg3-title">📝 보고서 오탈자 찾기</span>
      <div className="mg3-counters">
        <span className="mg3-cnt found">발견 {found}/{total}</span>
        <span className={"mg3-cnt wrong" + (near ? " near" : "")}>오답 {wrong}/{wrongMax}</span>
        <span className={"mg3-cnt timer" + (danger ? " danger" : "")}>⏱ 00:{s}</span>
      </div>
    </div>
  );
}

// 화면 프레임
function Mg3Frame({ tag, head, body, annots, shake }) {
  return (
    <Frame accent="#ffe08a">
      <div style={{ padding: "16px 34px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Tag>{tag}</Tag><Legend />
        </div>
        {head}
        <SkBox bg="#fff" style={{ marginTop: 12, padding: "14px 24px", flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
          <div className={shake ? "mg3-shake" : undefined}>{body}</div>
          {shake && <span className="mg3-shake-tag">⚠ 화면 미세 흔들림</span>}
        </SkBox>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>{annots}</div>
      </div>
    </Frame>
  );
}

// 채점 기준 메모
function Mg3Judge({ total }) {
  return total === 3
    ? <Annot label="채점 · 오탈자 3개 (기본)">3개=성공(업무량 -20) · 2개=부분성공(-10·스트레스+8) · 1개↓=실패(-5·스트레스+20·체력-8)</Annot>
    : <Annot label="채점 · 오탈자 4개 (난이도)">4개=성공(업무량 -20) · 2~3개=부분성공(-10·스트레스+8) · 1개↓=실패(-5·스트레스+20·체력-8)</Annot>;
}

// ───────── 난이도 3종 ─────────
function TypoBasic() {
  return (
    <Mg3Frame tag="미니게임3 · 오탈자 찾기 — 기본 (스트레스 50 미만 · 8줄·오탈자 3·함정 2)"
      head={<Mg3Head found={1} total={3} wrong={0} wrongMax={5} s="38" />}
      body={<Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} />}
      annots={<React.Fragment>
        <Annot label="이 화면에서 하는 일">보고서를 읽으며 <b>오탈자(형식상 불가능·한국어 흔한 오타)</b>를 클릭. 맞으면 <b style={{ color: "#1f7a44" }}>올바른 값으로 수정 + ✓</b>, 발견 수↑. <b>함정 텍스트(정상 표기)</b>를 누르면 오답.</Annot>
        <Annot label="난이도 비례 · 신규">기본 <b>8줄·오탈자 3·함정 2·의심 5·오답 5회</b> · 50↑ <b>12줄·4·3·의심 7·4회</b> · 80↑ <b>12줄·4·4·의심 8·3회+흔들림</b>.</Annot>
        <Mg3Judge total={3} />
      </React.Fragment>} />
  );
}

function TypoLv1() {
  return (
    <Mg3Frame tag="미니게임3 · 오탈자 찾기 — 난이도1 (스트레스 50↑ · 12줄·오탈자 4·함정 3)"
      head={<Mg3Head found={0} total={4} wrong={0} wrongMax={4} s="52" />}
      body={<Mg3Report report={MG3_REPORTS[0]} lineCount={12} found={[]} />}
      annots={<React.Fragment>
        <Annot label="난이도1 · 신규">스트레스 <b>50↑</b> → 8→<b>12줄</b>, 오탈자 3→<b>4개</b>, 함정 2→<b>3개</b>, 오답 허용 5→<b>4회</b>. 화면 효과는 없음.</Annot>
        <Mg3Judge total={4} />
      </React.Fragment>} />
  );
}

function TypoLv2() {
  return (
    <Mg3Frame tag="미니게임3 · 오탈자 찾기 — 난이도2 (스트레스 80↑ · 12줄·함정 4·흔들림)" shake
      head={<Mg3Head found={1} total={4} wrong={1} wrongMax={3} s="29" danger />}
      body={<Mg3Report report={MG3_REPORTS[0]} lineCount={12} found={[1]} />}
      annots={<React.Fragment>
        <Annot label="난이도2 · 신규">스트레스 <b>80↑</b> → 12줄·오탈자 4 유지, <b>함정 4개</b>, 오답 허용 <b>3회</b> + <b>화면 미세 흔들림</b>으로 커서 컨트롤 난이도↑.</Annot>
        <Mg3Judge total={4} />
      </React.Fragment>} />
  );
}

// ───────── 인터랙션 상태 ─────────
function TypoCorrect() {
  return (
    <Mg3Frame tag="미니게임3 — 상태 ① 정답(오탈자) 클릭 피드백"
      head={<Mg3Head found={2} total={3} wrong={1} wrongMax={5} s="33" />}
      body={<Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1, 3]} flash={3} />}
      annots={<Annot label="정답 클릭 피드백">오탈자를 맞게 클릭하면 <b className="mg3-inline-old">틀린값</b> 취소선 + <b style={{ color: "#1f7a44" }}>올바른 값 + ✓</b>로 바뀌고 <b>발견 카운터 +1</b>. (이 화면: 진앵→진행 방금 발견)</Annot>} />
  );
}

function TypoTrapWrong() {
  return (
    <Mg3Frame tag="미니게임3 — 상태 ② 함정 텍스트 오답 클릭"
      head={<Mg3Head found={1} total={3} wrong={2} wrongMax={5} s="31" />}
      body={<React.Fragment>
        <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} trapWrong={2} />
        <span className="mg3-float">-3초</span>
        <div className="mg3-trap-toast">🤔 이건 맞는 표현이에요</div>
      </React.Fragment>}
      annots={<React.Fragment>
        <Annot label="오답 클릭 피드백 · 신규">함정(정상 표기, 예: <b style={{ color: "var(--marker)" }}>안</b>)을 클릭하면 → 0.5초 <b style={{ color: "var(--marker)" }}>빨간 깜빡임</b> + <b>타이머 -3초</b>(우상단 “-3초” 플로팅) + <b>오답 카운터 +1</b>.</Annot>
        <Annot label="모든 단어 클릭 가능 · 신규"><b>화면의 모든 단어가 클릭 가능</b>(특정 단어만 커서 바뀌면 힌트가 됨). 오탈자만 정답이고, 함정·일반 단어를 누르면 모두 <b>오답 처리</b>(일반 단어는 “오탈자가 아니에요” 토스트).</Annot>
        <Annot label="함정 토스트(랜덤 1.5초)">“이건 맞는 표현이에요” / “자주 헷갈리는데 정답 표기 맞아요” / “한자어 표기 한 번 더 확인” 중 랜덤.</Annot>
      </React.Fragment>} />
  );
}

function TypoWarnNear() {
  return (
    <Mg3Frame tag="미니게임3 — 상태 ③ 오답 카운터 4/5 위험"
      head={<Mg3Head found={1} total={3} wrong={4} wrongMax={5} s="24" />}
      body={<React.Fragment>
        <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[1]} />
        <div className="mg3-warn">
          <div className="mg3-warn-box">
            <div style={{ fontSize: 30, marginBottom: 6 }}>⚠️ 오답이 너무 많습니다!</div>
            <div style={{ fontSize: 22, color: "var(--marker)" }}>한 번 더 틀리면 실패합니다</div>
          </div>
        </div>
      </React.Fragment>}
      annots={<Annot label="허용치 도달 경고 · 신규">오답이 허용치 -1(여기선 <b>4/5</b>)에 닿으면 상단 <b>오답 카운터가 빨갛게 강조</b>되고, 중앙에 <b>경고 알림</b>이 2초간 표시 후 사라짐.</Annot>} />
  );
}

function TypoFailExceeded() {
  return (
    <Mg3Frame tag="미니게임3 — 상태 ④ 오답 허용치 초과 → 자동 실패"
      head={<Mg3Head found={1} total={3} wrong={5} wrongMax={5} s="22" danger />}
      body={<div className="mg3-result-wrap">
        <div className="mg3-result fail">
          <div style={{ fontSize: 50 }}>❌</div>
          <div className="mg3-result-title">오답 횟수 초과</div>
          <div className="mg3-result-sub">오답 허용치(5/5)를 초과해 자동 실패</div>
          <div className="mg3-result-deltas">
            <span className="mg3-delta" style={{ background: "#e3f7e2", color: "#1f8a2e" }}>업무량 ▼5</span>
            <span className="mg3-delta" style={{ background: "#ffe3dd", color: "var(--marker)" }}>스트레스 ▲20</span>
            <span className="mg3-delta" style={{ background: "#ffe3dd", color: "var(--marker)" }}>체력 ▼8</span>
          </div>
          <SkBtn primary style={{ marginTop: 4 }}>메인 화면으로 ▶</SkBtn>
          <span className="mg3-result-foot">미니게임이 끝나면 항상 메인 화면으로 돌아갑니다</span>
        </div>
      </div>}
      annots={<Annot label="허용치 초과 → 자동 실패 · 신규">오답이 허용치(여기선 <b>5/5</b>)를 초과하면 잠깐 화면이 어두워지며 “오답 횟수 초과” 안내 후, <b>미니게임2와 동일한 실패 결과 카드</b>로 전환(업무량 -5·스트레스 +20·체력 -8). 결과 ③ 실패와 같은 화면으로 수렴합니다.</Annot>} />
  );
}

// ───────── 상사 빨간펜 코멘트 3종 ─────────
function BossPenSpeak() {
  return <div className="mg3-pen-speak">🖋️ 여기 좀 이상한데?</div>;
}
function TypoPenReal() {
  return (
    <Mg3Frame tag="미니게임3 — 상사 빨간펜 ① 진짜 힌트 (정답 위치)"
      head={<Mg3Head found={0} total={3} wrong={0} wrongMax={5} s="45" />}
      body={<React.Fragment>
        <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[]} redPen={3} />
        <BossPenSpeak />
      </React.Fragment>}
      annots={<React.Fragment>
        <Annot label="상사 빨간펜 · 15초 발동">시작 15초 시점, 보고서 한 줄에 <b>빨간 동그라미 3초</b> + 말풍선 “여기 좀 이상한데? 🖋️”. 상사 유형마다 진실성이 다름.</Annot>
        <Annot label="진짜 힌트 · 똑부80/멍부30/멍게10"><b>정답 오탈자(진앵)에 정확히 동그라미.</b> 그대로 클릭하면 발견.</Annot>
      </React.Fragment>} />
  );
}
function TypoPenHalf() {
  return (
    <Mg3Frame tag="미니게임3 — 상사 빨간펜 ② 반쪽 힌트 (정답 줄의 다른 단어)"
      head={<Mg3Head found={0} total={3} wrong={0} wrongMax={5} s="45" />}
      body={<React.Fragment>
        <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[]} half={{ line: 3, word: "마케팅" }} />
        <BossPenSpeak />
      </React.Fragment>}
      annots={<Annot label="반쪽 힌트 · 똑부20/멍부60/멍게20"><b>정답 오탈자가 있는 줄은 맞지만, 동그라미는 다른(정상) 단어에.</b> 줄은 좁혀주되 단어는 직접 찾아야 함.</Annot>} />
  );
}
function TypoPenFake() {
  return (
    <Mg3Frame tag="미니게임3 — 상사 빨간펜 ③ 페이크 힌트 (정답 없는 줄)"
      head={<Mg3Head found={0} total={3} wrong={0} wrongMax={5} s="45" />}
      body={<React.Fragment>
        <Mg3Report report={MG3_REPORTS[0]} lineCount={8} found={[]} half={{ line: 6, word: "원자재" }} />
        <BossPenSpeak />
      </React.Fragment>}
      annots={<Annot label="페이크 힌트 · 멍부10/멍게70"><b>정답이 없는 줄·단어에 동그라미.</b> 믿고 클릭하면 오답. 멍게 상사는 70%가 페이크 / 똑게 상사는 코멘트 안 함(100%).</Annot>} />
  );
}

Object.assign(window, {
  Mg3Report, Mg3Line, Mg3Head, Mg3Frame, Mg3Judge, RedCircle,
  TypoBasic, TypoLv1, TypoLv2,
  TypoCorrect, TypoTrapWrong, TypoWarnNear, TypoFailExceeded,
  TypoPenReal, TypoPenHalf, TypoPenFake,
});
