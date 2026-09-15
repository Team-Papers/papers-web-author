import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { BookStatus } from '@/types/models';
import type { Book } from '@/types/models';
import { formatCurrency as fc } from '@/lib/utils/formatters';

const formatCurrency = (n: number) => fc(n).replace(/\s/g, ' ');

/**
 * La fiche affichait « Revenus totaux » = ventes × prix × 0,7. Le taux est un
 * réglage serveur qui peut changer, et le prix d'un livre aussi : le chiffre
 * était inventé. L'API calcule le net réellement versé, livre par livre ;
 * c'est lui, et lui seul, que l'auteur doit lire.
 */
const getMyBooks = vi.fn();
const getBookRevisions = vi.fn();
vi.mock('@/lib/api/books', () => ({
  getMyBooks: () => getMyBooks(),
  getBookRevisions: (...a: unknown[]) => getBookRevisions(...a),
  submitBook: vi.fn(),
  deleteBook: vi.fn(),
  unpublishBook: vi.fn(),
}));

function livre(extra: Partial<Book>): Book {
  return {
    id: 'l1',
    title: 'Le fleuve',
    description: 'Un roman.',
    price: 10000,
    status: BookStatus.PUBLISHED,
    totalSales: 3,
    totalRevenue: 12000,
    averageRating: 0,
    reviewCount: 0,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    authorId: 'a1',
    ...extra,
  } as Book;
}

async function afficher(b: Book) {
  getMyBooks.mockResolvedValue({ data: [b], total: 1, page: 1, limit: 100, totalPages: 1 });
  const { BookDetailPage } = await import('@/features/books/pages/BookDetailPage');
  render(
    <MemoryRouter initialEntries={['/books/l1']}>
      <Routes>
        <Route path="/books/:id" element={<BookDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Le fleuve', level: 1 }, { timeout: 5000 });
}

describe('BookDetailPage — ce que le livre a vraiment rapporté', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche le net calculé par l’API, jamais ventes × prix × 0,7', async () => {
    await afficher(livre({}));

    expect(screen.getByText(formatCurrency(12000))).toBeDefined();
    expect(screen.queryByText(formatCurrency(21000))).toBeNull();
    expect(screen.queryByText(/70\s?%/)).toBeNull();
  });

  it('un brouillon ne montre ni ventes ni revenus, et propose de l’envoyer', async () => {
    await afficher(livre({ status: BookStatus.DRAFT, totalSales: 0, totalRevenue: 0 }));

    expect(screen.queryByText(/Ventes/)).toBeNull();
    expect(screen.getByRole('button', { name: /Envoyer/ })).toBeDefined();
  });

  it('un refus ouvre sur le motif, puis sur la correction', async () => {
    await afficher(livre({ status: BookStatus.REJECTED, rejectionReason: 'Couverture illisible' }));

    expect(screen.getByText('Couverture illisible')).toBeDefined();
    expect(screen.getByRole('link', { name: /Corriger/ })).toBeDefined();
  });
});

/**
 * « Modifié le » n'est pas une décoration : c'est ce qui permet à un auteur
 * de savoir si la correction qu'il croit avoir enregistrée l'a bien été.
 */
describe('BookDetailPage — quand le livre a bougé', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dit la date de la dernière modification à côté de la création', async () => {
    await afficher(livre({ updatedAt: '2026-09-15T10:00:00Z' }));

    expect(screen.getByText('Créé le')).toBeDefined();
    expect(screen.getByText('Modifié le')).toBeDefined();
    expect(screen.getByText('15 sept. 2026')).toBeDefined();
  });

  it('ne répète pas la date quand rien n’a bougé depuis la création', async () => {
    await afficher(livre({}));

    expect(screen.queryByText('Modifié le')).toBeNull();
  });
});

/**
 * « Ce qui a changé » répond à une question qu'on se pose parfois : « ai-je
 * bien enregistré ma correction ? ». Elle est donc repliée — un auteur ouvre
 * cette fiche pour savoir où en est son livre — et ne coûte rien tant qu'on
 * ne l'ouvre pas.
 */
describe('BookDetailPage — ce qui a changé', () => {
  beforeEach(() => vi.clearAllMocks());

  const REVISIONS = [
    {
      id: 'r2',
      changedAt: '2026-09-15T10:00:00Z',
      changedBy: null,
      changes: { description: { avant: 'a', apres: 'b' } },
    },
    {
      id: 'r1',
      changedAt: '2026-09-14T10:00:00Z',
      changedBy: null,
      changes: { price: { avant: 0, apres: 500 } },
    },
  ];

  it('reste repliée, et ne demande rien tant qu’on ne l’ouvre pas', async () => {
    await afficher(livre({ updatedAt: '2026-09-15T10:00:00Z' }));

    expect(screen.getByText('Ce qui a changé')).toBeDefined();
    expect(getBookRevisions).not.toHaveBeenCalled();
  });

  it('liste les cinq dernières modifications en français lisible', async () => {
    getBookRevisions.mockResolvedValue({
      data: REVISIONS,
      total: 2,
      page: 1,
      limit: 5,
      totalPages: 1,
    });
    await afficher(livre({ updatedAt: '2026-09-15T10:00:00Z' }));

    fireEvent.click(screen.getByText('Ce qui a changé'));

    await waitFor(() => expect(getBookRevisions).toHaveBeenCalledWith('l1', { limit: 5 }));
    const lignes = await screen.findAllByRole('listitem');
    const textes = lignes.map((l) => l.textContent);
    expect(textes.some((t) => t?.includes('15 sept. 2026') && t?.includes('description'))).toBe(
      true,
    );
    expect(textes.some((t) => t?.includes('14 sept. 2026') && t?.includes('prix'))).toBe(true);
  });

  it('ne propose pas de journal sur un livre qui n’a jamais bougé', async () => {
    await afficher(livre({}));

    expect(screen.queryByText('Ce qui a changé')).toBeNull();
  });
});
