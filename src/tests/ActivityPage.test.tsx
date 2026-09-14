import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/**
 * Depuis la refonte, plus aucune page ne montrait les notifications : la
 * cloche vivait dans le bandeau, disparu avec lui. Un auteur n'apprenait plus
 * qu'un livre était accepté, refusé ou vendu qu'en allant voir.
 *
 * La page « Activité » les liste, et quand une notification porte un lien
 * public — un livre qui vient de paraître — elle offre de le partager.
 */
const getNotifications = vi.fn();
const markAsRead = vi.fn();
vi.mock('@/lib/api/notifications', () => ({
  getNotifications: () => getNotifications(),
  getUnreadCount: () => Promise.resolve(1),
  markAsRead: (id: string) => markAsRead(id),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearReadNotifications: vi.fn(),
}));

const parution = {
  id: 'n1',
  userId: 'u1',
  type: 'BOOK_APPROVED',
  title: 'Votre livre est en ligne',
  message: '« Le fleuve » est en ligne. Partagez-le : https://papers.seed-innov.com/catalogue/b1',
  data: { bookId: 'b1', url: 'https://papers.seed-innov.com/catalogue/b1' },
  read: false,
  createdAt: new Date().toISOString(),
};

async function afficher() {
  getNotifications.mockResolvedValue({ data: [parution], total: 1, page: 1, limit: 50, totalPages: 1 });
  markAsRead.mockResolvedValue(undefined);
  const { ActivityPage } = await import('@/features/activity/pages/ActivityPage');
  render(
    <MemoryRouter>
      <ActivityPage />
    </MemoryRouter>,
  );
  await screen.findByText('Votre livre est en ligne', {}, { timeout: 5000 });
}

describe('ActivityPage — ce qui est arrivé à l’auteur', () => {
  beforeEach(() => vi.clearAllMocks());

  it('offre de partager un livre qui vient de paraître', async () => {
    await afficher();
    const lien = screen.getByRole('link', { name: /Voir la page/ });
    expect(lien.getAttribute('href')).toBe('https://papers.seed-innov.com/catalogue/b1');
    expect(screen.getByRole('button', { name: /Copier le lien|Partager/ })).toBeDefined();
  });

  it('marque une notification lue quand on l’ouvre', async () => {
    await afficher();
    fireEvent.click(screen.getByRole('button', { name: /Marquer comme lue/ }));
    await waitFor(() => expect(markAsRead).toHaveBeenCalledWith('n1'));
  });
});
