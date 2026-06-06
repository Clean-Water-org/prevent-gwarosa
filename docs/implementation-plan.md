# 과로사 방지 — 구현 계획

## 현재 상태 요약

| 씬 / 기능 | 상태 | 비고 |
|---|---|---|
| 타이틀 화면 | 🟡 부분 | 이름·성별·커피파 입력 폼 없음. 와이어프레임 수령 후 구현 예정 |
| 온보딩 | ✅ 완성 | |
| 출근 (commute) | ✅ 완성 | |
| 메인 업무화면 | ✅ 완성 | 채팅·전화·이벤트·아이템 모두 동작 |
| 점심 이벤트 | ✅ 완성 | |
| 엔딩 6종 | ✅ 구현 (일러스트 대기) | 픽셀아트(칼퇴 S/A/B·야근·당일퇴사·과로사). 일러스트 에셋은 추후 제공 (assets/endings/) |
| 이메일 분류 미니게임 | ✅ 완성 | 키보드 A/D/Space 지원, 상태이상 효과 적용 |
| 회의 준비 미니게임 | 🔲 미구현 | 현재 판정 버튼 플레이스홀더 |
| 보고서 오탈자 미니게임 | 🔲 미구현 | 현재 판정 버튼 플레이스홀더 |
| URL hash 라우팅 | ✅ 완성 | `history.pushState` + `hashchange` 이벤트. 뒤로가기 지원 |
| localStorage 저장 | ✅ 완성 | `src/lib/storage.js`. 새로고침 복원 전용. 타이틀 진입 시 저장 무시, 이어하기 미구현 |
| 타이머 유틸 | ✅ 완성 | `src/lib/timer.js`. pause/resume/stop 지원 |
| 미니게임 서브폴더 분리 | ✅ 완성 | `src/scenes/minigame/index.js` + `email.js` |
| 설정 화면 (입사 서류) | 🔲 미구현 | 와이어프레임 수령. 픽셀아트 스타일로 구현 예정 (Phase 4) |

---

## 구현 단계

### Phase 1 — 인프라 정비 (우선)

#### 1-1. URL hash 라우팅 (`src/main.js`)
- `go(scene)` 호출 시 `location.hash = '#' + scene` 갱신
- `window.hashchange` 이벤트로 리렌더
- 페이지 첫 로드 시 hash 값으로 초기 씬 결정 (없으면 `title`)

#### 1-2. localStorage 저장 (`src/lib/storage.js`)
```js
saveGame(state)   // JSON.stringify → localStorage['gwarosa_save']
loadGame()        // parse 후 반환, 없으면 null
clearGame()       // 저장 삭제
```
- `main.js` render 호출마다 자동 저장 (새로고침 시 진행 상태 복원용)
- 타이틀 화면 진입 시에는 저장 데이터를 무시하고 항상 새 게임 시작
- "이어하기" 버튼 미구현 — localStorage는 페이지 새로고침으로 인한 손실 방지 전용

#### 1-3. 타이머 유틸 (`src/lib/timer.js`)
```js
createTimer(onTick, onEnd)  // → { start, pause, resume, stop, getLeft }
```
- 이메일 미니게임의 `setInterval` 직접 사용 → 이 유틸로 교체
- 미니게임 씬 전환 시 자동 stop

#### 1-4. 미니게임 서브폴더 분리 (`src/scenes/minigame/`)
- `src/scenes/minigame.js` → `src/scenes/minigame/index.js` (라우터)
- 이메일 로직 → `src/scenes/minigame/email.js`
- `main.js` import 경로만 수정

---

### Phase 2 — 회의 준비 미니게임

참고 파일: `docs/design-reference/meeting-proto.jsx`, `docs/design-reference/meeting-data.js`

#### 2-1. 데이터 포팅 (`src/data/meeting-slides.js`)
`meeting-data.js`의 `TOPICS`, `TRAPS`, `TRAP_MSGS`를 ES 모듈로 이식.

#### 2-2. 게임 로직 (`src/scenes/minigame/meeting.js`)
- **게임 상태**: `{ topicIdx, mode(5or7), slides, order, traps, trayOrder, place, time, phase, marks, wrongCount }`
- **드래그앤드롭**: `draggable` 속성 + `dragstart/dragover/drop` 이벤트
- **채점**: 슬라이드 전부 배치 시 실시간 채점 표시, 전원 정답+함정 모두 휴지통 → 자동 종료
- **함정**: 슬롯에 놓으면 -3초·오답 카운트. 휴지통에만 버릴 수 있음
- **스트레스 연동**:
  - 50↑: 7장 모드, 부제 정상 표시
  - 80↑: 7장 모드, 부제 앞 2단어만 표시 (clipSub)
- **상태이상 연동**: burnout(드래그 지연 650ms), headache(제목 blur), coffee(jitter)
- **결과 3단계**: 오류 0~1 = success, 2~3 = partial, 4↑ = fail

#### 2-3. 중간 이벤트 (스트레스 50↑ 시 10초 간격)
프로토타입의 11종 이벤트 중 핵심 5종 우선 구현:
- addSlide: 슬라이드 1장 추가 (카드 더미에 랜덤 삽입)
- timeCut: -10초
- kakao: 까까오톡 PC창 팝업 (수동 닫기)
- lock: 랜덤 슬라이드 5초 잠금
- shuffle2: 배치된 슬라이드 2장 위치 교환

---

### Phase 3 — 보고서 오탈자 찾기 미니게임

참고 파일: `docs/design-reference/mg3-proto.jsx`, `docs/design-reference/mg3-data.js`, `docs/design-reference/mg3-core.jsx`

#### 3-1. 데이터 포팅 (`src/data/report-typos.js`)
`mg3-data.js`의 보고서 5종 + 토큰 포맷 이식.
- 오탈자 토큰: `«틀린값|올바른값|유형»`
- 함정 토큰: `‹정상단어|함정유형›`

#### 3-2. 게임 로직 (`src/scenes/minigame/report.js`)
- 보고서 랜덤 출제, 단어 클릭으로 판정
- 오탈자 클릭: 취소선+초록 수정+✓, 발견 카운트↑
- 함정·일반 단어 클릭: -3초, 오답↑, 토스트
- **모든 단어 클릭 가능** (커서 힌트 방지)
- HUD: 발견 N/M · 오답 N/허용치 · 60초 타이머
- 결과: 전부 발견 = success, 절반↑ = partial, 미만 = fail

---

### Phase 4 — 설정 화면 (입사 서류 / 신규 입사자 정보 카드)

참고: `docs/design-reference/setup.jsx` (콘텐츠·레이아웃), `wireframes/wireframe-all-screens.html`

> **스타일**: 미니게임2와 동일한 **픽셀아트 레트로**(Galmuri 폰트, PX 팔레트, 오피스 배경 + 모니터/문서 프레임). 와이어프레임의 손그림 로파이 톤은 미적용 — 와이어프레임은 **콘텐츠·레이아웃 참조용**.

#### 4-1. 데이터 (`src/data/player-types.js`)
`setup.jsx`의 TYPE_DATA 포팅 — 유형별 가이드(기본아이템·효과·패널티):
- **커피파** `coffee` ☕ "체력형": 기본 커피 / 효과 체력 +15 / 패널티 연속 2회 → 커피 과다복용(커서 떨림)
- **담배파** `cigarette` 🚬 "멘탈형": 기본 담배 / 효과 스트레스 -12·시간 단축 / 패널티 체력 감소·30% 흡연 초과
- 유형 → 인벤토리: 커피파 `["coffee","shorts"]` / 담배파 `["smoke","shorts"]` (담배 아이템 id는 `smoke`)

#### 4-2. 씬 (`src/scenes/setup.js`)
- `renderSetup(root, state, actions)` — 픽셀아트 입사 서류 카드
- 헤더: 📋 신규 입사자 정보 카드 / 과로사 방지 (주)
- 좌: **증명사진**(성별 연동 픽셀 도트 일러스트 남/여) · 우: 이름 입력 / 성별(👨남·👩여) / 유형(☕커피파·🚬담배파) / 유형 가이드 패널
- 하단: 아이템 안내(슬롯 3칸 — 시작 2칸 유형기본+쇼츠 / 보상 1칸 동료 이벤트)
- "서명하고 출근 →" → `state.player` 확정 + 인벤토리 설정 → commute

#### 4-3. 상태·라우팅 반영
- `player.name`(입력), `player.gender`("male"/"female", 기본 male), `player.type`("coffee"/"cigarette")
- 인벤토리를 **유형 기준으로 설정** (현재 `createInitialState`의 `["coffee","shorts"]` 하드코딩 → setup에서 확정)
- `main.js` scenes에 `setup` 등록 / title "출근하기" → `setup` / setup "서명하고 출근" → commute
- **성별 남/여 2개**, **이어하기 버튼 제외** (와이어프레임 기준)

---

### Phase 5 — 상사 이벤트 시스템 강화

- `boss.weights`를 실제로 이벤트 확률에 적용 (현재 미사용)
- 상사 등장 이벤트 (BossSilhouette): 회의 준비 미니게임 중 발동
- 상사 빨간펜 코멘트: 보고서 미니게임 중 발동

---

### Phase 6 — 비주얼 폴리시

- 씬별 애니메이션 (fade-in, pop-in)
- 상태이상 CSS 효과 (`fx-gray`, `fx-shake`, `fx-jitter`) 전 씬에 적용
- 엔딩 화면 비주얼 개선

---

### Phase 7 — 엔딩 화면 (6종)

참고: `docs/design-reference/ending.jsx` (콘텐츠·레이아웃), `wireframes/README.md`

> **스타일**: 설정·미니게임2/3과 동일한 **픽셀아트 레트로**(Galmuri 폰트, PX 팔레트, 오피스 배경 + CRT 모니터 프레임). 와이어프레임의 손그림 톤은 미적용 — 콘텐츠·레이아웃 참조용.
>
> **결정사항**: 일러스트 = **이미지 자리만(나중에 SVG/PNG 제공)** · 버튼 = **🔄 다시하기만**(공유 없음) · 프레임 = **CRT 모니터 + 오피스 배경**.

**엔딩 판정(4종) → 엔딩 카드(6종) 매핑**
| `checkEnding` ID | 조건 | 엔딩 카드 | accent |
|---|---|---|---|
| `success` | 업무량 ≤ 0 | 칼퇴 S / A / B (퇴근 시각 등급) | `#bfe3c0` |
| `overtime` | 18:00에 업무량 > 0 | 야근 | `#cdd3da` |
| `quit` | 스트레스 100 | 당일퇴사 | `#f3c7a6` |
| `overwork` | 체력 0 | 과로사 (게임오버 최우선) | `#d8d2cb` |

칼퇴 등급: 퇴근 시각(`gameMinute`) 기준 **S(17:00 이전) / A(17:00~17:30) / B(17:30~18:00)**.

#### 7-1. 엔딩 데이터 (`src/data/endings.js`)
`ending.jsx`의 6종 포팅 — 각 항목 `{ key, accent, emoji, title, lines[3], illo(설명 라벨), clockLabel, badgeLabel, statDirs }`.
- `gradeOf(gameMinute)` → "S"/"A"/"B" (칼퇴 등급)
- `resolveEnding(state)` → endingId(+등급)로 표시할 카드 1개 결정
- 일러스트 에셋 키: `clear-s`, `clear-a`, `clear-b`, `overtime`, `quit`, `overwork`

#### 7-2. 엔딩 씬 재구현 (`src/scenes/ending.js`)
- 오피스 배경 + CRT 모니터 프레임 (setup/minigame과 동일한 픽셀 헬퍼)
- **좌**: 일러스트 영역(`assets/endings/{key}.svg` 로드, 없으면 설명 라벨 placeholder) + 이모지 + 제목 + 연출 문구 3줄 박스
- **우 패널(380px)**: 퇴근시각·등급 박스(accent 배경) + 최종 스탯요약 3바(**실제 `state.stats`** — 업무량·스트레스·체력) + 🔄 다시하기
- 퇴근 시각: `formatTime(state.gameMinute)`; 당일퇴사·과로사는 라벨 변경("퇴사 선언 시각"/"쓰러진 시각")
- 다시하기 → `createInitialState()` (타이틀로 리셋)

#### 7-3. 에셋·연동
- 일러스트: `assets/endings/` 폴더에 6종 SVG/PNG (증명사진과 동일 방식, 추후 제공 시 연결). 없을 때는 placeholder 박스 + 설명 라벨 표시
- 칼퇴 등급은 `resolveEnding`에서 `gameMinute`로 산출 (state 추가 기록 불필요)

#### 7-4. (선택) 픽셀 오피스 헬퍼 공통화
- setup/meeting/report가 각자 인라인한 `makePixWindow/Clock/Plant/Mug/Monitor`를 `src/components/pixel-office.js`로 추출해 ending도 재사용 — 리스크(기존 파일 수정) 있어 별도 결정. 당장은 ending.js에 인라인해도 무방.

---

## 공통 모듈 설계

### `src/lib/storage.js`
```js
const KEY = "gwarosa_v1";
export function saveGame(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
export function loadGame() { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; }
export function clearGame() { localStorage.removeItem(KEY); }
```

### `src/lib/timer.js`
```js
export function createTimer(tickMs, onTick, onEnd) {
  let id = null, left = 0;
  return {
    start(seconds) { left = seconds * 1000; id = setInterval(() => { left -= tickMs; onTick(left / 1000); if (left <= 0) { clearInterval(id); onEnd(); } }, tickMs); },
    pause() { clearInterval(id); },
    resume() { /* restart interval */ },
    stop() { clearInterval(id); },
    getLeft() { return left / 1000; },
  };
}
```

### `src/scenes/minigame/index.js` (라우터)
```js
import { renderEmailGame } from "./email.js";
import { renderMeetingGame } from "./meeting.js";
import { renderReportGame } from "./report.js";

const ROTATION = ["email", "meeting", "report", "email", "meeting"];

export function renderMiniGame(root, state, actions) {
  if (state.minigameRound >= 5) { actions.finishWith(state.stats.workload <= 0 ? "success" : "overtime"); return; }
  const id = ROTATION[state.minigameRound];
  if (id === "email")   renderEmailGame(root, state, actions);
  if (id === "meeting") renderMeetingGame(root, state, actions);
  if (id === "report")  renderReportGame(root, state, actions);
}
```

---

## 코드 불일치 목록 (PDF 기획서 기준)

> 기획서 최종본(v1.2) 검토 후 발견된 수정 필요 항목.

| 위치 | 현재 코드 값 | 기획서 값 | 상태 |
|---|---|---|---|
| `src/state.js` `createInitialState()` | `colleagueTrust: 35` | 초기값 **30** | 🔲 미수정 |
| `src/scenes/minigame.js` `applyMiniResult` | 단일 델타 (email·meeting·report 동일) | 게임별 상이한 델타 (아래 표 참고) | 🔲 미수정 |
| `src/scenes/minigame.js` 이메일 부분성공 | `stress: +8` | `stress: +5` | 🔲 미수정 |
| `src/scenes/minigame.js` 이메일 실패 | `stress: +18, health: -8` | `stress: +15, health: -5` | 🔲 미수정 |
| `src/scenes/minigame.js` 보고서 실패 | `workload: -3` | `workload: **-5**` | 🔲 미수정 |
| `src/scenes/minigame.js` 라운드 종료 조건 | `minigameRound >= 5` (5회) | v1.2 제출판 **4회** / 원안 5회 | ⚠️ 확인 필요 |
| `src/data/items.js` | 사용 제한 없음 | 담배 5회·커피 3회·쇼츠 2회 | 🔲 미구현 |
| `src/scenes/ending.js` | 성공 엔딩 단순 표시 | 칼퇴 등급 (S/A/B) 표시 | 🔲 미구현 |
| headache 효과 | CSS 시각 효과만 | 게임시계 강제 +30분 (최대 1회) | 🔲 미구현 |

**미니게임별 정확한 델타**:
| 미니게임 | 성공 | 부분성공 | 실패 |
|---|---|---|---|
| 이메일 | workload -20 | workload -10, stress +5 | workload -3, stress +15, health -5 |
| 회의 준비 | workload -20 | workload -10, stress +8 | workload -3, stress +20, health -8 |
| 보고서 오탈자 | workload -20 | workload -10, stress +8 | workload **-5**, stress +20, health -8 |

---

## 미결 사항

- [x] 타이틀 와이어프레임 수령 → 설정 화면(입사 서류)으로 Phase 4 확정 (남/여·이어하기 제외·title→setup→commute)
- [ ] **라운드 수 확정**: 원안 5회 vs v1.2 제출판 4회 — 통일 후 `minigameRound >= N` 수정
- [ ] 미니게임 순서 확정 (현재: email·meeting·report·email·meeting 가정, 4회라면 앞 4개)
- [ ] 점심 이후 메인화면 이벤트 풀 확장 (현재 3종)
- [ ] 동료 신뢰도(colleagueTrust) 실제 효과 연결
- [ ] 상사 weights 이벤트 확률 적용
