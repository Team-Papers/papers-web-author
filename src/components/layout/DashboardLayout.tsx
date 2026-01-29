import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-surface-dim">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
