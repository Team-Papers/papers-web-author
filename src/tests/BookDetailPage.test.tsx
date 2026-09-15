import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
vi.mock('@/lib/api/books', () => ({
  getMyBooks: () => getMyBooks(),
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
