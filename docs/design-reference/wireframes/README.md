# 과로사 방지 — 화면 와이어프레임 (참고용)

Claude Design 핸드오프 번들(2026-05-31 작업)에서 추출. **설정 화면 / 미니게임2(회의) / 미니게임3(보고서) / 엔딩**을 다룬다.

> ⚠️ 구현 시 두 가지를 함께 본다: **① 렌더 결과**(아래 자체완결 오프라인 HTML — 브라우저에서 직접 열어 시각 확인) + **② 설계 SOURCE**(`docs/design-reference/*.jsx` — 정확한 구조·문구·색). 오프라인 HTML은 컴파일된 인라인 코드라 읽기용이 아니라 **렌더 확인용**이다. 구현은 JSX의 시각 결과를 바닐라 JS `el()` + CSS로 재현한다.

## 이 폴더의 파일

| 파일 | 내용 |
|---|---|
| `README.md` | 이 문서 — 화면별 스펙·스타일 토큰·소스 위치 인덱스 |
| `wireframe-all-screens.html` | **전체화면 와이어프레임 (자체완결 실행본, 9.1M)** — 설정·미니게임2·3·엔딩 전체를 화면당 2안(엔딩 6종)으로 비교. 브라우저에서 직접 열기 가능 |
| `_design-chat-transcript.md` | 디자인 어시스턴트와의 전체 대화(의도 원본). 결정 근거가 여기 있음 |

## 실행 가능한 미니게임 프로토타입 (`assets/minigames/`)

| 화면 | 자체완결 실행본 |
|---|---|
| 미니게임1 이메일 분류 | `assets/minigames/email-classification-prototype.html` |
| 미니게임2 회의 준비 | `assets/minigames/meeting-prep-prototype.html` |
| 미니게임3 보고서 오탈자 | `assets/minigames/report-typos-prototype.html` |

## 확정된 방향 (chat 기준)

- **뷰포트**: 데스크탑 가로 16:9 (1280×720 기준)
- **톤**: 손그림 스케치 로파이 — 흑백 + 약간의 색
- **언어**: 전부 한국어
- **비교안**: 화면당 2안 (엔딩은 4종, 칼퇴는 S/A/B로 세분 → 카드 6종)

## 스타일 토큰 (와이어프레임 `:root` — 손그림 로파이)

```
--ink:    #2a2723   (먹/본문)
--paper:  #f6f3ea   (종이 배경)
--accent: #ffe08a   (형광 노랑 — 강조)
--marker: #e0604a   (빨강 마커)
--blue:   #5f8fc0   (파랑 마커)
--hand:   'Gaegu'             (본문 손글씨)
--pen:    'Nanum Pen Script'  (제목/필기)
폰트 로드: Gaegu, Nanum Pen Script, Gamja Flower (Google Fonts)
```

## 화면별 핵심 스펙 + 소스 위치

### ① 설정 화면 (Phase 4) — `../setup.jsx` · 렌더: `wireframe-all-screens.html`
- 한 화면에 전부: **이름 입력 / 성별(👨남·👩여) / 유형(☕커피파·🚬담배파)**
- 선택한 유형의 **효과·패널티 설명** 표시
- **아이템 안내**: 슬롯 3칸 (메인화면에서만 사용)
  - 시작 2칸: 유형 기본(커피 ☕ 또는 담배 🚬) + 유튜브 쇼츠 📱
  - 보상 1칸: 동료 이벤트로 획득 (예: 홍삼스틱 🧴)
  - 효과는 메인화면 슬롯 호버 토글로 안내

### ② 미니게임2 회의 준비 (Phase 2 — 구현 중) — `../minigame.jsx`, `../mg2-*.jsx`, `../meeting-*.jsx`
- 섞인 슬라이드를 드래그로 순서 배치 (목차→현황→문제점→개선안→기대효과→마무리), 60초
- 현재 `src/scenes/minigame/meeting.js`에 구현됨. **실행 프로토타입**: `assets/minigames/meeting-prep-prototype.html`

### ③ 미니게임3 보고서 오탈자 찾기 (Phase 3 — 미구현) — `../mg3-core.jsx`, `../mg3-data.js`, `../mg3-proto.jsx`, `../mg3-events.jsx`
- 보고서 텍스트에서 오탈자·숫자오기 3개 클릭, 60초
- 모든 단어 클릭 가능(커서 힌트 방지), 함정/일반 클릭 시 패널티
- 구현 시 `../mg3-*` 소스 참조. **실행 프로토타입**: `assets/minigames/report-typos-prototype.html`

### ④ 엔딩 6종 (마감 폴리시) — `../ending.jsx` · 렌더: `wireframe-all-screens.html`
공통 레이아웃: 좌측(일러스트 영역 + 이모지 + 제목 + 연출 문구 3줄) / 우측 380px 패널(퇴근시각·등급 박스 + 최종 스탯요약 3바 + 🔄 다시하기 + 분기조건 주석)

| 엔딩 | accent | 이모지 | 분기 조건 |
|---|---|---|---|
| 칼퇴 S | `#bfe3c0` | 🏆 | 17:00 이전 퇴근 |
| 칼퇴 A | `#bfe3c0` | 🏆 | 17:00~17:30 |
| 칼퇴 B | `#bfe3c0` | 🏆 | 17:30~18:00 |
| 야근 | `#cdd3da` | 😩 | 18:00에 업무량 > 0 |
| 당일퇴사 | `#f3c7a6` | 😤 | 스트레스 100 도달 |
| 과로사 | `#d8d2cb` | 💀 | 체력 0 도달 (게임오버 최우선) |

스탯 요약 3바: 업무량(↓굿) · 스트레스(↓굿, 빨강) · 체력(↑굿, 파랑).
> 분기 조건은 `src/state.js`의 `checkEnding()`(success·overtime·quit·overwork)과 대응. 와이어프레임은 그 **시각 스펙**을 제공.
