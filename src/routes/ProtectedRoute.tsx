import { Navigate } from 'react-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AuthorStatus } from '@/types/models';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, authorProfile } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // No author profile yet → apply
  if (!authorProfile) return <Navigate to="/apply" replace />;

  // Author pending → pending page
  if (authorProfile.status === AuthorStatus.PENDING) return <Navigate to="/pending" replace />;

  // Author rejected
  if (authorProfile.status === AuthorStatus.REJECTED) return <Navigate to="/pending" replace />;

  return <>{children}</>;
}
