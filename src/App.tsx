import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AppRoutes } from '@/routes';
import { Spinner } from '@/components/ui/Spinner';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim">
        <Spinner size="lg" />
      </div>
    );
  }

  return <AppRoutes />;
}
