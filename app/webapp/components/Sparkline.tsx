// 순수 인라인 SVG 스파크라인(라이브러리 없음). data의 min/max로 스케일링.
type Props = {
  data: number[];
  width?: number;
  height?: number;
  area?: boolean;
};

export default function Sparkline({ data, width = 100, height = 30, area = true }: Props) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + (1 - (v - min) / span) * h;
    return [x, y] as const;
  });

  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath =
    `M ${pts[0][0].toFixed(1)},${(height - pad).toFixed(1)} ` +
    pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(' ') +
    ` L ${pts[pts.length - 1][0].toFixed(1)},${(height - pad).toFixed(1)} Z`;

  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {area && <path className="area" d={areaPath} />}
      <polyline points={line} />
    </svg>
  );
}
