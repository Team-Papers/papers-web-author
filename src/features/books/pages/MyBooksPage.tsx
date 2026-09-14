import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Tranche } from '@/components/atelier/Tranche';
import { etatDe } from '@/components/atelier/etat';
import { getMyBooks } from '@/lib/api/books';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatCurrency } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import type { Book } from '@/types/models';
import { BookStatus } from '@/types/models';

/**
 * Les livres, rangés par état.
 *
 * La liste était une grille de cartes triée par date, avec une étiquette de
 * couleur dans un coin. Un auteur ne cherche pas « le livre de mardi » : il
 * cherche ce qui bloque, ce qui attend, ce qui est en vente. L'état est donc
 * le rangement, pas une décoration posée dessus.
 *
 * Les filtres ne sont plus les cinq états bruts de la base mais les trois
 * questions qu'un auteur se pose. « Approuvé » et « En examen » se répondaient
 * pareil — rien à faire, ça avance — et méritaient une case commune.
 */
const FILTRES = [
  { cle: '', libelle: 'Tous' },
  { cle: 'attente', libelle: 'À faire' },
  { cle: 'cours', libelle: 'En cours' },
  { cle: BookStatus.PUBLISHED, libelle: 'En ligne' },
] as const;

export function MyBooksPage() {
  const [filtre, setFiltre] = useState<string>('');
  const [recherche, setRecherche] = useState('');

  const { data: livres, loading } = useAsyncData<Book[]>(
    () => getMyBooks({ limit: 100 }).then((res) => res.data),
    [],
    [],
  );

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return livres.filter((livre) => {
      if (terme && !livre.title.toLowerCase().includes(terme)) return false;
      if (!filtre) return true;
      if (filtre === 'attente') return etatDe(livre.status).vousAttend;
      if (filtre === 'cours') {
        const etat = etatDe(livre.status);
        return !etat.vousAttend && etat.suite !== null;
      }
      return livre.status === filtre;
    });
  }, [livres, filtre, recherche]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 lg:max-w-4xl lg:px-8">
      <header className="flex items-baseline gap-4 pt-8 pb-6 [&>h1]:mr-auto">
        <h1 className="font-display text-[28px] font-semibold text-on-surface lg:text-4xl">
          Mes livres
        </h1>
        {/* Les séries n'ont pas d'onglet : au téléphone, c'est d'ici qu'on y va. */}
        <Link
          to="/series"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary-lisible hover:underline"
        >
          Séries
        </Link>
        <Link
          to="/books/new"
          className="hidden min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-on-primary lg:inline-flex"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Publier
        </Link>
      </header>

      <label className="relative mb-4 block">
        <span className="sr-only">Rechercher un livre</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-on-surface-muted"
          aria-hidden
        />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un titre"
          className="min-h-11 w-full rounded-lg border border-outline bg-surface pr-3 pl-10 text-on-surface placeholder:text-on-surface-muted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        />
      </label>

      {/* Les filtres défilent plutôt que de se replier sur deux lignes : au
          téléphone, une rangée qui saute de hauteur fait sauter la liste. */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <div className="flex w-max gap-2">
          {FILTRES.map(({ cle, libelle }) => (
            <button
              key={cle}
              type="button"
              onClick={() => setFiltre(cle)}
              aria-pressed={filtre === cle}
              className={cn(
                'min-h-10 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
                filtre === cle
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline bg-surface text-on-surface-variant hover:bg-surface-dim',
              )}
            >
              {libelle}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : visibles.length === 0 ? (
        <Vide filtre={filtre} recherche={recherche} aucunLivre={livres.length === 0} />
      ) : (
        <ul className="flex flex-col gap-2">
          {visibles.map((livre) => (
            <LigneDeLivre key={livre.id} livre={livre} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LigneDeLivre({ livre }: { livre: Book }) {
  const etat = etatDe(livre.status);

  return (
    <li>
      <Link
        to={`/books/${livre.id}`}
        className="flex min-h-[72px] items-stretch gap-3 rounded-lg border border-outline bg-surface px-3 py-3 transition-colors hover:bg-surface-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Tranche statut={livre.status} />

        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="truncate font-medium text-on-surface">{livre.title}</span>
          <span className="mt-0.5 flex items-center gap-2 text-sm">
            <span style={{ color: etat.teinte }}>{etat.mot}</span>
            {etat.suite && (
              <>
                <span className="text-outline" aria-hidden>
                  ·
                </span>
                <span className="truncate text-on-surface-muted">{etat.suite}</span>
              </>
            )}
          </span>
        </span>

        {/* Le prix n'apparaît que sur ce qui se vend : sur un brouillon, c'est
            une intention, pas un chiffre. */}
        {livre.status === BookStatus.PUBLISHED && (
          <span className="self-center text-sm font-medium tabular-nums text-accent-lisible">
            {formatCurrency(Number(livre.price) || 0)}
          </span>
        )}
      </Link>
    </li>
  );
}

/** Chaque vide dit ce qu'il faut faire, et pas seulement qu'il est vide. */
function Vide({
  filtre,
  recherche,
  aucunLivre,
}: {
  filtre: string;
  recherche: string;
  aucunLivre: boolean;
}) {
  if (recherche.trim()) {
    return (
      <p className="rounded-lg border border-dashed border-outline px-5 py-10 text-center text-sm text-on-surface-variant">
        Aucun titre ne contient «&nbsp;{recherche.trim()}&nbsp;».
      </p>
    );
  }

  if (aucunLivre) {
    return (
      <div className="rounded-xl border border-dashed border-outline bg-surface px-5 py-10 text-center">
        <h2 className="font-display text-xl font-semibold text-on-surface">
          Votre premier manuscrit
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-on-surface-variant">
          Titre, prix, fichier. Notre équipe le relit, puis il part en vente.
        </p>
        <Link
          to="/books/new"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-medium text-on-primary"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Publier un livre
        </Link>
      </div>
    );
  }

  const phrases: Record<string, string> = {
    attente: 'Rien ne vous attend. Tout est envoyé.',
    cours: 'Rien en cours de relecture.',
    [BookStatus.PUBLISHED]: 'Aucun livre en vente pour l’instant.',
  };

  return (
    <p className="rounded-lg border border-dashed border-outline px-5 py-10 text-center text-sm text-on-surface-variant">
      {phrases[filtre] ?? 'Rien ici.'}
    </p>
  );
}
