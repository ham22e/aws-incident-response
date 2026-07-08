import Link from 'next/link';
import { Icon } from '@/components/icons';

const tools = [
  { icon: 'network', name: '네트워크 진단', desc: '대상 호스트 도달성(ping) 점검', href: '/admin/diagnostics', ready: true },
  { icon: 'clipboard', name: '로그 익스포트', desc: '접근 로그 CSV 내보내기', ready: false },
  { icon: 'activity', name: '헬스 체크', desc: '서비스 엔드포인트 상태 점검', ready: false },
  { icon: 'database', name: '캐시 무효화', desc: 'CDN/앱 캐시 퍼지', ready: false },
  { icon: 'shield', name: '배포 롤백', desc: '직전 릴리스로 되돌리기', ready: false },
  { icon: 'server', name: '인스턴스 재시작', desc: 'systemd 유닛 재기동', ready: false },
];

export default function AdminTools() {
  return (
    <>
      <div className="breadcrumb">
        관리 도구 <span className="sep">/</span> 도구
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">관리 도구</h1>
          <p className="desc">운영팀 전용 도구 모음. 접근은 감사 로그에 기록됩니다.</p>
        </div>
      </div>

      <div className="grid">
        {tools.map((t) =>
          t.ready ? (
            <Link key={t.name} href={t.href ?? '#'} className="tool-card">
              <span className="ico">
                <Icon name={t.icon} />
              </span>
              <h3>{t.name}</h3>
              <span className="muted" style={{ fontSize: 13 }}>
                {t.desc}
              </span>
              <span className="badge badge--ok" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                사용 가능
              </span>
            </Link>
          ) : (
            <div key={t.name} className="tool-card disabled">
              <span className="ico">
                <Icon name={t.icon} />
              </span>
              <h3>{t.name}</h3>
              <span className="muted" style={{ fontSize: 13 }}>
                {t.desc}
              </span>
              <span className="badge badge--muted" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                준비 중
              </span>
            </div>
          ),
        )}
      </div>
    </>
  );
}
