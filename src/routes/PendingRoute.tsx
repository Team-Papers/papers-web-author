import { Navigate } from 'react-router';
import { Spinner } from '@/components/ui/Spinner';
import { PendingPage } from '@/features/auth/pages/PendingPage';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AuthorStatus } from '@/types/models';

/**
 * L'ecran d'attente, avec une sortie.
 *
 * `/pending` n'etait derriere aucun garde. Le garde des pages protegees y
 * envoie un candidat en attente, mais rien ne l'en faisait jamais sortir : une
 * fois approuve, l'auteur rechargeait la page — c'est tout ce que fait le
 * bouton « Verifier le statut » — et retombait sur le meme ecran. Le seul
 * moyen d'entrer dans son espace etait de taper une autre adresse a la main.
 *
 * Le rechargement fonctionne pourtant : `checkAuth` relit le profil depuis le
 * serveur au demarrage. Il manquait seulement quelqu'un pour en tirer la
 * conclusion.
 */
export function PendingRoute() {
  const { isAuthenticated, isLoading, authorProfile } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Pas encore de candidature : c'est la qu'il faut aller, pas ici.
  if (!authorProfile) return <Navigate to="/apply" replace />;

  // Approuve pendant qu'il attendait : on l'emmene chez lui.
  if (authorProfile.status === AuthorStatus.APPROVED) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PendingPage />;
}
