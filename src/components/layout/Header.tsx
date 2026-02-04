import { useAuthStore } from '@/features/auth/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="pl-12 lg:pl-0">
          <h1 className="text-xl font-bold text-on-surface">{title}</h1>
          {subtitle && <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-on-surface">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-on-surface-variant">{user.email}</p>
              </div>
              <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="sm" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
