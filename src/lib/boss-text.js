/** 플레이어 이름 → "김대리씨" 형식 */
export function getPlayerHonorific(name) {
  const trimmed = (name || "김대리").trim();
  if (!trimmed) return "김대리씨";
  return trimmed.endsWith("씨") ? trimmed : `${trimmed}씨`;
}

/** `{name}` 자리에 호칭 삽입 */
export function fillBossText(template, playerName) {
  if (!template) return "";
  const honorific = getPlayerHonorific(playerName);
  return template.replace(/\{name\}/g, honorific);
}

/** 상사 메신저·이벤트 문구에 플레이어 이름 반영 */
export function personalizeBossChat(chat, playerName) {
  if (chat.kind !== "boss" && chat.from !== "팀장") return chat;
  return {
    ...chat,
    text: fillBossText(chat.text, playerName),
  };
}

/** 상사 이벤트 본문에 플레이어 이름 반영 */
export function personalizeBossEventBody(body, playerName) {
  return fillBossText(body, playerName);
}

/** 미니게임 카카오톡 [이모지, 발신자, 본문] 배열 생성 */
export function buildBossKakaoMsgs(state, lines) {
  const bossLabel = state.boss?.name ? `${state.boss.name} 팀장님` : "팀장님";
  const playerName = state.player?.name;
  return lines.map(([emoji, text]) => [emoji, bossLabel, fillBossText(text, playerName)]);
}
