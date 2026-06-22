// 해상도 프리셋과 디자인 스타일 정의.

export interface Resolution {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const RESOLUTIONS: Resolution[] = [
  { id: "iphone-17", label: "iPhone 17 (1206×2622)", width: 1206, height: 2622 },
  { id: "iphone-17-pro-max", label: "iPhone 17 Pro Max (1320×2868)", width: 1320, height: 2868 },
  { id: "iphone-15-pro", label: "iPhone 15 Pro (1179×2556)", width: 1179, height: 2556 },
  { id: "iphone-15-pro-max", label: "iPhone 15 Pro Max (1290×2796)", width: 1290, height: 2796 },
  { id: "iphone-se", label: "iPhone SE (750×1334)", width: 750, height: 1334 },
  { id: "android-fhd", label: "Android FHD (1080×2400)", width: 1080, height: 2400 },
  { id: "android-qhd", label: "Android QHD (1440×3120)", width: 1440, height: 3120 },
];

export function resolutionById(id: string | null | undefined): Resolution {
  return RESOLUTIONS.find((r) => r.id === id) ?? RESOLUTIONS[2];
}

export type StyleId =
  | "minimal"
  | "sketch"
  | "newspaper"
  | "bento"
  | "brutal"
  | "grass"
  | "grass-soft"
  | "dots"
  | "diamond"
  | "mascot"
  | "nighter"
  | "kpop-card"
  | "led-scoreboard"
  | "list";

export type Mode = "dark" | "light";

export interface Style {
  id: StyleId;
  label: string;
  group: "calendar" | "season";
}

export const STYLES: Style[] = [
  { id: "minimal", label: "MINIMAL", group: "calendar" },
  { id: "mascot", label: "MASCOT · 픽토", group: "calendar" },
  { id: "sketch", label: "SKETCH · 손그림", group: "calendar" },
  { id: "newspaper", label: "NEWSPAPER · 신문", group: "calendar" },
  { id: "brutal", label: "BRUTAL", group: "calendar" },
  { id: "nighter", label: "NIGHTER · 야간경기", group: "calendar" },
  { id: "led-scoreboard", label: "LED · 전광판", group: "calendar" },
  { id: "kpop-card", label: "KPOP-CARD · 포토카드", group: "calendar" },
  { id: "bento", label: "BENTO · 대시보드", group: "calendar" },
  { id: "list", label: "LIST · 리스트", group: "calendar" },
  { id: "grass", label: "GRASS · 직각", group: "season" },
  { id: "grass-soft", label: "GRASS · 둥근", group: "season" },
  { id: "dots", label: "DOTS · 144점", group: "season" },
  { id: "diamond", label: "DIAMOND · 베이스볼", group: "season" },
];

const STYLE_IDS = new Set(STYLES.map((s) => s.id));

export function isStyleId(v: string | null | undefined): v is StyleId {
  return !!v && STYLE_IDS.has(v as StyleId);
}

export function isMode(v: string | null | undefined): v is Mode {
  return v === "dark" || v === "light";
}

// light 모드를 지원하는 스타일 (그 외는 dark 고정)
const LIGHT_CAPABLE = new Set<StyleId>(["minimal", "mascot", "sketch", "newspaper", "bento"]);
export function supportsLight(style: StyleId): boolean {
  return LIGHT_CAPABLE.has(style);
}

// 시즌 전체 데이터(전 월 + 전적)가 필요한 스타일
const SEASON_STYLES = new Set<StyleId>(["bento", "grass", "grass-soft", "dots", "diamond"]);
export function needsSeasonData(style: StyleId): boolean {
  return SEASON_STYLES.has(style);
}

export interface Palette {
  bgFrom: string;
  bgTo: string;
  fg: string; // 주 글자색
  sub: string; // 보조 글자색
  line: string; // 구분선
  card: string; // 행 배경
  accent: string; // 강조 (팀색)
  win: string;
  lose: string;
  draw: string;
}

// list 스타일용 팀 컬러 팔레트
export function buildPalette(_style: StyleId, teamPrimary: string, teamSecondary: string): Palette {
  return {
    bgFrom: teamPrimary,
    bgTo: shade(teamPrimary, -0.45),
    fg: "#ffffff",
    sub: "rgba(255,255,255,0.65)",
    line: "rgba(255,255,255,0.14)",
    card: "rgba(255,255,255,0.08)",
    accent: teamSecondary,
    win: "#7CFFB2",
    lose: "rgba(255,255,255,0.45)",
    draw: "rgba(255,255,255,0.7)",
  };
}

/** hex 색을 amount(-1~1)만큼 밝게/어둡게. */
function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  let r = parseInt(full.slice(0, 2), 16);
  let g = parseInt(full.slice(2, 4), 16);
  let b = parseInt(full.slice(4, 6), 16);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  r = Math.round((t - r) * p) + r;
  g = Math.round((t - g) * p) + g;
  b = Math.round((t - b) * p) + b;
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
