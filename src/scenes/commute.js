import { el, renderBadges, renderHud } from "../ui.js";

export function renderCommute(root, state, actions) {
  root.append(
    el("section", { class: "game-board" }, [
      renderHud(state),
      el("div", { class: "document" }, [
        el("h1", { text: "09:00 출근" }),
        el("p", { text: `${state.player.name}님, 오늘 팀장님은 "${state.boss.publicHint}"이라는 이야기가 있습니다. 업무량 100에서 시작합니다.` }),
        renderBadges(state),
        el("div", { class: "actions" }, [el("button", { class: "primary", text: "업무 시작", onClick: () => actions.go("main") })]),
      ]),
      el("footer", { class: "item-row" }, [el("span", { text: "아이템은 메인화면에서 사용할 수 있습니다." })]),
    ]),
  );
}
