// BENTO 대시보드: 전적·다음경기·홈원정·미니캘린더·진행바 카드
import React from "react";
import { RenderProps, buildMatrix, chipColor, EN_MONTH_SHORT, WEEK_KO } from "./common";

function Label({ children, s, color }: { children: React.ReactNode; s: number; color: string }) {
  return <div style={{ display: "flex", fontSize: 16 * s, letterSpacing: 3, color, fontWeight: 600 }}>{children}</div>;
}

export function Bento(props: RenderProps) {
  const { team, year, month, games, season, todayISO, mode, width, height } = props;
  const s = width / 1170;
  const pad = 40 * s;
  const accent = team.primary === "#000000" ? "#EB1C24" : team.primary;
  const light = mode === "light";
  const PAGE = light ? "#eceef2" : "#0a0a0c";
  const CARD = light ? "#ffffff" : "#15161c";
  const FG = light ? "#16181d" : "#ffffff";
  const LABEL = light ? "rgba(22,24,29,0.45)" : "rgba(255,255,255,0.4)";
  const TRACK = light ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.12)";
  const rec = season?.record ?? { w: 0, l: 0, d: 0, pct: 0 };
  const pctStr = "." + String(Math.round(rec.pct * 1000)).padStart(3, "0");

  const homeN = games.filter((g) => g.home?.id === team.id).length;
  const awayN = games.length - homeN;
  const homeFrac = homeN + awayN > 0 ? homeN / (homeN + awayN) : 0.5;

  const next = season?.games.find((g) => g.outcome === "scheduled" && g.game.date >= todayISO);
  const weeks = buildMatrix(year, month, games, team.id);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const todayDay = todayISO.startsWith(`${year}-${String(month).padStart(2, "0")}`) ? Number(todayISO.slice(8, 10)) : daysInMonth;
  const prog = Math.min(1, todayDay / daysInMonth);

  const cardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: "flex", flexDirection: "column", background: CARD, borderRadius: 22 * s, padding: 26 * s, ...extra,
  });

  // 미니 캘린더 카드 높이를 고정 → 전체 스택을 세로 중앙 배치
  const calCardH = (width - pad * 2) * 0.92;

  return (
    <div style={{ width, height, display: "flex", flexDirection: "column", justifyContent: "center", background: PAGE, fontFamily: "Pretendard", padding: `0 ${pad}px`, color: FG }}>

      {/* 팀 + 전적 */}
      <div style={{ display: "flex", gap: 16 * s, marginBottom: 16 * s }}>
        <div style={cardStyle({ flex: 1.5, justifyContent: "space-between" })}>
          <Label s={s} color={LABEL}>TEAM</Label>
          <div style={{ display: "flex", alignItems: "center", margin: `${10 * s}px 0` }}>
            <div style={{ display: "flex", width: 14 * s, height: 14 * s, borderRadius: 8, background: accent, marginRight: 12 * s }} />
            <div style={{ display: "flex", fontSize: 40 * s, fontWeight: 800 }}>{team.name}</div>
          </div>
          <Label s={s} color={LABEL}>KBO LEAGUE · {year}</Label>
        </div>
        <div style={cardStyle({ flex: 1, justifyContent: "space-between" })}>
          <Label s={s} color={LABEL}>RECORD</Label>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 50 * s, fontWeight: 800, color: accent }}>{rec.w}</div>
            <div style={{ display: "flex", fontSize: 20 * s, color: LABEL, margin: `0 ${10 * s}px 0 ${4 * s}px` }}>W</div>
            <div style={{ display: "flex", fontSize: 50 * s, fontWeight: 800 }}>{rec.l}</div>
            <div style={{ display: "flex", fontSize: 20 * s, color: LABEL, marginLeft: 4 * s }}>L</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 24 * s, fontWeight: 700 }}>{pctStr}</div>
            <div style={{ display: "flex", fontSize: 15 * s, color: LABEL, letterSpacing: 2, marginLeft: 8 * s }}>WIN RATE</div>
          </div>
        </div>
      </div>

      {/* 다음경기 + 홈/원정 */}
      <div style={{ display: "flex", gap: 16 * s, marginBottom: 16 * s }}>
        <div style={cardStyle({ flex: 1, justifyContent: "space-between" })}>
          <Label s={s} color={LABEL}>NEXT GAME</Label>
          {next ? (
            <>
              <div style={{ display: "flex", alignItems: "center", fontSize: 36 * s, fontWeight: 800, color: chipColor(next.isHome ? (next.game.away?.id ?? "") : (next.game.home?.id ?? "")) }}>
                <span style={{ fontSize: 20 * s, opacity: 0.7, marginRight: 6 * s }}>{next.isHome ? "vs" : "@"}</span>
                {(next.isHome ? next.game.away : next.game.home)?.short}
              </div>
              <div style={{ display: "flex", fontSize: 18 * s, color: light ? "rgba(22,24,29,0.6)" : "rgba(255,255,255,0.7)" }}>
                {next.game.month}.{String(next.game.day).padStart(2, "0")} · {next.game.weekday} · {next.game.time}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", fontSize: 26 * s, color: LABEL }}>일정 없음</div>
          )}
          <div />
        </div>
        <div style={cardStyle({ flex: 1, justifyContent: "space-between" })}>
          <Label s={s} color={LABEL}>HOME / AWAY</Label>
          <div style={{ display: "flex", width: "100%", height: 12 * s, borderRadius: 6, background: TRACK, margin: `${14 * s}px 0` }}>
            <div style={{ display: "flex", width: `${homeFrac * 100}%`, background: accent, borderRadius: 6 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 18 * s }}><b style={{ color: accent, marginRight: 6 }}>{homeN}</b><span style={{ color: LABEL }}>HOME</span></div>
            <div style={{ display: "flex", fontSize: 18 * s }}><span style={{ color: LABEL, marginRight: 6 }}>AWAY</span><b>{awayN}</b></div>
          </div>
        </div>
      </div>

      {/* 미니 캘린더 */}
      <div style={cardStyle({ height: calCardH, marginBottom: 16 * s })}>
        <div style={{ display: "flex", marginBottom: 6 * s }}>
          {WEEK_KO.map((w, i) => (
            <div key={i} style={{ display: "flex", flex: 1, justifyContent: "center", fontSize: 14 * s, color: i === 0 ? "#ff6b6b" : i === 6 ? "#7fb0ff" : LABEL }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flex: 1 }}>
              {week.map((cell, di) => {
                const today = todayISO === `${year}-${String(month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}` && cell.inMonth;
                const c = cell.opponent ? chipColor(cell.opponent.id) : null;
                return (
                  <div key={di} style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3 * s }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40 * s, height: 40 * s, borderRadius: 10 * s, border: today ? `2px solid ${accent}` : "2px solid transparent", color: !cell.inMonth ? (light ? "rgba(22,24,29,0.3)" : "rgba(255,255,255,0.25)") : FG, fontSize: 18 * s, fontWeight: 600 }}>
                      {cell.day}
                      {c && cell.inMonth && (
                        <div style={{ display: "flex", position: "absolute", width: 8 * s, height: 8 * s, borderRadius: 2, background: c, transform: `translate(${13 * s}px, ${-13 * s}px)`, border: cell.isHome ? "none" : `1px solid ${c}`, ...(cell.isHome ? {} : { background: "transparent" }) }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 진행바 */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 * s }}>
          <div style={{ display: "flex", fontSize: 18 * s, fontWeight: 700, letterSpacing: 1 }}>{EN_MONTH_SHORT[month - 1]} {year}</div>
          <Label s={s} color={LABEL}>DAY {todayDay} OF {daysInMonth}</Label>
        </div>
        <div style={{ display: "flex", width: "100%", height: 10 * s, borderRadius: 5, background: TRACK }}>
          <div style={{ display: "flex", width: `${prog * 100}%`, background: accent, borderRadius: 5 }} />
        </div>
      </div>
    </div>
  );
}
