import type { ApiResponse } from '@/types/api';
import apiClient from './client';

/**
 * Les coffrets : vendre plusieurs livres en un paiement.
 *
 * Ce qui manquait pour vendre une collection. Neuf volumes à 5 000 FCFA se
 * prenaient en neuf achats et neuf confirmations mobile money, pour 45 000 —
 * personne ne va au bout. Un coffret a son prix, sa couverture, et dépose
 * tous ses livres d'un coup dans la bibliothèque de l'acheteur.
 */
export interface LivreDeCoffret {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  price: number;
  pageCount: number | null;
  orderIndex: number;
}

export interface Coffret {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  price: number;
  isActive: boolean;
  views: number;
  author: { id: string; penName: string | null; slug: string | null };
  books: LivreDeCoffret[];
  nombreDeLivres: number;
  /** Ce que les volumes coûtent un par un. */
  sommeDesVolumes: number;
  /** Ce que le coffret fait économiser. Jamais négatif. */
  economie: number;
  /** Combien de fois il a été payé. Seulement sur /coffrets/me. */
  ventes?: number;
  /** Ce qu'il a rapporté, avant commission. Seulement sur /coffrets/me. */
  recette?: number;
  /**
   * Faux dès la première vente : un acheteur a payé un ensemble à un prix, et
   * les deux doivent rester ce qu'ils étaient. L'atelier grise alors les
   * champs plutôt que de laisser l'auteur découvrir le refus à l'envoi.
   */
  modifiable?: boolean;
}

export async function getMesCoffrets(): Promise<Coffret[]> {
  const res = await apiClient.get<ApiResponse<Coffret[]>>('/coffrets/me');
  return res.data.data ?? [];
}

export async function creerCoffret(data: {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  price: number;
  bookIds: string[];
}): Promise<Coffret> {
  const res = await apiClient.post<ApiResponse<Coffret>>('/coffrets', data);
  return res.data.data as Coffret;
}

export async function modifierCoffret(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    coverUrl?: string | null;
    price?: number;
    bookIds?: string[];
    isActive?: boolean;
  },
): Promise<Coffret> {
  const res = await apiClient.patch<ApiResponse<Coffret>>(`/coffrets/${id}`, data);
  return res.data.data as Coffret;
}

export async function supprimerCoffret(id: string): Promise<void> {
  await apiClient.delete(`/coffrets/${id}`);
}
