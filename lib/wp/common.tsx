// 스타일 렌더러 공통 유틸 (next/og·Satori: 인라인 스타일 + flex 만).
import React from "react";
import { Game } from "../kbo";
import { Team, teamById } from "../teams";
import { Outcome, teamOutcome, SeasonData } from "../season";

export type Mode = "dark" | "light";

export interface RenderProps {
  team: Team;
  year: number;
  month: number; // 1-12
  games: Game[]; // 팀의 해당 월 경기 (날짜순)
  season?: SeasonData;
  todayISO: string; // YYYY-MM-DD (KST)
  mode: Mode;
  width: number;
  height: number;
}

// 캘린더 계열(minimal/mascot/sketch/newspaper) 공통 테마
// 결과 색 체계(전 스타일 공통): 승=초록 · 패=빨강 · 무=앰버 · 취소=회색
export interface CalTheme {
  bg: string;
  fg: string;
  sub: string;
  faint: string; // 달 밖 날짜
  line: string;
  winBg: string; winBd: string;
  loseBg: string; loseBd: string;
  drawBg: string; drawBd: string;
  cancelBg: string; cancelBd: string;
  cellLine: string;
}
export function calTheme(mode: Mode): CalTheme {
  if (mode === "light") {
    return {
      bg: "#f5f5f7", fg: "#16181d", sub: "rgba(22,24,29,0.5)", faint: "rgba(22,24,29,0.3)",
      line: "rgba(0,0,0,0.12)",
      winBg: "#e0f3e8", winBd: "#9ed8b4", loseBg: "#f9e6e9", loseBd: "#e2acb4",
      drawBg: "#f5eeda", drawBd: "#d8c48a", cancelBg: "#e9e9ec", cancelBd: "#c2c2c8",
      cellLine: "rgba(0,0,0,0.08)",
    };
  }
  return {
    bg: "#0a0a0c", fg: "#ffffff", sub: "rgba(255,255,255,0.5)", faint: "rgba(255,255,255,0.4)",
    line: "rgba(255,255,255,0.12)",
    winBg: "#12331e", winBd: "#2f6b45", loseBg: "#341519", loseBd: "#7a2d35",
    drawBg: "#33290f", drawBd: "#6b5b2a", cancelBg: "#1d1d22", cancelBd: "#44444c",
    cellLine: "rgba(255,255,255,0.10)",
  };
}

// 결과별 포인트 색 (도트·글자용, 다크 배경 기준)
export const DRAW_AMBER = "#d9a83c";
export const CANCEL_GRAY = "#8a8f99";

export const ENGLISH_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const EN_MONTH_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
export const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];
export const WEEK_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// 어두운 배경에서 잘 보이도록 보정한 팀별 칩 색
const CHIP: Record<string, string> = {
  HT: "#EA0029",
  SS: "#2E78D6",
  LG: "#E0457B",
  OB: "#3A5BD0",
  SK: "#E0344A",
  LT: "#2F6BD6",
  HH: "#FC7A33",
  NC: "#5A82C0",
  WO: "#C7405A",
  KT: "#9AA0A8",
};
export function chipColor(teamId: string): string {
  return CHIP[teamId] ?? "#8a8f99";
}

export interface DayCell {
  day: number;
  inMonth: boolean;
  game?: Game; // 첫 경기 (하위 호환)
  games: Game[]; // 그날 팀 경기 전체 (더블헤더 포함)
  isHome: boolean;
  opponent?: Team;
  outcome: Outcome; // 첫 경기 결과 (하위 호환)
  outcomes: Outcome[]; // 경기별 결과 (더블헤더면 2개)
  doubleheader: boolean;
}

// 달력 매트릭스 (6주 고정 X, 필요한 만큼). 앞뒤 달 날짜도 흐리게 채운다.
export function buildMatrix(year: number, month: number, games: Game[], teamId: string): DayCell[][] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const prevDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const byDay = new Map<number, Game[]>();
  for (const g of games) {
    if (g.month !== month) continue; // 다른 달 경기가 섞여 와도 엉뚱한 칸에 그리지 않는다
    if (!byDay.has(g.day)) byDay.set(g.day, []);
    byDay.get(g.day)!.push(g);
  }

  const make = (day: number, inMonth: boolean): DayCell => {
    const gs = inMonth ? byDay.get(day) : undefined;
    const g = gs?.[0];
    if (!g || !gs) return { day, inMonth, games: [], isHome: false, outcome: "scheduled", outcomes: [], doubleheader: false };
    const { isHome, outcome } = teamOutcome(g, teamId);
    const opponent = isHome ? g.away : g.home;
    return {
      day, inMonth, game: g, games: gs, isHome, opponent, outcome,
      outcomes: gs.map((x) => teamOutcome(x, teamId).outcome),
      doubleheader: gs.length > 1,
    };
  };

  const cells: DayCell[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(make(prevDays - firstWeekday + 1 + i, false));
  for (let d = 1; d <= daysInMonth; d++) cells.push(make(d, true));
  let nextDay = 1;
  while (cells.length % 7 !== 0) cells.push(make(nextDay++, false));

  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function opponentOf(g: Game, teamId: string): Team | undefined {
  const isHome = g.home?.id === teamId;
  return isHome ? g.away : g.home;
}

export function oppName(cell: DayCell): string {
  return cell.opponent?.short ?? "";
}
export function oppNameEn(cell: DayCell): string {
  return cell.opponent?.en ?? "";
}


// ── 팀 대표색 가독성 보정 ──────────────────────────────────────────────────────
// 두산(#131230)·롯데(#041E42)·키움(#570514)처럼 어두운 대표색은 어두운 카드 위에서 글자·막대·점이
// 배경에 묻힌다. 배경 대비가 모자라면 색상(hue)은 유지한 채 명도만 올려(밝은 배경이면 내려) 보정한다.
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
function luminance([r, g, b]: [number, number, number]): number {
  const c = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? ((G - B) / d + (G < B ? 6 : 0)) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, sat, l];
}
function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * 팀 포인트 색. bg 위에서 대비(기본 3:1)가 부족하면 명도를 조정한다.
 * 검정(KT)은 색상 정보가 없어 보정이 안 되므로 기존처럼 secondary 계열 빨강으로 대체한다.
 */
export function accentFor(team: Team, bg: string, minRatio = 3): string {
  const base = team.primary === "#000000" ? "#EB1C24" : team.primary;
  if (contrastRatio(base, bg) >= minRatio) return base;
  const [h, sat, l] = rgbToHsl(parseHex(base));
  const lighten = luminance(parseHex(bg)) < 0.4; // 어두운 배경이면 밝게, 밝은 배경이면 어둡게
  // 너무 칙칙한 색은 채도도 살려 "밝은 남색"이 회색빛으로 죽지 않게 한다
  const s2 = Math.max(sat, 0.55);
  for (let i = 1; i <= 40; i++) {
    const l2 = lighten ? Math.min(0.9, l + i * 0.02) : Math.max(0.1, l - i * 0.02);
    const c = hslToHex(h, s2, l2);
    if (contrastRatio(c, bg) >= minRatio) return c;
  }
  return lighten ? "#ffffff" : "#000000";
}

export const RESULT_GREEN = "#36c46b";
export const RESULT_GREEN_SOFT = "#12331e";
export const RESULT_GREEN_BD = "#2f6b45";
export const RESULT_RED_SOFT = "#341519";
export const RESULT_RED_BD = "#7a2d35";

export function weekdayColor(col: number, base = "rgba(255,255,255,0.9)"): string {
  return col === 0 ? "#ff6b6b" : col === 6 ? "#7fb0ff" : base;
}

/** 승률 표기 (.317 / 1.000). Math.round(pct*1000)가 1000이 되는 무패 전적도 올바르게 표시한다. */
export function formatPct(pct: number): string {
  const n = Math.round(pct * 1000);
  return n >= 1000 ? (n / 1000).toFixed(3) : "." + String(n).padStart(3, "0");
}

/** 그날 경기가 모두 취소인지 (취소선 표시용) */
export function allCanceled(cell: DayCell): boolean {
  return cell.outcomes.length > 0 && cell.outcomes.every((o) => o === "canceled");
}

// 상대팀 칩 (vs=홈 채움 / @=원정 테두리). 더블헤더는 ×2, 전 경기 취소면 취소선.
export function Chip({ cell, scale = 1 }: { cell: DayCell; scale?: number }) {
  if (!cell.opponent) return null;
  const c = chipColor(cell.opponent.id);
  const home = cell.isHome;
  const struck = allCanceled(cell);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: 13 * scale,
        fontWeight: 700,
        padding: `${2 * scale}px ${6 * scale}px`,
        borderRadius: 6 * scale,
        whiteSpace: "nowrap",
        opacity: struck ? 0.6 : 1,
        ...(home
          ? { background: c, color: "#fff" }
          : { background: "transparent", border: `${1.4 * scale}px solid ${c}`, color: c }),
      }}
    >
      <span style={{ fontSize: 10 * scale, opacity: 0.7, marginRight: 3 * scale }}>
        {home ? "vs" : "@"}
      </span>
      <span style={{ ...(struck ? { textDecoration: "line-through" } : {}) }}>
        {cell.opponent.short}
        {cell.doubleheader ? " ×2" : ""}
      </span>
    </div>
  );
}

export { teamById };
