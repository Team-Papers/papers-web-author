import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { BookStatus } from '@/types/models';

/**
 * Les cinq étapes de l'assistant, visibles, et cliquables à bon escient.
 *
 * L'auteur ne voyait que « Étape 3 sur 5 » : ni ce qui venait après — faut-il
 * prévoir la couverture maintenant ? — ni comment revenir corriger le prix
 * sans repasser par deux écrans.
 *
 * En création, l'ordre a un sens : on ne téléverse pas un manuscrit avant de
 * l'avoir nommé. En modification, tout est déjà rempli, et l'ordre ne protège
 * plus rien.
 */
const createBook = vi.fn();
const getBookById = vi.fn();
const updateBook = vi.fn();
vi.mock('@/lib/api/books', () => ({
  createBook: (...a: unknown[]) => createBook(...a),
  getBookById: (...a: unknown[]) => getBookById(...a),
  updateBook: (...a: unknown[]) => updateBook(...a),
  getCategories: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Roman', slug: 'roman' }]),
  uploadCover: vi.fn(),
  uploadBookFile: vi.fn(),
}));

function rangee() {
  return screen.getByRole('list', { name: 'Étapes' });
}

function etape(nom: string) {
  return within(rangee()).getByRole('button', { name: new RegExp(nom) });
}

describe('NewBookPage — les étapes se suivent dans l’ordre', () => {
  beforeEach(() => vi.clearAllMocks());

  async function afficher() {
    const { NewBookPage } = await import('@/features/books/pages/NewBookPage');
    render(
      <MemoryRouter>
        <NewBookPage />
      </MemoryRouter>,
    );
    await screen.findByRole('list', { name: 'Étapes' });
  }

  it('montre les cinq étapes, pas seulement celle où l’on est', async () => {
    await afficher();

    const libelles = within(rangee())
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(libelles).toHaveLength(5);
    expect(libelles.join(' ')).toContain('La couverture');
    expect(libelles.join(' ')).toContain('Relecture');
  });

  it('laisse éteinte une étape jamais atteinte', async () => {
    await afficher();

    // On ne téléverse pas un manuscrit avant de l'avoir nommé.
    expect(etape('Le fichier')).toHaveProperty('disabled', true);
    expect(etape('Relecture')).toHaveProperty('disabled', true);
  });

  it('rouvre une étape franchie, et y ramène en un clic', async () => {
    await afficher();

    fireEvent.change(screen.getByLabelText(/Titre du livre/), { target: { value: 'Le port' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Un roman.' } });
    fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Roman' }));

    fireEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    await screen.findByRole('heading', { name: 'Les détails', level: 1 });

    // L'étape franchie est de nouveau ouverte ; celle d'après ne l'est
    // toujours pas.
    expect(etape('Le livre')).toHaveProperty('disabled', false);
    expect(etape('La couverture')).toHaveProperty('disabled', true);

    fireEvent.click(etape('Le livre'));
    await screen.findByRole('heading', { name: 'Le livre', level: 1 });
    // Ce qui était saisi est toujours là : revenir ne coûte rien.
    expect((screen.getByLabelText(/Titre du livre/) as HTMLInputElement).value).toBe('Le port');
  });

  it('referme tout dès que le début n’est plus rempli', async () => {
    await afficher();

    fireEvent.change(screen.getByLabelText(/Titre du livre/), { target: { value: 'Le port' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Un roman.' } });
    fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Roman' }));
    fireEvent.click(screen.getByRole('button', { name: /Suivant/ }));
    await screen.findByRole('heading', { name: 'Les détails', level: 1 });

    fireEvent.click(etape('Le livre'));
    await screen.findByRole('heading', { name: 'Le livre', level: 1 });
    fireEvent.change(screen.getByLabelText(/Titre du livre/), { target: { value: '' } });

    // Sans titre, rien n'est enregistrable : on ne saute pas à la relecture
    // d'un livre qui n'en a pas.
    expect(etape('Les détails')).toHaveProperty('disabled', true);
  });
});

describe('EditBookPage — tout est déjà rempli, tout est atteignable', () => {
  beforeEach(() => vi.clearAllMocks());

  const LIVRE = {
    id: 'b1',
    title: 'Le port',
    description: 'Un roman.',
    price: 1000,
    status: BookStatus.DRAFT,
    language: 'fr',
    categories: [{ id: 'c1', name: 'Roman', slug: 'roman' }],
    coverUrl: '',
    fileUrl: '',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
  };

  async function afficher() {
    getBookById.mockResolvedValue(LIVRE);
    const { EditBookPage } = await import('@/features/books/pages/EditBookPage');
    render(
      <MemoryRouter initialEntries={['/books/b1/edit']}>
        <Routes>
          <Route path="/books/:id/edit" element={<EditBookPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('list', { name: 'Étapes' });
  }

  it('ouvre les cinq étapes, et saute où on lui demande', async () => {
    await afficher();

    for (const nom of ['Le livre', 'Les détails', 'La couverture', 'Le fichier', 'Relecture']) {
      // L'étape en cours est la seule fermée : on y est déjà.
      const bouton = etape(nom);
      expect(bouton, nom).toHaveProperty(
        'disabled',
        bouton.getAttribute('aria-current') === 'step',
      );
    }

    fireEvent.click(etape('Relecture'));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Relecture'));
  });
});
