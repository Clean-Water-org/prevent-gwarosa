import { chats, mainEvents } from "../data/events.js";
import { items } from "../data/items.js";
import { applyDelta, checkEnding } from "../state.js";
import { el, renderBadges, renderHud, renderItems, renderLog } from "../ui.js";

export function renderMainWork(root, state, actions) {
  const activeChats = pickChats(state.minigameRound >= 2 ? 3 : 2);
  const phone = Math.random() < 0.55 ? pickPhone() : null;

  function resolve(next) {
    const ending = checkEnding(next);
    if (ending) actions.finishWith(ending);
    else actions.mutateState(() => next);
  }

  function useItem(index) {
    actions.mutateState((draft) => {
      const [itemId] = draft.inventory.splice(index, 1);
      return items[itemId].use(draft);
    });
  }

  const board = el("section", { class: "game-board" }, [
    renderHud(state),
    el("div", { class: "work-area" }, [
      el("section", { class: "desk" }, [
        el("h2", { text: "메인 업무 화면" }),
        renderBadges(state),
        el("div", { class: "chat-stack" }, activeChats.map((chat) => renderChat(chat, state, resolve))),
      ]),
      el("aside", { class: "side-panel" }, [
        el("h2", { text: "책상" }),
        phone ? renderPhone(phone, resolve, state) : el("div", { class: "phone-card", text: "전화기는 조용합니다." }),
        renderLog(state),
        el("button", { class: "primary", text: nextLabel(state), onClick: () => advancePhase(state, actions) }),
        el("button", { text: "미니게임 2 시작 (회의 준비)", onClick: () => actions.mutateState((draft) => {
          draft.minigameRound = 1;
          draft.scene = "minigame";
          return draft;
        }) }),
        el("button", { text: "미니게임 3 시작 (오탈자)", onClick: () => actions.mutateState((draft) => {
          draft.minigameRound = 2;
          draft.scene = "minigame";
          return draft;
        }) }),
        el("button", { text: "이벤트 테스트", onClick: () => openEvent(root, state, actions) }),
      ]),
    ]),
    renderItems(state, { useItem }),
  ]);
  root.append(board);
}

function renderChat(chat, state, resolve) {
  const urgent = chat.seconds <= (state.stats.stress >= 70 ? 5 : 7);
  return el("article", { class: `chat-card ${urgent ? "urgent" : ""}` }, [
    el("div", { class: "chat-meta" }, [el("strong", { text: chat.from }), el("span", { text: `${chat.seconds}초` })]),
    el("p", { text: chat.text }),
    el("div", { class: "actions" }, [
      el("button", { class: "primary", text: "답장", onClick: () => resolve(applyDelta(state, chat.reply, `${chat.from} 메시지를 처리했습니다.`)) }),
      el("button", { text: "미루기", onClick: () => resolve(applyDelta(state, chat.miss, `${chat.from} 메시지를 놓쳤습니다.`)) }),
    ]),
  ]);
}

function renderPhone(phone, resolve, state) {
  return el("article", { class: "phone-card" }, [
    el("strong", { text: `전화 수신: ${phone.from}` }),
    el("p", { text: phone.text }),
    el("div", { class: "actions" }, [
      el("button", { class: "primary", text: "받기", onClick: () => resolve(applyDelta(state, phone.answer, "전화를 받았습니다.")) }),
      el("button", { text: "무시", onClick: () => resolve(applyDelta(state, phone.ignore, "전화를 넘겼습니다.")) }),
    ]),
  ]);
}

function advancePhase(state, actions) {
  actions.mutateState((draft) => {
    draft.gameMinute += 35;
    if (draft.minigameRound === 2 && draft.gameMinute < 12 * 60) {
      draft.gameMinute = 12 * 60;
      draft.scene = "lunch";
    } else {
      draft.scene = "minigame";
    }
    return draft;
  });
}

function openEvent(root, state, actions) {
  const event = mainEvents[Math.floor(Math.random() * mainEvents.length)];
  const overlay = el("div", { class: "event-overlay" }, [
    el("article", { class: "event-card" }, [
      el("h2", { text: event.title }),
      el("p", { text: event.body }),
      el("div", { class: "actions" }, event.choices.map((choice) => el("button", {
        class: "primary",
        text: choice.label,
        onClick: () => {
          actions.mutateState((draft) => {
            if (choice.delta) draft = applyDelta(draft, choice.delta, choice.message);
            if (choice.item && draft.inventory.length < 3) draft.inventory.push(choice.item);
            if (choice.message && !choice.delta) draft.log.unshift(choice.message);
            return draft;
          });
        },
      }))),
    ]),
  ]);
  root.append(overlay);
}

function pickChats(count) {
  return [...chats].sort(() => Math.random() - 0.5).slice(0, count);
}

function pickPhone() {
  const phones = [
    { from: "팀장", text: "새 업무 지시", answer: { workload: 10, stress: -5 }, ignore: { stress: 15 } },
    { from: "동료", text: "도움 요청", answer: { workload: 10, colleagueTrust: 10 }, ignore: { colleagueTrust: -10 } },
    { from: "모르는 번호", text: "알 수 없는 전화", answer: { stress: 10 }, ignore: {} },
  ];
  return phones[Math.floor(Math.random() * phones.length)];
}

function nextLabel(state) {
  return state.minigameRound >= 5 ? "결과 판정" : `미니게임 ${state.minigameRound + 1} 시작`;
}
