// KBO 공식 사이트의 월별 일정 API를 호출하고 HTML 셀을 구조화된 경기 데이터로 파싱한다.
//
// 엔드포인트: POST https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList
//   body(form-urlencoded): leId, srIdList, seasonId, gameMonth, teamId
//   응답: { rows: [{ row: [{ Text, Class, RowSpan, ... }, ...] }, ...] }
//
// 응답 특성:
//  - 같은 날짜의 첫 경기에만 Class="day" 셀(RowSpan)이 있고 이후 경기엔 없다 → 날짜를 이월시킨다.
//  - play 셀: <span>원정</span><em><span class="lose">3</span><span>vs</span><span class="win">5</span></em><span>홈</span>
//  - gameId(예: 20260602HHOB0)는 relay/하이라이트 링크의 gameId= 파라미터에 들어 있다.

import { Team, teamByName } from "./teams";

// KBO_ENDPOINT 환경변수로 오버라이드 가능 (로컬 개발·테스트에서 목 서버를 쓸 때)
const ENDPOINT =
  process.env.KBO_ENDPOINT ?? "https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList";
const DEFAULT_TIMEOUT_MS = 8000;

export type GameStatus = "result" | "scheduled" | "canceled";

export interface Game {
  date: string; // YYYY-MM-DD
  month: number; // 1-12
  day: number; // 1-31
  weekday: string; // 월~일
  time: string; // "18:30" (없으면 "")
  gameId: string; // "20260602HHOB0" (없으면 "")
  awayName: string;
  homeName: string;
  away?: Team;
  home?: Team;
  awayScore: number | null;
  homeScore: number | null;
  stadium: string;
  note: string; // 비고 (우천취소 등)
  status: GameStatus;
  isHome?: boolean; // 특정 팀 기준 홈경기 여부 (teamId 지정 시)
  opponent?: Team; // 특정 팀 기준 상대 (teamId 지정 시)
}

interface Cell {
  Text: string | null;
  Class: string | null;
  RowSpan: string | null;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function stripTags(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function findClass(cells: Cell[], cls: string): Cell | undefined {
  return cells.find((c) => c.Class === cls);
}

/** "06.02(화)" -> {month, day} */
function parseDayCell(text: string): { month: number; day: number } | null {
  const m = text.match(/(\d{1,2})\.(\d{1,2})/);
  if (!m) return null;
  return { month: Number(m[1]), day: Number(m[2]) };
}

/** play 셀 HTML에서 원정/홈 팀명과 점수를 추출한다. */
function parsePlay(html: string): {
  awayName: string;
  homeName: string;
  awayScore: number | null;
  homeScore: number | null;
} {
  const spans: { text: string; cls: string }[] = [];
  const re = /<span([^>]*)>([\s\S]*?)<\/span>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const clsMatch = m[1].match(/class\s*=\s*"([^"]*)"/);
    spans.push({ text: stripTags(m[2]), cls: clsMatch ? clsMatch[1] : "" });
  }

  const vsIdx = spans.findIndex((s) => s.text.toLowerCase() === "vs");
  let awayName = "";
  let homeName = "";
  let awayScore: number | null = null;
  let homeScore: number | null = null;

  const num = (s: string) => (/^\d+$/.test(s) ? Number(s) : null);

  if (vsIdx >= 0) {
    awayName = spans[0]?.text ?? "";
    homeName = spans[spans.length - 1]?.text ?? "";
    for (let i = 1; i < vsIdx; i++) {
      const n = num(spans[i].text);
      if (n !== null) awayScore = n;
    }
    for (let i = vsIdx + 1; i < spans.length - 1; i++) {
      const n = num(spans[i].text);
      if (n !== null) homeScore = n;
    }
  } else {
    // 예외적 포맷: 팀명만 두 개
    const names = spans.filter((s) => num(s.text) === null && s.text);
    awayName = names[0]?.text ?? "";
    homeName = names[names.length - 1]?.text ?? "";
  }

  return { awayName, homeName, awayScore, homeScore };
}

function extractGameId(cells: Cell[]): string {
  for (const c of cells) {
    const m = c.Text?.match(/gameId=([0-9A-Z]+)/);
    if (m) return m[1];
  }
  return "";
}

function buildDate(year: number, month: number, day: number): { iso: string; weekday: string } {
  const d = new Date(Date.UTC(year, month - 1, day));
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { iso, weekday: WEEKDAYS[d.getUTCDay()] };
}

export interface FetchOptions {
  year: number;
  month: number; // 1-12
  teamId?: string; // 비우면 전체
  srIdList?: string;
  signal?: AbortSignal;
}

/** KBO 일정 API 원본 rows 를 가져온다. */
export async function fetchScheduleRows(opts: FetchOptions): Promise<Cell[][]> {
  const body = new URLSearchParams({
    leId: "1",
    srIdList: opts.srIdList ?? "0,1,3,4,5,6,7,9",
    seasonId: String(opts.year),
    gameMonth: String(opts.month).padStart(2, "0"),
    teamId: opts.teamId ?? "",
  });

  // 호출부가 signal 을 주지 않아도 항상 타임아웃을 건다(응답 지연 시 요청이 매달리는 것 방지).
  // 시즌 스타일은 9개월치를 동시에 호출하므로 특히 중요.
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
  let signal: AbortSignal = timeout;
  if (opts.signal) {
    signal =
      typeof AbortSignal.any === "function"
        ? AbortSignal.any([opts.signal, timeout])
        : opts.signal;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (compatible; kbo-wallpaper/1.0)",
      Referer: "https://www.koreabaseball.com/Schedule/Schedule.aspx",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: body.toString(),
    signal,
    // KBO 데이터는 하루 단위로만 바뀌므로 6시간 캐시 (Next fetch 캐시)
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!res.ok) throw new Error(`KBO API ${res.status}`);
  const data = (await res.json()) as { rows?: { row: Cell[] }[] };
  return (data.rows ?? []).map((r) => r.row);
}

/** 원본 rows 를 구조화된 Game[] 으로 파싱한다. */
export function parseGames(rows: Cell[][], year: number, focusTeamId?: string): Game[] {
  const games: Game[] = [];
  let curMonth = 0;
  let curDay = 0;

  for (const cells of rows) {
    const dayCell = findClass(cells, "day");
    if (dayCell) {
      const parsed = parseDayCell(stripTags(dayCell.Text));
      if (parsed) {
        curMonth = parsed.month;
        curDay = parsed.day;
      }
    }
    if (!curMonth) continue;

    const playCell = findClass(cells, "play");
    if (!playCell || !playCell.Text) continue;

    const timeCell = findClass(cells, "time");
    const time = stripTags(timeCell?.Text);

    const { awayName, homeName, awayScore, homeScore } = parsePlay(playCell.Text);
    if (!awayName || !homeName) continue;

    const gameId = extractGameId(cells);

    // 구장/비고는 마지막 두 셀이지만, 취소·짧은 행에서는 그 자리에 play/time/day 셀이 올 수 있어
    // 알려진 클래스 셀은 구장/비고로 오인하지 않도록 방어한다.
    const known = new Set([dayCell, timeCell, playCell].filter(Boolean) as Cell[]);
    const noteCell = cells[cells.length - 1];
    const stadiumCell = cells[cells.length - 2];
    const note = noteCell && !known.has(noteCell) ? stripTags(noteCell.Text) : "";
    const stadium = stadiumCell && !known.has(stadiumCell) ? stripTags(stadiumCell.Text) : "";

    const rowText = cells.map((c) => stripTags(c.Text)).join(" ");
    let status: GameStatus = "scheduled";
    // 취소/연기/노게임은 무효 경기 → 점수 폐기. "서스펜디드"(재개 예정)는 최종 점수가
    // 확정되면 별도 취소 표기 없이 결과로 내려오므로 취소로 단정하지 않는다.
    if (/취소|연기|노게임/.test(rowText)) status = "canceled";
    else if (awayScore !== null && homeScore !== null) status = "result";

    const { iso, weekday } = buildDate(year, curMonth, curDay);
    const away = teamByName(awayName);
    const home = teamByName(homeName);

    const game: Game = {
      date: iso,
      month: curMonth,
      day: curDay,
      weekday,
      time,
      gameId,
      awayName,
      homeName,
      away,
      home,
      awayScore: status === "canceled" ? null : awayScore,
      homeScore: status === "canceled" ? null : homeScore,
      stadium: stadium === "-" ? "" : stadium,
      note: note === "-" ? "" : note,
      status,
    };

    if (focusTeamId) {
      game.isHome = home?.id === focusTeamId;
      game.opponent = game.isHome ? away : home;
    }

    games.push(game);
  }

  return games;
}

/** 특정 팀의 한 달 경기만 추린다 (focusTeamId 기준). */
export function filterTeamGames(games: Game[], teamId: string): Game[] {
  return games.filter((g) => g.away?.id === teamId || g.home?.id === teamId);
}

export async function getSchedule(opts: FetchOptions): Promise<Game[]> {
  const rows = await fetchScheduleRows(opts);
  return parseGames(rows, opts.year, opts.teamId);
}
