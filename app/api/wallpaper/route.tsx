import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSchedule, filterTeamGames, isOngoingPeriod } from "@/lib/kbo";
import { resolveTeam } from "@/lib/teams";
import { RESOLUTIONS, STYLES, DEFAULT_RESOLUTION, isStyleId, isMode, needsSeasonData, supportsLight } from "@/lib/presets";
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

function bad(msg: string): Response {
  return new Response(msg, { status: 400 });
}

/**
 * year / month 파라미터 해석 (month 는 "1"~"12" 또는 "YYYY-MM").
 * 파라미터가 없으면 KST 현재 연·월 → 자동 업데이트 URL 이 매달 갱신되는 근거.
 * 값이 있는데 형식이 틀리면 조용히 폴백하지 않고 error 를 돌려준다.
 */
function parsePeriod(
  yearRaw: string | null,
  monthRaw: string | null
): { year: number; month: number; error?: string } {
  const cur = nowKST();
  let year = cur.year, month = cur.month;

  if (monthRaw) {
    const ym = monthRaw.match(/^(\d{4})-(\d{1,2})$/);
    const m = ym ? Number(ym[2]) : Number(monthRaw);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      return { year, month, error: `month 파라미터가 잘못되었습니다: "${monthRaw}" (1~12 또는 YYYY-MM)` };
    }
    month = m;
    if (ym) year = Number(ym[1]);
  }
  if (yearRaw) {
    if (!/^\d{4}$/.test(yearRaw)) {
      return { year, month, error: `year 파라미터가 잘못되었습니다: "${yearRaw}" (예: 2026)` };
    }
    year = Number(yearRaw);
  }
  // KBO 출범(1982)~내년만 허용 — 임의 연도로 업스트림 호출·렌더가 낭비되는 것을 막는다.
  if (year < 1982 || year > cur.year + 1) {
    return { year, month, error: `year 가 범위를 벗어났습니다: ${year} (1982~${cur.year + 1})` };
  }
  return { year, month };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const team = resolveTeam(sp.get("team"));
  if (!team) return bad("team 파라미터가 필요합니다 (예: ?team=KIA)");

  // 파라미터가 없으면 기본값, 있는데 잘못된 값이면 조용히 폴백하지 않고 400 (오타 감지)
  const { year, month, error } = parsePeriod(sp.get("year"), sp.get("month"));
  if (error) return bad(error);

  const resParam = sp.get("res");
  const resolution = resParam ? RESOLUTIONS.find((r) => r.id === resParam) : DEFAULT_RESOLUTION;
  if (!resolution) {
    return bad(`res 파라미터가 잘못되었습니다: "${resParam}" (가능한 값: ${RESOLUTIONS.map((r) => r.id).join(", ")})`);
  }

  // 미리보기 등에서 실제 해상도를 줄여 받기 위한 축소 배율 (0.2~1). 렌더 결과는 동일하고 픽셀만 작아진다.
  const scaleRaw = Number(sp.get("scale"));
  const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? Math.min(1, Math.max(0.2, scaleRaw)) : 1;
  const outW = Math.round(resolution.width * scale);
  const outH = Math.round(resolution.height * scale);

  const styleParam = sp.get("style");
  if (styleParam && !isStyleId(styleParam)) {
    return bad(`style 파라미터가 잘못되었습니다: "${styleParam}" (가능한 값: ${STYLES.map((s) => s.id).join(", ")})`);
  }
  const style = isStyleId(styleParam) ? styleParam : "minimal";

  const modeParam = sp.get("mode");
  if (modeParam && !isMode(modeParam)) {
    return bad(`mode 파라미터가 잘못되었습니다: "${modeParam}" (가능한 값: dark, light)`);
  }
  // light 미지원 스타일은 dark 로 렌더링 (첫 화면 UI 와 동일한 규칙)
  const mode = isMode(modeParam) && supportsLight(style) ? modeParam : "dark";
  const today = nowKST().iso;

  let games;
  let season;
  try {
    const all = await getSchedule({ year, month, teamId: team.id, fresh: isOngoingPeriod(year, month) });
    games = filterTeamGames(all, team.id).sort((a, b) => a.date.localeCompare(b.date));
    if (needsSeasonData(style)) season = await getSeason(year, team.id);
  } catch (e) {
    return new Response(`KBO 일정을 불러오지 못했습니다: ${(e as Error).message}`, { status: 502 });
  }

  let fonts;
  try {
    fonts = loadFonts();
  } catch (e) {
    console.error("번들 글꼴 로드 실패:", e);
    return new Response("글꼴을 불러오지 못했습니다 (서버 구성 오류)", { status: 500 });
  }

  let img;
  try {
    img = new ImageResponse(
      renderWallpaper(style, {
        team, year, month, games, season, todayISO: today, mode,
        width: outW, height: outH,
      }),
      {
        width: outW,
        height: outH,
        fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
      }
    );
  } catch (e) {
    return new Response(`이미지 렌더링 실패: ${(e as Error).message}`, { status: 500 });
  }

  // 참고: fmt=webp 파라미터는 URL 호환을 위해 허용하지만 현재 PNG 로 응답한다.
  // (webp 변환은 sharp 네이티브 모듈이 필요한데 일부 환경에서 불안정해 제외)
  // stale-while-revalidate 는 쓰지 않는다: 하루 1회 갱신하는 클라이언트(WallSync)가 항상 직전 주기의
  // 이미지를 받게 된다. 짧은 s-maxage 로 부하만 흡수한다.
  img.headers.set("Cache-Control", "public, max-age=0, s-maxage=1800");
  return img;
}
