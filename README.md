# KBO 월페이퍼 생성기

KBO 구단별 한 달 경기 일정·결과를 모바일 잠금화면 배경화면(PNG)으로 만들어 주는 생성기입니다.
[kbo-wall.vercel.app](https://kbo-wall.vercel.app/) 에서 영감을 받은 비공식 팬 프로젝트입니다.

## 동작 방식

- 데이터는 KBO 공식 사이트의 월별 일정 API에서 가져옵니다.
  `POST https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList`
  (body: `leId, srIdList, seasonId, gameMonth, teamId`)
- HTML 셀로 내려오는 응답을 [lib/kbo.ts](lib/kbo.ts) 에서 구조화된 경기 데이터로 파싱합니다.
- [lib/render.tsx](lib/render.tsx) + `next/og`(Satori) 로 PNG 월페이퍼를 서버에서 렌더링합니다.
  한글은 Pretendard 글꼴([lib/fonts.ts](lib/fonts.ts))을 로드해 표시합니다.
- 미리보기 · 다운로드 · 자동 업데이트 URL이 **모두 같은 엔드포인트** `/api/wallpaper` 를 사용합니다.

### 자동 업데이트 URL

PNG 엔드포인트는 요청 시점에 일정을 가져와(6시간 CDN 캐시 + 백그라운드 갱신) 즉석 렌더링하므로,
고정 URL 하나가 매일 최신 결과를 반영합니다. 별도 DB/크론 없이 reference 사이트와 같은 UX를 제공합니다.

```
/api/wallpaper?team=OB&month=2026-06&style=team&res=iphone
```

| 파라미터 | 설명 | 값 |
| --- | --- | --- |
| `team` | 구단 코드 | `HT SS LG OB SK LT HH NC WO KT` |
| `month` | 연-월 (또는 월) | `2026-06`, `6` |
| `style` | 디자인 | `team` `dark` `light` `mono` |
| `res` | 해상도 | `iphone-pro-max` `iphone` `iphone-mini` `android-qhd` `android-fhd` |

- **iOS**: 단축어 → "URL 콘텐츠 가져오기"에 URL → "배경화면 설정". 자동화로 매일 실행.
- **Android**: KWGT / 배경 자동변경 앱에 URL 등록.

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## 배포 (Vercel)

이 저장소를 Vercel에 연결하면 그대로 배포됩니다. 추가 환경변수는 필요 없습니다.

## 참고 / 주의

- KBO `robots.txt` 는 `/ws/` 경로를 disallow 합니다. 본 프로젝트는 개인/팬 용도이며,
  응답을 캐시해 요청량을 최소화합니다. 상업적 이용이나 대량 트래픽은 권장하지 않습니다.
- 비공식 프로젝트로, 데이터 정확성은 KBO 공식 사이트를 따릅니다.
