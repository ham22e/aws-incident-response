import Link from 'next/link';

export default function Home() {
  return (
    <main className="auth">
      <div className="splash">
        <div className="auth-logo" style={{ justifyContent: 'center', marginBottom: 20 }}>
          <span className="logo-mark">C</span> Cloud Ops
        </div>
        <h1>Cloud Ops Portal</h1>
        <p>
          Cloud 운영팀 전용 내부 콘솔입니다. 서비스 상태, 인프라 인벤토리,
          운영 도구를 한 곳에서 관리하세요.
        </p>
        <Link className="btn" href="/login">
          로그인
        </Link>
      </div>
    </main>
  );
}
