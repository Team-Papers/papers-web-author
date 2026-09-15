import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

/**
 * Le titre et le résumé d'une série se corrigent.
 *
 * Les laisser figés à la création obligeait à recréer la série — donc à
 * re-ranger ses chapitres — pour une faute de frappe. L'adresse, elle, ne
 * suit pas : c'est celle qu'un auteur a donnée à une publicité, et la faire
 * changer casserait une campagne en cours. L'écran doit le dire, sans quoi
 * l'auteur n'osera pas toucher au titre.
 */
const getSeriesDetail = vi.fn();
const updateSeries = vi.fn();
vi.mock('@/lib/api/series', () => ({
  getSeriesDetail: (...args: unknown[]) => getSeriesDetail(...args),
  updateSeries: (...args: unknown[]) => updateSeries(...args),
  scheduleSeries: vi.fn(),
  attachEpisode: vi.fn(),
  detachEpisode: vi.fn(),
}));

vi.mock('@/lib/api/books', () => ({
  uploadCover: vi.fn(),
  getMyBooks: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 100, totalPages: 1 }),
}));

const SERIE = {
  id: 's1',
  slug: 'triple-ambiance',
  title: 'Triple Ambiance',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
  description: 'Trois amis, une ville, une nuit.',
  completed: false,
  episodes: [],
};

async function afficher() {
  getSeriesDetail.mockResolvedValue(SERIE);
  const { SeriesDetailPage } = await import('@/features/series/pages/SeriesDetailPage');
  render(
    <MemoryRouter initialEntries={['/series/s1']}>
      <Routes>
        <Route path="/series/:id" element={<SeriesDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Triple Ambiance', level: 1 }, { timeout: 5000 });
}

describe('SeriesDetailPage — modifier le titre et le résumé', () => {
  beforeEach(() => vi.clearAllMocks());

  it('montre le résumé, qu’on ne corrige pas à l’aveugle', async () => {
    await afficher();
    expect(screen.getByText('Trois amis, une ville, une nuit.')).toBeDefined();
  });

  it('dit quand la série a été créée, et quand elle a bougé', async () => {
    await afficher();
    expect(screen.getByText(/Créé le 01 sept\. 2026/)).toBeDefined();
    expect(screen.getByText(/Modifié le 14 sept\. 2026/)).toBeDefined();
  });

  it('ne répète pas la date quand rien n’a bougé depuis la création', async () => {
    getSeriesDetail.mockResolvedValue({ ...SERIE, updatedAt: SERIE.createdAt });
    const { SeriesDetailPage } = await import('@/features/series/pages/SeriesDetailPage');
    render(
      <MemoryRouter initialEntries={['/series/s1']}>
        <Routes>
          <Route path="/series/:id" element={<SeriesDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Triple Ambiance', level: 1 }, { timeout: 5000 });

    // « Créé le 15 septembre · Modifié le 15 septembre » est du bruit posé à
    // côté d'un fait.
    expect(screen.queryByText(/Modifié le/)).toBeNull();
  });

  it('enregistre le nouveau titre et le nouveau résumé', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Triple Ambiance, saison 2' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'La suite.' } });

    updateSeries.mockResolvedValue({ ...SERIE, title: 'Triple Ambiance, saison 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(updateSeries).toHaveBeenCalledWith('s1', {
        title: 'Triple Ambiance, saison 2',
        description: 'La suite.',
      }),
    );
    // La fiche est rechargée : l'écran ne doit pas afficher l'ancien titre
    // pendant que la base en porte un autre.
    await waitFor(() => expect(getSeriesDetail).toHaveBeenCalledTimes(2));
  });

  it('prévient que l’adresse de la série ne change pas', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(
      screen.getByText(/L’adresse de la série ne change pas/),
    ).toBeDefined();
  });

  it('efface un résumé vidé plutôt que d’enregistrer une chaîne vide', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '   ' } });
    updateSeries.mockResolvedValue(SERIE);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(updateSeries).toHaveBeenCalledWith('s1', {
        title: 'Triple Ambiance',
        description: null,
      }),
    );
  });
});
