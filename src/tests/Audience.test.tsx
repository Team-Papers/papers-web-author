import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

/**
 * Ce qui attire.
 *
 * L'auteur savait ce qu'il avait gagné ; il ne savait pas ce qu'on regardait.
 * Deux mesures, et il ne faut jamais les confondre : la visite dit combien de
 * gens sont arrivés, la lecture dit combien sont restés. Une publicité peut
 * gonfler la première sans rien changer à la seconde — et c'est l'écart entre
 * les deux qui dit s'il faut corriger la fiche ou l'annonce.
 */
const getMyAudience = vi.fn();
vi.mock('@/lib/api/authors', () => ({
  getMyAudience: (jours: number) => getMyAudience(jours),
}));

function audience(over: Partial<Record<string, unknown>> = {}) {
  return {
    jours: 30,
    livres: [{ id: 'l1', titre: 'Un livre', visites: 40, lecteurs: 2, pagesLues: 30 }],
    series: [{ id: 's1', titre: 'Triple Ambiance', visites: 120, lecteurs: 9, pagesLues: 400 }],
    sources: [
      { source: 'facebook', visites: 120 },
      { source: 'direct', visites: 40 },
    ],
    parJour: [
      { jour: '2026-09-16', visites: 20 },
      { jour: '2026-09-17', visites: 140 },
    ],
    ...over,
  };
}

async function afficher() {
  const { Audience } = await import('@/features/dashboard/components/Audience');
  render(
    <MemoryRouter>
      <Audience />
    </MemoryRouter>,
  );
}

describe("Audience — ce qui attire, à côté de ce qui se vend", () => {
  beforeEach(() => vi.clearAllMocks());

  it('classe les œuvres par visites, la série avant le livre', async () => {
    getMyAudience.mockResolvedValue(audience());
    await afficher();

    const liens = await screen.findAllByRole('link');
    // La série est la plus visitée : elle passe devant, sans quoi l'auteur
    // devrait chercher dans la liste ce que sa publicité a ramené.
    expect(liens[0].textContent).toContain('Triple Ambiance');
    expect(liens[0].getAttribute('href')).toBe('/series/s1');
    expect(liens[1].getAttribute('href')).toBe('/books/l1');
  });

  it('sépare les visites des lectures, sans les additionner', async () => {
    getMyAudience.mockResolvedValue(audience());
    await afficher();

    expect(await screen.findByText('120')).toBeDefined();
    // Neuf personnes sont restées sur cent vingt arrivées : c'est ce rapport
    // qui dit si l'annonce amène des curieux ou des lecteurs.
    expect(screen.getByText(/9 lecteurs · 400 pages/)).toBeDefined();
  });

  it('dit d’où viennent les visiteurs, part comprise', async () => {
    getMyAudience.mockResolvedValue(audience());
    await afficher();

    expect(await screen.findByText('facebook')).toBeDefined();
    // 120 sur 160 : la publicité a amené les trois quarts.
    expect(screen.getByText(/120 · 75 %/)).toBeDefined();
    // « direct » reste affiché : cacher le trafic sans provenance ferait
    // croire que toute l'audience vient des publicités.
    expect(screen.getByText('direct')).toBeDefined();
  });

  it('change de période sans recharger la page', async () => {
    getMyAudience.mockResolvedValue(audience());
    await afficher();
    await screen.findByText('facebook');

    await userEvent.click(screen.getByRole('button', { name: '7 j' }));
    expect(getMyAudience).toHaveBeenLastCalledWith(7);
  });

  it('sans personne, explique où se comptent les visites plutôt que d’afficher zéro', async () => {
    getMyAudience.mockResolvedValue(
      audience({ livres: [], series: [], sources: [], parJour: [{ jour: '2026-09-17', visites: 0 }] }),
    );
    await afficher();

    expect(await screen.findByText(/Personne n'est encore passé/)).toBeDefined();
  });

  it('une panne de mesure n’efface pas la page des revenus', async () => {
    getMyAudience.mockRejectedValue(new Error('réseau'));
    await afficher();

    // Rien ne s'affiche, et surtout rien ne casse : l'audience est un
    // supplément, pas la raison d'être de l'écran.
    expect(screen.queryByText(/Ce qui attire/)).toBeNull();
  });
});
