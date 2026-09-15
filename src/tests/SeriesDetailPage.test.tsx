import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { BookStatus } from '@/types/models';

/**
 * Dater une série chapitre par chapitre demandait six allers-retours pour une
 * seule décision — « un tous les trois jours à partir du 1er ». Le formulaire
 * calcule les dates sur place et les montre avant de les demander au serveur :
 * l'auteur confirme ce qu'il voit. Ces tests tiennent trois promesses — les
 * dates de l'aperçu suivent bien le pas, la confirmation envoie exactement
 * ce que l'aperçu annonçait, et un chapitre refusé est dit laissé de côté
 * plutôt qu'escamoté.
 */
const getSeriesDetail = vi.fn();
const scheduleSeries = vi.fn();
vi.mock('@/lib/api/series', () => ({
  getSeriesDetail: (...args: unknown[]) => getSeriesDetail(...args),
  scheduleSeries: (...args: unknown[]) => scheduleSeries(...args),
  attachEpisode: vi.fn(),
  detachEpisode: vi.fn(),
  updateSeries: vi.fn(),
}));

const getMyBooks = vi.fn();
vi.mock('@/lib/api/books', () => ({
  uploadCover: vi.fn(),
  getMyBooks: (...args: unknown[]) => getMyBooks(...args),
}));

function episode(n: number, titre: string, paru = false) {
  return {
    id: `e${n}`,
    title: titre,
    episodeNumber: n,
    paru,
    publishAt: null,
    anticipe: false,
    ouvert: paru,
    coutEnJetons: 0,
  };
}

const SERIE = {
  id: 's1',
  title: 'Les nuits de Douala',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
  description: null,
  completed: false,
  episodes: [
    episode(1, 'Le port', true),
    episode(2, 'La pluie'),
    episode(3, 'Le marché'),
    episode(4, 'La brume'),
    episode(5, 'Le pont'),
    episode(6, 'La veille'),
    episode(7, 'Le retour'),
    episode(8, 'Le chapitre refusé'),
  ],
};

// Le statut vient de la liste des livres, pas de la fiche de la série.
const LIVRES = SERIE.episodes.map((e) => ({
  id: e.id,
  title: e.title,
  status:
    e.id === 'e8' ? BookStatus.REJECTED : e.paru ? BookStatus.PUBLISHED : BookStatus.APPROVED,
}));

async function afficher() {
  getSeriesDetail.mockResolvedValue(SERIE);
  getMyBooks.mockResolvedValue({ data: LIVRES, total: LIVRES.length, page: 1, limit: 100, totalPages: 1 });
  const { SeriesDetailPage } = await import('@/features/series/pages/SeriesDetailPage');
  render(
    <MemoryRouter initialEntries={['/series/s1']}>
      <Routes>
        <Route path="/series/:id" element={<SeriesDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Les nuits de Douala', level: 1 }, { timeout: 5000 });
  // La liste des livres arrive par une autre requête : sans elle, le refusé
  // ne serait pas encore reconnu.
  await waitFor(() => expect(getMyBooks).toHaveBeenCalled());
}

async function ouvrirLeFormulaire() {
  fireEvent.click(screen.getByRole('button', { name: 'Programmer la sortie' }));
  fireEvent.change(screen.getByLabelText('Premier épisode'), { target: { value: '2026-10-01T08:00' } });
  return screen.getByRole('list', { name: 'Dates de sortie' });
}

describe('SeriesDetailPage — programmer la sortie', () => {
  beforeEach(() => vi.clearAllMocks());

  it('l’aperçu date les six épisodes à venir à J, J+3, …, J+15', async () => {
    await afficher();
    const apercu = await ouvrirLeFormulaire();

    const lignes = within(apercu).getAllByRole('listitem');
    // Six à programmer, plus le refusé qui est annoncé ; le paru n'y est pas.
    expect(lignes).toHaveLength(7);
    expect(within(apercu).queryByText('Le port')).toBeNull();

    for (const jour of [1, 4, 7, 10, 13, 16]) {
      expect(within(apercu).getByText(new RegExp(`\\b${jour} octobre`))).toBeDefined();
    }
  });

  it('la confirmation envoie le départ et le pas que l’aperçu annonçait', async () => {
    await afficher();
    await ouvrirLeFormulaire();
    fireEvent.change(screen.getByLabelText('Un épisode tous les'), { target: { value: '3' } });

    scheduleSeries.mockResolvedValue({
      episodes: [{ id: 'e2', title: 'La pluie', episodeNumber: 2, publishAt: '2026-10-01T07:00:00.000Z' }],
      ignores: [{ id: 'e8', title: 'Le chapitre refusé', episodeNumber: 8, status: 'REJECTED' }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Programmer' }));

    await waitFor(() =>
      expect(scheduleSeries).toHaveBeenCalledWith('s1', {
        startAt: new Date('2026-10-01T08:00').toISOString(),
        everyDays: 3,
      }),
    );
    // Rechargement, puis une phrase qui dit ce que le serveur a fait.
    await waitFor(() => expect(getSeriesDetail).toHaveBeenCalledTimes(2));
    const statut = await screen.findByRole('status');
    expect(statut.textContent).toContain('1 épisode programmé');
    expect(statut.textContent).toContain('Le chapitre refusé (refusé)');
  });

  it('un épisode refusé est annoncé comme laissé de côté, sans date', async () => {
    await afficher();
    const apercu = await ouvrirLeFormulaire();

    const ligne = within(apercu).getByText('Le chapitre refusé').closest('li');
    expect(ligne).not.toBeNull();
    expect(within(ligne as HTMLElement).getByText('Refusé, laissé de côté')).toBeDefined();
    expect(within(ligne as HTMLElement).queryByText(/octobre/)).toBeNull();
  });
});
