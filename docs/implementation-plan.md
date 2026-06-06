# 과로사 방지 — 구현 계획

## 현재 상태 요약

| 씬 / 기능 | 상태 | 비고 |
|---|---|---|
| 타이틀 화면 | 🟡 부분 | 이름·성별·커피파 입력 폼 없음. 와이어프레임 수령 후 구현 예정 |
| 온보딩 | ✅ 완성 | |
| 출근 (commute) | ✅ 완성 | |
| 메인 업무화면 | ✅ 완성 | 채팅·전화·이벤트·아이템 모두 동작 |
| 점심 이벤트 | ✅ 완성 | |
| 엔딩 4종 | ✅ 기본 완성 | 텍스트만, 비주얼 미적용 |
| 이메일 분류 미니게임 | ✅ 완성 | 키보드 A/D/Space 지원, 상태이상 효과 적용 |
| 회의 준비 미니게임 | 🔲 미구현 | 현재 판정 버튼 플레이스홀더 |
| 보고서 오탈자 미니게임 | 🔲 미구현 | 현재 판정 버튼 플레이스홀더 |
| URL hash 라우팅 | ✅ 완성 | `history.pushState` + `hashchange` 이벤트. 뒤로가기 지원 |
| localStorage 저장 | ✅ 완성 | `src/lib/storage.js`. 새로고침 복원 전용. 타이틀 진입 시 저장 무시, 이어하기 미구현 |
| 타이머 유틸 | ✅ 완성 | `src/lib/timer.js`. pause/resume/stop 지원 |
| 미니게임 서브폴더 분리 | ✅ 완성 | `src/scenes/minigame/index.js` + `email.js` |
| 타이틀 입력 폼 | 🔲 미구현 | 와이어프레임 대기 중 |

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

### Phase 4 — 타이틀 입력 폼

와이어프레임 수령 후 진행. 예상 항목:
- 이름 입력 (텍스트)
- 성별 선택 (남/여/선택 안 함)
- 커피파 / 담배파 선택 → `state.player.type` 결정
- "이어하기" 버튼 (localStorage 저장 있을 때)

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

- [ ] 타이틀 와이어프레임 수령 → 입력 폼 구현
- [ ] **라운드 수 확정**: 원안 5회 vs v1.2 제출판 4회 — 통일 후 `minigameRound >= N` 수정
- [ ] 미니게임 순서 확정 (현재: email·meeting·report·email·meeting 가정, 4회라면 앞 4개)
- [ ] 점심 이후 메인화면 이벤트 풀 확장 (현재 3종)
- [ ] 동료 신뢰도(colleagueTrust) 실제 효과 연결
- [ ] 상사 weights 이벤트 확률 적용
