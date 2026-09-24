import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

/**
 * Rappeler à l'auteur de refermer une série finie.
 *
 * « Terminée » se coche à la main, et l'oubli ne se voit nulle part depuis
 * l'espace auteur. Côté lecteur il se voit très bien : celui qui arrive au
 * dernier épisode s'entend dire que ce n'est que le dernier « à ce jour » et
 * attend une suite qui ne viendra pas — au moment précis où l'on voudrait
 * qu'il suive l'auteur pour l'œuvre d'après.
 *
 * Le rappel ne s'affiche qu'au moment où il est vrai : tous les épisodes
 * parus, aucun en attente. Sorti trop tôt, il pousserait à refermer une série
 * dont le prochain chapitre est déjà daté.
 */
const getSeriesDetail = vi.fn();
vi.mock('@/lib/api/series', () => ({
  getSeriesDetail: (...args: unknown[]) => getSeriesDetail(...args),
  updateSeries: vi.fn(),
  scheduleSeries: vi.fn(),
  attachEpisode: vi.fn(),
  detachEpisode: vi.fn(),
}));

vi.mock('@/lib/api/books', () => ({
  uploadCover: vi.fn(),
  getMyBooks: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 100, totalPages: 1 }),
}));

function episode(numero: number, paru: boolean, publishAt: string | null = null) {
  return {
    id: `e${numero}`,
    title: `Chapitre ${numero}`,
    episodeNumber: numero,
    paru,
    publishAt,
    anticipe: false,
    ouvert: false,
    coutEnJetons: 1,
  };
}

const SERIE = {
  id: 's1',
  slug: 'triple-ambiance',
  title: 'Triple Ambiance',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
  description: 'Trois frères, une femme.',
  completed: false,
  episodes: [] as ReturnType<typeof episode>[],
};

async function afficher(serie: Partial<typeof SERIE>) {
  getSeriesDetail.mockResolvedValue({ ...SERIE, ...serie });
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

const RAPPEL = /marquez la série terminée/i;

describe('SeriesDetailPage — refermer une série finie', () => {
  beforeEach(() => vi.clearAllMocks());

  it('le suggère quand tous les épisodes sont parus', async () => {
    await afficher({ episodes: [episode(1, true), episode(2, true)] });
    expect(screen.getByText(RAPPEL)).toBeDefined();
  });

  it('se tait tant qu’un épisode attend sa date', async () => {
    await afficher({
      episodes: [episode(1, true), episode(2, false, '2026-09-27T01:31:00.000Z')],
    });
    expect(screen.queryByText(RAPPEL)).toBeNull();
  });

  it('se tait sur une série déjà marquée terminée', async () => {
    await afficher({ completed: true, episodes: [episode(1, true)] });
    expect(screen.queryByText(RAPPEL)).toBeNull();
  });

  it('se tait sur une série encore vide', async () => {
    // Zéro épisode paru et zéro en attente : la condition est vraie par
    // vacuité, et proposer de refermer une série qu'on vient de créer est
    // le contraire de ce qu'il faut dire à un auteur qui commence.
    await afficher({ episodes: [] });
    expect(screen.queryByText(RAPPEL)).toBeNull();
  });
});
