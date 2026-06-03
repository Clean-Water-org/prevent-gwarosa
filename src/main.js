import { createInitialState } from "./state.js";
import { renderTitle } from "./scenes/title.js";
import { renderOnboarding } from "./scenes/onboarding.js";
import { renderCommute } from "./scenes/commute.js";
import { renderMainWork } from "./scenes/main-work.js";
import { renderMiniGame } from "./scenes/minigame.js";
import { renderLunch } from "./scenes/lunch.js";
import { renderEnding } from "./scenes/ending.js";

const app = document.querySelector("#app");
let state = createInitialState();

const scenes = {
  title: renderTitle,
  onboarding: renderOnboarding,
  commute: renderCommute,
  main: renderMainWork,
  minigame: renderMiniGame,
  lunch: renderLunch,
  ending: renderEnding,
};

export function setState(patch) {
  state = {
    ...state,
    ...patch,
    stats: { ...state.stats, ...(patch.stats ?? {}) },
    player: { ...state.player, ...(patch.player ?? {}) },
  };
  render();
}

export function mutateState(mutator) {
  state = mutator(structuredClone(state));
  render();
}

export function go(scene) {
  state.scene = scene;
  render();
}

export function finishWith(ending) {
  state.ending = ending;
  state.scene = "ending";
  render();
}

function render() {
  app.innerHTML = "";
  scenes[state.scene](app, state, { setState, mutateState, go, finishWith });
}

render();
