// 출근 브리핑 「오늘의 일정」 탭 — 흐름 안내 (점심·회의만 고정 시각 표기)
export const FIXED_SCHEDULE_TIMES = {
  lunch: "12:00",
  meeting: "13:00",
};

export const DAY_FLOW_STEPS = [
  {
    label: "시작",
    icon: "🏢",
    title: "메인 업무",
    text: "출근하면 인수인계부터. 그다음 책상에서 하루가 굴러갑니다.",
  },
  {
    label: "",
    icon: "💬",
    title: "메신저",
    text: "팀장·동료·인사팀에서 연락이 옵니다. 답장 타이밍도 업무입니다.",
  },
  {
    label: "",
    icon: "☎",
    title: "전화",
    text: "벨이 울리면 받을지 말지 선택해야 합니다. 무시도 하나의 답입니다.",
  },
  {
    label: "",
    icon: "📋",
    title: "돌발 이벤트",
    text: "상사 지시, 동료 부탁… 예고 없이 튀어나올 수 있어요.",
  },
  {
    label: "",
    icon: "🎮",
    title: "미니게임",
    text: "이메일 분류 · 회의 준비 · 보고서 검토. 메인 업무 사이에 끼어듭니다.",
  },
  {
    label: "점심",
    icon: "🍱",
    title: "점심시간",
    time: FIXED_SCHEDULE_TIMES.lunch,
    text: "한 번 숨 고를 틈. 어떻게 쓰느냐에 따라 오후가 달라집니다.",
  },
  {
    label: "오후",
    icon: "📢",
    title: "전체 회의",
    time: FIXED_SCHEDULE_TIMES.meeting,
    text: "점심 직후 13시, 회의가 시작됩니다. 참석 후 후속 업무가 이어질 수 있어요.",
  },
  {
    label: "",
    icon: "🔁",
    title: "업무 반복",
    text: "메인 업무와 미니게임이 이어집니다. 익숙해졌다고 방심하지 마세요.",
  },
  {
    label: "마감",
    icon: "🎯",
    title: "퇴근 판정",
    text: "업무량을 비우면 칼퇴. 남아 있으면 야근 루트로 갈 수 있습니다.",
  },
];

export const SCHEDULE_WARNING =
  "스트레스·체력·업무량을 방치하면 퇴근 전에 하루가 끝날 수도 있어요.";
