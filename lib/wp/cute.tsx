// CUTE · 아기자기(둥근) 스타일 — 파스텔 배경 + 둥근 카드 + 마스코트 뱃지.
// next/og(Satori) 제약: 인라인 스타일 + flex 만, box-shadow/borderRadius/linear-gradient 지원.
import React from "react";
import { RenderProps, buildMatrix, DayCell, WEEK_KO, weekdayColor } from "./common";
import { mascotDataUri } from "../mascots";

function isToday(cell: DayCell, todayISO: string, year: number, month: number): boolean {
  if (!cell.inMonth) return false;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
  return iso === todayISO;
}

// hex 를 흰색 쪽으로 t(0~1) 만큼 섞어 파스텔 톤을 만든다.
function tint(hex: string, t: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(f.slice(i, i + 2), 16);
    return Math.round(v + (255 - v) * t);
  });
  return `#${ch.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

// 배경에 흩뿌린 야구공 모티프 (아주 옅게)
function ballsBg(w: number, h: number, seed: number): string {
  let s = (seed >>> 0) || 1;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff);
  const balls: string[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const cx = Math.round(rand() * w);
    const cy = Math.round(rand() * h);
    const r = Math.round(26 + rand() * 30);
    balls.push(
      `<g opacity="0.55"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="rgba(120,110,100,0.12)" stroke-width="${Math.max(1, r * 0.05)}"/>` +
      `<path d="M${cx - r * 0.6} ${cy - r * 0.55} Q${cx - r * 0.95} ${cy} ${cx - r * 0.6} ${cy + r * 0.55}" stroke="#ff9aa8" stroke-width="${r * 0.1}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${cx + r * 0.6} ${cy - r * 0.55} Q${cx + r * 0.95} ${cy} ${cx + r * 0.6} ${cy + r * 0.55}" stroke="#ff9aa8" stroke-width="${r * 0.1}" fill="none" stroke-linecap="round"/></g>`
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${balls.join("")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function Cute(props: RenderProps) {
  const { team, year, month, games, todayISO, width, height } = props;
  const s = width / 1170;
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 46 * s;

  const accent = team.primary === "#000000" ? "#EB1C24" : team.primary;
  // 파스텔 배경 그라데이션 (팀색 → 크림)
  const bgTop = tint(accent, 0.72);
  const bgBot = "#fff8f0";
  const ink = "#3a3330";
  const sub = "rgba(58,51,48,0.55)";

  const winBg = "#dff3e4", winInk = "#2f8f57";
  const loseBg = "#fde3e7", loseInk = "#d06b7d";
  const schedBg = tint(accent, 0.86), schedInk = accent;
  const cardBg = "#ffffff";

  const seed = team.id.charCodeAt(0) * 100 + team.id.charCodeAt(1);

  return (
    <div
      style={{
        width, height, display: "flex", flexDirection: "column",
        backgroundImage: `linear-gradient(180deg, ${bgTop} 0%, ${bgBot} 62%)`,
        fontFamily: "Pretendard", position: "relative",
      }}
    >
      {/* 배경 야구공 모티프 */}
      <img src={ballsBg(width, height, seed)} width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: `0 ${pad}px`, justifyContent: "center" }}>
        {/* 헤더: 마스코트 뱃지 + 팀명 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 * s }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 176 * s, height: 176 * s, borderRadius: 999, background: "#ffffff",
              border: `${6 * s}px solid ${accent}`, boxShadow: `0 ${10 * s}px ${28 * s}px rgba(0,0,0,0.12)`,
              marginBottom: 20 * s,
            }}
          >
            <img src={mascotDataUri(team)} width={128 * s} height={128 * s} />
          </div>
          <div style={{ display: "flex", color: ink, fontSize: 58 * s, fontWeight: 800, letterSpacing: -1 }}>{team.name}</div>
          <div
            style={{
              display: "flex", alignItems: "center", marginTop: 14 * s,
              padding: `${8 * s}px ${22 * s}px`, borderRadius: 999, background: "#ffffff",
              boxShadow: `0 ${4 * s}px ${14 * s}px rgba(0,0,0,0.08)`,
              fontSize: 26 * s, fontWeight: 700, color: accent, letterSpacing: 2,
            }}
          >
            {year} · {String(month).padStart(2, "0")}
          </div>
        </div>

        {/* 달력 카드 */}
        <div
          style={{
            display: "flex", flexDirection: "column", background: cardBg,
            borderRadius: 40 * s, padding: `${26 * s}px ${22 * s}px`,
            boxShadow: `0 ${16 * s}px ${44 * s}px rgba(0,0,0,0.10)`,
          }}
        >
          {/* 요일 알약 */}
          <div style={{ display: "flex", marginBottom: 10 * s }}>
            {WEEK_KO.map((w, i) => (
              <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center" }}>
                <div style={{ display: "flex", fontSize: 22 * s, fontWeight: 700, color: weekdayColor(i, sub) }}>{w}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex" }}>
                {week.map((cell, di) => {
                  const today = isToday(cell, todayISO, year, month);
                  const g = cell.game && cell.inMonth;
                  let fill = "transparent", numInk = cell.inMonth ? ink : "rgba(58,51,48,0.28)", chipInk = sub;
                  if (g) {
                    if (cell.outcome === "win") { fill = winBg; numInk = winInk; chipInk = winInk; }
                    else if (cell.outcome === "lose") { fill = loseBg; numInk = loseInk; chipInk = loseInk; }
                    else { fill = schedBg; numInk = schedInk; chipInk = schedInk; }
                  }
                  return (
                    <div key={di} style={{ display: "flex", flex: 1, padding: 3 * s }}>
                      <div
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          width: "100%", height: 92 * s, gap: 3 * s, borderRadius: 22 * s,
                          background: today ? accent : fill,
                        }}
                      >
                        <div style={{ display: "flex", fontSize: 26 * s, fontWeight: 800, color: today ? "#fff" : numInk }}>{cell.day}</div>
                        <div style={{ display: "flex", height: 16 * s, fontSize: 13 * s, fontWeight: 700, color: today ? "rgba(255,255,255,0.9)" : chipInk }}>
                          {g ? `${cell.isHome ? "vs" : "@"}${cell.opponent?.short ?? ""}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 하단 슬로건 */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 22 * s, fontSize: 20 * s, fontWeight: 700, letterSpacing: 3, color: sub }}>
          {team.slogan}
        </div>
      </div>
    </div>
  );
}
