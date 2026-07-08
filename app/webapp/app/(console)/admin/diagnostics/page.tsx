'use client';

import { useState } from 'react';

// 네트워크 진단 도구 UI. 콘솔 관리 도구 섹션에 표시되지만 URL은 /admin/diagnostics
// 를 유지한다(미들웨어 매처 불변).
//
// [주의] 이 페이지는 POST /api/internal/diagnostics 로 { host } 를 보내고 응답의
// stdout/stderr 를 렌더한다. 이 요청/응답 계약은 공격 스크립트가 의존하므로 외형만
// 바꾸고 fetch 동작은 그대로 유지한다.
export default function Diagnostics() {
  const [host, setHost] = useState('127.0.0.1');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOut('');
    try {
      const res = await fetch('/api/internal/diagnostics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ host }),
      });
      const data = await res.json();
      setOut(`${data.stdout || ''}\n${data.stderr || ''}`.trim());
    } catch (err) {
      setOut(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="breadcrumb">
        관리 도구 <span className="sep">/</span> 네트워크 진단
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">네트워크 진단</h1>
          <p className="desc">대상 호스트로의 도달성(ping)을 점검합니다. 운영팀 전용 도구입니다.</p>
        </div>
      </div>

      <form onSubmit={run} className="card" style={{ maxWidth: 540 }}>
        <label>
          대상 호스트
          <input value={host} onChange={(e) => setHost(e.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? '점검 중...' : '도달성 점검'}
        </button>
      </form>

      {out && (
        <pre className="out" style={{ maxWidth: 540 }}>
          {out}
        </pre>
      )}
    </>
  );
}
