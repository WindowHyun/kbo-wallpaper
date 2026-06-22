// 시즌 그리드: grass(직각) / grass-soft(둥근) / dots(원) / diamond(다이아몬드)
import React from "react";
import { RenderProps, chipColor } from "./common";
import { Outcome } from "../season";

function outcomeColor(o: Outcome, win: string): { fill: string; border?: string } {
  switch (o) {
    case "win": return { fill: win };
    case "lose": return { fill: "#3d3d44" };
    case "draw": return { fill: "#5a1a22" };
    default: return { fill: "#16161b" }; // scheduled / canceled
  }
}

function Legend({ s, win }: { s: number; win: string }) {
  const item = (color: string, label: string, ring?: boolean) => (
    <div style={{ display: "flex", alignItems: "center", marginRight: 18 * s }}>
      <div style={{ display: "flex", width: 12 * s, height: 12 * s, borderRadius: 3, background: ring ? "transparent" : color, border: ring ? `1px solid ${color}` : "none", marginRight: 6 * s }} />
      <div style={{ display: "flex", fontSize: 14 * s, color: "rgba(255,255,255,0.55)", letterSpacing: 1 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingBottom: 40 * s }}>
      {item(win, "WIN")}{item("#3d3d44", "LOSS")}{item("#5a1a22", "DRAW")}{item("#2a2a30", "UPCOMING", true)}
    </div>
  );
}

function GridSeason(props: RenderProps, shape: "square" | "soft" | "circle") {
  const { team, season, width, height } = props;
  const s = width / 1170;
  const pad = 78 * s;
  const win = chipColor(team.id);
  const games = season?.games ?? [];
  const cols = 12;
  const innerW = width - pad * 2;
  const cell = innerW / cols;
  const dot = cell * 0.66;
  const radius = shape === "circle" ? dot : shape === "soft" ? dot * 0.28 : 2;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: "#0a0a0c", fontFamily: "Pretendard", padding: `0 ${pad}px`, color: "#fff" }}>
      <div style={{ height: height * 0.24 - 15 }} />
      <div style={{ display: "flex", fontSize: 84 * s, fontWeight: 800, letterSpacing: 1 }}>{team.en}</div>
      <div style={{ display: "flex", fontSize: 20 * s, letterSpacing: 4, color: "rgba(255,255,255,0.45)", marginTop: 4 * s, marginBottom: 22 * s }}>
        {team.name.split(" ").pop()?.toUpperCase()} · {props.year} SEASON
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", width: innerW, flex: 1, alignContent: "flex-start" }}>
        {games.map((sg, i) => {
          const { fill, border } = outcomeColor(sg.outcome, win);
          return (
            <div key={i} style={{ display: "flex", width: cell, height: cell, alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", width: dot, height: dot, borderRadius: radius, background: fill, border: border ? `1px solid ${border}` : "none" }} />
            </div>
          );
        })}
      </div>
      <Legend s={s} win={win} />
    </div>
  );
}

export const Grass = (p: RenderProps) => GridSeason(p, "square");
export const GrassSoft = (p: RenderProps) => GridSeason(p, "soft");
export const Dots = (p: RenderProps) => GridSeason(p, "circle");

/* ── DIAMOND ──────────────────────────────────────────────────── */
export function Diamond(props: RenderProps) {
  const { team, season, year, width, height } = props;
  const s = width / 1170;
  const win = chipColor(team.id);
  const rec = season?.record ?? { w: 0, l: 0, d: 0, pct: 0 };
  const pctStr = "." + String(Math.round(rec.pct * 1000)).padStart(3, "0");
  const games = season?.games ?? [];

  const cx = width / 2;
  const cy = height * 0.64;
  const R = width * 0.36;
  const corners = [
    { x: cx, y: cy + R, label: "HP" },     // 0 home plate (bottom)
    { x: cx + R, y: cy, label: "1B" },      // 1 right
    { x: cx, y: cy - R, label: "2B" },      // 2 top
    { x: cx - R, y: cy, label: "3B" },      // 3 left
  ];
  const order = [0, 1, 2, 3, 0];
  const n = Math.max(games.length, 1);
  const perEdge = n / 4;
  const dotR = width * 0.011;

  const dots = games.map((sg, i) => {
    let e = Math.floor(i / perEdge);
    if (e > 3) e = 3;
    const f = (i - e * perEdge) / perEdge;
    const a = corners[order[e]], b = corners[order[e + 1]];
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    const { fill, border } = outcomeColor(sg.outcome, win);
    return (
      <div key={i} style={{ display: "flex", position: "absolute", left: x - dotR, top: y - dotR, width: dotR * 2, height: dotR * 2, borderRadius: dotR * 2, background: fill, border: border ? `1px solid ${border}` : "none" }} />
    );
  });

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", background: "#0a0a0c", fontFamily: "Pretendard", color: "#fff", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 70 * s, top: height * 0.30 }}>
        <div style={{ display: "flex", fontSize: 84 * s, fontWeight: 800 }}>{team.en}</div>
        <div style={{ display: "flex", fontSize: 20 * s, letterSpacing: 4, color: "rgba(255,255,255,0.45)", marginTop: 4 * s }}>
          {team.name.split(" ").pop()?.toUpperCase()} · {year} SEASON
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 22 * s }}>
          <div style={{ display: "flex", fontSize: 15 * s, letterSpacing: 3, color: "rgba(255,255,255,0.4)" }}>RECORD</div>
          <div style={{ display: "flex", fontSize: 34 * s, fontWeight: 800, letterSpacing: 2 }}>{rec.w}-{rec.l}-{rec.d}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", position: "absolute", right: 70 * s, top: height * 0.33 }}>
        <div style={{ display: "flex", fontSize: 15 * s, letterSpacing: 3, color: "rgba(255,255,255,0.4)" }}>PCT</div>
        <div style={{ display: "flex", fontSize: 56 * s, fontWeight: 800, color: win }}>{pctStr}</div>
      </div>

      {dots}
      {corners.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", left: c.x - 16 * s, top: c.y - 16 * s, width: 32 * s, height: 32 * s, borderRadius: 20 * s, background: "#0a0a0c", border: "1.5px solid rgba(255,255,255,0.8)", fontSize: 11 * s, fontWeight: 700, color: "#fff" }}>
          {c.label}
        </div>
      ))}
    </div>
  );
}
