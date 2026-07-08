// Cloud Ops 콘솔 정적 목업 데이터.
// 서버 컴포넌트에서만 import 한다(백엔드 공격 표면 없음). 모든 값은 가상이며
// 격리 계정 재현 시나리오를 위한 것이다. 인프라 자원명은 terraform의 `cloudir-*`
// 접두사와 호응하도록 유지한다(브랜드 표기만 Cloud Ops).

export type Operator = { name: string; email: string; role: string };

export const operator: Operator = {
  name: '운영자',
  email: 'operator@cloud.io',
  role: 'SRE / 운영팀',
};

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { group: string; items: NavItem[] };

export const navConfig: NavGroup[] = [
  {
    group: '운영',
    items: [
      { href: '/dashboard', label: '개요', icon: 'overview' },
      { href: '/dashboard/infra', label: '인프라', icon: 'server' },
    ],
  },
  {
    group: '관리 도구',
    items: [
      { href: '/admin', label: '도구', icon: 'wrench' },
      { href: '/admin/diagnostics', label: '네트워크 진단', icon: 'network' },
    ],
  },
  {
    group: '기록',
    items: [
      { href: '/dashboard/audit', label: '감사 로그', icon: 'clipboard' },
      { href: '/dashboard/settings', label: '설정', icon: 'settings' },
    ],
  },
];

export type Kpi = {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  dir: 'up' | 'down';
  spark: number[];
};

export const kpis: Kpi[] = [
  {
    label: '요청 / 분',
    value: '12.4',
    unit: 'k',
    delta: '+3.2%',
    dir: 'up',
    spark: [8, 9, 8, 10, 11, 10, 12, 11, 13, 12, 12, 12.4],
  },
  {
    label: 'p95 지연',
    value: '148',
    unit: 'ms',
    delta: '-6ms',
    dir: 'up',
    spark: [180, 172, 168, 175, 160, 158, 150, 155, 149, 152, 147, 148],
  },
  {
    label: '5xx 오류율',
    value: '0.42',
    unit: '%',
    delta: '+0.08%p',
    dir: 'down',
    spark: [0.2, 0.22, 0.25, 0.24, 0.3, 0.28, 0.35, 0.33, 0.4, 0.38, 0.41, 0.42],
  },
  {
    label: '가용성 (30일)',
    value: '99.98',
    unit: '%',
    delta: '+0.01%p',
    dir: 'up',
    spark: [99.9, 99.92, 99.95, 99.94, 99.96, 99.97, 99.96, 99.98, 99.97, 99.98, 99.98, 99.98],
  },
];

export type ServiceStatus = 'healthy' | 'degraded' | 'down';
export type Service = {
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  spark: number[];
};

export const services: Service[] = [
  { name: 'api-gateway', status: 'healthy', latencyMs: 42, spark: [40, 44, 41, 43, 42, 45, 41, 42] },
  { name: 'billing-worker', status: 'healthy', latencyMs: 88, spark: [80, 92, 85, 90, 88, 86, 91, 88] },
  { name: 'auth-service', status: 'degraded', latencyMs: 214, spark: [120, 140, 180, 175, 200, 210, 205, 214] },
  { name: 'export-service', status: 'healthy', latencyMs: 65, spark: [60, 68, 63, 66, 64, 67, 62, 65] },
  { name: 'notify-service', status: 'healthy', latencyMs: 53, spark: [50, 55, 52, 54, 53, 51, 56, 53] },
  { name: 'search-indexer', status: 'healthy', latencyMs: 120, spark: [110, 125, 118, 122, 119, 124, 117, 120] },
];

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';
export type Incident = {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  opened: string;
  assignee: string;
};

export const incidents: Incident[] = [
  {
    id: 'INC-2041',
    title: 'auth-service p95 지연 증가',
    severity: 'medium',
    status: 'investigating',
    service: 'auth-service',
    opened: '2026-07-08 05:12',
    assignee: '운영자',
  },
  {
    id: 'CLOUDIR-2026-0709',
    title: '관리 도구(네트워크 진단) 비정상 접근 조사',
    severity: 'high',
    status: 'investigating',
    service: 'ops-portal',
    opened: '2026-07-09 06:31',
    assignee: '보안팀',
  },
  {
    id: 'INC-2038',
    title: 'export-service 재시작 반복',
    severity: 'low',
    status: 'resolved',
    service: 'export-service',
    opened: '2026-07-09 21:44',
    assignee: '박서연',
  },
  {
    id: 'INC-2035',
    title: 'billing-worker 큐 적체',
    severity: 'low',
    status: 'resolved',
    service: 'billing-worker',
    opened: '2026-07-06 13:02',
    assignee: '이준호',
  },
];

export type Alert = {
  id: string;
  severity: 'warn' | 'crit' | 'info';
  source: string;
  message: string;
  time: string;
};

export const alerts: Alert[] = [
  { id: 'a4', severity: 'crit', source: 'waf', message: '관리 경로에서 비정상 요청 헤더 탐지', time: '06:31' },
  { id: 'a3', severity: 'warn', source: 'auth-service', message: 'p95 지연 200ms 초과', time: '05:12' },
  { id: 'a2', severity: 'warn', source: 'cost', message: '월 예산 80% 도달', time: '03:00' },
  { id: 'a1', severity: 'info', source: 'deploy', message: 'ops-portal v0.1.0 배포 완료', time: '02:14' },
];

export type Ec2 = {
  id: string;
  name: string;
  type: string;
  az: string;
  state: 'running' | 'stopped';
  privateIp: string;
  publicIp: string;
};

export const ec2: Ec2[] = [
  {
    id: 'i-0a1b2c3d4e5f60718',
    name: 'cloudir-web',
    type: 't3.small',
    az: 'ap-northeast-2a',
    state: 'running',
    privateIp: '10.20.1.42',
    publicIp: '43.201.x.x',
  },
  {
    id: 'i-04c9f7a2b81de5063',
    name: 'cloudir-worker',
    type: 't3.small',
    az: 'ap-northeast-2c',
    state: 'running',
    privateIp: '10.20.1.88',
    publicIp: '—',
  },
  {
    id: 'i-0f5e3d1c9a7b26440',
    name: 'cloudir-bastion',
    type: 't3.micro',
    az: 'ap-northeast-2a',
    state: 'stopped',
    privateIp: '10.20.1.10',
    publicIp: '—',
  },
];

export type S3Bucket = {
  name: string;
  region: string;
  objects: number;
  size: string;
  public: boolean;
};

export const s3: S3Bucket[] = [
  { name: 'cloudir-sensitive-111122223333', region: 'ap-northeast-2', objects: 2, size: '3.1 KB', public: false },
  { name: 'cloudir-deploy-111122223333', region: 'ap-northeast-2', objects: 1, size: '48 MB', public: false },
  { name: 'cloudir-trail-111122223333', region: 'ap-northeast-2', objects: 1420, size: '212 MB', public: false },
];

export type Rds = {
  id: string;
  engine: string;
  class: string;
  az: string;
  status: 'available' | 'maintenance';
  storage: string;
};

export const rds: Rds[] = [
  { id: 'cloudir-billing-db', engine: 'PostgreSQL 16.3', class: 'db.t3.micro', az: 'ap-northeast-2a', status: 'available', storage: '20 GB' },
  { id: 'cloudir-auth-db', engine: 'PostgreSQL 16.3', class: 'db.t3.micro', az: 'ap-northeast-2c', status: 'available', storage: '20 GB' },
];

export type AuditRow = {
  time: string;
  actor: string;
  action: string;
  target: string;
  sourceIp: string;
  result: string;
};

export const auditRows: AuditRow[] = [
  { time: '2026-07-08 06:31:12', actor: 'operator', action: 'POST /api/internal/diagnostics', target: 'host=127.0.0.1', sourceIp: '10.20.1.5', result: '200' },
  { time: '2026-07-08 06:12:40', actor: 'operator', action: 'GET /dashboard', target: '-', sourceIp: '10.20.1.5', result: '200' },
  { time: '2026-07-08 05:58:03', actor: 'operator', action: 'UPDATE settings', target: 'notifications', sourceIp: '10.20.1.5', result: '200' },
  { time: '2026-07-08 05:12:19', actor: 'system', action: 'ALERT open', target: 'INC-2041', sourceIp: '-', result: 'created' },
  { time: '2026-07-09 21:44:55', actor: 'park.seoyeon', action: 'RESTART service', target: 'export-service', sourceIp: '10.20.1.7', result: 'ok' },
  { time: '2026-07-09 18:02:31', actor: 'lee.junho', action: 'GET /dashboard/infra', target: '-', sourceIp: '10.20.1.9', result: '200' },
];
