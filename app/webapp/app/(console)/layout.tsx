// 인증 콘솔 공유 셸(사이드바 + 상단바). 라우트 그룹 (console)은 URL에 나타나지
// 않으므로 미들웨어 경로 매처에 영향이 없다. 중첩 레이아웃이므로 <html>/<body>는
// 렌더하지 않는다(루트 layout.tsx에서만).
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { operator } from '@/lib/mockdata';

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="console">
      <Sidebar />
      <TopBar operator={operator} />
      <main className="page">{children}</main>
    </div>
  );
}
