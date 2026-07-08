/** @type {import('next').NextConfig} */
const nextConfig = {
  // self-hosted 배포용 독립 실행 번들. `node .next/standalone/server.js`로 구동.
  // 이 구성(self-hosted + next start + standalone + middleware)이 CVE-2025-29927의
  // 취약 조건과 정확히 일치한다.
  output: 'standalone',
};

export default nextConfig;
