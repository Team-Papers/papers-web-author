import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

/**
 * Publier un chapitre depuis sa série.
 *
 * Sans cela : sortir de la série, créer un livre, revenir, l'ajouter, lui
 * donner un rang. Cinq gestes pour « la suite arrive ». La série voyage dans
 * l'adresse — l'assistant se recharge et se met en favori — et le chapitre
 * rejoint sa série tout seul, au dernier rang libre.
 *
 * Le cas qui compte vraiment est l'échec : le livre existe, la série ne l'a
 * pas pris. Le cacher enverrait l'auteur réenregistrer un manuscrit déjà en
 * base, et lui en donnerait deux.
 */
const createBook = vi.fn();
vi.mock('@/lib/api/books', () => ({
  createBook: (...a: unknown[]) => createBook(...a),
  getCategories: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Roman', slug: 'roman' }]),
  uploadCover: vi.fn(),
  uploadBookFile: vi.fn(),
  getBookById: vi.fn(),
  updateBook: vi.fn(),
}));

const getSeriesDetail = vi.fn();
const attachEpisode = vi.fn();
vi.mock('@/lib/api/series', () => ({
  getSeriesDetail: (...a: unknown[]) => getSeriesDetail(...a),
  attachEpisode: (...a: unknown[]) => attachEpisode(...a),
  scheduleSeries: vi.fn(),
  detachEpisode: vi.fn(),
  updateSeries: vi.fn(),
}));

const SERIE = {
  id: 's1',
  slug: 'triple-ambiance',
  title: 'Triple Ambiance',
  description: null,
  completed: false,
  episodes: [
    { id: 'e1', title: 'Un', episodeNumber: 1, paru: true, publishAt: null, anticipe: false, ouvert: true, coutEnJetons: 0 },
    { id: 'e2', title: 'Deux', episodeNumber: 2, paru: false, publishAt: null, anticipe: false, ouvert: false, coutEnJetons: 0 },
  ],
};

function Adresse() {
  const { pathname } = useLocation();
  return <div data-testid="adresse">{pathname}</div>;
}

async function afficher() {
  getSeriesDetail.mockResolvedValue(SERIE);
  const { NewBookPage } = await import('@/features/books/pages/NewBookPage');
  render(
    <MemoryRouter initialEntries={['/books/new?serie=s1']}>
      <Adresse />
      <Routes>
        <Route path="/books/new" element={<NewBookPage />} />
        <Route path="/series/:id" element={<div>La série</div>} />
        <Route path="/books" element={<div>Mes livres</div>} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Le livre', level: 1 });
}

/** Remplit le strict nécessaire et va jusqu'à la relecture. */
async function remplirEtAllerAuBout() {
  fireEvent.change(screen.getByLabelText(/Titre du livre/), { target: { value: 'Le troisième jour' } });
  fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'La suite.' } });
  fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: 'Roman' }));
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: /Suivant/ }));
  await screen.findByRole('heading', { name: 'Relecture', level: 1 });
}

describe('NewBookPage — un chapitre publié depuis sa série', () => {
  beforeEach(() => vi.clearAllMocks());

  it('annonce la série que le chapitre rejoindra', async () => {
    await afficher();
    await waitFor(() =>
      expect(screen.getByText(/Ce chapitre rejoindra la série/)).toBeDefined(),
    );
    expect(screen.getByText('Triple Ambiance')).toBeDefined();
  });

  it('rattache le livre créé au dernier rang libre, puis ramène à la série', async () => {
    await afficher();
    await waitFor(() => expect(getSeriesDetail).toHaveBeenCalled());
    await remplirEtAllerAuBout();

    createBook.mockResolvedValue({ id: 'b9', title: 'Le troisième jour' });
    attachEpisode.mockResolvedValue({ id: 'b9' });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer le chapitre/ }));

    await waitFor(() =>
      // Deux épisodes rangés : le suivant est le troisième.
      expect(attachEpisode).toHaveBeenCalledWith('s1', { bookId: 'b9', episodeNumber: 3 }),
    );
    await waitFor(() => expect(screen.getByTestId('adresse').textContent).toBe('/series/s1'));
  });

  it('laisse le livre créé et dit pourquoi la série ne l’a pas pris', async () => {
    await afficher();
    await waitFor(() => expect(getSeriesDetail).toHaveBeenCalled());
    await remplirEtAllerAuBout();

    createBook.mockResolvedValue({ id: 'b9', title: 'Le troisième jour' });
    attachEpisode.mockRejectedValue({
      response: { data: { message: 'Episode 3 already exists in this series' } },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer le chapitre/ }));

    const alerte = await screen.findByRole('alert');
    expect(alerte.textContent).toContain('Votre livre est enregistré');
    expect(alerte.textContent).toContain('Episode 3 already exists in this series');
    expect(screen.getByRole('link', { name: /Ouvrir la série/ })).toBeDefined();

    // On reste sur place, et on ne propose pas de recommencer : un second clic
    // créerait un deuxième manuscrit.
    expect(screen.getByTestId('adresse').textContent).toBe('/books/new');
    expect(screen.getByRole('button', { name: /Enregistrer le chapitre/ })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('sans série dans l’adresse, revient à la liste des livres comme avant', async () => {
    const { NewBookPage } = await import('@/features/books/pages/NewBookPage');
    render(
      <MemoryRouter initialEntries={['/books/new']}>
        <Adresse />
        <Routes>
          <Route path="/books/new" element={<NewBookPage />} />
          <Route path="/books" element={<div>Mes livres</div>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Le livre', level: 1 });
    await remplirEtAllerAuBout();

    createBook.mockResolvedValue({ id: 'b9' });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer le livre/ }));

    await waitFor(() => expect(screen.getByTestId('adresse').textContent).toBe('/books'));
    expect(attachEpisode).not.toHaveBeenCalled();
    expect(getSeriesDetail).not.toHaveBeenCalled();
  });
});
