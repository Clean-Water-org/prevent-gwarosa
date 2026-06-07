const BOSS_REPLIES_BY_SUBTYPE = {
  request: [
    { id: "accept", label: "가능합니다", tone: "primary", delta: { workload: -3, gameMinute: 2, health: -1 }, bossAttentionDelta: -1, log: "팀장의 업무 요청에 수락했다." },
    { id: "hard", label: "어려울 것 같아요", tone: "neutral", bossAttentionDelta: -1, log: "팀장의 업무 요청을 어렵다고 답했다." },
  ],
  check: [
    { id: "nearly", label: "거의 끝났어요", tone: "primary", delta: { stress: -1, gameMinute: 2, health: -1 }, bossAttentionDelta: -1, log: "팀장에게 거의 마무리됐다고 답했다." },
    { id: "check", label: "확인해볼게요", tone: "neutral", delta: { gameMinute: 2, health: -1 }, bossAttentionDelta: -1, log: "팀장의 진행 확인에 답장했다." },
  ],
  praise: [
    { id: "thanks", label: "감사합니다", tone: "primary", delta: { stress: -3 }, bossAttentionDelta: -1, log: "팀장의 칭찬에 감사 인사를 했다." },
    { id: "effort", label: "더 노력할게요", tone: "neutral", delta: { stress: -2 }, bossAttentionDelta: -1, log: "팀장의 칭찬에 겸손하게 답했다." },
  ],
};

const DEFAULT_IGNORE_BY_KIND = {
  boss: { delta: { stress: 3 }, bossAttentionDelta: 1, log: "팀장 메시지를 못 본 척했다." },
  colleague: { delta: { stress: 2 }, colleagueIgnoreDelta: 1, log: "동료 메시지를 못 본 척했다." },
  hr: { delta: { stress: 2 }, hrIgnoreDelta: 1, log: "인사팀 공지를 못 본 척했다." },
};

const DEFAULT_IGNORE_BY_SUBTYPE = {
  favor: { delta: { stress: 2, colleagueTrust: -5 }, colleagueIgnoreDelta: 1, log: "동료의 부탁을 무시했다." },
  offer: { delta: { stress: 2, colleagueTrust: -3 }, colleagueIgnoreDelta: 1, log: "동료의 도움 제안을 무시했다." },
  lore: { delta: {}, colleagueIgnoreDelta: 1, log: "동료의 괴담을 못 본 척했다." },
};

export function getMessageReplyOptions(message) {
  if (Array.isArray(message.replies) && message.replies.length) {
    return message.replies.map((reply) => ({
      id: reply.id,
      label: reply.label,
      tone: reply.tone ?? "neutral",
    }));
  }

  if (message.kind === "boss" && BOSS_REPLIES_BY_SUBTYPE[message.subtype]) {
    return BOSS_REPLIES_BY_SUBTYPE[message.subtype].map(({ id, label, tone }) => ({ id, label, tone }));
  }

  if (message.kind === "hr" && message.portalCompleted) {
    return [{ id: "confirm", label: "확인했습니다", tone: "primary" }];
  }

  return [];
}

export function resolveMessageChoice(message, choiceId, options = {}) {
  if (choiceId === "ignore") {
    return resolveIgnoreChoice(message);
  }

  const reply = findReplyDefinition(message, choiceId);
  if (reply) {
    return normalizeChoiceResult(message, choiceId, reply, options);
  }

  if (message.kind === "hr" && choiceId === "confirm") {
    if (!message.portalCompleted) return emptyResult();
    return {
      delta: { gameMinute: -5 },
      hrIgnoreDelta: -1,
      log: "인사팀 공지 확인 완료를 답장했다.",
    };
  }

  if (choiceId === "later") {
    return emptyResult();
  }

  return emptyResult();
}

function findReplyDefinition(message, choiceId) {
  if (Array.isArray(message.replies)) {
    const match = message.replies.find((reply) => reply.id === choiceId);
    if (match) return match;
  }

  if (message.kind === "boss") {
    return BOSS_REPLIES_BY_SUBTYPE[message.subtype]?.find((reply) => reply.id === choiceId) ?? null;
  }

  return null;
}

function resolveIgnoreChoice(message) {
  if (message.ignore) {
    return normalizeChoiceResult(message, "ignore", message.ignore);
  }

  const subtypeDefault = DEFAULT_IGNORE_BY_SUBTYPE[message.subtype];
  if (subtypeDefault) {
    return normalizeChoiceResult(message, "ignore", subtypeDefault);
  }

  const kindDefault = DEFAULT_IGNORE_BY_KIND[message.kind] ?? { delta: { stress: 2 }, log: "메시지를 못 본 척했다." };
  return normalizeChoiceResult(message, "ignore", kindDefault);
}

function normalizeChoiceResult(message, choiceId, reply, options = {}) {
  const result = {
    delta: { ...(reply.delta ?? {}) },
    bossAttentionDelta: reply.bossAttentionDelta ?? 0,
    colleagueIgnoreDelta: reply.colleagueIgnoreDelta ?? 0,
    hrIgnoreDelta: reply.hrIgnoreDelta ?? 0,
    log: reply.log ?? null,
  };

  if (reply.deltaFn === "bossHard") {
    Object.assign(result.delta, options.getBossHardReplyDelta?.() ?? {});
  } else if (message.kind === "boss" && choiceId === "hard" && !message.replies?.some((entry) => entry.id === "hard")) {
    Object.assign(result.delta, options.getBossHardReplyDelta?.() ?? {});
  }

  if (choiceId !== "ignore" && message.kind === "colleague" && reply.colleagueIgnoreDelta === undefined) {
    result.colleagueIgnoreDelta = -1;
  }

  if (choiceId !== "ignore" && message.kind === "boss" && reply.bossAttentionDelta === undefined) {
    result.bossAttentionDelta = -1;
  }

  return result;
}

function emptyResult() {
  return { delta: {}, bossAttentionDelta: 0, colleagueIgnoreDelta: 0, hrIgnoreDelta: 0, log: null };
}

export function buildChatLogCause(message, choiceId, result) {
  if (result?.log) return result.log;
  if (choiceId === "later") return `${message.from ?? "동료"}의 메시지를 나중에 보기로 했다.`;

  const reply = findReplyDefinition(message, choiceId);
  if (reply?.log) return reply.log;

  const sender = message.from ?? "메시지";
  if (choiceId === "ignore") return `${sender} 메시지를 못 본 척했다.`;
  return `${sender} 메시지에 답장했다.`;
}

export function getMessageFlavorLabel(message) {
  if (message.flavor) return message.flavor;
  return null;
}
