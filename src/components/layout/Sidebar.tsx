import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, BookOpen, Layers, PlusCircle, Wallet, BarChart3, Settings, LogOut, Presentation, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { pagePublique } from '@/lib/site';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Atelier' },
  { to: '/books', icon: BookOpen, label: 'Mes livres' },
  { to: '/series', icon: Layers, label: 'Mes séries' },
  { to: '/books/new', icon: PlusCircle, label: 'Nouveau livre' },
  { to: '/earnings', icon: Wallet, label: 'Revenus' },
  { to: '/statistics', icon: BarChart3, label: 'Ce qui se vend' },
  { to: '/settings', icon: Settings, label: 'Profil' },
];

export function Sidebar() {
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
            href={pagePublique(authorProfile)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent-400 hover:bg-accent/20 transition-all duration-200 w-full border border-accent/10"
          >
            <Presentation className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
            <span>Ma page publique</span>
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
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/*
        Le tiroir lateral et son hamburger ont disparu du telephone : les
        onglets du bas les remplacent, et deux navigations pour les memes
        destinations en font une de trop. Il reste ce qu'il a toujours ete —
        une colonne, la ou il y a de la place pour une colonne.
      */}
      <aside className="hidden w-[260px] shrink-0 flex-col bg-gradient-sidebar lg:flex">
        <div className="pointer-events-none absolute inset-0 pattern-african" />
        <div className="relative z-10 flex h-full flex-col">{navContent}</div>
      </aside>

      <Modal isOpen={showLogout} onClose={() => setShowLogout(false)} title="Se déconnecter ?"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outlined" onClick={() => setShowLogout(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleLogout}>Se déconnecter</Button>
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
