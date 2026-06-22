// 팀별 오리지널 마스코트 아이콘(SVG). KBO 공식 캐릭터를 베끼지 않고 동물·색만 차용한 도형 아이콘.
// next/og(Satori)는 <img src="data:image/svg+xml;base64,..."> 형태로 SVG 를 렌더링한다.

import { Team } from "./teams";

const VB = 120;

// 어두운 색을 약간 더 어둡게 (외곽선용)
function darken(hex: string, amt = 0.35): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = [0, 2, 4].map((i) => Math.round(parseInt(f.slice(i, i + 2), 16) * (1 - amt)));
  return `#${n.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

// 공통 얼굴(눈·볼·입)
function face(): string {
  return `
    <ellipse cx="48" cy="63" rx="4.2" ry="5.4" fill="#26211c"/>
    <ellipse cx="72" cy="63" rx="4.2" ry="5.4" fill="#26211c"/>
    <circle cx="49.6" cy="61" r="1.5" fill="#fff"/>
    <circle cx="73.6" cy="61" r="1.5" fill="#fff"/>
    <ellipse cx="38" cy="73" rx="6" ry="4" fill="#ff8fa3" opacity="0.65"/>
    <ellipse cx="82" cy="73" rx="6" ry="4" fill="#ff8fa3" opacity="0.65"/>
    <path d="M53 72 Q60 79 67 72" stroke="#26211c" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
}

function head(body: string, stroke: string, r = 38): string {
  return `<circle cx="60" cy="64" r="${r}" fill="${body}" stroke="${stroke}" stroke-width="3.2"/>`;
}

function inner(team: Team): string {
  const { body, accent } = team;
  const stroke = darken(accent, 0.15);
  const headStroke = darken(body, 0.32);

  switch (team.mascot) {
    case "bear":
      return `
        <circle cx="36" cy="38" r="13" fill="${body}" stroke="${headStroke}" stroke-width="3.2"/>
        <circle cx="84" cy="38" r="13" fill="${body}" stroke="${headStroke}" stroke-width="3.2"/>
        <circle cx="36" cy="38" r="6" fill="${accent}" opacity="0.55"/>
        <circle cx="84" cy="38" r="6" fill="${accent}" opacity="0.55"/>
        ${head(body, headStroke)}
        <ellipse cx="60" cy="74" rx="14" ry="11" fill="#fff" opacity="0.75"/>
        ${face()}`;

    case "tiger":
      return `
        <path d="M30 44 L33 18 L50 36 Z" fill="${body}" stroke="${headStroke}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M90 44 L87 18 L70 36 Z" fill="${body}" stroke="${headStroke}" stroke-width="3" stroke-linejoin="round"/>
        ${head(body, headStroke)}
        <path d="M60 28 q-4 9 0 16" stroke="${accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M44 34 q-2 7 1 12" stroke="${accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M76 34 q2 7 -1 12" stroke="${accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${face()}`;

    case "lion":
      return `
        ${maneCircle(accent)}
        ${head(body, headStroke, 34)}
        ${face()}`;

    case "rabbit":
      return `
        <ellipse cx="47" cy="28" rx="8" ry="22" fill="${body}" stroke="${headStroke}" stroke-width="3"/>
        <ellipse cx="73" cy="28" rx="8" ry="22" fill="${body}" stroke="${headStroke}" stroke-width="3"/>
        <ellipse cx="47" cy="28" rx="3.5" ry="15" fill="${accent}" opacity="0.55"/>
        <ellipse cx="73" cy="28" rx="3.5" ry="15" fill="${accent}" opacity="0.55"/>
        ${head(body, headStroke)}
        ${face()}`;

    case "eagle":
      return `
        <path d="M40 36 L46 20 L54 34 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M80 36 L74 20 L66 34 Z" fill="${accent}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
        ${head(body, headStroke)}
        <ellipse cx="48" cy="63" rx="4.2" ry="5.4" fill="#26211c"/>
        <ellipse cx="72" cy="63" rx="4.2" ry="5.4" fill="#26211c"/>
        <circle cx="49.6" cy="61" r="1.5" fill="#fff"/>
        <circle cx="73.6" cy="61" r="1.5" fill="#fff"/>
        <path d="M60 67 L50 74 L60 80 Z" fill="${accent}" stroke="${stroke}" stroke-width="2"/>
        <path d="M60 67 L70 74 L60 80 Z" fill="#F4B43E" stroke="${stroke}" stroke-width="2"/>`;

    case "dino":
      return `
        <path d="M40 30 l6 -11 l6 11 z" fill="${accent}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M54 26 l6 -12 l6 12 z" fill="${accent}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M68 30 l6 -11 l6 11 z" fill="${accent}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        ${head(body, headStroke)}
        <ellipse cx="55" cy="78" rx="2.4" ry="2" fill="#26211c"/>
        <ellipse cx="65" cy="78" rx="2.4" ry="2" fill="#26211c"/>
        ${face()}`;

    case "seagull":
      return `
        <path d="M34 30 q12 6 18 16" stroke="${darken(body, 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M86 30 q-12 6 -18 16" stroke="${darken(body, 0.18)}" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${head(body, headStroke)}
        <ellipse cx="48" cy="62" rx="4.2" ry="5.4" fill="#26211c"/>
        <ellipse cx="72" cy="62" rx="4.2" ry="5.4" fill="#26211c"/>
        <circle cx="49.6" cy="60" r="1.5" fill="#fff"/>
        <circle cx="73.6" cy="60" r="1.5" fill="#fff"/>
        <path d="M52 70 L60 76 L68 70 Z" fill="#F4A23E" stroke="${darken('#F4A23E',0.3)}" stroke-width="1.6"/>`;

    case "cat":
      return `
        <path d="M32 42 L34 22 L52 34 Z" fill="${body}" stroke="${headStroke}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M88 42 L86 22 L68 34 Z" fill="${body}" stroke="${headStroke}" stroke-width="3" stroke-linejoin="round"/>
        ${head(body, headStroke)}
        ${face()}
        <path d="M30 64 h12" stroke="${accent}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        <path d="M30 70 h12" stroke="${accent}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        <path d="M90 64 h-12" stroke="${accent}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        <path d="M90 70 h-12" stroke="${accent}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;

    case "robot":
      return `
        <line x1="60" y1="32" x2="60" y2="16" stroke="${darken(body,0.3)}" stroke-width="3"/>
        <circle cx="60" cy="13" r="5" fill="${accent}"/>
        <rect x="24" y="34" width="72" height="60" rx="18" fill="${body}" stroke="${darken(body,0.32)}" stroke-width="3.2"/>
        <rect x="40" y="56" width="12" height="9" rx="3" fill="#26211c"/>
        <rect x="68" y="56" width="12" height="9" rx="3" fill="#26211c"/>
        <rect x="48" y="76" width="24" height="5" rx="2.5" fill="${accent}"/>
        <rect x="18" y="56" width="6" height="16" rx="3" fill="${darken(body,0.2)}"/>
        <rect x="96" y="56" width="6" height="16" rx="3" fill="${darken(body,0.2)}"/>`;

    case "alien":
      return `
        <line x1="46" y1="34" x2="40" y2="18" stroke="${darken(body,0.25)}" stroke-width="3" stroke-linecap="round"/>
        <line x1="74" y1="34" x2="80" y2="18" stroke="${darken(body,0.25)}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="39" cy="15" r="4" fill="${accent}"/>
        <circle cx="81" cy="15" r="4" fill="${accent}"/>
        ${head(body, darken(body,0.32))}
        <ellipse cx="48" cy="62" rx="6" ry="8" fill="#26211c"/>
        <ellipse cx="72" cy="62" rx="6" ry="8" fill="#26211c"/>
        <circle cx="50" cy="59" r="2" fill="#fff"/>
        <circle cx="74" cy="59" r="2" fill="#fff"/>
        <path d="M53 75 Q60 80 67 75" stroke="#26211c" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

    default:
      return head(body, headStroke) + face();
  }
}

// 사자 갈기: 머리 둘레로 작은 삼각형 갈기
function maneCircle(accent: string): string {
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = 60 + Math.cos(a) * 40;
    const y = 64 + Math.sin(a) * 40;
    const x2 = 60 + Math.cos(a) * 50;
    const y2 = 64 + Math.sin(a) * 50;
    const a1 = a + 0.22;
    const a0 = a - 0.22;
    const bx = 60 + Math.cos(a0) * 38;
    const by = 64 + Math.sin(a0) * 38;
    const cx = 60 + Math.cos(a1) * 38;
    const cy = 64 + Math.sin(a1) * 38;
    pts.push(`<path d="M${bx} ${by} L${x2} ${y2} L${cx} ${cy} Z" fill="${accent}"/>`);
  }
  return pts.join("");
}

export function mascotSVG(team: Team): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}">${inner(team)}</svg>`;
}

export function mascotDataUri(team: Team): string {
  const svg = mascotSVG(team);
  const b64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}
