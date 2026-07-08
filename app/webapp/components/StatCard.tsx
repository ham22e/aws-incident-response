import Sparkline from './Sparkline';

type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  dir?: 'up' | 'down';
  spark?: number[];
};

export default function StatCard({ label, value, unit, delta, dir, spark }: Props) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="stat-foot">
        {delta && <span className={`stat-delta ${dir ?? ''}`}>{delta}</span>}
        {spark && <Sparkline data={spark} width={88} height={26} />}
      </div>
    </div>
  );
}
