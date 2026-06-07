export const minigames = [
  {
    id: "email",
    title: "이메일 분류",
    description: "중요 메일과 스팸 메일을 빠르게 좌우로 분류합니다.",
    target: 8,
    howTo: [
      "떨어지는 메일을 ← / A(중요) 또는 → / D(스팸)로 분류하세요.",
      "SPACE로 내용을 자세히 볼 수 있습니다. (시간 -2초)",
      "10통 중 8통 이상 맞추면 성공입니다.",
    ],
  },
  {
    id: "meeting",
    title: "회의 준비",
    description: "섞인 슬라이드를 올바른 흐름으로 정렬합니다.",
    target: 5,
    howTo: [
      "슬라이드를 드래그해 발표 순서대로 위 칸에 배치하세요.",
      "다른 팀 자료(함정)는 🗑️ 휴지통으로 버리세요.",
      "이미 채워진 칸에 놓으면 두 슬라이드 자리가 바뀝니다.",
    ],
  },
  {
    id: "report",
    title: "보고서 오탈자 찾기",
    description: "보고서에서 오탈자와 잘못된 숫자를 찾아냅니다.",
    target: 3,
    howTo: [
      "보고서에서 의심되는 단어를 클릭하세요.",
      "오탈자·잘못된 숫자가 정답, 정상 표기(함정)는 오답입니다.",
      "함정을 누르면 3초가 차감됩니다. 오탈자를 모두 찾으면 성공!",
    ],
  },
];

export const emailDeck = [
  { from: "총무팀", domain: "company.com", subject: "사내 공지 확인 요청", body: "오늘 오후 공용 프린터 점검으로 3층 프린터 사용이 제한됩니다.", attachment: "공지사항.pdf", link: "intranet.company.com/notice", recipient: "전 직원", time: "09:03", difficulty: "easy", type: "good" },
  { from: "인사팀", domain: "company.com", subject: "연차 사용 촉진 안내", body: "잔여 연차 확인 후 이번 주 금요일까지 사용 계획을 등록해주세요.", attachment: "연차사용계획서.xlsx", link: "intranet.company.com/hr/vacation", recipient: "전 직원", time: "09:18", difficulty: "easy", type: "good" },
  { from: "보안교육", domain: "company.com", subject: "보안교육 이수 안내", body: "상반기 보안교육 미이수자는 금주 내 수강 완료 부탁드립니다.", attachment: "없음", link: "edu.company.com/security", recipient: "미이수자", time: "10:02", difficulty: "easy", type: "good" },
  { from: "회의실 예약 시스템", domain: "company.com", subject: "회의실 예약 확정", body: "오늘 15:00 A회의실 예약이 확정되었습니다.", attachment: "없음", link: "intranet.company.com/meeting-room", recipient: "예약자", time: "10:15", difficulty: "easy", type: "good" },
  { from: "재무팀", domain: "company.com", subject: "법인카드 정산 누락 안내", body: "지난주 사용분 중 영수증 미제출 건이 있어 확인 부탁드립니다.", attachment: "정산대상자.xlsx", link: "intranet.company.com/expense", recipient: "정산 대상자", time: "10:28", difficulty: "normal", type: "good" },
  { from: "IT운영팀", domain: "company.com", subject: "VPN 인증 방식 변경 안내", body: "다음 주부터 VPN 접속 시 OTP 인증이 추가됩니다.", attachment: "VPN_인증가이드.pdf", link: "intranet.company.com/it/vpn", recipient: "VPN 사용자", time: "13:17", difficulty: "normal", type: "good" },
  { from: "협력사 박대리", domain: "partner-office.kr", subject: "Re: 견적서 수정본 재송부드립니다", body: "지난 회의에서 요청하신 단가표 수정본 첨부드립니다.", attachment: "견적서_수정본.xlsx", link: "drive.partner-office.kr/quotes/rev2", recipient: "구매 담당자", time: "11:06", difficulty: "normal", type: "good" },
  { from: "김부장", domain: "company.com", subject: "급한 건입니다", body: "회의 중이라 전화가 어렵습니다. 공유 문서 자료 먼저 검토 부탁드립니다.", attachment: "없음", link: "docs.google.com/presentation/d/weekly-review", recipient: "기획팀", time: "11:42", difficulty: "hard", type: "good" },
  { from: "CFO", domain: "company.com", subject: "송금 건 확인", body: "오늘 결제 예정인 정식 발주 건입니다. ERP 결재번호 확인 후 진행해주세요.", attachment: "발주서_승인본.pdf", link: "erp.company.com/payment/approved", recipient: "재무팀", time: "16:10", difficulty: "evil", type: "good" },
  // 💰 돈 준다 시리즈
  { from: "정부24", domain: "gov-support-pay.net", subject: "[긴급] 정부 지원금 85만원 지급 대상자 선정", body: "2026년 근로자 지원금 지급 대상자로 선정되었습니다. 지급 마감: 오늘 18:00. 본인 확인 후 계좌 등록 바랍니다.", attachment: "없음", link: "gov-support-pay.net/claim", recipient: "개별 발송", time: "08:42", difficulty: "easy", type: "spam" },
  { from: "근로복지공단", domain: "worker-fund-2026.net", subject: "2026 상반기 근로자 생활안정자금 지급 안내", body: "상반기 생활안정자금 신청 대상자입니다. 미신청 시 자동 소멸됩니다. 아래 링크에서 신청하세요.", attachment: "없음", link: "worker-fund-2026.net/apply", recipient: "개별 발송", time: "07:15", difficulty: "easy", type: "spam" },
  { from: "금융감독원", domain: "office-worker-loan.biz", subject: "직장인 특별 대출 승인 완료 — 한도 8,000만원", body: "직장인 특별 대출 심사가 완료되었습니다. 한도: 8,000만원. 지금 바로 입금 신청하세요.", attachment: "없음", link: "office-worker-loan.biz/withdraw", recipient: "개별 발송", time: "06:30", difficulty: "easy", type: "spam" },
  // 🎁 당첨 시리즈
  { from: "스타벅스 이벤트", domain: "starbucks-gift-win.com", subject: "축하드립니다! 스타벅스 1년 이용권 당첨", body: "고객님께서 스타벅스 1년 이용권에 당첨되셨습니다. 24시간 내 수령 신청하지 않으면 당첨이 취소됩니다.", attachment: "없음", link: "starbucks-gift-win.com/prize", recipient: "개별 발송", time: "09:03", difficulty: "easy", type: "spam" },
  { from: "애플코리아 이벤트", domain: "iphone-giveaway.net", subject: "아이폰 18 프로 맥스 지급 대상자 선정", body: "아이폰 18 프로 맥스 증정 이벤트 당첨자로 선정되었습니다. 배송비 결제 후 발송됩니다.", attachment: "없음", link: "iphone-giveaway.net/redeem", recipient: "개별 발송", time: "10:22", difficulty: "easy", type: "spam" },
  { from: "직장인협회", domain: "worker-thanks-event.com", subject: "대한민국 직장인 감사 이벤트 — 에어팟 프로 증정", body: "직장인 감사 이벤트 당첨! 에어팟 프로 증정. 본인 확인 후 수령지를 입력해주세요.", attachment: "없음", link: "worker-thanks-event.com/gift", recipient: "개별 발송", time: "11:48", difficulty: "easy", type: "spam" },
  // 💸 투자 시리즈
  { from: "삼미전자 IR", domain: "sammi-private-invest.com", subject: "삼미전자 비공개 투자자 모집", body: "삼미전자 비상장 지분 투자 기회입니다. 직장인 한정 선착순 50명. 최소 투자금 100만원.", attachment: "투자안내서.pdf", link: "sammi-private-invest.com/join", recipient: "개별 발송", time: "13:05", difficulty: "easy", type: "spam" },
  { from: "AI트레이딩", domain: "ai-auto-trade-free.com", subject: "AI 자동매매 프로그램 무료 체험", body: "직장인도 쉽게! AI 자동매매 프로그램 7일 무료 체험. 월 300만원 수익 사례 다수.", attachment: "없음", link: "ai-auto-trade-free.com/trial", recipient: "개별 발송", time: "14:30", difficulty: "easy", type: "spam" },
  { from: "부수입연구소", domain: "side-income-300.net", subject: "월 300만원 부수입 프로젝트 — 직장인 대상", body: "퇴근 후 1시간, 월 300만원 부수입 가능. 선착순 30명 모집 중. 무료 상담 신청.", attachment: "없음", link: "side-income-300.net/register", recipient: "개별 발송", time: "15:17", difficulty: "easy", type: "spam" },
  { from: "IT지원팀", domain: "company-helpdesk.com", subject: "VPN 인증 방식 변경 안내", body: "새 인증 모듈 설치가 필요합니다. 첨부 파일 실행 후 로그인하세요.", attachment: "VPN_Update.exe", link: "없음", recipient: "개별 발송", time: "03:35", difficulty: "normal", type: "spam" },
  { from: "연말정산 담당자", domain: "tax-company.net", subject: "연말정산 증빙자료 보완 요청", body: "환급 처리를 위해 주민등록번호와 계좌 정보를 입력하세요.", attachment: "없음", link: "tax-company.net/refund", recipient: "개별 발송", time: "23:40", difficulty: "normal", type: "spam" },
  { from: "재무팀", domain: "company-payments.com", subject: "법인카드 정산 누락 안내", body: "정산 누락자 명단입니다. 파일 열람 시 콘텐츠 사용을 눌러주세요.", attachment: "정산대상자.xlsm", link: "없음", recipient: "개별 발송", time: "06:35", difficulty: "hard", type: "spam" },
  { from: "IT지원팀", domain: "cornpany-helpdesk.com", subject: "사내 계정 용량 초과 안내", body: "수신 중단을 막으려면 사내 계정으로 다시 로그인하세요.", attachment: "없음", link: "cornpany-helpdesk.com/storage", recipient: "개별 발송", time: "02:44", difficulty: "hard", type: "spam" },
  { from: "IT운영팀", domain: "cornpany.com", subject: "VPN 인증 방식 변경 안내", body: "다음 주부터 VPN 접속 시 OTP 인증이 추가됩니다. 사전 등록을 위해 첨부 모듈을 실행해주세요.", attachment: "OTP_Setup.exe", link: "없음", recipient: "VPN 사용자", time: "13:17", difficulty: "hard", type: "spam" },
  { from: "김부장", domain: "cornpany.com", subject: "급한 건입니다", body: "회의 중이라 전화가 어렵습니다. 송금 먼저 부탁드립니다.", attachment: "송금정보.zip", link: "없음", recipient: "개발팀", time: "11:42", difficulty: "evil", type: "spam" },
  { from: "CFO", domain: "company-finance.co", subject: "송금 건 확인", body: "오늘 중 처리해야 합니다. ERP 대신 첨부 파일 기준으로 진행해주세요.", attachment: "긴급송금요청.zip", link: "없음", recipient: "재무팀", time: "16:10", difficulty: "evil", type: "spam" },
];
