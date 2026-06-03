export const chats = [
  {
    from: "팀장",
    kind: "boss-task",
    text: "이거 오늘 오후까지 됩니까?",
    seconds: 7,
    reply: { workload: -5 },
    miss: { workload: 15 },
  },
  {
    from: "팀장",
    kind: "boss-praise",
    text: "오늘 발표 자료 정리 좋았어요.",
    seconds: 9,
    reply: { stress: -8 },
    miss: {},
  },
  {
    from: "동료",
    kind: "colleague-help",
    text: "나 지금 너무 바쁜데 이거 좀 봐줄 수 있어?",
    seconds: 10,
    reply: { workload: 10, colleagueTrust: 10 },
    miss: { colleagueTrust: -10 },
  },
  {
    from: "시스템",
    kind: "notice",
    text: "오늘 오후 3시 전체 회의가 있습니다.",
    seconds: 12,
    reply: { stress: -3 },
    miss: { stress: 5 },
  },
];

export const mainEvents = [
  {
    id: "sudden-order",
    title: "갑작스러운 업무 지시",
    body: "팀장님이 새 업무를 얹었습니다. 지금 받을까요?",
    choices: [
      { label: "수락", delta: { workload: 15, stress: 10 }, message: "새 업무를 받았습니다. 할 일이 늘어납니다." },
      { label: "거절", delta: { stress: 20 }, message: "거절이 매끄럽지 않았습니다. 분위기가 싸해집니다." },
    ],
  },
  {
    id: "colleague-dump",
    title: "업무 떠넘기기",
    body: "동료가 급한 일을 부탁합니다. 도와주면 나중에 도움을 받을 수 있습니다.",
    choices: [
      { label: "도와준다", delta: { workload: 10, stress: 5, colleagueTrust: 12 }, message: "동료를 도왔습니다. 내 일은 늘었지만 관계가 좋아집니다." },
      { label: "거절한다", delta: { colleagueTrust: -10 }, message: "지금은 내 일에 집중했습니다. 동료 관계가 조금 내려갑니다." },
    ],
  },
  {
    id: "small-bonus",
    title: "소소한 인센티브",
    body: "간식 박스에서 쓸 만한 물건을 하나 챙길 수 있습니다.",
    choices: [
      { label: "커피", item: "coffee", message: "커피를 하나 챙겼습니다." },
      { label: "쇼츠 타임", item: "shorts", message: "몰래 숨 돌릴 명분을 챙겼습니다." },
    ],
  },
];

export const lunchEvents = [
  { title: "혼밥", text: "오늘도 혼자 점심. 조용해서 좋다.", delta: { stress: -5 } },
  { title: "동료 점심", text: "동료랑 같이 밥 먹었다. 수다 덕분에 기분이 풀렸다.", delta: { stress: -15, colleagueTrust: 10 } },
  { title: "상사 점심 합류", text: "팀장님이 같이 먹자고 했다. 밥이 목에 넘어가지 않는다.", delta: { stress: 10, health: -5 } },
  { title: "점심 중 업무 카톡", text: "밥 먹는데 업무 카톡이 왔다.", delta: { stress: 5 } },
];
