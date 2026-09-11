import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BookStatus } from '@/types/models';
import type { Book } from '@/types/models';

/**
 * L'écran relance sa requête à chaque frappe dans le champ de recherche.
 * Sans annulation, rien ne garantit l'ordre des réponses : la requête lancée
 * en premier peut revenir en dernier et écraser un résultat plus récent.
 * L'auteur voit alors une liste qui ne correspond pas à ce qu'il a tapé.
 *
 * Le test agit sur UNE SEULE instance du composant : remonter le composant
 * donnerait un état neuf et React ignorerait silencieusement l'écriture
 * tardive, ce qui masquerait le défaut au lieu de le démontrer.
 */
const getMyBooks = vi.fn();
vi.mock('@/lib/api/books', () => ({
  getMyBooks: (...args: unknown[]) => getMyBooks(...args),
}));

function livre(titre: string): Book {
  return {
    id: titre,
    title: titre,
    status: BookStatus.PUBLISHED,
    price: 1000,
    coverUrl: null,
    createdAt: new Date().toISOString(),
  } as unknown as Book;
}

function page(livres: Book[]) {
  return { data: livres, total: livres.length, page: 1, limit: 20, totalPages: 1 };
}

/** Une promesse que le test résout quand il veut, pour ordonner les réponses. */
function differee<T>() {
  let resoudre!: (valeur: T) => void;
  const promesse = new Promise<T>((r) => {
    resoudre = r;
  });
  return { promesse, resoudre };
}

describe('MyBooksPage — réponses dans le désordre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignore une réponse obsolète arrivée après une plus récente', async () => {
    const premiere = differee<ReturnType<typeof page>>();
    const seconde = differee<ReturnType<typeof page>>();

    getMyBooks.mockReturnValueOnce(premiere.promesse).mockReturnValueOnce(seconde.promesse);

    const { MyBooksPage } = await import('@/features/books/pages/MyBooksPage');
    render(
      <MemoryRouter>
        <MyBooksPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getMyBooks).toHaveBeenCalledTimes(1));

    // Une frappe dans la recherche relance l'effet sur la même instance.
    fireEvent.change(screen.getByPlaceholderText('Rechercher un livre...'), {
      target: { value: 'z' },
    });
    await waitFor(() => expect(getMyBooks).toHaveBeenCalledTimes(2));

    // La seconde requête répond d'abord, la première ensuite : exactement ce
    // qu'un réseau lent produit.
    seconde.resoudre(page([livre('Resultat recent')]));
    await waitFor(() => expect(screen.getByText('Resultat recent')).toBeDefined());

    premiere.resoudre(page([livre('Resultat obsolete')]));
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.queryByText('Resultat obsolete')).toBeNull();
    expect(screen.getByText('Resultat recent')).toBeDefined();
  });
});
