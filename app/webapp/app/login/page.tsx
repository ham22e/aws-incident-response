import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 정적 로그인: 하드코딩된 자격증명과 대조해 콘솔 로그인처럼 동작한다.
// 인증 강도 자체는 이 재현 환경의 관심사가 아니며, 실제 취약점은 CVE-2025-29927로 이
// 미들웨어 인증을 통째로 우회하는 데 있다(우회는 헤더 위조로 API를 직접 타격하며
// 로그인 흐름을 거치지 않는다). 즉 이 검증은 익스플로잇에 영향을 주지 않는다.
const DEMO_USER = 'operator';
const DEMO_PASS = 'Cloud!2026';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    'use server';
    const user = String(formData.get('user') ?? '');
    const pass = String(formData.get('pass') ?? '');
    if (user !== DEMO_USER || pass !== DEMO_PASS) {
      redirect('/login?error=1');
    }
    const cookieStore = await cookies();
    cookieStore.set('session', 'demo-session', { httpOnly: true, path: '/' });
    redirect('/dashboard');
  }

  return (
    <main className="auth">
      <form action={login} className="auth-card">
        <div className="auth-logo">
          <span className="logo-mark">C</span> Cloud Ops
          <span className="env">internal</span>
        </div>
        <div>
          <h1>로그인</h1>
          <p className="sub">사내 계정으로 로그인하세요.</p>
        </div>
        {error && <div className="error">사용자 또는 비밀번호가 올바르지 않습니다.</div>}
        <label className="field">
          사용자
          <input name="user" defaultValue="operator" autoComplete="username" />
        </label>
        <label className="field">
          비밀번호
          <input name="pass" type="password" autoComplete="current-password" />
        </label>
        <button className="btn" type="submit">
          로그인
        </button>
        <p className="hint">
          체험 계정: <code>operator</code> / <code>Cloud!2026</code>
        </p>
      </form>
    </main>
  );
}
