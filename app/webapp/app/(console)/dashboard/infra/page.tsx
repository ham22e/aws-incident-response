import StatusBadge from '@/components/StatusBadge';
import DataTable, { type Column } from '@/components/DataTable';
import { ec2, s3, rds, type Ec2, type S3Bucket, type Rds } from '@/lib/mockdata';

const ec2Cols: Column<Ec2>[] = [
  { key: 'id', header: '인스턴스 ID', render: (r) => <span className="mono">{r.id}</span> },
  { key: 'name', header: '이름', render: (r) => <span className="mono">{r.name}</span> },
  { key: 'type', header: '타입', render: (r) => <span className="mono">{r.type}</span> },
  { key: 'az', header: 'AZ', render: (r) => <span className="mono muted">{r.az}</span> },
  { key: 'state', header: '상태', render: (r) => <StatusBadge status={r.state} /> },
  { key: 'privateIp', header: 'Private IP', render: (r) => <span className="mono">{r.privateIp}</span> },
  { key: 'publicIp', header: 'Public IP', render: (r) => <span className="mono">{r.publicIp}</span> },
];

const s3Cols: Column<S3Bucket>[] = [
  { key: 'name', header: '버킷', render: (r) => <span className="mono">{r.name}</span> },
  { key: 'region', header: '리전', render: (r) => <span className="mono muted">{r.region}</span> },
  { key: 'objects', header: '객체', align: 'right', render: (r) => <span className="mono">{r.objects.toLocaleString()}</span> },
  { key: 'size', header: '크기', align: 'right', render: (r) => <span className="mono">{r.size}</span> },
  {
    key: 'public',
    header: '접근',
    render: (r) => (r.public ? <StatusBadge status="open" label="Public" /> : <span className="badge badge--muted">Private</span>),
  },
];

const rdsCols: Column<Rds>[] = [
  { key: 'id', header: 'DB 식별자', render: (r) => <span className="mono">{r.id}</span> },
  { key: 'engine', header: '엔진', render: (r) => <span className="mono">{r.engine}</span> },
  { key: 'class', header: '클래스', render: (r) => <span className="mono">{r.class}</span> },
  { key: 'az', header: 'AZ', render: (r) => <span className="mono muted">{r.az}</span> },
  { key: 'status', header: '상태', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'storage', header: '스토리지', align: 'right', render: (r) => <span className="mono">{r.storage}</span> },
];

export default function Infra() {
  return (
    <>
      <div className="breadcrumb">
        운영 <span className="sep">/</span> 인프라
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">인프라 인벤토리</h1>
          <p className="desc">cloudir-prod · ap-northeast-2 리소스 현황</p>
        </div>
        <div className="chips">
          <span className="chip active">전체</span>
          <span className="chip">EC2</span>
          <span className="chip">S3</span>
          <span className="chip">RDS</span>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          EC2 인스턴스 <span className="count">{ec2.length}개</span>
        </div>
        <DataTable columns={ec2Cols} rows={ec2} />
      </div>

      <div className="section">
        <div className="section-title">
          S3 버킷 <span className="count">{s3.length}개</span>
        </div>
        <DataTable columns={s3Cols} rows={s3} />
      </div>

      <div className="section">
        <div className="section-title">
          RDS 인스턴스 <span className="count">{rds.length}개</span>
        </div>
        <DataTable columns={rdsCols} rows={rds} />
      </div>
    </>
  );
}
