import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/store/authStore';

export function PendingPage() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pattern-african" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative z-10 max-w-md text-center">
        <div className="w-20 h-20 rounded-2xl bg-warning/20 border border-warning/30 flex items-center justify-center mx-auto mb-6 animate-float">
          <Clock className="h-10 w-10 text-warning" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">Candidature en cours d&apos;examen</h1>
        <p className="text-white/60 mb-8 leading-relaxed">
          Votre profil d&apos;auteur est en cours de verification par notre equipe.
          Vous recevrez une notification des que votre candidature sera approuvee.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="filled" fullWidth onClick={() => window.location.reload()} leftIcon={<RefreshCw className="h-4 w-4" />} className="bg-white text-primary hover:bg-white/90">
            Verifier le statut
          </Button>
          <Button variant="text" fullWidth onClick={logout} leftIcon={<LogOut className="h-4 w-4" />} className="text-white/50 hover:text-white hover:bg-white/10">
            Se deconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
