import type { ApiResponse, ApiPaginatedRaw, PaginatedResponse } from '@/types/api';
import { toPaginated } from '@/types/api';
import type { Book, Category } from '@/types/models';
import type { Revision } from '@/features/books/historique';
import apiClient from './client';

export async function getMyBooks(params: Record<string, unknown> = {}): Promise<PaginatedResponse<Book>> {
  const res = await apiClient.get<ApiPaginatedRaw<Book>>('/books/me', { params });
  return toPaginated(res.data);
}

/**
 * Toutes les oeuvres de l'auteur, sans plafond.
 *
 * `getMyBooks({ limit: 100 })` etait appele tel quel par le tableau de bord,
 * les statistiques, la liste des livres et l'ecran d'une serie. Cent est un
 * plafond muet : un auteur qui publie davantage voyait ses gains et ses
 * compteurs calcules sur une partie de son catalogue, sans rien qui le dise.
 * Se tromper sur l'argent de quelqu'un est le genre d'erreur qu'on ne repare
 * pas apres coup, parce qu'elle ne se remarque pas.
 *
 * Une seule requete tant que l'auteur reste sous la centaine — le cas de
 * presque tous aujourd'hui — et autant que necessaire au-dela.
 */
export async function getAllMyBooks(params: Record<string, unknown> = {}): Promise<Book[]> {
  const parPage = 100;
  const tout: Book[] = [];

  for (let page = 1; ; page += 1) {
    const res = await getMyBooks({ ...params, limit: parPage, page });
    tout.push(...res.data);
    if (page >= res.totalPages || res.data.length === 0) break;
  }

  return tout;
}

export interface CreateBookData {
  title: string;
  description?: string;
  price: number;
  categoryIds: string[];
  coverUrl?: string;
  fileUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  isbn?: string;
  language?: string;
  pageCount?: number;
}

export interface UpdateBookData {
  title?: string;
  description?: string;
  price?: number;
  categoryIds?: string[];
  coverUrl?: string;
  fileUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  isbn?: string;
  language?: string;
  pageCount?: number;
}

export async function createBook(data: CreateBookData): Promise<Book> {
  const res = await apiClient.post<ApiResponse<Book>>('/books', data);
  return res.data.data;
}

export async function updateBook(id: string, data: UpdateBookData): Promise<Book> {
  const res = await apiClient.put<ApiResponse<Book>>(`/books/${id}`, data);
  return res.data.data;
}

/**
 * Un livre de l'auteur, par son identifiant.
 *
 * Il n'existe pas de route dediee : `GET /books/:id` est publique et ne rend
 * que ce qui est paru, alors que l'auteur ouvre surtout des brouillons et des
 * chapitres en relecture. On passe donc par sa propre liste.
 *
 * Elle etait demandee une fois, cent livres au plus, et filtree ici. Un auteur
 * qui en publie davantage voyait sa fiche cent-unieme repondre « introuvable »
 * — et rien, dans ce message, n'aurait laisse deviner pourquoi. On parcourt
 * maintenant les pages jusqu'a le trouver : une seule requete tant que
 * l'auteur reste sous la centaine, ce qui est le cas de presque tous, et la
 * fiche continue de s'ouvrir pour les autres.
 */
export async function getBookById(id: string): Promise<Book> {
  const parPage = 100;

  for (let page = 1; ; page += 1) {
    const res = await getMyBooks({ limit: parPage, page });
    const book = res.data.find((b) => b.id === id);
    if (book) return book;
    if (page >= res.totalPages || res.data.length === 0) break;
  }

  throw new Error('Book not found');
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

export async function submitBook(id: string): Promise<Book> {
  const res = await apiClient.post<ApiResponse<Book>>(`/books/${id}/submit`);
  return res.data.data;
}

export async function unpublishBook(id: string): Promise<Book> {
  const res = await apiClient.post<ApiResponse<Book>>(`/books/${id}/unpublish`);
  return res.data.data;
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return res.data.data;
}

export async function uploadCover(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiClient.post<ApiResponse<{ url: string }>>('/upload/cover', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}

export async function uploadBookFile(file: File): Promise<{ url: string; size: number; format: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiClient.post<ApiResponse<{ url: string; size: number; format: string }>>('/upload/book', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

/**
 * Ce qui a changé dans un livre, et quand. Réservé à son auteur et à
 * l'administration : l'historique dit ce qu'un prix valait avant.
 */
export async function getBookRevisions(
  id: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Revision>> {
  const res = await apiClient.get<ApiPaginatedRaw<Revision>>(`/books/${id}/revisions`, { params });
  return toPaginated(res.data);
}
