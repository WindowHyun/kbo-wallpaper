// 저장소에 번들된 글꼴(assets/fonts/)을 디스크에서 읽어 인스턴스당 1회 캐시한다.
// 외부 CDN에 의존하지 않으므로 네트워크 장애가 렌더링 장애로 이어지지 않는다.
// next/og 는 OTF/TTF 를 지원한다.

import { readFileSync } from "fs";
import path from "path";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

export interface LoadedFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 800;
  style: "normal";
}

let cache: LoadedFont[] | null = null;

function readFont(file: string): ArrayBuffer {
  const buf = readFileSync(path.join(FONT_DIR, file));
  // Buffer 의 내부 풀 공유를 피해 정확한 구간만 ArrayBuffer 로 복사한다.
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export function loadFonts(): LoadedFont[] {
  if (!cache) {
    const fonts: LoadedFont[] = [
      { name: "Pretendard", data: readFont("Pretendard-Regular.otf"), weight: 400, style: "normal" },
      { name: "Pretendard", data: readFont("Pretendard-Bold.otf"), weight: 700, style: "normal" },
      { name: "Pretendard", data: readFont("Pretendard-ExtraBold.otf"), weight: 800, style: "normal" },
    ];

    // 손글씨 글꼴(CUTE·SKETCH용)은 베스트-에포트: 없으면 Pretendard 로 폴백한다.
    try {
      fonts.push({ name: "Nanum Pen Script", data: readFont("NanumPenScript-Regular.ttf"), weight: 400, style: "normal" });
    } catch (e) {
      console.warn("Nanum Pen Script 로드 실패 — Pretendard 로 폴백:", (e as Error).message);
    }

    cache = fonts;
  }
  return cache;
}
