export const chatPool = {
  bossTask: [
    {
      kind: "boss-task",
      from: "팀장",
      seconds: 7,
      texts: {
        "smart-busy":  "이거 오늘 오후까지 됩니까?",
        "smart-lazy":  "이거 오늘 오후까지 가능할 것 같아요?",
        "clumsy-busy": "이거 오늘 오후까지 해줘야 할 것 같은데요!",
        "clumsy-lazy": "이거... 오늘 오후까지 되죠?",
      },
      reply: { workload: -5 },
      miss:  { workload: 15 },
    },
    {
      kind: "boss-task",
      from: "팀장",
      seconds: 7,
      texts: {
        "smart-busy":  "지난번 보고서 수정 사항 오늘 중으로 반영해줘요.",
        "smart-lazy":  "지난번 보고서 수정본 오늘 중으로 부탁드려요.",
        "clumsy-busy": "보고서 수정이 좀 필요할 것 같아요! 언제 가능할까요?",
        "clumsy-lazy": "보고서 수정... 오늘 가능하죠?",
      },
      reply: { workload: -5 },
      miss:  { workload: 15 },
    },
    {
      kind: "boss-task",
      from: "팀장",
      seconds: 7,
      texts: {
        "smart-busy":  "거래처 이메일 확인하고 오늘 안으로 회신해요.",
        "smart-lazy":  "거래처 이메일 답변 오늘 안으로 되면 좋겠어요.",
        "clumsy-busy": "이메일 확인했어요?! 빠른 답변 부탁드려요!",
        "clumsy-lazy": "이메일 답변... 해줄 수 있죠?",
      },
      reply: { workload: -5 },
      miss:  { workload: 15 },
    },
    {
      kind: "boss-task",
      from: "팀장",
      seconds: 7,
      texts: {
        "smart-busy":  "내일 회의 자료 오늘까지 공유해요.",
        "smart-lazy":  "내일 회의 자료 오늘 중으로 공유해줄 수 있어요?",
        "clumsy-busy": "내일 회의 준비됐어요?! 자료 미리 공유해줘요!",
        "clumsy-lazy": "내일 회의 자료... 있죠?",
      },
      reply: { workload: -5 },
      miss:  { workload: 15 },
    },
  ],
  bossPraise: [
    {
      kind: "boss-praise",
      from: "팀장",
      seconds: 9,
      texts: {
        "smart-busy":  "오늘 발표 잘 됐어요. 수고했습니다.",
        "smart-lazy":  "오늘 발표 좋았어요 👍",
        "clumsy-busy": "오늘 발표 정말 잘 했어요!! 👍",
        "clumsy-lazy": "오늘 발표... 나쁘지 않았어요.",
      },
      reply: { stress: -8 },
      miss:  {},
    },
    {
      kind: "boss-praise",
      from: "팀장",
      seconds: 9,
      texts: {
        "smart-busy":  "지난번 보고서 깔끔했어요. 계속 이렇게 해줘요.",
        "smart-lazy":  "지난번 보고서 좋았어요. 참고할게요.",
        "clumsy-busy": "보고서 정말 잘 썼어요! 칭찬해요!",
        "clumsy-lazy": "보고서 잘 됐던 것 같아요.",
      },
      reply: { stress: -8 },
      miss:  {},
    },
    {
      kind: "boss-praise",
      from: "팀장",
      seconds: 9,
      texts: {
        "smart-busy":  "요즘 성과가 좋네요. 기대하겠습니다.",
        "smart-lazy":  "요즘 잘 하고 있어요. 계속 파이팅.",
        "clumsy-busy": "요즘 일 잘한다고 느끼고 있어요!! 파이팅!!",
        "clumsy-lazy": "요즘 일... 잘 하는 것 같더라고요.",
      },
      reply: { stress: -8 },
      miss:  {},
    },
  ],
  colleagueHelp: [
    {
      kind: "colleague-help",
      from: "동료",
      seconds: 10,
      text: "나 지금 너무 바쁜데 이거 좀 봐줄 수 있어?",
      reply: { workload: 10, colleagueTrust: 10 },
      miss:  { colleagueTrust: -10 },
    },
    {
      kind: "colleague-help",
      from: "동료",
      seconds: 10,
      text: "이 문서 좀 검토해줄 수 있어? 급한 건 아닌데...",
      reply: { workload: 8, colleagueTrust: 10 },
      miss:  { colleagueTrust: -10 },
    },
    {
      kind: "colleague-help",
      from: "동료",
      seconds: 10,
      text: "오늘 발표 나 대신 해줄 수 있어? 갑자기 미팅이 생겼어",
      reply: { workload: 15, colleagueTrust: 15 },
      miss:  { colleagueTrust: -15 },
    },
  ],
  colleagueChat: [
    {
      kind: "colleague-chat",
      from: "동료",
      seconds: 10,
      text: "점심 뭐 먹었어?",
      reply: { stress: -3, health: -2 },
      miss:  {},
    },
    {
      kind: "colleague-chat",
      from: "동료",
      seconds: 10,
      text: "요즘 퇴근 빠르다 어떻게 한 거야?",
      reply: { stress: -3, health: -2 },
      miss:  {},
    },
  ],
  notice: [
    {
      kind: "notice",
      from: "시스템",
      seconds: 12,
      text: "오늘 오후 3시 전체 회의가 있습니다.",
      reply: { stress: -3 },
      miss:  { stress: 5 },
    },
    {
      kind: "notice",
      from: "시스템",
      seconds: 12,
      text: "복지포인트 신청 마감: 금일 18:00",
      reply: { stress: -3 },
      miss:  { stress: 5 },
    },
    {
      kind: "notice",
      from: "시스템",
      seconds: 12,
      text: "금일 오후 4시부터 사내 네트워크 점검이 있습니다.",
      reply: { stress: -3 },
      miss:  { stress: 5 },
    },
  ],
};

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
