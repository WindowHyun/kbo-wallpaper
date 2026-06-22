// KBO 10개 구단 메타데이터.
// `id`는 KBO API의 teamId 및 gameId에 쓰이는 2글자 코드와 동일하다.
// `names`에는 일정 응답의 play 셀에 등장하는 한글 표기를 모두 담아 매칭에 쓴다.

export type MascotKind =
  | "tiger"
  | "lion"
  | "rabbit"
  | "bear"
  | "alien"
  | "seagull"
  | "eagle"
  | "dino"
  | "cat"
  | "robot";

export interface Team {
  id: string;
  name: string; // 정식 명칭
  short: string; // 짧은 표기 (응답/UI)
  en: string; // 영문 대문자 표기 (brutal/nighter용)
  names: string[]; // 응답에서 등장 가능한 별칭들
  primary: string; // 대표 색
  secondary: string; // 보조 색
  text: string; // primary 위에 올라갈 글자색
  slogan: string; // 캘린더 하단 슬로건
  mascot: MascotKind; // 마스코트 아이콘 종류
  body: string; // 마스코트 몸통(얼굴) 색 — 어두운 배경에서 잘 보이는 파스텔
  accent: string; // 마스코트 포인트 색 (귀/무늬 등)
}

export const TEAMS: Team[] = [
  { id: "HT", name: "KIA 타이거즈", short: "KIA", en: "KIA", names: ["KIA", "기아"], primary: "#EA0029", secondary: "#06141F", text: "#ffffff", slogan: "PRIDE OF TIGERS", mascot: "tiger", body: "#F2A24E", accent: "#3A2A1A" },
  { id: "SS", name: "삼성 라이온즈", short: "삼성", en: "SAMSUNG", names: ["삼성"], primary: "#074CA1", secondary: "#C0C0C0", text: "#ffffff", slogan: "BLUE LIONS", mascot: "lion", body: "#E9C88B", accent: "#7A531E" },
  { id: "LG", name: "LG 트윈스", short: "LG", en: "LG", names: ["LG"], primary: "#C30452", secondary: "#000000", text: "#ffffff", slogan: "RUSH! TWINS", mascot: "rabbit", body: "#F4F1F4", accent: "#C30452" },
  { id: "OB", name: "두산 베어스", short: "두산", en: "DOOSAN", names: ["두산"], primary: "#131230", secondary: "#EB1924", text: "#ffffff", slogan: "HUSTLE DOOSAN", mascot: "bear", body: "#DAD4C4", accent: "#5A4A2E" },
  { id: "SK", name: "SSG 랜더스", short: "SSG", en: "SSG", names: ["SSG", "SK"], primary: "#CE0E2D", secondary: "#FFB81C", text: "#ffffff", slogan: "WE ARE SSG", mascot: "alien", body: "#F29BAE", accent: "#CE0E2D" },
  { id: "LT", name: "롯데 자이언츠", short: "롯데", en: "LOTTE", names: ["롯데"], primary: "#041E42", secondary: "#D00F31", text: "#ffffff", slogan: "GIANTS PRIDE", mascot: "seagull", body: "#F2F2F4", accent: "#D00F31" },
  { id: "HH", name: "한화 이글스", short: "한화", en: "HANWHA", names: ["한화"], primary: "#FC4E00", secondary: "#06141F", text: "#ffffff", slogan: "THE POWER OF ONE", mascot: "eagle", body: "#F3E7D3", accent: "#FC4E00" },
  { id: "NC", name: "NC 다이노스", short: "NC", en: "NC", names: ["NC"], primary: "#315288", secondary: "#C7A079", text: "#ffffff", slogan: "FEEL THE ROAR", mascot: "dino", body: "#8FD0A6", accent: "#315288" },
  { id: "WO", name: "키움 히어로즈", short: "키움", en: "KIWOOM", names: ["키움"], primary: "#570514", secondary: "#B07F4F", text: "#ffffff", slogan: "GO HEROES", mascot: "cat", body: "#D7A7BE", accent: "#570514" },
  { id: "KT", name: "kt wiz", short: "KT", en: "KT", names: ["KT", "kt"], primary: "#000000", secondary: "#EB1C24", text: "#ffffff", slogan: "MAGIC KT WIZ", mascot: "robot", body: "#C2C6D6", accent: "#EB1C24" },
];

const BY_ID = new Map(TEAMS.map((t) => [t.id, t]));
const BY_NAME = new Map<string, Team>();
for (const t of TEAMS) for (const n of t.names) BY_NAME.set(n, t);

// 다양한 표기(코드 OB / 영문 DOOSAN / 짧은표기 두산·KIA)로 팀을 찾는다.
const BY_ANY = new Map<string, Team>();
for (const t of TEAMS) {
  for (const k of [t.id, t.en, t.short, ...t.names]) BY_ANY.set(k.toUpperCase(), t);
}

export function teamById(id: string | null | undefined): Team | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function teamByName(name: string): Team | undefined {
  return BY_NAME.get(name.trim());
}

/** team 파라미터를 코드/영문/한글 어느 표기로 줘도 해석한다. */
export function resolveTeam(param: string | null | undefined): Team | undefined {
  if (!param) return undefined;
  return BY_ANY.get(param.trim().toUpperCase());
}
