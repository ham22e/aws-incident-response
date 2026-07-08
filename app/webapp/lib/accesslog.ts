import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// 접근 로그 경로. 운영 기본값은 EC2의 /var/log/webapp/access.log 이며,
// 로컬 검증 시 ACCESS_LOG 환경변수로 덮어쓸 수 있다.
const LOG_PATH = process.env.ACCESS_LOG || '/var/log/webapp/access.log';

// 파이썬 logging 기본 포맷과 동일한 타임스탬프: 2026-07-08 06:23:57,123
function ts(): string {
  const iso = new Date().toISOString(); // 2026-07-08T06:23:57.123Z
  return iso.replace('T', ' ').replace('Z', '').replace('.', ',');
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '-';
}

// 요청 1건을 access.log에 한 줄로 기록한다.
// mws 필드에 x-middleware-subrequest 헤더 값을 그대로 남겨 CVE-2025-29927
// 우회 시도가 탐지/분석 파이프라인에서 보이도록 한다.
export async function logAccess(
  req: Request,
  extra: { host?: string } = {},
): Promise<void> {
  const method = req.method;
  const path = new URL(req.url).pathname;
  const ua = req.headers.get('user-agent') || '-';
  const mws = req.headers.get('x-middleware-subrequest') || '';
  const host = extra.host ?? '';
  const line =
    `${ts()} ${clientIp(req)} "${method} ${path}" ` +
    `host="${host}" ua="${ua}" mws="${mws}"\n`;
  try {
    await mkdir(dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, line);
  } catch {
    // 로깅 실패가 요청 처리를 막지 않도록 무시한다.
  }
}
