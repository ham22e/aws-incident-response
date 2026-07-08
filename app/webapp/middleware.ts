import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호 경로 접근 통제: 로그인 세션 쿠키가 없으면 차단한다.
//
// [의도적 취약점 - CVE-2025-29927]
// Next.js 15.1.6은 내부 재귀 방지 헤더 `x-middleware-subrequest`를 무검증
// 신뢰한다. 공격자가 이 헤더를 위조해 보내면 프레임워크가 이 미들웨어 실행
// 자체를 스킵하여 아래 인증 로직이 통째로 우회된다. 이 재현 환경에서는 이 우회를 통해
// 보호된 /api/internal/diagnostics(RCE)에 미인증 상태로 도달한다.
// 근본 수정: Next.js >= 15.2.3으로 업그레이드 + 미들웨어 단독 인증 금지.
export function middleware(req: NextRequest) {
  const session = req.cookies.get('session')?.value;
  if (!session) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/internal/:path*'],
};
