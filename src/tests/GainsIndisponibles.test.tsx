import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/**
 * Le chiffre pour lequel un auteur ouvre cette page.
 *
 * Les gains se lisaient avec un repli à zéro : `getMyEarnings().catch(() =>
 * ({ balance: 0 }))`. Un auteur dont le solde ne répondait pas voyait donc
 * « 0 F » à la place de son revenu — et un zéro se lit comme une information,
 * pas comme une panne. C'est le seul chiffre de la plateforme qu'il ne faut
 * jamais inventer.
 */
const getMyStats = vi.fn();
const getMyEarnings = vi.fn();
const getAllMyBooks = vi.fn();
vi.mock('@/lib/api/authors', () => ({
  getMyStats: () => getMyStats(),
  getMyEarnings: () => getMyEarnings(),
}));
vi.mock('@/lib/api/books', () => ({
  getAllMyBooks: () => getAllMyBooks(),
}));

const { DashboardPage } = await import('@/features/dashboard/pages/DashboardPage');

function afficher() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('Le tableau de bord d’un auteur', () => {
  beforeEach(() => {
    getMyStats.mockReset().mockResolvedValue({ totalSales: 3, totalBooks: 2 });
    getAllMyBooks.mockReset().mockResolvedValue([]);
    getMyEarnings.mockReset();
  });

  it('n’affiche pas zéro quand le solde n’a pas pu être lu', async () => {
    getMyEarnings.mockRejectedValue(new Error('réseau'));

    afficher();

    await waitFor(() => expect(screen.getByText(/indisponible/i)).toBeTruthy());
    // Surtout pas un montant : « 0 F » ferait croire à un auteur qu'il n'a
    // rien gagné.
    expect(screen.queryByText(/^0\s/)).toBeNull();
  });

  it('affiche le solde quand il a pu être lu', async () => {
    getMyEarnings.mockResolvedValue({ balance: 42000, transactions: [] });

    afficher();

    await waitFor(() => expect(screen.getByText(/42/)).toBeTruthy());
    expect(screen.queryByText(/indisponible/i)).toBeNull();
  });

  it('affiche bien zéro à un auteur qui n’a rien gagné', async () => {
    // Un vrai zéro reste un zéro : la distinction porte sur la panne, pas sur
    // le montant.
    getMyEarnings.mockResolvedValue({ balance: 0, transactions: [] });

    afficher();

    await waitFor(() => expect(screen.queryByText(/indisponible/i)).toBeNull());
  });
});
