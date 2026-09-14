import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { formatCurrency as fc } from '@/lib/utils/formatters';

/** Les espaces fines du format monétaire, ramenées à l'espace que Testing Library compare. */
const formatCurrency = (n: number) => fc(n).replace(/\s/g, ' ');

/**
 * Le solde ne répond pas à la question que se pose l'auteur. Il sait combien
 * il a ; il veut savoir s'il peut retirer, et sinon combien il lui manque.
 *
 * Trois situations, trois écrans distincts — et surtout, jamais un bouton
 * « Retirer » qui mène à un refus.
 */
const getMyEarnings = vi.fn();
vi.mock('@/lib/api/authors', () => ({
  getMyEarnings: () => getMyEarnings(),
  requestWithdrawal: vi.fn(),
}));

function revenus(balance: number, withdrawalThreshold: number, transactions: unknown[] = []) {
  return { balance, withdrawalThreshold, transactions, withdrawals: [] };
}

async function afficher() {
  const { EarningsPage } = await import('@/features/earnings/pages/EarningsPage');
  render(
    <MemoryRouter>
      <EarningsPage />
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Revenus' }, { timeout: 5000 });
}

describe('EarningsPage — le solde et la distance qui reste', () => {
  beforeEach(() => vi.clearAllMocks());

  it("sans aucune vente, dit d'où viendra l'argent plutôt que « 0 »", async () => {
    getMyEarnings.mockResolvedValue(revenus(0, 5000));
    await afficher();

    expect(screen.getByText(/Vos ventes arrivent ici/)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Retirer/ })).toBeNull();
  });

  it('sous le seuil, chiffre ce qui manque et le montre', async () => {
    getMyEarnings.mockResolvedValue(revenus(3200, 5000));
    await afficher();

    expect(screen.getByText(`Encore ${formatCurrency(1800)} avant de pouvoir retirer.`)).toBeDefined();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('64');
    expect(screen.queryByRole('button', { name: /Retirer/ })).toBeNull();
  });

  it('au-dessus du seuil, propose le retrait du montant exact, sans barre', async () => {
    getMyEarnings.mockResolvedValue(revenus(6000, 5000));
    await afficher();

    expect(screen.getByRole('button', { name: (nom) => nom.replace(/\s/g, ' ') === `Retirer ${formatCurrency(6000)}` })).toBeDefined();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('montre à l’auteur le net qu’il touche, et le brut d’où il vient', async () => {
    getMyEarnings.mockResolvedValue(
      revenus(7000, 5000, [
        {
          id: 't1',
          type: 'SALE',
          amount: '10000',
          commission: '3000',
          netAmount: '7000',
          createdAt: '2026-09-01T10:00:00Z',
          book: { title: 'Le fleuve' },
        },
      ]),
    );
    await afficher();

    expect(screen.getByText('Le fleuve')).toBeDefined();
    expect(screen.getByText(`+ ${formatCurrency(7000)}`)).toBeDefined();
    expect(screen.getByText(`sur ${formatCurrency(10000)}, commission ${formatCurrency(3000)}`)).toBeDefined();
  });
});
