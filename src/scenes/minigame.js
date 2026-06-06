import { emailDeck, minigames } from "../data/minigames.js";
import { applyDelta, checkEnding } from "../state.js";
import { el, renderBadges, renderHud } from "../ui.js";

export function renderMiniGame(root, state, actions) {
  if (state.minigameRound >= 5 && !state.flags.devMode) {
    actions.finishWith(state.stats.workload <= 0 ? "success" : "overtime");
    return;
  }

  const game = state.flags.devMode ? minigames[0] : minigames[state.minigameRound % minigames.length];
  if (game.id === "email") renderEmailGame(root, state, actions, game);
  else renderPlaceholderMiniGame(root, state, actions, game);
}

export function renderEmailGame(root, state, actions, game) {
  const deck = buildEmailDeck(state);
  const run = {
    index: 0,
    correct: 0,
    wrong: 0,
    missed: 0,
    left: 60,
    detailOpen: false,
    done: false,
  };

  const shell = el("section", { class: "email-mini-shell" }, [
    renderHud(state),
    el("section", { class: statusClass(state), id: "emailWorkspace" }, [
      el("div", { class: "email-titlebar" }, [
        el("div", { class: "lights" }, [
          el("span", { class: "light red-light" }),
          el("span", { class: "light yellow-light" }),
          el("span", { class: "light green-light" }),
          el("strong", { text: "📧 이메일 분류 시스템 - 받은편지함" }),
        ]),
        el("span", { text: "- □ ×" }),
      ]),
      el("div", { class: "email-workspace" }, [
        el("div", { class: "email-hud" }, [
          el("div", { class: "email-pill email-timer", id: "emailTimer", text: "⏱ 60.0 / 60s" }),
          el("div", { class: "email-pill", id: "emailScore", text: `처리 0 / ${deck.length}` }),
        ]),
        renderBadges(state),
        el("aside", { class: "email-rule-stack" }, [
          el("div", { class: "email-rule red", text: "도메인 · 실행 파일 · 인증 요청 확인" }),
          el("div", { class: "email-rule yellow", text: "A: 정상 / D: 스팸 / Space: 상세" }),
        ]),
        renderDropZone("good", "정상 메일", "사내 업무 · 공지 · 요청"),
        renderDropZone("spam", "스팸", "피싱 · 사칭 · 위험 첨부"),
        el("div", { class: "email-stream" }, [
          el("div", { class: "ghost-mail" }),
          el("div", { class: "ghost-mail" }),
          el("article", { class: "email-card", id: "emailCard" }),
        ]),
        el("div", { class: "email-controls" }, [
          el("button", { id: "goodButton", class: "email-key good", text: "A 정상" }),
          el("button", { id: "detailButton", class: "email-key", text: "Space 상세" }),
          el("button", { id: "spamButton", class: "email-key spam", text: "D 스팸" }),
        ]),
        el("div", { class: "email-feedback", id: "emailFeedback" }),
        el("div", { class: "email-result", id: "emailResult", hidden: "true" }),
        el("div", { class: "px-scanline" }),
        el("div", { class: "px-glare" }),
      ]),
    ]),
  ]);

  root.append(shell);

  const workspace = shell.querySelector("#emailWorkspace");
  const card = shell.querySelector("#emailCard");
  const timer = shell.querySelector("#emailTimer");
  const score = shell.querySelector("#emailScore");
  const feedback = shell.querySelector("#emailFeedback");
  const resultPanel = shell.querySelector("#emailResult");

  const interval = setInterval(() => {
    if (run.done) return;
    run.left = Math.max(0, run.left - 0.1);
    timer.textContent = `⏱ ${run.left.toFixed(1)} / 60s`;
    timer.classList.toggle("danger", run.left <= 10);
    if (run.left <= 0) finish();
  }, 100);

  function showMail() {
    const mail = deck[run.index];
    if (!mail) return finish();
    card.className = `email-card ${run.detailOpen ? "detail" : ""}`;
    card.innerHTML = "";
    card.append(
      el("div", { class: "mail-top" }, [
        el("span", { text: mail.from }),
        el("span", { class: "domain", text: mail.domain }),
      ]),
      el("h2", { class: "mail-title", text: renderStatusText(mail.subject, state) }),
      el("p", { class: "mail-body", text: renderStatusText(mail.body, state) }),
      renderClues(mail),
      el("div", { class: "detail-grid" }, [
        detail("첨부", mail.attachment),
        detail("링크", mail.link),
        detail("수신", mail.recipient),
        detail("시간", mail.time),
      ]),
    );
  }

  function classify(target) {
    if (run.done) return;
    const mail = deck[run.index];
    const ok = mail.type === target;
    ok ? run.correct++ : run.wrong++;
    feedback.textContent = ok ? "정확!" : "오분류!";
    feedback.style.color = ok ? "var(--ok)" : "var(--danger)";
    feedback.classList.add("show");
    card.classList.add(target === "good" ? "throw-left" : "throw-right");
    setTimeout(() => {
      feedback.classList.remove("show");
      run.index++;
      run.detailOpen = false;
      score.textContent = `처리 ${Math.min(run.index, deck.length)} / ${deck.length}`;
      if (run.index >= deck.length) finish();
      else showMail();
    }, 220);
  }

  function toggleDetail() {
    run.detailOpen = !run.detailOpen;
    showMail();
  }

  function finish() {
    if (run.done) return;
    run.done = true;
    clearInterval(interval);
    window.removeEventListener("keydown", onKey);
    const processed = run.correct + run.wrong;
    const result = run.correct >= 8 ? "success" : run.correct >= 5 ? "partial" : "fail";
    resultPanel.hidden = false;
    resultPanel.append(
      el("h2", { text: result === "success" ? "분류 완료" : "분류 미흡" }),
      el("p", { text: `정확 ${run.correct} · 오분류 ${run.wrong} · 처리 ${processed}/${deck.length}` }),
      el("div", { class: "actions" }, [
        el("button", { class: "primary", text: "결과 반영", onClick: () => applyResult(result) }),
        el("button", { text: "다시 실행", onClick: () => actions.go("minigame") }),
        state.flags.devMode ? el("button", { text: "시작화면", onClick: () => actions.mutateState((draft) => ({ ...draft, scene: "title", flags: { ...draft.flags, devMode: false } })) }) : el("span"),
      ]),
    );
  }

  function applyResult(result) {
    actions.mutateState((draft) => applyMiniResult(draft, result, `${game.title}: 정확 ${run.correct}/${deck.length}`));
  }

  function onKey(event) {
    const key = event.key.toLowerCase();
    if (key === "a" || key === "arrowleft") classify("good");
    if (key === "d" || key === "arrowright") classify("spam");
    if (key === " " || key === "spacebar") {
      event.preventDefault();
      toggleDetail();
    }
  }

  shell.querySelector("#goodZone").addEventListener("click", () => classify("good"));
  shell.querySelector("#spamZone").addEventListener("click", () => classify("spam"));
  shell.querySelector("#goodButton").addEventListener("click", () => classify("good"));
  shell.querySelector("#spamButton").addEventListener("click", () => classify("spam"));
  shell.querySelector("#detailButton").addEventListener("click", toggleDetail);
  card.addEventListener("click", toggleDetail);
  window.addEventListener("keydown", onKey);
  showMail();
}

function renderDropZone(type, title, hint) {
  return el("button", { class: `email-dropzone ${type}`, id: `${type}Zone` }, [
    el("strong", { text: title }),
    el("span", { text: hint }),
  ]);
}

function renderClues(mail) {
  const clues = [];
  if (mail.attachment && mail.attachment !== "없음") {
    const ext = mail.attachment.split(".").pop().toLowerCase();
    clues.push({ text: `첨부 ${ext}`, tone: ["zip", "exe", "xlsm"].includes(ext) ? "danger" : "" });
  }
  if (mail.link && mail.link !== "없음") {
    const host = mail.link.split("/")[0];
    const trustedHost = ["company.com", "intranet.company.com", "edu.company.com", "mail.company.com", "erp.company.com", "docs.google.com", "drive.partner-office.kr"].some((domain) => host === domain || host.endsWith(`.${domain}`));
    const looksLikeCompany = /(^|[-.])(company|cornpany)([-.]|$)/i.test(host);
    clues.push({ text: trustedHost ? "업무 링크" : "링크 포함", tone: "" });
    if (looksLikeCompany && !trustedHost) clues.push({ text: "링크 경로", tone: "" });
  }
  if (/인증|로그인|주민등록번호|계좌|주소와 연락처|실행/.test(mail.body)) clues.push({ text: "민감 요청", tone: "danger" });
  if (/^0[0-6]:/.test(mail.time)) clues.push({ text: "새벽 발신", tone: "warn" });
  return el("div", { class: "mail-clues" }, clues.slice(0, 3).map((clue) => el("span", { class: clue.tone ? `${clue.tone}-word` : "", text: clue.text })));
}

function detail(label, value) {
  return el("p", {}, [el("strong", { text: label }), el("span", { text: value })]);
}

function renderStatusText(text, state) {
  if (state.stats.stress >= 70) return corruptText(text, 0.14);
  return text;
}

function corruptText(text, ratio) {
  const noise = ["□", "▒", "?", "_", "…"];
  return Array.from(text).map((ch, index) => {
    if (ch === " " || /[.,:[\]()]/.test(ch)) return ch;
    return (index * 17) % 100 < ratio * 100 ? noise[index % noise.length] : ch;
  }).join("");
}

function buildEmailDeck(state) {
  const stress = state.stats.stress;
  const pool = stress >= 80 ? emailDeck : stress >= 50 ? emailDeck.filter((mail) => mail.difficulty !== "evil") : emailDeck.filter((mail) => ["easy", "normal"].includes(mail.difficulty));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
}

function statusClass(state) {
  const classes = ["email-monitor"];
  if (state.stats.stress >= 70) classes.push("fx-gray");
  if (state.stats.health <= 30) classes.push("fx-shake");
  if (state.counters.coffeeStreak >= 2) classes.push("fx-jitter");
  return classes.join(" ");
}

function renderPlaceholderMiniGame(root, state, actions, game) {
  root.append(
    el("section", { class: "game-board" }, [
      renderHud(state),
      el("div", { class: "desk" }, [
        el("div", { class: "mini-layout" }, [
          el("div", { class: "mini-header" }, [
            el("h2", { text: `${state.minigameRound + 1}/5 ${game.title}` }),
            el("strong", { text: "프로토타입 판정" }),
          ]),
          renderBadges(state),
          el("article", { class: "mini-card" }, [
            el("p", { text: game.description }),
            el("p", { text: "현재는 결과 버튼으로 전체 흐름을 검증합니다." }),
          ]),
        ]),
      ]),
      el("footer", { class: "item-row" }, [
        el("button", { class: "primary", text: "성공", onClick: () => actions.mutateState((draft) => applyMiniResult(draft, "success", `${game.title} 성공`)) }),
        el("button", { text: "부분성공", onClick: () => actions.mutateState((draft) => applyMiniResult(draft, "partial", `${game.title} 부분성공`)) }),
        el("button", { class: "danger", text: "실패", onClick: () => actions.mutateState((draft) => applyMiniResult(draft, "fail", `${game.title} 실패`)) }),
      ]),
    ]),
  );
}

function applyMiniResult(state, result, message) {
  const deltas = {
    success: { workload: -20, gameMinute: 60 },
    partial: { workload: -10, stress: 8, gameMinute: 60 },
    fail: { workload: -3, stress: 18, health: -8, gameMinute: 60 },
  };
  let next = applyDelta(state, deltas[result], message);
  if (next.flags.devMode) {
    next.scene = "title";
    next.flags.devMode = false;
    return next;
  }
  next.minigameRound += 1;
  next.counters.successStreak = result === "success" ? next.counters.successStreak + 1 : 0;
  next.counters.failures += result === "fail" ? 1 : 0;
  const ending = checkEnding(next);
  if (ending) {
    next.ending = ending;
    next.scene = "ending";
  } else if (next.minigameRound === 2) {
    next.scene = "lunch";
    next.gameMinute = Math.max(next.gameMinute, 12 * 60);
  } else {
    next.scene = "main";
  }
  return next;
}
