import { el } from "../ui.js";
import { clampStat } from "../state.js";
import { bosses } from "../data/bosses.js";

const SCENES = [
  { id: "main", label: "메인 업무" },
  { id: "commute", label: "출근 브리핑" },
  { id: "minigame", label: "미니게임" },
];

const MINIGAMES = [
  { id: "", label: "라운드 순서(자동)" },
  { id: "email", label: "이메일 분류" },
  { id: "meeting", label: "회의 준비" },
  { id: "report", label: "보고서 오탈자" },
];

const MEETING_OUTCOMES = [
  { id: "", label: "자동 판정" },
  { id: "shame", label: "지적" },
  { id: "praise", label: "칭찬" },
  { id: "followup", label: "후속 업무" },
];

const BOSS_OPTIONS = [
  { id: "", label: "현재 상사" },
  ...bosses.map((boss) => ({ id: boss.id, label: `${boss.name} (${boss.publicHint})` })),
];

const PRESETS = {
  default: {
    label: "기본",
    scene: "main",
    time: "09:00",
    workload: 100,
    stress: 0,
    health: 100,
    minigameRound: 0,
    devGameId: "",
    handoverGuideSeen: true,
    lunchEvent: false,
    skipStatusEvents: false,
    coffeeStreak: 0,
    triggerMeetingEvent: false,
    meetingOutcome: "",
    bossId: "",
  },
  headache: {
    label: "두통",
    scene: "main",
    time: "09:00",
    workload: 100,
    stress: 0,
    health: 25,
    minigameRound: 0,
    devGameId: "",
    handoverGuideSeen: true,
    lunchEvent: false,
    skipStatusEvents: false,
    coffeeStreak: 0,
    triggerMeetingEvent: false,
    meetingOutcome: "",
    bossId: "",
  },
  burnout: {
    label: "번아웃",
    scene: "main",
    time: "09:00",
    workload: 100,
    stress: 75,
    health: 100,
    minigameRound: 0,
    devGameId: "",
    handoverGuideSeen: true,
    lunchEvent: false,
    skipStatusEvents: true,
    coffeeStreak: 0,
    triggerMeetingEvent: false,
    meetingOutcome: "",
    bossId: "",
  },
  lunch: {
    label: "점심",
    scene: "main",
    time: "12:00",
    workload: 100,
    stress: 40,
    health: 80,
    minigameRound: 2,
    devGameId: "",
    handoverGuideSeen: true,
    lunchEvent: true,
    skipStatusEvents: false,
    coffeeStreak: 0,
    triggerMeetingEvent: false,
    meetingOutcome: "",
    bossId: "",
  },
  coffee: {
    label: "손떨림",
    scene: "main",
    time: "09:00",
    workload: 100,
    stress: 0,
    health: 100,
    minigameRound: 0,
    devGameId: "",
    handoverGuideSeen: true,
    lunchEvent: false,
    skipStatusEvents: false,
    coffeeStreak: 2,
    triggerMeetingEvent: false,
    meetingOutcome: "",
    bossId: "",
  },
  meeting: {
    label: "회의",
    scene: "main",
    time: "13:00",
    workload: 100,
    stress: 40,
    health: 80,
    minigameRound: 2,
    devGameId: "",
    handoverGuideSeen: true,
    lunchEvent: false,
    skipStatusEvents: true,
    coffeeStreak: 0,
    triggerMeetingEvent: true,
    meetingOutcome: "",
    bossId: "",
  },
};

function parseTimeToMinute(timeText) {
  const match = String(timeText).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 9 * 60;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60;
  return Math.max(0, Math.min(23 * 60 + 59, hours * 60 + minutes));
}

function minuteToTime(gameMinute) {
  const hours = Math.floor(gameMinute / 60);
  const minutes = gameMinute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function readNumber(input, fallback, min = 0, max = 100) {
  const value = Number(input?.value);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function buildDevLaunchPatch(state, config) {
  const scene = SCENES.some((item) => item.id === config.scene) ? config.scene : "main";
  const gameMinute = parseTimeToMinute(config.time);
  const minigameRound = readNumber({ value: config.minigameRound }, 0, 0, 99);
  const devGameId = MINIGAMES.some((item) => item.id === config.devGameId) ? config.devGameId : "";

  const flags = {
    ...state.flags,
    devMode: true,
    handoverGuideSeen: Boolean(config.handoverGuideSeen),
    pendingMinigameBriefing: false,
    minigameBriefingKey: null,
  };

  if (config.lunchEvent) {
    flags.lunchPhase = "intro";
  } else {
    delete flags.lunchPhase;
  }

  if (config.skipStatusEvents) {
    flags.statusEvents = {
      ...(state.flags?.statusEvents ?? {}),
      headache: true,
      burnout: true,
    };
  }

  if (scene === "minigame" && devGameId) {
    flags.devGameId = devGameId;
  } else {
    flags.devGameId = null;
  }

  if (config.meetingEvent) {
    flags.meetingEventDone = false;
    flags.devTriggerMeetingEvent = true;
    if (MEETING_OUTCOMES.some((item) => item.id === config.meetingOutcome) && config.meetingOutcome) {
      flags.devMeetingOutcome = config.meetingOutcome;
    } else {
      delete flags.devMeetingOutcome;
    }
  }

  const bossId = BOSS_OPTIONS.some((item) => item.id === config.bossId) ? config.bossId : "";
  const boss = bossId ? bosses.find((entry) => entry.id === bossId) : null;

  return {
    ...state,
    scene,
    boss: boss ?? state.boss,
    gameMinute: config.lunchEvent ? Math.max(gameMinute, 12 * 60) : gameMinute,
    minigameRound: config.lunchEvent ? Math.max(minigameRound, 2) : minigameRound,
    stats: {
      workload: clampStat(readNumber({ value: config.workload }, state.stats.workload)),
      stress: clampStat(readNumber({ value: config.stress }, state.stats.stress)),
      health: clampStat(readNumber({ value: config.health }, state.stats.health)),
    },
    counters: {
      ...state.counters,
      coffeeStreak: readNumber({ value: config.coffeeStreak }, 0, 0, 9),
    },
    flags,
  };
}

function renderField(label, control) {
  return el("label", { class: "dev-field" }, [
    el("span", { class: "dev-field-label", text: label }),
    control,
  ]);
}

function renderSelect(name, options, value) {
  const select = el("select", { class: "dev-input", name });
  for (const option of options) {
    const node = el("option", { value: option.id, text: option.label });
    if (option.id === value) node.selected = true;
    select.append(node);
  }
  return select;
}

function renderCheckbox(name, label, checked) {
  const input = el("input", { class: "dev-checkbox", type: "checkbox", name });
  input.checked = checked;
  return el("label", { class: "dev-check" }, [input, el("span", { text: label })]);
}

function readForm(form) {
  const scene = form.querySelector('[name="scene"]')?.value ?? "main";
  const time = form.querySelector('[name="time"]')?.value ?? "09:00";
  const workload = form.querySelector('[name="workload"]')?.value ?? "100";
  const stress = form.querySelector('[name="stress"]')?.value ?? "0";
  const health = form.querySelector('[name="health"]')?.value ?? "100";
  const minigameRound = form.querySelector('[name="minigameRound"]')?.value ?? "0";
  const devGameId = form.querySelector('[name="devGameId"]')?.value ?? "";
  const handoverGuideSeen = form.querySelector('[name="handoverGuideSeen"]')?.checked ?? true;
  const lunchEvent = form.querySelector('[name="lunchEvent"]')?.checked ?? false;
  const skipStatusEvents = form.querySelector('[name="skipStatusEvents"]')?.checked ?? false;
  const coffeeStreak = form.querySelector('[name="coffeeStreak"]')?.checked ? 2 : 0;
  const meetingOutcome = form.querySelector('[name="meetingOutcome"]')?.value ?? "";
  const bossId = form.querySelector('[name="bossId"]')?.value ?? "";
  const triggerMeetingEvent = form.querySelector('[name="triggerMeetingEvent"]')?.checked ?? false;

  return {
    scene,
    time,
    workload,
    stress,
    health,
    minigameRound,
    devGameId,
    handoverGuideSeen,
    lunchEvent,
    skipStatusEvents,
    coffeeStreak,
    meetingOutcome,
    bossId,
    triggerMeetingEvent,
  };
}

function fillForm(form, preset) {
  form.querySelector('[name="scene"]').value = preset.scene;
  form.querySelector('[name="time"]').value = preset.time;
  form.querySelector('[name="workload"]').value = String(preset.workload);
  form.querySelector('[name="stress"]').value = String(preset.stress);
  form.querySelector('[name="health"]').value = String(preset.health);
  form.querySelector('[name="minigameRound"]').value = String(preset.minigameRound);
  form.querySelector('[name="devGameId"]').value = preset.devGameId;
  form.querySelector('[name="handoverGuideSeen"]').checked = preset.handoverGuideSeen;
  form.querySelector('[name="lunchEvent"]').checked = preset.lunchEvent;
  form.querySelector('[name="skipStatusEvents"]').checked = preset.skipStatusEvents;
  form.querySelector('[name="coffeeStreak"]').checked = preset.coffeeStreak >= 2;
  if (form.querySelector('[name="meetingOutcome"]')) {
    form.querySelector('[name="meetingOutcome"]').value = preset.meetingOutcome ?? "";
  }
  if (form.querySelector('[name="bossId"]')) {
    form.querySelector('[name="bossId"]').value = preset.bossId ?? "";
  }
  if (form.querySelector('[name="triggerMeetingEvent"]')) {
    form.querySelector('[name="triggerMeetingEvent"]').checked = Boolean(preset.triggerMeetingEvent);
  }
}

function launchMeetingEventPreview(state, actions, form) {
  const config = readForm(form);
  actions.mutateState((draft) => buildDevLaunchPatch(draft, {
    ...config,
    scene: "main",
    time: "13:00",
    minigameRound: Math.max(readNumber({ value: config.minigameRound }, 2), 2),
    handoverGuideSeen: true,
    lunchEvent: false,
    skipStatusEvents: true,
    meetingEvent: true,
  }));
}

export function renderDevPanel(state, actions) {
  const initial = {
    ...PRESETS.default,
    time: minuteToTime(state.gameMinute ?? 9 * 60),
    workload: state.stats.workload,
    stress: state.stats.stress,
    health: state.stats.health,
    minigameRound: state.minigameRound ?? 0,
  };

  const form = el("form", { class: "dev-form" }, [
    el("div", { class: "dev-presets" }, Object.entries(PRESETS).map(([key, preset]) =>
      el("button", {
        class: "dev-preset-button",
        type: "button",
        text: preset.label,
        onClick: () => fillForm(form, preset),
      }),
    )),
    el("div", { class: "dev-form-grid" }, [
      renderField("씬", renderSelect("scene", SCENES, initial.scene)),
      renderField("시간", el("input", {
        class: "dev-input",
        type: "time",
        name: "time",
        value: initial.time,
      })),
      renderField("업무량", el("input", {
        class: "dev-input",
        type: "number",
        name: "workload",
        min: "0",
        max: "100",
        value: String(initial.workload),
      })),
      renderField("스트레스", el("input", {
        class: "dev-input",
        type: "number",
        name: "stress",
        min: "0",
        max: "100",
        value: String(initial.stress),
      })),
      renderField("체력", el("input", {
        class: "dev-input",
        type: "number",
        name: "health",
        min: "0",
        max: "100",
        value: String(initial.health),
      })),
      renderField("미니 라운드", el("input", {
        class: "dev-input",
        type: "number",
        name: "minigameRound",
        min: "0",
        max: "9",
        value: String(initial.minigameRound),
      })),
      renderField("미니게임", renderSelect("devGameId", MINIGAMES, initial.devGameId)),
    ]),
    el("div", { class: "dev-checks" }, [
      renderCheckbox("handoverGuideSeen", "인수인계 생략", initial.handoverGuideSeen),
      renderCheckbox("lunchEvent", "점심 이벤트", initial.lunchEvent),
      renderCheckbox("skipStatusEvents", "상태 팝업 생략", initial.skipStatusEvents),
      renderCheckbox("coffeeStreak", "커피 연속 2회", initial.coffeeStreak >= 2),
      renderCheckbox("triggerMeetingEvent", "회의 이벤트 즉시", false),
    ]),
    el("section", { class: "dev-meeting-preview" }, [
      el("p", { class: "dev-section-label", text: "회의 이벤트 미리보기" }),
      el("div", { class: "dev-form-grid dev-form-grid--meeting" }, [
        renderField("결과", renderSelect("meetingOutcome", MEETING_OUTCOMES, "")),
        renderField("상사", renderSelect("bossId", BOSS_OPTIONS, "")),
      ]),
      el("button", {
        class: "dev-launch-button",
        type: "button",
        text: "▶ 회의 이벤트 바로 보기",
        onClick: () => launchMeetingEventPreview(state, actions, form),
      }),
    ]),
    el("div", { class: "dev-form-actions" }, [
      el("button", {
        class: "dev-launch-button primary",
        type: "submit",
        text: "▶ 이 설정으로 시작",
      }),
      el("button", {
        class: "dev-link-button",
        type: "button",
        text: "이메일 원본 HTML",
        onClick: () => {
          window.location.href = "./assets/minigames/email-classification-prototype.html";
        },
      }),
    ]),
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const config = readForm(form);
    actions.mutateState((draft) => buildDevLaunchPatch(draft, {
      ...config,
      meetingEvent: config.triggerMeetingEvent,
    }));
  });

  return el("details", { class: "dev-panel" }, [
    el("summary", { text: "개발자 모드" }),
    el("div", { class: "dev-actions" }, [form]),
  ]);
}
