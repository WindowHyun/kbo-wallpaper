// Pretendard 글꼴을 인스턴스당 1회만 받아 캐시한다. next/og 는 OTF/TTF 를 지원한다.

const BASE =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static";

export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

let cache: Promise<LoadedFont[]> | null = null;

async function fetchFont(file: string): Promise<ArrayBuffer> {
  // 글꼴은 2MB를 넘어 Next fetch 캐시에 못 들어가므로(경고 발생) 모듈 메모리 캐시(cache)에만 의존한다.
  const res = await fetch(`${BASE}/${file}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`font ${file} ${res.status}`);
  return res.arrayBuffer();
}

export function loadFonts(): Promise<LoadedFont[]> {
  if (!cache) {
    cache = (async () => {
      const [regular, bold] = await Promise.all([
        fetchFont("Pretendard-Regular.otf"),
        fetchFont("Pretendard-Bold.otf"),
      ]);
      const fonts: LoadedFont[] = [
        { name: "Pretendard", data: regular, weight: 400, style: "normal" },
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: bold, weight: 800, style: "normal" },
      ];
      return fonts;
    })().catch((e) => {
      cache = null; // 실패 시 다음 요청에서 재시도
      throw e;
    });
  }
  return cache;
}
