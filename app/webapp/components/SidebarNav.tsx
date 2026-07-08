'use client';

// 사이드바 네비게이션. usePathname()으로 현재 경로의 링크에 active 표시만 부여한다.
// (데이터/네트워크/취약 경로와 무관한 순수 표현용 클라이언트 컴포넌트.)
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icons';
import type { NavGroup } from '@/lib/mockdata';

export default function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav>
      {groups.map((g) => (
        <div className="nav-group" key={g.group}>
          <div className="nav-group-label">{g.group}</div>
          {g.items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
