// KPOP-CARD 포토카드: 홀로그램 테두리 + 반짝이 + 큰 이니셜 + 하단 달력
import React from "react";
import { RenderProps, buildMatrix, chipColor, EN_MONTH_SHORT, WEEK_KO } from "./common";

function confetti(w: number, h: number): React.ReactNode[] {
  const colors = ["#ffd54a", "#4ad6ff", "#ff6bd6", "#7CFFB2", "#ffae42", "#a78bfa"];
  const out: React.ReactNode[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 34; i++) {
    const x = rnd() * w, y = rnd() * h, sz = 4 + rnd() * 7;
    const cross = rnd() > 0.6;
    out.push(
      <div key={i} style={{ display: "flex", position: "absolute", left: x, top: y, width: sz, height: cross ? 2 : sz, background: colors[i % colors.length], borderRadius: cross ? 1 : sz, opacity: 0.85 }} />
    );
  }
  return out;
}

export function Kpop(props: RenderProps) {
  const { team, year, month, games, todayISO, width, height } = props;
  const s = width / 1170;
  const pad = 34 * s;
  const accent = team.primary === "#000000" ? "#EB1C24" : team.primary;
  const weeks = buildMatrix(year, month, games, team.id);
  const cardW = width - pad * 2;
  const cardH = height * 0.42;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: "#101013", fontFamily: "Pretendard", padding: `${height * 0.05}px ${pad}px ${pad}px`, color: "#fff" }}>
      {/* 홀로그램 테두리 */}
      <div style={{ display: "flex", padding: 5 * s, borderRadius: 28 * s, background: "linear-gradient(125deg,#ff5e7e,#ffd24a,#7CFFB2,#4ad6ff,#a78bfa,#ff5e7e)" }}>
        <div style={{ display: "flex", flexDirection: "column", position: "relative", width: cardW - 10 * s, height: cardH, borderRadius: 24 * s, overflow: "hidden", background: `linear-gradient(150deg, ${accent}, ${team.secondary === "#06141F" || team.secondary === "#000000" ? "#1a1a24" : team.secondary})` }}>
          {confetti(cardW, cardH)}
          <div style={{ display: "flex", justifyContent: "space-between", padding: `${18 * s}px ${22 * s}px 0`, position: "relative" }}>
            <div style={{ display: "flex", fontSize: 13 * s, letterSpacing: 2, color: "rgba(255,255,255,0.7)" }}>OFFICIAL PHOTOCARD</div>
            <div style={{ display: "flex", fontSize: 13 * s, letterSpacing: 2, color: "rgba(255,255,255,0.7)" }}>{EN_MONTH_SHORT[month - 1]} · {year}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ display: "flex", fontSize: 22 * s, fontWeight: 700, letterSpacing: 3, marginBottom: 4 * s }}>{team.name}</div>
            <div style={{ display: "flex", fontSize: 150 * s, fontWeight: 800, lineHeight: 0.9 }}>{team.short}</div>
            <div style={{ display: "flex", fontSize: 20 * s, letterSpacing: 8, color: "rgba(255,255,255,0.8)", marginTop: 6 * s }}>{team.en}</div>
          </div>
        </div>
      </div>

      {/* 하단 달력 */}
      <div style={{ display: "flex", marginTop: 20 * s }}>
        {WEEK_KO.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 16 * s, color: i === 0 ? "#ff6b6b" : i === 6 ? "#7fb0ff" : "rgba(255,255,255,0.5)" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: 6 * s }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flex: 1 }}>
            {week.map((cell, di) => {
              const today = todayISO === `${year}-${String(month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}` && cell.inMonth;
              const c = cell.opponent ? chipColor(cell.opponent.id) : null;
              const dot = cell.outcome === "win" ? "#36c46b" : cell.outcome === "lose" ? "#ff5a5a" : null;
              return (
                <div key={di} style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", gap: 3 * s, margin: 2 * s, borderRadius: 8 * s, border: today ? `1.5px solid ${accent}` : "1px solid rgba(255,255,255,0.06)", background: c && cell.inMonth ? "rgba(255,255,255,0.03)" : "transparent", padding: `${5 * s}px 0` }}>
                  {c && cell.inMonth ? (
                    <div style={{ display: "flex", fontSize: 10 * s, fontWeight: 700, color: c }}>{cell.isHome ? "" : "@"}{cell.opponent?.short}</div>
                  ) : <div style={{ display: "flex", height: 12 * s }} />}
                  <div style={{ display: "flex", fontSize: 18 * s, fontWeight: 700, color: today ? accent : !cell.inMonth ? "rgba(255,255,255,0.3)" : "#fff" }}>{cell.day}</div>
                  <div style={{ display: "flex", width: 6 * s, height: 6 * s, borderRadius: 4, background: dot ?? "transparent" }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
