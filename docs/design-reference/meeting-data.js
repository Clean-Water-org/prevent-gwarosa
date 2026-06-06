// meeting-data.js — 회의 준비 미니게임 주제 데이터
// 각 슬라이드: [제목, 부제, 7장모드전용?, 픽셀비주얼kind]
//   kind: agenda/status/problem/solution/effect/plan/closing (pixel-kit SlideContent)
//   5장모드는 7장모드전용(3번째=true) 2장을 제외
const TOPICS = [
  { name: "Q3 매출 실적 보고", slides: [
    ["목차", "오늘 발표 순서 안내", false, "agenda"],
    ["현황 분석", "지난 분기 매출 어떻게 됐나", false, "status"],
    ["문제점", "솔직히 안 되는 이유 다양함", false, "problem"],
    ["원인 분석", "누군가의 잘못은 절대 아님", true, "status"],
    ["개선안", "팀장님 마음에 드실 때까지 수정 가능", false, "solution"],
    ["기대효과", "잘 되면 좋은데 안 되면 어쩔 수 없음", true, "effect"],
    ["마무리", "질문 받겠습니다 (받지 마세요)", false, "closing"],
  ]},
  { name: "신규 프로젝트 제안", slides: [
    ["목차", "발표 흐름 안내", false, "agenda"],
    ["프로젝트 배경", "윗선에서 하라고 함", false, "status"],
    ["현재 한계", "안 되는 거 한두 가지가 아님", false, "problem"],
    ["시장 조사 결과", "이미 누가 했을 텐데", true, "status"],
    ["추진 방안", "일단 우리가 하는 척 해보겠음", false, "solution"],
    ["예산 계획", "부족하지만 어떻게든", true, "plan"],
    ["마무리", "통과되면 야근 시작", false, "closing"],
  ]},
  { name: "경쟁사 분석", slides: [
    ["목차", "오늘 다룰 내용", false, "agenda"],
    ["시장 현황", "우리 빼고 다 잘함", false, "status"],
    ["경쟁사 동향", "그쪽도 우리 보고 있음", false, "problem"],
    ["우리의 약점", "다 말하기 시간 부족", true, "problem"],
    ["대응 전략", "그냥 하던 거 계속 함", false, "solution"],
    ["기대 성과", "운이 좋으면 따라잡을 수도", true, "effect"],
    ["마무리", "결론은 더 열심히", false, "closing"],
  ]},
  { name: "신규 서비스 출시 계획", slides: [
    ["목차", "발표 안건", false, "agenda"],
    ["서비스 개요", "새로운 거 하나 만들었습니다", false, "status"],
    ["타깃 고객", "사실 누가 살지 모름", false, "problem"],
    ["기술 검토", "개발팀에게 미리 양해 구함", true, "solution"],
    ["출시 일정", "못 맞출 가능성 99%", false, "plan"],
    ["마케팅 전략", "예산이 허락하는 한도 내에서", true, "effect"],
    ["마무리", "다 같이 야근하자는 결론", false, "closing"],
  ]},
  { name: "팀 워크샵 결과 보고", slides: [
    ["목차", "발표 순서", false, "agenda"],
    ["워크샵 개요", "강제 참석한 1박 2일", false, "status"],
    ["주요 토론 내용", "결국 팀장님 의견대로", false, "problem"],
    ["도출된 인사이트", "안 가도 알 만한 결론", true, "effect"],
    ["액션 아이템", "결국 내가 다 함", false, "solution"],
    ["실행 일정", "미루다가 잊혀질 예정", true, "plan"],
    ["마무리", "다음 워크샵 또 가야 함", false, "closing"],
  ]},
  { name: "연간 예산 계획", slides: [
    ["목차", "오늘 발표 안건", false, "agenda"],
    ["작년 예산 현황", "어디 쓴 건지 모르겠음", false, "status"],
    ["부족했던 항목", "사실 다 부족했음", false, "problem"],
    ["원인 분석", "위에서 깎아서 그럼", true, "status"],
    ["올해 요청 예산", "이만큼은 받아야 함", false, "solution"],
    ["사용 계획", "회식비 비중이 가장 큼", true, "plan"],
    ["마무리", "깎으시면 어쩔 수 없습니다", false, "closing"],
  ]},
];
window.TOPICS = TOPICS;

// 주제별 함정 슬라이드 3개씩 [제목, 부제, 비주얼kind] — 제목은 그럴듯하나 부제로 무관함이 드러남
const TRAPS = [
  [["고객 만족도 조사 결과", "응답률 78%·평균 4.2점", "status"], ["재택근무 현황 분석", "비대면 업무 비율 65%", "problem"], ["직원 휴가 사용률 분석", "평균 12.3일·권장 미달", "status"]],
  [["사내 동호회 운영 현황", "등산·테니스·독서 모집 중", "status"], ["임직원 워라밸 현황", "야근 감소 캠페인 결과", "effect"], ["사옥 휴게실 리모델링", "안락의자·자판기 추가", "plan"]],
  [["사내 식당 운영 현황", "점심 메뉴 만족도 85%", "status"], ["지난 사내 행사 만족도", "직원 95% 호평", "effect"], ["부서별 야근 현황 보고", "평균 주 3.2회 야근", "problem"]],
  [["사내 IT 시스템 업그레이드", "인프라 개선 로드맵", "plan"], ["직원 복지 제도 개선안", "식대·교통비 인상 검토", "solution"], ["사옥 보안 시스템 점검", "출입카드 갱신 일정", "status"]],
  [["신입사원 멘토링 프로그램", "1:1 매칭 진행 현황", "status"], ["사내 흡연실 위치 변경", "직원 동선 개선 안내", "problem"], ["부서 회식 일정 조정", "다음 주 금요일로 변경", "plan"]],
  [["임직원 건강증진 프로그램", "점심시간 스트레칭 클래스", "effect"], ["사내 도서관 신간 안내", "이번 달 신간 12종", "status"], ["사내 카페 신메뉴 출시", "한정 라떼 신메뉴", "solution"]],
];
window.TRAPS = TRAPS;
const TRAP_MSGS = [
  "🤔 우리 부서의 슬라이드가 아닌 것 같은데...?",
  "😵 잠깐, 이거 어디서 본 자료인데...",
  "🤨 다른 팀 자료가 섞인 것 같아요",
];
window.TRAP_MSGS = TRAP_MSGS;
