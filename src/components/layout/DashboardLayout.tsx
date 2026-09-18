import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { TopBar } from './TopBar.tsx';

export function DashboardLayout() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]" style={{ paddingLeft: 'var(--sidebar-w)' }}>
      <Sidebar />
      <div className="flex flex-col min-h-dvh">
        <TopBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
