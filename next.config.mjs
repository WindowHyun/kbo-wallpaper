/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 번들 글꼴(assets/fonts/*)을 서버리스 함수 번들에 포함시킨다 (fs 로 읽으므로 트레이싱에 명시).
  outputFileTracingIncludes: {
    "/api/wallpaper": ["./assets/fonts/*"],
  },
};

export default nextConfig;
