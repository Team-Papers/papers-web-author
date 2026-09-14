import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BookStatus } from '@/types/models';
import type { Book } from '@/types/models';

/**
 * L'écran relançait une requête à chaque frappe, et rien ne garantissait
 * l'ordre des réponses. Il charge désormais la liste une seule fois et filtre
 * sur place : le défaut n'a plus de terrain. Ce test tient cette promesse —
 * une requête, pas une de plus — et vérifie que le rangement par état répond
 * bien aux trois questions qu'un auteur se pose.
 */
const getMyBooks = vi.fn();
vi.mock('@/lib/api/books', () => ({
  getMyBooks: (...args: unknown[]) => getMyBooks(...args),
}));

function livre(titre: string, status: BookStatus): Book {
  return {
    id: titre,
    title: titre,
    status,
    price: 1000,
    coverUrl: null,
    createdAt: new Date().toISOString(),
  } as unknown as Book;
}

const BIBLIOTHEQUE = [
  livre('Brouillon du fleuve', BookStatus.DRAFT),
  livre('Manuscrit refusé', BookStatus.REJECTED),
  livre('Roman en relecture', BookStatus.PENDING),
  livre('Recueil en ligne', BookStatus.PUBLISHED),
];

async function afficher() {
  getMyBooks.mockResolvedValue({ data: BIBLIOTHEQUE, total: 4, page: 1, limit: 100, totalPages: 1 });
  const { MyBooksPage } = await import('@/features/books/pages/MyBooksPage');
  render(
    <MemoryRouter>
      <MyBooksPage />
    </MemoryRouter>,
  );
  await screen.findByText('Recueil en ligne');
}

const titres = () =>
  screen
    .queryAllByRole('listitem')
    .map((li) => li.textContent ?? '')
    .filter((t) => t.length > 0);

describe('MyBooksPage — une requête, puis le rangement par état', () => {
  beforeEach(() => vi.clearAllMocks());

  it('charge la liste une seule fois, quoi que tape l’auteur', async () => {
    await afficher();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un titre'), { target: { value: 'fleuve' } });
    fireEvent.change(screen.getByPlaceholderText('Rechercher un titre'), { target: { value: 'fleuv' } });

    expect(getMyBooks).toHaveBeenCalledTimes(1);
    expect(titres()).toHaveLength(1);
    expect(screen.getByText('Brouillon du fleuve')).toBeDefined();
  });

  it('« À faire » ne montre que ce qui attend l’auteur : brouillons et refus', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'À faire' }));

    expect(titres()).toHaveLength(2);
    expect(screen.getByText('Brouillon du fleuve')).toBeDefined();
    expect(screen.getByText('Manuscrit refusé')).toBeDefined();
  });

  it('« En cours » ne montre que ce qui avance sans lui', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'En cours' }));

    expect(titres()).toHaveLength(1);
    expect(screen.getByText('Roman en relecture')).toBeDefined();
  });

  it('une recherche sans résultat le dit avec le terme cherché', async () => {
    await afficher();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un titre'), { target: { value: 'zzz' } });

    expect(titres()).toHaveLength(0);
    expect(screen.getByText(/Aucun titre ne contient/)).toBeDefined();
  });
});
