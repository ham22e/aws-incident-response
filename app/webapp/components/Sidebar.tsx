import SidebarNav from './SidebarNav';
import { navConfig } from '@/lib/mockdata';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="logo-mark">C</span>
        Cloud Ops
        <span className="env">internal</span>
      </div>
      <div className="tenant">
        <strong>cloudir-prod</strong>
        <span>ap-northeast-2</span>
      </div>
      <SidebarNav groups={navConfig} />
      <div className="sidebar-foot">ops-portal v0.1.0</div>
    </aside>
  );
}
