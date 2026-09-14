import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/**
 * L'onglet « Sécurité » annonçait « Mot de passe mis à jour » sans appeler
 * l'API — qui n'a pas d'endpoint pour cela. Un auteur repartait convaincu
 * d'avoir changé un mot de passe qui n'avait pas bougé.
 *
 * Le seul chemin qui existe est celui du mot de passe oublié : un lien par
 * e-mail. La page l'emprunte, et le dit.
 */
const forgotPassword = vi.fn();
const logout = vi.fn();
vi.mock('@/lib/api/auth', () => ({ forgotPassword: (...a: unknown[]) => forgotPassword(...a) }));
vi.mock('@/lib/api/authors', () => ({
  getMyProfile: () => Promise.resolve({ id: 'a1', slug: 'jean-auteur', penName: 'Jean', bio: '', mtnNumber: '', omNumber: '' }),
  updateMyProfile: vi.fn(),
}));
vi.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({
      user: { email: 'auteur@papers.app', firstName: 'Jean', lastName: 'Auteur' },
      authorProfile: { id: 'a1', slug: 'jean-auteur', penName: 'Jean' },
      fetchAuthorProfile: vi.fn(),
      logout,
    }),
}));

async function afficher() {
  const { SettingsPage } = await import('@/features/settings/pages/SettingsPage');
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Profil' }, { timeout: 5000 });
}

describe('SettingsPage — ne rien promettre que l’API ne tient pas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('changer de mot de passe passe par un lien envoyé à l’adresse du compte', async () => {
    forgotPassword.mockResolvedValue(undefined);
    await afficher();

    expect(screen.queryByLabelText(/Nouveau mot de passe/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Changer de mot de passe/ }));

    await waitFor(() => expect(forgotPassword).toHaveBeenCalledWith('auteur@papers.app'));
    expect((await screen.findByRole('status')).textContent).toContain('auteur@papers.app');
  });

  it('donne à l’auteur l’adresse de sa page publique, par son slug', async () => {
    await afficher();
    const lien = screen.getByRole('link', { name: /Voir ma page/ });
    expect(lien.getAttribute('href')).toMatch(/\/auteurs\/jean-auteur$/);
  });

  it('permet de se déconnecter depuis le téléphone', async () => {
    await afficher();
    expect(screen.getByRole('button', { name: /Se déconnecter/ })).toBeDefined();
  });
});
