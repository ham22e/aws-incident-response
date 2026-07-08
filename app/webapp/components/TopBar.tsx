import Link from 'next/link';
import { Icon } from './icons';
import { alerts, type Operator } from '@/lib/mockdata';

export default function TopBar({ operator }: { operator: Operator }) {
  const initial = operator.name.slice(0, 1);
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Icon name="search" />
        <input placeholder="리소스 · 인시던트 검색" aria-label="검색" />
      </div>

      <div className="topbar-actions">
        <details className="menu">
          <summary className="icon-btn" aria-label="알림">
            <Icon name="bell" />
            <span className="badge-dot" />
          </summary>
          <div className="menu-panel">
            <div className="menu-head">
              <strong>알림</strong> <span className="muted">{alerts.length}건</span>
            </div>
            {alerts.map((a) => (
              <div className="menu-row" key={a.id}>
                <span className={`sev sev--${a.severity === 'crit' ? 'crit' : a.severity === 'warn' ? 'warn' : 'info'}`} />
                <div>
                  <div>{a.message}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {a.source} · {a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>

        <details className="menu">
          <summary className="user-chip">
            <span className="avatar">{initial}</span>
            <span className="who">
              {operator.name}
              <small>{operator.role}</small>
            </span>
          </summary>
          <div className="menu-panel">
            <div className="menu-head">
              <strong>{operator.name}</strong>
              <div className="muted mono" style={{ fontSize: 12 }}>
                {operator.email}
              </div>
            </div>
            <Link className="menu-row" href="/dashboard/settings">
              <Icon name="settings" />
              <span>설정</span>
            </Link>
            <Link className="menu-row" href="/">
              <Icon name="logout" />
              <span>로그아웃</span>
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
