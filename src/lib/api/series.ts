import type { ApiResponse } from '@/types/api';
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
  data: { title?: string; description?: string | null; completed?: boolean },
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
  title: string;
  description: string | null;
  completed: boolean;
  episodes: Array<{
    id: string;
    title: string;
    episodeNumber: number | null;
    paru: boolean;
    publishAt: string | null;
  }>;
}> {
  const res = await apiClient.get<ApiResponse<never>>(`/series/${id}`);
  return res.data.data as never;
}
