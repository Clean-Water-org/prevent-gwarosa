// setup.jsx — 설정 화면 (입사 서류 형식 / 커피파·담배파)
// 유형 선택 시 기획서 기반의 '플레이 가이드' 정보를 노출.

// 유형별 정보 — 기획서에 '명시된' 내용만 (해석/공통 규칙은 제외)
const TYPE_DATA = {
  coffee: {
    name: "커피파", emoji: "☕",
    rows: [
      { ic: "🎒", k: "기본 아이템", v: "커피 ☕ — 게임 시작 시 1개 지급" },
      { ic: "💧", k: "효과", v: "사용 시 체력 +15" },
      { ic: "⚠️", k: "패널티", v: "연속 2회 사용 시 ‘커피 과다복용’ → 미니게임 중 커서가 잘게 떨림" },
    ],
  },
  cigarette: {
    name: "담배파", emoji: "🚬",
    rows: [
      { ic: "🎒", k: "기본 아이템", v: "담배 🚬 — 게임 시작 시 1개 지급" },
      { ic: "💧", k: "효과", v: "사용 시 스트레스 -12 · 플레이 시간 소폭 단축" },
      { ic: "⚠️", k: "패널티", v: "체력 감소 · 30% 확률 ‘흡연 초과’ → 스트레스 +15 · 다음 업무지시 100%" },
    ],
  },
};

// 유형별 플레이 가이드 패널 (유형 고유 정보만)
function GuidePanel({ kind }) {
  const d = TYPE_DATA[kind];
  return (
    <SkBox bg="#fff" style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1.5px dashed #ccc", paddingBottom: 4 }}>
        <span style={{ fontSize: 21 }}>{d.emoji}</span>
        <span style={{ fontFamily: "var(--hand)", fontSize: 20, fontWeight: 700 }}>{d.name} 가이드</span>
        <Note style={{ marginLeft: "auto", fontSize: 15 }}>유형 선택 시 표시</Note>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {d.rows.map((r, i) => {
          const warn = r.ic === "⚠️";
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 15 }}>{r.ic}</span>
              <span className="wf-flabel" style={{ fontSize: 14.5, width: 74, flex: "0 0 auto", color: warn ? "var(--marker)" : "#555" }}>{r.k}</span>
              <span style={{ fontSize: 15.5, color: warn ? "var(--marker)" : "var(--ink)" }}>{r.v}</span>
            </div>
          );
        })}
      </div>
    </SkBox>
  );
}

// 입사 서류 카드 (성별/유형 파라미터)
function SetupCard({ label, gender, kind }) {
  const genderName = gender === "male" ? "남성" : "여성";
  return (
    <Frame accent="#ffe08a">
      <div style={{ padding: "10px 40px", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <Tag>{label}</Tag>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", minHeight: 0, marginTop: 6 }}>
          <SkBox bg="#fffdf6" style={{ width: 880, padding: "12px 30px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "5px 6px 0 rgba(0,0,0,.18)" }}>
            {/* 상단 헤더 (카드 전체 너비) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed var(--ink)", paddingBottom: 6 }}>
              <span style={{ fontFamily: "var(--hand)", fontSize: 24, fontWeight: 700, whiteSpace: "nowrap" }}>📋 신규 입사자 정보 카드</span>
              <span className="wf-sub" style={{ fontSize: 18, whiteSpace: "nowrap" }}>과로사 방지 (주)</span>
            </div>

            {/* 본문: 증명사진(좌) | 정보(우) — 오른쪽 열은 모두 같은 너비 */}
            <div style={{ display: "flex", gap: 24 }}>
              {/* 증명사진 — 성별 연동 */}
              <div style={{ width: 144, flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
                <Ph label={`${genderName} 증명사진`} h={138} />
                <Note style={{ fontSize: 15.5, color: "var(--blue)" }}>↑ 성별 선택에 따라<br/>남/여 증명사진 자동 변경</Note>
              </div>

              {/* 정보 열: 이름 · 성별 · 유형 · 유형 가이드 (모두 동일 너비) */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                <Field label="이름" placeholder="텍스트 직접 입력 (화면 표시용)" />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span className="wf-flabel">성별 — 선택 시 위 증명사진이 바뀝니다</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <SkBtn primary={gender === "male"} small style={{ flex: 1 }}>👨 남성</SkBtn>
                    <SkBtn primary={gender === "female"} small style={{ flex: 1 }}>👩 여성</SkBtn>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span className="wf-flabel">유형 — 기본 아이템 슬롯이 달라집니다</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <TypeChip emoji="☕" name="커피파" hint="체력형" sel={kind === "coffee"} />
                    <TypeChip emoji="🚬" name="담배파" hint="멘탈형" sel={kind === "cigarette"} />
                  </div>
                </div>
                <GuidePanel kind={kind} />
              </div>
            </div>

            {/* 하단: 아이템 안내 (카드 전체 너비) — 핵심만 */}
            <SkBox dash bg="#fbf9f2" style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "var(--hand)", fontSize: 17, fontWeight: 700 }}>🎒 아이템 안내 <span style={{ fontSize: 14, color: "#999", fontWeight: 400 }}>(슬롯 3칸 · 메인화면에서만 사용)</span></span>
              <span style={{ fontSize: 15, paddingLeft: 6 }}><b style={{ color: "#777" }}>시작 2칸</b> · {kind === "coffee" ? "커피 ☕" : "담배 🚬"} + 유튜브 쇼츠 📱</span>
              <span style={{ fontSize: 15, paddingLeft: 6 }}><b style={{ color: "#777" }}>보상 1칸</b> · 동료 이벤트로 획득 (예: 홍삼스틱 🧴)</span>
              <Note style={{ fontSize: 14.5, color: "#999" }}>※ 효과는 메인화면에서 슬롯에 마우스를 올리면 안내 (호버 토글)</Note>
            </SkBox>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <SkBtn primary>서명하고 출근 →</SkBtn>
            </div>
          </SkBox>
        </div>
      </div>
    </Frame>
  );
}

function TypeCard({ emoji, name, hint, sel, compact }) {
  return (
    <SkBox bg={sel ? "var(--accent)" : "#fff"} bw={sel ? 3.5 : 2.5}
      style={{ padding: compact ? "10px 12px" : "18px 14px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 3 : 6, position: "relative", boxShadow: sel ? "3px 4px 0 var(--ink)" : "none" }}>
      {sel && <span style={{ position: "absolute", top: -14, right: -10, fontSize: 30 }}>✔︎</span>}
      <span style={{ fontSize: compact ? 32 : 46, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontFamily: "var(--hand)", fontSize: compact ? 22 : 26, fontWeight: 700, whiteSpace: "nowrap" }}>{name}</span>
      <span style={{ fontSize: compact ? 14 : 16, color: "#666", textAlign: "center" }}>{hint}</span>
    </SkBox>
  );
}

// 가로형 유형 선택 칩 (공간 절약)
function TypeChip({ emoji, name, hint, sel }) {
  return (
    <SkBox bg={sel ? "var(--accent)" : "#fff"} bw={sel ? 3.5 : 2.5}
      style={{ flex: 1, padding: "7px 14px", display: "flex", alignItems: "center", gap: 9, boxShadow: sel ? "3px 4px 0 var(--ink)" : "none" }}>
      <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontFamily: "var(--hand)", fontSize: 21, fontWeight: 700, whiteSpace: "nowrap" }}>{name}</span>
      <span style={{ fontSize: 14, color: "#666", whiteSpace: "nowrap" }}>{hint}</span>
      {sel && <span style={{ marginLeft: "auto", fontSize: 20 }}>✔︎</span>}
    </SkBox>
  );
}

// 공통 규칙 칩 (라벨·값 한눈에)
function Pill({ k, v }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, border: "2px solid var(--ink)", borderRadius: "12px 6px 12px 6px", padding: "1px 11px 3px", background: "#fff", whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: "var(--hand)", fontSize: 15, fontWeight: 700, color: "var(--marker)" }}>{k}</span>
      <span style={{ fontSize: 15.5 }}>{v}</span>
    </span>
  );
}

function SetupCoffee() {
  return <SetupCard label="설정 화면 · 커피파 선택 예시 (남성)" gender="male" kind="coffee" />;
}
function SetupCig() {
  return <SetupCard label="설정 화면 · 담배파 선택 예시 (여성)" gender="female" kind="cigarette" />;
}

Object.assign(window, { SetupCoffee, SetupCig });
