import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, BookOpen, PlusCircle, Wallet, BarChart3, Settings, LogOut, Menu, X, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/features/auth/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/books', icon: BookOpen, label: 'Mes livres' },
  { to: '/books/new', icon: PlusCircle, label: 'Nouveau livre' },
  { to: '/earnings', icon: Wallet, label: 'Revenus' },
  { to: '/statistics', icon: BarChart3, label: 'Statistiques' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const authorProfile = useAuthStore((s) => s.authorProfile);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
          <img src="/logo.png" alt="Papers" className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-on-surface tracking-tight">Papers</span>
          <span className="text-xs text-on-surface-variant">Auteur</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                  isActive && 'drop-shadow-sm'
                )} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Showcase + Logout */}
      <div className="px-3 pb-6 space-y-2">
        {authorProfile?.id && (
          <a
            href={`https://showcase.papers237.duckdns.org/${authorProfile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-accent/10 text-accent-600 hover:bg-accent hover:text-white transition-all duration-200 w-full"
          >
            <Presentation className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Ma vitrine</span>
          </a>
        )}
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-error-container hover:text-error transition-all duration-200 w-full"
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span>Deconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-outline-variant flex flex-col transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
