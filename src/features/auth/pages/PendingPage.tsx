import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/store/authStore';

export function PendingPage() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-surface-dim flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-warning-container flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-3">Candidature en cours d'examen</h1>
        <p className="text-on-surface-variant mb-8">
          Votre profil d'auteur est en cours de vérification par notre équipe.
          Vous recevrez une notification dès que votre candidature sera approuvée.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="tonal" fullWidth onClick={() => window.location.reload()}>
            Vérifier le statut
          </Button>
          <Button variant="text" fullWidth onClick={logout}>
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
