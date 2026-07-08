import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { logAccess } from '@/lib/accesslog';

const execAsync = promisify(exec);

// 내부 운영용 "네트워크 도달성 점검" API (middleware.ts로 보호).
//
// [의도적 취약점 - OS command injection (RCE)]
// 사용자 입력 host를 셸 문자열에 그대로 이어붙여 child_process.exec로 실행한다.
// 예: host="127.0.0.1;id" -> `ping -c 1 127.0.0.1;id` 가 /bin/sh에서 실행됨.
// 이 API는 middleware로 보호되지만 CVE-2025-29927로 우회되어 미인증 RCE가 된다.
// 프로세스는 비권한 nextjs 사용자로 구동되므로 RCE 시점 권한은 nextjs(uid != 0)다.
// 근본 수정: execFile + 인자 배열 + host 형식 검증.
export async function POST(req: Request) {
  let host = '127.0.0.1';
  try {
    const body = await req.json();
    if (typeof body?.host === 'string') host = body.host;
  } catch {
    // 본문 파싱 실패 시 기본값 사용.
  }

  await logAccess(req, { host });

  try {
    const { stdout, stderr } = await execAsync(`ping -c 1 ${host}`, {
      timeout: 10_000,
    });
    return NextResponse.json({ host, stdout, stderr });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json({
      host,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message ?? String(e),
    });
  }
}
