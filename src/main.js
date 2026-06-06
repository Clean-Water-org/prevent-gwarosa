import { createInitialState } from "./state.js";
import { loadGame, saveGame } from "./lib/storage.js";
import { renderTitle } from "./scenes/title.js";
import { renderOnboarding } from "./scenes/onboarding.js";
import { renderCommute } from "./scenes/commute.js";
import { renderMainWork } from "./scenes/main-work.js";
import { renderMiniGame } from "./scenes/minigame/index.js";
import { renderLunch } from "./scenes/lunch.js";
import { renderEnding } from "./scenes/ending.js";

const app = document.querySelector("#app");

const scenes = {
  title: renderTitle,
  onboarding: renderOnboarding,
  commute: renderCommute,
  main: renderMainWork,
  minigame: renderMiniGame,
  lunch: renderLunch,
  ending: renderEnding,
};

// 항상 title에서 시작. 저장 데이터는 타이틀 화면의 "이어하기"에서 사용
let state = createInitialState();

// Sync URL hash to current state scene on first load
history.replaceState(null, "", "#title");

// Browser back/forward button support
window.addEventListener("hashchange", () => {
  const scene = location.hash.slice(1);
  if (scenes[scene] && scene !== state.scene) {
    state = { ...state, scene };
    render();
  }
});

export function setState(patch) {
  const prevScene = state.scene;
  state = {
    ...state,
    ...patch,
    stats: { ...state.stats, ...(patch.stats ?? {}) },
    player: { ...state.player, ...(patch.player ?? {}) },
  };
  if (state.scene !== prevScene) {
    history.pushState(null, "", "#" + state.scene);
  }
  render();
}

export function mutateState(mutator) {
  const prevScene = state.scene;
  state = mutator(structuredClone(state));
  if (state.scene !== prevScene) {
    history.pushState(null, "", "#" + state.scene);
  }
  render();
}

export function go(scene) {
  state = { ...state, scene };
  history.pushState(null, "", "#" + scene);
  render();
}

export function finishWith(ending) {
  state = { ...state, ending, scene: "ending" };
  history.pushState(null, "", "#ending");
  render();
}

function render() {
  app.innerHTML = "";
  scenes[state.scene]?.(app, state, { setState, mutateState, go, finishWith });
  if (state.scene !== "title") saveGame(state);
}

render();
