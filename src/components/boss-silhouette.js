// boss-silhouette.js — 상사 실루엣 (회의 준비·보고서 미니게임 공통 컴포넌트)
//
// 비주얼은 기존 회의 준비 프로토타입 스타일 그대로:
//   머리(원) + 어깨·상체 곡선 실루엣, fill #161616, 전체 opacity 0.32(은은한 looming),
//   가장자리 미세 블러(feGaussianBlur 1.6), 높이 125vh.
// 등장 방향만 direction prop으로 옵션화: "right"(회의), "right-top"(보고서).

const NS = "http://www.w3.org/2000/svg";
let _seq = 0; // SVG filter id 충돌 방지용

function s(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// 등장 방향 프리셋 — 화면 내 실루엣 위치 (스타일/형태는 동일)
const POSITIONS = {
  right: "top:-8%;right:-2%;height:125vh", // 우측 (회의 준비 — 프로토타입 원본 위치)
  "right-top": "top:-13%;right:-5%;height:122vh", // 우측 상단에서 등장 (보고서)
};

/**
 * 상사 실루엣 DOM 생성 (회의 준비 프로토타입 스타일).
 * @param {object} [opts]
 * @param {"right"|"right-top"} [opts.direction="right"] 등장 방향
 * @param {number} [opts.opacity=0.32] 전체 불투명도 (은은한 looming 톤)
 * @returns {HTMLDivElement} position:fixed 풀스크린 오버레이 래퍼 (pointer-events:none)
 */
export function makeBossSilhouette({ direction = "right", opacity = 0.32 } = {}) {
  const place = POSITIONS[direction] || POSITIONS.right;
  const fid = `bossSoft${++_seq}`;

  const wrap = document.createElement("div");
  wrap.style.cssText = "position:fixed;inset:0;z-index:46;pointer-events:none;overflow:hidden";

  const svg = s("svg", {
    viewBox: "0 0 300 320",
    preserveAspectRatio: "xMidYMax meet",
    style: `position:absolute;${place};width:auto;opacity:${opacity}`,
  });

  const defs = s("defs");
  const filter = s("filter", { id: fid, x: "-6%", y: "-6%", width: "112%", height: "112%" });
  filter.append(s("feGaussianBlur", { stdDeviation: "1.6" })); // 가장자리 미세 블러
  defs.append(filter);

  const g = s("g", { filter: `url(#${fid})`, fill: "#161616" });
  g.append(s("circle", { cx: "150", cy: "84", r: "52" })); // 머리
  g.append(s("path", { d: "M 18 320 C 26 205 80 142 150 140 C 220 142 274 205 282 320 Z" })); // 어깨·상체
  svg.append(defs, g);

  wrap.append(svg);
  return wrap;
}
