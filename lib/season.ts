// 시즌 전체(전 월) 일정을 모아 팀 기준 승/패/무·전적을 계산한다.
// bento, grass, dots, diamond 스타일이 사용한다.

import { getSchedule, isOngoingPeriod, Game } from "./kbo";

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

// 한 달치 조회. 일시적 오류에 대비해 1회 재시도하고, 그래도 실패하면 던진다.
// 실패를 빈 배열로 삼키면 승·패·전적이 틀린 이미지가 캐시되므로 반드시 표면화한다.
async function fetchMonth(year: number, month: number, teamId: string): Promise<Game[]> {
  const fresh = isOngoingPeriod(year, month);
  try {
    return await getSchedule({ year, month, teamId, fresh });
  } catch {
    try {
      return await getSchedule({ year, month, teamId, fresh });
    } catch (e) {
      throw new Error(`${month}월 일정 조회 실패 (${(e as Error).message})`);
    }
  }
}

export async function getSeason(year: number, teamId: string): Promise<SeasonData> {
  // 한 월이라도 실패하면 fetchMonth 가 던진다 → 틀린 전적을 조용히 렌더하지 않고 표면화한다.
  const monthResults = await Promise.all(
    SEASON_MONTHS.map((m) => fetchMonth(year, m, teamId))
  );

  const seen = new Set<string>();
  const games: SeasonGame[] = [];
  for (const month of monthResults) {
    for (const g of month) {
      if (g.away?.id !== teamId && g.home?.id !== teamId) continue;
      // gameId 가 없는(미래) 더블헤더 2차전이 사라지지 않도록 시각까지 키에 포함한다.
      const key = g.gameId || `${g.date}-${g.awayName}-${g.homeName}-${g.time}`;
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
