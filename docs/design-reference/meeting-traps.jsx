// meeting-traps.jsx — 회의 준비: 함정 슬라이드 시스템 + 중간 이벤트 12종 + 레퍼런스 표
// minigame.jsx(window) 의 MgScreen, Slide, OrderRow, Annot, Legend, SLIDES, HINTS, GREEN 재사용
// wf-kit.jsx(window) 의 Frame, Tag, SkBox, SkBtn 재사용
const { MgScreen, Slide, OrderRow, Annot, Legend, SLIDES, HINTS, GREEN } = window;
const MK = "#e0604a"; // marker red

// ───────────────────────── 데이터 ─────────────────────────
// 주제별 함정 슬라이드 3개씩 (제목만 보면 중간 슬라이드 같지만 부제를 읽으면 무관)
const TRAP_TOPICS = [
  { name: "Q3 매출 실적 보고", traps: [
    ["고객 만족도 조사 결과", "응답률 78%, 평균 4.2점"],
    ["재택근무 현황 분석", "부서별 비대면 업무 비율 65%"],
    ["직원 휴가 사용률 분석", "평균 12.3일, 권장 15일 미달"],
  ]},
  { name: "신규 프로젝트 제안", traps: [
    ["사내 동호회 운영 현황", "등산·테니스·독서 부원 모집 중"],
    ["임직원 워크라이프 밸런스", "야근 감소 캠페인 결과"],
    ["사옥 휴게실 리모델링 계획", "안락의자 및 자판기 추가"],
  ]},
  { name: "경쟁사 분석", traps: [
    ["사내 식당 운영 현황", "점심 메뉴 만족도 85%"],
    ["지난 사내 행사 만족도", "직원 95% 호평"],
    ["부서별 야근 현황 보고", "평균 주 3.2회 야근"],
  ]},
  { name: "신규 서비스 출시 계획", traps: [
    ["사내 IT 시스템 업그레이드", "인프라 개선 로드맵"],
    ["직원 복지 제도 개선안", "식대·교통비 인상 검토"],
    ["사옥 보안 시스템 점검", "출입카드 갱신 일정"],
  ]},
  { name: "팀 워크샵 결과 보고", traps: [
    ["신입사원 멘토링 프로그램", "1:1 매칭 진행 현황"],
    ["사내 흡연실 위치 변경", "직원 동선 개선 안내"],
    ["부서 회식 일정 조정", "다음 주 금요일로 변경"],
  ]},
  { name: "연간 예산 계획", traps: [
    ["임직원 건강증진 프로그램", "점심시간 스트레칭 클래스"],
    ["사내 도서관 신간 안내", "이번 달 입고 신간 12종"],
    ["사내 카페 신메뉴 출시", "이번 달 한정 라떼 신메뉴"],
  ]},
];

const TRAP_MSG = [
  "🤔 우리 부서의 슬라이드가 아닌 것 같은데...?",
  "😵 잠깐, 이거 어디서 본 자료인데...",
  "🤨 다른 팀 자료가 섞인 것 같아요",
];

// ───────────────────────── 카드 ─────────────────────────
// 자유 제목/부제 카드 (함정 + 일반 공용). mark: 'ok'|'wrong'|'trash'
function Card({ title, sub, n, mark, trap, drag, w, locked, blurSub, ghost, snap, fresh }) {
  const width = w || 130;
  if (snap) return <div className="mg-slot snap" style={{ width, height: width * 0.74 }}>{n && <span className="mg-slot-n">{n}</span>}<span className="mg-snap-tip">여기 🧲</span></div>;
  if (ghost) return <div className="mg-slot ghost" style={{ width, height: width * 0.74 }}>{n && <span className="mg-slot-n">{n}</span>}<span className="mg-slot-empty">비어 있음</span></div>;
  const wrong = mark === "wrong", ok = mark === "ok", trash = mark === "trash";
  const cls = "mg-slide" + (wrong ? " wrong" : "") + (ok ? " ok" : "") + (trash ? " trashok" : "") + (drag ? " drag" : "") + (trap ? " trap" : "") + (locked ? " locked" : "") + (fresh ? " fresh" : "");
  return (
    <div className={cls} style={{ width, height: width * 0.74 }}>
      {fresh && <span className="mg-fresh-tag">추가</span>}
      {wrong && <span className="mg-mark wrong">✗</span>}
      {ok && <span className="mg-mark ok">✓</span>}
      {trash && <span className="mg-mark ok">🗑️</span>}
      {locked && <span className="mg-lock">🔒</span>}
      <div className="mg-slide-head">
        {n && <span className="wf-slide-no" style={{ background: wrong ? MK : ok ? GREEN : "var(--ink)" }}>{n}</span>}
        <span className="mg-slide-title">{title}</span>
      </div>
      <div className="mg-slide-body">
        <span className="wf-line" style={{ width: "88%" }} />
        <span className="wf-line" style={{ width: "62%" }} />
        <span className={"mg-slide-hint" + (blurSub ? " blur" : "")}>{sub}</span>
      </div>
    </div>
  );
}

// 휴지통 영역
function TrashZone({ active, ok, wrong }) {
  return (
    <div className={"mg-trash" + (active ? " active" : "") + (ok ? " ok" : "") + (wrong ? " wrong" : "")}>
      <span className="mg-trash-ico">🗑️</span>
      <span className="mg-trash-l">발표 자료 아님</span>
      <span className="mg-trash-sub">함정 슬라이드를 여기로</span>
    </div>
  );
}

// 토스트 (negative=빨강/주황, fake=노랑)
function Toast({ children, tone, pos }) {
  return <div className={"mg-toast " + (tone || "neg") + " " + (pos || "top")}>{children}</div>;
}

// 함정 보드: 정답 슬롯(위) + 카드 트레이(아래, 일반+함정 섞임) + 휴지통(우하단)
function TrapBoard({ slots, tray, w, dim, shake, blurSub, lockIdx, trash, note }) {
  return (
    <div className={"mg-board" + (shake ? " mg-quake" : "")} style={dim ? { opacity: .5, pointerEvents: "none" } : undefined}>
      <span className="mg-board-l">{note || "발표 순서 ▸ 빈 칸에 드래그 · 함정은 휴지통으로"}</span>
      <OrderRow slots={slots} w={w} />
      <div className="mg-trap-area">
        <div className="mg-trap-tray">
          <span className="mg-tray-l">🗂 카드 더미 · 정답 + 함정 섞임 ({tray.length}장)</span>
          <div className="mg-trap-tray-row">
            {tray.map((c, i) => (
              <Card key={i} {...c} drag w={w} blurSub={blurSub} locked={lockIdx === i} />
            ))}
          </div>
        </div>
        <TrashZone {...(trash || {})} />
      </div>
    </div>
  );
}

// 일반 슬라이드 트레이 아이템 헬퍼
const norm = (id) => ({ title: SLIDES[id], sub: "힌트: " + HINTS[id] });
const trap = (topic, ti) => ({ title: TRAP_TOPICS[topic].traps[ti][0], sub: TRAP_TOPICS[topic].traps[ti][1], trap: true });

// ═══════════════ A. 함정 상태 6종 ═══════════════

// 기본: 정답 5 + 함정 2 = 7
function TrapBasic() {
  const slots = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { snap: true, n: 3 }, { ghost: true, n: 4 }, { ghost: true, n: 5 }];
  const tray = [norm("problem"), trap(0, 0), norm("solution"), trap(0, 1), norm("closing")];
  return (
    <MgScreen tag="함정 · 기본 (정답 5 + 함정 2 = 카드 7장)" goal="📊 발표 슬라이드는 순서대로, 함정은 휴지통으로" s="48"
      annot={<React.Fragment>
        <Annot label="함정 슬라이드 · 신규">정답 슬라이드 사이에 <b>다른 팀·주제와 무관한 함정</b>이 섞여 있습니다. 제목은 그럴듯하지만 <b>부제를 읽으면</b> 발표 주제와 무관 — 우하단 <b>🗑️ 발표 자료 아님</b>으로 드래그해 제거하세요.</Annot>
        <Annot label="난이도별 함정 수">기본 <b>정답5+함정2(7장)</b> · 50↑ <b>정답7+함정2(9장)</b> · 80↑ <b>정답7+함정3(10장)+흔들림</b> · 주제별 함정 3개 중 난이도에 따라 2~3개 랜덤.</Annot>
      </React.Fragment>}>
      <TrapBoard slots={slots} tray={tray} w={128} />
    </MgScreen>
  );
}

// 50↑: 정답 7 + 함정 2 = 9
function Trap50() {
  const slots = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 }, { snap: true, n: 4 }, { ghost: true, n: 5 }, { ghost: true, n: 6 }, { ghost: true, n: 7 }];
  const tray = [norm("solution"), trap(0, 0), norm("effect"), norm("plan"), trap(0, 2), norm("closing")];
  return (
    <MgScreen tag="함정 · 스트레스 50↑ (정답 7 + 함정 2 = 카드 9장)" goal="📊 7장 모드 — 카드가 늘었습니다" s="50"
      annot={<Annot label="난이도1">스트레스 <b>50↑</b> → 정답 7장 + 함정 2개 = <b>카드 9장</b>. 화면 효과는 없음. 카드가 작아지고 분류량이 늘어 난이도↑.</Annot>}>
      <TrapBoard slots={slots} tray={tray} w={104} />
    </MgScreen>
  );
}

// 80↑: 정답 7 + 함정 3 = 10 + 흔들림
function Trap80() {
  const slots = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 }, { id: "solution", n: 4 }, { snap: true, n: 5 }, { ghost: true, n: 6 }, { ghost: true, n: 7 }];
  const tray = [norm("effect"), trap(0, 0), norm("plan"), trap(0, 1), norm("closing"), trap(0, 2)];
  return (
    <MgScreen tag="함정 · 스트레스 80↑ (정답 7 + 함정 3 = 카드 10장 + 흔들림)" goal="📊 화면이 흔들리는 고난도" s="33" danger
      annot={<Annot label="난이도2">스트레스 <b>80↑</b> → 정답 7 + 함정 <b>3개</b> = 카드 10장 + <b>화면 미세 흔들림</b>으로 드래그 난이도↑ (보드가 떨리는 것이 흔들림 표현).</Annot>}>
      <TrapBoard slots={slots} tray={tray} w={104} shake />
    </MgScreen>
  );
}

// 함정 → 휴지통 정답 처리
function TrapTrashOk() {
  const slots = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { snap: true, n: 3 }, { ghost: true, n: 4 }, { ghost: true, n: 5 }];
  const tray = [norm("problem"), norm("solution"), norm("closing")];
  return (
    <MgScreen tag="함정 처리 ① — 함정을 휴지통에 (정답 처리)" goal="🗑️ 함정 제거 성공" s="44"
      annot={<Annot label="함정 제거 성공">함정 슬라이드를 <b>🗑️ 발표 자료 아님</b>에 드롭하면 <b style={{ color: GREEN }}>정답 처리</b> — 함정이 사라지고 패널티 없음. (남은 카드는 모두 정답 슬라이드)</Annot>}>
      <TrapBoard slots={slots} tray={tray} w={128} trash={{ active: true, ok: true }} note="함정 1장을 휴지통에 넣어 제거했습니다" />
      <div className="mg-trash-fly">🗑️ 함정 제거됨 ✓</div>
    </MgScreen>
  );
}

// 함정 → 정답 슬롯 오답 + 토스트
function TrapToSlotWrong() {
  const slots = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { title: TRAP_TOPICS[0].traps[0][0], sub: TRAP_TOPICS[0].traps[0][1], trap: true, mark: "wrong", n: 3 }, { ghost: true, n: 4 }, { ghost: true, n: 5 }];
  const tray = [norm("problem"), norm("solution"), norm("closing")];
  return (
    <MgScreen tag="함정 처리 ② — 함정을 정답 슬롯에 (오답)" goal="⚠️ 함정을 슬롯에 잘못 배치" goalWarn s="41" danger
      annot={<Annot label="함정 오배치 → 오답">함정을 정답 슬롯에 놓으면 <b style={{ color: MK }}>오답 처리</b>: <b>오답 카운터 +1, 타이머 -3초</b>, 슬라이드는 <b>자동 복귀</b>. 동시에 토스트 3종 중 랜덤 1개 1.5초 표시.</Annot>}>
      <TrapBoard slots={slots} tray={tray} w={128} trash={{}} note="3번 슬롯에 함정을 놓아 오답 — 곧 자동 복귀" />
      <Toast tone="neg" pos="mid">{TRAP_MSG[0]}</Toast>
      <span className="mg-float-neg">-3초</span>
    </MgScreen>
  );
}

// 정답 → 휴지통 오답
function AnswerToTrashWrong() {
  const slots = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { snap: true, n: 3 }, { ghost: true, n: 4 }, { ghost: true, n: 5 }];
  const tray = [{ ...norm("problem"), mark: "wrong" }, norm("solution"), norm("closing")];
  return (
    <MgScreen tag="함정 처리 ③ — 정답을 휴지통에 (오답)" goal="⚠️ 발표 자료를 버렸습니다" goalWarn s="39" danger
      annot={<Annot label="정답 오삭제 → 오답">정답 슬라이드를 휴지통에 놓아도 <b style={{ color: MK }}>오답 처리</b>: <b>오답 카운터 +1, 타이머 -3초</b>, 슬라이드 <b>자동 복귀</b>. (휴지통은 함정 전용)</Annot>}>
      <TrapBoard slots={slots} tray={tray} w={128} trash={{ active: true, wrong: true }} note="‘문제점(정답)’을 휴지통에 넣어 오답 — 자동 복귀" />
      <Toast tone="neg" pos="mid">❌ 발표에 필요한 자료예요! 되돌립니다</Toast>
      <span className="mg-float-neg">-3초</span>
    </MgScreen>
  );
}

// ═══════════════ B. 중간 이벤트 12종 ═══════════════
// 이벤트 공통 베이스 보드 (진행 중 화면, 흐리게 깔림)
const EV_SLOTS = [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { id: "problem", n: 3 }, { snap: true, n: 4 }, { ghost: true, n: 5 }];
const EV_TRAY = [norm("solution"), trap(0, 0), norm("closing")];
function EventBase({ dim, shake, blurSub, lockIdx, extraSlot, extraTray }) {
  const slots = extraSlot ? [{ id: "agenda", n: 1 }, { id: "status", n: 2 }, { snap: true, n: 3 }, { id: "problem", n: 4 }, { ghost: true, n: 5 }, { ghost: true, n: 6 }] : EV_SLOTS;
  const tray = extraTray ? [...extraTray, ...EV_TRAY] : EV_TRAY;
  return <TrapBoard slots={slots} tray={tray} w={extraTray ? 112 : 124} dim={dim} shake={shake} blurSub={blurSub} lockIdx={lockIdx} trash={{}} note="진행 중 보드 (이벤트 발동)" />;
}

function EventScreen({ tag, badge, children, annot }) {
  return (
    <MgScreen tag={tag} hideTimer goal={badge} annot={annot}>
      <div style={{ position: "relative", height: "100%" }}>{children}</div>
    </MgScreen>
  );
}

// 상사 흉상 실루엣 (이벤트 발생원 표시)
function BossBust() {
  return (
    <div className="mg-ev-boss" aria-hidden="true">
      <svg viewBox="0 0 300 320" preserveAspectRatio="xMidYMax meet">
        <defs><filter id="evBossSoft" x="-6%" y="-6%" width="112%" height="112%"><feGaussianBlur stdDeviation="1.6" /></filter></defs>
        <g filter="url(#evBossSoft)" fill="#161616">
          <circle cx="150" cy="84" r="52" />
          <path d="M 18 320 C 26 205 80 142 150 140 C 220 142 274 205 282 320 Z" />
        </g>
      </svg>
    </div>
  );
}
// 팀장님 말풍선 (실루엣에서 나오는) + 선행 흐름 칩
function BossSpeak({ children }) {
  return (
    <React.Fragment>
      <div className="mg-ev-flow">⑥ 상사 등장 팝업(3초) → 사라지며 이 이벤트</div>
      <BossBust />
      <div className="mg-ev-speech">{children}<span className="mg-ev-speech-tail" /></div>
    </React.Fragment>
  );
}
// 팀장 이벤트 공통 선행 안내(파란 메모)
function BossLead() {
  return <Annot label="선행 — 상사 등장 팝업">이 이벤트는 <b>⑥ ‘상사가 옆에 서 있음’ 팝업</b>이 먼저 뜨고(상사 실루엣 3초), 팝업이 사라지면서 이어집니다. 팀장님의 말은 <b>말풍선</b>으로 표시.</Annot>;
}
// 페이크 이벤트용 — 사람 그림자(실루엣) + 말풍선 + 3초 자동 소멸
function PersonSpeak({ children, who }) {
  return (
    <React.Fragment>
      <div className="mg-ev-flow">{who} 그림자 등장 → 말풍선 → 3초 후 자동 소멸</div>
      <BossBust />
      <div className="mg-ev-speech">{children}<span className="mg-ev-speech-tail" /></div>
    </React.Fragment>
  );
}

// 카톡 알림 말풍선
function Kakao({ children, style }) {
  return <div className="mg-kakao" style={style}><span className="mg-kakao-ico">💬</span><span>{children}</span></div>;
}

// PC 까까오톡 창 (미니게임 이벤트용 — 메인화면 채팅 카드와 구분되는 큰 창)
function KakaoPC({ title, children, style, votes }) {
  return (
    <div className={"mg-kpc" + (votes ? " group" : "")} style={style}>
      <div className="mg-kpc-head">
        <span className="mg-kpc-title">💬 {title}</span>
        <span className="mg-kpc-x">✕</span>
      </div>
      <div className="mg-kpc-body">
        {children}
        {votes && <div className="mg-kpc-votes"><SkBtn small>한식</SkBtn><SkBtn small>일식</SkBtn><SkBtn small>양식</SkBtn></div>}
      </div>
    </div>
  );
}
function KMsg({ who, emoji, children }) {
  return (
    <div className="mg-kmsg">
      <span className="mg-kmsg-av">{emoji}</span>
      <div className="mg-kmsg-col">
        <span className="mg-kmsg-name">{who}</span>
        <span className="mg-kmsg-bubble">{children}</span>
      </div>
    </div>
  );
}

// 1. 팀장님 슬라이드 추가 요청 (팀장 이벤트)
function EvAddSlide() {
  return (
    <EventScreen tag="이벤트 ①(강력) — 팀장님 슬라이드 추가 요청"
      annot={<React.Fragment>
        <BossLead />
        <Annot label="슬라이드 추가 · 똑부30/멍부30"><b>정답 슬롯 1칸 자동 추가</b> + 추가 슬라이드 1장이 <b>카드 더미에 들어옴</b>(‘추가’ 리본, 3초 후 사라짐). 추가 슬라이드(예: 위험 요소/리스크 정리)는 <b>목차·마무리가 아니므로 중간 위치 중 한 곳이 정답</b>(랜덤). 카드 더미에서도 <b>앞·중간·맨 끝 랜덤 위치</b>에 섞여 들어감.</Annot>
      </React.Fragment>}>
      <EventBase extraSlot extraTray={[{ title: "위험 요소", sub: "리스크 정리", fresh: true }]} />
      <BossSpeak>한 장 더 넣어주세요 📎</BossSpeak>
    </EventScreen>
  );
}

// 2. 발표 시간 단축 (팀장 이벤트)
function EvTimeCut() {
  return (
    <EventScreen tag="이벤트 ②(강력) — 발표 시간 단축"
      annot={<React.Fragment>
        <BossLead />
        <Annot label="시간 단축 · 똑부25">시계 빨갛게 3회 깜빡 + 타이머 숫자 줄어드는 애니메이션 · <b>타이머 -10초 즉시 차감</b>.</Annot>
      </React.Fragment>}>
      <EventBase dim />
      <div className="mg-bigtimer danger">⏱ 00:34 <span className="mg-bigtimer-cut">→ 00:24</span></div>
      <span className="mg-float-neg big">-10초</span>
      <BossSpeak>발표 시간 10분 줄였어요 ⏱️</BossSpeak>
    </EventScreen>
  );
}

// 3. 상사 카톡 폭격 (PC 카톡창) — 슬라이드 흐려짐은 ⑦-2 두통 상태이상으로 이동
function EvKakaoStorm() {
  return (
    <EventScreen tag="이벤트 ③(강력) — 상사 카톡 폭격 (PC 카톡창)"
      annot={<React.Fragment>
        <Annot label="시야 가림 · 똑부20">PC 까까오톡 창이 슬라이드 영역 일부를 가림. 메시지 <b>3개 연속</b>(1초 간격) + 등장 시 살짝 흔들림. <b>자동으로 닫히지 않고 X 버튼을 눌러야만 닫힘</b>(시간 소모).</Annot>
        <Annot label="메인화면 채팅과 차이"><b>답장 불가 · X 닫기만</b> · 메인화면 채팅(작은 카드 여러 개+답장 버튼)과 달리 <b>큰 PC 창 1개</b>가 우측에 등장.</Annot>
      </React.Fragment>}>
      <EventBase dim />
      <KakaoPC title="까까오톡 PC" style={{ top: 40, right: 28 }}>
        <KMsg who="김팀장" emoji="😤">지금 어디까지 됐어요?</KMsg>
        <KMsg who="김팀장" emoji="😤">오늘 안에 끝나죠?</KMsg>
        <KMsg who="김팀장" emoji="😤">검토 빨리 부탁해요</KMsg>
      </KakaoPC>
      <Toast tone="neg" pos="top">상사 카톡 폭격 💬💬💬</Toast>
    </EventScreen>
  );
}

// 4. 추가 함정 슬라이드 등장 (옆 부서 메일로 카드 더미에 함정 추가)
function EvAddTrap() {
  return (
    <EventScreen tag="이벤트 ④(강력) — 추가 함정 슬라이드 등장"
      annot={<Annot label="함정 추가 · 멍부30">옆 부서에서 <b>메일로 자료가 도착</b> → 카드 더미에 <b>함정 1장이 섞임</b>(‘추가’ 리본, 3초 후 사라짐). 카드 더미에서 <b>앞·중간·맨 끝 랜덤 위치</b>에 섞여 들어감. 빨리 식별해 휴지통으로. <b>발동 조건: 현재 함정 수 &lt; 3</b>일 때만.</Annot>}>
      <EventBase extraTray={[{ title: "옆 부서 발표자료", sub: "메일로 잘못 전달됨 · 우리 발표와 무관", trap: true, fresh: true }]} />
      <Toast tone="neg" pos="top">📧 옆 부서에서 메일로 자료를 보냈어요 — 카드 더미에 섞였습니다!</Toast>
    </EventScreen>
  );
}

// 6. 슬라이드 잠금 (팀장 이벤트)
function EvLock() {
  return (
    <EventScreen tag="이벤트 ⑤(강력) — 슬라이드 잠금"
      annot={<React.Fragment>
        <BossLead />
        <Annot label="드래그 잠금 · 멍부25"><b>임의 슬라이드 1장</b>에 <b>🔒 + 빨간 테두리</b> → <b>5초간 드래그 불가</b>(랜덤 선택, 5초 후 자동 해제).</Annot>
      </React.Fragment>}>
      <EventBase lockIdx={0} />
      <BossSpeak>이 슬라이드 다시 검토해보세요 🔒</BossSpeak>
    </EventScreen>
  );
}

// 7. 슬라이드 셔플 (2장)
function EvShuffle2() {
  return (
    <EventScreen tag="이벤트 ⑥(강력) — 슬라이드 셔플 (2장)"
      annot={<Annot label="2장 자리바꿈 · 멍게20">화면 흔들림(0.5초) + <b>배치된 슬라이드 2장이 자리 교환</b>.</Annot>}>
      <div style={{ position: "relative", height: "100%" }} className="mg-quake-once">
        <EventBase />
        <span className="mg-swap-arrow" style={{ left: "9%", top: 64 }}>⇄</span>
      </div>
      <Toast tone="neg" pos="top">어? 슬라이드 순서가 바뀌었네... 😱</Toast>
    </EventScreen>
  );
}

// 8. 마우스 떨림
function EvJitterMouse() {
  return (
    <EventScreen tag="이벤트 ⑦(강력) — 마우스 떨림"
      annot={<Annot label="배치 미끄러짐 · 멍게15"><b>10초간</b> 슬라이드를 슬롯에 놓으려 하면 <b>카드가 미끄러져 떨어지며 카드 더미로 되돌아감</b>(“✋ 미끄러졌다!” 연출). 화면도 미세하게 흔들림. 함정 버리기·휴지통은 정상.</Annot>}>
      <EventBase />
      <span className="mg-cursor-jitter">🖐️<span className="mg-cursor-wave">〰</span></span>
      <Toast tone="neg" pos="top">손이 떨려 카드가 자꾸 미끄러진다... 😰</Toast>
    </EventScreen>
  );
}

// 9. 멍게 상사의 참견 (시그니처)
function EvSignatureShuffle() {
  return (
    <EventScreen tag="이벤트 ⑧(시그니처·멍게 전용) — 멍게 상사의 참견"
      annot={<React.Fragment>
        <BossLead />
        <Annot label="전체 셔플 · 멍게 게임 1회 보장"><b>배치된 모든 슬라이드 무작위 셔플 + 타이머 -3초</b>(제한시간 옆 -3 표시). 팀장 말은 <b>말풍선</b>.</Annot>
      </React.Fragment>}>
      <div style={{ position: "relative", height: "100%" }} className="mg-quake">
        <EventBase />
      </div>
      <span className="mg-float-neg">-3초</span>
      <BossSpeak>잠깐... 슬라이드 순서가 이렇게 돼야하지 않나...?</BossSpeak>
    </EventScreen>
  );
}

// 10. 멍게 상사의 잡담 방해 (페이크)
function EvChat() {
  return (
    <EventScreen tag="이벤트 ⑨(페이크) — 멍게 상사의 잡담 방해"
      annot={<Annot label="실루엣+말풍선 · 멍게30/똑게15">상사 그림자(실루엣) + 잡담 말풍선 → <b>3초 후 자동 소멸</b>. 게임 영향 없음(페이크).</Annot>}>
      <EventBase />
      <PersonSpeak who="상사">어제 그 드라마 봤어요~? 📺</PersonSpeak>
    </EventScreen>
  );
}

// 11. 회식 메뉴 카톡 (PC 카톡 단톡방)
function EvDinnerVote() {
  return (
    <EventScreen tag="이벤트 ⑩(페이크) — 회식 메뉴 카톡 (PC 단톡방)"
      annot={<React.Fragment>
        <Annot label="시야 방해 · 똑게35">PC 카톡 <b>단톡방 창</b>이 미니게임 영역 중앙을 가림. <b>자동으로 닫히지 않고</b> 한식/일식/양식 <b>아무거나 투표</b>하거나 <b>X</b>를 눌러야 닫힘(실제 영향 없음).</Annot>
        <Annot label="메인화면 채팅과 차이">메인화면 채팅과 달리 <b>답장 필수 아님</b> — 투표 버튼/X로 단순 닫기.</Annot>
      </React.Fragment>}>
      <EventBase dim />
      <KakaoPC title="까까오톡 PC · 우리팀 단톡방" votes style={{ top: 36, left: "50%", transform: "translateX(-50%)" }}>
        <KMsg who="이대리" emoji="🙂">🍻 오늘 회식 메뉴 투표 좀!</KMsg>
        <KMsg who="박사원" emoji="😀">저는 고기 당겨요</KMsg>
        <KMsg who="최주임" emoji="😋">아무거나 다 좋아요~</KMsg>
      </KakaoPC>
      <Toast tone="fake" pos="top">회식 메뉴 투표 알림 🍻</Toast>
    </EventScreen>
  );
}

// 12. 옆자리 동료 점심 약속 (페이크)
function EvLunch() {
  return (
    <EventScreen tag="이벤트 ⑪(페이크) — 옆자리 동료 점심 약속"
      annot={<Annot label="실루엣+말풍선 · 똑게30/멍게5">옆자리 동료 그림자(실루엣) + 말풍선 → <b>3초 후 자동 소멸</b>, 게임 영향 거의 없음.</Annot>}>
      <EventBase />
      <PersonSpeak who="동료">오늘 점심 뭐 먹을래요? 🍱</PersonSpeak>
    </EventScreen>
  );
}

// ═══════════════ C. 레퍼런스 표 ═══════════════

// 표 1: 주제별 함정 슬라이드 (6 × 3)
function RefTrapTable() {
  return (
    <Frame accent="#ffe08a">
      <div className="ref-root">
        <div className="mg-tagrow"><Tag>레퍼런스 표 1 · 주제별 함정 슬라이드 (6주제 × 3)</Tag><Legend /></div>
        <p className="ref-desc">게임 시작 시 난이도에 따라 각 주제의 함정 3개 중 <b>2~3개를 랜덤 추출</b>. 설계 원칙: <b>제목은 중간 슬라이드(현황/문제점/개선안) 같지만, 부제를 읽으면 발표 주제와 무관</b>.</p>
        <table className="ref-table">
          <thead><tr><th style={{ width: "19%" }}>주제</th><th>함정 1</th><th>함정 2</th><th>함정 3</th></tr></thead>
          <tbody>
            {TRAP_TOPICS.map((t, i) => (
              <tr key={i}>
                <td className="ref-topic">{t.name}</td>
                {t.traps.map((tr, j) => (
                  <td key={j}><b>{tr[0]}</b><br /><span className="ref-sub">{tr[1]}</span></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

// 표 2: 상사 유형별 이벤트 발생 가중치
const EV_ROWS = [
  ["슬라이드 추가 요청", "35%", "30%", "-", "-"],
  ["발표 시간 단축", "30%", "-", "-", "-"],
  ["상사 카톡 폭격", "35%", "-", "-", "-"],
  ["추가 함정 등장", "-", "30%", "-", "-"],
  ["슬라이드 잠금", "-", "25%", "-", "-"],
  ["슬라이드 셔플 (2장)", "-", "-", "20%", "-"],
  ["마우스 떨림", "-", "-", "15%", "-"],
  ["멍게 상사의 참견", "-", "-", "15%", "-"],
  ["멍게 상사의 잡담", "-", "5%", "30%", "15%"],
  ["회식 메뉴 카톡", "-", "5%", "15%", "35%"],
  ["옆자리 동료 점심", "-", "-", "5%", "30%"],
];
function RefWeightTable() {
  return (
    <Frame accent="#ffe08a">
      <div className="ref-root">
        <div className="mg-tagrow"><Tag>레퍼런스 표 2 · 상사 유형별 이벤트 발생 가중치</Tag><Legend /></div>
        <p className="ref-desc">게임 시작 시 배정된 <b>상사 유형</b>에 따라 자주 발생하는 이벤트가 다름. <b>강력 부정(빨강) 7 · 시그니처(보라) 1 · 페이크(노랑) 3</b>. (슬라이드 흐려짐은 ⑦-2 두통 상태이상 효과로 이동)</p>
        <table className="ref-table small">
          <thead><tr><th style={{ width: "30%" }}>이벤트</th><th>똑부 😤</th><th>멍부 😵</th><th>멍게 😴</th><th>똑게 😏</th></tr></thead>
          <tbody>
            {EV_ROWS.map((r, i) => (
              <tr key={i} className={i < 7 ? "ev-neg" : i === 7 ? "ev-sig" : "ev-fake"}>
                <td className="ref-topic">{r[0]}</td>
                {r.slice(1).map((c, j) => <td key={j} className={c === "-" ? "ref-dash" : "ref-pct"}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ref-leg"><span className="ev-neg-chip">강력 부정 7</span><span className="ev-sig-chip">시그니처 1</span><span className="ev-fake-chip">페이크 3</span></div>
      </div>
    </Frame>
  );
}

// 표 3: 이벤트 타이밍·확률·중복방지 룰
const TIMING_ROWS = [
  ["기본 (5장 모드)", "100%", "50%", "50%", "40%", "30%"],
  ["7장 모드 (50↑)", "100%", "70%", "70%", "60%", "40%"],
  ["7장 + 흔들림 (80↑)", "100%", "90%", "80%", "70%", "50%"],
];
function RefTimingTable() {
  return (
    <Frame accent="#ffe08a">
      <div className="ref-root">
        <div className="mg-tagrow"><Tag>레퍼런스 표 3 · 이벤트 타이밍 · 발생 확률 · 중복 방지</Tag><Legend /></div>
        <p className="ref-desc">시작 후 <b>10초에 첫 이벤트 반드시 발생</b>, 이후 <b>20/30/40/50초</b> 시점에 트리거 체크. 시점별 확률은 난이도에 따라 조정.</p>
        <table className="ref-table">
          <thead><tr><th style={{ width: "26%" }}>난이도</th><th>10초</th><th>20초</th><th>30초</th><th>40초</th><th>50초</th></tr></thead>
          <tbody>
            {TIMING_ROWS.map((r, i) => (
              <tr key={i}><td className="ref-topic">{r[0]}</td>{r.slice(1).map((c, j) => <td key={j} className="ref-pct">{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <div className="ref-rules">
          <div className="ref-rules-t">🔒 중복 방지 룰</div>
          <ul>
            <li>같은 <b>강력 부정 이벤트</b>는 한 게임에서 <b>최대 1회</b></li>
            <li><b>페이크 이벤트</b>는 <b>최대 2회</b>까지</li>
            <li><b>멍게 상사의 참견</b>(전체 셔플)은 멍게 게임에서 <b>1회 보장</b></li>
            <li><b>추가 함정 등장</b>은 현재 함정 수가 <b>3개 미만</b>일 때만 발동</li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}

Object.assign(window, {
  TrapBasic, Trap50, Trap80, TrapTrashOk, TrapToSlotWrong, AnswerToTrashWrong,
  EvAddSlide, EvTimeCut, EvKakaoStorm, EvAddTrap, EvLock, EvShuffle2, EvJitterMouse,
  EvSignatureShuffle, EvChat, EvDinnerVote, EvLunch,
  RefTrapTable, RefWeightTable, RefTimingTable,
});
