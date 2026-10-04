// 팀 대표색 가독성 보정 — 순수 함수 (서버 렌더러·클라이언트 UI 공용)
import type { Team } from "./teams";

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
