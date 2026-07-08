import Link from 'next/link';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import Sparkline from '@/components/Sparkline';
import DataTable, { type Column } from '@/components/DataTable';
import { Icon } from '@/components/icons';
import { kpis, services, incidents, alerts, type Incident } from '@/lib/mockdata';

const incidentCols: Column<Incident>[] = [
  { key: 'id', header: 'ID', render: (r) => <span className="mono">{r.id}</span> },
  { key: 'title', header: '제목' },
  { key: 'severity', header: '심각도', render: (r) => <StatusBadge status={r.severity} /> },
  { key: 'status', header: '상태', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'service', header: '서비스', render: (r) => <span className="mono">{r.service}</span> },
  { key: 'opened', header: '발생', render: (r) => <span className="mono muted">{r.opened}</span> },
];

export default function Dashboard() {
  return (
    <>
      <div className="breadcrumb">
        운영 <span className="sep">/</span> 개요
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">운영 개요</h1>
          <p className="desc">cloudir-prod · 최근 24시간 요약</p>
        </div>
        <div className="toolbar">
          <span className="chip active">24h</span>
          <span className="chip">7d</span>
          <span className="chip">30d</span>
        </div>
      </div>

      <div className="grid-kpi">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="cols-2 section">
        <div className="panel">
          <div className="section-title">
            서비스 상태 <span className="count">{services.length}개</span>
          </div>
          <div className="grid">
            {services.map((s) => (
              <div className="tile" key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="mono">{s.name}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                  <span className="muted" style={{ fontSize: 12 }}>
                    p95 <span className="mono">{s.latencyMs}ms</span>
                  </span>
                  <Sparkline data={s.spark} width={84} height={24} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">
            알림 <span className="count">{alerts.length}건</span>
          </div>
          <div className="feed">
            {alerts.map((a) => (
              <div className="feed-row" key={a.id}>
                <span className={`sev sev--${a.severity}`} />
                <div className="body">
                  <div className="msg">{a.message}</div>
                  <div className="meta">
                    {a.source} · {a.time}
                  </div>
                </div>
                <time>{a.time}</time>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          최근 인시던트 <span className="count">{incidents.length}건</span>
        </div>
        <DataTable columns={incidentCols} rows={incidents} />
      </div>

      <div className="section">
        <Link
          href="/admin/diagnostics"
          className="tool-card"
          style={{ maxWidth: 380, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <span className="ico">
            <Icon name="network" />
          </span>
          <div>
            <h3>네트워크 진단</h3>
            <span className="muted" style={{ fontSize: 13 }}>
              대상 호스트 도달성 점검
            </span>
          </div>
        </Link>
      </div>
    </>
  );
}
