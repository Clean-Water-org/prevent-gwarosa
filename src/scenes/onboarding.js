import { el } from "../ui.js";

export function renderOnboarding(root, state, actions) {
  root.append(
    el("section", { class: "screen" }, [
      el("article", { class: "document" }, [
        el("div", { class: "handover-doc" }, [
          el("div", { class: "handover-title", text: "📄 업무 인수인계서" }),
          el("div", { class: "handover-meta" }, [
            el("span", { text: "작성자: 전임자" }),
            el("span", { class: "meta-sep", text: "ㅣ" }),
            el("span", { text: "열람 권장" }),
          ]),
          el("div", { class: "handover-rule" }),
          el("ol", { class: "handover-items" }, [
            item("업무량은 100에서 시작합니다. 18시 전에 모두 처리하면 퇴근할 수 있습니다."),
            item("스트레스가 100이 되면 더 이상 버틸 수 없습니다. 적절히 관리하세요."),
            item("체력이 0이 되면 업무를 진행할 수 없습니다. 무리하지 마세요."),
            item("상사마다 성향이 다릅니다. 관찰하면 패턴을 찾을 수 있습니다."),
            item("메신저는 자주 확인하는 것이 좋습니다. 답장이 늦어질수록 업무가 늘어날 수 있습니다."),
            item("아이템은 필요할 때 사용하세요. 아껴둘 이유는 없습니다."),
            item("미니게임을 성공하면 업무량을 크게 줄일 수 있습니다."),
          ]),
          el("div", { class: "handover-rule" }),
        ]),
        el("div", { class: "actions" }, [
          el("button", { text: "처음으로", onClick: () => actions.go("title") }),
        ]),
      ]),
    ]),
  );
}

function item(text) {
  return el("li", { class: "handover-item", text });
}
