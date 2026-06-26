// 팀별 다가오는 경기 일정을 JSON 으로 제공한다 (WallSync 앱의 경기 알림 예약용).
// GET /api/schedule?team=DOOSAN[&months=2]
//   team   : 구단 (id/en/short/한글명 — resolveTeam 과 동일)
//   months : 현재 달부터 가져올 개월 수 (기본 2, 최대 3) — 월말 경계 알림 누락 방지
import { NextRequest } from "next/server";
import { getSchedule, filterTeamGames } from "@/lib/kbo";
import { resolveTeam } from "@/lib/teams";

export const runtime = "nodejs";

function nowKST(): { year: number; month: number; iso: string } {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { year, month, iso };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const team = resolveTeam(sp.get("team"));
  if (!team) {
    return Response.json({ error: "team 파라미터가 필요합니다 (예: ?team=KIA)" }, { status: 400, headers: CORS });
  }

  const monthsRaw = Number(sp.get("months"));
  const months = Math.min(3, Math.max(1, Number.isFinite(monthsRaw) && monthsRaw ? monthsRaw : 2));

  const cur = nowKST();
  // 현재 달부터 months 개월의 (year, month) 목록
  const periods = Array.from({ length: months }, (_, i) => {
    const m0 = cur.month - 1 + i;
    return { year: cur.year + Math.floor(m0 / 12), month: (m0 % 12) + 1 };
  });

  try {
    const perMonth = await Promise.all(
      periods.map(async (p) => filterTeamGames(await getSchedule({ ...p, teamId: team.id }), team.id))
    );
    const all = perMonth.flat();

    // 다가오는 경기만: 오늘 이후 + 취소 아님 + 시각 존재
    const upcoming = all
      .filter((g) => g.date >= cur.iso && g.status !== "canceled" && /^\d{1,2}:\d{2}$/.test(g.time))
      .map((g) => ({
        date: g.date,
        time: g.time,
        weekday: g.weekday,
        home: g.isHome ?? g.home?.id === team.id,
        opponentId: g.opponent?.id ?? "",
        opponent: g.opponent?.short ?? (g.isHome ? g.awayName : g.homeName),
        opponentEn: g.opponent?.en ?? "",
        stadium: g.stadium,
        status: g.status,
      }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    return Response.json(
      { team: { id: team.id, en: team.en, short: team.short, name: team.name }, generatedAt: cur.iso, count: upcoming.length, games: upcoming },
      { headers: { ...CORS, "Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" } }
    );
  } catch (e) {
    return Response.json({ error: `KBO 일정을 불러오지 못했습니다: ${(e as Error).message}` }, { status: 502, headers: CORS });
  }
}
