import { NavLink, useLocation } from 'react-router';
import { LayoutGrid, BookMarked, Coins, UserRound, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * La barre d'onglets, et l'action qui compte.
 *
 * L'espace auteur s'ouvrait sur un menu hamburger et un tiroir lateral : la
 * disposition d'un site de bureau retrecie. Un auteur travaille au telephone,
 * souvent debout, d'une main. Ses quatre destinations sont donc visibles en
 * permanence, sous le pouce.
 *
 * « Publier » n'est pas un onglet mais un bouton pose au-dessus d'eux : c'est
 * un geste, pas un lieu, et c'est le seul que l'application existe pour
 * rendre facile. Le mettre au meme rang que « Revenus » serait mentir sur son
 * importance.
 *
 * Les series vivent sous « Livres » : une serie est une facon de ranger des
 * livres, pas une matiere a part. Cinq onglets auraient serre les cibles sous
 * les 44 px tenables au doigt.
 */
const DESTINATIONS = [
  { to: '/dashboard', libelle: 'Atelier', Icone: LayoutGrid },
  { to: '/books', libelle: 'Livres', Icone: BookMarked },
  { to: '/earnings', libelle: 'Revenus', Icone: Coins },
  { to: '/settings', libelle: 'Profil', Icone: UserRound },
] as const;

export function OngletsBas() {
  const { pathname } = useLocation();

  /**
   * Publier est une tache, pas un lieu : elle prend l'ecran entier.
   *
   * Les onglets s'effacent avec le bouton. Ils recouvraient les actions de
   * l'assistant — « Suivant » etait litteralement sous la barre — et, meme
   * degages, proposer quatre sorties au meme poids visuel que « Suivant »
   * invite a abandonner un formulaire a moitie rempli.
   *
   * L'assistant garde sa propre sortie : « Annuler », a gauche, loin du pouce.
   */
  const enTrainDePublier = pathname.startsWith('/books/new');

  return (
    <>
      {!enTrainDePublier && (
        <NavLink
          to="/books/new"
          aria-label="Publier un livre"
          className={cn(
            'fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full lg:hidden',
            'bg-primary text-on-primary shadow-flottant',
            'transition-transform active:scale-95',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          )}
          style={{ bottom: 'calc(var(--hauteur-onglets) + env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </NavLink>
      )}

      {enTrainDePublier ? null : (
      <nav
        aria-label="Navigation principale"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 lg:hidden',
          'border-t border-outline bg-surface/95 backdrop-blur-lg',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <ul className="flex">
          {DESTINATIONS.map(({ to, libelle, Icone }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    // 44 px est le minimum tenable au doigt ; on est a 56.
                    'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2',
                    'text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-primary-lisible'
                      : 'text-on-surface-muted hover:text-on-surface',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icone className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                    <span className="max-w-full truncate">{libelle}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      )}
    </>
  );
}
