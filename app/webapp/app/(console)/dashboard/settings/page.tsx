import { operator } from '@/lib/mockdata';

export default function Settings() {
  return (
    <>
      <div className="breadcrumb">
        기록 <span className="sep">/</span> 설정
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">설정</h1>
          <p className="desc">계정 및 콘솔 환경 설정</p>
        </div>
      </div>

      <div className="cols-2">
        <div className="panel">
          <div className="section-title">프로필</div>
          <label className="field">
            이름
            <input defaultValue={operator.name} disabled />
          </label>
          <label className="field" style={{ marginTop: 12 }}>
            이메일
            <input defaultValue={operator.email} disabled />
          </label>
          <label className="field" style={{ marginTop: 12 }}>
            역할
            <input defaultValue={operator.role} disabled />
          </label>
        </div>

        <div className="panel">
          <div className="section-title">알림</div>
          <div className="setting-row">
            <div className="label">
              <b>인시던트 알림</b>
              <small>새 인시던트 발생 시 이메일 발송</small>
            </div>
            <div className="switch on" />
          </div>
          <div className="setting-row">
            <div className="label">
              <b>예산 경보</b>
              <small>월 예산 80% 도달 시 알림</small>
            </div>
            <div className="switch on" />
          </div>
          <div className="setting-row">
            <div className="label">
              <b>주간 리포트</b>
              <small>매주 월요일 운영 요약 발송</small>
            </div>
            <div className="switch" />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="panel">
          <div className="section-title">API 토큰</div>
          <label className="field">
            운영 API 토큰
            <input className="mono" defaultValue="cldr_live_••••••••••••••••••••4f2a" disabled />
          </label>
          <p className="hint" style={{ marginTop: 10 }}>
            토큰은 발급 시 한 번만 표시됩니다. 재발급은 보안팀 승인이 필요합니다.
          </p>
        </div>
      </div>
    </>
  );
}
