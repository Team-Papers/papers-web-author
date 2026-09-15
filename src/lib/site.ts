/**
 * L'adresse du site public, la ou vivent les pages que les auteurs partagent.
 *
 * L'ancienne vitrine (`showcase-papers`) est retiree depuis le 12 septembre :
 * un lien vers elle ne mene plus nulle part.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://papers.seed-innov.com';

/** La page publique d'un auteur : par son slug quand il en a un, sinon par son identifiant. */
export function pagePublique(profil: { id: string; slug?: string | null }): string {
  return `${SITE_URL}/auteurs/${profil.slug || profil.id}`;
}

/** La page publique d'une série, celle qu'un auteur met dans une publicité. */
export function pageDeLaSerie(serie: { id: string; slug?: string | null }): string {
  return `${SITE_URL}/series/${serie.slug || serie.id}`;
}
