import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Retrouver un livre de l'auteur par son identifiant.
 *
 * Il n'existe pas de route dédiée : `GET /books/:id` est publique et ne rend
 * que ce qui est paru, alors que l'auteur ouvre surtout des brouillons et des
 * chapitres en relecture. On passe donc par sa propre liste — et elle était
 * demandée une seule fois, cent livres au plus. Un auteur qui en publie
 * davantage voyait sa fiche cent-unième répondre « introuvable », sans que
 * rien dans ce message laisse deviner pourquoi.
 */
const get = vi.fn();
vi.mock('@/lib/api/client', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

const { getBookById } = await import('@/lib/api/books');

function page(livres: Array<{ id: string }>, numero: number, totalPages: number) {
  return {
    data: { data: livres, pagination: { total: totalPages * 100, page: numero, limit: 100, totalPages } },
  };
}

describe('getBookById', () => {
  beforeEach(() => get.mockReset());

  it('ne demande qu’une page tant que l’auteur reste sous la centaine', async () => {
    get.mockResolvedValueOnce(page([{ id: 'l1' }, { id: 'l2' }], 1, 1));

    await expect(getBookById('l2')).resolves.toMatchObject({ id: 'l2' });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('va chercher au-delà de la centième œuvre', async () => {
    get
      .mockResolvedValueOnce(page([{ id: 'l1' }], 1, 3))
      .mockResolvedValueOnce(page([{ id: 'l2' }], 2, 3))
      .mockResolvedValueOnce(page([{ id: 'cherche' }], 3, 3));

    await expect(getBookById('cherche')).resolves.toMatchObject({ id: 'cherche' });
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('s’arrête à la dernière page plutôt que de tourner sans fin', async () => {
    get
      .mockResolvedValueOnce(page([{ id: 'l1' }], 1, 2))
      .mockResolvedValueOnce(page([{ id: 'l2' }], 2, 2));

    await expect(getBookById('absent')).rejects.toThrow(/not found/i);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
