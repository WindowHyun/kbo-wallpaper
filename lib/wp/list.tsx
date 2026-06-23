// LIST: 팀 컬러 배경 리스트 (vs/원정 표기)
import React from "react";
import { RenderProps, chipColor } from "./common";
import { buildPalette } from "../presets";
import { teamOutcome } from "../season";

export function List(props: RenderProps) {
  const { team, year, month, games, width, height } = props;
  const s = width / 1170;
  const p = buildPalette("list", team.primary, team.secondary);
  const pad = 64 * s;

  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));
  const n = Math.max(sorted.length, 1);
  const topSpace = Math.round(height * 0.08);
  const headerH = Math.round(230 * s);
  const footerH = Math.round(120 * s);
  const listH = height - topSpace - headerH - footerH;
  const rowUnit = listH / n;
  const rowFont = Math.max(Math.round(22 * s), Math.min(Math.round(rowUnit * 0.5), Math.round(38 * s)));

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: `linear-gradient(160deg, ${p.bgFrom} 0%, ${p.bgTo} 100%)`, color: p.fg, fontFamily: "Pretendard", padding: `0 ${pad}px` }}>
      <div style={{ height: topSpace }} />
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 * s }}>
        <div style={{ display: "flex", fontSize: 28 * s, fontWeight: 700, color: p.accent, letterSpacing: 2 }}>KBO {year}</div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 * s }}>
          <div style={{ display: "flex", fontSize: 96 * s, fontWeight: 800, lineHeight: 1 }}>{team.short}</div>
          <div style={{ display: "flex", fontSize: 52 * s, fontWeight: 700, marginLeft: 18 * s, color: p.sub }}>{month}월</div>
        </div>
        <div style={{ display: "flex", fontSize: 26 * s, color: p.sub, marginTop: 10 * s }}>{team.name} · 월간 일정</div>
      </div>
      <div style={{ display: "flex", height: 2, background: p.line, marginBottom: 14 * s }} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {sorted.map((g, i) => {
          const { isHome, outcome } = teamOutcome(g, team.id);
          const opp = isHome ? g.away : g.home;
          const right = outcome === "canceled" ? "취소"
            : (outcome === "win" || outcome === "lose" || outcome === "draw") && g.awayScore !== null && g.homeScore !== null
              ? `${isHome ? g.homeScore : g.awayScore} : ${isHome ? g.awayScore : g.homeScore}`
              : g.time || "-";
          const rc = outcome === "win" ? p.win : outcome === "lose" ? p.lose : outcome === "draw" ? p.draw : p.sub;
          const c = opp ? chipColor(opp.id) : p.accent;
          return (
            <div key={i} style={{ display: "flex", flex: 1, alignItems: "center", opacity: outcome === "canceled" ? 0.4 : 1, borderBottom: `1px solid ${p.line}` }}>
              <div style={{ display: "flex", alignItems: "baseline", width: 150 * s }}>
                <div style={{ display: "flex", fontSize: rowFont * 0.92, fontWeight: 700 }}>{String(g.month).padStart(2, "0")}.{String(g.day).padStart(2, "0")}</div>
                <div style={{ display: "flex", fontSize: rowFont * 0.52, color: p.sub, marginLeft: 8 * s }}>{g.weekday}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: rowFont * 1.6, height: rowFont * 1.05, borderRadius: 7, marginRight: 16 * s, background: isHome ? c : "transparent", border: isHome ? "none" : `2px solid ${c}`, color: isHome ? "#fff" : c, fontSize: rowFont * 0.46, fontWeight: 800 }}>
                {isHome ? "홈" : "원정"}
              </div>
              <div style={{ display: "flex", flex: 1, fontSize: rowFont, fontWeight: 700 }}>{opp?.short ?? ""}</div>
              <div style={{ display: "flex", fontSize: rowFont, fontWeight: 800, color: rc }}>{right}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 * s, color: p.sub, paddingTop: 20 * s, paddingBottom: 40 * s }}>
        <div style={{ display: "flex" }}>데이터: KBO 공식</div>
        <div style={{ display: "flex" }}>kbo-wallpaper</div>
      </div>
    </div>
  );
}
