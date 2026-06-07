import { applyWorkTimeCost, checkEnding, createInitialState } from "./state.js";
import { items } from "./data/items.js";
import { loadGame, saveGame } from "./lib/storage.js";
import { duckBgm } from "./lib/audio.js";
import { renderTitle, cleanupTitleFx } from "./scenes/title.js";
import { renderSetup } from "./scenes/setup.js";
import { renderOnboarding } from "./scenes/onboarding.js";
import { renderCommute } from "./scenes/commute.js";
import { renderMainWork, cleanupMainWorkSystems, prepareMainWorkForRender } from "./scenes/main-work.js";
import { renderMiniGame } from "./scenes/minigame/index.js";
import { renderLunch } from "./scenes/lunch.js";
import { renderEnding } from "./scenes/ending.js";

const app = document.querySelector("#app");

const scenes = {
  title: renderTitle,
  setup: renderSetup,
  onboarding: renderOnboarding,
  commute: renderCommute,
  main: renderMainWork,
  minigame: renderMiniGame,
  lunch: renderLunch,
  ending: renderEnding,
};

// 항상 title에서 시작. 저장 데이터는 타이틀 화면의 "이어하기"에서 사용
let state = createInitialState();
let _prevScene = state.scene;

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

/** 씬 리렌더 없이 상태만 갱신 (미니게임 중 두통 등). */
export function patchGameState(mutator) {
  state = mutator(structuredClone(state));
  saveGame(state);
  return state;
}

export function go(scene) {
  state = { ...state, scene };
  history.pushState(null, "", "#" + scene);
  render();
}

export function finishWith(ending) {
  // 엔딩은 단 한 번만 진입. 이미 엔딩 상태면 무시해 화면 중복 표시를 막는다.
  // (메인화면의 여러 타이머/이벤트 핸들러가 같은 순간에 finishWith를 호출할 수 있음)
  if (state.ending) return;
  // 메인화면 타이머·오버레이를 정리해, 전환 후 남은 타이머가 다시 렌더를 유발하지 않게 한다.
  cleanupMainWorkSystems();
  state = { ...state, ending, scene: "ending" };
  history.pushState(null, "", "#ending");
  render();
}

export function advanceGameMinute(minutes = 1) {
  if (state.scene !== "main" || !state.flags?.handoverGuideSeen || state.ending) {
    return state.gameMinute;
  }

  state = { ...state, stats: { ...state.stats }, flags: { ...state.flags } };
  applyWorkTimeCost(state, minutes);
  // 미니게임 진입 트리거는 main-work.js의 startMainPhaseTimer가 담당. 여기선 시간 진행 + 엔딩만.
  const ending = checkEnding(state);
  if (ending) {
    finishWith(ending);
  } else {
    saveGame(state);
  }
  return state.gameMinute;
}

export function useItem(index) {
  if (state.scene === "main" && !state.flags?.handoverGuideSeen) return;

  const itemId = state.inventory[index];
  const item = items[itemId];
  if (!item) return;

  // 사용 제한: 누적 사용 횟수가 maxUses에 도달하면 무시(소진).
  const usedCount = state.counters?.itemUses?.[itemId] ?? 0;
  if (item.maxUses != null && usedCount >= item.maxUses) return;

  if (itemId === "coffee") playItemSound("assets/audio/swallow.wav");

  mutateState((draft) => {
    const draftItem = items[draft.inventory[index]];
    if (!draftItem) return draft;
    // 누적 사용 횟수 증가(아이템 사용 전에 기록 — use()가 새 state를 반환해도 유지되도록 counters에 반영).
    draft.counters = {
      ...draft.counters,
      itemUses: { ...(draft.counters?.itemUses ?? {}), [itemId]: (draft.counters?.itemUses?.[itemId] ?? 0) + 1 },
    };
    return draftItem.use(draft);
  });
}

function playItemSound(src) {
  // 효과음이 잘 들리도록 BGM을 잠시 낮춘다(덕킹) — 채팅 알림음과 동일 처리.
  duckBgm();
  const audio = new Audio(src);
  audio.volume = 1.0;
  audio.play().catch(() => {});
}

function render() {
  prepareMainWorkForRender(_prevScene, state.scene);
  cleanupTitleFx();
  app.innerHTML = "";
  scenes[state.scene]?.(app, state, {
    setState,
    mutateState,
    patchGameState,
    go,
    finishWith,
    useItem,
    advanceGameMinute,
  });
  _prevScene = state.scene;
  if (state.scene !== "title") saveGame(state);
}

render();
