// ending.jsx — 엔딩 4종 (칼퇴 성공 / 야근 / 당일퇴사 / 과로사)

function EndingTemplate({ tag, accent, emoji, title, lines, illo, badge, badgeLabel, clock, clockLabel, stats, retry }) {
  return (
    <Frame accent={accent}>
      <div style={{ padding: "22px 40px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Tag>{tag}</Tag>
          <Legend />
        </div>
        <div style={{ display: "flex", gap: 30, flex: 1, marginTop: 6, minHeight: 0 }}>
          {/* 좌: 연출 일러스트(위 채움) + 제목·문구(아래) */}
          <div style={{ flex: 1.15, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <Ph label={illo} style={{ flex: 1, minHeight: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 54, lineHeight: 1 }}>{emoji}</span>
              <h1 className="wf-h1" style={{ fontSize: 46 }}>{title}</h1>
            </div>
            <SkBox bg="#fff" style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
              {lines.map((l, i) => (
                <span key={i} style={{ fontFamily: "var(--hand)", fontSize: 22 }}>{l}</span>
              ))}
            </SkBox>
          </div>

          {/* 우: 결과 요약 패널 (세로 가운데 정렬) */}
          <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
            <SkBox bg={accent} style={{ padding: "16px 20px", textAlign: "center", boxShadow: "4px 5px 0 var(--ink)" }}>
              <div className="wf-flabel">{clockLabel}</div>
              <div style={{ fontFamily: "var(--hand)", fontSize: 52, fontWeight: 700, lineHeight: 1.1 }}>{clock}</div>
              {badge && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="wf-grade">{badge}</span>
                  <span style={{ fontSize: 18 }}>{badgeLabel}</span>
                </div>
              )}
            </SkBox>

            <SkBox bg="#fff" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="wf-flabel">최종 스탯 요약</span>
              <StatBar label="업무량" value={stats.work} dir="↓굿" />
              <StatBar label="스트레스" value={stats.stress} dir="↓굿" color="var(--marker)" />
              <StatBar label="체력" value={stats.hp} dir="↑굿" color="var(--blue)" />
            </SkBox>

            <SkBtn primary style={{ alignSelf: "stretch" }}>🔄 다시하기</SkBtn>
            {retry && <Annot label="분기 조건" style={{ alignSelf: "stretch" }}>{retry}</Annot>}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function EndClearS() {
  return (
    <EndingTemplate
      tag="엔딩 ① · 🏆 칼퇴 성공 (S등급)"
      accent="#bfe3c0"
      emoji="🏆"
      title="칼퇴 성공!"
      illo="[일러스트] 환한 오후 · 가방 메고 빈 사무실을 나서는 뒷모습"
      lines={["오후 5시도 안 됐는데 업무가 끝났다.", "여유로운 발걸음으로 사무실을 나선다.", "완벽한 하루 — S등급, 오늘의 승자!"]}
      clockLabel="퇴근 시각"
      clock="16:50"
      badge="S"
      badgeLabel="17:00 이전"
      stats={{ work: 0, stress: 24, hp: 66 }}
      retry="S등급 — 17:00 이전 퇴근 (A ~17:30 · B ~18:00)"
    />
  );
}

function EndClearA() {
  return (
    <EndingTemplate
      tag="엔딩 ① · 🏆 칼퇴 성공 (A등급)"
      accent="#bfe3c0"
      emoji="🏆"
      title="칼퇴 성공!"
      illo="[일러스트] 해 질 무렵 · 동료들과 인사하고 나서는 모습"
      lines={["정시에 딱 맞춰 업무를 마무리했다.", "붐비기 전에 가뿐하게 퇴근.", "무난한 하루 — A등급, 잘 해냈다."]}
      clockLabel="퇴근 시각"
      clock="17:15"
      badge="A"
      badgeLabel="17:00 ~ 17:30"
      stats={{ work: 0, stress: 38, hp: 56 }}
      retry="A등급 — 17:00~17:30 퇴근 (S 17:00 이전 · B ~18:00)"
    />
  );
}

function EndClearB() {
  return (
    <EndingTemplate
      tag="엔딩 ① · 🏆 칼퇴 성공 (B등급)"
      accent="#bfe3c0"
      emoji="🏆"
      title="칼퇴… 성공?"
      illo="[일러스트] 6시 직전 · 시계 보며 서둘러 짐 챙기는 모습"
      lines={["6시가 코앞, 막판에 겨우 끝냈다.", "야근은 면했다. 휴, 살았다.", "아슬아슬 — B등급, 그래도 칼퇴는 칼퇴!"]}
      clockLabel="퇴근 시각"
      clock="17:50"
      badge="B"
      badgeLabel="17:30 ~ 18:00"
      stats={{ work: 0, stress: 52, hp: 44 }}
      retry="B등급 — 17:30~18:00 퇴근 (S 17:00 이전 · A ~17:30)"
    />
  );
}

function EndOvertime() {
  return (
    <EndingTemplate
      tag="엔딩 ② · 😩 야근 엔딩"
      accent="#cdd3da"
      emoji="😩"
      title="야근 확정…"
      illo="[일러스트] 텅 빈 사무실 · 혼자 켜진 모니터 불빛"
      lines={["18:00 — 아직 업무량이 남아있다.", "\"먼저 들어가세요…\" 야근이 시작된다.", "오늘도 칼퇴는 다음 생에."]}
      clockLabel="현재 시각"
      clock="18:00"
      badge="✗"
      badgeLabel="업무량 잔여 35"
      stats={{ work: 35, stress: 70, hp: 42 }}
      retry="18시에 업무량 > 0 → 야근 엔딩"
    />
  );
}

function EndQuit() {
  return (
    <EndingTemplate
      tag="엔딩 ③ · 😤 당일퇴사 엔딩"
      accent="#f3c7a6"
      emoji="😤"
      title="저… 퇴사하겠습니다"
      illo="[일러스트] 책상 위 사직서 · 박차고 일어나는 뒷모습"
      lines={["스트레스가 한계치에 도달했다.", "\"더는 못 하겠어요.\" 자리에서 일어선다.", "후련함과 막막함이 동시에 밀려온다."]}
      clockLabel="퇴사 선언 시각"
      clock="15:50"
      badge="!"
      badgeLabel="스트레스 100 도달"
      stats={{ work: 30, stress: 100, hp: 44 }}
      retry="스트레스 100 도달 → 당일퇴사"
    />
  );
}

function EndDeath() {
  return (
    <EndingTemplate
      tag="엔딩 ④ · 💀 과로사 엔딩"
      accent="#d8d2cb"
      emoji="💀"
      title="과로사…"
      illo="[일러스트] 책상에 엎드린 실루엣 · 흑백 연출"
      lines={["체력이 모두 바닥났다.", "눈앞이 캄캄해지며 의식이 흐려진다.", "당신의 헌신을 회사는 기억하지 못합니다."]}
      clockLabel="쓰러진 시각"
      clock="16:30"
      badge="💀"
      badgeLabel="체력 0 도달"
      stats={{ work: 22, stress: 88, hp: 0 }}
      retry="체력 0 도달 → 과로사 (게임오버 최우선)"
    />
  );
}

Object.assign(window, { EndClearS, EndClearA, EndClearB, EndOvertime, EndQuit, EndDeath });
