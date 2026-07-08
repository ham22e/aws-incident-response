import DataTable, { type Column } from '@/components/DataTable';
import { auditRows, type AuditRow } from '@/lib/mockdata';

const cols: Column<AuditRow>[] = [
  { key: 'time', header: '시각', render: (r) => <span className="mono muted">{r.time}</span> },
  { key: 'actor', header: '주체', render: (r) => <span className="mono">{r.actor}</span> },
  { key: 'action', header: '행위', render: (r) => <span className="mono">{r.action}</span> },
  { key: 'target', header: '대상', render: (r) => <span className="mono muted">{r.target}</span> },
  { key: 'sourceIp', header: '출발 IP', render: (r) => <span className="mono">{r.sourceIp}</span> },
  { key: 'result', header: '결과', align: 'right', render: (r) => <span className="mono">{r.result}</span> },
];

export default function Audit() {
  return (
    <>
      <div className="breadcrumb">
        기록 <span className="sep">/</span> 감사 로그
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">감사 로그</h1>
          <p className="desc">콘솔 및 관리 도구 접근 기록</p>
        </div>
        <div className="topbar-search" style={{ width: 260 }}>
          <input placeholder="주체 · 행위 검색" aria-label="감사 로그 검색" />
        </div>
      </div>

      <div className="chips section" style={{ marginTop: 0 }}>
        <span className="chip active">전체</span>
        <span className="chip">로그인</span>
        <span className="chip">관리 도구</span>
        <span className="chip">설정 변경</span>
      </div>

      <div className="section">
        <DataTable columns={cols} rows={auditRows} />
      </div>
    </>
  );
}
