// 시즌 전체(전 월) 일정을 모아 팀 기준 승/패/무·전적을 계산한다.
// bento, grass, dots, diamond 스타일이 사용한다.

import { getSchedule, Game } from "./kbo";

export type Outcome = "win" | "lose" | "draw" | "scheduled" | "canceled";

export interface SeasonGame {
  game: Game;
  isHome: boolean;
  outcome: Outcome;
}

export interface SeasonData {
  games: SeasonGame[]; // 팀 경기 전체 (날짜순, 취소 제외하지 않음)
  played: SeasonGame[]; // 결과가 있는 경기 (win/lose/draw)
  record: { w: number; l: number; d: number; pct: number };
}

// KBO 정규시즌은 3~10월, 포스트시즌 ~11월. 넉넉히 3~11월을 훑는다.
const SEASON_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11];

export function teamOutcome(g: Game, teamId: string): { isHome: boolean; outcome: Outcome } {
  const isHome = g.home?.id === teamId;
  if (g.status === "canceled") return { isHome, outcome: "canceled" };
  if (g.status === "result" && g.awayScore !== null && g.homeScore !== null) {
    const my = isHome ? g.homeScore : g.awayScore;
    const op = isHome ? g.awayScore : g.homeScore;
    return { isHome, outcome: my > op ? "win" : my < op ? "lose" : "draw" };
  }
  return { isHome, outcome: "scheduled" };
}

export async function getSeason(year: number, teamId: string): Promise<SeasonData> {
  const monthResults = await Promise.all(
    SEASON_MONTHS.map((m) =>
      getSchedule({ year, month: m, teamId }).catch(() => [] as Game[])
    )
  );

  const seen = new Set<string>();
  const games: SeasonGame[] = [];
  for (const month of monthResults) {
    for (const g of month) {
      if (g.away?.id !== teamId && g.home?.id !== teamId) continue;
      const key = g.gameId || `${g.date}-${g.awayName}-${g.homeName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { isHome, outcome } = teamOutcome(g, teamId);
      games.push({ game: g, isHome, outcome });
    }
  }
  games.sort((a, b) => a.game.date.localeCompare(b.game.date));

  const played = games.filter(
    (s) => s.outcome === "win" || s.outcome === "lose" || s.outcome === "draw"
  );
  const w = played.filter((s) => s.outcome === "win").length;
  const l = played.filter((s) => s.outcome === "lose").length;
  const d = played.filter((s) => s.outcome === "draw").length;
  const pct = w + l > 0 ? w / (w + l) : 0;

  return { games, played, record: { w, l, d, pct } };
}
