import { el } from "../ui.js";

export function renderOnboarding(root, state, actions) {
  root.append(
    el("section", { class: "screen" }, [
      el("article", { class: "document" }, [
        el("h1", { text: "신입사원 온보딩 안내서" }),
        el("p", { text: "오늘 하루는 업무량, 스트레스, 체력을 동시에 관리합니다. 업무량은 낮을수록, 스트레스는 낮을수록, 체력은 높을수록 좋습니다." }),
        el("div", { class: "manual-grid" }, [
          note("업무 처리", "메인화면에서는 채팅과 전화가 동시에 쌓입니다. 급한 것부터 답장해야 합니다."),
          note("집중 업무", "미니게임은 총 5회입니다. 성공하면 업무량이 크게 줄고, 실패하면 스트레스와 체력이 흔들립니다."),
          note("복지 혜택", "아이템은 메인화면에서만 사용합니다. 슬롯은 최대 3칸입니다."),
          note("팀장님 성향", "팀장님은 네 가지 성향 중 하나입니다. 이름은 공개되지 않으니 행동 패턴으로 추리하세요."),
        ]),
        el("div", { class: "actions" }, [
          el("button", { class: "primary", text: "출근하기", onClick: () => actions.go("commute") }),
          el("button", { text: "처음으로", onClick: () => actions.go("title") }),
        ]),
      ]),
    ]),
  );
}

function note(title, body) {
  return el("section", { class: "note" }, [el("h2", { text: title }), el("p", { text: body })]);
}
