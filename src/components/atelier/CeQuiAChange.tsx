import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { resumeDe, type Revision } from '@/features/books/historique';
import { formatDate } from '@/lib/utils/formatters';
import { messageDe } from '@/lib/utils/erreurs';

/**
 * « Ce qui a changé », replié.
 *
 * Un auteur ouvre une fiche pour savoir où en est son œuvre, pas pour lire son
 * journal de bord : la rubrique est donc fermée, et ne coûte rien tant qu'on
 * ne l'ouvre pas — c'est aussi pour cela que la requête n'est lancée qu'à
 * l'ouverture. Elle répond quand on la pose : « ai-je bien enregistré ma
 * correction ? », « depuis quand ce prix ? ».
 *
 * Cinq lignes : au-delà, ce n'est plus un repère mais une archive, et une
 * archive se consulte ailleurs.
 *
 * Partagée entre le livre et la série : les deux fiches posent la même
 * question, et seule la liste des champs suivis diffère — ce dont le serveur
 * s'occupe.
 */
export function CeQuiAChange({
  charger,
  vide,
}: {
  /** Va chercher l'historique. Appelée une seule fois, à l'ouverture. */
  charger: () => Promise<Revision[]>;
  /** Ce qu'on dit quand rien n'a bougé depuis la création. */
  vide: string;
}) {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function lire() {
    if (revisions !== null || erreur !== null) return;
    try {
      setRevisions(await charger());
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <section className="mt-8">
      <details
        className="group"
        onToggle={(e) => {
          if ((e.currentTarget as HTMLDetailsElement).open) void lire();
        }}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5">
          <ChevronRight
            className="h-4 w-4 shrink-0 text-on-surface-muted transition-transform group-open:rotate-90"
            aria-hidden
          />
          <h2 className="text-sm font-semibold text-on-surface-variant">Ce qui a changé</h2>
        </summary>

        <div className="mt-2 pl-[22px]">
          {erreur ? (
            <p role="alert" className="text-sm text-error">
              {erreur}
            </p>
          ) : revisions === null ? (
            <p className="text-sm text-on-surface-muted">Chargement…</p>
          ) : revisions.length === 0 ? (
            <p className="text-sm text-on-surface-muted">{vide}</p>
          ) : (
            <ol className="space-y-2 border-l-2 border-outline pl-4">
              {revisions.map((revision) => (
                <li key={revision.id} className="text-sm">
                  <span className="text-on-surface-muted">{formatDate(revision.changedAt)}</span>
                  <span className="text-outline" aria-hidden>
                    {' — '}
                  </span>
                  <span className="text-on-surface">{resumeDe(revision)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </details>
    </section>
  );
}
