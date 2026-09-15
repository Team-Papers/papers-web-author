import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { BookStatus } from '@/types/models';

/**
 * Dater un chapitre l'envoie en relecture, et l'écran doit le dire.
 *
 * « Programmé · paraît le 18 septembre » et « En examen · paraîtra le
 * 18 septembre » portent la même date et n'ont pas la même valeur : le premier
 * paraîtra, le second paraîtra *si* il est accepté. Les dire pareil laisserait
 * un auteur lancer une campagne sur une sortie qui n'est pas acquise.
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

function episode(n: number, titre: string, options: { paru?: boolean; publishAt?: string } = {}) {
  return {
    id: `e${n}`,
    title: titre,
    episodeNumber: n,
    paru: options.paru ?? false,
    publishAt: options.publishAt ?? null,
    anticipe: false,
    ouvert: options.paru ?? false,
    coutEnJetons: 0,
  };
}

const SERIE = {
  id: 's1',
  title: 'Triple Ambiance',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-14T10:00:00.000Z',
  description: null,
  completed: false,
  episodes: [
    episode(1, 'Le port', { paru: true }),
    episode(2, 'La pluie', { publishAt: '2026-09-18T06:00:00.000Z' }),
    episode(3, 'Le marché', { publishAt: '2026-09-21T06:00:00.000Z' }),
    episode(4, 'La brume'),
  ],
};

// Le statut vient de la liste des livres, pas de la fiche de la série : le
// lecteur n'a pas à savoir qu'un chapitre est en relecture, l'auteur si.
const LIVRES = [
  { id: 'e1', title: 'Le port', status: BookStatus.PUBLISHED },
  { id: 'e2', title: 'La pluie', status: BookStatus.PENDING },
  { id: 'e3', title: 'Le marché', status: BookStatus.APPROVED },
  { id: 'e4', title: 'La brume', status: BookStatus.DRAFT },
];

async function afficher() {
  getSeriesDetail.mockResolvedValue(SERIE);
  getMyBooks.mockResolvedValue({
    data: LIVRES,
    total: LIVRES.length,
    page: 1,
    limit: 100,
    totalPages: 1,
  });
  const { SeriesDetailPage } = await import('@/features/series/pages/SeriesDetailPage');
  render(
    <MemoryRouter initialEntries={['/series/s1']}>
      <Routes>
        <Route path="/series/:id" element={<SeriesDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Triple Ambiance', level: 1 }, { timeout: 5000 });
  await waitFor(() => expect(getMyBooks).toHaveBeenCalled());
}

function ligneDe(titre: string) {
  return screen.getByText(titre).closest('li') as HTMLElement;
}

describe('SeriesDetailPage — un chapitre daté passe par la relecture', () => {
  beforeEach(() => vi.clearAllMocks());

  it('distingue « En examen · paraîtra le » de « Programmé · paraît le »', async () => {
    await afficher();

    const enExamen = ligneDe('La pluie');
    expect(within(enExamen).getByText('En examen')).toBeDefined();
    expect(within(enExamen).getByText(/Paraîtra le 18 septembre 2026, une fois relu/)).toBeDefined();

    const programme = ligneDe('Le marché');
    expect(within(programme).getByText('Programmé')).toBeDefined();
    expect(within(programme).getByText('Paraît le 21 septembre 2026')).toBeDefined();
  });

  it('ne promet rien à un chapitre sans date', async () => {
    await afficher();

    const sansDate = ligneDe('La brume');
    expect(within(sansDate).getByText('Sans date')).toBeDefined();
  });

  it('annonce dans l’aperçu ce qui part en relecture, et ce qui garde sa date', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'Programmer la sortie' }));
    fireEvent.change(screen.getByLabelText('Premier épisode'), {
      target: { value: '2026-10-01T08:00' },
    });

    const apercu = screen.getByRole('list', { name: 'Dates de sortie' });

    // Le brouillon part en relecture ; l'accepté et celui déjà en examen
    // gardent leur file — seul le premier change de statut.
    const brouillon = within(apercu).getByText('La brume').closest('li') as HTMLElement;
    expect(within(brouillon).getByText('après relecture')).toBeDefined();

    const accepte = within(apercu).getByText('Le marché').closest('li') as HTMLElement;
    expect(within(accepte).queryByText('après relecture')).toBeNull();

    const enExamen = within(apercu).getByText('La pluie').closest('li') as HTMLElement;
    expect(within(enExamen).queryByText('après relecture')).toBeNull();

    expect(
      screen.getByText(/1 chapitre part en relecture avec sa date/),
    ).toBeDefined();
  });

  it('rapporte ce que le serveur a fait, relecture comprise', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: 'Programmer la sortie' }));
    fireEvent.change(screen.getByLabelText('Premier épisode'), {
      target: { value: '2026-10-01T08:00' },
    });

    scheduleSeries.mockResolvedValue({
      episodes: [
        {
          id: 'e2',
          title: 'La pluie',
          episodeNumber: 2,
          publishAt: '2026-10-01T06:00:00.000Z',
          status: BookStatus.PENDING,
        },
        {
          id: 'e3',
          title: 'Le marché',
          episodeNumber: 3,
          publishAt: '2026-10-04T06:00:00.000Z',
          status: BookStatus.APPROVED,
        },
      ],
      ignores: [],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Programmer' }));

    const statut = await screen.findByRole('status');
    expect(statut.textContent).toContain('2 épisodes programmés');
    // Le serveur porte les statuts : on les rapporte plutôt que de laisser
    // croire que tout est acquis.
    expect(statut.textContent).toContain('1 part en relecture');
  });
});
