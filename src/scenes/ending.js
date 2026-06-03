import { createInitialState } from "../state.js";
import { el, renderHud, renderLog } from "../ui.js";

const endings = {
  success: ["칼퇴 성공", "업무량을 0으로 만들었습니다. 오늘은 정시에 집에 갑니다."],
  overtime: ["야근 엔딩", "18시가 되었지만 업무가 남았습니다. 불이 꺼지지 않는 사무실에 남습니다."],
  quit: ["당일퇴사", "스트레스가 한계에 도달했습니다. 사직서는 마음속에서 이미 제출됐습니다."],
  overwork: ["과로사", "체력이 0이 되었습니다. 오늘 하루는 몸이 먼저 종료됐습니다."],
};

export function renderEnding(root, state, actions) {
  const [title, body] = endings[state.ending] ?? endings.overtime;
  root.append(
    el("section", { class: "screen" }, [
      renderHud(state),
      el("article", { class: "ending" }, [
        el("h1", { text: title }),
        el("p", { text: body }),
        el("p", { text: `오늘의 팀장님 정체: ${state.boss.name} - ${state.boss.trait}` }),
        renderLog(state),
        el("div", { class: "actions" }, [
          el("button", { class: "primary", text: "다시 하기", onClick: () => actions.mutateState(() => createInitialState()) }),
        ]),
      ]),
    ]),
  );
}
