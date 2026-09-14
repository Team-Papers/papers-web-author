import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Spinner } from '@/components/ui/Spinner';
import { Tranche } from '@/components/atelier/Tranche';
import { getMyStats } from '@/lib/api/authors';
import { getMyBooks } from '@/lib/api/books';
import { formatCurrency, toNumber } from '@/lib/utils/formatters';
import type { AuthorStats, Book } from '@/types/models';

/**
 * Ce qui se vend.
 *
 * L'ecran s'appelait « Statistiques » et ouvrait sur un histogramme des
 * livres par statut — une information que la liste des livres donne deja,
 * rangee par etat — peint aux couleurs de Google. Il repond desormais a la
 * seule question qu'un auteur se pose ici : lequel de mes livres marche, et
 * combien m'a-t-il rapporte. Le net, livre par livre, tel que l'API le
 * compte ; jamais un prix multiplie par un taux.
 */
export function StatisticsPage() {
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [livres, setLivres] = useState<Book[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyStats().catch(() => null),
      getMyBooks({ limit: 100 }).catch(() => ({ data: [] as Book[] })),
    ])
      .then(([s, b]) => {
        if (s) setStats(s);
        setLivres(b.data);
      })
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="flex h-96 items-center justify-center"><Spinner size="lg" /></div>;

  const vendus = livres
    .filter((l) => (l.totalSales ?? 0) > 0)
    .sort((a, b) => toNumber(b.totalRevenue) - toNumber(a.totalRevenue));
  const meilleur = vendus[0] ? toNumber(vendus[0].totalRevenue) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="pt-8 pb-6">
        <h1 className="font-display text-[28px] leading-tight font-semibold text-on-surface lg:text-4xl">
          Ce qui se vend
        </h1>
      </header>

      {stats && (
        <dl className="grid grid-cols-2 gap-4 rounded-xl border border-outline bg-surface p-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-on-surface-muted">Ventes</dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-on-surface">{stats.totalSales}</dd>
          </div>
          <div>
            <dt className="text-sm text-on-surface-muted">Net pour vous</dt>
            <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-accent-lisible">
              {formatCurrency(toNumber(stats.totalRevenue))}
            </dd>
          </div>
          {stats.totalRatings > 0 && (
            <div>
              <dt className="text-sm text-on-surface-muted">Note moyenne</dt>
              <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-on-surface">
                {stats.averageRating.toFixed(1)}
                <span className="ml-1.5 font-sans text-sm font-normal text-on-surface-muted">
                  sur {stats.totalRatings} avis
                </span>
              </dd>
            </div>
          )}
        </dl>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">Livre par livre</h2>
        {vendus.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline bg-surface px-5 py-8 text-center text-sm text-on-surface-variant">
            Dès qu'un livre se vend, il apparaît ici avec ce qu'il vous a rapporté.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {vendus.map((livre) => {
              const net = toNumber(livre.totalRevenue);
              const part = meilleur > 0 ? Math.max(4, (net / meilleur) * 100) : 0;
              return (
                <li key={livre.id}>
                  <Link
                    to={`/books/${livre.id}`}
                    className="flex min-h-[72px] items-stretch gap-3 rounded-lg border border-outline bg-surface px-3 py-3 transition-colors hover:bg-surface-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Tranche statut={livre.status} />
                    <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium text-on-surface">{livre.title}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-accent-lisible">
                          {formatCurrency(net)}
                        </span>
                      </span>
                      {/* La barre compare les livres entre eux, pas a un objectif :
                          la plus longue est le meilleur vendeur, les autres se lisent
                          par rapport a lui. */}
                      <span className="flex items-center gap-3">
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container-high" aria-hidden>
                          <span className="block h-full rounded-full bg-accent" style={{ width: `${part}%` }} />
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-on-surface-muted">
                          {/* Vues puis ventes : le rapport entre les deux est la seule
                              chose qui dise si une fiche convainc. */}
                          {typeof livre.views === 'number' && `${livre.views} ${livre.views === 1 ? 'vue' : 'vues'} · `}
                          {livre.totalSales === 1 ? '1 vente' : `${livre.totalSales} ventes`}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
