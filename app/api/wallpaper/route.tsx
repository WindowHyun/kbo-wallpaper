import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSchedule, filterTeamGames } from "@/lib/kbo";
import { resolveTeam } from "@/lib/teams";
import { resolutionById, isStyleId, isMode, needsSeasonData, supportsLight } from "@/lib/presets";
import { getSeason } from "@/lib/season";
import { loadFonts } from "@/lib/fonts";
import { renderWallpaper } from "@/lib/wp";

export const runtime = "nodejs";

function nowKST(): { year: number; month: number; iso: string } {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return { year, month, iso };
}

/** year / month 파라미터 해석 (month 는 "1"~"12" 또는 "YYYY-MM") */
function parsePeriod(yearRaw: string | null, monthRaw: string | null): { year: number; month: number } {
  const cur = nowKST();
  let year = cur.year, month = cur.month;
  const ym = monthRaw?.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) { year = Number(ym[1]); month = Number(ym[2]); }
  else if (monthRaw && Number(monthRaw) >= 1 && Number(monthRaw) <= 12) month = Number(monthRaw);
  if (yearRaw && /^\d{4}$/.test(yearRaw)) year = Number(yearRaw);
  return { year, month };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const team = resolveTeam(sp.get("team"));
  if (!team) return new Response("team 파라미터가 필요합니다 (예: ?team=KIA)", { status: 400 });

  const { year, month } = parsePeriod(sp.get("year"), sp.get("month"));
  const resolution = resolutionById(sp.get("res"));
  const styleParam = sp.get("style");
  const style = isStyleId(styleParam) ? styleParam : "minimal";
  const modeParam = sp.get("mode");
  const mode = isMode(modeParam) && supportsLight(style) ? modeParam : "dark";
  const today = nowKST().iso;

  let games;
  let season;
  try {
    const all = await getSchedule({ year, month, teamId: team.id });
    games = filterTeamGames(all, team.id).sort((a, b) => a.date.localeCompare(b.date));
    if (needsSeasonData(style)) season = await getSeason(year, team.id);
  } catch (e) {
    return new Response(`KBO 일정을 불러오지 못했습니다: ${(e as Error).message}`, { status: 502 });
  }

  const fonts = await loadFonts();

  const img = new ImageResponse(
    renderWallpaper(style, {
      team, year, month, games, season, todayISO: today, mode,
      width: resolution.width, height: resolution.height,
    }),
    {
      width: resolution.width,
      height: resolution.height,
      fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
    }
  );

  // 참고: fmt=webp 파라미터는 URL 호환을 위해 허용하지만 현재 PNG 로 응답한다.
  // (webp 변환은 sharp 네이티브 모듈이 필요한데 일부 환경에서 불안정해 제외)
  img.headers.set("Cache-Control", "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400");
  return img;
}
