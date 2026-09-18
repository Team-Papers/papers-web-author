import { toPaginated, type ApiPaginatedRaw, type ApiResponse, type PaginatedResponse } from '@/types/api';
import type { Revision } from '@/features/books/historique';
import type { Book } from '@/types/models';
import apiClient from './client';

/**
 * Les séries de l'auteur.
 *
 * Un épisode *est* un livre : fichier, pages, lecteur, gains. La série
 * n'ajoute que ce qui manquait — un ordre et un calendrier.
 */
export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  status: Book['status'];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { books: number };
}

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number | null;
  publishAt: string | null;
  status: Book['status'];
}

export async function getMySeries(): Promise<Series[]> {
  const res = await apiClient.get<ApiResponse<Series[]>>('/series/me');
  return res.data.data ?? [];
}

export async function createSeries(data: {
  title: string;
  description?: string | null;
}): Promise<Series> {
  const res = await apiClient.post<ApiResponse<Series>>('/series', data);
  return res.data.data as Series;
}

export async function updateSeries(
  id: string,
  data: { title?: string; description?: string | null; completed?: boolean; coverUrl?: string | null },
): Promise<Series> {
  const res = await apiClient.patch<ApiResponse<Series>>(`/series/${id}`, data);
  return res.data.data as Series;
}

/**
 * Range un livre dans la série, à son rang, avec sa date.
 *
 * Les trois vont ensemble : c'est le geste « ce chapitre est le troisième, et
 * il sort mardi ». Les séparer ferait trois allers-retours pour une décision.
 */
export async function attachEpisode(
  seriesId: string,
  data: { bookId: string; episodeNumber: number; publishAt?: string | null },
): Promise<Episode> {
  const res = await apiClient.post<ApiResponse<Episode>>(`/series/${seriesId}/episodes`, data);
  return res.data.data as Episode;
}

export async function detachEpisode(seriesId: string, bookId: string): Promise<void> {
  await apiClient.delete(`/series/${seriesId}/episodes/${bookId}`);
}

/** La série telle qu'un lecteur la voit : ses épisodes, dans l'ordre. */
export async function getSeriesDetail(id: string): Promise<{
  id: string;
  /** L'adresse publique lisible : c'est elle qu'un auteur met dans une publicité. */
  slug: string;
  title: string;
  description: string | null;
  coverUrl?: string | null;
  completed: boolean;
  createdAt: string;
  /** Quand l'auteur y a touché pour la dernière fois. */
  updatedAt: string;
  episodes: Array<{
    id: string;
    title: string;
    episodeNumber: number | null;
    paru: boolean;
    publishAt: string | null;
    /** Approuvé et daté dans le futur, dans une série publiée : lisible en avance contre des jetons. */
    anticipe: boolean;
    ouvert: boolean;
    coutEnJetons: number;
  }>;
}> {
  const res = await apiClient.get<ApiResponse<never>>(`/series/${id}`);
  return res.data.data as never;
}

/** Un épisode daté par la programmation groupée. */
export interface EpisodeProgramme {
  id: string;
  title: string;
  episodeNumber: number | null;
  publishAt: string;
  /**
   * Ce qu'il est devenu en recevant sa date : `PENDING` quand il part en
   * relecture, son statut d'avant quand il avait déjà été accepté. On le lit
   * plutôt que de rejouer la règle du serveur, qui finirait par diverger.
   */
  status: Book['status'];
}

/**
 * Un épisode que la programmation a laissé de côté, et pourquoi.
 *
 * Une décision les a écartés, et changer une date ne la défait pas. Un
 * chapitre en examen, lui, n'est plus laissé de côté : il reçoit sa date et
 * reste en relecture.
 */
export interface EpisodeIgnore {
  id: string;
  title: string;
  episodeNumber: number | null;
  status: 'REJECTED' | 'SUSPENDED';
}

/**
 * Date tous les épisodes à venir d'un coup : le premier à `startAt`, puis un
 * tous les `everyDays` jours, dans l'ordre des numéros.
 *
 * Dater chapitre par chapitre demandait six allers-retours pour une seule
 * décision — « un tous les trois jours à partir de lundi ». Le serveur laisse
 * de côté ce qu'il ne peut pas promettre (refusé, suspendu, en examen) et le
 * dit dans `ignores` plutôt que d'échouer : l'auteur voit ce qui reste à faire.
 */
export async function scheduleSeries(
  seriesId: string,
  data: { startAt: string; everyDays: number },
): Promise<{ episodes: EpisodeProgramme[]; ignores: EpisodeIgnore[] }> {
  const res = await apiClient.post<ApiResponse<{ episodes: EpisodeProgramme[]; ignores: EpisodeIgnore[] }>>(
    `/series/${seriesId}/schedule`,
    data,
  );
  return res.data.data as { episodes: EpisodeProgramme[]; ignores: EpisodeIgnore[] };
}

/**
 * L'historique de la fiche d'une serie.
 *
 * Meme forme que celui d'un livre : ce qui change d'un sujet a l'autre est la
 * liste des champs suivis, pas la facon de les lire.
 */
export async function getSeriesRevisions(
  id: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Revision>> {
  const res = await apiClient.get<ApiPaginatedRaw<Revision>>(`/series/${id}/revisions`, { params });
  return toPaginated(res.data);
}
