// ESLint 9 flat config. Next 16에서 `next lint`가 제거되어 eslint CLI 를 직접 쓴다.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    // lib/wp 의 JSX 는 웹 페이지가 아니라 Satori(next/og) 이미지 렌더링용 —
    // next/image 를 쓸 수 없고 alt 도 의미가 없다.
    files: ["lib/wp/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
];

export default config;
