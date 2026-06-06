# 과로사 방지 — 프로젝트 가이드

직장인 생존 시뮬레이션 + 미니게임 웹 게임. 빌드 도구 없이 브라우저에서 직접 실행.

---

## 폴더 구조

```
prevent-gwarosa/
├── index.html                        # 진입점. <main id="app">에 모든 씬 렌더
├── styles/
│   └── main.css                      # 전역 CSS + 씬별 스타일 (BEM 없음, 클래스명 직접 사용)
│
├── src/
│   ├── main.js                       # 앱 셸. 라우터(hash) + 전역 setState/go/finishWith
│   ├── state.js                      # 게임 상태 생성·변환 순수 함수 (createInitialState, applyDelta, checkEnding)
│   ├── ui.js                         # DOM 헬퍼 el() + 공통 컴포넌트 (renderHud, renderItems 등)
│   │
│   ├── data/                         # 게임 데이터 — ES 모듈 export const (JSON 아님)
│   │   ├── bosses.js                 # 상사 4종 (id, name, publicHint, trait, weights)
│   │   ├── events.js                 # chats, mainEvents, lunchEvents
│   │   ├── items.js                  # 아이템 (coffee, smoke, ginseng, shorts)
│   │   ├── minigames.js              # 미니게임 메타 + emailDeck (이메일 18장)
│   │   ├── meeting-slides.js         # [신규] 회의 준비 슬라이드·함정 데이터 (TOPICS, TRAPS)
│   │   └── report-typos.js           # [신규] 보고서 오탈자·함정 데이터 (REPORTS)
│   │
│   ├── scenes/                       # 각 씬 = renderXxx(root, state, actions) 함수 1개
│   │   ├── title.js                  # 타이틀 (이름·성별·커피파 입력 — 와이어프레임 미수령, 추후 구현)
│   │   ├── onboarding.js             # 신입사원 온보딩 안내서
│   │   ├── commute.js                # 출근 브리핑 (상사 힌트 공개)
│   │   ├── main-work.js              # 메인 업무화면 (채팅·전화·이벤트·아이템)
│   │   ├── lunch.js                  # 점심 이벤트
│   │   ├── ending.js                 # 엔딩 (success·overtime·quit·overwork)
│   │   └── minigame/                 # [신규] 미니게임 서브폴더
│   │       ├── index.js              # 미니게임 라우터 (현재 minigame.js 역할 + 씬 분리)
│   │       ├── email.js              # 이메일 분류 — 완성 (현재 minigame.js에서 분리 예정)
│   │       ├── meeting.js            # [신규] 회의 준비 드래그 정렬
│   │       └── report.js             # [신규] 보고서 오탈자 클릭
│   │
│   └── lib/                          # [신규] 재사용 유틸리티
│       ├── timer.js                  # 게임 타이머 (setInterval 래퍼, pause/resume)
│       └── storage.js                # localStorage 래퍼 (saveGame, loadGame, clearGame)
│
├── assets/
│   ├── fonts/                        # Galmuri woff2 4종 (CSS에서만 참조)
│   └── minigames/                    # 독립 실행 가능한 프로토타입 HTML (참고·비교용)
│       ├── email-classification-prototype.html
│       └── 회의 준비 프로토타입 (오프라인).html
│
└── docs/
    ├── notion-brief.md               # 기획 브리프 (MVP 범위·핵심 방향)
    ├── implementation-plan.md        # 구현 계획·진행 상태 (이 파일과 함께 읽을 것)
    └── design-reference/             # Claude Design에서 추출한 JSX 원본 (참고용)
        ├── meeting-proto.jsx         # 회의 준비 프로토타입 전체 로직
        ├── meeting-data.js           # 슬라이드·함정 원본 데이터
        ├── mg3-core.jsx              # 보고서 오탈자 찾기 코어
        ├── mg3-data.js               # 보고서 오탈자 원본 데이터
        ├── mg3-events.jsx            # 보고서 중간 이벤트 시스템
        ├── mg3-proto.jsx             # 보고서 프로토타입 전체 로직
        ├── pixel-kit.jsx             # 공통 픽셀아트 컴포넌트 (SlideContent, MiniSlide 등)
        ├── mg2-game.jsx              # 모니터 베젤·소품 컴포넌트
        └── ...                       # 나머지 와이어프레임 파일
```

---

## 아키텍처 원칙

### 라우팅
`main.js`가 `location.hash`를 읽어 씬을 결정한다. `go(scene)` 호출 시 hash를 갱신하고 리렌더. 뒤로가기·직접 URL 접근 모두 지원.

```js
// main.js 패턴
window.addEventListener("hashchange", () => render());
export function go(scene) {
  location.hash = scene;   // → hashchange → render()
}
```

### 상태 관리
- `state` 객체는 불변 처리. `setState(patch)` 또는 `mutateState(fn)` 으로만 변경.
- `state.stats` (workload·stress·health), `state.player`, `state.counters`, `state.flags`, `state.log` 의 5개 최상위 키.
- `applyDelta(state, delta, message)` — 스탯 변경의 표준 함수. 값은 0~100 클램프.
- `checkEnding(state)` — 엔딩 조건 확인, null 또는 엔딩 id 반환.

### 씬 인터페이스
모든 씬 파일은 `renderXxx(root, state, actions)` 함수 하나를 export한다.

```js
// actions 객체
{
  setState(patch),          // 얕은 병합
  mutateState(fn),          // fn(draft) → newState
  go(scene),                // 씬 전환
  finishWith(endingId),     // 엔딩으로 이동
}
```

### DOM 헬퍼
`el(tag, attrs, children)` 함수로 DOM 노드를 생성한다. innerHTML 사용 금지.

```js
el("button", { class: "primary", text: "출근", onClick: () => go("main") })
```

### 미니게임 결과 적용
`applyMiniResult(state, result, message)` 함수가 결과(success·partial·fail)에 따라 스탯 변경·라운드 증가·다음 씬 결정을 모두 처리한다.

---

## 게임 흐름

```
title → commute → main ─┬→ minigame(1) → main
                        ├→ minigame(2) → lunch → main
                        ├→ minigame(3) → main
                        ├→ minigame(4) → main
                        └→ minigame(5) → ending

언제든지: checkEnding() → overwork / quit / success / overtime
```

**미니게임 순서** (minigameRound 0~4):
| 라운드 | id | 구현 상태 |
|---|---|---|
| 0 | email | ✅ 완성 |
| 1 | meeting | 🔲 미구현 (플레이스홀더) |
| 2 | report | 🔲 미구현 (플레이스홀더) |
| 3 | email | ✅ 재사용 |
| 4 | meeting 또는 report | 🔲 미구현 |

---

## 스트레스 구간별 난이도 변화
| 구간 | 효과 |
|---|---|
| 0–49 | 기본 (5장 모드, 이메일 easy/normal) |
| 50–79 | 강화 (7장 모드, 이메일 hard 포함, 부제 정상) |
| 80–100 | 극한 (7장 모드, 이메일 evil 포함, 부제 축약, 오탈자 흔들림) |

---

## 상태이상 (statusFx)
| id | 발동 조건 | 효과 |
|---|---|---|
| burnout | 스트레스 70↑ | fx-gray (회색 비네팅) + 드래그 지연 |
| headache | 체력 30↓ | fx-shake + 슬라이드 제목 흐림 |
| coffee | coffeeStreak 2↑ | fx-jitter (미세 떨림) |

---

## 참고 파일 위치

- **회의 준비 프로토타입 전체 로직**: `docs/design-reference/meeting-proto.jsx`
- **슬라이드·함정 원본 데이터**: `docs/design-reference/meeting-data.js`
- **보고서 오탈자 전체 로직**: `docs/design-reference/mg3-proto.jsx`
- **보고서 데이터 + 토큰 포맷**: `docs/design-reference/mg3-data.js`
- **공통 픽셀아트 컴포넌트**: `docs/design-reference/pixel-kit.jsx`
- **실행 가능한 회의 준비 프로토타입**: `assets/minigames/회의 준비 프로토타입 (오프라인).html`

---

## 구현 시 주의사항

1. **ES Modules 전용** — `import`/`export` 사용. `require` 없음. `index.html`에 `type="module"`.
2. **빌드 도구 없음** — 로컬 서버(`python -m http.server` 등) 또는 파일 직접 열기로 실행.
3. **데이터는 `.js` 모듈** — JSON import assertion 대신 `export const` 방식 유지.
4. **innerHTML 사용 금지** — `el()` 헬퍼 또는 `textContent`로만 DOM 조작.
5. **setInterval 정리** — 미니게임에서 `setInterval` 사용 시 씬 전환 전 반드시 `clearInterval`.
6. **design-reference 파일은 JSX/React 코드** — 직접 실행 불가. 로직·데이터를 바닐라 JS로 포팅할 때 참고.
