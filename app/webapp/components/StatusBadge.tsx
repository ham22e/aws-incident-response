// status/severity 문자열을 색 톤 + 한국어 라벨 배지로 변환.
type Tone = 'ok' | 'warn' | 'crit' | 'info' | 'muted';

const MAP: Record<string, [Tone, string]> = {
  // 서비스/리소스 상태
  healthy: ['ok', '정상'],
  degraded: ['warn', '저하'],
  down: ['crit', '중단'],
  running: ['ok', 'running'],
  stopped: ['muted', 'stopped'],
  available: ['ok', 'available'],
  maintenance: ['warn', 'maintenance'],
  // 인시던트 상태
  open: ['crit', '열림'],
  investigating: ['warn', '조사 중'],
  resolved: ['muted', '해결'],
  // 심각도
  low: ['info', 'Low'],
  medium: ['warn', 'Medium'],
  high: ['crit', 'High'],
  critical: ['crit', 'Critical'],
};

export default function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [tone, def] = MAP[status] ?? (['muted', status] as [Tone, string]);
  return <span className={`badge badge--${tone}`}>{label ?? def}</span>;
}
