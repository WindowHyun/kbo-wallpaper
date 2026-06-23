// 글꼴을 인스턴스당 1회만 받아 캐시한다. next/og 는 OTF/TTF 를 지원한다.

const BASE =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static";

// 손글씨 글꼴(Nanum Pen Script) — CUTE 스타일용. 전체 한글 글리프가 담긴 단일 TTF.
const PEN_URL =
  "https://cdn.jsdelivr.net/npm/@expo-google-fonts/nanum-pen-script@0.4.0/400Regular/NanumPenScript_400Regular.ttf";

export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

let cache: Promise<LoadedFont[]> | null = null;

async function fetchFont(url: string): Promise<ArrayBuffer> {
  // 글꼴은 2MB를 넘어 Next fetch 캐시에 못 들어가므로(경고 발생) 모듈 메모리 캐시(cache)에만 의존한다.
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`font ${url} ${res.status}`);
  return res.arrayBuffer();
}

export function loadFonts(): Promise<LoadedFont[]> {
  if (!cache) {
    cache = (async () => {
      const [regular, bold] = await Promise.all([
        fetchFont(`${BASE}/Pretendard-Regular.otf`),
        fetchFont(`${BASE}/Pretendard-Bold.otf`),
      ]);
      const fonts: LoadedFont[] = [
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: bold, weight: 800, style: "normal" },
      ];

      // 손글씨 글꼴은 베스트-에포트: 실패해도 Pretendard 로 폴백되도록 앱을 죽이지 않는다.
      try {
        const pen = await fetchFont(PEN_URL);
        fonts.push({ name: "Nanum Pen Script", data: pen, weight: 400, style: "normal" });
      } catch (e) {
        console.warn("Nanum Pen Script 로드 실패 — Pretendard 로 폴백:", (e as Error).message);
      }

      return fonts;
    })().catch((e) => {
      cache = null; // 실패 시 다음 요청에서 재시도
      throw e;
    });
  }
  return cache;
}
