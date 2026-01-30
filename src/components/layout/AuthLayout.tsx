import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-dim flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Paper's" className="h-10 w-10" />
            <span className="text-2xl font-bold text-on-surface tracking-tight">Paper's</span>
          </div>
        </div>
        <div className="bg-surface rounded-3xl shadow-lg border border-outline-variant p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
