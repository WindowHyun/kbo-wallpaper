// 캘린더 계열 스타일: minimal, mascot, brutal, nighter, led
import React from "react";
import {
  RenderProps, buildMatrix, DayCell, Chip, chipColor, ENGLISH_MONTHS, EN_MONTH_SHORT,
  WEEK_KO, WEEK_EN, weekdayColor, calTheme,
} from "./common";
import { mascotDataUri } from "../mascots";

function isToday(cell: DayCell, todayISO: string, year: number, month: number): boolean {
  if (!cell.inMonth) return false;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
  return iso === todayISO;
}

/* ── MINIMAL / MASCOT ─────────────────────────────────────────── */
function MinimalBase(props: RenderProps, withMascot: boolean) {
  const { team, year, month, games, todayISO, mode, width, height } = props;
  const s = width / 1170;
  const t = calTheme(mode);
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 40 * s;
  const accent = team.primary === "#000000" ? "#EB1C24" : team.primary;
  const cellW = (width - pad * 2) / 7;
  const rowH = cellW * 1.2; // 셀 고정 높이 → 격자가 아래로 늘어나지 않음

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "center", background: t.bg, fontFamily: "Pretendard", padding: `0 ${pad}px` }}>
      {withMascot && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 * s }}>
          <img src={mascotDataUri(team)} width={150 * s} height={150 * s} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", width: 34 * s, height: 3 * s, background: accent, marginBottom: 16 * s, borderRadius: 2 }} />
        <div style={{ display: "flex", color: t.fg, fontSize: 62 * s, fontWeight: 800, letterSpacing: 2 }}>{team.name}</div>
        <div style={{ display: "flex", color: t.sub, fontSize: 30 * s, letterSpacing: 6, marginTop: 12 * s }}>
          {year} · {String(month).padStart(2, "0")}
        </div>
      </div>
      <div style={{ display: "flex", height: 1, background: t.line, margin: `${28 * s}px 0 ${14 * s}px` }} />
      <div style={{ display: "flex" }}>
        {WEEK_KO.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 26 * s, fontWeight: 600, color: weekdayColor(i, t.sub) }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", paddingTop: 10 * s }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", height: rowH, marginBottom: 8 * s }}>
            {week.map((cell, di) => {
              const today = isToday(cell, todayISO, year, month);
              let bg = "transparent", bd = "1px solid transparent";
              if (cell.game && cell.inMonth) {
                if (cell.outcome === "win") { bg = t.winBg; bd = `1px solid ${t.winBd}`; }
                else if (cell.outcome === "lose") { bg = t.loseBg; bd = `1px solid ${t.loseBd}`; }
                else { bd = `1px solid ${t.cellLine}`; }
              }
              const dim = !cell.inMonth ? 0.4 : cell.outcome === "lose" ? 0.8 : 1;
              const numColor = today ? "#ff4d4d" : !cell.inMonth ? t.faint : t.fg;
              return (
                <div key={di} style={{ display: "flex", flex: 1, margin: 3 * s }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 * s, width: "100%", height: "100%", borderRadius: 9 * s, background: bg, border: bd, opacity: dim, padding: `${6 * s}px 0` }}>
                    {cell.game && cell.inMonth && <Chip cell={cell} scale={s * 0.92} />}
                    <div style={{ display: "flex", fontSize: 30 * s, fontWeight: 700, color: numColor, ...(today ? { borderBottom: `${2.5 * s}px solid #ff4d4d` } : {}) }}>{cell.day}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
export const Minimal = (p: RenderProps) => MinimalBase(p, false);
export const Mascot = (p: RenderProps) => MinimalBase(p, true);

/* ── SKETCH (손그림) ──────────────────────────────────────────────
   CSS 보더(반듯한 도형) 대신 SVG 펜선으로 삐뚤빼뚤하게 그린 진짜 손그림.
   밝게=노트 종이 / 어둡게=잉크. 손글씨 글꼴(Nanum Pen Script) 사용. */

// 시드 난수 (결정적 — resume/재렌더 시 동일)
function sketchRng(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 손그림 둥근 사각형 path (모서리·변에 미세 지터)
function roughRectPath(x: number, y: number, w: number, h: number, seed: number): string {
  const rnd = sketchRng(seed);
  const jit = Math.min(w, h) * 0.035;
  const j = () => (rnd() * 2 - 1) * jit;
  const r = Math.min(w, h) * 0.18;
  const x0 = x, y0 = y, x1 = x + w, y1 = y + h;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return (
    `M ${x0 + r + j()} ${y0 + j()} ` +
    `Q ${mx + j()} ${y0 + j()} ${x1 - r + j()} ${y0 + j()} ` +
    `Q ${x1 + j()} ${y0 + j()} ${x1 + j()} ${y0 + r + j()} ` +
    `Q ${x1 + j()} ${my + j()} ${x1 + j()} ${y1 - r + j()} ` +
    `Q ${x1 + j()} ${y1 + j()} ${x1 - r + j()} ${y1 + j()} ` +
    `Q ${mx + j()} ${y1 + j()} ${x0 + r + j()} ${y1 + j()} ` +
    `Q ${x0 + j()} ${y1 + j()} ${x0 + j()} ${y1 - r + j()} ` +
    `Q ${x0 + j()} ${my + j()} ${x0 + j()} ${y0 + r + j()} ` +
    `Q ${x0 + j()} ${y0 + j()} ${x0 + r + j()} ${y0 + j()} Z`
  );
}
// 손그림 동그라미 (한 바퀴 살짝 넘겨 그리는 느낌)
function roughCirclePath(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const rnd = sketchRng(seed);
  const j = () => (rnd() * 2 - 1) * Math.min(rx, ry) * 0.08;
  const pts: string[] = [];
  const n = 10;
  for (let i = 0; i <= n + 2; i++) {
    const a = -0.3 + (i / n) * Math.PI * 2;
    pts.push(`${i === 0 ? "M" : "L"} ${(cx + Math.cos(a) * (rx + j())).toFixed(1)} ${(cy + Math.sin(a) * (ry + j())).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function Sketch(props: RenderProps) {
  const { team, year, month, games, todayISO, mode, width: W, height: H } = props;
  const s = W / 1170;
  const light = mode === "light";
  const accent = team.primary === "#000000" ? "#EB1C24" : team.primary;
  const ink = light ? "#2b2a26" : "#f3efe6";
  const sub = light ? "rgba(43,42,38,0.5)" : "rgba(243,239,230,0.5)";
  const faint = light ? "rgba(43,42,38,0.22)" : "rgba(243,239,230,0.18)";
  const winC = light ? "#1f7a44" : "#7CFFB2";
  const loseC = light ? "#cf5a5a" : "#ff8f9a";
  const weeks = buildMatrix(year, month, games, team.id);

  const pad = 60 * s;
  const gridX = pad, gridW = W - pad * 2, cellW = gridW / 7;
  const rows = weeks.length;
  const rowH = cellW * 1.18;
  const gridH = rows * rowH;
  const headerH = 150 * s, weekdayH = 50 * s;
  const block = headerH + 14 * s + weekdayH + gridH;
  const top = (H - block) / 2;
  const weekdayTop = top + headerH + 14 * s;
  const gridY = weekdayTop + weekdayH;
  const sw = 2.4 * s, inset = 9 * s;

  // 배경
  const bgInner = light
    ? (() => {
        const lines: string[] = [];
        for (let y = 0; y < H; y += 70) lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(90,120,170,0.08)" stroke-width="1"/>`);
        return `<rect width="${W}" height="${H}" fill="#fbf6ea"/>${lines.join("")}`;
      })()
    : `<rect width="${W}" height="${H}" fill="#0c0c0e"/>`;

  // 셀 외곽선 / 채움 / 오늘 동그라미 (SVG 펜선)
  const paths: string[] = [];
  weeks.forEach((week, r) => {
    week.forEach((cell, c) => {
      const x = gridX + c * cellW + inset, y = gridY + r * rowH + inset;
      const w = cellW - inset * 2, h = rowH - inset * 2;
      const cx = gridX + c * cellW + cellW / 2, cy = gridY + r * rowH + rowH / 2;
      const seed = (cell.day + 1) * (c + 3) * (r + 5) + month * 17;
      const g = cell.game && cell.inMonth;
      const today = isToday(cell, todayISO, year, month);
      if (g) {
        const win = cell.outcome === "win", lose = cell.outcome === "lose";
        const oppC = cell.opponent ? chipColor(cell.opponent.id) : ink;
        const stroke = win ? winC : lose ? loseC : oppC;
        const d = roughRectPath(x, y, w, h, seed);
        if (win || lose) paths.push(`<path d="${d}" fill="${stroke}" fill-opacity="0.15" stroke="none"/>`);
        paths.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>`);
        paths.push(`<path d="${roughRectPath(x, y, w, h, seed + 7)}" fill="none" stroke="${stroke}" stroke-width="${sw * 0.7}" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>`);
      } else if (cell.inMonth) {
        paths.push(`<path d="${roughRectPath(x, y, w, h, seed)}" fill="none" stroke="${faint}" stroke-width="${sw * 0.8}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${6 * s} ${7 * s}"/>`);
      }
      if (today) paths.push(`<path d="${roughCirclePath(cx, cy, w * 0.62, h * 0.6, seed + 99)}" fill="none" stroke="#e23b3b" stroke-width="${sw * 1.15}" stroke-linecap="round"/>`);
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${bgInner}${paths.join("")}</svg>`;
  const bgUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  // 손글씨 텍스트 오버레이 (셀마다 절대배치)
  const nodes: React.ReactNode[] = [];
  weeks.forEach((week, r) => {
    week.forEach((cell, c) => {
      const left = gridX + c * cellW, t2 = gridY + r * rowH;
      const g = cell.game && cell.inMonth;
      const today = isToday(cell, todayISO, year, month);
      const win = cell.outcome === "win", lose = cell.outcome === "lose";
      const numColor = today ? "#e23b3b" : !cell.inMonth ? faint : ink;
      const lblColor = win ? winC : lose ? loseC : cell.opponent ? chipColor(cell.opponent.id) : sub;
      nodes.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", left, top: t2, width: cellW, height: rowH, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", height: 20 * s, fontSize: 18 * s, color: g ? lblColor : "transparent" }}>{g ? `${cell.isHome ? "vs" : "@"}${cell.opponent?.short ?? ""}` : ""}</div>
          <div style={{ display: "flex", fontSize: 36 * s, color: numColor }}>{cell.day}</div>
        </div>
      );
    });
  });

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", fontFamily: "Nanum Pen Script, Pretendard", color: ink }}>
      <img src={bgUri} width={W} height={H} style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ position: "absolute", left: pad, top, width: gridW, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 76 * s }}>{team.name}</div>
          <div style={{ display: "flex", width: 14 * s, height: 14 * s, borderRadius: 999, background: accent, marginLeft: 12 * s }} />
        </div>
        <div style={{ display: "flex", fontSize: 34 * s, color: sub, marginTop: 2 * s }}>{year}. {String(month).padStart(2, "0")}</div>
      </div>
      {WEEK_KO.map((w, i) => (
        <div key={i} style={{ position: "absolute", top: weekdayTop, left: gridX + i * cellW, width: cellW, height: weekdayH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27 * s, color: i === 0 ? "#d05a5a" : i === 6 ? "#5a7fd0" : sub }}>{w}</div>
      ))}
      {nodes}
    </div>
  );
}

/* ── NEWSPAPER (신문) ─────────────────────────────────────────── */
export function Newspaper(props: RenderProps) {
  const { team, year, month, games, todayISO, mode, width, height } = props;
  const s = width / 1170;
  const light = mode === "light";
  const bg = light ? "#efece4" : "#12110e";
  const fg = light ? "#1a1813" : "#efece4";
  const sub = light ? "rgba(26,24,19,0.5)" : "rgba(239,236,228,0.45)";
  const rule = light ? "rgba(26,24,19,0.35)" : "rgba(239,236,228,0.3)";
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 54 * s;
  const rowH = ((width - pad * 2) / 7) * 1.25;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "center", background: bg, fontFamily: "Pretendard", padding: `0 ${pad}px`, color: fg }}>
      <div style={{ display: "flex", height: 3 * s, background: fg }} />
      <div style={{ display: "flex", justifyContent: "center", fontSize: 52 * s, fontWeight: 800, letterSpacing: 1, padding: `${10 * s}px 0` }}>THE DAILY DIAMOND</div>
      <div style={{ display: "flex", height: 2 * s, background: fg, marginBottom: 6 * s }} />
      <div style={{ display: "flex", justifyContent: "center", fontSize: 16 * s, letterSpacing: 5, color: sub }}>{EN_MONTH_SHORT[month - 1]} {year} · MONTH SCHEDULE</div>
      <div style={{ display: "flex", justifyContent: "center", fontSize: 40 * s, fontWeight: 700, margin: `${22 * s}px 0 ${4 * s}px` }}>{team.name} — {EN_MONTH_SHORT[month - 1]}</div>
      <div style={{ display: "flex", height: 1, background: rule, margin: `${14 * s}px 0` }} />
      <div style={{ display: "flex" }}>
        {WEEK_EN.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 14 * s, letterSpacing: 1, color: sub }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", height: rowH, borderTop: `1px solid ${rule}` }}>
            {week.map((cell, di) => {
              const today = isToday(cell, todayISO, year, month);
              const g = cell.game && cell.inMonth;
              const wl = cell.outcome === "win" ? "W" : cell.outcome === "lose" ? "L" : "";
              const wlc = cell.outcome === "win" ? (light ? "#1f7a44" : "#7CFFB2") : "#d4555a";
              return (
                <div key={di} style={{ display: "flex", flexDirection: "column", flex: 1, padding: `${8 * s}px ${4 * s}px`, borderRight: di < 6 ? `1px solid ${rule}` : "none" }}>
                  <div style={{ display: "flex", fontSize: 26 * s, fontWeight: 700, color: today ? "#d4555a" : !cell.inMonth ? sub : fg, ...(today ? { background: light ? "rgba(212,85,90,0.12)" : "rgba(212,85,90,0.2)", paddingLeft: 4 * s, paddingRight: 4 * s, alignSelf: "flex-start" } : {}) }}>{cell.day}</div>
                  {g && (
                    <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
                      <div style={{ display: "flex", fontSize: 11 * s, color: sub }}>{cell.isHome ? "vs " : "@ "}{cell.opponent?.short}</div>
                      {wl && <div style={{ display: "flex", fontSize: 11 * s, fontWeight: 700, color: wlc }}>[{wl}]</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── BRUTAL ───────────────────────────────────────────────────── */
export function Brutal(props: RenderProps) {
  const { team, year, month, games, todayISO, width, height } = props;
  const s = width / 1170;
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 44 * s;
  const rowH = ((width - pad * 2) / 7) * 1.25; // 셀 높이 고정 → 블록 전체를 세로 중앙 배치
  const homeN = games.filter((g) => g.home?.id === team.id).length;
  const awayN = games.length - homeN;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "center", background: "#0d0d0d", fontFamily: "Pretendard", padding: `0 ${pad}px`, color: "#f2efe6" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 * s }}>
        <div style={{ display: "flex", background: "#f2efe6", color: "#0d0d0d", fontSize: 30 * s, fontWeight: 800, padding: `${8 * s}px ${18 * s}px`, letterSpacing: 1 }}>
          {EN_MONTH_SHORT[month - 1]} '{String(year).slice(2)}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 150 * s, fontWeight: 800, lineHeight: 0.92, letterSpacing: -2 }}>{team.en}</div>
      <div style={{ display: "flex", alignItems: "center", margin: `${10 * s}px 0 6px` }}>
        <div style={{ display: "flex", width: 70 * s, height: 8 * s, background: team.primary === "#000000" ? "#EB1C24" : team.primary, marginRight: 14 * s }} />
        <div style={{ display: "flex", fontSize: 22 * s, fontWeight: 700, letterSpacing: 3, color: "rgba(242,239,230,0.8)" }}>MONTHLY · {year}</div>
      </div>
      <div style={{ display: "flex", fontSize: 18 * s, letterSpacing: 2, color: "rgba(242,239,230,0.5)", marginBottom: 16 * s }}>
        HOME {homeN} · AWAY {awayN} · {games.length} GAMES
      </div>
      <div style={{ display: "flex" }}>
        {WEEK_KO.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center", height: 34 * s, fontSize: 20 * s, fontWeight: 700, background: i === 0 ? team.primary : "#1a1a1a", color: "#fff" }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", height: rowH }}>
            {week.map((cell, di) => {
              const today = isToday(cell, todayISO, year, month);
              const c = cell.opponent ? chipColor(cell.opponent.id) : "#fff";
              return (
                <div key={di} style={{ display: "flex", flexDirection: "column", flex: 1, border: "1px solid #2a2a2a", background: today ? (team.primary === "#000000" ? "#EB1C24" : team.primary) : "#0d0d0d", padding: `${6 * s}px ${6 * s}px`, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", height: 16 * s }}>
                    {cell.game && cell.inMonth && (
                      <div style={{ display: "flex", fontSize: 12 * s, fontWeight: 700, color: today ? "#fff" : c }}>
                        <span style={{ opacity: 0.65, marginRight: 3 * s }}>{cell.isHome ? "VS" : "@"}</span>{cell.opponent?.en}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", fontSize: 30 * s, fontWeight: 800, color: today ? "#fff" : !cell.inMonth ? "rgba(242,239,230,0.3)" : "#f2efe6" }}>{cell.day}</div>
                    {cell.game && cell.inMonth && (cell.outcome === "win" || cell.outcome === "lose") && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20 * s, height: 20 * s, fontSize: 13 * s, fontWeight: 800, ...(cell.outcome === "win" ? { background: "#e2042b", color: "#fff" } : { border: "1.4px solid rgba(242,239,230,0.6)", color: "rgba(242,239,230,0.85)" }) }}>
                        {cell.outcome === "win" ? "W" : "L"}
                      </div>
                    )}
                    {today && <div style={{ display: "flex", fontSize: 11 * s, fontWeight: 700, color: "#fff" }}>TODAY</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── NIGHTER ──────────────────────────────────────────────────── */
export function Nighter(props: RenderProps) {
  const { team, year, month, games, todayISO, width, height } = props;
  const s = width / 1170;
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 44 * s;
  const rowH = ((width - pad * 2) / 7) * 1.2;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "center", background: "#0f2237", fontFamily: "Pretendard", padding: `0 ${pad}px`, position: "relative", color: "#fff" }}>
      <img src={floodlightBg(width, height)} width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ display: "flex", fontSize: 58 * s, fontWeight: 800 }}>{team.name}</div>
        <div style={{ display: "flex", fontSize: 20 * s, letterSpacing: 4, color: "rgba(255,255,255,0.5)", marginTop: 8 * s }}>
          {team.en} · NIGHT GAME · {EN_MONTH_SHORT[month - 1]} {year}
        </div>
        <div style={{ display: "flex", width: 200 * s, height: 3 * s, background: "#e2042b", marginTop: 14 * s }} />
      </div>
      <div style={{ display: "flex", marginTop: 26 * s, position: "relative" }}>
        {WEEK_KO.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 22 * s, fontWeight: 600, color: weekdayColor(i, "rgba(255,255,255,0.6)") }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingTop: 8 * s }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", height: rowH }}>
            {week.map((cell, di) => {
              const today = isToday(cell, todayISO, year, month);
              const c = cell.opponent ? chipColor(cell.opponent.id) : "#fff";
              const dotColor = cell.outcome === "win" ? "#36c46b" : cell.outcome === "lose" ? "#e2042b" : null;
              return (
                <div key={di} style={{ display: "flex", flexDirection: "column", flex: 1, margin: 2 * s, border: "1px solid rgba(255,255,255,0.10)", background: cell.inMonth && cell.game ? "rgba(255,255,255,0.03)" : "transparent", padding: 7 * s, justifyContent: "space-between", position: "relative" }}>
                  <div style={{ display: "flex", height: 16 * s }}>
                    {cell.game && cell.inMonth && (
                      <div style={{ display: "flex", fontSize: 11 * s, fontWeight: 700, color: c }}>
                        <span style={{ opacity: 0.65, marginRight: 3 * s }}>{cell.isHome ? "VS" : "@"}</span>{cell.opponent?.en}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", fontSize: 28 * s, fontWeight: 700, color: today ? "#ff4d4d" : !cell.inMonth ? "rgba(255,255,255,0.3)" : "#fff" }}>{cell.day}</div>
                    {dotColor && <div style={{ display: "flex", width: 8 * s, height: 8 * s, borderRadius: 2, background: dotColor }} />}
                  </div>
                  {today && <div style={{ display: "flex", position: "absolute", right: 0, top: 0, bottom: 0, width: 4 * s, background: "#e2042b" }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", fontSize: 16 * s, letterSpacing: 3, color: "rgba(255,255,255,0.4)", position: "relative", paddingTop: 18 * s }}>FIRST PITCH 18:30 KST</div>
    </div>
  );
}
function floodlightBg(w: number, h: number): string {
  const r = Math.round(w * 0.36);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0f2237"/>
    <circle cx="${Math.round(w * 0.16)}" cy="${Math.round(-h * 0.02)}" r="${r}" fill="#6c7a4e" opacity="0.45"/>
    <circle cx="${Math.round(w * 0.84)}" cy="${Math.round(-h * 0.02)}" r="${r}" fill="#6c7a4e" opacity="0.45"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/* ── LED 전광판 ───────────────────────────────────────────────── */
export function Led(props: RenderProps) {
  const { team, year, month, games, todayISO, width, height } = props;
  const s = width / 1170;
  const weeks = buildMatrix(year, month, games, team.id);
  const pad = 50 * s;
  const amber = "#FFB02E";
  const rowH = ((width - pad * 2) / 7) * 1.2;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "center", background: "#070707", fontFamily: "Pretendard", padding: `0 ${pad}px`, color: amber }}>
      <div style={{ display: "flex", fontSize: 74 * s, fontWeight: 800, letterSpacing: 4 }}>{team.en} {team.nickname}</div>
      <div style={{ display: "flex", fontSize: 30 * s, fontWeight: 700, letterSpacing: 3, marginTop: 6 * s }}>{EN_MONTH_SHORT[month - 1]} {year}</div>
      <div style={{ display: "flex", fontSize: 18 * s, letterSpacing: 4, color: "rgba(255,176,46,0.55)", marginTop: 4 * s, marginBottom: 18 * s }}>KBO REGULAR SEASON</div>
      <div style={{ display: "flex" }}>
        {WEEK_EN.map((w, i) => (
          <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 17 * s, fontWeight: 700, letterSpacing: 1, color: i === 0 ? "#ff5a3c" : i === 6 ? "#ffd27a" : amber, marginBottom: 8 * s }}>{w}</div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", height: rowH }}>
            {week.map((cell, di) => {
              const today = isToday(cell, todayISO, year, month);
              const wl = cell.outcome === "win" ? "W" : cell.outcome === "lose" ? "L" : "";
              const wlColor = cell.outcome === "win" ? "#36c46b" : "#ff5a3c";
              return (
                <div key={di} style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center", gap: 2 * s, margin: 2 * s, background: today ? "#e2042b" : "transparent", padding: `${6 * s}px 0` }}>
                  <div style={{ display: "flex", height: 16 * s, fontSize: 13 * s, fontWeight: 800, color: today ? "#fff" : wlColor }}>{wl}</div>
                  <div style={{ display: "flex", fontSize: 26 * s, fontWeight: 700, color: today ? "#fff" : !cell.inMonth ? "rgba(255,176,46,0.25)" : amber }}>{cell.day}</div>
                  <div style={{ display: "flex", height: 14 * s, fontSize: 11 * s, fontWeight: 700, color: today ? "#fff" : "rgba(255,176,46,0.7)" }}>{cell.game && cell.inMonth ? cell.opponent?.en?.slice(0, 4) : ""}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
