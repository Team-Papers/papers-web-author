import { useAuthStore } from '@/features/auth/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline/50 px-6 lg:px-8 py-3.5 transition-colors">
      <div className="flex items-center justify-between">
        <div className="pl-12 lg:pl-0">
          <h1 className="text-lg font-display font-bold text-on-surface">{title}</h1>
          {subtitle && <p className="text-xs text-on-surface-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <>
              <NotificationDropdown />
              <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-outline/50">
                <div className="text-right">
                  <p className="text-sm font-medium text-on-surface leading-tight">{user.firstName} {user.lastName}</p>
                  <p className="text-[11px] text-on-surface-muted">{user.email}</p>
                </div>
                <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
