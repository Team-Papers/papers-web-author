import { RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * L'attente, apres la candidature.
 *
 * L'ecran etait un fond sombre a halos flous, le decor de l'ancienne
 * application de lecture. Il prend la forme de l'atelier : du papier, une
 * phrase qui dit combien de temps, et ce qui se passera ensuite. Un auteur
 * qui attend veut savoir quand, pas etre impressionne.
 */
export function PendingPage() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dim px-4 py-12">
      <main className="w-full max-w-md rounded-xl border border-outline bg-surface p-6 sm:p-8">
        <p className="text-sm text-on-surface-muted">Candidature reçue</p>
        <h1 className="mt-1.5 font-display text-[28px] leading-tight font-semibold text-on-surface">
          Notre équipe la relit.
        </h1>
        <p className="mt-3 text-on-surface-variant">
          Vous recevrez un e-mail sous 48 heures. Dès qu'elle est acceptée, vous pourrez publier votre
          premier livre : titre, prix, couverture, manuscrit.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Vérifier maintenant
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
          >
            Se déconnecter
          </button>
        </div>
      </main>
    </div>
  );
}
