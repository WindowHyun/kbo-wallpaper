// CUTE · 아기자기(둥근 손그림) 스타일 — 어두운 배경 + 둥근 손그림풍 셀.
// next/og(Satori) 제약: 인라인 스타일 + flex 만, borderRadius/boxShadow 지원.
import React from "react";
import { RenderProps, buildMatrix, DayCell, WEEK_KO, weekdayColor, chipColor } from "./common";
import { mascotDataUri } from "../mascots";

function isToday(cell: DayCell, todayISO: string, year: number, month: number): boolean {
  if (!cell.inMonth) return false;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
  return iso === todayISO;
}

export function Cute(props: RenderProps) {
  const { team, year, month, games, todayISO, width, height } = props;
  const s = width / 1170;
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 44 * s;

  const accent = team.primary === "#000000" ? "#EB1C24" : team.primary;
  const fg = "#f3efe8";
  const sub = "rgba(243,239,232,0.5)";

  // 승=짙은 초록 / 패=짙은 마룬 채움
  const winBg = "#14331f", winBd = "rgba(124,255,178,0.35)";
  const loseBg = "#36161b", loseBd = "rgba(255,138,150,0.30)";
  const restBd = "rgba(243,239,232,0.14)";

  return (
    <div
      style={{
        width, height, display: "flex", flexDirection: "column", justifyContent: "center",
        // 어두운 배경 (상단에 팀색 살짝)
        backgroundImage: `linear-gradient(180deg, #0d0d10 0%, #0a0a0c 42%)`,
        fontFamily: "Nanum Pen Script, Pretendard", padding: `0 ${pad}px`,
      }}
    >
      {/* 헤더: 마스코트 + 팀명 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 30 * s }}>
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 150 * s, height: 150 * s, borderRadius: 999, background: "rgba(255,255,255,0.04)",
            border: `${4 * s}px solid ${accent}`, marginBottom: 16 * s,
          }}
        >
          <img src={mascotDataUri(team)} width={112 * s} height={112 * s} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", color: fg, fontSize: 54 * s, fontWeight: 800, letterSpacing: -1 }}>{team.name}</div>
          <div style={{ display: "flex", width: 11 * s, height: 11 * s, borderRadius: 999, background: accent, marginLeft: 11 * s }} />
        </div>
        <div style={{ display: "flex", fontSize: 24 * s, letterSpacing: 6, color: sub, marginTop: 10 * s }}>
          {year} · {String(month).padStart(2, "0")}
        </div>
      </div>

      {/* 요일 */}
      <div style={{ display: "flex", marginBottom: 6 * s }}>
        {WEEK_KO.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 21 * s, fontWeight: 600, color: weekdayColor(i, sub) }}>{w}</div>
        ))}
      </div>

      {/* 달력 — 셀이 어두운 배경 위에 바로 떠 있음 */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex" }}>
            {week.map((cell, di) => {
              const today = isToday(cell, todayISO, year, month);
              const g = cell.game && cell.inMonth;
              const win = cell.outcome === "win";
              const lose = cell.outcome === "lose";
              // 손그림 느낌: 셀마다 살짝 다른 둥근 모서리
              const rad = `${(18 + ((cell.day * 5) % 7)) * s}px ${(22 - ((cell.day * 3) % 6)) * s}px ${(19 + ((cell.day * 7) % 5)) * s}px ${(21 - ((cell.day * 2) % 7)) * s}px`;
              const fillBg = g ? (win ? winBg : lose ? loseBg : "transparent") : "transparent";
              const bd = g ? (win ? winBd : lose ? loseBd : restBd) : (cell.inMonth ? restBd : "transparent");
              const oppColor = cell.opponent ? chipColor(cell.opponent.id) : accent;
              const numColor = today ? "#ff5a5a" : !cell.inMonth ? "rgba(243,239,232,0.22)" : fg;
              return (
                <div key={di} style={{ display: "flex", flex: 1, padding: 4 * s }}>
                  <div
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      position: "relative", width: "100%", height: 118 * s, gap: 3 * s,
                      borderRadius: rad, background: fillBg,
                      border: `${1.6 * s}px solid ${today ? "#ff5a5a" : bd}`,
                    }}
                  >
                    {/* 상단 상대팀 컬러 아치(캡) */}
                    {g && (
                      <div style={{ display: "flex", position: "absolute", top: 7 * s, width: 30 * s, height: 4 * s, borderRadius: 999, background: oppColor }} />
                    )}
                    {/* 상대팀 라벨 */}
                    <div style={{ display: "flex", height: 15 * s, fontSize: 12.5 * s, fontWeight: 700, color: g ? "rgba(243,239,232,0.82)" : "transparent", marginTop: g ? 8 * s : 0 }}>
                      {g ? `${cell.isHome ? "vs" : "@"}${cell.opponent?.short ?? ""}` : ""}
                    </div>
                    <div style={{ display: "flex", fontSize: 27 * s, fontWeight: 700, color: numColor }}>{cell.day}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 하단 출처 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 22 * s, fontSize: 16 * s, letterSpacing: 4, color: "rgba(243,239,232,0.3)" }}>
        data : kbo
      </div>
    </div>
  );
}
