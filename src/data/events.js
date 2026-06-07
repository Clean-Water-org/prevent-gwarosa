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
      reply: {},
      miss:  { stress: 10 },
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
      reply: {},
      miss:  { stress: 10 },
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
      reply: {},
      miss:  { stress: 10 },
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
      reply: {},
      miss:  { stress: 10 },
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
      reply: { stress: -5 },
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
      reply: { stress: -5 },
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
      reply: { stress: -5 },
      miss:  {},
    },
  ],
  colleagueHelp: [
    {
      kind: "colleague-help",
      from: "동료",
      seconds: 10,
      text: "나 지금 너무 바쁜데 이거 좀 봐줄 수 있어?",
      reply: { workload: 10, colleagueTrust: 15 },
      miss:  { colleagueTrust: -15, stress: 3 },
    },
    {
      kind: "colleague-help",
      from: "동료",
      seconds: 10,
      text: "이 문서 좀 검토해줄 수 있어? 급한 건 아닌데...",
      reply: { workload: 10, colleagueTrust: 15 },
      miss:  { colleagueTrust: -15, stress: 3 },
    },
    {
      kind: "colleague-help",
      from: "동료",
      seconds: 10,
      text: "오늘 발표 나 대신 해줄 수 있어? 갑자기 미팅이 생겼어",
      reply: { workload: 15, colleagueTrust: 15 },
      miss:  { colleagueTrust: -15, stress: 3 },
    },
  ],
  colleagueChat: [
    {
      kind: "colleague-chat",
      from: "동료",
      seconds: 10,
      text: "점심 뭐 먹었어?",
      reply: { stress: -5, health: -2 },
      miss:  { colleagueTrust: -5 },
    },
    {
      kind: "colleague-chat",
      from: "동료",
      seconds: 10,
      text: "요즘 퇴근 빠르다 어떻게 한 거야?",
      reply: { stress: -5, health: -2 },
      miss:  { colleagueTrust: -5 },
    },
  ],
  notice: [
    {
      kind: "notice",
      from: "시스템",
      seconds: 12,
      text: "오늘 오후 3시 전체 회의가 있습니다.",
      reply: {},
      miss:  { stress: 3 },
    },
    {
      kind: "notice",
      from: "시스템",
      seconds: 12,
      text: "복지포인트 신청 마감: 금일 18:00",
      reply: {},
      miss:  { stress: 3 },
    },
    {
      kind: "notice",
      from: "시스템",
      seconds: 12,
      text: "금일 오후 4시부터 사내 네트워크 점검이 있습니다.",
      reply: {},
      miss:  { stress: 3 },
    },
  ],
};

export const bossMainEvents = [
  {
    id: "sudden-order",
    type: "boss",
    title: "갑작스러운 업무 지시",
    speaker: "팀장님",
    body: "갑자기 미안한데 이것도 오늘 안에 가능할까요?",
    choices: [
      { id: "accept", label: "수락한다", delta: { workload: 15, stress: 10 }, message: "상사의 추가 업무를 수락했다." },
      { id: "reject", label: "거절한다", next: "reject-reason" },
    ],
  },
  {
    id: "hidden-break",
    type: "boss",
    title: "몰래 쉬고오기",
    speaker: "복도",
    body: "잠깐 자리를 비우면 숨은 돌릴 수 있을 것 같다.",
    choices: [
      { id: "accept", label: "나갔다 온다", delta: { stress: -15 }, message: "몰래 쉬고 왔다." },
      { id: "reject", label: "자리로 돌아간다", delta: {}, message: "쉬러 나가지 않고 자리로 돌아왔다." },
    ],
  },
  {
    id: "public-shame",
    type: "boss",
    title: "공개 망신",
    speaker: "회의실",
    body: "회의 중 실수가 공개적으로 언급됐다. 회의실 공기가 순간적으로 굳었다.",
    choices: [
      { id: "close", label: "견딘다", delta: { stress: 20, health: -5 }, message: "회의 중 공개적으로 지적받았다." },
    ],
  },
  {
    id: "public-praise",
    type: "boss",
    title: "공개 칭찬",
    speaker: "회의실",
    body: "상사가 모두가 있는 자리에서 이번 결과물을 칭찬했다.",
    choices: [
      { id: "close", label: "확인한다", delta: { stress: -15 }, message: "회의 중 공개적으로 칭찬받았다." },
    ],
  },
  {
    id: "smoke-overuse",
    type: "boss",
    title: "흡연 횟수 초과",
    speaker: "팀장님",
    body: "자리를 비운 시간이 눈에 띄었다. 팀장님이 업무 진행 상황을 물어본다.",
    choices: [
      { id: "close", label: "돌아간다", delta: { stress: 15 }, message: "자리를 자주 비운 것이 눈에 띄었다." },
    ],
  },
  {
    id: "boss-interview",
    type: "boss",
    title: "상사와의 면담",
    speaker: "팀장님",
    body: "잘못 처리된 메일 건으로 잠깐 면담이 잡혔다.",
    choices: [
      { id: "close", label: "면담을 마친다", delta: { gameMinute: 30, stress: 10 }, message: "잘못 보낸 메일 건으로 상사와 면담했다." },
    ],
  },
];

export const colleagueMainEvents = [
  {
    id: "colleague-dump",
    type: "colleague",
    title: "업무 떠넘기기",
    speaker: "동료",
    body: "나 지금 너무 바쁜데 이것만 좀 봐줄 수 있어?",
    choices: [
      { id: "accept", label: "도와준다", delta: { workload: 10, stress: 5, colleagueTrust: 15 }, message: "동료의 부탁을 들어주었다." },
      { id: "reject", label: "거절한다", delta: { colleagueTrust: -15 }, message: "동료의 업무 부탁을 거절했다." },
    ],
  },
  {
    id: "desk-chat",
    type: "colleague",
    title: "옆자리 수다",
    speaker: "동료",
    body: "옆자리 동료가 조용히 말을 걸었다. 잠깐 대화하면 머리는 식을 것 같다.",
    choices: [
      { id: "accept", label: "잠깐 대화한다", delta: { gameMinute: 5, stress: -5 }, message: "옆자리 동료와 잠깐 수다를 떨었다." },
      { id: "reject", label: "일에 집중한다", delta: { colleagueTrust: -10 }, message: "옆자리 동료의 수다를 거절했다." },
    ],
  },
  {
    id: "colleague-help",
    type: "colleague",
    title: "동료 도움",
    speaker: "동료",
    body: "동료가 네 업무를 조금 나눠서 봐줄 수 있다고 한다.",
    choices: [
      { id: "accept", label: "도움을 받는다", delta: { workload: -15, stress: -5 }, message: "동료의 도움을 받았다." },
      { id: "reject", label: "괜찮다고 한다", delta: {}, message: "동료의 도움을 정중히 거절했다." },
    ],
  },
  {
    id: "ginseng-gift",
    type: "colleague",
    title: "홍삼스틱 선물",
    speaker: "동료",
    body: "동료가 책상 위에 홍삼스틱 하나를 슬쩍 올려두었다.",
    choices: [
      { id: "accept", label: "받는다", item: "ginseng", delta: { colleagueTrust: 5 }, message: "동료에게 홍삼스틱을 받았다." },
      { id: "reject", label: "사양한다", delta: {}, message: "홍삼스틱 선물을 사양했다." },
    ],
  },
];

export const positiveMainEvents = [
  {
    id: "small-bonus",
    type: "positive",
    title: "소소한 인센티브",
    speaker: "사내 이벤트",
    body: "복지 이벤트 당첨 안내가 왔다. 작지만 바로 쓸 수 있는 물건을 받았다.",
    choices: [
      { id: "accept", label: "수령한다", randomItem: ["ginseng", "coffee"], delta: {}, message: "소소한 인센티브를 받았다." },
    ],
  },
];

export const phoneCallPool = [
  {
    type: "client",
    name: "거래처",
    number: null,
    bodyText: "거래처에서 전화가 왔습니다.",
    accept: { delta: { workload: -10, stress: 2, gameMinute: 5 }, log: "거래처 수정 요청을 통화로 정리했습니다." },
    reject: { delta: { workload: 5, stress: 8 }, log: "거래처 전화를 거절해 확인할 일이 남았습니다." },
    missed: { delta: { workload: 10, stress: 12 }, log: "거래처 전화를 놓쳐 수정 요청이 밀렸습니다." },
  },
  {
    type: "client",
    name: "거래처",
    number: null,
    bodyText: "납기 일정 관련 거래처 전화입니다.",
    accept: { delta: { workload: -8, stress: 1, gameMinute: 4 }, log: "거래처 납기 일정을 확인해 업무를 정리했습니다." },
    reject: { delta: { workload: 4, stress: 6 }, log: "거래처 전화를 거절해 납기 확인이 남았습니다." },
    missed: { delta: { workload: 8, stress: 10 }, log: "거래처 전화를 놓쳐 납기 확인 업무가 쌓였습니다." },
  },
  {
    type: "other-dept",
    name: "인사팀",
    number: null,
    bodyText: "인사팀에서 전화가 왔습니다.",
    accept: { delta: { workload: -5, stress: -3, gameMinute: 3 }, log: "인사팀 안내를 바로 확인해 잡무를 줄였습니다." },
    reject: { delta: { workload: 3, stress: 4 }, log: "인사팀 전화를 거절해 확인할 안내가 남았습니다." },
    missed: { delta: { workload: 5, stress: 6 }, log: "인사팀 전화를 놓쳐 안내 확인이 밀렸습니다." },
  },
  {
    type: "other-dept",
    name: "경영지원팀",
    number: null,
    bodyText: "경영지원팀에서 전화가 왔습니다.",
    accept: { delta: { workload: -6, gameMinute: 4 }, log: "경영지원팀 요청을 통화로 바로 처리했습니다." },
    reject: { delta: { workload: 3, stress: 4 }, log: "경영지원팀 전화를 거절해 요청 확인이 남았습니다." },
    missed: { delta: { workload: 5, stress: 5 }, log: "경영지원팀 전화를 놓쳐 요청이 밀렸습니다." },
  },
  {
    type: "unknown",
    name: "모르는 번호",
    number: "010-****-****",
    bodyText: "처음 보는 번호입니다.",
    accept: {
      outcomes: [
        { weight: 0.4, delta: { workload: -7, stress: 1, gameMinute: 4 }, log: "알고 보니 거래처였습니다. 통화로 요청을 정리했습니다." },
        { weight: 0.4, delta: { gameMinute: 2 }, log: "광고 전화였습니다." },
        { weight: 0.2, delta: { stress: 5, gameMinute: 2 }, log: "보이스피싱이었습니다. 괜히 받았나..." },
      ],
    },
    reject: { delta: { stress: 1 }, log: "모르는 번호를 거절했습니다." },
    missed: { delta: { stress: 2 }, log: "모르는 번호가 끊겼습니다." },
  },
  {
    type: "unknown",
    name: "모르는 번호",
    number: "02-****-****",
    bodyText: "지역번호로 전화가 왔습니다.",
    accept: {
      outcomes: [
        { weight: 0.4, delta: { workload: -7, stress: 1, gameMinute: 4 }, log: "알고 보니 거래처였습니다. 통화로 추가 확인을 끝냈습니다." },
        { weight: 0.4, delta: { gameMinute: 2 }, log: "광고 전화였습니다." },
        { weight: 0.2, delta: { stress: 5, gameMinute: 2 }, log: "수상한 전화였습니다. 계좌 정보를 물어보더군요." },
      ],
    },
    reject: { delta: { stress: 1 }, log: "모르는 번호를 거절했습니다." },
    missed: { delta: { stress: 2 }, log: "모르는 번호가 끊겼습니다." },
  },
];

export const lunchEvents = {
  base: [
    { title: "혼밥", text: "오늘도 혼자 점심. 조용해서 좋다.", delta: { stress: -5 } },
    { title: "동료 점심", text: "동료랑 같이 밥 먹었다. 수다 떨었더니 기분이 좀 풀렸다.", delta: { stress: -15, colleagueTrust: 10 } },
    { title: "상사 점심 합류", text: "상사가 같이 먹자고 했다. 밥이 목에 넘어가지 않는다.", delta: { stress: 10, health: -5 } },
    { title: "점심 메뉴 갈등", text: "먹고 싶은 거 못 먹고 남이 고른 메뉴를 먹었다.", delta: { stress: 5 } },
  ],
  interrupt: [
    { title: "점심 중 업무 카톡", text: "밥 먹는데 업무 카톡이 왔다.", delta: { stress: 5 }, chance: 0.45 },
  ],
};
