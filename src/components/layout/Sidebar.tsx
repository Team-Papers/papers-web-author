import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, BookOpen, PlusCircle, Wallet, BarChart3, Settings, LogOut, Menu, X, Presentation, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/books', icon: BookOpen, label: 'Mes livres' },
  { to: '/books/new', icon: PlusCircle, label: 'Nouveau livre' },
  { to: '/earnings', icon: Wallet, label: 'Revenus' },
  { to: '/statistics', icon: BarChart3, label: 'Statistiques' },
  { to: '/settings', icon: Settings, label: 'Parametres' },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
          <img src="/logo.png" alt="Papers" className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-display font-bold text-white tracking-tight">Papers<span className="text-primary-400">.</span></span>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Espace Auteur</span>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-white/10" />

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-in',
                isActive
                  ? 'bg-primary/20 text-white shadow-sm border border-primary/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )
            }
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,180,216,0.6)]" />
                )}
                <item.icon className={cn(
                  'h-[18px] w-[18px] flex-shrink-0 transition-all',
                  isActive ? 'text-primary-300' : 'group-hover:text-primary-400'
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2">
        {/* Showcase link */}
        {authorProfile?.id && (
          <a
            href={`https://showcase-papers.seed-innov.com/${authorProfile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent-400 hover:bg-accent/20 transition-all duration-200 w-full border border-accent/10"
          >
            <Presentation className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
            <span>Ma vitrine</span>
          </a>
        )}

        {/* Separator */}
        <div className="mx-2 h-px bg-white/10" />

        {/* Author profile */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" className="ring-2 ring-primary/30" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{authorProfile?.penName || `${user.firstName} ${user.lastName}`}</p>
              <p className="text-[11px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => setShowLogout(true)}
          className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-error/10 hover:text-error transition-all duration-200 w-full"
        >
          <LogOut className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
          <span>Deconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-surface shadow-lg border border-outline"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-[260px] bg-gradient-sidebar flex flex-col transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute inset-0 pattern-african pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          {navContent}
        </div>
      </aside>

      <Modal isOpen={showLogout} onClose={() => setShowLogout(false)} title="Se deconnecter ?"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outlined" onClick={() => setShowLogout(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleLogout}>Se deconnecter</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error/10 mb-4">
            <LogOut className="h-7 w-7 text-error" />
          </div>
          <p className="text-sm text-on-surface-variant">
            Vous etes sur le point de vous deconnecter de votre espace auteur. Souhaitez-vous continuer ?
          </p>
        </div>
      </Modal>
    </>
  );
}
