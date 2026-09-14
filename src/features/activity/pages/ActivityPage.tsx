import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { useNotifications } from '@/lib/hooks/useNotifications';
import type { Notification } from '@/types/models';
import { cn } from '@/lib/utils/cn';

/**
 * Ce qui est arrivé à l'auteur.
 *
 * Depuis la refonte, plus aucune page ne montrait les notifications : la
 * cloche vivait dans le bandeau, disparu avec lui. Un auteur n'apprenait plus
 * qu'un livre était accepté, refusé ou vendu qu'en allant voir.
 *
 * Une ligne par événement, la plus récente en haut, non lue en gras. Quand
 * l'événement porte un lien public — un livre qui vient de paraître — la
 * ligne offre de le partager : c'est le moment où l'auteur en a le plus envie.
 */
export function ActivityPage() {
  const { notifications, isLoading, markAsRead, markAllAsRead, refresh } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const nonLues = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="flex items-baseline justify-between gap-4 pt-8 pb-6">
        <h1 className="font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
          Activité
        </h1>
        {nonLues > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary-lisible hover:underline"
          >
            Tout marquer lu
          </button>
        )}
      </header>

      {isLoading && notifications.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline bg-surface px-5 py-8 text-center text-sm text-on-surface-variant">
          Rien encore. Vous lirez ici chaque relecture terminée, chaque vente et chaque versement.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Ligne key={n.id} n={n} onLue={() => markAsRead(n.id)} />
          ))}
        </ol>
      )}
    </div>
  );
}

function Ligne({ n, onLue }: { n: Notification; onLue: () => void }) {
  const url = typeof n.data?.url === 'string' ? n.data.url : null;
  const bookId = typeof n.data?.bookId === 'string' ? n.data.bookId : null;

  return (
    <li
      className={cn(
        'rounded-lg border border-outline bg-surface px-4 py-3',
        !n.read && 'border-l-[3px] border-l-primary',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-on-surface', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</p>
          {n.message && <p className="mt-0.5 text-sm text-on-surface-variant">{sansLien(n.message, url)}</p>}
          <p className="mt-1 text-xs text-on-surface-muted">{depuis(n.createdAt)}</p>
        </div>
        {!n.read && (
          <button
            type="button"
            onClick={onLue}
            aria-label="Marquer comme lue"
            title="Marquer comme lue"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-muted hover:bg-surface-container hover:text-on-surface"
          >
            <Check className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {(url || bookId) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {url && <Partager url={url} titre={n.title} />}
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-primary-lisible hover:underline"
            >
              Voir la page
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : (
            <Link
              to={`/books/${bookId}`}
              className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-primary-lisible hover:underline"
            >
              Voir le livre
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

/** Le lien est deja un bouton en dessous : ne pas le repeter en clair dans la phrase. */
function sansLien(message: string, url: string | null) {
  if (!url) return message;
  return message.replace(url, '').replace(/\s*:\s*$/, '.').trim();
}

function Partager({ url, titre }: { url: string; titre: string }) {
  const [copie, setCopie] = useState(false);
  const natif = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function agir() {
    if (natif) {
      await navigator.share({ title: titre, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Sans presse-papiers, le lien reste dans « Voir la page ».
    }
  }

  return (
    <button
      type="button"
      onClick={agir}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
    >
      {natif ? <Share2 className="h-4 w-4" aria-hidden /> : copie ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {natif ? 'Partager' : copie ? 'Copié' : 'Copier le lien'}
    </button>
  );
}

function depuis(date: string) {
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (min < 1) return 'À l’instant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `Il y a ${j} j`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
